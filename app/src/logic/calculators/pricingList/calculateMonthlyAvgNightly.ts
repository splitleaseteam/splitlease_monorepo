/**
 * Calculate monthly average nightly rate.
 *
 * @intent Convert monthly host rate to daily equivalent for pricing.
 * @rule monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth
 *
 * @param params - Named parameters.
 * @returns Average nightly rate
 *
 * @throws {Error} If required parameters are missing or invalid.
 */
import type { CalculateMonthlyAvgNightlyParams } from './types.js';
import { roundToTwoDecimals } from './utils/rounding.js';

export function calculateMonthlyAvgNightly({ monthlyHostRate, avgDaysPerMonth }: CalculateMonthlyAvgNightlyParams): number {
  if (typeof monthlyHostRate !== 'number' || isNaN(monthlyHostRate)) {
    throw new Error(
      `calculateMonthlyAvgNightly: monthlyHostRate must be a number, got ${typeof monthlyHostRate}`
    );
  }

  if (typeof avgDaysPerMonth !== 'number' || avgDaysPerMonth <= 0) {
    throw new Error(
      `calculateMonthlyAvgNightly: avgDaysPerMonth must be positive, got ${avgDaysPerMonth}`
    );
  }

  return roundToTwoDecimals(monthlyHostRate / avgDaysPerMonth);
}
