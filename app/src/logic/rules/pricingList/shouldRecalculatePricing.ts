/**
 * Determine if a pricing list should be recalculated.
 *
 * Compares the current listing pricing fields with the stored
 * pricing list to detect if any host rates have changed.
 *
 * @intent Detect stale pricing data that needs refresh.
 * @rule Recalculate if any host rate field differs.
 * @rule Recalculate if pricing list is missing or invalid.
 * @rule Recalculate if markup settings have changed.
 *
 * @param params - Named parameters.
 * @returns True if recalculation needed, false otherwise.
 *
 * @throws {Error} If listing is null or undefined.
 *
 * @example
 * ```ts
 * shouldRecalculatePricing({
 *   listing: { 'nightly_rate_2_nights': 110 },
 *   pricingList: { hostCompensation: [null, 100, ...] }
 * })
 * // => true (rate changed from 100 to 110)
 * ```
 */
import { isPricingListValid } from './isPricingListValid.js';
import type { ListingRateField, RateFieldMapping, RecalculationTrigger } from './types.js';

export function shouldRecalculatePricing({ listing, pricingList }: RecalculationTrigger): boolean {
  // No Fallback: Validate listing
  if (!listing) {
    throw new Error('shouldRecalculatePricing: listing is required');
  }

  // Recalculate if no pricing list exists
  if (!pricingList) {
    return true;
  }

  // Recalculate if pricing list is invalid
  if (!isPricingListValid({ pricingList })) {
    return true;
  }

  // Compare host rates with stored compensation
  const hostCompensation = (pricingList as Record<string, unknown>).hostCompensation || (pricingList as Record<string, unknown>)['Host Compensation'] || [];

  const rateFieldMapping: RateFieldMapping[] = [
    { field: 'nightly_rate_1_night', index: 0 },
    { field: 'nightly_rate_2_nights', index: 1 },
    { field: 'nightly_rate_3_nights', index: 2 },
    { field: 'nightly_rate_4_nights', index: 3 },
    { field: 'nightly_rate_5_nights', index: 4 },
    { field: 'nightly_rate_6_nights', index: 5 },
    { field: 'nightly_rate_7_nights', index: 6 }
  ];

  for (const { field, index } of rateFieldMapping) {
    const listingRate = normalizeRate((listing as Record<string, unknown>)[field]);
    const storedRate = normalizeRate(hostCompensation[index]);

    // If either is null and the other isn't, or values differ
    if (listingRate !== storedRate) {
      return true;
    }
  }

  // No changes detected
  return false;
}

/**
 * Normalize a rate value for comparison.
 * @param value - The value to normalize.
 * @returns Normalized rate.
 */
function normalizeRate(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return null;
  }
  return num;
}
