# Implementation Plan: Z-Search Unit Test Page

## Overview
Create a new internal test page at route `/_internal/z-search-unit-test` that implements a search/filtering interface for listings. The page will allow filtering by geographic location (borough/neighborhood), temporal availability (days/nights), and listing attributes (active, approved, complete, default). This is a Bubble-to-Code migration of an existing search test page.

## Success Criteria
- [ ] Route `/_internal/z-search-unit-test` is accessible and renders the page
- [ ] Borough dropdown populates from Supabase reference tables
- [ ] Neighborhood dropdown filters by selected borough
- [ ] Days/Nights availability selection works correctly (uses 0-indexed days)
- [ ] Schedule pattern selection is functional (reusing existing component)
- [ ] Listing attribute filters (Active, Approved, Complete, Default) work
- [ ] Filtered listings display in a repeating group
- [ ] Sorting options functional
- [ ] Price filtering functional
- [ ] White background (#FFFFFF) with 95%+ visual fidelity to Bubble original
- [ ] No authentication checks (internal test page)
- [ ] Hollow Component Pattern followed correctly

## Context & References

### Relevant Files
| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route registry | Add new route entry |
| `app/public/z-search-unit-test.html` | HTML entry point | Create new file |
| `app/src/z-search-unit-test.jsx` | React entry point | Create new file |
| `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx` | Page component (Hollow) | Create new file |
| `app/src/islands/pages/ZSearchUnitTestPage/useZSearchUnitTestPageLogic.js` | Business logic hook | Create new file |
| `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.css` | Page styles | Create new file |
| `app/src/islands/pages/ZSearchUnitTestPage/index.js` | Barrel export | Create new file |

### Existing Components to Reuse
| Component | Location | Purpose |
|-----------|----------|---------|
| `SearchScheduleSelector` | `app/src/islands/shared/SearchScheduleSelector.jsx` | Day selection with drag-to-select |
| `dataLookups` | `app/src/lib/dataLookups.js` | Borough/Neighborhood name resolution |
| `supabase` | `app/src/lib/supabase.js` | Database client |
| `constants` | `app/src/lib/constants.js` | Day constants, schedule patterns |

### Related Documentation
- [miniCLAUDE.md](.claude/Documentation/miniCLAUDE.md) - Architecture patterns
- [ROUTING_GUIDE.md](.claude/Documentation/Routing/ROUTING_GUIDE.md) - Route registry usage
- [ListingsOverviewPage](`app/src/islands/pages/ListingsOverviewPage/`) - Reference for internal admin page pattern

### Existing Patterns to Follow
- **Hollow Component Pattern**: Page component contains ONLY JSX, logic hook contains ALL business logic
- **Route Registry Pattern**: All routes defined in `routes.config.js`, run `bun run generate-routes` after
- **Islands Architecture**: Independent React root, entry point mounts single page component
- **Data Lookups Pattern**: Initialize lookups on mount, use synchronous getters for name resolution
- **Internal Page Auth Pattern**: Skip auth checks for internal test pages (as seen in ListingsOverviewPage)

## Implementation Steps

### Step 1: Add Route to Registry
**Files:** `app/src/routes.config.js`
**Purpose:** Register the new route in the single source of truth
**Details:**
- Add route entry after the existing `/_internal/*` routes section
- Set `path: '/_internal/z-search-unit-test'`
- Set `file: 'z-search-unit-test.html'`
- Set `protected: false` (internal test page, no auth)
- Set `cloudflareInternal: true` with `internalName: 'z-search-unit-test-view'`
- Set `hasDynamicSegment: false`

**Code to add (around line 615, in INTERNAL/DEV PAGES section):**
```javascript
{
  path: '/_internal/z-search-unit-test',
  file: 'z-search-unit-test.html',
  aliases: ['/_internal/z-search-unit-test.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'z-search-unit-test-view',
  hasDynamicSegment: false
},
```

**Validation:** Route should appear in generated `_redirects` after running `bun run generate-routes`

### Step 2: Create HTML Entry Point
**Files:** `app/public/z-search-unit-test.html`
**Purpose:** Static HTML shell for the React island
**Details:**
- Create minimal HTML document
- Include `<div id="root"></div>` mount point
- Link to JSX entry point via `<script type="module">`
- Add `noindex, nofollow` meta tag (internal page)
- Set appropriate page title

**Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z-Search Unit Test - Split Lease Admin</title>
  <meta name="description" content="Internal search algorithm testing page">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/z-search-unit-test.jsx"></script>
</body>
</html>
```

**Validation:** File exists in `app/public/` directory

### Step 3: Create React Entry Point
**Files:** `app/src/z-search-unit-test.jsx`
**Purpose:** Mount React application to DOM
**Details:**
- Import React and createRoot
- Import page component from islands/pages
- Create root and render component

**Template:**
```javascript
/**
 * Z-Search Unit Test Page Entry Point
 *
 * Internal test page for search algorithm validation.
 * Tests listing filtering by geography, availability, and attributes.
 *
 * Route: /_internal/z-search-unit-test
 * Auth: None (internal test page)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZSearchUnitTestPage from './islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<ZSearchUnitTestPage />);
```

**Validation:** No import errors, file syntax is valid

### Step 4: Create Page Directory and Index
**Files:** `app/src/islands/pages/ZSearchUnitTestPage/index.js`
**Purpose:** Barrel export for the page module
**Details:**
- Export default component from main file
- Export logic hook for potential testing

**Template:**
```javascript
export { default } from './ZSearchUnitTestPage.jsx';
export { useZSearchUnitTestPageLogic } from './useZSearchUnitTestPageLogic.js';
```

**Validation:** Directory structure created correctly

### Step 5: Create Business Logic Hook
**Files:** `app/src/islands/pages/ZSearchUnitTestPage/useZSearchUnitTestPageLogic.js`
**Purpose:** ALL business logic for the page (Hollow Component Pattern)
**Details:**

The hook must manage:
1. **Reference Data Loading**
   - Fetch boroughs from `reference_table.zat_geo_borough_toplevel`
   - Fetch neighborhoods from `reference_table.zat_geo_hood_mediumlevel`
   - Initialize data lookups cache

2. **Filter State**
   - `selectedBorough` (string, default to first borough or 'manhattan')
   - `selectedNeighborhood` (string or null)
   - `selectedDays` (array of 0-indexed day numbers, default [1,2,3,4,5] Mon-Fri)
   - `weekPattern` (string: 'every-week', 'one-on-off', 'two-on-off', 'one-three-off')
   - `showActive` (boolean, default true)
   - `showApproved` (boolean, default true)
   - `showComplete` (boolean, default true)
   - `showDefault` (boolean, default false)
   - `sortBy` (string: 'recommended', 'price-low', 'price-high', 'newest')
   - `priceMin` (number or null)
   - `priceMax` (number or null)

3. **Listings State**
   - `listings` (array of filtered listings)
   - `isLoading` (boolean)
   - `error` (string or null)
   - `totalCount` (number)

4. **Search Algorithm Implementation**
   ```javascript
   // Core search logic (to be implemented in fetchListings)
   // SEARCH Listings WHERE:
   //   Location-Borough = [Selected Borough]
   //   AND Nights_Available CONTAINS [Selected Nights]
   //   AND Nights_Not_Available NOT_OVERLAPS [Selected Nights]
   //   AND Days_Available CONTAINS [Selected Days]
   //   AND Days_Not_Available NOT_OVERLAPS [Selected Days]
   //   AND [Weekly Pattern Match]
   // ORDER BY [Sort Option]
   ```

5. **Handler Functions**
   - `handleBoroughChange(boroughValue)`
   - `handleNeighborhoodChange(neighborhoodId)`
   - `handleDaysChange(selectedDays)` - receives array from SearchScheduleSelector
   - `handleWeekPatternChange(pattern)`
   - `handleAttributeFilterChange(filterName, value)`
   - `handleSortChange(sortOption)`
   - `handlePriceFilterChange(min, max)`
   - `handleResetFilters()`
   - `handleRetry()` - for error recovery

**Template Structure:**
```javascript
/**
 * Z-Search Unit Test Page Logic Hook
 *
 * All business logic for the ZSearchUnitTestPage.
 * Follows the Hollow Component Pattern.
 *
 * Search Algorithm:
 * - Filter by borough and neighborhood
 * - Filter by days/nights availability
 * - Filter by weekly pattern
 * - Filter by listing attributes (Active, Approved, Complete, Default)
 * - Sort and price filter results
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import {
  initializeLookups,
  getNeighborhoodName,
  getBoroughName,
  isInitialized
} from '../../../lib/dataLookups.js';
import { WEEK_PATTERNS, SORT_OPTIONS } from '../../../lib/constants.js';

// Initial filter state
const INITIAL_FILTERS = {
  selectedBorough: '',
  selectedNeighborhood: '',
  selectedDays: [1, 2, 3, 4, 5], // Mon-Fri (0-indexed)
  weekPattern: 'every-week',
  showActive: true,
  showApproved: true,
  showComplete: true,
  showDefault: false,
  sortBy: 'recommended',
  priceMin: null,
  priceMax: null
};

export function useZSearchUnitTestPageLogic() {
  // Auth state (always authorized for internal pages)
  const [authState] = useState({
    isChecking: false,
    isAuthenticated: true,
    isAdmin: true,
    shouldRedirect: false
  });

  // Reference data
  const [boroughs, setBoroughs] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  // Filter state
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Listings state
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Initialize lookups
  useEffect(() => {
    const init = async () => {
      if (!isInitialized()) {
        await initializeLookups();
      }
    };
    init();
  }, []);

  // Load boroughs on mount
  useEffect(() => {
    const loadBoroughs = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .schema('reference_table')
          .from('zat_geo_borough_toplevel')
          .select('_id, "Display Borough"')
          .order('"Display Borough"', { ascending: true });

        if (fetchError) throw fetchError;

        const boroughList = data
          .filter(b => b['Display Borough']?.trim())
          .map(b => ({
            id: b._id,
            name: b['Display Borough'].trim(),
            value: b['Display Borough'].trim().toLowerCase().replace(/\s+/g, '-')
          }));

        setBoroughs(boroughList);

        // Set default borough
        const manhattan = boroughList.find(b => b.value === 'manhattan');
        if (manhattan) {
          setFilters(prev => ({ ...prev, selectedBorough: manhattan.value }));
        } else if (boroughList.length > 0) {
          setFilters(prev => ({ ...prev, selectedBorough: boroughList[0].value }));
        }
      } catch (err) {
        console.error('[ZSearchUnitTest] Failed to load boroughs:', err);
        setError('Failed to load boroughs');
      }
    };

    loadBoroughs();
  }, []);

  // Load neighborhoods when borough changes
  useEffect(() => {
    const loadNeighborhoods = async () => {
      if (!filters.selectedBorough || boroughs.length === 0) return;

      const borough = boroughs.find(b => b.value === filters.selectedBorough);
      if (!borough) return;

      try {
        const { data, error: fetchError } = await supabase
          .schema('reference_table')
          .from('zat_geo_hood_mediumlevel')
          .select('_id, Display, "Geo-Borough"')
          .eq('"Geo-Borough"', borough.id)
          .order('Display', { ascending: true });

        if (fetchError) throw fetchError;

        const neighborhoodList = data
          .filter(n => n.Display?.trim())
          .map(n => ({
            id: n._id,
            name: n.Display.trim(),
            boroughId: n['Geo-Borough']
          }));

        setNeighborhoods(neighborhoodList);
        // Clear neighborhood selection when borough changes
        setFilters(prev => ({ ...prev, selectedNeighborhood: '' }));
      } catch (err) {
        console.error('[ZSearchUnitTest] Failed to load neighborhoods:', err);
      }
    };

    loadNeighborhoods();
  }, [filters.selectedBorough, boroughs]);

  // Fetch listings when filters change
  const fetchListings = useCallback(async () => {
    if (!filters.selectedBorough || boroughs.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const borough = boroughs.find(b => b.value === filters.selectedBorough);
      if (!borough) throw new Error('Borough not found');

      // Build base query
      let query = supabase
        .from('listing')
        .select('*', { count: 'exact' })
        .eq('"Location - Borough"', borough.id);

      // Apply attribute filters
      if (filters.showActive) {
        query = query.eq('Active', true);
      }
      if (filters.showComplete) {
        query = query.eq('"Complete"', true);
      }
      if (!filters.showDefault) {
        query = query.eq('isForUsability', false);
      }

      // Neighborhood filter
      if (filters.selectedNeighborhood) {
        query = query.eq('"Location - Hood"', filters.selectedNeighborhood);
      }

      // Week pattern filter
      if (filters.weekPattern !== 'every-week') {
        const patternText = WEEK_PATTERNS[filters.weekPattern];
        if (patternText) {
          query = query.eq('"Weeks offered"', patternText);
        }
      }

      // Price filter
      if (filters.priceMin !== null) {
        query = query.gte('"Standarized Minimum Nightly Price (Filter)"', filters.priceMin);
      }
      if (filters.priceMax !== null) {
        query = query.lte('"Standarized Minimum Nightly Price (Filter)"', filters.priceMax);
      }

      // Apply sorting
      const sortConfig = {
        'recommended': { field: '"Modified Date"', ascending: false },
        'price-low': { field: '"Standarized Minimum Nightly Price (Filter)"', ascending: true },
        'price-high': { field: '"Standarized Minimum Nightly Price (Filter)"', ascending: false },
        'newest': { field: '"Created Date"', ascending: false }
      }[filters.sortBy] || { field: '"Modified Date"', ascending: false };

      query = query.order(sortConfig.field, { ascending: sortConfig.ascending });

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Client-side filtering for days availability
      // Note: This is done client-side because Supabase array containment queries
      // can be complex. For production, consider moving to a stored procedure.
      const filteredByDays = filterListingsByDaysAvailability(data || [], filters.selectedDays);

      // Transform listings for display
      const transformedListings = filteredByDays.map(listing => ({
        id: listing._id,
        name: listing.Name || 'Untitled Listing',
        borough: getBoroughName(listing['Location - Borough']),
        neighborhood: getNeighborhoodName(listing['Location - Hood']),
        nightlyPrice: listing['Standarized Minimum Nightly Price (Filter)'] || 0,
        daysAvailable: listing['Days Available (List of Days)'] || [],
        nightsAvailable: listing['Nights_Available'] || [],
        weeksOffered: listing['Weeks offered'] || 'Every week',
        isActive: listing.Active || false,
        isComplete: listing.Complete || false,
        isApproved: listing.Approved || false,
        modifiedDate: listing['Modified Date'],
        createdDate: listing['Created Date']
      }));

      setListings(transformedListings);
      setTotalCount(transformedListings.length);
    } catch (err) {
      console.error('[ZSearchUnitTest] Fetch failed:', err);
      setError('Failed to fetch listings');
      setListings([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, boroughs]);

  // Trigger fetch when filters change
  useEffect(() => {
    if (boroughs.length > 0 && filters.selectedBorough) {
      fetchListings();
    }
  }, [fetchListings, boroughs.length, filters.selectedBorough]);

  // Handler functions
  const handleBoroughChange = useCallback((value) => {
    setFilters(prev => ({ ...prev, selectedBorough: value }));
  }, []);

  const handleNeighborhoodChange = useCallback((neighborhoodId) => {
    setFilters(prev => ({ ...prev, selectedNeighborhood: neighborhoodId }));
  }, []);

  const handleDaysChange = useCallback((selectedDays) => {
    // selectedDays comes from SearchScheduleSelector as array of day objects
    // Convert to array of indices
    const dayIndices = selectedDays.map(d => d.index);
    setFilters(prev => ({ ...prev, selectedDays: dayIndices }));
  }, []);

  const handleWeekPatternChange = useCallback((pattern) => {
    setFilters(prev => ({ ...prev, weekPattern: pattern }));
  }, []);

  const handleAttributeFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const handleSortChange = useCallback((sortOption) => {
    setFilters(prev => ({ ...prev, sortBy: sortOption }));
  }, []);

  const handlePriceFilterChange = useCallback((min, max) => {
    setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }));
  }, []);

  const handleResetFilters = useCallback(() => {
    const manhattan = boroughs.find(b => b.value === 'manhattan');
    setFilters({
      ...INITIAL_FILTERS,
      selectedBorough: manhattan?.value || boroughs[0]?.value || ''
    });
  }, [boroughs]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchListings();
  }, [fetchListings]);

  return {
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
  };
}

/**
 * Filter listings by days availability (client-side)
 * Implements the search algorithm:
 *   Days_Available CONTAINS [Selected Days]
 *   AND Days_Not_Available NOT_OVERLAPS [Selected Days]
 */
function filterListingsByDaysAvailability(listings, selectedDays) {
  if (!selectedDays || selectedDays.length === 0) {
    return listings;
  }

  return listings.filter(listing => {
    // Parse days available from listing
    let daysAvailable = [];
    try {
      const rawDays = listing['Days Available (List of Days)'];
      if (Array.isArray(rawDays)) {
        daysAvailable = rawDays;
      } else if (typeof rawDays === 'string') {
        daysAvailable = JSON.parse(rawDays);
      }
    } catch (e) {
      // If parsing fails, include listing by default
      return true;
    }

    // Check if all selected days are available
    const allDaysAvailable = selectedDays.every(day => daysAvailable.includes(day));

    // Parse days NOT available
    let daysNotAvailable = [];
    try {
      const rawNotAvailable = listing['Days_Not_Available'];
      if (Array.isArray(rawNotAvailable)) {
        daysNotAvailable = rawNotAvailable;
      } else if (typeof rawNotAvailable === 'string') {
        daysNotAvailable = JSON.parse(rawNotAvailable);
      }
    } catch (e) {
      daysNotAvailable = [];
    }

    // Check that selected days don't overlap with not-available days
    const noOverlapWithNotAvailable = !selectedDays.some(day => daysNotAvailable.includes(day));

    return allDaysAvailable && noOverlapWithNotAvailable;
  });
}
```

**Validation:**
- Hook can be imported without errors
- All state variables are properly typed
- Handlers update state correctly

### Step 6: Create Page Component (Hollow)
**Files:** `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx`
**Purpose:** Pure presentation component - NO business logic
**Details:**

The component must render:
1. **Page Header** - Title and description
2. **Filter Section**
   - Borough dropdown
   - Neighborhood dropdown (filtered by borough)
   - SearchScheduleSelector component for days
   - Week pattern dropdown
   - Attribute filter checkboxes (Active, Approved, Complete, Default)
   - Sort dropdown
   - Price range inputs
   - Reset filters button
3. **Results Section**
   - Loading state
   - Error state with retry
   - Empty state
   - Listings repeating group
4. **Results Summary** - Total count display

**Template Structure:**
```javascript
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
        <h3 className="zsut-listing-name">{listing.name}</h3>
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
```

**Validation:** Component renders without errors, all props from hook are used

### Step 7: Create Page Styles
**Files:** `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.css`
**Purpose:** Page-specific styling
**Details:**
- White background (#FFFFFF) as specified
- Clean admin/internal page styling
- Two-column layout (filters sidebar + results main)
- Responsive breakpoints
- Consistent with other internal pages

**Template:**
```css
/* Z-Search Unit Test Page Styles */

.zsut-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Header */
.zsut-header {
  padding: 24px 32px;
  border-bottom: 1px solid #E5E7EB;
  background: #FAFAFA;
}

.zsut-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.zsut-header p {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
}

/* Container */
.zsut-container {
  display: flex;
  gap: 24px;
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Filter Sidebar */
.zsut-filters {
  width: 300px;
  flex-shrink: 0;
  padding: 20px;
  background: #FAFAFA;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  height: fit-content;
}

.zsut-filters h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.zsut-filter-group {
  margin-bottom: 20px;
}

.zsut-filter-group > label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.zsut-select,
.zsut-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #FFFFFF;
  color: #111827;
}

.zsut-select:focus,
.zsut-input:focus {
  outline: none;
  border-color: #4B47CE;
  box-shadow: 0 0 0 3px rgba(75, 71, 206, 0.1);
}

.zsut-select:disabled {
  background: #F3F4F6;
  color: #9CA3AF;
}

/* Checkbox Group */
.zsut-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zsut-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.zsut-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4B47CE;
}

