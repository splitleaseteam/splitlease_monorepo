/**
 * Shared rounding utilities for pricing list calculators.
 *
 * roundToTwoDecimals: Currency precision (e.g., $108.30).
 * roundToFourDecimals: Rate/multiplier precision (e.g., 1.1408).
 */

/**
 * Round a number to 2 decimal places (for currency values).
 * @param value - The value to round.
 * @returns Rounded value.
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Round a number to 4 decimal places (for rates and multipliers).
 * @param value - The value to round.
 * @returns Rounded value.
 */
export function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}
