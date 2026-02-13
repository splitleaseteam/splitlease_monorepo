/**
 * FilterSection - Desktop filter bar, filter popup modal, and filter tags row
 *
 * Extracted from SearchPage.jsx to reduce main file size.
 * Contains: schedule selector mount point, filter toggle, check-in/out display,
 * filter tags, filter popup dialog, and filter backdrop.
 */
import { BoroughSearchFilter } from './BoroughFilters.jsx';
import { NeighborhoodSearchFilter } from './NeighborhoodFilters.jsx';

export default function FilterSection({
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
  // Filter popup
  filterPopupOpen,
  toggleFilterPopup,
  closeFilterPopup,
  clearAllFilters,
  // Filter tags
  activeFilterTags,
  // Check-in/out
  checkInOutDays,
  // Collapse state
  desktopHeaderCollapsed,
}) {
  return (
    <>
      {/* Filter Section (Desktop) */}
      <div className={`filter-section ${activeFilterTags.length > 0 ? 'has-active-filters' : ''} ${desktopHeaderCollapsed ? 'filter-section--collapsed' : ''}`}>
        <div className="filter-bar">
          <div className="schedule-selector">
            <div className="filter-group schedule-selector-group" id="schedule-selector-mount-point">
            </div>
          </div>
          <div className="filter-popup-wrapper" id="topFilterWrapper">
            <button
              className={`filter-toggle-btn-new ${filterPopupOpen ? 'active' : ''}`}
              onClick={toggleFilterPopup}
              aria-label="Open filters"
              aria-expanded={filterPopupOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              {activeFilterTags.length > 0 && (
                <span className="filter-badge">{activeFilterTags.length}</span>
              )}
            </button>
          </div>
          <div className="filter-divider"></div>
          {checkInOutDays.checkIn && checkInOutDays.checkOut && (
            <div className="checkin-block">
              <div className="checkin-details">
                <div className="checkin-row">
                  <span className="label">Check-in:</span>
                  <span className="day">{checkInOutDays.checkIn}</span>
                </div>
                <div className="checkin-row">
                  <span className="label">Check-out:</span>
                  <span className="day">{checkInOutDays.checkOut}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tags Row - Shows active filters as removable chips */}
      <div className={`filter-tags-row ${activeFilterTags.length > 0 ? 'has-filters' : ''} ${desktopHeaderCollapsed ? 'filter-tags-row--collapsed' : ''}`}>
        <button className="results-filter-btn" onClick={toggleFilterPopup} aria-expanded={filterPopupOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span className="results-filter-badge">{activeFilterTags.length}</span>
        </button>

        <div className="filter-tags-single-row">
          {activeFilterTags.map((tag) => (
            <div key={tag.id} className="filter-tag filter-tag-sm">
              {tag.icon === 'map-pin' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              )}
              {tag.icon === 'dollar-sign' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              )}
              {tag.icon === 'repeat' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
              )}
              {tag.label}
              <button className="filter-tag-remove" onClick={tag.onRemove}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Popup Modal */}
      <div
        className={`filter-popup ${filterPopupOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter options"
        aria-hidden={!filterPopupOpen}
      >
        <div className="filter-popup-header">
          <h3 className="filter-popup-title">Filters</h3>
          <button className="filter-popup-clear" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>

        <div className="filter-popup-body">
          {/* Row 1: Borough, Week Pattern, Price Range - 3 column grid */}
          {/* Borough Multi-Select */}
          <div className="filter-popup-group">
            <label className="filter-popup-label">BOROUGH</label>
            <BoroughSearchFilter
              boroughs={boroughs}
              selectedBoroughs={selectedBoroughs}
              onBoroughsChange={setSelectedBoroughs}
              searchInputId="boroughSearchPopup"
            />
          </div>

          {/* Week Pattern */}
          <div className="filter-popup-group">
            <label className="filter-popup-label">WEEK PATTERN</label>
            <select
              className="filter-popup-select"
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
          <div className="filter-popup-group">
            <label className="filter-popup-label">PRICE RANGE</label>
            <select
              className="filter-popup-select"
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

          {/* Row 2: Neighborhoods - full width search input */}
          <div className="filter-popup-group filter-popup-group--full-width">
            <label className="filter-popup-label">NEIGHBORHOODS</label>
            <NeighborhoodSearchFilter
              neighborhoods={neighborhoods}
              selectedNeighborhoods={selectedNeighborhoods}
              onNeighborhoodsChange={setSelectedNeighborhoods}
              neighborhoodSearch={neighborhoodSearch}
              onNeighborhoodSearchChange={setNeighborhoodSearch}
              searchInputId="neighborhoodSearchPopup"
            />
          </div>
        </div>

        <div className="filter-popup-footer">
          <button className="btn btn-secondary" onClick={closeFilterPopup}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={closeFilterPopup}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Filter Backdrop */}
      {filterPopupOpen && (
        <div className="filter-backdrop open" onClick={closeFilterPopup}></div>
      )}
    </>
  );
}
