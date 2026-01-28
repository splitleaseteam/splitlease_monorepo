/**
 * Meeting List Component
 * Split Lease - Virtual Meeting Calendar Automation
 *
 * Displays a list of virtual meetings needing calendar automation
 */

import MeetingCard from './MeetingCard.jsx';

export default function MeetingList({
  meetings,
  selectedMeeting,
  statusFilter,
  processing,
  onSelectMeeting,
  onProcessMeeting,
  onRefresh,
}) {
  // Filter meetings by status
  const filteredMeetings = meetings.filter((meeting) => {
    if (statusFilter === 'all') return true;
    return meeting.calendar_status === statusFilter;
  });

  return (
    <div className="meeting-list">
      <div className="meeting-list-header">
        <h2>Meetings Requiring Calendar Invites</h2>
        <button onClick={onRefresh} className="btn btn--secondary" disabled={processing}>
          Refresh
        </button>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="empty-state">
          <p>No meetings found</p>
          {statusFilter !== 'all' && (
            <button onClick={() => onSelectMeeting(null)} className="btn btn--link">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="meeting-list-items">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              isSelected={selectedMeeting?._id === meeting._id}
              processing={processing}
              onSelect={() => onSelectMeeting(meeting)}
              onProcess={() => onProcessMeeting(meeting._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
