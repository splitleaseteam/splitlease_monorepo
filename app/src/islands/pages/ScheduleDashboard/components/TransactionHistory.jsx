/**
 * Transaction History Component
 *
 * Full-width sortable table showing:
 * - Date
 * - Type (Buyout/Swap)
 * - Night(s)
 * - Amount
 * - Status (Complete/Pending/Declined)
 * - Counterparty
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatNights(nights, transaction) {
  if (!nights || nights.length === 0) return '-';
  if (nights.length === 1) {
    return formatDate(nights[0]);
  }
  if (nights.length === 2) {
    if (transaction?.type === 'swap' && transaction.direction) {
      if (transaction.direction === 'outgoing') {
        return `Give ${formatDate(nights[0])} → Get ${formatDate(nights[1])}`;
      }
      return `Get ${formatDate(nights[0])} → Give ${formatDate(nights[1])}`;
    }
    return `${formatDate(nights[0])} ↔ ${formatDate(nights[1])}`;
  }
  return `${nights.length} nights`;
}

/**
 * Format transaction amount with perspective-aware display
 * - Outgoing (buyer/initiator): Shows what they pay (base + their fee)
 * - Incoming (seller/recipient): Shows what they receive (base - their fee)
 */
function formatAmount(transaction) {
  const { direction, initiatorPays, recipientReceives, amount, type } = transaction;

  // Swaps and shares have no monetary amount (just fees)
  if (type === 'swap' || type === 'share') {
    return '$0.00';
  }

  // Use perspective-aware amounts if available, fall back to legacy amount
  let displayAmount;
  if (direction === 'outgoing') {
    // Buyer sees what they pay (base + their fee)
    displayAmount = initiatorPays ?? amount;
  } else {
    // Seller sees what they receive (base - their fee)
    displayAmount = recipientReceives ?? amount;
  }

  if (!displayAmount || displayAmount === 0) return '$0.00';

  const prefix = direction === 'incoming' ? '+' : '-';
  const colorClass = direction === 'incoming' ? 'transaction-history__amount--positive' : 'transaction-history__amount--negative';
  return (
    <span className={colorClass}>
      {prefix}${displayAmount.toFixed(2)}
    </span>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusDot({ status }) {
  const colorMap = {
    complete: 'status-dot--complete',
    pending: 'status-dot--pending',
    declined: 'status-dot--declined',
    cancelled: 'status-dot--cancelled'
  };

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';

  return (
    <span className="status-dot">
      <span className={`status-dot__indicator ${colorMap[status] || ''}`} />
      <span className="status-dot__label">{label}</span>
    </span>
  );
}

function TypeLabel({ type }) {
  const typeMap = {
    buyout: { label: 'Buyout', icon: '💰' },
    swap: { label: 'Swap', icon: '🔄' },
    share: { label: 'Share', icon: '🤝' },
    offer: { label: 'Offer', icon: '📤' }
  };

  const { label, icon } = typeMap[type] || { label: type, icon: '' };

  return (
    <span className="type-label">
      <span className="type-label__icon">{icon}</span>
      <span className="type-label__text">{label}</span>
    </span>
  );
}

function TransactionDetails({ transaction, onCancel, onAccept, onDecline, onCounter }) {
  const hasPriceComparison = transaction.suggestedPrice && transaction.offeredPrice &&
                              transaction.suggestedPrice !== transaction.offeredPrice;

  // Determine if this is my request (outgoing) or someone else's (incoming)
  const isMyRequest = transaction.direction === 'outgoing';

  const deviation = hasPriceComparison
    ? (((transaction.offeredPrice - transaction.suggestedPrice) / transaction.suggestedPrice) * 100).toFixed(0)
    : null;

  return (
    <div className="transaction-details">
      {hasPriceComparison && (
        <div className="transaction-details__section">
          <h4 className="transaction-details__subheading">Pricing</h4>
          <div className="transaction-details__pricing">
            <div className="transaction-details__pricing-row">
              <span className="transaction-details__pricing-label">Offered:</span>
              <span className="transaction-details__pricing-value">${transaction.offeredPrice.toFixed(2)}</span>
            </div>
            <div className="transaction-details__pricing-row">
              <span className="transaction-details__pricing-label">Suggested:</span>
              <span className="transaction-details__pricing-value">${transaction.suggestedPrice.toFixed(2)}</span>
            </div>
            {deviation && (
              <div className="transaction-details__pricing-deviation">
                <span className={`transaction-details__deviation-badge ${
                  Number(deviation) >= -10 ? 'transaction-details__deviation-badge--fair' :
                  Number(deviation) >= -20 ? 'transaction-details__deviation-badge--low' :
                  'transaction-details__deviation-badge--very-low'
                }`}>
                  {deviation > 0 ? `+${deviation}` : deviation}%
                </span>
                <span className="transaction-details__deviation-label">
                  {Number(deviation) >= -10 ? 'Fair offer' :
                   Number(deviation) >= -20 ? 'Slightly below' :
                   'Below suggested'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="transaction-details__section">
        <h4 className="transaction-details__subheading">Timeline</h4>
        <div className="transaction-details__timeline">
          <div className="transaction-details__timeline-item">
            <span className="transaction-details__timeline-date">{formatDate(new Date(transaction.date))}</span>
            <span className="transaction-details__timeline-event">Request created</span>
          </div>
          {transaction.status === 'complete' && (
            <div className="transaction-details__timeline-item">
              <span className="transaction-details__timeline-date">{formatDate(new Date())}</span>
              <span className="transaction-details__timeline-event">Request completed</span>
            </div>
          )}
        </div>
      </div>

      <div className="transaction-details__section">
        <h4 className="transaction-details__subheading">Message Thread</h4>
        <div className="transaction-details__thread">
          {transaction.messages?.map((msg, idx) => (
            <div key={idx} className="transaction-details__msg">
              <strong>{msg.senderName}:</strong> {msg.text}
            </div>
          )) || <p className="transaction-details__empty">No messages for this request.</p>}
        </div>
      </div>

      <div className="transaction-details__footer">
        {transaction.status === 'pending' && (
          <div className="transaction-details__actions">
            {isMyRequest ? (
              /* Case 1: I made the request -> I can Cancel */
              <button
                className="transaction-details__btn transaction-details__btn--cancel"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(transaction.id);
                }}
              >
                Cancel Request
              </button>
            ) : (
              /* Case 2: I received the request -> Accept, Counter, or Decline */
              <>
                <button
                  className="transaction-details__btn transaction-details__btn--accept"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.(transaction.id);
                  }}
                >
                  Accept
                </button>
                {transaction.type === 'buyout' && (
                  <button
                    className="transaction-details__btn transaction-details__btn--counter"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCounter?.(transaction.id);
                    }}
                  >
                    Counter
                  </button>
                )}
                <button
                  className="transaction-details__btn transaction-details__btn--decline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline?.(transaction.id);
                  }}
                >
                  Decline
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransactionHistory({
  transactions = [],
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  onViewDetails,
  activeTransactionId,
  onClearActiveTransaction,
  netFlow
}) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const rowRefs = useRef({});

  // Effect to handle external transaction selection (from calendar click)
  useEffect(() => {
    if (activeTransactionId) {
      // Expand the transaction row
      setExpandedId(activeTransactionId);

      // Scroll to the row after a short delay to ensure DOM is updated
      setTimeout(() => {
        const rowElement = rowRefs.current[activeTransactionId];
        if (rowElement) {
          rowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Add a highlight animation class
          rowElement.classList.add('transaction-history__row--highlighted');
          setTimeout(() => {
            rowElement.classList.remove('transaction-history__row--highlighted');
          }, 2000);
        }
      }, 100);

      // Clear the active transaction after handling
      if (onClearActiveTransaction) {
        setTimeout(() => {
          onClearActiveTransaction();
        }, 500);
      }
    }
  }, [activeTransactionId, onClearActiveTransaction]);

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true;
    if (filter === 'pending') return txn.status === 'pending';
    return txn.type === filter;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIndicator = (field) => {
    if (field !== sortField) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    if (onViewDetails && expandedId !== id) {
      onViewDetails(id);
    }
  };

  return (
    <div className="transaction-history">
      <div className="transaction-history__header">
        <h3 className="transaction-history__heading">Transaction History</h3>
        <select 
          className="transaction-history__filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="buyout">Buyouts</option>
          <option value="swap">Swaps</option>
          <option value="offer">Offers</option>
          <option value="pending">Pending</option>
        </select>
        {netFlow && (
          <div className={`net-flow-tracker net-flow-tracker--${netFlow.direction} transaction-history__net-flow`}>
            <span className="net-flow-tracker__label">This Month</span>
            <span className="net-flow-tracker__amount">{netFlow.formatted}</span>
          </div>
        )}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="transaction-history__empty">
          <p>No transactions found for this filter.</p>
        </div>
      ) : (
        <div className="transaction-history__table-wrapper">
          <table className="transaction-history__table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="transaction-history__th transaction-history__th--sortable"
                >
                  Date{getSortIndicator('date')}
                </th>
                <th
                  onClick={() => handleSort('type')}
                  className="transaction-history__th transaction-history__th--sortable"
                >
                  Type{getSortIndicator('type')}
                </th>
                <th className="transaction-history__th">Night(s)</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="transaction-history__th transaction-history__th--sortable"
                >
                  Amount{getSortIndicator('amount')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="transaction-history__th transaction-history__th--sortable"
                >
                  Status{getSortIndicator('status')}
                </th>
                <th className="transaction-history__th transaction-history__th--action"></th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((txn) => (
                <React.Fragment key={txn.id}>
                  <tr
                    ref={el => rowRefs.current[txn.id] = el}
                    id={`txn-${txn.id}`}
                    className={`transaction-history__row ${expandedId === txn.id ? 'transaction-history__row--expanded' : ''}`}
                    onClick={() => toggleExpand(txn.id)}
                  >
                    <td className="transaction-history__td">
                      {formatDate(new Date(txn.date))}
                    </td>
                    <td className="transaction-history__td">
                      <TypeLabel type={txn.type} />
                    </td>
                    <td className="transaction-history__td">
                      {formatNights((txn.nights || []).map(n => new Date(n)), txn)}
                    </td>
                    <td className="transaction-history__td">
                      {formatAmount(txn)}
                    </td>
                    <td className="transaction-history__td">
                      <StatusDot status={txn.status} />
                    </td>
                    <td className="transaction-history__td transaction-history__td--action">
                      <span className={`transaction-history__chevron ${expandedId === txn.id ? 'transaction-history__chevron--expanded' : ''}`}>
                        ›
                      </span>
                    </td>
                  </tr>
                  {expandedId === txn.id && (
                    <tr className="transaction-history__details-row">
                      <td colSpan="6" className="transaction-history__td--details">
                        <TransactionDetails
                          transaction={txn}
                          onCancel={onCancelRequest}
                          onAccept={onAcceptRequest}
                          onDecline={onDeclineRequest}
                          onCounter={onCounterRequest}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

TransactionHistory.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    type: PropTypes.oneOf(['buyout', 'swap', 'share', 'offer']),
    nights: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])),
    amount: PropTypes.number,
    status: PropTypes.oneOf(['complete', 'pending', 'declined', 'cancelled']),
    counterpartyName: PropTypes.string,
    messages: PropTypes.array,
  })),
  onCancelRequest: PropTypes.func,
  onAcceptRequest: PropTypes.func,
  onDeclineRequest: PropTypes.func,
  onCounterRequest: PropTypes.func,
  onViewDetails: PropTypes.func,
  activeTransactionId: PropTypes.string,
  onClearActiveTransaction: PropTypes.func,
  netFlow: PropTypes.shape({
    amount: PropTypes.number,
    direction: PropTypes.oneOf(['positive', 'negative', 'neutral']),
    formatted: PropTypes.string
  }),
};
