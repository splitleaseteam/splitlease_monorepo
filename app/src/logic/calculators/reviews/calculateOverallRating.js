/**
 * Calculate Overall Rating
 *
 * Computes the average rating from individual category ratings.
 * Returns a value rounded to 1 decimal place.
 *
 * @param {Object} params
 * @param {Array<{rating: number}>} params.ratings - Array of rating objects
 * @returns {number} Average rating rounded to 1 decimal place, or 0 if no ratings
 *
 * @example
 * calculateOverallRating({ ratings: [{ rating: 4 }, { rating: 5 }, { rating: 3 }] })
 * // Returns: 4.0
 */
export function calculateOverallRating({ ratings }) {
  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return 0;
  }

  const validRatings = ratings.filter(r => r && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5);

  if (validRatings.length === 0) {
    return 0;
  }

  const sum = validRatings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / validRatings.length) * 10) / 10;
}
