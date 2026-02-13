/**
 * Type definitions for pricing list processors.
 *
 * Shared types for data transformation between database, frontend, and display formats.
 *
 * @module processors/pricingList/types
 */

/**
 * Frontend pricing list object format (camelCase properties).
 * Used throughout the application for consistent data handling.
 */
export interface FrontendPricingList {
  /** Primary identifier */
  id?: string;
  /** Reference to listing */
  listingId?: string;
  /** User who created this pricing configuration */
  createdBy?: string;

  /** Array fields - 7-element arrays (index 0 = 1 night, index 6 = 7 nights) */
  /** Host compensation percentages per night tier */
  hostCompensation?: Array<number | null>;
  /** Markup and discount multipliers per night tier */
  markupAndDiscountMultiplier?: Array<number | null>;
  /** Final nightly prices per night tier */
  nightlyPrice?: Array<number | null>;
  /** Whether each night tier is unused/available */
  unusedNights?: boolean[];
  /** Discount percentages for unused nights */
  unusedNightsDiscount?: Array<number | null>;

  /** Scalar markup fields */
  unitMarkup?: number;
  overallSiteMarkup?: number;
  combinedMarkup?: number;
  fullTimeDiscount?: number;

  /** Calculated scalar fields */
  startingNightlyPrice?: number;
  slope?: number;
  weeklyPriceAdjust?: number;

  /** Metadata fields */
  rentalType?: 'Nightly' | 'Monthly' | 'Weekly';
  numberSelectedNights?: number[];
  modifiedDate?: string;
}

/**
 * Supabase pricing_list table row format (snake_case column names).
 * Direct database representation matching actual pricing_list schema.
 */
export interface SupabasePricingRow {
  /** Primary identifier */
  id?: string;
  /** User who created this pricing configuration */
  created_by?: string;

  /** Array fields (jsonb) - 7-element arrays (index 0 = 1 night, index 6 = 7 nights) */
  host_compensation?: Array<number | null>;
  markup_and_discount_multiplier?: Array<number | null>;
  nightly_price?: Array<number | null>;
  unused_nights?: boolean[];
  unused_nights_discount?: Array<number | null>;

  /** Scalar markup fields */
  unit_markup?: number;
  combined_markup?: number;
  full_time_discount?: number;

  /** Calculated scalar fields */
  starting_nightly_price?: number;
  weekly_price_adjust?: number;

  /** Timestamps */
  original_created_at?: string;
  original_updated_at?: string;
  created_at?: string;
  updated_at?: string;
  pending?: boolean;
}

/**
 * Listing object with canonical snake_case pricing fields.
 * Raw format from the listing table.
 */
export interface ListingWithPricing {
  /** Nightly rate for 1 night stay */
  nightly_rate_for_1_night_stay?: unknown;
  /** Nightly rate for 2 night stay */
  nightly_rate_for_2_night_stay?: unknown;
  /** Nightly rate for 3 night stay */
  nightly_rate_for_3_night_stay?: unknown;
  /** Nightly rate for 4 night stay */
  nightly_rate_for_4_night_stay?: unknown;
  /** Nightly rate for 5 night stay */
  nightly_rate_for_5_night_stay?: unknown;
  /** Nightly rate for 6 night stay */
  nightly_rate_for_6_night_stay?: unknown;
  /** Nightly rate for 7 night stay */
  nightly_rate_for_7_night_stay?: unknown;

  /** Weekly host rate (for Weekly rental type) */
  weekly_rate_paid_to_host?: unknown;
  /** Monthly host rate (for Monthly rental type) */
  monthly_rate_paid_to_host?: unknown;
  /** Rental type determines which rate fields to use */
  rental_type?: 'Nightly' | 'Monthly' | 'Weekly';

  /** Additional pricing fields */
  cleaning_fee?: unknown;
  damage_deposit?: unknown;
  price_override?: unknown;

  /** Other listing fields (unknown structure) */
  [key: string]: unknown;
}

/**
 * Extracted and normalized host rates from a listing.
 */
export interface ExtractedHostRates {
  /** Normalized rate for 1 night */
  rate1Night: number | null;
  /** Normalized rate for 2 nights */
  rate2Nights: number | null;
  /** Normalized rate for 3 nights */
  rate3Nights: number | null;
  /** Normalized rate for 4 nights */
  rate4Nights: number | null;
  /** Normalized rate for 5 nights */
  rate5Nights: number | null;
  /** Normalized rate for 6 nights */
  rate6Nights: number | null;
  /** Normalized rate for 7 nights */
  rate7Nights: number | null;

  /** Additional pricing fields */
  cleaningFee: number | null;
  damageDeposit: number | null;
  priceOverride: number | null;
}

/**
 * Single price tier for UI display.
 */
export interface PriceTierDisplay {
  /** Number of nights for this tier */
  nights: number;
  /** Raw price value (null if not available) */
  price: number | null;
  /** Human-readable label (e.g., "2 nights") */
  label: string;
  /** Formatted currency string (e.g., "$117/night" or "N/A") */
  formatted: string;
  /** Whether this is the full-time (7-night) tier */
  isFullTime: boolean;
}

/**
 * Formatted pricing data for UI display.
 */
export interface DisplayPricingData {
  /** Array of price tiers with formatted display values */
  priceTiers: PriceTierDisplay[];
  /** Starting price text (e.g., "$76/night" or "Price varies") */
  startingAt: string;
  /** Starting price as rounded number (null if not available) */
  startingPrice: number | null;
  /** Markup percentage as display string (e.g., "17%") */
  markupDisplay: string;
  /** Discount percentage as display string (e.g., "13%") */
  discountDisplay: string;
  /** Full-time (7-night) price formatted string */
  fullTimePrice: string;
  /** Rental type classification */
  rentalType: 'Nightly' | 'Monthly' | 'Weekly';
}
