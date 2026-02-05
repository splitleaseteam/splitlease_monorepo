/**
 * Schedule Dashboard Logic Hook
 *
 * Contains ALL business logic for the Schedule Dashboard page.
 * Follows Hollow Component Pattern: Page component is pure rendering.
 *
 * Responsibilities:
 * - Extract leaseId from URL
 * - Fetch lease, roommate, and calendar data
 * - Manage calendar state (month navigation, night selection)
 * - Calculate flexibility score and net flow
 * - Handle buy out and swap actions
 * - Manage messaging state
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Extracted modules
import { toDateString } from './helpers/dateHelpers.js';
import {
  DEFAULT_NOTICE_MULTIPLIERS,
  EDGE_MULTIPLIERS,
  SHARING_MULTIPLIERS,
  getNoticeThresholdForDate,
  calculateSharePrice,
  calculateBuyoutPrice,
  calculatePriceForDate,
} from './helpers/priceCalculations.js';
import {
  MOCK_CURRENT_USER,
  MOCK_ROOMMATE,
  MOCK_FLEXIBILITY_METRICS,
  MOCK_USER_FLEXIBILITY_SCORE,
} from './data/mockData.js';
import {
  createDateChangeRequest,
  updateDateChangeRequestStatus,
} from '../../../lib/api/dateChangeRequests.js';
import { usePerspective } from './hooks/usePerspective.js';
import { useUIState } from './hooks/useUIState.js';
import { useRequestFlow } from './hooks/useRequestFlow.js';
import { usePricingStrategy } from './hooks/usePricingStrategy.js';
import { useScheduleState } from './state/useScheduleState.js';

// API imports for real data fetching
import { fetchLeaseById } from './api/scheduleDashboardApi.js';
import { supabase } from '../../../lib/supabase.js';

// Toast for user feedback
import { useToast } from '../../../islands/shared/Toast.jsx';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract leaseId from URL path
 * Route: /schedule/:leaseId
 */
function getLeaseIdFromUrl() {
  const pathSegments = window.location.pathname.split('/');
  return pathSegments[2] || null;
}

/**
 * Calculate flexibility score based on roommate's history
 * Returns 1-10 score
 */
function calculateFlexibilityScore(transactions) {
  if (!transactions || transactions.length === 0) return 5;

  const completed = transactions.filter(t => t.status === 'complete').length;
  const declined = transactions.filter(t => t.status === 'declined').length;
  const total = completed + declined;

  if (total === 0) return 5;

  const acceptanceRate = completed / total;
  return Math.round(acceptanceRate * 10);
}

/**
 * Calculate net flow from transactions
 * Positive = they've paid you more, Negative = you've paid them more
 */
