/**
 * Type definitions for pricing list validation rules.
 *
 * These types define the structure of pricing data and validation criteria
 * used across the pricing rules layer.
 */

/**
 * A pricing array with exactly 7 elements (index 0-6 for nights 1-7).
 * Each element can be null or a number.
 */
export type PricingArray = readonly [number | null, number | null, number | null, number | null, number | null, number | null, number | null];

/**
 * Field name variants for pricing list properties.
 * Supports both camelCase (frontend) and Bubble-style (database) naming.
 */
export type PricingListFieldNames = {
  /** Host compensation per night */
  hostCompensation: 'hostCompensation' | 'Host Compensation';
  /** Final nightly price per night */
  nightlyPrice: 'nightlyPrice' | 'Nightly Price';
  /** Markup and discount multiplier per night */
  markupAndDiscountMultiplier: 'markupAndDiscountMultiplier' | 'Markup and Discount Multiplier';
  /** Discount for unused nights per night */
  unusedNightsDiscount: 'unusedNightsDiscount' | 'Unused Nights Discount';
  /** Combined markup percentage (scalar) */
  combinedMarkup: 'combinedMarkup' | 'Combined Markup';
};

/**
 * Pricing list object with all possible pricing arrays and scalar values.
 * Supports both camelCase and Bubble-style field names.
 */
export interface PricingList {
  /** Host compensation rates per night (7 elements) */
  hostCompensation?: PricingArray;
  /** @deprecated Use hostCompensation instead */
  'Host Compensation'?: PricingArray;

  /** Final nightly prices per night (7 elements) */
  nightlyPrice?: PricingArray;
  /** @deprecated Use nightlyPrice instead */
  'Nightly Price'?: PricingArray;

  /** Markup and discount multipliers per night (7 elements) */
  markupAndDiscountMultiplier?: PricingArray;
  /** @deprecated Use markupAndDiscountMultiplier instead */
  'Markup and Discount Multiplier'?: PricingArray;

  /** Unused nights discounts per night (7 elements) */
  unusedNightsDiscount?: PricingArray;
  /** @deprecated Use unusedNightsDiscount instead */
  'Unused Nights Discount'?: PricingArray;

  /** Combined markup as decimal (0-1) */
  combinedMarkup?: number;
  /** @deprecated Use combinedMarkup instead */
  'Combined Markup'?: number;

  /** Additional unknown fields from database records */
  [key: string]: unknown;
}

/**
 * Listing rate field names for nightly rates.
 * Maps to listing properties from Bubble or frontend.
 */
export type ListingRateField =
  | 'nightly_rate_1_night'
  | 'nightly_rate_2_nights'
  | 'nightly_rate_3_nights'
  | 'nightly_rate_4_nights'
  | 'nightly_rate_5_nights'
  | 'nightly_rate_6_nights'
  | 'nightly_rate_7_nights';

/**
 * Listing object with nightly rate fields.
 * Rates can be numbers, numeric strings, or null/undefined.
 */
export interface ListingWithRates {
  /** Rate for 1 night stay */
  nightly_rate_1_night?: number | string | null;
  /** Rate for 2 nights stay */
  nightly_rate_2_nights?: number | string | null;
  /** Rate for 3 nights stay */
  nightly_rate_3_nights?: number | string | null;
  /** Rate for 4 nights stay */
  nightly_rate_4_nights?: number | string | null;
  /** Rate for 5 nights stay */
  nightly_rate_5_nights?: number | string | null;
  /** Rate for 6 nights stay */
  nightly_rate_6_nights?: number | string | null;
  /** Rate for 7 nights stay */
  nightly_rate_7_nights?: number | string | null;

  /** Weekly host rate (for Weekly rental type) */
  weekly_host_rate?: number | string | null;
  /** Monthly host rate (for Monthly rental type) */
  monthly_host_rate?: number | string | null;
  /** Rental type determines which rate fields to use */
  'rental type'?: 'Nightly' | 'Monthly' | 'Weekly';

  /** Additional listing properties */
  [key: string]: unknown;
}

/**
 * Parameters for isPricingListValid validation rule.
 */
export interface PricingValidationCriteria {
  /** The pricing list to validate */
  pricingList: PricingList | unknown;
}

/**
 * Parameters for canCalculatePricing rule.
 */
export interface CalculationPrerequisites {
  /** The listing to check for pricing calculation readiness */
  listing: ListingWithRates | unknown;
}

/**
 * Parameters for shouldRecalculatePricing rule.
 */
export interface RecalculationTrigger {
  /** Current listing data with rate fields */
  listing: ListingWithRates | unknown;
  /** Existing pricing list to compare against (null if none exists) */
  pricingList: PricingList | null;
}

/**
 * Normalized rate value for comparison.
 * Null represents undefined, NaN, or explicitly null values.
 */
export type NormalizedRate = number | null;

/**
 * Rate field to array index mapping for recalculation checks.
 */
export interface RateFieldMapping {
  /** The listing rate field name */
  field: ListingRateField;
  /** The corresponding index in pricing arrays (0-6) */
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}
