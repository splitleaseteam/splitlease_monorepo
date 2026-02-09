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
 * DEV MODE: Returns null if no session (allows direct DB queries)
 * @returns {Promise<string|null>} Auth token or null
 */
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    console.log('[guestLeases] ✅ Found Supabase session token');
    return session.access_token;
  }

  console.log('[guestLeases] ⚠️ No Supabase session - will use direct DB query (DEV MODE)');
  return null;
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
 * DEV MODE: Falls back to direct DB query if no Supabase session
 * @param {string} [userIdOverride] - Optional user ID to use (for dev mode)
 * @returns {Promise<Array>} Array of normalized lease objects
 */
export async function fetchGuestLeases(userIdOverride = null) {
  const authToken = await getAuthToken();

  // DEV MODE: If no auth token, query database directly
  if (!authToken) {
    console.log('[guestLeases] DEV MODE: Querying leases directly from database');

    // Get user ID from parameter, localStorage, or give up
    const userId = userIdOverride ||
                   localStorage.getItem('sl_user_id') ||
                   localStorage.getItem('splitlease_supabase_user_id');

    if (!userId) {
      console.log('[guestLeases] DEV MODE: No user ID found, returning empty array');
      return [];
    }

    console.log('[guestLeases] DEV MODE: Fetching leases for user:', userId);

    // Query leases directly from Supabase (RLS should allow this with anon key)
    const { data: leases, error } = await supabase
      .from('booking_lease')
      .select(`
        *,
        listing:listing_id(*),
        guest:guest_user_id(*),
        host:host_user_id(*)
      `)
      .eq('guest_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !leases || leases.length === 0) {
      console.log('[guestLeases] DEV MODE: No leases found, returning DUMMY DATA for testing');
      return getDummyLeases();
    }

    const normalizedLeases = (leases || []).map(lease => adaptLeaseFromSupabase(lease));
    console.log(`[guestLeases] DEV MODE: Fetched ${normalizedLeases.length} leases directly`);
    return normalizedLeases;
  }

/**
 * DEV MODE: Returns dummy lease data for testing UI
 */
function getDummyLeases() {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return [
    {
      _id: 'dummy-lease-1',
      status: 'active',
      startDate: lastWeek.toISOString(),
      endDate: nextMonth.toISOString(),
      totalPrice: 2500,
      nightlyRate: 125,
      listing: {
        _id: 'dummy-listing-1',
        title: 'Cozy Manhattan Studio',
        address: '123 East 45th Street, New York, NY 10017',
        borough: 'Manhattan',
        neighborhood: 'Midtown East',
        photos: ['https://picsum.photos/seed/apt1/400/300'],
        bedrooms: 0,
        bathrooms: 1,
        amenities: ['WiFi', 'Air Conditioning', 'Kitchen', 'Washer/Dryer']
      },
      host: {
        _id: 'dummy-host-1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profilePhoto: 'https://i.pravatar.cc/150?u=sarah',
        phone: '+1 (555) 123-4567',
        email: 'sarah.j@example.com'
      },
      stays: [
        {
          _id: 'dummy-stay-1',
          checkIn: lastWeek.toISOString(),
          checkOut: nextWeek.toISOString(),
          status: 'in_progress',
          cleaningPhotosSubmitted: false,
          storagePhotosSubmitted: true
        }
      ],
      dateChangeRequests: [],
      payments: [
        {
          _id: 'dummy-payment-1',
          amount: 1250,
          status: 'completed',
          date: lastWeek.toISOString(),
          type: 'first_half'
        }
      ]
    },
    {
      _id: 'dummy-lease-2',
      status: 'upcoming',
      startDate: nextWeek.toISOString(),
      endDate: nextMonth.toISOString(),
      totalPrice: 3200,
      nightlyRate: 160,
      listing: {
        _id: 'dummy-listing-2',
        title: 'Sunny Brooklyn 1BR with Balcony',
        address: '456 Bedford Avenue, Brooklyn, NY 11249',
        borough: 'Brooklyn',
        neighborhood: 'Williamsburg',
        photos: ['https://picsum.photos/seed/apt2/400/300'],
        bedrooms: 1,
        bathrooms: 1,
        amenities: ['WiFi', 'Balcony', 'Dishwasher', 'Pet Friendly']
      },
      host: {
        _id: 'dummy-host-2',
        firstName: 'Mike',
        lastName: 'Chen',
        profilePhoto: 'https://i.pravatar.cc/150?u=mike',
        phone: '+1 (555) 987-6543',
        email: 'mike.c@example.com'
      },
      stays: [
        {
          _id: 'dummy-stay-2',
          checkIn: nextWeek.toISOString(),
          checkOut: nextMonth.toISOString(),
          status: 'pending',
          cleaningPhotosSubmitted: false,
          storagePhotosSubmitted: false
        }
      ],
      dateChangeRequests: [
        {
          _id: 'dummy-dcr-1',
          requestedBy: 'guest',
          originalStartDate: nextWeek.toISOString(),
          originalEndDate: nextMonth.toISOString(),
          newStartDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          newEndDate: nextMonth.toISOString(),
          status: 'pending',
          reason: 'Flight delayed by 2 days'
        }
      ],
      payments: []
    },
    {
      _id: 'dummy-lease-3',
      status: 'completed',
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalPrice: 1800,
      nightlyRate: 90,
      listing: {
        _id: 'dummy-listing-3',
        title: 'Queens Garden Apartment',
        address: '789 Queens Blvd, Queens, NY 11375',
        borough: 'Queens',
        neighborhood: 'Forest Hills',
        photos: ['https://picsum.photos/seed/apt3/400/300'],
        bedrooms: 2,
        bathrooms: 1,
        amenities: ['WiFi', 'Garden Access', 'Parking', 'Laundry']
      },
      host: {
        _id: 'dummy-host-3',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        profilePhoto: 'https://i.pravatar.cc/150?u=emily',
        phone: '+1 (555) 456-7890',
        email: 'emily.r@example.com'
      },
      stays: [
        {
          _id: 'dummy-stay-3',
          checkIn: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          checkOut: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          cleaningPhotosSubmitted: true,
          storagePhotosSubmitted: true
        }
      ],
      dateChangeRequests: [],
      payments: [
        {
          _id: 'dummy-payment-2',
          amount: 1800,
          status: 'completed',
          date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'full'
        }
      ],
      review: {
        rating: 5,
        comment: 'Great stay! Very clean and comfortable.'
      }
    }
  ];
}

  // Normal path: Use edge function with JWT
  try {
    const { data, error } = await supabase.functions.invoke('lease', {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        action: 'get_guest_leases',
        payload: {}
      }
    });

    if (error) {
      console.error('[guestLeases] Edge function error:', error);
      throw new Error(error.message || 'Failed to fetch leases');
    }

    if (!data?.success) {
      console.error('[guestLeases] Edge function returned error:', data);
      throw new Error(data?.error || 'Failed to fetch leases');
    }

    const leases = (data.data || []).map(lease => adaptLeaseFromSupabase(lease));
    console.log(`[guestLeases] Fetched ${leases.length} leases via edge function`);
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
