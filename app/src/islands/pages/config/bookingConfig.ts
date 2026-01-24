/**
 * Booking Widget Configuration
 *
 * Centralized configuration for all booking-related constants and options.
 * This file extracts all magic numbers and hardcoded values to improve
 * maintainability and enable easy customization.
 *
 * @module config/bookingConfig
 * @architecture Configuration Object Pattern
 */

/**
 * Reservation Span Option
 */
interface ReservationSpanOption {
  value: number;
  label: string;
  description: string;
}

/**
 * Move-in Date Configuration
 */
export const MOVE_IN_CONFIG = {
  /**
   * Minimum number of days from today that a guest can select as move-in date
   * @default 14
   * @rationale Gives hosts adequate notice for preparation
   */
  minimumDaysFromToday: 14 as const,

  /**
   * Default flexibility option for move-in date
   * @default 'exact'
   */
  defaultFlexibility: 'exact' as 'exact' | 'flexible',

  /**
   * Maximum flexibility window in days (when flexibility enabled)
   * @default 7
   */
  maxFlexibilityDays: 7 as const
} as const;

/**
 * Reservation Span Configuration
 */
export const RESERVATION_SPAN_CONFIG = {
  /**
   * Default reservation span in weeks
   * @default 13
   */
  default: 13 as const,

  /**
   * Minimum allowed reservation span
   * @default 13
   */
  min: 13 as const,

  /**
   * Maximum allowed reservation span
   * @default 52
   */
  max: 52 as const,

  /**
   * Available reservation span options for dropdown
   */
  options: [
    {
      value: 13,
      label: '13 weeks (3 months)',
      description: 'Short-term stay, ideal for trial periods'
    },
    {
      value: 20,
      label: '20 weeks (5 months)',
      description: 'Medium-term stay, common for travel nurses'
    },
    {
      value: 26,
      label: '26 weeks (6 months)',
      description: 'Half year, typical corporate housing duration'
    },
    {
      value: 52,
      label: '52 weeks (1 year)',
      description: 'Full year commitment, best value'
    }
  ] as readonly ReservationSpanOption[]
} as const;

/**
 * Responsive Design Breakpoints
 */
export const RESPONSIVE_CONFIG = {
  /**
   * Mobile breakpoint in pixels
   * @default 900
   */
  mobileBreakpoint: 900 as const,

  /**
   * Tablet breakpoint in pixels
   * @default 1200
   */
  tabletBreakpoint: 1200 as const,

  /**
   * Media query for mobile detection
   */
  get mobileMediaQuery(): string {
    return `(max-width: ${this.mobileBreakpoint}px)`;
  }
};

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  /**
   * Whether to enforce strict contiguous day selection by default
   * @default false
   */
  strictModeDefault: false as const,

  /**
   * Minimum number of nights that must be selected
   * @default 1
   */
  minimumNightsRequired: 1 as const,

  /**
   * Maximum gap allowed between selected days in non-strict mode
   * @default 2
   */
  maxGapBetweenDays: 2 as const
} as const;

/**
 * Feature Flags Configuration
 */
export const FEATURE_FLAGS = {
  /**
   * Enable experimental smart pricing suggestions
   * @default false
   * @env VITE_ENABLE_SMART_PRICING
   */
  get enableSmartPricing(): boolean {
    return import.meta.env.VITE_ENABLE_SMART_PRICING === 'true';
  },

  /**
   * Enable AI-powered move-in date recommendations
   * @default false
   * @env VITE_ENABLE_SMART_DATES
   */
  get enableSmartDates(): boolean {
    return import.meta.env.VITE_ENABLE_SMART_DATES === 'true';
  },

  /**
   * Enable analytics tracking
   * @default true
   * @env VITE_ENABLE_ANALYTICS
   */
  get enableAnalytics(): boolean {
    return import.meta.env.VITE_ENABLE_ANALYTICS !== 'false';
  }
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  /**
   * Lazy loading margin in pixels (load when section is this close to viewport)
   * @default '200px'
   */
  lazyLoadMargin: '200px' as const,

  /**
   * Default zoom level for listing map
   * @default 14
   */
  defaultZoom: 14 as const,

  /**
   * Whether to auto-zoom to listing location on first load
   * @default true
   */
  autoZoomOnLoad: true as const
} as const;

/**
 * Modal Configuration
 */
export const MODAL_CONFIG = {
  /**
   * Whether to prevent body scroll when modal is open
   * @default true
   */
  preventBodyScroll: true as const,

  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration: 300 as const,

  /**
   * Whether to close modal on Escape key press
   * @default true
   */
  closeOnEscape: true as const,

  /**
   * Whether to close modal on backdrop click
   * @default true
   */
  closeOnBackdropClick: true as const
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  /**
   * Time-to-live for listing data cache in milliseconds
   * @default 300000 (5 minutes)
   */
  listingCacheTTL: 5 * 60 * 1000 as const,

  /**
   * Time-to-live for user data cache in milliseconds
   * @default 60000 (1 minute)
   */
  userCacheTTL: 60 * 1000 as const,

  /**
   * Whether to use cached data as fallback when fetch fails
   * @default true
   */
  useCacheAsFallback: true as const
} as const;

/**
 * Full Configuration Return Type
 */
interface FullConfig {
  moveIn: typeof MOVE_IN_CONFIG;
  reservationSpan: typeof RESERVATION_SPAN_CONFIG;
  responsive: typeof RESPONSIVE_CONFIG;
  validation: typeof VALIDATION_CONFIG;
  featureFlags: {
    enableSmartPricing: boolean;
    enableSmartDates: boolean;
    enableAnalytics: boolean;
  };
  map: typeof MAP_CONFIG;
  modal: typeof MODAL_CONFIG;
  cache: typeof CACHE_CONFIG;
}

/**
 * Get complete booking configuration object
 * Useful for debugging or passing to analytics
 *
 * @returns Complete configuration object
 */
export function getFullConfig(): FullConfig {
  return {
    moveIn: MOVE_IN_CONFIG,
    reservationSpan: RESERVATION_SPAN_CONFIG,
    responsive: RESPONSIVE_CONFIG,
    validation: VALIDATION_CONFIG,
    featureFlags: {
      enableSmartPricing: FEATURE_FLAGS.enableSmartPricing,
      enableSmartDates: FEATURE_FLAGS.enableSmartDates,
      enableAnalytics: FEATURE_FLAGS.enableAnalytics
    },
    map: MAP_CONFIG,
    modal: MODAL_CONFIG,
    cache: CACHE_CONFIG
  };
}
