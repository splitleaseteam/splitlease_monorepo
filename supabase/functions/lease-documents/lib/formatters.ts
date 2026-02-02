/**
 * Formatters for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Provides date and currency formatting utilities.
 * Mirrors the Python implementation's formatting logic.
 */

// ================================================
// DATE PARSING
// ================================================

/**
 * Parse a date string in either MM/DD/YY or YYYY-MM-DD format.
 * Returns null if the date cannot be parsed.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }

  const trimmed = dateStr.trim();

  // Try MM/DD/YY format first
  const mmddyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mmddyyMatch) {
    const month = parseInt(mmddyyMatch[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(mmddyyMatch[2], 10);
    let year = parseInt(mmddyyMatch[3], 10);
    // Assume 2000s for two-digit years
    year = year < 50 ? 2000 + year : 1900 + year;
    const date = new Date(year, month, day);
    // Validate the date is valid
    if (date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }

  // Try YYYY-MM-DD format
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(year, month, day);
    if (date.getMonth() === month && date.getDate() === day) {
      return date;
    }
  }

  console.warn(`[formatters] Could not parse date: ${dateStr}`);
  return null;
}

// ================================================
// DATE FORMATTING
// ================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a date string to readable format: "January 20, 2026"
 * Input formats: "1/20/26" or "2026-01-20"
 * Returns empty string if date cannot be parsed.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return '';
  }

  const date = parseDate(dateStr);
  if (!date) {
    console.warn(`[formatters] formatDate failed for: ${dateStr}`);
    return '';
  }

  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

// ================================================
// CURRENCY FORMATTING
// ================================================

/**
 * Parse a currency string to a number.
 * Handles formats like: "1028.58", "$1,028.58", "1,028.58"
 * Returns null if parsing fails.
 */
export function parseCurrency(value: string | number): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  const cleaned = value
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .trim();

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) {
    console.warn(`[formatters] parseCurrency failed for: ${value}`);
    return null;
  }

  return parsed;
}

/**
 * Format a number as currency string: 1028.58 -> "$1,028.58"
 * Returns empty string if value is empty or invalid.
 */
export function formatCurrency(value: string | number): string {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const parsed = typeof value === 'number' ? value : parseCurrency(value);
  if (parsed === null) {
    return '';
  }

  // Format with comma as thousands separator
  return '$' + parsed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a number as currency string without $ symbol: 1028.58 -> "1028.58"
 * Used for template variables that expect raw numbers.
 */
export function formatCurrencyRaw(value: number): string {
  return value.toFixed(2);
}

// ================================================
// HOUSE RULES FORMATTING
// ================================================

/**
 * Format house rules as a bulleted list string.
 * Returns "N/A" if empty.
 *
 * Input can be:
 * - A string (possibly JSON array, newline-separated, or comma-separated)
 * - An array of strings
 */
export function formatHouseRules(houseRules: string | string[] | null | undefined): string {
  if (!houseRules) {
    return 'N/A';
  }

  let rulesList: string[];

  if (typeof houseRules === 'string') {
    // Check if it's a JSON array string
    if (houseRules.startsWith('[') && houseRules.endsWith(']')) {
      try {
        rulesList = JSON.parse(houseRules);
      } catch {
        // Treat as a single rule
        rulesList = [houseRules];
      }
    } else if (houseRules.includes('\n')) {
      // Split by newlines
      rulesList = houseRules.split('\n').filter(r => r.trim());
    } else if (houseRules.includes(',')) {
      // Split by commas
      rulesList = houseRules.split(',').filter(r => r.trim());
    } else {
      // Single rule
      rulesList = [houseRules];
    }
  } else {
    rulesList = houseRules;
  }

  // Filter empty entries
  rulesList = rulesList.filter(rule =>
    typeof rule === 'string' && rule.trim() !== ''
  );

  if (rulesList.length === 0) {
    return 'N/A';
  }

  // Format as bulleted list
  return rulesList
    .map(rule => `\u2022 ${rule.trim()}`)
    .join('\n');
}
