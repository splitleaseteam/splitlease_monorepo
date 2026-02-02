/**
 * Type Definitions for Pattern 2: Urgency Countdown
 *
 * Production-ready type system for urgency-based pricing
 * Includes exponential urgency calculation with steepness parameter
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
  eventMultipliers?: EventMultiplier[];
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
 * Urgency pricing cache entry
 */
export interface UrgencyPricingCacheEntry {
  key: string;
  pricing: UrgencyPricing;
  createdAt: Date;
  expiresAt: Date;
  ttlSeconds: number;
}

/**
 * Pricing calculation request
 */
export interface PricingCalculationRequest {
  targetDate: Date | string;
  basePrice: number;
  urgencySteepness?: number;
  marketDemandMultiplier?: number;
  lookbackWindow?: number;
  transactionType?: TransactionType;
  includeProjections?: boolean;
  projectionDaysAhead?: number[];
  currentDate?: Date;
}

/**
 * Pricing calculation response
 */
export interface PricingCalculationResponse {
  success: boolean;
  data?: UrgencyPricing;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    calculatedAt: Date;
    cacheHit: boolean;
    calculationTimeMs: number;
  };
}

/**
 * Batch pricing calculation request
 */
export interface BatchPricingRequest {
  requests: PricingCalculationRequest[];
  requestId?: string;
}

/**
 * Batch pricing calculation response
 */
export interface BatchPricingResponse {
  success: boolean;
  results: PricingCalculationResponse[];
  metadata: {
    requestId: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCalculationTimeMs: number;
  };
}

/**
 * Price history entry for analytics
 */
export interface PriceHistoryEntry {
  id: string;
  targetDate: Date;
  calculatedAt: Date;
  daysOut: number;
  price: number;
  multiplier: number;
  urgencyLevel: UrgencyLevel;
  basePrice: number;
  marketDemandMultiplier: number;
  urgencySteepness: number;
}

/**
 * Urgency configuration
 */
export interface UrgencyConfig {
  defaultSteepness: number;
  defaultLookbackWindow: number;
  cacheTTLSeconds: {
    [key in UrgencyLevel]: number;
  };
  updateIntervals: {
    [key in UrgencyLevel]: number; // milliseconds
  };
  urgencyThresholds: {
    critical: number; // days
    high: number;     // days
    medium: number;   // days
  };
  maxMultiplier?: number;
  minMultiplier?: number;
}

/**
 * Urgency pricing validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Database models for urgency pricing
 */

/**
 * Urgency pricing record (for persistence)
 */
export interface UrgencyPricingRecord {
  id: string;
  target_date: Date;
  calculated_at: Date;
  expires_at: Date;
  days_until_checkin: number;
  hours_until_checkin: number;
  current_price: number;
  current_multiplier: number;
  base_price: number;
  market_adjusted_base: number;
  urgency_premium: number;
  urgency_level: UrgencyLevel;
  increase_rate_per_day: number;
  increase_rate_per_hour: number;
  peak_price: number;
  urgency_steepness: number;
  market_demand_multiplier: number;
  transaction_type?: TransactionType;
  projections?: string; // JSON stringified PriceProjection[]
  created_at: Date;
  updated_at: Date;
}

/**
 * Market demand record
 */
export interface MarketDemandRecord {
  id: string;
  date: Date;
  city: string;
  base_multiplier: number;
  day_of_week_multiplier: number;
  seasonal_multiplier: number;
  event_multiplier: number;
  total_multiplier: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Event multiplier record
 */
export interface EventMultiplierRecord {
  id: string;
  event_id: string;
  event_name: string;
  start_date: Date;
  end_date: Date;
  multiplier: number;
  cities: string[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Price recalculation job payload
 */
export interface PriceRecalculationJobPayload {
  jobId: string;
  targetDates: Date[];
  urgencySteepness?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledAt: Date;
  metadata?: Record<string, any>;
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
  PROJECTION_DAYS: [1, 3, 5, 7],
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
 * Update intervals by urgency level (in milliseconds)
 */
export const UPDATE_INTERVALS = {
  [UrgencyLevel.CRITICAL]: 60000,      // 1 minute
  [UrgencyLevel.HIGH]: 900000,         // 15 minutes
  [UrgencyLevel.MEDIUM]: 3600000,      // 1 hour
  [UrgencyLevel.LOW]: 21600000,        // 6 hours
} as const;

/**
 * Type guards
 */
export function isUrgencyLevel(value: any): value is UrgencyLevel {
  return Object.values(UrgencyLevel).includes(value);
}

export function isTransactionType(value: any): value is TransactionType {
  return Object.values(TransactionType).includes(value);
}

export function isPricingCalculationRequest(value: any): value is PricingCalculationRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('targetDate' in value) &&
    ('basePrice' in value) &&
    typeof value.basePrice === 'number'
  );
}
