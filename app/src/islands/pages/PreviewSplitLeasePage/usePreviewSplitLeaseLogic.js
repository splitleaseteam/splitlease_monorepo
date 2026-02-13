/**
 * usePreviewSplitLeaseLogic - All state, effects, computed values, and event handlers
 * for PreviewSplitLeasePage (Hollow Component Pattern)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeLookups } from '../../../lib/dataLookups.js';
import { useAuthenticatedUser } from '../../../hooks/useAuthenticatedUser.js';
import { supabase } from '../../../lib/supabase.js';
import { fetchListingComplete, getListingIdFromUrl, fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import {
  calculatePricingBreakdown,
  formatPrice,
  getPriceDisplayMessage
} from '../../../lib/priceCalculations.js';
import {
  isContiguousSelection,
  validateScheduleSelection,
  calculateCheckInOutDays,
  getBlockedDatesList,
  calculateNightsFromDays
} from '../../../lib/availabilityValidation.js';
import { DAY_ABBREVIATIONS, DEFAULTS, COLORS } from '../../../lib/constants.js';
import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';

export function usePreviewSplitLeaseLogic() {
  // Auth hook - host role required for preview page
  const { user: authUser, loading: authLoading } = useAuthenticatedUser({ requiredRole: 'host' });

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listing, setListing] = useState(null);
  const [zatConfig, setZatConfig] = useState(null);
  const [loggedInUserData, setLoggedInUserData] = useState(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [editFocusField, setEditFocusField] = useState(null);

  // Booking widget state (display only - no proposal creation)
  const [moveInDate, setMoveInDate] = useState(null);
  const [selectedDayObjects, setSelectedDayObjects] = useState([]);
  const [reservationSpan, setReservationSpan] = useState(13);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

  // Calculate minimum move-in date (2 weeks from today)
  const minMoveInDate = useMemo(() => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  }, []);

  // Convert Day objects to array of numbers
  const selectedDays = selectedDayObjects.map(day => day.dayOfWeek);

  // UI state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    neighborhood: false,
    blockedDates: false
  });

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  // Section references
  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);
  const commuteSectionRef = useRef(null);
  const amenitiesSectionRef = useRef(null);
  const houseRulesSectionRef = useRef(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Sync auth hook user data to loggedInUserData when auth resolves
  useEffect(() => {
    if (authLoading) return;
    if (authUser) {
      setLoggedInUserData({
        id: authUser.id,
        first_name: authUser.firstName,
        last_name: '',
        email: authUser.email,
        firstName: authUser.firstName,
        lastName: '',
      });
      console.log('[PreviewSplitLeasePage] User data loaded from hook:', authUser.firstName);
    } else {
      console.log('[PreviewSplitLeasePage] No authenticated user, continuing in read-only mode');
    }
  }, [authUser, authLoading]);

  useEffect(() => {
    async function initialize() {
      try {
        await initializeLookups();

        // Fetch ZAT price configuration
        const zatConfigData = await fetchZatPriceConfiguration();
        setZatConfig(zatConfigData);

        // Get listing ID from URL
        const listingId = getListingIdFromUrl();
        if (!listingId) {
          throw new Error('No listing ID provided in URL');
        }

        // Fetch complete listing data
        const listingData = await fetchListingComplete(listingId);
        setListing(listingData);
        setLoading(false);

      } catch (err) {
        console.error('Error initializing preview page:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    initialize();

    // Set up responsive listener
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    setIsMobile(mediaQuery.matches);

    const handleResize = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  // Lazy loading for map
  useEffect(() => {
    if (!mapSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setShouldLoadMap(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(mapSectionRef.current);
    return () => observer.disconnect();
  }, [listing]);

  // Update document title
  useEffect(() => {
    if (listing?.listing_title) {
      document.title = `Preview: ${listing.listing_title} | Split Lease`;
    }
  }, [listing]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const convertDayNamesToNumbers = (dayNames) => {
    if (!dayNames || !Array.isArray(dayNames)) return [0, 1, 2, 3, 4, 5, 6];

    const dayNameMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const numbers = dayNames.map(name => dayNameMap[name]).filter(num => num !== undefined);
    return numbers.length > 0 ? numbers : [0, 1, 2, 3, 4, 5, 6];
  };

  const scheduleSelectorListing = useMemo(() => listing ? {
    id: listing.id,
    firstAvailable: new Date(listing.first_available_date),
    lastAvailable: new Date(listing['Last Available']),
    numberOfNightsAvailable: listing['# of nights available'] || 7,
    active: listing.is_active,
    approved: listing.Approved,
    datesBlocked: listing.blocked_specific_dates_json || [],
    complete: listing.is_listing_profile_complete,
    confirmedAvailability: listing.confirmedAvailability,
    checkInTime: listing.checkin_time_of_day || '3:00 pm',
    checkOutTime: listing.checkout_time_of_day || '11:00 am',
    nightsAvailableList: [],
    nightsAvailableNumbers: listing['Nights Available (numbers)'] || [0, 1, 2, 3, 4, 5, 6],
    nightsNotAvailable: [],
    minimumNights: listing.minimum_nights_per_stay || 2,
    maximumNights: listing.maximum_nights_per_stay || 7,
    daysAvailable: convertDayNamesToNumbers(listing.available_days_as_day_numbers_json),
    daysNotAvailable: [],
    // Pricing fields for calculation - MUST MATCH SNAKE_CASE for calculatePrice
    'rental_type': listing.rental_type || 'Nightly',
    'weeks_offered_schedule_text': listing.weeks_offered_schedule_text || 'Every week',
    'unit_markup_percentage': listing.unit_markup_percentage || 0,
    'nightly_rate_for_2_night_stay': listing.nightly_rate_for_2_night_stay,
    'nightly_rate_for_3_night_stay': listing.nightly_rate_for_3_night_stay,
    'nightly_rate_for_4_night_stay': listing.nightly_rate_for_4_night_stay,
    'nightly_rate_for_5_night_stay': listing.nightly_rate_for_5_night_stay,
    'nightly_rate_for_7_night_stay': listing.nightly_rate_for_7_night_stay,
    'weekly_rate_paid_to_host': listing.weekly_rate_paid_to_host,
    'monthly_rate_paid_to_host': listing.monthly_rate_paid_to_host,
    'price_override': listing['price_override'],
    'cleaning_fee_amount': listing.cleaning_fee_amount,
    'damage_deposit_amount': listing.damage_deposit_amount
  } : null, [listing]);

  // Initialize default days
  useEffect(() => {
    if (selectedDayObjects.length === 0) {
      const defaultDays = DEFAULTS.DEFAULT_SELECTED_DAYS.map(dayNum => createDay(dayNum, true));
      setSelectedDayObjects(defaultDays);
    }
  }, []);

  const scheduleValidation = listing ? validateScheduleSelection(selectedDays, listing) : null;
  const nightsSelected = calculateNightsFromDays(selectedDays);
  const pricingBreakdown = priceBreakdown;

  const priceMessage = !scheduleValidation?.valid || !pricingBreakdown?.valid
    ? getPriceDisplayMessage(selectedDays.length)
    : null;

  const mapListings = useMemo(() => {
    if (!listing || !listing.coordinates) return [];
    return [{
      id: listing.id,
      title: listing.listing_title,
      coordinates: listing.coordinates,
      price: {
        starting: listing['Standarized Minimum Nightly Price (Filter)'] || 0
      },
      location: listing.resolvedBorough,
      type: listing.resolvedTypeOfSpace,
      bedrooms: listing.bedroom_count || 0,
      bathrooms: listing.bathroom_count || 0,
      images: listing.photos?.map(p => p.Photo) || [],
      borough: listing.resolvedBorough
    }];
  }, [listing]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleScheduleChange = (newSelectedDays) => {
    setSelectedDayObjects(newSelectedDays);
  };

  const handlePriceChange = useCallback((newPriceBreakdown) => {
    setPriceBreakdown((prev) => {
      if (!prev ||
          prev.fourWeekRent !== newPriceBreakdown.fourWeekRent ||
          prev.reservationTotal !== newPriceBreakdown.reservationTotal ||
          prev.nightlyRate !== newPriceBreakdown.nightlyRate) {
        return newPriceBreakdown;
      }
      return prev;
    });
  }, []);

  const handlePhotoClick = (index) => {
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleOpenEditModal = (section, focusField = null) => {
    setEditSection(section);
    setEditFocusField(focusField);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditSection(null);
    setEditFocusField(null);
  };

  const handleSaveEdit = async (updatedListing) => {
    // Update the local listing state with the new data
    // Note: Don't close the modal here - let EditListingDetails handle closing
    // after showing the success toast

    // Transform Features - Photos back to the photos format used by the UI
    // The DB returns raw JSON array but the page expects {Photo, ...} objects
    let transformedPhotos = null;
    if (updatedListing.photos_with_urls_captions_and_sort_order_json) {
      const rawPhotos = typeof updatedListing.photos_with_urls_captions_and_sort_order_json === 'string'
        ? JSON.parse(updatedListing.photos_with_urls_captions_and_sort_order_json)
        : updatedListing.photos_with_urls_captions_and_sort_order_json;

      if (Array.isArray(rawPhotos)) {
        transformedPhotos = rawPhotos.map((photo, index) => {
          // Handle both object format {Photo: url} and string URLs
          if (typeof photo === 'object' && photo !== null) {
            return {
              id: photo.id || `photo_${index}`,
              Photo: photo.Photo || photo.url || '',
              'Photo (thumbnail)': photo['Photo (thumbnail)'] || photo.Photo || photo.url || '',
              toggleMainPhoto: photo.toggleMainPhoto ?? (index === 0),
              SortOrder: photo.SortOrder ?? index,
              Caption: photo.caption || photo.Caption || ''
            };
          } else {
            // String URL format
            return {
              id: `photo_${index}`,
              Photo: photo,
              'Photo (thumbnail)': photo,
              toggleMainPhoto: index === 0,
              SortOrder: index,
              Caption: ''
            };
          }
        });
      }
    }

    setListing(prev => ({
      ...prev,
      ...updatedListing,
      // Use transformed photos if available, otherwise keep previous
      ...(transformedPhotos && { photos: transformedPhotos })
    }));
  };

  const handleUpdateListing = async (id, updates) => {
    console.log('\uD83D\uDD0D Updating listing:', id, updates);

    // Map UI field names to database column names (handles quirky column names with leading spaces)
    const fieldMapping = {
      'First Available': ' First Available', // DB column has leading space
    };

    // Transform updates to use correct database column names
    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const dbColumnName = fieldMapping[key] || key;
      dbUpdates[dbColumnName] = value;
    }

    console.log('\uD83D\uDCCB DB updates:', dbUpdates);

    // Perform the update
    const { error: updateError } = await supabase
      .from('listing')
      .update(dbUpdates)
      .eq('id', id);

    if (updateError) {
      console.error('\u274C Error updating listing:', updateError);
      console.error('\u274C Error details:', updateError.code, updateError.message, updateError.details, updateError.hint);
      throw updateError;
    }

    // Fetch the updated row separately for reliable data retrieval
    const { data, error: fetchError } = await supabase
      .from('listing')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.warn('\u26A0\uFE0F Update succeeded but failed to fetch updated data:', fetchError);
      return { id, ...dbUpdates };
    }

    console.log('\u2705 Listing updated:', data);
    return data;
  };

  const scrollToSection = (sectionRef, shouldZoomMap = false) => {
    if (sectionRef.current) {
      if (shouldZoomMap && !shouldLoadMap) {
        setShouldLoadMap(true);
      }

      const yOffset = -100;
      const element = sectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });

      if (shouldZoomMap) {
        setTimeout(() => {
          if (mapRef.current && listing) {
            mapRef.current.zoomToListing(listing.id);
          }
        }, 600);
      }
    }
  };

  const handleLocationClick = () => scrollToSection(mapSectionRef, true);

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // Core state
    loading,
    error,
    listing,
    zatConfig,
    isMobile,

    // Edit modal
    editModalOpen,
    editSection,
    editFocusField,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSaveEdit,
    handleUpdateListing,

    // Booking widget
    moveInDate,
    setMoveInDate,
    minMoveInDate,
    selectedDayObjects,
    selectedDays,
    reservationSpan,
    setReservationSpan,
    nightsSelected,
    scheduleSelectorListing,
    handleScheduleChange,
    handlePriceChange,

    // Photos
    showPhotoModal,
    setShowPhotoModal,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    handlePhotoClick,

    // Sections
    expandedSections,
    toggleSection,
    handleLocationClick,

    // Map
    shouldLoadMap,
    mapListings,
    mapRef,
    mapSectionRef,

    // Section refs
    commuteSectionRef,
    amenitiesSectionRef,
    houseRulesSectionRef,
  };
}
