/**
 * Recalculate Pricing List Workflow
 *
 * Force recalculation of all pricing values for a listing.
 * Used when site-wide pricing parameters change or for batch updates.
 *
 * @intent Force full recalculation regardless of current state.
 * @rule Fetches fresh listing data before calculating.
 * @rule Replaces all existing pricing values.
 * @rule Used for admin operations and parameter changes.
 */
import { savePricingWorkflow } from './savePricingWorkflow.js';
import { shouldRecalculatePricing } from '../../rules/pricingList/index.js';

/**
 * Force recalculate pricing list for a listing.
 *
 * @param {object} params - Workflow parameters.
 * @param {object} params.listing - Current listing data.
 * @param {string} params.listingId - The listing ID.
 * @param {object|null} [params.existingPricingList] - Existing pricing list (for comparison).
 * @param {string} [params.userId] - The user triggering recalculation.
 * @param {boolean} [params.force=false] - Force recalculation even if not needed.
 * @param {Function} [params.onPersist] - Callback for persistence.
 * @returns {Promise<object>} Result with recalculated pricing list.
 *
 * @example
 * const result = await recalculatePricingListWorkflow({
 *   listing: listingData,
 *   listingId: 'abc123',
 *   existingPricingList: currentPricing,
 *   force: true
 * });
 */
export async function recalculatePricingListWorkflow({
  listing,
  listingId,
  existingPricingList = null,
  userId,
  force = false,
  onPersist
}) {
  // Validate required fields
  if (!listing) {
    throw new Error('recalculatePricingListWorkflow: listing is required');
  }

  if (!listingId) {
    throw new Error('recalculatePricingListWorkflow: listingId is required');
  }

  // Check if recalculation is needed (unless forced)
  if (!force) {
    const needsRecalculation = shouldRecalculatePricing({
      listing,
      pricingList: existingPricingList
    });

    if (!needsRecalculation) {
      return {
        success: true,
        pricingList: existingPricingList,
        skipped: true,
        reason: 'No changes detected'
      };
    }
  }

  // Delegate to save workflow for actual calculation
  const result = await savePricingWorkflow({
    listing,
    listingId,
    userId,
    onPersist
  });

  return {
    ...result,
    recalculated: true,
    forced: force
  };
}
