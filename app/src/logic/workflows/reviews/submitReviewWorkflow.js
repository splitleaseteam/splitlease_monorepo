/**
 * Submit Review Workflow
 *
 * Orchestrates the review submission process:
 * 1. Validates ratings using rules
 * 2. Calculates overall rating
 * 3. Prepares payload using processors
 * 4. Calls the API to create the review
 *
 * This workflow ensures all business rules are validated before
 * the review is submitted to the backend.
 */

import { calculateOverallRating } from '../../calculators/reviews/calculateOverallRating.js';
import { hasValidRatings } from '../../rules/reviews/hasValidRatings.js';
import { adaptReviewForSubmission } from '../../processors/reviews/reviewOverviewAdapter.js';

/**
 * Submit a review for a stay.
 *
 * @param {Object} params
 * @param {string} params.stayId - Stay ID to review
 * @param {Array<{category: string, rating: number}>} params.ratings - Category ratings
 * @param {string} params.comment - Optional review comment
 * @param {boolean} params.wouldRecommend - Would recommend flag
 * @param {string} params.reviewType - 'host_reviews_guest' or 'guest_reviews_host'
 * @param {Function} params.createReview - API function to create review
 * @returns {Promise<Object>} Submission result
 *
 * @throws {Error} If ratings are invalid
 * @throws {Error} If API call fails
 *
 * @example
 * await submitReviewWorkflow({
 *   stayId: 'stay123',
 *   ratings: [{ category: 'cleanliness', rating: 4 }],
 *   comment: 'Great stay!',
 *   wouldRecommend: true,
 *   reviewType: 'guest_reviews_host',
 *   createReview: (payload) => api.createReview(payload)
 * });
 */
export async function submitReviewWorkflow({
  stayId,
  ratings,
  comment,
  wouldRecommend,
  reviewType,
  createReview
}) {
  // 1. Validate required fields
  if (!stayId) {
    throw new Error('Stay ID is required');
  }

  if (!reviewType) {
    throw new Error('Review type is required');
  }

  // 2. Validate ratings using rule
  if (!hasValidRatings({ ratings, reviewType })) {
    throw new Error('Please provide at least one valid rating (1-5 stars)');
  }

  // 3. Calculate overall rating using calculator
  const overallRating = calculateOverallRating({ ratings });

  if (overallRating === 0) {
    throw new Error('Unable to calculate overall rating');
  }

  // 4. Prepare payload using processor
  const payload = adaptReviewForSubmission({
    stayId,
    ratings,
    comment,
    wouldRecommend,
    overallRating
  });

  // 5. Submit review via API
  const response = await createReview(payload);

  if (!response.success) {
    throw new Error(response.error || 'Failed to submit review');
  }

  return {
    success: true,
    reviewId: response.data?.reviewId,
    message: response.data?.message || 'Review submitted successfully'
  };
}

/**
 * Validate review form before submission.
 * Use this for real-time validation feedback in the UI.
 *
 * @param {Object} params
 * @param {Array<{category: string, rating: number}>} params.ratings - Current ratings
 * @param {string} params.reviewType - Review type
 * @returns {Object} Validation result with errors array
 */
export function validateReviewForm({ ratings, reviewType: _reviewType }) {
  const errors = [];

  if (!ratings || ratings.length === 0) {
    errors.push('Please rate at least one category');
    return { isValid: false, errors };
  }

  // Check for invalid ratings
  const invalidRatings = ratings.filter(r => !r.rating || r.rating < 1 || r.rating > 5);
  if (invalidRatings.length > 0) {
    errors.push('All ratings must be between 1 and 5 stars');
  }

  // Check for missing categories
  const hasAtLeastOne = ratings.some(r => r.rating >= 1 && r.rating <= 5);
  if (!hasAtLeastOne) {
    errors.push('Please provide at least one rating');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
