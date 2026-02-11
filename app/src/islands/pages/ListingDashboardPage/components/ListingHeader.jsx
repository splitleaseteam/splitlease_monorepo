import { useState } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const EyeIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LinkIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const PencilIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

export default function ListingHeader() {
  const { listing, completionPct, handleCardClick, handleEditSection } = useListingDashboard();
  const [copied, setCopied] = useState(false);

  const statusDot = listing.isOnline && listing.isApproved ? 'online' 
    : !listing.isApproved && listing.isComplete ? 'review'
    : listing.isApproved && !listing.isOnline ? 'paused' 
    : 'draft';

  const statusLabel = { online: 'Online', review: 'Under Review', paused: 'Paused', draft: 'Draft' }[statusDot];

  const handleCopyLink = () => {
    handleCardClick('copy-link');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="listing-header">
      {/* Left: Title + Status */}
      <div className="listing-header__info">
        <h1 className="listing-header__title">{listing.title || 'Untitled Listing'}</h1>
        <div className="listing-header__status-line">
          <span className={`listing-header__dot listing-header__dot--${statusDot}`} aria-hidden="true" />
          <span className="listing-header__status-text">{statusLabel}</span>
          {completionPct < 100 && (
            <>
              <span className="listing-header__sep">·</span>
              <span className="listing-header__completion">{completionPct}% complete</span>
            </>
          )}
        </div>
      </div>
      
      {/* Right: Action buttons */}
      <div className="listing-header__actions">
        <button className="listing-header__btn" onClick={() => handleCardClick('preview')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <EyeIcon /> Preview
          </span>
        </button>
        <button className="listing-header__btn" onClick={handleCopyLink}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LinkIcon /> {copied ? 'Copied ✓' : 'Copy Link'}
          </span>
        </button>
        <button className="listing-header__btn listing-header__btn--primary" onClick={() => handleEditSection('name')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PencilIcon /> Edit
          </span>
        </button>
      </div>
    </div>
  );
}
