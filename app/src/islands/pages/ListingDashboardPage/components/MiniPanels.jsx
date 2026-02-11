import { useMemo } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const ProposalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" x2="16" y1="13" y2="13" />
    <line x1="8" x2="14" y1="17" y2="17" />
  </svg>
);

const LeaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 7h4v4" />
    <path d="m22 7-5.5 5.5a4 4 0 0 1-5.66 0l-.34-.34a4 4 0 0 0-5.66 0L2 15" />
    <path d="M4 5h4" />
    <path d="M6 3v4" />
    <path d="m2 19 3-3" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MeetingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="m10 15 2-2 2 2" />
    <path d="m10 19 2-2 2 2" />
  </svg>
);

function formatDate(date) {
  if (!date) return 'Date unavailable';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';
  return parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toTitleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function handleKeyActivate(event, callback) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
}

export default function MiniPanels() {
  const { counts, handleTabChange } = useListingDashboard();

  const proposalSecondary = useMemo(() => {
    const statuses = counts?.proposalsByStatus || {};
    const parts = Object.entries(statuses)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => `${value} ${toTitleCase(status)}`);

    if (parts.length === 0) return null;
    return parts.slice(0, 3).join(', ');
  }, [counts?.proposalsByStatus]);

  const panels = [];

  if ((counts?.proposals || 0) > 0) {
    const onClick = () => handleTabChange?.('proposals');
    panels.push(
      <div
        key="proposals"
        className="listing-dashboard-mini-panel listing-dashboard-mini-panel--clickable"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => handleKeyActivate(event, onClick)}
      >
        <div className="listing-dashboard-mini-panel__icon">
          <ProposalIcon />
        </div>
        <div className="listing-dashboard-mini-panel__content">
          <p className="listing-dashboard-mini-panel__primary">{counts.proposals} proposals</p>
          {proposalSecondary && (
            <p className="listing-dashboard-mini-panel__secondary">{proposalSecondary}</p>
          )}
        </div>
      </div>
    );
  }

  if ((counts?.leases || 0) > 0) {
    const secondary = (counts?.totalRevenue || 0) > 0
      ? `$${(counts.totalRevenue || 0).toLocaleString()} total`
      : `${counts?.activeLeases?.length || 0} active`;

    panels.push(
      <div key="leases" className="listing-dashboard-mini-panel">
        <div className="listing-dashboard-mini-panel__icon">
          <LeaseIcon />
        </div>
        <div className="listing-dashboard-mini-panel__content">
          <p className="listing-dashboard-mini-panel__primary">{counts.leases} leases</p>
          <p className="listing-dashboard-mini-panel__secondary">{secondary}</p>
        </div>
      </div>
    );
  }

  if ((counts?.messages || 0) > 0) {
    panels.push(
      <div key="messages" className="listing-dashboard-mini-panel">
        <div className="listing-dashboard-mini-panel__icon">
          <MessageIcon />
        </div>
        <div className="listing-dashboard-mini-panel__content">
          <p className="listing-dashboard-mini-panel__primary">{counts.messages} threads</p>
        </div>
      </div>
    );
  }

  if (counts?.nextMeeting) {
    const meeting = counts.nextMeeting;
    const meetingContent = (
      <>
        <div className="listing-dashboard-mini-panel__icon">
          <MeetingIcon />
        </div>
        <div className="listing-dashboard-mini-panel__content">
          <p className="listing-dashboard-mini-panel__primary">Next: {formatDate(meeting.date)}</p>
          <p className="listing-dashboard-mini-panel__secondary">with {meeting.guestName || 'Guest'}</p>
        </div>
      </>
    );

    if (meeting.meetingLink) {
      const onKeyDown = (event) => {
        if (event.key === ' ') {
          event.preventDefault();
          window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer');
        }
      };

      panels.push(
        <a
          key="meeting"
          className="listing-dashboard-mini-panel listing-dashboard-mini-panel--clickable"
          href={meeting.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join meeting"
          role="button"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {meetingContent}
        </a>
      );
    } else {
      panels.push(
        <div key="meeting" className="listing-dashboard-mini-panel">
          {meetingContent}
        </div>
      );
    }
  }

  if (panels.length === 0) {
    return null;
  }

  return (
    <div className="listing-dashboard-mini-panels" role="region" aria-label="Quick summary">
      {panels}
    </div>
  );
}
