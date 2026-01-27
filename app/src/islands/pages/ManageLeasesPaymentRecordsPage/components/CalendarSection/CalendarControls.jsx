/**
 * CalendarControls - Month navigation controls
 */
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarControls({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  onGoToLeaseStart,
  hasLeaseStart
}) {
  const monthName = MONTH_NAMES[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

  return (
    <div className="mlpr-calendar-controls">
      <div className="mlpr-calendar-nav">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-icon mlpr-btn-outline"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-icon mlpr-btn-outline"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <span className="mlpr-calendar-month">
        {monthName} {year}
      </span>

      <div className="mlpr-calendar-nav">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-sm mlpr-btn-outline"
          onClick={onToday}
        >
          Today
        </button>
        {hasLeaseStart && (
          <button
            type="button"
            className="mlpr-btn mlpr-btn-sm mlpr-btn-outline"
            onClick={onGoToLeaseStart}
          >
            <Calendar size={14} />
            Lease Start
          </button>
        )}
      </div>
    </div>
  );
}
