/**
 * RULE: Can User Bid
 *
 * Boolean predicate to check if a user can place a bid in the current session.
 *
 * Checks:
 * 1. Session must be active
 * 2. User must not be current high bidder
 * 3. User must have bids remaining (< maxRounds)
 * 4. Session must not be expired
 *
 * Pure function - no side effects.
 *
 * @module logic/bidding/rules
 */

/**
 * Check if user can place a bid
 *
 * @param {Object} params
 * @param {Object} params.session - Bidding session
 * @param {string} params.session.status - Session status
 * @param {Object|null} params.session.currentHighBid - Current high bid
 * @param {string} params.session.currentHighBid.userId - High bidder user ID
 * @param {Array} params.session.biddingHistory - Array of all bids
 * @param {number} params.session.maxRounds - Maximum rounds per user
 * @param {Date} params.session.expiresAt - Session expiration time
 * @param {string} params.userId - User ID to check
 * @returns {Object} Result with canBid boolean and optional reason
 * @returns {boolean} return.canBid - True if user can bid
 * @returns {string} [return.reason] - Reason why user cannot bid (if canBid is false)
 *
 * @example
 * // User can bid
 * canUserBid({
 *   session: { status: 'active', currentHighBid: { userId: 'user_2' }, biddingHistory: [], maxRounds: 3, expiresAt: new Date('2026-12-31') },
 *   userId: 'user_1'
 * })
 * // → { canBid: true }
 *
 * @example
 * // User is high bidder
 * canUserBid({
 *   session: { status: 'active', currentHighBid: { userId: 'user_1' }, biddingHistory: [], maxRounds: 3, expiresAt: new Date('2026-12-31') },
 *   userId: 'user_1'
 * })
 * // → { canBid: false, reason: 'You already have the high bid' }
 */
export function canUserBid({ session, userId }) {
  // Rule 1: Session must be active
  if (session.status !== 'active') {
    return { canBid: false, reason: 'Bidding session has ended' };
  }

  // Rule 2: User must not be current high bidder
  if (session.currentHighBid?.userId === userId) {
    return { canBid: false, reason: 'You already have the high bid' };
  }

  // Rule 3: User must have bids remaining
  const userBidCount = session.biddingHistory.filter(bid => bid.userId === userId).length;
  if (userBidCount >= session.maxRounds) {
    return { canBid: false, reason: `Maximum ${session.maxRounds} bids reached` };
  }

  // Rule 4: Session must not be expired
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  if (now >= expiresAt) {
    return { canBid: false, reason: 'Session has expired' };
  }

  return { canBid: true };
}

/**
 * Check if session is expired
 *
 * @param {Object} params
 * @param {Date} params.expiresAt - Session expiration time
 * @returns {boolean} True if session is expired
 *
 * @example
 * isSessionExpired({ expiresAt: new Date('2020-01-01') })
 * // → true (past date)
 *
 * @example
 * isSessionExpired({ expiresAt: new Date('2030-01-01') })
 * // → false (future date)
 */
export function isSessionExpired({ expiresAt }) {
  const now = new Date();
  const expires = new Date(expiresAt);
  return now >= expires;
}

/**
 * Check if user is current high bidder
 *
 * @param {Object} params
 * @param {Object|null} params.currentHighBid - Current high bid
 * @param {string} params.userId - User ID to check
 * @returns {boolean} True if user is high bidder
 *
 * @example
 * isUserHighBidder({ currentHighBid: { userId: 'user_1' }, userId: 'user_1' })
 * // → true
 *
 * @example
 * isUserHighBidder({ currentHighBid: null, userId: 'user_1' })
 * // → false (no bids yet)
 */
export function isUserHighBidder({ currentHighBid, userId }) {
  return currentHighBid?.userId === userId;
}

/**
 * Get remaining bids for user
 *
 * @param {Object} params
 * @param {Array} params.biddingHistory - Array of all bids
 * @param {number} params.maxRounds - Maximum rounds per user
 * @param {string} params.userId - User ID to check
 * @returns {number} Number of bids remaining
 *
 * @example
 * getRemainingBids({ biddingHistory: [{ userId: 'user_1' }], maxRounds: 3, userId: 'user_1' })
 * // → 2 (3 - 1)
 */
export function getRemainingBids({ biddingHistory, maxRounds, userId }) {
  const userBidCount = biddingHistory.filter(bid => bid.userId === userId).length;
  return Math.max(0, maxRounds - userBidCount);
}

export default {
  canUserBid,
  isSessionExpired,
  isUserHighBidder,
  getRemainingBids
};
