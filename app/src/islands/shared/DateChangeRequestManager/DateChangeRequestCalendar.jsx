/**
 * Date Change Request Calendar Component
 * Calendar UI showing lease dates with color coding for selection
 */

import { useState } from 'react';
import {
  generateCalendarDays,
  getPreviousMonth,
  getNextMonth,
  formatMonthYear,
  isPastDate,
  isSameDate,
  isDateInList,
  isDateInRange,
  getDayNames,
  getMonthNames,
} from './dateUtils.js';


/**
 * @param {Object} props
 * @param {(Date|string)[]} props.bookedDates - Array of currently booked dates (My Nights)
 * @param {(Date|string)[]} [props.roommateDates=[]] - Array of roommate's booked dates
 * @param {Date|string} props.reservationStart - Lease start date
 * @param {Date|string} props.reservationEnd - Lease end date
 * @param {'adding' | 'removing' | 'swapping' | null} props.requestType - Current request type
 * @param {Date|null} props.dateToAdd - Selected date to add
 * @param {Date|null} props.dateToRemove - Selected date to remove
 * @param {Function} props.onDateSelect - Handler for date selection
 * @param {Object[]} [props.existingRequests=[]] - Existing pending requests
 * @param {boolean} [props.disabled=false] - Whether calendar is disabled
 */
