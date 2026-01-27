/**
 * Save Pricing Workflow
 *
 * Main orchestrator for calculating and persisting pricing list data.
 * Replaces Bubble's CORE-save_pricing_robert workflow.
 *
 * This workflow:
 * 1. Extracts host rates from listing
 * 2. Calculates all pricing arrays
 * 3. Computes derived scalars
 * 4. Calls Edge Function to persist
 *
 * @intent Orchestrate complete pricing calculation and persistence.
 * @rule Uses pure calculators for all math operations.
 * @rule Calls Edge Function for database persistence.
 * @rule Returns result for UI feedback.
 */
import {
  calculateHostCompensationArray,
  calculateUnusedNightsDiscountArray,
  calculateCombinedMarkup,
  calculateMarkupAndDiscountMultipliersArray,
  calculateNightlyPricesArray,
  calculateLowestNightlyPrice,
  calculateSlope
} from '../../calculators/pricingList/index.js';

import { extractHostRatesFromListing } from '../../processors/pricingList/index.js';
import { canCalculatePricing } from '../../rules/pricingList/index.js';
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';

/**
 * Execute the save pricing workflow.
 *
 * @param {object} params - Workflow parameters.
 * @param {object} params.listing - Listing object with host rates.
 * @param {string} params.listingId - The listing ID.
 * @param {string} [params.userId] - The user ID creating/updating.
 * @param {number} [params.unitMarkup=0] - Optional unit-level markup.
 * @param {Function} [params.onPersist] - Callback for persistence (receives pricing data).
 * @returns {Promise<object>} Result with calculated pricing list.
 *
 * @throws {Error} If listing cannot be used for pricing calculation.
 *
 * @example
 * const result = await savePricingWorkflow({
 *   listing: listingData,
 *   listingId: 'abc123',
 *   userId: 'user456',
 *   onPersist: async (data) => await callEdgeFunction(data)
 * });
 */
export async function savePricingWorkflow({
  listing,
  listingId,
  userId,
  unitMarkup = PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP,
  onPersist
}) {
  // Step 1: Validate listing can be priced
  if (!canCalculatePricing({ listing })) {
    throw new Error(
      'savePricingWorkflow: Listing does not have valid host rates for pricing calculation'
    );
  }

  // Step 2: Extract host rates from listing
  const hostRates = extractHostRatesFromListing(listing);

  // Step 3: Calculate host compensation array
  const hostCompensation = calculateHostCompensationArray({ hostRates });

  // Step 4: Calculate combined markup
  const combinedMarkup = calculateCombinedMarkup({
    unitMarkup,
    siteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE
  });

  // Step 5: Calculate unused nights discount array
  const unusedNightsDiscount = calculateUnusedNightsDiscountArray({
    baseDiscount: PRICING_CONSTANTS.DEFAULT_UNUSED_NIGHTS_DISCOUNT
  });

  // Step 6: Calculate multipliers array
  const markupAndDiscountMultiplier = calculateMarkupAndDiscountMultipliersArray({
    combinedMarkup,
    unusedNightsDiscounts: unusedNightsDiscount,
    fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE
  });

  // Step 7: Calculate nightly prices array
  const nightlyPrice = calculateNightlyPricesArray({
    hostCompensation,
    multipliers: markupAndDiscountMultiplier
  });

  // Step 8: Calculate derived scalars
  const startingNightlyPrice = calculateLowestNightlyPrice({ nightlyPrices: nightlyPrice });
  const slope = calculateSlope({ nightlyPrices: nightlyPrice });

  // Step 9: Build pricing list object
  const pricingListData = {
    listingId,
    createdBy: userId,

    // Arrays
    hostCompensation,
    markupAndDiscountMultiplier,
    nightlyPrice,
    unusedNightsDiscount,

    // Scalar markups
    unitMarkup,
    overallSiteMarkup: PRICING_CONSTANTS.SITE_MARKUP_RATE,
    combinedMarkup,
    fullTimeDiscount: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,

    // Derived scalars
    startingNightlyPrice,
    slope,

    // Metadata
    rentalType: listing['rental type'] || 'Nightly',
    modifiedDate: new Date().toISOString()
  };

  // Step 10: Persist if callback provided
  if (onPersist && typeof onPersist === 'function') {
    await onPersist(pricingListData);
  }

  return {
    success: true,
    pricingList: pricingListData
  };
}
