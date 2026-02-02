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
import {
  calculateSuggestedBuyoutPrice,
  calculateBuyoutPricesForDates,
} from '../../../logic/calculators/buyout/calculateNoticePricing.js';

// ============================================================================
// DATE HELPERS
// ============================================================================

/**
 * Convert Date to YYYY-MM-DD string
 */
function toDateString(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert array of Dates to array of date strings
 */
function toDateStrings(dates) {
  if (!dates || !Array.isArray(dates)) return [];
  return dates.map(d => toDateString(d));
}

// ============================================================================
// DATA FETCHING STUBS (Replace with real API calls)
// ============================================================================

/**
 * Fetch user's nights for this lease
 * @param {string} leaseId - The lease ID
 * @param {string} userId - The current user's ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
async function fetchUserNights(leaseId, userId) {
  // TODO: Replace with real API call
  // Query calendar_stays where user_id = userId AND lease_id = leaseId
  console.log('[API Stub] fetchUserNights:', { leaseId, userId });

  // Mock data - February 2026
  return [
    '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05',
    '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12',
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19'
  ];
}

/**
 * Fetch roommate's nights for this lease
 * @param {string} leaseId - The lease ID
 * @param {string} roommateId - The roommate's user ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
async function fetchRoommateNights(leaseId, roommateId) {
  // TODO: Replace with real API call
  // Query calendar_stays where user_id = roommateId AND lease_id = leaseId
  console.log('[API Stub] fetchRoommateNights:', { leaseId, roommateId });

  // Mock data - February 2026
  return [
    '2026-02-06', '2026-02-07', '2026-02-08',
    '2026-02-13', '2026-02-14', '2026-02-15',
    '2026-02-20', '2026-02-21', '2026-02-22',
    '2026-02-27', '2026-02-28'
  ];
}

/**
 * Fetch pending date change requests for this lease
 * @param {string} leaseId - The lease ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
async function fetchPendingRequests(leaseId) {
  // TODO: Replace with real API call
  // Query date_change_requests where lease_id = leaseId AND status = 'pending'
  console.log('[API Stub] fetchPendingRequests:', { leaseId });

  // Mock data - one pending request for Valentine's Day
  return ['2026-02-14'];
}

/**
 * Fetch blocked/unavailable dates for this lease
 * @param {string} leaseId - The lease ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
async function fetchBlockedDates(leaseId) {
  // TODO: Replace with real API call
  // Query blocked_dates or unavailable periods
  console.log('[API Stub] fetchBlockedDates:', { leaseId });
  return [];
}

/**
 * Fetch chat messages for this lease
 * @param {string} leaseId - The lease ID
 * @returns {Promise<object[]>} Message objects
 */
async function fetchChatMessages(leaseId) {
  // TODO: Replace with real API call
  // Query messaging_thread where lease_id = leaseId
  // Order by timestamp ASC
  console.log('[API Stub] fetchChatMessages:', { leaseId });
  return [];
}

/**
 * Fetch transaction history for this lease
 * @param {string} leaseId - The lease ID
 * @returns {Promise<object[]>} Transaction objects
 */
async function fetchTransactions(leaseId) {
  // TODO: Replace with real API call
  // Query date_change_requests where lease_id = leaseId
  // Include related payment_records for amounts
  // Order by created_at DESC
  console.log('[API Stub] fetchTransactions:', { leaseId });
  return [];
}

/**
 * Send a chat message
 * @param {string} leaseId - The lease ID
 * @param {string} text - Message text
 */
async function sendMessage(leaseId, text) {
  // TODO: Replace with real API call
  // Insert into messaging_thread
  console.log('[API Stub] sendMessage:', { leaseId, text });
}

/**
 * Create a buyout request
 * @param {object} params - Request parameters
 * @returns {Promise<object>} Created request
 */
async function createBuyoutRequest({ leaseId, nightDate, message, basePrice }) {
  // TODO: Replace with real API call
  console.log('[API Stub] createBuyoutRequest:', { leaseId, nightDate, message, basePrice });

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: `request-${Date.now()}`,
    leaseId,
    nightDate,
    message,
    basePrice,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_LEASE = {
  _id: 'lease-123',
  propertyName: 'Modern 2BR in Williamsburg',
  propertyAddress: '150 Bedford Ave, Brooklyn, NY 11211',
  startDate: '2025-01-01',
  endDate: '2025-06-30',
  nightlyRate: 175
};

const MOCK_ROOMMATE = {
  _id: 'user-456',
  firstName: 'Sarah',
  lastName: 'Chen',
  avatarUrl: null,
  email: 'sarah.c@example.com'
};

const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    senderId: 'user-456',
    senderName: 'Sarah',
    text: 'Hey! Would you be interested in swapping Feb 14th? I have Valentine\'s plans.',
    timestamp: new Date(2026, 1, 1, 14, 30),
    type: 'message'
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    senderName: 'You',
    text: 'Sure, that could work! What night would you offer in exchange?',
    timestamp: new Date(2026, 1, 1, 15, 45),
    type: 'message'
  },
  {
    id: 'msg-s1',
    type: 'system',
    requestData: {
      type: 'swap',
      nights: [new Date(2026, 1, 10)],
      counterparty: 'Sarah'
    },
    timestamp: new Date(2026, 1, 1, 16, 0)
  },
  {
    id: 'msg-3',
    senderId: 'user-456',
    senderName: 'Sarah',
    text: 'How about Feb 21st? It\'s a Saturday.',
    timestamp: new Date(2026, 1, 1, 16, 10),
    type: 'message'
  },
  {
    id: 'msg-r1',
    senderId: 'user-456',
    senderName: 'Sarah',
    type: 'request',
    text: 'Sarah proposed swapping Feb 10 for Feb 14',
    requestData: {
      type: 'swap',
      nights: [new Date(2026, 1, 10), new Date(2026, 1, 14)]
    },
    timestamp: new Date(2026, 1, 1, 16, 15)
  }
];

