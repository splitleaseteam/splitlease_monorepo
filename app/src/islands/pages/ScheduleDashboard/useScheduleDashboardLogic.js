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
import { toDateString, toDateStrings } from './helpers/dateHelpers.js';
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
  MOCK_LEASE,
  MOCK_ROOMMATE,
  MOCK_MESSAGES,
  MOCK_TRANSACTIONS,
  MOCK_FLEXIBILITY_METRICS,
  MOCK_USER_FLEXIBILITY_SCORE,
} from './data/mockData.js';
import {
  fetchUserNights,
  fetchRoommateNights,
  fetchPendingRequests,
  fetchBlockedDates,
  sendMessage,
  createBuyoutRequest,
} from './api/scheduleDashboardApi.js';
import { useUIState } from './hooks/useUIState.js';
import { useCalendarState } from './hooks/useCalendarState.js';
import { useRequestFlow } from './hooks/useRequestFlow.js';
import { useMessaging } from './hooks/useMessaging.js';
import { useTransactions } from './hooks/useTransactions.js';
import { usePricingStrategy } from './hooks/usePricingStrategy.js';

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
  // URL PARAMS
  // -------------------------------------------------------------------------
  const [leaseId] = useState(() => getLeaseIdFromUrl());

  // -------------------------------------------------------------------------
  // EXTRACTED HOOKS
  // -------------------------------------------------------------------------
  const ui = useUIState();
  const calendar = useCalendarState();
  const request = useRequestFlow();
  const messaging = useMessaging();
  const txn = useTransactions();
  const pricing = usePricingStrategy();

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

  // NOTE: Messaging state (messages, isSending) now in useMessaging hook
  // NOTE: Transaction state (transactions) now in useTransactions hook
  // NOTE: Pricing strategy state (pricingStrategy, isSavingPreferences) now in usePricingStrategy hook

  // -------------------------------------------------------------------------
  // DERIVED STATE
  // -------------------------------------------------------------------------
  const currentUserId = 'current-user';
  const flexibilityScore = useMemo(
    () => calculateFlexibilityScore(txn.transactions),
    [txn.transactions]
  );

  const netFlow = useMemo(
    () => calculateNetFlow(txn.transactions),
    [txn.transactions]
  );

  const transactionsByDate = useMemo(() => {
    const map = {};
    txn.transactions.forEach((transaction) => {
      if (!transaction?.date) return;
      const date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
      if (Number.isNaN(date.getTime())) return;
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
      map[dateKey] = transaction;
    });
    return map;
  }, [txn.transactions]);

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
    if (!calendar.selectedNight) return null;

    // If buying a roommate's night, use THEIR pricing strategy
    if (calendar.roommateNights?.includes(calendar.selectedNight)) {
      // Calculate price using roommate's pricing strategy
      if (roommate?.pricingStrategy) {
        const roommateStrategy = roommate.pricingStrategy;
        const baseCost = roommateStrategy.baseRate;
        const noticeMultipliers = roommateStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

        const date = new Date(calendar.selectedNight + 'T12:00:00');
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
  }, [calendar.selectedNight, calendar.roommateNights, roommate, lease]);

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
    if (!calendar.userNights || calendar.userNights.length === 0) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tier 1: Base cost from pricing strategy
    const baseCost = pricing.pricingStrategy.baseRate;
    const noticeMultipliers = pricing.pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of calendar.userNights) {
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
  }, [calendar.userNights, pricing.pricingStrategy]);

  // =========================================================================
  // ROOMMATE PRICE OVERLAYS (for Date Changes view)
  // Uses ROOMMATE's pricing strategy, NOT the current user's
  // =========================================================================
  const roommatePriceOverlays = useMemo(() => {
    // Only compute if we have roommate nights and roommate has pricing strategy
    if (!calendar.roommateNights || calendar.roommateNights.length === 0) return null;
    if (!roommate?.pricingStrategy) return null;

    const overlays = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use ROOMMATE's pricing strategy (NOT user's)
    const roommateStrategy = roommate.pricingStrategy;
    const baseCost = roommateStrategy.baseRate;
    const noticeMultipliers = roommateStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

    for (const nightStr of calendar.roommateNights) {
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
  }, [calendar.roommateNights, roommate?.pricingStrategy]);

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
    if (calendar.selectedNight && !ui.isBuyOutOpen) {
      ui.setIsBuyOutOpen(true);
    }
  }, [calendar.selectedNight, ui.isBuyOutOpen, ui.setIsBuyOutOpen]);

  // -------------------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Load core data (mock for now)
        setLease(MOCK_LEASE);
        setRoommate(MOCK_ROOMMATE);

        // Fetch calendar data using stub functions
        const [userNightsData, roommateNightsData, pendingData, blockedData] = await Promise.all([
          fetchUserNights(leaseId, 'current-user'),
          fetchRoommateNights(leaseId, MOCK_ROOMMATE._id),
          fetchPendingRequests(leaseId),
          fetchBlockedDates(leaseId)
        ]);

        calendar.setUserNights(userNightsData);
        calendar.setRoommateNights(roommateNightsData);
        calendar.setPendingNights(pendingData);
        calendar.setBlockedNights(blockedData);

        // Load messages and transactions (mock for now)
        messaging.setMessages(MOCK_MESSAGES);
        txn.setTransactions(MOCK_TRANSACTIONS);

        // Set initial month to current lease period
        calendar.setCurrentMonth(new Date(2026, 1, 1)); // February 2026 for mock data

      } catch (err) {
        console.error('Failed to load schedule data:', err);
        setError(err.message || 'Failed to load schedule data');
      } finally {
        setIsLoading(false);
      }
    }

    if (leaseId) {
      loadData();
    } else {
      setError('No lease ID provided');
      setIsLoading(false);
    }
  }, [leaseId]);

  // -------------------------------------------------------------------------
  // ADJACENCY DETECTION
  // -------------------------------------------------------------------------

  /**
   * Check if a night is adjacent (contiguous) to any of the user's existing nights.
   * Used to determine default request type: Buyout for contiguous, Share for isolated.
   */
  const isNightContiguous = useCallback((nightString) => {
    if (!calendar.userNights || calendar.userNights.length === 0) return false;

    const targetDate = new Date(nightString + 'T12:00:00');
    const dayBefore = toDateString(new Date(targetDate.getTime() - 86400000));
    const dayAfter = toDateString(new Date(targetDate.getTime() + 86400000));

    return calendar.userNights.includes(dayBefore) || calendar.userNights.includes(dayAfter);
  }, [calendar.userNights]);

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
    if (calendar.roommateNights.includes(dateString) && !calendar.pendingNights.includes(dateString)) {
      calendar.setSelectedNight(dateString);

      // Reset swap mode when selecting a new night
      request.setIsSwapMode(false);
      request.setSwapOfferNight(null);

      // Determine default request type based on adjacency
      const isContiguous = isNightContiguous(dateString);
      request.setDefaultRequestType(isContiguous ? 'buyout' : 'share');

      // Open the request panel
      ui.setIsBuyOutOpen(true);
    }
  }, [calendar.roommateNights, calendar.pendingNights, isNightContiguous, ui, request, calendar]);

  /**
   * Handle buy out request
   * @param {string} message - Optional message to include with request
   * @param {number} totalPrice - Total price including fees (from BuyOutPanel)
   */
  const handleBuyOut = useCallback(async (message, totalPrice) => {
    if (!calendar.selectedNight || request.isSubmitting) return;

    try {
      request.setIsSubmitting(true);

      // Create the buyout request
      await createBuyoutRequest({
        leaseId,
        nightDate: calendar.selectedNight,
        message,
        basePrice: lease?.nightlyRate
      });

      // Add to pending requests
      calendar.setPendingNights(prev => [...prev, calendar.selectedNight]);

      // Parse the night date for display and data
      const nightDate = new Date(calendar.selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;

      // Create new pending transaction for Transaction History
      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'buyout',
        nights: [nightDate],
        amount: finalAmount,
        direction: 'outgoing',
        status: 'pending',
        counterparty: roommate?.firstName ? `${roommate.firstName} ${roommate.lastName?.charAt(0) || ''}.` : 'Roommate'
      };

      // Add transaction to top of list (optimistic update)
      txn.setTransactions(prev => [newTransaction, ...prev]);

      // Create chat message for the request
      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        senderName: 'You',
        text: `Requested to buy out ${formattedNightDate} for $${finalAmount.toFixed(2)}`,
        timestamp: new Date(),
        type: 'request',
        requestData: {
          type: 'buyout',
          nights: [nightDate],
          amount: finalAmount,
          transactionId: newTransaction.id
        }
      };

      // Add message to chat thread
      messaging.setMessages(prev => [...prev, requestMessage]);

      console.log('Created buyout transaction:', newTransaction);
      console.log('Created buyout chat message:', requestMessage);

      // Clear selection
      calendar.setSelectedNight(null);

      // Return success (component will show success state)
      return true;

    } catch (err) {
      console.error('Failed to create buyout request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [calendar.selectedNight, request.isSubmitting, leaseId, lease, roommate, basePrice, calendar, request]);

  /**
   * Handle share request - request to co-occupy a night with roommate
   * @param {string} message - Optional message to include with request
   * @param {number} totalPrice - Total price including fees
   */
  const handleShareRequest = useCallback(async (message, totalPrice) => {
    if (!calendar.selectedNight || request.isSubmitting) return;

    try {
      request.setIsSubmitting(true);

      // Add to pending requests
      calendar.setPendingNights(prev => [...prev, calendar.selectedNight]);

      // Parse the night date for display and data
      const nightDate = new Date(calendar.selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;

      // Create new pending transaction for Transaction History
      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'share', // Share type instead of buyout
        nights: [nightDate],
        amount: finalAmount,
        direction: 'outgoing',
        status: 'pending',
        counterparty: roommate?.firstName ? `${roommate.firstName} ${roommate.lastName?.charAt(0) || ''}.` : 'Roommate'
      };

      // Add transaction to top of list (optimistic update)
      txn.setTransactions(prev => [newTransaction, ...prev]);

      // Create chat message for the request
      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        senderName: 'You',
        text: `Requested to share ${formattedNightDate} for $${finalAmount.toFixed(2)}`,
        timestamp: new Date(),
        type: 'request',
        requestData: {
          type: 'share',
          nights: [nightDate],
          amount: finalAmount,
          transactionId: newTransaction.id
        }
      };

      // Add message to chat thread
      messaging.setMessages(prev => [...prev, requestMessage]);

      console.log('Created share transaction:', newTransaction);
      console.log('Created share chat message:', requestMessage);

      // Clear selection
      calendar.setSelectedNight(null);

      // Return success (component will show success state)
      return true;

    } catch (err) {
      console.error('Failed to create share request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [calendar.selectedNight, request.isSubmitting, roommate, basePrice, calendar, request]);

  /**
   * Handle request type change (toggle between buyout, share, swap)
   */
  const handleRequestTypeChange = useCallback((newType) => {
    if (newType === 'swap') {
      request.setIsSwapMode(true);
      request.setRequestType('swap');
    } else {
      request.setIsSwapMode(false);
      request.setSwapOfferNight(null);
      request.setRequestType(newType);
    }
  }, [request]);

  /**
   * Handle swap instead action - Enter swap mode
   */
  const handleSwapInstead = useCallback(() => {
    if (!calendar.selectedNight) return;
    request.setIsSwapMode(true);
    request.setIsCounterMode(false);
    // Keep selectedNight as the "requested" night (roommate's night)
    console.log('Entering swap mode for:', calendar.selectedNight);
  }, [calendar.selectedNight, request]);

  /**
   * Handle selecting a night to offer in swap
   */
  const handleSelectSwapOffer = useCallback((nightString) => {
    // Validate it's the user's night and not already pending
    if (calendar.userNights.includes(nightString) && !calendar.pendingNights.includes(nightString)) {
      request.setSwapOfferNight(nightString);
    }
  }, [calendar.userNights, calendar.pendingNights, request]);

  const handleSelectCounterNight = useCallback((nightString) => {
    if (calendar.roommateNights.includes(nightString) && !calendar.pendingNights.includes(nightString)) {
      request.setCounterTargetNight(nightString);
    }
  }, [calendar.roommateNights, calendar.pendingNights, request]);

  /**
   * Handle submitting a swap request
   * @param {string} message - Optional message to include with request
   */
  const handleSubmitSwapRequest = useCallback(async (message) => {
    if (!calendar.selectedNight || !request.swapOfferNight || request.isSubmitting) return;

    try {
      request.setIsSubmitting(true);

      // Parse dates for display and data
      const requestedDate = new Date(calendar.selectedNight + 'T12:00:00');
      const offeredDate = new Date(request.swapOfferNight + 'T12:00:00');

      const formattedRequested = requestedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const formattedOffered = offeredDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      // 1. Create Transaction
      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'swap',
        nights: [requestedDate, offeredDate], // [Their night, Your night]
        amount: 0,
        direction: null, // Swap has no direction
        status: 'pending',
        counterparty: roommate?.firstName
          ? `${roommate.firstName} ${roommate.lastName?.charAt(0) || ''}.`
          : 'Roommate'
      };
      txn.setTransactions(prev => [newTransaction, ...prev]);

      // 2. Mark both nights as pending
      calendar.setPendingNights(prev => [...prev, calendar.selectedNight, request.swapOfferNight]);

      // 3. Create Chat Message
      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        senderName: 'You',
        text: `Offered to swap ${formattedOffered} for ${formattedRequested}`,
        timestamp: new Date(),
        type: 'request',
        requestData: {
          type: 'swap',
          nights: [requestedDate, offeredDate],
          transactionId: newTransaction.id
        }
      };
      messaging.setMessages(prev => [...prev, requestMessage]);

      console.log('Created swap transaction:', newTransaction);
      console.log('Created swap chat message:', requestMessage);

      // 4. Reset State
      calendar.setSelectedNight(null);
      request.setSwapOfferNight(null);
      request.setIsSwapMode(false);

      return true;

    } catch (err) {
      console.error('Failed to create swap request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [calendar.selectedNight, request.swapOfferNight, request.isSubmitting, roommate, calendar, request]);

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
    calendar.setSelectedNight(null);
    request.setSwapOfferNight(null);
    request.setIsSwapMode(false);
    request.setIsCounterMode(false);
    request.setCounteringRequestId(null);
    request.setCounterOriginalNight(null);
    request.setCounterTargetNight(null);
  }, [calendar, request]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || messaging.isSending) return;

    try {
      messaging.setIsSending(true);
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        text: text,
        timestamp: new Date(),
        type: 'message'
      };

      messaging.setMessages(prev => [...prev, newMessage]);

      // TODO: Call API to send message
      await sendMessage(leaseId, text);

    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      messaging.setIsSending(false);
    }
  }, [currentUserId, messaging.isSending, leaseId, messaging]);

  const handleAcceptRequest = useCallback(async (requestId) => {
    const message = messaging.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? txn.transactions.find((t) => t.id === transactionId)
      : txn.transactions.find(
          (t) =>
            t.type === message.requestData.type &&
            t.status === 'pending' &&
            JSON.stringify(t.nights) === JSON.stringify(message.requestData.nights)
        );

    if (!transaction) return;

    // Update transaction status
    txn.setTransactions((prev) =>
      prev.map((txn) =>
        txn.id === transaction.id ? { ...txn, status: 'complete' } : txn
      )
    );

    // Remove pending nights
    const nights = transaction.nights || message.requestData.nights || [];
    const nightStrings = nights.map((night) => toDateString(night)).filter(Boolean);
    if (nightStrings.length > 0) {
      calendar.setPendingNights((prev) => prev.filter((night) => !nightStrings.includes(night)));
    }

    // Update ownership based on transaction type
    if (transaction.type === 'buyout') {
      if (transaction.direction === 'incoming') {
        // Roommate buys from me: I lose the night
        calendar.setUserNights((prev) => prev.filter((night) => !nightStrings.includes(night)));
        calendar.setRoommateNights((prev) => Array.from(new Set([...prev, ...nightStrings])));
      } else if (transaction.direction === 'outgoing') {
        // I buy from roommate: I gain the night
        calendar.setRoommateNights((prev) => prev.filter((night) => !nightStrings.includes(night)));
        calendar.setUserNights((prev) => Array.from(new Set([...prev, ...nightStrings])));
      }
    } else if (transaction.type === 'swap') {
      // Swap ownership of nights based on current ownership
      calendar.setUserNights((prev) => {
        let updated = [...prev];
        nightStrings.forEach((night) => {
          if (prev.includes(night)) {
            updated = updated.filter((n) => n !== night);
          } else if (calendar.roommateNights.includes(night)) {
            updated = Array.from(new Set([...updated, night]));
          }
        });
        return updated;
      });

      calendar.setRoommateNights((prev) => {
        let updated = [...prev];
        nightStrings.forEach((night) => {
          if (prev.includes(night)) {
            updated = updated.filter((n) => n !== night);
          } else if (calendar.userNights.includes(night)) {
            updated = Array.from(new Set([...updated, night]));
          }
        });
        return updated;
      });
    } else if (transaction.type === 'share') {
      // Share requests do NOT transfer ownership
      // Both users have access to the night (co-occupancy)
      // Add to sharedNights for visual indication
      calendar.setSharedNights((prev) => Array.from(new Set([...prev, ...nightStrings])));
    }

    // Add chat notification
    messaging.setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        text: 'You accepted the request.',
        timestamp: new Date(),
        type: 'message'
      }
    ]);
  }, [messaging.messages, txn.transactions, currentUserId, calendar.roommateNights, calendar.userNights, calendar, txn, messaging]);

  const handleDeclineRequest = useCallback(async (requestId) => {
    const message = messaging.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? txn.transactions.find((t) => t.id === transactionId)
      : txn.transactions.find(
          (t) =>
            t.type === message.requestData.type &&
            t.status === 'pending' &&
            JSON.stringify(t.nights) === JSON.stringify(message.requestData.nights)
        );

    if (!transaction) return;

    txn.setTransactions((prev) =>
      prev.map((txn) =>
        txn.id === transaction.id ? { ...txn, status: 'declined' } : txn
      )
    );

    const nights = transaction.nights || message.requestData.nights || [];
    const nightStrings = nights.map((night) => toDateString(night)).filter(Boolean);
    if (nightStrings.length > 0) {
      calendar.setPendingNights((prev) => prev.filter((night) => !nightStrings.includes(night)));
    }

    messaging.setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        text: 'You declined the request.',
        timestamp: new Date(),
        type: 'message'
      }
    ]);
  }, [messaging.messages, txn.transactions, currentUserId, txn, messaging, calendar]);

  const handleCounterRequest = useCallback(async (requestId) => {
    const message = messaging.messages.find((msg) => msg.id === requestId);
    if (!message || !message.requestData) return;

    const transactionId = message.requestData.transactionId;
    const transaction = transactionId
      ? txn.transactions.find((t) => t.id === transactionId)
      : txn.transactions.find(
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
    calendar.setSelectedNight(null);
  }, [messaging.messages, txn.transactions, ui, request, calendar]);

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
        direction: null,
        status: 'pending',
        counterparty: roommate?.firstName
          ? `${roommate.firstName} ${roommate.lastName?.charAt(0) || ''}.`
          : 'Roommate'
      };
      txn.setTransactions((prev) => [newTransaction, ...prev]);

      const pendingStrings = [request.counterOriginalNight, request.counterTargetNight]
        .map((night) => toDateString(night))
        .filter(Boolean);
      if (pendingStrings.length > 0) {
        calendar.setPendingNights((prev) => Array.from(new Set([...prev, ...pendingStrings])));
      }

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'current-user',
        senderName: 'You',
        text: `You sent a counter-offer: Swap ${formattedGive} for ${formattedReceive}.`,
        timestamp: new Date(),
        type: 'request',
        requestData: {
          type: 'swap',
          nights: [giveDate, receiveDate],
          transactionId: newTransaction.id,
          message: messageText || ''
        }
      };
      messaging.setMessages((prev) => [...prev, requestMessage]);

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
  }, [request.counteringRequestId, request.counterOriginalNight, request.counterTargetNight, request.isSubmitting, roommate, handleDeclineRequest, request, calendar]);

  const handleCancelRequest = useCallback(async (transactionId) => {
    const transaction = txn.transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    txn.setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, status: 'cancelled' } : t
      )
    );

    const nights = transaction.nights || [];
    const nightStrings = nights.map((night) => toDateString(night)).filter(Boolean);
    if (nightStrings.length > 0) {
      calendar.setPendingNights((prev) => prev.filter((night) => !nightStrings.includes(night)));
    }

    messaging.setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        text: 'You cancelled the request.',
        timestamp: new Date(),
        type: 'message'
      }
    ]);
  }, [txn.transactions, currentUserId, txn, calendar, messaging]);

  const handleViewTransactionDetails = useCallback(async (transactionId) => {
    console.log('Viewing transaction details:', transactionId);
    // TODO: Fetch detailed history/thread if needed
  }, []);

  /**
   * Handle month navigation
   */
  const handleMonthChange = useCallback((newMonth) => {
    calendar.setCurrentMonth(newMonth);
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

    // Calendar (using string dates)
    userNights: calendar.userNights,
    roommateNights: calendar.roommateNights,
    pendingNights: calendar.pendingNights,
    blockedNights: calendar.blockedNights,
    currentMonth: calendar.currentMonth,

    // Selection
    selectedNight: calendar.selectedNight,
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
    sharedNights: calendar.sharedNights,

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
    messages: messaging.messages,
    currentUserId,
    isSending: messaging.isSending,

    // Transaction History
    transactions: txn.transactions,
    activeTransactionId: ui.activeTransactionId,
    transactionsByDate,

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
