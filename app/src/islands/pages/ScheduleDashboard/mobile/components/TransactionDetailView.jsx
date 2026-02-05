/**
 * TransactionDetailView Component
 *
 * Full-screen transaction detail view with timeline and actions.
 */

import React, { useMemo, useState, useCallback } from 'react';

function formatFullDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

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

function getTypeIcon(type) {
  switch (type?.toLowerCase()) {
    case 'buyout':
      return '💰';
    case 'swap':
      return '🔄';
    case 'share':
      return '🏠';
    default:
      return '📝';
  }
}

function getStatusLabel(status) {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'accepted':
    case 'complete':
    case 'completed':
      return '✅';
    case 'declined':
      return '❌';
    case 'cancelled':
      return '🚫';
    default:
      return '⏳';
  }
}

export default function TransactionDetailView({
  transaction,
  requestMessage,
  currentUserId,
  onClose,
  onAccept,
  onDecline,
  onCancel,
  onCounter
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const { id, type, nights, amount, status, date, createdAt, note } = transaction;
  const requesterId = transaction.requesterId || transaction.payerId;
  const isRequester = requesterId === currentUserId;
  const showActions = status === 'pending';
  const canRespond = showActions && !isRequester;
  const canCancel = showActions && isRequester;
  const requestId = requestMessage?.id || null;

  const headerDate = nights?.[0] || date || createdAt;
  const messageText = note || requestMessage?.requestData?.message || requestMessage?.text || '';

  const timeline = useMemo(() => {
    const events = [];
    const created = createdAt || date;
    if (created) {
      events.push({ label: 'Request created', time: formatTime(created) });
    }

    if (status === 'pending') {
      events.push({ label: 'Waiting for response' });
    } else if (status) {
      events.push({ label: `${getStatusLabel(status)} by co-tenant` });
    }

    return events;
  }, [createdAt, date, status]);

  const handleAction = useCallback(async (action, handler, payload) => {
    if (isProcessing || !handler) return;

    setIsProcessing(true);
    setProcessingAction(action);

    try {
      await handler(payload);
    } catch (error) {
      console.error(`Failed to ${action} transaction:`, error);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [isProcessing]);

  return (
    <div className="transaction-detail-view">
      <header className="transaction-detail-view__header">
        <button
          type="button"
          className="transaction-detail-view__back"
          onClick={onClose}
        >
          ← Back
        </button>
        <span className="transaction-detail-view__title">Transaction Detail</span>
      </header>

      <div className="transaction-detail-view__content">
        <div className="transaction-detail-view__hero">
          <span className="transaction-detail-view__icon" aria-hidden="true">{getTypeIcon(type)}</span>
          <div>
            <h2 className="transaction-detail-view__type">
              {getStatusLabel(type)} Request
            </h2>
            <p className="transaction-detail-view__subtitle">
              {formatFullDate(headerDate)}
            </p>
          </div>
        </div>

        <div className="transaction-detail-view__section">
          <div className="transaction-detail-view__row">
            <span className="transaction-detail-view__label">Date</span>
            <span className="transaction-detail-view__value">
              {nights?.length > 0
                ? nights.map((night) => formatFullDate(night)).join(', ')
                : formatFullDate(headerDate)}
            </span>
          </div>
          {typeof amount === 'number' && amount > 0 && (
            <div className="transaction-detail-view__row">
              <span className="transaction-detail-view__label">Amount</span>
              <span className="transaction-detail-view__value">${amount.toFixed(2)}</span>
            </div>
          )}
          <div className="transaction-detail-view__row">
            <span className="transaction-detail-view__label">Status</span>
            <span className="transaction-detail-view__value">{getStatusIcon(status)} {getStatusLabel(status)}</span>
          </div>
          <div className="transaction-detail-view__row">
            <span className="transaction-detail-view__label">Requested</span>
            <span className="transaction-detail-view__value">{formatRelativeTime(createdAt || date)}</span>
          </div>
        </div>

        <div className="transaction-detail-view__section">
          <h3 className="transaction-detail-view__section-title">Timeline</h3>
          <div className="transaction-detail-view__timeline">
            {timeline.map((event, index) => (
              <div key={`${event.label}-${index}`} className="transaction-detail-view__timeline-item">
                <span className="transaction-detail-view__timeline-dot" aria-hidden="true" />
                <div>
                  <div className="transaction-detail-view__timeline-label">{event.label}</div>
                  {event.time && (
                    <div className="transaction-detail-view__timeline-time">{event.time}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {messageText && (
          <div className="transaction-detail-view__section">
            <h3 className="transaction-detail-view__section-title">Message</h3>
            <p className="transaction-detail-view__message">"{messageText}"</p>
          </div>
        )}
      </div>

      {(canRespond || canCancel) && (
        <footer className="transaction-detail-view__footer">
          {canCancel && (
            <button
              type="button"
              className="transaction-detail-view__btn transaction-detail-view__btn--cancel"
              onClick={() => handleAction('cancel', onCancel, id)}
              disabled={isProcessing}
            >
              {processingAction === 'cancel' ? <span className="transaction-detail-view__spinner" /> : 'Cancel'}
            </button>
          )}
          {canRespond && (
            <>
              <button
                type="button"
                className="transaction-detail-view__btn transaction-detail-view__btn--accept"
                onClick={() => handleAction('accept', onAccept, requestId || id)}
                disabled={isProcessing}
              >
                {processingAction === 'accept' ? <span className="transaction-detail-view__spinner" /> : 'Accept'}
              </button>
              <button
                type="button"
                className="transaction-detail-view__btn transaction-detail-view__btn--decline"
                onClick={() => handleAction('decline', onDecline, requestId || id)}
                disabled={isProcessing}
              >
                {processingAction === 'decline' ? <span className="transaction-detail-view__spinner" /> : 'Decline'}
              </button>
              {requestId && onCounter && (
                <button
                  type="button"
                  className="transaction-detail-view__btn transaction-detail-view__btn--counter"
                  onClick={() => handleAction('counter', onCounter, requestId)}
                  disabled={isProcessing}
                >
                  {processingAction === 'counter' ? <span className="transaction-detail-view__spinner" /> : 'Counter'}
                </button>
              )}
            </>
          )}
        </footer>
      )}
    </div>
  );
}
