/**
 * Adapt a raw listing record for the matching algorithm.
 *
 * @intent Transform raw database listing into normalized structure for matching.
 * @rule Extracts only fields relevant to matching algorithm.
 * @rule Normalizes field names from DB snake_case to camelCase.
 * @rule Includes host verification count for scoring.
 *
 * @param {object} rawListing - Raw listing object from Supabase.
 * @returns {object} Adapted listing object for matching.
 *
 * @throws {Error} If rawListing is null or undefined.
 *
 * @example
 * adaptCandidateListing({
 *   id: 'abc123',
 *   borough: 'Manhattan',
 *   available_days_as_day_numbers_json: [0, 1, 2, 3, 4, 5, 6],
 *   minimum_nights_per_stay: 3,
 *   nightly_rate_for_4_night_stay: 150,
 *   host_user_id: 'host123'
 * })
 * // => {
 * //   id: 'abc123',
 * //   borough: 'Manhattan',
 * //   boroughName: 'Manhattan',
 * //   availableDays: [0, 1, 2, 3, 4, 5, 6],
 * //   minimumNights: 3,
 * //   pricing: { ... },
 * //   host: { id: 'host123', verifications: 0 }
 * // }
 */
import { countHostVerifications } from '../../rules/matching/isVerifiedHost.js';

export function adaptCandidateListing(rawListing) {
  if (!rawListing) {
    throw new Error('adaptCandidateListing: rawListing is required');
  }

  // Extract host data if nested
  const hostData = rawListing.host || null;

  // Extract address from JSONB structure
  const addressData = rawListing.address_with_lat_lng_json;
  const addressString =
    typeof addressData === 'object' && addressData?.address
      ? addressData.address
      : typeof addressData === 'string'
        ? addressData
        : null;

  const availableDays = rawListing.available_days_as_day_numbers_json || [];
  const minimumNights = rawListing.minimum_nights_per_stay || null;

  return {
    // Core identifiers
    id: rawListing.id,

    // Name and description
    name: rawListing.listing_title || 'Untitled Listing',
    description: rawListing.listing_description || null,

    // Location
    borough: rawListing.borough || null,
    boroughName: rawListing.boroughName || rawListing.borough || null,
    hood: rawListing.primary_neighborhood_reference_id || null,
    hoodName: rawListing.hoodName || null,
    address: addressString,

    // Availability & Scheduling
    availableDays,
    available_days_as_day_numbers_json: availableDays,
    minimumNights,
    minimum_nights_per_stay: minimumNights,
    blockedDates: rawListing.blocked_specific_dates_json || [],

    // Pricing (keep raw fields for getNightlyRateByFrequency)
    pricing: {
      rate2Nights: rawListing.nightly_rate_for_2_night_stay || null,
      rate3Nights: rawListing.nightly_rate_for_3_night_stay || null,
      rate4Nights: rawListing.nightly_rate_for_4_night_stay || null,
      rate5Nights: rawListing.nightly_rate_for_5_night_stay || null,
      rate7Nights: rawListing.nightly_rate_for_7_night_stay || null,
      cleaningFee: rawListing.cleaning_fee_amount || 0,
      damageDeposit: rawListing.damage_deposit_amount || 0,
      priceOverride: rawListing.price_override || null
    },

    // Keep original pricing fields for calculator compatibility
    nightly_rate_for_1_night_stay: rawListing.nightly_rate_for_1_night_stay || null,
    nightly_rate_for_2_night_stay: rawListing.nightly_rate_for_2_night_stay || null,
    nightly_rate_for_3_night_stay: rawListing.nightly_rate_for_3_night_stay || null,
    nightly_rate_for_4_night_stay: rawListing.nightly_rate_for_4_night_stay || null,
    nightly_rate_for_5_night_stay: rawListing.nightly_rate_for_5_night_stay || null,
    nightly_rate_for_7_night_stay: rawListing.nightly_rate_for_7_night_stay || null,
    price_override: rawListing.price_override || null,

    // Features
    bedrooms: rawListing.bedroom_count || null,
    bathrooms: rawListing.bathroom_count || null,
    photos: rawListing.photos_with_urls_captions_and_sort_order_json || [],
    featuredPhotoUrl: rawListing.featuredPhotoUrl || null,

    // Host reference
    host: {
      id: rawListing.host_user_id || null,
      verifications: hostData ? countHostVerifications({ host: hostData }) : 0
    },

    // Status
    status: rawListing.is_active ? 'active' : null
  };
}
