/**
 * CALCULATOR: Calculate Minimum Bid
 *
 * Calculates the minimum valid bid amount based on current high bid
 * and minimum increment percentage (10%).
 *
 * Pure function - no side effects.
 *
 * @module logic/bidding/calculators
 */

/**
 * Calculate minimum next bid
 *
 * Rules:
 * - If no current high bid, any positive amount is valid
 * - If current high bid exists, must exceed by minimum increment (10%)
 *
 * @param {Object} params
 * @param {number} params.currentHighBid - Current high bid amount (0 if none)
 * @param {number} params.minimumIncrement - Minimum increment amount
 * @returns {number} Minimum valid next bid amount
 *
 * @example
 * // First bid
 * calculateMinimumBid({ currentHighBid: 0, minimumIncrement: 0 })
 * // → 0 (any amount valid)
 *
 * @example
 * // Subsequent bids
 * calculateMinimumBid({ currentHighBid: 1000, minimumIncrement: 100 })
 * // → 1100 (current + increment)
 */
export function calculateMinimumBid({ currentHighBid, minimumIncrement }) {
  if (currentHighBid === 0) {
    return 0; // First bid - any positive amount valid
  }

  return currentHighBid + minimumIncrement;
}

/**
 * Calculate minimum increment amount (10% of current high bid)
 *
 * @param {Object} params
 * @param {number} params.currentHighBid - Current high bid amount
 * @param {number} [params.incrementPercent=10] - Increment percentage (default 10%)
 * @returns {number} Minimum increment amount (rounded up)
 *
 * @example
 * calculateMinimumIncrement({ currentHighBid: 1000 })
 * // → 100 (10% of 1000)
 *
 * @example
 * calculateMinimumIncrement({ currentHighBid: 1000, incrementPercent: 15 })
 * // → 150 (15% of 1000)
 */
export function calculateMinimumIncrement({ currentHighBid, incrementPercent = 10 }) {
  return Math.ceil(currentHighBid * (incrementPercent / 100));
}

/**
 * Calculate suggested bid (15% above current high)
 *
 * @param {Object} params
 * @param {number} params.currentHighBid - Current high bid amount
 * @returns {number} Suggested bid amount (rounded to nearest 10)
 *
 * @example
 * calculateSuggestedBid({ currentHighBid: 1000 })
 * // → 1150 (15% increase, rounded)
 */
export function calculateSuggestedBid({ currentHighBid }) {
  if (currentHighBid === 0) {
    return 0; // No suggestion for first bid
  }

  const suggested = currentHighBid * 1.15;
  return Math.round(suggested / 10) * 10; // Round to nearest 10
}

export default {
  calculateMinimumBid,
  calculateMinimumIncrement,
  calculateSuggestedBid
};
