import type { BiddingSession, Bid } from '../types.ts';
import { isSessionExpired } from './isSessionExpired.ts';
import { BIDDING_CONSTANTS } from '../constants.ts';

/**
 * Determine if a bidding session should be finalized.
 *
 * @rule Session should be finalized if it has expired (time limit reached).
 * @rule Session should be finalized if both users have reached max rounds.
 * @rule Only active sessions can be finalized.
 */
export function shouldFinalizeSession(
  session: BiddingSession,
  bidHistory: Bid[]
): boolean {
  // Only active sessions can be finalized
  if (session.status !== 'active') {
    return false;
  }

  // Check expiration
  if (isSessionExpired(session)) {
    return true;
  }

  // Check if both users have reached max rounds
  const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;
  const userBidCounts = new Map<string, number>();

  bidHistory.forEach((bid) => {
    const count = userBidCounts.get(bid.userId) || 0;
    userBidCounts.set(bid.userId, count + 1);
  });

  // Need at least 2 participants who have both bid
  if (userBidCounts.size < 2) {
    return false;
  }

  // Check if ALL participants have reached max rounds
  return Array.from(userBidCounts.values()).every((count) => count >= maxRounds);
}
