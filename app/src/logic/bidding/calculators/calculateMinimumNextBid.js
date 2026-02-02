/**
 * Calculate the minimum next bid amount based on current high bid and increment percentage.
 *
 * @intent Calculate the minimum acceptable bid amount for the next bid.
 * @rule New bids must exceed current high by at least the minimum increment percentage.
 * @rule Default minimum increment is 10% of current high bid.
 *
 * @param {object} params - Named parameters.
 * @param {number} params.currentHighBid - The current highest bid amount.
 * @param {number} [params.minimumIncrementPercent=10] - The minimum percentage increment required.
 * @returns {number} The minimum acceptable next bid amount (rounded to nearest cent).
 *
 * @example
 * calculateMinimumNextBid({ currentHighBid: 1000 })
 * // => 1100 (10% increment)
 *
 * calculateMinimumNextBid({ currentHighBid: 1000, minimumIncrementPercent: 15 })
 * // => 1150 (15% increment)
 *
 * calculateMinimumNextBid({ currentHighBid: 0 })
 * // => 0 (no minimum when no bids yet)
 */
export function calculateMinimumNextBid({ currentHighBid, minimumIncrementPercent = 10 }) {
  // Handle edge case of no current bids
  if (currentHighBid === 0 || currentHighBid === null || currentHighBid === undefined) {
    return 0;
  }

  // Calculate the minimum increment amount
  const minimumIncrement = currentHighBid * (minimumIncrementPercent / 100);

  // Calculate minimum next bid
  const minimumNextBid = currentHighBid + minimumIncrement;

  // Round to nearest cent (2 decimal places)
  return Math.round(minimumNextBid * 100) / 100;
}
