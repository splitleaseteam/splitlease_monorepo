/**
 * CALCULATOR: Calculate Compensation
 *
 * Calculates financial breakdown for completed bidding session:
 * - Loser compensation (25% of winning bid)
 * - Platform revenue (75% of winning bid)
 *
 * Pure function - no side effects.
 *
 * @module logic/bidding/calculators
 */

/**
 * Calculate loser compensation amount
 *
 * Rule: Loser receives 25% of winning bid amount
 *
 * @param {Object} params
 * @param {number} params.winningBid - Final winning bid amount
 * @returns {number} Compensation amount (rounded to cents)
 *
 * @example
 * calculateLoserCompensation({ winningBid: 2000 })
 * // → 500 (25% of 2000)
 *
 * @example
 * calculateLoserCompensation({ winningBid: 2835 })
 * // → 708.75 (25% of 2835)
 */
export function calculateLoserCompensation({ winningBid }) {
  return Math.round(winningBid * 0.25 * 100) / 100; // Round to cents
}

/**
 * Calculate platform revenue
 *
 * Rule: Platform keeps 75% of winning bid (100% - 25% compensation)
 *
 * @param {Object} params
 * @param {number} params.winningBid - Final winning bid amount
 * @param {number} [params.compensation] - Pre-calculated compensation (optional)
 * @returns {number} Platform revenue amount (rounded to cents)
 *
 * @example
 * calculatePlatformRevenue({ winningBid: 2000 })
 * // → 1500 (75% of 2000)
 *
 * @example
 * // With pre-calculated compensation
 * calculatePlatformRevenue({ winningBid: 2835, compensation: 708.75 })
 * // → 2126.25 (2835 - 708.75)
 */
export function calculatePlatformRevenue({ winningBid, compensation }) {
  if (compensation !== undefined) {
    return Math.round((winningBid - compensation) * 100) / 100;
  }

  return Math.round(winningBid * 0.75 * 100) / 100; // Round to cents
}

/**
 * Calculate complete financial breakdown
 *
 * @param {Object} params
 * @param {number} params.winningBid - Final winning bid amount
 * @returns {Object} Financial breakdown
 * @returns {number} return.winningBid - Final winning bid
 * @returns {number} return.loserCompensation - Amount paid to loser (25%)
 * @returns {number} return.platformRevenue - Amount kept by platform (75%)
 * @returns {number} return.compensationPercent - Compensation percentage (always 25)
 * @returns {number} return.revenuePercent - Revenue percentage (always 75)
 *
 * @example
 * calculateFinancialBreakdown({ winningBid: 2000 })
 * // → {
 * //   winningBid: 2000,
 * //   loserCompensation: 500,
 * //   platformRevenue: 1500,
 * //   compensationPercent: 25,
 * //   revenuePercent: 75
 * // }
 */
export function calculateFinancialBreakdown({ winningBid }) {
  const loserCompensation = calculateLoserCompensation({ winningBid });
  const platformRevenue = calculatePlatformRevenue({ winningBid, compensation: loserCompensation });

  return {
    winningBid,
    loserCompensation,
    platformRevenue,
    compensationPercent: 25,
    revenuePercent: 75
  };
}

export default {
  calculateLoserCompensation,
  calculatePlatformRevenue,
  calculateFinancialBreakdown
};
