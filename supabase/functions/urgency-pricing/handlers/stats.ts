/**
 * Stats Handler
 *
 * Get cache and system statistics
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StatsResponse } from '../types/urgency.types.ts';
import { getCacheStats } from '../cache/pricingCache.ts';

/**
 * Handle stats action
 *
 * @param _payload - No payload required
 * @param _user - Authenticated user
 * @param supabase - Supabase client
 * @returns Stats response
 */
export const handleStats = async (
  _payload: any,
  _user: any,
  supabase: SupabaseClient
): Promise<StatsResponse> => {
  const cacheStats = await getCacheStats(supabase);
  const total = Object.values(cacheStats).reduce((sum, count) => sum + count, 0);

  return {
    success: true,
    data: {
      cacheStats: {
        total,
        byLevel: cacheStats,
      },
    },
  };
};
