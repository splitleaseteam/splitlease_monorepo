/**
 * Geo Lookup Utilities
 *
 * Geocoding and location lookup functions for mapping zip codes
 * to borough and neighborhood IDs from reference tables.
 */

import { supabase } from '../supabase.js';
import { logger } from '../logger.js';

/**
 * Look up borough ID by zip code from reference table
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<string|null>} Borough id or null if not found
 */
export async function getBoroughIdByZipCode(zipCode) {
  if (!zipCode) return null;

  const cleanZip = String(zipCode).trim().substring(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return null;

  try {
    const { data, error } = await supabase
      .schema('reference_table').from('zat_geo_borough_toplevel')
      .select('id, display_borough')
      .contains('zip_codes', [cleanZip])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.debug('[ListingService] No borough found for zip:', cleanZip);
      return null;
    }

    logger.debug('[ListingService] Found borough:', data.display_borough, 'for zip:', cleanZip);
    return data.id;
  } catch (err) {
    logger.error('[ListingService] Error looking up borough:', err);
    return null;
  }
}

/**
 * Look up hood (neighborhood) ID by zip code from reference table
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<string|null>} Hood id or null if not found
 */
export async function getHoodIdByZipCode(zipCode) {
  if (!zipCode) return null;

  const cleanZip = String(zipCode).trim().substring(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return null;

  try {
    const { data, error } = await supabase
      .schema('reference_table').from('zat_geo_hood_mediumlevel')
      .select('id, display')
      .contains('zips', [cleanZip])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.debug('[ListingService] No hood found for zip:', cleanZip);
      return null;
    }

    logger.debug('[ListingService] Found hood:', data.display, 'for zip:', cleanZip);
    return data.id;
  } catch (err) {
    logger.error('[ListingService] Error looking up hood:', err);
    return null;
  }
}

/**
 * Look up both borough and hood IDs by zip code
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<{boroughId: string|null, hoodId: string|null}>}
 */
export async function getGeoIdsByZipCode(zipCode) {
  logger.debug('[ListingService] Looking up geo IDs for zip:', zipCode);

  const [boroughId, hoodId] = await Promise.all([
    getBoroughIdByZipCode(zipCode),
    getHoodIdByZipCode(zipCode)
  ]);

  return { boroughId, hoodId };
}
