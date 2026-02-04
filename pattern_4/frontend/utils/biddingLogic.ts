/**
 * BIDDING LOGIC UTILITIES
 *
 * Core business logic for competitive bidding validation,
 * winner determination, and auto-bid processing.
 *
 * Features:
 * - Bid validation
 * - Winner determination
 * - Auto-bid proxy logic
 * - Compensation calculation
 * - Round management
 *
 * @version 1.0.0
 */

import { BiddingSession, Bid, BiddingParticipant } from '../types/biddingTypes';

export interface BidValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  minimumNextBid: number;
  maximumAllowed: number;
  suggestedBid: number;
}

/**
 * Validate a proposed bid
 *
 * Rules:
 * 1. Must exceed current high by minimum increment (10%)
 * 2. Cannot bid on own high bid
 * 3. Session must be active
 * 4. Within max rounds limit
 * 5. Below reasonable maximum (2x current high)
 */
export function validateBid(
  proposedBid: number,
  session: BiddingSession,
  userId: string
): BidValidationResult {

  const errors: string[] = [];
  const warnings: string[] = [];

  const currentHigh = session.currentHighBid?.amount || 0;
  const minimumIncrement = session.minimumIncrement;
  const minimumNextBid = currentHigh > 0 ? currentHigh + minimumIncrement : proposedBid;

  // Rule 1: Must exceed current high bid
  if (currentHigh > 0 && proposedBid <= currentHigh) {
    errors.push(`Bid must exceed current high bid of $${formatCurrency(currentHigh)}`);
  }

  // Rule 1a: Must meet minimum increment
  if (currentHigh > 0 && proposedBid < minimumNextBid) {
    errors.push(
      `Minimum bid is $${formatCurrency(minimumNextBid)} (10% increment required)`
    );
  }

  // Rule 2: Cannot bid on own high bid
  if (session.currentHighBid?.userId === userId) {
    errors.push('You already have the high bid');
  }

  // Rule 3: Session must be active
  if (session.status !== 'active') {
    errors.push('Bidding session has ended');
  }

  // Rule 4: Within max rounds
  const userBids = session.biddingHistory.filter(b => b.userId === userId);
  if (userBids.length >= session.maxRounds) {
    errors.push(`Maximum ${session.maxRounds} bids per user reached`);
  }

  // Rule 5: Reasonable maximum (2x current high)
  const maximumAllowed = currentHigh > 0 ? currentHigh * 2 : proposedBid * 2;
  if (proposedBid > maximumAllowed) {
    errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
  }

  // Warning: Very high bid (>50% increase)
  if (currentHigh > 0 && proposedBid > currentHigh * 1.5) {
    warnings.push(
      `This bid is ${Math.round(((proposedBid - currentHigh) / currentHigh) * 100)}% higher than current high`
    );
  }

  // Warning: Near maximum rounds
  if (userBids.length === session.maxRounds - 1) {
    warnings.push('This will be your final bid');
  }

  // Suggested bid (current + 15%)
  const suggestedBid = currentHigh > 0 ? Math.round(currentHigh * 1.15) : proposedBid;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    minimumNextBid,
    maximumAllowed,
    suggestedBid
  };
}

/**
 * Determine session winner
 *
 * Returns winner, loser, winning bid, and compensation amounts
 */
export function determineWinner(session: BiddingSession): {
  winner: BiddingParticipant;
  loser: BiddingParticipant;
  winningBid: number;
  loserCompensation: number;
  platformRevenue: number;
} {

  if (!session.currentHighBid) {
    throw new Error('No bids in session - cannot determine winner');
  }

  const winner = session.participants.find(
    p => p.userId === session.currentHighBid!.userId
  );

  const loser = session.participants.find(
    p => p.userId !== session.currentHighBid!.userId
  );

  if (!winner || !loser) {
    throw new Error('Invalid session participants');
  }

  const winningBid = session.currentHighBid.amount;
  const loserCompensation = Math.round(winningBid * 0.25); // 25% compensation
  const platformRevenue = winningBid - loserCompensation;

  return {
    winner,
    loser,
    winningBid,
    loserCompensation,
    platformRevenue
  };
}

/**
 * Process auto-bid (proxy bidding like eBay)
 *
 * If other participant has auto-bid enabled and new bid is below their max,
 * automatically counter-bid up to their maximum.
 */
export function processAutoBid(
  session: BiddingSession,
  newBid: Bid
): Bid | null {

  // Find the other participant
  const otherParticipant = session.participants.find(
    p => p.userId !== newBid.userId
  );

  if (!otherParticipant || !otherParticipant.maxAutoBid) {
    return null; // No auto-bid to trigger
  }

  // Check if new bid exceeds their max
  if (newBid.amount >= otherParticipant.maxAutoBid) {
    return null; // New bid exceeds auto-bid max
  }

  // Calculate auto-bid amount (new bid + minimum increment, capped at max)
  const autoBidAmount = Math.min(
    newBid.amount + session.minimumIncrement,
    otherParticipant.maxAutoBid
  );

  // Create auto-bid
  const autoBid: Bid = {
    bidId: generateBidId(),
    userId: otherParticipant.userId,
    userName: otherParticipant.name,
    amount: autoBidAmount,
    timestamp: new Date(),
    isAutoBid: true,
    round: newBid.round
  };

  console.log('[Auto-Bid] Triggered:', autoBid);

  return autoBid;
}

/**
 * Calculate compensation for losing bidder
 */
export function calculateCompensation(winningBid: number): number {
  return Math.round(winningBid * 0.25);
}

/**
 * Calculate platform revenue from transaction
 */
export function calculatePlatformRevenue(
  winningBid: number,
  compensation: number
): number {
  return winningBid - compensation;
}

/**
 * Check if session has expired
 */
export function isSessionExpired(session: BiddingSession): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  return now >= expiresAt;
}

/**
 * Calculate time remaining in session (seconds)
 */
export function getTimeRemaining(session: BiddingSession): number {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Check if user can still bid
 */
export function canUserBid(
  session: BiddingSession,
  userId: string
): { canBid: boolean; reason?: string } {

  // Session must be active
  if (session.status !== 'active') {
    return { canBid: false, reason: 'Session has ended' };
  }

  // User must not be high bidder
  if (session.currentHighBid?.userId === userId) {
    return { canBid: false, reason: 'You already have the high bid' };
  }

  // User must have bids remaining
  const userBidCount = session.biddingHistory.filter(b => b.userId === userId).length;
  if (userBidCount >= session.maxRounds) {
    return { canBid: false, reason: `Maximum ${session.maxRounds} bids reached` };
  }

  // Session must not be expired
  if (isSessionExpired(session)) {
    return { canBid: false, reason: 'Session has expired' };
  }

  return { canBid: true };
}

/**
 * Generate unique bid ID
 */
export function generateBidId(): string {
  return `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export default {
  validateBid,
  determineWinner,
  processAutoBid,
  calculateCompensation,
  calculatePlatformRevenue,
  isSessionExpired,
  getTimeRemaining,
  canUserBid,
  generateBidId
};
