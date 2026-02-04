/**
 * Pattern 2: Urgency Countdown - Main Export File
 *
 * Production-ready exports for all urgency countdown functionality
 */

// Main Component
export { default as UrgencyCountdown, MinimalUrgencyCountdown, ProminentUrgencyCountdown } from './components/UrgencyCountdown';

// Sub-components
export { default as CountdownTimer, CompactCountdownTimer, DetailedCountdownTimer } from './components/CountdownTimer';
export { default as PriceProgression, CompactPriceProgression, PriceProgressionTable, PriceProgressionChart } from './components/PriceProgression';
export { default as UrgencyIndicator, CompactUrgencyIndicator, UrgencyBadge, UrgencyProgressBar, UrgencyTimeline } from './components/UrgencyIndicator';
export { default as PriceIncreaseRate, CompactPriceIncreaseRate, DetailedPriceIncreaseRate, PriceVelocityIndicator } from './components/PriceIncreaseRate';
export { default as ActionPrompt, CompactActionPrompt, SplitActionPrompt, TimerActionPrompt } from './components/ActionPrompt';

// Hooks
export { useCountdown, useCountdownWithVisibility } from './hooks/useCountdown';
export { useUrgencyPricing, useUrgencyPricingWithCache } from './hooks/useUrgencyPricing';
export { usePriceProjections, useSimplifiedProjections, useProjectionComparison } from './hooks/usePriceProjections';

// Utilities
export {
  calculateUrgencyMultiplier,
  calculateUrgentPrice,
  calculateUrgencyPricing,
  generatePriceProgression,
  calculateDailyIncreaseRate,
  getUrgencyLevel,
  getUrgencyMetadata,
  getUpdateInterval,
  checkPriceAlerts,
  formatCurrency,
  formatPercentage,
  formatMultiplier,
  validateUrgencyContext,
  URGENCY_MULTIPLIER_EXAMPLES,
} from './utils/urgencyCalculations';

export {
  calculateTimeRemaining,
  differenceInDays,
  differenceInHours,
  formatTimeRemaining,
  formatCountdownText,
  formatProjectionTimeline,
  formatDate,
  formatTime,
  formatRelativeTime,
  addDays,
  addHours,
  isPast,
  isToday,
  isTomorrow,
  startOfDay,
  endOfDay,
  parseISODate,
  toISOString,
  getUrgencyPhase,
} from './utils/dateFormatting';

// Types
export type {
  UrgencyContext,
  UrgencyPricing,
  PriceProjection,
  UrgencyLevel,
  UrgencyMetadata,
  PriceAlert,
  PricingParameters,
  CountdownConfig,
  UrgencyVariant,
  TransactionType,
  UpdateInterval,
  PriceProgressionData,
  BudgetContext,
  UrgencyCountdownProps,
  CountdownTimerProps,
  TimeRemaining,
  PriceProgressionProps,
  UrgencyIndicatorProps,
  PriceIncreaseRateProps,
  ActionPromptProps,
} from './types';

export {
  DEFAULT_URGENCY_STEEPNESS,
  DEFAULT_LOOKBACK_WINDOW,
  DEFAULT_MARKET_MULTIPLIER,
  URGENCY_THRESHOLDS,
  UPDATE_INTERVALS,
  ANIMATION_DURATIONS,
} from './types';
