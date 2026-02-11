import { useState, useRef, useCallback } from 'react';
import InformationalText from '../../../shared/InformationalText';
import { useListingDashboard } from '../context/ListingDashboardContext';

// Icon components (inline SVGs)
const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const QuestionMarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="listing-dashboard-property__copy-icon"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const EyeSmallIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HeartSmallIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

/**
 * Determine the appropriate status message based on listing state
 * @param {Object} listing - The listing object with isOnline, isApproved, isComplete
 * @returns {Object} { title, content, expandedContent } for the InformationalText component
 */
function getStatusInfo(listing) {
  const { isOnline, isApproved, isComplete } = listing;

  // Listing is live and visible
  if (isOnline && isApproved && isComplete) {
    return {
      title: 'Listing is Live',
      content: 'Your listing is approved and visible to guests. People can now find and book your space on Split Lease.',
      expandedContent: null
    };
  }

  // Under review - submitted but not yet approved
  if (!isApproved && isComplete && !isOnline) {
    return {
      title: 'Under Review',
      content: 'Your listing is being reviewed by the Split Lease team. This typically takes 24-48 hours.',
      expandedContent: 'Our team reviews each listing to ensure quality and safety standards are met. You\'ll receive an email notification once your listing is approved and ready to go live. If we need any additional information, we\'ll reach out via email.'
    };
  }

  // Incomplete draft - not all required fields filled
  if (!isComplete) {
    return {
      title: 'Listing Incomplete',
      content: 'Your listing is missing required information. Complete all sections to submit for review.',
      expandedContent: 'To make your listing visible to guests, please fill out all required fields including photos, pricing, availability, and property details. Once complete, your listing will be submitted for review.'
    };
  }

  // Approved but offline - host deactivated
  if (isApproved && !isOnline) {
    return {
      title: 'Listing Paused',
      content: 'Your listing has been approved but is currently offline. You can reactivate it anytime to make it visible to guests again.',
      expandedContent: null
    };
  }

  // Fallback for any other state
  return {
    title: 'Listing Status',
    content: 'Your listing is currently offline. Contact support if you need help getting your listing approved.',
    expandedContent: null
  };
}

// Simple date formatter
function formatDate(date) {
  if (!date) return 'Date unavailable';

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleDateString('en-US', options);
}

// Completeness checks
const CHECKS = [
  {
    key: 'title',
    label: 'Title',
    section: 'name',
    test: (l) => !!l.title && l.title !== 'Untitled' && l.title !== 'Untitled Listing',
  },
  {
    key: 'description',
    label: 'Description',
    section: 'description',
    test: (l) => !!l.description && l.description.length > 20,
  },
  {
    key: 'photos',
    label: 'Photos (3+)',
    section: 'photos',
    test: (l) => (l.photos?.length || 0) >= 3,
  },
  {
    key: 'pricing',
    label: 'Pricing',
    section: 'pricing',
    test: (l) => (l.monthlyHostRate || 0) > 0 || (l.weeklyHostRate || 0) > 0,
  },
  {
    key: 'availability',
    label: 'Availability',
    section: 'availability',
    test: (l) => !!l.earliestAvailableDate,
  },
  {
    key: 'details',
    label: 'Details',
    section: 'details',
    test: (l) => !!(l.features?.bedrooms && l.features?.bathrooms),
  },
  {
    key: 'amenities',
    label: 'Amenities',
    section: 'amenities',
    test: (l) => (l.inUnitAmenities?.length || 0) + (l.buildingAmenities?.length || 0) > 0,
  },
  {
    key: 'rules',
    label: 'Rules',
    section: 'rules',
    test: (l) => (l.houseRules?.length || 0) > 0,
  },
];

