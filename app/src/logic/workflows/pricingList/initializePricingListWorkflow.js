/**
 * Initialize Pricing List Workflow
 *
 * Creates an empty/default pricing list structure for a new listing.
 * Used when a listing is first created before host rates are set.
 *
 * @intent Create placeholder pricing list for new listings.
 * @rule All arrays initialized to 7 null elements.
 * @rule Default scalar values from PRICING_CONSTANTS.
 * @rule Does not require host rates (they're not set yet).
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';

/**
 * Initialize a new pricing list with default values.
 *
 * @param {object} params - Workflow parameters.
 * @param {string} params.listingId - The listing ID.
 * @param {string} [params.userId] - The user ID creating the listing.
 * @param {Function} [params.onPersist] - Callback for persistence.
 * @returns {Promise<object>} Result with initialized pricing list.
 *
 * @example
 * const result = await initializePricingListWorkflow({
 *   listingId: 'abc123',
 *   userId: 'user456'
 * });
 */
export async function initializePricingListWorkflow({
  listingId,
  userId,
  onPersist
}) {
  // Validate required fields
  if (!listingId) {
    throw new Error('initializePricingListWorkflow: listingId is required');
  }

  // Create empty arrays with 7 null elements
  const emptyArray = Array(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH).fill(null);
  const zeroArray = Array(PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH).fill(0);

  // Build default pricing list
  const pricingListData = {
    listingId,
    createdBy: userId,

    // Arrays (empty/null)
    hostCompensation: [...emptyArray],
    markupAndDiscountMultiplier: [...zeroArray],
    nightlyPrice: [...emptyArray],
    unusedNights: [...emptyArray],
    unusedNightsDiscount: [...zeroArray],

    // Scalar markups (defaults)
    unitMarkup: PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP,
    overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
    combinedMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE, // Just site markup initially
    fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,

    // Derived scalars (null until calculated)
    startingNightlyPrice: null,
    slope: null,
    weeklyPriceAdjust: null,

    // Metadata
    rentalType: 'Nightly',
    numberSelectedNights: [],
    modifiedDate: new Date().toISOString()
  };

  // Persist if callback provided
  if (onPersist && typeof onPersist === 'function') {
    await onPersist(pricingListData);
  }

  return {
    success: true,
    pricingList: pricingListData,
    isInitialized: true
  };
}
