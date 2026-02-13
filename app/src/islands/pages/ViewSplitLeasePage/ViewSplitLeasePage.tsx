/**
 * View Split Lease Page - Complete Rebuild
 * Matches original Bubble.io design with 100% fidelity
 * Architecture: ESM + React Islands pattern
 *
 * IMPORTANT: This is a comprehensive rebuild based on documentation and original page inspection
 *
 * UPDATE 2026-01-17: Added FavoriteButton to price display section
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import Header from '../../shared/Header.jsx';
import Footer from '../../shared/Footer.jsx';
import CreateProposalFlowV2, { clearProposalDraft } from '../../shared/CreateProposalFlowV2.jsx';
import ContactHostMessaging from '../../shared/ContactHostMessaging.jsx';
import InformationalText from '../../shared/InformationalText.jsx';
import SignUpLoginModal from '../../shared/AuthSignupLoginOAuthResetFlowModal';
import ProposalSuccessModal from '../../modals/ProposalSuccessModal.jsx';
import { initializeLookups } from '../../../lib/dataLookups.js';
import { checkAuthStatus, validateTokenAndFetchUser, getSessionId } from '../../../lib/auth/index.js';
import { fetchListingComplete, getListingIdFromUrl, fetchZatPriceConfiguration } from '../../../lib/listingDataFetcher.js';
import { getPriceDisplayMessage } from '../../../lib/priceCalculations.js';
import {
  isContiguousSelection,
  validateScheduleSelection,
  calculateCheckInOutDays,
  calculateNightsFromDays
} from '../../../lib/availabilityValidation.js';
import { DEFAULTS, COLORS } from '../../../lib/constants.js';
import { createDay } from '../../../lib/scheduleSelector/dayHelpers.js';
import { supabase } from '../../../lib/supabase.js';
import { fetchInformationalTexts } from '../../../lib/informationalTextsFetcher.js';
import { logger } from '../../../lib/logger.js';
import '../../../styles/listing-schedule-selector.css';
import '../../../styles/components/toast.css';
import './ViewSplitLeasePage.css';

import { LoadingState } from './components/LoadingState.jsx';
import { ErrorState } from './components/ErrorState.jsx';
import { PhotoGallery } from './components/PhotoGallery.jsx';

// Extracted sub-components
import { ListingDetailsSection } from './components/ListingDetailsSection';
import { HostInfoSection } from './components/HostInfoSection';
import { PricingSection } from './components/PricingSection';
import { MobileBookingBar } from './components/MobileBookingBar';

// Extracted helpers
import {
  getInitialScheduleFromUrl,
  getInitialReservationSpanFromUrl,
  getInitialMoveInFromUrl
} from './helpers';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ViewSplitLeasePage() {
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listing, setListing] = useState(null);
  const [zatConfig, setZatConfig] = useState(null);
  const [informationalTexts, setInformationalTexts] = useState({});

  // Booking widget state - initialize from URL parameters if available
  const [moveInDate, setMoveInDate] = useState(() => getInitialMoveInFromUrl());
  const [strictMode, setStrictMode] = useState(false);
  const [selectedDayObjects, setSelectedDayObjects] = useState(() => getInitialScheduleFromUrl()); // Day objects from URL param or empty
  const [reservationSpan, setReservationSpan] = useState(() => getInitialReservationSpanFromUrl() || 13); // URL value or 13 weeks default
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingProposalData, setPendingProposalData] = useState(null);
  const [loggedInUserData, setLoggedInUserData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successProposalId, setSuccessProposalId] = useState(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [existingProposalForListing, setExistingProposalForListing] = useState(null);

  // Custom schedule state - for users who want to specify a different recurrent pattern
  const [customScheduleDescription, setCustomScheduleDescription] = useState('');
  const [showCustomScheduleInput, setShowCustomScheduleInput] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Favorite state - tracks if the current listing is favorited by the user
  const [isFavorited, setIsFavorited] = useState(false);

  // Show toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Calculate minimum move-in date (2 weeks from today)
  const minMoveInDate = useMemo(() => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  }, []);

  // Convert Day objects to array of numbers for compatibility with existing code
  const selectedDays = selectedDayObjects.map(day => day.dayOfWeek);

  // Calculate smart default move-in date based on selected days
  // If user selects Wed-Sat, default to next Wednesday after 2 weeks
  const calculateSmartMoveInDate = useCallback((selectedDayNumbers) => {
    if (!selectedDayNumbers || selectedDayNumbers.length === 0) {
      return minMoveInDate;
    }

    // Get the first selected day (check-in day)
    const sortedDays = [...selectedDayNumbers].sort((a, b) => a - b);
    const firstDayOfWeek = sortedDays[0];

    // Start from the minimum date (2 weeks from today)
    const minDate = new Date(minMoveInDate);
    const minDayOfWeek = minDate.getDay();

    // Calculate days to add to get to the next occurrence of the first selected day
    const daysToAdd = (firstDayOfWeek - minDayOfWeek + 7) % 7;

    // If it's the same day, we're already on the right day
    if (daysToAdd === 0) {
      return minMoveInDate;
    }

    // Add the days to get to the next occurrence of the selected day
    const smartDate = new Date(minDate);
    smartDate.setDate(minDate.getDate() + daysToAdd);

    return smartDate.toISOString().split('T')[0];
  }, [minMoveInDate]);

  // Set initial move-in date if days were loaded from URL
  // Also validate URL-provided move-in date is not before minimum (2 weeks from today)
  useEffect(() => {
    if (selectedDayObjects.length > 0) {
      // If move-in date was provided via URL, validate it's not before minimum
      if (moveInDate) {
        const providedDate = new Date(moveInDate);
        const minDate = new Date(minMoveInDate);

        if (providedDate < minDate) {
          // URL date is in the past, use smart calculation instead
          const dayNumbers = selectedDayObjects.map(day => day.dayOfWeek);
          const smartDate = calculateSmartMoveInDate(dayNumbers);
          setMoveInDate(smartDate);
          logger.debug('ViewSplitLeasePage: URL move-in date was before minimum, using smart date:', smartDate);
        }
      } else {
        // No URL date provided, calculate smart default
        const dayNumbers = selectedDayObjects.map(day => day.dayOfWeek);
        const smartDate = calculateSmartMoveInDate(dayNumbers);
        setMoveInDate(smartDate);
        logger.debug('ViewSplitLeasePage: Set initial move-in date from URL selection:', smartDate);
      }
    }
  }, []); // Run only once on mount - empty deps to prevent recalculation on state changes

  // UI state
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showContactHostModal, setShowContactHostModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    neighborhood: false,
    blockedDates: false
  });

  // Informational text state
  const [activeInfoTooltip, setActiveInfoTooltip] = useState(null);
  const moveInInfoRef = useRef(null);
  const reservationSpanInfoRef = useRef(null);
  const flexibilityInfoRef = useRef(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [mobileBookingExpanded, setMobileBookingExpanded] = useState(false);

  // Section references for navigation
  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);
  const commuteSectionRef = useRef(null);
  const amenitiesSectionRef = useRef(null);
  const houseRulesSectionRef = useRef(null);
  const hasAutoZoomedRef = useRef(false); // Track if we've auto-zoomed on initial load

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    console.log('ViewSplitLeasePage COMPONENT RENDERING - useEffect running');

    async function initialize() {
      try {
        // Initialize lookup caches
        await initializeLookups();

        // Check auth status and fetch user data if logged in
        const isLoggedIn = await checkAuthStatus();
        if (isLoggedIn) {
          const userData = await validateTokenAndFetchUser();
          if (userData) {
            setLoggedInUserData(userData);
            logger.debug('ViewSplitLeasePage: User data loaded:', userData.firstName);
          }
        }

        // Fetch ZAT price configuration
        const zatConfigData = await fetchZatPriceConfiguration();
        setZatConfig(zatConfigData);

        // Fetch informational texts
        const infoTexts = await fetchInformationalTexts();
        setInformationalTexts(infoTexts);

        // Get listing ID from URL
        const listingId = getListingIdFromUrl();
        if (!listingId) {
          throw new Error('No listing ID provided in URL');
        }

        // Fetch complete listing data
        const listingData = await fetchListingComplete(listingId);
        logger.debug('ViewSplitLeasePage: Listing data fetched:', {
          id: listingData.id,
          name: listingData.listing_title
        });
        setListing(listingData);
        setLoading(false);

      } catch (err) {
        console.error('Error initializing page:', err);
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

  // ============================================================================
  // LAZY LOADING FOR MAP
  // ============================================================================

  useEffect(() => {
    // Set up Intersection Observer to lazy load the map when user scrolls near it
    if (!mapSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Load map when section is within 200px of viewport
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setShouldLoadMap(true);
            // Once loaded, we can stop observing
            observer.disconnect();
          }
        });
      },
      {
        // Start loading when map section is 200px away from viewport
        rootMargin: '200px',
        threshold: 0
      }
    );

    observer.observe(mapSectionRef.current);

    return () => observer.disconnect();
  }, [listing]); // Re-run when listing data is available

  // ============================================================================
  // AUTO-ZOOM MAP ON INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    // Automatically center and zoom the map when it loads for the first time
    // This replicates the behavior of clicking "Located in" link, but without scrolling
    if (shouldLoadMap && mapRef.current && listing && !hasAutoZoomedRef.current) {
      logger.debug('ViewSplitLeasePage: Auto-zooming map on initial load');

      // Wait for map to fully initialize before calling zoomToListing
      // Same 600ms timeout as handleLocationClick
      setTimeout(() => {
        if (mapRef.current && listing) {
          logger.debug('ViewSplitLeasePage: Calling zoomToListing for initial auto-zoom');
          mapRef.current.zoomToListing(listing.id);
          hasAutoZoomedRef.current = true;
        }
      }, 600);
    }
  }, [shouldLoadMap, listing]);

  // ============================================================================
  // UPDATE DOCUMENT TITLE
  // ============================================================================

  useEffect(() => {
    // Update the browser tab title with the listing name
    if (listing?.Name) {
      document.title = `${listing.listing_title} | Split Lease`;
    }
  }, [listing]);

  // ============================================================================
  // CHECK FOR EXISTING PROPOSAL
  // ============================================================================

  useEffect(() => {
    // Check if logged-in user already has a proposal for this listing
    async function checkExistingProposal() {
      if (!loggedInUserData?.userId || !listing?.id) {
        setExistingProposalForListing(null);
        return;
      }

      try {
        logger.debug('ViewSplitLeasePage: Checking for existing proposals for listing:', listing.id);

        const { data: existingProposals, error } = await supabase
          .from('booking_proposal')
          .select('id, proposal_workflow_status, original_created_at')
          .eq('guest_user_id', loggedInUserData.userId)
          .eq('listing_id', listing.id || listing.id)
          .neq('proposal_workflow_status', 'Proposal Cancelled by Guest')
          .or('is_deleted.is.null,is_deleted.eq.false')
          .order('original_created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error checking for existing proposals:', error);
          setExistingProposalForListing(null);
          return;
        }

        if (existingProposals && existingProposals.length > 0) {
          logger.debug('ViewSplitLeasePage: User already has a proposal for this listing:', existingProposals[0]);
          setExistingProposalForListing(existingProposals[0]);
        } else {
          logger.debug('ViewSplitLeasePage: No existing proposal found for this listing');
          setExistingProposalForListing(null);
        }
      } catch (err) {
        console.error('Error checking for existing proposals:', err);
        setExistingProposalForListing(null);
      }
    }

    checkExistingProposal();
  }, [loggedInUserData?.userId, listing?.id]);

  // ============================================================================
  // CHECK IF LISTING IS FAVORITED
  // ============================================================================

  useEffect(() => {
    // Check if the current listing is in the user's favorites
    async function checkIfFavorited() {
      if (!loggedInUserData?.userId || !listing?.id) {
        setIsFavorited(false);
        return;
      }

      try {
        const { data: listingData, error } = await supabase
          .from('listing')
          .select('user_ids_who_favorited_json')
          .eq('id', listing.id || listing.id)
          .single();

        if (error) {
          logger.debug('ViewSplitLeasePage: Error fetching listing favorites:', error);
          setIsFavorited(false);
          return;
        }

        const favoritedUserIds = listingData?.user_ids_who_favorited_json || [];
        const isFav = favoritedUserIds.includes(loggedInUserData.userId);
        logger.debug('ViewSplitLeasePage: Listing favorited status:', isFav);
        setIsFavorited(isFav);
      } catch (err) {
        logger.debug('ViewSplitLeasePage: Error checking favorite status:', err);
        setIsFavorited(false);
      }
    }

    checkIfFavorited();
  }, [loggedInUserData?.userId, listing?.id]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Convert day names to numbers helper
  const convertDayNamesToNumbers = (dayNames) => {
    if (!dayNames || !Array.isArray(dayNames)) return [0, 1, 2, 3, 4, 5, 6];

    const dayNameMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const numbers = dayNames.map(name => dayNameMap[name]).filter(num => num !== undefined);
    return numbers.length > 0 ? numbers : [0, 1, 2, 3, 4, 5, 6];
  };

  // Prepare listing data for ListingScheduleSelector component
  // Memoize to prevent unnecessary re-renders and map resets
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
    // Pricing fields -- keys MUST match what calculatePrice reads
    rental_type: listing.rental_type || 'Nightly',
    weeks_offered_schedule_text: listing.weeks_offered_schedule_text || 'Every week',
    unit_markup_percentage: listing.unit_markup_percentage || 0,
    nightly_rate_for_2_night_stay: listing.nightly_rate_for_2_night_stay,
    nightly_rate_for_3_night_stay: listing.nightly_rate_for_3_night_stay,
    nightly_rate_for_4_night_stay: listing.nightly_rate_for_4_night_stay,
    nightly_rate_for_5_night_stay: listing.nightly_rate_for_5_night_stay,
    nightly_rate_for_7_night_stay: listing.nightly_rate_for_7_night_stay,
    weekly_rate_paid_to_host: listing.weekly_rate_paid_to_host,
    monthly_rate_paid_to_host: listing.monthly_rate_paid_to_host,
    price_override: listing.price_override,
    cleaning_fee_amount: listing.cleaning_fee_amount,
    damage_deposit_amount: listing.damage_deposit_amount
  } : null, [listing]);

  // Initialize with Monday-Friday (1-5) as default
  useEffect(() => {
    if (selectedDayObjects.length === 0) {
      const defaultDays = DEFAULTS.DEFAULT_SELECTED_DAYS.map(dayNum => createDay(dayNum, true));
      setSelectedDayObjects(defaultDays);
    }
  }, []);

  const scheduleValidation = listing ? validateScheduleSelection(selectedDays, listing) : null;
  const nightsSelected = calculateNightsFromDays(selectedDays);
  const { checkInName, checkOutName } = calculateCheckInOutDays(selectedDays);

  // Use price breakdown from ListingScheduleSelector (calculated internally)
  const pricingBreakdown = priceBreakdown;

  const priceMessage = !scheduleValidation?.valid || !pricingBreakdown?.valid
    ? getPriceDisplayMessage(selectedDays.length)
    : null;

  // Memoize map listings to prevent unnecessary GoogleMap re-renders
  // This prevents the map from resetting when modals open/close
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

    // Check if non-contiguous (triggers tutorial)
    const dayNumbers = newSelectedDays.map(d => d.dayOfWeek);
    if (dayNumbers.length > 0 && !isContiguousSelection(dayNumbers)) {
      setShowTutorialModal(true);
    }

    // Automatically set smart default move-in date when days are selected
    if (dayNumbers.length > 0) {
      const smartDate = calculateSmartMoveInDate(dayNumbers);
      setMoveInDate(smartDate);
    }
  };

  const handlePriceChange = useCallback((newPriceBreakdown) => {
    console.log('=== PRICE CHANGE CALLBACK ===');
    console.log('Received price breakdown:', newPriceBreakdown);
    // Only update if the values have actually changed to prevent infinite loops
    setPriceBreakdown((prev) => {
      if (!prev ||
          prev.fourWeekRent !== newPriceBreakdown.fourWeekRent ||
          prev.reservationTotal !== newPriceBreakdown.reservationTotal ||
          prev.nightlyRate !== newPriceBreakdown.nightlyRate) {
        return newPriceBreakdown;
      }
      return prev;
    });
  }, [selectedDays.length]);

  const handlePhotoClick = (index) => {
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCreateProposal = () => {
    // Validate before opening modal
    if (!scheduleValidation?.valid) {
      alert('Please select a valid contiguous schedule');
      return;
    }

    if (!moveInDate) {
      alert('Please select a move-in date');
      return;
    }

    setIsProposalModalOpen(true);
  };

  // Submit proposal to backend (after auth is confirmed)
  const submitProposal = async (proposalData) => {
    // Guard against double submission
    if (isSubmittingProposal) {
      logger.debug('Proposal submission already in progress, skipping duplicate call');
      return;
    }
    setIsSubmittingProposal(true);

    try {
      // Get the guest ID (Bubble user _id)
      const guestId = loggedInUserData?.userId || getSessionId();

      if (!guestId) {
        throw new Error('User ID not found. Please log in again.');
      }

      logger.debug('Submitting proposal to Edge Function', { guestId, listingId: proposalData.listingId });

      // Days are already in JS format (0-6) - database now uses 0-indexed natively
      // proposalData.daysSelectedObjects contains Day objects with dayOfWeek property
      const daysInJsFormat = proposalData.daysSelectedObjects?.map(d => d.dayOfWeek) || selectedDays;

      // Sort days in JS format first to detect wrap-around (Saturday/Sunday spanning)
      const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);

      // Check for wrap-around case (both Saturday=6 and Sunday=0 present, but not all 7 days)
      const hasSaturday = sortedJsDays.includes(6);
      const hasSunday = sortedJsDays.includes(0);
      const isWrapAround = hasSaturday && hasSunday && daysInJsFormat.length < 7;

      let checkInDayJs, checkOutDayJs, nightsInJsFormat;

      if (isWrapAround) {
        // Find the gap in the sorted selection to determine wrap-around point
        let gapIndex = -1;
        for (let i = 0; i < sortedJsDays.length - 1; i++) {
          if (sortedJsDays[i + 1] - sortedJsDays[i] > 1) {
            gapIndex = i + 1;
            break;
          }
        }

        if (gapIndex !== -1) {
          // Wrap-around: check-in is the first day after the gap, check-out is the last day before gap
          checkInDayJs = sortedJsDays[gapIndex];
          checkOutDayJs = sortedJsDays[gapIndex - 1];

          // Reorder days to be in actual sequence (check-in to check-out)
          const reorderedDays = [...sortedJsDays.slice(gapIndex), ...sortedJsDays.slice(0, gapIndex)];

          // Nights = all days except the last one (checkout day)
          nightsInJsFormat = reorderedDays.slice(0, -1);
        } else {
          // No gap found, use standard logic
          checkInDayJs = sortedJsDays[0];
          checkOutDayJs = sortedJsDays[sortedJsDays.length - 1];
          nightsInJsFormat = sortedJsDays.slice(0, -1);
        }
      } else {
        // Standard case: check-in = first day, check-out = last day
        checkInDayJs = sortedJsDays[0];
        checkOutDayJs = sortedJsDays[sortedJsDays.length - 1];
        // Nights = all days except the last one (checkout day)
        nightsInJsFormat = sortedJsDays.slice(0, -1);
      }

      // Use JS format directly (0-6) - database now uses 0-indexed natively
      const checkInDay = checkInDayJs;
      const checkOutDay = checkOutDayJs;
      const nightsSelected = nightsInJsFormat;

      // Format reservation span text
      const reservationSpanWeeks = proposalData.reservationSpan || reservationSpan;
      const reservationSpanText = reservationSpanWeeks === 13
        ? '13 weeks (3 months)'
        : reservationSpanWeeks === 20
          ? '20 weeks (approx. 5 months)'
          : `${reservationSpanWeeks} weeks`;

      // Build the Edge Function payload (using 0-indexed days)
      const edgeFunctionPayload = {
        guestId: guestId,
        listingId: proposalData.listingId,
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
        hostCompensation: proposalData.hostFourWeekCompensation || proposalData.pricePerFourWeeks,
        needForSpace: proposalData.needForSpace || '',
        aboutMe: proposalData.aboutYourself || '',
        estimatedBookingTotal: proposalData.totalPrice,
        // Optional fields
        specialNeeds: proposalData.hasUniqueRequirements ? proposalData.uniqueRequirements : '',
        moveInRangeText: proposalData.moveInRange || '',
        flexibleMoveIn: !!proposalData.moveInRange,
        fourWeekCompensation: proposalData.hostFourWeekCompensation || proposalData.pricePerFourWeeks,
        // Custom schedule description (user's freeform schedule request)
        customScheduleDescription: customScheduleDescription || ''
      };

      logger.debug('Edge Function payload:', {
        guestId: edgeFunctionPayload.guestId,
        listingId: edgeFunctionPayload.listingId,
        daysSelected: edgeFunctionPayload.daysSelected,
        nightsSelected: edgeFunctionPayload.nightsSelected
      });

      // Call the proposal Edge Function (Supabase-native)
      const { data, error } = await supabase.functions.invoke('proposal', {
        body: {
          action: 'create',
          payload: edgeFunctionPayload
        }
      });

      if (error) {
        console.error('Edge Function error:', error);

        // Extract actual error message from response context if available
        let errorMessage = error.message || 'Failed to submit proposal';

        // FunctionsHttpError has context.json() method or context as Response
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errorBody = await error.context.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } else if (error.context?.body) {
            const errorBody = typeof error.context.body === 'string'
              ? JSON.parse(error.context.body)
              : error.context.body;
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          }
        } catch (e) {
          console.error('Could not parse error body:', e);
        }

        throw new Error(errorMessage);
      }

      if (!data?.success) {
        console.error('Proposal submission failed:', data?.error);
        throw new Error(data?.error || 'Failed to submit proposal');
      }

      logger.debug('Proposal submitted successfully', { proposalId: data.data?.proposalId });

      // Clear the localStorage draft on successful submission
      clearProposalDraft(proposalData.listingId);

      // Close the create proposal modal
      setIsProposalModalOpen(false);
      setPendingProposalData(null);

      // Store the proposal ID and show success modal
      const newProposalId = data.data?.proposalId;
      setSuccessProposalId(newProposalId);
      setShowSuccessModal(true);

      // Update existingProposalForListing so the button disables after modal closes
      setExistingProposalForListing({
        id: newProposalId,
        Status: 'Pending Host Review',
        'Created Date': new Date().toISOString()
      });

      // NOTE: SplitBot messages are now created server-side in the proposal Edge Function

    } catch (error) {
      console.error('Error submitting proposal:', error);
      showToast(error.message || 'Failed to submit proposal. Please try again.', 'error');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle proposal submission - checks auth first
  const handleProposalSubmit = async (proposalData) => {
    logger.debug('Proposal submission initiated');

    // Check if user is logged in
    const isLoggedIn = await checkAuthStatus();

    if (!isLoggedIn) {
      logger.debug('User not logged in, showing auth modal');
      // Store the proposal data for later submission
      setPendingProposalData(proposalData);
      // Close the proposal modal
      setIsProposalModalOpen(false);
      // Open auth modal
      setShowAuthModal(true);
      return;
    }

    // User is logged in, proceed with submission
    logger.debug('User is logged in, submitting proposal');
    await submitProposal(proposalData);
  };

  // Handle successful authentication
  const handleAuthSuccess = async (authResult) => {
    logger.debug('Auth success');

    // Close the auth modal
    setShowAuthModal(false);

    // Update the logged-in user data
    try {
      const userData = await validateTokenAndFetchUser();
      if (userData) {
        setLoggedInUserData(userData);
        logger.debug('User data updated after auth:', userData.firstName);
      }
    } catch (err) {
      console.error('Error fetching user data after auth:', err);
    }

    // If there's a pending proposal, submit it now
    if (pendingProposalData) {
      logger.debug('Submitting pending proposal after auth');
      // Capture and clear pending data immediately to prevent double submission
      const dataToSubmit = pendingProposalData;
      setPendingProposalData(null);
      // Small delay to ensure auth state is fully updated
      setTimeout(async () => {
        await submitProposal(dataToSubmit);
      }, 500);
    }
  };

  const scrollToSection = (sectionRef, shouldZoomMap = false) => {
    if (sectionRef.current) {
      // If scrolling to map section, ensure map is loaded
      if (shouldZoomMap && !shouldLoadMap) {
        setShouldLoadMap(true);
      }

      // Scroll with offset to account for fixed header (80px height + some padding)
      const yOffset = -100;
      const element = sectionRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });

      // After scrolling, center the map on the listing's location if needed
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
  const handleCommuteClick = () => scrollToSection(commuteSectionRef);
  const handleAmenitiesClick = () => scrollToSection(amenitiesSectionRef);
  const handleHouseRulesClick = () => scrollToSection(houseRulesSectionRef);
  const handleMapClick = () => scrollToSection(mapSectionRef, true);

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', paddingTop: 'calc(80px + 2rem)' }}>
          <LoadingState />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '70vh', paddingTop: 'calc(80px + 2rem)' }}>
          <ErrorState error={error} />
          <ErrorState error={error} onRetry={null} />
        </main>
        <Footer />
      </>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <>
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type} show`}>
          <span className="toast-icon">
            {toast.type === 'success' && (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            )}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      <main style={{
        maxWidth: isMobile ? '100%' : '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem',
        paddingTop: isMobile ? 'calc(80px + 1rem)' : 'calc(100px + 2rem)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 440px',
        gap: isMobile ? '1.5rem' : '2rem',
        boxSizing: 'border-box',
        width: '100%'
      }}>

        {/* LEFT COLUMN - CONTENT */}
        <div className="left-column" style={{
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'visible'
        }}>

          {/* Photo Gallery - Magazine Editorial Style */}
          <section style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            {listing.photos && listing.photos.length > 0 ? (
              <PhotoGallery
                photos={listing.photos}
                listingName={listing.listing_title}
                onPhotoClick={handlePhotoClick}
                currentIndex={currentPhotoIndex}
                isModalOpen={showPhotoModal}
                onCloseModal={handleClosePhotoModal}
                isMobile={isMobile}
              />
            ) : (
              <div style={{
                width: '100%',
                height: isMobile ? '250px' : '400px',
                background: COLORS.BG_LIGHT,
                borderRadius: isMobile ? '8px' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.TEXT_LIGHT
              }}>
                No images available
              </div>
            )}
          </section>

          {/* Listing Header */}
          <section style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              marginBottom: isMobile ? '0.75rem' : '1rem',
              color: COLORS.TEXT_DARK
            }}>
              {listing.listing_title}
            </h1>
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.5rem' : '1rem',
              flexWrap: 'wrap',
              color: COLORS.TEXT_LIGHT,
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              {listing.resolvedNeighborhood && listing.resolvedBorough && (
                <span
                  onClick={handleLocationClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = COLORS.PRIMARY}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = COLORS.TEXT_LIGHT}
                >
                  Located in {listing.resolvedNeighborhood}, {listing.resolvedBorough}
                </span>
              )}
              {listing.resolvedTypeOfSpace && (
                <span>
                  {listing.resolvedTypeOfSpace} - {listing.max_guest_count} guests max
                </span>
              )}
            </div>
          </section>

          {/* Listing Details (features, description, amenities, map, etc.) */}
          <ListingDetailsSection
            listing={listing}
            isMobile={isMobile}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            mapSectionRef={mapSectionRef}
            mapRef={mapRef}
            shouldLoadMap={shouldLoadMap}
            mapListings={mapListings}
            commuteSectionRef={commuteSectionRef}
            amenitiesSectionRef={amenitiesSectionRef}
            houseRulesSectionRef={houseRulesSectionRef}
          />

          {/* Host Section */}
          <HostInfoSection
            listing={listing}
            isMobile={isMobile}
            onContactHost={() => setShowContactHostModal(true)}
          />
        </div>

        {/* RIGHT COLUMN - BOOKING WIDGET (hidden on mobile) */}
        <PricingSection
          listing={listing}
          isMobile={isMobile}
          pricingBreakdown={pricingBreakdown}
          priceMessage={priceMessage}
          scheduleSelectorListing={scheduleSelectorListing}
          selectedDayObjects={selectedDayObjects}
          reservationSpan={reservationSpan}
          zatConfig={zatConfig}
          handleScheduleChange={handleScheduleChange}
          handlePriceChange={handlePriceChange}
          setReservationSpan={setReservationSpan}
          moveInDate={moveInDate}
          setMoveInDate={setMoveInDate}
          minMoveInDate={minMoveInDate}
          strictMode={strictMode}
          setStrictMode={setStrictMode}
          customScheduleDescription={customScheduleDescription}
          setCustomScheduleDescription={setCustomScheduleDescription}
          showCustomScheduleInput={showCustomScheduleInput}
          setShowCustomScheduleInput={setShowCustomScheduleInput}
          scheduleValidation={scheduleValidation}
          existingProposalForListing={existingProposalForListing}
          isFavorited={isFavorited}
          setIsFavorited={setIsFavorited}
          loggedInUserData={loggedInUserData}
          setShowAuthModal={setShowAuthModal}
          activeInfoTooltip={activeInfoTooltip}
          setActiveInfoTooltip={setActiveInfoTooltip}
          moveInInfoRef={moveInInfoRef}
          reservationSpanInfoRef={reservationSpanInfoRef}
          flexibilityInfoRef={flexibilityInfoRef}
          handleCreateProposal={handleCreateProposal}
        />
      </main>

      {/* Tutorial Modal */}
      {showTutorialModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowTutorialModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTutorialModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: COLORS.TEXT_LIGHT
              }}
            >
              {'\u00d7'}
            </button>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: COLORS.TEXT_DARK
            }}>
              How to set a split schedule
            </h2>

            <p style={{
              lineHeight: '1.6',
              color: COLORS.TEXT_LIGHT,
              marginBottom: '1.5rem'
            }}>
              To create a valid split schedule, you must select consecutive days (for example, Monday through Friday).
              Non-consecutive selections like Monday, Wednesday, Friday are not allowed.
            </p>

            <div style={{
              padding: '1rem',
              background: COLORS.BG_LIGHT,
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{'\ud83c\udfe2'}</div>
              <div style={{ fontSize: '0.875rem', color: COLORS.TEXT_DARK }}>
                Stay 2-5 nights a week, save up to 50% off of a comparable Airbnb
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowTutorialModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: COLORS.PRIMARY,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Okay
              </button>
              <button
                onClick={() => window.location.href = '/faq.html'}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'white',
                  color: COLORS.PRIMARY,
                  border: `2px solid ${COLORS.PRIMARY}`,
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Take me to FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && listing.photos && listing.photos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '1rem' : '2rem'
          }}
          onClick={() => setShowPhotoModal(false)}
        >
          <button
            onClick={() => setShowPhotoModal(false)}
            style={{
              position: 'absolute',
              top: isMobile ? '1rem' : '2rem',
              right: isMobile ? '1rem' : '2rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1002
            }}
          >
            {'\u00d7'}
          </button>

          <img
            src={listing.photos[currentPhotoIndex]?.Photo}
            alt={`${listing.listing_title} - photo ${currentPhotoIndex + 1}`}
            style={{
              maxWidth: isMobile ? '95vw' : '90vw',
              maxHeight: isMobile ? '75vh' : '80vh',
              objectFit: 'contain',
              marginBottom: isMobile ? '6rem' : '5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          <div style={{
            position: 'absolute',
            bottom: isMobile ? '4rem' : '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: isMobile ? '0.5rem' : '1.5rem',
            alignItems: 'center',
            flexWrap: isMobile ? 'nowrap' : 'nowrap',
            zIndex: 1001
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : listing.photos.length - 1));
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: isMobile ? '0.875rem' : '1rem',
                whiteSpace: 'nowrap'
              }}
            >
              {'\u2190'} Previous
            </button>

            <span style={{
              color: 'white',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              whiteSpace: 'nowrap',
              minWidth: isMobile ? '60px' : '80px',
              textAlign: 'center'
            }}>
              {currentPhotoIndex + 1} / {listing.photos.length}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPhotoIndex(prev => (prev < listing.photos.length - 1 ? prev + 1 : 0));
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: isMobile ? '0.875rem' : '1rem',
                whiteSpace: 'nowrap'
              }}
            >
              Next {'\u2192'}
            </button>
          </div>

          <button
            onClick={() => setShowPhotoModal(false)}
            style={{
              position: 'absolute',
              bottom: isMobile ? '1rem' : '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              border: 'none',
              color: COLORS.TEXT_DARK,
              padding: isMobile ? '0.5rem 2rem' : '0.75rem 2.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? '0.875rem' : '1rem',
              zIndex: 1001
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Create Proposal Modal - V2 */}
      {isProposalModalOpen && (
        <CreateProposalFlowV2
          listing={listing}
          moveInDate={moveInDate}
          daysSelected={selectedDayObjects}
          nightsSelected={nightsSelected}
          reservationSpan={reservationSpan}
          pricingBreakdown={priceBreakdown}
          zatConfig={zatConfig}
          // For ViewSplitLeasePage: User starts on REVIEW if they have proposals OR filled user info
          // This ensures returning users with existing data go straight to review (hub-and-spoke model)
          isFirstProposal={
            !loggedInUserData ||
            (loggedInUserData.proposalCount === 0 && !loggedInUserData.needForSpace && !loggedInUserData.aboutMe)
          }
          existingUserData={loggedInUserData ? {
            needForSpace: loggedInUserData.needForSpace || '',
            aboutYourself: loggedInUserData.aboutMe || '',
            hasUniqueRequirements: !!loggedInUserData.specialNeeds,
            uniqueRequirements: loggedInUserData.specialNeeds || ''
          } : null}
          onClose={() => setIsProposalModalOpen(false)}
          onSubmit={handleProposalSubmit}
          isSubmitting={isSubmittingProposal}
        />
      )}

      {/* Auth Modal for Proposal Submission */}
      {showAuthModal && (
        <SignUpLoginModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingProposalData(null);
          }}
          initialView="signup-step1"
          onAuthSuccess={handleAuthSuccess}
          defaultUserType="guest"
          skipReload={true}
        />
      )}

      {/* Proposal Success Modal */}
      {showSuccessModal && (
        <ProposalSuccessModal
          proposalId={successProposalId}
          listingName={listing?.Name}
          hasSubmittedRentalApp={loggedInUserData?.hasSubmittedRentalApp ?? false}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessProposalId(null);
          }}
        />
      )}

      {/* Contact Host Messaging Modal */}
      {showContactHostModal && listing && (
        <ContactHostMessaging
          isOpen={showContactHostModal}
          onClose={() => setShowContactHostModal(false)}
          listing={{
            id: listing.id,
            title: listing.listing_title,
            host: {
              userId: listing.host?.userId,  // User's Bubble ID for messaging
              name: listing.host ? `${listing.host.first_name} ${listing.host.last_name?.charAt(0)}.` : 'Host'
            }
          }}
          onLoginRequired={() => {
            setShowContactHostModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Informational Text Tooltips */}
      {informationalTexts['aligned schedule with move-in'] && (
        <InformationalText
          isOpen={activeInfoTooltip === 'moveIn'}
          onClose={() => setActiveInfoTooltip(null)}
          triggerRef={moveInInfoRef}
          title="Ideal Move-In"
          content={isMobile
            ? informationalTexts['aligned schedule with move-in'].mobile || informationalTexts['aligned schedule with move-in'].desktop
            : informationalTexts['aligned schedule with move-in'].desktop
          }
          expandedContent={informationalTexts['aligned schedule with move-in'].desktopPlus}
          showMoreAvailable={informationalTexts['aligned schedule with move-in'].showMore}
        />
      )}

      {informationalTexts['move-in flexibility'] && (
        <InformationalText
          isOpen={activeInfoTooltip === 'flexibility'}
          onClose={() => setActiveInfoTooltip(null)}
          triggerRef={flexibilityInfoRef}
          title="Move-In Flexibility"
          content={isMobile
            ? informationalTexts['move-in flexibility'].mobile || informationalTexts['move-in flexibility'].desktop
            : informationalTexts['move-in flexibility'].desktop
          }
          expandedContent={informationalTexts['move-in flexibility'].desktopPlus}
          showMoreAvailable={informationalTexts['move-in flexibility'].showMore}
        />
      )}

      {informationalTexts['Reservation Span'] && (
        <InformationalText
          isOpen={activeInfoTooltip === 'reservationSpan'}
          onClose={() => setActiveInfoTooltip(null)}
          triggerRef={reservationSpanInfoRef}
          title="Reservation Span"
          content={isMobile
            ? informationalTexts['Reservation Span'].mobile || informationalTexts['Reservation Span'].desktop
            : informationalTexts['Reservation Span'].desktop
          }
          expandedContent={informationalTexts['Reservation Span'].desktopPlus}
          showMoreAvailable={informationalTexts['Reservation Span'].showMore}
        />
      )}

      {/* Mobile Bottom Booking Bar - hide when proposal modal, photo gallery, or auth modal is open */}
      {isMobile && !isProposalModalOpen && !showPhotoModal && !showAuthModal && (
        <MobileBookingBar
          listing={listing}
          pricingBreakdown={pricingBreakdown}
          scheduleSelectorListing={scheduleSelectorListing}
          selectedDayObjects={selectedDayObjects}
          reservationSpan={reservationSpan}
          zatConfig={zatConfig}
          handleScheduleChange={handleScheduleChange}
          handlePriceChange={handlePriceChange}
          setReservationSpan={setReservationSpan}
          moveInDate={moveInDate}
          setMoveInDate={setMoveInDate}
          minMoveInDate={minMoveInDate}
          strictMode={strictMode}
          setStrictMode={setStrictMode}
          customScheduleDescription={customScheduleDescription}
          setCustomScheduleDescription={setCustomScheduleDescription}
          showCustomScheduleInput={showCustomScheduleInput}
          setShowCustomScheduleInput={setShowCustomScheduleInput}
          scheduleValidation={scheduleValidation}
          existingProposalForListing={existingProposalForListing}
          isFavorited={isFavorited}
          setIsFavorited={setIsFavorited}
          loggedInUserData={loggedInUserData}
          setShowAuthModal={setShowAuthModal}
          mobileBookingExpanded={mobileBookingExpanded}
          setMobileBookingExpanded={setMobileBookingExpanded}
          handleCreateProposal={handleCreateProposal}
        />
      )}

      <Footer />
    </>
  );
}
