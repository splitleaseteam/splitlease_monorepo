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

import React from 'react';
import { format } from 'date-fns';

/**
 * Status configuration with icons and labels
 */
const STATUS_CONFIG = {
  mine: { icon: '🟣', label: 'Your Night' },
  pending: { icon: '⏳', label: 'Pending Request' }
};

/**
 * Inline day detail panel
 * @param {Object} props
 * @param {Date|null} props.date - Selected date (null = hidden)
 * @param {'mine'|'roommate'|'pending'|null} props.status - Day ownership status
 * @param {number|null} props.price - Price for this day
 * @param {function} props.onAction - Callback: (actionType, date) => void
 * @param {function} props.onClose - Callback to close the panel
 */
export default function DayDetailPanel({ date, status, price, roommateName, onAction, onClose }) {
  // Don't render if no date selected
  if (!date) return null;

  const resolvedRoommateName = roommateName || 'Roommate';
  const { icon, label } = STATUS_CONFIG[status]
    || (status === 'roommate'
      ? { icon: '🔵', label: `${resolvedRoommateName}'s Night` }
      : { icon: '⚪', label: 'Unassigned' });

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
        {status === 'roommate' && (
          <>
            <button
              type="button"
              onClick={() => onAction('buyout', date)}
              className="day-detail-panel__btn day-detail-panel__btn--buyout"
            >
              💰 Buyout
            </button>
            <button
              type="button"
              onClick={() => onAction('swap', date)}
              className="day-detail-panel__btn day-detail-panel__btn--swap"
            >
              🔄 Swap
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
        {status === 'mine' && (
          <>
            <button
              type="button"
              onClick={() => onAction('swap', date)}
              className="day-detail-panel__btn day-detail-panel__btn--swap"
            >
              🔄 Swap
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
      </div>
    </div>
  );
}