/* Price Inputs */
.zsut-price-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zsut-price-inputs .zsut-input {
  width: 100px;
}

.zsut-price-inputs span {
  color: #6B7280;
  font-size: 14px;
}

/* Buttons */
.zsut-btn {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zsut-btn-primary {
  background: #4B47CE;
  color: #FFFFFF;
  border: none;
}

.zsut-btn-primary:hover {
  background: #3F3BB0;
}

.zsut-btn-secondary {
  background: #FFFFFF;
  color: #374151;
  border: 1px solid #D1D5DB;
  width: 100%;
}

.zsut-btn-secondary:hover {
  background: #F9FAFB;
}

/* Results Section */
.zsut-results {
  flex: 1;
  min-width: 0;
}

.zsut-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.zsut-results-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.zsut-count {
  font-size: 14px;
  color: #6B7280;
}

/* Listings Grid */
.zsut-listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Listing Card */
.zsut-listing-card {
  padding: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.zsut-listing-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.zsut-listing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.zsut-listing-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  flex: 1;
  margin-right: 12px;
}

.zsut-listing-price {
  font-size: 16px;
  font-weight: 600;
  color: #4B47CE;
  white-space: nowrap;
}

.zsut-listing-location {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 12px;
}

.zsut-listing-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.zsut-badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background: #F3F4F6;
  color: #374151;
}

