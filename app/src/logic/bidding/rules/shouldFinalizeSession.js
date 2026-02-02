/**
 * Determine if a bidding session should be finalized.
 *
 * @intent Check if session has met conditions for finalization.
 * @rule Session should be finalized if it has expired (time limit reached).
 * @rule Session should be finalized if both users have reached max rounds.
 * @rule Only active sessions can be finalized.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.session - The bidding session to check.
 * @param {Array} params.bidHistory - Array of all bids in session.
 * @returns {boolean} True if session should be finalized.
 *
 * @example
 * shouldFinalizeSession({ session: { status: 'active', expiresAt: '2026-01-01' }, bidHistory: [] })
 * // => true (if past expiration date)
 *
 * shouldFinalizeSession({ session: { status: 'completed' }, bidHistory: [] })
 * // => false (already completed)
 */
import { isSessionExpired } from './isSessionExpired.js';

const DEFAULT_MAX_ROUNDS = 3;

export function shouldFinalizeSession({ session, bidHistory }) {
  // Only active sessions can be finalized
  if (session.status !== 'active') {
    return false;
  }

  // Check expiration
  if (isSessionExpired({ session })) {
    return true;
  }

  // Check if both users have reached max rounds
  const maxRounds = session.maxRounds || DEFAULT_MAX_ROUNDS;
  const userBidCounts = new Map();

  bidHistory.forEach((bid) => {
    const count = userBidCounts.get(bid.userId) || 0;
    userBidCounts.set(bid.userId, count + 1);
  });

  // Need at least 2 participants who have both bid
  if (userBidCounts.size < 2) {
    return false;
  }

  // Check if ALL participants have reached max rounds
  const allReachedMax = Array.from(userBidCounts.values()).every(
    (count) => count >= maxRounds
  );

  return allReachedMax;
}
