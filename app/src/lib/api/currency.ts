/**
 * Currency utility functions
 * Used by contract calculators for payment processing
 */

/**
 * Convert a currency string to a float
 * Handles formats like "$1,234.56", "1234.56", "$1234", etc.
 * @param value - Currency string to convert
 * @returns Parsed float value, or 0 if invalid
 */
export function convertCurrencyToFloat(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '').trim();
  
  if (cleaned === '' || cleaned === '-') {
    return 0;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Round down to 2 decimal places (for currency)
 * Uses Math.floor to always round down
 * @param value - Number to round
 * @returns Rounded value with max 2 decimal places
 */
export function roundDown(value: number): number {
  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }
  return Math.floor(value * 100) / 100;
}

/**
 * Format a number as USD currency string
 * @param value - Number to format
 * @returns Formatted string like "$1,234.56"
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