.zsut-badge-active {
  background: #D1FAE5;
  color: #065F46;
}

.zsut-badge-complete {
  background: #DBEAFE;
  color: #1E40AF;
}

.zsut-listing-id {
  font-size: 12px;
  color: #9CA3AF;
  font-family: monospace;
}

/* Loading State */
.zsut-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6B7280;
}

.zsut-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E7EB;
  border-top-color: #4B47CE;
  border-radius: 50%;
  animation: zsut-spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes zsut-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.zsut-error {
  text-align: center;
  padding: 60px 20px;
  color: #DC2626;
}

.zsut-error p {
  margin-bottom: 16px;
}

/* Empty State */
.zsut-empty {
  text-align: center;
  padding: 60px 20px;
  color: #6B7280;
}

/* Responsive */
@media (max-width: 1024px) {
  .zsut-container {
    flex-direction: column;
    padding: 16px;
  }

  .zsut-filters {
    width: 100%;
  }

  .zsut-listings-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 640px) {
  .zsut-header {
    padding: 16px;
  }

  .zsut-listings-grid {
    grid-template-columns: 1fr;
  }
}
```

**Validation:** Styles apply correctly, white background confirmed, responsive breakpoints work

### Step 8: Generate Routes
**Files:** None (command execution)
**Purpose:** Update Cloudflare routing files from route registry
**Details:**
- Run `bun run generate-routes` from `app/` directory
- Verify `_redirects` contains new route
- Verify `_routes.json` is updated

**Command:**
```bash
cd app && bun run generate-routes
```

**Validation:**
- Command completes without errors
- `app/public/_redirects` contains `/_internal/z-search-unit-test`
- No validation errors reported

### Step 9: Manual Testing
**Purpose:** Verify implementation works correctly
**Details:**
1. Start dev server: `bun run dev`
2. Navigate to `http://localhost:8000/_internal/z-search-unit-test`
3. Verify page renders with white background
4. Test borough dropdown populates
5. Test neighborhood dropdown filters by borough
6. Test SearchScheduleSelector interactions
7. Test week pattern dropdown
8. Test attribute filter checkboxes
9. Test sort dropdown
10. Test price filter inputs
11. Test reset filters button
12. Verify listings display correctly
13. Test loading/error/empty states

