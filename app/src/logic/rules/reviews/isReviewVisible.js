/**
 * Is Review Visible Rule
 *
 * Determines if a review should be visible to users.
 * Reviews become visible when:
 * 1. Both parties have submitted their reviews, OR
 * 2. The review window (14 days) has expired
 *
 * This prevents users from being influenced by the other party's review
 * before submitting their own.
 *
 * @param {Object} params
 * @param {Object} params.review - The review object
 * @param {Object} params.stay - The stay object
 * @param {string} params.stay.checkOutDate - Check-out date
 * @param {string|null} params.stay.reviewByHostId - Host review ID
 * @param {string|null} params.stay.reviewByGuestId - Guest review ID
 * @returns {boolean} Whether the review should be visible
 *
 * @example
 * // Both reviews submitted
 * isReviewVisible({
 *   review: { _id: 'review1' },
 *   stay: { checkOutDate: '2026-01-10', reviewByHostId: 'r1', reviewByGuestId: 'r2' }
 * })
 * // Returns: true
 */
export function isReviewVisible({ review, stay }) {
  if (!review || !stay) {
    return false;
  }

  // Both reviews submitted - always visible
  if (stay.reviewByHostId && stay.reviewByGuestId) {
    return true;
  }

  // Check if review window has expired
  if (!stay.checkOutDate) {
    return false;
  }

  const REVIEW_WINDOW_DAYS = 14;
  const checkOutDate = new Date(stay.checkOutDate);
  const now = new Date();
  const daysSinceCheckout = Math.floor((now - checkOutDate) / (1000 * 60 * 60 * 24));

  // Visible if window expired
  return daysSinceCheckout > REVIEW_WINDOW_DAYS;
}
