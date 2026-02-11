import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar grid component for displaying and selecting dates
 */
const CalendarGrid = React.memo(function CalendarGrid({
  currentDate,
  navigateMonth,
  calendarDays,
  isDateBlocked,
  isInPendingRange,
  handleDateClick,
}) {
  return (
    <div className="listing-dashboard-availability__calendar">
      {/* Calendar Header */}
      <div className="listing-dashboard-availability__calendar-header">
        <button onClick={() => navigateMonth(-1)} type="button" aria-label="Previous month">
          <ChevronLeftIcon />
        </button>
        <span>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        <button onClick={() => navigateMonth(1)} type="button" aria-label="Next month">
          <ChevronRightIcon />
        </button>
      </div>

      {/* Day Headers */}
      <div className="listing-dashboard-availability__day-headers">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="listing-dashboard-availability__day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="listing-dashboard-availability__calendar-grid">
        {calendarDays.map((dayInfo, index) => {
          const isBlocked = dayInfo.date && isDateBlocked(dayInfo.date);
          const isRangeStartDate = isInPendingRange(dayInfo.date);
          const isSelectable = !dayInfo.isPast && dayInfo.date;

          return (
            <div
              key={index}
              className={`listing-dashboard-availability__calendar-day ${
                !dayInfo.isCurrentMonth ? 'listing-dashboard-availability__calendar-day--other-month' : ''
              } ${dayInfo.isPast ? 'listing-dashboard-availability__calendar-day--past' : ''
              } ${isBlocked ? 'listing-dashboard-availability__calendar-day--blocked' : ''
              } ${isRangeStartDate ? 'listing-dashboard-availability__calendar-day--range-start' : ''
              } ${isSelectable ? 'listing-dashboard-availability__calendar-day--selectable' : ''}`}
              onClick={() => handleDateClick(dayInfo)}
              role={isSelectable ? 'button' : undefined}
              tabIndex={isSelectable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDateClick(dayInfo);
                }
              }}
            >
              {String(dayInfo.day).padStart(2, '0')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="listing-dashboard-availability__legend">
        <div className="listing-dashboard-availability__legend-item">
          <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--restricted" />
          <span>Restricted Weekly</span>
        </div>
        <div className="listing-dashboard-availability__legend-item">
          <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--blocked" />
          <span>Blocked Manually</span>
        </div>
        <div className="listing-dashboard-availability__legend-item">
          <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--available" />
          <span>Available</span>
        </div>
        <div className="listing-dashboard-availability__legend-item">
          <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--first" />
          <span>First Available</span>
        </div>
      </div>
    </div>
  );
});

export default CalendarGrid;
