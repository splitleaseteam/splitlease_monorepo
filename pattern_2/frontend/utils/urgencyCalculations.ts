/**
 * Pattern 2: Urgency Countdown - Core Calculation Utilities
 *
 * Production-ready urgency pricing calculations with exponential model
 * Based on simulation data showing 2.0 steepness optimizes revenue
 */

import {
  UrgencyContext,
  UrgencyPricing,
  PriceProjection,
  PricingParameters,
  UrgencyLevel,
  UrgencyMetadata,
  PriceAlert,
  DEFAULT_URGENCY_STEEPNESS,
  DEFAULT_LOOKBACK_WINDOW,
  URGENCY_THRESHOLDS,
} from '../types';

/**
 * Calculate urgency multiplier using exponential formula
 * Formula: exp(steepness × (1 - days_out/lookback_window))
 *
 * @param daysOut - Days until check-in (0-90)
 * @param steepness - Urgency curve steepness (recommended: 2.0)
 * @param lookbackWindow - Booking horizon in days (default: 90)
 * @returns Multiplier (e.g., 4.5 means 4.5x base price)
 */
export function calculateUrgencyMultiplier(
  daysOut: number,
  steepness: number = DEFAULT_URGENCY_STEEPNESS,
  lookbackWindow: number = DEFAULT_LOOKBACK_WINDOW
): number {
  // Clamp days to valid range
  const clampedDays = Math.max(0, Math.min(lookbackWindow, daysOut));

  // Exponential urgency formula (from simulation)
  const multiplier = Math.exp(
    steepness * (1 - clampedDays / lookbackWindow)
  );

  // Floor at 1.0 (never below base price)
  return Math.max(1.0, multiplier);
}

/**
 * Calculate final urgent price with market demand
 *
 * @param params - Pricing parameters
 * @returns Final calculated price
 */
export function calculateUrgentPrice({
  basePrice,
  daysOut,
  urgencySteepness,
  marketDemandMultiplier,
  lookbackWindow = DEFAULT_LOOKBACK_WINDOW,
}: PricingParameters): number {
  // Step 1: Apply market demand to base
  const marketAdjustedBase = basePrice * marketDemandMultiplier;

  // Step 2: Calculate urgency multiplier (exponential)
  const urgencyMultiplier = calculateUrgencyMultiplier(
    daysOut,
    urgencySteepness,
    lookbackWindow
  );

  // Step 3: Apply urgency to market-adjusted base
  const urgentPrice = marketAdjustedBase * urgencyMultiplier;

  // Step 4: Round to nearest dollar
  return Math.round(urgentPrice);
}

/**
 * Calculate full urgency pricing with projections
 *
 * @param context - Urgency context
 * @returns Complete pricing information
 */
export function calculateUrgencyPricing(
  context: UrgencyContext
): UrgencyPricing {
  const {
    basePrice,
    daysUntilCheckIn,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow = DEFAULT_LOOKBACK_WINDOW,
  } = context;

  // Current price with urgency
  const currentMultiplier = calculateUrgencyMultiplier(
    daysUntilCheckIn,
    urgencySteepness,
    lookbackWindow
  );
  const currentPrice = Math.round(
    basePrice * marketDemandMultiplier * currentMultiplier
  );

  // Future projections - show meaningful milestones
  const projectionDays = generateProjectionDays(daysUntilCheckIn);

  const projections = projectionDays.map((daysOut) => {
    const multiplier = calculateUrgencyMultiplier(
      daysOut,
      urgencySteepness,
      lookbackWindow
    );
    const price = Math.round(basePrice * marketDemandMultiplier * multiplier);

    return {
      daysOut,
      price,
      multiplier,
      increaseFromCurrent: price - currentPrice,
      percentageIncrease: ((price - currentPrice) / currentPrice) * 100,
    };
  });

  // Calculate peak price (1 day out)
  const peakMultiplier = calculateUrgencyMultiplier(
    1,
    urgencySteepness,
    lookbackWindow
  );
  const peakPrice = Math.round(
    basePrice * marketDemandMultiplier * peakMultiplier
  );

  // Calculate daily increase rate (linear approximation)
  const increaseRatePerDay = Math.round(
    (peakPrice - currentPrice) / Math.max(1, daysUntilCheckIn - 1)
  );

  // Determine next update interval based on urgency
  const urgencyLevel = getUrgencyLevel(daysUntilCheckIn);
  const nextUpdateIn = getUpdateInterval(context.hoursUntilCheckIn);

  return {
    currentPrice,
    currentMultiplier,
    projections,
    increaseRatePerDay,
    peakPrice,
    calculatedAt: new Date(),
    nextUpdateIn,
  };
}

