/**
 * Listings Overview Page Logic Hook
 *
 * All business logic for the ListingsOverviewPage.
 * The page component (index.jsx) is a hollow component that only renders JSX.
 *
 * This hook manages:
 * - Authentication (admin-only access)
 * - Data fetching (listings, boroughs, neighborhoods)
 * - Filtering and pagination
 * - Inline toggle updates
 * - Error management
 * - Bulk price updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { checkAuthStatus } from '../../../lib/auth/index.js';
import {
  getBoroughs,
  getNeighborhoods,
  getListings,
  resolveLocationNames,
  updateListing,
  deleteListing,
  addError,
  clearErrors,
  bulkIncrementPrices,
} from './api.js';
import {
  INITIAL_FILTERS,
  PAGE_SIZE,
  PRICE_MULTIPLIERS,
  computeListingStatus,
  computeAvailability,
} from './constants.js';

// ============================================================================
// NORMALIZER
// ============================================================================

/**
 * Safely ensure a value is an array.
 * Handles: null, undefined, arrays, JSON strings, and other types.
 */
function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  // Try parsing if it's a JSON string
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Transform Supabase listing row to UI-friendly format.
 * Note: Column names from Bubble migration include emoji prefixes for pricing.
 * Host phone is not on listing table - stored on user table instead.
 *
 * @param {Object} row - Raw listing from Supabase
 * @param {string} boroughName - Resolved borough display name
 * @param {string} neighborhoodName - Resolved neighborhood display name
 * @returns {Object} Normalized listing object
 */
