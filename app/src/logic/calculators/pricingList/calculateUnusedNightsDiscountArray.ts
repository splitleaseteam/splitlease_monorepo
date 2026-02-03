/**
 * Calculate length-of-stay discount array based on nights booked.
 *
 * Creates a 7-element array where each index represents the discount
 * for that stay length. Discount INCREASES as more nights are booked
 * (incentivizes longer stays).
 *
 * @intent Incentivize guests to book more nights by offering volume discounts.
 * @rule Array length must be exactly 7 elements.
 * @rule Discount is 0 at 1 night (no volume benefit).
 * @rule Discount increases linearly with nights booked.
 *
 * Formula: discount[n] = (nightsBooked - 1) × discountMultiplier (LINEAR)
 * - At 1 night: discount = 0 (no volume discount)
 * - At 7 nights: discount = 6 × discountMultiplier (maximum discount)
 *
 * @param params - Named parameters.
 * @returns 7-element array of discount rates (0-1).
 *
 * @throws {Error} If baseDiscount is not a valid number between 0 and 1.
 *
 * @example
 * ```ts
 * calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 })
 * // => [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18]
 * // (discount increases as more nights are booked)
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

  // Build discount array: higher discount for MORE nights booked (volume discount)
  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1; // nightIndex 0 = 1 night

    // Discount is proportional to nights booked (length-of-stay discount)
    // At 1 night: (1-1) = 0, discount = 0 (no volume benefit)
    // At 7 nights: (7-1) = 6, discount = baseDiscount * 6 (maximum discount)
    const discount = (nightsBooked - 1) * baseDiscount;

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
