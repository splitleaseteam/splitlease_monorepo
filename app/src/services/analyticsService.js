/**
 * UNIFIED ANALYTICS SERVICE
 * Gap 5: Complete analytics event tracking infrastructure
 *
 * Supports multiple providers: Segment, Mixpanel, GA4
 * Tracks all 5 behavioral patterns with structured events
 *
 * PRODUCTION-READY: Multi-provider support with fallbacks
 * FUTURE ENHANCEMENT: Server-side tracking, data warehouse integration
 */

class AnalyticsService {
  constructor() {
    this.providers = {
      segment: typeof window !== 'undefined' ? window.analytics : null,
      mixpanel: typeof window !== 'undefined' ? window.mixpanel : null,
      ga4: typeof window !== 'undefined' ? window.gtag : null
    };

    this.userId = null;
    this.userTraits = {};
    this.sessionId = this.getSessionId();
    this.enabled = true;
  }

  /**
   * Initialize analytics with user identification
   *
   * @param {string} userId - User ID
   * @param {Object} traits - User traits/properties
   */
  identify(userId, traits = {}) {
    if (!this.enabled || !userId) return;

    this.userId = userId;
    this.userTraits = traits;

    // Segment
    try {
      this.providers.segment?.identify(userId, traits);
    } catch (error) {
      console.error('[Analytics] Segment identify failed:', error);
    }

    // Mixpanel
    try {
      this.providers.mixpanel?.identify(userId);
      this.providers.mixpanel?.people.set(traits);
    } catch (error) {
      console.error('[Analytics] Mixpanel identify failed:', error);
    }

    // GA4
    try {
      this.providers.ga4?.('set', 'user_properties', traits);
    } catch (error) {
      console.error('[Analytics] GA4 identify failed:', error);
    }

    console.log('[Analytics] User identified:', userId, traits);
  }

  /**
   * Track generic event across all providers
   *
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  track(eventName, properties = {}) {
    if (!this.enabled) return;

    const enrichedProperties = {
      ...properties,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    };

    console.log(`[Analytics] ${eventName}`, enrichedProperties);

    // Segment
    try {
      this.providers.segment?.track(eventName, enrichedProperties);
    } catch (error) {
      console.error('[Analytics] Segment track failed:', error);
    }

    // Mixpanel
    try {
      this.providers.mixpanel?.track(eventName, enrichedProperties);
    } catch (error) {
      console.error('[Analytics] Mixpanel track failed:', error);
    }

    // GA4
    try {
      this.providers.ga4?.('event', eventName, enrichedProperties);
    } catch (error) {
      console.error('[Analytics] GA4 track failed:', error);
    }
  }

  // ============================================================================
  // PATTERN 1: PERSONALIZED DEFAULTS - ARCHETYPE EVENTS
  // ============================================================================

  /**
   * Track archetype detection event
   *
   * @param {string} archetype - BIG_SPENDER, BUDGET_CONSCIOUS, BALANCED
   * @param {number} confidence - Confidence score (0-1)
   * @param {Object} metadata - Additional archetype metadata
   */
  trackArchetypeDetected(archetype, confidence, metadata = {}) {
    this.track('archetype_detected', {
      archetype,
      confidence,
      pattern: 'personalized_defaults',
      ...metadata
    });
  }

  /**
   * Track when archetype default is applied to price slider
   *
   * @param {string} archetype - User archetype
   * @param {number} defaultPercentage - Applied default percentage
   */
  trackArchetypeDefaultApplied(archetype, defaultPercentage) {
    this.track('archetype_default_applied', {
      archetype,
      default_percentage: defaultPercentage,
      pattern: 'personalized_defaults'
    });
  }

  /**
   * Track archetype override by user
   *
   * @param {string} originalArchetype - Detected archetype
   * @param {string} overrideArchetype - User-selected archetype
   */
  trackArchetypeOverride(originalArchetype, overrideArchetype) {
    this.track('archetype_override', {
      original_archetype: originalArchetype,
      override_archetype: overrideArchetype,
      pattern: 'personalized_defaults'
    });
  }

  // ============================================================================
  // PATTERN 2: URGENCY COUNTDOWN - URGENCY EVENTS
  // ============================================================================

