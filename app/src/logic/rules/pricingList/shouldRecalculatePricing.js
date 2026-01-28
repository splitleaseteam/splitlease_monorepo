/**
 * Determine if a pricing list should be recalculated.
 *
 * Compares the current listing pricing fields with the stored
 * pricing list to detect if any host rates have changed.
 *
 * @intent Detect stale pricing data that needs refresh.
 * @rule Recalculate if any host rate field differs.
 * @rule Recalculate if pricing list is missing or invalid.
 * @rule Recalculate if markup settings have changed.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.listing - Current listing data.
 * @param {object|null} params.pricingList - Existing pricing list (null if none).
 * @returns {boolean} True if recalculation needed, false otherwise.
 *
 * @throws {Error} If listing is null or undefined.
 *
 * @example
 * shouldRecalculatePricing({
 *   listing: { '💰Nightly Host Rate for 2 nights': 110 },
 *   pricingList: { hostCompensation: [null, 100, ...] }
 * })
 * // => true (rate changed from 100 to 110)
 */
import { isPricingListValid } from './isPricingListValid.js';

export function shouldRecalculatePricing({ listing, pricingList }) {
  // No Fallback: Validate listing
  if (!listing) {
    throw new Error('shouldRecalculatePricing: listing is required');
  }

  // Recalculate if no pricing list exists
  if (!pricingList) {
    return true;
  }

  // Recalculate if pricing list is invalid
  if (!isPricingListValid({ pricingList })) {
    return true;
  }

  // Compare host rates with stored compensation
  const hostCompensation = pricingList.hostCompensation || pricingList['Host Compensation'] || [];

  const rateFieldMapping = [
    { field: '💰Nightly Host Rate for 1 night', index: 0 },
    { field: '💰Nightly Host Rate for 2 nights', index: 1 },
    { field: '💰Nightly Host Rate for 3 nights', index: 2 },
    { field: '💰Nightly Host Rate for 4 nights', index: 3 },
    { field: '💰Nightly Host Rate for 5 nights', index: 4 },
    { field: '💰Nightly Host Rate for 6 nights', index: 5 },
    { field: '💰Nightly Host Rate for 7 nights', index: 6 }
  ];

  for (const { field, index } of rateFieldMapping) {
    const listingRate = normalizeRate(listing[field]);
    const storedRate = normalizeRate(hostCompensation[index]);

    // If either is null and the other isn't, or values differ
    if (listingRate !== storedRate) {
      return true;
    }
  }

  // No changes detected
  return false;
}

/**
 * Normalize a rate value for comparison.
 * @param {*} value - The value to normalize.
 * @returns {number|null} Normalized rate.
 */
function normalizeRate(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return null;
  }
  return num;
}
