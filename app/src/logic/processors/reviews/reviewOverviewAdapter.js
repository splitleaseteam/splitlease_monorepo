/**
 * Review Overview Adapter
 *
 * Data transformation functions for the Reviews Overview page.
 * Converts API responses to UI-friendly formats.
 */

import { REVIEW_CATEGORIES } from '../../constants/reviewCategories.js';
import { GUEST_REVIEW_CATEGORIES } from '../../constants/guestReviewCategories.js';

/**
 * Get category label from category ID
 * @param {string} categoryId - Category identifier
 * @param {string} reviewType - 'host_reviews_guest' or 'guest_reviews_host'
 * @returns {string} Human-readable category label
 */
function getCategoryLabel(categoryId, reviewType) {
  const categories = reviewType === 'host_reviews_guest' ? REVIEW_CATEGORIES : GUEST_REVIEW_CATEGORIES;
  const category = categories.find(c => c.id === categoryId);
  return category?.title || categoryId;
}

/**
 * Adapt pending reviews from API response to UI format.
 *
 * @param {Object} params
 * @param {Array} params.apiReviews - Raw API data from get_pending_reviews
 * @returns {Array} UI-formatted pending reviews
 *
 * @example
 * adaptPendingReviewsFromApi({
 *   apiReviews: [{ stay_id: '123', listing_name: 'NYC Apt', ... }]
 * })
 * // Returns: [{ stayId: '123', listingName: 'NYC Apt', ... }]
 */
export function adaptPendingReviewsFromApi({ apiReviews }) {
  if (!apiReviews || !Array.isArray(apiReviews)) {
    return [];
  }

  return apiReviews.map(item => ({
    stayId: item.stay_id,
    leaseId: item.lease_id,
    listingId: item.listing_id,
    listingName: item.listing_name || 'Unknown Listing',
    listingImageUrl: item.listing_image_url || null,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    weekNumber: item.week_number || null,
    revieweeId: item.reviewee_id,
    revieweeName: item.reviewee_name || 'Unknown',
    revieweeType: item.reviewee_type || 'Unknown',
    daysUntilExpiry: item.days_until_expiry ?? null
  }));
}

/**
 * Adapt received/submitted reviews from API response to UI format.
 *
 * @param {Object} params
 * @param {Array} params.apiReviews - Raw API data
 * @returns {Array} UI-formatted reviews
 */
export function adaptReviewListFromApi({ apiReviews }) {
  if (!apiReviews || !Array.isArray(apiReviews)) {
    return [];
  }

  return apiReviews.map(item => ({
    reviewId: item.review_id || item._id,
    stayId: item.stay_id,
    leaseId: item.lease_id,
    listingName: item.listing_name || 'Unknown Listing',
    listingImageUrl: item.listing_image_url || null,
    checkInDate: item.check_in_date,
    checkOutDate: item.check_out_date,
    reviewType: item.review_type,
    reviewerId: item.reviewer_id,
    reviewerName: item.reviewer_name || 'Anonymous',
    reviewerImageUrl: item.reviewer_image_url || null,
    revieweeId: item.reviewee_id,
    revieweeName: item.reviewee_name || 'Unknown',
    revieweeImageUrl: item.reviewee_image_url || null,
    overallRating: item.overall_rating || 0,
    comment: item.comment || null,
    wouldRecommend: item.would_recommend ?? null,
    ratingDetails: adaptRatingDetailsFromApi({
      ratingDetails: item.rating_details,
      reviewType: item.review_type
    }),
    createdAt: item.created_at
  }));
}

/**
 * Adapt rating details from API format to UI format.
 *
 * @param {Object} params
 * @param {Array} params.ratingDetails - Raw rating details from API
 * @param {string} params.reviewType - Review type for category labels
 * @returns {Array} UI-formatted rating details
 */
export function adaptRatingDetailsFromApi({ ratingDetails, reviewType }) {
  if (!ratingDetails || !Array.isArray(ratingDetails)) {
    return [];
  }

  return ratingDetails.map(rd => ({
    category: rd.category,
    categoryLabel: rd.category_label || getCategoryLabel(rd.category, reviewType),
    rating: rd.rating
  }));
}

/**
 * Adapt review form data for API submission.
 *
 * @param {Object} params
 * @param {string} params.stayId - Stay ID
 * @param {Array<{category: string, rating: number}>} params.ratings - Category ratings
 * @param {string} params.comment - Review comment
 * @param {boolean} params.wouldRecommend - Would recommend flag
 * @param {number} params.overallRating - Calculated overall rating
 * @returns {Object} API-ready payload
 */
export function adaptReviewForSubmission({ stayId, ratings, comment, wouldRecommend, overallRating }) {
  return {
    stayId,
    overallRating,
    comment: comment?.trim() || null,
    wouldRecommend: wouldRecommend ?? null,
    ratings: ratings.map(r => ({
      category: r.category,
      rating: r.rating
    }))
  };
}

/**
 * Format date for display in review cards.
 *
 * @param {string} dateStr - ISO date string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatReviewDate(dateStr, options = {}) {
  if (!dateStr) {
    return 'N/A';
  }

  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  };

  try {
    return new Date(dateStr).toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format date range for display (e.g., "Jan 15 - Jan 22").
 *
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  const start = formatReviewDate(startDate, { month: 'short', day: 'numeric' });
  const end = formatReviewDate(endDate, { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
}
