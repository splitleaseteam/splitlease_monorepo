/**
 * Currency formatting utility.
 *
 * Consolidated from:
 *   - lib/formatters.js (formatCurrency)
 *
 * @module lib/formatting/formatCurrency
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

export default formatCurrency;
