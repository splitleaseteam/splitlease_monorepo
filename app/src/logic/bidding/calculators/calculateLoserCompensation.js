/**
 * Calculate the loser's compensation amount based on the winning bid.
 *
 * @intent Calculate 25% compensation for the losing bidder.
 * @rule Loser receives 25% of the winning bid as compensation.
 * @rule Compensation encourages participation and reduces sting of losing.
 *
 * @param {object} params - Named parameters.
 * @param {number} params.winningBid - The winning bid amount.
 * @param {number} [params.compensationPercent=25] - The compensation percentage (default 25%).
 * @returns {number} The loser compensation amount (rounded to nearest cent).
 *
 * @example
 * calculateLoserCompensation({ winningBid: 1000 })
 * // => 250 (25% of winning bid)
 *
 * calculateLoserCompensation({ winningBid: 500, compensationPercent: 20 })
 * // => 100 (20% of winning bid)
 */
export function calculateLoserCompensation({ winningBid, compensationPercent = 25 }) {
  // Validate input
  if (winningBid === null || winningBid === undefined || winningBid <= 0) {
    return 0;
  }

  // Calculate compensation
  const compensation = winningBid * (compensationPercent / 100);

  // Round to nearest cent (2 decimal places)
  return Math.round(compensation * 100) / 100;
}
