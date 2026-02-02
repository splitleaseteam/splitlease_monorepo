/**
 * Bidding System Constants
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Business constants and utility functions for the bidding system.
 */

export const BIDDING_CONSTANTS = {
  DEFAULT_MAX_ROUNDS: 3,
  DEFAULT_ROUND_DURATION_SECONDS: 3600, // 1 hour
  DEFAULT_MINIMUM_INCREMENT_PERCENT: 10.0, // 10%
  LOSER_COMPENSATION_PERCENT: 25.0, // 25%
  MAX_SESSION_DURATION_HOURS: 24,
  MIN_BID_AMOUNT: 100,
  MAX_BID_AMOUNT: 100000,
} as const;

export const BIDDING_RULES = {
  MINIMUM_PARTICIPANTS: 2,
  MAXIMUM_PARTICIPANTS: 2,
  REQUIRED_ARCHETYPE: 'big_spender',
} as const;

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique bid ID
 */
export function generateBidId(): string {
  return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency for display (without $ symbol)
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate time remaining in session (in seconds)
 */
export function calculateTimeRemaining(expiresAt: Date | undefined): number {
  if (!expiresAt) {
    return 0;
  }

  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Calculate session expiration time
 */
export function calculateExpiresAt(
  startedAt: Date,
  roundDurationSeconds: number,
  maxRounds: number
): Date {
  const totalDurationSeconds = roundDurationSeconds * maxRounds;
  return new Date(startedAt.getTime() + totalDurationSeconds * 1000);
}

/**
 * Get user's current position in bidding (1st or 2nd)
 */
export function getUserBidPosition(userId: string, winnerUserId: string | undefined): 1 | 2 {
  return winnerUserId === userId ? 1 : 2;
}
