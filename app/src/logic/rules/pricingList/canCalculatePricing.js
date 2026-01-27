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
 *     '💰Nightly Host Rate for 2 nights': 100,
 *     '💰Nightly Host Rate for 3 nights': 95
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
    '💰Nightly Host Rate for 2 nights',
    '💰Nightly Host Rate for 3 nights',
    '💰Nightly Host Rate for 4 nights',
    '💰Nightly Host Rate for 5 nights',
    '💰Nightly Host Rate for 6 nights',
    '💰Nightly Host Rate for 7 nights'
  ];

  for (const field of rateFields) {
    const value = listing[field];
    if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value) && value > 0) {
      return true;
    }
  }

  return false;
}
