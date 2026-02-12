/**
 * useQuickPricePageLogic - All business logic for QuickPricePage
 *
 * This hook follows the Hollow Component pattern - ALL logic lives here,
 * the page component is purely presentational.
 *
 * State Management:
 * - listings: Raw listing data from API
 * - filteredListings: Filtered/sorted view of listings
 * - selectedListings: IDs of selected listings for bulk operations
 * - pricingConfig: Global pricing configuration (read-only)
 * - UI state: loading, error, pagination, filters
 *
 * @param {Object} options
 * @param {Function} options.showToast - Toast notification function
 * @returns {Object} All state and handlers for the page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { PRICING_CONSTANTS } from '../../../logic/constants/pricingConstants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PAGE_SIZE = 25;

// NYC Boroughs for filter dropdown
const NYC_BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
];

// Rental types for filter dropdown
const RENTAL_TYPES = [
  'Full-Time',
  'Part-Time',
  'Flexible',
];

/**
 * Adapt listing from Supabase format to frontend-friendly format
 * Column names match actual database schema
 */
function adaptListingFromSupabase(raw) {
  const host = raw.host || {};

  return {
    id: raw.id,
    name: raw.listing_title || 'Untitled Listing',
    active: raw.is_active ?? false,
    rentalType: raw.rental_type || '',
    borough: raw.borough || '',
    neighborhood: raw.primary_neighborhood_reference_id || '',

    // Pricing fields (these columns have emoji prefixes in the database)
    unitMarkup: raw.unit_markup_percentage,
    weeklyHostRate: raw.weekly_rate_paid_to_host,
    monthlyHostRate: raw.monthly_rate_paid_to_host,
    nightlyRate2: raw.nightly_rate_for_2_night_stay,
    nightlyRate3: raw.nightly_rate_for_3_night_stay,
    nightlyRate4: raw.nightly_rate_for_4_night_stay,
    nightlyRate5: raw.nightly_rate_for_5_night_stay,
    nightlyRate6: raw.nightly_rate_for_6_night_stay,
    nightlyRate7: raw.nightly_rate_for_7_night_stay,
    cleaningCost: raw.cleaning_fee_amount,
    damageDeposit: raw.damage_deposit_amount,
    priceOverride: raw['price_override'],
    extraCharges: raw['extra_charges'],

    // Host info (host is fetched separately and enriched by edge function)
    hostId: host.id || null,
    hostEmail: host.email || '',
    hostName: `${host.name_first || ''} ${host.name_last || ''}`.trim() || 'Unknown Host',

    // Dates
    createdAt: raw.original_created_at ? new Date(raw.original_created_at) : null,
    modifiedAt: raw.original_updated_at ? new Date(raw.original_updated_at) : null,
  };
}

