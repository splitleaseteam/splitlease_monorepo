import { useEffect, useRef, useState } from 'react';
import ActionCard from './ActionCard';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { FileTextIcon, CalendarIcon, FileCheckIcon } from './icons.jsx';

// Component-specific icons (unique to ActionCardGrid)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default function ActionCardGrid() {
  const { counts, handleCardClick } = useListingDashboard();
  const [copiedCardId, setCopiedCardId] = useState(null);
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Define all cards with visibility condition
  // Cards for proposals, virtual meetings, and leases only show when count > 0
  const allCards = [
    {
      id: 'preview',
      icon: <EyeIcon />,
      label: 'Preview Listing',
      tooltip: 'See how guests view your listing',
      visible: true, // Always visible
    },
    {
      id: 'copy-link',
      icon: <LinkIcon />,
      label: 'Copy Listing Link',
      tooltip: 'Copy your listing URL to share',
      visible: true, // Always visible
    },
    {
      id: 'proposals',
      icon: <FileTextIcon size={32} />,
      label: 'Proposals',
      tooltip: 'View and manage guest proposals',
      badge: counts.proposals > 0,
      visible: counts.proposals > 0, // Only show if there are proposals
    },
    {
      id: 'meetings',
      icon: <CalendarIcon size={32} />,
      label: 'Virtual Meetings',
      tooltip: 'View scheduled virtual meetings',
      badge: counts.virtualMeetings > 0,
      visible: counts.virtualMeetings > 0, // Only show if there are virtual meetings
    },
    {
      id: 'leases',
      icon: <FileCheckIcon size={32} />,
      label: 'Leases',
      tooltip: 'View active and upcoming leases',
      badge: counts.leases > 0,
      visible: counts.leases > 0, // Only show if there are leases
    },
  ];

  // Filter to only visible cards
  const visibleCards = allCards.filter((card) => card.visible);
  const hiddenCards = allCards.filter((card) => !card.visible);

  const handleClick = (cardId) => {
    if (cardId === 'copy-link') {
      setCopiedCardId('copy-link');
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setCopiedCardId(null);
        resetTimeoutRef.current = null;
      }, 2000);
    }

    if (handleCardClick) {
      handleCardClick(cardId);
    }
  };

  return (
    <div className="listing-dashboard-action-grid">
      <span className="sr-only" aria-live="polite">
        {hiddenCards.length > 0
          ? `Some actions are hidden until activity exists: ${hiddenCards.map((card) => card.label).join(', ')}.`
          : 'All listing action cards are currently visible.'}
      </span>
      {visibleCards.map((card) => (
        <ActionCard
          key={card.id}
          icon={card.icon}
          label={card.id === 'copy-link' && copiedCardId === 'copy-link' ? 'Copied! ✓' : card.label}
          onClick={() => handleClick(card.id)}
          badge={card.badge}
          tooltip={card.tooltip}
        />
      ))}
    </div>
  );
}
