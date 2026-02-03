/**
 * TransactionDetails Component
 *
 * Expanded transaction details with action buttons.
 */

import React, { useState, useCallback } from 'react';

/**
 * Format full date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format relative time
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatFullDate(date);
}

/**
 * Transaction details component
 * @param {Object} props
 * @param {Object} props.transaction - Transaction data
 * @param {boolean} props.isMine - Whether current user is involved
 * @param {boolean} props.isRequester - Whether current user is the requester
 * @param {function} props.onAccept - Accept callback
 * @param {function} props.onDecline - Decline callback
 * @param {function} props.onCancel - Cancel callback
 * @param {function} props.onViewDetails - View full details callback
 */
export default function TransactionDetails({
  transaction,
  isMine,
  isRequester,
  onAccept,
  onDecline,
  onCancel,
  onViewDetails
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const { id, type, nights, amount, status, date, createdAt, note } = transaction;
  const showActions = status === 'pending';
  const canRespond = showActions && !isRequester;
  const canCancel = showActions && isRequester;

  const handleAction = useCallback(async (action, handler) => {
    if (isProcessing || !handler) return;

    setIsProcessing(true);
    setProcessingAction(action);

    try {
      await handler(id);
    } catch (error) {
      console.error(`Failed to ${action} transaction:`, error);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [isProcessing, id]);

  return (
    <div className="txn-details">
      {/* Date info */}
      <div className="txn-details__row">
        <span className="txn-details__label">Date</span>
        <span className="txn-details__value">
          {nights?.length > 0
            ? nights.map((n) => formatFullDate(n)).join(', ')
            : formatFullDate(date)}
        </span>
      </div>

      {/* Amount */}
      {amount > 0 && (
        <div className="txn-details__row">
          <span className="txn-details__label">Amount</span>
          <span className="txn-details__value txn-details__value--amount">
            ${amount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Type */}
      <div className="txn-details__row">
        <span className="txn-details__label">Type</span>
        <span className="txn-details__value">
          {type?.charAt(0).toUpperCase() + type?.slice(1)}
        </span>
      </div>

      {/* Requested time */}
      <div className="txn-details__row">
        <span className="txn-details__label">Requested</span>
        <span className="txn-details__value">
          {formatRelativeTime(createdAt || date)}
        </span>
      </div>

      {/* Note if present */}
      {note && (
        <div className="txn-details__note">
          <span className="txn-details__note-label">Note</span>
          <p className="txn-details__note-text">{note}</p>
        </div>
      )}

      {/* Action buttons */}
      {(canRespond || canCancel) && (
        <div className="txn-details__actions">
          {canCancel && (
            <button
              className="txn-details__btn txn-details__btn--cancel"
              onClick={() => handleAction('cancel', onCancel)}
              disabled={isProcessing}
            >
              {processingAction === 'cancel' ? (
                <span className="txn-details__spinner" />
              ) : (
                'Cancel Request'
              )}
            </button>
          )}
          {canRespond && (
            <>
              <button
                className="txn-details__btn txn-details__btn--accept"
                onClick={() => handleAction('accept', onAccept)}
                disabled={isProcessing}
              >
                {processingAction === 'accept' ? (
                  <span className="txn-details__spinner" />
                ) : (
                  'Accept'
                )}
              </button>
              <button
                className="txn-details__btn txn-details__btn--decline"
                onClick={() => handleAction('decline', onDecline)}
                disabled={isProcessing}
              >
                {processingAction === 'decline' ? (
                  <span className="txn-details__spinner" />
                ) : (
                  'Decline'
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* View more details link */}
      {onViewDetails && (
        <button
          className="txn-details__view-more"
          onClick={() => onViewDetails(transaction)}
        >
          View Full Details →
        </button>
      )}
    </div>
  );
}
