/**
 * Date manipulation utilities for ScheduleDashboard
 * @module helpers/dateHelpers
 */

/**
 * Convert Date to YYYY-MM-DD string
 * @param {Date|string|null} date - Date to convert
 * @returns {string|null} ISO date string or null
 */
export function toDateString(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert array of Dates to array of date strings
 * @param {Array<Date|string>} dates - Dates to convert
 * @returns {string[]} Array of ISO date strings
 */
export function toDateStrings(dates) {
  if (!dates || !Array.isArray(dates)) return [];
  return dates.map(d => toDateString(d));
}