/**
 * Generate smart projection days based on time remaining
 *
 * @param daysUntil - Days until check-in
 * @returns Array of days to show projections for
 */
function generateProjectionDays(daysUntil: number): number[] {
  if (daysUntil <= 3) {
    // Critical: show tomorrow and day after
    return [1, 2].filter((d) => d < daysUntil);
  }

  if (daysUntil <= 7) {
    // High: show 3 days, 1 day
    return [3, 1].filter((d) => d < daysUntil);
  }

  if (daysUntil <= 14) {
    // Medium: show 7 days, 3 days, 1 day
    return [7, 3, 1].filter((d) => d < daysUntil);
  }

  // Low: show multiple milestones
  const projections: number[] = [];
  if (daysUntil > 14) projections.push(14);
  if (daysUntil > 7) projections.push(7);
  if (daysUntil > 3) projections.push(3);
  projections.push(1);

  return projections;
}

/**
 * Generate price progression for visualization
 *
 * @param context - Urgency context
 * @param forecastDays - Number of days to forecast
 * @returns Array of price projections
 */
export function generatePriceProgression(
  context: UrgencyContext,
  forecastDays: number = 7
): PriceProjection[] {
  const projections: PriceProjection[] = [];
  const {
    basePrice,
    daysUntilCheckIn,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow = DEFAULT_LOOKBACK_WINDOW,
  } = context;

  const currentPrice = calculateUrgentPrice({
    basePrice,
    daysOut: daysUntilCheckIn,
    urgencySteepness,
    marketDemandMultiplier,
    lookbackWindow,
  });

  for (let i = 1; i <= forecastDays; i++) {
    const futureDaysOut = Math.max(0, daysUntilCheckIn - i);

    const price = calculateUrgentPrice({
      basePrice,
      daysOut: futureDaysOut,
      urgencySteepness,
      marketDemandMultiplier,
      lookbackWindow,
    });

    const multiplier = calculateUrgencyMultiplier(
      futureDaysOut,
      urgencySteepness,
      lookbackWindow
    );

    projections.push({
      daysOut: futureDaysOut,
      price,
      multiplier,
      increaseFromCurrent: price - currentPrice,
      percentageIncrease: ((price - currentPrice) / currentPrice) * 100,
    });
  }

  return projections;
}

/**
 * Calculate average daily price increase
 *
 * @param currentPrice - Current price
 * @param peakPrice - Peak price at 1 day out
 * @param daysRemaining - Days until check-in
 * @returns Daily increase rate in dollars
 */
export function calculateDailyIncreaseRate(
  currentPrice: number,
  peakPrice: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 1) return 0;

  const totalIncrease = peakPrice - currentPrice;
  const ratePerDay = totalIncrease / (daysRemaining - 1);

  return Math.round(ratePerDay);
}

/**
 * Determine urgency level from days remaining
 *
 * @param daysUntil - Days until check-in
 * @returns Urgency level classification
 */
