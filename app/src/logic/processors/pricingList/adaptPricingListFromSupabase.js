/**
 * Adapt a pricing list from Supabase format to frontend format.
 *
 * Transforms Bubble-style column names (with spaces) to camelCase
 * properties for consistent frontend usage.
 *
 * @intent Normalize database row format for frontend consumption.
 * @rule Maps Bubble-style names to camelCase.
 * @rule Preserves array structures without modification.
 * @rule Handles both existing and new scalar fields.
 *
 * @param {object} rawPricingList - Raw pricing list row from Supabase.
 * @returns {object} Adapted pricing list with camelCase properties.
 *
 * @throws {Error} If rawPricingList is null or undefined.
 *
 * @example
 * adaptPricingListFromSupabase({
 *   _id: 'abc123',
 *   listing: 'listing456',
 *   'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
 *   'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
 *   'Combined Markup': 0.17,
 *   'Starting Nightly Price': 76
 * })
 * // => {
 * //   id: 'abc123',
 * //   listingId: 'listing456',
 * //   hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 * //   nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 * //   combinedMarkup: 0.17,
 * //   startingNightlyPrice: 76
 * // }
 */
export function adaptPricingListFromSupabase(rawPricingList) {
  if (!rawPricingList) {
    throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
  }

  return {
    // Core identifiers
    id: rawPricingList._id,
    _id: rawPricingList._id, // Keep for compatibility
    listingId: rawPricingList.listing,
    createdBy: rawPricingList['Created By'],

    // Array fields (preserve as-is)
    hostCompensation: rawPricingList['Host Compensation'] || [],
    markupAndDiscountMultiplier: rawPricingList['Markup and Discount Multiplier'] || [],
    nightlyPrice: rawPricingList['Nightly Price'] || [],
    unusedNights: rawPricingList['Unused Nights'] || [],
    unusedNightsDiscount: rawPricingList['Unused Nights Discount'] || [],

    // Scalar markup fields (new)
    unitMarkup: rawPricingList['Unit Markup'] ?? 0,
    overallSiteMarkup: rawPricingList['Overall Site Markup'] ?? 0.17,
    combinedMarkup: rawPricingList['Combined Markup'] ?? 0.17,
    fullTimeDiscount: rawPricingList['Full Time Discount'] ?? 0.13,

    // Calculated scalar fields (new)
    startingNightlyPrice: rawPricingList['Starting Nightly Price'],
    slope: rawPricingList['Slope'],
    weeklyPriceAdjust: rawPricingList['Weekly Price Adjust'],

    // Metadata fields (new)
    rentalType: rawPricingList['rental type'] ?? 'Nightly',
    numberSelectedNights: rawPricingList['Number Selected Nights'] || [],
    modifiedDate: rawPricingList['Modified Date']
  };
}
