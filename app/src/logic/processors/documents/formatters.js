/**
 * Document Formatters
 *
 * Pure formatting functions for lease document fields.
 * These match the exact format requirements from the lease-documents edge function.
 *
 * @module logic/processors/documents/formatters
 */

/**
 * Format ISO date to MM/DD/YYYY for document display
 * @param {string|Date|null} isoDate - ISO timestamp or Date object
 * @returns {string} Formatted date string (MM/DD/YYYY) or empty string
 */
export function formatDateForDocument(isoDate) {
  if (!isoDate) return '';

  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

  // Validate date
  if (isNaN(date.getTime())) {
    console.warn('[formatDateForDocument] Invalid date:', isoDate);
    return '';
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Format ISO date to MM/DD/YY (short year) for document display
 * @param {string|Date|null} isoDate - ISO timestamp or Date object
 * @returns {string} Formatted date string (MM/DD/YY) or empty string
 */
export function formatDateShortYear(isoDate) {
  if (!isoDate) return '';

  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;

  if (isNaN(date.getTime())) {
    console.warn('[formatDateShortYear] Invalid date:', isoDate);
    return '';
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  return `${mm}/${dd}/${yy}`;
}

/**
 * Format number to currency string $X,XXX.XX
 * Uses locale formatting with comma separators.
 *
 * @param {number|string|null|undefined} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "$2,500.00")
 */
export function formatCurrency(amount) {
  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return '$0.00';
  }

  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numAmount)) {
    return '$0.00';
  }

  return `$${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format number to plain decimal string (no dollar sign)
 * Used for numeric fields that don't need currency symbol.
 *
 * @param {number|string|null|undefined} amount - Amount to format
 * @returns {string} Formatted decimal string (e.g., "2500.00")
 */
export function formatDecimal(amount) {
  if (amount === null || amount === undefined) {
    return '0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0.00';
  }

  return numAmount.toFixed(2);
}

/**
 * Get day name from date
 * @param {string|Date|null} date - Date to get day name from
 * @returns {string} Day name (e.g., "Monday") or empty string
 */
export function getDayName(date) {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[d.getDay()] || '';
}

/**
 * Format house rules array to comma-separated string
 * @param {Array<string|{name: string}>|null} rules - Array of rules or rule objects
 * @returns {string} Comma-separated string or default message
 */
export function formatHouseRules(rules) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return 'No additional restrictions';
  }

  return rules
    .map(rule => typeof rule === 'string' ? rule : (rule?.name || rule?.Name || ''))
    .filter(Boolean)
    .join(', ');
}

/**
 * Format house rules array to bulleted list
 * @param {Array<string|{name: string}>|null} rules - Array of rules or rule objects
 * @returns {string} Bulleted list string
 */
export function formatHouseRulesBulleted(rules) {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return 'No additional restrictions';
  }

  return rules
    .map(rule => typeof rule === 'string' ? rule : (rule?.name || rule?.Name || ''))
    .filter(Boolean)
    .map(rule => `- ${rule}`)
    .join('\n');
}

/**
 * Format full name from first/last name fields
 * @param {string|null} firstName - First name
 * @param {string|null} lastName - Last name
 * @param {string|null} fullName - Full name (fallback)
 * @returns {string} Combined full name or fallback
 */
export function formatFullName(firstName, lastName, fullName) {
  if (fullName) return fullName;

  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || '';
}

/**
 * Extract numeric amount from currency string
 * @param {string} currencyString - Currency string (e.g., "$2,500.00")
 * @returns {number} Numeric amount
 */
export function extractAmountFromCurrency(currencyString) {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  const amount = parseFloat(cleaned);

  return isNaN(amount) ? 0 : amount;
}

/**
 * Format phone number for display
 * @param {string|null} phone - Phone number
 * @returns {string} Formatted phone or empty string
 */
export function formatPhone(phone) {
  if (!phone) return '';

  // Return as-is if already formatted or non-US
  if (phone.includes('-') || phone.includes('(') || phone.startsWith('+')) {
    return phone;
  }

  // Format US numbers
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}
