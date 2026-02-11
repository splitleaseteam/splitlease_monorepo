import { useCallback, useEffect, useMemo, useState } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const DEFAULT_STATS = {
  medianMonthlyRate: 0,
  avgPhotos: 0,
  avgClicks: 0,
  topAmenities: [],
};

function toTitleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) return '-';
  return `$${Math.round(value).toLocaleString()}`;
}

function getInsightIcon(type) {
  switch (type) {
    case 'pricing': return '\uD83D\uDCB0';
    case 'photos': return '\uD83D\uDCF7';
    case 'amenities': return '\u2728';
    case 'description': return '\uD83D\uDCDD';
    case 'engagement': return '\uD83D\uDCCA';
    default: return '\uD83D\uDCA1';
  }
}

function getNudgeMessage(insight, stats) {
  switch (insight.type) {
    case 'pricing':
      return stats?.medianMonthlyRate > 0
        ? `The median monthly rate in your area is $${stats.medianMonthlyRate.toLocaleString()}.`
        : null;
    case 'photos':
      return stats?.avgPhotos > 0
        ? `Top-performing listings in your area average ${Math.round(stats.avgPhotos)} photos.`
        : null;
    case 'amenities': {
      const topAmenity = stats?.topAmenities?.[0];
      return topAmenity
        ? `${topAmenity.percentOfListings}% of comparable listings offer ${topAmenity.name}.`
        : null;
    }
    case 'description':
      return 'Longer, more detailed descriptions tend to attract more proposals.';
    case 'engagement':
      return 'Improving photos, pricing, and description can boost engagement.';
    default:
      return null;
  }
}

function getInsightAction(insightType, handleEditSection) {
  if (insightType === 'pricing') {
    return { label: 'Adjust pricing', onClick: () => handleEditSection?.('pricing') };
  }
  if (insightType === 'photos') {
    return { label: 'Add photos', onClick: () => handleEditSection?.('photos') };
  }
  if (insightType === 'description') {
    return { label: 'Improve description', onClick: () => handleEditSection?.('description') };
  }
  if (insightType === 'amenities') {
    return { label: 'Update amenities', onClick: () => handleEditSection?.('amenities') };
  }
  return { label: 'Review details', onClick: () => handleEditSection?.('name') };
}

function InsightSkeletons() {
  return (
    <div className="listing-dashboard-insights__cards" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <div key={index} className="listing-dashboard-insights__card listing-dashboard-insights__card--skeleton">
          <div className="listing-dashboard-insights__skeleton-bar listing-dashboard-insights__skeleton-bar--short" />
          <div className="listing-dashboard-insights__skeleton-bar" />
          <div className="listing-dashboard-insights__skeleton-bar listing-dashboard-insights__skeleton-bar--long" />
        </div>
      ))}
    </div>
  );
}

