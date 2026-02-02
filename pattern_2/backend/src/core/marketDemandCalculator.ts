/**
 * Market Demand Calculator
 *
 * Production-ready market demand multiplier calculation
 * Integrates day-of-week, seasonal, and event-based demand
 *
 * Based on simulation assumptions:
 * - Day-of-week multipliers (weekday vs weekend)
 * - Seasonal multipliers (high season vs low season)
 * - Event multipliers (conferences, holidays, etc.)
 */

import {
  MarketDemandConfig,
  EventMultiplier,
} from '../types/urgency.types';
import { DateUtils } from '../utils/dateUtils';

/**
 * Default day-of-week multipliers
 * Based on urban weekday premium (NYC pattern)
 */
const DEFAULT_DAY_MULTIPLIERS = {
  monday: 1.25,
  tuesday: 1.25,
  wednesday: 1.25,
  thursday: 1.25,
  friday: 1.10,
  saturday: 0.80,
  sunday: 0.80,
};

/**
 * Default seasonal multipliers (by month)
 * 1.0 = base, >1.0 = high season, <1.0 = low season
 */
const DEFAULT_SEASONAL_MULTIPLIERS = {
  0: 0.9,   // January - low season
  1: 0.9,   // February - low season
  2: 1.0,   // March - normal
  3: 1.1,   // April - high season
  4: 1.1,   // May - high season
  5: 1.2,   // June - peak season
  6: 1.2,   // July - peak season
  7: 1.2,   // August - peak season
  8: 1.1,   // September - high season
  9: 1.1,   // October - high season
  10: 1.0,  // November - normal
  11: 1.3,  // December - peak season (holidays)
};

export class MarketDemandCalculator {
  private config: MarketDemandConfig;
  private eventMultipliers: Map<string, EventMultiplier>;

  constructor(config?: Partial<MarketDemandConfig>) {
    this.config = {
      baseMultiplier: config?.baseMultiplier ?? 1.0,
      dayOfWeekMultipliers: config?.dayOfWeekMultipliers ?? DEFAULT_DAY_MULTIPLIERS,
      seasonalMultipliers: config?.seasonalMultipliers ?? DEFAULT_SEASONAL_MULTIPLIERS,
      eventMultipliers: config?.eventMultipliers ?? [],
    };

    // Build event multipliers lookup map
    this.eventMultipliers = new Map();
    this.config.eventMultipliers?.forEach(event => {
      this.eventMultipliers.set(event.eventId, event);
    });
  }

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
   * @param city - City code (for event matching)
   * @returns Total market demand multiplier
   */
  calculateMultiplier(date: Date, city?: string): number {
    const baseMultiplier = this.config.baseMultiplier;
    const dayMultiplier = this.getDayOfWeekMultiplier(date);
    const seasonalMultiplier = this.getSeasonalMultiplier(date);
    const eventMultiplier = this.getEventMultiplier(date, city);

    // Multiplicative combination
    const totalMultiplier =
      baseMultiplier * dayMultiplier * seasonalMultiplier * eventMultiplier;

    return totalMultiplier;
  }

  /**
   * Get day-of-week multiplier
   *
   * @param date - Target date
   * @returns Day-of-week multiplier
   */
  private getDayOfWeekMultiplier(date: Date): number {
    const dayName = DateUtils.getDayName(date).toLowerCase();

    const multipliers = this.config.dayOfWeekMultipliers;

    return (
      multipliers[dayName as keyof typeof multipliers] ??
      DEFAULT_DAY_MULTIPLIERS[dayName as keyof typeof DEFAULT_DAY_MULTIPLIERS] ??
      1.0
    );
  }

  /**
   * Get seasonal multiplier based on month
   *
   * @param date - Target date
   * @returns Seasonal multiplier
   */
  private getSeasonalMultiplier(date: Date): number {
    const month = date.getMonth(); // 0-11

    if (this.config.seasonalMultipliers) {
      return this.config.seasonalMultipliers[month] ?? 1.0;
    }

    return DEFAULT_SEASONAL_MULTIPLIERS[month] ?? 1.0;
  }

