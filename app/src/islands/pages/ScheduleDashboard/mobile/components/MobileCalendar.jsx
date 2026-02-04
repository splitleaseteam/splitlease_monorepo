/**
 * MobileCalendar Component
 *
 * Week-based calendar view for mobile ScheduleDashboard.
 * Shows 1 week at a time with navigation, day cells, and price overlays.
 */

import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  format,
  isSameMonth
} from 'date-fns';
import MonthDayCell from './MonthDayCell.jsx';
import DayDetailPanel from './DayDetailPanel.jsx';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine day ownership/status
 * @param {Date} date - The date to check
 * @param {string[]} userNights - Array of date strings the user owns
 * @param {string[]} roommateNights - Array of date strings the roommate owns
 * @param {string[]} pendingNights - Array of date strings with pending requests
 * @returns {'pending' | 'mine' | 'roommate' | null}
 */
function getDayStatus(date, userNights, roommateNights, pendingNights) {
  const dateStr = format(date, 'yyyy-MM-dd');
  if (pendingNights?.includes(dateStr)) return 'pending';
  if (userNights?.includes(dateStr)) return 'mine';
  if (roommateNights?.includes(dateStr)) return 'roommate';
  return null;
}

function getMonthWeeks(currentMonth) {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

  const weeks = [];
  let day = start;

  while (day <= end) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Day-of-week header row
 */
function WeekDayLabels() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="mobile-calendar__day-labels" role="row">
      {days.map((day) => (
        <span
          key={day}
          className="mobile-calendar__day-label"
          role="columnheader"
        >
          {day}
        </span>
      ))}
    </div>
  );
}

/**
 * Month/week header with navigation
 */
function CalendarHeader({ month, onPrev, onNext, useRotatedLayout, onToggleLayout }) {
  const monthYear = format(month, 'MMMM yyyy');
  return (
    <div className="mobile-calendar__header">
      <button
        className="mobile-calendar__nav"
        onClick={onPrev}
        aria-label="Previous week"
        type="button"
      >
        ‹
      </button>
      <div className="mobile-calendar__title">
        <span className="mobile-calendar__month">{monthYear}</span>
      </div>
      <button
        className="mobile-calendar__layout-toggle"
        onClick={onToggleLayout}
        type="button"
        aria-pressed={useRotatedLayout}
      >
        {useRotatedLayout ? 'Standard' : 'Rotate'}
      </button>
      <button
        className="mobile-calendar__nav"
        onClick={onNext}
        aria-label="Next week"
        type="button"
      >
        ›
      </button>
    </div>
  );
}

/**
 * Individual day cell with status and price
 */
// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Week-based mobile calendar
 * @param {Object} props
 * @param {string[]} props.userNights - Dates the current user owns
 * @param {string[]} props.roommateNights - Dates the roommate owns
 * @param {string[]} props.pendingNights - Dates with pending requests
 * @param {string|null} props.selectedNight - Currently selected date string
 * @param {function} props.onSelectNight - Callback when a night is selected
 * @param {Object} props.priceOverlays - Map of date string to price
 * @param {function} props.onWeekChange - Callback when week changes
 */
function toDateKey(value) {
  if (!value) return null;
  if (value instanceof Date) return format(value, 'yyyy-MM-dd');
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return format(parsed, 'yyyy-MM-dd');
  }
  return null;
}

