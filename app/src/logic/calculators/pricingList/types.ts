/**
 * Type definitions for Pricing List Calculators
 *
 * These types define the data structures used throughout the pricing list
 * calculator functions for calculating guest-facing pricing from host rates.
 */

/**
 * Fixed length of pricing arrays (7 elements for nights 1-7)
 */
export const PRICING_LIST_ARRAY_LENGTH = 7 as const;

/**
 * Rental type for prorated nightly rate calculation
 */
export type RentalType = 'Weekly' | 'Monthly' | 'Nightly';

/**
 * A 7-element pricing array where index represents night count (0-6 for nights 1-7)
 * Null values indicate unavailable/unset pricing tiers
 */
export type PricingArray = readonly [number | null, number | null, number | null, number | null, number | null, number | null, number | null];

/**
 * Mutable version of PricingArray for function returns
 */
export type PricingArrayMutable = (number | null)[];

/**
 * A 7-element multiplier array for markup/discount calculations
 */
export type MultiplierArray = readonly [number, number, number, number, number, number, number];

/**
 * Mutable version of MultiplierArray for function returns
 */
export type MultiplierArrayMutable = number[];

/**
 * A 7-element discount array
 */
export type DiscountArray = readonly [number, number, number, number, number, number, number];

/**
 * Mutable version of DiscountArray for function returns
 */
export type DiscountArrayMutable = number[];

/**
 * Host rates object containing nightly rates for different durations
 */
export interface HostRates {
  /** Rate for 1 night stay */
  rate1Night?: number | null;
  /** Rate for 2 nights stay */
  rate2Nights?: number | null;
  /** Rate for 3 nights stay */
  rate3Nights?: number | null;
  /** Rate for 4 nights stay */
  rate4Nights?: number | null;
  /** Rate for 5 nights stay */
  rate5Nights?: number | null;
  /** Rate for 6 nights stay */
  rate6Nights?: number | null;
  /** Rate for 7 nights stay */
  rate7Nights?: number | null;
}

/**
 * Parameters for calculateAverageWeeklyPrice
 */
export interface CalculateAverageWeeklyPriceParams {
  /** Monthly average nightly rate */
  monthlyAvgNightly: number;
}

/**
 * Parameters for calculateCombinedMarkup
 */
export interface CalculateCombinedMarkupParams {
  /** Individual listing markup (0-1), defaults to 0 */
  unitMarkup?: number;
  /** Site-wide markup (0-1), defaults to 0.17 */
  siteMarkup?: number;
}

/**
 * Parameters for calculateHostCompensationArray
 */
export interface CalculateHostCompensationArrayParams {
  /** Object containing nightly host rates */
  hostRates: HostRates;
}

/**
 * Parameters for calculateLowestNightlyPrice
 */
export interface CalculateLowestNightlyPriceParams {
  /** 7-element array of prices */
  nightlyPrices: PricingArrayMutable | readonly (number | null)[];
}

/**
 * Parameters for calculateMonthlyAvgNightly
 */
export interface CalculateMonthlyAvgNightlyParams {
  /** Monthly host rate */
  monthlyHostRate: number;
  /** Average days per month (typically ~30.4) */
  avgDaysPerMonth: number;
}

/**
 * Parameters for calculateNightlyPricesArray
 */
export interface CalculateNightlyPricesArrayParams {
  /** 7-element array of host compensation rates */
  hostCompensation: PricingArrayMutable | readonly (number | null)[];
  /** 7-element array of multipliers */
  multipliers: MultiplierArrayMutable | readonly number[];
}

/**
 * Parameters for calculateProratedNightlyRate - Weekly rental
 */
export interface CalculateProratedNightlyRateWeeklyParams {
  rentalType: 'Weekly';
  /** Number of nights selected (1-7) */
  selectedNights: number;
  /** Weekly host rate */
  weeklyHostRate: number;
  monthlyHostRate?: never;
  avgDaysPerMonth?: never;
  nightlyRates?: never;
}

/**
 * Parameters for calculateProratedNightlyRate - Monthly rental
 */
export interface CalculateProratedNightlyRateMonthlyParams {
  rentalType: 'Monthly';
  /** Number of nights selected (1-7) */
  selectedNights: number;
  weeklyHostRate?: never;
  /** Monthly host rate */
  monthlyHostRate: number;
  /** Average days per month (from ZAT config) */
  avgDaysPerMonth: number;
  nightlyRates?: never;
}

/**
 * Parameters for calculateProratedNightlyRate - Nightly rental
 */
export interface CalculateProratedNightlyRateNightlyParams {
  rentalType: 'Nightly';
  /** Number of nights selected (1-7) */
  selectedNights: number;
  weeklyHostRate?: never;
  monthlyHostRate?: never;
  avgDaysPerMonth?: never;
  /** 7-element array of nightly host rates [2night, 3night, 4night, 5night, 6night, 7night, weekly] */
  nightlyRates: (number | null)[] | readonly (number | null)[];
}

/**
 * Parameters for calculateProratedNightlyRate (discriminated union)
 */
export type CalculateProratedNightlyRateParams =
  | CalculateProratedNightlyRateWeeklyParams
  | CalculateProratedNightlyRateMonthlyParams
  | CalculateProratedNightlyRateNightlyParams;

/**
 * Parameters for calculateSlope
 */
export interface CalculateSlopeParams {
  /** 7-element array of prices */
  nightlyPrices: PricingArrayMutable | readonly (number | null)[];
}

/**
 * Parameters for calculateMarkupAndDiscountMultipliersArray
 */
export interface CalculateMarkupAndDiscountMultipliersArrayParams {
  /** Combined unit + site markup (0-1) */
  combinedMarkup: number;
  /** Array of unused nights discounts (7 elements) */
  unusedNightsDiscounts: DiscountArrayMutable | readonly number[];
  /** Discount for 7-night stays, defaults to 0.13 */
  fullTimeDiscount?: number;
}

/**
 * Parameters for calculateUnusedNightsDiscountArray
 */
export interface CalculateUnusedNightsDiscountArrayParams {
  /** Array of selected night indices (0-6) - deprecated but accepted */
  selectedNights?: number[];
  /** Base discount rate (default 3%), defaults to 0.03 */
  baseDiscount?: number;
}
