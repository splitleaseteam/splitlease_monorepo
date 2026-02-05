import React from 'react';
import PropTypes from 'prop-types';

/**
 * Calendar day cell for ScheduleCalendar.
 *
 * @param {Date|null} date - Day date or null for empty cells.
 * @param {string} ownership - 'mine' | 'roommate' | 'outside' | 'empty'.
 * @param {boolean} isAdjacent - Whether the day is adjacent to user's nights.
 * @param {string|null} requestStatus - 'pending' | 'blocked' | null.
 * @param {boolean} isSelected - Whether the day is currently selected.
 * @param {boolean} clickable - Whether the day is interactive.
 * @param {boolean} hasTransaction - Whether a transaction exists on this date.
 * @param {boolean} isLowAmount - Whether the transaction amount is low.
 * @param {object|null} transaction - Transaction record if present.
 * @param {string|null} transactionAmount - Formatted transaction amount.
 * @param {object|null} priceOverlay - Pricing overlay if present.
 * @param {boolean} isShared - Whether the day is shared.
 * @param {function} onClick - Click handler.
 * @param {string} ariaLabel - Accessible label for screen readers.
 */
export default function CalendarDay({
  date,
  ownership,
  isAdjacent,
  requestStatus,
  isSelected,
  clickable,
  hasTransaction,
  isLowAmount,
  transaction,
  stay,
  transactionAmount,
  priceOverlay,
  isShared,
  onClick,
  ariaLabel
}) {
  const assignedUser = stay?.User || stay?.assignedTo || transaction?.User || transaction?.assignedTo;
  const isAssigned = Boolean(assignedUser);
  const resolvedOwnership = ownership === 'empty' && isAssigned ? 'roommate' : ownership;

  if (date && date.getMonth() === 1 && date.getDate() === 14) {
    console.log('[CalendarDay] Feb 14 debug', {
      date: date.toISOString(),
      ownership,
      resolvedOwnership,
      assignedUser,
      stay,
      transaction
    });
  }

  const dayClassName = `
    schedule-calendar__day
    schedule-calendar__day--${resolvedOwnership}
    ${isAdjacent ? 'schedule-calendar__day--adjacent' : ''}
    ${requestStatus ? `schedule-calendar__day--${requestStatus}` : ''}
    ${isSelected ? 'schedule-calendar__day--selected' : ''}
    ${clickable ? 'schedule-calendar__day--clickable' : ''}
    ${hasTransaction ? 'schedule-calendar__day--has-transaction' : ''}
    ${hasTransaction && isLowAmount ? 'schedule-calendar__day--transaction-neutral' : ''}
    ${hasTransaction && !isLowAmount && transaction?.direction === 'incoming' ? 'schedule-calendar__day--transaction-incoming' : ''}
    ${hasTransaction && !isLowAmount && transaction?.direction === 'outgoing' ? 'schedule-calendar__day--transaction-outgoing' : ''}
    ${priceOverlay ? 'schedule-calendar__day--has-price' : ''}
    ${isShared ? 'schedule-calendar__day--shared' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type="button"
      className={dayClassName}
      onClick={onClick}
      disabled={!clickable}
      aria-label={date ? ariaLabel : undefined}
      aria-pressed={isSelected || undefined}
      tabIndex={clickable ? 0 : -1}
    >
      <span className="schedule-calendar__day-number">
        {date ? date.getDate() : ''}
      </span>
      {hasTransaction && (
        <span className="schedule-calendar__day-transaction">
          {transactionAmount}
        </span>
      )}
      {priceOverlay && (
        <span
          className="schedule-calendar__price-bar"
          data-tier={priceOverlay.tier}
          title={priceOverlay.title}
        >
          {priceOverlay.prefix}{priceOverlay.price}
        </span>
      )}
    </button>
  );
}

CalendarDay.propTypes = {
  date: PropTypes.instanceOf(Date),
  ownership: PropTypes.string.isRequired,
  isAdjacent: PropTypes.bool.isRequired,
  requestStatus: PropTypes.string,
  isSelected: PropTypes.bool.isRequired,
  clickable: PropTypes.bool.isRequired,
  hasTransaction: PropTypes.bool.isRequired,
  isLowAmount: PropTypes.bool.isRequired,
  transaction: PropTypes.shape({
    direction: PropTypes.oneOf(['incoming', 'outgoing'])
  }),
  stay: PropTypes.shape({
    User: PropTypes.string,
    assignedTo: PropTypes.string
  }),
  transactionAmount: PropTypes.string,
  priceOverlay: PropTypes.shape({
    price: PropTypes.number.isRequired,
    tier: PropTypes.oneOf(['within', 'near', 'limit']).isRequired,
    prefix: PropTypes.string,
    title: PropTypes.string
  }),
  isShared: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string
};
