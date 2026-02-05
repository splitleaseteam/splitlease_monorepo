/**
 * Request Confirmation Component
 *
 * Confirmation dialog for various request types:
 * - Co-tenant leases: Buyout, Swap confirmations
 * - Guest-host leases: Date change, Cancellation confirmations
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
  if (dates.length === 2) return `${formatDate(dates[0])} and ${formatDate(dates[1])}`;
  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])} (${dates.length} nights)`;
}

// ============================================================================
// CONFIRMATION TEXT GENERATORS
// ============================================================================

const confirmationTextGenerators = {
  // Co-tenant lease confirmations
  co_tenant: {
    buyout: ({ night, counterpartyName, amount }) =>
      `Request to buy out ${formatDate(night)} from ${counterpartyName || 'your roommate'} for $${amount?.toFixed(2) || '0.00'}?`,
    swap: ({ night, counterpartyName, offerNight }) =>
      `Offer to swap ${formatDate(night)} with ${counterpartyName || 'your roommate'}${offerNight ? ` for ${formatDate(offerNight)}` : ''}?`,
    share: ({ night, counterpartyName }) =>
      `Request to co-occupy the space on ${formatDate(night)} with ${counterpartyName || 'your roommate'}?`,
  },

  // Guest-host lease confirmations (guest perspective)
  guest: {
    date_change: ({ oldDates, newDates }) =>
      `Request to change your booking from ${formatDates(oldDates)} to ${formatDates(newDates)}?`,
    cancellation: ({ dates, refundAmount }) =>
      `Request to cancel your booking for ${formatDates(dates)}?${refundAmount ? ` Estimated refund: $${refundAmount.toFixed(2)}` : ''}`,
  },

  // Guest-host lease confirmations (host perspective)
  host: {
    offer_dates: ({ dates, guestName }) =>
      `Offer ${formatDates(dates)} to ${guestName || 'your guest'}?`,
    block_dates: ({ dates }) =>
      `Block ${formatDates(dates)} from bookings?`,
    approve_date_change: ({ guestName, newDates }) =>
      `Approve ${guestName || 'guest'}'s request to change to ${formatDates(newDates)}?`,
    decline_date_change: ({ guestName }) =>
      `Decline ${guestName || 'guest'}'s date change request?`,
    approve_cancellation: ({ guestName, refundAmount }) =>
      `Approve ${guestName || 'guest'}'s cancellation request?${refundAmount ? ` Refund: $${refundAmount.toFixed(2)}` : ''}`,
    decline_cancellation: ({ guestName }) =>
      `Decline ${guestName || 'guest'}'s cancellation request?`,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RequestConfirmation({
  isOpen,
  lease,
  userRole,
  requestType,
  requestData,
  counterpartyName,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) {
  // Generate confirmation text based on lease type and request type
  const confirmationText = useMemo(() => {
    if (!requestType) return 'Are you sure you want to proceed?';

    // Determine which text generator to use
    let generatorCategory;
    if (!lease || lease.isCoTenant) {
      generatorCategory = 'co_tenant';
    } else if (userRole === 'guest') {
      generatorCategory = 'guest';
    } else {
      generatorCategory = 'host';
    }

    const generator = confirmationTextGenerators[generatorCategory]?.[requestType];
    if (!generator) return 'Are you sure you want to proceed?';

    return generator({
      ...requestData,
      counterpartyName,
    });
  }, [lease, userRole, requestType, requestData, counterpartyName]);

  // Generate button labels based on request type
  const buttonLabels = useMemo(() => {
    const typeLabels = {
      buyout: { confirm: 'Send Request', cancel: 'Cancel' },
      swap: { confirm: 'Send Offer', cancel: 'Cancel' },
      share: { confirm: 'Send Request', cancel: 'Cancel' },
      date_change: { confirm: 'Request Change', cancel: 'Cancel' },
      cancellation: { confirm: 'Request Cancellation', cancel: 'Keep Booking' },
      offer_dates: { confirm: 'Send Offer', cancel: 'Cancel' },
      block_dates: { confirm: 'Block Dates', cancel: 'Cancel' },
      approve_date_change: { confirm: 'Approve', cancel: 'Go Back' },
      decline_date_change: { confirm: 'Decline', cancel: 'Go Back' },
      approve_cancellation: { confirm: 'Approve', cancel: 'Go Back' },
      decline_cancellation: { confirm: 'Decline', cancel: 'Go Back' },
    };

    return typeLabels[requestType] || { confirm: 'Confirm', cancel: 'Cancel' };
  }, [requestType]);

  // Determine if this is a destructive action
  const isDestructive = ['cancellation', 'decline_date_change', 'decline_cancellation'].includes(requestType);

  if (!isOpen) return null;

  return (
    <div className="request-confirmation-overlay" onClick={onCancel}>
      <div
        className="request-confirmation"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-confirmation-title"
      >
        <h3 id="request-confirmation-title" className="request-confirmation__title">
          Confirm Request
        </h3>

        <p className="request-confirmation__text">{confirmationText}</p>

        {/* Show additional details if available */}
        {requestData?.message && (
          <div className="request-confirmation__message">
            <span className="request-confirmation__message-label">Your message:</span>
            <p className="request-confirmation__message-text">{requestData.message}</p>
          </div>
        )}

        <div className="request-confirmation__actions">
          <button
            className="request-confirmation__btn request-confirmation__btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {buttonLabels.cancel}
          </button>
          <button
            className={`request-confirmation__btn request-confirmation__btn--confirm ${isDestructive ? 'request-confirmation__btn--destructive' : ''}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : buttonLabels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

RequestConfirmation.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  lease: PropTypes.shape({
    isCoTenant: PropTypes.bool,
  }),
  userRole: PropTypes.oneOf(['guest', 'host']),
  requestType: PropTypes.string,
  requestData: PropTypes.shape({
    night: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    nights: PropTypes.array,
    dates: PropTypes.array,
    oldDates: PropTypes.array,
    newDates: PropTypes.array,
    offerNight: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    amount: PropTypes.number,
    refundAmount: PropTypes.number,
    message: PropTypes.string,
    guestName: PropTypes.string,
  }),
  counterpartyName: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};
