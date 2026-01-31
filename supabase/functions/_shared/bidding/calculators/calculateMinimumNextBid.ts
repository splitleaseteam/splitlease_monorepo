/**
 * Calculate the minimum next bid amount based on current high bid and increment percentage.
 *
 * @rule New bids must exceed current high by at least the minimum increment percentage.
 * @rule Default minimum increment is 10% of current high bid.
 */
export function calculateMinimumNextBid(
  currentHighBid: number,
  minimumIncrementPercent: number = 10
): number {
  // Handle edge case of no current bids
  if (currentHighBid === 0 || currentHighBid === null || currentHighBid === undefined) {
    return 0;
  }

  // Calculate the minimum increment amount
  const minimumIncrement = currentHighBid * (minimumIncrementPercent / 100);

  // Calculate minimum next bid and round to nearest cent
  return Math.round((currentHighBid + minimumIncrement) * 100) / 100;
}
