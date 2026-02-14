import { describe, it, expect } from 'vitest';
import {
  createSuggestedProposalReducer,
  initialState,
  getTomorrowDateString,
} from '../createSuggestedProposalReducer.js';

describe('createSuggestedProposalReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.currentStep).toBe(1);
      expect(initialState.listingSearchTerm).toBe('');
      expect(initialState.listingSearchResults).toEqual([]);
      expect(initialState.selectedListing).toBeNull();
      expect(initialState.listingPhotos).toEqual([]);
      expect(initialState.isSearchingListings).toBe(false);
      expect(initialState.guestSearchTerm).toBe('');
      expect(initialState.guestSearchResults).toEqual([]);
      expect(initialState.selectedGuest).toBeNull();
      expect(initialState.existingProposalsCount).toBe(0);
      expect(initialState.isGuestConfirmed).toBe(false);
      expect(initialState.isSearchingGuests).toBe(false);
      expect(initialState.aboutMe).toBe('');
      expect(initialState.needForSpace).toBe('');
      expect(initialState.specialNeeds).toBe('');
      expect(initialState.moveInRange).toBe(14);
      expect(initialState.strictMoveIn).toBe(false);
      expect(initialState.selectedDays).toEqual([]);
      expect(initialState.reservationSpan).toBe('');
      expect(initialState.customWeeks).toBeNull();
      expect(initialState.isCreating).toBe(false);
      expect(initialState.isConfirmationStep).toBe(false);
      expect(initialState.validationErrors).toEqual([]);
      expect(initialState.createdProposal).toBeNull();
      expect(initialState.createdThread).toBeNull();
    });
  });

  // ========================================
  // STEP NAVIGATION
  // ========================================
  describe('Step navigation', () => {
    it('SET_CURRENT_STEP sets currentStep', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_CURRENT_STEP',
        payload: 3,
      });
      expect(next.currentStep).toBe(3);
    });
  });

  // ========================================
  // LISTING SEARCH
  // ========================================
  describe('Listing search actions', () => {
    it('SET_LISTING_SEARCH_TERM sets listingSearchTerm', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_LISTING_SEARCH_TERM',
        payload: 'Brooklyn',
      });
      expect(next.listingSearchTerm).toBe('Brooklyn');
    });

    it('SET_LISTING_SEARCH_RESULTS sets listingSearchResults', () => {
      const results = [{ id: 'l1' }, { id: 'l2' }];
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_LISTING_SEARCH_RESULTS',
        payload: results,
      });
      expect(next.listingSearchResults).toBe(results);
    });

    it('SET_SELECTED_LISTING sets selectedListing', () => {
      const listing = { id: 'l1', title: 'Test' };
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_SELECTED_LISTING',
        payload: listing,
      });
      expect(next.selectedListing).toBe(listing);
    });

    it('SET_LISTING_PHOTOS sets listingPhotos', () => {
      const photos = [{ url: 'a.jpg' }];
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_LISTING_PHOTOS',
        payload: photos,
      });
      expect(next.listingPhotos).toBe(photos);
    });

    it('SET_IS_SEARCHING_LISTINGS sets isSearchingListings', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_IS_SEARCHING_LISTINGS',
        payload: true,
      });
      expect(next.isSearchingListings).toBe(true);
    });

    it('SELECT_LISTING sets listing and clears search', () => {
      const state = {
        ...initialState,
        listingSearchTerm: 'test',
        listingSearchResults: [{ id: 'l1' }],
      };
      const listing = { id: 'l1', title: 'Selected' };
      const next = createSuggestedProposalReducer(state, {
        type: 'SELECT_LISTING',
        payload: listing,
      });
      expect(next.selectedListing).toBe(listing);
      expect(next.listingSearchTerm).toBe('');
      expect(next.listingSearchResults).toEqual([]);
    });

    it('CLEAR_LISTING resets listing and related state', () => {
      const state = {
        ...initialState,
        selectedListing: { id: 'l1' },
        listingPhotos: [{ url: 'a.jpg' }],
        currentStep: 3,
        selectedGuest: { id: 'g1' },
        isGuestConfirmed: true,
        existingProposalsCount: 2,
      };
      const next = createSuggestedProposalReducer(state, { type: 'CLEAR_LISTING' });
      expect(next.selectedListing).toBeNull();
      expect(next.listingPhotos).toEqual([]);
      expect(next.currentStep).toBe(1);
      expect(next.selectedGuest).toBeNull();
      expect(next.isGuestConfirmed).toBe(false);
      expect(next.existingProposalsCount).toBe(0);
    });

    it('CLEAR_LISTING_SEARCH clears search term and results', () => {
      const state = {
        ...initialState,
        listingSearchTerm: 'foo',
        listingSearchResults: [{ id: 'l1' }],
      };
      const next = createSuggestedProposalReducer(state, { type: 'CLEAR_LISTING_SEARCH' });
      expect(next.listingSearchTerm).toBe('');
      expect(next.listingSearchResults).toEqual([]);
    });
  });

  // ========================================
  // GUEST SEARCH
  // ========================================
  describe('Guest search actions', () => {
    it('SET_GUEST_SEARCH_TERM sets guestSearchTerm', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_GUEST_SEARCH_TERM',
        payload: 'John',
      });
      expect(next.guestSearchTerm).toBe('John');
    });

    it('SET_GUEST_SEARCH_RESULTS sets guestSearchResults', () => {
      const results = [{ id: 'g1' }];
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_GUEST_SEARCH_RESULTS',
        payload: results,
      });
      expect(next.guestSearchResults).toBe(results);
    });

    it('SET_SELECTED_GUEST sets selectedGuest', () => {
      const guest = { id: 'g1' };
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_SELECTED_GUEST',
        payload: guest,
      });
      expect(next.selectedGuest).toBe(guest);
    });

    it('SET_EXISTING_PROPOSALS_COUNT sets existingProposalsCount', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_EXISTING_PROPOSALS_COUNT',
        payload: 5,
      });
      expect(next.existingProposalsCount).toBe(5);
    });

    it('SET_IS_GUEST_CONFIRMED sets isGuestConfirmed', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_IS_GUEST_CONFIRMED',
        payload: true,
      });
      expect(next.isGuestConfirmed).toBe(true);
    });

    it('SET_IS_SEARCHING_GUESTS sets isSearchingGuests', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_IS_SEARCHING_GUESTS',
        payload: true,
      });
      expect(next.isSearchingGuests).toBe(true);
    });

    it('SELECT_GUEST sets guest and clears search', () => {
      const state = {
        ...initialState,
        guestSearchTerm: 'test',
        guestSearchResults: [{ id: 'g1' }],
        isGuestConfirmed: true,
      };
      const guest = { id: 'g1', name: 'John' };
      const next = createSuggestedProposalReducer(state, {
        type: 'SELECT_GUEST',
        payload: guest,
      });
      expect(next.selectedGuest).toBe(guest);
      expect(next.guestSearchTerm).toBe('');
      expect(next.guestSearchResults).toEqual([]);
      expect(next.isGuestConfirmed).toBe(false);
    });

    it('CONFIRM_GUEST sets confirmed and advances to step 3', () => {
      const state = { ...initialState, currentStep: 2, isGuestConfirmed: false };
      const next = createSuggestedProposalReducer(state, { type: 'CONFIRM_GUEST' });
      expect(next.isGuestConfirmed).toBe(true);
      expect(next.currentStep).toBe(3);
    });

    it('CLEAR_GUEST resets guest state and step 3 fields', () => {
      const state = {
        ...initialState,
        selectedGuest: { id: 'g1' },
        isGuestConfirmed: true,
        existingProposalsCount: 3,
        currentStep: 3,
        aboutMe: 'hello',
        needForSpace: 'work',
        specialNeeds: 'none',
      };
      const next = createSuggestedProposalReducer(state, { type: 'CLEAR_GUEST' });
      expect(next.selectedGuest).toBeNull();
      expect(next.isGuestConfirmed).toBe(false);
      expect(next.existingProposalsCount).toBe(0);
      expect(next.currentStep).toBe(2);
      expect(next.aboutMe).toBe('');
      expect(next.needForSpace).toBe('');
      expect(next.specialNeeds).toBe('');
    });

    it('CLEAR_GUEST_SEARCH clears search term and results', () => {
      const state = {
        ...initialState,
        guestSearchTerm: 'John',
        guestSearchResults: [{ id: 'g1' }],
      };
      const next = createSuggestedProposalReducer(state, { type: 'CLEAR_GUEST_SEARCH' });
      expect(next.guestSearchTerm).toBe('');
      expect(next.guestSearchResults).toEqual([]);
    });
  });

  // ========================================
  // GUEST INFO
  // ========================================
  describe('Guest info actions', () => {
    it('SET_ABOUT_ME sets aboutMe', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_ABOUT_ME',
        payload: 'I am a student',
      });
      expect(next.aboutMe).toBe('I am a student');
    });

    it('SET_NEED_FOR_SPACE sets needForSpace', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_NEED_FOR_SPACE',
        payload: 'Remote work',
      });
      expect(next.needForSpace).toBe('Remote work');
    });

    it('SET_SPECIAL_NEEDS sets specialNeeds', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_SPECIAL_NEEDS',
        payload: 'Wheelchair access',
      });
      expect(next.specialNeeds).toBe('Wheelchair access');
    });

    it('SET_GUEST_INFO sets multiple fields at once', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_GUEST_INFO',
        payload: {
          aboutMe: 'Bio',
          needForSpace: 'Work',
          specialNeeds: 'None',
        },
      });
      expect(next.aboutMe).toBe('Bio');
      expect(next.needForSpace).toBe('Work');
      expect(next.specialNeeds).toBe('None');
    });

    it('SET_GUEST_INFO only updates provided fields', () => {
      const state = {
        ...initialState,
        aboutMe: 'Existing bio',
        needForSpace: 'Existing need',
        specialNeeds: 'Existing special',
      };
      const next = createSuggestedProposalReducer(state, {
        type: 'SET_GUEST_INFO',
        payload: { aboutMe: 'New bio' },
      });
      expect(next.aboutMe).toBe('New bio');
      expect(next.needForSpace).toBe('Existing need');
      expect(next.specialNeeds).toBe('Existing special');
    });
  });

  // ========================================
  // CONFIGURATION
  // ========================================
  describe('Configuration actions', () => {
    it('SET_PROPOSAL_STATUS sets proposalStatus', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_PROPOSAL_STATUS',
        payload: 'new_status',
      });
      expect(next.proposalStatus).toBe('new_status');
    });

    it('SET_MOVE_IN_DATE sets moveInDate', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_MOVE_IN_DATE',
        payload: '2026-04-01',
      });
      expect(next.moveInDate).toBe('2026-04-01');
    });

    it('SET_MOVE_IN_RANGE sets moveInRange', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_MOVE_IN_RANGE',
        payload: 30,
      });
      expect(next.moveInRange).toBe(30);
    });

    it('SET_STRICT_MOVE_IN sets strictMoveIn', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_STRICT_MOVE_IN',
        payload: true,
      });
      expect(next.strictMoveIn).toBe(true);
    });

    it('SET_SELECTED_DAYS sets selectedDays', () => {
      const days = [1, 3, 5];
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_SELECTED_DAYS',
        payload: days,
      });
      expect(next.selectedDays).toBe(days);
    });

    it('TOGGLE_DAY adds a day when not present (sorted)', () => {
      const state = { ...initialState, selectedDays: [1, 3] };
      const next = createSuggestedProposalReducer(state, {
        type: 'TOGGLE_DAY',
        payload: 2,
      });
      expect(next.selectedDays).toEqual([1, 2, 3]);
    });

    it('TOGGLE_DAY removes a day when already present', () => {
      const state = { ...initialState, selectedDays: [1, 2, 3] };
      const next = createSuggestedProposalReducer(state, {
        type: 'TOGGLE_DAY',
        payload: 2,
      });
      expect(next.selectedDays).toEqual([1, 3]);
    });

    it('SELECT_ALL_DAYS sets all seven days', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SELECT_ALL_DAYS',
      });
      expect(next.selectedDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('SET_RESERVATION_SPAN sets reservationSpan', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_RESERVATION_SPAN',
        payload: '12',
      });
      expect(next.reservationSpan).toBe('12');
    });

    it('SET_RESERVATION_SPAN clears customWeeks when not custom', () => {
      const state = { ...initialState, customWeeks: 15 };
      const next = createSuggestedProposalReducer(state, {
        type: 'SET_RESERVATION_SPAN',
        payload: '8',
      });
      expect(next.reservationSpan).toBe('8');
      expect(next.customWeeks).toBeNull();
    });

    it('SET_RESERVATION_SPAN preserves customWeeks when custom', () => {
      const state = { ...initialState, customWeeks: 15 };
      const next = createSuggestedProposalReducer(state, {
        type: 'SET_RESERVATION_SPAN',
        payload: 'custom',
      });
      expect(next.reservationSpan).toBe('custom');
      expect(next.customWeeks).toBe(15);
    });

    it('SET_CUSTOM_WEEKS sets customWeeks', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_CUSTOM_WEEKS',
        payload: 20,
      });
      expect(next.customWeeks).toBe(20);
    });
  });

  // ========================================
  // UI STATE
  // ========================================
  describe('UI state actions', () => {
    it('SET_IS_CREATING sets isCreating', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_IS_CREATING',
        payload: true,
      });
      expect(next.isCreating).toBe(true);
    });

    it('SET_IS_CONFIRMATION_STEP sets isConfirmationStep', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_IS_CONFIRMATION_STEP',
        payload: true,
      });
      expect(next.isConfirmationStep).toBe(true);
    });

    it('SET_VALIDATION_ERRORS sets validationErrors', () => {
      const errors = ['Error 1', 'Error 2'];
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_VALIDATION_ERRORS',
        payload: errors,
      });
      expect(next.validationErrors).toBe(errors);
    });

    it('SET_CREATED_PROPOSAL sets createdProposal', () => {
      const proposal = { _id: 'p1' };
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_CREATED_PROPOSAL',
        payload: proposal,
      });
      expect(next.createdProposal).toBe(proposal);
    });

    it('SET_CREATED_THREAD sets createdThread', () => {
      const thread = { _id: 't1' };
      const next = createSuggestedProposalReducer(initialState, {
        type: 'SET_CREATED_THREAD',
        payload: thread,
      });
      expect(next.createdThread).toBe(thread);
    });
  });

  // ========================================
  // COMPOUND ACTIONS
  // ========================================
  describe('Compound actions', () => {
    it('PROPOSAL_CREATED sets proposal, thread, and clears confirmation', () => {
      const state = { ...initialState, isConfirmationStep: true };
      const next = createSuggestedProposalReducer(state, {
        type: 'PROPOSAL_CREATED',
        payload: {
          proposal: { _id: 'p1' },
          thread: { _id: 't1' },
        },
      });
      expect(next.createdProposal).toEqual({ _id: 'p1' });
      expect(next.createdThread).toEqual({ _id: 't1' });
      expect(next.isConfirmationStep).toBe(false);
    });

    it('GO_BACK clears confirmation step', () => {
      const state = {
        ...initialState,
        isConfirmationStep: true,
        isGuestConfirmed: false,
      };
      const next = createSuggestedProposalReducer(state, { type: 'GO_BACK' });
      expect(next.isConfirmationStep).toBe(false);
    });

    it('GO_BACK reverts to step 2 when guest is confirmed', () => {
      const state = {
        ...initialState,
        isGuestConfirmed: true,
        currentStep: 3,
        isConfirmationStep: true,
      };
      const next = createSuggestedProposalReducer(state, { type: 'GO_BACK' });
      expect(next.isGuestConfirmed).toBe(false);
      expect(next.currentStep).toBe(2);
      expect(next.isConfirmationStep).toBe(false);
    });

    it('PREFILL_FROM_PROPOSAL sets provided fields', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'PREFILL_FROM_PROPOSAL',
        payload: {
          selectedDays: [1, 2, 3, 4],
          reservationSpan: '12',
          moveInDate: '2026-05-01',
        },
      });
      expect(next.selectedDays).toEqual([1, 2, 3, 4]);
      expect(next.reservationSpan).toBe('12');
      expect(next.moveInDate).toBe('2026-05-01');
    });

    it('PREFILL_FROM_PROPOSAL sets customWeeks when provided', () => {
      const next = createSuggestedProposalReducer(initialState, {
        type: 'PREFILL_FROM_PROPOSAL',
        payload: {
          reservationSpan: 'custom',
          customWeeks: 15,
        },
      });
      expect(next.reservationSpan).toBe('custom');
      expect(next.customWeeks).toBe(15);
    });

    it('PREFILL_FROM_PROPOSAL only updates provided fields', () => {
      const state = {
        ...initialState,
        selectedDays: [0, 6],
        moveInDate: '2026-03-01',
      };
      const next = createSuggestedProposalReducer(state, {
        type: 'PREFILL_FROM_PROPOSAL',
        payload: { reservationSpan: '8' },
      });
      expect(next.selectedDays).toEqual([0, 6]);
      expect(next.moveInDate).toBe('2026-03-01');
      expect(next.reservationSpan).toBe('8');
    });

    it('RESET_ALL returns to initial state with fresh date', () => {
      const state = {
        ...initialState,
        currentStep: 3,
        selectedListing: { id: 'l1' },
        selectedGuest: { id: 'g1' },
        isGuestConfirmed: true,
        selectedDays: [1, 2, 3],
        isCreating: true,
      };
      const next = createSuggestedProposalReducer(state, { type: 'RESET_ALL' });
      expect(next.currentStep).toBe(1);
      expect(next.selectedListing).toBeNull();
      expect(next.selectedGuest).toBeNull();
      expect(next.isGuestConfirmed).toBe(false);
      expect(next.selectedDays).toEqual([]);
      expect(next.isCreating).toBe(false);
      expect(next.moveInDate).toBe(getTomorrowDateString());
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = createSuggestedProposalReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
