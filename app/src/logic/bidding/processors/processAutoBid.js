/**
 * Process auto-bid (eBay-style proxy bidding) after a manual bid is placed.
 *
 * @intent Automatically counter-bid for a participant who has set a max auto-bid.
 * @rule If other participant has a maxAutoBidAmount set and it exceeds the new bid,
 *       automatically place a counter-bid at (newBid + minimum increment).
 * @rule Auto-bid amount cannot exceed the participant's maxAutoBidAmount.
 * @rule Only triggers if new bid is below other participant's max.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.session - Current session state.
 * @param {Array} params.participants - Array of session participants.
 * @param {object} params.newBid - The bid that was just placed.
 * @returns {{ autoBidTriggered: boolean, autoBid?: object, reason?: string }}
 *
 * @example
 * processAutoBid({
 *   session: { minimumIncrementPercent: 10 },
 *   participants: [
 *     { userId: 'u1', maxAutoBidAmount: 1500 },
 *     { userId: 'u2', maxAutoBidAmount: null }
 *   ],
 *   newBid: { userId: 'u2', amount: 1000 }
 * })
 * // => { autoBidTriggered: true, autoBid: { userId: 'u1', amount: 1100, ... } }
 */
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.js';

const DEFAULT_MINIMUM_INCREMENT_PERCENT = 10;

export function processAutoBid({ session, participants, newBid }) {
  // Find the other participant (not the one who just bid)
  const otherParticipant = participants.find((p) => p.userId !== newBid.userId);

  if (!otherParticipant) {
    return {
      autoBidTriggered: false,
      reason: 'No other participant found',
    };
  }

  // Check if other participant has auto-bid enabled
  if (!otherParticipant.maxAutoBidAmount) {
    return {
      autoBidTriggered: false,
      reason: 'Other participant has not set max auto-bid',
    };
  }

  // If new bid is below their max, auto-counter
  if (newBid.amount < otherParticipant.maxAutoBidAmount) {
    // Calculate auto-bid amount (new bid + minimum increment)
    const minimumIncrementPercent = session.minimumIncrementPercent || DEFAULT_MINIMUM_INCREMENT_PERCENT;
    const minimumNextBid = calculateMinimumNextBid({
      currentHighBid: newBid.amount,
      minimumIncrementPercent
    });

    // Don't exceed their maximum
    const autoBidAmount = Math.min(
      minimumNextBid,
      otherParticipant.maxAutoBidAmount
    );

    // Calculate increment details
    const incrementAmount = autoBidAmount - newBid.amount;
    const incrementPercent = newBid.amount > 0
      ? Math.round((incrementAmount / newBid.amount) * 10000) / 100
      : 0;

    // Create auto-bid object
    const autoBid = {
      bidId: generateBidId(),
      sessionId: session.sessionId,
      userId: otherParticipant.userId,
      amount: autoBidAmount,
      roundNumber: session.currentRound,
      isAutoBid: true,
      previousHighBid: newBid.amount,
      incrementAmount: incrementAmount,
      incrementPercent: incrementPercent,
      wasValid: true,
      placedAt: new Date(),
      createdAt: new Date(),
    };

    return {
      autoBidTriggered: true,
      autoBid,
      reason: `Auto-bid to $${formatCurrency(autoBidAmount)} (max: $${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
    };
  }

  // New bid exceeded their max, no auto-bid
  return {
    autoBidTriggered: false,
    reason: `New bid ($${formatCurrency(newBid.amount)}) exceeds max auto-bid ($${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
  };
}

/**
 * Generate unique bid ID
 * @returns {string} Unique bid ID
 */
function generateBidId() {
  return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency for display (without $ symbol)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
