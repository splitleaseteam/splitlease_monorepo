/**
 * MobileFilterSheet - Mobile bottom sheet filter UI
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * Contains: backdrop, grab handle, header, filter groups, footer with clear/apply.
 */
import { BoroughSearchFilter } from './BoroughFilters.jsx';
import { NeighborhoodSearchFilter } from './NeighborhoodFilters.jsx';

export default function MobileFilterSheet({
  // Filter state
  boroughs,
  selectedBoroughs,
  setSelectedBoroughs,
  neighborhoods,
  selectedNeighborhoods,
  setSelectedNeighborhoods,
  weekPattern,
  setWeekPattern,
  priceTier,
  setPriceTier,
  neighborhoodSearch,
  setNeighborhoodSearch,
  // Panel control
  onClose,
  clearAllFilters,
  // Results count
  resultsCount,
}) {
  return (
    <>
      <div className="mobile-filter-backdrop" onClick={onClose}></div>
      <div className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-label="Filter listings">
        {/* Grab Handle */}
        <div className="mobile-filter-handle"></div>

        {/* Header */}
        <div className="mobile-filter-header">
          <div className="mobile-filter-header-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#31135D" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <h2 className="mobile-filter-title">Filters</h2>
          </div>
          <button
            className="mobile-filter-close"
            onClick={onClose}
            aria-label="Close filters"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="mobile-filter-body">
          {/* Borough Multi-Select */}
          <div className="mobile-filter-group">
            <label className="mobile-filter-label">BOROUGH</label>
            <BoroughSearchFilter
              boroughs={boroughs}
              selectedBoroughs={selectedBoroughs}
              onBoroughsChange={setSelectedBoroughs}
              searchInputId="boroughSearchMobile"
            />
          </div>

          {/* Week Pattern */}
          <div className="mobile-filter-group">
            <label className="mobile-filter-label">WEEK PATTERN</label>
            <select
              className="mobile-filter-select"
              value={weekPattern}
              onChange={(e) => setWeekPattern(e.target.value)}
            >
              <option value="every-week">Every week</option>
              <option value="one-on-off">One on, one off</option>
              <option value="two-on-off">Two on, two off</option>
              <option value="one-three-off">One on, three off</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="mobile-filter-group">
            <label className="mobile-filter-label">PRICE RANGE</label>
            <select
              className="mobile-filter-select"
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="under-200">&lt; $200/night</option>
              <option value="200-350">$200-$350/night</option>
              <option value="350-500">$350-$500/night</option>
              <option value="500-plus">$500+/night</option>
            </select>
          </div>

          {/* Neighborhoods */}
          <div className="mobile-filter-group">
            <label className="mobile-filter-label">NEIGHBORHOODS</label>
            <NeighborhoodSearchFilter
              neighborhoods={neighborhoods}
              selectedNeighborhoods={selectedNeighborhoods}
              onNeighborhoodsChange={setSelectedNeighborhoods}
              neighborhoodSearch={neighborhoodSearch}
              onNeighborhoodSearchChange={setNeighborhoodSearch}
              searchInputId="neighborhoodSearchMobile"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mobile-filter-footer">
          <button
            className="mobile-filter-btn-secondary"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
          <button
            className="mobile-filter-btn-primary"
            onClick={onClose}
          >
            Show {resultsCount} Results
          </button>
        </div>
      </div>
    </>
  );
}
