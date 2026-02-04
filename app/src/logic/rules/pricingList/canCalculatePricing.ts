/**
 * Check if a listing has required fields for pricing calculation.
 *
 * Validates that the listing has appropriate host rate(s) defined
 * based on rental type so pricing arrays can be computed.
 *
 * @intent Gate pricing calculation to listings with valid pricing data.
 * @rule For Nightly: At least one nightly host rate must be defined (2-7 nights).
 * @rule For Weekly: weekly_host_rate must be defined.
 * @rule For Monthly: monthly_host_rate must be defined.
 * @rule Rate for 1 night is optional (rarely used).
 *
 * @param params - Named parameters.
 * @returns True if pricing can be calculated, false otherwise.
 *
 * @throws {Error} If listing is null or undefined.
 *
 * @example
 * ```ts
 * // Nightly listing
 * canCalculatePricing({
 *   listing: {
 *     'rental type': 'Nightly',
 *     'nightly_rate_2_nights': 100,
 *     'nightly_rate_3_nights': 95
 *   }
 * })
 * // => true
 *
 * // Monthly listing
 * canCalculatePricing({
 *   listing: {
 *     'rental type': 'Monthly',
 *     'monthly_host_rate': 4800
 *   }
 * })
 * // => true
 *
 * // Weekly listing
 * canCalculatePricing({
 *   listing: {
 *     'rental type': 'Weekly',
 *     'weekly_host_rate': 1200
 *   }
 * })
 * // => true
 *
 * canCalculatePricing({
 *   listing: { Name: 'Empty Listing' }
 * })
 * // => false
 * ```
 */
import type { CalculationPrerequisites, ListingRateField } from './types.js';

export function canCalculatePricing({ listing }: CalculationPrerequisites): boolean {
  // No Fallback: Validate listing exists
  if (!listing) {
    throw new Error('canCalculatePricing: listing is required');
  }

  const listingRecord = listing as Record<string, unknown>;
  const rentalType = listingRecord['rental type'] || 'Nightly';

  // For Weekly rental type: check for weekly_host_rate
  if (rentalType === 'Weekly') {
    const weeklyRate = listingRecord['weekly_host_rate'];
    return isValidRate(weeklyRate);
  }

  // For Monthly rental type: check for monthly_host_rate
  if (rentalType === 'Monthly') {
    const monthlyRate = listingRecord['monthly_host_rate'];
    return isValidRate(monthlyRate);
  }

  // For Nightly rental type (or fallback): check for any valid nightly rate
  const rateFields: ListingRateField[] = [
    'nightly_rate_2_nights',
    'nightly_rate_3_nights',
    'nightly_rate_4_nights',
    'nightly_rate_5_nights',
    'nightly_rate_6_nights',
    'nightly_rate_7_nights'
  ];

  for (const field of rateFields) {
    const value = listingRecord[field];
    if (isValidRate(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a value is a valid positive rate.
 * @param value - The value to check.
 * @returns True if value is a valid positive number.
 */
function isValidRate(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const num = Number(value);
  return typeof num === 'number' && !isNaN(num) && num > 0;
}
