/**
 * Load Reviews Overview Workflow
 *
 * Orchestrates loading all data needed for the Reviews Overview page.
 * Implements lazy loading - only fetches data for the active tab.
 *
 * This workflow:
 * 1. Calls the appropriate API function based on active tab
 * 2. Transforms the API response using processors
 * 3. Calculates derived values (e.g., average rating)
 * 4. Returns a structured result object
 */

import { adaptPendingReviewsFromApi, adaptReviewListFromApi } from '../../processors/reviews/reviewOverviewAdapter.js';
import { calculateAverageReceivedRating } from '../../calculators/reviews/calculateAverageReceivedRating.js';

/**
 * Load all data needed for the reviews overview page.
 *
 * @param {Object} params
 * @param {Function} params.fetchPendingReviews - API function for pending reviews
 * @param {Function} params.fetchReceivedReviews - API function for received reviews
 * @param {Function} params.fetchSubmittedReviews - API function for submitted reviews
 * @param {string} params.activeTab - Currently active tab ('pending' | 'received' | 'submitted')
 * @returns {Promise<Object>} Loaded and transformed data
 *
 * @example
 * const result = await loadReviewsOverviewWorkflow({
 *   fetchPendingReviews: () => api.getPending(),
 *   fetchReceivedReviews: () => api.getReceived(),
 *   fetchSubmittedReviews: () => api.getSubmitted(),
 *   activeTab: 'pending'
 * });
 */
export async function loadReviewsOverviewWorkflow({
  fetchPendingReviews,
  fetchReceivedReviews,
  fetchSubmittedReviews,
  activeTab = 'pending'
}) {
  const results = {
    pending: { reviews: [], totalCount: 0 },
    received: { reviews: [], totalCount: 0, averageRating: null },
    submitted: { reviews: [], totalCount: 0 },
    error: null
  };

  try {
    // Lazy load - only fetch data for active tab
    switch (activeTab) {
      case 'pending': {
        const pendingResponse = await fetchPendingReviews();

        if (!pendingResponse.success) {
          throw new Error(pendingResponse.error || 'Failed to fetch pending reviews');
        }

        results.pending = {
          reviews: adaptPendingReviewsFromApi({ apiReviews: pendingResponse.data?.reviews }),
          totalCount: pendingResponse.data?.totalCount || 0
        };
        break;
      }

      case 'received': {
        const receivedResponse = await fetchReceivedReviews();

        if (!receivedResponse.success) {
          throw new Error(receivedResponse.error || 'Failed to fetch received reviews');
        }

        const reviews = adaptReviewListFromApi({ apiReviews: receivedResponse.data?.reviews });
        results.received = {
          reviews,
          totalCount: receivedResponse.data?.totalCount || 0,
          averageRating: calculateAverageReceivedRating({ reviews })
        };
        break;
      }

      case 'submitted': {
        const submittedResponse = await fetchSubmittedReviews();

        if (!submittedResponse.success) {
          throw new Error(submittedResponse.error || 'Failed to fetch submitted reviews');
        }

        results.submitted = {
          reviews: adaptReviewListFromApi({ apiReviews: submittedResponse.data?.reviews }),
          totalCount: submittedResponse.data?.totalCount || 0
        };
        break;
      }

      default:
        throw new Error(`Unknown tab: ${activeTab}`);
    }

    return results;

  } catch (error) {
    console.error('[loadReviewsOverviewWorkflow] Error:', error);
    results.error = error.message || 'Failed to load reviews';
    return results;
  }
}

/**
 * Load all tab counts in parallel for badge display.
 * This is called once on page load to populate all badges.
 *
 * @param {Object} params
 * @param {Function} params.fetchPendingReviews - API function
 * @param {Function} params.fetchReceivedReviews - API function
 * @param {Function} params.fetchSubmittedReviews - API function
 * @returns {Promise<Object>} Counts for each tab
 */
export async function loadReviewCountsWorkflow({
  fetchPendingReviews,
  fetchReceivedReviews,
  fetchSubmittedReviews
}) {
  const counts = {
    pending: 0,
    received: 0,
    submitted: 0,
    error: null
  };

  try {
    // Fetch all counts in parallel
    const [pendingRes, receivedRes, submittedRes] = await Promise.all([
      fetchPendingReviews().catch(() => ({ success: true, data: { totalCount: 0 } })),
      fetchReceivedReviews().catch(() => ({ success: true, data: { totalCount: 0 } })),
      fetchSubmittedReviews().catch(() => ({ success: true, data: { totalCount: 0 } }))
    ]);

    counts.pending = pendingRes.data?.totalCount || 0;
    counts.received = receivedRes.data?.totalCount || 0;
    counts.submitted = submittedRes.data?.totalCount || 0;

    return counts;

  } catch (error) {
    console.error('[loadReviewCountsWorkflow] Error:', error);
    counts.error = error.message;
    return counts;
  }
}
