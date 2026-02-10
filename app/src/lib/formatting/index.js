/**
 * Consolidated formatting utilities barrel export.
 *
 * This module re-exports all formatting functions from:
 *   - formatCurrency.js (currency formatting)
 *   - formatDates.js (date/datetime/range formatting)
 *   - formatUserDisplayName.js (host name + user display name)
 *   - parseJsonArrayField.js (JSON array parsing)
 *
 * @module lib/formatting
 */

// Currency
export { formatCurrency } from './formatCurrency.js';

// Dates
export {
  formatDateDisplay,
  formatDateTimeDisplay,
  formatDateRange,
  formatShortDate
} from './formatDates.js';

// User display names
export {
  formatHostName,
  processUserDisplayName
} from './formatUserDisplayName.js';

// JSON array parsing
export {
  parseJsonArrayFieldOptional,
  safeParseJsonArray
} from './parseJsonArrayField.js';
