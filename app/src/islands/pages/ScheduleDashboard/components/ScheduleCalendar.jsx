/**
 * Schedule Calendar Component
 *
 * Monthly calendar view with color-coded nights:
 * - Green: User's booked nights
 * - White/Gray: Roommate's nights (available to buy out)
 * - Blue Dashed Border: Adjacent nights (recommended to buy)
 * - Yellow: Pending request
 * - Red strikethrough: Blocked/unavailable
 *
 * Click roommate's night to select for Buy Out Panel.
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// HELPERS
// ============================================================================

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Convert date to YYYY-MM-DD string for comparison
 */
function toDateString(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1, date2) {
  return toDateString(date1) === toDateString(date2);
}

/**
 * Check if a date is in an array of dates
 */
function isInDateArray(date, dateArray) {
  if (!dateArray || dateArray.length === 0) return false;
  const dateStr = toDateString(date);
  return dateArray.some(d => toDateString(d) === dateStr);
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week (0-6) for first day of month
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Find adjacent nights - nights immediately before or after user's stay blocks
 * A night is adjacent if it's immediately before/after a consecutive block of user's nights
 */
function findAdjacentNights(userNights, roommateNights) {
  if (!userNights || userNights.length === 0) return [];
  if (!roommateNights || roommateNights.length === 0) return [];

  const adjacent = new Set();

  // Convert to Date objects for easier manipulation
  const userDates = userNights.map(d => parseDate(d)).sort((a, b) => a - b);
  const roommateSet = new Set(roommateNights.map(d => toDateString(d)));

  // For each user night, check if the day before or after is roommate's night
  for (const userDate of userDates) {
    const dayBefore = toDateString(addDays(userDate, -1));
    const dayAfter = toDateString(addDays(userDate, 1));

    if (roommateSet.has(dayBefore)) {
      adjacent.add(dayBefore);
    }
    if (roommateSet.has(dayAfter)) {
      adjacent.add(dayAfter);
    }
  }

  return Array.from(adjacent);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduleCalendar({
  userNights = [],
  roommateNights = [],
  pendingNights = [],
  blockedNights = [],
  selectedNight,
  onNightSelect,
  onMonthChange,
  currentMonth: currentMonthProp,
  roommatePrices = new Map(),  // Map of date string -> suggested buyout price
}) {
  // Default to current date if no month provided
  const currentMonth = currentMonthProp || new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Calculate adjacent nights (memoized for performance)
  const adjacentNights = useMemo(
    () => findAdjacentNights(userNights, roommateNights),
    [userNights, roommateNights]
  );

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  /**
   * Get the status of a day for styling
   */
  const getDayStatus = (date) => {
    if (!date) return 'empty';

    const dateStr = toDateString(date);

    // Check each status in priority order
    if (isInDateArray(date, blockedNights)) return 'blocked';
    if (isInDateArray(date, pendingNights)) return 'pending';
    if (isInDateArray(date, userNights)) return 'mine';
    if (isInDateArray(date, roommateNights)) {
      // Check if it's also an adjacent night
      if (adjacentNights.includes(dateStr)) {
        return 'adjacent';
      }
      return 'roommate';
    }
    return 'outside';
  };

  /**
   * Handle day click
   */
  const handleDayClick = (date) => {
    if (!date) return;

    const status = getDayStatus(date);

    // Only allow selecting roommate's or adjacent nights
    if (status === 'roommate' || status === 'adjacent') {
      onNightSelect?.(toDateString(date));
    }
    // Optional: Could show feedback for clicking own night
  };

  /**
   * Check if day is clickable
   */
  const isDayClickable = (date, status) => {
    if (!date) return false;
    return status === 'roommate' || status === 'adjacent';
  };

  /**
   * Get accessible label for day
   */
  const getAccessibleLabel = (date, status) => {
    if (!date) return '';

    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    const statusLabels = {
      mine: 'Your night',
      roommate: 'Available to buy out',
      adjacent: 'Recommended - adjacent to your stay',
      pending: 'Pending request',
      blocked: 'Blocked',
      outside: 'Outside lease period'
    };

    return `${formattedDate}, ${statusLabels[status] || ''}`;
  };

  /**
   * Navigate to previous month
   */
  const handlePrevMonth = () => {
    const newMonth = new Date(year, month - 1, 1);
    onMonthChange?.(newMonth);
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    const newMonth = new Date(year, month + 1, 1);
    onMonthChange?.(newMonth);
  };

  return (
    <div className="schedule-calendar">
      {/* Header with navigation */}
      <div className="schedule-calendar__header">
        <button
          type="button"
          className="schedule-calendar__nav"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          &#8592;
        </button>
        <h2 className="schedule-calendar__month">{monthName}</h2>
        <button
          type="button"
          className="schedule-calendar__nav"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          &#8594;
        </button>
      </div>

      {/* Day of week headers */}
      <div className="schedule-calendar__weekdays" role="row">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="schedule-calendar__weekday" role="columnheader">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="schedule-calendar__grid" role="grid">
        {calendarDays.map((date, index) => {
          const status = getDayStatus(date);
          const isSelected = date && isSameDay(date, selectedNight);
          const clickable = isDayClickable(date, status);

          // Get price for roommate nights
          const dateStr = date ? toDateString(date) : null;
          const showPrice = (status === 'roommate' || status === 'adjacent') && dateStr;
          const price = showPrice ? roommatePrices.get(dateStr) : null;

          return (
            <button
              key={index}
              type="button"
              className={`
                schedule-calendar__day
                schedule-calendar__day--${status}
                ${isSelected ? 'schedule-calendar__day--selected' : ''}
                ${clickable ? 'schedule-calendar__day--clickable' : ''}
                ${showPrice ? 'schedule-calendar__day--has-price' : ''}
              `.trim().replace(/\s+/g, ' ')}
              onClick={() => handleDayClick(date)}
              disabled={!clickable}
              aria-label={date ? getAccessibleLabel(date, status) : undefined}
              aria-pressed={isSelected || undefined}
              tabIndex={clickable ? 0 : -1}
            >
              {date && (
                <>
                  <span className="schedule-calendar__day-number">
                    {date.getDate()}
                  </span>
                  {showPrice && price && (
                    <span className="schedule-calendar__day-price">
                      ${price}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="schedule-calendar__legend">
        <div className="schedule-calendar__legend-item">
          <span className="schedule-calendar__legend-color schedule-calendar__legend-color--mine" />
          <span>My Nights</span>
        </div>
        <div className="schedule-calendar__legend-item">
          <span className="schedule-calendar__legend-color schedule-calendar__legend-color--roommate" />
          <span>Available</span>
        </div>
        <div className="schedule-calendar__legend-item">
          <span className="schedule-calendar__legend-color schedule-calendar__legend-color--adjacent" />
          <span>Recommended</span>
        </div>
        <div className="schedule-calendar__legend-item">
          <span className="schedule-calendar__legend-color schedule-calendar__legend-color--pending" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}

ScheduleCalendar.propTypes = {
  userNights: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])),
  roommateNights: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])),
  pendingNights: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])),
  blockedNights: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ])),
  selectedNight: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  onNightSelect: PropTypes.func,
  onMonthChange: PropTypes.func,
  currentMonth: PropTypes.instanceOf(Date),
  roommatePrices: PropTypes.instanceOf(Map),
};
