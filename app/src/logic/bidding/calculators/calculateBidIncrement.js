/**
 * Calculate the increment between a new bid and the previous bid.
 *
 * @intent Calculate both the absolute amount and percentage increase of a bid.
 * @rule Used to track bid increments for analytics and validation.
 *
 * @param {object} params - Named parameters.
 * @param {number} params.newBid - The new bid amount.
 * @param {number} params.previousBid - The previous high bid amount.
 * @returns {{ amount: number, percent: number }} The increment amount and percentage.
 *
 * @example
 * calculateBidIncrement({ newBid: 1100, previousBid: 1000 })
 * // => { amount: 100, percent: 10 }
 *
 * calculateBidIncrement({ newBid: 1250, previousBid: 1000 })
 * // => { amount: 250, percent: 25 }
 *
 * calculateBidIncrement({ newBid: 100, previousBid: 0 })
 * // => { amount: 100, percent: 0 } (no percentage when no previous bid)
 */
export function calculateBidIncrement({ newBid, previousBid }) {
  // Calculate absolute increment
  const amount = newBid - previousBid;

  // Calculate percentage increment (avoid division by zero)
  let percent = 0;
  if (previousBid > 0) {
    percent = (amount / previousBid) * 100;
  }

  return {
    amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
    percent: Math.round(percent * 100) / 100, // Round to 2 decimal places
  };
}
