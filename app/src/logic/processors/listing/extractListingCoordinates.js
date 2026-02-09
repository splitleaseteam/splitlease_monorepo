import { isWithinNYCBounds } from '../../../lib/constants.js'

/**
 * Extract coordinates from listing's JSONB location fields.
 * Priority: map_pin_offset_address_json (privacy) → address_with_lat_lng_json (main).
 *
 * @intent Extract lat/lng coordinates from listing location data with privacy prioritization.
 * @rule NO FALLBACK: Returns null if no valid coordinates found (listings without coordinates must be filtered out).
 * @rule Priority 1: Use map_pin_offset_address_json for privacy/pin separation.
 * @rule Priority 2: Use address_with_lat_lng_json as fallback.
 * @rule BOUNDS CHECK: Coordinates must fall within NYC metro area bounds (rejects (0,0) "Null Island" etc.)
 *
 * @param {object} params - Named parameters.
 * @param {object|string|null} params.locationSlightlyDifferent - map_pin_offset_address_json JSONB field for privacy-adjusted address.
 * @param {object|string|null} params.locationAddress - address_with_lat_lng_json JSONB field for main address.
 * @param {string} params.listingId - Listing ID for error logging.
 * @returns {object|null} Coordinates object { lat, lng, source } or null if invalid.
 *
 * @throws {Error} If listingId is not provided.
 *
 * @example
 * const coords = extractListingCoordinates({
 *   locationSlightlyDifferent: { lat: 40.7128, lng: -74.0060 },
 *   locationAddress: { lat: 40.7127, lng: -74.0061 },
 *   listingId: 'listing_123'
 * })
 * // => { lat: 40.7128, lng: -74.0060, source: 'slightly-different-address' }
 */
export function extractListingCoordinates({
  locationSlightlyDifferent,
  locationAddress,
  listingId
}) {
  // No Fallback: Validate listing ID
  if (!listingId || typeof listingId !== 'string') {
    throw new Error(
      `extractListingCoordinates: listingId is required and must be a string`
    )
  }

  // Parse JSONB fields if they're strings
  let parsedSlightlyDifferent = locationSlightlyDifferent
  let parsedAddress = locationAddress

  if (typeof locationSlightlyDifferent === 'string') {
    try {
      parsedSlightlyDifferent = JSON.parse(locationSlightlyDifferent)
    } catch (error) {
      console.error(
        '❌ extractListingCoordinates: Failed to parse map_pin_offset_address_json:',
        {
          listingId,
          rawValue: locationSlightlyDifferent,
          error: error.message
        }
      )
      parsedSlightlyDifferent = null
    }
  }

  if (typeof locationAddress === 'string') {
    try {
      parsedAddress = JSON.parse(locationAddress)
    } catch (error) {
      console.error('❌ extractListingCoordinates: Failed to parse address_with_lat_lng_json:', {
        listingId,
        rawValue: locationAddress,
        error: error.message
      })
      parsedAddress = null
    }
  }

  // Priority 1: Check slightly different address (with NYC bounds validation)
  if (
    parsedSlightlyDifferent &&
    isWithinNYCBounds(parsedSlightlyDifferent.lat, parsedSlightlyDifferent.lng)
  ) {
    return {
      lat: parsedSlightlyDifferent.lat,
      lng: parsedSlightlyDifferent.lng,
      source: 'slightly-different-address'
    }
  }

  // Priority 2: Check main address (with NYC bounds validation)
  if (
    parsedAddress &&
    isWithinNYCBounds(parsedAddress.lat, parsedAddress.lng)
  ) {
    return {
      lat: parsedAddress.lat,
      lng: parsedAddress.lng,
      source: 'main-address'
    }
  }

  // No Fallback: Return null if no valid coordinates found
  console.warn('⚠️ extractListingCoordinates: No valid coordinates found for listing:', {
    listingId,
    hasSlightlyDifferent: !!parsedSlightlyDifferent,
    hasMainAddress: !!parsedAddress
  })

  return null
}
