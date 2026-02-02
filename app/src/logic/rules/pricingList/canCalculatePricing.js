/**
 * Check if a listing has required fields for pricing calculation.
 *
 * Validates that the listing has at least one host rate defined
 * so pricing arrays can be computed.
 *
 * @intent Gate pricing calculation to listings with valid pricing data.
 * @rule At least one nightly host rate must be defined (2-7 nights).
 * @rule Rate for 1 night is optional (rarely used).
 *
 * @param {object} params - Named parameters.
 * @param {object} params.listing - The listing object to check.
 * @returns {boolean} True if pricing can be calculated, false otherwise.
 *
 * @throws {Error} If listing is null or undefined.
 *
 * @example
 * canCalculatePricing({
 *   listing: {
 *     'nightly_rate_2_nights': 100,
 *     'nightly_rate_3_nights': 95
 *   }
 * })
 * // => true
 *
 * canCalculatePricing({
 *   listing: { Name: 'Empty Listing' }
 * })
 * // => false
 */
export function canCalculatePricing({ listing }) {
  // No Fallback: Validate listing exists
  if (!listing) {
    throw new Error('canCalculatePricing: listing is required');
  }

  // Check for any valid host rate
  const rateFields = [
    'nightly_rate_2_nights',
    'nightly_rate_3_nights',
    'nightly_rate_4_nights',
    'nightly_rate_5_nights',
    'nightly_rate_6_nights',
    'nightly_rate_7_nights'
  ];

  for (const field of rateFields) {
    const value = listing[field];
    if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value) && value > 0) {
      return true;
    }
  }

  return false;
}
