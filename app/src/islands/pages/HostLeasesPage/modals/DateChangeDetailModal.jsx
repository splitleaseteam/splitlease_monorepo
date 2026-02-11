/**
 * DateChangeDetailModal Component
 *
 * Modal displaying full details of a date change request.
 */
import { X, CalendarDays, ArrowRight, User, Clock, DollarSign, Check, X as XIcon } from 'lucide-react';
import { formatFullDate, formatCurrency, getDateChangeStatusClass } from '../formatters.js';

/**
 * DateChangeDetailModal shows full details of a date change request
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Object} props.request - The date change request
 * @param {Function} props.onClose - Close modal handler
 * @param {Function} props.onAccept - Accept request handler
 * @param {Function} props.onDecline - Decline request handler
 */
export function DateChangeDetailModal({ isOpen, request, onClose, onAccept, onDecline }) {
  if (!isOpen || !request) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isPending = request.status?.toLowerCase() === 'pending';
  const requestedByName = request.requestedByUser?.name ||
    request.requestedByUser?.firstName ||
    'Guest';

  return (
    <div className="hl-modal-backdrop" onClick={handleBackdropClick}>
      <div className="hl-modal hl-dcr-modal" role="dialog" aria-modal="true" aria-labelledby="dcr-modal-title">
        {/* Modal Header */}
        <div className="hl-modal-header">
          <h2 id="dcr-modal-title" className="hl-modal-title">
            <CalendarDays size={20} />
            Date Change Request
          </h2>
          <button
            type="button"
            className="hl-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="hl-modal-body">
          {/* Status Badge */}
          <div className="hl-dcr-status-row">
            <span className={getDateChangeStatusClass(request.status)}>
              {request.status}
            </span>
          </div>

          {/* Request Details */}
          <div className="hl-dcr-details">
            {/* Requested By */}
            <div className="hl-dcr-detail-row">
              <div className="hl-dcr-detail-label">
                <User size={16} />
                Requested By
              </div>
              <div className="hl-dcr-detail-value">
                {requestedByName}
              </div>
            </div>

            {/* Request Type */}
            {request.requestType && (
              <div className="hl-dcr-detail-row">
                <div className="hl-dcr-detail-label">
                  <CalendarDays size={16} />
                  Request Type
                </div>
                <div className="hl-dcr-detail-value">
                  {request.requestType}
                </div>
              </div>
            )}

            {/* Date Change */}
            <div className="hl-dcr-detail-row hl-dcr-dates-row">
              <div className="hl-dcr-detail-label">
                <CalendarDays size={16} />
                Date Change
              </div>
              <div className="hl-dcr-dates">
                <span className="hl-dcr-original-date">
                  {formatFullDate(request.originalDate)}
                </span>
                <ArrowRight size={16} className="hl-dcr-arrow" />
                <span className="hl-dcr-requested-date">
                  {formatFullDate(request.requestedDate)}
                </span>
              </div>
            </div>

            {/* Price Adjustment */}
            {request.priceAdjustment != null && request.priceAdjustment !== 0 && (
              <div className="hl-dcr-detail-row">
                <div className="hl-dcr-detail-label">
                  <DollarSign size={16} />
                  Price Adjustment
                </div>
                <div className={`hl-dcr-detail-value ${request.priceAdjustment > 0 ? 'hl-dcr-positive' : 'hl-dcr-negative'}`}>
                  {request.priceAdjustment > 0 ? '+' : ''}{formatCurrency(request.priceAdjustment)}
                </div>
              </div>
            )}

            {/* Requested Date */}
            <div className="hl-dcr-detail-row">
              <div className="hl-dcr-detail-label">
                <Clock size={16} />
                Requested On
              </div>
              <div className="hl-dcr-detail-value">
                {formatFullDate(request.createdDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="hl-modal-footer">
          {isPending ? (
            <>
              <button
                type="button"
                className="hl-btn hl-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hl-btn hl-btn-decline"
                onClick={() => {
                  onDecline(request.id);
                  onClose();
                }}
              >
                <XIcon size={16} />
                Decline
              </button>
              <button
                type="button"
                className="hl-btn hl-btn-accept"
                onClick={() => {
                  onAccept(request.id);
                  onClose();
                }}
              >
                <Check size={16} />
                Accept
              </button>
            </>
          ) : (
            <button
              type="button"
              className="hl-btn hl-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DateChangeDetailModal;