export default function InsightsPanel() {
  const {
    listing,
    insights,
    isInsightsLoading,
    isUnderperforming,
    fetchInsights,
    handleEditSection,
  } = useListingDashboard();

  const listingId = listing?.id;
  const DISMISSED_KEY = `ld-dismissed-insights-${listingId}`;

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Auto-fetch when underperforming
  useEffect(() => {
    if (isUnderperforming && !insights && !isInsightsLoading) {
      fetchInsights?.();
    }
  }, [isUnderperforming, insights, isInsightsLoading, fetchInsights]);

  const suggestions = useMemo(() => insights?.insights || [], [insights]);
  const comparableStats = useMemo(() => ({ ...DEFAULT_STATS, ...(insights?.comparableStats || {}) }), [insights]);

  const visibleSuggestions = useMemo(
    () => suggestions.filter((insight) => !dismissedIds.has(`${insight.type}:${insight.message}`)),
    [suggestions, dismissedIds]
  );

  const hasStats = comparableStats.medianMonthlyRate > 0
    || comparableStats.avgPhotos > 0
    || comparableStats.avgClicks > 0
    || (comparableStats.topAmenities?.length || 0) > 0;

  const handleDismiss = useCallback((insight) => {
    const id = `${insight.type}:${insight.message}`;
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, [DISMISSED_KEY]);

  const handleRestoreAll = useCallback(() => {
    setDismissedIds(new Set());
    try { localStorage.removeItem(DISMISSED_KEY); } catch {}
  }, [DISMISSED_KEY]);

  // Only show when listing is underperforming
  if (!isUnderperforming) return null;

  return (
    <section
      id="insights-panel"
      className="listing-dashboard-section listing-dashboard-insights"
      role="region"
      aria-label="Listing improvement suggestions"
      aria-live="polite"
      aria-busy={isInsightsLoading ? 'true' : 'false'}
    >
      <div className="listing-dashboard-section__header">
        <h2 className="listing-dashboard-section__title">Insights</h2>
        {dismissedIds.size > 0 && (
          <button
            type="button"
            className="listing-dashboard-insights__restore-btn"
            onClick={handleRestoreAll}
          >
            Restore dismissed
          </button>
        )}
      </div>

      {isInsightsLoading && !insights && (
        <>
          <span className="sr-only">Loading suggestions...</span>
          <InsightSkeletons />
        </>
      )}

      {!isInsightsLoading && suggestions.length === 0 && (
        <p className="listing-dashboard-insights__empty">No suggestions right now. Keep checking back as listing activity changes.</p>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="listing-dashboard-insights__cards">
          {visibleSuggestions.map((insight) => {
            const cardId = `${insight.type}:${insight.message}`;
            const action = getInsightAction(insight.type, handleEditSection);
            const priority = toTitleCase(insight.priority || 'low');
            const nudge = getNudgeMessage(insight, comparableStats);

            return (
              <article
                key={cardId}
                role="article"
                aria-label={`${priority} priority: ${insight.message}`}
                className={`listing-dashboard-insights__card listing-dashboard-insights__card--${insight.priority || 'low'}`}
              >
                <div className="listing-dashboard-insights__card-header">
                  <span className="listing-dashboard-insights__icon">{getInsightIcon(insight.type)}</span>
                  <span className="listing-dashboard-insights__priority">{priority} priority</span>
                </div>
                <p className="listing-dashboard-insights__message">{insight.message}</p>
                {nudge && <p className="listing-dashboard-insights__nudge">{nudge}</p>}
                <div className="listing-dashboard-insights__actions">
                  <button
                    type="button"
                    className="listing-dashboard-insights__action-btn"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                  <button
                    type="button"
                    className="listing-dashboard-insights__dismiss-btn"
                    aria-label={`Dismiss ${insight.type} suggestion`}
                    onClick={() => handleDismiss(insight)}
                  >
                    Dismiss
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasStats && (
        <div className="listing-dashboard-insights__stats">
          <div className="listing-dashboard-insights__stat">
            <span className="listing-dashboard-insights__stat-value">
              {formatCurrency(comparableStats.medianMonthlyRate)}
            </span>
            <span className="listing-dashboard-insights__stat-label">Area median rent</span>
          </div>
          <div className="listing-dashboard-insights__stat">
            <span className="listing-dashboard-insights__stat-value">
              {Number.isFinite(comparableStats.avgPhotos) ? Math.round(comparableStats.avgPhotos) : '-'}
            </span>
            <span className="listing-dashboard-insights__stat-label">Avg photos</span>
          </div>
          <div className="listing-dashboard-insights__stat">
            <span className="listing-dashboard-insights__stat-value">
              {Number.isFinite(comparableStats.avgClicks) ? Math.round(comparableStats.avgClicks) : '-'}
            </span>
            <span className="listing-dashboard-insights__stat-label">Avg views</span>
          </div>
          {comparableStats.topAmenities?.slice(0, 3).map((amenity) => (
            <div key={amenity.name} className="listing-dashboard-insights__stat">
              <span className="listing-dashboard-insights__stat-value">{amenity.percentOfListings}%</span>
              <span className="listing-dashboard-insights__stat-label">have {amenity.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
