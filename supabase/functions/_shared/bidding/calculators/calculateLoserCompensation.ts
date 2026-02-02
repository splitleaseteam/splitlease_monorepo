/**
 * Calculate the loser's compensation amount based on the winning bid.
 *
 * @rule Loser receives 25% of the winning bid as compensation.
 * @rule Compensation encourages participation and reduces sting of losing.
 */
export function calculateLoserCompensation(
  winningBid: number,
  compensationPercent: number = 25
): number {
  if (winningBid === null || winningBid === undefined || winningBid <= 0) {
    return 0;
  }

  // Round to nearest cent
  return Math.round(winningBid * (compensationPercent / 100) * 100) / 100;
}
