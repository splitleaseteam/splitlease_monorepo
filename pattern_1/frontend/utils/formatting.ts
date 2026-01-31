/**
 * Formatting Utilities - Pattern 1: Personalized Defaults
 *
 * Currency, date, and text formatting functions.
 *
 * @module utils/formatting
 */

/**
 * Format currency in cents to dollars with symbol
 *
 * @param cents - Amount in cents
 * @param includeSymbol - Whether to include dollar sign
 * @returns Formatted currency string
 */
export function formatCurrency(cents: number, includeSymbol = true): string {
  const dollars = cents / 100;
  const formatted = dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format date for display
 *
 * @param date - Date to format
 * @param format - Format style (short, medium, long)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' },
  }[format];

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format confidence percentage
 *
 * @param confidence - Confidence score (0-1)
 * @returns Formatted percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Format urgency multiplier for display
 *
 * @param multiplier - Urgency multiplier (e.g., 1.5)
 * @returns Formatted string (e.g., "1.5x")
 */
export function formatUrgencyMultiplier(multiplier: number): string {
  if (multiplier === 1.0) return 'No urgency premium';
  return `${multiplier.toFixed(1)}x urgency premium`;
}

/**
 * Format price difference
 *
 * @param difference - Price difference in cents
 * @returns Formatted string with sign
 */
export function formatPriceDifference(difference: number): string {
  const sign = difference >= 0 ? '+' : '';
  return `${sign}${formatCurrency(difference)}`;
}

/**
 * Format savings amount
 *
 * @param savings - Savings amount in cents
 * @returns Formatted string
 */
export function formatSavings(savings: number): string {
  if (savings <= 0) return 'No savings';
  return `Save ${formatCurrency(savings)}`;
}

/**
 * Pluralize word based on count
 *
 * @param count - Count for pluralization
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Pluralized string
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? singular : pluralForm;
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format days until check-in
 *
 * @param days - Number of days
 * @returns Formatted string
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return 'Past';
  return `${days} ${pluralize(days, 'day')}`;
}

/**
 * Format response time in hours
 *
 * @param hours - Response time in hours
 * @returns Formatted string
 */
export function formatResponseTime(hours: number): string {
  if (hours < 1) return 'Less than 1 hour';
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} ${pluralize(days, 'day')}`;
}
