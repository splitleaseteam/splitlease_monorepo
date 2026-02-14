/**
 * Search Page Reducer
 *
 * Reducer-based state management for the search page.
 * Handles listings data, filters, geography, fallback listings,
 * UI flags, and detail drawer state.
 *
 * Modal state (contact, info, AI research) is managed separately
 * via useModalManager in the hook.
 *
 * @module searchPageReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  // Loading & Error
  isLoading: true,
  error: null,

  // Listings
  allActiveListings: [],
  allListings: [],
  displayedListings: [],
  loadedCount: 0,

  // Fallback Listings
  fallbackListings: [],
  fallbackDisplayedListings: [],
  fallbackLoadedCount: 0,
  isFallbackLoading: false,
  fallbackFetchFailed: false,

  // Informational Texts
  informationalTexts: {},

  // Geography
  boroughs: [],
  neighborhoods: [],

  // Filters
  selectedBoroughs: [],
  selectedNeighborhoods: [],
  weekPattern: 'every-week',
  priceTier: 'all',
  sortBy: 'recommended',
  neighborhoodSearch: '',

  // UI
  filterPanelActive: false,
  menuOpen: false,
  mobileMapVisible: false,

  // Detail Drawer
  isDetailDrawerOpen: false,
  detailDrawerListing: null,
};

// =============================================================================
// REDUCER
// =============================================================================

export function searchPageReducer(state, action) {
  switch (action.type) {
    // ----- Loading & Error -----
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    // ----- Listings -----
    case 'SET_ALL_ACTIVE_LISTINGS':
      return { ...state, allActiveListings: action.payload };

    case 'SET_ALL_LISTINGS':
      return { ...state, allListings: action.payload };

    case 'SET_DISPLAYED_LISTINGS':
      return { ...state, displayedListings: action.payload };

    case 'SET_LOADED_COUNT':
      return { ...state, loadedCount: action.payload };

    case 'SET_LISTINGS_AND_RESET_COUNT':
      return { ...state, allListings: action.payload, loadedCount: 0 };

    // ----- Fallback Listings -----
    case 'SET_FALLBACK_LISTINGS':
      return { ...state, fallbackListings: action.payload };

    case 'SET_FALLBACK_DISPLAYED_LISTINGS':
      return { ...state, fallbackDisplayedListings: action.payload };

    case 'SET_FALLBACK_LOADED_COUNT':
      return { ...state, fallbackLoadedCount: action.payload };

    case 'SET_IS_FALLBACK_LOADING':
      return { ...state, isFallbackLoading: action.payload };

    case 'SET_FALLBACK_FETCH_FAILED':
      return { ...state, fallbackFetchFailed: action.payload };

    case 'CLEAR_FALLBACK':
      return {
        ...state,
        fallbackListings: [],
        fallbackDisplayedListings: [],
        fallbackLoadedCount: 0,
      };

    case 'SET_FALLBACK_LISTINGS_AND_RESET_COUNT':
      return { ...state, fallbackListings: action.payload, fallbackLoadedCount: 0 };

    case 'FALLBACK_FETCH_ERROR':
      return { ...state, fallbackListings: [], fallbackFetchFailed: true };

    // ----- Informational Texts -----
    case 'SET_INFORMATIONAL_TEXTS':
      return { ...state, informationalTexts: action.payload };

    // ----- Geography -----
    case 'SET_BOROUGHS':
      return { ...state, boroughs: action.payload };

    case 'SET_NEIGHBORHOODS':
      return { ...state, neighborhoods: action.payload };

    // ----- Filters -----
    case 'SET_SELECTED_BOROUGHS':
      return { ...state, selectedBoroughs: action.payload };

    case 'SET_SELECTED_NEIGHBORHOODS':
      return { ...state, selectedNeighborhoods: action.payload };

    case 'SET_WEEK_PATTERN':
      return { ...state, weekPattern: action.payload };

    case 'SET_PRICE_TIER':
      return { ...state, priceTier: action.payload };

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };

    case 'SET_NEIGHBORHOOD_SEARCH':
      return { ...state, neighborhoodSearch: action.payload };

    case 'RESET_FILTERS':
      return {
        ...state,
        selectedBoroughs: [],
        selectedNeighborhoods: [],
        weekPattern: 'every-week',
        priceTier: 'all',
        sortBy: 'recommended',
        neighborhoodSearch: '',
      };

    case 'SET_ALL_FILTERS':
      return {
        ...state,
        selectedBoroughs: action.payload.selectedBoroughs,
        weekPattern: action.payload.weekPattern,
        priceTier: action.payload.priceTier,
        sortBy: action.payload.sortBy,
        selectedNeighborhoods: action.payload.selectedNeighborhoods,
      };

    // ----- UI -----
    case 'SET_FILTER_PANEL_ACTIVE':
      return { ...state, filterPanelActive: action.payload };

    case 'SET_MENU_OPEN':
      return { ...state, menuOpen: action.payload };

    case 'SET_MOBILE_MAP_VISIBLE':
      return { ...state, mobileMapVisible: action.payload };

    // ----- Detail Drawer -----
    case 'OPEN_DETAIL_DRAWER':
      return {
        ...state,
        detailDrawerListing: action.payload,
        isDetailDrawerOpen: true,
      };

    case 'CLOSE_DETAIL_DRAWER':
      return { ...state, isDetailDrawerOpen: false };

    case 'CLEAR_DETAIL_DRAWER_LISTING':
      return { ...state, detailDrawerListing: null };

    // ----- Load More -----
    case 'LOAD_MORE_LISTINGS': {
      const { nextCount, listings } = action.payload;
      return {
        ...state,
        displayedListings: listings,
        loadedCount: nextCount,
      };
    }

    case 'LOAD_MORE_FALLBACK': {
      const { nextCount, listings } = action.payload;
      return {
        ...state,
        fallbackDisplayedListings: listings,
        fallbackLoadedCount: nextCount,
      };
    }

    default:
      return state;
  }
}
