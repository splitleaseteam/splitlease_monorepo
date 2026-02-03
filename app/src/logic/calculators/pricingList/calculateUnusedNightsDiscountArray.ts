/**
 * Calculate unused nights discount array based on selected nights pattern.
 *
 * Creates a 7-element array where each index represents the discount
 * for unused nights at that tier. Discount increases as more nights
 * remain unused (incentivizes filling gaps).
 *
 * @intent Incentivize guests to book more nights by discounting unused capacity.
 * @rule Array length must be exactly 7 elements.
 * @rule Discount is 0 when all nights are used (7-night stay).
 * @rule Base discount is applied per unused night.
 *
 * Formula: discount[n] = unusedNights × discountMultiplier (LINEAR)
 * - At 7 nights: discount = 0 (no unused nights)
 * - At 2 nights: discount = 5 × discountMultiplier
 *
 * @param params - Named parameters.
 * @returns 7-element array of discount rates (0-1).
 *
 * @throws {Error} If baseDiscount is not a valid number between 0 and 1.
 *
 * @example
 * ```ts
 * calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 })
 * // => [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
 * // (discount decreases as more nights are booked)
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { CalculateUnusedNightsDiscountArrayParams } from './types.js';

export function calculateUnusedNightsDiscountArray({
  selectedNights: _selectedNights = [],
  baseDiscount = PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER
}: CalculateUnusedNightsDiscountArrayParams = {}): number[] {
  // No Fallback: Validate baseDiscount
  if (typeof baseDiscount !== 'number' || isNaN(baseDiscount)) {
    throw new Error(
      `calculateUnusedNightsDiscountArray: baseDiscount must be a number, got ${typeof baseDiscount}`
    );
  }

  if (baseDiscount < 0 || baseDiscount > 1) {
    throw new Error(
      `calculateUnusedNightsDiscountArray: baseDiscount must be between 0 and 1, got ${baseDiscount}`
    );
  }

  const maxNights = PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH;
  const discountArray: number[] = [];

  // Build discount array: higher discount for fewer nights booked
  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1; // nightIndex 0 = 1 night
    const unusedNights = maxNights - nightsBooked;

    // Discount is proportional to unused nights
    // At 7 nights: unusedNights = 0, discount = 0
    // At 1 night: unusedNights = 6, discount = baseDiscount * 6
    const discount = unusedNights * baseDiscount;

    discountArray.push(roundToFourDecimals(discount));
  }

  return discountArray;
}

/**
 * Round a number to 4 decimal places.
 * @param value - The value to round.
 * @returns Rounded value.
 */
function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
