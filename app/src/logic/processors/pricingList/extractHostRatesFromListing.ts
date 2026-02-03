/**
 * Extract host rate fields from a listing object.
 *
 * Pulls the 💰 nightly rate fields from a listing and normalizes
 * them into a structured format for pricing calculations.
 *
 * @intent Isolate pricing-relevant fields from listing data.
 * @rule Maps Bubble field names to standardized rate structure.
 * @rule Handles both raw Bubble format and adapted format.
 * @rule Returns null for missing or invalid rates.
 *
 * @param listing - Listing object with pricing fields.
 * @returns Structured host rates object.
 *
 * @throws Error if listing is null or undefined.
 *
 * @example
 * ```ts
 * extractHostRatesFromListing({
 *   nightly_rate_2_nights: 100,
 *   nightly_rate_3_nights: 95,
 *   nightly_rate_4_nights: 90,
 *   nightly_rate_5_nights: 85,
 *   nightly_rate_6_nights: 80,
 *   nightly_rate_7_nights: 75
 * })
 * // => {
 * //   rate1Night: null,
 * //   rate2Nights: 100,
 * //   rate3Nights: 95,
 * //   rate4Nights: 90,
 * //   rate5Nights: 85,
 * //   rate6Nights: 80,
 * //   rate7Nights: 75
 * // }
 * ```
 */
import type { ExtractedHostRates, ListingWithPricing } from './types.js';

export function extractHostRatesFromListing(
  listing: ListingWithPricing
): ExtractedHostRates {
  if (!listing) {
    throw new Error('extractHostRatesFromListing: listing is required');
  }

  return {
    rate1Night: normalizeRate(listing['nightly_rate_1_night']),
    rate2Nights: normalizeRate(listing['nightly_rate_2_nights']),
    rate3Nights: normalizeRate(listing['nightly_rate_3_nights']),
    rate4Nights: normalizeRate(listing['nightly_rate_4_nights']),
    rate5Nights: normalizeRate(listing['nightly_rate_5_nights']),
    rate6Nights: normalizeRate(listing['nightly_rate_6_nights']),
    rate7Nights: normalizeRate(listing['nightly_rate_7_nights']),

    // Also extract related pricing fields
    cleaningFee: normalizeRate(listing.cleaning_fee),
    damageDeposit: normalizeRate(listing.damage_deposit),
    priceOverride: normalizeRate(listing.price_override)
  };
}

/**
 * Normalize a rate value to number or null.
 * @param value - The value to normalize.
 * @returns Normalized rate.
 */
function normalizeRate(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}
