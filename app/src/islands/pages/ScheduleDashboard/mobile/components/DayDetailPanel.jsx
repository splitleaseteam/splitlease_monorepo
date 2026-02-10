/**
 * DayDetailPanel Component
 *
 * Inline panel that appears below the calendar when a day is selected.
 * Replaces the DayDetailDrawer bottom sheet for simpler, more predictable behavior.
 *
 * Benefits:
 * - No animation timing bugs (just conditional render)
 * - No click bubbling issues (no backdrop)
 * - No portal complexity (renders in normal DOM flow)
 * - Predictable behavior (simple state: selectedDay or null)
 */

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

/**
 * Status configuration with icons and labels
 */
const STATUS_CONFIG = {
  mine: { icon: '🟣', label: 'Your Night' },
  pending: { icon: '⏳', label: 'Pending Request' },
  blocked: { icon: '🚫', label: 'Blocked' },
  adjacent: { icon: '🔵', label: 'Adjacent Night' },
  outside: { icon: '⚪', label: 'Outside Lease' }
};

/**
 * Inline day detail panel
 * @param {Object} props
 * @param {Date|null} props.date - Selected date (null = hidden)
 * @param {'mine'|'cotenant'|'pending'|null} props.status - Day ownership status
 * @param {number|null} props.price - Price for this day
 * @param {function} props.onAction - Callback: (actionType, date) => void
 * @param {function} props.onClose - Callback to close the panel
 * @param {string} [props.coTenantName] - Co-tenant's display name
 * @param {string} [props.roommateName] - @deprecated Use coTenantName
 */
function formatCounterDate(value) {
  if (!value) return '';
  if (value instanceof Date) return format(value, 'MMM d');
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(`${value}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d');
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'MMM d');
  }
  return '';
}

export default function DayDetailPanel({
  date,
  status,
  price,
  coTenantName,
  roommateName, // @deprecated - use coTenantName
  onAction,
  onClose,
  isCounterMode,
  counterOriginalNight,
  counterTargetNight,
  onSubmitCounter
}) {
  // Don't render if no date selected
  if (!date) return null;

  // Support both new and deprecated prop names
  const resolvedCoTenantName = coTenantName || roommateName || 'Co-tenant';
  const [requestType, setRequestType] = useState('full_week');

  useEffect(() => {
    if (status === 'cotenant') {
      setRequestType('full_week');
    }
  }, [date, status]);

  const { icon, label } = STATUS_CONFIG[status]
    || (status === 'cotenant'
      ? { icon: '🔵', label: `${resolvedCoTenantName}'s Night` }
      : { icon: '⚪', label: 'Outside Lease Period' });

  return (
    <div className="day-detail-panel">
      <div className="day-detail-panel__header">
        <span className="day-detail-panel__date">
          📅 {format(date, 'EEEE, MMMM d')}
        </span>
        <button
          className="day-detail-panel__close"
          onClick={onClose}
          type="button"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="day-detail-panel__info">
        <span>{icon} {label}</span>
        {typeof price === 'number' && <span> • ${price}</span>}
      </div>

      <div className="day-detail-panel__actions">
        {isCounterMode ? (
          <div className="day-detail-panel__counter">
            {counterOriginalNight && counterTargetNight && (
              <p className="day-detail-panel__counter-summary">
                Swap {formatCounterDate(counterOriginalNight)} ↔ {formatCounterDate(counterTargetNight)}
              </p>
            )}
            {counterOriginalNight && !counterTargetNight && (
              <p className="day-detail-panel__counter-summary">
                Select a co-tenant night to request in return.
              </p>
            )}
            {counterOriginalNight && counterTargetNight && (
              <button
                type="button"
                onClick={() => onSubmitCounter?.('')}
                className="day-detail-panel__btn day-detail-panel__btn--counter"
              >
                Submit Counter
              </button>
            )}
          </div>
        ) : (
          <>
            {status === 'cotenant' && (
              <div className="request-type-toggle">
                <div className="request-type-toggle__header">Request Type</div>
                <div className="request-type-toggle__segments" role="group" aria-label="Request type">
                  <button
                    type="button"
                    className={`request-type-toggle__segment ${requestType === 'full_week' ? 'is-selected' : ''}`}
                    onClick={() => setRequestType('full_week')}
                  >
                    <span className="request-type-toggle__icon">💰</span>
                    <span className="request-type-toggle__label">Buy</span>
                    <span className="request-type-toggle__value">
                      {typeof price === 'number' ? `$${price}` : '--'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`request-type-toggle__segment ${requestType === 'alternating' ? 'is-selected' : ''}`}
                    onClick={() => setRequestType('alternating')}
                  >
                    <span className="request-type-toggle__icon">🔄</span>
                    <span className="request-type-toggle__label">Alternating</span>
                    <span className="request-type-toggle__value">1:1</span>
                  </button>
                  <button
                    type="button"
                    className={`request-type-toggle__segment ${requestType === 'share' ? 'is-selected' : ''}`}
                    onClick={() => setRequestType('share')}
                  >
                    <span className="request-type-toggle__icon">🏠</span>
                    <span className="request-type-toggle__label">Share</span>
                    <span className="request-type-toggle__value">
                      {typeof price === 'number' ? `$${Math.round(price / 2)}` : '--'}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  className="request-type-toggle__continue"
                  onClick={() => onAction(requestType, date)}
                >
                  Continue with {requestType === 'full_week' ? 'Full Week' : requestType === 'alternating' ? 'Alternating' : 'Share'} →
                </button>
              </div>
            )}
            {status === 'mine' && (
              <>
                <button
                  type="button"
                  onClick={() => onAction('alternating', date)}
                  className="day-detail-panel__btn day-detail-panel__btn--swap"
                >
                  🔄 Alternating
                </button>
                <button
                  type="button"
                  onClick={() => onAction('share', date)}
                  className="day-detail-panel__btn day-detail-panel__btn--share"
                >
                  🏠 Share
                </button>
              </>
            )}
            {status === 'pending' && (
              <button
                type="button"
                onClick={() => onAction('view', date)}
                className="day-detail-panel__btn day-detail-panel__btn--view"
              >
                📋 View Request
              </button>
            )}
            {!status && (
              <div className="day-detail-panel__no-actions">
                No actions available for this day
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
