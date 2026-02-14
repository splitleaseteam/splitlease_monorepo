/**
 * Calculate average weekly price for monthly listings.
 *
 * @intent Convert monthly nightly rate to weekly equivalent.
 * @rule avgWeeklyPrice = monthlyAvgNightly * 7
 *
 * @param params - Named parameters.
 * @returns Average weekly price
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
import type { CalculateAverageWeeklyPriceParams } from './types.js';
import { roundToTwoDecimals } from './utils/rounding.js';

export function calculateAverageWeeklyPrice({ monthlyAvgNightly }: CalculateAverageWeeklyPriceParams): number {
  if (typeof monthlyAvgNightly !== 'number' || isNaN(monthlyAvgNightly)) {
    throw new Error(
      `calculateAverageWeeklyPrice: monthlyAvgNightly must be a number, got ${typeof monthlyAvgNightly}`
    );
  }

  return roundToTwoDecimals(monthlyAvgNightly * 7);
}
