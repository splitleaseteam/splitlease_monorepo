/**
 * FavoriteListingsPage Logic Hook
 *
 * Orchestrates all business logic for the FavoriteListingsPage component
 * following the "Hollow Component" pattern. This hook manages React state
 * and effects while the component handles only JSX rendering.
 *
 * @intent Provide pre-calculated data and handlers to FavoriteListingsPage component.
 * @pattern Logic Hook (orchestration layer between Component and Logic Core).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { clearProposalDraft } from '../../shared/CreateProposalFlowV2.jsx';
import { getFavoritedListingIds, removeFromFavorites } from './favoritesApi';

import { checkAuthStatus, validateTokenAndFetchUser, getSessionId } from '../../../lib/auth/tokenValidation.js';
import { logoutUser } from '../../../lib/auth/logout.js';
import { fetchProposalsByGuest, fetchLastProposalDefaults } from '../../../lib/proposalDataFetcher.js';
import { fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { supabase } from '../../../lib/supabase.js';
import { getNeighborhoodName, getBoroughName, getPropertyTypeLabel, initializeLookups, isInitialized } from '../../../lib/dataLookups.js';
import { fetchPhotoUrls, extractPhotos, fetchHostData, parseAmenities } from '../../../lib/supabaseUtils.js';
// NOTE: adaptDaysToBubble removed - database now uses 0-indexed days natively
import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';
import { calculateNextAvailableCheckIn } from '../../../logic/calculators/scheduling/calculateNextAvailableCheckIn.js';
import { shiftMoveInDateIfPast } from '../../../logic/calculators/scheduling/shiftMoveInDateIfPast.js';
import { calculateCheckInOutDays } from '../../../logic/processors/scheduling/calculateCheckInOutDays.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { isHost } from '../../../logic/rules/users/isHost.js';
import { adaptPricingListFromSupabase } from '../../../logic/processors/pricingList/adaptPricingListFromSupabase.ts';

/**
 * Fetch informational texts from Supabase
 */
async function fetchInformationalTexts() {
  try {
    const { data, error } = await supabase
      .from('informationaltexts')
      .select('id, "Information Tag-Title", "Desktop copy", "Mobile copy", "Desktop+ copy", "show more available?"');

    if (error) throw error;

    // Transform data into a map keyed by tag title
    const textsMap = {};
    data.forEach(item => {
      textsMap[item['Information Tag-Title']] = {
        desktop: item['Desktop copy'],
        mobile: item['Mobile copy'],
        desktopPlus: item['Desktop+ copy'],
        showMore: item['show more available?']
      };
    });

    return textsMap;
  } catch (error) {
    console.error('Failed to fetch informational texts:', error);
    return {};
  }
}