  /**
   * Get event multiplier if date falls within an event
   *
   * Returns highest multiplier if multiple events overlap
   *
   * @param date - Target date
   * @param city - City code (optional)
   * @returns Event multiplier (1.0 if no event)
   */
  private getEventMultiplier(date: Date, city?: string): number {
    if (!this.config.eventMultipliers || this.config.eventMultipliers.length === 0) {
      return 1.0;
    }

    let maxMultiplier = 1.0;

    for (const event of this.config.eventMultipliers) {
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
  }

  /**
   * Add event multiplier
   *
   * @param event - Event multiplier configuration
   */
  addEvent(event: EventMultiplier): void {
    this.eventMultipliers.set(event.eventId, event);
    if (!this.config.eventMultipliers) {
      this.config.eventMultipliers = [];
    }
    this.config.eventMultipliers.push(event);
  }

  /**
   * Remove event multiplier
   *
   * @param eventId - Event ID
   */
  removeEvent(eventId: string): void {
    this.eventMultipliers.delete(eventId);
    if (this.config.eventMultipliers) {
      this.config.eventMultipliers = this.config.eventMultipliers.filter(
        e => e.eventId !== eventId
      );
    }
  }

  /**
   * Get active events for a date range
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param city - City code (optional)
   * @returns Active events
   */
  getActiveEvents(
    startDate: Date,
    endDate: Date,
    city?: string
  ): EventMultiplier[] {
    if (!this.config.eventMultipliers) {
      return [];
    }

    return this.config.eventMultipliers.filter(event => {
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
  }

  /**
   * Calculate demand breakdown for a date
   *
   * Returns individual components for transparency
   *
   * @param date - Target date
   * @param city - City code (optional)
   * @returns Demand breakdown
   */
  calculateDemandBreakdown(date: Date, city?: string): {
    base: number;
    dayOfWeek: number;
    seasonal: number;
    event: number;
    total: number;
  } {
    const base = this.config.baseMultiplier;
    const dayOfWeek = this.getDayOfWeekMultiplier(date);
    const seasonal = this.getSeasonalMultiplier(date);
    const event = this.getEventMultiplier(date, city);
    const total = base * dayOfWeek * seasonal * event;

    return {
      base,
      dayOfWeek,
      seasonal,
      event,
      total,
    };
  }

  /**
   * Update configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<MarketDemandConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Rebuild event multipliers map
    if (config.eventMultipliers) {
      this.eventMultipliers.clear();
      config.eventMultipliers.forEach(event => {
        this.eventMultipliers.set(event.eventId, event);
      });
    }
  }

  /**
   * Get current configuration
   *
   * @returns Current market demand configuration
   */
  getConfig(): MarketDemandConfig {
    return { ...this.config };
  }

  /**
   * Create market demand calculator from simulation parameters
   *
   * Factory method using simulation assumptions
   *
   * @param location - Location type ('urban' or 'resort')
   * @returns Market demand calculator
   */
  static fromSimulationParams(location: 'urban' | 'resort'): MarketDemandCalculator {
    if (location === 'urban') {
      // Urban pattern: weekday premium
      return new MarketDemandCalculator({
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
      });
    } else {
      // Resort pattern: weekend premium
      return new MarketDemandCalculator({
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
      });
    }
  }

  /**
   * Add high-impact event
   *
   * Based on simulation parameters for event-driven demand
   *
   * @param eventName - Event name
   * @param startDate - Start date
   * @param endDate - End date
   * @param cities - Cities affected
   * @param multiplierRange - Multiplier range [min, max]
   * @returns Event multiplier
   */
  addHighImpactEvent(
    eventName: string,
    startDate: Date,
    endDate: Date,
    cities: string[],
    multiplierRange: [number, number] = [2.5, 4.0]
  ): EventMultiplier {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use middle of range for multiplier
    const multiplier = (multiplierRange[0] + multiplierRange[1]) / 2;

    const event: EventMultiplier = {
      eventId,
      eventName,
      startDate,
      endDate,
      multiplier,
      cities,
    };

    this.addEvent(event);
    return event;
  }

  /**
   * Add medium-impact event
   *
   * @param eventName - Event name
   * @param startDate - Start date
   * @param endDate - End date
   * @param cities - Cities affected
   * @param multiplierRange - Multiplier range [min, max]
   * @returns Event multiplier
   */
  addMediumImpactEvent(
    eventName: string,
    startDate: Date,
    endDate: Date,
    cities: string[],
    multiplierRange: [number, number] = [1.5, 2.0]
  ): EventMultiplier {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const multiplier = (multiplierRange[0] + multiplierRange[1]) / 2;

    const event: EventMultiplier = {
      eventId,
      eventName,
      startDate,
      endDate,
      multiplier,
      cities,
    };

    this.addEvent(event);
    return event;
  }
}
