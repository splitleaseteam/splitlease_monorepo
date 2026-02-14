/**
 * useCreateSuggestedProposalLogic
 *
 * All business logic for the Create Suggested Proposal page.
 * Follows the Four-Layer Logic Architecture.
 *
 * Day Indexing: Uses 0-indexed format (0=Sunday through 6=Saturday)
 *
 * State management: useReducer + useModalManager
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { DAY_NAMES } from '../../../lib/dayUtils.js';
import { calculateCheckInCheckOut } from '../../../lib/scheduleSelector/nightCalculations.js';
import { useModalManager } from '../../../hooks/useModalManager.js';
import {
  createSuggestedProposalReducer,
  initialState,
} from './createSuggestedProposalReducer.js';
import {
  searchListings,
  getDefaultListings,
  searchGuests,
  getDefaultGuests,
  getListingPhotos,
  getUserProposalsForListing,
  getUserMostRecentProposal,
  createSuggestedProposal
} from './suggestedProposalService.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const RESERVATION_SPAN_OPTIONS = [
  { value: '6', label: '6 weeks' },
  { value: '8', label: '8 weeks' },
  { value: '12', label: '12 weeks' },
  { value: '16', label: '16 weeks' },
  { value: '26', label: '26 weeks' },
  { value: '52', label: '52 weeks' },
  { value: 'custom', label: 'Other (specify weeks)' }
];

const MOVE_IN_RANGE_OPTIONS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 21, label: '3 weeks' },
  { value: 30, label: '1 month' }
];

// Standard reservation span weeks that map directly to dropdown options
const STANDARD_RESERVATION_SPANS = [6, 7, 8, 9, 10, 12, 13, 16, 17, 20, 22, 26, 52];

/**
 * Map numeric weeks to reservation span dropdown value
 * @param {number} weeks - Number of weeks from proposal
 * @returns {{ reservationSpan: string, customWeeks: number|null }}
 */
