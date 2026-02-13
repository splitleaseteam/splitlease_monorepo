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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    loading: authLoading,
    isAuthenticated
  } = useAuthenticatedUser();
  
  // ==========================================================================
  // STATE: Core Data
  // ==========================================================================
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listing, setListing] = useState(null);
  const [zatConfig, setZatConfig] = useState(null);
  const [informationalTexts, setInformationalTexts] = useState({});
  
  // ==========================================================================
  // STATE: Booking Widget
  // ==========================================================================
  
  const initialState = useMemo(() => getInitialStateFromUrl(), []);
  
  const [selectedDayObjects, setSelectedDayObjects] = useState(initialState.daysSelected);
  const [moveInDate, setMoveInDate] = useState(initialState.moveInDate);
  const [reservationSpan, setReservationSpan] = useState(initialState.reservationSpan);
  const [strictMode, setStrictMode] = useState(false);
  
  // ==========================================================================
  // STATE: Modals
  // ==========================================================================
  
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [showContactHostModal, setShowContactHostModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [pendingProposalData, setPendingProposalData] = useState(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successProposalId, setSuccessProposalId] = useState(null);
  
  // ==========================================================================
  // STATE: User Data
  // ==========================================================================
  
  const [loggedInUserData, setLoggedInUserData] = useState(null);
  const [existingProposalForListing, setExistingProposalForListing] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // ==========================================================================
  // STATE: UI
  // ==========================================================================
  
  const [isMobile, setIsMobile] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  
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
    if (!listing || !zatConfig || selectedDayObjects.length === 0) {
      return null;
    }
    
    try {
      return calculatePricingBreakdown(
        selectedDayObjects,
        listing,
        reservationSpan,
        zatConfig
      );
    } catch (error) {
      logger.error('[useViewSplitLeaseLogic] Price calculation error:', error);
      return null;
    }
  }, [listing, zatConfig, selectedDayObjects, reservationSpan]);
  
  // ==========================================================================
  // COMPUTED: Validation
  // ==========================================================================
  
  const validationErrors = useMemo(() => {
    if (!listing || selectedDayObjects.length === 0) {
      return { hasErrors: false, errors: [] };
    }
    
    return validateScheduleSelection(selectedDayObjects, listing, {
      strictMode,
      moveInDate,
      reservationSpan
    });
  }, [listing, selectedDayObjects, strictMode, moveInDate, reservationSpan]);
  
  const isBookingValid = !validationErrors.hasErrors && priceBreakdown !== null && moveInDate !== null;
  
  // ==========================================================================
  // COMPUTED: Formatted Price Display
  // ==========================================================================
  
  const formattedPrice = useMemo(() => {
    if (!priceBreakdown) return '$0.00';
    return `$${priceBreakdown.pricePerNight.toFixed(2)}`;
  }, [priceBreakdown]);
  
  const formattedStartingPrice = useMemo(() => {
    if (!listing || !listing.starting_nightly_price) return '$0.00';
    return `$${parseFloat(listing.starting_nightly_price).toFixed(2)}`;
  }, [listing]);
  
  // ==========================================================================
  // EFFECTS: Responsive Detection
  // ==========================================================================
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    setIsMobile(mediaQuery.matches);
    
    const handleResize = (e) => setIsMobile(e.matches);
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
        
        setListing(listingData);
        setZatConfig(zatConfigData);
        setInformationalTexts(infoTexts);
        setLoading(false);
        
        logger.debug(`[useViewSplitLeaseLogic] Initialized in ${mode} mode:`, {
          listingId,
          listingName: listingData.listing_title
        });
        
      } catch (err) {
        logger.error('[useViewSplitLeaseLogic] Initialization error:', err);
        setError(err.message);
        setLoading(false);
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
        setLoggedInUserData(null);
        setIsFavorited(false);
        setExistingProposalForListing(null);
        return;
      }
      
      try {
        // Fetch user profile data
        const { data: userRecord, error: userError } = await supabase
          .from('user')
          .select('bio_text, stated_need_for_space_text, stated_special_needs_text')
          .eq('id', authUserId)
          .single();

        if (userError) throw userError;

        // Set user data
        if (userRecord) {
          setLoggedInUserData({
            userId: authUserId,
            aboutMe: userRecord.bio_text || '',
            needForSpace: userRecord.stated_need_for_space_text || '',
            specialNeeds: userRecord.stated_special_needs_text || ''
          });

          // Check if this listing is favorited (now stored on listing table)
          if (listing) {
            const { data: listingFavData } = await supabase
              .from('listing')
              .select('user_ids_who_favorited_json')
              .eq('id', listing.id)
              .single();

            const favoritedUserIds = listingFavData?.user_ids_who_favorited_json || [];
            if (Array.isArray(favoritedUserIds)) {
              setIsFavorited(favoritedUserIds.includes(authUserId));
            }
          }
        }

        // Check for existing proposal
        if (listing) {
          const { data: proposals, error: proposalError } = await supabase
            .from('booking_proposal')
            .select('id')
            .eq('guest_user_id', authUserId)
            .eq('listing_id', listing.id)
            .limit(1);
          
          if (!proposalError && proposals && proposals.length > 0) {
            setExistingProposalForListing(proposals[0]);
          }
        }
        
      } catch (error) {
        logger.error('[useViewSplitLeaseLogic] Auth sync error:', error);
      }
    }
    
    syncAuthState();
  }, [authLoading, isAuthenticated, authUserId, listing]);
  
  // ==========================================================================
  // EFFECTS: Smart Move-In Date Calculation
  // ==========================================================================
  
  useEffect(() => {
    if (selectedDayObjects.length > 0 && !moveInDate) {
      const dayNumbers = selectedDayObjects.map(d => d.dayOfWeek);
      const smartDate = calculateSmartMoveInDate(dayNumbers, minMoveInDate);
      setMoveInDate(smartDate);
    }
  }, [selectedDayObjects, moveInDate, minMoveInDate]);
  
  // ==========================================================================
  // HANDLERS: Schedule Changes
  // ==========================================================================
  
  const handleScheduleChange = useCallback((dayObjects) => {
    setSelectedDayObjects(dayObjects);
    logger.debug('[useViewSplitLeaseLogic] Schedule changed:', dayObjects.map(d => d.name));
  }, []);
  
  const handleMoveInDateChange = useCallback((newDate) => {
    setMoveInDate(newDate);
    logger.debug('[useViewSplitLeaseLogic] Move-in date changed:', newDate);
  }, []);
  
  const handleReservationSpanChange = useCallback((newSpan) => {
    setReservationSpan(newSpan);
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
      setShowAuthModal(true);
      logger.debug('[useViewSplitLeaseLogic] Contact blocked - user not authenticated');
      return;
    }
    
    setShowContactHostModal(true);
    logger.debug('[useViewSplitLeaseLogic] Opening contact modal');
  }, []);
  
  const handleCloseContactModal = useCallback(() => {
    setShowContactHostModal(false);
  }, []);
  
  const handleOpenProposalModal = useCallback(() => {
    if (!isBookingValid) {
      logger.warn('[useViewSplitLeaseLogic] Cannot open proposal modal - booking invalid');
      return;
    }
    
    // Reset submission state when opening modal to ensure fresh state
    setIsSubmittingProposal(false);
    setIsProposalModalOpen(true);
  }, [isBookingValid]);
  
  const handleCloseProposalModal = useCallback(() => {
    setIsProposalModalOpen(false);
  }, []);
  
  const handlePhotoClick = useCallback((index) => {
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  }, []);
  
  const handleClosePhotoModal = useCallback(() => {
    setShowPhotoModal(false);
  }, []);
  
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessProposalId(null);
  }, []);
  
  // ==========================================================================
  // HANDLERS: Proposal Submission (JWT-based)
  // ==========================================================================
  
  /**
   * Submit proposal via Edge Function
   * SECURITY: Uses authUserId from JWT, not session storage
   */
  const handleSubmitProposal = useCallback(async (proposalData) => {
    setIsSubmittingProposal(true);
    
    try {
      // SECURITY: Validate JWT-derived user ID
      if (!authUserId) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const result = await createProposal({
        guestId: authUserId,  // JWT-derived
        listingId: listing.id,
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
      setIsProposalModalOpen(false);
      setPendingProposalData(null);
      setExistingProposalForListing({ id: result.proposalId });
      setSuccessProposalId(result.proposalId);
      setShowSuccessModal(true);
      
      logger.debug('[useViewSplitLeaseLogic] Proposal created:', result.proposalId);
      
      return { success: true, proposalId: result.proposalId };
      
    } catch (error) {
      logger.error('[useViewSplitLeaseLogic] Proposal submission error:', error);
      throw error;
    } finally {
      setIsSubmittingProposal(false);
    }
  }, [authUserId, listing]);
  
  /**
   * Handle auth success when coming from auth modal
   */
  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);
    
    // If there's pending proposal data, submit it
    if (pendingProposalData) {
      await handleSubmitProposal(pendingProposalData);
    }
  }, [pendingProposalData, handleSubmitProposal]);
  
  // ==========================================================================
  // HANDLERS: Favorites
  // ==========================================================================
  
  const handleToggleFavorite = useCallback(async () => {
    if (!authUserId || !listing) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const newFavoriteState = !isFavorited;
      
      // Optimistic update
      setIsFavorited(newFavoriteState);
      
      // Get current favorited user IDs from listing
      const { data: listingData, error: fetchError } = await supabase
        .from('listing')
        .select('user_ids_who_favorited_json')
        .eq('id', listing.id)
        .single();

      if (fetchError) throw fetchError;

      const currentFavoritedUsers = listingData?.user_ids_who_favorited_json || [];
      const newFavoritedUsers = newFavoriteState
        ? [...currentFavoritedUsers, authUserId]
        : currentFavoritedUsers.filter(id => id !== authUserId);

      // Update favorited users on listing
      const { error: updateError } = await supabase
        .from('listing')
        .update({ user_ids_who_favorited_json: newFavoritedUsers })
        .eq('id', listing.id);
      
      if (updateError) throw updateError;
      
      logger.debug('[useViewSplitLeaseLogic] Favorite toggled:', newFavoriteState);
      
    } catch (error) {
      // Rollback on error
      setIsFavorited(!isFavorited);
      logger.error('[useViewSplitLeaseLogic] Failed to toggle favorite:', error);
    }
  }, [authUserId, listing, isFavorited]);
  
  // ==========================================================================
  // HANDLERS: Map
  // ==========================================================================
  
  const handleLoadMap = useCallback(() => {
    setShouldLoadMap(true);
  }, []);
  
  // ==========================================================================
  // RETURN
  // ==========================================================================
  
  return {
    // Loading & Data
    loading,
    error,
    listing,
    zatConfig,
    informationalTexts,
    
    // Auth & User
    isAuthenticated,
    authUserId,
    loggedInUserData,
    isFavorited,
    existingProposalForListing,
    
    // Booking State
    selectedDayObjects,
    moveInDate,
    reservationSpan,
    strictMode,
    
    // Computed Values
    minMoveInDate,
    priceBreakdown,
    validationErrors,
    isBookingValid,
    formattedPrice,
    formattedStartingPrice,
    
    // Modals
    isProposalModalOpen,
    showContactHostModal,
    showAuthModal,
    showPhotoModal,
    showSuccessModal,
    currentPhotoIndex,
    successProposalId,
    isSubmittingProposal,
    
    // UI State
    isMobile,
    shouldLoadMap,
    
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
    setShowAuthModal,
    setStrictMode,
    setShouldLoadMap
  };
}
