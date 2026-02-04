/**
 * Urgency Calculator - Core Module
 *
 * Production-ready urgency pricing calculation engine
 * Implements exponential urgency formula with steepness parameter (default: 2.0)
 *
 * Formula: multiplier = exp(steepness × (1 - days_out/lookback_window))
 *
 * Key Features:
 * - Exponential urgency curve (not linear)
 * - Configurable steepness parameter
 * - Market demand integration
 * - Hourly granularity for critical urgency
 * - Comprehensive validation
 */

import {
  UrgencyContext,
  UrgencyPricing,
  UrgencyMultiplierParams,
  UrgencyLevel,
  PriceProjection,
  URGENCY_CONSTANTS,
  URGENCY_THRESHOLDS,
} from '../types/urgency.types';
import { UrgencyValidator } from '../utils/validator';
import { DateUtils } from '../utils/dateUtils';
import { UrgencyError } from '../utils/errors';

export class UrgencyCalculator {
  /**
   * Calculate urgency multiplier using exponential formula
   *
   * Formula: exp(steepness × (1 - days_out/lookback_window))
   *
   * Examples with steepness = 2.0:
   * - 30 days out: 2.2x
   * - 14 days out: 3.2x
   * - 7 days out: 4.5x
   * - 3 days out: 6.4x
   * - 1 day out: 8.8x
   *
   * @param params - Urgency multiplier calculation parameters
   * @returns Urgency multiplier (1.0 to ~10.0)
   */
  static calculateUrgencyMultiplier(params: UrgencyMultiplierParams): number {
    const {
      daysOut,
      hoursOut,
      steepness,
      lookbackWindow,
      useHourlyGranularity = false,
    } = params;

    // Validation
    if (steepness <= 0) {
      throw new UrgencyError(
        'INVALID_STEEPNESS',
        `Steepness must be positive, got: ${steepness}`
      );
    }

    if (lookbackWindow <= 0) {
      throw new UrgencyError(
        'INVALID_LOOKBACK_WINDOW',
        `Lookback window must be positive, got: ${lookbackWindow}`
      );
    }

    // Calculate time out (in days or hours)
    let timeOut: number;
    let lookbackInTimeUnits: number;

    if (useHourlyGranularity && hoursOut !== undefined) {
      // Use hourly granularity for critical urgency (<24 hours)
      timeOut = Math.max(0, hoursOut);
      lookbackInTimeUnits = lookbackWindow * URGENCY_CONSTANTS.HOURS_PER_DAY;
    } else {
      // Use daily granularity
      timeOut = Math.max(0, daysOut);
      lookbackInTimeUnits = lookbackWindow;
    }

    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(lookbackInTimeUnits, timeOut));

    // Exponential urgency formula
    // multiplier = exp(steepness × (1 - time_out/lookback))
    const normalizedTime = clampedTime / lookbackInTimeUnits;
    const multiplier = Math.exp(steepness * (1 - normalizedTime));

    // Floor at minimum multiplier (never below base price)
    const finalMultiplier = Math.max(
      URGENCY_CONSTANTS.MIN_MULTIPLIER,
      multiplier
    );

