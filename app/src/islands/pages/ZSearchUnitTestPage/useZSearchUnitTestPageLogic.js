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

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import {
  initializeLookups,
  getNeighborhoodName,
  getBoroughName,
  isInitialized
} from '../../../lib/dataLookups.js';
import { WEEK_PATTERNS } from '../../../lib/constants.js';

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

      const { data, error: fetchError } = await query;

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
