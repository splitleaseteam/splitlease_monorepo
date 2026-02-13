/**
 * Adapt a pricing list from Supabase format to frontend format.
 *
 * Transforms snake_case database column names to camelCase
 * properties for consistent frontend usage.
 *
 * @intent Normalize database row format for frontend consumption.
 * @rule Maps snake_case DB names to camelCase.
 * @rule Preserves array structures without modification.
 * @rule Handles both existing and new scalar fields.
 *
 * @param rawPricingList - Raw pricing list row from Supabase pricing_list table.
 * @returns Adapted pricing list with camelCase properties.
 *
 * @throws Error if rawPricingList is null or undefined.
 *
 * @example
 * ```ts
 * adaptPricingListFromSupabase({
 *   id: 'abc123',
 *   host_compensation: [null, 100, 95, 90, 85, 80, 75],
 *   nightly_price: [null, 117, 111, 105, 99, 94, 76],
 *   combined_markup: 0.17,
 *   starting_nightly_price: 76
 * })
 * // => {
 * //   id: 'abc123',
 * //   hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 * //   nightlyPrice: [null, 117, 111, 105, 99, 94, 76],
 * //   combinedMarkup: 0.17,
 * //   startingNightlyPrice: 76
 * // }
 * ```
 */
import type { FrontendPricingList } from './types.js';

export function adaptPricingListFromSupabase(
  rawPricingList: Record<string, unknown>
): FrontendPricingList {
  if (!rawPricingList) {
    throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
  }

  return {
    // Core identifiers
    id: rawPricingList.id as string | undefined,
    listingId: rawPricingList.listing as string | undefined,
    createdBy: rawPricingList.created_by as string | undefined,

    // Array fields (jsonb in DB — preserve as-is)
    hostCompensation: (rawPricingList.host_compensation as Array<number | null>) || [],
    markupAndDiscountMultiplier: (rawPricingList.markup_and_discount_multiplier as Array<number | null>) || [],
    nightlyPrice: (rawPricingList.nightly_price as Array<number | null>) || [],
    unusedNights: (rawPricingList.unused_nights as boolean[]) || [],
    unusedNightsDiscount: (rawPricingList.unused_nights_discount as Array<number | null>) || [],

    // Scalar markup fields
    unitMarkup: (rawPricingList.unit_markup as number) ?? 0,
    overallSiteMarkup: (rawPricingList.overall_site_markup as number) ?? 0.17,
    combinedMarkup: (rawPricingList.combined_markup as number) ?? 0.17,
    fullTimeDiscount: (rawPricingList.full_time_discount as number) ?? 0.13,

    // Calculated scalar fields
    startingNightlyPrice: rawPricingList.starting_nightly_price as number | undefined,
    slope: rawPricingList.slope as number | undefined,
    weeklyPriceAdjust: rawPricingList.weekly_price_adjust as number | undefined,

    // Metadata fields
    rentalType: (rawPricingList.rental_type as 'Nightly' | 'Monthly' | 'Weekly') ?? 'Nightly',
    numberSelectedNights: (rawPricingList.number_selected_nights as number[]) || [],
    modifiedDate: rawPricingList.original_updated_at as string | undefined
  };
}
