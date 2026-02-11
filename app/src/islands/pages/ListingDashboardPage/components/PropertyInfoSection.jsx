import { useState, useRef, useCallback } from 'react';
import InformationalText from '../../../shared/InformationalText';
import { useListingDashboard } from '../context/ListingDashboardContext';
import StatusDot, { STATUS_MAP } from './StatusDot.jsx';
import { COMPLETION_CHECKS } from '../utils/listingCompletion';

const QuestionMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="listing-dashboard-property__copy-icon" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const EyeSmallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HeartSmallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const FileTextSmallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/**
 * Determine the appropriate status display based on listing state
 */
function getStatusDisplay(listing) {
  const { isOnline, isApproved, isComplete } = listing;

  if (isOnline && isApproved && isComplete) {
    return { status: 'online', clickable: false };
  }
  if (!isApproved && isComplete && !isOnline) {
    return { status: 'review', clickable: true };
  }
  if (!isComplete) {
    return { status: 'draft', clickable: true };
  }
  if (isApproved && !isOnline) {
    return { status: 'paused', clickable: true };
  }
  return { status: 'draft', clickable: true };
}

function getStatusInfo(listing) {
  const { isOnline, isApproved, isComplete } = listing;

  if (isOnline && isApproved && isComplete) {
    return { title: 'Listing is Live', content: 'Your listing is approved and visible to guests.', expandedContent: null };
  }
  if (!isApproved && isComplete && !isOnline) {
    return { title: 'Under Review', content: 'Your listing is being reviewed by the Split Lease team. This typically takes 24-48 hours.', expandedContent: 'Our team reviews each listing to ensure quality and safety standards are met. You\'ll receive an email notification once your listing is approved.' };
  }
  if (!isComplete) {
    return { title: 'Listing Incomplete', content: 'Your listing is missing required information. Complete all sections to submit for review.', expandedContent: null };
  }
  if (isApproved && !isOnline) {
    return { title: 'Listing Paused', content: 'Your listing has been approved but is currently offline. Reactivate it anytime.', expandedContent: null };
  }
  return { title: 'Listing Status', content: 'Your listing is currently offline.', expandedContent: null };
}

