/**
 * API client for ScheduleDashboard
 * @module api/scheduleDashboardApi
 *
 * TODO: Replace stubs with real Supabase/Edge Function calls
 */

import { supabase } from '../../../../lib/supabase.js';
import { adaptLeaseFromSupabase } from '../../../../logic/processors/leases/adaptLeaseFromSupabase.js';

/**
 * Fetch lease details for Schedule Dashboard
 * Host, Guest, Listing are column names storing IDs, not FK relationships.
 * We fetch them separately to avoid PostgREST relationship errors.
 *
 * @param {string} leaseId - Lease ID
 * @returns {Promise<Object>} Normalized lease object
 */
export async function fetchLeaseById(leaseId) {
  // Step 1: Fetch lease with stays only
  const { data: lease, error } = await supabase
    .from('bookings_leases')
    .select(`
      *,
      stays:bookings_stays(*)
    `)
    .eq('_id', leaseId)
    .single();

  if (error) {
    throw error;
  }

  // Step 2: Fetch host user if Host column exists
  if (lease?.Host) {
    const { data: host } = await supabase
      .from('User')
      .select('*')
      .eq('_id', lease.Host)
      .single();
    lease.host = host;
  }

  // Step 3: Fetch guest user if Guest column exists
  if (lease?.Guest) {
    const { data: guest } = await supabase
      .from('User')
      .select('*')
      .eq('_id', lease.Guest)
      .single();
    lease.guest = guest;
  }

  // Step 4: Fetch listing if Listing column exists
  if (lease?.Listing) {
    const { data: listing } = await supabase
      .from('Listing')
      .select('*')
      .eq('_id', lease.Listing)
      .single();
    lease.listing = listing;
  }

  return adaptLeaseFromSupabase(lease);
}

/**
 * Split nights between current user and roommate
 * @param {Object} lease - Adapted lease data
 * @param {string} currentUserId - Current user ID
 * @returns {{ userNights: string[], roommateNights: string[] }}
 */
export function splitNightsByUser(lease, currentUserId) {
  const allDates = lease?.bookedDates || [];
  const stays = lease?.stays || [];

  const userNights = [];
  const roommateNights = [];

  stays.forEach((stay) => {
    const isUserStay = stay?.assignedTo === currentUserId;
    const nightsInStay = stay?.dates || [];
    const nights = allDates.length > 0
      ? nightsInStay.filter((night) => allDates.includes(night))
      : nightsInStay;

    if (isUserStay) {
      userNights.push(...nights);
    } else {
      roommateNights.push(...nights);
    }
  });

  return { userNights, roommateNights };
}

// ============================================================================
// PERSPECTIVE-NEUTRAL CALENDAR DATA
// ============================================================================
// Universal store: Maps user IDs to their owned nights
// This is the "truth" - derived views are calculated from this
const CALENDAR_DATA = {
  // Alex (current-user): Mon-Thu pattern
  'current-user': [
    // February 2026
    '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05',
    '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12',
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
    '2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26',
    // March 2026
    '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
    '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12',
    '2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19',
    '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26',
    '2026-03-30', '2026-03-31'
  ],
  // Sarah (user-456): Fri-Sun pattern (complement of Alex's schedule)
  'user-456': [
    // February 2026
    '2026-02-06', '2026-02-07', '2026-02-08',
    '2026-02-13', '2026-02-14', '2026-02-15',
    '2026-02-20', '2026-02-21', '2026-02-22',
    '2026-02-27', '2026-02-28',
    // March 2026
    '2026-03-06', '2026-03-07', '2026-03-08',
    '2026-03-13', '2026-03-14', '2026-03-15',
    '2026-03-20', '2026-03-21', '2026-03-22',
    '2026-03-27', '2026-03-28', '2026-03-29'
  ]
};

/**
 * Fetch nights for a specific user by their ID
 * @param {string} leaseId - The lease ID
 * @param {string} userId - The user's ID to fetch nights for
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
export async function fetchNightsForUser(leaseId, userId) {
  console.log('[API Stub] fetchNightsForUser:', { leaseId, userId });
  return CALENDAR_DATA[userId] || [];
}

/**
 * Fetch user's nights for this lease (uses userId to look up correct data)
 * @param {string} leaseId - The lease ID
 * @param {string} userId - The current user's ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
export async function fetchUserNights(leaseId, userId) {
  // TODO: Replace with real API call
  // Query calendar_stays where user_id = userId AND lease_id = leaseId
  console.log('[API Stub] fetchUserNights:', { leaseId, userId });

  // Return nights for the specified user (perspective-aware)
  return CALENDAR_DATA[userId] || [];
}

/**
 * Fetch roommate's nights for this lease (uses roommateId to look up correct data)
 * @param {string} leaseId - The lease ID
 * @param {string} roommateId - The roommate's user ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
export async function fetchRoommateNights(leaseId, roommateId) {
  // TODO: Replace with real API call
  // Query calendar_stays where user_id = roommateId AND lease_id = leaseId
  console.log('[API Stub] fetchRoommateNights:', { leaseId, roommateId });

  // Return nights for the specified roommate (perspective-aware)
  return CALENDAR_DATA[roommateId] || [];
}

/**
 * Fetch pending date change requests for this lease
 * @param {string} leaseId - The lease ID
 * @returns {Promise<string[]>} Array of date strings (YYYY-MM-DD)
 */
export async function fetchPendingRequests(leaseId) {
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
export async function fetchBlockedDates(leaseId) {
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
export async function fetchChatMessages(leaseId) {
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
export async function fetchTransactions(leaseId) {
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
export async function sendMessage(leaseId, text) {
  // TODO: Replace with real API call
  // Insert into messaging_thread
  console.log('[API Stub] sendMessage:', { leaseId, text });
}

/**
 * Create a buyout request
 * @param {object} params - Request parameters
 * @returns {Promise<object>} Created request
 */
export async function createBuyoutRequest({ leaseId, nightDate, message, basePrice }) {
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
