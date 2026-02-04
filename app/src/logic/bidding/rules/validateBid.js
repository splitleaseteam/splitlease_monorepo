/**
 * Validate a proposed bid against session rules.
 *
 * @intent Enforce all bidding business rules before accepting a bid.
 * @rule Bid must exceed current high by minimum increment (10%).
 * @rule Cannot bid on own high bid (must wait for other user to bid).
 * @rule Session must be active (not pending, completed, expired, or cancelled).
 * @rule User cannot exceed maximum rounds (3 bids per user).
 * @rule Bid cannot exceed maximum allowed (2x current high or $100,000).
 * @rule Bid must meet minimum amount ($100).
 *
 * @param {object} params - Named parameters.
 * @param {number} params.proposedBid - The bid amount being validated.
 * @param {object} params.session - Current session state.
 * @param {string} params.userId - ID of user placing bid.
 * @param {Array} params.bidHistory - Array of all bids in session.
 * @returns {{ valid: boolean, errors: string[], minimumNextBid: number, maximumAllowed: number, suggestedBid: number }}
 *
 * @example
 * validateBid({ proposedBid: 1100, session, userId: 'user_123', bidHistory: [] })
 * // => { valid: true, errors: [], minimumNextBid: 1100, maximumAllowed: 2000, suggestedBid: 1150 }
 *
 * validateBid({ proposedBid: 1050, session: { winningBidAmount: 1000 }, userId: 'user_123', bidHistory: [] })
 * // => { valid: false, errors: ['Minimum bid is $1,100.00 (10% increment required)'], ... }
 */
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.js';

const DEFAULT_MAX_ROUNDS = 3;
const DEFAULT_MINIMUM_INCREMENT_PERCENT = 10;
const MIN_BID_AMOUNT = 100;
const MAX_BID_AMOUNT = 100000;

export function validateBid({ proposedBid, session, userId, bidHistory }) {
  const errors = [];

  // Get current high bid
  const currentHigh = session.winningBidAmount || 0;

  // Calculate minimum increment
  const minimumIncrementPercent = session.minimumIncrementPercent || DEFAULT_MINIMUM_INCREMENT_PERCENT;
  const minimumNextBid = calculateMinimumNextBid({
    currentHighBid: currentHigh,
    minimumIncrementPercent
  });

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
  if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
    errors.push('Bidding session has expired');
  }

  // Rule 4: Within max rounds per user
  const userBids = bidHistory.filter((bid) => bid.userId === userId);
  const maxRounds = session.maxRounds || DEFAULT_MAX_ROUNDS;

  if (userBids.length >= maxRounds) {
    errors.push(`Maximum ${maxRounds} bids per user reached`);
  }

  // Rule 5: Reasonable maximum (2x current high or system max)
  const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : MAX_BID_AMOUNT;
  if (proposedBid > maximumAllowed) {
    errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
  }

  // Rule 6: Minimum bid amount
  if (proposedBid < MIN_BID_AMOUNT) {
    errors.push(`Bid must be at least $${MIN_BID_AMOUNT}`);
  }

  // Suggested bid (current + 15% as recommendation)
  const suggestedBid = currentHigh > 0
    ? Math.round(currentHigh * 1.15 * 100) / 100
    : MIN_BID_AMOUNT;

  return {
    valid: errors.length === 0,
    errors,
    minimumNextBid: minimumNextBid || MIN_BID_AMOUNT,
    maximumAllowed,
    suggestedBid: Math.max(suggestedBid, minimumNextBid || MIN_BID_AMOUNT),
  };
}

/**
 * Format currency for display (without $ symbol)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