function formatDate(date) {
  if (!date) return 'Date unavailable';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';
  return parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function CompletionProgress({ listing, onEditSection }) {
  const passed = COMPLETION_CHECKS.filter((c) => c.test(listing));
  const missing = COMPLETION_CHECKS.filter((c) => !c.test(listing));
  const pct = Math.round((passed.length / COMPLETION_CHECKS.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="listing-dashboard-property__progress">
      <div
        className="listing-dashboard-property__progress-bar"
        role="progressbar"
        aria-label="Listing completion progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="listing-dashboard-property__progress-track">
          <div className="listing-dashboard-property__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="listing-dashboard-property__progress-text">{pct}% complete</span>
      </div>
      {missing.length > 0 && (
        <div className="listing-dashboard-property__missing">
          {missing.map((item) => (
            <button key={item.key} className="listing-dashboard-property__missing-item" onClick={() => onEditSection(item.section)}>
              + {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyInfoSection() {
  const { listing, counts, handleImportReviews, handleEditSection, handleEditSectionWithTab, isUnderperforming } = useListingDashboard();
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const statusTriggerRef = useRef(null);
  const fullAddress = listing?.location?.address || '';

  const handleScrollToInsights = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ld:fetch-insights'));
    const el = document.getElementById('insights-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleCopyAddress = async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      window.showToast?.({ title: 'Copied!', content: 'Address copied to clipboard', type: 'success' });
    } catch {
      window.showToast?.({ title: 'Copy Failed', content: 'Unable to copy address', type: 'error' });
    }
  };

  const statusDisplay = getStatusDisplay(listing);
  const statusInfo = getStatusInfo(listing);
  const statusLabel = STATUS_MAP[statusDisplay.status]?.label || STATUS_MAP.draft.label;

  return (
    <div id="property-info" className="listing-dashboard-property">
      {/* Title Row */}
      <div className="listing-dashboard-property__title-row">
        <h2 className="listing-dashboard-property__title">
          {listing.title || 'Untitled Listing'}
        </h2>
        <button className="listing-dashboard-section__edit" onClick={() => handleEditSection('name')}>
          edit
        </button>
      </div>

      {/* Meta Row: Location + Status */}
      <div className="listing-dashboard-property__meta-row">
        <span className="listing-dashboard-property__location">
          <span
            className="listing-dashboard-property__address-text"
            onClick={handleCopyAddress}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCopyAddress(); } }}
            title="Click to copy address"
            role="button"
            tabIndex={0}
          >
            {listing?.location?.hoodsDisplay || listing?.location?.boroughDisplay || fullAddress || 'Location unavailable'}
            <CopyIcon />
          </span>
        </span>

        <span className="listing-dashboard-property__meta-sep">&middot;</span>

        <span className="listing-dashboard-property__status" aria-label={`Listing status: ${statusLabel}`}>
          <StatusDot status={statusDisplay.status} />
          {statusDisplay.clickable ? (
            <button
              ref={statusTriggerRef}
              className="listing-dashboard-property__status-trigger"
              onClick={() => setShowStatusInfo(true)}
              type="button"
            >
              {statusLabel}
              <QuestionMarkIcon />
            </button>
          ) : (
            <span className="listing-dashboard-property__status-text">{statusLabel}</span>
          )}
        </span>
      </div>

      {/* Active Since */}
      <p className="listing-dashboard-property__date-line">
        Active since {formatDate(listing.activeSince)}
      </p>

      {/* Metrics Row */}
      <div className="listing-dashboard-property__metrics">
        {listing.viewCount > 0 && (
          <span
            className="listing-dashboard-property__metric"
            aria-label={`${listing.viewCount} ${listing.viewCount === 1 ? 'view' : 'views'}`}
          >
            <EyeSmallIcon /> {listing.viewCount} {listing.viewCount === 1 ? 'view' : 'views'}
          </span>
        )}
        {listing.viewCount > 0 && listing.favoritesCount > 0 && (
          <span className="listing-dashboard-property__metric-sep">&middot;</span>
        )}
        {listing.favoritesCount > 0 && (
          <span
            className="listing-dashboard-property__metric"
            aria-label={`${listing.favoritesCount} ${listing.favoritesCount === 1 ? 'favorite' : 'favorites'}`}
          >
            <HeartSmallIcon /> {listing.favoritesCount} {listing.favoritesCount === 1 ? 'favorite' : 'favorites'}
          </span>
        )}
        {(listing.viewCount > 0 || listing.favoritesCount > 0) && counts.proposals > 0 && (
          <span className="listing-dashboard-property__metric-sep">&middot;</span>
        )}
        {counts.proposals > 0 && (
          <span
            className="listing-dashboard-property__metric"
            aria-label={`${counts.proposals} ${counts.proposals === 1 ? 'proposal' : 'proposals'}`}
          >
            <FileTextSmallIcon /> {counts.proposals} {counts.proposals === 1 ? 'proposal' : 'proposals'}
          </span>
        )}
        {counts.reviews > 0 && (
          <>
            <span className="listing-dashboard-property__metric-sep">&middot;</span>
            <button className="listing-dashboard-property__metric listing-dashboard-property__metric--link" onClick={handleImportReviews}>
              <StarIcon /> {counts.reviews} {counts.reviews === 1 ? 'review' : 'reviews'}
            </button>
          </>
        )}
      </div>

      {/* Completion Progress Bar — only shows when < 100% */}
      <CompletionProgress listing={listing} onEditSection={handleEditSectionWithTab} />

      {isUnderperforming && (
        <div className="listing-dashboard-property__benchmark" role="status" aria-live="polite">
          <span className="listing-dashboard-property__benchmark-icon" aria-hidden="true">{'\uD83D\uDCCA'}</span>
          <span className="listing-dashboard-property__benchmark-text">
            Below area average -
            {' '}
            <button className="listing-dashboard-property__benchmark-link" onClick={handleScrollToInsights} type="button">
              see suggestions
            </button>
          </span>
        </div>
      )}

      {/* Status Info Tooltip */}
      <InformationalText
        isOpen={showStatusInfo}
        onClose={() => setShowStatusInfo(false)}
        triggerRef={statusTriggerRef}
        title={statusInfo.title}
        content={statusInfo.content}
        expandedContent={statusInfo.expandedContent}
        showMoreAvailable={!!statusInfo.expandedContent}
      />
    </div>
  );
}
