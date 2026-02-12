/**
 * StaysTable Component
 *
 * Displays a table of stays within a lease with action buttons.
 * Action buttons are conditional based on stay status.
 */

import { Calendar, CheckCircle, Clock, Star, Eye } from 'lucide-react';
import './StaysTable.css';

/**
 * Format a date for display
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
    case 'not_started':
      return { label: 'Upcoming', className: 'upcoming', icon: Clock };
    case 'started':
      return { label: 'Starting', className: 'starting', icon: Calendar };
    case 'in_progress':
      return { label: 'In Progress', className: 'active', icon: CheckCircle };
    case 'completed':
      return { label: 'Completed', className: 'completed', icon: CheckCircle };
    default:
      return { label: status || 'Unknown', className: 'unknown', icon: Clock };
  }
}

/**
 * Determine which action buttons to show based on stay status
 */
function getActionButtons(stay, onCheckInOut, onSubmitReview, onSeeReview) {
  const { status, reviewSubmittedByGuest, reviewSubmittedByHost } = stay;

  const buttons = [];

  // Check-in buttons for not_started or started stays
  if (status === 'not_started' || status === 'started') {
    buttons.push({
      key: 'checkin',
      label: "Check In",
      onClick: () => onCheckInOut(stay, 'checkin'),
      className: 'btn-primary'
    });
  }

  // Checkout button for in_progress stays
  if (status === 'in_progress') {
    buttons.push({
      key: 'checkout',
      label: 'Check Out',
      onClick: () => onCheckInOut(stay, 'checkout'),
      className: 'btn-primary'
    });
  }

  // Submit review button for completed stays without guest review
  if (status === 'completed' && !reviewSubmittedByGuest) {
    buttons.push({
      key: 'submit-review',
      label: 'Submit Review',
      onClick: () => onSubmitReview(stay),
      className: 'btn-outline',
      icon: Star
    });
  }

  // See review button if host submitted a review
  if (reviewSubmittedByHost) {
    buttons.push({
      key: 'see-review',
      label: 'See Review',
      onClick: () => onSeeReview(stay),
      className: 'btn-text',
      icon: Eye
    });
  }

  return buttons;
}

export default function StaysTable({
  stays = [],
  leaseId,
  showAll = false,
  onToggleShowAll,
  onCheckInOut,
  onSubmitReview,
  onSeeReview
}) {
  // Show first 4 stays or all based on showAll state
  const visibleStays = showAll ? stays : stays.slice(0, 4);
  const hasMoreStays = stays.length > 4;

  if (stays.length === 0) {
    return (
      <div className="stays-table__empty">
        <p>No stays found for this lease.</p>
      </div>
    );
  }

  const handleRowClick = (stay, event) => {
    if (!leaseId) return;
    if (event?.target?.closest('.stays-table__actions')) return;
    window.location.href = `/schedule/${leaseId}`;
  };

  const handleRowKeyDown = (stay, event) => {
    if (event.key !== 'Enter') return;
    handleRowClick(stay, event);
  };

  return (
    <div className="stays-table">
      <div className="stays-table__list">
        {visibleStays.map((stay) => {
          const statusInfo = getStatusInfo(stay.status);
          const actionButtons = getActionButtons(stay, onCheckInOut, onSubmitReview, onSeeReview);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={stay.id}
              className="stays-table__row stays-table__row--clickable"
              onClick={(event) => handleRowClick(stay, event)}
              onKeyDown={(event) => handleRowKeyDown(stay, event)}
              role="button"
              tabIndex={0}
            >
              <div className="stays-table__info">
                <div className="stays-table__week">
                  Week {stay.weekNumber || '?'}
                </div>
                <div className="stays-table__dates">
                  {formatDate(stay.checkIn)} - {formatDate(stay.checkOut)}
                </div>
                <div className={`stays-table__status stays-table__status--${statusInfo.className}`}>
                  <StatusIcon size={14} />
                  {statusInfo.label}
                </div>
              </div>

              <div className="stays-table__actions">
                {actionButtons.map(({ key, label, onClick, className, icon: Icon }) => (
                  <button
                    key={key}
                    className={`btn btn-sm ${className}`}
                    onClick={onClick}
                  >
                    {Icon && <Icon size={14} />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show All / Show Less toggle */}
      {hasMoreStays && (
        <button
          className="stays-table__toggle"
          onClick={onToggleShowAll}
        >
          {showAll ? 'Show Less' : `Show All ${stays.length} Stays`}
        </button>
      )}
    </div>
  );
}
