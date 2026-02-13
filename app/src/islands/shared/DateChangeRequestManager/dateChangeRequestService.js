/**
 * Date Change Request API Service Layer
 * Handles all backend API calls via Supabase Edge Functions
 */

import { supabase } from '../../../lib/supabase.js';
import { toISOString } from './dateUtils.js';

/**
 * Field name mapping: camelCase (component) -> snake_case column names (database)
 */
const FIELD_MAP = {
  // Request fields
  id: 'id',
  lease: 'lease',
  requestedBy: 'requested_by',
  requestReceiver: 'request_receiver',
  typeOfRequest: 'type_of_request',
  dateAdded: 'date_added',
  dateRemoved: 'date_removed',
  messageFromRequester: 'message_from_requested_by',
  priceRateOfNight: 'price_rate_of_the_night',
  comparedToRegularRate: 'compared_to_regular_nightly_price',
  requestStatus: 'request_status',
  expirationDate: 'expiration_date',
  visibleToGuest: 'visible_to_the_guest',
  visibleToHost: 'visible_to_the_host',
  createdAt: 'original_created_at',
  answerDate: 'answer_date',
  answerToRequest: 'answer_to_request',
  createdBy: 'created_by',
  modifiedDate: 'original_updated_at',
  // Stay associations
  stayAssociated1: 'stay_associated_1',
  stayAssociated2: 'stay_associated_2',
  // Lists
  listOfNewDates: 'list_of_new_dates_in_the_stay',
  listOfOldDates: 'list_of_old_dates_in_the_stay',
};

/**
 * Transform database row to component-friendly format
 * @param {Object} row - Database row with snake_case column names
 * @returns {Object} - Transformed object with camelCase keys
 */
export const transformFromDb = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    lease: row.lease,
    requestedBy: row.requested_by,
    requestReceiver: row.request_receiver,
    typeOfRequest: row.type_of_request,
    dateAdded: row.date_added,
    dateRemoved: row.date_removed,
    messageFromRequester: row.message_from_requested_by,
    priceRateOfNight: row.price_rate_of_the_night,
    comparedToRegularRate: row.compared_to_regular_nightly_price,
    requestStatus: row.request_status,
    expirationDate: row.expiration_date,
    visibleToGuest: row.visible_to_the_guest,
    visibleToHost: row.visible_to_the_host,
    createdAt: row.original_created_at,
    answerDate: row.answer_date,
    answerToRequest: row.answer_to_request,
    createdBy: row.created_by,
    modifiedDate: row.original_updated_at,
    stayAssociated1: row.stay_associated_1,
    stayAssociated2: row.stay_associated_2,
    listOfNewDates: row.list_of_new_dates_in_the_stay,
    listOfOldDates: row.list_of_old_dates_in_the_stay,
    pending: row.pending,
    // Include requester/receiver user data if joined
    requester: row.requester,
    receiver: row.receiver,
  };
};

/**
 * Transform component data to database format
 * @param {Object} data - Component data with camelCase keys
 * @returns {Object} - Transformed object with snake_case column names
 */
export const transformToDb = (data) => {
  const result = {};

  Object.entries(data).forEach(([key, value]) => {
    const dbKey = FIELD_MAP[key];
    if (dbKey && value !== undefined) {
      // Convert dates to ISO strings
      if (value instanceof Date) {
        result[dbKey] = toISOString(value);
      } else {
        result[dbKey] = value;
      }
    }
  });

  return result;
};

/**
 * Create a new date change request
 * @param {Object} requestData - Request data
 * @param {string} requestData.leaseId - Lease ID
 * @param {string} requestData.typeOfRequest - 'adding' | 'removing' | 'swapping'
 * @param {Date} [requestData.dateAdded] - Date to add (for adding/swapping)
 * @param {Date} [requestData.dateRemoved] - Date to remove (for removing/swapping)
 * @param {string} [requestData.message] - Optional message
 * @param {number} [requestData.priceRate] - Proposed price rate
 * @param {number} [requestData.percentageOfRegular] - Percentage of regular rate
 * @param {string} requestData.requestedById - User making the request
 * @param {string} requestData.receiverId - User receiving the request
 * @returns {Promise<{status: string, data?: any, message?: string}>}
 */
