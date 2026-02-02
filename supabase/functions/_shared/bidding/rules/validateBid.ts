import type { BiddingSession, Bid, BidValidationResult } from '../types.ts';
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.ts';
import { BIDDING_CONSTANTS, formatCurrency } from '../constants.ts';

/**
 * Validate a proposed bid against session rules.
 *
 * @rule Bid must exceed current high by minimum increment (10%).
 * @rule Cannot bid on own high bid (must wait for other user to bid).
 * @rule Session must be active (not pending, completed, expired, or cancelled).
 * @rule User cannot exceed maximum rounds (3 bids per user).
 * @rule Bid cannot exceed maximum allowed (2x current high or $100,000).
 * @rule Bid must meet minimum amount ($100).
 */
export function validateBid(
  proposedBid: number,
  session: BiddingSession,
  userId: string,
  bidHistory: Bid[]
): BidValidationResult {
  const errors: string[] = [];

  // Get current high bid
  const currentHigh = session.winningBidAmount || 0;

  // Calculate minimum increment
  const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
  const minimumNextBid = calculateMinimumNextBid(currentHigh, minimumIncrementPercent);

  // Rule 1: Must exceed current high bid by minimum increment
  if (currentHigh > 0 && proposedBid <= currentHigh) {
    errors.push(`Bid must exceed current high bid ($${formatCurrency(currentHigh)})`);
  }

  if (currentHigh > 0 && proposedBid < minimumNextBid) {
    errors.push(
      `Minimum bid is $${formatCurrency(minimumNextBid)} ` +
      `(${minimumIncrementPercent}% increment required)`
    );
  }

  // Rule 2: Cannot bid on own high bid
  if (session.winnerUserId === userId) {
    errors.push('You already have the high bid');
  }

  // Rule 3: Session must be active
  if (session.status !== 'active') {
    errors.push(`Bidding session has ${session.status} status`);
  }

  // Check if session expired
  if (session.expiresAt) {
    const expiresAt = session.expiresAt instanceof Date
      ? session.expiresAt
      : new Date(session.expiresAt);
    if (new Date() > expiresAt) {
      errors.push('Bidding session has expired');
    }
  }

  // Rule 4: Within max rounds per user
  const userBids = bidHistory.filter((bid) => bid.userId === userId);
  const maxRounds = session.maxRounds || BIDDING_CONSTANTS.DEFAULT_MAX_ROUNDS;

  if (userBids.length >= maxRounds) {
    errors.push(`Maximum ${maxRounds} bids per user reached`);
  }

  // Rule 5: Reasonable maximum (2x current high or system max)
  const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : BIDDING_CONSTANTS.MAX_BID_AMOUNT;
  if (proposedBid > maximumAllowed) {
    errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
  }

  // Rule 6: Minimum bid amount
  if (proposedBid < BIDDING_CONSTANTS.MIN_BID_AMOUNT) {
    errors.push(`Bid must be at least $${BIDDING_CONSTANTS.MIN_BID_AMOUNT}`);
  }

  // Suggested bid (current + 15% as recommendation)
  const suggestedBid = currentHigh > 0
    ? Math.round(currentHigh * 1.15 * 100) / 100
    : BIDDING_CONSTANTS.MIN_BID_AMOUNT;

  return {
    valid: errors.length === 0,
    errors,
    minimumNextBid: minimumNextBid || BIDDING_CONSTANTS.MIN_BID_AMOUNT,
    maximumAllowed,
    suggestedBid: Math.max(suggestedBid, minimumNextBid || BIDDING_CONSTANTS.MIN_BID_AMOUNT),
  };
}
