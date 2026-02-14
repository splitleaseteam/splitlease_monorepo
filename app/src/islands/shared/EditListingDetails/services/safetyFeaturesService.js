/**
 * Safety Features Service
 * Fetches common safety features from Supabase where pre-set is true
 */

import { supabase } from '../../../../lib/supabase.js';

/**
 * Fetches common safety features from Supabase where pre-set is true
 * @returns {Promise<string[]>} Array of safety feature names
 */
export async function getCommonSafetyFeatures() {
  try {
    console.log('[safetyFeaturesService] Fetching common safety features...');

    const { data, error } = await supabase
      .schema('reference_table').from('zat_features_safetyfeature')
      .select('name, is_preset')
      .eq('is_preset', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[safetyFeaturesService] Error fetching common safety features:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[safetyFeaturesService] No common safety features found');
      return [];
    }

    // Extract just the names
    const names = data.map((feature) => feature.name);
    console.log('[safetyFeaturesService] Fetched common safety features:', names);
    return names;
  } catch (err) {
    console.error('[safetyFeaturesService] Failed to fetch common safety features:', err);
    throw err;
  }
}
