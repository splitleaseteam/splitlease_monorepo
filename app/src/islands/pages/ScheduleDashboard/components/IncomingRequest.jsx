/**
 * Incoming Request Component
 *
 * Displays incoming requests with actions based on lease type:
 * - Co-tenant leases: Accept/Counter/Decline for buyout/swap requests
 * - Guest-host leases (host): Approve/Decline for date change/cancellation requests
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a date string for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format multiple dates for display
 * @param {string[]|Date[]} dates - Array of dates to format
 * @returns {string} Formatted dates string
 */
function formatDates(dates) {
  if (!dates || dates.length === 0) return '';
  if (dates.length === 1) return formatDate(dates[0]);
  if (dates.length <= 3) return dates.map(formatDate).join(', ');
  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])} (${dates.length} nights)`;
}

/**
 * Get time ago string
 * @param {string|Date} timestamp - Timestamp
 * @returns {string} Time ago string
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// ============================================================================
// REQUEST TYPE LABELS
// ============================================================================

const REQUEST_TYPE_LABELS = {
  buyout: 'Buyout Request',
  swap: 'Swap Request',
  share: 'Co-Occupy Request',
  date_change: 'Date Change Request',
  cancellation: 'Cancellation Request',
  offer_dates: 'Date Offer',
};

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'incoming-request__badge--pending' },
    accepted: { label: 'Accepted', className: 'incoming-request__badge--accepted' },
    declined: { label: 'Declined', className: 'incoming-request__badge--declined' },
    countered: { label: 'Countered', className: 'incoming-request__badge--countered' },
    expired: { label: 'Expired', className: 'incoming-request__badge--expired' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`incoming-request__badge ${config.className}`}>
      {config.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function IncomingRequest({
  request,
  lease,
  userRole,
  senderName,
  onAccept,
  onDecline,
  onCounter,
  onApprove,
  isProcessing = false,
}) {
  // Determine if this is a guest-host lease
  const isGuestHost = lease && !lease.isCoTenant;

  // Generate request description based on type
  const requestDescription = useMemo(() => {
    if (!request) return '';

    const { type, night, nights, dates, oldDates, newDates, amount } = request;

    switch (type) {
      case 'buyout':
        return `${senderName || 'Roommate'} wants to buy ${formatDate(night || nights?.[0])} for $${amount?.toFixed(2) || '0.00'}`;
      case 'swap':
        return `${senderName || 'Roommate'} wants to swap ${formatDate(night || nights?.[0])}`;
      case 'share':
        return `${senderName || 'Roommate'} wants to co-occupy on ${formatDate(night || nights?.[0])}`;
      case 'date_change':
        return `${senderName || 'Guest'} wants to change from ${formatDates(oldDates)} to ${formatDates(newDates)}`;
      case 'cancellation':
        return `${senderName || 'Guest'} wants to cancel ${formatDates(dates || nights)}`;
      case 'offer_dates':
        return `${senderName || 'Host'} is offering ${formatDates(dates || nights)}`;
      default:
        return 'New request received';
    }
  }, [request, senderName]);

  // Check if actions are available (only for pending requests)
  const isPending = request?.status === 'pending';

  if (!request) return null;

  return (
    <div className={`incoming-request ${!isPending ? 'incoming-request--resolved' : ''}`}>
      {/* Request Header */}
      <div className="incoming-request__header">
        <div className="incoming-request__type-info">
          <span className="incoming-request__type">
            {REQUEST_TYPE_LABELS[request.type] || 'Request'}
          </span>
          <StatusBadge status={request.status} />
        </div>
        <span className="incoming-request__time">{getTimeAgo(request.createdAt)}</span>
      </div>

      {/* Request Content */}
      <div className="incoming-request__content">
        <p className="incoming-request__description">{requestDescription}</p>

        {/* Show message if included */}
        {request.message && (
          <div className="incoming-request__message">
            <span className="incoming-request__message-label">Message:</span>
            <p className="incoming-request__message-text">"{request.message}"</p>
          </div>
        )}

        {/* Show amount details for buyout requests */}
        {request.type === 'buyout' && request.amount && (
          <div className="incoming-request__amount">
            <span className="incoming-request__amount-label">Offered Amount:</span>
            <span className="incoming-request__amount-value">${request.amount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Actions - Only show for pending requests */}
      {isPending && (
        <div className="incoming-request__actions">
          {/* Guest-host lease: Host sees approve/decline */}
          {isGuestHost && userRole === 'host' && (
            <>
              <button
                className="incoming-request__btn incoming-request__btn--success"
                onClick={() => onApprove?.(request)}
                disabled={isProcessing}
              >
                {request.type === 'date_change' ? 'Approve Date Change' : 'Approve'}
              </button>
              <button
                className="incoming-request__btn incoming-request__btn--outline"
                onClick={() => onDecline?.(request)}
                disabled={isProcessing}
              >
                Decline
              </button>
            </>
          )}

          {/* Guest-host lease: Guest sees accept/decline for host offers */}
          {isGuestHost && userRole === 'guest' && request.type === 'offer_dates' && (
            <>
              <button
                className="incoming-request__btn incoming-request__btn--success"
                onClick={() => onAccept?.(request)}
                disabled={isProcessing}
              >
                Accept Dates
              </button>
              <button
                className="incoming-request__btn incoming-request__btn--outline"
                onClick={() => onDecline?.(request)}
                disabled={isProcessing}
              >
                Decline
              </button>
            </>
          )}

          {/* Co-tenant lease: Show accept/counter/decline options */}
          {(!lease || lease.isCoTenant) && (
            <>
              <button
                className="incoming-request__btn incoming-request__btn--success"
                onClick={() => onAccept?.(request)}
                disabled={isProcessing}
              >
                Accept{request.amount ? ` $${request.amount.toFixed(2)}` : ''}
              </button>
              {request.type === 'buyout' && (
                <button
                  className="incoming-request__btn incoming-request__btn--secondary"
                  onClick={() => onCounter?.(request)}
                  disabled={isProcessing}
                >
                  Counter
                </button>
              )}
              <button
                className="incoming-request__btn incoming-request__btn--outline"
                onClick={() => onDecline?.(request)}
                disabled={isProcessing}
              >
                Decline
              </button>
            </>
          )}
        </div>
      )}

      {/* Resolved status message */}
      {!isPending && (
        <div className="incoming-request__resolved">
          {request.status === 'accepted' && (
            <p className="incoming-request__resolved-text incoming-request__resolved-text--success">
              You accepted this request
            </p>
          )}
          {request.status === 'declined' && (
            <p className="incoming-request__resolved-text incoming-request__resolved-text--declined">
              You declined this request
            </p>
          )}
          {request.status === 'countered' && (
            <p className="incoming-request__resolved-text incoming-request__resolved-text--countered">
              You sent a counter offer
            </p>
          )}
          {request.status === 'expired' && (
            <p className="incoming-request__resolved-text incoming-request__resolved-text--expired">
              This request has expired
            </p>
          )}
        </div>
      )}
    </div>
  );
}

IncomingRequest.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf(['buyout', 'swap', 'share', 'date_change', 'cancellation', 'offer_dates']),
    status: PropTypes.oneOf(['pending', 'accepted', 'declined', 'countered', 'expired']),
    night: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    nights: PropTypes.array,
    dates: PropTypes.array,
    oldDates: PropTypes.array,
    newDates: PropTypes.array,
    amount: PropTypes.number,
    message: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  lease: PropTypes.shape({
    isCoTenant: PropTypes.bool,
  }),
  userRole: PropTypes.oneOf(['guest', 'host']),
  senderName: PropTypes.string,
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  onCounter: PropTypes.func,
  onApprove: PropTypes.func,
  isProcessing: PropTypes.bool,
};
