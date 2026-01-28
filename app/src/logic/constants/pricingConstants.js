/**
 * Centralized pricing constants for the Split Lease platform.
 * These values affect guest-facing prices across the application.
 */
export const PRICING_CONSTANTS = {
  /** Full-time stay discount (7 nights/week) as decimal */
  FULL_TIME_DISCOUNT_RATE: 0.13,

  /** Site markup applied to all bookings as decimal */
  SITE_MARKUP_RATE: 0.17,

  /** Minimum nights for full-time discount eligibility */
  FULL_TIME_NIGHTS_THRESHOLD: 7,

  /** Valid night range for pricing calculations */
  MIN_NIGHTS: 2,
  MAX_NIGHTS: 7,

  /** Standard billing cycle in weeks */
  BILLING_CYCLE_WEEKS: 4,

  // ─────────────────────────────────────────────────────────────
  // Pricing List Constants (for pre-calculated pricing arrays)
  // ─────────────────────────────────────────────────────────────

  /** Length of pricing arrays (index 0-6 for nights 1-7) */
  PRICING_LIST_ARRAY_LENGTH: 7,

  /** Default unit-level markup (individual listing) */
  DEFAULT_UNIT_MARKUP: 0,

  /** Default discount multiplier for unused nights */
  UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,

  /** Minimum index for pricing array (0 = 1 night) */
  PRICING_ARRAY_MIN_INDEX: 0,

  /** Maximum index for pricing array (6 = 7 nights) */
  PRICING_ARRAY_MAX_INDEX: 6
};
