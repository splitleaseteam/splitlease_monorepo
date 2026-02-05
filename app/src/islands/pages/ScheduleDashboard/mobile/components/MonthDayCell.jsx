import { format, isSameDay } from 'date-fns';

export default function MonthDayCell({
  date,
  status,
  isCurrentMonth,
  onSelect,
  price,
  isDisabled = false,
  isCounterOriginal = false,
  isCounterTarget = false,
  isCounterSelectable = false
}) {
  const dayNum = format(date, 'd');
  const isToday = isSameDay(date, new Date());
  const isOutside = !isCurrentMonth;
  const disabled = isOutside || isDisabled;

  // Extract numeric price value (handles both number and {price: number} objects)
  const priceValue = typeof price === 'object' ? price?.price : price;
  const hasPrice = typeof priceValue === 'number' && priceValue > 0 && !isOutside;

  return (
    <button
      className={`month-day-cell ${status ? `month-day-cell--${status}` : ''} ${isOutside ? 'month-day-cell--outside' : ''} ${isToday ? 'month-day-cell--today' : ''} ${isCounterOriginal ? 'month-day-cell--counter-original' : ''} ${isCounterTarget ? 'month-day-cell--counter-target' : ''} ${isCounterSelectable ? 'month-day-cell--counter-selectable' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      type="button"
    >
      <span className="month-day-cell__num">{dayNum}</span>
      {hasPrice && (
        <span className="month-day-cell__price">${priceValue}</span>
      )}
      {status === 'pending' && (
        <span className="month-day-cell__pending-icon" aria-hidden="true">⏳</span>
      )}
      {status && status !== 'pending' && !hasPrice && <span className="month-day-cell__dot" />}
    </button>
  );
}