function mapWeeksToReservationSpan(weeks) {
  if (!weeks || weeks <= 0) {
    return { reservationSpan: '', customWeeks: null };
  }

  if (STANDARD_RESERVATION_SPANS.includes(weeks)) {
    return { reservationSpan: String(weeks), customWeeks: null };
  }

  // Non-standard value: use custom option
  return { reservationSpan: 'custom', customWeeks: weeks };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Calculate pricing based on listing and configuration
 * Uses simple calculation - integrate with pricing calculators for production
 */
function calculatePricing(listing, nightsPerWeek, weeks) {
  if (!listing || !nightsPerWeek || !weeks) {
    return null;
  }

  const nightlyRateByNights = {
    1: listing.nightly_rate_for_1_night_stay,
    2: listing.nightly_rate_for_2_night_stay,
    3: listing.nightly_rate_for_3_night_stay,
    4: listing.nightly_rate_for_4_night_stay,
    5: listing.nightly_rate_for_5_night_stay,
    6: listing.nightly_rate_for_6_night_stay,
    7: listing.nightly_rate_for_7_night_stay,
  };

  const nightlyPrice = nightlyRateByNights[nightsPerWeek] || listing.nightly_rate_for_4_night_stay || 0;

  const cleaningFee = listing.cleaning_fee_amount || 0;
  const damageDeposit = listing.damage_deposit_amount || 0;

  const totalNights = nightsPerWeek * weeks;
  const fourWeekRent = nightlyPrice * nightsPerWeek * 4;
  const reservationTotal = nightlyPrice * totalNights;
  const grandTotal = reservationTotal + cleaningFee;

  // Host compensation (85% is typical)
  const hostCompensation = grandTotal * 0.85;

  return {
    nightlyPrice,
    nightsPerWeek,
    numberOfWeeks: weeks,
    totalNights,
    fourWeekRent,
    cleaningFee,
    damageDeposit,
    reservationTotal,
    grandTotal,
    hostCompensation,
    initialPayment: fourWeekRent + damageDeposit
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useCreateSuggestedProposalLogic() {
  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [state, dispatch] = useReducer(createSuggestedProposalReducer, initialState);
  const modals = useModalManager();

  // -------------------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------------------

  const nightsPerWeek = state.selectedDays.length;
  const nightsCount = Math.max(0, state.selectedDays.length - 1);

  // Calculate check-in/check-out using the same logic as ViewSplitLeasePage
  const { checkInDayIndex, checkOutDayIndex, checkInDayName, checkOutDayName, nightsSelected } = useMemo(() => {
    if (state.selectedDays.length === 0) {
      return {
        checkInDayIndex: null,
        checkOutDayIndex: null,
        checkInDayName: null,
        checkOutDayName: null,
        nightsSelected: []
      };
    }

    // Convert day indices to day objects for calculateCheckInCheckOut
    const dayObjects = state.selectedDays.map(dayIndex => ({
      dayOfWeek: dayIndex,
      name: DAY_NAMES[dayIndex]
    }));

    const { checkIn, checkOut } = calculateCheckInCheckOut(dayObjects);

    // nightsSelected = all selected days except checkout day
    // (checkout day is when you leave, not a night you stay)
    const checkOutDay = checkOut?.dayOfWeek ?? null;
    const nights = checkOutDay !== null
      ? state.selectedDays.filter(day => day !== checkOutDay)
      : state.selectedDays.slice(0, -1); // fallback: all but last

    return {
      checkInDayIndex: checkIn?.dayOfWeek ?? null,
      checkOutDayIndex: checkOutDay,
      checkInDayName: checkIn?.name ?? null,
      checkOutDayName: checkOut?.name ?? null,
      nightsSelected: nights
    };
  }, [state.selectedDays]);

  const reservationWeeks = useMemo(() => {
    if (state.reservationSpan === 'custom') {
      return parseInt(state.customWeeks) || 0;
    }
    return parseInt(state.reservationSpan) || 0;
  }, [state.reservationSpan, state.customWeeks]);

  const pricing = useMemo(() => {
    return calculatePricing(state.selectedListing, nightsPerWeek, reservationWeeks);
  }, [state.selectedListing, nightsPerWeek, reservationWeeks]);

  // -------------------------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------------------------

  useEffect(() => {
    const errors = [];

    if (state.currentStep >= 1 && !state.selectedListing) {
      errors.push('Please select a listing');
    }

    if (state.currentStep >= 2 && (!state.selectedGuest || !state.isGuestConfirmed)) {
      errors.push('Please select and confirm a guest');
    }

    if (state.currentStep >= 3) {
      if (!state.reservationSpan && !state.moveInDate) {
        errors.push('Fill out reservation span OR move-in date to proceed');
      }

      if (state.selectedDays.length < 3) {
        errors.push('Please select at least 3 days');
      }

      if (state.reservationSpan === 'custom') {
        const weeks = parseInt(state.customWeeks);
        if (!weeks || weeks < 6 || weeks > 52) {
          errors.push('Number of weeks must be between 6 and 52');
        }
      }

      if (pricing && pricing.grandTotal <= 0 && state.reservationSpan) {
        errors.push('Price calculation is invalid');
      }
    }

    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
  }, [
    state.currentStep,
    state.selectedListing,
    state.selectedGuest,
    state.isGuestConfirmed,
    state.reservationSpan,
    state.moveInDate,
    state.selectedDays,
    state.customWeeks,
    pricing
  ]);

  // -------------------------------------------------------------------------
  // LISTING SEARCH
  // -------------------------------------------------------------------------

  // Load default listings on mount
  useEffect(() => {
    const loadDefaults = async () => {
      dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: true });
      try {
        const { data, error } = await getDefaultListings();
        if (error) {
          console.error('[CreateSuggestedProposal] Default listings error:', error);
        } else {
          dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: data || [] });
        }
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: false });
      }
    };
    loadDefaults();
  }, []);

  const debouncedListingSearch = useCallback(
    debounce(async (term) => {
      dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: true });
      try {
        // Empty search = show defaults with valid pricing
        if (term.length === 0) {
          const { data, error } = await getDefaultListings();
          if (error) {
            console.error('[CreateSuggestedProposal] Default listings error:', error);
            dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: [] });
          } else {
            dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: data || [] });
          }
        } else {
          // Search by term
          const { data, error } = await searchListings(term);
          if (error) {
            console.error('[CreateSuggestedProposal] Listing search error:', error);
            dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: [] });
          } else {
            dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: data || [] });
          }
        }
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: false });
      }
    }, 300),
    []
  );

  const handleListingSearchChange = useCallback((e) => {
    const term = e.target.value;
    dispatch({ type: 'SET_LISTING_SEARCH_TERM', payload: term });
    debouncedListingSearch(term);
  }, [debouncedListingSearch]);

  // Handler for when listing search box receives focus
  const handleListingSearchFocus = useCallback(async () => {
    if (state.listingSearchResults.length === 0 && !state.selectedListing) {
      dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: true });
      try {
        const { data, error } = await getDefaultListings();
        if (!error) {
          dispatch({ type: 'SET_LISTING_SEARCH_RESULTS', payload: data || [] });
        }
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_LISTINGS', payload: false });
      }
    }
  }, [state.listingSearchResults.length, state.selectedListing]);

  const handleListingSelect = useCallback(async (listing) => {
    dispatch({ type: 'SELECT_LISTING', payload: listing });

    // Fetch photos
    const { data: photos } = await getListingPhotos(listing.id);
    dispatch({ type: 'SET_LISTING_PHOTOS', payload: photos || [] });

    // Move to step 2
    dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
  }, []);

  const handleListingClear = useCallback(() => {
    dispatch({ type: 'CLEAR_LISTING' });
  }, []);

  const handleClearListingSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_LISTING_SEARCH' });
  }, []);

  // -------------------------------------------------------------------------
  // GUEST SEARCH
  // -------------------------------------------------------------------------

  // Load default guests when step 2 becomes active
  useEffect(() => {
    if (state.currentStep === 2 && state.guestSearchResults.length === 0 && !state.selectedGuest) {
      const loadDefaults = async () => {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
        try {
          const { data, error } = await getDefaultGuests();
          if (error) {
            console.error('[CreateSuggestedProposal] Default guests error:', error);
          } else {
            dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: data || [] });
          }
        } finally {
          dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
        }
      };
      loadDefaults();
    }
  }, [state.currentStep, state.guestSearchResults.length, state.selectedGuest]);

  const debouncedGuestSearch = useCallback(
    debounce(async (term) => {
      dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
      try {
        // Empty search = show default guest list
        if (term.length === 0) {
          const { data, error } = await getDefaultGuests();
          if (error) {
            console.error('[CreateSuggestedProposal] Default guests error:', error);
            dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: [] });
          } else {
            dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: data || [] });
          }
        } else {
          // Search by term (already filtered to guests only)
          const { data, error } = await searchGuests(term);
          if (error) {
            console.error('[CreateSuggestedProposal] Guest search error:', error);
            dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: [] });
          } else {
            dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: data || [] });
          }
        }
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
      }
    }, 300),
    []
  );

  const handleGuestSearchChange = useCallback((e) => {
    const term = e.target.value;
    dispatch({ type: 'SET_GUEST_SEARCH_TERM', payload: term });
    debouncedGuestSearch(term);
  }, [debouncedGuestSearch]);

  // Handler for when guest search box receives focus
  const handleGuestSearchFocus = useCallback(async () => {
    if (state.guestSearchResults.length === 0 && !state.selectedGuest) {
      dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
      try {
        const { data, error } = await getDefaultGuests();
        if (!error) {
          dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: data || [] });
        }
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
      }
    }
  }, [state.guestSearchResults.length, state.selectedGuest]);

  const handleGuestSelect = useCallback(async (guest) => {
    console.log('[PREFILL DEBUG] handleGuestSelect called with full guest object:', guest);
    console.log('[PREFILL DEBUG] Guest id:', guest.id);
    console.log('[PREFILL DEBUG] Guest email:', guest.email);

    dispatch({ type: 'SELECT_GUEST', payload: guest });

    // Check for existing proposals on THIS listing (for warning display)
    if (state.selectedListing) {
      const { data: listingProposals } = await getUserProposalsForListing(guest.id, state.selectedListing.id);
      dispatch({ type: 'SET_EXISTING_PROPOSALS_COUNT', payload: listingProposals?.length || 0 });
    }

    // Prefill from guest's most recent proposal across ALL listings
    console.log('[PREFILL DEBUG] About to call getUserMostRecentProposal for guest:', guest.id);
    const { data: mostRecentProposal, error: prefillError } = await getUserMostRecentProposal(guest.id);
    console.log('[PREFILL DEBUG] Result:', { mostRecentProposal, prefillError });

    if (mostRecentProposal) {
      console.log('[PREFILL DEBUG] Prefilling from proposal:', mostRecentProposal.id);

      const prefillData = {};

      // Prefill days selected (0-indexed, no conversion needed)
      const daysSelected = mostRecentProposal.guest_selected_days_numbers_json;
      if (Array.isArray(daysSelected) && daysSelected.length > 0) {
        prefillData.selectedDays = daysSelected;
      }

      // Prefill reservation span
      const weeksValue = mostRecentProposal.reservation_span_in_weeks;
      if (weeksValue && weeksValue > 0) {
        const { reservationSpan: spanValue, customWeeks: customValue } = mapWeeksToReservationSpan(weeksValue);
        prefillData.reservationSpan = spanValue;
        if (customValue !== null) {
          prefillData.customWeeks = customValue;
        }
      }

      // Prefill move-in date (ensure not in the past)
      const moveInStart = mostRecentProposal.move_in_range_start_date;
      if (moveInStart) {
        const proposalDate = new Date(moveInStart);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Use proposal date if in future, otherwise leave default (tomorrow) in place
        if (proposalDate >= tomorrow) {
          prefillData.moveInDate = proposalDate.toISOString().split('T')[0];
        }
      }

      if (Object.keys(prefillData).length > 0) {
        dispatch({ type: 'PREFILL_FROM_PROPOSAL', payload: prefillData });
      }
    }

    // Pre-fill guest profile fields if available
    const guestInfo = {};
    if (guest.bio_text) {
      guestInfo.aboutMe = guest.bio_text;
    }
    if (guest.stated_need_for_space_text) {
      guestInfo.needForSpace = guest.stated_need_for_space_text;
    }
    if (guest.stated_special_needs_text) {
      guestInfo.specialNeeds = guest.stated_special_needs_text;
    }
    if (Object.keys(guestInfo).length > 0) {
      dispatch({ type: 'SET_GUEST_INFO', payload: guestInfo });
    }
  }, [state.selectedListing]);

  const handleGuestConfirm = useCallback(() => {
    dispatch({ type: 'CONFIRM_GUEST' });
  }, []);

  const handleGuestClear = useCallback(() => {
    dispatch({ type: 'CLEAR_GUEST' });
  }, []);

  const handleClearGuestSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_GUEST_SEARCH' });
  }, []);

  // -------------------------------------------------------------------------
  // GUEST INFO HANDLERS
  // -------------------------------------------------------------------------

  const handleAboutMeChange = useCallback((e) => {
    dispatch({ type: 'SET_ABOUT_ME', payload: e.target.value });
  }, []);

  const handleNeedForSpaceChange = useCallback((e) => {
    dispatch({ type: 'SET_NEED_FOR_SPACE', payload: e.target.value });
  }, []);

  const handleSpecialNeedsChange = useCallback((e) => {
    dispatch({ type: 'SET_SPECIAL_NEEDS', payload: e.target.value });
  }, []);

  /**
   * Handle AI-parsed transcription data
   * Updates all three guest info fields from AI extraction
   */
  const handleTranscriptionParsed = useCallback((parsedData) => {
    dispatch({ type: 'SET_GUEST_INFO', payload: parsedData });
  }, []);

  // -------------------------------------------------------------------------
  // CONFIGURATION HANDLERS
  // -------------------------------------------------------------------------

  const handleStatusChange = useCallback((e) => {
    dispatch({ type: 'SET_PROPOSAL_STATUS', payload: e.target.value });
  }, []);

  const handleMoveInDateChange = useCallback((e) => {
    dispatch({ type: 'SET_MOVE_IN_DATE', payload: e.target.value });
  }, []);

  const handleMoveInRangeChange = useCallback((e) => {
    dispatch({ type: 'SET_MOVE_IN_RANGE', payload: parseInt(e.target.value) });
  }, []);

  const handleStrictMoveInChange = useCallback((e) => {
    dispatch({ type: 'SET_STRICT_MOVE_IN', payload: e.target.checked });
  }, []);

  const handleDayToggle = useCallback((dayIndex) => {
    dispatch({ type: 'TOGGLE_DAY', payload: dayIndex });
  }, []);

  const handleSelectFullTime = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_DAYS' });
  }, []);

  const handleReservationSpanChange = useCallback((e) => {
    dispatch({ type: 'SET_RESERVATION_SPAN', payload: e.target.value });
  }, []);

  const handleCustomWeeksChange = useCallback((e) => {
    dispatch({ type: 'SET_CUSTOM_WEEKS', payload: e.target.value });
  }, []);

  // -------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------

  const handleGoBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  // -------------------------------------------------------------------------
  // SUBMISSION
  // -------------------------------------------------------------------------

  const handleFirstCreateClick = useCallback(() => {
    if (state.validationErrors.length > 0) return;
    dispatch({ type: 'SET_IS_CONFIRMATION_STEP', payload: true });
  }, [state.validationErrors]);

  const handleCancelConfirmation = useCallback(() => {
    dispatch({ type: 'SET_IS_CONFIRMATION_STEP', payload: false });
  }, []);

  const handleConfirmProposal = useCallback(async () => {
    if (state.validationErrors.length > 0 || state.isCreating) return;

    dispatch({ type: 'SET_IS_CREATING', payload: true });

    try {
      const moveInDateObj = new Date(state.moveInDate);
      const moveInEndObj = new Date(moveInDateObj);
      moveInEndObj.setDate(moveInEndObj.getDate() + state.moveInRange);

      const proposalData = {
        // References (required by edge function)
        listingId: state.selectedListing.id,
        guestId: state.selectedGuest.id,

        // Schedule (0-indexed: 0=Sunday, 6=Saturday)
        daysSelected: state.selectedDays,
        nightsSelected,
        checkIn: checkInDayIndex,        // Edge function expects 'checkIn', not 'checkInDayIndex'
        checkOut: checkOutDayIndex,      // Edge function expects 'checkOut', not 'checkOutDayIndex'

        // Dates (edge function expects 'Range' suffix)
        moveInStartRange: moveInDateObj.toISOString(),
        moveInEndRange: moveInEndObj.toISOString(),

        // Reservation (edge function expects 'SpanWeeks')
        reservationSpanWeeks: reservationWeeks,
        reservationSpan: state.reservationSpan === 'custom' ? `${state.customWeeks} weeks` : `${state.reservationSpan} weeks`,

        // Pricing
        nightlyPrice: pricing?.nightlyPrice || 0,
        totalPrice: pricing?.grandTotal || 0,
        hostCompensation: pricing?.hostCompensation || 0,
        cleaningFee: pricing?.cleaningFee || 0,
        damageDeposit: pricing?.damageDeposit || 0,
        fourWeekRent: pricing?.fourWeekRent || 0,

        // Optional Guest Info
        aboutMe: state.aboutMe,
        needForSpace: state.needForSpace,
        specialNeeds: state.specialNeeds
      };

      const { data, error } = await createSuggestedProposal(proposalData);

      if (error) {
        throw new Error(error);
      }

      // Edge function returns { proposalId, threadId, status, ... }
      // Store the IDs in objects with _id property for SuccessModal compatibility
      dispatch({
        type: 'PROPOSAL_CREATED',
        payload: {
          proposal: { _id: data.proposalId },
          thread: { _id: data.threadId },
        },
      });
      modals.open('success');

    } catch (error) {
      console.error('[CreateSuggestedProposal] Creation error:', error);
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: [`Failed to create proposal: ${error.message}`] });
    } finally {
      dispatch({ type: 'SET_IS_CREATING', payload: false });
    }
  }, [
    state.validationErrors,
    state.isCreating,
    state.selectedListing,
    state.selectedGuest,
    state.proposalStatus,
    state.moveInDate,
    state.moveInRange,
    state.selectedDays,
    nightsSelected,
    checkInDayIndex,
    checkOutDayIndex,
    state.reservationSpan,
    state.customWeeks,
    reservationWeeks,
    pricing,
    state.aboutMe,
    state.needForSpace,
    state.specialNeeds,
    modals
  ]);

  // -------------------------------------------------------------------------
  // SUCCESS MODAL
  // -------------------------------------------------------------------------

  const handleCreateAnother = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
    modals.close('success');
  }, [modals]);

  const handleCloseSuccessModal = useCallback(() => {
    modals.close('success');
  }, [modals]);

  // -------------------------------------------------------------------------
  // RETURN (backward-compatible shape)
  // -------------------------------------------------------------------------

  return {
    // Step state
    currentStep: state.currentStep,

    // Step 1 - Listing
    listingSearchTerm: state.listingSearchTerm,
    listingSearchResults: state.listingSearchResults,
    selectedListing: state.selectedListing,
    listingPhotos: state.listingPhotos,
    isSearchingListings: state.isSearchingListings,

    // Step 2 - Guest
    guestSearchTerm: state.guestSearchTerm,
    guestSearchResults: state.guestSearchResults,
    selectedGuest: state.selectedGuest,
    existingProposalsCount: state.existingProposalsCount,
    isGuestConfirmed: state.isGuestConfirmed,
    isSearchingGuests: state.isSearchingGuests,

    // Step 3 - Guest Info
    aboutMe: state.aboutMe,
    needForSpace: state.needForSpace,
    specialNeeds: state.specialNeeds,

    // Step 3 - Configuration
    proposalStatus: state.proposalStatus,
    moveInDate: state.moveInDate,
    moveInRange: state.moveInRange,
    strictMoveIn: state.strictMoveIn,
    selectedDays: state.selectedDays,
    reservationSpan: state.reservationSpan,
    customWeeks: state.customWeeks,

    // Computed (from selected days)
    checkInDayIndex,
    checkOutDayIndex,
    checkInDayName,
    checkOutDayName,
    nightsCount,
    pricing,

    // UI State
    isCreating: state.isCreating,
    isConfirmationStep: state.isConfirmationStep,
    validationErrors: state.validationErrors,
    createdProposal: state.createdProposal,
    createdThread: state.createdThread,
    showSuccessModal: modals.isOpen('success'),

    // Constants for components
    RESERVATION_SPAN_OPTIONS,
    MOVE_IN_RANGE_OPTIONS,
    DAY_NAMES,

    // Handlers - Navigation
    handleGoBack,

    // Handlers - Listing Search
    handleListingSearchChange,
    handleListingSearchFocus,
    handleListingSelect,
    handleListingClear,
    handleClearListingSearch,

    // Handlers - Guest Search
    handleGuestSearchChange,
    handleGuestSearchFocus,
    handleGuestSelect,
    handleGuestConfirm,
    handleGuestClear,
    handleClearGuestSearch,

    // Handlers - Guest Info
    handleAboutMeChange,
    handleNeedForSpaceChange,
    handleSpecialNeedsChange,
    handleTranscriptionParsed,

    // Handlers - Configuration
    handleStatusChange,
    handleMoveInDateChange,
    handleMoveInRangeChange,
    handleStrictMoveInChange,
    handleDayToggle,
    handleSelectFullTime,
    handleReservationSpanChange,
    handleCustomWeeksChange,

    // Handlers - Submission
    handleFirstCreateClick,
    handleConfirmProposal,
    handleCancelConfirmation,

    // Handlers - Success Modal
    handleCreateAnother,
    handleCloseSuccessModal
  };
}
