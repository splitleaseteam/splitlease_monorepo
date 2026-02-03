/**
 * MobileTransactionList Component
 *
 * Mobile transaction history list with expandable details.
 * Displays buyouts, swaps, and shares sorted by date.
 */

import React, { useState, useMemo } from 'react';
import TransactionRow from './TransactionRow.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Mobile transaction list
 * @param {Object} props
 * @param {Array} props.transactions - Array of transaction objects
 * @param {string} props.currentUserId - Current user's ID
 * @param {function} props.onAccept - Callback when transaction is accepted
 * @param {function} props.onDecline - Callback when transaction is declined
 * @param {function} props.onCancel - Callback when transaction is cancelled
 * @param {function} props.onViewDetails - Callback to view full details (opens bottom sheet)
 */
export default function MobileTransactionList({
  transactions,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onViewDetails
}) {
  const [expandedId, setExpandedId] = useState(null);

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [transactions]);

  const handleToggle = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (sortedTransactions.length === 0) {
    return (
      <div className="mobile-txn-list">
        <EmptyState
          icon="📋"
          title="No transactions yet"
          hint="Buyout requests, swaps, and shares will appear here"
        />
      </div>
    );
  }

  return (
    <div className="mobile-txn-list">
      {sortedTransactions.map((txn) => {
        // Handle both payerId (mock data) and requesterId (component expectation)
        const requesterId = txn.requesterId || txn.payerId;
        const isRequester = requesterId === currentUserId;
        const isMine = requesterId === currentUserId || txn.payeeId === currentUserId;

        return (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            isExpanded={expandedId === txn.id}
            onToggle={() => handleToggle(txn.id)}
            isMine={isMine}
            isRequester={isRequester}
            onAccept={onAccept}
            onDecline={onDecline}
            onCancel={onCancel}
            onViewDetails={onViewDetails}
          />
        );
      })}
    </div>
  );
}
