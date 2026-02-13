/**
 * Adapt a pricing list from frontend format to Supabase format.
 *
 * Transforms camelCase properties to snake_case column names
 * for database storage in the pricing_list table.
 *
 * @intent Prepare frontend data for database insertion/update.
 * @rule Maps camelCase to snake_case column names.
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
 *   hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 *   nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 *   combinedMarkup: 0.17,
 *   startingNightlyPrice: 76
 * })
 * // => {
 * //   host_compensation: [null, 100, 95, 90, 85, 80, 75],
 * //   nightly_price: [null, 117, 111, 105, 99, 94, 76],
 * //   combined_markup: 0.17,
 * //   starting_nightly_price: 76
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
    adapted.id = pricingList.id;
  }
  if (pricingList.createdBy !== undefined) {
    adapted.created_by = pricingList.createdBy;
  }

  // Array fields (jsonb)
  if (pricingList.hostCompensation !== undefined) {
    adapted.host_compensation = pricingList.hostCompensation;
  }
  if (pricingList.markupAndDiscountMultiplier !== undefined) {
    adapted.markup_and_discount_multiplier = pricingList.markupAndDiscountMultiplier;
  }
  if (pricingList.nightlyPrice !== undefined) {
    adapted.nightly_price = pricingList.nightlyPrice;
  }
  if (pricingList.unusedNights !== undefined) {
    adapted.unused_nights = pricingList.unusedNights;
  }
  if (pricingList.unusedNightsDiscount !== undefined) {
    adapted.unused_nights_discount = pricingList.unusedNightsDiscount;
  }

  // Scalar markup fields
  if (pricingList.unitMarkup !== undefined) {
    adapted.unit_markup = pricingList.unitMarkup;
  }
  if (pricingList.combinedMarkup !== undefined) {
    adapted.combined_markup = pricingList.combinedMarkup;
  }
  if (pricingList.fullTimeDiscount !== undefined) {
    adapted.full_time_discount = pricingList.fullTimeDiscount;
  }

  // Calculated scalar fields
  if (pricingList.startingNightlyPrice !== undefined) {
    adapted.starting_nightly_price = pricingList.startingNightlyPrice;
  }
  if (pricingList.weeklyPriceAdjust !== undefined) {
    adapted.weekly_price_adjust = pricingList.weeklyPriceAdjust;
  }

  // Metadata
  if (pricingList.modifiedDate !== undefined) {
    adapted.original_updated_at = pricingList.modifiedDate;
  }

  return adapted;
}
