/**
 * DateChangeSection Component
 *
 * Displays date change requests with accept/decline actions for pending requests.
 */
import { CalendarDays, ArrowRight, Check, X, Eye } from 'lucide-react';
import { formatFullDate, formatCurrency, getDateChangeStatusClass } from '../formatters.js';

/**
 * DateChangeSection displays date change requests
 *
 * @param {Object} props
 * @param {Array} props.requests - Array of normalized date change requests
 * @param {Function} props.onAccept - Handle accept action
 * @param {Function} props.onDecline - Handle decline action
 * @param {Function} props.onViewDetails - View request details
 */
export function DateChangeSection({ requests = [], onAccept, onDecline, onViewDetails }) {
  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="hl-date-changes-section">
      <div className="hl-date-changes-header">
        <CalendarDays size={18} />
        <span>Date Change Requests</span>
        <span className="hl-date-changes-count">({requests.length})</span>
      </div>

      <div className="hl-date-changes-list">
        {requests.map((request) => {
          const isPending = request.status?.toLowerCase() === 'waiting_for_answer';
          const requestedByName = request.requestedByUser?.name ||
            request.requestedByUser?.firstName ||
            'Guest';

          return (
            <div key={request.id} className="hl-date-change-item">
              <div className="hl-date-change-info">
                <div className="hl-date-change-requester">
                  Requested by <strong>{requestedByName}</strong>
                </div>
                <div className="hl-date-change-dates">
                  <span className="hl-date-change-original">
                    {formatFullDate(Array.isArray(request.originalDate) ? request.originalDate[0] : request.originalDate)}
                  </span>
                  <ArrowRight size={14} />
                  <span className="hl-date-change-requested">
                    {formatFullDate(Array.isArray(request.requestedDate) ? request.requestedDate[0] : request.requestedDate)}
                  </span>
                </div>
                {request.priceAdjustment != null && request.priceAdjustment !== 0 && (
                  <div className="hl-date-change-price">
                    Price adjustment: {formatCurrency(request.priceAdjustment)}
                  </div>
                )}
                <span className={getDateChangeStatusClass(request.status)}>
                  {request.status}
                </span>
              </div>

              <div className="hl-date-change-actions">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      className="hl-btn hl-btn-small hl-btn-accept"
                      onClick={() => onAccept?.(request.id)}
                      title="Accept request"
                    >
                      <Check size={14} />
                      Accept
                    </button>
                    <button
                      type="button"
                      className="hl-btn hl-btn-small hl-btn-decline"
                      onClick={() => onDecline?.(request.id)}
                      title="Decline request"
                    >
                      <X size={14} />
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="hl-btn hl-btn-small hl-btn-secondary"
                    onClick={() => onViewDetails?.(request)}
                    title="View details"
                  >
                    <Eye size={14} />
                    Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DateChangeSection;
