import type { BiddingSession, BiddingParticipant, WinnerResult } from '../types.ts';
import { calculateLoserCompensation } from '../calculators/calculateLoserCompensation.ts';

/**
 * Determine the winner and loser of a completed bidding session.
 *
 * @rule Winner is the user with the highest bid (session.winnerUserId).
 * @rule Loser is the other participant.
 * @rule Loser receives 25% of winning bid as compensation.
 * @rule Platform revenue is winning bid minus loser compensation (75% of winning bid).
 */
export function determineWinner(
  session: BiddingSession,
  participants: BiddingParticipant[]
): WinnerResult {
  // Validate session has winner info
  if (!session.winnerUserId || !session.winningBidAmount) {
    throw new Error('Cannot determine winner: No bids in session');
  }

  // Validate exactly 2 participants
  if (participants.length !== 2) {
    throw new Error('Cannot determine winner: Must have exactly 2 participants');
  }

  // Find winner and loser
  const winner = participants.find((p) => p.userId === session.winnerUserId);
  const loser = participants.find((p) => p.userId !== session.winnerUserId);

  if (!winner || !loser) {
    throw new Error('Cannot find winner/loser in participants');
  }

  // Calculate amounts
  const winningBid = session.winningBidAmount;
  const loserCompensation = calculateLoserCompensation(winningBid);
  const platformRevenue = Math.round((winningBid - loserCompensation) * 100) / 100;

  return {
    winner,
    loser,
    winningBid,
    loserCompensation,
    platformRevenue,
  };
}
