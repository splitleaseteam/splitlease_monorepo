/**
 * Calculate the lowest nightly price from a prices array.
 *
 * Finds the minimum non-null price in the array, typically used for
 * "Starting at $X/night" display on listing cards.
 *
 * @intent Find minimum price for search results and listing previews.
 * @rule Ignores null values (unavailable night tiers).
 * @rule Returns null if all prices are null.
 * @rule Typically returns the 7-night price (most discounted).
 *
 * @param {object} params - Named parameters.
 * @param {Array<number|null>} params.nightlyPrices - 7-element array of prices.
 * @returns {number|null} Lowest non-null price, or null if all prices are null.
 *
 * @throws {Error} If nightlyPrices is not an array.
 *
 * @example
 * calculateLowestNightlyPrice({
 *   nightlyPrices: [null, 113, 108.3, 103.5, 98.6, 93.6, 76.5]
 * })
 * // => 76.5 (7-night price is lowest)
 *
 * calculateLowestNightlyPrice({
 *   nightlyPrices: [null, null, null, null, null, null, null]
 * })
 * // => null (no valid prices)
 */
export function calculateLowestNightlyPrice({ nightlyPrices }) {
  // No Fallback: Validate input
  if (!Array.isArray(nightlyPrices)) {
    throw new Error(
      `calculateLowestNightlyPrice: nightlyPrices must be an array, got ${typeof nightlyPrices}`
    );
  }

  // Filter to only valid numbers
  const validPrices = nightlyPrices.filter(
    price => price !== null && price !== undefined && typeof price === 'number' && !isNaN(price)
  );

  // No valid prices
  if (validPrices.length === 0) {
    return null;
  }

  // Find minimum
  const lowestPrice = Math.min(...validPrices);

  return roundToTwoDecimals(lowestPrice);
}

/**
 * Round a number to 2 decimal places (for currency).
 * @param {number} value - The value to round.
 * @returns {number} Rounded value.
 */
function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}
