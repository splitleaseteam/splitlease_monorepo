/**
 * Meeting Card Component
 * Split Lease - Virtual Meeting Calendar Automation
 *
 * Displays a single virtual meeting card with status and actions
 */

export default function MeetingCard({
  meeting,
  isSelected,
  processing,
  onSelect,
  onProcess,
}) {
  // Format date for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-badge--pending';
      case 'meet_link_created':
        return 'status-badge status-badge--in-progress';
      case 'invites_sent':
        return 'status-badge status-badge--complete';
      case 'failed':
        return 'status-badge status-badge--error';
      default:
        return 'status-badge';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'meet_link_created':
        return 'Meet Link Created';
      case 'invites_sent':
        return 'Invites Sent';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <div
      className={`meeting-card ${isSelected ? 'meeting-card--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="meeting-card-header">
        <div className="meeting-card-title">
          <h3>{meeting['guest name']} & {meeting['host name']}</h3>
          <span className={getStatusBadgeClass(meeting.calendar_status)}>
            {getStatusLabel(meeting.calendar_status)}
          </span>
        </div>
        {meeting['meeting link'] && (
          <a
            href={meeting['meeting link']}
            target="_blank"
            rel="noopener noreferrer"
            className="meeting-link"
            onClick={(e) => e.stopPropagation()}
          >
            Join Meeting
          </a>
        )}
      </div>

      <div className="meeting-card-details">
        <div className="meeting-card-row">
          <span className="meeting-card-label">Scheduled:</span>
          <span className="meeting-card-value">{formatDateTime(meeting['booked date'])}</span>
        </div>
        <div className="meeting-card-row">
          <span className="meeting-card-label">Guest:</span>
          <span className="meeting-card-value">{meeting['guest email']}</span>
        </div>
        <div className="meeting-card-row">
          <span className="meeting-card-label">Host:</span>
          <span className="meeting-card-value">{meeting['host email']}</span>
        </div>
      </div>

      {meeting.calendar_error_message && (
        <div className="meeting-card-error">
          <strong>Error:</strong> {meeting.calendar_error_message}
        </div>
      )}

      <div className="meeting-card-actions">
        {meeting.calendar_status !== 'invites_sent' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="btn btn--primary"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Process Calendar Invites'}
          </button>
        )}
      </div>
    </div>
  );
}
