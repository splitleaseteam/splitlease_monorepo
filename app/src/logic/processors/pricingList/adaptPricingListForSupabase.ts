/**
 * Adapt a pricing list from frontend format to Supabase format.
 *
 * Transforms camelCase properties to Bubble-style column names
 * (with spaces) for database storage and Bubble sync.
 *
 * @intent Prepare frontend data for database insertion/update.
 * @rule Maps camelCase to Bubble-style column names.
 * @rule Only includes defined fields (undefined values are omitted).
 * @rule Preserves array structures without modification.
 *
 * @param pricingList - Frontend pricing list object.
 * @returns Adapted pricing list for Supabase.
 *
 * @throws Error if pricingList is null or undefined.
 *
 * @example
 * ```ts
 * adaptPricingListForSupabase({
 *   listingId: 'listing456',
 *   hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 *   nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 *   combinedMarkup: 0.17,
 *   startingNightlyPrice: 76
 * })
 * // => {
 * //   listing: 'listing456',
 * //   'Host Compensation': [null, 100, 95, 90, 85, 80, 75],
 * //   'Nightly Price': [null, 117, 111, 105, 99, 94, 76],
 * //   'Combined Markup': 0.17,
 * //   'Starting Nightly Price': 76
 * // }
 * ```
 */
import type { FrontendPricingList, SupabasePricingRow } from './types.js';

export function adaptPricingListForSupabase(
  pricingList: FrontendPricingList
): Partial<SupabasePricingRow> {
  if (!pricingList) {
    throw new Error('adaptPricingListForSupabase: pricingList is required');
  }

  const adapted: Partial<SupabasePricingRow> = {};

  // Core identifiers
  if (pricingList.id !== undefined) {
    adapted._id = pricingList.id;
  }
  if (pricingList._id !== undefined) {
    adapted._id = pricingList._id;
  }
  if (pricingList.listingId !== undefined) {
    adapted.listing = pricingList.listingId;
  }
  if (pricingList.createdBy !== undefined) {
    adapted['Created By'] = pricingList.createdBy;
  }

  // Array fields
  if (pricingList.hostCompensation !== undefined) {
    adapted['Host Compensation'] = pricingList.hostCompensation;
  }
  if (pricingList.markupAndDiscountMultiplier !== undefined) {
    adapted['Markup and Discount Multiplier'] = pricingList.markupAndDiscountMultiplier;
  }
  if (pricingList.nightlyPrice !== undefined) {
    adapted['Nightly Price'] = pricingList.nightlyPrice;
  }
  if (pricingList.unusedNights !== undefined) {
    adapted['Unused Nights'] = pricingList.unusedNights;
  }
  if (pricingList.unusedNightsDiscount !== undefined) {
    adapted['Unused Nights Discount'] = pricingList.unusedNightsDiscount;
  }

  // Scalar markup fields
  if (pricingList.unitMarkup !== undefined) {
    adapted['Unit Markup'] = pricingList.unitMarkup;
  }
  if (pricingList.overallSiteMarkup !== undefined) {
    adapted['Overall Site Markup'] = pricingList.overallSiteMarkup;
  }
  if (pricingList.combinedMarkup !== undefined) {
    adapted['Combined Markup'] = pricingList.combinedMarkup;
  }
  if (pricingList.fullTimeDiscount !== undefined) {
    adapted['Full Time Discount'] = pricingList.fullTimeDiscount;
  }

  // Calculated scalar fields
  if (pricingList.startingNightlyPrice !== undefined) {
    adapted['Starting Nightly Price'] = pricingList.startingNightlyPrice;
  }
  if (pricingList.slope !== undefined) {
    adapted['Slope'] = pricingList.slope;
  }
  if (pricingList.weeklyPriceAdjust !== undefined) {
    adapted['Weekly Price Adjust'] = pricingList.weeklyPriceAdjust;
  }

  // Metadata fields
  if (pricingList.rentalType !== undefined) {
    adapted.rental_type = pricingList.rentalType;
  }
  if (pricingList.numberSelectedNights !== undefined) {
    adapted['Number Selected Nights'] = pricingList.numberSelectedNights;
  }
  if (pricingList.modifiedDate !== undefined) {
    adapted.original_updated_at = pricingList.modifiedDate;
  }

  return adapted;
}
