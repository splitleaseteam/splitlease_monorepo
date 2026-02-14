/**
 * View Split Lease Reducer
 *
 * Reducer-based state management for the listing detail page.
 * Handles core data loading, booking widget state, proposal flow,
 * user data sync, and UI flags.
 *
 * @module ViewSplitLeasePage/viewSplitLeaseReducer
 */

// =============================================================================
// STATE
// =============================================================================

export interface ViewSplitLeaseState {
  // Core Data
  isLoading: boolean;
  error: string | null;
  listing: any | null;
  zatConfig: any | null;
  informationalTexts: Record<string, any>;

  // Booking Widget
  selectedDayObjects: any[];
  moveInDate: string | null;
  reservationSpan: number;
  isStrictModeEnabled: boolean;

  // Proposal Flow
  pendingProposalData: any | null;
  isSubmittingProposal: boolean;

  // User Data
  loggedInUserData: any | null;
  existingProposalForListing: any | null;
  isFavorited: boolean;

  // UI
  isMobile: boolean;
  shouldLoadMap: boolean;
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

interface UrlState {
  daysSelected: any[];
  moveInDate: string | null;
  reservationSpan: number;
}

export function createInitialState(urlState: UrlState): ViewSplitLeaseState {
  return {
    // Core Data
    isLoading: true,
    error: null,
    listing: null,
    zatConfig: null,
    informationalTexts: {},

    // Booking Widget
    selectedDayObjects: urlState.daysSelected,
    moveInDate: urlState.moveInDate,
    reservationSpan: urlState.reservationSpan,
    isStrictModeEnabled: false,

    // Proposal Flow
    pendingProposalData: null,
    isSubmittingProposal: false,

    // User Data
    loggedInUserData: null,
    existingProposalForListing: null,
    isFavorited: false,

    // UI
    isMobile: false,
    shouldLoadMap: false,
  };
}

// =============================================================================
// ACTIONS
// =============================================================================

export type ViewSplitLeaseAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { listing: any; zatConfig: any; informationalTexts: any } }
  | { type: 'INIT_ERROR'; payload: string }
  | { type: 'UPDATE_SCHEDULE'; payload: any[] }
  | { type: 'SET_MOVE_IN_DATE'; payload: string | null }
  | { type: 'SET_RESERVATION_SPAN'; payload: number }
  | { type: 'SET_STRICT_MODE'; payload: boolean }
  | { type: 'START_PROPOSAL_SUBMIT' }
  | { type: 'PROPOSAL_SUBMIT_SUCCESS'; payload: { proposalId: string } }
  | { type: 'PROPOSAL_SUBMIT_ERROR' }
  | { type: 'SET_PENDING_PROPOSAL'; payload: any | null }
  | { type: 'SET_USER_DATA'; payload: { loggedInUserData: any | null; existingProposal: any | null; isFavorited: boolean } }
  | { type: 'CLEAR_USER_DATA' }
  | { type: 'TOGGLE_FAVORITE'; payload: boolean }
  | { type: 'SET_EXISTING_PROPOSAL'; payload: any | null }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'SET_SHOULD_LOAD_MAP' };

// =============================================================================
// REDUCER
// =============================================================================

export function viewSplitLeaseReducer(
  state: ViewSplitLeaseState,
  action: ViewSplitLeaseAction,
): ViewSplitLeaseState {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, isLoading: true, error: null };

    case 'INIT_SUCCESS':
      return {
        ...state,
        listing: action.payload.listing,
        zatConfig: action.payload.zatConfig,
        informationalTexts: action.payload.informationalTexts,
        isLoading: false,
        error: null,
      };

    case 'INIT_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'UPDATE_SCHEDULE':
      return { ...state, selectedDayObjects: action.payload };

    case 'SET_MOVE_IN_DATE':
      return { ...state, moveInDate: action.payload };

    case 'SET_RESERVATION_SPAN':
      return { ...state, reservationSpan: action.payload };

    case 'SET_STRICT_MODE':
      return { ...state, isStrictModeEnabled: action.payload };

    case 'START_PROPOSAL_SUBMIT':
      return { ...state, isSubmittingProposal: true };

    case 'PROPOSAL_SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmittingProposal: false,
        pendingProposalData: null,
        existingProposalForListing: { id: action.payload.proposalId },
      };

    case 'PROPOSAL_SUBMIT_ERROR':
      return { ...state, isSubmittingProposal: false };

    case 'SET_PENDING_PROPOSAL':
      return { ...state, pendingProposalData: action.payload };

    case 'SET_USER_DATA':
      return {
        ...state,
        loggedInUserData: action.payload.loggedInUserData,
        existingProposalForListing: action.payload.existingProposal,
        isFavorited: action.payload.isFavorited,
      };

    case 'CLEAR_USER_DATA':
      return {
        ...state,
        loggedInUserData: null,
        existingProposalForListing: null,
        isFavorited: false,
      };

    case 'TOGGLE_FAVORITE':
      return { ...state, isFavorited: action.payload };

    case 'SET_EXISTING_PROPOSAL':
      return { ...state, existingProposalForListing: action.payload };

    case 'SET_MOBILE':
      return { ...state, isMobile: action.payload };

    case 'SET_SHOULD_LOAD_MAP':
      return { ...state, shouldLoadMap: true };

    default:
      return state;
  }
}
