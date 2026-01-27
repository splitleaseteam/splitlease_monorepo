/**
 * Guest Leases API
 *
 * API wrapper functions for guest lease operations.
 * Uses Supabase Edge Functions with action-based pattern.
 *
 * All functions follow the pattern:
 * - Get auth token from session
 * - Call Edge Function with { action, payload }
 * - Return normalized data or throw error
 */

import { supabase } from '../supabase.js';
import { adaptLeaseFromSupabase } from '../../logic/processors/leases/adaptLeaseFromSupabase.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get authentication token from current session
 * @returns {Promise<string>} Auth token
 * @throws {Error} If no session available
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;

  if (!authToken) {
    throw new Error('Authentication required. Please log in.');
  }

  return authToken;
}

/**
 * Invoke a Supabase Edge Function with authentication
 * @param {string} functionName - Edge function name
 * @param {string} action - Action name
 * @param {Object} payload - Action payload
 * @returns {Promise<Object>} Response data
 */
async function invokeEdgeFunction(functionName, action, payload = {}) {
  const authToken = await getAuthToken();

  console.log(`[guestLeases] Invoking ${functionName}/${action}`, payload);

  const { data, error } = await supabase.functions.invoke(functionName, {
    headers: {
      Authorization: `Bearer ${authToken}`
    },
    body: {
      action,
      payload
    }
  });

  if (error) {
    console.error(`[guestLeases] Error in ${functionName}/${action}:`, error);
    throw new Error(error.message || `Failed to ${action}`);
  }

  if (!data?.success) {
    console.error(`[guestLeases] ${functionName}/${action} returned error:`, data);
    throw new Error(data?.error || `Operation failed: ${action}`);
  }

  return data;
}

// ============================================================================
// LEASE FETCHING
// ============================================================================

/**
 * Fetch all leases for the authenticated guest
 * @returns {Promise<Array>} Array of normalized lease objects
 */
export async function fetchGuestLeases() {
  try {
    const result = await invokeEdgeFunction('lease', 'get_guest_leases', {});

    // Normalize leases
    const leases = (result.data || []).map(lease => adaptLeaseFromSupabase(lease));

    console.log(`[guestLeases] Fetched ${leases.length} leases`);
    return leases;
  } catch (err) {
    console.error('[guestLeases] Error fetching leases:', err);
    throw err;
  }
}

/**
 * Fetch detailed information for a single lease
 * @param {string} leaseId - Lease ID
 * @returns {Promise<Object>} Normalized lease with full details
 */
export async function fetchLeaseDetails(leaseId) {
  try {
    const result = await invokeEdgeFunction('lease', 'get_lease_details', {
      leaseId
    });

    return adaptLeaseFromSupabase(result.data);
  } catch (err) {
    console.error('[guestLeases] Error fetching lease details:', err);
    throw err;
  }
}

// ============================================================================
// CHECK-IN/CHECKOUT
// ============================================================================

/**
 * Send a check-in message to the host
 * @param {string} stayId - Stay ID
 * @param {string} message - Message content
 * @param {string} type - 'on_my_way' | 'im_here' | 'custom'
 * @returns {Promise<Object>} Result
 */
export async function sendCheckinMessage(stayId, message, type = 'custom') {
  try {
    const result = await invokeEdgeFunction('guest-leases', 'send_checkin_message', {
      stayId,
      message,
      type
    });

    return result;
  } catch (err) {
    console.error('[guestLeases] Error sending checkin message:', err);
    throw err;
  }
}

/**
 * Send a checkout message to the host
 * @param {string} stayId - Stay ID
 * @param {string} message - Message content
 * @returns {Promise<Object>} Result
 */
export async function sendCheckoutMessage(stayId, message) {
  try {
    const result = await invokeEdgeFunction('guest-leases', 'send_checkout_message', {
      stayId,
      message
    });

    return result;
  } catch (err) {
    console.error('[guestLeases] Error sending checkout message:', err);
    throw err;
  }
}

