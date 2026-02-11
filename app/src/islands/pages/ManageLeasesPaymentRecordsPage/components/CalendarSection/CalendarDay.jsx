/**
 * CalendarDay - Individual day cell in the calendar
 */
export default function CalendarDay({
  date,
  isOtherMonth,
  isToday,
  isBooked,
  isBookedAfterRequest,
  isInLeaseRange,
  _viewMode
}) {
  // Build class name based on state
  const classNames = ['mlpr-calendar-day'];

  if (isOtherMonth) classNames.push('other-month');
  if (isToday) classNames.push('today');
  if (isBooked) classNames.push('booked');
  if (isBookedAfterRequest && !isBooked) classNames.push('booked-after-request');
  if (isInLeaseRange && !isBooked && !isBookedAfterRequest) classNames.push('in-lease-range');

  return (
    <div className={classNames.join(' ')}>
      {date.getDate()}
    </div>
  );
}
