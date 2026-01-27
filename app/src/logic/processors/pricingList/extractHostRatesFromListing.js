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
 * @param {object} listing - Listing object with pricing fields.
 * @returns {object} Structured host rates object.
 *
 * @throws {Error} If listing is null or undefined.
 *
 * @example
 * extractHostRatesFromListing({
 *   '💰Nightly Host Rate for 2 nights': 100,
 *   '💰Nightly Host Rate for 3 nights': 95,
 *   '💰Nightly Host Rate for 4 nights': 90,
 *   '💰Nightly Host Rate for 5 nights': 85,
 *   '💰Nightly Host Rate for 6 nights': 80,
 *   '💰Nightly Host Rate for 7 nights': 75
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
 */
export function extractHostRatesFromListing(listing) {
  if (!listing) {
    throw new Error('extractHostRatesFromListing: listing is required');
  }

  return {
    rate1Night: normalizeRate(listing['💰Nightly Host Rate for 1 night']),
    rate2Nights: normalizeRate(listing['💰Nightly Host Rate for 2 nights']),
    rate3Nights: normalizeRate(listing['💰Nightly Host Rate for 3 nights']),
    rate4Nights: normalizeRate(listing['💰Nightly Host Rate for 4 nights']),
    rate5Nights: normalizeRate(listing['💰Nightly Host Rate for 5 nights']),
    rate6Nights: normalizeRate(listing['💰Nightly Host Rate for 6 nights']),
    rate7Nights: normalizeRate(listing['💰Nightly Host Rate for 7 nights']),

    // Also extract related pricing fields
    cleaningFee: normalizeRate(listing['💰Cleaning Cost / Maintenance Fee']),
    damageDeposit: normalizeRate(listing['💰Damage Deposit']),
    priceOverride: normalizeRate(listing['💰Price Override'])
  };
}

/**
 * Normalize a rate value to number or null.
 * @param {*} value - The value to normalize.
 * @returns {number|null} Normalized rate.
 */
function normalizeRate(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}
