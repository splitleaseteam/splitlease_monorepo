/**
 * Z-Search Unit Test Page
 *
 * Internal test page for search algorithm validation.
 * Follows the Hollow Component Pattern - ALL logic in useZSearchUnitTestPageLogic hook.
 *
 * Route: /_internal/z-search-unit-test
 * Auth: None (internal test page)
 */

import { useZSearchUnitTestPageLogic } from './useZSearchUnitTestPageLogic.js';
import SearchScheduleSelector from '../../shared/SearchScheduleSelector.jsx';
import './ZSearchUnitTestPage.css';

// Week pattern options
const WEEK_PATTERN_OPTIONS = [
  { value: 'every-week', label: 'Every Week' },
  { value: 'one-on-off', label: '1 Week On, 1 Off' },
  { value: 'two-on-off', label: '2 Weeks On, 2 Off' },
  { value: 'one-three-off', label: '1 Week On, 3 Off' }
];

// Sort options
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' }
];

function LoadingState() {
  return (
    <div className="zsut-loading">
      <div className="zsut-spinner"></div>
      <p>Loading listings...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="zsut-error">
      <p>{error}</p>
      <button onClick={onRetry} className="zsut-btn zsut-btn-primary">
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="zsut-empty">
      <p>No listings found matching your filters.</p>
    </div>
  );
}

function ListingCard({ listing }) {
  return (
    <div className="zsut-listing-card">
      <div className="zsut-listing-header">
        <h3 className="zsut-listing-name">{listing.listing_title}</h3>
        <span className="zsut-listing-price">${listing.nightlyPrice}/night</span>
      </div>
      <div className="zsut-listing-location">
        {listing.neighborhood && <span>{listing.neighborhood}, </span>}
        <span>{listing.borough}</span>
      </div>
      <div className="zsut-listing-meta">
        <span className="zsut-badge">{listing.weeksOffered}</span>
        {listing.isActive && <span className="zsut-badge zsut-badge-active">Active</span>}
        {listing.isComplete && <span className="zsut-badge zsut-badge-complete">Complete</span>}
      </div>
      <div className="zsut-listing-id">
        ID: {listing.id}
      </div>
    </div>
  );
}

export default function ZSearchUnitTestPage() {
  const {
    // Auth state
    authState,

    // Reference data
    boroughs,
    neighborhoods,

    // Filter state
    filters,

    // Listings data
    listings,
    isLoading,
    error,
    totalCount,

    // Handlers
    handleBoroughChange,
    handleNeighborhoodChange,
    handleDaysChange,
    handleWeekPatternChange,
    handleAttributeFilterChange,
    handleSortChange,
    handlePriceFilterChange,
    handleResetFilters,
    handleRetry
  } = useZSearchUnitTestPageLogic();

  return (
    <div className="zsut-page">
      {/* Page Header */}
      <header className="zsut-header">
        <h1>Z-Search Unit Test</h1>
        <p>Internal testing page for search algorithm validation</p>
      </header>

      <div className="zsut-container">
        {/* Filter Panel */}
        <aside className="zsut-filters">
          <h2>Filters</h2>

          {/* Borough */}
          <div className="zsut-filter-group">
            <label htmlFor="borough">Borough</label>
            <select
              id="borough"
              value={filters.selectedBorough}
              onChange={(e) => handleBoroughChange(e.target.value)}
              className="zsut-select"
            >
              <option value="">Select Borough</option>
              {boroughs.map(b => (
                <option key={b.id} value={b.value}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Neighborhood */}
          <div className="zsut-filter-group">
            <label htmlFor="neighborhood">Neighborhood</label>
            <select
              id="neighborhood"
              value={filters.selectedNeighborhood}
              onChange={(e) => handleNeighborhoodChange(e.target.value)}
              className="zsut-select"
              disabled={neighborhoods.length === 0}
            >
              <option value="">All Neighborhoods</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Schedule Selector */}
          <div className="zsut-filter-group">
            <label>Days Available</label>
            <SearchScheduleSelector
              onSelectionChange={handleDaysChange}
              initialSelection={filters.selectedDays}
              updateUrl={false}
              weekPattern={filters.weekPattern}
            />
          </div>

          {/* Week Pattern */}
          <div className="zsut-filter-group">
            <label htmlFor="weekPattern">Week Pattern</label>
            <select
              id="weekPattern"
              value={filters.weekPattern}
              onChange={(e) => handleWeekPatternChange(e.target.value)}
              className="zsut-select"
            >
              {WEEK_PATTERN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Attribute Filters */}
          <div className="zsut-filter-group">
            <label>Listing Attributes</label>
            <div className="zsut-checkbox-group">
              <label className="zsut-checkbox">
                <input
                  type="checkbox"
                  checked={filters.showActive}
                  onChange={(e) => handleAttributeFilterChange('showActive', e.target.checked)}
                />
                <span>Active</span>
              </label>
              <label className="zsut-checkbox">
                <input
                  type="checkbox"
                  checked={filters.showApproved}
                  onChange={(e) => handleAttributeFilterChange('showApproved', e.target.checked)}
                />
                <span>Approved</span>
              </label>
              <label className="zsut-checkbox">
                <input
                  type="checkbox"
                  checked={filters.showComplete}
                  onChange={(e) => handleAttributeFilterChange('showComplete', e.target.checked)}
                />
                <span>Complete</span>
              </label>
              <label className="zsut-checkbox">
                <input
                  type="checkbox"
                  checked={filters.showDefault}
                  onChange={(e) => handleAttributeFilterChange('showDefault', e.target.checked)}
                />
                <span>Include Usability (Default)</span>
              </label>
            </div>
          </div>

          {/* Sort */}
          <div className="zsut-filter-group">
            <label htmlFor="sortBy">Sort By</label>
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="zsut-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="zsut-filter-group">
            <label>Price Range ($/night)</label>
            <div className="zsut-price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin || ''}
                onChange={(e) => handlePriceFilterChange(
                  e.target.value ? Number(e.target.value) : null,
                  filters.priceMax
                )}
                className="zsut-input"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax || ''}
                onChange={(e) => handlePriceFilterChange(
                  filters.priceMin,
                  e.target.value ? Number(e.target.value) : null
                )}
                className="zsut-input"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="zsut-btn zsut-btn-secondary"
          >
            Reset Filters
          </button>
        </aside>

        {/* Results Section */}
        <main className="zsut-results">
          {/* Results Summary */}
          <div className="zsut-results-header">
            <h2>Results</h2>
            <span className="zsut-count">{totalCount} listing(s) found</span>
          </div>

          {/* Loading State */}
          {isLoading && <LoadingState />}

          {/* Error State */}
          {!isLoading && error && (
            <ErrorState error={error} onRetry={handleRetry} />
          )}

          {/* Empty State */}
          {!isLoading && !error && listings.length === 0 && (
            <EmptyState />
          )}

          {/* Listings Grid */}
          {!isLoading && !error && listings.length > 0 && (
            <div className="zsut-listings-grid">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
