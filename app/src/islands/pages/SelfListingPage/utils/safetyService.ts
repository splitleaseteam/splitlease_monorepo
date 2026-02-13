/**
 * Safety Features Service
 * Fetches common safety features from Supabase where pre-set is true
 */

import { supabase } from '../../../../lib/supabase.js';

export interface SafetyFeature {
  id: string;
  name: string;
  icon?: string;
  is_preset?: boolean;
}

/**
 * Fetches common safety features from Supabase where pre-set is true
 * @returns Promise with array of safety feature names
 */
export async function getCommonSafetyFeatures(): Promise<string[]> {
  try {
    console.log('[safetyService] Fetching common safety features...');

    const { data, error } = await supabase
      .from('zat_features_safetyfeature')
      .select('name, is_preset')
      .eq('is_preset', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[safetyService] Error fetching common safety features:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[safetyService] No common safety features found');
      return [];
    }

    // Extract just the names
    const names = data.map((feature: { name: string }) => feature.name);
    console.log('[safetyService] Fetched common safety features:', names);
    return names;
  } catch (err) {
    console.error('[safetyService] Unexpected error:', err);
    return [];
  }
}