function calculateNetFlow(transactions) {
  if (!transactions || transactions.length === 0) {
    return { amount: 0, direction: 'neutral', formatted: '$0.00' };
  }

  const completedTxns = transactions.filter(t => t.status === 'complete' && t.type === 'buyout');

  let netAmount = 0;
  for (const txn of completedTxns) {
    if (txn.direction === 'outgoing') {
      netAmount -= txn.amount; // You paid them
    } else if (txn.direction === 'incoming') {
      netAmount += txn.amount; // They paid you
    }
  }

  return {
    amount: Math.abs(netAmount),
    direction: netAmount > 0 ? 'positive' : netAmount < 0 ? 'negative' : 'neutral',
    formatted: netAmount >= 0 ? `+$${Math.abs(netAmount).toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useScheduleDashboardLogic() {
  // -------------------------------------------------------------------------
  // URL PARAMS & PERSPECTIVE (Dev Scaffolding)
  // -------------------------------------------------------------------------
  const [leaseId] = useState(() => getLeaseIdFromUrl());
  const perspectiveUserId = usePerspective();
  const isSwappedPerspective = perspectiveUserId !== 'current-user';

  // Determine who is "me" and who is "roommate" based on perspective
  const [currentUserData, roommateData] = useMemo(() => {
    if (isSwappedPerspective) {
      // Viewing as Sarah → Sarah is "current user", Alex is "roommate"
      return [MOCK_ROOMMATE, MOCK_CURRENT_USER];
    }
    // Default: Alex is "current user", Sarah is "roommate"
    return [MOCK_CURRENT_USER, MOCK_ROOMMATE];
  }, [isSwappedPerspective]);

  // -------------------------------------------------------------------------
  // EXTRACTED HOOKS
  // -------------------------------------------------------------------------
  const ui = useUIState();
  const request = useRequestFlow();
  const pricing = usePricingStrategy();
  const { showToast } = useToast();
  const scheduleState = useScheduleState({
    currentUserId: currentUserData._id,
    roommateId: roommateData._id
  });

  // -------------------------------------------------------------------------
  // LOADING & ERROR STATE
  // -------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // -------------------------------------------------------------------------
  // CORE DATA
  // -------------------------------------------------------------------------
  const [lease, setLease] = useState(null);
  const [roommate, setRoommate] = useState(null);
  const [selectedNight, setSelectedNight] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));

  // Pending date change requests state
  const [pendingDateChangeRequests, setPendingDateChangeRequests] = useState([]);

  // NOTE: Pricing strategy state (pricingStrategy, isSavingPreferences) now in usePricingStrategy hook

  // -------------------------------------------------------------------------
  // DERIVED STATE
  // -------------------------------------------------------------------------
  const currentUserId = currentUserData?._id || 'current-user';
  const processedTransactions = scheduleState.processedTransactions;

  const isNightLocked = useCallback((nightString) => {
    if (!nightString) return false;
    return scheduleState.pendingNights.includes(nightString);
  }, [scheduleState.pendingNights]);

  const flexibilityScore = useMemo(
    () => calculateFlexibilityScore(processedTransactions),
    [processedTransactions]
  );

  const netFlow = useMemo(
    () => calculateNetFlow(processedTransactions),
    [processedTransactions]
  );

  const transactionsByDate = useMemo(() => {
    const map = {};
    processedTransactions.forEach((transaction) => {
      if (!transaction?.date) return;
      const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
      if (Number.isNaN(date.getTime())) return;
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
      map[dateKey] = transaction;
    });
    return map;
  }, [processedTransactions]);

  const responsePatterns = useMemo(() => {
    // Placeholder - would calculate from actual response times
    return 'Usually responds within 2 hours';
  }, []);

  // User's own flexibility score (mock data for now)
  const userFlexibilityScore = MOCK_USER_FLEXIBILITY_SCORE;

  // Flexibility metrics breakdown for comparison
  const flexibilityMetrics = MOCK_FLEXIBILITY_METRICS;

  // Base price for selected night - USE ROOMMATE'S STRATEGY when buying out
  const basePrice = useMemo(() => {
    if (!selectedNight) return null;

    // If buying a roommate's night, use THEIR pricing strategy
    if (scheduleState.roommateNights?.includes(selectedNight)) {
      // Calculate price using roommate's pricing strategy
      if (roommate?.pricingStrategy) {
        const roommateStrategy = roommate.pricingStrategy;
        const baseCost = roommateStrategy.baseRate;
        const noticeMultipliers = roommateStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

        const date = new Date(selectedNight + 'T12:00:00');
        if (!Number.isNaN(date.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayOfWeek = date.getDay();
          const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

          // Tier 2: Notice multiplier (from roommate's settings)
          const noticeThreshold = getNoticeThresholdForDate(daysDiff);
          const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;

          // Tier 3: Edge multiplier (from roommate's settings)
          const edgeMultiplier = EDGE_MULTIPLIERS[roommateStrategy.edgePreference]?.[dayOfWeek] || 1.0;

          // Calculate final price using ROOMMATE's formula
          return Math.round(baseCost * noticeMultiplier * edgeMultiplier);
        }
      }

      // Fallback to roommate's base rate if available
      if (roommate?.pricingStrategy?.baseRate) {
        return roommate.pricingStrategy.baseRate;
      }
    }

    // Fallback to lease rate
    return lease?.nightlyRate || null;
  }, [selectedNight, scheduleState.roommateNights, roommate, lease]);

  // List of US holidays (simplified - could be expanded)
  const holidays = useMemo(() => {
    const year = new Date().getFullYear();
    return [
      `${year}-01-01`, // New Year's Day
      `${year}-07-04`, // Independence Day
      `${year}-12-25`, // Christmas
      `${year}-12-31`, // New Year's Eve
      `${year + 1}-01-01`, // Next New Year's Day
      `${year + 1}-02-14`, // Valentine's Day
    ];
  }, []);

  // Computed suggested prices for visualization (next 14 days) - 3-Tier Model
  const computedSuggestedPrices = useMemo(() => {
    const prices = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tier 1: Base cost from pricing strategy
    const baseCost = pricing.pricingStrategy.baseRate;
    const noticeMultipliers = pricing.pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = toDateString(date);
      const dayOfWeek = date.getDay();

      const factors = [];

      // Tier 2: Notice multiplier (based on days until date)
      const noticeThreshold = getNoticeThresholdForDate(i);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;
      if (noticeMultiplier !== 1.0) {
        factors.push(`Notice ${noticeMultiplier}x (${noticeThreshold})`);
      }

      // Tier 3: Edge multiplier (based on day of week)
      const edgeMultiplier = EDGE_MULTIPLIERS[pricing.pricingStrategy.edgePreference][dayOfWeek] || 1.0;
      if (edgeMultiplier !== 1.0) {
        factors.push(`Edge ${edgeMultiplier}x`);
      }

      // Calculate final price: Base * Notice * Edge
      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      prices.push({
        date: dateStr,
        suggestedPrice: price,
        factors: factors.length > 0 ? factors : ['Base cost'],
        noticeThreshold,
        edgeMultiplier
      });
    }

    return prices;
  }, [pricing.pricingStrategy]);

  // Price overlays for calendar (maps user's nights to price/tier) - 3-Tier Model
  const priceOverlays = useMemo(() => {
    if (!scheduleState.userNights || scheduleState.userNights.length === 0) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tier 1: Base cost from pricing strategy
    const baseCost = pricing.pricingStrategy.baseRate;
    const noticeMultipliers = pricing.pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of scheduleState.userNights) {
      const date = new Date(nightStr + 'T12:00:00');
      if (Number.isNaN(date.getTime())) continue;

      const dayOfWeek = date.getDay();
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

      // Tier 2: Notice multiplier
      const noticeThreshold = getNoticeThresholdForDate(daysDiff);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;

      // Tier 3: Edge multiplier
      const edgeMultiplier = EDGE_MULTIPLIERS[pricing.pricingStrategy.edgePreference][dayOfWeek] || 1.0;

      // Calculate final price
      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      // Determine tier based on notice threshold (for visual styling)
      let tier = 'within';
      if (noticeThreshold === 'emergency' || noticeThreshold === 'disruptive') {
        tier = 'limit'; // High urgency = red
      } else if (noticeThreshold === 'inconvenient') {
        tier = 'near'; // Medium urgency = yellow
      }

      overlays[nightStr] = {
        price,
        tier,
        noticeThreshold,
        edgeMultiplier
      };
    }

    return Object.keys(overlays).length > 0 ? overlays : null;
  }, [scheduleState.userNights, pricing.pricingStrategy]);

  // =========================================================================
  // ROOMMATE PRICE OVERLAYS (for Date Changes view)
  // Uses ROOMMATE's pricing strategy, NOT the current user's
  // =========================================================================
  const roommatePriceOverlays = useMemo(() => {
    // Only compute if we have roommate nights and roommate has pricing strategy
    if (!scheduleState.roommateNights || scheduleState.roommateNights.length === 0) return null;
    if (!roommate?.pricingStrategy) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use ROOMMATE's pricing strategy (NOT user's)
    const roommateStrategy = roommate.pricingStrategy;
    const baseCost = roommateStrategy.baseRate;
    const noticeMultipliers = roommateStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of scheduleState.roommateNights) {
      const date = new Date(nightStr + 'T12:00:00');
      if (Number.isNaN(date.getTime())) continue;

      const dayOfWeek = date.getDay();
      const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

      // Skip past dates
      if (daysDiff < 0) continue;

      // Tier 2: Notice multiplier (from roommate's settings)
      const noticeThreshold = getNoticeThresholdForDate(daysDiff);
      const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;

      // Tier 3: Edge multiplier (from roommate's settings)
      const edgeMultiplier = EDGE_MULTIPLIERS[roommateStrategy.edgePreference]?.[dayOfWeek] || 1.0;

      // Calculate final price using ROOMMATE's formula
      const price = Math.round(baseCost * noticeMultiplier * edgeMultiplier);

      // Determine tier for styling
      let tier = 'within';
      if (noticeThreshold === 'emergency' || noticeThreshold === 'disruptive') {
        tier = 'limit';
      } else if (noticeThreshold === 'inconvenient') {
        tier = 'near';
      }

      overlays[nightStr] = {
        price,
        tier,
        noticeThreshold,
        edgeMultiplier
      };
    }

    return Object.keys(overlays).length > 0 ? overlays : null;
  }, [scheduleState.roommateNights, roommate?.pricingStrategy]);

  // Computed price examples for Live Preview section - 3-Tier Model
  // Shows example prices for Mon/Wed/Fri at 14 days notice (standard threshold)
  const computedExamples = useMemo(() => {
    const baseCost = pricing.pricingStrategy.baseRate;
    const { edgePreference } = pricing.pricingStrategy;
    const noticeMultipliers = pricing.pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;
    const noticeThreshold = 'standard';
    const noticeMultiplier = noticeMultipliers[noticeThreshold] ?? 1.0;

    // Calculate example prices for different days
    // Monday (day 1)
    const monEdge = EDGE_MULTIPLIERS[edgePreference][1] || 1.0;
    const monday = Math.round(baseCost * noticeMultiplier * monEdge);

    // Wednesday (day 3)
    const wedEdge = EDGE_MULTIPLIERS[edgePreference][3] || 1.0;
    const wednesday = Math.round(baseCost * noticeMultiplier * wedEdge);

    // Friday (day 5)
    const friEdge = EDGE_MULTIPLIERS[edgePreference][5] || 1.0;
    const friday = Math.round(baseCost * noticeMultiplier * friEdge);

    // Calculate min/max across all days and notice levels
    const allPrices = [];
    Object.values(noticeMultipliers).forEach(nm => {
      Object.values(EDGE_MULTIPLIERS[edgePreference]).forEach(em => {
        allPrices.push(Math.round(baseCost * nm * em));
      });
    });
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    return {
      monday,
      wednesday,
      friday,
      baseCost,
      noticeMultiplier,
      noticeThreshold,
      edgePreference,
      minPrice,
      maxPrice
    };
  }, [pricing.pricingStrategy]);

  // -------------------------------------------------------------------------
  // AUTO-OPEN BUY OUT DRAWER WHEN NIGHT SELECTED
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (selectedNight && !ui.isBuyOutOpen) {
      ui.setIsBuyOutOpen(true);
    }
  }, [selectedNight, ui.isBuyOutOpen, ui.setIsBuyOutOpen]);

  // -------------------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!leaseId) {
      setError('No lease ID provided');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadLeaseData() {
      try {
        setIsLoading(true);
        setError(null);

        const leaseData = await fetchLeaseById(leaseId);
        if (!isMounted) return;

        setLease(leaseData);
        setRoommate(leaseData?.getRoommate ? leaseData.getRoommate(currentUserId) : null);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load lease');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeaseData();

    return () => {
      isMounted = false;
    };
  }, [leaseId, currentUserId]);

  // -------------------------------------------------------------------------
  // ADJACENCY DETECTION
  // -------------------------------------------------------------------------

  /**
   * Check if a night is adjacent (contiguous) to any of the user's existing nights.
   * Used to determine default request type: Buyout for contiguous, Share for isolated.
   */
  const isNightContiguous = useCallback((nightString) => {
    if (!scheduleState.userNights || scheduleState.userNights.length === 0) return false;

    const targetDate = new Date(nightString + 'T12:00:00');
    const dayBefore = toDateString(new Date(targetDate.getTime() - 86400000));
    const dayAfter = toDateString(new Date(targetDate.getTime() + 86400000));

    return scheduleState.userNights.includes(dayBefore) || scheduleState.userNights.includes(dayAfter);
  }, [scheduleState.userNights]);

  // Sync requestType with defaultRequestType when default changes
  useEffect(() => {
    request.setRequestType(request.defaultRequestType);
  }, [request.defaultRequestType, request.setRequestType]);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Handle night selection from calendar
   * Sets default request type based on adjacency to user's nights
   */
  const handleSelectNight = useCallback((dateString) => {
    // Validate it's a roommate night (not user's own or blocked)
    if (scheduleState.roommateNights.includes(dateString) && !scheduleState.pendingNights.includes(dateString)) {
      if (isNightLocked(dateString)) {
        throw new Error('This night is part of another pending request.');
      }
      setSelectedNight(dateString);

      // Reset swap mode when selecting a new night
      request.setIsSwapMode(false);
      request.setSwapOfferNight(null);

      // Determine default request type based on adjacency
      const isContiguous = isNightContiguous(dateString);
      request.setDefaultRequestType(isContiguous ? 'buyout' : 'share');

      // Open the request panel
      ui.setIsBuyOutOpen(true);
    }
  }, [scheduleState.roommateNights, scheduleState.pendingNights, isNightLocked, isNightContiguous, ui, request]);

  /**
   * Handle buy out request
   * @param {string} message - Optional message to include with request
   * @param {number} totalPrice - Total price including fees (from BuyOutPanel)
   */
  const handleBuyOut = useCallback(async (message, totalPrice) => {
    if (!selectedNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const nightDate = new Date(selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'buyout',
        nights: [nightDate],
        amount: finalAmount,
        payerId: currentUserId,
        payeeId: roommate?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Requested to buy out ${formattedNightDate} for $${finalAmount.toFixed(2)}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'buyout',
          nights: [nightDate],
          amount: finalAmount,
          offeredPrice: finalAmount,
          suggestedPrice: basePrice || 0,
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight]
      });

      setSelectedNight(null);
      return true;
    } catch (err) {
      console.error('Failed to create buyout request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [selectedNight, request.isSubmitting, scheduleState.roommateNights, scheduleState.actions, isNightLocked, currentUserId, roommate, basePrice, request]);

  /**
   * Handle share request - request to co-occupy a night with roommate
   * @param {string} message - Optional message to include with request
   * @param {number} totalPrice - Total price including fees
   */
  const handleShareRequest = useCallback(async (message, totalPrice) => {
    if (!selectedNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const nightDate = new Date(selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'share',
        nights: [nightDate],
        amount: finalAmount,
        payerId: currentUserId,
        payeeId: roommate?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Requested to share ${formattedNightDate} for $${finalAmount.toFixed(2)}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'share',
          nights: [nightDate],
          amount: finalAmount,
          offeredPrice: finalAmount,
          suggestedPrice: basePrice || 0,
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight]
      });

      setSelectedNight(null);
      return true;
    } catch (err) {
      console.error('Failed to create share request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [selectedNight, request.isSubmitting, scheduleState.roommateNights, scheduleState.actions, isNightLocked, currentUserId, roommate, basePrice, request]);

  /**
   * Handle request type change (toggle between buyout, share, swap)
   */
  const handleRequestTypeChange = useCallback((newType) => {
    if (newType === 'swap') {
      request.setIsSwapMode(true);
      request.setRequestType('swap');
    } else {
      request.setIsSwapMode(false);
      request.setIsCounterMode(false);
      request.setCounteringRequestId(null);
      request.setCounterOriginalNight(null);
      request.setCounterTargetNight(null);
      request.setSwapOfferNight(null);
      request.setRequestType(newType);
    }
  }, [request]);

  /**
   * Handle swap instead action - Enter swap mode
   */
  const handleSwapInstead = useCallback(() => {
    if (!selectedNight) return;
    request.setIsSwapMode(true);
    request.setIsCounterMode(false);
    // Keep selectedNight as the "requested" night (roommate's night)
    console.log('Entering swap mode for:', selectedNight);
  }, [selectedNight, request]);

  /**
   * Handle selecting a night to offer in swap
   */
  const handleSelectSwapOffer = useCallback((nightString) => {
    // Validate it's the user's night and not already pending
    if (scheduleState.userNights.includes(nightString) && !scheduleState.pendingNights.includes(nightString)) {
      if (isNightLocked(nightString)) {
        throw new Error('This night is part of another pending request.');
      }
      request.setSwapOfferNight(nightString);
    }
  }, [scheduleState.userNights, scheduleState.pendingNights, isNightLocked, request]);

  const handleSelectCounterNight = useCallback((nightString) => {
    if (scheduleState.roommateNights.includes(nightString) && !scheduleState.pendingNights.includes(nightString)) {
      request.setCounterTargetNight(nightString);
    }
  }, [scheduleState.roommateNights, scheduleState.pendingNights, request]);

  /**
   * Handle submitting a swap request
   * @param {string} message - Optional message to include with request
   */
  const handleSubmitSwapRequest = useCallback(async (message) => {
    if (!selectedNight || !request.swapOfferNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (!scheduleState.userNights.includes(request.swapOfferNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight) || isNightLocked(request.swapOfferNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const requestedDate = new Date(selectedNight + 'T12:00:00');
      const offeredDate = new Date(request.swapOfferNight + 'T12:00:00');

      const formattedRequested = requestedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const formattedOffered = offeredDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'swap',
        nights: [requestedDate, offeredDate],
        amount: 0,
        payerId: currentUserId,
        payeeId: roommate?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Offered to swap ${formattedOffered} for ${formattedRequested}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'swap',
          nights: [requestedDate, offeredDate],
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight, request.swapOfferNight]
      });

      setSelectedNight(null);
      request.setSwapOfferNight(null);
      request.setIsSwapMode(false);

      return true;
    } catch (err) {
      console.error('Failed to create swap request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [selectedNight, request.swapOfferNight, request.isSubmitting, scheduleState.roommateNights, scheduleState.userNights, scheduleState.actions, isNightLocked, currentUserId, roommate, request]);

  /**
   * Handle canceling swap mode - return to buyout mode
   */
  const handleCancelSwapMode = useCallback(() => {
    request.setIsSwapMode(false);
    request.setSwapOfferNight(null);
  }, [request]);

  const handleCancelCounterMode = useCallback(() => {
    request.setIsCounterMode(false);
    request.setCounteringRequestId(null);
    request.setCounterOriginalNight(null);
    request.setCounterTargetNight(null);
  }, [request]);

  /**
   * Handle cancel selection
   */
  const handleCancel = useCallback(() => {
      setSelectedNight(null);
    request.setSwapOfferNight(null);
    request.setIsSwapMode(false);
    request.setIsCounterMode(false);
    request.setCounteringRequestId(null);
    request.setCounterOriginalNight(null);
    request.setCounterTargetNight(null);
  }, [request]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    scheduleState.actions.sendMessage(text);
  }, [scheduleState.actions]);

  const handleAcceptRequest = useCallback(async (requestId) => {
    const message = scheduleState.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? scheduleState.transactions.find((t) => t.id === transactionId)
      : scheduleState.transactions.find(
          (t) =>
            t.type === message.requestData.type &&
            t.status === 'pending' &&
            JSON.stringify(t.nights) === JSON.stringify(message.requestData.nights)
        );

    if (!transaction) return;
    scheduleState.actions.acceptRequest({ requestId, transaction });
  }, [scheduleState.messages, scheduleState.transactions, scheduleState.actions]);

  const handleDeclineRequest = useCallback(async (requestId) => {
    const message = scheduleState.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? scheduleState.transactions.find((t) => t.id === transactionId)
      : scheduleState.transactions.find(
          (t) =>
            t.type === message.requestData.type &&
            t.status === 'pending' &&
            JSON.stringify(t.nights) === JSON.stringify(message.requestData.nights)
        );

    if (!transaction) return;
    scheduleState.actions.declineRequest({ requestId, transaction });
  }, [scheduleState.messages, scheduleState.transactions, scheduleState.actions]);

  const handleCounterRequest = useCallback(async (requestId) => {
    const message = scheduleState.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? scheduleState.transactions.find((t) => t.id === transactionId)
      : scheduleState.transactions.find(
          (t) =>
            t.type === message.requestData.type &&
            t.status === 'pending' &&
            JSON.stringify(t.nights) === JSON.stringify(message.requestData.nights)
        );

    if (!transaction || transaction.status !== 'pending') return;

    const nightTheyWant = message.requestData.nights?.[0];
    if (!nightTheyWant) return;

    request.setCounteringRequestId(requestId);
    request.setCounterOriginalNight(nightTheyWant);
    request.setCounterTargetNight(null);
    request.setIsCounterMode(true);
    request.setIsSwapMode(false);
    ui.setIsBuyOutOpen(true);
    setSelectedNight(null);
  }, [scheduleState.messages, scheduleState.transactions, ui, request]);

  const handleSubmitCounter = useCallback(async (messageText) => {
    if (!request.counteringRequestId || !request.counterOriginalNight || !request.counterTargetNight || request.isSubmitting) return;

    try {
      request.setIsSubmitting(true);

      await handleDeclineRequest(request.counteringRequestId);

      const giveDate = typeof request.counterOriginalNight === 'string'
        ? new Date(request.counterOriginalNight + 'T12:00:00')
        : request.counterOriginalNight;
      const receiveDate = typeof request.counterTargetNight === 'string'
        ? new Date(request.counterTargetNight + 'T12:00:00')
        : request.counterTargetNight;

      const formattedGive = giveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedReceive = receiveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'swap',
        nights: [giveDate, receiveDate],
        amount: 0,
        payerId: currentUserId,
        payeeId: roommate?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `You sent a counter-offer: Swap ${formattedGive} for ${formattedReceive}.`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'swap',
          nights: [giveDate, receiveDate],
          transactionId: newTransaction.id,
          message: messageText || ''
        }
      };
      const pendingStrings = [request.counterOriginalNight, request.counterTargetNight]
        .map((night) => toDateString(night))
        .filter(Boolean);

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: pendingStrings
      });

      request.setIsCounterMode(false);
      request.setCounteringRequestId(null);
      request.setCounterOriginalNight(null);
      request.setCounterTargetNight(null);

      return true;
    } catch (err) {
      console.error('Failed to create counter swap request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [request.counteringRequestId, request.counterOriginalNight, request.counterTargetNight, request.isSubmitting, roommate, handleDeclineRequest, request, scheduleState.actions]);

  const handleCancelRequest = useCallback(async (transactionId) => {
    const transaction = scheduleState.transactions.find((t) => t.id === transactionId);
    if (!transaction) return;
    const requestMessage = scheduleState.messages.find(
      (msg) => msg.requestData?.transactionId === transactionId
    );
    scheduleState.actions.cancelRequest({
      requestId: requestMessage?.id,
      transaction
    });
  }, [scheduleState.transactions, scheduleState.messages, scheduleState.actions]);

  const handleViewTransactionDetails = useCallback(async (transactionId) => {
    ui.handleSelectTransaction(transactionId);
    console.log('Viewing transaction details:', transactionId);
    // TODO: Fetch detailed history/thread if needed
  }, [ui]);

  /**
   * Handle creating a date change request
   * @param {Object} payload - Request payload with listOfOldDates, listOfNewDates, reason
   */
  const handleCreateDateChangeRequest = useCallback(async (payload) => {
    try {
      request.setIsSubmitting(true);

      await createDateChangeRequest({
        leaseId: lease?._id,
        ...payload
      });

      // Show success toast
      showToast({
        title: 'Request Sent',
        content: 'Your date change request has been submitted.',
        type: 'success'
      });

      // Refresh pending requests
      // TODO: Implement refreshDateChangeRequests when API is ready
      // For now, just close the panel
      setSelectedNight(null);
      ui.closeBuyOut();

      return true;
    } catch (err) {
      console.error('Failed to create date change request:', err);

      // Show error toast
      showToast({
        title: 'Error',
        content: err.message || 'Failed to submit date change request.',
        type: 'error'
      });

      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [lease, request, showToast, ui]);

  /**
   * Handle month navigation
   */
  const handleMonthChange = useCallback((newMonth) => {
    setCurrentMonth(newMonth);
  }, []);

  /**
   * Update a single pricing strategy field
   */
  const handlePricingStrategyChange = useCallback((key, value) => {
    pricing.setPricingStrategy(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Save pricing strategy to localStorage
   */
  const handleSavePricingStrategy = useCallback(async () => {
    try {
      pricing.setIsSavingPreferences(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('pricingStrategy', JSON.stringify(pricing.pricingStrategy));
      // TODO: Also save to backend when API is available
    } catch (err) {
      console.error('Failed to save pricing strategy:', err);
    } finally {
      pricing.setIsSavingPreferences(false);
    }
  }, [pricing.pricingStrategy]);

  /**
   * Reset pricing strategy to defaults
   */
  const handleResetPricingStrategy = useCallback(() => {
    const defaults = {
      baseRate: 150,
      noticeMultipliers: DEFAULT_NOTICE_MULTIPLIERS,
      edgePreference: 'neutral',
      sharingWillingness: 'standard'
    };
    pricing.setPricingStrategy(defaults);
  }, []);

  /**
   * Handle page refresh
   */
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    window.location.reload();
  }, []);

  // Note: handleCreateDateChangeRequest with toast support is defined above

  const handleUpdateDateChangeRequestStatus = useCallback(async (requestId, status) => {
    // TODO: Implement proper API call
    console.log('Updating date change request status:', requestId, status);
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // Loading & Error
    isLoading,
    error,
    isSubmitting: request.isSubmitting,

    // Core Data
    lease,
    roommate,

    // Perspective (Dev Scaffolding)
    isSwappedPerspective,
    currentUserData,

    // Calendar (using string dates)
    userNights: scheduleState.userNights,
    roommateNights: scheduleState.roommateNights,
    pendingNights: scheduleState.pendingNights,
    blockedNights: scheduleState.blockedNights,
    currentMonth,

    // Selection
    selectedNight,
    counterOriginalNight: request.counterOriginalNight,
    counterTargetNight: request.counterTargetNight,
    basePrice,

    // Swap Mode
    isSwapMode: request.isSwapMode,
    swapOfferNight: request.swapOfferNight,

    // Request Type (Buyout vs Share vs Swap)
    requestType: request.requestType,
    defaultRequestType: request.defaultRequestType,

    // Shared Nights (co-occupancy)
    sharedNights: scheduleState.sharedNights,

    // Counter Mode
    isCounterMode: request.isCounterMode,

    // Drawer States
    isBuyOutOpen: ui.isBuyOutOpen,
    isChatOpen: ui.isChatOpen,

    // Modal States
    isFlexibilityModalOpen: ui.isFlexibilityModalOpen,

    // Dashboard Mode
    dashboardMode: ui.dashboardMode,

    // Roommate Profile
    flexibilityScore,
    userFlexibilityScore,
    flexibilityMetrics,
    responsePatterns,
    netFlow,

    // Messaging
    messages: scheduleState.messages,
    currentUserId,
    isSending: false,

    // Transaction History
    transactions: processedTransactions,
    activeTransactionId: ui.activeTransactionId,
    transactionsByDate,

    // Date Change Requests
    pendingDateChangeRequests,

    // Pricing Strategy (3-Tier Model)
    pricingStrategy: pricing.pricingStrategy,
    isBuyoutSettingsOpen: ui.isBuyoutSettingsOpen,
    isSavingPreferences: pricing.isSavingPreferences,
    computedSuggestedPrices,
    priceOverlays,
    roommatePriceOverlays,
    computedExamples,

    // Handlers
    handleSelectNight,
    handleBuyOut,
    handleShareRequest,
    handleRequestTypeChange,
    handleSwapInstead,
    handleSelectSwapOffer,
    handleSubmitSwapRequest,
    handleCancelSwapMode,
    handleSelectCounterNight,
    handleSubmitCounter,
    handleCancelCounterMode,
    handleCancel,
    handleSendMessage,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCounterRequest,
    handleCancelRequest,
    handleViewTransactionDetails,
    handleSelectTransaction: ui.handleSelectTransaction,
    handleMonthChange,
    handleRefresh,
    handleCreateDateChangeRequest,
    handleUpdateDateChangeRequestStatus,
    handleToggleBuyOut: ui.handleToggleBuyOut,
    handleToggleChat: ui.handleToggleChat,
    handleOpenFlexibilityModal: ui.handleOpenFlexibilityModal,
    handleCloseFlexibilityModal: ui.handleCloseFlexibilityModal,
    handleClearActiveTransaction: ui.handleClearActiveTransaction,
    handleToggleBuyoutSettings: ui.handleToggleBuyoutSettings,
    handlePricingStrategyChange,
    handleSavePricingStrategy,
    handleResetPricingStrategy,
    handleSwitchMode: ui.handleSwitchMode
  };
}