function normalizeListingFromSupabase(row, boroughName, neighborhoodName) {
  // Ensure photos and features are always arrays (Bubble data may vary)
  const photos = ensureArray(row.photos_with_urls_captions_and_sort_order_json);
  const features = ensureArray(row.in_unit_amenity_reference_ids_json);
  const errors = ensureArray(row.Errors);

  return {
    id: row.id,
    uniqueId: row.id?.slice(-8) || 'N/A',
    name: row.listing_title || 'Untitled Listing',
    description: row.Description || '',
    host: {
      id: row.host_user_id,
      email: row.host_email || '',
      name: row.host_display_name || '',
      phone: '', // Phone is on user table, not listing table
    },
    location: {
      borough: row.borough,
      displayBorough: boroughName || 'Unknown',
      neighborhood: row.primary_neighborhood_reference_id,
      displayNeighborhood: neighborhoodName || 'Unknown',
    },
    pricing: {
      nightly: row.nightly_rate_for_1_night_stay || 0,
      override: row['price_override'],
      calculated3Night: row.nightly_rate_for_3_night_stay || 0,
    },
    status: computeListingStatus(row),
    availability: computeAvailability(row),
    usability: row.is_usability_test_listing || false,
    active: row.is_active || false,
    showcase: row.is_showcase || false,
    photos,
    photoCount: photos.length,
    features,
    errors,
    modifiedAt: row.original_updated_at ? new Date(row.original_updated_at) : null,
    createdAt: row.original_created_at ? new Date(row.original_created_at) : null,
    // Keep raw data for updates
    _raw: row,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useListingsOverviewPageLogic() {
  // ============================================================================
  // AUTH STATE (Gold Standard Pattern)
  // ============================================================================
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    isAdmin: false,
    shouldRedirect: false,
  });

  // Reference data
  const [boroughs, setBoroughs] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  // Listings data
  const [listings, setListings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [modalContent, setModalContent] = useState({
    isOpen: false,
    title: '',
    content: null,
  });

  // Bulk price modal state
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [customMultiplier, setCustomMultiplier] = useState(PRICE_MULTIPLIERS.DEFAULT);

  // Debounce ref for search
  const searchTimeoutRef = useRef(null);

  // ============================================================================
  // AUTH CHECK (Optional - no redirect for internal pages)
  // ============================================================================
  useEffect(() => {
    // No redirect if not authenticated - this is an internal page accessible without login
    // Always set authorized for internal pages
    setAuthState({
      isChecking: false,
      isAuthenticated: true,
      isAdmin: true,
      shouldRedirect: false,
    });
  }, []);

  // ============================================================================
  // INITIAL DATA LOAD
  // ============================================================================

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.isAdmin || authState.isChecking) return;

    const loadInitialData = async () => {
      try {
        const [boroughsData, neighborhoodsData] = await Promise.all([
          getBoroughs(),
          getNeighborhoods(),
        ]);
        setBoroughs(boroughsData);
        setNeighborhoods(neighborhoodsData);
      } catch (err) {
        console.error('[ListingsOverview] Failed to load reference data:', err);
        setError('Failed to load reference data');
      }
    };

    loadInitialData();
  }, [authState.isAuthenticated, authState.isAdmin, authState.isChecking]);

  // ============================================================================
  // LISTINGS FETCH
  // ============================================================================

  const loadListings = useCallback(async (resetPage = true) => {
    if (!authState.isAuthenticated || !authState.isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentPage = resetPage ? 1 : page;
      const { data, count, error: fetchError } = await getListings({
        filters,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      if (fetchError) throw fetchError;

      // Resolve location names
      const enrichedData = resolveLocationNames(data, boroughs, neighborhoods);

      // Normalize listings
      const normalized = enrichedData.map(row =>
        normalizeListingFromSupabase(row, row.boroughName, row.neighborhoodName)
      );

      if (resetPage) {
        setListings(normalized);
        setPage(1);
      } else {
        setListings(prev => [...prev, ...normalized]);
      }

      setTotalCount(count);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('[ListingsOverview] Load failed:', err);
      setError('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, boroughs, neighborhoods, authState.isAuthenticated, authState.isAdmin]);

  // Track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Load listings when filters change (debounced for search)
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.isAdmin || authState.isChecking) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search queries
    searchTimeoutRef.current = setTimeout(() => {
      hasLoadedRef.current = true;
      loadListings(true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, authState.isAuthenticated, authState.isAdmin, authState.isChecking]);

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      // Reset neighborhood when borough changes
      if (key === 'selectedBorough') {
        newFilters.selectedNeighborhood = '';
      }

      return newFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
    loadListings(false);
  }, [loadListings]);

  // ============================================================================
  // INLINE TOGGLE HANDLERS
  // ============================================================================

  const handleToggleUsability = useCallback(async (id, value) => {
    const { error: updateError } = await updateListing(id, { is_usability_test_listing: value });
    if (!updateError) {
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, usability: value } : l))
      );
    }
  }, []);

  const handleToggleActive = useCallback(async (id, value) => {
    const { error: updateError } = await updateListing(id, { Active: value });
    if (!updateError) {
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, active: value, availability: value ? l.availability : 'Unavailable' } : l))
      );
    }
  }, []);

  const handleToggleShowcase = useCallback(async (id, value) => {
    const { error: updateError } = await updateListing(id, { Showcase: value });
    if (!updateError) {
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, showcase: value } : l))
      );
    }
  }, []);

  // ============================================================================
  // LOCATION CHANGE HANDLERS
  // ============================================================================

  const handleBoroughChange = useCallback(async (id, boroughId) => {
    const borough = boroughs.find(b => b.id === boroughId);
    if (!borough) return;

    // Update only the borough field (clear neighborhood)
    const { error: updateError } = await updateListing(id, {
      'Location - Borough': boroughId,
      'Location - Hood': null,
    });

    if (!updateError) {
      setListings(prev =>
        prev.map(l =>
          l.id === id
            ? {
                ...l,
                location: {
                  ...l.location,
                  borough: boroughId,
                  displayBorough: borough.name,
                  neighborhood: null,
                  displayNeighborhood: '',
                },
              }
            : l
        )
      );
    }
  }, [boroughs]);

  const handleNeighborhoodChange = useCallback(async (id, neighborhoodId) => {
    const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
    if (!neighborhood) return;

    const { error: updateError } = await updateListing(id, {
      'Location - Hood': neighborhoodId,
    });

    if (!updateError) {
      setListings(prev =>
        prev.map(l =>
          l.id === id
            ? {
                ...l,
                location: {
                  ...l.location,
                  neighborhood: neighborhoodId,
                  displayNeighborhood: neighborhood.name,
                },
              }
            : l
        )
      );
    }
  }, [neighborhoods]);

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleView = useCallback((listing) => {
    window.open(`/view-split-lease/${listing.id}`, '_blank');
  }, []);

  const handleSeeDescription = useCallback((listing) => {
    setModalContent({
      isOpen: true,
      title: listing.listing_title,
      content: {
        type: 'description',
        listing,
      },
    });
  }, []);

  const handleSeePrices = useCallback((listing) => {
    setModalContent({
      isOpen: true,
      title: `Pricing - ${listing.listing_title}`,
      content: {
        type: 'pricing',
        listing,
      },
    });
  }, []);

  const handleSeeErrors = useCallback((listing) => {
    setModalContent({
      isOpen: true,
      title: `Errors - ${listing.listing_title}`,
      content: {
        type: 'errors',
        listing,
      },
    });
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    const { success, error: deleteError } = await deleteListing(id);
    if (success) {
      setListings(prev => prev.filter(l => l.id !== id));
      setTotalCount(prev => prev - 1);
    } else {
      console.error('[ListingsOverview] Delete failed:', deleteError);
    }
  }, []);

  // ============================================================================
  // ERROR MANAGEMENT
  // ============================================================================

  const handleAddError = useCallback(async (id, errorCode) => {
    const { data, error: addErrorResult } = await addError(id, errorCode);
    if (!addErrorResult && data) {
      setListings(prev =>
        prev.map(l =>
          l.id === id ? { ...l, errors: data.Errors || [] } : l
        )
      );
    }
  }, []);

  const handleClearErrors = useCallback(async (id) => {
    const { error: clearErrorResult } = await clearErrors(id);
    if (!clearErrorResult) {
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, errors: [] } : l))
      );
    }
  }, []);

  // ============================================================================
  // BULK PRICE UPDATE
  // ============================================================================

  const handleOpenPriceModal = useCallback(() => {
    setCustomMultiplier(PRICE_MULTIPLIERS.DEFAULT);
    setIsPriceModalOpen(true);
  }, []);

  const handleClosePriceModal = useCallback(() => {
    setIsPriceModalOpen(false);
  }, []);

  const handleIncrementPrices = useCallback(async (multiplier) => {
    if (listings.length === 0) return;

    setIsProcessing(true);
    setIsPriceModalOpen(false);

    try {
      const listingIds = listings.map(l => l.id);
      const { successCount, failCount } = await bulkIncrementPrices(listingIds, multiplier);

      setModalContent({
        isOpen: true,
        title: 'Price Increment Complete',
        content: {
          type: 'priceResult',
          successCount,
          failCount,
          multiplier,
        },
      });

      // Reload listings to show updated prices
      loadListings(true);
    } catch (err) {
      console.error('[ListingsOverview] Bulk price update failed:', err);
      setError('Failed to update prices');
    } finally {
      setIsProcessing(false);
    }
  }, [listings, loadListings]);

  // ============================================================================
  // MODAL
  // ============================================================================

  const closeModal = useCallback(() => {
    setModalContent({ isOpen: false, title: '', content: null });
  }, []);

  // ============================================================================
  // RETRY
  // ============================================================================

  const handleRetry = useCallback(() => {
    setError(null);
    loadListings(true);
  }, [loadListings]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Auth state
    authState,

    // Reference data
    boroughs,
    neighborhoods,

    // Listings data
    listings,
    totalCount,
    hasMore,

    // Filter state
    filters,

    // UI state
    isLoading,
    isProcessing,
    error,

    // Modal state
    modalContent,
    isPriceModalOpen,
    customMultiplier,
    setCustomMultiplier,

    // Filter handlers
    handleFilterChange,
    handleResetFilters,

    // Pagination
    handleLoadMore,

    // Toggle handlers
    handleToggleUsability,
    handleToggleActive,
    handleToggleShowcase,

    // Location handlers
    handleBoroughChange,
    handleNeighborhoodChange,

    // Action handlers
    handleView,
    handleSeeDescription,
    handleSeePrices,
    handleSeeErrors,
    handleDelete,

    // Error management
    handleAddError,
    handleClearErrors,

    // Bulk price
    handleOpenPriceModal,
    handleClosePriceModal,
    handleIncrementPrices,

    // Modal
    closeModal,

    // Retry
    handleRetry,
  };
}
