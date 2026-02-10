/**
 * Centralized mapping between database field names and domain property names.
 * Single source of truth for all listing field references.
 *
 * Updated to match new snake_case Supabase column names.
 *
 * @module data/fieldMappings
 */

// =============================================================================
// PRICING FIELDS (snake_case - current schema)
// =============================================================================

export const PRICING_FIELDS = {
  NIGHTLY_RATE_1: 'nightly_rate_for_1_night_stay',
  NIGHTLY_RATE_2: 'nightly_rate_for_2_night_stay',
  NIGHTLY_RATE_3: 'nightly_rate_for_3_night_stay',
  NIGHTLY_RATE_4: 'nightly_rate_for_4_night_stay',
  NIGHTLY_RATE_5: 'nightly_rate_for_5_night_stay',
  NIGHTLY_RATE_6: 'nightly_rate_for_6_night_stay',
  NIGHTLY_RATE_7: 'nightly_rate_for_7_night_stay',
  DAMAGE_DEPOSIT: 'damage_deposit_amount',
  CLEANING_FEE: 'cleaning_fee_amount',
  MONTHLY_RATE: 'monthly_rate_paid_to_host',
  WEEKLY_RATE: 'weekly_rate_paid_to_host',
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
// AVAILABILITY FIELDS (snake_case - new schema)
// =============================================================================

export const AVAILABILITY_FIELDS = {
  DAYS_AVAILABLE: 'available_days_as_day_numbers_json',
  BLOCKED_DATES: 'blocked_specific_dates_json',
  FIRST_AVAILABLE: 'first_available_date',
  CHECK_IN_TIME: 'checkin_time_of_day',
  CHECK_OUT_TIME: 'checkout_time_of_day',
  MIN_WEEKS: 'minimum_weeks_per_stay',
  MAX_WEEKS: 'maximum_weeks_per_stay',
  MIN_NIGHTS: 'minimum_nights_per_stay',
  MAX_NIGHTS: 'maximum_nights_per_stay',
};

// =============================================================================
// FEATURE FIELDS (snake_case - new schema)
// =============================================================================

export const FEATURE_FIELDS = {
  AMENITIES_IN_UNIT: 'in_unit_amenity_reference_ids_json',
  AMENITIES_IN_BUILDING: 'in_building_amenity_reference_ids_json',
  SAFETY: 'safety_feature_reference_ids_json',
  HOUSE_RULES: 'house_rule_reference_ids_json',
  PHOTOS: 'photos_with_urls_captions_and_sort_order_json',
  TYPE_OF_SPACE: 'space_type',
  BEDROOMS: 'bedroom_count',
  BATHROOMS: 'bathroom_count',
  BEDS: 'bed_count',
  GUESTS: 'max_guest_count',
  SQFT: 'square_feet',
  SQFT_ROOM: 'square_feet_room',
  PARKING: 'parking_type',
  STORAGE: 'secure_storage_option',
};

// =============================================================================
// LEASE FIELDS
// =============================================================================

export const LEASE_FIELDS = {
  RENTAL_TYPE: 'rental_type',
  WEEKS_OFFERED: 'weeks_offered_schedule_text',
  CANCELLATION_POLICY: 'cancellation_policy',
  CANCELLATION_RESTRICTIONS: 'cancellation_policy_additional_restrictions',
};

// =============================================================================
// LOCATION FIELDS
// =============================================================================

export const LOCATION_FIELDS = {
  ADDRESS: 'address_with_lat_lng_json',
  CITY: 'city',
  STATE: 'state',
  ZIP_CODE: 'zip_code',
  BOROUGH: 'borough',
  HOOD: 'primary_neighborhood_reference_id',
};

// =============================================================================
// IDENTITY FIELDS
// =============================================================================

export const IDENTITY_FIELDS = {
  ID: 'id',
  NAME: 'listing_title',
  DESCRIPTION: 'listing_description',
  DESCRIPTION_NEIGHBORHOOD: 'neighborhood_description_by_host',
  ACTIVE: 'is_active',
  APPROVED: 'is_approved',
  COMPLETE: 'is_listing_profile_complete',
  CREATED_DATE: 'original_created_at',
  MODIFIED_DATE: 'original_updated_at',
};
