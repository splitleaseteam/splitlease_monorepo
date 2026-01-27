/**
 * Calculate Average Received Rating
 *
 * Computes the average rating from all reviews received by a user.
 * Returns a value rounded to 1 decimal place.
 *
 * @param {Object} params
 * @param {Array<{overallRating: number}>} params.reviews - Array of review objects with overallRating
 * @returns {number|null} Average rating or null if no reviews
 *
 * @example
 * calculateAverageReceivedRating({
 *   reviews: [
 *     { overallRating: 4.5 },
 *     { overallRating: 5.0 },
 *     { overallRating: 4.0 }
 *   ]
 * })
 * // Returns: 4.5
 */
export function calculateAverageReceivedRating({ reviews }) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  const validReviews = reviews.filter(
    r => r && typeof r.overallRating === 'number' && r.overallRating >= 1 && r.overallRating <= 5
  );

  if (validReviews.length === 0) {
    return null;
  }

  const sum = validReviews.reduce((acc, r) => acc + r.overallRating, 0);
  return Math.round((sum / validReviews.length) * 10) / 10;
}
