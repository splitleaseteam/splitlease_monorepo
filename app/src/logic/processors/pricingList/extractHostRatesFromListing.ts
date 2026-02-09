/**
 * Extract host rate fields from a listing object.
 *
 * Pulls the ðŸ’° host rate fields from a listing and normalizes
 * them into a structured format for pricing calculations.
 *
 * Supports all three rental types:
 * - Nightly: Uses individual nightly_rate_* fields
 * - Weekly: Converts weekly_host_rate to synthetic nightly rates
 * - Monthly: Converts monthly_host_rate to synthetic nightly rates
 *
 * @intent Isolate pricing-relevant fields from listing data.
 * @rule Maps Bubble field names to standardized rate structure.
 * @rule Handles both raw Bubble format and adapted format.
 * @rule Returns null for missing or invalid rates.
 * @rule Monthly/Weekly conversions mirror Edge Function logic.
 *
 * @param listing - Listing object with pricing fields.
 * @returns Structured host rates object.
 *
 * @throws Error if listing is null or undefined.
 *
 * @example
 * ```ts
 * // Nightly listing
 * extractHostRatesFromListing({
 *   'rental type': 'Nightly',
 *   nightly_rate_2_nights: 100,
 *   nightly_rate_3_nights: 95,
 * })
 * // => { rate2Nights: 100, rate3Nights: 95, ... }
 *
 * // Monthly listing
 * extractHostRatesFromListing({
 *   'rental type': 'Monthly',
 *   monthly_host_rate: 4800,
 * })
 * // => Synthetic nightly rates computed from monthly_host_rate
 * ```
 */
import type { ExtractedHostRates, ListingWithPricing } from './types.js';

/** Average days per month for monthly-to-weekly conversion (mirrors Edge Function) */
const AVG_DAYS_PER_MONTH = 30.4;

export function extractHostRatesFromListing(
  listing: ListingWithPricing
): ExtractedHostRates {
  if (!listing) {
    throw new Error('extractHostRatesFromListing: listing is required');
  }

  const rentalType = listing.rental_type || 'Nightly';

  // For Weekly rental type: Convert weekly_host_rate to synthetic nightly rates
  // Formula: weeklyRate / numberOfNights (mirrors Edge Function lines 105-118)
  if (rentalType === 'Weekly') {
    const weeklyRate = normalizeRate(listing.weekly_rate_paid_to_host);
    if (weeklyRate !== null) {
      return {
        rate1Night: roundToTwoDecimals(weeklyRate / 1),
        rate2Nights: roundToTwoDecimals(weeklyRate / 2),
        rate3Nights: roundToTwoDecimals(weeklyRate / 3),
        rate4Nights: roundToTwoDecimals(weeklyRate / 4),
        rate5Nights: roundToTwoDecimals(weeklyRate / 5),
        rate6Nights: roundToTwoDecimals(weeklyRate / 6),
        rate7Nights: roundToTwoDecimals(weeklyRate / 7),
        cleaningFee: normalizeRate(listing.cleaning_fee),
        damageDeposit: normalizeRate(listing.damage_deposit),
        priceOverride: normalizeRate(listing.price_override)
      };
    }
    // Fall through to return nulls if no weekly rate
  }

  // For Monthly rental type: Convert monthly_host_rate to synthetic nightly rates
  // Formula: (monthlyRate / avgDaysPerMonth) * 7 / numberOfNights (mirrors Edge Function lines 123-139)
  if (rentalType === 'Monthly') {
    const monthlyRate = normalizeRate(listing.monthly_rate_paid_to_host);
    if (monthlyRate !== null) {
      // Weekly equivalent = (monthlyRate / 30.4) * 7
      const weeklyEquivalent = (monthlyRate / AVG_DAYS_PER_MONTH) * 7;
      return {
        rate1Night: roundToTwoDecimals(weeklyEquivalent / 1),
        rate2Nights: roundToTwoDecimals(weeklyEquivalent / 2),
        rate3Nights: roundToTwoDecimals(weeklyEquivalent / 3),
        rate4Nights: roundToTwoDecimals(weeklyEquivalent / 4),
        rate5Nights: roundToTwoDecimals(weeklyEquivalent / 5),
        rate6Nights: roundToTwoDecimals(weeklyEquivalent / 6),
        rate7Nights: roundToTwoDecimals(weeklyEquivalent / 7),
        cleaningFee: normalizeRate(listing.cleaning_fee),
        damageDeposit: normalizeRate(listing.damage_deposit),
        priceOverride: normalizeRate(listing.price_override)
      };
    }
    // Fall through to return nulls if no monthly rate
  }

  // For Nightly rental type (or fallback): use individual nightly rates
  return {
    rate1Night: normalizeRate(listing.nightly_rate_for_1_night_stay),
    rate2Nights: normalizeRate(listing.nightly_rate_for_2_night_stay),
    rate3Nights: normalizeRate(listing.nightly_rate_for_3_night_stay),
    rate4Nights: normalizeRate(listing.nightly_rate_for_4_night_stay),
    rate5Nights: normalizeRate(listing.nightly_rate_for_5_night_stay),
    rate6Nights: normalizeRate(listing.nightly_rate_for_6_night_stay),
    rate7Nights: normalizeRate(listing.nightly_rate_for_7_night_stay),

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

/**
 * Round to two decimal places (mirrors Edge Function precision).
 * @param value - The value to round.
 * @returns Rounded value.
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
