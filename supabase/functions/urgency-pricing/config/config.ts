/**
 * Configuration Management
 *
 * Load urgency pricing configuration from database
 *
 * FP PRINCIPLES:
 * - Pure functions for config transformation
 * - Side effects (database fetch) clearly marked
 * - Fail fast on missing config
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MarketDemandConfig,
  EventMultiplier,
  DEFAULT_DAY_MULTIPLIERS,
  DEFAULT_SEASONAL_MULTIPLIERS,
  URGENCY_CONSTANTS,
} from '../types/urgency.types.ts';

/**
 * Load urgency pricing configuration from database
 *
 * SIDE EFFECT: Database query
 *
 * @param supabase - Supabase client
 * @returns Urgency configuration
 */
export const loadUrgencyConfig = async (
  supabase: SupabaseClient
): Promise<{
  steepness: number;
  lookbackWindow: number;
}> => {
  const { data, error } = await supabase
    .from('urgency_pricing_config')
    .select('config_key, config_value')
    .eq('is_active', true)
    .in('config_key', ['default_urgency_steepness', 'default_lookback_window']);

  if (error) {
    console.error('[urgency-pricing] Config load error:', error);
    // Fail fast - use hardcoded defaults
    return {
      steepness: URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
      lookbackWindow: URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
    };
  }

  const config: Record<string, any> = {};
  for (const row of data || []) {
    config[row.config_key] = parseFloat(row.config_value);
  }

  return {
    steepness: config.default_urgency_steepness ?? URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
    lookbackWindow: config.default_lookback_window ?? URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
  };
};

/**
 * Load market demand configuration from database
 *
 * SIDE EFFECT: Database query
 *
 * @param supabase - Supabase client
 * @param location - Location type ('urban' or 'resort')
 * @returns Market demand configuration
 */
export const loadMarketDemandConfig = async (
  supabase: SupabaseClient,
  location: 'urban' | 'resort' = 'urban'
): Promise<MarketDemandConfig> => {
  const configKey = location === 'urban'
    ? 'day_of_week_multipliers_urban'
    : 'day_of_week_multipliers_resort';

  const { data, error } = await supabase
    .from('urgency_pricing_config')
    .select('config_key, config_value')
    .eq('is_active', true)
    .in('config_key', [configKey, 'seasonal_multipliers']);

  if (error) {
    console.error('[urgency-pricing] Market demand config load error:', error);
    // Fail fast - use hardcoded defaults
    return {
      baseMultiplier: 1.0,
      dayOfWeekMultipliers: DEFAULT_DAY_MULTIPLIERS,
      seasonalMultipliers: DEFAULT_SEASONAL_MULTIPLIERS,
    };
  }

  const config: Record<string, any> = {};
  for (const row of data || []) {
    config[row.config_key] = JSON.parse(row.config_value);
  }

  return {
    baseMultiplier: 1.0,
    dayOfWeekMultipliers: config[configKey] ?? DEFAULT_DAY_MULTIPLIERS,
    seasonalMultipliers: config.seasonal_multipliers ?? DEFAULT_SEASONAL_MULTIPLIERS,
  };
};

/**
 * Load event multipliers for a date range
 *
 * SIDE EFFECT: Database query
 *
 * @param supabase - Supabase client
 * @param startDate - Start date
 * @param endDate - End date
 * @param city - City code (optional)
 * @returns Active event multipliers
 */
export const loadEventMultipliers = async (
  supabase: SupabaseClient,
  startDate: Date,
  endDate: Date,
  city?: string
): Promise<EventMultiplier[]> => {
  let query = supabase
    .from('event_multipliers')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', endDate.toISOString())
    .gte('end_date', startDate.toISOString());

  if (city) {
    query = query.contains('cities', [city]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[urgency-pricing] Event multipliers load error:', error);
    return [];
  }

  return (data || []).map(row => ({
    eventId: row.event_id,
    eventName: row.event_name,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    multiplier: parseFloat(row.multiplier),
    cities: row.cities,
  }));
};
