/**
 * Create Suggested Proposal Reducer
 *
 * Reducer-based state management for the Create Suggested Proposal page.
 * Handles step navigation, listing/guest search, guest info,
 * configuration, submission flow, and UI flags.
 *
 * @module CreateSuggestedProposalPage/createSuggestedProposalReducer
 */

import { PROPOSAL_STATUSES } from '../../../logic/constants/proposalStatuses.js';

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_STATUS = PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_PENDING_CONFIRMATION.key;

/**
 * Get tomorrow's date as YYYY-MM-DD string.
 * Extracted so initialState can be rebuilt (e.g. handleCreateAnother).
 */
export function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const initialState = {
  // Step navigation
  currentStep: 1,

  // Step 1 - Listing
  listingSearchTerm: '',
  listingSearchResults: [],
  selectedListing: null,
  listingPhotos: [],
  isSearchingListings: false,

  // Step 2 - Guest
  guestSearchTerm: '',
  guestSearchResults: [],
  selectedGuest: null,
  existingProposalsCount: 0,
  isGuestConfirmed: false,
  isSearchingGuests: false,

  // Step 3 - Guest Info
  aboutMe: '',
  needForSpace: '',
  specialNeeds: '',

  // Step 3 - Configuration
  proposalStatus: DEFAULT_STATUS,
  moveInDate: getTomorrowDateString(),
  moveInRange: 14,
  strictMoveIn: false,
  selectedDays: [], // 0-indexed integers
  reservationSpan: '',
  customWeeks: null,

  // UI State
  isCreating: false,
  isConfirmationStep: false,
  validationErrors: [],
  createdProposal: null,
  createdThread: null,
};

// ============================================================================
// REDUCER
// ============================================================================