const MOCK_TRANSACTIONS = [
  {
    id: 'txn-1',
    date: new Date(2026, 0, 28),
    type: 'buyout',
    nights: [new Date(2026, 1, 14)],
    amount: 150,
    direction: 'outgoing',
    status: 'pending',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-2',
    date: new Date(2026, 0, 25),
    type: 'swap',
    nights: [new Date(2026, 1, 10), new Date(2026, 1, 17)],
    amount: 0,
    direction: null,
    status: 'complete',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-3',
    date: new Date(2026, 0, 20),
    type: 'buyout',
    nights: [new Date(2026, 1, 7)],
    amount: 125,
    direction: 'incoming',
    status: 'complete',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-4',
    date: new Date(2026, 0, 15),
    type: 'buyout',
    nights: [new Date(2026, 1, 3)],
    amount: 175,
    direction: 'outgoing',
    status: 'declined',
    counterparty: 'Sarah C.'
  }
];

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
  // LOADING & ERROR STATE
  // -------------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // CORE DATA
  // -------------------------------------------------------------------------
  const [lease, setLease] = useState(null);
  const [roommate, setRoommate] = useState(null);

  // -------------------------------------------------------------------------
  // CALENDAR STATE (using string dates for easier comparison)
  // -------------------------------------------------------------------------
  const [userNights, setUserNights] = useState([]);
  const [roommateNights, setRoommateNights] = useState([]);
  const [pendingNights, setPendingNights] = useState([]);
  const [blockedNights, setBlockedNights] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // -------------------------------------------------------------------------
  // SELECTION STATE
  // -------------------------------------------------------------------------
  const [selectedNight, setSelectedNight] = useState(null);

  // -------------------------------------------------------------------------
  // MESSAGING STATE
  // -------------------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // -------------------------------------------------------------------------
  // TRANSACTION STATE
  // -------------------------------------------------------------------------
  const [transactions, setTransactions] = useState([]);

  // -------------------------------------------------------------------------
  // DERIVED STATE
  // -------------------------------------------------------------------------
  const currentUserId = 'current-user';
  const flexibilityScore = useMemo(
    () => calculateFlexibilityScore(transactions),
    [transactions]
  );

  const netFlow = useMemo(
    () => calculateNetFlow(transactions),
    [transactions]
  );

  const responsePatterns = useMemo(() => {
    // Placeholder - would calculate from actual response times
    return 'Usually responds within 2 hours';
  }, []);

  // Base price for selected night (from lease nightly rate)
  const basePrice = useMemo(() => {
    if (!selectedNight || !lease) return null;
    return lease.nightlyRate;
  }, [selectedNight, lease]);

  // -------------------------------------------------------------------------
  // NOTICE-BASED BUYOUT PRICING
  // -------------------------------------------------------------------------

  // Base buyout rate (from roommate's settings or lease nightly rate)
  const roommateBaseRate = useMemo(() => {
    // TODO: Fetch from roommate's buyout settings when available
    // For now, use lease nightly rate as default
    return lease?.nightlyRate || 100;
  }, [lease]);

  // Calculate suggested prices for all roommate nights (for calendar display)
  const roommatePrices = useMemo(() => {
    if (!roommateNights.length || !roommateBaseRate) return new Map();
    return calculateBuyoutPricesForDates(roommateBaseRate, roommateNights);
  }, [roommateNights, roommateBaseRate]);

  // Get full pricing details for the selected night
  const selectedNightPricing = useMemo(() => {
    if (!selectedNight || !roommateBaseRate) return null;
    return calculateSuggestedBuyoutPrice(roommateBaseRate, selectedNight);
  }, [selectedNight, roommateBaseRate]);

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

        setUserNights(userNightsData);
        setRoommateNights(roommateNightsData);
        setPendingNights(pendingData);
        setBlockedNights(blockedData);

        // Load messages and transactions (mock for now)
        setMessages(MOCK_MESSAGES);
        setTransactions(MOCK_TRANSACTIONS);

        // Set initial month to current lease period
        setCurrentMonth(new Date(2026, 1, 1)); // February 2026 for mock data

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
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Handle night selection from calendar
   */
  const handleSelectNight = useCallback((dateString) => {
    // Validate it's a roommate night (not user's own or blocked)
    if (roommateNights.includes(dateString) && !pendingNights.includes(dateString)) {
      setSelectedNight(dateString);
    }
  }, [roommateNights, pendingNights]);

  /**
   * Handle buy out request
   */
  const handleBuyOut = useCallback(async (message) => {
    if (!selectedNight || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Create the buyout request
      await createBuyoutRequest({
        leaseId,
        nightDate: selectedNight,
        message,
        basePrice: lease?.nightlyRate
      });

      // Add to pending requests
      setPendingNights(prev => [...prev, selectedNight]);

      // Clear selection
      setSelectedNight(null);

      // Return success (component will show success state)
      return true;

    } catch (err) {
      console.error('Failed to create buyout request:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedNight, isSubmitting, leaseId, lease]);

  /**
   * Handle swap instead action
   */
  const handleSwapInstead = useCallback(() => {
    if (!selectedNight) return;

    // TODO: Open swap modal or navigate to swap flow
    console.log('Opening swap flow for:', selectedNight);
  }, [selectedNight]);

  /**
   * Handle cancel selection
   */
  const handleCancel = useCallback(() => {
    setSelectedNight(null);
  }, []);

  /**
   * Handle sending a message
   */
  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isSending) return;

    try {
      setIsSending(true);
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: 'You',
        text: text,
        timestamp: new Date(),
        type: 'message'
      };

      setMessages(prev => [...prev, newMessage]);

      // TODO: Call API to send message
      await sendMessage(leaseId, text);

    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [currentUserId, isSending, leaseId]);

  const handleAcceptRequest = useCallback(async (requestId) => {
    console.log('Accepting request:', requestId);
    // TODO: Call API to accept request
  }, []);

  const handleDeclineRequest = useCallback(async (requestId) => {
    console.log('Declining request:', requestId);
    // TODO: Call API to decline request
  }, []);

  const handleCounterRequest = useCallback(async (requestId) => {
    console.log('Countering request:', requestId);
    // TODO: Open counter-offer flow
  }, []);

  const handleCancelRequest = useCallback(async (transactionId) => {
    console.log('Cancelling request:', transactionId);
    // TODO: Call API to cancel request
  }, []);

  const handleViewTransactionDetails = useCallback(async (transactionId) => {
    console.log('Viewing transaction details:', transactionId);
    // TODO: Fetch detailed history/thread if needed
  }, []);

  /**
   * Handle month navigation
   */
  const handleMonthChange = useCallback((newMonth) => {
    setCurrentMonth(newMonth);
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
    isSubmitting,

    // Core Data
    lease,
    roommate,

    // Calendar (using string dates)
    userNights,
    roommateNights,
    pendingNights,
    blockedNights,
    currentMonth,

    // Selection
    selectedNight,
    basePrice,

    // Notice-Based Buyout Pricing
    roommateBaseRate,
    roommatePrices,
    selectedNightPricing,

    // Roommate Profile
    flexibilityScore,
    responsePatterns,
    netFlow,

    // Messaging
    messages,
    currentUserId,
    isSending,

    // Transaction History
    transactions,

    // Handlers
    handleSelectNight,
    handleBuyOut,
    handleSwapInstead,
    handleCancel,
    handleSendMessage,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCounterRequest,
    handleCancelRequest,
    handleViewTransactionDetails,
    handleMonthChange,
    handleRefresh
  };
}