export async function createDateChangeRequest(requestData) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'create',
        payload: {
          leaseId: requestData.leaseId,
          typeOfRequest: requestData.typeOfRequest,
          dateAdded: requestData.dateAdded ? toISOString(requestData.dateAdded) : null,
          dateRemoved: requestData.dateRemoved ? toISOString(requestData.dateRemoved) : null,
          message: requestData.message,
          priceRate: requestData.priceRate,
          percentageOfRegular: requestData.percentageOfRegular,
          requestedById: requestData.requestedById,
          receiverId: requestData.receiverId,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create date change request');
    }

    return {
      status: 'success',
      data: responseData?.data ? transformFromDb(responseData.data) : null,
    };
  } catch (error) {
    console.error('API Error (create-date-change-request):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get date change requests for a lease
 * @param {string} leaseId - Lease ID
 * @returns {Promise<{status: string, data?: any[], message?: string}>}
 */
export async function getDateChangeRequests(leaseId) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'get',
        payload: { leaseId },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get date change requests');
    }

    const requests = Array.isArray(responseData?.data)
      ? responseData.data.map(transformFromDb)
      : [];

    return {
      status: 'success',
      data: requests,
    };
  } catch (error) {
    console.error('API Error (get-date-change-requests):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Accept a date change request
 * @param {string} requestId - Request ID
 * @param {string} [message] - Optional response message
 * @returns {Promise<{status: string, data?: any, message?: string}>}
 */
export async function acceptDateChangeRequest(requestId, message) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'accept',
        payload: {
          requestId,
          message,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to accept date change request');
    }

    return {
      status: 'success',
      data: responseData?.data ? transformFromDb(responseData.data) : null,
    };
  } catch (error) {
    console.error('API Error (accept-date-change-request):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Decline a date change request
 * @param {string} requestId - Request ID
 * @param {string} [reason] - Decline reason
 * @returns {Promise<{status: string, data?: any, message?: string}>}
 */
export async function declineDateChangeRequest(requestId, reason) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'decline',
        payload: {
          requestId,
          reason,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to decline date change request');
    }

    return {
      status: 'success',
      data: responseData?.data ? transformFromDb(responseData.data) : null,
    };
  } catch (error) {
    console.error('API Error (decline-date-change-request):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Cancel own date change request
 * @param {string} requestId - Request ID
 * @returns {Promise<{status: string, data?: any, message?: string}>}
 */
export async function cancelDateChangeRequest(requestId) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'cancel',
        payload: { requestId },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to cancel date change request');
    }

    return {
      status: 'success',
      data: responseData?.data ? transformFromDb(responseData.data) : null,
    };
  } catch (error) {
    console.error('API Error (cancel-date-change-request):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get throttle status for a user (basic mode - backward compatible)
 * @param {string} userId - User ID
 * @returns {Promise<{status: string, data?: {requestCount: number, limit: number, isThrottled: boolean}, message?: string}>}
 */
export async function getThrottleStatus(userId) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'get_throttle_status',
        payload: { userId },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get throttle status');
    }

    return {
      status: 'success',
      data: responseData?.data,
    };
  } catch (error) {
    console.error('API Error (get-throttle-status):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get enhanced throttle status for a user on a specific lease
 * Returns two-tier throttle info with lease-specific fields
 * @param {string} leaseId - Lease ID
 * @param {string} userId - User ID
 * @returns {Promise<{status: string, data?: Object, message?: string}>}
 */
export async function getEnhancedThrottleStatus(leaseId, userId) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'get_throttle_status',
        payload: { userId, leaseId },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to get enhanced throttle status');
    }

    return {
      status: 'success',
      data: {
        pendingRequestCount: responseData?.data?.pendingRequestCount,
        throttleLevel: responseData?.data?.throttleLevel, // 'none' | 'soft_warning' | 'hard_block'
        isBlocked: responseData?.data?.isBlocked,
        showWarning: responseData?.data?.showWarning,
        otherParticipantName: responseData?.data?.otherParticipantName,
        blockedUntil: responseData?.data?.blockedUntil,
        // Legacy fields
        requestCount: responseData?.data?.requestCount,
        limit: responseData?.data?.limit,
        isThrottled: responseData?.data?.isThrottled,
      },
    };
  } catch (error) {
    console.error('API Error (get-enhanced-throttle-status):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update warning preference ("Don't show me this again" checkbox)
 * @param {string} leaseId - Lease ID
 * @param {string} userId - User ID
 * @param {boolean} dontShowAgain - Whether to suppress future warnings
 * @returns {Promise<{status: string, message?: string}>}
 */
export async function updateWarningPreference(leaseId, userId, dontShowAgain) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'update_warning_preference',
        payload: { leaseId, userId, dontShowAgain },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to update warning preference');
    }

    return {
      status: 'success',
    };
  } catch (error) {
    console.error('API Error (update-warning-preference):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Apply hard block to a user on a lease (used when hitting 10+ requests)
 * @param {string} leaseId - Lease ID
 * @param {string} userId - User ID
 * @returns {Promise<{status: string, data?: Object, message?: string}>}
 */
export async function applyHardBlock(leaseId, userId) {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('date-change-request', {
      body: {
        action: 'apply_hard_block',
        payload: { leaseId, userId },
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to apply hard block');
    }

    return {
      status: 'success',
      data: responseData?.data,
    };
  } catch (error) {
    console.error('API Error (apply-hard-block):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Direct Supabase query to get lease with booked dates
 * @param {string} leaseId - Lease ID
 * @returns {Promise<{status: string, data?: Object, message?: string}>}
 */
export async function getLeaseWithDates(leaseId) {
  try {
    const { data, error } = await supabase
      .from('booking_lease')
      .select(`
        id,
        agreement_number,
        reservation_start_date,
        reservation_end_date,
        booked_dates_json,
        guest_user_id,
        host_user_id,
        listing_id,
        lease_type,
        total_week_count,
        current_week_number
      `)
      .eq('id', leaseId)
      .single();

    if (error) throw error;

    return {
      status: 'success',
      data: {
        id: data.id,
        agreementNumber: data.agreement_number,
        reservationStart: data.reservation_start_date,
        reservationEnd: data.reservation_end_date,
        bookedDates: data.booked_dates_json || [],
        guestId: data.guest_user_id,
        hostId: data.host_user_id,
        listingId: data.listing_id,
        status: data.lease_type,
        totalWeeks: data.total_week_count,
        currentWeek: data.current_week_number,
      },
    };
  } catch (error) {
    console.error('Direct Query Error (get-lease-with-dates):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch lease data',
    };
  }
}

// Export all API functions as a service object
/**
 * Get booked dates from other leases on the same listing (Roommate's dates)
 * @param {string} listingId - Listing ID
 * @param {string} currentLeaseId - Current Lease ID to exclude
 * @returns {Promise<{status: string, data?: string[], message?: string}>}
 */
export async function getRoommateBookedDates(listingId, currentLeaseId) {
  try {
    const { data, error } = await supabase
      .from('booking_lease')
      .select('booked_dates_json')
      .eq('listing_id', listingId)
      .eq('lease_type', 'Active')
      .neq('id', currentLeaseId);

    if (error) throw error;

    // Combine dates from all other active leases (usually just one roommate)
    const roommateDates = data.reduce((acc, lease) => {
      const dates = lease.booked_dates_json || [];
      return [...acc, ...dates];
    }, []);

    // Remove duplicates if any
    const uniqueDates = [...new Set(roommateDates)];

    return {
      status: 'success',
      data: uniqueDates,
    };
  } catch (error) {
    console.error('API Error (get-roommate-booked-dates):', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch roommate dates',
    };
  }
}

export const dateChangeRequestService = {
  create: createDateChangeRequest,
  getAll: getDateChangeRequests,
  accept: acceptDateChangeRequest,
  decline: declineDateChangeRequest,
  cancel: cancelDateChangeRequest,
  getThrottleStatus,
  getEnhancedThrottleStatus,
  updateWarningPreference,
  applyHardBlock,
  getLeaseWithDates,
  getRoommateBookedDates,
  transformFromDb,
  transformToDb,
};

export default dateChangeRequestService;
