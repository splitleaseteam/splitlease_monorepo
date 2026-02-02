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

import React, { useState } from 'react';
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

function formatNights(nights) {
  if (!nights || nights.length === 0) return '-';
  if (nights.length === 1) {
    return formatDate(nights[0]);
  }
  if (nights.length === 2) {
    return `${formatDate(nights[0])} ↔ ${formatDate(nights[1])}`;
  }
  return `${nights.length} nights`;
}

function formatAmount(amount, direction) {
  if (amount === 0) return '$0.00';
  const prefix = direction === 'incoming' ? '+' : '-';
  const colorClass = direction === 'incoming' ? 'transaction-history__amount--positive' : 'transaction-history__amount--negative';
  return (
    <span className={colorClass}>
      {prefix}${amount.toFixed(2)}
    </span>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatusBadge({ status }) {
  const statusMap = {
    complete: { label: 'Complete', icon: '✅' },
    pending: { label: 'Pending', icon: '⏳' },
    declined: { label: 'Declined', icon: '❌' },
    cancelled: { label: 'Cancelled', icon: '🔙' }
  };

  const { label, icon } = statusMap[status] || { label: status, icon: '' };

  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__icon">{icon}</span> {label}
    </span>
  );
}

function TypeBadge({ type }) {
  const typeMap = {
    buyout: { label: 'Buyout', icon: '💰' },
    swap: { label: 'Swap', icon: '🔄' },
    offer: { label: 'Offer', icon: '📤' }
  };

  const { label, icon } = typeMap[type] || { label: type, icon: '' };

  return (
    <span className={`type-badge type-badge--${type}`}>
      <span className="type-badge__icon">{icon}</span> {label}
    </span>
  );
}

function TransactionDetails({ transaction, onCancel }) {
  return (
    <div className="transaction-details">
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
          <button 
            className="transaction-details__btn transaction-details__btn--cancel"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(transaction.id);
            }}
          >
            Cancel Request
          </button>
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
  onViewDetails
}) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

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
                <th className="transaction-history__th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((txn) => (
                <React.Fragment key={txn.id}>
                  <tr 
                    className={`transaction-history__row ${expandedId === txn.id ? 'transaction-history__row--expanded' : ''}`}
                    onClick={() => toggleExpand(txn.id)}
                  >
                    <td className="transaction-history__td">
                      {formatDate(new Date(txn.date))}
                    </td>
                    <td className="transaction-history__td">
                      <TypeBadge type={txn.type} />
                    </td>
                    <td className="transaction-history__td">
                      {formatNights((txn.nights || []).map(n => new Date(n)))}
                    </td>
                    <td className="transaction-history__td">
                      {formatAmount(txn.amount, txn.direction)}
                    </td>
                    <td className="transaction-history__td">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="transaction-history__td">
                      <button className="transaction-history__detail-btn">
                        {expandedId === txn.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === txn.id && (
                    <tr className="transaction-history__details-row">
                      <td colSpan="6" className="transaction-history__td--details">
                        <TransactionDetails 
                          transaction={txn} 
                          onCancel={onCancelRequest} 
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
    type: PropTypes.oneOf(['buyout', 'swap', 'offer']),
    nights: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])),
    amount: PropTypes.number,
    status: PropTypes.oneOf(['complete', 'pending', 'declined', 'cancelled']),
    counterpartyName: PropTypes.string,
    messages: PropTypes.array,
  })),
  onCancelRequest: PropTypes.func,
  onViewDetails: PropTypes.func,
};
