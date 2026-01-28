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
 * @param {object} params - Named parameters.
 * @param {number[]} [params.selectedNights] - Array of selected night indices (0-6).
 * @param {number} [params.baseDiscount=0.03] - Base discount rate (default 3%).
 * @returns {Array<number>} 7-element array of discount rates (0-1).
 *
 * @throws {Error} If baseDiscount is not a valid number between 0 and 1.
 *
 * @example
 * calculateUnusedNightsDiscountArray({ baseDiscount: 0.03 })
 * // => [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]
 * // (discount decreases as more nights are booked)
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';

export function calculateUnusedNightsDiscountArray({ selectedNights = [], baseDiscount = PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER } = {}) {
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
  const discountArray = [];

  // Build discount array: higher discount for fewer nights booked
  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1; // nightIndex 0 = 1 night
    const unusedNights = maxNights - nightsBooked;

    // Discount is proportional to unused nights
    // At 7 nights: unusedNights = 0, discount = 0
    // At 1 night: unusedNights = 6, discount = baseDiscount
    const discount = unusedNights * baseDiscount;

    discountArray.push(roundToFourDecimals(discount));
  }

  return discountArray;
}

/**
 * Round a number to 4 decimal places.
 * @param {number} value - The value to round.
 * @returns {number} Rounded value.
 */
function roundToFourDecimals(value) {
  return Math.round(value * 10000) / 10000;
}
