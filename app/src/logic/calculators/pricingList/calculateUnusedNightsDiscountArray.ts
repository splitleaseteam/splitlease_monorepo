/**
 * Calculate unused nights discount array for partial-week bookings.
 *
 * Creates a 7-element array where each index represents the discount
 * for unused nights at that tier. Discount DECREASES as more nights
 * are booked (compensates guests for partial-week bookings).
 *
 * @intent Compensate guests who book partial weeks for unused capacity.
 * @rule Array length must be exactly 7 elements.
 * @rule Discount is 0 at 7 nights (no unused nights).
 * @rule Discount increases linearly with unused nights.
 *
 * Formula: discount[n] = unusedNights × discountMultiplier (LINEAR)
 * - At 1 night: 6 unused nights, discount = 6 × discountMultiplier (maximum)
 * - At 7 nights: 0 unused nights, discount = 0 (full-time gets separate discount)
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

  // Build discount array: higher discount for FEWER nights booked (unused nights compensation)
  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1; // nightIndex 0 = 1 night
    const unusedNights = maxNights - nightsBooked;

    // Discount is proportional to unused nights (partial-week compensation)
    // At 1 night: 6 unused nights, discount = baseDiscount * 6 (maximum)
    // At 7 nights: 0 unused nights, discount = 0 (full-time gets separate discount)
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