export function useFavoriteListingsPageLogic() {
  // GOLD STANDARD AUTH PATTERN - Use consolidated hook
  const { user: authenticatedUser, userId: authUserId, loading: authLoading, isAuthenticated } = useAuthenticatedUser();

  // State management
  const [listings, setListings] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [favoritedListingIds, setFavoritedListingIds] = useState(new Set());

  // Proposals state - Map of listing ID to proposal object
  const [proposalsByListingId, setProposalsByListingId] = useState(new Map());

  // Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [infoModalTriggerRef, setInfoModalTriggerRef] = useState(null);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedListingForProposal, setSelectedListingForProposal] = useState(null);
  const [zatConfig, setZatConfig] = useState(null);
  const [moveInDate, setMoveInDate] = useState(null);
  const [selectedDayObjects, setSelectedDayObjects] = useState([]);
  const [reservationSpan, setReservationSpan] = useState(13);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [pendingProposalData, setPendingProposalData] = useState(null);
  const [loggedInUserData, setLoggedInUserData] = useState(null);
  const [lastProposalDefaults, setLastProposalDefaults] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successProposalId, setSuccessProposalId] = useState(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Photo gallery modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedListingPhotos, setSelectedListingPhotos] = useState([]);
  const [selectedListingName, setSelectedListingName] = useState('');

  // Close photo modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPhotoModal) {
        setShowPhotoModal(false);
      }
    };

    if (showPhotoModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPhotoModal]);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Informational texts
  const [informationalTexts, setInformationalTexts] = useState({});

  // Mobile map visibility
  const [mobileMapVisible, setMobileMapVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Refs
  const mapRef = useRef(null);

  // Scroll to top on page load - prevents browser scroll restoration
  // from causing misalignment between cards and map
  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Scroll to top immediately
    window.scrollTo(0, 0);
  }, []);

  // Transform raw listing data to match SearchPage format
  const transformListing = useCallback((dbListing, images, hostData, pricingList) => {
    const neighborhoodName = getNeighborhoodName(dbListing.primary_neighborhood_reference_id);
    const boroughName = getBoroughName(dbListing.borough);
    const propertyType = getPropertyTypeLabel(dbListing.space_type);

    const locationParts = [];
    if (neighborhoodName) locationParts.push(neighborhoodName);
    if (boroughName) locationParts.push(boroughName);
    const location = locationParts.join(', ') || 'New York, NY';

    // Extract coordinates
    let locationAddress = dbListing.address_with_lat_lng_json;
    let locationSlightlyDifferent = dbListing.map_pin_offset_address_json;

    if (typeof locationSlightlyDifferent === 'string') {
      try {
        locationSlightlyDifferent = JSON.parse(locationSlightlyDifferent);
      } catch { locationSlightlyDifferent = null; }
    }

    if (typeof locationAddress === 'string') {
      try {
        locationAddress = JSON.parse(locationAddress);
      } catch { locationAddress = null; }
    }

    let coordinates = null;
    if (locationSlightlyDifferent?.lat && locationSlightlyDifferent?.lng) {
      coordinates = { lat: locationSlightlyDifferent.lat, lng: locationSlightlyDifferent.lng };
    } else if (locationAddress?.lat && locationAddress?.lng) {
      coordinates = { lat: locationAddress.lat, lng: locationAddress.lng };
    }

    return {
      id: dbListing.id,
      title: dbListing.listing_title || 'Unnamed Listing',
      location: location,
      neighborhood: neighborhoodName || '',
      borough: boroughName || '',
      coordinates,
      price: {
        starting: dbListing.standardized_min_nightly_price_for_search_filter || 0,
        full: dbListing.nightly_rate_for_7_night_stay || 0
      },
      'Starting nightly price': dbListing.standardized_min_nightly_price_for_search_filter || 0,
      'Price 2 nights selected': dbListing.nightly_rate_for_2_night_stay || null,
      'Price 3 nights selected': dbListing.nightly_rate_for_3_night_stay || null,
      'Price 4 nights selected': dbListing.nightly_rate_for_4_night_stay || null,
      'Price 5 nights selected': dbListing.nightly_rate_for_5_night_stay || null,
      'Price 6 nights selected': null,
      'Price 7 nights selected': dbListing.nightly_rate_for_7_night_stay || null,
      type: propertyType,
      squareFeet: dbListing.square_feet || null,
      maxGuests: dbListing.max_guest_count || 1,
      bedrooms: dbListing.bedroom_count || 0,
      bathrooms: dbListing.bathroom_count || 0,
      amenities: parseAmenities(dbListing),
      host: hostData || { name: null, image: null, verified: false },
      images: images || [],
      description: `${(dbListing.bedroom_count || 0) === 0 ? 'Studio' : `${dbListing.bedroom_count} bedroom`} • ${dbListing.bathroom_count || 0} bathroom`,
      weeks_offered: dbListing.weeks_offered_schedule_text || 'Every week',
      isNew: false,

      // Pricing pipeline fields for getListingDisplayPrice fallback chain
      pricingList: pricingList || null,
      lowest_nightly_price_for_map_display: dbListing.lowest_nightly_price_for_map_display,
      standardized_min_nightly_price_for_search_filter: dbListing.standardized_min_nightly_price_for_search_filter,

      // Pricing fields for CreateProposalFlowV2 / DaysSelectionSection
      'nightly_rate_2_nights': dbListing.nightly_rate_for_2_night_stay,
      'nightly_rate_3_nights': dbListing.nightly_rate_for_3_night_stay,
      'nightly_rate_4_nights': dbListing.nightly_rate_for_4_night_stay,
      'nightly_rate_5_nights': dbListing.nightly_rate_for_5_night_stay,
      'nightly_rate_7_nights': dbListing.nightly_rate_for_7_night_stay,
      'weekly_host_rate': dbListing.weekly_rate_paid_to_host,
      'monthly_host_rate': dbListing.monthly_rate_paid_to_host,
      'price_override': dbListing['price_override'],
      'cleaning_fee': dbListing.cleaning_fee_amount,
      'damage_deposit': dbListing.damage_deposit_amount,
      'unit_markup': dbListing.unit_markup_percentage,
      'rental type': dbListing.rental_type,
      'Weeks offered': dbListing.weeks_offered_schedule_text,

      // Availability fields for schedule selector
      ' First Available': dbListing.first_available_date,
      'Last Available': dbListing['Last Available'],
      '# of nights available': dbListing['# of nights available'],
      'Active': dbListing.is_active,
      'Approved': dbListing['Approved'],
      'Dates - Blocked': dbListing.blocked_specific_dates_json,
      'Complete': dbListing.is_listing_profile_complete,
      'confirmedAvailability': dbListing['confirmedAvailability'],
      'NEW Date Check-in Time': dbListing.checkin_time_of_day,
      'NEW Date Check-out Time': dbListing.checkout_time_of_day,
      'Nights Available (numbers)': dbListing['Nights Available (numbers)'],
      'Minimum Nights': dbListing.minimum_nights_per_stay,
      'Maximum Nights': dbListing.maximum_nights_per_stay,
      'Days Available (List of Days)': dbListing.available_days_as_day_numbers_json
    };
  }, []);

  // Initialize data lookups on mount
  useEffect(() => {
    const init = async () => {
      if (!isInitialized()) {
        await initializeLookups();
      }
    };
    init();
  }, []);

  // Fetch informational texts on mount
  useEffect(() => {
    const loadInformationalTexts = async () => {
      const texts = await fetchInformationalTexts();
      setInformationalTexts(texts);
    };
    loadInformationalTexts();
  }, []);

  // Fetch ZAT price configuration on mount
  useEffect(() => {
    const loadZatConfig = async () => {
      try {
        const config = await fetchZatPriceConfiguration();
        setZatConfig(config);
      } catch (error) {
        console.warn('Failed to load ZAT config:', error);
      }
    };
    loadZatConfig();
  }, []);

  // Check auth and fetch favorites
  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for auth hook to complete
        if (authLoading) return;

        // GOLD STANDARD AUTH PATTERN - Use hook result
        if (!isAuthenticated || !authUserId) {
          setError('Please log in to view your favorite listings.');
          setIsLoading(false);
          return;
        }

        // Set auth state from hook
        setIsLoggedIn(true);
        setUserId(authUserId);
        setCurrentUser(authenticatedUser);

        // Ensure lookups are ready before transforming listings.
        // Prevents raw UUIDs from showing for neighborhood/borough names.
        if (!isInitialized()) {
          await initializeLookups();
        }

        // Fetch user profile + counts from junction tables (Phase 5b migration)
        try {
          const [profileResult, countsResult] = await Promise.all([
            supabase
              .from('user')
              .select('bio_text, stated_need_for_space_text, stated_special_needs_text')
              .eq('id', authUserId)
              .single(),
            supabase.rpc('get_user_junction_counts', { p_user_id: authUserId })
          ]);

          if (!profileResult.error && profileResult.data) {
            const junctionCounts = countsResult.data?.[0] || {};
            const proposalCount = Number(junctionCounts.proposals_count) || 0;
            setLoggedInUserData({
              aboutMe: profileResult.data.bio_text || '',
              needForSpace: profileResult.data.stated_need_for_space_text || '',
              specialNeeds: profileResult.data.stated_special_needs_text || '',
              proposalCount: proposalCount
            });

            // Fetch last proposal defaults for pre-population
            const proposalDefaults = await fetchLastProposalDefaults(authUserId);
            if (proposalDefaults) {
              setLastProposalDefaults(proposalDefaults);
              console.log('[FavoriteListingsPage] Loaded last proposal defaults:', proposalDefaults);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch user proposal data:', e);
        }

        // Fetch user's favorited listing IDs (queries listing table for user_ids_who_favorited_json)
        let favoritedIds = [];
        try {
          favoritedIds = await getFavoritedListingIds(authUserId);
        } catch (favError) {
          console.error('Error fetching favorites:', favError);
          setError('Failed to load your favorites. Please try again.');
          setIsLoading(false);
          return;
        }

        // Ensure we have an array
        favoritedIds = Array.isArray(favoritedIds) ? favoritedIds : [];

        // Filter to valid listing IDs (non-empty strings)
        favoritedIds = favoritedIds.filter(id => typeof id === 'string' && id.length > 0);
        setFavoritedListingIds(new Set(favoritedIds));

        if (favoritedIds.length === 0) {
          setListings([]);
          setIsLoading(false);
          return;
        }

        // Fetch listings data from Supabase (all favorited listings, regardless of Active status, but exclude soft-deleted)
        const { data: listingsData, error: listingsError } = await supabase
          .from('listing')
          .select('*')
          .in('id', favoritedIds)
          .eq('is_deleted', false);

        if (listingsError) {
          console.error('Error fetching listings:', listingsError);
          setError('Failed to load listings. Please try again.');
          setIsLoading(false);
          return;
        }

        // Collect legacy photo IDs (strings) for batch fetch
        // New format has embedded objects with URLs, no fetch needed
        const legacyPhotoIds = new Set();
        listingsData.forEach(listing => {
          const photosField = listing.photos_with_urls_captions_and_sort_order_json;
          let photos = [];

          if (Array.isArray(photosField)) {
            photos = photosField;
          } else if (typeof photosField === 'string') {
            try {
              photos = JSON.parse(photosField);
            } catch {
              void 0; // Intentional: malformed JSON falls back to empty array
            }
          }

          // Only collect string IDs (legacy format), not objects (new format)
          if (Array.isArray(photos)) {
            photos.forEach(photo => {
              if (typeof photo === 'string') {
                legacyPhotoIds.add(photo);
              }
            });
          }
        });

        // Only fetch from listing_photo table if there are legacy photo IDs
        const photoMap = legacyPhotoIds.size > 0
          ? await fetchPhotoUrls(Array.from(legacyPhotoIds))
          : {};

        // Extract photos per listing (handles both embedded objects and legacy IDs)
        const resolvedPhotos = {};
        listingsData.forEach(listing => {
          resolvedPhotos[listing.id] = extractPhotos(
            listing.photos_with_urls_captions_and_sort_order_json,
            photoMap,
            listing.id
          );
        });

        // Batch fetch host data
        const hostIds = new Set();
        listingsData.forEach(listing => {
          if (listing.host_user_id) {
            hostIds.add(listing.host_user_id);
          }
        });

        const hostMap = await fetchHostData(Array.from(hostIds));

        // Batch fetch pricing lists
        const pricingConfigIds = new Set();
        listingsData.forEach(listing => {
          if (listing.pricing_configuration_id) {
            pricingConfigIds.add(listing.pricing_configuration_id);
          }
        });

        let pricingMap = {};
        if (pricingConfigIds.size > 0) {
          const { data: pricingData } = await supabase
            .from('pricing_list')
            .select('*')
            .in('id', Array.from(pricingConfigIds));

          if (pricingData) {
            pricingData.forEach(pl => {
              pricingMap[pl.id] = adaptPricingListFromSupabase(pl);
            });
          }
        }

        // Transform listings
        const transformedListings = listingsData
          .map(listing => {
            const hostId = listing.host_user_id;
            const pricingList = pricingMap[listing.pricing_configuration_id] || null;
            return transformListing(listing, resolvedPhotos[listing.id], hostMap[hostId] || null, pricingList);
          })
          .filter(listing => listing.coordinates && listing.coordinates.lat && listing.coordinates.lng)
          .filter(listing => listing.images && listing.images.length > 0);

        setListings(transformedListings);
        console.log(`Loaded ${transformedListings.length} favorite listings`);

        // Fetch user's proposals to check if any exist for these listings
        try {
          const proposals = await fetchProposalsByGuest(authUserId);
          console.log(`📋 Loaded ${proposals.length} proposals for user`);

          // Create a map of listing ID to proposal (only include non-terminal proposals)
          const proposalsMap = new Map();
          proposals.forEach(proposal => {
            const listingId = proposal.listing_id;
            if (listingId) {
              // If multiple proposals exist for same listing, keep the most recent one
              // (proposals are already sorted by Created Date descending)
              if (!proposalsMap.has(listingId)) {
                proposalsMap.set(listingId, proposal);
              }
            }
          });

          setProposalsByListingId(proposalsMap);
          console.log(`📋 Mapped ${proposalsMap.size} listings with proposals`);
        } catch (proposalErr) {
          console.warn('Failed to fetch proposals (non-critical):', proposalErr);
          // Don't fail the page if proposals can't be loaded - just show Create Proposal for all
        }
      } catch (err) {
        console.error('❌ Error initializing page:', err);
        setError(`Failed to load your favorite listings: ${err?.message || 'Unknown error'}. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [authLoading, isAuthenticated, authUserId, authenticatedUser, transformListing]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Toggle favorite for this page (supports optimistic unfavorite with rollback on API failure)
  const handleToggleFavorite = async (listingId, listingTitle, newState) => {
    const displayName = listingTitle || 'Listing';

    // If unfavorited (newState = false), remove from listings display
    if (!newState) {
      if (!userId) {
        showToast('Please log in to manage favorites.', 'error');
        return;
      }

      const removedIndex = listings.findIndex(l => l.id === listingId);
      const removedListing = removedIndex >= 0 ? listings[removedIndex] : null;

      // Optimistic UI update
      setListings(prev => prev.filter(l => l.id !== listingId));
      setFavoritedListingIds(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });

      try {
        await removeFromFavorites(userId, listingId);
        showToast(`${displayName} removed from favorites`, 'info');
      } catch (removeError) {
        console.error('[FavoriteListingsPage] Failed to remove favorite:', removeError);

        // Roll back optimistic update if persistence fails
        if (removedListing) {
          setListings(prev => {
            if (prev.some(l => l.id === removedListing.id)) {
              return prev;
            }
            const next = [...prev];
            const insertIndex = removedIndex >= 0 && removedIndex <= next.length ? removedIndex : 0;
            next.splice(insertIndex, 0, removedListing);
            return next;
          });
        }
        setFavoritedListingIds(prev => {
          const next = new Set(prev);
          next.add(listingId);
          return next;
        });

        showToast('Could not remove from favorites. Please try again.', 'error');
      }
    } else {
      showToast(`${displayName} added to favorites`, 'success');
    }
  };

  // Modal handlers
  const handleOpenContactModal = (listing) => {
    setSelectedListing(listing);
    setIsContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedListing(null);
  };

  const handleOpenInfoModal = (listing, triggerRef) => {
    setSelectedListing(listing);
    setInfoModalTriggerRef(triggerRef);
    setIsInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
    setSelectedListing(null);
    setInfoModalTriggerRef(null);
  };

  // Handler to open proposal creation modal for a specific listing
  const handleOpenProposalModal = async (listing) => {
    // Get default schedule from URL params or use default weekdays
    const urlParams = new URLSearchParams(window.location.search);
    const daysParam = urlParams.get('days-selected');

    let initialDays = [];
    if (daysParam) {
      try {
        const oneBased = daysParam.split(',').map(d => parseInt(d.trim(), 10));
        initialDays = oneBased
          .filter(d => d >= 1 && d <= 7)
          .map(d => d - 1)
          .map(dayIndex => createDay(dayIndex, true));
      } catch (e) {
        console.warn('Failed to parse days from URL:', e);
      }
    }

    // Default to weekdays (Mon-Fri) if no URL selection
    if (initialDays.length === 0) {
      initialDays = [1, 2, 3, 4, 5].map(dayIndex => createDay(dayIndex, true));
    }

    // Calculate minimum move-in date (2 weeks from today)
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    const minMoveInDate = twoWeeksFromNow.toISOString().split('T')[0];

    // Determine move-in date: prefer last proposal's date (shifted if needed), fallback to smart calculation
    let smartMoveInDate = minMoveInDate;

    if (lastProposalDefaults?.moveInDate) {
      // Use previous proposal's move-in date, shifted forward if necessary
      smartMoveInDate = shiftMoveInDateIfPast({
        previousMoveInDate: lastProposalDefaults.moveInDate,
        minDate: minMoveInDate
      }) || minMoveInDate;
      console.log('[FavoriteListingsPage] Pre-filling move-in from last proposal:', lastProposalDefaults.moveInDate, '->', smartMoveInDate);
    } else if (initialDays.length > 0) {
      // Fallback: calculate based on selected days
      try {
        const selectedDayIndices = initialDays.map(d => d.dayOfWeek);
        smartMoveInDate = calculateNextAvailableCheckIn({
          selectedDayIndices,
          minDate: minMoveInDate
        });
      } catch (err) {
        console.error('Error calculating smart move-in date:', err);
        smartMoveInDate = minMoveInDate;
      }
    }

    // Determine reservation span: prefer last proposal's span, fallback to default
    const prefillReservationSpan = lastProposalDefaults?.reservationSpanWeeks || 13;

    setSelectedListingForProposal(listing);
    setSelectedDayObjects(initialDays);
    setMoveInDate(smartMoveInDate);
    setReservationSpan(prefillReservationSpan);
    setPriceBreakdown(null); // Will be calculated by ListingScheduleSelector
    setIsProposalModalOpen(true);
  };

  // Handler to open fullscreen photo gallery
  const handlePhotoGalleryOpen = (listing, photoIndex = 0) => {
    if (!listing.images || listing.images.length === 0) return;
    setSelectedListingPhotos(listing.images);
    setSelectedListingName(listing.title || 'Listing');
    setCurrentPhotoIndex(photoIndex);
    setShowPhotoModal(true);
  };

  // Submit proposal to backend
  const submitProposal = async (proposalData) => {
    setIsSubmittingProposal(true);

    try {
      const guestId = getSessionId();
      if (!guestId) {
        throw new Error('User session not found');
      }

      // Days are already in JS format (0-6) - database now uses 0-indexed natively
      const daysInJsFormat = proposalData.daysSelectedObjects?.map(d => d.dayOfWeek) || [];

      const { checkInDay, checkOutDay, nightsSelected } = calculateCheckInOutDays(daysInJsFormat);

      // Format reservation span text
      const reservationSpanWeeks = proposalData.reservationSpan || 13;
      const reservationSpanText = reservationSpanWeeks === 13
        ? '13 weeks (3 months)'
        : reservationSpanWeeks === 20
          ? '20 weeks (approx. 5 months)'
          : `${reservationSpanWeeks} weeks`;

      // Build payload (using 0-indexed days)
      const payload = {
        guestId: guestId,
        listingId: selectedListingForProposal.id,
        moveInStartRange: proposalData.moveInDate,
        moveInEndRange: proposalData.moveInDate, // Same as start if no flexibility
        daysSelected: daysInJsFormat,
        nightsSelected: nightsSelected,
        reservationSpan: reservationSpanText,
        reservationSpanWeeks: reservationSpanWeeks,
        checkIn: checkInDay,
        checkOut: checkOutDay,
        proposalPrice: proposalData.pricePerNight,
        fourWeekRent: proposalData.pricePerFourWeeks,
        hostCompensation: proposalData.pricePerFourWeeks, // Same as 4-week rent for now
        needForSpace: proposalData.needForSpace || '',
        aboutMe: proposalData.aboutYourself || '',
        estimatedBookingTotal: proposalData.totalPrice,
        // Optional fields
        specialNeeds: proposalData.hasUniqueRequirements ? proposalData.uniqueRequirements : '',
        moveInRangeText: proposalData.moveInRange || '',
        flexibleMoveIn: !!proposalData.moveInRange,
        fourWeekCompensation: proposalData.pricePerFourWeeks
      };

      console.log('📋 Submitting proposal:', payload);

      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload
        }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to submit proposal');
      }

      if (!data?.success) {
        console.error('❌ Proposal submission failed:', data?.error);
        throw new Error(data?.error || 'Failed to submit proposal');
      }

      console.log('✅ Proposal submitted successfully:', data);
      console.log('   Proposal ID:', data.data?.proposalId);

      // Clear the localStorage draft on successful submission
      clearProposalDraft(proposalData.listingId);

      setIsProposalModalOpen(false);
      setPendingProposalData(null);
      setSuccessProposalId(data.data?.proposalId);
      setShowSuccessModal(true);

      // Update proposals map to show "View Proposal" instead of "Create Proposal"
      if (data.data?.proposalId && selectedListingForProposal) {
        setProposalsByListingId(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedListingForProposal.id, { id: data.data.proposalId });
          return newMap;
        });
      }

      showToast('Proposal submitted successfully!', 'success');

    } catch (error) {
      console.error('❌ Error submitting proposal:', error);
      showToast(error.message || 'Failed to submit proposal. Please try again.', 'error');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle proposal submission - checks auth first
  const handleProposalSubmit = async (proposalData) => {
    console.log('Proposal submission initiated:', proposalData);

    const isAuthenticated = await checkAuthStatus();

    if (!isAuthenticated) {
      console.log('User not logged in, showing auth modal');
      setPendingProposalData(proposalData);
      setIsProposalModalOpen(false);
      setShowAuthModal(true);
      return;
    }

    await submitProposal(proposalData);
  };

  // Auth handlers
  const handleNavigate = (path) => {
    window.location.href = path;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      window.location.href = '/search';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle auth completion - submit pending proposal if exists
  const handleAuthSuccess = async (authResult) => {
    console.log('Auth completed:', authResult);
    setShowAuthModal(false);
    setIsLoggedIn(true);

    // Update user data after successful auth
    // CRITICAL: Use clearOnFailure: false to preserve session if Edge Function fails
    try {
      const userData = await validateTokenAndFetchUser({ clearOnFailure: false });
      const sessionId = getSessionId();

      if (userData) {
        setCurrentUser({
          id: sessionId,
          name: userData.fullName || userData.firstName || '',
          email: userData.email || '',
          userType: userData.userType || 'GUEST',
          avatarUrl: userData.profilePhoto || null
        });

        // Fetch user profile + proposal count from junction tables (Phase 5b migration)
        const [profileResult, countsResult] = await Promise.all([
          supabase
            .from('user')
            .select('bio_text, stated_need_for_space_text, stated_special_needs_text')
            .eq('id', sessionId)
            .single(),
          supabase.rpc('get_user_junction_counts', { p_user_id: sessionId })
        ]);

        if (profileResult.data) {
          const junctionCounts = countsResult.data?.[0] || {};
          const proposalCount = Number(junctionCounts.proposals_count) || 0;
          setLoggedInUserData({
            aboutMe: profileResult.data.bio_text || '',
            needForSpace: profileResult.data.stated_need_for_space_text || '',
            specialNeeds: profileResult.data.stated_special_needs_text || '',
            proposalCount: proposalCount
          });
        }
      }
    } catch (e) {
      console.warn('Failed to update user data after auth:', e);
    }

    // If there's a pending proposal, submit it now
    if (pendingProposalData) {
      console.log('Submitting pending proposal after auth...');
      await submitProposal(pendingProposalData);
    }
  };

  // Determine if "Message" button should be visible on listing cards
  // Hidden for logged-in host users (hosts shouldn't message other hosts)
  const showMessageButton = useMemo(() => {
    if (!authenticatedUser) return true; // Show for guests (not logged in)
    const userIsHost = isHost({ userType: authenticatedUser.userType });
    return !userIsHost;
  }, [authenticatedUser]);

  return {
    // State
    listings,
    viewMode,
    setViewMode,
    isLoading,
    error,
    userId,
    isLoggedIn,
    currentUser,
    favoritedListingIds,
    proposalsByListingId,
    isContactModalOpen,
    isInfoModalOpen,
    selectedListing,
    infoModalTriggerRef,
    isProposalModalOpen,
    selectedListingForProposal,
    zatConfig,
    moveInDate,
    selectedDayObjects,
    reservationSpan,
    priceBreakdown,
    loggedInUserData,
    showSuccessModal,
    successProposalId,
    isSubmittingProposal,
    showAuthModal,
    showPhotoModal,
    currentPhotoIndex,
    selectedListingPhotos,
    selectedListingName,
    toast,
    informationalTexts,
    mobileMapVisible,
    menuOpen,
    setMenuOpen,
    showMessageButton,

    // Refs
    mapRef,

    // Setters needed by JSX
    setMobileMapVisible,
    setShowPhotoModal,
    setCurrentPhotoIndex,
    setIsProposalModalOpen,
    setSelectedListingForProposal,
    setShowAuthModal,
    setPendingProposalData,
    setShowSuccessModal,
    setSuccessProposalId,

    // Handlers
    handleToggleFavorite,
    handleOpenContactModal,
    handleCloseContactModal,
    handleOpenInfoModal,
    handleCloseInfoModal,
    handleOpenProposalModal,
    handlePhotoGalleryOpen,
    handleProposalSubmit,
    handleNavigate,
    handleLogout,
    handleAuthSuccess,
  };
}
