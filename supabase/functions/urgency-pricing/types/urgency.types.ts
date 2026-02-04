/**
 * Type Definitions for Pattern 2: Urgency Countdown
 *
 * Adapted for Supabase Edge Functions (Deno runtime)
 * FP-compatible type system for urgency-based pricing
 */

/**
 * Urgency level classification
 */
export enum UrgencyLevel {
  LOW = 'LOW',           // 14+ days
  MEDIUM = 'MEDIUM',     // 7-14 days
  HIGH = 'HIGH',         // 3-7 days
  CRITICAL = 'CRITICAL', // 0-3 days
}

/**
 * Transaction types that support urgency pricing
 */
export enum TransactionType {
  BUYOUT = 'buyout',
  CRASH = 'crash',
  SWAP = 'swap',
}

/**
 * Urgency context for pricing calculations
 */
export interface UrgencyContext {
  targetDate: Date;
  currentDate: Date;
  daysUntilCheckIn: number;
  hoursUntilCheckIn: number;
  basePrice: number;
  urgencySteepness: number;         // From simulation: 2.0 recommended
  marketDemandMultiplier: number;   // 0.7-1.4 range
  lookbackWindow?: number;          // Default 90 days
  transactionType?: TransactionType;
}

/**
 * Price projection for future dates
 */
export interface PriceProjection {
  daysOut: number;
  hoursOut: number;
  price: number;
  multiplier: number;
  increaseFromCurrent: number;
  percentageIncrease: number;
  urgencyLevel: UrgencyLevel;
  timestamp: Date;
}

/**
 * Complete urgency pricing result
 */
export interface UrgencyPricing {
  currentPrice: number;
  currentMultiplier: number;
  basePrice: number;
  marketAdjustedBase: number;
  urgencyPremium: number;
  urgencyLevel: UrgencyLevel;
  daysUntilCheckIn: number;
  hoursUntilCheckIn: number;
  projections: PriceProjection[];
  increaseRatePerDay: number;
  increaseRatePerHour: number;
  peakPrice: number;
  calculatedAt: Date;
  expiresAt: Date;
  targetDate: Date;
  steepness: number;
  marketMultiplier: number;
  cacheKey?: string;
}

/**
 * Urgency multiplier calculation parameters
 */
export interface UrgencyMultiplierParams {
  daysOut: number;
  hoursOut?: number;
  steepness: number;
  lookbackWindow: number;
  useHourlyGranularity?: boolean;
}

/**
 * Market demand configuration
 */
export interface MarketDemandConfig {
  baseMultiplier: number;
  dayOfWeekMultipliers: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  seasonalMultipliers?: {
    [month: number]: number;
  };
}

/**
 * Event-based demand multiplier
 */
export interface EventMultiplier {
  eventId: string;
  eventName: string;
  startDate: Date;
  endDate: Date;
  multiplier: number;
  cities: string[];
}

/**
 * Edge Function Payloads
 */

export interface CalculatePayload {
  targetDate: string;  // ISO date string
  basePrice: number;
  urgencySteepness?: number;  // Default 2.0
  marketDemandMultiplier?: number;  // Default 1.0
  includeProjections?: boolean;  // Default true
}

export interface BatchPayload {
  requests: CalculatePayload[];
}

export interface CalendarPayload {
  basePrice: number;
  dates: string[];  // ISO date strings
  steepness?: number;
}

export interface EventsPayload {
  action: 'add_event' | 'remove_event' | 'list_events';
  eventId?: string;
  eventName?: string;
  startDate?: string;
  endDate?: string;
  cities?: string[];
  multiplier?: number;
}

/**
 * Edge Function Responses
 */

export interface PricingCalculationResponse {
  success: boolean;
  data?: UrgencyPricing;
  error?: string;
  metadata: {
    calculatedAt: Date;
    cacheHit: boolean;
    calculationTimeMs: number;
  };
}

export interface BatchPricingResponse {
  success: boolean;
  results: PricingCalculationResponse[];
  metadata: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCalculationTimeMs: number;
  };
}

export interface CalendarResponse {
  success: boolean;
  data?: Record<string, UrgencyPricing>;
  error?: string;
}

export interface EventsResponse {
  success: boolean;
  data?: EventMultiplier[] | EventMultiplier;
  error?: string;
}

export interface StatsResponse {
  success: boolean;
  data?: {
    cacheStats: {
      total: number;
      byLevel: Record<UrgencyLevel, number>;
    };
  };
  error?: string;
}

export interface HealthResponse {
  success: boolean;
  data: {
    status: string;
    service: string;
    version: string;
  };
}

/**
 * Constants for urgency calculation
 */
export const URGENCY_CONSTANTS = {
  DEFAULT_STEEPNESS: 2.0,
  DEFAULT_LOOKBACK_WINDOW: 90,
  MIN_MULTIPLIER: 1.0,
  MAX_MULTIPLIER: 10.0,
  HOURS_PER_DAY: 24,
  MILLISECONDS_PER_HOUR: 3600000,
  MILLISECONDS_PER_DAY: 86400000,
} as const;

/**
 * Urgency thresholds (in days)
 */
export const URGENCY_THRESHOLDS = {
  CRITICAL: 3,
  HIGH: 7,
  MEDIUM: 14,
} as const;

/**
 * Cache TTL by urgency level (in seconds)
 */
export const CACHE_TTL = {
  [UrgencyLevel.CRITICAL]: 300,    // 5 minutes
  [UrgencyLevel.HIGH]: 900,        // 15 minutes
  [UrgencyLevel.MEDIUM]: 3600,     // 1 hour
  [UrgencyLevel.LOW]: 21600,       // 6 hours
} as const;

/**
 * Default day-of-week multipliers
 * Based on urban weekday premium (NYC pattern)
 */
export const DEFAULT_DAY_MULTIPLIERS = {
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
export const DEFAULT_SEASONAL_MULTIPLIERS = {
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

/**
 * Type guards
 */
export function isUrgencyLevel(value: unknown): value is UrgencyLevel {
  return Object.values(UrgencyLevel).includes(value as UrgencyLevel);
}

export function isTransactionType(value: unknown): value is TransactionType {
  return Object.values(TransactionType).includes(value as TransactionType);
}
