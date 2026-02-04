/**
 * Has Valid Ratings Rule
 *
 * Validates that all provided ratings are valid before submission.
 * Valid ratings must:
 * 1. Be an array with at least one rating
 * 2. Have ratings within the 1-5 range
 * 3. Have valid category strings
 *
 * @param {Object} params
 * @param {Array<{category: string, rating: number}>} params.ratings - Array of ratings
 * @param {string} params.reviewType - 'host_reviews_guest' or 'guest_reviews_host'
 * @returns {boolean} Whether the ratings are valid
 *
 * @example
 * hasValidRatings({
 *   ratings: [
 *     { category: 'cleanliness', rating: 4 },
 *     { category: 'communication', rating: 5 }
 *   ],
 *   reviewType: 'host_reviews_guest'
 * })
 * // Returns: true
 */
export function hasValidRatings({ ratings, reviewType: _reviewType }) {
  if (!ratings || !Array.isArray(ratings)) {
    return false;
  }

  // Must have at least one rating
  if (ratings.length === 0) {
    return false;
  }

  // Validate each rating
  const allValid = ratings.every(r => {
    // Must have category as string
    if (!r || typeof r.category !== 'string' || r.category.trim() === '') {
      return false;
    }

    // Must have rating as number between 1-5
    if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) {
      return false;
    }

    return true;
  });

  if (!allValid) {
    return false;
  }

  // Check for duplicate categories
  const categories = ratings.map(r => r.category);
  const uniqueCategories = new Set(categories);
  if (categories.length !== uniqueCategories.size) {
    return false;
  }

  return true;
}