**Validation:** All features work as expected

## Edge Cases & Error Handling

| Edge Case | How to Handle |
|-----------|---------------|
| No boroughs returned | Show error state with retry button |
| Empty neighborhoods for borough | Show "All Neighborhoods" as only option, disable dropdown |
| Listing missing days array | Include listing by default in filter (fail open) |
| Invalid JSON in days field | Use try/catch, include listing on parse error |
| Network error during fetch | Show error state with retry button |
| No listings match filters | Show empty state with message |
| Missing price data | Default to 0, still display listing |

## Testing Considerations

### Unit Tests (Future)
- `useZSearchUnitTestPageLogic` hook can be tested with React Testing Library
- `filterListingsByDaysAvailability` pure function can be unit tested
- Mock Supabase calls for isolated testing

### Manual Test Scenarios
1. Filter by Manhattan borough - verify only Manhattan listings
2. Select specific neighborhood - verify narrowed results
3. Select weekday pattern (Mon-Fri) - verify only Mon-Fri available listings
4. Toggle "Active" off - verify inactive listings appear
5. Sort by price low - verify ascending order
6. Set price range $100-$200 - verify price boundaries
7. Reset filters - verify all filters return to defaults

## Rollback Strategy

If issues arise:
1. Remove route entry from `app/src/routes.config.js`
2. Run `bun run generate-routes`
3. Delete created files:
   - `app/public/z-search-unit-test.html`
   - `app/src/z-search-unit-test.jsx`
   - `app/src/islands/pages/ZSearchUnitTestPage/` (entire directory)

