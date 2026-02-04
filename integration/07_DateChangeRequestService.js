/**
 * COMPREHENSIVE DATE CHANGE REQUEST SERVICE
 * Integration Layer API Service - All 5 Patterns
 *
 * This service provides a unified API for all date change request operations,
 * integrating Pattern 1-5 seamlessly with the backend Edge Functions.
 *
 * PRODUCTION-READY: Complete error handling, retry logic, type safety
 * FUTURE ENHANCEMENT: Caching, optimistic updates, offline support
 */

import { retryWithBackoff, handlePatternError } from './05_errorRecovery.js';
import analyticsService from './04_analyticsService.js';

/**
 * DateChangeRequestService class
 * Handles all API interactions for date change requests
 */
export class DateChangeRequestService {
  constructor(supabaseClient) {
    if (!supabaseClient) {
      throw new Error('DateChangeRequestService requires a Supabase client instance');
    }

    this.supabase = supabaseClient;
    this.edgeFunctionName = 'date-change-request';
  }

  // ============================================================================
  // PATTERN 1: ARCHETYPE DETECTION
  // ============================================================================

  /**
   * Get archetype suggestion for a date change
   *
   * @param {string} leaseId - Lease ID
   * @param {string} requestorId - User ID making the request
   * @param {string} newStartDate - New start date (ISO format)
   * @param {string} newEndDate - New end date (ISO format)
   * @returns {Promise<Object>} Archetype suggestion with confidence
   */
  async getArchetypeSuggestion(leaseId, requestorId, newStartDate, newEndDate) {
    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'get_archetype_suggestion',
            leaseId,
            requestorId,
            newStartDate,
            newEndDate
          }
        }),
        { maxRetries: 2 }
      );

      if (error) throw error;

      // Track analytics
      if (data.archetype) {
        analyticsService.trackArchetypeDetected(
          data.archetype,
          data.confidence || 0
        );
      }

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Archetype detection failed:', error);

      // Use fallback handler
      return handlePatternError('archetype_detection', error);
    }
  }

  // ============================================================================
  // PATTERN 2: URGENCY CALCULATION
  // ============================================================================

  /**
   * Calculate urgency multiplier for date change
   *
   * @param {string} leaseId - Lease ID
   * @param {string} newStartDate - New start date
   * @param {string} archetype - User archetype
   * @returns {Promise<Object>} Urgency data with multiplier and band
   */
  async getUrgencyMultiplier(leaseId, newStartDate, archetype) {
    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'get_urgency_multiplier',
            leaseId,
            newStartDate,
            archetype
          }
        }),
        { maxRetries: 2 }
      );

      if (error) throw error;

      // Track analytics
      if (data.level && data.multiplier) {
        analyticsService.trackUrgencyCalculated(
          data.level,
          data.multiplier,
          data.daysUntilCheckIn || 0,
          data.band
        );
      }

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Urgency calculation failed:', error);

      // Use fallback handler
      return handlePatternError('urgency_calculation', error);
    }
  }

  // ============================================================================
  // PATTERN 3: PRICING TIERS
  // ============================================================================

  /**
   * Get pricing tiers for date change request
   *
   * @param {string} leaseId - Lease ID
   * @param {string} archetype - User archetype
   * @param {number} urgencyMultiplier - Urgency multiplier
   * @param {string} newStartDate - New start date
   * @param {string} newEndDate - New end date
   * @returns {Promise<Array>} Array of pricing tier objects
   */
  async getPricingTiers(leaseId, archetype, urgencyMultiplier, newStartDate, newEndDate) {
    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'get_pricing_tiers',
            leaseId,
            archetype,
            urgencyMultiplier,
            newStartDate,
            newEndDate
          }
        }),
        { maxRetries: 2 }
      );

      if (error) throw error;

      // Track analytics
      if (data.tiers && Array.isArray(data.tiers)) {
        analyticsService.trackPriceTiersViewed(data.tiers);
      }

      return data.tiers || [];

    } catch (error) {
      console.error('[DateChangeRequestService] Pricing tiers failed:', error);

      // Use fallback handler (needs basePrice from context)
      const basePrice = 100; // TODO: Get from lease data
      return handlePatternError('pricing_tiers', error, basePrice);
    }
  }

  // ============================================================================
  // PATTERN 4: BS+BS ELIGIBILITY
  // ============================================================================

  /**
   * Validate Both Sides Both Sides flexibility eligibility
   *
   * @param {string} leaseId - Lease ID
   * @param {string} requestorId - User ID
   * @returns {Promise<Object>} Eligibility result with options
   */
  async validateBSBSEligibility(leaseId, requestorId) {
    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'validate_bs_bs_eligibility',
            leaseId,
            requestorId
          }
        }),
        { maxRetries: 2 }
      );

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] BS+BS validation failed:', error);

      // Use fallback handler
      return handlePatternError('bsbs_eligibility', error);
    }
  }

  // ============================================================================
  // PATTERN 5: REQUEST DETAILS (for confirmation)
  // ============================================================================

  /**
   * Get detailed request information including snapshots
   *
   * @param {string} requestId - Date change request ID
   * @returns {Promise<Object>} Request details with snapshots
   */
  async getRequestDetails(requestId) {
    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'get_request_details',
            requestId
          }
        }),
        { maxRetries: 2 }
      );

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Get request details failed:', error);
      throw error; // Don't use fallback for this - needs real data
    }
  }

  // ============================================================================
  // CORE REQUEST OPERATIONS
  // ============================================================================

  /**
   * Create enhanced date change request with all pattern data
   *
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} Created request with metadata
   */
  async createRequest(params) {
    const {
      leaseId,
      requestorId,
      newStartDate,
      newEndDate,
      reason,
      selectedTier = 'standard',
      archetypeOverride = null,
      urgencyAcknowledged = false
    } = params;

    // Validate required fields
    if (!leaseId || !requestorId || !reason) {
      throw new Error('Missing required fields: leaseId, requestorId, reason');
    }

    if (!newStartDate && !newEndDate) {
      throw new Error('At least one of newStartDate or newEndDate is required');
    }

    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'create',
            leaseId,
            requestorId,
            newStartDate,
            newEndDate,
            reason,
            selectedTier,
            archetypeOverride,
            urgencyAcknowledged
          }
        }),
        { maxRetries: 1 } // Only retry once for mutations
      );

      if (error) throw error;

      // Track successful submission
      if (data.data) {
        analyticsService.trackRequestSubmitted(data.data);
      }

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Create request failed:', error);
      analyticsService.trackError(error, 'create_request');
      throw new Error(`Failed to create date change request: ${error.message}`);
    }
  }

  /**
   * Accept a date change request
   *
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Updated request
   */
  async acceptRequest(requestId) {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'accept',
            requestId
          }
        }),
        { maxRetries: 1 }
      );

      if (error) throw error;

      // Track acceptance
      analyticsService.track('date_change_request_accepted', {
        request_id: requestId
      });

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Accept request failed:', error);
      throw new Error(`Failed to accept request: ${error.message}`);
    }
  }

  /**
   * Decline a date change request
   *
   * @param {string} requestId - Request ID
   * @param {string} declineReason - Reason for declining
   * @returns {Promise<Object>} Updated request
   */
  async declineRequest(requestId, declineReason) {
    if (!requestId || !declineReason) {
      throw new Error('Request ID and decline reason are required');
    }

    try {
      const { data, error } = await retryWithBackoff(
        async () => this.supabase.functions.invoke(this.edgeFunctionName, {
          body: {
            action: 'decline',
            requestId,
            declineReason
          }
        }),
        { maxRetries: 1 }
      );

      if (error) throw error;

      // Track declination
      analyticsService.track('date_change_request_declined', {
        request_id: requestId,
        decline_reason: declineReason
      });

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Decline request failed:', error);
      throw new Error(`Failed to decline request: ${error.message}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all date change requests for a lease
   *
   * @param {string} leaseId - Lease ID
   * @returns {Promise<Array>} Array of requests
   */
  async getRequestsByLease(leaseId) {
    try {
      const { data, error } = await this.supabase
        .from('date_change_requests')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[DateChangeRequestService] Get requests by lease failed:', error);
      return [];
    }
  }

  /**
   * Get all date change requests by a user
   *
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of requests
   */
  async getRequestsByUser(userId) {
    try {
      const { data, error } = await this.supabase
        .from('date_change_requests')
        .select('*')
        .eq('requestor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('[DateChangeRequestService] Get requests by user failed:', error);
      return [];
    }
  }

  /**
   * Get single request by ID
   *
   * @param {string} requestId - Request ID
   * @returns {Promise<Object|null>} Request object or null
   */
  async getRequestById(requestId) {
    try {
      const { data, error } = await this.supabase
        .from('date_change_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[DateChangeRequestService] Get request by ID failed:', error);
      return null;
    }
  }

  /**
   * Health check for Edge Function
   *
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        this.edgeFunctionName,
        {
          body: { action: 'health' }
        }
      );

      if (error) throw error;

      return data?.status === 'healthy';

    } catch (error) {
      console.error('[DateChangeRequestService] Health check failed:', error);
      return false;
    }
  }
}

/**
 * Create service instance (convenience factory)
 *
 * @param {Object} supabaseClient - Supabase client
 * @returns {DateChangeRequestService} Service instance
 */
export function createDateChangeRequestService(supabaseClient) {
  return new DateChangeRequestService(supabaseClient);
}

// Export default class
export default DateChangeRequestService;
