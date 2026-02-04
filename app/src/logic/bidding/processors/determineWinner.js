/**
 * Determine the winner and loser of a completed bidding session.
 *
 * @intent Calculate final outcome including winner, loser, compensation, and platform revenue.
 * @rule Winner is the user with the highest bid (session.winnerUserId).
 * @rule Loser is the other participant.
 * @rule Loser receives 25% of winning bid as compensation.
 * @rule Platform revenue is winning bid minus loser compensation (75% of winning bid).
 *
 * @param {object} params - Named parameters.
 * @param {object} params.session - The completed bidding session.
 * @param {Array} params.participants - Array of session participants.
 * @returns {{ winner: object, loser: object, winningBid: number, loserCompensation: number, platformRevenue: number }}
 *
 * @throws {Error} If session has no bids or winner cannot be determined.
 * @throws {Error} If there are not exactly 2 participants.
 *
 * @example
 * determineWinner({
 *   session: { winnerUserId: 'u1', winningBidAmount: 1000 },
 *   participants: [
 *     { userId: 'u1', userName: 'Alice' },
 *     { userId: 'u2', userName: 'Bob' }
 *   ]
 * })
 * // => { winner: { userId: 'u1' }, loser: { userId: 'u2' }, winningBid: 1000, loserCompensation: 250, platformRevenue: 750 }
 */
import { calculateLoserCompensation } from '../calculators/calculateLoserCompensation.js';

export function determineWinner({ session, participants }) {
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
  const loserCompensation = calculateLoserCompensation({ winningBid });
  const platformRevenue = Math.round((winningBid - loserCompensation) * 100) / 100;

  return {
    winner,
    loser,
    winningBid,
    loserCompensation,
    platformRevenue,
  };
}
