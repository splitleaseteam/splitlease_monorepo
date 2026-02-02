/**
 * =====================================================
 * PATTERN 4: BS+BS COMPETITIVE BIDDING - LOGIC MODULE
 * =====================================================
 * Barrel export for all bidding logic functions.
 *
 * Four-Layer Architecture:
 * - Calculators: Pure math functions (calculate*, get*)
 * - Rules: Boolean predicates (can*, is*, has*, should*)
 * - Processors: Data transformation (process*, determine*)
 *
 * Business Rules Enforced:
 * - Minimum bid increment: 10% above previous bid
 * - Maximum rounds per session: 3
 * - Loser compensation: 25% of winning bid
 * - Exactly 2 participants per session (both Big Spenders)
 */

// =====================================================
// CALCULATORS (Pure Math Functions)
// =====================================================
export { calculateMinimumNextBid } from './calculators/calculateMinimumNextBid.js';
export { calculateLoserCompensation } from './calculators/calculateLoserCompensation.js';
export { calculateBidIncrement } from './calculators/calculateBidIncrement.js';

// =====================================================
// RULES (Boolean Predicates)
// =====================================================
export { validateBid } from './rules/validateBid.js';
export { isSessionExpired } from './rules/isSessionExpired.js';
export { shouldFinalizeSession } from './rules/shouldFinalizeSession.js';
export { checkBiddingEligibility } from './rules/checkBiddingEligibility.js';

// =====================================================
// PROCESSORS (Data Transformation)
// =====================================================
export { processAutoBid } from './processors/processAutoBid.js';
export { determineWinner } from './processors/determineWinner.js';

// =====================================================
// CONSTANTS
// =====================================================
export const BIDDING_CONSTANTS = {
  DEFAULT_MAX_ROUNDS: 3,
  DEFAULT_ROUND_DURATION_SECONDS: 3600, // 1 hour
  DEFAULT_MINIMUM_INCREMENT_PERCENT: 10.0, // 10%
  LOSER_COMPENSATION_PERCENT: 25.0, // 25%
  MAX_SESSION_DURATION_HOURS: 24,
  MIN_BID_AMOUNT: 100,
  MAX_BID_AMOUNT: 100000,
};

export const BIDDING_RULES = {
  MINIMUM_PARTICIPANTS: 2,
  MAXIMUM_PARTICIPANTS: 2,
  REQUIRED_ARCHETYPE: 'big_spender',
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique session ID
 * @returns {string} Unique session ID
 */
export function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique bid ID
 * @returns {string} Unique bid ID
 */
export function generateBidId() {
  return `bid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format currency for display (without $ symbol)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate time remaining in session (in seconds)
 * @param {object} session - Bidding session
 * @returns {number} Remaining seconds (0 if expired or no expiration)
 */
export function calculateTimeRemaining(session) {
  if (!session.expiresAt) {
    return 0;
  }

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return remainingSeconds;
}

/**
 * Calculate session expiration time
 * @param {Date} startedAt - When session started
 * @param {number} roundDurationSeconds - Duration per round in seconds
 * @param {number} maxRounds - Maximum rounds in session
 * @returns {Date} When session expires
 */
export function calculateExpiresAt(startedAt, roundDurationSeconds, maxRounds) {
  const totalDurationSeconds = roundDurationSeconds * maxRounds;
  const expiresAt = new Date(startedAt.getTime() + totalDurationSeconds * 1000);
  return expiresAt;
}

/**
 * Get user's current position in bidding (1st or 2nd)
 * @param {string} userId - User to check
 * @param {object} session - Bidding session
 * @returns {1|2} Position (1 = leading, 2 = not leading)
 */
export function getUserBidPosition(userId, session) {
  if (session.winnerUserId === userId) {
    return 1; // Leading
  }
  return 2; // Not leading
}
