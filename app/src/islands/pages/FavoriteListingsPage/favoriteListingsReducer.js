/**
 * Favorite Listings Reducer
 *
 * Reducer-based state management for the favorites page.
 * Handles data loading, auth state, proposal flow,
 * optimistic unfavorite with rollback, and UI flags.
 *
 * @module FavoriteListingsPage/favoriteListingsReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  // Data
  listings: [],
  favoritedListingIds: new Set(),
  proposalsByListingId: new Map(),
  informationalTexts: {},

  // Auth
  isLoggedIn: false,
  currentUser: null,
  userId: null,

  // Loading
  isLoading: true,
  error: null,

  // Proposal Flow
  zatConfig: null,
  moveInDate: null,
  selectedDayObjects: [],
  reservationSpan: 13,
  priceBreakdown: null,
  pendingProposalData: null,
  loggedInUserData: null,
  lastProposalDefaults: null,
  isSubmittingProposal: false,

  // UI
  viewMode: 'grid',
  mobileMapVisible: false,
  menuOpen: false,
  toast: { show: false, message: '', type: 'success' },
};

// =============================================================================
// REDUCER
// =============================================================================

export function favoriteListingsReducer(state, action) {
  switch (action.type) {
    // ----- Loading -----
    case 'INIT_START':
      return { ...state, isLoading: true, error: null };

    case 'INIT_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'INIT_COMPLETE':
      return { ...state, isLoading: false };

    // ----- Auth -----
    case 'SET_AUTH':
      return {
        ...state,
        isLoggedIn: true,
        userId: action.payload.userId,
        currentUser: action.payload.currentUser,
      };

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'CLEAR_AUTH':
      return { ...state, isLoggedIn: false, currentUser: null };

    // ----- Data loading -----
    case 'SET_USER_DATA':
      return { ...state, loggedInUserData: action.payload };

    case 'SET_LAST_PROPOSAL_DEFAULTS':
      return { ...state, lastProposalDefaults: action.payload };

    case 'SET_FAVORITED_IDS':
      return { ...state, favoritedListingIds: action.payload };

    case 'SET_LISTINGS':
      return { ...state, listings: action.payload };

    case 'SET_PROPOSALS_MAP':
      return { ...state, proposalsByListingId: action.payload };

    case 'SET_ZAT_CONFIG':
      return { ...state, zatConfig: action.payload };

    case 'SET_INFORMATIONAL_TEXTS':
      return { ...state, informationalTexts: action.payload };

    // ----- Optimistic unfavorite -----
    case 'REMOVE_LISTING': {
      const listingId = action.payload;
      const newListings = state.listings.filter(l => l.id !== listingId);
      const newFavIds = new Set(state.favoritedListingIds);
      newFavIds.delete(listingId);
      return { ...state, listings: newListings, favoritedListingIds: newFavIds };
    }

    case 'ROLLBACK_LISTING': {
      const { listing, index, listingId } = action.payload;
      let newListings = state.listings;
      if (listing && !state.listings.some(l => l.id === listing.id)) {
        newListings = [...state.listings];
        const insertIndex = index >= 0 && index <= newListings.length ? index : 0;
        newListings.splice(insertIndex, 0, listing);
      }
      const newFavIds = new Set(state.favoritedListingIds);
      newFavIds.add(listingId);
      return { ...state, listings: newListings, favoritedListingIds: newFavIds };
    }

    // ----- Proposal map update -----
    case 'UPDATE_PROPOSAL': {
      const { listingId, proposal } = action.payload;
      const newMap = new Map(state.proposalsByListingId);
      newMap.set(listingId, proposal);
      return { ...state, proposalsByListingId: newMap };
    }

    // ----- Proposal flow -----
    case 'PREPARE_PROPOSAL':
      return {
        ...state,
        selectedDayObjects: action.payload.selectedDayObjects,
        moveInDate: action.payload.moveInDate,
        reservationSpan: action.payload.reservationSpan,
        priceBreakdown: null,
      };

    case 'SET_PRICE_BREAKDOWN':
      return { ...state, priceBreakdown: action.payload };

    case 'SET_PENDING_PROPOSAL':
      return { ...state, pendingProposalData: action.payload };

    case 'START_PROPOSAL_SUBMIT':
      return { ...state, isSubmittingProposal: true };

    case 'END_PROPOSAL_SUBMIT':
      return { ...state, isSubmittingProposal: false };

    // ----- UI -----
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'SET_MOBILE_MAP_VISIBLE':
      return { ...state, mobileMapVisible: action.payload };

    case 'SET_MENU_OPEN':
      return { ...state, menuOpen: action.payload };

    case 'SHOW_TOAST':
      return {
        ...state,
        toast: { show: true, message: action.payload.message, type: action.payload.type },
      };

    case 'HIDE_TOAST':
      return { ...state, toast: { show: false, message: '', type: 'success' } };

    default:
      return state;
  }
}
