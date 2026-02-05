/**
 * Centralized mapping between database field names and domain property names.
 * Single source of truth for all listing field references.
 *
 * @module data/fieldMappings
 */

// =============================================================================
// PRICING FIELDS (snake_case - current schema)
// =============================================================================

export const PRICING_FIELDS = {
  NIGHTLY_RATE_1: 'nightly_rate_1_night',
  NIGHTLY_RATE_2: 'nightly_rate_2_nights',
  NIGHTLY_RATE_3: 'nightly_rate_3_nights',
  NIGHTLY_RATE_4: 'nightly_rate_4_nights',
  NIGHTLY_RATE_5: 'nightly_rate_5_nights',
  NIGHTLY_RATE_6: 'nightly_rate_6_nights',
  NIGHTLY_RATE_7: 'nightly_rate_7_nights',
  DAMAGE_DEPOSIT: 'damage_deposit',
  CLEANING_FEE: 'cleaning_fee',
  MONTHLY_RATE: 'monthly_host_rate',
  WEEKLY_RATE: 'weekly_host_rate',
  PRICE_OVERRIDE: 'price_override',
};

/**
 * Map nights count (1-7) to the corresponding nightly rate field name.
 */
export const NIGHTLY_RATE_BY_COUNT = {
  1: PRICING_FIELDS.NIGHTLY_RATE_1,
  2: PRICING_FIELDS.NIGHTLY_RATE_2,
  3: PRICING_FIELDS.NIGHTLY_RATE_3,
  4: PRICING_FIELDS.NIGHTLY_RATE_4,
  5: PRICING_FIELDS.NIGHTLY_RATE_5,
  6: PRICING_FIELDS.NIGHTLY_RATE_6,
  7: PRICING_FIELDS.NIGHTLY_RATE_7,
};

// =============================================================================
// AVAILABILITY FIELDS (legacy names with spaces)
// =============================================================================

export const AVAILABILITY_FIELDS = {
  DAYS_AVAILABLE: 'Days Available (List of Days)',
  BLOCKED_DATES: 'Dates - Blocked',
  FIRST_AVAILABLE: ' First Available', // Leading space is intentional (legacy)
  CHECK_IN_TIME: 'NEW Date Check-in Time',
  CHECK_OUT_TIME: 'NEW Date Check-out Time',
  MIN_WEEKS: 'Minimum Weeks',
  MAX_WEEKS: 'Maximum Weeks',
  MIN_NIGHTS: 'Minimum Nights',
  MAX_NIGHTS: 'Maximum Nights',
};

// =============================================================================
// FEATURE FIELDS (stored as JSON arrays)
// =============================================================================

export const FEATURE_FIELDS = {
  AMENITIES_IN_UNIT: 'Features - Amenities In-Unit',
  AMENITIES_IN_BUILDING: 'Features - Amenities In-Building',
  SAFETY: 'Features - Safety',
  HOUSE_RULES: 'Features - House Rules',
  PHOTOS: 'Features - Photos',
  TYPE_OF_SPACE: 'Features - Type of Space',
  BEDROOMS: 'Features - Qty Bedrooms',
  BATHROOMS: 'Features - Qty Bathrooms',
  BEDS: 'Features - Qty Beds',
  GUESTS: 'Features - Qty Guests',
  SQFT: 'Features - SQFT Area',
  SQFT_ROOM: 'Features - SQFT of Room',
  PARKING: 'Features - Parking type',
  STORAGE: 'Features - Secure Storage Option',
};

// =============================================================================
// LEASE FIELDS
// =============================================================================

export const LEASE_FIELDS = {
  RENTAL_TYPE: 'rental type',
  WEEKS_OFFERED: 'Weeks offered',
  CANCELLATION_POLICY: 'Cancellation Policy',
  CANCELLATION_RESTRICTIONS: 'Cancellation Policy - Additional Restrictions',
};

// =============================================================================
// LOCATION FIELDS
// =============================================================================

export const LOCATION_FIELDS = {
  ADDRESS: 'Location - Address',
  CITY: 'Location - City',
  STATE: 'Location - State',
  ZIP_CODE: 'Location - Zip Code',
  BOROUGH: 'Location - Borough',
  HOOD: 'Location - Hood',
};

// =============================================================================
// IDENTITY FIELDS
// =============================================================================

export const IDENTITY_FIELDS = {
  ID: '_id',
  NAME: 'Name',
  DESCRIPTION: 'Description',
  DESCRIPTION_NEIGHBORHOOD: 'Description - Neighborhood',
  ACTIVE: 'Active',
  APPROVED: 'Approved',
  COMPLETE: 'Complete',
  CREATED_DATE: 'Created Date',
  MODIFIED_DATE: 'Modified Date',
};