  /**
   * Track urgency calculation
   *
   * @param {string} urgencyLevel - CRITICAL, HIGH, MEDIUM, LOW
   * @param {number} multiplier - Price multiplier
   * @param {number} daysUntil - Days until check-in
   * @param {string} band - Urgency band color
   */
  trackUrgencyCalculated(urgencyLevel, multiplier, daysUntil, band) {
    this.track('urgency_calculated', {
      urgency_level: urgencyLevel,
      multiplier,
      days_until_checkin: daysUntil,
      urgency_band: band,
      pattern: 'urgency_countdown'
    });
  }

  /**
   * Track urgency acknowledgment by user
   *
   * @param {string} urgencyLevel - Urgency level acknowledged
   */
  trackUrgencyAcknowledged(urgencyLevel) {
    this.track('urgency_acknowledged', {
      urgency_level: urgencyLevel,
      pattern: 'urgency_countdown'
    });
  }

  /**
   * Track urgency warning dismissed
   *
   * @param {string} urgencyLevel - Urgency level
   * @param {string} dismissReason - Why user dismissed
   */
  trackUrgencyDismissed(urgencyLevel, dismissReason = null) {
    this.track('urgency_warning_dismissed', {
      urgency_level: urgencyLevel,
      dismiss_reason: dismissReason,
      pattern: 'urgency_countdown'
    });
  }

  // ============================================================================
  // PATTERN 3: PRICE ANCHORING - PRICING TIER EVENTS
  // ============================================================================

  /**
   * Track when pricing tiers are displayed
   *
   * @param {Array} tiers - Array of pricing tier objects
   */
  trackPriceTiersViewed(tiers) {
    this.track('price_tiers_viewed', {
      tier_count: tiers.length,
      tier_ids: tiers.map(t => t.id),
      tier_prices: tiers.map(t => t.price),
      recommended_tier: tiers.find(t => t.recommended)?.id,
      pattern: 'price_anchoring'
    });
  }

  /**
   * Track pricing tier selection
   *
   * @param {string} tierId - Selected tier ID
   * @param {number} price - Tier price
   * @param {number} basePrice - Base price for comparison
   * @param {boolean} wasRecommended - Was this the recommended tier?
   */
  trackPriceTierSelected(tierId, price, basePrice, wasRecommended = false) {
    const premiumPercentage = ((price - basePrice) / basePrice) * 100;

    this.track('price_tier_selected', {
      tier_id: tierId,
      price,
      base_price: basePrice,
      premium_percentage: premiumPercentage.toFixed(1),
      was_recommended: wasRecommended,
      pattern: 'price_anchoring'
    });
  }

  /**
   * Track custom price entry (instead of tier selection)
   *
   * @param {number} customPrice - User-entered price
   * @param {number} basePrice - Base price
   */
  trackCustomPriceEntered(customPrice, basePrice) {
    this.track('custom_price_entered', {
      custom_price: customPrice,
      base_price: basePrice,
      deviation_percentage: ((customPrice - basePrice) / basePrice * 100).toFixed(1),
      pattern: 'price_anchoring'
    });
  }

  // ============================================================================
  // PATTERN 4: BS+BS COMPETITION - COMPETITIVE BIDDING EVENTS
  // ============================================================================

  /**
   * Track when competitive indicators are shown
   *
   * @param {number} interestedUsers - Number of interested users
   * @param {number} currentHighestOffer - Current highest offer amount
   */
  trackCompetitiveIndicatorShown(interestedUsers, currentHighestOffer) {
    this.track('competitive_indicator_shown', {
      interested_users: interestedUsers,
      current_highest_offer: currentHighestOffer,
      pattern: 'bs_bs_competition'
    });
  }

  /**
   * Track counter-offer submission
   *
   * @param {number} originalOffer - Original offer amount
   * @param {number} counterOffer - New counter-offer amount
   */
  trackCounterOfferSubmitted(originalOffer, counterOffer) {
    const difference = counterOffer - originalOffer;
    const percentageIncrease = (difference / originalOffer) * 100;

    this.track('counter_offer_submitted', {
      original_offer: originalOffer,
      counter_offer: counterOffer,
      difference,
      percentage_increase: percentageIncrease.toFixed(1),
      pattern: 'bs_bs_competition'
    });
  }

  /**
   * Track roommate detection
   *
   * @param {string} pairingType - Type of pairing detected
   * @param {number} matchScore - How well nights complement (0-100)
   */
  trackRoommateDetected(pairingType, matchScore) {
    this.track('roommate_detected', {
      pairing_type: pairingType,
      match_score: matchScore,
      pattern: 'bs_bs_competition'
    });
  }