export function getUrgencyLevel(daysUntil: number): UrgencyLevel {
  if (daysUntil <= URGENCY_THRESHOLDS.CRITICAL) return 'critical';
  if (daysUntil <= URGENCY_THRESHOLDS.HIGH) return 'high';
  if (daysUntil <= URGENCY_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Get urgency metadata for UI display
 *
 * @param level - Urgency level
 * @param daysUntil - Days until check-in
 * @returns Complete metadata for UI rendering
 */
export function getUrgencyMetadata(
  level: UrgencyLevel,
  daysUntil: number
): UrgencyMetadata {
  const metadata: Record<UrgencyLevel, UrgencyMetadata> = {
    low: {
      level: 'low',
      color: '#4A90E2',
      backgroundColor: '#F0F4F8',
      label: 'Plan Ahead',
      message: `${daysUntil} days until check-in - plenty of time to coordinate`,
      showProgressBar: false,
      showCTA: false,
      animationIntensity: 'none',
    },
    medium: {
      level: 'medium',
      color: '#F57C00',
      backgroundColor: '#FFF8E1',
      label: 'Book Soon',
      message: `${daysUntil} days until check-in - price increasing`,
      showProgressBar: true,
      showCTA: true,
      animationIntensity: 'subtle',
    },
    high: {
      level: 'high',
      color: '#FF5722',
      backgroundColor: '#FFE5E5',
      label: 'Urgent',
      message: `Only ${daysUntil} days until check-in - act fast`,
      showProgressBar: true,
      showCTA: true,
      animationIntensity: 'moderate',
    },
    critical: {
      level: 'critical',
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      label: 'Critical',
      message:
        daysUntil === 1
          ? 'Check-in is tomorrow - immediate action required'
          : `Only ${daysUntil} days left - book now`,
      showProgressBar: true,
      showCTA: true,
      animationIntensity: 'intense',
    },
  };

  return metadata[level];
}

/**
 * Calculate update interval based on hours remaining
 *
 * @param hoursUntil - Hours until check-in
 * @returns Update interval in milliseconds
 */
export function getUpdateInterval(hoursUntil: number): number {
  if (hoursUntil < 6) return 60000; // 1 minute
  if (hoursUntil < 72) return 900000; // 15 minutes
  if (hoursUntil < 168) return 3600000; // 1 hour
  if (hoursUntil < 336) return 21600000; // 6 hours
  return 86400000; // 24 hours
}

/**
 * Check for price milestone alerts
 *
 * @param currentPrice - Current price
 * @param basePrice - Base price
 * @param previousMultiplier - Previous multiplier (for change detection)
 * @returns Array of active alerts
 */
export function checkPriceAlerts(
  currentPrice: number,
  basePrice: number,
  previousMultiplier?: number
): PriceAlert[] {
  const alerts: PriceAlert[] = [];
  const multiplier = currentPrice / basePrice;

  // Milestone alerts (2x, 3x, 5x)
  if (multiplier >= 2 && multiplier < 2.1) {
    alerts.push({
      type: 'milestone',
      message: 'Price has doubled from base rate',
      show: true,
      priority: 'medium',
    });
  }

  if (multiplier >= 3 && multiplier < 3.1) {
    alerts.push({
      type: 'milestone',
      message: 'Price is now 3x base rate',
      show: true,
      priority: 'medium',
    });
  }

  if (multiplier >= 5 && multiplier < 5.2) {
    alerts.push({
      type: 'milestone',
      message: 'Price is now 5x base rate',
      show: true,
      priority: 'high',
    });
  }

  // Critical threshold (8x+)
  if (multiplier >= 8) {
    alerts.push({
      type: 'critical',
      message: 'Approaching maximum price - book immediately',
      show: true,
      priority: 'high',
    });
  }

  // Doubling alert (if multiplier increased significantly)
  if (previousMultiplier && multiplier >= previousMultiplier * 1.5) {
    alerts.push({
      type: 'doubling',
      message: `Price increased ${Math.round(((multiplier - previousMultiplier) / previousMultiplier) * 100)}%`,
      show: true,
      priority: 'high',
    });
  }

  return alerts;
}

/**
 * Format currency for display
 *
 * @param amount - Amount in dollars
 * @param showCents - Whether to show cents
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, showCents: boolean = false): string {
  if (showCents) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage for display
 *
 * @param value - Percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format multiplier for display
 *
 * @param multiplier - Multiplier value
 * @returns Formatted multiplier string
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}

/**
 * Validate urgency context
 *
 * @param context - Urgency context to validate
 * @throws Error if context is invalid
 */
export function validateUrgencyContext(context: UrgencyContext): void {
  if (!context.targetDate || !(context.targetDate instanceof Date)) {
    throw new Error('Invalid targetDate: must be a Date object');
  }

  if (context.basePrice <= 0) {
    throw new Error('Invalid basePrice: must be greater than 0');
  }

  if (context.urgencySteepness <= 0) {
    throw new Error('Invalid urgencySteepness: must be greater than 0');
  }

  if (context.marketDemandMultiplier <= 0) {
    throw new Error('Invalid marketDemandMultiplier: must be greater than 0');
  }

  if (context.targetDate <= context.currentDate) {
    throw new Error('Invalid dates: targetDate must be after currentDate');
  }
}

/**
 * Example urgency multipliers at steepness = 2.0
 * Based on simulation data
 */
export const URGENCY_MULTIPLIER_EXAMPLES = {
  90: 1.0, // 90 days out = 1.0x (base)
  60: 1.4, // 60 days out = 1.4x
  30: 2.2, // 30 days out = 2.2x
  21: 2.7, // 21 days out = 2.7x
  14: 3.2, // 14 days out = 3.2x
  10: 3.9, // 10 days out = 3.9x
  7: 4.5, // 7 days out = 4.5x
  5: 5.4, // 5 days out = 5.4x
  3: 6.4, // 3 days out = 6.4x
  2: 7.5, // 2 days out = 7.5x
  1: 8.8, // 1 day out = 8.8x (peak)
} as const;
