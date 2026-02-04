/**
 * Calculate Notice-Based Buyout Pricing
 *
 * Adapted from Pattern 2 urgency calculations for roommate buyout context.
 * More notice = lower price (reward for planning ahead)
 * Less notice = higher price (compensation for disruption)
 *
 * @intent Calculate fair buyout prices based on how much advance notice is given
 * @rule Prices increase as notice period decreases
 * @rule Minimum multiplier is 1.0x (base rate) for 14+ days notice
 * @rule Maximum multiplier is 2.0x for same-day requests
 */

// Notice period thresholds and multipliers
export const NOTICE_TIERS = {
  GENEROUS: { minDays: 14, multiplier: 1.0, label: 'Generous notice', description: 'Plenty of time to adjust' },
  STANDARD: { minDays: 7, multiplier: 1.15, label: 'Standard notice', description: 'Reasonable advance notice' },
  SHORT: { minDays: 3, multiplier: 1.35, label: 'Short notice', description: 'Limited time to adjust' },
  URGENT: { minDays: 1, multiplier: 1.6, label: 'Urgent', description: 'Very short notice' },
  SAME_DAY: { minDays: 0, multiplier: 2.0, label: 'Same day', description: 'Maximum inconvenience' },
};

/**
 * Get notice tier based on days until target date
 *
 * @param {number} daysUntil - Days until the target date
 * @returns {object} Notice tier with multiplier and label
 */
export function getNoticeTier(daysUntil) {
  if (daysUntil >= 14) return NOTICE_TIERS.GENEROUS;
  if (daysUntil >= 7) return NOTICE_TIERS.STANDARD;
  if (daysUntil >= 3) return NOTICE_TIERS.SHORT;
  if (daysUntil >= 1) return NOTICE_TIERS.URGENT;
  return NOTICE_TIERS.SAME_DAY;
}

/**
 * Calculate days between today and target date
 *
 * @param {Date|string} targetDate - The target date
 * @returns {number} Days until target (minimum 0)
 */
export function calculateDaysUntil(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = typeof targetDate === 'string'
    ? new Date(targetDate + 'T12:00:00')
    : new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate suggested buyout price based on notice period
 *
 * @param {number} baseRate - Roommate's base buyout rate
 * @param {Date|string} targetDate - Date being bought out
 * @returns {object} Pricing details including suggested price and tier info
 *
 * @example
 * calculateSuggestedBuyoutPrice(100, '2026-02-14')
 * // => {
 * //   baseRate: 100,
 * //   daysUntil: 7,
 * //   tier: { minDays: 7, multiplier: 1.15, label: 'Standard notice' },
 * //   multiplier: 1.15,
 * //   suggestedPrice: 115,
 * //   adjustment: 15,
 * //   adjustmentPercent: 15
 * // }
 */
export function calculateSuggestedBuyoutPrice(baseRate, targetDate) {
  const daysUntil = calculateDaysUntil(targetDate);
  const tier = getNoticeTier(daysUntil);

  const suggestedPrice = Math.round(baseRate * tier.multiplier);
  const adjustment = suggestedPrice - baseRate;

  return {
    baseRate,
    daysUntil,
    tier,
    multiplier: tier.multiplier,
    suggestedPrice,
    adjustment,
    adjustmentPercent: Math.round((tier.multiplier - 1) * 100),
  };
}

/**
 * Calculate prices for multiple dates (for calendar display)
 *
 * @param {number} baseRate - Roommate's base buyout rate
 * @param {Array<string>} dates - Array of date strings (YYYY-MM-DD)
 * @returns {Map<string, number>} Map of date string to suggested price
 *
 * @example
 * calculateBuyoutPricesForDates(100, ['2026-02-10', '2026-02-14', '2026-02-20'])
 * // => Map { '2026-02-10' => 135, '2026-02-14' => 115, '2026-02-20' => 100 }
 */
export function calculateBuyoutPricesForDates(baseRate, dates) {
  const priceMap = new Map();

  for (const dateStr of dates) {
    const pricing = calculateSuggestedBuyoutPrice(baseRate, dateStr);
    priceMap.set(dateStr, pricing.suggestedPrice);
  }

  return priceMap;
}

/**
 * Get savings message for booking earlier
 *
 * @param {object} currentPricing - Current pricing details from calculateSuggestedBuyoutPrice
 * @returns {string|null} Savings message or null if already at base rate
 */
export function getSavingsMessage(currentPricing) {
  if (!currentPricing || currentPricing.multiplier <= 1.0) {
    return null;
  }

  const { baseRate, suggestedPrice, tier } = currentPricing;
  const potentialSavings = suggestedPrice - baseRate;

  if (tier === NOTICE_TIERS.SAME_DAY) {
    return `Request 1+ day earlier to save $${potentialSavings}`;
  }
  if (tier === NOTICE_TIERS.URGENT) {
    return `Request 3+ days earlier to save $${Math.round(baseRate * 0.35)}`;
  }
  if (tier === NOTICE_TIERS.SHORT) {
    return `Request 7+ days earlier to save $${Math.round(baseRate * 0.2)}`;
  }
  if (tier === NOTICE_TIERS.STANDARD) {
    return `Request 14+ days earlier for base rate`;
  }

  return null;
}

/**
 * Format price for display
 *
 * @param {number} price - Price in dollars
 * @returns {string} Formatted price string
 */
export function formatBuyoutPrice(price) {
  if (price === null || price === undefined || isNaN(price)) {
    return '—';
  }
  return `$${Math.round(price)}`;
}
