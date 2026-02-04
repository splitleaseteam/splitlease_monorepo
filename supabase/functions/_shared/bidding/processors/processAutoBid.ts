import type { BiddingSession, BiddingParticipant, Bid, AutoBidResult } from '../types.ts';
import { calculateMinimumNextBid } from '../calculators/calculateMinimumNextBid.ts';
import { BIDDING_CONSTANTS, generateBidId, formatCurrency } from '../constants.ts';

/**
 * Process auto-bid (eBay-style proxy bidding) after a manual bid is placed.
 *
 * @rule If other participant has a maxAutoBidAmount set and it exceeds the new bid,
 *       automatically place a counter-bid at (newBid + minimum increment).
 * @rule Auto-bid amount cannot exceed the participant's maxAutoBidAmount.
 * @rule Only triggers if new bid is below other participant's max.
 */
export function processAutoBid(
  session: BiddingSession,
  participants: BiddingParticipant[],
  newBid: Bid
): AutoBidResult {
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
    const minimumIncrementPercent = session.minimumIncrementPercent || BIDDING_CONSTANTS.DEFAULT_MINIMUM_INCREMENT_PERCENT;
    const minimumNextBid = calculateMinimumNextBid(newBid.amount, minimumIncrementPercent);

    // Don't exceed their maximum
    const autoBidAmount = Math.min(minimumNextBid, otherParticipant.maxAutoBidAmount);

    // Calculate increment details
    const incrementAmount = autoBidAmount - newBid.amount;
    const incrementPercent = newBid.amount > 0
      ? Math.round((incrementAmount / newBid.amount) * 10000) / 100
      : 0;

    const now = new Date();
    const autoBid: Bid = {
      bidId: generateBidId(),
      sessionId: session.sessionId,
      userId: otherParticipant.userId,
      amount: autoBidAmount,
      roundNumber: session.currentRound,
      isAutoBid: true,
      previousHighBid: newBid.amount,
      incrementAmount,
      incrementPercent,
      wasValid: true,
      placedAt: now,
      createdAt: now,
    };

    return {
      autoBidTriggered: true,
      autoBid,
      reason: `Auto-bid to $${formatCurrency(autoBidAmount)} (max: $${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
    };
  }

  return {
    autoBidTriggered: false,
    reason: `New bid ($${formatCurrency(newBid.amount)}) exceeds max auto-bid ($${formatCurrency(otherParticipant.maxAutoBidAmount)})`,
  };
}
