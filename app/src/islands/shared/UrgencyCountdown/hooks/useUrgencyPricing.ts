/**
 * Pattern 2: Urgency Countdown - useUrgencyPricing Hook
 *
 * Production-ready hook for managing urgency pricing calculations
 * Auto-updates based on time remaining and urgency level
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UrgencyContext,
  UrgencyPricing,
  PriceAlert,
  DEFAULT_URGENCY_STEEPNESS,
  DEFAULT_MARKET_MULTIPLIER,
  DEFAULT_LOOKBACK_WINDOW,
} from '../types';
import {
  calculateUrgencyPricing,
  checkPriceAlerts,
  validateUrgencyContext,
} from '../utils/urgencyCalculations';
import {
  differenceInDays,
  differenceInHours,
} from '../utils/dateFormatting';

/**
 * Urgency pricing hook configuration
 */
export interface UseUrgencyPricingConfig {
  urgencySteepness?: number;
  marketDemandMultiplier?: number;
  lookbackWindow?: number;
  autoUpdate?: boolean;
  onPriceUpdate?: (pricing: UrgencyPricing) => void;
  onAlert?: (alert: PriceAlert) => void;
}

/**
 * Urgency pricing hook return value
 */
export interface UseUrgencyPricingReturn {
  pricing: UrgencyPricing | null;
  loading: boolean;
  error: Error | null;
  alerts: PriceAlert[];
  refresh: () => void;
  clearAlerts: () => void;
}

/**
 * useUrgencyPricing - Auto-updating urgency pricing calculations
 *
 * Features:
 * - Automatic price recalculation based on time
 * - Price alert notifications
 * - Error handling and validation
 * - Performance optimized
 *
 * @param targetDate - Check-in date
 * @param basePrice - Base nightly price
 * @param config - Configuration options
 * @returns Pricing state and controls
 */
export function useUrgencyPricing(
  targetDate: Date,
  basePrice: number,
  config: UseUrgencyPricingConfig = {}
): UseUrgencyPricingReturn {
  const {
    urgencySteepness = DEFAULT_URGENCY_STEEPNESS,
    marketDemandMultiplier = DEFAULT_MARKET_MULTIPLIER,
    lookbackWindow = DEFAULT_LOOKBACK_WINDOW,
    autoUpdate = true,
    onPriceUpdate,
    onAlert,
  } = config;

  const [pricing, setPricing] = useState<UrgencyPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousMultiplierRef = useRef<number | undefined>(undefined);

  /**
   * Calculate pricing
   */
  const calculatePricing = useCallback(() => {
    try {
      const currentDate = new Date();
      const daysUntilCheckIn = Math.max(
        0,
        differenceInDays(targetDate, currentDate)
      );
      const hoursUntilCheckIn = Math.max(
        0,
        differenceInHours(targetDate, currentDate)
      );

      const context: UrgencyContext = {
        targetDate,
        currentDate,
        daysUntilCheckIn,
        hoursUntilCheckIn,
        basePrice,
        urgencySteepness,
        marketDemandMultiplier,
        lookbackWindow,
      };

      // Validate context
      validateUrgencyContext(context);

      // Calculate pricing
      const newPricing = calculateUrgencyPricing(context);
      setPricing(newPricing);

      // Check for alerts
      const newAlerts = checkPriceAlerts(
        newPricing.currentPrice,
        basePrice,
        previousMultiplierRef.current
      );

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts]);
        newAlerts.forEach((alert) => onAlert?.(alert));
      }

      // Update previous multiplier
      previousMultiplierRef.current = newPricing.currentMultiplier;

      // Call update callback
      onPriceUpdate?.(newPricing);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('[useUrgencyPricing] Calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    targetDate,
    basePrice,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow,
    onPriceUpdate,
    onAlert,
  ]);

  /**
   * Refresh pricing calculation
   */
  const refresh = useCallback(() => {
    setLoading(true);
    calculatePricing();
  }, [calculatePricing]);

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Setup auto-update interval
   */
  useEffect(() => {
    if (!autoUpdate) {
      return;
    }

    // Initial calculation
    calculatePricing();

    // Determine update interval based on current pricing
    const updateInterval = pricing?.nextUpdateIn || 60000; // Default 1 minute

    // Setup interval
    intervalRef.current = setInterval(() => {
      calculatePricing();
    }, updateInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoUpdate, calculatePricing, pricing?.nextUpdateIn]);

  /**
   * Recalculate when dependencies change
   */
  useEffect(() => {
    calculatePricing();
  }, [
    targetDate,
    basePrice,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow,
  ]);

  return {
    pricing,
    loading,
    error,
    alerts,
    refresh,
    clearAlerts,
  };
}

/**
 * useUrgencyPricingWithCache - Cached version for performance
 *
 * Caches pricing calculations to avoid unnecessary recalculations
 *
 * @param targetDate - Check-in date
 * @param basePrice - Base nightly price
 * @param config - Configuration options
 * @returns Pricing state and controls
 */
export function useUrgencyPricingWithCache(
  targetDate: Date,
  basePrice: number,
  config: UseUrgencyPricingConfig = {}
): UseUrgencyPricingReturn {
  const cacheKeyRef = useRef<string>('');

  // Generate cache key
  const currentCacheKey = `${targetDate.getTime()}-${basePrice}-${config.urgencySteepness}-${config.marketDemandMultiplier}`;

  // Only recalculate if key changed
  const shouldRecalculate = cacheKeyRef.current !== currentCacheKey;

  useEffect(() => {
    cacheKeyRef.current = currentCacheKey;
  }, [currentCacheKey]);

  return useUrgencyPricing(targetDate, basePrice, {
    ...config,
    autoUpdate: config.autoUpdate !== false && shouldRecalculate,
  });
}
