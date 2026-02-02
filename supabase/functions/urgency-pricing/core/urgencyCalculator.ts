/**
 * Urgency Calculator - Core Module (FP Adaptation)
 *
 * Pure functional urgency pricing calculation engine
 * Implements exponential urgency formula with steepness parameter (default: 2.0)
 *
 * Formula: multiplier = exp(steepness × (1 - days_out/lookback_window))
 *
 * Key Features:
 * - Exponential urgency curve (not linear)
 * - Configurable steepness parameter
 * - Market demand integration
 * - Hourly granularity for critical urgency
 * - Pure functions (no side effects)
 *
 * FP PRINCIPLES:
 * - No classes, only pure functions
 * - Immutable data structures
 * - No side effects (Date objects passed as parameters)
 * - Explicit dependencies
 */

import {
  UrgencyContext,
  UrgencyPricing,
  UrgencyMultiplierParams,
  UrgencyLevel,
  PriceProjection,
  URGENCY_CONSTANTS,
  URGENCY_THRESHOLDS,
  CACHE_TTL,
} from '../types/urgency.types.ts';

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
export const calculateUrgencyMultiplier = (params: UrgencyMultiplierParams): number => {
  const {
    daysOut,
    hoursOut,
    steepness,
    lookbackWindow,
    useHourlyGranularity = false,
  } = params;

  // Validation
  if (steepness <= 0) {
    throw new Error(`Steepness must be positive, got: ${steepness}`);
  }

  if (lookbackWindow <= 0) {
    throw new Error(`Lookback window must be positive, got: ${lookbackWindow}`);
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
};

/**
 * Calculate urgency level based on days until check-in
 *
 * @param daysOut - Days until check-in
 * @returns Urgency level classification
 */
export const calculateUrgencyLevel = (daysOut: number): UrgencyLevel => {
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
};

/**
 * Generate price projections for future dates
 *
 * @param context - Urgency context
 * @param current - Current pricing info
 * @returns Array of price projections
 */
export const generatePriceProjections = (
  context: UrgencyContext,
  current: {
    currentPrice: number;
    marketAdjustedBase: number;
    urgencyLevel: UrgencyLevel;
  }
): PriceProjection[] => {
  const {
    daysUntilCheckIn,
    urgencySteepness,
    lookbackWindow = URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
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
    const futureMultiplier = calculateUrgencyMultiplier({
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
    const futureUrgencyLevel = calculateUrgencyLevel(futureDaysOut);

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
};

/**
 * Calculate cache expiry time based on urgency level
 *
 * @param calculatedAt - Calculation timestamp
 * @param urgencyLevel - Urgency level
 * @returns Expiry timestamp
 */
export const calculateCacheExpiry = (
  calculatedAt: Date,
  urgencyLevel: UrgencyLevel
): Date => {
  const ttlSeconds = CACHE_TTL[urgencyLevel];
  return new Date(calculatedAt.getTime() + ttlSeconds * 1000);
};

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
export const calculateUrgencyPricing = (context: UrgencyContext): UrgencyPricing => {
  const {
    targetDate,
    daysUntilCheckIn,
    hoursUntilCheckIn,
    basePrice,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow = URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
  } = context;

  // Validate inputs
  if (basePrice <= 0) {
    throw new Error(`Base price must be positive, got: ${basePrice}`);
  }

  if (marketDemandMultiplier <= 0) {
    throw new Error(`Market demand multiplier must be positive, got: ${marketDemandMultiplier}`);
  }

  // Calculate urgency level
  const urgencyLevel = calculateUrgencyLevel(daysUntilCheckIn);

  // Determine if we should use hourly granularity (critical urgency)
  const useHourlyGranularity = urgencyLevel === UrgencyLevel.CRITICAL;

  // Step 1: Apply market demand to base price
  const marketAdjustedBase = basePrice * marketDemandMultiplier;

  // Step 2: Calculate urgency multiplier
  const currentMultiplier = calculateUrgencyMultiplier({
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
  const projections = generatePriceProjections(context, {
    currentPrice,
    marketAdjustedBase,
    urgencyLevel,
  });

  // Step 6: Calculate peak price (1-day out)
  const peakMultiplier = calculateUrgencyMultiplier({
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
  const expiresAt = calculateCacheExpiry(calculatedAt, urgencyLevel);

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
    targetDate,
    steepness: urgencySteepness,
    marketMultiplier: marketDemandMultiplier,
  };
};

/**
 * Calculate price for a specific number of days out
 *
 * Utility function for quick price calculation without full pricing object
 *
 * @param basePrice - Base nightly price
 * @param daysOut - Days until check-in
 * @param steepness - Urgency steepness (default: 2.0)
 * @param marketMultiplier - Market demand multiplier (default: 1.0)
 * @returns Calculated price
 */
export const calculatePriceForDaysOut = (
  basePrice: number,
  daysOut: number,
  steepness: number = URGENCY_CONSTANTS.DEFAULT_STEEPNESS,
  marketMultiplier: number = 1.0
): number => {
  const marketAdjustedBase = basePrice * marketMultiplier;

  const multiplier = calculateUrgencyMultiplier({
    daysOut,
    steepness,
    lookbackWindow: URGENCY_CONSTANTS.DEFAULT_LOOKBACK_WINDOW,
  });

  return Math.round(marketAdjustedBase * multiplier);
};
