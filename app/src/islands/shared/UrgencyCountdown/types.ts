/**
 * Pattern 2: Urgency Countdown - Type Definitions
 *
 * Complete type system for urgency countdown functionality
 * Production-ready with comprehensive interface definitions
 */

import type { TransactionType } from '../DateChangeRequestManager/types/transactionTypes';

// Re-export so existing consumers of this module still get TransactionType
export type { TransactionType };

/**
 * Urgency context containing all data needed for urgency calculations
 */
export interface UrgencyContext {
  targetDate: Date;
  currentDate: Date;
  daysUntilCheckIn: number;
  hoursUntilCheckIn: number;
  basePrice: number;
  urgencySteepness: number; // From simulation: 2.0 recommended
  marketDemandMultiplier: number; // 0.7-1.4
  lookbackWindow?: number; // Default: 90 days
}

/**
 * Complete urgency pricing information with projections
 */
export interface UrgencyPricing {
  currentPrice: number;
  currentMultiplier: number;
  projections: PriceProjection[];
  increaseRatePerDay: number;
  peakPrice: number; // 1-day-out price
  calculatedAt: Date;
  nextUpdateIn: number; // Seconds until next update
}

/**
 * Future price projection at a specific time point
 */
export interface PriceProjection {
  daysOut: number;
  price: number;
  multiplier: number;
  increaseFromCurrent: number;
  percentageIncrease: number;
}

/**
 * Urgency level classification
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Urgency metadata for UI display
 */
export interface UrgencyMetadata {
  level: UrgencyLevel;
  color: string;
  backgroundColor: string;
  label: string;
  message: string;
  showProgressBar: boolean;
  showCTA: boolean;
  animationIntensity: 'none' | 'subtle' | 'moderate' | 'intense';
}

/**
 * Price alert notification
 */
export interface PriceAlert {
  type: 'milestone' | 'doubling' | 'critical' | 'threshold';
  message: string;
  show: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Pricing calculation parameters
 */
export interface PricingParameters {
  basePrice: number;
  daysOut: number;
  urgencySteepness: number;
  marketDemandMultiplier: number;
  lookbackWindow?: number;
}

/**
 * Countdown display configuration
 */
export interface CountdownConfig {
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  format: 'long' | 'short' | 'compact';
}

/**
 * Component display variant
 */
export type UrgencyVariant = 'standard' | 'compact' | 'prominent' | 'minimal';

// TransactionType is imported from DateChangeRequestManager/types/transactionTypes
// and re-exported at the top of this file

/**
 * Time update interval in milliseconds
 */
export interface UpdateInterval {
  intervalMs: number;
  reason: string;
}

/**
 * Price progression data for charts/visualizations
 */
export interface PriceProgressionData {
  labels: string[];
  prices: number[];
  multipliers: number[];
  timestamps: Date[];
}

/**
 * User budget context
 */
export interface BudgetContext {
  maxBudget?: number;
  preferredBudget?: number;
  alertThreshold?: number;
}

/**
 * Urgency countdown props
 */
export interface UrgencyCountdownProps {
  targetDate: Date;
  basePrice: number;
  urgencySteepness?: number;
  marketDemandMultiplier?: number;
  transactionType: TransactionType;
  variant?: UrgencyVariant;
  onPriceUpdate?: (pricing: UrgencyPricing) => void;
  onUrgencyChange?: (level: UrgencyLevel) => void;
  onActionClick?: () => void;
  budgetContext?: BudgetContext;
  className?: string;
  testId?: string;
}

/**
 * Countdown timer props
 */
export interface CountdownTimerProps {
  targetDate: Date;
  urgencyLevel: UrgencyLevel;
  config?: CountdownConfig;
  onTick?: (remaining: TimeRemaining) => void;
  className?: string;
}

/**
 * Time remaining breakdown
 */
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

/**
 * Price progression component props
 */
export interface PriceProgressionProps {
  projections: PriceProjection[];
  currentPrice: number;
  urgencyLevel: UrgencyLevel;
  maxProjections?: number;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Urgency indicator props
 */
export interface UrgencyIndicatorProps {
  urgencyLevel: UrgencyLevel;
  metadata: UrgencyMetadata;
  daysUntil: number;
  showProgressBar?: boolean;
  className?: string;
}

/**
 * Price increase rate display props
 */
export interface PriceIncreaseRateProps {
  increaseRatePerDay: number;
  urgencyLevel: UrgencyLevel;
  currentPrice: number;
  peakPrice: number;
  className?: string;
}

/**
 * Action prompt CTA props
 */
export interface ActionPromptProps {
  currentPrice: number;
  urgencyLevel: UrgencyLevel;
  savings?: number;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Constants
 */
export const DEFAULT_URGENCY_STEEPNESS = 2.0;
export const DEFAULT_LOOKBACK_WINDOW = 90;
export const DEFAULT_MARKET_MULTIPLIER = 1.0;

/**
 * Urgency thresholds (in days)
 */
export const URGENCY_THRESHOLDS = {
  CRITICAL: 3,
  HIGH: 7,
  MEDIUM: 14,
  LOW: Infinity,
} as const;

/**
 * Update intervals by urgency level (in milliseconds)
 */
export const UPDATE_INTERVALS = {
  critical: 60000,      // 1 minute
  high: 900000,         // 15 minutes
  medium: 3600000,      // 1 hour
  low: 21600000,        // 6 hours
} as const;

/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  tick: 1000,
  pulse: 2000,
  priceChange: 500,
  progressBar: 1000,
} as const;
