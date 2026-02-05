/**
 * Shared formatting utilities for the Split Lease application.
 * @module lib/formatters
 */

/**
 * Format a number as USD currency.
 *
 * @param {number} amount - The amount to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.showCents=false] - Whether to show cents
 * @param {string} [options.locale='en-US'] - Locale for formatting
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, { showCents = false, locale = 'en-US' } = {}) {
  const numericAmount = Number(amount ?? 0);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(safeAmount);
}

/**
 * Format a date into a short US format (e.g., "Feb 5").
 *
 * @param {string|Date|number} date - Date input
 * @returns {string} Formatted date string
 */
export function formatShortDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Safely parse a JSON array from a string or return empty array.
 *
 * @param {string|Array} value - The value to parse
 * @returns {Array} Parsed array or empty array
 */
export function safeParseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Calculate nightly rate from weekly compensation.
 */
export function calculateNightlyRate(weeklyComp, nightCount) {
  if (!weeklyComp || nightCount === 0) return 0;
  return Math.round(weeklyComp / nightCount);
}
