/**
 * useModifyListingsPageLogic - Business logic hook for ModifyListingsPage
 *
 * Follows the Hollow Component Pattern - all business logic is here,
 * the page component contains only JSX.
 *
 * Implements FK-safe database updates by only sending changed fields.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { getListingById, updateListing } from '../../../lib/listingService.js';
import { uploadPhoto, deletePhoto } from '../../../lib/photoUpload.js';
import {
  initializeLookups,
  isInitialized,
  getAllCancellationPolicies
} from '../../../lib/dataLookups.js';

// ============================================================================
// TYPES (JSDoc)
// ============================================================================

/**
 * @typedef {object} Listing
 * @property {string} _id - Listing ID
 * @property {string} Name - Listing name
 * @property {string} Description - Listing description
 * @property {boolean} Approved - Approval status
 * @property {boolean} Active - Active status
 * ... other properties
 */

/**
 * @typedef {object} Alert
 * @property {'success'|'error'|'warning'|'info'} type - Alert type
 * @property {string} message - Alert message
 */

/**
 * @typedef {object} SectionStatus
 * @property {boolean} isComplete - Section has required data
 * @property {boolean} hasChanges - Section has unsaved changes
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const SECTIONS = [
  { id: 'address', label: 'Address & Space', icon: 'home' },
  { id: 'features', label: 'Features', icon: 'star' },
  { id: 'leaseStyles', label: 'Lease & Pricing', icon: 'calendar' },
  { id: 'photos', label: 'Photos', icon: 'camera' },
  { id: 'rules', label: 'Rules', icon: 'clipboard' },
  { id: 'reviews', label: 'Safety & Details', icon: 'shield' }
];

const AUTO_SAVE_DELAY = 30000; // 30 seconds
const SEARCH_DEBOUNCE_MS = 300; // 300ms debounce for search

// Standard fields to select for listing search (mirrors CreateSuggestedProposal)
const LISTING_SELECT_FIELDS = `
  _id,
  Name,
  "Location - Address",
  Active,
  Approved,
  "Host email",
  "host name",
  "rental type",
  "Modified Date"
`;

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Page logic hook for ModifyListingsPage
 * @returns {object} State and handlers for the page
 */
