/**
 * Date Utilities
 *
 * Pure functions for date manipulation and calculation
 * Used for urgency pricing time calculations
 */

import { URGENCY_CONSTANTS } from '../types/urgency.types.ts';

/**
 * Get day name from date
 *
 * @param date - Date object
 * @returns Day name (lowercase)
 */
export const getDayName = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Calculate days out from current date to target date (UTC-based)
 *
 * CRITICAL: Uses UTC to avoid timezone bugs
 *
 * @param targetDate - Target check-in date
 * @param currentDate - Current date
 * @returns Days until check-in (0 or positive)
 */
export const calculateDaysOut = (targetDate: Date, currentDate: Date): number => {
  // Force UTC to avoid timezone bugs
  const targetUTC = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  );
  const currentUTC = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  );

  const diffMs = targetUTC - currentUTC;
  const diffDays = Math.floor(diffMs / URGENCY_CONSTANTS.MILLISECONDS_PER_DAY);

  return Math.max(0, diffDays);
};

/**
 * Calculate hours out from current date to target date
 *
 * @param targetDate - Target check-in date
 * @param currentDate - Current date
 * @returns Hours until check-in (0 or positive)
 */
export const calculateHoursOut = (targetDate: Date, currentDate: Date): number => {
  const diffMs = targetDate.getTime() - currentDate.getTime();
  const diffHours = Math.floor(diffMs / URGENCY_CONSTANTS.MILLISECONDS_PER_HOUR);

  return Math.max(0, diffHours);
};

/**
 * Parse ISO date string to Date object
 *
 * @param dateString - ISO date string
 * @returns Date object
 */
export const parseISODate = (dateString: string): Date => {
  const parsed = new Date(dateString);

  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return parsed;
};

/**
 * Format date to YYYY-MM-DD
 *
 * @param date - Date object
 * @returns YYYY-MM-DD string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
