/**
 * Lease Data Helpers
 *
 * Helper functions for fetching and processing lease data
 * associated with activated proposals.
 */

import { supabase } from '../../../lib/supabase.js';

/**
 * Check if a proposal status indicates the lease calendar should be shown
 *
 * Shows for all statuses from "Drafting Lease Documents" onwards:
 * - usualOrder 3: Proposal or Counteroffer Accepted / Drafting Lease Documents
 * - usualOrder 4: Lease Documents Sent for Review
 * - usualOrder 5: Lease Documents Sent for Signatures
 * - usualOrder 6: Lease Documents Signed / Awaiting Initial payment
 * - usualOrder 7: Initial Payment Submitted / Lease activated
 *
 * @param {string} status - The proposal status
 * @returns {boolean}
 */
export function isLeaseActivatedStatus(status) {
  if (!status) return false;
  const normalizedStatus = status.trim().toLowerCase();

  // Check for any lease-related status (usualOrder 3+)
  return (
    // usualOrder 3: Drafting
    normalizedStatus.includes('drafting') ||
    normalizedStatus.includes('accepted') ||
    // usualOrder 4: Documents sent for review
    normalizedStatus.includes('sent for review') ||
    // usualOrder 5: Documents sent for signatures
    normalizedStatus.includes('sent for signatures') ||
    // usualOrder 6: Awaiting payment
    normalizedStatus.includes('awaiting initial payment') ||
    normalizedStatus.includes('awaiting payment') ||
    // usualOrder 7: Activated
    normalizedStatus.includes('lease activated') ||
    normalizedStatus.includes('payment submitted')
  );
}

/**
 * Fetch lease data for a single proposal
 * @param {string} proposalId - The proposal ID
 * @returns {Promise<Object|null>} Normalized lease data or null
 */
export async function fetchLeaseDataForProposal(proposalId) {
  if (!proposalId) return null;

  try {
    // Fetch the lease for this proposal
    const { data: lease, error } = await supabase
      .from('bookings_leases')
      .select(`
        _id,
        Proposal,
        "Reservation Period: Start",
        "Reservation Period: End",
        "Move In Date",
        "Move-out",
        "Agreement Number",
        "Lease Status"
      `)
      .eq('Proposal', proposalId)
      .single();

    if (error || !lease) {
      console.warn('No lease found for proposal:', proposalId);
      return null;
    }

    // Fetch stays for this lease
    const { data: stays, error: staysError } = await supabase
      .from('bookings_stays')
      .select(`
        _id,
        "Week Number",
        "Check In (night)",
        "Last Night (night)",
        "Stay Status",
        "Dates - List of dates in this period"
      `)
      .eq('Lease', lease._id)
      .order('"Week Number"', { ascending: true });

    if (staysError) {
      console.warn('Error fetching stays for lease:', lease._id, staysError);
    }

    // Normalize the lease data
    return {
      id: lease._id,
      proposalId: lease.Proposal,
      startDate: lease['Reservation Period: Start'] || lease['Move In Date'],
      endDate: lease['Reservation Period: End'] || lease['Move-out'],
      agreementNumber: lease['Agreement Number'],
      status: lease['Lease Status'],
      stays: (stays || []).map(stay => ({
        id: stay._id,
        weekNumber: stay['Week Number'],
        checkInNight: stay['Check In (night)'],
        lastNight: stay['Last Night (night)'],
        status: stay['Stay Status'],
        dates: parseDatesArray(stay['Dates - List of dates in this period'])
      }))
    };
  } catch (err) {
    console.error('Error fetching lease data for proposal:', proposalId, err);
    return null;
  }
}

/**
 * Parse dates array from database (handles JSON string or array)
 * @param {string|Array} dates - Dates from database
 * @returns {Array<string>} Array of date strings
 */
function parseDatesArray(dates) {
  if (!dates) return [];
  if (Array.isArray(dates)) return dates;
  if (typeof dates === 'string') {
    try {
      const parsed = JSON.parse(dates);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }
  return [];
}

/**
 * Extract all booked dates from lease stays
 * @param {Object} leaseData - Normalized lease data
 * @returns {Array<string>} Array of date strings (YYYY-MM-DD format)
 */
export function extractBookedDatesFromLease(leaseData) {
  if (!leaseData || !leaseData.stays) return [];

  const allDates = [];

  leaseData.stays.forEach(stay => {
    if (stay.dates && Array.isArray(stay.dates)) {
      stay.dates.forEach(dateStr => {
        // Normalize to YYYY-MM-DD format
        const normalized = normalizeDate(dateStr);
        if (normalized) {
          allDates.push(normalized);
        }
      });
    }
  });

  return [...new Set(allDates)].sort();
}

/**
 * Normalize a date string to YYYY-MM-DD format
 * @param {string} dateStr - Date string in various formats
 * @returns {string|null} YYYY-MM-DD string or null
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Handle ISO format
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }

    // Try parsing as date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Calculate lease statistics
 * @param {Object} leaseData - Normalized lease data
 * @returns {Object} Statistics object
 */
export function calculateLeaseStats(leaseData) {
  if (!leaseData) {
    return {
      totalNights: 0,
      totalWeeks: 0,
      nightsRemaining: 0,
      nextStay: null
    };
  }

  const allDates = extractBookedDatesFromLease(leaseData);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Count future dates
  const futureDates = allDates.filter(d => d >= todayStr);

  // Find next stay
  let nextStay = null;
  if (leaseData.stays && leaseData.stays.length > 0) {
    const futureStays = leaseData.stays.filter(stay => {
      const checkIn = stay.checkInNight;
      if (!checkIn) return false;
      const checkInDate = new Date(checkIn);
      return checkInDate >= today;
    });

    if (futureStays.length > 0) {
      const nextStayData = futureStays[0];
      nextStay = {
        checkIn: nextStayData.checkInNight,
        checkOut: nextStayData.lastNight,
        weekNumber: nextStayData.weekNumber
      };
    }
  }

  return {
    totalNights: allDates.length,
    totalWeeks: leaseData.stays?.length || 0,
    nightsRemaining: futureDates.length,
    nextStay
  };
}
