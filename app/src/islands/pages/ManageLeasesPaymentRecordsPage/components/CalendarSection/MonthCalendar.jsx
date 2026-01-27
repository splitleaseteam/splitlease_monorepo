/**
 * MonthCalendar - 6x7 calendar grid for displaying booked dates
 */
import { useMemo } from 'react';
import CalendarDay from './CalendarDay.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthCalendar({
  month,
  bookedDates = [],
  bookedDatesAfterRequest = [],
  viewMode,
  leaseStartDate,
  leaseEndDate
}) {
  // Generate calendar days for 6-week grid
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // First day of month
    const firstDay = new Date(year, monthIndex, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Calculate start date (may be in previous month)
    const startDate = new Date(year, monthIndex, 1 - startingDayOfWeek);

    // Generate 42 days (6 weeks)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  }, [month]);

  // Convert booked dates array to a Set of date strings for O(1) lookup
  const bookedSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(bookedDates)) {
      bookedDates.forEach(d => {
        const dateStr = typeof d === 'string' ? d.split('T')[0] : '';
        if (dateStr) set.add(dateStr);
      });
    }
    return set;
  }, [bookedDates]);

  const bookedAfterSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(bookedDatesAfterRequest)) {
      bookedDatesAfterRequest.forEach(d => {
        const dateStr = typeof d === 'string' ? d.split('T')[0] : '';
        if (dateStr) set.add(dateStr);
      });
    }
    return set;
  }, [bookedDatesAfterRequest]);

  const isBooked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedSet.has(dateStr);
  };

  const isBookedAfterRequest = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedAfterSet.has(dateStr);
  };

  const isInLeaseRange = (date) => {
    if (!leaseStartDate || !leaseEndDate) return false;
    const start = new Date(leaseStartDate);
    const end = new Date(leaseEndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const compareDate = new Date(date);
    compareDate.setHours(12, 0, 0, 0);
    return compareDate >= start && compareDate <= end;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isOtherMonth = (date) => {
    return date.getMonth() !== month.getMonth();
  };

  return (
    <div className="mlpr-calendar">
      {/* Weekday Headers */}
      <div className="mlpr-calendar-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="mlpr-calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="mlpr-calendar-grid">
        {calendarDays.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            isOtherMonth={isOtherMonth(date)}
            isToday={isToday(date)}
            isBooked={isBooked(date)}
            isBookedAfterRequest={isBookedAfterRequest(date)}
            isInLeaseRange={isInLeaseRange(date)}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
