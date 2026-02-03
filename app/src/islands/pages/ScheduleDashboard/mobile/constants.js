/**
 * Mobile Schedule Dashboard Constants
 *
 * Shared constants for mobile dashboard components.
 */

/**
 * Bottom sheet type identifiers
 * Used to determine which content to render in the bottom sheet
 */
export const SHEET_TYPES = {
  BUYOUT: 'buyout',
  SWAP: 'swap',
  SHARE: 'share',
  COUNTER: 'counter',
  CONFIRM: 'confirm',
  DAY_DETAILS: 'day_details',
  TRANSACTION_DETAILS: 'transaction_details'
};

/**
 * Navigation tab identifiers
 */
export const TAB_IDS = {
  CALENDAR: 'calendar',
  CHAT: 'chat',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings'
};

/**
 * Day status identifiers for calendar cells
 */
export const DAY_STATUS = {
  MINE: 'mine',
  ROOMMATE: 'roommate',
  PENDING: 'pending',
  SHARED: 'shared',
  BLOCKED: 'blocked'
};

/**
 * Bottom sheet height modes
 */
export const SHEET_HEIGHTS = {
  AUTO: 'auto',
  HALF: 'half',
  FULL: 'full'
};

/**
 * Animation durations (ms)
 */
export const ANIMATION = {
  SHEET_OPEN: 300,
  SHEET_CLOSE: 200,
  SWIPE_FEEDBACK: 250,
  TAB_TRANSITION: 200
};

/**
 * Touch gesture thresholds (px)
 */
export const GESTURES = {
  SWIPE_THRESHOLD: 50,
  DISMISS_THRESHOLD: 100
};
