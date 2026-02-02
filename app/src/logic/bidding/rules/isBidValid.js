/**
 * RULE: Is Bid Valid
 *
 * Validates a proposed bid against all bidding rules.
 *
 * Validation Rules:
 * 1. Must exceed current high bid
 * 2. Must meet minimum increment (10%)
 * 3. Cannot bid on own high bid
 * 4. Session must be active
 * 5. Within max rounds limit
 * 6. Reasonable maximum (2x current high)
 *
 * Pure function - no side effects.
 *
 * @module logic/bidding/rules
 */

import { calculateMinimumBid, calculateSuggestedBid } from '../calculators/calculateMinimumBid.js';

/**
 * Validate a proposed bid
 *
 * @param {Object} params
 * @param {number} params.proposedBid - Bid amount to validate
 * @param {Object} params.session - Bidding session
 * @param {Object|null} params.session.currentHighBid - Current high bid
 * @param {number} params.session.minimumIncrement - Minimum increment amount
 * @param {string} params.session.status - Session status
 * @param {Array} params.session.biddingHistory - Bid history
 * @param {number} params.session.maxRounds - Max rounds per user
 * @param {string} params.userId - User placing the bid
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - True if bid is valid
 * @returns {string[]} return.errors - Array of error messages
 * @returns {string[]} return.warnings - Array of warning messages
 * @returns {number} return.minimumNextBid - Minimum valid bid
 * @returns {number} return.maximumAllowed - Maximum reasonable bid
 * @returns {number} return.suggestedBid - Suggested bid amount
 *
 * @example
 * // Valid bid
 * isBidValid({
 *   proposedBid: 1100,
 *   session: {
 *     currentHighBid: { amount: 1000, userId: 'user_2' },
 *     minimumIncrement: 100,
 *     status: 'active',
 *     biddingHistory: [],
 *     maxRounds: 3
 *   },
 *   userId: 'user_1'
 * })
 * // → { valid: true, errors: [], warnings: [], minimumNextBid: 1100, maximumAllowed: 2000, suggestedBid: 1150 }
 *
 * @example
 * // Invalid bid (too low)
 * isBidValid({
 *   proposedBid: 1050,
 *   session: {
 *     currentHighBid: { amount: 1000, userId: 'user_2' },
 *     minimumIncrement: 100,
 *     status: 'active',
 *     biddingHistory: [],
 *     maxRounds: 3
 *   },
 *   userId: 'user_1'
 * })
 * // → { valid: false, errors: ['Minimum bid is $1,100 (10% increment required)'], ... }
 */
export function isBidValid({ proposedBid, session, userId }) {
  const errors = [];
  const warnings = [];

  const currentHigh = session.currentHighBid?.amount || 0;
  const minimumIncrement = session.minimumIncrement;

  const minimumNextBid = calculateMinimumBid({
    currentHighBid: currentHigh,
    minimumIncrement
  });

  const suggestedBid = calculateSuggestedBid({
    currentHighBid: currentHigh
  });

  // Rule 1: Must exceed current high bid
  if (currentHigh > 0 && proposedBid <= currentHigh) {
    errors.push(`Bid must exceed current high bid of $${formatCurrency(currentHigh)}`);
  }

  // Rule 2: Must meet minimum increment
  if (currentHigh > 0 && proposedBid < minimumNextBid) {
    errors.push(
      `Minimum bid is $${formatCurrency(minimumNextBid)} (10% increment required)`
    );
  }

  // Rule 3: Cannot bid on own high bid
  if (session.currentHighBid?.userId === userId) {
    errors.push('You already have the high bid');
  }

  // Rule 4: Session must be active
  if (session.status !== 'active') {
    errors.push('Bidding session has ended');
  }

  // Rule 5: Within max rounds
  const userBids = session.biddingHistory.filter(b => b.userId === userId);
  if (userBids.length >= session.maxRounds) {
    errors.push(`Maximum ${session.maxRounds} bids per user reached`);
  }

  // Rule 6: Reasonable maximum (2x current high)
  const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : proposedBid * 2;
  if (proposedBid > maximumAllowed) {
    errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
  }

  // Warning: Very high bid (>50% increase)
  if (currentHigh > 0 && proposedBid > currentHigh * 1.5) {
    const percentIncrease = Math.round(((proposedBid - currentHigh) / currentHigh) * 100);
    warnings.push(
      `This bid is ${percentIncrease}% higher than current high`
    );
  }

  // Warning: Near maximum rounds
  if (userBids.length === session.maxRounds - 1) {
    warnings.push('This will be your final bid');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    minimumNextBid,
    maximumAllowed,
    suggestedBid: suggestedBid || minimumNextBid
  };
}

/**
 * Format currency for display (no decimals)
 *
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 *
 * @example
 * formatCurrency(1000)
 * // → "1,000"
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export default {
  isBidValid
};