/**
 * Update the status of a stay
 * @param {string} stayId - Stay ID
 * @param {string} status - New status: 'started' | 'in_progress' | 'completed'
 * @returns {Promise<Object>} Updated stay
 */
export async function updateStayStatus(stayId, status) {
  try {
    const result = await invokeEdgeFunction('guest-leases', 'update_stay_status', {
      stayId,
      status
    });

    return result;
  } catch (err) {
    console.error('[guestLeases] Error updating stay status:', err);
    throw err;
  }
}

// ============================================================================
// PHOTOS
// ============================================================================

/**
 * Submit cleaning photos for a stay
 * @param {string} stayId - Stay ID
 * @param {Array<string>} photoUrls - Array of photo URLs
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} Result
 */
export async function submitCleaningPhotos(stayId, photoUrls, comment = '') {
  try {
    const result = await invokeEdgeFunction('guest-leases', 'submit_cleaning_photos', {
      stayId,
      photoUrls,
      comment
    });

    return result;
  } catch (err) {
    console.error('[guestLeases] Error submitting cleaning photos:', err);
    throw err;
  }
}

/**
 * Submit storage photos for a stay
 * @param {string} stayId - Stay ID
 * @param {Array<string>} photoUrls - Array of photo URLs
 * @returns {Promise<Object>} Result
 */
export async function submitStoragePhotos(stayId, photoUrls) {
  try {
    const result = await invokeEdgeFunction('guest-leases', 'submit_storage_photos', {
      stayId,
      photoUrls
    });

    return result;
  } catch (err) {
    console.error('[guestLeases] Error submitting storage photos:', err);
    throw err;
  }
}

// ============================================================================
// DATE CHANGE REQUESTS
// ============================================================================

/**
 * Create a date change request
 * @param {Object} request - Request details
 * @returns {Promise<Object>} Created request
 */
export async function createDateChangeRequest(request) {
  try {
    const result = await invokeEdgeFunction('date-change-request', 'create', request);
    return result;
  } catch (err) {
    console.error('[guestLeases] Error creating date change request:', err);
    throw err;
  }
}

/**
 * Approve a date change request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Result
 */
export async function approveDateChangeRequest(requestId) {
  try {
    const result = await invokeEdgeFunction('date-change-request', 'accept', {
      requestId
    });
    return result;
  } catch (err) {
    console.error('[guestLeases] Error approving date change request:', err);
    throw err;
  }
}

/**
 * Reject a date change request
 * @param {string} requestId - Request ID
 * @param {string} reason - Rejection reason (optional)
 * @returns {Promise<Object>} Result
 */
export async function rejectDateChangeRequest(requestId, reason = '') {
  try {
    const result = await invokeEdgeFunction('date-change-request', 'decline', {
      requestId,
      reason
    });
    return result;
  } catch (err) {
    console.error('[guestLeases] Error rejecting date change request:', err);
    throw err;
  }
}

// ============================================================================
// REVIEWS
// ============================================================================

/**
 * Submit a review for a stay
 * @param {string} stayId - Stay ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Review comment
 * @param {Array<string>} categories - Review categories
 * @returns {Promise<Object>} Created review
 */
export async function submitReview(stayId, rating, comment, categories = []) {
  try {
    const result = await invokeEdgeFunction('communications', 'submit_review', {
      stayId,
      rating,
      comment,
      categories,
      reviewerType: 'guest'
    });
    return result;
  } catch (err) {
    console.error('[guestLeases] Error submitting review:', err);
    throw err;
  }
}

export default {
  fetchGuestLeases,
  fetchLeaseDetails,
  sendCheckinMessage,
  sendCheckoutMessage,
  updateStayStatus,
  submitCleaningPhotos,
  submitStoragePhotos,
  createDateChangeRequest,
  approveDateChangeRequest,
  rejectDateChangeRequest,
  submitReview
};
