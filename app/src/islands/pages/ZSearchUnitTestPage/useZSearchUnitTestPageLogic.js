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
          .from('zat_geo_borough_toplevel')
          .select('id, display_borough')
          .order('display_borough', { ascending: true });

        if (fetchError) throw fetchError;

        const boroughList = data
          .filter(b => b.display_borough?.trim())
          .map(b => ({
            id: b.id,
            name: b.display_borough.trim(),
            value: b.display_borough.trim().toLowerCase().replace(/\s+/g, '-')
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
          .from('zat_geo_hood_mediumlevel')
          .select('id, display, geo_borough')
          .eq('geo_borough', borough.id)
          .order('display', { ascending: true });

        if (fetchError) throw fetchError;

        const neighborhoodList = data
          .filter(n => n.display?.trim())
          .map(n => ({
            id: n.id,
            name: n.display.trim(),
            boroughId: n.geo_borough
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
        .eq('borough', borough.id);

      // Apply attribute filters
      if (filters.showActive) {
        query = query.eq('is_active', true);
      }
      if (filters.showApproved) {
        query = query.eq('is_approved', true);
      }
      if (filters.showComplete) {
        query = query.eq('is_listing_profile_complete', true);
      }
      if (!filters.showDefault) {
        query = query.eq('is_usability_test_listing', false);
      }

      // Neighborhood filter
      if (filters.selectedNeighborhood) {
        query = query.eq('primary_neighborhood_reference_id', filters.selectedNeighborhood);
      }

      // Week pattern filter
      if (filters.weekPattern !== 'every-week') {
        const patternText = WEEK_PATTERNS[filters.weekPattern];
        if (patternText) {
          query = query.eq('weeks_offered_schedule_text', patternText);
        }
      }

      // Price filter
      if (filters.priceMin !== null) {
        query = query.gte('standardized_min_nightly_price_for_search_filter', filters.priceMin);
      }
      if (filters.priceMax !== null) {
        query = query.lte('standardized_min_nightly_price_for_search_filter', filters.priceMax);
      }

      // Apply sorting
      const sortConfig = {
        'recommended': { field: 'original_updated_at', ascending: false },
        'price-low': { field: 'standardized_min_nightly_price_for_search_filter', ascending: true },
        'price-high': { field: 'standardized_min_nightly_price_for_search_filter', ascending: false },
        'newest': { field: 'original_created_at', ascending: false }
      }[filters.sortBy] || { field: 'original_updated_at', ascending: false };

      query = query.order(sortConfig.field, { ascending: sortConfig.ascending });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Client-side filtering for days and nights availability
      // Note: This is done client-side because Supabase array containment queries
      // can be complex. For production, consider moving to a stored procedure.
      const filteredByAvailability = filterListingsByAvailability(data || [], filters.selectedDays);

      // Transform listings for display
      const transformedListings = filteredByAvailability.map(listing => ({
        id: listing.id,
        name: listing.listing_title || 'Untitled Listing',
        borough: getBoroughName(listing.borough),
        neighborhood: getNeighborhoodName(listing.primary_neighborhood_reference_id),
        nightlyPrice: listing.standardized_min_nightly_price_for_search_filter || 0,
        daysAvailable: listing.available_days_as_day_numbers_json || [],
        nightsAvailable: listing.available_nights_as_day_numbers_json || [],
        weeksOffered: listing.weeks_offered_schedule_text || 'Every week',
        isActive: listing.is_active || false,
        isComplete: listing.is_listing_profile_complete || false,
        isApproved: listing.is_approved || false,
        modifiedDate: listing.original_updated_at,
        createdDate: listing.original_created_at
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
 * Parse an array field that might be stored as JSON string or native array
 */
function parseArrayField(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Filter listings by days and nights availability (client-side)
 * Implements the search algorithm:
 *   Days_Available CONTAINS [Selected Days]
 *   AND Days_Not_Available NOT_OVERLAPS [Selected Days]
 *   AND Nights_Available CONTAINS [Selected Nights]
 *   AND Nights_Not_Available NOT_OVERLAPS [Selected Days]
 *
 * Note: Selected Nights are derived from Selected Days (the nights you sleep
 * during your stay correspond to the days you're staying)
 */
function filterListingsByAvailability(listings, selectedDays) {
  if (!selectedDays || selectedDays.length === 0) {
    return listings;
  }

  // Selected nights = the nights corresponding to selected days
  // When staying on days [1,2,3,4,5] (Mon-Fri), you need nights [1,2,3,4,5]
  const selectedNights = selectedDays;

  return listings.filter(listing => {
    // Parse days available
    const daysAvailable = parseArrayField(listing.available_days_as_day_numbers_json);

    // Parse days not available
    const daysNotAvailable = parseArrayField(listing['Days_Not_Available']);

    // Parse nights available
    const nightsAvailable = parseArrayField(listing.available_nights_as_day_numbers_json);

    // Parse nights not available
    const nightsNotAvailable = parseArrayField(listing['Nights_Not_Available']);

    // Check 1: Days_Available CONTAINS [Selected Days]
    // All selected days must be in the available days list
    const allDaysAvailable = selectedDays.every(day => daysAvailable.includes(day));
    if (!allDaysAvailable) return false;

    // Check 2: Days_Not_Available NOT_OVERLAPS [Selected Days]
    // No selected day should be in the not-available days list
    const noDaysBlocked = !selectedDays.some(day => daysNotAvailable.includes(day));
    if (!noDaysBlocked) return false;

    // Check 3: Nights_Available CONTAINS [Selected Nights]
    // All selected nights must be available (if nights data exists)
    // Note: If nightsAvailable is empty, we skip this check (legacy data may not have nights)
    if (nightsAvailable.length > 0) {
      const allNightsAvailable = selectedNights.every(night => nightsAvailable.includes(night));
      if (!allNightsAvailable) return false;
    }

    // Check 4: Nights_Not_Available NOT_OVERLAPS [Selected Days]
    // Per algorithm spec, this checks selectedDays against nightsNotAvailable
    const noNightsBlocked = !selectedDays.some(day => nightsNotAvailable.includes(day));
    if (!noNightsBlocked) return false;

    return true;
  });
}
