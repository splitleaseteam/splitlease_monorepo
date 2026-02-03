import { format, isSameDay } from 'date-fns';

export default function MonthDayCell({ date, status, isCurrentMonth, onSelect }) {
  const dayNum = format(date, 'd');
  const isToday = isSameDay(date, new Date());

  return (
    <button
      className={`month-day-cell ${status ? `month-day-cell--${status}` : ''} ${!isCurrentMonth ? 'month-day-cell--outside' : ''} ${isToday ? 'month-day-cell--today' : ''}`}
      onClick={onSelect}
      disabled={!isCurrentMonth}
      type="button"
    >
      <span className="month-day-cell__num">{dayNum}</span>
      {status && <span className="month-day-cell__dot" />}
    </button>
  );
}