export default function DateChangeRequestCalendar({
  bookedDates = [],
  roommateDates = [],
  reservationStart,
  reservationEnd,
  requestType,
  dateToAdd,
  dateToRemove,
  onDateSelect,
  existingRequests = [],
  disabled = false,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Helper to check if a date is adjacent to any booked date
  const isAdjacent = (date) => {
    // Convert date to timestamp for easy comparison if needed, but isDateInList likely handles strings/dates
    // Assuming bookedDates are standardized.
    // Simple check: date + 1 or date - 1 is in bookedDates
    // We need to implement this logic.
    // Since we don't have addDays imported, let's just do simple day arithmetic.

    const d = new Date(date);
    const prev = new Date(d); prev.setDate(prev.getDate() - 1);
    const next = new Date(d); next.setDate(next.getDate() + 1);

    const isPrevBooked = isDateInList(prev, bookedDates);
    const isNextBooked = isDateInList(next, bookedDates);

    return isPrevBooked || isNextBooked;
  };

  // Get dates with pending add/remove requests
  const pendingAddDates = existingRequests
    .filter((r) => r.requestStatus === 'waiting_for_answer' && r.dateAdded)
    .map((r) => new Date(r.dateAdded));

  const pendingRemoveDates = existingRequests
    .filter((r) => r.requestStatus === 'waiting_for_answer' && r.dateRemoved)
    .map((r) => new Date(r.dateRemoved));

  /**
   * Determine the status/color of a date cell
   */
  const getDateStatus = (date) => {
    // Selected for current request
    if (dateToAdd && isSameDate(date, dateToAdd)) {
      return 'selected-add';
    }
    if (dateToRemove && isSameDate(date, dateToRemove)) {
      return 'selected-remove';
    }

    // Pending requests
    if (isDateInList(date, pendingAddDates)) {
      return 'pending-add';
    }
    if (isDateInList(date, pendingRemoveDates)) {
      return 'pending-remove';
    }

    // Booked dates (part of current lease)
    if (isDateInList(date, bookedDates)) {
      return 'booked';
    }

    // Roommate's dates (Available to request)
    if (isDateInList(date, roommateDates)) {
      if (isAdjacent(date)) {
        return 'adjacent'; // Prioritized
      }
      return 'available'; // Standard roommate night
    }

    // Within reservation period but not booked by anyone (or blocked)
    // If not in bookedDates and not in roommateDates, treat as blocked or available?
    // Spec says: "Roommate's Nights" and "Host-Blocked".
    // If we only have bookedDates and roommateDates, any other date in range is likely blocked or unassigned.
    // Let's assume blocked for now as we don't have explicit available-from-host logic here.
    if (reservationStart && reservationEnd && isDateInRange(date, reservationStart, reservationEnd)) {
      return 'blocked';
    }

    // Outside reservation period
    return 'outside';
  };

  /**
   * Check if a date can be selected based on request type
   */
  const isDateSelectable = (date) => {
    if (disabled || isPastDate(date)) return false;

    const status = getDateStatus(date);

    switch (requestType) {
      case 'adding':
        // Can add adjacent or available (roommate) nights
        return status === 'adjacent' || status === 'available';

      case 'removing':
        // Can only remove booked dates
        return status === 'booked';

      case 'swapping':
        if (!dateToRemove) {
          // First: select date to remove
          return status === 'booked';
        } else {
          // Second: select date to add
          return status === 'adjacent' || status === 'available';
        }

      default:
        return false;
    }
  };

  /**
   * Handle date click
   */
  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return;

    const status = getDateStatus(date);

    switch (requestType) {
      case 'adding':
        onDateSelect(date, 'add');
        break;

      case 'removing':
        onDateSelect(date, 'remove');
        break;

      case 'swapping':
        if (!dateToRemove) {
          // First click: select date to remove
          onDateSelect(date, 'remove');
        } else {
          // Second click: select date to add
          onDateSelect(date, 'add');
        }
        break;
    }
  };

  /**
   * Get CSS classes for a date cell
   */
  const getDateClasses = (date) => {
    const classes = ['dcr-calendar-date'];
    const status = getDateStatus(date);

    // Status-based class
    if (status === 'adjacent') {
      classes.push('dcr-date-adjacent');
    } else {
      classes.push(`dcr-date-${status}`);
    }

    if (isPastDate(date)) {
      classes.push('dcr-date-past');
    }

    if (isDateSelectable(date)) {
      classes.push('dcr-date-selectable');
    }

    return classes.join(' ');
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const goToNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  // Generate calendar days
  const calendarDays = generateCalendarDays(currentMonth);

  return (
    <div className="dcr-calendar">
      {/* Calendar Header */}
      <div className="dcr-calendar-header">
        <button
          className="dcr-calendar-nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="dcr-calendar-month">
          <select
            value={currentMonth.getMonth()}
            onChange={(e) =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1)
              )
            }
            className="dcr-month-select"
            aria-label="Select month"
          >
            {getMonthNames().map((month, i) => (
              <option key={i} value={i}>
                {month}
              </option>
            ))}
          </select>
          <span className="dcr-calendar-year">{currentMonth.getFullYear()}</span>
        </div>
        <button
          className="dcr-calendar-nav-btn"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Day Names Header */}
      <div className="dcr-calendar-weekdays">
        {getDayNames().map((day) => (
          <div key={day} className="dcr-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="dcr-calendar-grid">
        {calendarDays.map((date, index) => (
          <div key={index} className="dcr-calendar-cell">
            {date && (
              <button
                className={getDateClasses(date)}
                onClick={() => handleDateClick(date)}
                disabled={!isDateSelectable(date)}
                aria-label={date.toDateString()}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="dcr-calendar-legend">
        <div className="dcr-legend-item">
          <span className="dcr-legend-dot dcr-legend-booked"></span>
          <span>My Night</span>
        </div>
        <div className="dcr-legend-item">
          <span className="dcr-legend-dot dcr-legend-adjacent"></span>
          <span>Recommended Add</span>
        </div>
        <div className="dcr-legend-item">
          <span className="dcr-legend-dot dcr-legend-available"></span>
          <span>Roommate Night</span>
        </div>
        <div className="dcr-legend-item">
          <span className="dcr-legend-dot dcr-legend-blocked"></span>
          <span>Blocked</span>
        </div>
      </div>

      {/* Instructions based on request type */}
      {requestType && (
        <div className="dcr-calendar-instructions">
          {requestType === 'adding' && (
            <p>Select a recommended night (blue dashed) to add it to your stay.</p>
          )}
          {requestType === 'removing' && (
            <p>Select one of your nights (green) to offer back to your roommate.</p>
          )}
          {requestType === 'swapping' && !dateToRemove && (
            <p>Select one of your nights (green) to give up.</p>
          )}
          {requestType === 'swapping' && dateToRemove && !dateToAdd && (
            <p>Now select a night to receive.</p>
          )}
        </div>
      )}
    </div>
  );
}