export default function useModifyListingsPageLogic() {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  // Core data
  const [listing, setListing] = useState(null);
  const [originalListing, setOriginalListing] = useState(null);
  const [listingId, setListingId] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState('address');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Lookup data
  const [amenitiesInUnit, setAmenitiesInUnit] = useState([]);
  const [amenitiesInBuilding, setAmenitiesInBuilding] = useState([]);
  const [houseRules, setHouseRules] = useState([]);
  const [safetyFeatures, setSafetyFeatures] = useState([]);
  const [cancellationPolicyOptions, setCancellationPolicyOptions] = useState([]);

  // Refs for auto-save and state tracking
  const autoSaveTimerRef = useRef(null);
  const hasChangesRef = useRef(false);
  const currentListingIdRef = useRef(null); // Track current listing to prevent redundant loads

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  // Get listing ID from URL on mount, or load default listings
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setListingId(id);
    } else {
      // Load default listings when no listing ID is specified
      getDefaultListings();
    }
  }, []);

  // Initialize lookups on mount
  useEffect(() => {
    async function loadLookups() {
      if (!isInitialized()) {
        await initializeLookups();
      }
      loadAmenities();
      loadHouseRules();
      loadSafetyFeatures();
      loadCancellationPolicies();
    }
    loadLookups();
  }, []);

  // Load listing when ID changes
  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId]);

  // Setup beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ---------------------------------------------------------------------------
  // LOOKUP DATA LOADERS
  // ---------------------------------------------------------------------------

  async function loadAmenities() {
    try {
      // Column names with spaces need quotes in both select and filter
      const { data: inUnit } = await supabase
        .from('zat_features_amenity')
        .select('_id, Name, "Type - Amenity Categories"')
        .eq('"Type - Amenity Categories"', 'In Unit');

      const { data: inBuilding } = await supabase
        .from('zat_features_amenity')
        .select('_id, Name, "Type - Amenity Categories"')
        .eq('"Type - Amenity Categories"', 'In Building');

      setAmenitiesInUnit(inUnit || []);
      setAmenitiesInBuilding(inBuilding || []);
    } catch (err) {
      console.error('Failed to load amenities:', err);
    }
  }

  async function loadHouseRules() {
    try {
      const { data } = await supabase
        .schema('reference_table')
        .from('zat_features_houserule')
        .select('_id, Name, Icon');

      setHouseRules(data || []);
    } catch (err) {
      console.error('Failed to load house rules:', err);
    }
  }

  async function loadSafetyFeatures() {
    try {
      const { data } = await supabase
        .schema('reference_table')
        .from('zat_features_safetyfeature')
        .select('_id, Name, Icon');

      setSafetyFeatures(data || []);
    } catch (err) {
      console.error('Failed to load safety features:', err);
    }
  }

  function loadCancellationPolicies() {
    const policies = getAllCancellationPolicies();
    setCancellationPolicyOptions(policies);
  }

  // ---------------------------------------------------------------------------
  // LISTING OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Load a listing by ID
   * IMPORTANT: Skips loading if there are unsaved changes (prevents auth refresh from wiping edits)
   * @param {string} id - Listing ID
   * @param {boolean} force - Force reload even if there are unsaved changes
   */
  async function loadListing(id, force = false) {
    // CRITICAL: Don't overwrite unsaved changes unless forced
    // This prevents auth token refresh from wiping user edits
    if (hasChangesRef.current && !force) {
      console.log('[ModifyListings] Skipping reload - unsaved changes present');
      return;
    }

    // Also skip if we already have this listing loaded (prevents redundant fetches)
    // Use ref to avoid stale closure issues with listing state
    if (currentListingIdRef.current === id && !force) {
      console.log('[ModifyListings] Skipping reload - listing already loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getListingById(id);

      if (!data) {
        setError('Listing not found');
        setListing(null);
        setOriginalListing(null);
        currentListingIdRef.current = null;
        return;
      }

      setListing(data);
      setOriginalListing(structuredClone(data));
      hasChangesRef.current = false;
      currentListingIdRef.current = data._id; // Track current listing ID
      setLastSaved(data['Modified Date'] ? new Date(data['Modified Date']) : null);

      // Update URL
      const params = new URLSearchParams(window.location.search);
      params.set('id', id);
      window.history.replaceState({}, '', `?${params.toString()}`);

    } catch (err) {
      console.error('Failed to load listing:', err);
      setError(err.message || 'Failed to load listing');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Get default listings (active, approved, recently modified)
   * Matches CreateSuggestedProposal pattern
   */
  async function getDefaultListings() {
    setIsSearching(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('listing')
        .select(LISTING_SELECT_FIELDS)
        .eq('Deleted', false)
        .order('"Modified Date"', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;
      setSearchResults(data || []);
    } catch (err) {
      console.error('[ModifyListings] Failed to load default listings:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Search for listings by name, ID, host name, host email, or rental type
   * Enhanced to match CreateSuggestedProposal pattern
   * @param {string} query - Search query
   */
  async function searchListings(query) {
    setIsSearching(true);

    try {
      // Empty search = show defaults
      if (!query || query.length === 0) {
        await getDefaultListings();
        return;
      }

      const { data, error: searchError } = await supabase
        .from('listing')
        .select(LISTING_SELECT_FIELDS)
        .eq('Deleted', false)
        .or(`Name.ilike.%${query}%,_id.ilike.%${query}%,"host name".ilike.%${query}%,"Host email".ilike.%${query}%,"rental type".ilike.%${query}%`)
        .order('"Modified Date"', { ascending: false })
        .limit(20);

      if (searchError) throw searchError;

      setSearchResults(data || []);
    } catch (err) {
      console.error('[ModifyListings] Search failed:', err);
      showAlert('error', 'Search failed: ' + err.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Debounced search handler (matches CreateSuggestedProposal pattern)
   */
  const debouncedSearch = useCallback(
    debounce((term) => {
      searchListings(term);
    }, SEARCH_DEBOUNCE_MS),
    []
  );

  /**
   * Handle search input change with debouncing
   */
  const handleSearchChange = useCallback((e) => {
    const term = e.target.value;
    setSearchQuery(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  /**
   * Handle search input focus - show default listings
   */
  const handleSearchFocus = useCallback(async () => {
    if (searchResults.length === 0 && !listing) {
      await getDefaultListings();
    }
  }, [searchResults.length, listing]);

  /**
   * Clear search and results
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  /**
   * Update listing with partial data (FK-safe pattern)
   * @param {object} partialData - Fields to update
   */
  const updateListingData = useCallback((partialData) => {
    setListing(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partialData };
      hasChangesRef.current = true;
      return updated;
    });

    // Reset auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        saveChanges();
      }
    }, AUTO_SAVE_DELAY);
  }, []);

  /**
   * Save changes to database using FK-safe pattern
   * Only sends fields that actually changed
   */
  async function saveChanges() {
    if (!listing || !originalListing) return;

    // Calculate changed fields only
    const changedFields = {};
    for (const [key, value] of Object.entries(listing)) {
      if (JSON.stringify(value) !== JSON.stringify(originalListing[key])) {
        changedFields[key] = value;
      }
    }

    if (Object.keys(changedFields).length === 0) {
      showAlert('info', 'No changes to save');
      return;
    }

    setIsSaving(true);

    try {
      console.log('[ModifyListings] Saving changed fields:', Object.keys(changedFields));

      await updateListing(listing._id, changedFields);

      // Update original to match current
      setOriginalListing(structuredClone(listing));
      hasChangesRef.current = false;
      setLastSaved(new Date());

      showAlert('success', 'Changes saved successfully');
    } catch (err) {
      console.error('[ModifyListings] Save failed:', err);

      // Log full error details for FK violations
      if (err.code === '23503') {
        console.error('[ModifyListings] FK violation details:', {
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint
        });
      }

      showAlert('error', 'Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Save a specific section
   * @param {string} sectionId - Section to save
   */
  async function saveSection(sectionId) {
    // For now, just save all changes
    await saveChanges();
  }

  // ---------------------------------------------------------------------------
  // PHOTO OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Upload a photo for the listing
   * @param {File} file - File to upload
   */
  async function handleUploadPhoto(file) {
    if (!listing) return;

    try {
      const photos = listing['Features - Photos'] || [];
      const index = photos.length;

      const result = await uploadPhoto({ file }, listing._id, index);

      const newPhoto = {
        id: `photo_${Date.now()}`,
        url: result.url,
        Photo: result.url,
        'Photo (thumbnail)': result.url,
        storagePath: result.path,
        SortOrder: index,
        toggleMainPhoto: index === 0
      };

      updateListingData({
        'Features - Photos': [...photos, newPhoto]
      });

      showAlert('success', 'Photo uploaded');
    } catch (err) {
      console.error('Photo upload failed:', err);
      showAlert('error', 'Failed to upload photo: ' + err.message);
    }
  }

  /**
   * Delete a photo from the listing
   * @param {string} photoId - Photo ID to delete
   */
  async function handleDeletePhoto(photoId) {
    if (!listing) return;

    const photos = listing['Features - Photos'] || [];
    const photo = photos.find(p => p.id === photoId);

    if (photo?.storagePath) {
      await deletePhoto(photo.storagePath);
    }

    const updatedPhotos = photos
      .filter(p => p.id !== photoId)
      .map((p, i) => ({
        ...p,
        SortOrder: i,
        toggleMainPhoto: i === 0
      }));

    updateListingData({ 'Features - Photos': updatedPhotos });
    showAlert('success', 'Photo deleted');
  }

  // ---------------------------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Show an alert notification
   * @param {'success'|'error'|'warning'|'info'} type - Alert type
   * @param {string} message - Alert message
   */
  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  /**
   * Check if there are unsaved changes
   * @returns {boolean}
   */
  function hasUnsavedChanges() {
    if (!listing || !originalListing) return false;

    for (const [key, value] of Object.entries(listing)) {
      if (JSON.stringify(value) !== JSON.stringify(originalListing[key])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get completion status for each section
   * @returns {object} Map of section ID to completion status
   */
  function getSectionStatus() {
    if (!listing) return {};

    return {
      address: {
        isComplete: Boolean(listing.Name && (listing['Location - Address']?.address || listing['street_address'])),
        hasChanges: false
      },
      features: {
        isComplete: Boolean(listing.Description),
        hasChanges: false
      },
      leaseStyles: {
        isComplete: Boolean(listing['rental type']),
        hasChanges: false
      },
      photos: {
        isComplete: (listing['Features - Photos'] || []).length >= 3,
        hasChanges: false
      },
      rules: {
        isComplete: Boolean(listing['Cancellation Policy']),
        hasChanges: false
      },
      reviews: {
        isComplete: true, // Optional section
        hasChanges: false
      }
    };
  }

  /**
   * Select a listing from search results
   * @param {object} result - Search result item
   */
  function selectSearchResult(result) {
    setListingId(result._id);
    setSearchQuery('');
    setSearchResults([]);
  }

  /**
   * Clear the current listing and show search
   */
  function clearListing() {
    if (hasUnsavedChanges()) {
      if (!window.confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setListing(null);
    setOriginalListing(null);
    setListingId(null);
    hasChangesRef.current = false;
    currentListingIdRef.current = null; // Clear listing ID ref

    // Update URL
    const params = new URLSearchParams(window.location.search);
    params.delete('id');
    window.history.replaceState({}, '', window.location.pathname);
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    listing,
    listingId,
    isLoading,
    isSaving,
    isSearching,
    error,
    alert,
    lastSaved,

    // Search (matches CreateSuggestedProposal pattern)
    searchQuery,
    searchResults,
    setSearchQuery,
    searchListings,
    selectSearchResult,
    handleSearchChange,
    handleSearchFocus,
    handleClearSearch,

    // Navigation
    activeSection,
    setActiveSection,
    sections: SECTIONS,
    sectionStatus: getSectionStatus(),

    // Listing operations
    loadListing,
    updateListingData,
    saveChanges,
    saveSection,
    clearListing,
    hasUnsavedChanges: hasUnsavedChanges(),

    // Photo operations
    onUploadPhoto: handleUploadPhoto,
    onDeletePhoto: handleDeletePhoto,

    // Lookup data
    amenitiesInUnit,
    amenitiesInBuilding,
    houseRules,
    safetyFeatures,
    cancellationPolicyOptions,

    // Alert
    showAlert,
    dismissAlert: () => setAlert(null)
  };
}
