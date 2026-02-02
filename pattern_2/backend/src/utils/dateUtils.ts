/**
 * Date Utilities for Urgency Pricing
 *
 * Production-ready date manipulation and calculation utilities
 * Handles time zone conversions, date differences, and formatting
 */

import { URGENCY_CONSTANTS } from '../types/urgency.types';

export class DateUtils {
  /**
   * Calculate days between two dates
   *
   * @param futureDate - Future date
   * @param currentDate - Current date
   * @returns Number of days (rounded up)
   */
  static calculateDaysUntil(futureDate: Date, currentDate: Date): number {
    const diffMs = futureDate.getTime() - currentDate.getTime();
    const diffDays = diffMs / URGENCY_CONSTANTS.MILLISECONDS_PER_DAY;
    return Math.ceil(diffDays);
  }

  /**
   * Calculate hours between two dates
   *
   * @param futureDate - Future date
   * @param currentDate - Current date
   * @returns Number of hours (rounded up)
   */
  static calculateHoursUntil(futureDate: Date, currentDate: Date): number {
    const diffMs = futureDate.getTime() - currentDate.getTime();
    const diffHours = diffMs / URGENCY_CONSTANTS.MILLISECONDS_PER_HOUR;
    return Math.ceil(diffHours);
  }

  /**
   * Calculate minutes between two dates
   *
   * @param futureDate - Future date
   * @param currentDate - Current date
   * @returns Number of minutes (rounded up)
   */
  static calculateMinutesUntil(futureDate: Date, currentDate: Date): number {
    const diffMs = futureDate.getTime() - currentDate.getTime();
    const diffMinutes = diffMs / 60000;
    return Math.ceil(diffMinutes);
  }

  /**
   * Parse date from string or Date object
   *
   * @param date - Date string or Date object
   * @returns Date object
   * @throws Error if date is invalid
   */
  static parseDate(date: Date | string): Date {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
      }
      return date;
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date string: ${date}`);
      }
      return parsed;
    }

    throw new Error('Date must be a Date object or ISO string');
  }

  /**
   * Format date to ISO string (UTC)
   *
   * @param date - Date to format
   * @returns ISO 8601 date string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Format date to readable string
   *
   * @param date - Date to format
   * @returns Formatted date string (e.g., "Jan 28, 2026")
   */
  static toReadableString(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format date and time to readable string
   *
   * @param date - Date to format
   * @returns Formatted date/time string (e.g., "Jan 28, 2026 3:45 PM")
   */
  static toReadableDateTimeString(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Check if date is in the future
   *
   * @param date - Date to check
   * @param referenceDate - Reference date (default: now)
   * @returns True if date is in the future
   */
  static isFutureDate(date: Date, referenceDate: Date = new Date()): boolean {
    return date.getTime() > referenceDate.getTime();
  }

  /**
   * Check if date is today
   *
   * @param date - Date to check
   * @returns True if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Check if date is tomorrow
   *
   * @param date - Date to check
   * @returns True if date is tomorrow
   */
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  }

  /**
   * Add days to a date
   *
   * @param date - Base date
   * @param days - Number of days to add
   * @returns New date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add hours to a date
   *
   * @param date - Base date
   * @param hours - Number of hours to add
   * @returns New date
   */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Add minutes to a date
   *
   * @param date - Base date
   * @param minutes - Number of minutes to add
   * @returns New date
   */
  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Get start of day (midnight)
   *
   * @param date - Date
   * @returns Date at 00:00:00
   */
  static getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day (23:59:59.999)
   *
   * @param date - Date
   * @returns Date at 23:59:59.999
   */
  static getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get day of week (0 = Sunday, 6 = Saturday)
   *
   * @param date - Date
   * @returns Day of week (0-6)
   */
  static getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * Check if date is a weekend
   *
   * @param date - Date
   * @returns True if Saturday or Sunday
   */
  static isWeekend(date: Date): boolean {
    const day = this.getDayOfWeek(date);
    return day === 0 || day === 6;
  }

  /**
   * Get day of week name
   *
   * @param date - Date
   * @returns Day name (e.g., "Monday")
   */
  static getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  /**
   * Get month name
   *
   * @param date - Date
   * @returns Month name (e.g., "January")
   */
  static getMonthName(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long' });
  }

  /**
   * Format duration from milliseconds
   *
   * @param ms - Milliseconds
   * @returns Formatted duration (e.g., "2h 30m")
   */
  static formatDuration(ms: number): string {
    const hours = Math.floor(ms / URGENCY_CONSTANTS.MILLISECONDS_PER_HOUR);
    const minutes = Math.floor(
      (ms % URGENCY_CONSTANTS.MILLISECONDS_PER_HOUR) / 60000
    );

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Format time remaining (human-readable)
   *
   * @param futureDate - Future date
   * @param currentDate - Current date
   * @returns Formatted time remaining (e.g., "2 days", "5 hours")
   */
  static formatTimeRemaining(futureDate: Date, currentDate: Date): string {
    const days = this.calculateDaysUntil(futureDate, currentDate);
    const hours = this.calculateHoursUntil(futureDate, currentDate);

    if (days > 1) {
      return `${days} days`;
    } else if (days === 1) {
      return '1 day';
    } else if (hours > 1) {
      return `${hours} hours`;
    } else if (hours === 1) {
      return '1 hour';
    } else {
      const minutes = this.calculateMinutesUntil(futureDate, currentDate);
      return minutes > 1 ? `${minutes} minutes` : '1 minute';
    }
  }

  /**
   * Convert timezone
   *
   * @param date - Date to convert
   * @param timezone - IANA timezone (e.g., "America/New_York")
   * @returns Date in specified timezone
   */
  static toTimezone(date: Date, timezone: string): Date {
    const dateString = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(dateString);
  }

  /**
   * Get current timestamp
   *
   * @returns Current timestamp in milliseconds
   */
  static now(): number {
    return Date.now();
  }

  /**
   * Get current date
   *
   * @returns Current date
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Clone date
   *
   * @param date - Date to clone
   * @returns Cloned date
   */
  static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}