function formatCounterDate(value) {
  if (!value) return '';
  if (value instanceof Date) return format(value, 'MMM d');
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(`${value}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d');
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d');
  }
  return '';
}

export default function MobileCalendar({
  userNights,
  roommateNights,
  pendingNights,
  priceOverlays,
  selectedDay,
  roommateName,
  onSelectDay,
  onCloseDay,
  onAction,
  isCounterMode,
  counterOriginalNight,
  counterTargetNight,
  onSelectCounterNight,
  onCancelCounterMode,
  onSubmitCounter
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [useRotatedLayout, setUseRotatedLayout] = useState(false);
  const weeks = useMemo(() => getMonthWeeks(currentMonth), [currentMonth]);
  const counterOriginalKey = toDateKey(counterOriginalNight);
  const counterTargetKey = toDateKey(counterTargetNight);

  const getPriceValue = (date) => {
    if (!date) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const rawPrice = priceOverlays?.[dateStr];
    if (!rawPrice) return null;
    return typeof rawPrice === 'object' ? rawPrice?.price : rawPrice;
  };

  return (
    <div
      className={`mobile-month-calendar${useRotatedLayout ? ' mobile-month-calendar--rotated' : ''}`}
      data-layout={useRotatedLayout ? 'rotated' : 'standard'}
    >
      <CalendarHeader
        month={currentMonth}
        onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
        useRotatedLayout={useRotatedLayout}
        onToggleLayout={() => setUseRotatedLayout((prev) => !prev)}
      />
      <WeekDayLabels />
      {isCounterMode && (
        <div className="mobile-month-calendar__counter-banner" role="status">
          <div className="mobile-month-calendar__counter-text">
            <span className="mobile-month-calendar__counter-title">\ud83d\udd04 Counter: Select a night you want in return</span>
            {counterOriginalNight && (
              <span className="mobile-month-calendar__counter-subtitle">
                You&apos;ll give up: {formatCounterDate(counterOriginalNight)}
              </span>
            )}
          </div>
          <button
            type="button"
            className="mobile-month-calendar__counter-cancel"
            onClick={onCancelCounterMode}
          >
            Cancel
          </button>
        </div>
      )}
      <div className="mobile-month-calendar__grid">
        {weeks.map((week, i) => (
          <div key={`week-${i}`} className="mobile-month-calendar__week">
            {week.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isCounterSelectable = !!(
                isCounterMode
                && roommateNights?.includes(dateStr)
                && !pendingNights?.includes(dateStr)
              );
              const isDisabled = isCounterMode && !isCounterSelectable;
              return (
                <MonthDayCell
                  key={dateStr}
                  date={date}
                  status={getDayStatus(date, userNights, roommateNights, pendingNights)}
                  isCurrentMonth={isSameMonth(date, currentMonth)}
                  price={priceOverlays?.[dateStr]}
                  onSelect={() => {
                    if (isCounterMode) {
                      if (isCounterSelectable) {
                        onSelectCounterNight?.(dateStr, date);
                      }
                      return;
                    }
                    onSelectDay?.(date);
                  }}
                  isDisabled={isDisabled}
                  isCounterOriginal={counterOriginalKey === dateStr}
                  isCounterTarget={counterTargetKey === dateStr}
                  isCounterSelectable={isCounterSelectable}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mobile-month-calendar__legend">
        <span className="mobile-month-calendar__legend-item">
          <span className="mobile-month-calendar__legend-dot mobile-month-calendar__legend-dot--mine" />
          Mine
        </span>
        <span className="mobile-month-calendar__legend-item">
          <span className="mobile-month-calendar__legend-dot mobile-month-calendar__legend-dot--roommate" />
          Roommate
        </span>
        <span className="mobile-month-calendar__legend-item">
          <span className="mobile-month-calendar__legend-icon" aria-hidden="true">⏳</span>
          Pending
        </span>
      </div>

      {/* Inline panel - no overlay, no portal, no animation timing issues */}
      <DayDetailPanel
        date={selectedDay}
        status={selectedDay ? getDayStatus(selectedDay, userNights, roommateNights, pendingNights) : null}
        price={getPriceValue(selectedDay)}
        roommateName={roommateName}
        isCounterMode={isCounterMode}
        counterOriginalNight={counterOriginalNight}
        counterTargetNight={counterTargetNight}
        onSubmitCounter={onSubmitCounter}
        onAction={(action, date) => {
          onCloseDay?.();
          onAction?.(action, date);
        }}
        onClose={() => onCloseDay?.()}
      />
    </div>
  );
}

// Export sub-components for potential standalone use
export { CalendarHeader, WeekDayLabels, getDayStatus, getMonthWeeks };