export function createSuggestedProposalReducer(state, action) {
  switch (action.type) {
    // ----- Step Navigation -----
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    // ----- Listing Search -----
    case 'SET_LISTING_SEARCH_TERM':
      return { ...state, listingSearchTerm: action.payload };

    case 'SET_LISTING_SEARCH_RESULTS':
      return { ...state, listingSearchResults: action.payload };

    case 'SET_SELECTED_LISTING':
      return { ...state, selectedListing: action.payload };

    case 'SET_LISTING_PHOTOS':
      return { ...state, listingPhotos: action.payload };

    case 'SET_IS_SEARCHING_LISTINGS':
      return { ...state, isSearchingListings: action.payload };

    case 'SELECT_LISTING':
      return {
        ...state,
        selectedListing: action.payload,
        listingSearchTerm: '',
        listingSearchResults: [],
      };

    case 'CLEAR_LISTING':
      return {
        ...state,
        selectedListing: null,
        listingPhotos: [],
        currentStep: 1,
        selectedGuest: null,
        isGuestConfirmed: false,
        existingProposalsCount: 0,
      };

    case 'CLEAR_LISTING_SEARCH':
      return {
        ...state,
        listingSearchTerm: '',
        listingSearchResults: [],
      };

    // ----- Guest Search -----
    case 'SET_GUEST_SEARCH_TERM':
      return { ...state, guestSearchTerm: action.payload };

    case 'SET_GUEST_SEARCH_RESULTS':
      return { ...state, guestSearchResults: action.payload };

    case 'SET_SELECTED_GUEST':
      return { ...state, selectedGuest: action.payload };

    case 'SET_EXISTING_PROPOSALS_COUNT':
      return { ...state, existingProposalsCount: action.payload };

    case 'SET_IS_GUEST_CONFIRMED':
      return { ...state, isGuestConfirmed: action.payload };

    case 'SET_IS_SEARCHING_GUESTS':
      return { ...state, isSearchingGuests: action.payload };

    case 'SELECT_GUEST':
      return {
        ...state,
        selectedGuest: action.payload,
        guestSearchTerm: '',
        guestSearchResults: [],
        isGuestConfirmed: false,
      };

    case 'CONFIRM_GUEST':
      return {
        ...state,
        isGuestConfirmed: true,
        currentStep: 3,
      };

    case 'CLEAR_GUEST':
      return {
        ...state,
        selectedGuest: null,
        isGuestConfirmed: false,
        existingProposalsCount: 0,
        currentStep: 2,
        aboutMe: '',
        needForSpace: '',
        specialNeeds: '',
      };

    case 'CLEAR_GUEST_SEARCH':
      return {
        ...state,
        guestSearchTerm: '',
        guestSearchResults: [],
      };

    // ----- Guest Info -----
    case 'SET_ABOUT_ME':
      return { ...state, aboutMe: action.payload };

    case 'SET_NEED_FOR_SPACE':
      return { ...state, needForSpace: action.payload };

    case 'SET_SPECIAL_NEEDS':
      return { ...state, specialNeeds: action.payload };

    case 'SET_GUEST_INFO':
      return {
        ...state,
        ...(action.payload.aboutMe !== undefined && { aboutMe: action.payload.aboutMe }),
        ...(action.payload.needForSpace !== undefined && { needForSpace: action.payload.needForSpace }),
        ...(action.payload.specialNeeds !== undefined && { specialNeeds: action.payload.specialNeeds }),
      };

    // ----- Configuration -----
    case 'SET_PROPOSAL_STATUS':
      return { ...state, proposalStatus: action.payload };

    case 'SET_MOVE_IN_DATE':
      return { ...state, moveInDate: action.payload };

    case 'SET_MOVE_IN_RANGE':
      return { ...state, moveInRange: action.payload };

    case 'SET_STRICT_MOVE_IN':
      return { ...state, strictMoveIn: action.payload };

    case 'SET_SELECTED_DAYS':
      return { ...state, selectedDays: action.payload };

    case 'TOGGLE_DAY': {
      const dayIndex = action.payload;
      const prev = state.selectedDays;
      const nextDays = prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b);
      return { ...state, selectedDays: nextDays };
    }

    case 'SELECT_ALL_DAYS':
      return { ...state, selectedDays: [0, 1, 2, 3, 4, 5, 6] };

    case 'SET_RESERVATION_SPAN':
      return {
        ...state,
        reservationSpan: action.payload,
        ...(action.payload !== 'custom' && { customWeeks: null }),
      };

    case 'SET_CUSTOM_WEEKS':
      return { ...state, customWeeks: action.payload };

    // ----- UI State -----
    case 'SET_IS_CREATING':
      return { ...state, isCreating: action.payload };

    case 'SET_IS_CONFIRMATION_STEP':
      return { ...state, isConfirmationStep: action.payload };

    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };

    case 'SET_CREATED_PROPOSAL':
      return { ...state, createdProposal: action.payload };

    case 'SET_CREATED_THREAD':
      return { ...state, createdThread: action.payload };

    // ----- Compound Actions -----
    case 'PROPOSAL_CREATED':
      return {
        ...state,
        createdProposal: action.payload.proposal,
        createdThread: action.payload.thread,
        isConfirmationStep: false,
      };

    case 'GO_BACK':
      return {
        ...state,
        ...(state.isGuestConfirmed && {
          isGuestConfirmed: false,
          currentStep: 2,
        }),
        isConfirmationStep: false,
      };

    case 'PREFILL_FROM_PROPOSAL': {
      const updates = {};
      if (action.payload.selectedDays) {
        updates.selectedDays = action.payload.selectedDays;
      }
      if (action.payload.reservationSpan !== undefined) {
        updates.reservationSpan = action.payload.reservationSpan;
      }
      if (action.payload.customWeeks !== undefined) {
        updates.customWeeks = action.payload.customWeeks;
      }
      if (action.payload.moveInDate !== undefined) {
        updates.moveInDate = action.payload.moveInDate;
      }
      return { ...state, ...updates };
    }

    case 'RESET_ALL':
      return {
        ...initialState,
        // Recompute tomorrow in case time advanced
        moveInDate: getTomorrowDateString(),
      };

    default:
      return state;
  }
}
