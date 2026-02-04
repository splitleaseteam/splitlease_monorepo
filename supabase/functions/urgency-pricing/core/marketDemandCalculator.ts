/**
 * Market Demand Calculator (FP Adaptation)
 *
 * Pure functional market demand multiplier calculation
 * Integrates day-of-week, seasonal, and event-based demand
 *
 * Based on simulation assumptions:
 * - Day-of-week multipliers (weekday vs weekend)
 * - Seasonal multipliers (high season vs low season)
 * - Event multipliers (conferences, holidays, etc.)
 *
 * FP PRINCIPLES:
 * - No classes, only pure functions
 * - Configuration passed as parameters
 * - Event multipliers fetched from database (side effect in handler, not here)
 * - Deterministic output for same input
 */

import {
  MarketDemandConfig,
  EventMultiplier,
  DEFAULT_DAY_MULTIPLIERS,
  DEFAULT_SEASONAL_MULTIPLIERS,
} from '../types/urgency.types.ts';
import { getDayName } from './dateUtils.ts';

/**
 * Calculate total market demand multiplier for a specific date
 *
 * Combines:
 * 1. Base multiplier
 * 2. Day-of-week multiplier
 * 3. Seasonal multiplier
 * 4. Event multiplier (if applicable)
 *
 * @param date - Target date
 * @param config - Market demand configuration
 * @param eventMultipliers - Active event multipliers for this date
 * @param city - City code (for event matching, optional)
 * @returns Total market demand multiplier
 */
export const calculateMarketDemandMultiplier = (
  date: Date,
  config: MarketDemandConfig,
  eventMultipliers: EventMultiplier[],
  city?: string
): number => {
  const baseMultiplier = config.baseMultiplier;
  const dayMultiplier = getDayOfWeekMultiplier(date, config);
  const seasonalMultiplier = getSeasonalMultiplier(date, config);
  const eventMultiplier = getEventMultiplier(date, eventMultipliers, city);

  // Multiplicative combination
  const totalMultiplier =
    baseMultiplier * dayMultiplier * seasonalMultiplier * eventMultiplier;

  return totalMultiplier;
};

/**
 * Get day-of-week multiplier
 *
 * @param date - Target date
 * @param config - Market demand configuration
 * @returns Day-of-week multiplier
 */
export const getDayOfWeekMultiplier = (
  date: Date,
  config: MarketDemandConfig
): number => {
  const dayName = getDayName(date);

  const multipliers = config.dayOfWeekMultipliers;

  return (
    multipliers[dayName as keyof typeof multipliers] ??
    DEFAULT_DAY_MULTIPLIERS[dayName as keyof typeof DEFAULT_DAY_MULTIPLIERS] ??
    1.0
  );
};

/**
 * Get seasonal multiplier based on month
 *
 * @param date - Target date
 * @param config - Market demand configuration
 * @returns Seasonal multiplier
 */
export const getSeasonalMultiplier = (
  date: Date,
  config: MarketDemandConfig
): number => {
  const month = date.getMonth(); // 0-11

  if (config.seasonalMultipliers) {
    return config.seasonalMultipliers[month] ?? 1.0;
  }

  return DEFAULT_SEASONAL_MULTIPLIERS[month] ?? 1.0;
};

/**
 * Get event multiplier if date falls within an event
 *
 * Returns highest multiplier if multiple events overlap
 *
 * @param date - Target date
 * @param eventMultipliers - Active event multipliers
 * @param city - City code (optional)
 * @returns Event multiplier (1.0 if no event)
 */
export const getEventMultiplier = (
  date: Date,
  eventMultipliers: EventMultiplier[],
  city?: string
): number => {
  if (!eventMultipliers || eventMultipliers.length === 0) {
    return 1.0;
  }

  let maxMultiplier = 1.0;

  for (const event of eventMultipliers) {
    // Check if date falls within event period
    const inEventPeriod =
      date >= event.startDate && date <= event.endDate;

    if (!inEventPeriod) {
      continue;
    }

    // Check if city matches (if city specified)
    if (city && !event.cities.includes(city)) {
      continue;
    }

    // Track highest multiplier
    if (event.multiplier > maxMultiplier) {
      maxMultiplier = event.multiplier;
    }
  }

  return maxMultiplier;
};

/**
 * Get active events for a date range
 *
 * Pure function for filtering events (database fetch happens in handler)
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param eventMultipliers - All event multipliers
 * @param city - City code (optional)
 * @returns Active events in date range
 */
export const getActiveEvents = (
  startDate: Date,
  endDate: Date,
  eventMultipliers: EventMultiplier[],
  city?: string
): EventMultiplier[] => {
  if (!eventMultipliers) {
    return [];
  }

  return eventMultipliers.filter(event => {
    // Check if event overlaps with date range
    const overlaps =
      event.startDate <= endDate && event.endDate >= startDate;

    if (!overlaps) {
      return false;
    }

    // Check city match
    if (city && !event.cities.includes(city)) {
      return false;
    }

    return true;
  });
};

/**
 * Calculate demand breakdown for a date
 *
 * Returns individual components for transparency
 *
 * @param date - Target date
 * @param config - Market demand configuration
 * @param eventMultipliers - Active event multipliers
 * @param city - City code (optional)
 * @returns Demand breakdown
 */
export const calculateDemandBreakdown = (
  date: Date,
  config: MarketDemandConfig,
  eventMultipliers: EventMultiplier[],
  city?: string
): {
  base: number;
  dayOfWeek: number;
  seasonal: number;
  event: number;
  total: number;
} => {
  const base = config.baseMultiplier;
  const dayOfWeek = getDayOfWeekMultiplier(date, config);
  const seasonal = getSeasonalMultiplier(date, config);
  const event = getEventMultiplier(date, eventMultipliers, city);
  const total = base * dayOfWeek * seasonal * event;

  return {
    base,
    dayOfWeek,
    seasonal,
    event,
    total,
  };
};

/**
 * Create default market demand configuration for urban location
 *
 * @returns Urban market demand config
 */
export const createUrbanConfig = (): MarketDemandConfig => {
  return {
    baseMultiplier: 1.0,
    dayOfWeekMultipliers: {
      monday: 1.25,
      tuesday: 1.25,
      wednesday: 1.25,
      thursday: 1.25,
      friday: 1.10,
      saturday: 0.80,
      sunday: 0.80,
    },
    seasonalMultipliers: DEFAULT_SEASONAL_MULTIPLIERS,
  };
};

/**
 * Create default market demand configuration for resort location
 *
 * @returns Resort market demand config
 */
export const createResortConfig = (): MarketDemandConfig => {
  return {
    baseMultiplier: 1.0,
    dayOfWeekMultipliers: {
      monday: 0.70,
      tuesday: 0.70,
      wednesday: 0.70,
      thursday: 0.70,
      friday: 1.00,
      saturday: 1.40,
      sunday: 1.40,
    },
    seasonalMultipliers: DEFAULT_SEASONAL_MULTIPLIERS,
  };
};
