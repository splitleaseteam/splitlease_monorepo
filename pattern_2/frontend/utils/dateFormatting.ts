/**
 * Pattern 2: Urgency Countdown - Date Formatting Utilities
 *
 * Production-ready date/time formatting and calculation utilities
 */

import { TimeRemaining } from '../types';

/**
 * Calculate time remaining until target date
 *
 * @param targetDate - Target date
 * @param currentDate - Current date (defaults to now)
 * @returns Time remaining breakdown
 */
export function calculateTimeRemaining(
  targetDate: Date,
  currentDate: Date = new Date()
): TimeRemaining {
  const totalMs = targetDate.getTime() - currentDate.getTime();

  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
    };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
}

/**
 * Calculate difference in days (ceiling)
 *
 * @param targetDate - Target date
 * @param currentDate - Current date
 * @returns Days until target (rounded up)
 */
export function differenceInDays(
  targetDate: Date,
  currentDate: Date = new Date()
): number {
  const diffMs = targetDate.getTime() - currentDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate difference in hours (ceiling)
 *
 * @param targetDate - Target date
 * @param currentDate - Current date
 * @returns Hours until target (rounded up)
 */
export function differenceInHours(
  targetDate: Date,
  currentDate: Date = new Date()
): number {
  const diffMs = targetDate.getTime() - currentDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

/**
 * Format time remaining as human-readable string
 *
 * @param remaining - Time remaining object
 * @param format - Display format
 * @returns Formatted string
 */
export function formatTimeRemaining(
  remaining: TimeRemaining,
  format: 'long' | 'short' | 'compact' = 'long'
): string {
  const { days, hours, minutes } = remaining;

  if (format === 'compact') {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  if (format === 'short') {
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // Long format
  if (days > 0) {
    const dayText = days === 1 ? 'day' : 'days';
    return `${days} ${dayText}`;
  }

  if (hours > 0) {
    const hourText = hours === 1 ? 'hour' : 'hours';
    return `${hours} ${hourText}`;
  }

  const minuteText = minutes === 1 ? 'minute' : 'minutes';
  return `${minutes} ${minuteText}`;
}

/**
 * Format countdown display text
 *
 * @param daysUntil - Days until check-in
 * @param hoursUntil - Hours until check-in
 * @returns Formatted countdown text
 */
export function formatCountdownText(
  daysUntil: number,
  hoursUntil: number
): string {
  if (daysUntil === 0 && hoursUntil <= 24) {
    if (hoursUntil === 1) {
      return '1 hour until check-in';
    }
    if (hoursUntil === 0) {
      return 'Check-in time!';
    }
    return `${hoursUntil} hours until check-in`;
  }

  if (daysUntil === 1) {
    return 'Check-in is tomorrow';
  }

  return `${daysUntil} days until check-in`;
}

/**
 * Format projection timeline text
 *
 * @param currentDays - Current days until check-in
 * @param projectionDays - Projection days out
 * @returns Formatted timeline text
 */
export function formatProjectionTimeline(
  currentDays: number,
  projectionDays: number
): string {
  const daysFromNow = currentDays - projectionDays;

  if (daysFromNow === 0) {
    return 'Today';
  }

  if (daysFromNow === 1) {
    return 'Tomorrow';
  }

  if (projectionDays === 1) {
    return 'Day before check-in';
  }

  return `In ${daysFromNow} days`;
}

/**
 * Format date for display
 *
 * @param date - Date to format
 * @param format - Display format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }[format];

  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time for display
 *
 * @param date - Date with time
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string
 */
export function formatTime(
  date: Date,
  includeSeconds: boolean = false
): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  };

  return date.toLocaleTimeString('en-US', options);
}

/**
 * Format relative time (e.g., "in 3 days", "tomorrow")
 *
 * @param targetDate - Target date
 * @param currentDate - Current date
 * @returns Relative time string
 */
export function formatRelativeTime(
  targetDate: Date,
  currentDate: Date = new Date()
): string {
  const days = differenceInDays(targetDate, currentDate);

  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days <= 7) return `in ${days} days`;
  if (days <= 14) return `in ${Math.floor(days / 7)} week${days > 7 ? 's' : ''}`;
  if (days <= 30) return `in ${Math.floor(days / 7)} weeks`;
  if (days <= 60) return `in ${Math.floor(days / 30)} month`;
  return `in ${Math.floor(days / 30)} months`;
}

/**
 * Add days to a date
 *
 * @param date - Starting date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add hours to a date
 *
 * @param date - Starting date
 * @param hours - Number of hours to add
 * @returns New date with hours added
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Check if date is in the past
 *
 * @param date - Date to check
 * @param currentDate - Current date
 * @returns True if date is in the past
 */
export function isPast(date: Date, currentDate: Date = new Date()): boolean {
  return date.getTime() < currentDate.getTime();
}

/**
 * Check if date is today
 *
 * @param date - Date to check
 * @param currentDate - Current date
 * @returns True if date is today
 */
export function isToday(date: Date, currentDate: Date = new Date()): boolean {
  return (
    date.getDate() === currentDate.getDate() &&
    date.getMonth() === currentDate.getMonth() &&
    date.getFullYear() === currentDate.getFullYear()
  );
}

/**
 * Check if date is tomorrow
 *
 * @param date - Date to check
 * @param currentDate - Current date
 * @returns True if date is tomorrow
 */
export function isTomorrow(
  date: Date,
  currentDate: Date = new Date()
): boolean {
  const tomorrow = addDays(currentDate, 1);
  return isToday(date, tomorrow);
}

/**
 * Get start of day
 *
 * @param date - Date to get start of
 * @returns Date at start of day (midnight)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 *
 * @param date - Date to get end of
 * @returns Date at end of day (23:59:59)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Parse ISO date string
 *
 * @param dateString - ISO date string
 * @returns Parsed date
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Format date to ISO string
 *
 * @param date - Date to format
 * @returns ISO date string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get urgency phase description based on time remaining
 *
 * @param daysUntil - Days until check-in
 * @returns Phase description
 */
export function getUrgencyPhase(daysUntil: number): string {
  if (daysUntil === 0) return 'Same day';
  if (daysUntil === 1) return 'Day before';
  if (daysUntil <= 3) return 'Critical window';
  if (daysUntil <= 7) return 'High urgency';
  if (daysUntil <= 14) return 'Moderate urgency';
  if (daysUntil <= 30) return 'Low urgency';
  return 'Planning phase';
}
