import { lazy, Suspense } from 'react';
import { useListingDashboard } from '../../context/ListingDashboardContext';
import CollapsibleSection from '../CollapsibleSection.jsx';
import DescriptionSection from '../DescriptionSection.jsx';
import DetailsSection from '../DetailsSection.jsx';
import AmenitiesSection from '../AmenitiesSection.jsx';
import RulesSection from '../RulesSection.jsx';

import { COMPLETION_CHECKS } from '../../utils/listingCompletion';

const InsightsPanel = lazy(() => import('../InsightsPanel.jsx'));

function formatDate(date) {
  if (!date) return 'Date unavailable';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';
  return parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ListingDetailsTab() {
  const { listing, highlightedFields, handleEditSection } = useListingDashboard();

  const missingFields = COMPLETION_CHECKS.filter((c) => !c.test(listing));

  return (
    <div className="listing-dashboard-tab-content">
      {/* 1. Metrics & Active Since */}
      <div className="listing-details-meta">
        <span>👁 {listing.viewCount || 0} views</span>
        <span>·</span>
        <span>♡ {listing.favoritesCount || 0} favorites</span>
        <span>·</span>
        <span>Active since {formatDate(listing.activeSince)}</span>
      </div>

      {/* 2. Completeness Alert */}
      {missingFields.length > 0 && (
        <div className="listing-details-incomplete">
          <strong>Complete your listing:</strong>{' '}
          {missingFields.map((item, index) => (
            <span key={item.key}>
              <button
                className="listing-dashboard-property__missing-item"
                onClick={() => handleEditSection(item.section)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
              >
                {item.label}
              </button>
              {index < missingFields.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* 3. Insights Panel */}
      <CollapsibleSection
        listingId={listing.id}
        id="insights"
        title="💡 Suggestions to improve your listing"
        defaultExpanded={false}
        unmountWhenCollapsed={true}
      >
        <Suspense fallback={<div className="listing-dashboard-section-loading">Loading...</div>}>
          <InsightsPanel />
        </Suspense>
      </CollapsibleSection>

      <hr className="listing-dashboard-inline-divider" />

      {/* 4. Description */}
      <div className="listing-dashboard-inline-section">
        <div className={
          (highlightedFields?.has('description') || highlightedFields?.has('neighborhood'))
            ? 'listing-dashboard-section--ai-highlighted'
            : ''
        }>
          <DescriptionSection />
        </div>
      </div>

      <hr className="listing-dashboard-inline-divider" />

      {/* 5. Details */}
      <div className="listing-dashboard-inline-section">
        <DetailsSection />
      </div>

      <hr className="listing-dashboard-inline-divider" />

      {/* 6. Amenities */}
      <div className="listing-dashboard-inline-section">
        <div className={highlightedFields?.has('amenities') ? 'listing-dashboard-section--ai-highlighted' : ''}>
          <AmenitiesSection />
        </div>
      </div>

      <hr className="listing-dashboard-inline-divider" />

      {/* 7. Rules */}
      <div className="listing-dashboard-inline-section">
        <div className={
          (highlightedFields?.has('rules') || highlightedFields?.has('safety'))
            ? 'listing-dashboard-section--ai-highlighted'
            : ''
        }>
          <RulesSection />
        </div>
      </div>
    </div>
  );
}
