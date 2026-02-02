/**
 * Date Formatting Utilities for Date Change Request Emails
 * Split Lease - Supabase Edge Functions
 *
 * Provides date formatting functions for email templates.
 * Handles single dates, date ranges, and multiple dates.
 *
 * FP PRINCIPLES:
 * - Pure functions with no side effects
 * - Immutable data structures
 * - Explicit dependencies
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Format options for date display
 */
export interface DateFormatOptions {
  includeWeekday?: boolean;
  includeYear?: boolean;
  format?: 'long' | 'short' | 'abbreviated';
}

// ─────────────────────────────────────────────────────────────
// Single Date Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format a single date for display in emails
 * Example outputs:
 *   - "Friday, January 30, 2026" (long, with weekday and year)
 *   - "Jan 30, 2026" (abbreviated)
 *   - "1/30/2026" (short)
 *
 * @param dateStr - ISO date string or null
 * @param options - Formatting options
 * @returns Formatted date string or empty string if null
 */
export function formatEmailDate(
  dateStr: string | null,
  options: DateFormatOptions = {}
): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    console.warn('[dateFormatters] Invalid date string:', dateStr);
    return '';
  }

  const {
    includeWeekday = false,
    includeYear = true,
    format = 'long'
  } = options;

  // Build format options based on parameters
  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: includeWeekday ? 'long' : undefined,
    year: includeYear ? 'numeric' : undefined,
    month: format === 'short' ? 'numeric' : format === 'abbreviated' ? 'short' : 'long',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', formatOptions);
}

/**
 * Format a date in short format for compact display
 * Example: "Jan 30" or "1/30"
 */
export function formatShortDate(dateStr: string | null, useNumeric: boolean = false): string {
  return formatEmailDate(dateStr, {
    includeWeekday: false,
    includeYear: false,
    format: useNumeric ? 'short' : 'abbreviated'
  });
}

// ─────────────────────────────────────────────────────────────
// Date Range Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format a date range for display in emails
 * Examples:
 *   - "Jan 1-5, 2026" (same month)
 *   - "Jan 1 - Feb 3, 2026" (different months)
 *   - "Dec 28, 2025 - Jan 3, 2026" (different years)
 *
 * @param checkIn - Check-in date string
 * @param checkOut - Check-out date string
 * @returns Formatted date range string
 */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('[dateFormatters] Invalid date range:', { checkIn, checkOut });
    return '';
  }

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  // Format components
  const startFormat = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const endFormat = end.toLocaleDateString('en-US', {
    month: startMonth === endMonth ? undefined : 'short',
    day: 'numeric',
    year: startYear === endYear ? undefined : 'numeric'
  });

  // Build range string
  let range = `${startFormat}`;

  if (endFormat) {
    range += ` - ${endFormat}`;
  }

  // Add year if not included in end format
  if (startYear === endYear && !endFormat.includes(String(startYear))) {
    range += `, ${startYear}`;
  }

  return range;
}

/**
 * Format original booking dates from a lease
 * @param checkIn - Lease check-in date
 * @param checkOut - Lease check-out date
 * @returns Formatted original dates string
 */
export function formatOriginalDates(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return 'Not available';
  return formatDateRange(checkIn, checkOut);
}

// ─────────────────────────────────────────────────────────────
// Multiple Dates Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Format multiple dates for display
 * Examples:
 *   - "Jan 5, 2026" (single date)
 *   - "Jan 5, 2026" (non-consecutive dates, shows first)
 *   - "Jan 5-7, 2026" (consecutive dates)
 *
 * @param dates - Array of ISO date strings
 * @returns Formatted dates string
 */
export function formatMultipleDates(dates: (string | null)[]): string {
  const validDates = dates.filter(d => d !== null) as string[];

  if (validDates.length === 0) return '';
  if (validDates.length === 1) return formatEmailDate(validDates[0], { includeWeekday: false });

  // Sort dates chronologically
  const sorted = validDates
    .map(d => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  // Check if dates are consecutive (24 hours apart)
  const areConsecutive = sorted.every((date, i) => {
    if (i === 0) return true;
    const prev = sorted[i - 1];
    const diffDays = (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays === 1;
  });

  if (areConsecutive) {
    // Show as range: "Jan 5-7, 2026"
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const firstFormat = first.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    const lastFormat = last.toLocaleDateString('en-US', {
      month: first.getMonth() === last.getMonth() ? undefined : 'short',
      day: 'numeric'
    });

    return `${firstFormat}-${lastFormat}, ${first.getFullYear()}`;
  }

  // Non-consecutive: show comma-separated
  return sorted
    .map(d => formatShortDate(d.toISOString()))
    .join(', ');
}

/**
 * Format dates to add for display
 * @param dateAdded - Single date or array of dates
 * @returns Formatted dates string
 */
export function formatDatesToAdd(dateAdded: string | string[] | null): string {
  if (!dateAdded) return '';

  if (Array.isArray(dateAdded)) {
    return formatMultipleDates(dateAdded);
  }

  return formatEmailDate(dateAdded, { includeWeekday: false });
}

/**
 * Format dates to remove for display
 * @param dateRemoved - Single date or array of dates
 * @returns Formatted dates string
 */
export function formatDatesToRemove(dateRemoved: string | string[] | null): string {
  if (!dateRemoved) return '';

  if (Array.isArray(dateRemoved)) {
    return formatMultipleDates(dateRemoved);
  }

  return formatEmailDate(dateRemoved, { includeWeekday: false });
}

// ─────────────────────────────────────────────────────────────
// Time to Expiry Formatting
// ─────────────────────────────────────────────────────────────

/**
 * Calculate and format time remaining until request expiry
 * Examples: "2 hours", "24 hours", "1 day"
 *
 * @param expirationDate - ISO datetime string of request expiration
 * @returns Human-readable time remaining string
 */
export function formatTimeToExpiry(expirationDate: string): string {
  const now = new Date();
  const expiry = new Date(expirationDate);

  if (isNaN(expiry.getTime())) {
    console.warn('[dateFormatters] Invalid expiration date:', expirationDate);
    return '24 hours';
  }

  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  // Round to nearest hour for display
  const roundedHours = Math.max(1, Math.round(diffHours));
  return `${roundedHours} hour${roundedHours > 1 ? 's' : ''}`;
}

/**
 * Check if request is expiring soon (within 2 hours)
 * @param expirationDate - ISO datetime string of request expiration
 * @returns True if expiring within 2 hours
 */
export function isExpiringSoon(expirationDate: string): boolean {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Expiring soon if within 2 hours (but not expired)
  return diffHours > 0 && diffHours <= 2;
}

/**
 * Check if request has expired
 * @param expirationDate - ISO datetime string of request expiration
 * @returns True if request is expired
 */
export function isExpired(expirationDate: string): boolean {
  const now = new Date();
  const expiry = new Date(expirationDate);
  return expiry.getTime() < now.getTime();
}