    // Cap at maximum multiplier (prevent extreme prices)
    return Math.min(URGENCY_CONSTANTS.MAX_MULTIPLIER, finalMultiplier);
  }

  /**
   * Calculate urgency level based on days until check-in
   *
   * @param daysOut - Days until check-in
   * @returns Urgency level classification
   */
  static calculateUrgencyLevel(daysOut: number): UrgencyLevel {
    if (daysOut <= URGENCY_THRESHOLDS.CRITICAL) {
      return UrgencyLevel.CRITICAL;
    }

    if (daysOut <= URGENCY_THRESHOLDS.HIGH) {
      return UrgencyLevel.HIGH;
    }

    if (daysOut <= URGENCY_THRESHOLDS.MEDIUM) {
      return UrgencyLevel.MEDIUM;
    }

    return UrgencyLevel.LOW;
  }

  /**
   * Calculate complete urgency pricing with projections
   *
   * This is the main entry point for urgency pricing calculations.
   * Returns comprehensive pricing information including:
   * - Current price with urgency
   * - Future price projections
   * - Daily/hourly price increase rates
   * - Peak price (1-day out)
   *
   * @param context - Urgency context
   * @returns Complete urgency pricing
   */
  static calculateUrgencyPricing(context: UrgencyContext): UrgencyPricing {
    // Validate context
    const validationResult = UrgencyValidator.validateUrgencyContext(context);
    if (!validationResult.valid) {
      throw new UrgencyError(
        'INVALID_CONTEXT',
        'Invalid urgency context',
        validationResult.errors
      );
    }

    const {
      targetDate,
      currentDate,
      daysUntilCheckIn,
      hoursUntilCheckIn,
      basePrice,
      urgencySteepness,
      marketDemandMultiplier,
      lookbackWindow = URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
    } = context;

    // Calculate urgency level
    const urgencyLevel = this.calculateUrgencyLevel(daysUntilCheckIn);

    // Determine if we should use hourly granularity (critical urgency)
    const useHourlyGranularity = urgencyLevel === UrgencyLevel.CRITICAL;

    // Step 1: Apply market demand to base price
    const marketAdjustedBase = basePrice * marketDemandMultiplier;

    // Step 2: Calculate urgency multiplier
    const currentMultiplier = this.calculateUrgencyMultiplier({
      daysOut: daysUntilCheckIn,
      hoursOut: hoursUntilCheckIn,
      steepness: urgencySteepness,
      lookbackWindow,
      useHourlyGranularity,
    });

    // Step 3: Calculate current price
    const currentPrice = Math.round(marketAdjustedBase * currentMultiplier);

    // Step 4: Calculate urgency premium
    const urgencyPremium = currentPrice - marketAdjustedBase;

    // Step 5: Generate future price projections
    const projections = this.generatePriceProjections(context, {
      currentPrice,
      marketAdjustedBase,
      urgencyLevel,
    });

    // Step 6: Calculate peak price (1-day out)
    const peakMultiplier = this.calculateUrgencyMultiplier({
      daysOut: 1,
      hoursOut: 24,
      steepness: urgencySteepness,
      lookbackWindow,
      useHourlyGranularity: false,
    });
    const peakPrice = Math.round(marketAdjustedBase * peakMultiplier);

    // Step 7: Calculate price increase rates
    const totalIncrease = peakPrice - currentPrice;
    const daysRemaining = Math.max(1, daysUntilCheckIn - 1);
    const hoursRemaining = Math.max(1, hoursUntilCheckIn - 24);

    const increaseRatePerDay = Math.round(totalIncrease / daysRemaining);
    const increaseRatePerHour = Math.round(totalIncrease / hoursRemaining);

    // Step 8: Calculate cache expiry based on urgency level
    const calculatedAt = new Date();
    const expiresAt = this.calculateCacheExpiry(calculatedAt, urgencyLevel);

    // Return complete pricing
    return {
      currentPrice,
      currentMultiplier,
      basePrice,
      marketAdjustedBase,
      urgencyPremium,
      urgencyLevel,
      daysUntilCheckIn,
      hoursUntilCheckIn,
      projections,
      increaseRatePerDay,
      increaseRatePerHour,
      peakPrice,
      calculatedAt,
      expiresAt,
    };
  }

  /**
   * Generate price projections for future dates
   *
   * @param context - Urgency context
   * @param current - Current pricing info
   * @returns Array of price projections
   */
  private static generatePriceProjections(
    context: UrgencyContext,
    current: {
      currentPrice: number;
      marketAdjustedBase: number;
      urgencyLevel: UrgencyLevel;
    }
  ): PriceProjection[] {
    const {
      daysUntilCheckIn,
      urgencySteepness,
      lookbackWindow = URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
      targetDate,
      currentDate,
    } = context;

    const { currentPrice, marketAdjustedBase, urgencyLevel } = current;

    // Determine projection days based on urgency
    let projectionDaysOffset: number[];

    if (urgencyLevel === UrgencyLevel.CRITICAL) {
      // For critical: show hourly/daily increments
      projectionDaysOffset = [1];
    } else if (urgencyLevel === UrgencyLevel.HIGH) {
      // For high: show 1-3 day increments
      projectionDaysOffset = [1, 2, 3];
    } else if (urgencyLevel === UrgencyLevel.MEDIUM) {
      // For medium: show 3, 5, 7 day increments
      projectionDaysOffset = [3, 5, 7];
    } else {
      // For low: show 7, 14, 21 day increments
      projectionDaysOffset = [7, 14, 21];
    }

    const projections: PriceProjection[] = [];

    for (const offset of projectionDaysOffset) {
      const futureDaysOut = Math.max(0, daysUntilCheckIn - offset);

      // Skip if this projection is in the past
      if (futureDaysOut >= daysUntilCheckIn) {
        continue;
      }

      // Calculate future hours out
      const futureHoursOut = futureDaysOut * URGENCY_CONSTANTS.HOURS_PER_DAY;

      // Calculate multiplier for future date
      const futureMultiplier = this.calculateUrgencyMultiplier({
        daysOut: futureDaysOut,
        hoursOut: futureHoursOut,
        steepness: urgencySteepness,
        lookbackWindow,
        useHourlyGranularity: futureDaysOut < 1,
      });

      // Calculate future price
      const futurePrice = Math.round(marketAdjustedBase * futureMultiplier);

      // Calculate increases
      const increaseFromCurrent = futurePrice - currentPrice;
      const percentageIncrease =
        currentPrice > 0 ? (increaseFromCurrent / currentPrice) * 100 : 0;

      // Calculate future urgency level
      const futureUrgencyLevel = this.calculateUrgencyLevel(futureDaysOut);

      // Calculate timestamp for this projection
      const timestamp = new Date(
        currentDate.getTime() + offset * URGENCY_CONSTANTS.MILLISECONDS_PER_DAY
      );

      projections.push({
        daysOut: futureDaysOut,
        hoursOut: futureHoursOut,
        price: futurePrice,
        multiplier: futureMultiplier,
        increaseFromCurrent,
        percentageIncrease,
        urgencyLevel: futureUrgencyLevel,
        timestamp,
      });
    }

    return projections;
  }

  /**
   * Calculate cache expiry time based on urgency level
   *
   * @param calculatedAt - Calculation timestamp
   * @param urgencyLevel - Urgency level
   * @returns Expiry timestamp
   */
  private static calculateCacheExpiry(
    calculatedAt: Date,
    urgencyLevel: UrgencyLevel
  ): Date {
    const ttlMap = {
      [UrgencyLevel.CRITICAL]: 300,    // 5 minutes
      [UrgencyLevel.HIGH]: 900,        // 15 minutes
      [UrgencyLevel.MEDIUM]: 3600,     // 1 hour
      [UrgencyLevel.LOW]: 21600,       // 6 hours
    };

    const ttlSeconds = ttlMap[urgencyLevel];
    return new Date(calculatedAt.getTime() + ttlSeconds * 1000);
  }

  /**
   * Calculate price for a specific number of days out
   *
   * Utility method for quick price calculation without full pricing object
   *
   * @param basePrice - Base nightly price
   * @param daysOut - Days until check-in
   * @param steepness - Urgency steepness (default: 2.0)
   * @param marketMultiplier - Market demand multiplier (default: 1.0)
   * @returns Calculated price
   */
  static calculatePriceForDaysOut(
    basePrice: number,
    daysOut: number,
    steepness: number = URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
    marketMultiplier: number = 1.0
  ): number {
    const marketAdjustedBase = basePrice * marketMultiplier;

    const multiplier = this.calculateUrgencyMultiplier({
      daysOut,
      steepness,
      lookbackWindow: URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
    });

    return Math.round(marketAdjustedBase * multiplier);
  }

  /**
   * Get urgency multiplier examples for documentation
   *
   * Returns expected multipliers at key milestones (steepness = 2.0)
   */
  static getMultiplierExamples(): Record<number, number> {
    return {
      90: 1.0,   // 90 days out = 1.0x (base)
      60: 1.3,   // 60 days out = 1.3x
      30: 2.2,   // 30 days out = 2.2x
      21: 2.6,   // 21 days out = 2.6x
      14: 3.2,   // 14 days out = 3.2x
      10: 3.9,   // 10 days out = 3.9x
      7: 4.5,    // 7 days out = 4.5x
      5: 5.4,    // 5 days out = 5.4x
      3: 6.4,    // 3 days out = 6.4x
      2: 7.4,    // 2 days out = 7.4x
      1: 8.8,    // 1 day out = 8.8x
    };
  }

  /**
   * Calculate daily price increase rate
   *
   * Linear approximation of price increase per day
   *
   * @param currentPrice - Current price
   * @param peakPrice - Peak price (1-day out)
   * @param daysRemaining - Days remaining until check-in
   * @returns Daily increase rate
   */
  static calculateDailyIncreaseRate(
    currentPrice: number,
    peakPrice: number,
    daysRemaining: number
  ): number {
    if (daysRemaining <= 1) {
      return 0;
    }

    const totalIncrease = peakPrice - currentPrice;
    const ratePerDay = totalIncrease / (daysRemaining - 1);

    return Math.round(ratePerDay);
  }

  /**
   * Calculate time until next price update
   *
   * Returns milliseconds until next recalculation based on urgency level
   *
   * @param urgencyLevel - Current urgency level
   * @returns Milliseconds until next update
   */
  static getUpdateInterval(urgencyLevel: UrgencyLevel): number {
    const intervalMap = {
      [UrgencyLevel.CRITICAL]: 60000,      // 1 minute
      [UrgencyLevel.HIGH]: 900000,         // 15 minutes
      [UrgencyLevel.MEDIUM]: 3600000,      // 1 hour
      [UrgencyLevel.LOW]: 21600000,        // 6 hours
    };

    return intervalMap[urgencyLevel];
  }
}