  // ============================================================================
  // PATTERN 5: FEE TRANSPARENCY - CONFIRMATION EVENTS
  // ============================================================================

  /**
   * Track confirmation page view
   *
   * @param {Object} confirmationData - Full confirmation data
   */
  trackConfirmationViewed(confirmationData) {
    this.track('confirmation_viewed', {
      archetype: confirmationData.archetype,
      tier: confirmationData.tier.id,
      total_price: confirmationData.tier.price,
      urgency_level: confirmationData.urgency.level,
      urgency_band: confirmationData.urgency.band,
      has_bsbs: !!confirmationData.bsbs,
      pattern: 'fee_transparency'
    });
  }

  /**
   * Track fee breakdown expansion/view
   *
   * @param {Object} feeBreakdown - Fee breakdown details
   */
  trackFeeBreakdownViewed(feeBreakdown) {
    this.track('fee_breakdown_viewed', {
      base_price: feeBreakdown.basePrice,
      platform_fee: feeBreakdown.platformFee,
      landlord_share: feeBreakdown.landlordShare,
      total_fee: feeBreakdown.totalFee,
      effective_rate: feeBreakdown.effectiveRate,
      savings_vs_traditional: feeBreakdown.savingsVsTraditional,
      pattern: 'fee_transparency'
    });
  }

  /**
   * Track final request submission (all patterns combined)
   *
   * @param {Object} requestData - Complete request data
   */
  trackRequestSubmitted(requestData) {
    this.track('date_change_request_submitted', {
      request_id: requestData.id,
      archetype: requestData.archetype,
      urgency_band: requestData.urgencyBand,
      urgency_level: requestData.urgencyLevel,
      selected_tier: requestData.selectedTier,
      total_price: requestData.feeBreakdown?.totalPrice,
      transaction_type: requestData.transactionType,
      is_bsbs: requestData.isBSBS,
      patterns_used: [
        'personalized_defaults',
        'urgency_countdown',
        'price_anchoring',
        requestData.isBSBS ? 'bs_bs_competition' : null,
        'fee_transparency'
      ].filter(Boolean)
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get or create session ID
   *
   * @returns {string} Session ID
   */
  getSessionId() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let sessionId = sessionStorage.getItem('analytics_session_id');

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Enable or disable analytics tracking
   *
   * @param {boolean} enabled - Whether to enable tracking
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[Analytics] Tracking ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Track page view
   *
   * @param {string} pageName - Page name
   * @param {Object} properties - Additional properties
   */
  page(pageName, properties = {}) {
    if (!this.enabled) return;

    const pageProperties = {
      ...properties,
      page_name: pageName,
      url: typeof window !== 'undefined' ? window.location.href : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null
    };

    console.log('[Analytics] Page view:', pageName, pageProperties);

    // Segment
    try {
      this.providers.segment?.page(pageName, pageProperties);
    } catch (error) {
      console.error('[Analytics] Segment page failed:', error);
    }

    // Mixpanel
    try {
      this.providers.mixpanel?.track('Page View', pageProperties);
    } catch (error) {
      console.error('[Analytics] Mixpanel page failed:', error);
    }

    // GA4
    try {
      this.providers.ga4?.('event', 'page_view', pageProperties);
    } catch (error) {
      console.error('[Analytics] GA4 page failed:', error);
    }
  }

  /**
   * Track error events
   *
   * @param {Error} error - Error object
   * @param {string} context - Where error occurred
   */
  trackError(error, context = 'unknown') {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      severity: 'error'
    });
  }

  /**
   * Flush events (for page unload)
   */
  flush() {
    try {
      this.providers.mixpanel?.track('Session End', {
        session_id: this.sessionId,
        duration_seconds: this.getSessionDuration()
      });
    } catch (error) {
      console.error('[Analytics] Flush failed:', error);
    }
  }

  /**
   * Get session duration in seconds
   *
   * @returns {number} Duration in seconds
   */
  getSessionDuration() {
    if (typeof sessionStorage === 'undefined') return 0;

    const sessionStart = sessionStorage.getItem('analytics_session_start');
    if (!sessionStart) {
      const now = Date.now();
      sessionStorage.setItem('analytics_session_start', now.toString());
      return 0;
    }

    return Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

// Export class for testing
export { AnalyticsService };
