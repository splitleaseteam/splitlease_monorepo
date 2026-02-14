/**
 * useViewSplitLeaseLogic - Centralized business logic for listing detail pages
 * 
 * Manages all state, data fetching, and business logic for both View (guest) and 
 * Preview (host) modes. Provides memoized pricing calculations and JWT-based 
 * authentication. All user IDs are derived from Supabase JWT tokens.
 * 
 * @param {object} options - Hook configuration
 * @param {'view'|'preview'} options.mode - Page mode (view for guests, preview for hosts)
 * @param {string} [options.listingId] - Optional listing ID (for preview mode)
 * 
 * @returns {object} State and handlers for listing detail page
 * 
 * @architecture Logic Hook - Hollow Component Pattern
 * @performance Pricing memoized with useMemo, listing data cached
 * @security All user IDs derived from JWT via useAuthenticatedUser
 */

import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
// @ts-ignore - JS module without type declarations
import { useModalManager } from '../../../hooks/useModalManager.js';
import { viewSplitLeaseReducer, createInitialState } from './viewSplitLeaseReducer';
import type { UseViewSplitLeaseLogicOptions } from '../types/bookingTypes.js';
// @ts-ignore - JS module without type declarations
import { useAuthenticatedUser } from '../../../../hooks/useAuthenticatedUser';
// @ts-ignore - JS module without type declarations
import { supabase } from '../../../../lib/supabase';
// @ts-ignore - JS module without type declarations
import { logger } from '../../../../lib/logger';
// @ts-ignore - JS module without type declarations
import { fetchListingComplete, getListingIdFromUrl, fetchZatPriceConfiguration } from '../../../../lib/listingDataFetcher';
// @ts-ignore - JS module without type declarations
import { calculatePricingBreakdown } from '../../../../lib/priceCalculations';
// @ts-ignore - JS module without type declarations
import { validateScheduleSelection } from '../../../../lib/availabilityValidation';
// @ts-ignore - JS module without type declarations
import { checkAuthStatus } from '../../../../lib/auth/index.js';
// @ts-ignore - JS module without type declarations
import { createProposal } from '../../../../lib/proposalService';
// @ts-ignore - JS module without type declarations
import { createDay } from '../../../../lib/scheduleSelector/dayHelpers';
// @ts-ignore - JS module without type declarations
import { fetchInformationalTexts } from '../../../../lib/informationalTextsFetcher';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse days-selected URL parameter into Day objects
 * @param {string|null} daysParam - Comma-separated day indices (0-6)
 * @returns {Day[]} Array of Day objects
 */
function parseUrlDays(daysParam) {
  if (!daysParam) return [];
  
  try {
    const dayIndices = daysParam.split(',').map(d => parseInt(d.trim(), 10));
    return dayIndices
      .filter(d => d >= 0 && d <= 6)
      .map(dayIndex => createDay(dayIndex, true));
  } catch (e) {
    logger.warn('[useViewSplitLeaseLogic] Failed to parse days-selected:', e);
    return [];
  }
}

/**
 * Get initial state from URL parameters
 * @returns {object} Initial state object
 */
function getInitialStateFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);

  // Check localStorage for last selected reservation span
  const savedReservationSpan = localStorage.getItem('sl_last_reservation_span');
  const defaultReservationSpan = savedReservationSpan ? parseInt(savedReservationSpan) : 13;

  console.log('[ViewSplitLease] 🔍 Reservation Span Initialization:', {
    savedReservationSpan,
    defaultReservationSpan,
    urlParam: urlParams.get('reservation-span'),
    finalValue: parseInt(urlParams.get('reservation-span')) || defaultReservationSpan
  });

  return {
    daysSelected: parseUrlDays(urlParams.get('days-selected')),
    moveInDate: urlParams.get('move-in') || null,
    reservationSpan: parseInt(urlParams.get('reservation-span')) || defaultReservationSpan
  };
}

/**
 * Calculate smart move-in date based on selected days
 * @param {number[]} dayNumbers - Array of day indices (0-6)
 * @param {string} minDate - Minimum allowed date (YYYY-MM-DD)
 * @returns {string} Calculated move-in date (YYYY-MM-DD)
 */
