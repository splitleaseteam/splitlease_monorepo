/**
 * Pricing List Calculators
 *
 * Pure calculation functions for building pricing_list data structures.
 * These calculators transform listing host rates into pre-computed
 * guest-facing pricing arrays for instant price lookups.
 *
 * @module calculators/pricingList
 */

export { calculateHostCompensationArray } from './calculateHostCompensationArray.js';
export { calculateUnusedNightsDiscountArray } from './calculateUnusedNightsDiscountArray.js';
export { calculateCombinedMarkup } from './calculateCombinedMarkup.js';
export { calculateMarkupAndDiscountMultipliersArray } from './calculateMarkupAndDiscountMultipliersArray.js';
export { calculateNightlyPricesArray } from './calculateNightlyPricesArray.js';
export { calculateLowestNightlyPrice } from './calculateLowestNightlyPrice.js';
export { calculateSlope } from './calculateSlope.js';
export { calculateProratedNightlyRate } from './calculateProratedNightlyRate.js';
export { calculateMonthlyAvgNightly } from './calculateMonthlyAvgNightly.js';
export { calculateAverageWeeklyPrice } from './calculateAverageWeeklyPrice.js';

export type {
  CalculateAverageWeeklyPriceParams,
  CalculateCombinedMarkupParams,
  CalculateHostCompensationArrayParams,
  CalculateLowestNightlyPriceParams,
  CalculateMonthlyAvgNightlyParams,
  CalculateMarkupAndDiscountMultipliersArrayParams,
  CalculateNightlyPricesArrayParams,
  CalculateProratedNightlyRateParams,
  CalculateSlopeParams,
  CalculateUnusedNightsDiscountArrayParams,
  DiscountArray,
  DiscountArrayMutable,
  HostRates,
  MultiplierArray,
  MultiplierArrayMutable,
  PricingArray,
  PricingArrayMutable,
  RentalType
} from './types.js';
