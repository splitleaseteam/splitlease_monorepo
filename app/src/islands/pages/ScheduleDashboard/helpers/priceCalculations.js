/**
 * Pricing calculation utilities for 3-Tier Model
 * @module helpers/priceCalculations
 */

/**
 * Default notice period multipliers
 * Maps notice threshold to price multiplier
 */
export const DEFAULT_NOTICE_MULTIPLIERS = {
  flexible: 1.0,      // 30+ days notice ("Far Off")
  standard: 1.1,      // 14-30 days notice
  inconvenient: 1.5,  // 7-14 days notice
  disruptive: 2.0,    // <7 days notice
  emergency: 3.0      // <48 hours notice
};

/**
 * Edge preference multipliers by day of week
 * Key: edgePreference setting
 * Value: Object mapping dayOfWeek (0-6) to multiplier
 * NOTE: Only applies to Buyout requests
 */
export const EDGE_MULTIPLIERS = {
  start_cheaper: { 0: 1.0, 1: 0.8, 2: 0.9, 3: 1.0, 4: 1.1, 5: 1.2, 6: 1.0 },
  neutral:       { 0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0 },
  end_cheaper:   { 0: 1.0, 1: 1.2, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.8, 6: 1.0 }
};

/**
 * Sharing willingness multipliers
 * NOTE: Only applies to Share requests
 */
export const SHARING_MULTIPLIERS = {
  accommodating: 0.5,   // 50% - "Happy to Share"
  standard: 1.0,        // 100% - "Willing to Share"
  reluctant: 1.5        // 150% - "Only if You Really Need It"
};

/**
 * Determine notice threshold based on days until date
 * @param {number} daysUntil - Days from today to target date
 * @returns {'emergency'|'disruptive'|'inconvenient'|'standard'|'flexible'}
 */
export function getNoticeThresholdForDate(daysUntil) {
  if (daysUntil < 2) return 'emergency';
  if (daysUntil < 7) return 'disruptive';
  if (daysUntil < 14) return 'inconvenient';
  if (daysUntil < 30) return 'standard';
  return 'flexible';
}

/**
 * Calculate price for a Share request
 * Formula: BaseRate × NoticeMultiplier × SharingMultiplier
 * @param {number} baseRate - Base nightly rate
 * @param {string} noticeTier - Notice threshold key
 * @param {string} sharingWillingness - Sharing willingness key
 * @param {object} noticeMultipliers - Custom notice multipliers (optional)
 * @returns {number} Calculated share price
 */
export function calculateSharePrice(baseRate, noticeTier, sharingWillingness, noticeMultipliers = DEFAULT_NOTICE_MULTIPLIERS) {
  const noticeMultiplier = noticeMultipliers[noticeTier] ?? 1.0;
  const sharingMultiplier = SHARING_MULTIPLIERS[sharingWillingness] ?? 1.0;
  return Math.round(baseRate * noticeMultiplier * sharingMultiplier);
}

/**
 * Calculate price for a Buyout request
 * Formula: BaseRate × NoticeMultiplier × EdgeMultiplier
 * @param {number} baseRate - Base nightly rate
 * @param {string} noticeTier - Notice threshold key
 * @param {string} edgePreference - Edge preference key
 * @param {number} dayOfWeek - Day of week (0-6)
 * @param {object} noticeMultipliers - Custom notice multipliers (optional)
 * @returns {number} Calculated buyout price
 */
export function calculateBuyoutPrice(baseRate, noticeTier, edgePreference, dayOfWeek, noticeMultipliers = DEFAULT_NOTICE_MULTIPLIERS) {
  const noticeMultiplier = noticeMultipliers[noticeTier] ?? 1.0;
  const edgeMultiplier = EDGE_MULTIPLIERS[edgePreference]?.[dayOfWeek] ?? 1.0;
  return Math.round(baseRate * noticeMultiplier * edgeMultiplier);
}

/**
 * Calculate price for a specific date using request-type-aware logic
 * @param {Date} date - Target date
 * @param {object} pricingStrategy - User's pricing preferences
 * @param {Date} today - Reference date for notice calculation
 * @param {string} requestType - 'full_week' | 'share' | 'alternating'
 * @returns {number} Calculated price
 */
export function calculatePriceForDate(date, pricingStrategy, today = new Date(), requestType = 'full_week') {
  // Swap requests are always free
  if (requestType === 'alternating') return 0;

  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);

  // Support both old (baseCostValue) and new (baseRate) schema
  const baseRate = pricingStrategy.baseRate ?? pricingStrategy.baseCostValue ?? 150;
  const noticeMultipliers = pricingStrategy.noticeMultipliers || DEFAULT_NOTICE_MULTIPLIERS;

  const dayOfWeek = date.getDay();
  const daysDiff = Math.floor((date - todayNormalized) / (1000 * 60 * 60 * 24));
  const noticeTier = getNoticeThresholdForDate(daysDiff);

  if (requestType === 'share') {
    return calculateSharePrice(baseRate, noticeTier, pricingStrategy.sharingWillingness, noticeMultipliers);
  }

  // Default: Buyout
  return calculateBuyoutPrice(baseRate, noticeTier, pricingStrategy.edgePreference, dayOfWeek, noticeMultipliers);
}

/**
 * Determine visual tier for price overlay styling
 * @param {string} noticeThreshold - Notice threshold level
 * @returns {'within'|'near'|'limit'}
 */
export function getTierForNoticeThreshold(noticeThreshold) {
  if (noticeThreshold === 'emergency' || noticeThreshold === 'disruptive') {
    return 'limit'; // High urgency = red
  }
  if (noticeThreshold === 'inconvenient') {
    return 'near'; // Medium urgency = yellow
  }
  return 'within'; // Low urgency = green
}

/**
 * Calculate price deviation percentage
 * @param {number} offeredPrice - Price the requester is offering
 * @param {number} suggestedPrice - Calculated suggested price from recipient's settings
 * @returns {{ percentage: number, tier: 'fair'|'low'|'very-low' }}
 */
export function calculatePriceDeviation(offeredPrice, suggestedPrice) {
  if (!suggestedPrice || suggestedPrice === 0) return { percentage: 0, tier: 'fair' };

  const deviation = ((offeredPrice - suggestedPrice) / suggestedPrice) * 100;

  let tier = 'fair';
  if (deviation < -20) tier = 'very-low';
  else if (deviation < -10) tier = 'low';

  return {
    percentage: Math.round(deviation),
    tier
  };
}

/**
 * Get fairness indicator for price offer
 * @param {number} offeredPrice
 * @param {number} suggestedPrice
 * @returns {{ emoji: string, label: string, color: string }}
 */
export function getFairnessIndicator(offeredPrice, suggestedPrice) {
  const { tier } = calculatePriceDeviation(offeredPrice, suggestedPrice);

  if (tier === 'very-low') {
    return { emoji: '🟠', label: 'Below suggested', color: '#F59E0B' };
  }
  if (tier === 'low') {
    return { emoji: '🟡', label: 'Slightly below', color: '#EAB308' };
  }
  return { emoji: '🟢', label: 'Fair offer', color: '#22C55E' };
}
