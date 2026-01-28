/**
 * Calculate Review Expiry Days
 *
 * Computes the number of days remaining until the review window expires.
 * The review window is 14 days after stay completion (check-out date).
 *
 * @param {Object} params
 * @param {string} params.checkOutDate - The stay check-out date (ISO string or Date)
 * @returns {number|null} Days remaining until expiry, or null if already expired
 *
 * @example
 * // If checkOutDate was 10 days ago
 * calculateReviewExpiryDays({ checkOutDate: '2026-01-17' })
 * // Returns: 4 (14 - 10 = 4 days remaining)
 *
 * @example
 * // If checkOutDate was 20 days ago
 * calculateReviewExpiryDays({ checkOutDate: '2026-01-07' })
 * // Returns: null (window expired)
 */
export function calculateReviewExpiryDays({ checkOutDate }) {
  if (!checkOutDate) {
    return null;
  }

  const REVIEW_WINDOW_DAYS = 14;

  const checkOut = new Date(checkOutDate);
  const expiryDate = new Date(checkOut);
  expiryDate.setDate(expiryDate.getDate() + REVIEW_WINDOW_DAYS);

  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}