function calculateSmartMoveInDate(dayNumbers, minDate) {
  if (!dayNumbers || dayNumbers.length === 0) {
    return minDate;
  }

  const sortedDays = [...dayNumbers].sort((a, b) => a - b);
  const firstDayOfWeek = sortedDays[0];
  
  const minDateObj = new Date(minDate);
  const minDayOfWeek = minDateObj.getDay();
  
  const daysToAdd = (firstDayOfWeek - minDayOfWeek + 7) % 7;
  
  if (daysToAdd === 0) {
    return minDate;
  }
  
  const smartDate = new Date(minDateObj);
  smartDate.setDate(minDateObj.getDate() + daysToAdd);
  
  return smartDate.toISOString().split('T')[0];
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useViewSplitLeaseLogic(options: UseViewSplitLeaseLogicOptions = {}) {
  const { mode = 'view', listingId: customListingId } = options;
  
  // ==========================================================================
  // AUTH (JWT-based)
  // ==========================================================================
  
  const {
    user: authenticatedUser,
    userId: authUserId,
    isLoading: authLoading,
    isAuthenticated
  } = useAuthenticatedUser();
  
  // ==========================================================================
  // STATE: Reducer (core data + booking + proposal + user + UI)
  // ==========================================================================

  const urlState = useMemo(() => getInitialStateFromUrl(), []);

  const [state, dispatch] = useReducer(viewSplitLeaseReducer, urlState, createInitialState);

  // ==========================================================================
  // STATE: Modals (centralized via useModalManager)
  // ==========================================================================

  const modals = useModalManager();
  
  // Refs
  const mapRef = useRef(null);
  const hasAutoZoomedRef = useRef(false);
  
  // ==========================================================================
  // COMPUTED: Minimum Move-In Date
  // ==========================================================================
  
  const minMoveInDate = useMemo(() => {
    const today = new Date();
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  }, []);
  
  // ==========================================================================
  // COMPUTED: Price Breakdown (Memoized)
  // ==========================================================================
  
  const priceBreakdown = useMemo(() => {
    if (!state.listing || !state.zatConfig || state.selectedDayObjects.length === 0) {
      return null;
    }

    try {
      return calculatePricingBreakdown(
        state.selectedDayObjects,
        state.listing,
        state.reservationSpan,
        state.zatConfig
      );
    } catch (error) {
      logger.error('[useViewSplitLeaseLogic] Price calculation error:', error);
      return null;
    }
  }, [state.listing, state.zatConfig, state.selectedDayObjects, state.reservationSpan]);
  
  // ==========================================================================
  // COMPUTED: Validation
  // ==========================================================================
  
  const validationErrors = useMemo(() => {
    if (!state.listing || state.selectedDayObjects.length === 0) {
      return { hasErrors: false, errors: [] };
    }

    return validateScheduleSelection(state.selectedDayObjects, state.listing, {
      isStrictModeEnabled: state.isStrictModeEnabled,
      moveInDate: state.moveInDate,
      reservationSpan: state.reservationSpan
    });
  }, [state.listing, state.selectedDayObjects, state.isStrictModeEnabled, state.moveInDate, state.reservationSpan]);

  const isBookingValid = !validationErrors.hasErrors && priceBreakdown !== null && state.moveInDate !== null;
  
  // ==========================================================================
  // COMPUTED: Formatted Price Display
  // ==========================================================================
  
  const formattedPrice = useMemo(() => {
    if (!priceBreakdown) return '$0.00';
    return `$${priceBreakdown.pricePerNight.toFixed(2)}`;
  }, [priceBreakdown]);
  
  const formattedStartingPrice = useMemo(() => {
    if (!state.listing || !state.listing.starting_nightly_price) return '$0.00';
    return `$${parseFloat(state.listing.starting_nightly_price).toFixed(2)}`;
  }, [state.listing]);
  
  // ==========================================================================
  // EFFECTS: Responsive Detection
  // ==========================================================================
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    dispatch({ type: 'SET_MOBILE', payload: mediaQuery.matches });

    const handleResize = (e) => dispatch({ type: 'SET_MOBILE', payload: e.matches });
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);
  
  // ==========================================================================
  // EFFECTS: Data Fetching
  // ==========================================================================
  
  useEffect(() => {
    async function initialize() {
      try {
        // Determine listing ID based on mode
        const listingId = mode === 'preview' && customListingId
          ? customListingId
          : getListingIdFromUrl();
        
        if (!listingId) {
          throw new Error('No listing ID provided');
        }
        
        // Parallel fetch: listing, ZAT config, informational texts
        const [listingData, zatConfigData, infoTexts] = await Promise.all([
          fetchListingComplete(listingId),
          fetchZatPriceConfiguration(),
          fetchInformationalTexts()
        ]);
        
        dispatch({ type: 'INIT_SUCCESS', payload: { listing: listingData, zatConfig: zatConfigData, informationalTexts: infoTexts } });
        
        logger.debug(`[useViewSplitLeaseLogic] Initialized in ${mode} mode:`, {
          listingId,
          listingName: listingData.listing_title
        });
        
      } catch (err) {
        logger.error('[useViewSplitLeaseLogic] Initialization error:', err);
        dispatch({ type: 'INIT_ERROR', payload: err.message });
      }
    }
    
    initialize();
  }, [mode, customListingId]);
  
  // ==========================================================================
  // EFFECTS: Auth State Sync
  // ==========================================================================
  
  useEffect(() => {
    async function syncAuthState() {
      if (authLoading) return;
      
      if (!isAuthenticated || !authUserId) {
        dispatch({ type: 'CLEAR_USER_DATA' });
        return;
      }

      try {
        // Fetch user profile data
        const { data: userRecord, error: userError } = await supabase
          .from('user')
          .select('bio_text, stated_need_for_space_text, stated_special_needs_text')
          .eq('id', authUserId)
          .maybeSingle();

        if (userError) throw userError;

        // Build local variables for single dispatch
        let userData = null;
        let isFav = false;
        let existingProposal = null;

        if (userRecord) {
          userData = {
            userId: authUserId,
            aboutMe: userRecord.bio_text || '',
            needForSpace: userRecord.stated_need_for_space_text || '',
            specialNeeds: userRecord.stated_special_needs_text || ''
          };

          // Check if this listing is favorited (now stored on listing table)
          if (state.listing) {
            const { data: listingFavData } = await supabase
              .from('listing')
              .select('user_ids_who_favorited_json')
              .eq('id', state.listing.id)
              .maybeSingle();

            const favoritedUserIds = listingFavData?.user_ids_who_favorited_json || [];
            if (Array.isArray(favoritedUserIds)) {
              isFav = favoritedUserIds.includes(authUserId);
            }
          }
        }

        // Check for existing proposal
        if (state.listing) {
          const { data: proposals, error: proposalError } = await supabase
            .from('booking_proposal')
            .select('id')
            .eq('guest_user_id', authUserId)
            .eq('listing_id', state.listing.id)
            .limit(1);

          if (!proposalError && proposals && proposals.length > 0) {
            existingProposal = proposals[0];
          }
        }

        dispatch({ type: 'SET_USER_DATA', payload: {
          loggedInUserData: userData,
          existingProposal: existingProposal,
          isFavorited: isFav
        } });

      } catch (error) {
        logger.error('[useViewSplitLeaseLogic] Auth sync error:', error);
      }
    }

    syncAuthState();
  }, [authLoading, isAuthenticated, authUserId, state.listing]);
  
  // ==========================================================================
  // EFFECTS: Smart Move-In Date Calculation
  // ==========================================================================
  
  useEffect(() => {
    if (state.selectedDayObjects.length > 0 && !state.moveInDate) {
      const dayNumbers = state.selectedDayObjects.map(d => d.dayOfWeek);
      const smartDate = calculateSmartMoveInDate(dayNumbers, minMoveInDate);
      dispatch({ type: 'SET_MOVE_IN_DATE', payload: smartDate });
    }
  }, [state.selectedDayObjects, state.moveInDate, minMoveInDate]);
  
  // ==========================================================================
  // HANDLERS: Schedule Changes
  // ==========================================================================
  
  const handleScheduleChange = useCallback((dayObjects) => {
    dispatch({ type: 'UPDATE_SCHEDULE', payload: dayObjects });
    logger.debug('[useViewSplitLeaseLogic] Schedule changed:', dayObjects.map(d => d.name));
  }, []);
  
  const handleMoveInDateChange = useCallback((newDate) => {
    dispatch({ type: 'SET_MOVE_IN_DATE', payload: newDate });
    logger.debug('[useViewSplitLeaseLogic] Move-in date changed:', newDate);
  }, []);
  
  const handleReservationSpanChange = useCallback((newSpan) => {
    dispatch({ type: 'SET_RESERVATION_SPAN', payload: newSpan });
    // Persist last selected reservation span to localStorage
    localStorage.setItem('sl_last_reservation_span', String(newSpan));
    console.log('[ViewSplitLease] 💾 Saved reservation span to localStorage:', newSpan);
    logger.debug('[useViewSplitLeaseLogic] Reservation span changed:', newSpan);
  }, []);
  
  // ==========================================================================
  // HANDLERS: Modals (with Auth Gating)
  // ==========================================================================
  
  /**
   * Open Contact Host Modal
   * SECURITY FIX: Now requires authentication before opening
   */
  const handleOpenContactModal = useCallback(async () => {
    const isLoggedIn = await checkAuthStatus();

    if (!isLoggedIn) {
      modals.open('auth');
      logger.debug('[useViewSplitLeaseLogic] Contact blocked - user not authenticated');
      return;
    }

    modals.open('contactHost');
    logger.debug('[useViewSplitLeaseLogic] Opening contact modal');
  }, [modals]);

  const handleCloseContactModal = useCallback(() => {
    modals.close('contactHost');
  }, [modals]);

  const handleOpenProposalModal = useCallback(() => {
    if (!isBookingValid) {
      logger.warn('[useViewSplitLeaseLogic] Cannot open proposal modal - booking invalid');
      return;
    }

    // Reset submission state when opening modal to ensure fresh state
    dispatch({ type: 'PROPOSAL_SUBMIT_ERROR' });
    modals.open('proposal');
  }, [isBookingValid, modals]);

  const handleCloseProposalModal = useCallback(() => {
    modals.close('proposal');
  }, [modals]);

  const handlePhotoClick = useCallback((index) => {
    modals.open('photo', { index });
  }, [modals]);

  const handleClosePhotoModal = useCallback(() => {
    modals.close('photo');
  }, [modals]);

  const handleCloseSuccessModal = useCallback(() => {
    modals.close('success');
  }, [modals]);
  
  // ==========================================================================
  // HANDLERS: Proposal Submission (JWT-based)
  // ==========================================================================
  
  /**
   * Submit proposal via Edge Function
   * SECURITY: Uses authUserId from JWT, not session storage
   */
  const handleSubmitProposal = useCallback(async (proposalData) => {
    dispatch({ type: 'START_PROPOSAL_SUBMIT' });

    try {
      // SECURITY: Validate JWT-derived user ID
      if (!authUserId) {
        throw new Error('Authentication required. Please log in again.');
      }

      const result = await createProposal({
        guestId: authUserId,  // JWT-derived
        listingId: state.listing.id,
        moveInDate: proposalData.moveInDate,
        daysSelectedObjects: proposalData.daysSelectedObjects,
        reservationSpanWeeks: proposalData.reservationSpan || 13,
        pricing: {
          pricePerNight: proposalData.pricePerNight,
          pricePerFourWeeks: proposalData.pricePerFourWeeks,
          hostFourWeekCompensation: proposalData.hostFourWeekCompensation,
          totalPrice: proposalData.totalPrice
        },
        details: {
          needForSpace: proposalData.needForSpace,
          aboutMe: proposalData.aboutYourself,
          specialNeeds: proposalData.uniqueRequirements || '',
          moveInRangeText: proposalData.moveInRange || ''
        }
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Success
      modals.close('proposal');
      dispatch({ type: 'PROPOSAL_SUBMIT_SUCCESS', payload: { proposalId: result.proposalId } });
      modals.open('success', { proposalId: result.proposalId });

      logger.debug('[useViewSplitLeaseLogic] Proposal created:', result.proposalId);

      return { success: true, proposalId: result.proposalId };

    } catch (error) {
      logger.error('[useViewSplitLeaseLogic] Proposal submission error:', error);
      throw error;
    } finally {
      dispatch({ type: 'PROPOSAL_SUBMIT_ERROR' });
    }
  }, [authUserId, state.listing]);
  
  /**
   * Handle auth success when coming from auth modal
   */
  const handleAuthSuccess = useCallback(async () => {
    modals.close('auth');

    // If there's pending proposal data, submit it
    if (state.pendingProposalData) {
      await handleSubmitProposal(state.pendingProposalData);
    }
  }, [modals, state.pendingProposalData, handleSubmitProposal]);
  
  // ==========================================================================
  // HANDLERS: Favorites
  // ==========================================================================
  
  const handleToggleFavorite = useCallback(async () => {
    if (!authUserId || !state.listing) {
      modals.open('auth');
      return;
    }

    try {
      const newFavoriteState = !state.isFavorited;

      // Optimistic update
      dispatch({ type: 'TOGGLE_FAVORITE', payload: newFavoriteState });

      // Get current favorited user IDs from listing
      const { data: listingData, error: fetchError } = await supabase
        .from('listing')
        .select('user_ids_who_favorited_json')
        .eq('id', state.listing.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentFavoritedUsers = listingData?.user_ids_who_favorited_json || [];
      const newFavoritedUsers = newFavoriteState
        ? [...currentFavoritedUsers, authUserId]
        : currentFavoritedUsers.filter(id => id !== authUserId);

      // Update favorited users on listing
      const { error: updateError } = await supabase
        .from('listing')
        .update({ user_ids_who_favorited_json: newFavoritedUsers })
        .eq('id', state.listing.id);

      if (updateError) throw updateError;

      logger.debug('[useViewSplitLeaseLogic] Favorite toggled:', newFavoriteState);

    } catch (error) {
      // Rollback on error
      dispatch({ type: 'TOGGLE_FAVORITE', payload: !state.isFavorited });
      logger.error('[useViewSplitLeaseLogic] Failed to toggle favorite:', error);
    }
  }, [authUserId, state.listing, state.isFavorited]);
  
  // ==========================================================================
  // HANDLERS: Map
  // ==========================================================================
  
  const handleLoadMap = useCallback(() => {
    dispatch({ type: 'SET_SHOULD_LOAD_MAP' });
  }, []);
  
  // ==========================================================================
  // RETURN
  // ==========================================================================
  
  return {
    // Loading & Data
    isLoading: state.isLoading,
    error: state.error,
    listing: state.listing,
    zatConfig: state.zatConfig,
    informationalTexts: state.informationalTexts,

    // Auth & User
    isAuthenticated,
    authUserId,
    loggedInUserData: state.loggedInUserData,
    isFavorited: state.isFavorited,
    existingProposalForListing: state.existingProposalForListing,

    // Booking State
    selectedDayObjects: state.selectedDayObjects,
    moveInDate: state.moveInDate,
    reservationSpan: state.reservationSpan,
    isStrictModeEnabled: state.isStrictModeEnabled,

    // Computed Values
    minMoveInDate,
    priceBreakdown,
    validationErrors,
    isBookingValid,
    formattedPrice,
    formattedStartingPrice,

    // Modals (backward-compat aliases — consumer reads these)
    isProposalModalOpen: modals.isOpen('proposal'),
    showContactHostModal: modals.isOpen('contactHost'),
    showAuthModal: modals.isOpen('auth'),
    showPhotoModal: modals.isOpen('photo'),
    showSuccessModal: modals.isOpen('success'),
    currentPhotoIndex: modals.getData('photo')?.index ?? 0,
    successProposalId: modals.getData('success')?.proposalId ?? null,
    isSubmittingProposal: state.isSubmittingProposal,

    // UI State
    isMobile: state.isMobile,
    shouldLoadMap: state.shouldLoadMap,

    // Refs
    mapRef,
    hasAutoZoomedRef,

    // Handlers: Schedule
    handleScheduleChange,
    handleMoveInDateChange,
    handleReservationSpanChange,

    // Handlers: Modals
    handleOpenContactModal,
    handleCloseContactModal,
    handleOpenProposalModal,
    handleCloseProposalModal,
    handlePhotoClick,
    handleClosePhotoModal,
    handleCloseSuccessModal,

    // Handlers: Actions
    handleSubmitProposal,
    handleAuthSuccess,
    handleToggleFavorite,
    handleLoadMap,

    // Setters (for UI-only state overrides)
    setShowAuthModal: (val) => val ? modals.open('auth') : modals.close('auth'),
  };
}
