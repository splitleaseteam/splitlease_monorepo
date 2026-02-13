/**
 * Utility functions for GuestEditingProposalModal
 */

import { formatCurrency as _formatCurrency } from '../../../lib/formatting/formatCurrency.js'
import { AVG_DAYS_PER_MONTH } from './constants.js'

export const formatCurrency = (value) => _formatCurrency(value, { showCents: true });

export function formatDateFull(date) {
  if (!date || !(date instanceof Date)) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatDateShort(date) {
  if (!date || !(date instanceof Date)) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function formatDate(date, isSmallScreen = false) {
  return isSmallScreen ? formatDateShort(date) : formatDateFull(date)
}

export function calculateActualWeeksUsed(weeksReservationSpanNumber, weekSelectionPeriod) {
  if (!weekSelectionPeriod || weekSelectionPeriod === 0) return 0
  return Math.ceil(weeksReservationSpanNumber / weekSelectionPeriod)
}

export function calculateNightsReserved(
  rentalType,
  weeksReservationSpanNumber,
  weekSelectionPeriod,
  nightsSelectedCount,
  reservationSpan
) {
  switch (rentalType) {
    case 'Nightly':
      const actualWeeks = calculateActualWeeksUsed(weeksReservationSpanNumber, weekSelectionPeriod)
      return actualWeeks * nightsSelectedCount
    case 'Weekly':
      return calculateActualWeeksUsed(weeksReservationSpanNumber, weekSelectionPeriod)
    case 'Monthly':
      if (reservationSpan?.type === 'other') {
        const monthsFromWeeks = (weeksReservationSpanNumber * 7) / AVG_DAYS_PER_MONTH
        return monthsFromWeeks.toFixed(2)
      }
      return reservationSpan?.months?.toFixed(2) || '0.00'
    default:
      return 0
  }
}

export function isUserGuest(userType) {
  return userType === 'guest' || userType === 'A Guest (I would like to rent a space)'
}

export function getCompensationLabel(rentalType) {
  switch (rentalType) {
    case 'Nightly': return 'Compensation /night'
    case 'Weekly': return 'Compensation /Week'
    case 'Monthly': return 'Compensation /31 days'
    default: return 'Compensation /night'
  }
}

export function getReservedLabel(rentalType) {
  switch (rentalType) {
    case 'Nightly': return 'Nights reserved'
    case 'Weekly': return 'Weeks reserved'
    case 'Monthly': return 'Months reserved'
    default: return 'Nights reserved'
  }
}

export function get4WeekPriceLabel(rentalType) {
  switch (rentalType) {
    case 'Weekly': return 'Price per 4 calendar weeks'
    default: return 'Price per 4 weeks'
  }
}
