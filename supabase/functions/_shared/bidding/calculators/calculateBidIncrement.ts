/**
 * Calculate the increment between a new bid and the previous bid.
 *
 * @rule Used to track bid increments for analytics and validation.
 */
export interface BidIncrementResult {
  amount: number;
  percent: number;
}

export function calculateBidIncrement(
  newBid: number,
  previousBid: number
): BidIncrementResult {
  const amount = newBid - previousBid;

  // Calculate percentage increment (avoid division by zero)
  let percent = 0;
  if (previousBid > 0) {
    percent = (amount / previousBid) * 100;
  }

  return {
    amount: Math.round(amount * 100) / 100,
    percent: Math.round(percent * 100) / 100,
  };
}
