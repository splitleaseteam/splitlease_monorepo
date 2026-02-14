/**
 * Calculate guest-facing nightly prices array.
 *
 * Creates a 7-element array where each index represents the guest-facing
 * nightly price for that number of nights. This is the final price shown
 * to guests after all markups and discounts.
 *
 * @intent Generate pre-calculated prices for instant display.
 * @rule Array length must be exactly 7 elements.
 * @rule Price = hostCompensation × multiplier.
 * @rule Null host compensation results in null price (not 0).
 *
 * Formula: nightlyPrice[n] = hostCompensation[n] × multiplier[n]
 *
 * @param params - Named parameters.
 * @returns 7-element array of guest-facing nightly prices.
 *
 * @throws {Error} If hostCompensation is not a 7-element array.
 * @throws {Error} If multipliers is not a 7-element array.
 *
 * @example
 * ```ts
 * calculateNightlyPricesArray({
 *   hostCompensation: [null, 100, 95, 90, 85, 80, 75],
 *   multipliers: [1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.02]
 * })
 * // => [null, 113, 108.3, 103.5, 98.6, 93.6, 76.5]
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { CalculateNightlyPricesArrayParams } from './types.js';
import { roundToTwoDecimals } from './utils/rounding.js';

export function calculateNightlyPricesArray({ hostCompensation, multipliers }: CalculateNightlyPricesArrayParams): (number | null)[] {
  // No Fallback: Validate hostCompensation
  if (!Array.isArray(hostCompensation)) {
    throw new Error(
      `calculateNightlyPricesArray: hostCompensation must be an array, got ${typeof hostCompensation}`
    );
  }

  if (hostCompensation.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
    throw new Error(
      `calculateNightlyPricesArray: hostCompensation must have ${PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH} elements, got ${hostCompensation.length}`
    );
  }

  // No Fallback: Validate multipliers
  if (!Array.isArray(multipliers)) {
    throw new Error(
      `calculateNightlyPricesArray: multipliers must be an array, got ${typeof multipliers}`
    );
  }

  if (multipliers.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
    throw new Error(
      `calculateNightlyPricesArray: multipliers must have ${PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH} elements, got ${multipliers.length}`
    );
  }

  const pricesArray: (number | null)[] = [];

  for (let i = 0; i < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; i++) {
    const hostRate = hostCompensation[i];
    const multiplier = multipliers[i];

    // Null host rate results in null price
    if (hostRate === null || hostRate === undefined) {
      pricesArray.push(null);
      continue;
    }

    // Validate host rate is a number
    if (typeof hostRate !== 'number' || isNaN(hostRate)) {
      pricesArray.push(null);
      continue;
    }

    // Calculate guest-facing price
    const nightlyPrice = hostRate * multiplier;
    pricesArray.push(roundToTwoDecimals(nightlyPrice));
  }

  return pricesArray;
}
