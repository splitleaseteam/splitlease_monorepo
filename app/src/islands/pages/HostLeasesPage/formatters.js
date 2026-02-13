/**
 * Formatting utilities for Host Leases Page
 */

import { formatCurrency as _formatCurrency } from '../../../lib/formatting/formatCurrency.js';

/**
 * Format a number as currency (USD) with cents
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return _formatCurrency(amount, { showCents: true });
}

/**
 * Format a number as currency without cents (for display)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string without cents
 */
export function formatCurrencyWhole(amount) {
  return _formatCurrency(amount);
}

/**
 * Format a date as M/D/YY
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Format a date as full date (e.g., "Mar 28, 2025")
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date range as "Mon D - Mon D, YYYY"
 * @param {Date|string} start - Start date
 * @param {Date|string} end - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(start, end) {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

/**
 * Format a stay period as "Mon D - Mon D" (compact)
 * @param {string} checkIn - Check-in date
 * @param {string} lastNight - Last night date
 * @returns {string} Formatted period
 */
export function formatStayPeriod(checkIn, lastNight) {
  if (!checkIn || !lastNight) return '';
  const checkInDate = new Date(checkIn);
  const lastNightDate = new Date(lastNight);
  if (isNaN(checkInDate.getTime()) || isNaN(lastNightDate.getTime())) return '';

  const ciMonth = checkInDate.toLocaleDateString('en-US', { month: 'short' });
  const ciDay = checkInDate.getDate();
  const lnMonth = lastNightDate.toLocaleDateString('en-US', { month: 'short' });
  const lnDay = lastNightDate.getDate();

  if (ciMonth === lnMonth) {
    return `${ciMonth} ${ciDay} - ${lnDay}`;
  }
  return `${ciMonth} ${ciDay} - ${lnMonth} ${lnDay}`;
}

/**
 * Get status badge class based on lease status
 * @param {string} status - The lease status
 * @returns {string} CSS class name
 */
export function getLeaseStatusClass(status) {
  if (!status) return 'hl-status-badge';
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'hl-status-badge hl-status-active';
  }
  if (normalizedStatus === 'completed') {
    return 'hl-status-badge hl-status-completed';
  }
  if (normalizedStatus === 'cancelled') {
    return 'hl-status-badge hl-status-cancelled';
  }
  if (normalizedStatus.includes('pending')) {
    return 'hl-status-badge hl-status-pending';
  }
  return 'hl-status-badge';
}

/**
 * Get status badge class based on stay status
 * @param {string} status - The stay status
 * @returns {string} CSS class name
 */
export function getStayStatusClass(status) {
  if (!status) return 'hl-stay-status-badge';
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'upcoming') {
    return 'hl-stay-status-badge hl-stay-status-upcoming';
  }
  if (normalizedStatus === 'in progress') {
    return 'hl-stay-status-badge hl-stay-status-in-progress';
  }
  if (normalizedStatus === 'completed') {
    return 'hl-stay-status-badge hl-stay-status-completed';
  }
  if (normalizedStatus === 'cancelled') {
    return 'hl-stay-status-badge hl-stay-status-cancelled';
  }
  return 'hl-stay-status-badge';
}

/**
 * Get status badge class based on date change request status
 * @param {string} status - The request status
 * @returns {string} CSS class name
 */
export function getDateChangeStatusClass(status) {
  if (!status) return 'hl-dcr-status-badge';
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'waiting_for_answer') {
    return 'hl-dcr-status-badge hl-dcr-status-pending';
  }
  if (normalizedStatus === 'approved') {
    return 'hl-dcr-status-badge hl-dcr-status-accepted';
  }
  if (normalizedStatus === 'rejected') {
    return 'hl-dcr-status-badge hl-dcr-status-declined';
  }
  if (normalizedStatus === 'cancelled') {
    return 'hl-dcr-status-badge hl-dcr-status-cancelled';
  }
  return 'hl-dcr-status-badge';
}

/**
 * Format phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // Format as +X (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  // Return as-is if unknown format
  return phone;
}