## Dependencies & Blockers

### Prerequisites
- None - all dependencies already exist in codebase

### Existing Components Required
- `SearchScheduleSelector` - already implemented
- `supabase` client - already configured
- `dataLookups` - already implemented
- `constants` - already defined

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SearchScheduleSelector integration issues | Low | Medium | Component already tested, has clear API |
| Days filter logic errors | Medium | Medium | Extensive manual testing, logging |
| Performance with many listings | Low | Low | Pagination can be added if needed |
| Missing database fields | Low | Medium | Defensive coding with fallbacks to defaults |

## Files Summary

### Files to Create
| File | Type |
|------|------|
| `app/public/z-search-unit-test.html` | HTML entry |
| `app/src/z-search-unit-test.jsx` | React entry |
| `app/src/islands/pages/ZSearchUnitTestPage/index.js` | Barrel export |
| `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.jsx` | Page component |
| `app/src/islands/pages/ZSearchUnitTestPage/useZSearchUnitTestPageLogic.js` | Logic hook |
| `app/src/islands/pages/ZSearchUnitTestPage/ZSearchUnitTestPage.css` | Styles |

### Files to Modify
| File | Change |
|------|--------|
| `app/src/routes.config.js` | Add route entry |

### Files to Regenerate
| File | Command |
|------|---------|
| `app/public/_redirects` | `bun run generate-routes` |
| `app/public/_routes.json` | `bun run generate-routes` |

---

**Plan Version**: 1.0
**Created**: 2026-01-26
**Author**: Implementation Planner (Opus)
