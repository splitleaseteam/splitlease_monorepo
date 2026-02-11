import { useState, useRef, useEffect } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { FileTextIcon, CalendarIcon, FileCheckIcon } from './icons.jsx';

const EyeIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LinkIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const SparklesIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default function ActionBar() {
  const { counts, handleCardClick, handleAIAssistant } = useListingDashboard();
  const [copied, setCopied] = useState(false);
  const resetRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const handleCopyLink = () => {
    setCopied(true);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => {
      setCopied(false);
      resetRef.current = null;
    }, 2000);
    handleCardClick?.('copy-link');
  };

  return (
    <div className="listing-dashboard-action-bar">
      <span className="sr-only" aria-live="polite">
        {copied ? 'Listing link copied to clipboard' : ''}
      </span>
      <button
        className="listing-dashboard-action-bar__btn"
        onClick={() => handleCardClick?.('preview')}
        aria-label="Preview listing"
      >
        <EyeIcon /> Preview
      </button>

      <button
        className="listing-dashboard-action-bar__btn"
        onClick={handleCopyLink}
        aria-label={copied ? 'Listing link copied' : 'Copy listing link'}
      >
        <LinkIcon /> {copied ? 'Copied \u2713' : 'Copy Link'}
      </button>

      {counts.proposals > 0 && (
        <button
          className="listing-dashboard-action-bar__btn"
          onClick={() => handleCardClick?.('proposals')}
          aria-label="Open proposals"
        >
          <FileTextIcon size={18} /> Proposals
          <span className="listing-dashboard-action-bar__badge" aria-label={`${counts.proposals} proposals`}>{counts.proposals}</span>
        </button>
      )}

      {counts.virtualMeetings > 0 && (
        <button
          className="listing-dashboard-action-bar__btn"
          onClick={() => handleCardClick?.('meetings')}
          aria-label="Open virtual meetings"
        >
          <CalendarIcon size={18} /> Meetings
          <span className="listing-dashboard-action-bar__badge" aria-label={`${counts.virtualMeetings} meetings`}>{counts.virtualMeetings}</span>
        </button>
      )}

      {counts.leases > 0 && (
        <button
          className="listing-dashboard-action-bar__btn"
          onClick={() => handleCardClick?.('leases')}
          aria-label="Open leases"
        >
          <FileCheckIcon size={18} /> Leases
          <span className="listing-dashboard-action-bar__badge" aria-label={`${counts.leases} leases`}>{counts.leases}</span>
        </button>
      )}

      <button
        className="listing-dashboard-action-bar__btn listing-dashboard-action-bar__btn--ai"
        onClick={handleAIAssistant}
        aria-label="Open AI import assistant"
      >
        <SparklesIcon /> AI Import
      </button>
    </div>
  );
}
