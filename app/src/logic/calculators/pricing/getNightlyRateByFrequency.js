import { PRICING_FIELDS, NIGHTLY_RATE_BY_COUNT } from '../../../data/fieldMappings';

/**
 * Get nightly price based on number of nights selected.
 * Matches Bubble logic for price field selection.
 *
 * @intent Retrieve the appropriate nightly rate tier based on frequency.
 * @rule Price override takes precedence over frequency-based rates.
 * @rule Frequency-specific rates (2, 3, 4, 5, 7 nights) map to specific price fields.
 * @rule No fallback to default rate - throws if no valid rate found.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.listing - Listing object with price fields.
 * @param {number} params.nightsSelected - Number of nights per week (2-7).
 * @returns {number} Nightly price for the selected frequency.
 *
 * @throws {Error} If listing is missing or invalid.
 * @throws {Error} If nightsSelected is not a number or out of range.
 * @throws {Error} If no valid price found for the selected nights.
 *
 * @example
 * const rate = getNightlyRateByFrequency({
 *   listing: { nightly_rate_4_nights: 100 },
 *   nightsSelected: 4
 * })
 * // => 100
 */
export function getNightlyRateByFrequency({ listing, nightsSelected }) {
  // No Fallback: Validate listing exists
  if (!listing || typeof listing !== 'object') {
    throw new Error(
      'getNightlyRateByFrequency: listing must be a valid object'
    )
  }

  // No Fallback: Validate nightsSelected
  if (typeof nightsSelected !== 'number' || isNaN(nightsSelected)) {
    throw new Error(
      `getNightlyRateByFrequency: nightsSelected must be a number, got ${typeof nightsSelected}`
    )
  }

  if (nightsSelected < 2 || nightsSelected > 7) {
    throw new Error(
      `getNightlyRateByFrequency: nightsSelected must be between 2-7, got ${nightsSelected}`
    )
  }

  // Price override takes precedence
  if (listing[PRICING_FIELDS.PRICE_OVERRIDE]) {
    const overridePrice = Number(listing[PRICING_FIELDS.PRICE_OVERRIDE])
    if (isNaN(overridePrice) || overridePrice < 0) {
      throw new Error(
        `getNightlyRateByFrequency: Invalid price override value ${listing[PRICING_FIELDS.PRICE_OVERRIDE]}`
      )
    }
    return overridePrice
  }

  // Use centralized field mapping
  const fieldName = NIGHTLY_RATE_BY_COUNT[nightsSelected]

  // No Fallback: Exact match required
  if (!fieldName || !listing[fieldName]) {
    throw new Error(
      `getNightlyRateByFrequency: No price found for ${nightsSelected} nights in listing`
    )
  }

  const rate = Number(listing[fieldName])

  if (isNaN(rate) || rate < 0) {
    throw new Error(
      `getNightlyRateByFrequency: Invalid rate value ${listing[fieldName]} for ${nightsSelected} nights`
    )
  }

  return rate
}
