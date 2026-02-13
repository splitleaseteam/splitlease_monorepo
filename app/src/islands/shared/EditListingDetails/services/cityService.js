/**
 * City Service - Lookup city IDs from reference table
 */

import { supabase } from '../../../../lib/supabase';

/**
 * Look up city ID by city name from reference table
 * @param {string} cityName - The city name (e.g., "New York", "Jersey City")
 * @returns {Promise<string|null>} City _id or null if not found
 */
export async function getCityIdByName(cityName) {
  if (!cityName) return null;

  const cleanName = String(cityName).trim();
  if (!cleanName) return null;

  try {
    const { data, error } = await supabase
      .schema('reference_table')
      .from('zat_location')
      .select('id, city_name')
      .eq('city_name', cleanName)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('[CityService] No city found for name:', cleanName);
      return null;
    }

    console.log('[CityService] Found city ID:', data.id, 'for name:', cleanName);
    return data.id;
  } catch (err) {
    console.error('[CityService] Error looking up city:', err);
    return null;
  }
}
