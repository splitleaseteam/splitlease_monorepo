/**
 * Shared formatting utilities for the Split Lease application.
 * @module lib/formatters
 *
 * Re-exports consolidated formatting functions from lib/formatting/.
 * Only calculateNightlyRate is defined here (it's a calculation, not a formatter).
 */

// Re-export from canonical formatting modules
export { formatCurrency } from './formatting/formatCurrency.js';
export { formatShortDate } from './formatting/formatDates.js';
export { safeParseJsonArray } from './formatting/parseJsonArrayField.js';

/**
 * Calculate nightly rate from weekly compensation.
 */
export function calculateNightlyRate(weeklyComp, nightCount) {
  if (!weeklyComp || nightCount === 0) return 0;
  return Math.round(weeklyComp / nightCount);
}

/**
 * Alias for formatCurrency — convenience export for consumers
 * that use the name "formatPrice".
 */
export { formatCurrency as formatPrice } from './formatting/formatCurrency.js';
