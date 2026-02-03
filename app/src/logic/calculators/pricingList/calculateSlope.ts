/**
 * Calculate price decay slope from nightly prices array.
 *
 * Computes the rate at which price decreases as nights increase.
 * Used for analytics and understanding pricing patterns.
 *
 * @intent Measure price decay rate for analytics and optimization.
 * @rule Slope = (price[first valid] - price[last valid]) / (last index - first index).
 * @rule Returns 0 if only one valid price exists.
 * @rule Returns null if no valid prices exist.
 *
 * Formula: slope = (firstPrice - lastPrice) / (lastIndex - firstIndex)
 * A positive slope means prices decrease as nights increase (expected).
 *
 * @param params - Named parameters.
 * @returns Price decay slope, or null if insufficient data.
 *
 * @throws {Error} If nightlyPrices is not an array.
 *
 * @example
 * ```ts
 * calculateSlope({
 *   nightlyPrices: [null, 120, 115, 110, 105, 100, 85]
 * })
 * // => 7 (price decreases $7 per additional night on average)
 *
 * calculateSlope({
 *   nightlyPrices: [100, 100, 100, 100, 100, 100, 100]
 * })
 * // => 0 (flat pricing)
 * ```
 */
import type { CalculateSlopeParams } from './types.js';

export function calculateSlope({ nightlyPrices }: CalculateSlopeParams): number | null {
  // No Fallback: Validate input
  if (!Array.isArray(nightlyPrices)) {
    throw new Error(
      `calculateSlope: nightlyPrices must be an array, got ${typeof nightlyPrices}`
    );
  }

  // Find first and last valid prices with their indices
  let firstValidIndex = -1;
  let lastValidIndex = -1;
  let firstPrice: number | null = null;
  let lastPrice: number | null = null;

  for (let i = 0; i < nightlyPrices.length; i++) {
    const price = nightlyPrices[i];
    if (price !== null && price !== undefined && typeof price === 'number' && !isNaN(price)) {
      if (firstValidIndex === -1) {
        firstValidIndex = i;
        firstPrice = price;
      }
      lastValidIndex = i;
      lastPrice = price;
    }
  }

  // No valid prices
  if (firstValidIndex === -1) {
    return null;
  }

  // Only one valid price
  if (firstValidIndex === lastValidIndex) {
    return 0;
  }

  // Calculate slope: positive means prices decrease with more nights
  const indexDifference = lastValidIndex - firstValidIndex;
  const priceDifference = (firstPrice ?? 0) - (lastPrice ?? 0);
  const slope = priceDifference / indexDifference;

  return roundToFourDecimals(slope);
}

/**
 * Round a number to 4 decimal places.
 * @param value - The value to round.
 * @returns Rounded value.
 */
function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
