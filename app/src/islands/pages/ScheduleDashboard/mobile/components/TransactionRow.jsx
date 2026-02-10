/**
 * TransactionRow Component
 *
 * Compact transaction row with expand toggle.
 */

import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import TransactionDetails from './TransactionDetails.jsx';

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get icon for transaction type
 * @param {string} type - Transaction type
 * @returns {string} Emoji icon
 */
function getTypeIcon(type) {
  switch (type?.toLowerCase()) {
    case 'full_week':
      return '💰';
    case 'alternating':
      return '🔄';
    case 'share':
      return '🏠';
    default:
      return '📝';
  }
}

/**
 * Transaction row component
 * @param {Object} props
 * @param {Object} props.transaction - Transaction data
 * @param {boolean} props.isExpanded - Whether details are showing
 * @param {function} props.onToggle - Toggle expand/collapse
 * @param {boolean} props.isMine - Whether current user is involved
 * @param {boolean} props.isRequester - Whether current user is the requester
 * @param {function} props.onAccept - Accept callback
 * @param {function} props.onDecline - Decline callback
 * @param {function} props.onCancel - Cancel callback
 * @param {function} props.onViewDetails - View full details callback
 */
export default function TransactionRow({
  transaction,
  isExpanded,
  onToggle,
  isMine,
  isRequester,
  onAccept,
  onDecline,
  onCancel,
  onViewDetails
}) {
  const { type, nights, amount, status, date, createdAt } = transaction;

  // Get the first night date for display
  const displayDate = nights?.[0] || date || createdAt;
  const dateLabel = formatDate(displayDate);
  const icon = getTypeIcon(type);
  const nightCount = nights?.length || 1;

  const classNames = [
    'txn-row',
    isExpanded ? 'txn-row--expanded' : '',
    `txn-row--${status || 'pending'}`
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <button
        className="txn-row__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${capitalize(type)} transaction, ${status}, ${dateLabel}`}
      >
        <span className="txn-row__icon" aria-hidden="true">
          {icon}
        </span>
        <div className="txn-row__info">
          <span className="txn-row__type">{capitalize(type)}</span>
          <span className="txn-row__meta">
            {dateLabel}
            {nightCount > 1 && ` (${nightCount} nights)`}
          </span>
        </div>
        {amount > 0 && (
          <span className="txn-row__amount">${amount}</span>
        )}
        <StatusBadge status={status} />
        <span className="txn-row__chevron" aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <TransactionDetails
          transaction={transaction}
          isMine={isMine}
          isRequester={isRequester}
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
        />
      )}
    </div>
  );
}
