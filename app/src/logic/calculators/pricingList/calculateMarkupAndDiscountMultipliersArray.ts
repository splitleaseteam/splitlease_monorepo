/**
 * Calculate markup and discount multipliers array for pricing.
 *
 * Creates a 7-element array where each index represents the combined
 * multiplier (markup + discount) for that night tier. This is applied
 * to host compensation to get the final guest-facing price.
 *
 * @intent Pre-calculate multipliers for fast price lookups.
 * @rule Array length must be exactly 7 elements.
 * @rule Multiplier = 1 + combinedMarkup - discount.
 * @rule Full-time discount (13%) only applies at index 6 (7 nights).
 *
 * Formula: multiplier[n] = 1 + combinedMarkup - unusedNightsDiscount[n] - fullTimeDiscount
 * Where fullTimeDiscount = 0.13 only when n = 6
 *
 * @param params - Named parameters.
 * @returns 7-element array of multipliers.
 *
 * @throws {Error} If combinedMarkup is not a valid number.
 * @throws {Error} If unusedNightsDiscounts is not a 7-element array.
 *
 * @example
 * ```ts
 * calculateMarkupAndDiscountMultipliersArray({
 *   combinedMarkup: 0.17,
 *   unusedNightsDiscounts: [0.0417, 0.0333, 0.025, 0.0167, 0.0083, 0, 0],
 *   fullTimeDiscount: 0.13
 * })
 * // => [1.1211, 1.1309, 1.1408, 1.1505, 1.1603, 1.17, 1.0179]
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { CalculateMarkupAndDiscountMultipliersArrayParams } from './types.js';

export function calculateMarkupAndDiscountMultipliersArray({
  combinedMarkup,
  unusedNightsDiscounts,
  fullTimeDiscount = PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE
}: CalculateMarkupAndDiscountMultipliersArrayParams): number[] {
  // No Fallback: Validate combinedMarkup
  if (typeof combinedMarkup !== 'number' || isNaN(combinedMarkup)) {
    throw new Error(
      `calculateMarkupAndDiscountMultipliersArray: combinedMarkup must be a number, got ${typeof combinedMarkup}`
    );
  }

  // No Fallback: Validate unusedNightsDiscounts
  if (!Array.isArray(unusedNightsDiscounts)) {
    throw new Error(
      `calculateMarkupAndDiscountMultipliersArray: unusedNightsDiscounts must be an array, got ${typeof unusedNightsDiscounts}`
    );
  }

  if (unusedNightsDiscounts.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
    throw new Error(
      `calculateMarkupAndDiscountMultipliersArray: unusedNightsDiscounts must have ${PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH} elements, got ${unusedNightsDiscounts.length}`
    );
  }

  // No Fallback: Validate fullTimeDiscount
  if (typeof fullTimeDiscount !== 'number' || isNaN(fullTimeDiscount)) {
    throw new Error(
      `calculateMarkupAndDiscountMultipliersArray: fullTimeDiscount must be a number, got ${typeof fullTimeDiscount}`
    );
  }

  const fullTimeNightIndex = PRICING_CONSTANTS.FULL_TIME_NIGHTS_THRESHOLD - 1; // Index 6 = 7 nights
  const multipliersArray: number[] = [];

  for (let nightIndex = 0; nightIndex < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; nightIndex++) {
    const unusedDiscount = unusedNightsDiscounts[nightIndex] || 0;

    // Full-time discount only applies to 7-night stays
    const applicableFullTimeDiscount = nightIndex === fullTimeNightIndex ? fullTimeDiscount : 0;

    // Multiplier = 1 + markup - total discount
    const totalDiscount = unusedDiscount + applicableFullTimeDiscount;
    const multiplier = 1 + combinedMarkup - totalDiscount;

    multipliersArray.push(roundToFourDecimals(multiplier));
  }

  return multipliersArray;
}

/**
 * Round a number to 4 decimal places.
 * @param value - The value to round.
 * @returns Rounded value.
 */
function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
