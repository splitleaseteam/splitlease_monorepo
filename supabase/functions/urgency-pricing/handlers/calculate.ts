/**
 * Calculate Handler
 *
 * Single pricing calculation with cache integration
 * Main endpoint for urgency pricing calculations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CalculatePayload,
  PricingCalculationResponse,
  UrgencyContext,
  URGENCY_CONSTANTS,
} from '../types/urgency.types.ts';
import {
  calculateUrgencyPricing,
} from '../core/urgencyCalculator.ts';
import {
  calculateMarketDemandMultiplier,
  createUrbanConfig,
} from '../core/marketDemandCalculator.ts';
import {
  calculateDaysOut,
  calculateHoursOut,
  parseISODate,
} from '../core/dateUtils.ts';
import {
  getCachedPricing,
  storePricing,
  generateCacheKey,
} from '../cache/pricingCache.ts';
import {
  loadMarketDemandConfig,
  loadEventMultipliers,
} from '../config/config.ts';
import { ValidationError } from 'shared/errors.ts';

/**
 * Handle calculate action
 *
 * @param payload - Calculate payload
 * @param _user - Authenticated user (not required for public action)
 * @param supabase - Supabase client
 * @returns Pricing calculation response
 */
export const handleCalculate = async (
  payload: CalculatePayload,
  _user: any,
  supabase: SupabaseClient
): Promise<PricingCalculationResponse> => {
  const startTime = Date.now();

  // Validate payload
  if (!payload.targetDate) {
    throw new ValidationError('targetDate is required');
  }

  if (!payload.basePrice || payload.basePrice <= 0) {
    throw new ValidationError('basePrice must be positive');
  }

  // Parse dates
  const targetDate = parseISODate(payload.targetDate);
  const currentDate = new Date();

  // Calculate time metrics
  const daysOut = calculateDaysOut(targetDate, currentDate);
  const hoursOut = calculateHoursOut(targetDate, currentDate);

  // Get parameters with defaults
  const steepness = payload.urgencySteepness ?? URGENCY_CONSTANTS.DEFAULT_STEEPNESS;
  const basePrice = payload.basePrice;
  const includeProjections = payload.includeProjections ?? true;

  // Calculate market demand multiplier
  const marketConfig = await loadMarketDemandConfig(supabase, 'urban');
  const eventMultipliers = await loadEventMultipliers(supabase, targetDate, targetDate);
  const marketMultiplier = payload.marketDemandMultiplier ?? calculateMarketDemandMultiplier(
    targetDate,
    marketConfig,
    eventMultipliers
  );

  // Generate cache key
  const cacheKey = generateCacheKey(targetDate, basePrice, steepness, marketMultiplier);

  // Check cache
  const cached = await getCachedPricing(supabase, cacheKey);
  if (cached) {
    const calculationTimeMs = Date.now() - startTime;
    return {
      success: true,
      data: cached,
      metadata: {
        calculatedAt: cached.calculatedAt,
        cacheHit: true,
        calculationTimeMs,
      },
    };
  }

  // Calculate urgency pricing
  const context: UrgencyContext = {
    targetDate,
    currentDate,
    daysUntilCheckIn: daysOut,
    hoursUntilCheckIn: hoursOut,
    basePrice,
    urgencySteepness: steepness,
    marketDemandMultiplier: marketMultiplier,
    lookbackWindow: URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
  };

  const pricing = calculateUrgencyPricing(context);
  pricing.cacheKey = cacheKey;

  // Store in cache
  await storePricing(supabase, pricing, cacheKey);

  const calculationTimeMs = Date.now() - startTime;

  return {
    success: true,
    data: pricing,
    metadata: {
      calculatedAt: pricing.calculatedAt,
      cacheHit: false,
      calculationTimeMs,
    },
  };
};
