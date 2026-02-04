/**
 * Pricing Cache Layer (Database-backed for Deno runtime)
 *
 * Replaces Redis caching with PostgreSQL-based cache
 * Uses urgency_pricing_cache table for persistence
 *
 * FP PRINCIPLES:
 * - Pure functions for serialization/deserialization
 * - Side effects (database operations) clearly marked
 * - Fail fast (no fallback logic)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  UrgencyPricing,
  CACHE_TTL,
  UrgencyLevel,
} from '../types/urgency.types.ts';

/**
 * Generate cache key for pricing request
 *
 * Pure function - same inputs always generate same key
 *
 * @param targetDate - Target date
 * @param basePrice - Base price
 * @param steepness - Urgency steepness
 * @param marketMultiplier - Market demand multiplier
 * @returns Cache key
 */
export const generateCacheKey = (
  targetDate: Date,
  basePrice: number,
  steepness: number,
  marketMultiplier: number
): string => {
  const dateKey = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${dateKey}:${basePrice}:${steepness}:${marketMultiplier.toFixed(2)}`;
};

/**
 * Get cached pricing from database
 *
 * SIDE EFFECT: Database query
 *
 * @param supabase - Supabase client
 * @param cacheKey - Cache key
 * @returns Cached pricing or null if not found/expired
 */
export const getCachedPricing = async (
  supabase: SupabaseClient,
  cacheKey: string
): Promise<UrgencyPricing | null> => {
  const { data, error } = await supabase
    .from('urgency_pricing_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return deserializePricing(data);
};

/**
 * Store pricing in database cache
 *
 * SIDE EFFECT: Database insert
 *
 * @param supabase - Supabase client
 * @param pricing - Urgency pricing
 * @param cacheKey - Cache key
 */
export const storePricing = async (
  supabase: SupabaseClient,
  pricing: UrgencyPricing,
  cacheKey: string
): Promise<void> => {
  const ttl = CACHE_TTL[pricing.urgencyLevel];
  const expiresAt = new Date(Date.now() + ttl * 1000);

  const { error } = await supabase.from('urgency_pricing_cache').insert({
    cache_key: cacheKey,
    target_date: pricing.targetDate.toISOString(),
    calculated_at: pricing.calculatedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    days_until_checkin: pricing.daysUntilCheckIn,
    hours_until_checkin: pricing.hoursUntilCheckIn,
    current_price: pricing.currentPrice,
    current_multiplier: pricing.currentMultiplier,
    base_price: pricing.basePrice,
    market_adjusted_base: pricing.marketAdjustedBase,
    urgency_premium: pricing.urgencyPremium,
    urgency_level: pricing.urgencyLevel,
    increase_rate_per_day: pricing.increaseRatePerDay,
    increase_rate_per_hour: pricing.increaseRatePerHour,
    peak_price: pricing.peakPrice,
    urgency_steepness: pricing.steepness,
    market_demand_multiplier: pricing.marketMultiplier,
    projections: JSON.stringify(pricing.projections),
  });

  if (error) {
    console.error('[urgency-pricing] Cache store error:', error);
    throw new Error(`Failed to store pricing in cache: ${error.message}`);
  }
};

/**
 * Deserialize pricing from database row
 *
 * Pure function - converts database format to UrgencyPricing
 *
 * @param row - Database row
 * @returns UrgencyPricing object
 */
export const deserializePricing = (row: any): UrgencyPricing => {
  return {
    currentPrice: parseFloat(row.current_price),
    currentMultiplier: parseFloat(row.current_multiplier),
    basePrice: parseFloat(row.base_price),
    marketAdjustedBase: parseFloat(row.market_adjusted_base),
    urgencyPremium: parseFloat(row.urgency_premium),
    urgencyLevel: row.urgency_level as UrgencyLevel,
    daysUntilCheckIn: row.days_until_checkin,
    hoursUntilCheckIn: row.hours_until_checkin,
    projections: row.projections ? JSON.parse(row.projections).map((p: any) => ({
      ...p,
      timestamp: new Date(p.timestamp),
    })) : [],
    increaseRatePerDay: parseFloat(row.increase_rate_per_day),
    increaseRatePerHour: parseFloat(row.increase_rate_per_hour),
    peakPrice: parseFloat(row.peak_price),
    calculatedAt: new Date(row.calculated_at),
    expiresAt: new Date(row.expires_at),
    targetDate: new Date(row.target_date),
    steepness: parseFloat(row.urgency_steepness),
    marketMultiplier: parseFloat(row.market_demand_multiplier),
    cacheKey: row.cache_key,
  };
};

/**
 * Get cache statistics
 *
 * SIDE EFFECT: Database query
 *
 * @param supabase - Supabase client
 * @returns Cache statistics by urgency level
 */
export const getCacheStats = async (
  supabase: SupabaseClient
): Promise<Record<UrgencyLevel, number>> => {
  const { data, error } = await supabase
    .from('urgency_pricing_cache')
    .select('urgency_level')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[urgency-pricing] Cache stats error:', error);
    return {
      [UrgencyLevel.CRITICAL]: 0,
      [UrgencyLevel.HIGH]: 0,
      [UrgencyLevel.MEDIUM]: 0,
      [UrgencyLevel.LOW]: 0,
    };
  }

  const stats = {
    [UrgencyLevel.CRITICAL]: 0,
    [UrgencyLevel.HIGH]: 0,
    [UrgencyLevel.MEDIUM]: 0,
    [UrgencyLevel.LOW]: 0,
  };

  for (const row of data) {
    stats[row.urgency_level as UrgencyLevel]++;
  }

  return stats;
};

/**
 * Invalidate cache entries for a specific date range
 *
 * SIDE EFFECT: Database delete
 *
 * @param supabase - Supabase client
 * @param startDate - Start date
 * @param endDate - End date
 */
export const invalidateCacheForDateRange = async (
  supabase: SupabaseClient,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  const { error } = await supabase
    .from('urgency_pricing_cache')
    .delete()
    .gte('target_date', startDate.toISOString())
    .lte('target_date', endDate.toISOString());

  if (error) {
    console.error('[urgency-pricing] Cache invalidation error:', error);
    throw new Error(`Failed to invalidate cache: ${error.message}`);
  }
};
