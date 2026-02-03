/**
 * Type Definitions for Pricing List Workflows
 *
 * This file contains all shared type definitions used across
 * the pricing list workflow layer.
 */

/**
 * Host rates extracted from a listing object.
 * Represents the per-night pricing set by the host.
 */
export interface HostRates {
  /** Rate for 1 night (typically null/unavailable) */
  rate1Night: number | null;
  /** Rate for 2 nights */
  rate2Nights: number | null;
  /** Rate for 3 nights */
  rate3Nights: number | null;
  /** Rate for 4 nights */
  rate4Nights: number | null;
  /** Rate for 5 nights */
  rate5Nights: number | null;
  /** Rate for 6 nights */
  rate6Nights: number | null;
  /** Rate for 7 nights */
  rate7Nights: number | null;
  /** One-time cleaning fee */
  cleaningFee: number | null;
  /** Refundable damage deposit */
  damageDeposit: number | null;
  /** Custom price override (if any) */
  priceOverride: number | null;
}

/**
 * Pricing list data structure.
 * Contains pre-calculated pricing arrays for quick lookups.
 * Array indices map to nights booked: index 0 = 1 night, index 6 = 7 nights.
 */
export interface PricingList {
  /** Associated listing ID */
  listingId: string;
  /** User ID who created/updated this pricing */
  createdBy?: string;

  // Arrays (length 7, index 0-6 for 1-7 nights)
  /** Host compensation per night (index = nights - 1) */
  hostCompensation: PricingArray;
  /** Markup and discount multipliers applied to host compensation */
  markupAndDiscountMultiplier: PricingArray;
  /** Final guest-facing nightly prices */
  nightlyPrice: PricingArray;
  /** Unused nights tracking (for availability) */
  unusedNights: PricingArray;
  /** Discount for unused nights (applied when booking less than 7 nights) */
  unusedNightsDiscount: PricingArray;

  // Scalar markups
  /** Unit-level markup (individual listing adjustment) */
  unitMarkup: number;
  /** Site-wide markup rate */
  overallSiteMarkup: number;
  /** Combined markup rate (unit + site) */
  combinedMarkup: number;
  /** Full-time stay discount rate (for 7-night bookings) */
  fullTimeDiscount: number;

  // Derived scalars
  /** Lowest nightly price across all night counts */
  startingNightlyPrice: number | null;
  /** Price slope (rate of change across nights) */
  slope: number | null;
  /** Weekly price adjustment factor */
  weeklyPriceAdjust: number | null;

  // Metadata
  /** Rental type (Nightly, Weekly, etc.) */
  rentalType: string;
  /** Number of selected nights for booking */
  numberSelectedNights: number[];
  /** Last modification timestamp (ISO 8601) */
  modifiedDate: string;
}

/**
 * Pricing array type - 7-element array for nights 1-7.
 * Index 0 = 1 night, Index 6 = 7 nights.
 * Elements can be null (unavailable) or number (price).
 */
export type PricingArray = Array<number | null>;

/**
 * Persist callback function type.
 * Called to save pricing data to storage (database, cache, etc.).
 */
export type PersistCallback<TData = PricingList> = (data: TData) => Promise<unknown>;

// ─────────────────────────────────────────────────────────
// Workflow-specific parameter types
// ─────────────────────────────────────────────────────────

/**
 * Parameters for initializePricingListWorkflow.
 */
export interface InitializePricingListParams {
  /** The listing ID to initialize pricing for */
  listingId: string;
  /** Optional user ID creating the listing */
  userId?: string;
  /** Optional callback for persistence */
  onPersist?: PersistCallback<PricingList>;
}

/**
 * Result returned by initializePricingListWorkflow.
 */
export interface InitializePricingListResult {
  /** Whether initialization succeeded */
  success: true;
  /** The initialized pricing list */
  pricingList: PricingList;
  /** Whether this was a fresh initialization */
  isInitialized: true;
}

/**
 * Parameters for savePricingWorkflow.
 */
export interface SavePricingParams {
  /** Listing object with host rates */
  listing: Record<string, unknown>;
  /** The listing ID */
  listingId: string;
  /** Optional user ID creating/updating pricing */
  userId?: string;
  /** Optional unit-level markup (defaults to 0) */
  unitMarkup?: number;
  /** Optional callback for persistence */
  onPersist?: PersistCallback<PricingList>;
}

/**
 * Result returned by savePricingWorkflow.
 */
export interface SavePricingResult {
  /** Whether save succeeded */
  success: true;
  /** The calculated pricing list */
  pricingList: PricingList;
}

/**
 * Parameters for recalculatePricingListWorkflow.
 */
export interface RecalculatePricingListParams {
  /** Current listing data */
  listing: Record<string, unknown>;
  /** The listing ID */
  listingId: string;
  /** Existing pricing list (for comparison) */
  existingPricingList?: PricingList | null;
  /** Optional user ID triggering recalculation */
  userId?: string;
  /** Force recalculation even if no changes detected */
  force?: boolean;
  /** Optional callback for persistence */
  onPersist?: PersistCallback<PricingList>;
}

/**
 * Result returned by recalculatePricingListWorkflow.
 */
export interface RecalculatePricingListResult {
  /** Whether recalculation succeeded */
  success: true;
  /** The recalculated pricing list (or existing if skipped) */
  pricingList: PricingList;
  /** Whether recalculation was performed */
  recalculated?: true;
  /** Whether recalculation was forced */
  forced?: boolean;
  /** Whether recalculation was skipped */
  skipped?: true;
  /** Reason for skipping (if skipped) */
  reason?: string;
}
