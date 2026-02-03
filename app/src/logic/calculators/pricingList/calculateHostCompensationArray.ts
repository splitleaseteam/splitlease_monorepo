/**
 * Calculate host compensation array from listing host rates.
 *
 * Creates a 7-element array where each index represents the host's
 * nightly rate for that number of nights (index 0 = 1 night, index 6 = 7 nights).
 *
 * @intent Map listing host rate fields to standardized pricing array.
 * @rule Array length must be exactly 7 elements.
 * @rule Missing rates default to null (not 0) to distinguish unset from free.
 * @rule Index 0 is rarely used (1-night stays uncommon) but included for completeness.
 *
 * @param params - Named parameters.
 * @returns 7-element array of host compensation rates.
 *
 * @throws {Error} If hostRates is not an object.
 *
 * @example
 * ```ts
 * calculateHostCompensationArray({
 *   hostRates: {
 *     rate2Nights: 100,
 *     rate3Nights: 95,
 *     rate4Nights: 90,
 *     rate5Nights: 85,
 *     rate6Nights: 80,
 *     rate7Nights: 75
 *   }
 * })
 * // => [null, 100, 95, 90, 85, 80, 75]
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { CalculateHostCompensationArrayParams, HostRates } from './types.js';

export function calculateHostCompensationArray({ hostRates }: CalculateHostCompensationArrayParams): (number | null)[] {
  // No Fallback: Strict validation
  if (!hostRates || typeof hostRates !== 'object') {
    throw new Error(
      `calculateHostCompensationArray: hostRates must be an object, got ${typeof hostRates}`
    );
  }

  // Build array: index 0 = 1 night, index 6 = 7 nights
  const compensationArray = [
    normalizeRate(hostRates.rate1Night),
    normalizeRate(hostRates.rate2Nights),
    normalizeRate(hostRates.rate3Nights),
    normalizeRate(hostRates.rate4Nights),
    normalizeRate(hostRates.rate5Nights),
    normalizeRate(hostRates.rate6Nights),
    normalizeRate(hostRates.rate7Nights)
  ];

  // Validate array length
  if (compensationArray.length !== PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH) {
    throw new Error(
      `calculateHostCompensationArray: Expected ${PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH} elements, got ${compensationArray.length}`
    );
  }

  return compensationArray;
}

/**
 * Normalize a rate value to number or null.
 * @param value - The value to normalize.
 * @returns Normalized rate.
 */
function normalizeRate(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}