export function useQuickPricePageLogic({ showToast }) {
  // ===== STATE =====
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('');
  const [boroughFilter, setBoroughFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);

  // Selection for bulk operations
  const [selectedListings, setSelectedListings] = useState([]);

  // Edit modal state
  const [editingListing, setEditingListing] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Pricing config (read-only)
  const [pricingConfig, setPricingConfig] = useState(null);

  // ===== FILTER & SORT OPTIONS =====
  const rentalTypeOptions = useMemo(() => [
    { value: '', label: 'All Types' },
    ...RENTAL_TYPES.map(type => ({ value: type, label: type })),
  ], []);

  const boroughOptions = useMemo(() => [
    { value: '', label: 'All Boroughs' },
    ...NYC_BOROUGHS.map(borough => ({ value: borough, label: borough })),
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'modifiedAt', label: 'Modified Date' },
    { value: 'name', label: 'Name' },
    { value: 'priceOverride', label: 'Price Override' },
    { value: 'weeklyHostRate', label: 'Weekly Rate' },
  ], []);

  // ===== AUTH TOKEN SETUP (NO PERMISSION GATING) =====
  useEffect(() => {
    const loadToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const legacyToken = localStorage.getItem('sl_auth_token') || sessionStorage.getItem('sl_auth_token');
        setAccessToken(session?.access_token || legacyToken || '');
      } catch (err) {
        console.error('[QuickPrice] Token lookup failed:', err);
        setAccessToken('');
      }
    };
    loadToken();
  }, []);

  const buildHeaders = useCallback(() => {
    // Build headers with apikey (required) and optional auth (soft headers pattern)
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  // ===== API CALL HELPER =====
  const callEdgeFunction = useCallback(async (action, payload = {}) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing-admin`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Action ${action} failed`);
    }

    return result.data;
  }, [buildHeaders]);

  // ===== FETCH LISTINGS =====
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Map frontend sort fields to database field names
      const sortFieldMap = {
        createdAt: 'Created Date',
        modifiedAt: 'Modified Date',
        name: 'Name',
        priceOverride: 'price_override',
        weeklyHostRate: 'weekly_rate_paid_to_host',
      };

      const data = await callEdgeFunction('list', {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: {
          rentalType: rentalTypeFilter || undefined,
          borough: boroughFilter || undefined,
          neighborhood: neighborhoodFilter || undefined,
          nameSearch: searchQuery || undefined,
          activeOnly: activeOnlyFilter || undefined,
        },
        sortField: sortFieldMap[sortField] || 'Created Date',
        sortOrder,
      });

      const adaptedListings = (data.listings || []).map(adaptListingFromSupabase);
      setListings(adaptedListings);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('[QuickPrice] Fetch error:', err);
      setError(err.message);
      showToast({ title: 'Failed to load listings', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [page, rentalTypeFilter, boroughFilter, neighborhoodFilter, searchQuery, activeOnlyFilter, sortField, sortOrder, callEdgeFunction, showToast]);

  // ===== FETCH PRICING CONFIG =====
  const fetchPricingConfig = useCallback(async () => {
    try {
      const data = await callEdgeFunction('getConfig');
      setPricingConfig(data);
    } catch (err) {
      console.error('[QuickPrice] Config fetch error:', err);
      // Use local constants as fallback
      setPricingConfig({
        siteMarkupRate: PRICING_CONSTANTS.SITE_MARKUP_RATE,
        fullTimeDiscountRate: PRICING_CONSTANTS.FULL_TIME_DISCOUNT_RATE,
        fullTimeNightsThreshold: PRICING_CONSTANTS.FULL_TIME_NIGHTS_THRESHOLD,
        minNights: PRICING_CONSTANTS.MIN_NIGHTS,
        maxNights: PRICING_CONSTANTS.MAX_NIGHTS,
        billingCycleWeeks: PRICING_CONSTANTS.BILLING_CYCLE_WEEKS,
        isReadOnly: true,
      });
    }
  }, [callEdgeFunction]);

  useEffect(() => {
    fetchListings();
    fetchPricingConfig();
  }, [fetchListings, fetchPricingConfig]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, rentalTypeFilter, boroughFilter, neighborhoodFilter, activeOnlyFilter, sortField, sortOrder]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ===== STATS =====
  const stats = useMemo(() => ({
    total: totalCount,
    active: listings.filter(l => l.active).length,
    withOverride: listings.filter(l => l.priceOverride != null).length,
    displayed: listings.length,
  }), [totalCount, listings]);

  // ===== SELECTION HANDLERS =====
  const handleSelectListing = useCallback((listingId) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = listings.map(l => l.id);
    setSelectedListings(prev => {
      const allSelected = allIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !allIds.includes(id));
      } else {
        return [...new Set([...prev, ...allIds])];
      }
    });
  }, [listings]);

  const handleClearSelection = useCallback(() => {
    setSelectedListings([]);
  }, []);

  const isAllSelected = useMemo(() => {
    const allIds = listings.map(l => l.id);
    return allIds.length > 0 && allIds.every(id => selectedListings.includes(id));
  }, [listings, selectedListings]);

  // ===== EDIT HANDLERS =====
  const handleOpenEdit = useCallback((listing) => {
    setEditingListing(listing);
    setEditFormData({
      unitMarkup: listing.unitMarkup ?? '',
      weeklyHostRate: listing.weeklyHostRate ?? '',
      monthlyHostRate: listing.monthlyHostRate ?? '',
      nightlyRate2: listing.nightlyRate2 ?? '',
      nightlyRate3: listing.nightlyRate3 ?? '',
      nightlyRate4: listing.nightlyRate4 ?? '',
      nightlyRate5: listing.nightlyRate5 ?? '',
      nightlyRate6: listing.nightlyRate6 ?? '',
      nightlyRate7: listing.nightlyRate7 ?? '',
      cleaningCost: listing.cleaningCost ?? '',
      damageDeposit: listing.damageDeposit ?? '',
      priceOverride: listing.priceOverride ?? '',
      extraCharges: listing.extraCharges ?? '',
    });
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingListing(null);
    setEditFormData({});
  }, []);

  const handleEditFormChange = useCallback((field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingListing) return;

    // Map frontend field names to database field names
    const fieldMap = {
      unitMarkup: 'unit_markup_percentage',
      weeklyHostRate: 'weekly_rate_paid_to_host',
      monthlyHostRate: 'monthly_rate_paid_to_host',
      nightlyRate2: 'nightly_rate_for_2_night_stay',
      nightlyRate3: 'nightly_rate_for_3_night_stay',
      nightlyRate4: 'nightly_rate_for_4_night_stay',
      nightlyRate5: 'nightly_rate_for_5_night_stay',
      nightlyRate6: 'nightly_rate_for_6_night_stay',
      nightlyRate7: 'nightly_rate_for_7_night_stay',
      cleaningCost: 'cleaning_fee_amount',
      damageDeposit: 'damage_deposit_amount',
      priceOverride: 'price_override',
      extraCharges: 'extra_charges',
    };

    // Build changed fields only (critical for avoiding FK constraint violations)
    const changedFields = {};
    for (const [frontendKey, dbKey] of Object.entries(fieldMap)) {
      const newValue = editFormData[frontendKey];
      const oldValue = editingListing[frontendKey];

      // Convert empty string to null, otherwise parse as number
      const parsedNew = newValue === '' ? null : Number(newValue);
      const parsedOld = oldValue ?? null;

      if (parsedNew !== parsedOld) {
        changedFields[dbKey] = parsedNew;
      }
    }

    if (Object.keys(changedFields).length === 0) {
      showToast({ title: 'No changes to save', type: 'info' });
      handleCloseEdit();
      return;
    }

    try {
      setIsLoading(true);
      await callEdgeFunction('updatePrice', {
        listingId: editingListing.id,
        fields: changedFields,
      });

      // Update local state
      setListings(prev =>
        prev.map(l => {
          if (l.id !== editingListing.id) return l;

          // Apply changes to local listing
          const updated = { ...l };
          for (const [frontendKey] of Object.entries(fieldMap)) {
            const newValue = editFormData[frontendKey];
            updated[frontendKey] = newValue === '' ? null : Number(newValue);
          }
          updated.modifiedAt = new Date();
          return updated;
        })
      );

      showToast({ title: 'Pricing updated', type: 'success' });
      handleCloseEdit();
    } catch (err) {
      console.error('[QuickPrice] Update error:', err);
      showToast({ title: 'Failed to update pricing', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [editingListing, editFormData, callEdgeFunction, showToast, handleCloseEdit]);

  // ===== ACTION HANDLERS =====
  const handleToggleActive = useCallback(async (listingId, newActive) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('toggleActive', { listingId, active: newActive });

      setListings(prev =>
        prev.map(l => l.id === listingId ? { ...l, active: newActive, modifiedAt: new Date() } : l)
      );

      showToast({ title: `Listing ${newActive ? 'activated' : 'deactivated'}`, type: 'success' });
    } catch (err) {
      console.error('[QuickPrice] Toggle active error:', err);
      showToast({ title: 'Failed to update status', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction, showToast]);

  const handleSetOverride = useCallback(async (listingId, priceOverride) => {
    try {
      setIsLoading(true);
      await callEdgeFunction('setOverride', { listingId, priceOverride });

      setListings(prev =>
        prev.map(l => l.id === listingId ? { ...l, priceOverride, modifiedAt: new Date() } : l)
      );

      showToast({
        title: priceOverride === null ? 'Price override cleared' : 'Price override set',
        type: 'success'
      });
    } catch (err) {
      console.error('[QuickPrice] Set override error:', err);
      showToast({ title: 'Failed to set override', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction, showToast]);

  // ===== BULK HANDLERS =====
  const handleBulkUpdate = useCallback(async (fields) => {
    if (selectedListings.length === 0) return;

    try {
      setIsLoading(true);
      await callEdgeFunction('bulkUpdate', {
        listingIds: selectedListings,
        fields,
      });

      // Refresh data
      await fetchListings();

      showToast({
        title: `${selectedListings.length} listings updated`,
        type: 'success',
      });
      setSelectedListings([]);
    } catch (err) {
      console.error('[QuickPrice] Bulk update error:', err);
      showToast({ title: 'Bulk update failed', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedListings, callEdgeFunction, fetchListings, showToast]);

  const handleBulkExport = useCallback(async (format = 'csv') => {
    const idsToExport = selectedListings.length > 0
      ? selectedListings
      : listings.map(l => l.id);

    if (idsToExport.length === 0) {
      showToast({ title: 'No listings to export', type: 'warning' });
      return;
    }

    try {
      setIsLoading(true);
      const data = await callEdgeFunction('export', {
        listingIds: idsToExport,
        format,
      });

      // Trigger download
      const blob = new Blob([data.content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listings-pricing-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({ title: 'Export complete', type: 'success' });
    } catch (err) {
      console.error('[QuickPrice] Export error:', err);
      showToast({ title: 'Export failed', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedListings, listings, callEdgeFunction, showToast]);

  // ===== UI HANDLERS =====
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setRentalTypeFilter('');
    setBoroughFilter('');
    setNeighborhoodFilter('');
    setActiveOnlyFilter(false);
    setSortField('createdAt');
    setSortOrder('desc');
  }, []);

  const handleRetry = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  // ===== RETURN =====
  return {
    // Data
    listings,
    stats,
    pricingConfig,

    // Loading & Error
    isLoading,
    error,

    // Filters
    searchQuery,
    setSearchQuery,
    rentalTypeFilter,
    setRentalTypeFilter,
    boroughFilter,
    setBoroughFilter,
    neighborhoodFilter,
    setNeighborhoodFilter,
    activeOnlyFilter,
    setActiveOnlyFilter,
    sortField,
    setSortField,
    sortOrder,
    toggleSortOrder,
    rentalTypeOptions,
    boroughOptions,
    sortOptions,

    // Pagination
    page,
    setPage,
    totalPages,
    totalCount,

    // Selection
    selectedListings,
    handleSelectListing,
    handleSelectAll,
    handleClearSelection,
    isAllSelected,

    // Edit Modal
    editingListing,
    editFormData,
    handleOpenEdit,
    handleCloseEdit,
    handleEditFormChange,
    handleSaveEdit,

    // Actions
    handleToggleActive,
    handleSetOverride,

    // Bulk Actions
    handleBulkUpdate,
    handleBulkExport,

    // UI
    handleClearFilters,
    handleRetry,
  };
}
