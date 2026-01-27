/**
 * Can Submit Review Rule
 *
 * Determines if a user can submit a review for a specific stay.
 * A user can submit a review if:
 * 1. The stay is completed
 * 2. They haven't already submitted a review for this stay
 * 3. The review window (14 days) hasn't expired
 *
 * @param {Object} params
 * @param {Object} params.stay - The stay object
 * @param {string} params.stay.status - Stay status (e.g., 'completed')
 * @param {string} params.stay.checkOutDate - Check-out date
 * @param {string|null} params.stay.reviewByHostId - Existing host review ID
 * @param {string|null} params.stay.reviewByGuestId - Existing guest review ID
 * @param {string} params.userId - Current user ID
 * @param {string} params.userType - 'Host' or 'Guest'
 * @returns {boolean} Whether the user can submit a review
 *
 * @example
 * canSubmitReview({
 *   stay: { status: 'completed', checkOutDate: '2026-01-20', reviewByHostId: null },
 *   userId: 'user123',
 *   userType: 'Host'
 * })
 * // Returns: true (if within 14 days)
 */
export function canSubmitReview({ stay, userId, userType }) {
  if (!stay || !userId || !userType) {
    return false;
  }

  // Stay must be completed
  if (stay.status !== 'completed') {
    return false;
  }

  // Check if review already submitted by this user type
  if (userType === 'Host' && stay.reviewByHostId) {
    return false;
  }
  if (userType === 'Guest' && stay.reviewByGuestId) {
    return false;
  }

  // Check review window (14 days after checkout)
  if (!stay.checkOutDate) {
    return false;
  }

  const REVIEW_WINDOW_DAYS = 14;
  const checkOutDate = new Date(stay.checkOutDate);
  const now = new Date();
  const daysSinceCheckout = Math.floor((now - checkOutDate) / (1000 * 60 * 60 * 24));

  return daysSinceCheckout <= REVIEW_WINDOW_DAYS;
}
