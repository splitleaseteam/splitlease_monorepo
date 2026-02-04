/**
 * Pattern 2: Urgency Countdown - usePriceProjections Hook
 *
 * Production-ready hook for managing price projection visualizations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UrgencyContext,
  PriceProjection,
  PriceProgressionData,
  DEFAULT_URGENCY_STEEPNESS,
  DEFAULT_MARKET_MULTIPLIER,
  DEFAULT_LOOKBACK_WINDOW,
} from '../types';
import { generatePriceProgression } from '../utils/urgencyCalculations';
import {
  differenceInDays,
  differenceInHours,
  formatProjectionTimeline,
} from '../utils/dateFormatting';

/**
 * Price projections hook configuration
 */
export interface UsePriceProjectionsConfig {
  forecastDays?: number;
  urgencySteepness?: number;
  marketDemandMultiplier?: number;
  lookbackWindow?: number;
  includeChartData?: boolean;
}

/**
 * Price projections hook return value
 */
export interface UsePriceProjectionsReturn {
  projections: PriceProjection[];
  chartData: PriceProgressionData | null;
  maxPrice: number;
  minPrice: number;
  averageIncrease: number;
  totalIncrease: number;
  refresh: () => void;
}

/**
 * usePriceProjections - Generate future price projections
 *
 * Features:
 * - Multiple future price points
 * - Chart-ready data format
 * - Statistical analysis (min, max, average)
 * - Performance optimized with memoization
 *
 * @param targetDate - Check-in date
 * @param basePrice - Base nightly price
 * @param config - Configuration options
 * @returns Projections and analysis
 */
export function usePriceProjections(
  targetDate: Date,
  basePrice: number,
  config: UsePriceProjectionsConfig = {}
): UsePriceProjectionsReturn {
  const {
    forecastDays = 7,
    urgencySteepness = DEFAULT_URGENCY_STEEPNESS,
    marketDemandMultiplier = DEFAULT_MARKET_MULTIPLIER,
    lookbackWindow = DEFAULT_LOOKBACK_WINDOW,
    includeChartData = true,
  } = config;

  const [projections, setProjections] = useState<PriceProjection[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Calculate projections
   */
  const calculateProjections = useCallback(() => {
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

    const newProjections = generatePriceProgression(context, forecastDays);
    setProjections(newProjections);
  }, [
    targetDate,
    basePrice,
    forecastDays,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow,
    refreshKey,
  ]);

  /**
   * Calculate chart data
   */
  const chartData = useMemo<PriceProgressionData | null>(() => {
    if (!includeChartData || projections.length === 0) {
      return null;
    }

    const currentDays = differenceInDays(targetDate);

    return {
      labels: projections.map((proj) =>
        formatProjectionTimeline(currentDays, proj.daysOut)
      ),
      prices: projections.map((proj) => proj.price),
      multipliers: projections.map((proj) => proj.multiplier),
      timestamps: projections.map((proj) => {
        const date = new Date();
        date.setDate(date.getDate() + (currentDays - proj.daysOut));
        return date;
      }),
    };
  }, [projections, includeChartData, targetDate]);

  /**
   * Calculate statistics
   */
  const statistics = useMemo(() => {
    if (projections.length === 0) {
      return {
        maxPrice: 0,
        minPrice: 0,
        averageIncrease: 0,
        totalIncrease: 0,
      };
    }

    const prices = projections.map((p) => p.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);

    const increases = projections
      .map((p) => p.increaseFromCurrent)
      .filter((inc) => inc > 0);

    const averageIncrease =
      increases.length > 0
        ? increases.reduce((sum, inc) => sum + inc, 0) / increases.length
        : 0;

    const totalIncrease = maxPrice - minPrice;

    return {
      maxPrice,
      minPrice,
      averageIncrease,
      totalIncrease,
    };
  }, [projections]);

  /**
   * Refresh projections
   */
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  /**
   * Calculate on mount and when dependencies change
   */
  useEffect(() => {
    calculateProjections();
  }, [calculateProjections]);

  return {
    projections,
    chartData,
    maxPrice: statistics.maxPrice,
    minPrice: statistics.minPrice,
    averageIncrease: statistics.averageIncrease,
    totalIncrease: statistics.totalIncrease,
    refresh,
  };
}

/**
 * useSimplifiedProjections - Simplified projections for compact displays
 *
 * Returns only key milestones (tomorrow, 3 days, 1 week)
 *
 * @param targetDate - Check-in date
 * @param basePrice - Base nightly price
 * @param config - Configuration options
 * @returns Simplified projections
 */
export function useSimplifiedProjections(
  targetDate: Date,
  basePrice: number,
  config: UsePriceProjectionsConfig = {}
): PriceProjection[] {
  const { projections } = usePriceProjections(targetDate, basePrice, {
    ...config,
    forecastDays: 7,
    includeChartData: false,
  });

  return useMemo(() => {
    // Filter to key milestones
    const milestones = [1, 3, 7];
    return projections.filter((proj) => milestones.includes(proj.daysOut));
  }, [projections]);
}

/**
 * useProjectionComparison - Compare current vs future prices
 *
 * Useful for showing "save X dollars by booking today" messages
 *
 * @param targetDate - Check-in date
 * @param basePrice - Base nightly price
 * @param comparisonDaysOut - Days to compare against
 * @param config - Configuration options
 * @returns Comparison data
 */
export function useProjectionComparison(
  targetDate: Date,
  basePrice: number,
  comparisonDaysOut: number = 1,
  config: UsePriceProjectionsConfig = {}
): {
  currentPrice: number;
  futurePrice: number;
  savings: number;
  percentageSavings: number;
} | null {
  const { projections } = usePriceProjections(targetDate, basePrice, {
    ...config,
    includeChartData: false,
  });

  return useMemo(() => {
    if (projections.length === 0) {
      return null;
    }

    // Find projection closest to comparison days
    const targetProjection = projections.find(
      (proj) => proj.daysOut === comparisonDaysOut
    ) || projections[projections.length - 1];

    // Current price is the most distant projection
    const currentProjection = projections[0];

    const currentPrice = currentProjection.price;
    const futurePrice = targetProjection.price;
    const savings = futurePrice - currentPrice;
    const percentageSavings = (savings / currentPrice) * 100;

    return {
      currentPrice,
      futurePrice,
      savings,
      percentageSavings,
    };
  }, [projections, comparisonDaysOut]);
}