function CompletionProgress({ listing, onEditSection }) {
  const passed = CHECKS.filter((c) => c.test(listing));
  const missing = CHECKS.filter((c) => !c.test(listing));
  const pct = Math.round((passed.length / CHECKS.length) * 100);

  return (
    <div className="listing-dashboard-property__progress">
      <div className="listing-dashboard-property__progress-bar">
        <div className="listing-dashboard-property__progress-track">
          <div
            className="listing-dashboard-property__progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="listing-dashboard-property__progress-text">
          {pct === 100 ? 'All sections complete' : `${pct}% complete`}
        </span>
      </div>

      {missing.length > 0 && (
        <div className="listing-dashboard-property__missing">
          {missing.map((item) => (
            <button
              key={item.key}
              className="listing-dashboard-property__missing-item"
              onClick={() => onEditSection(item.section)}
            >
              + {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PropertyInfoSection() {
  const { listing, counts, handleImportReviews, handleEditSection, isUnderperforming } = useListingDashboard();
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  const statusTriggerRef = useRef(null);
  const fullAddress = listing?.location?.address || '';

  const handleScrollToInsights = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ld:fetch-insights'));
    const el = document.getElementById('insights-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCopyAddress = async () => {
    if (!fullAddress) return;

    try {
      await navigator.clipboard.writeText(fullAddress);
      window.showToast?.({
        title: 'Copied!',
        content: 'Address copied to clipboard',
        type: 'success'
      });
    } catch {
      window.showToast?.({
        title: 'Copy Failed',
        content: 'Unable to copy address',
        type: 'error'
      });
    }
  };

  const statusInfo = getStatusInfo(listing);

  return (
    <div id="property-info" className="listing-dashboard-property">
      {/* Section Header with Edit Button */}
      <div className="listing-dashboard-property__header">
        <h2 className="listing-dashboard-property__listing-name">
          {listing.title || 'Untitled Listing'}
        </h2>
        <button className="listing-dashboard-section__edit" onClick={() => handleEditSection('name')}>
          edit
        </button>
      </div>

      {/* Import Reviews Link */}
      <button className="listing-dashboard-property__import-btn" onClick={handleImportReviews}>
        <DownloadIcon />
        <span>Import reviews from other sites</span>
      </button>

      {/* Listing Details */}
      <div className="listing-dashboard-property__details">
        <p className="listing-dashboard-property__address">
          <span
            className="listing-dashboard-property__address-text"
            onClick={handleCopyAddress}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCopyAddress();
              }
            }}
            title="Click to copy address"
            role="button"
            tabIndex={0}
          >
            {fullAddress}
            <CopyIcon />
          </span>
          {' - '}
          <span className="listing-dashboard-property__hood">
            {listing?.location?.hoodsDisplay || 'Neighborhood unavailable'}
          </span>
        </p>

        <p className="listing-dashboard-property__status">
          <span className="listing-dashboard-property__status-label">Status:</span>
          {listing.isOnline ? (
            <span className="listing-dashboard-property__status-value listing-dashboard-property__status-value--online">
              Listing is online
            </span>
          ) : (
            <button
              ref={statusTriggerRef}
              className="listing-dashboard-property__status-trigger"
              onClick={() => setShowStatusInfo(true)}
              type="button"
            >
              <span className="listing-dashboard-property__status-value listing-dashboard-property__status-value--offline">
                Listing is offline
              </span>
              <QuestionMarkIcon />
            </button>
          )}
        </p>

        <p className="listing-dashboard-property__active-since">
          Listing has been active since{' '}
          <span className="listing-dashboard-property__date">
            {formatDate(listing.activeSince)}
          </span>
        </p>

        {/* Engagement Metrics */}
        {(listing.viewCount > 0 || listing.favoritesCount > 0) && (
          <p className="listing-dashboard-property__metrics">
            {listing.viewCount > 0 && (
              <span className="listing-dashboard-property__metric">
                <EyeSmallIcon />
                {listing.viewCount} {listing.viewCount === 1 ? 'view' : 'views'}
              </span>
            )}
            {listing.viewCount > 0 && listing.favoritesCount > 0 && (
              <span className="listing-dashboard-property__metric-sep">&middot;</span>
            )}
            {listing.favoritesCount > 0 && (
              <span className="listing-dashboard-property__metric">
                <HeartSmallIcon />
                {listing.favoritesCount} {listing.favoritesCount === 1 ? 'favorite' : 'favorites'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Completeness Progress Bar */}
      <CompletionProgress listing={listing} onEditSection={handleEditSection} />

      {isUnderperforming && (
        <div className="listing-dashboard-property__benchmark" role="status" aria-live="polite">
          <span className="listing-dashboard-property__benchmark-icon" aria-hidden="true">📊</span>
          <span className="listing-dashboard-property__benchmark-text">
            Below area average -
            {' '}
            <button
              className="listing-dashboard-property__benchmark-link"
              onClick={handleScrollToInsights}
              type="button"
            >
              see suggestions
            </button>
          </span>
        </div>
      )}

      {/* Review Section - Only show when reviews exist */}
      {counts.reviews > 0 && (
        <div className="listing-dashboard-property__reviews">
          <button
            className="listing-dashboard-property__reviews-btn"
            onClick={handleImportReviews}
          >
            <StarIcon />
            <span>Show my reviews ({counts.reviews})</span>
          </button>
        </div>
      )}

      {/* Status Information Tooltip - uses shared InformationalText component */}
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
