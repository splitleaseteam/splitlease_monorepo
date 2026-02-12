/**
 * DateChangeRequestsTable Component
 *
 * Displays date change requests with approve/reject buttons.
 * Buttons are conditional based on request status and current user.
 */

import { Calendar, Check, X, Clock, AlertCircle } from 'lucide-react';
import './DateChangeRequestsTable.css';

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get status badge info
 */
function getStatusInfo(status) {
  switch (status) {
    case 'waiting_for_answer':
      return { label: 'Pending', className: 'pending', icon: Clock };
    case 'accepted':
      return { label: 'Accepted', className: 'accepted', icon: Check };
    case 'rejected':
      return { label: 'Rejected', className: 'rejected', icon: X };
    case 'expired':
      return { label: 'Expired', className: 'expired', icon: AlertCircle };
    case 'soon_to_expire':
      return { label: 'Expiring Soon', className: 'expiring', icon: AlertCircle };
    case 'cancelled':
      return { label: 'Cancelled', className: 'cancelled', icon: X };
    default:
      return { label: status || 'Unknown', className: 'unknown', icon: Clock };
  }
}

/**
 * Check if current user can respond to the request
 */
function canRespondToRequest(request, currentUserId) {
  // Can only respond if:
  // 1. Status is waiting_for_answer
  // 2. Current user is NOT the requester (they are the receiver)
  if (request.requestStatus !== 'waiting_for_answer') return false;
  if (!currentUserId) return false;

  const requesterId = request.requestedBy?.id || request.requestedById;
  return requesterId !== currentUserId;
}

export default function DateChangeRequestsTable({
  requests = [],
  currentUserId,
  onApprove,
  onReject,
  onRequestChanges
}) {
  if (requests.length === 0) {
    return (
      <div className="date-change-requests__empty">
        <p>No date change requests.</p>
        <button className="btn btn-outline btn-sm" onClick={onRequestChanges}>
          <Calendar size={14} />
          Request Date Change
        </button>
      </div>
    );
  }

  return (
    <div className="date-change-requests">
      <div className="date-change-requests__list">
        {requests.map((request) => {
          const statusInfo = getStatusInfo(request.requestStatus);
          const StatusIcon = statusInfo.icon;
          const showActions = canRespondToRequest(request, currentUserId);

          return (
            <div key={request.id} className="date-change-requests__item">
              <div className="date-change-requests__header">
                <div className={`date-change-requests__status date-change-requests__status--${statusInfo.className}`}>
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </div>
                <span className="date-change-requests__date">
                  {formatDate(request.dateAdded)}
                </span>
              </div>

              <div className="date-change-requests__details">
                <div className="date-change-requests__change">
                  <span className="date-change-requests__label">Original:</span>
                  <span className="date-change-requests__value">
                    {request.listOfOldDates?.length > 0
                      ? request.listOfOldDates.map(d => formatDate(d)).join(', ')
                      : 'N/A'}
                  </span>
                </div>
                <div className="date-change-requests__change">
                  <span className="date-change-requests__label">Requested:</span>
                  <span className="date-change-requests__value">
                    {request.listOfNewDates?.length > 0
                      ? request.listOfNewDates.map(d => formatDate(d)).join(', ')
                      : 'N/A'}
                  </span>
                </div>
                {request.messageFromRequester && (
                  <div className="date-change-requests__message">
                    <span className="date-change-requests__label">Message:</span>
                    <p>{request.messageFromRequester}</p>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="date-change-requests__actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onApprove(request)}
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onReject(request)}
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-outline" onClick={onRequestChanges}>
        <Calendar size={16} />
        Request Date Change
      </button>
    </div>
  );
}
