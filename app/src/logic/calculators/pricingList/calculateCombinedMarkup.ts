/**
 * Calculate combined markup from unit and site markups.
 *
 * Combines individual listing markup with site-wide markup to get
 * the total markup applied to guest-facing prices.
 *
 * @intent Compute total markup for pricing calculations.
 * @rule Combined markup is additive (unitMarkup + siteMarkup).
 * @rule Result is clamped to reasonable bounds (0 to 1).
 * @rule Default site markup is 17% (SITE_MARKUP_RATE).
 *
 * @param params - Named parameters.
 * @returns Combined markup rate (0-1).
 *
 * @throws {Error} If unitMarkup or siteMarkup are not valid numbers.
 *
 * @example
 * ```ts
 * calculateCombinedMarkup({ unitMarkup: 0.05, siteMarkup: 0.17 })
 * // => 0.22
 *
 * calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: 0.17 })
 * // => 0.17 (default case)
 * ```
 */
import { PRICING_CONSTANTS } from '../../constants/pricingConstants.js';
import type { CalculateCombinedMarkupParams } from './types.js';

export function calculateCombinedMarkup({
  unitMarkup = PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP,
  siteMarkup = PRICING_CONSTANTS.SITE_MARKUP_RATE
}: CalculateCombinedMarkupParams = {}): number {
  // No Fallback: Validate inputs
  if (typeof unitMarkup !== 'number' || isNaN(unitMarkup)) {
    throw new Error(
      `calculateCombinedMarkup: unitMarkup must be a number, got ${typeof unitMarkup}`
    );
  }

  if (typeof siteMarkup !== 'number' || isNaN(siteMarkup)) {
    throw new Error(
      `calculateCombinedMarkup: siteMarkup must be a number, got ${typeof siteMarkup}`
    );
  }

  // Validate ranges
  if (unitMarkup < 0 || unitMarkup > 1) {
    throw new Error(
      `calculateCombinedMarkup: unitMarkup must be between 0 and 1, got ${unitMarkup}`
    );
  }

  if (siteMarkup < 0 || siteMarkup > 1) {
    throw new Error(
      `calculateCombinedMarkup: siteMarkup must be between 0 and 1, got ${siteMarkup}`
    );
  }

  // Combined markup is additive
  const combinedMarkup = unitMarkup + siteMarkup;

  // Clamp to maximum of 1 (100%)
  const clampedMarkup = Math.min(combinedMarkup, 1);

  return roundToFourDecimals(clampedMarkup);
}

/**
 * Round a number to 4 decimal places.
 * @param value - The value to round.
 * @returns Rounded value.
 */
function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
