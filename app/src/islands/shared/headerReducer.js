/**
 * Header Reducer
 *
 * Reducer-based state management for the Header component.
 * Handles UI navigation state (mobile menu, dropdowns, scroll visibility),
 * user authentication state, and suggested proposal popup state.
 *
 * Modal state is managed separately by useModalManager and is NOT included here.
 *
 * @module shared/headerReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  // UI Navigation
  mobileMenuActive: false,
  activeDropdown: null,
  headerVisible: true,
  lastScrollY: 0,

  // Auth
  currentUser: null,
  authChecked: false,
  userType: null,

  // Suggested Proposals
  pendingProposalCount: 0,
  pendingProposals: [],
  currentProposalIndex: 0,
  isProcessingProposal: false,
};

// =============================================================================
// REDUCER
// =============================================================================

export function headerReducer(state, action) {
  switch (action.type) {
    // ----- UI Navigation -----
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, mobileMenuActive: !state.mobileMenuActive };

    case 'SET_MOBILE_MENU_ACTIVE':
      return { ...state, mobileMenuActive: action.payload };

    case 'SET_ACTIVE_DROPDOWN':
      return { ...state, activeDropdown: action.payload };

    case 'TOGGLE_DROPDOWN':
      return {
        ...state,
        activeDropdown: state.activeDropdown === action.payload ? null : action.payload,
      };

    case 'SET_HEADER_VISIBLE':
      return { ...state, headerVisible: action.payload };

    case 'SET_LAST_SCROLL_Y':
      return { ...state, lastScrollY: action.payload };

    case 'HANDLE_SCROLL': {
      const { scrollY } = action.payload;
      const goingDown = scrollY > state.lastScrollY && scrollY > 100;
      return {
        ...state,
        headerVisible: !goingDown,
        lastScrollY: scrollY,
      };
    }

    case 'CLOSE_MENUS':
      return { ...state, activeDropdown: null, mobileMenuActive: false };

    // ----- Auth -----
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SET_AUTH_CHECKED':
      return { ...state, authChecked: action.payload };

    case 'SET_USER_TYPE':
      return { ...state, userType: action.payload };

    case 'SET_AUTH_STATE':
      return {
        ...state,
        currentUser: action.payload.currentUser,
        userType: action.payload.userType,
        authChecked: action.payload.authChecked,
      };

    case 'CLEAR_AUTH':
      return { ...state, currentUser: null, authChecked: true };

    // ----- Suggested Proposals -----
    case 'SET_PENDING_PROPOSAL_COUNT':
      return { ...state, pendingProposalCount: action.payload };

    case 'SET_PENDING_PROPOSALS':
      return { ...state, pendingProposals: action.payload };

    case 'SET_CURRENT_PROPOSAL_INDEX':
      return { ...state, currentProposalIndex: action.payload };

    case 'SET_IS_PROCESSING_PROPOSAL':
      return { ...state, isProcessingProposal: action.payload };

    case 'REMOVE_PROPOSAL': {
      const removeIndex = action.payload;
      const newProposals = state.pendingProposals.filter((_, i) => i !== removeIndex);
      const newCount = Math.max(0, state.pendingProposalCount - 1);
      const newIndex = state.currentProposalIndex >= newProposals.length
        ? Math.max(0, newProposals.length - 1)
        : state.currentProposalIndex;
      return {
        ...state,
        pendingProposals: newProposals,
        pendingProposalCount: newCount,
        currentProposalIndex: newIndex,
      };
    }

    case 'NEXT_PROPOSAL':
      if (state.currentProposalIndex < state.pendingProposals.length - 1) {
        return { ...state, currentProposalIndex: state.currentProposalIndex + 1 };
      }
      return state;

    case 'PREVIOUS_PROPOSAL':
      if (state.currentProposalIndex > 0) {
        return { ...state, currentProposalIndex: state.currentProposalIndex - 1 };
      }
      return state;

    default:
      return state;
  }
}
