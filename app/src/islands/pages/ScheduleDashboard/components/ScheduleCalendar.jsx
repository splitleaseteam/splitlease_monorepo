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
 * Add months to a date
 */
function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Build calendar grid for a specific month
 */
function buildCalendarGrid(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
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
  sharedNights = [],
  selectedNight,
  onNightSelect,
  onMonthChange,
  currentMonth: currentMonthProp,
  transactionsByDate = {},
  onSelectTransaction,
  priceOverlays = null, // { 'YYYY-MM-DD': { price: 175, tier: 'within' | 'near' | 'limit' } }
  roommatePriceOverlays = null, // { 'YYYY-MM-DD': { price: 165, tier: 'within' | 'near' | 'limit' } } - roommate's nights
  roommateName = null, // Roommate's first name for tooltip
  isLoading = false, // Loading state for skeleton UI
  pendingDateChangeRequests = [] // Array of pending date change requests
}) {
  // Build set of dates affected by pending date change requests
  const pendingChangeDates = useMemo(() => {
    const dates = new Set();
    pendingDateChangeRequests.forEach(request => {
      // Add old dates (dates being changed from)
      if (request.listOfOldDates) {
        request.listOfOldDates.forEach(d => dates.add(toDateString(d)));
      }
      // Add new dates (dates being changed to)
      if (request.listOfNewDates) {
        request.listOfNewDates.forEach(d => dates.add(toDateString(d)));
      }
    });
    return dates;
  }, [pendingDateChangeRequests]);

  /**
   * Check if a date has a pending date change request
   */
  const isPendingDateChange = (date) => {
    if (!date) return false;
    return pendingChangeDates.has(toDateString(date));
  };
  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="schedule-calendar schedule-calendar--loading">
        <div className="schedule-calendar__header">
          <div className="schedule-calendar__skeleton-nav" />
          <div className="schedule-calendar__skeleton-legend" />
          <div className="schedule-calendar__skeleton-nav" />
        </div>
        <div className="schedule-calendar__dual-container">
          <div className="schedule-calendar__month-panel schedule-calendar__month-panel--skeleton">
            <div className="schedule-calendar__skeleton-title" />
            <div className="schedule-calendar__skeleton-weekdays">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="schedule-calendar__skeleton-weekday" />
              ))}
            </div>
            <div className="schedule-calendar__skeleton-grid">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="schedule-calendar__skeleton-day" />
              ))}
            </div>
          </div>
          <div className="schedule-calendar__month-panel schedule-calendar__month-panel--skeleton">
            <div className="schedule-calendar__skeleton-title" />
            <div className="schedule-calendar__skeleton-weekdays">
              {DAYS_OF_WEEK.map(day => (
                <div key={`s2-${day}`} className="schedule-calendar__skeleton-weekday" />
              ))}
            </div>
            <div className="schedule-calendar__skeleton-grid">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="schedule-calendar__skeleton-day" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Default to current date if no month provided
  const currentMonth = currentMonthProp || new Date();

  // Calculate the two months to display
  const month1 = currentMonth;
  const month2 = addMonths(currentMonth, 1);

  // Calculate adjacent nights (memoized for performance)
  const adjacentNights = useMemo(
    () => findAdjacentNights(userNights, roommateNights),
    [userNights, roommateNights]
  );

  // Today's date for comparison (normalized to start of day)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  /**
   * Check if a date is in the past
   */
  const isDateInPast = (date) => {
    if (!date) return false;
    return date < today;
  };

  /**
   * Get transaction for a specific date
   */
  const getTransactionForDate = (date) => {
    if (!date || !transactionsByDate) return null;
    const dateStr = toDateString(date);
    return transactionsByDate[dateStr] || null;
  };

  /**
   * Get price overlay for a specific date
   * - For user's nights: use priceOverlays (from user's strategy)
   * - For roommate's nights: use roommatePriceOverlays (adjacent only)
   */
  const getPriceOverlay = (date, status) => {
    if (!date) return null;
    const dateStr = toDateString(date);

    // User's nights - show user's price (existing behavior in Pricing Settings mode)
    if (status === 'mine' && priceOverlays) {
      return priceOverlays[dateStr] || null;
    }

    // Roommate's nights - show roommate's price (NEW - in Date Changes mode)
    if (status === 'adjacent' && roommatePriceOverlays) {
      return roommatePriceOverlays[dateStr] || null;
    }

    return null;
  };

  /**
   * Format transaction amount for display
   */
  const formatTransactionAmount = (transaction) => {
    if (!transaction) return null;
    const prefix = transaction.direction === 'incoming' ? '+' : '-';
    return `${prefix}$${Number(transaction.amount).toFixed(2)}`;
  };

  // Build calendar grids for both months
  const month1Days = useMemo(
    () => buildCalendarGrid(month1.getFullYear(), month1.getMonth()),
    [month1]
  );

  const month2Days = useMemo(
    () => buildCalendarGrid(month2.getFullYear(), month2.getMonth()),
    [month2]
  );

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
    const transaction = getTransactionForDate(date);

    // If there's a transaction on this date, trigger transaction click
    if (transaction) {
      onSelectTransaction?.(transaction.id);
      return;
    }

    // Only allow selecting roommate's or adjacent nights for future dates
    if (status === 'roommate' || status === 'adjacent') {
      onNightSelect?.(toDateString(date));
    }
  };

  /**
   * Check if day is clickable
   */
  const isDayClickable = (date, status) => {
    if (!date) return false;

    // Dates with transactions are clickable
    const transaction = getTransactionForDate(date);
    if (transaction) {
      return true;
    }

    // Future roommate's or adjacent nights are clickable
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

    // Check for transaction on this date
    const transaction = getTransactionForDate(date);
    if (transaction) {
      const amount = formatTransactionAmount(transaction);
      return `${formattedDate}, Transaction: ${amount}. Click to view details.`;
    }

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
   * Navigate to previous month (by 1 month)
   */
  const handlePrevMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    onMonthChange?.(newMonth);
  };

  /**
   * Navigate to next month (by 1 month)
   */
  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    onMonthChange?.(newMonth);
  };

  /**
   * Render a single month panel
   */
  const renderMonthPanel = (monthDate, calendarDays, key) => {
    const monthName = monthDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div key={key} className="schedule-calendar__month-panel">
        <h3 className="schedule-calendar__month-title">{monthName}</h3>

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
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className={`schedule-calendar__week-row ${weekIndex % 2 === 1 ? 'schedule-calendar__week-row--striped' : ''}`}
              role="row"
            >
              {week.map((date, index) => {
                const status = getDayStatus(date);
                const isSelected = date && isSameDay(date, selectedNight);
                const clickable = isDayClickable(date, status);

                // Check for transaction on past dates
                const isPast = date && isDateInPast(date);
                const transaction = date ? getTransactionForDate(date) : null;
                const hasTransaction = isPast && transaction;
                const transactionAmount = hasTransaction ? formatTransactionAmount(transaction) : null;

                // Low amount threshold for neutral styling (swaps, small charges)
                const LOW_AMOUNT_THRESHOLD = 5;
                const isLowAmount = hasTransaction && Math.abs(transaction.amount) < LOW_AMOUNT_THRESHOLD;

                // Check for price overlay (user's nights OR adjacent roommate nights only)
                const priceOverlay = date && (status === 'mine' || status === 'adjacent')
                  ? getPriceOverlay(date, status)
                  : null;

                // Check for shared night (co-occupancy)
                const isShared = date && isInDateArray(date, sharedNights);

                // Check for pending date change request affecting this date
                const hasPendingDateChange = date && isPendingDateChange(date);

                return (
                  <button
                    key={`${weekIndex}-${index}`}
                    type="button"
                    className={`
                      schedule-calendar__day
                      schedule-calendar__day--${status}
                      ${isSelected ? 'schedule-calendar__day--selected' : ''}
                      ${clickable ? 'schedule-calendar__day--clickable' : ''}
                      ${hasTransaction ? 'schedule-calendar__day--has-transaction' : ''}
                      ${hasTransaction && isLowAmount ? 'schedule-calendar__day--transaction-neutral' : ''}
                      ${hasTransaction && !isLowAmount && transaction.direction === 'incoming' ? 'schedule-calendar__day--transaction-incoming' : ''}
                      ${hasTransaction && !isLowAmount && transaction.direction === 'outgoing' ? 'schedule-calendar__day--transaction-outgoing' : ''}
                      ${priceOverlay ? 'schedule-calendar__day--has-price' : ''}
                      ${isShared ? 'schedule-calendar__day--shared' : ''}
                      ${hasPendingDateChange ? 'schedule-calendar__day--pending-change' : ''}
                    `.trim().replace(/\s+/g, ' ')}
                    onClick={() => handleDayClick(date)}
                    disabled={!clickable}
                    aria-label={date ? getAccessibleLabel(date, status) : undefined}
                    aria-pressed={isSelected || undefined}
                    tabIndex={clickable ? 0 : -1}
                  >
                    <span className="schedule-calendar__day-number">
                      {date ? date.getDate() : ''}
                    </span>
                    {hasPendingDateChange && (
                      <span className="schedule-calendar__day-change-indicator" title="Pending date change request" />
                    )}
                    {hasTransaction && (
                      <span className="schedule-calendar__day-transaction">
                        {transactionAmount}
                      </span>
                    )}
                    {priceOverlay && (
                      <span
                        className="schedule-calendar__price-bar"
                        data-tier={priceOverlay.tier}
                        title={status === 'adjacent' ? `This is ${roommateName || 'your roommate'}'s suggested price` : undefined}
                      >
                        {status === 'adjacent' ? '~' : ''}${priceOverlay.price}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
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
        <div className="schedule-calendar__legend">
          <div className="schedule-calendar__legend-item">
            <span className="schedule-calendar__legend-color schedule-calendar__legend-color--mine" />
            <span>Your Nights</span>
          </div>
          <div className="schedule-calendar__legend-item">
            <span className="schedule-calendar__legend-color schedule-calendar__legend-color--roommate" />
            <span>{roommateName ? `${roommateName}'s Nights` : "Roommate's Nights"}</span>
          </div>
          <div className="schedule-calendar__legend-item">
            <span className="schedule-calendar__legend-color schedule-calendar__legend-color--adjacent" />
            <span>Recommended</span>
          </div>
          <div className="schedule-calendar__legend-item">
            <span className="schedule-calendar__legend-color schedule-calendar__legend-color--pending" />
            <span>Pending</span>
          </div>
          {pendingDateChangeRequests.length > 0 && (
            <div className="schedule-calendar__legend-item schedule-calendar__legend-item--badge">
              <span className="schedule-calendar__pending-badge">
                {pendingDateChangeRequests.length} pending request{pendingDateChangeRequests.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="schedule-calendar__nav"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          &#8594;
        </button>
      </div>

      {/* Dual Month Container */}
      <div className="schedule-calendar__dual-container">
        {renderMonthPanel(month1, month1Days, 'month1')}
        {renderMonthPanel(month2, month2Days, 'month2')}
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
  transactionsByDate: PropTypes.objectOf(PropTypes.shape({
    id: PropTypes.string,
    amount: PropTypes.number,
    direction: PropTypes.oneOf(['incoming', 'outgoing']),
    type: PropTypes.oneOf(['buyout', 'swap', 'offer']),
    status: PropTypes.oneOf(['complete', 'pending', 'declined', 'cancelled'])
  })),
  onSelectTransaction: PropTypes.func,
  priceOverlays: PropTypes.objectOf(PropTypes.shape({
    price: PropTypes.number.isRequired,
    tier: PropTypes.oneOf(['within', 'near', 'limit']).isRequired
  })),
  roommatePriceOverlays: PropTypes.objectOf(PropTypes.shape({
    price: PropTypes.number.isRequired,
    tier: PropTypes.oneOf(['within', 'near', 'limit']).isRequired
  })),
  roommateName: PropTypes.string,
  isLoading: PropTypes.bool,
  pendingDateChangeRequests: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    listOfOldDates: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])),
    listOfNewDates: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])),
    status: PropTypes.string
  }))
};
