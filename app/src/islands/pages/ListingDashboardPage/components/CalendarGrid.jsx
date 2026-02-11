import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date) {
  if (!date) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calendar grid component for displaying and selecting dates.
 * Supports multi-month layout, drag-to-select, pricing overlay,
 * booked/blocked/available states, and cross-month keyboard navigation.
 */
const CalendarGrid = React.memo(function CalendarGrid({
  currentDate,
  navigateMonth,
  calendarDays,
  isDateBlocked,
  isDateBooked,
  isToday,
  isFirstAvailableDate,
  getDayPrice,
  showPrices,
  setShowPrices,
  getDayTooltip,
  getLeaseTooltip,
  monthStats,
  handleDateClick,
  // Multi-month props
  showNavigation = true,
  compact = false,
  showLegend = true,
  // Drag-to-select props
  dragState,
  onDayMouseDown,
  onDayMouseEnter,
  isDayInDragRange,
}) {
  return (
    <div className={`listing-dashboard-availability__calendar${compact ? ' listing-dashboard-availability__calendar--compact' : ''}`}>
      {/* Calendar Header */}
      <div className="listing-dashboard-availability__calendar-header">
        {showNavigation && navigateMonth ? (
          <button onClick={() => navigateMonth(-1)} type="button" aria-label="Previous month">
            <ChevronLeftIcon size={compact ? 16 : 20} />
          </button>
        ) : <span />}
        <span>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        {showNavigation && setShowPrices && (
          <label className="listing-dashboard-availability__price-toggle">
            <input
              type="checkbox"
              checked={showPrices}
              onChange={() => setShowPrices(!showPrices)}
            />
            <span>Show rates</span>
          </label>
        )}
        {showNavigation && navigateMonth ? (
          <button onClick={() => navigateMonth(1)} type="button" aria-label="Next month">
            <ChevronRightIcon size={compact ? 16 : 20} />
          </button>
        ) : <span />}
      </div>

      {/* Day Headers */}
      <div className="listing-dashboard-availability__day-headers">
        {DAY_HEADERS.map((day) => (
          <div key={day} className="listing-dashboard-availability__day-header">
            {compact ? day.charAt(0) : day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className={[
          'listing-dashboard-availability__calendar-grid',
          showPrices && 'listing-dashboard-availability__calendar-grid--show-prices',
          dragState?.active && 'listing-dashboard-availability__calendar-grid--dragging',
        ].filter(Boolean).join(' ')}
      >
        {calendarDays.map((dayInfo, index) => {
          const isBlocked = dayInfo.date && isDateBlocked(dayInfo.date);
          const isBooked = dayInfo.date && isDateBooked?.(dayInfo.date);
          const isSelectable = !dayInfo.isPast && dayInfo.date && !isBooked;
          const isTodayDate = isToday?.(dayInfo.date);
          const isFirstAvailable = isFirstAvailableDate?.(dayInfo.date);
          const dayPrice = showPrices ? getDayPrice?.(dayInfo.date) : null;
          const tooltip = getDayTooltip?.(dayInfo, isBlocked, isBooked);
          const leaseTooltip = isBooked ? getLeaseTooltip?.(dayInfo.date) : undefined;
          const dateKey = toDateKey(dayInfo.date);
          const inDrag = isDayInDragRange ? isDayInDragRange(dayInfo.date) : false;

          let dragClass = '';
          if (inDrag && dragState?.active) {
            dragClass = dragState.mode === 'block'
              ? ' listing-dashboard-availability__calendar-day--drag-block'
              : ' listing-dashboard-availability__calendar-day--drag-unblock';
          }

          return (
            <div
              key={index}
              className={[
                'listing-dashboard-availability__calendar-day',
                !dayInfo.isCurrentMonth && 'listing-dashboard-availability__calendar-day--other-month',
                dayInfo.isPast && 'listing-dashboard-availability__calendar-day--past',
                !dayInfo.isPast && !isBlocked && !isBooked && dayInfo.isCurrentMonth && 'listing-dashboard-availability__calendar-day--available',
                isBooked && 'listing-dashboard-availability__calendar-day--booked',
                isBlocked && 'listing-dashboard-availability__calendar-day--blocked',
                isTodayDate && 'listing-dashboard-availability__calendar-day--today',
                isFirstAvailable && 'listing-dashboard-availability__calendar-day--first-available',
                isSelectable && 'listing-dashboard-availability__calendar-day--selectable',
              ].filter(Boolean).join(' ') + dragClass}
              data-date={(!compact || dayInfo.isCurrentMonth) ? dateKey : undefined}
              data-tooltip={leaseTooltip || tooltip}
              onMouseDown={isSelectable && onDayMouseDown ? (e) => { e.preventDefault(); onDayMouseDown(dayInfo); } : undefined}
              onMouseEnter={onDayMouseEnter ? () => onDayMouseEnter(dayInfo) : undefined}
              onTouchStart={isSelectable && onDayMouseDown ? () => onDayMouseDown(dayInfo) : undefined}
              role={isSelectable ? 'button' : undefined}
              tabIndex={isSelectable ? 0 : undefined}
              aria-pressed={isSelectable ? (isBooked || isBlocked) : undefined}
              onKeyDown={(e) => {
                if (isSelectable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDateClick(dayInfo);
                }
                if (dayInfo.date && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault();
                  const target = new Date(dayInfo.date);
                  switch (e.key) {
                    case 'ArrowRight': target.setDate(target.getDate() + 1); break;
                    case 'ArrowLeft': target.setDate(target.getDate() - 1); break;
                    case 'ArrowDown': target.setDate(target.getDate() + 7); break;
                    case 'ArrowUp': target.setDate(target.getDate() - 7); break;
                  }
                  const targetKey = toDateKey(target);
                  const container = e.currentTarget.closest('.listing-dashboard-availability__multi-calendar')
                    || e.currentTarget.closest('.listing-dashboard-availability__calendar-container');
                  if (container && targetKey) {
                    const cell = container.querySelector(`[data-date="${targetKey}"]`);
                    if (cell) cell.focus();
                  }
                }
              }}
            >
              <span className="listing-dashboard-availability__day-number">{String(dayInfo.day).padStart(2, '0')}</span>
              {dayPrice !== null && (
                <span className="listing-dashboard-availability__day-price">${dayPrice}</span>
              )}
              {isFirstAvailable && (
                <span className="listing-dashboard-availability__first-available-badge">First available</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="listing-dashboard-availability__legend">
          <div className="listing-dashboard-availability__legend-item">
            <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--available" />
            <span>Available</span>
          </div>
          <div className="listing-dashboard-availability__legend-item">
            <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--booked" />
            <span>Booked</span>
          </div>
          <div className="listing-dashboard-availability__legend-item">
            <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--blocked" />
            <span>Blocked Manually</span>
          </div>
          <div className="listing-dashboard-availability__legend-item">
            <span className="listing-dashboard-availability__legend-dot listing-dashboard-availability__legend-dot--past" />
            <span>Past</span>
          </div>
        </div>
      )}

      {/* Month Stats */}
      {monthStats && monthStats.total > 0 && (
        <p className="listing-dashboard-availability__month-stats">
          {monthStats.available} of {monthStats.total} days available
        </p>
      )}
    </div>
  );
});

export default CalendarGrid;
