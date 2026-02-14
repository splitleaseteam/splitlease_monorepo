import { describe, it, expect } from 'vitest';
import { favoriteListingsReducer, initialState } from '../favoriteListingsReducer.js';

describe('favoriteListingsReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.listings).toEqual([]);
      expect(initialState.favoritedListingIds).toBeInstanceOf(Set);
      expect(initialState.favoritedListingIds.size).toBe(0);
      expect(initialState.proposalsByListingId).toBeInstanceOf(Map);
      expect(initialState.proposalsByListingId.size).toBe(0);
      expect(initialState.isLoading).toBe(true);
      expect(initialState.error).toBeNull();
      expect(initialState.isLoggedIn).toBe(false);
      expect(initialState.viewMode).toBe('grid');
      expect(initialState.reservationSpan).toBe(13);
      expect(initialState.toast).toEqual({ show: false, message: '', type: 'success' });
    });
  });

  // ========================================
  // LOADING
  // ========================================
  describe('Loading actions', () => {
    it('INIT_START sets isLoading and clears error', () => {
      const state = { ...initialState, isLoading: false, error: 'old error' };
      const next = favoriteListingsReducer(state, { type: 'INIT_START' });
      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('INIT_ERROR sets error and clears isLoading', () => {
      const state = { ...initialState, isLoading: true };
      const next = favoriteListingsReducer(state, { type: 'INIT_ERROR', payload: 'Network error' });
      expect(next.error).toBe('Network error');
      expect(next.isLoading).toBe(false);
    });

    it('INIT_COMPLETE clears isLoading', () => {
      const state = { ...initialState, isLoading: true };
      const next = favoriteListingsReducer(state, { type: 'INIT_COMPLETE' });
      expect(next.isLoading).toBe(false);
    });
  });

  // ========================================
  // AUTH
  // ========================================
  describe('Auth actions', () => {
    it('SET_AUTH sets isLoggedIn, userId, and currentUser', () => {
      const user = { id: 'u1', name: 'Test' };
      const next = favoriteListingsReducer(initialState, {
        type: 'SET_AUTH',
        payload: { userId: 'u1', currentUser: user },
      });
      expect(next.isLoggedIn).toBe(true);
      expect(next.userId).toBe('u1');
      expect(next.currentUser).toBe(user);
    });

    it('SET_CURRENT_USER updates currentUser only', () => {
      const state = { ...initialState, isLoggedIn: true, userId: 'u1', currentUser: { id: 'u1' } };
      const newUser = { id: 'u1', name: 'Updated' };
      const next = favoriteListingsReducer(state, { type: 'SET_CURRENT_USER', payload: newUser });
      expect(next.currentUser).toBe(newUser);
      expect(next.isLoggedIn).toBe(true);
    });

    it('CLEAR_AUTH clears login state', () => {
      const state = { ...initialState, isLoggedIn: true, currentUser: { id: 'u1' } };
      const next = favoriteListingsReducer(state, { type: 'CLEAR_AUTH' });
      expect(next.isLoggedIn).toBe(false);
      expect(next.currentUser).toBeNull();
    });
  });

  // ========================================
  // DATA LOADING
  // ========================================
  describe('Data loading actions', () => {
    it('SET_USER_DATA sets loggedInUserData', () => {
      const userData = { aboutMe: 'Hi', proposalCount: 3 };
      const next = favoriteListingsReducer(initialState, { type: 'SET_USER_DATA', payload: userData });
      expect(next.loggedInUserData).toBe(userData);
    });

    it('SET_LAST_PROPOSAL_DEFAULTS sets lastProposalDefaults', () => {
      const defaults = { moveInDate: '2026-03-01', reservationSpanWeeks: 20 };
      const next = favoriteListingsReducer(initialState, { type: 'SET_LAST_PROPOSAL_DEFAULTS', payload: defaults });
      expect(next.lastProposalDefaults).toBe(defaults);
    });

    it('SET_FAVORITED_IDS sets favoritedListingIds', () => {
      const ids = new Set(['a', 'b', 'c']);
      const next = favoriteListingsReducer(initialState, { type: 'SET_FAVORITED_IDS', payload: ids });
      expect(next.favoritedListingIds).toBe(ids);
      expect(next.favoritedListingIds.size).toBe(3);
    });

    it('SET_LISTINGS sets listings', () => {
      const listings = [{ id: 'l1' }, { id: 'l2' }];
      const next = favoriteListingsReducer(initialState, { type: 'SET_LISTINGS', payload: listings });
      expect(next.listings).toBe(listings);
      expect(next.listings.length).toBe(2);
    });

    it('SET_PROPOSALS_MAP sets proposalsByListingId', () => {
      const map = new Map([['l1', { id: 'p1' }]]);
      const next = favoriteListingsReducer(initialState, { type: 'SET_PROPOSALS_MAP', payload: map });
      expect(next.proposalsByListingId).toBe(map);
      expect(next.proposalsByListingId.get('l1')).toEqual({ id: 'p1' });
    });

    it('SET_ZAT_CONFIG sets zatConfig', () => {
      const config = { fee: 10 };
      const next = favoriteListingsReducer(initialState, { type: 'SET_ZAT_CONFIG', payload: config });
      expect(next.zatConfig).toBe(config);
    });

    it('SET_INFORMATIONAL_TEXTS sets informationalTexts', () => {
      const texts = { 'Price Starts': { desktop: 'info' } };
      const next = favoriteListingsReducer(initialState, { type: 'SET_INFORMATIONAL_TEXTS', payload: texts });
      expect(next.informationalTexts).toBe(texts);
    });
  });

  // ========================================
  // OPTIMISTIC UNFAVORITE
  // ========================================
  describe('Optimistic unfavorite', () => {
    const stateWithListings = {
      ...initialState,
      listings: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }],
      favoritedListingIds: new Set(['l1', 'l2', 'l3']),
    };

    it('REMOVE_LISTING removes listing and favorited ID', () => {
      const next = favoriteListingsReducer(stateWithListings, { type: 'REMOVE_LISTING', payload: 'l2' });
      expect(next.listings).toEqual([{ id: 'l1' }, { id: 'l3' }]);
      expect(next.favoritedListingIds.has('l2')).toBe(false);
      expect(next.favoritedListingIds.has('l1')).toBe(true);
      expect(next.favoritedListingIds.has('l3')).toBe(true);
    });

    it('REMOVE_LISTING is a no-op for nonexistent listing', () => {
      const next = favoriteListingsReducer(stateWithListings, { type: 'REMOVE_LISTING', payload: 'l99' });
      expect(next.listings.length).toBe(3);
      expect(next.favoritedListingIds.size).toBe(3);
    });

    it('ROLLBACK_LISTING restores removed listing at original index', () => {
      const afterRemove = favoriteListingsReducer(stateWithListings, { type: 'REMOVE_LISTING', payload: 'l2' });
      const next = favoriteListingsReducer(afterRemove, {
        type: 'ROLLBACK_LISTING',
        payload: { listing: { id: 'l2' }, index: 1, listingId: 'l2' },
      });
      expect(next.listings).toEqual([{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }]);
      expect(next.favoritedListingIds.has('l2')).toBe(true);
    });

    it('ROLLBACK_LISTING does not duplicate if listing already exists', () => {
      const next = favoriteListingsReducer(stateWithListings, {
        type: 'ROLLBACK_LISTING',
        payload: { listing: { id: 'l2' }, index: 1, listingId: 'l2' },
      });
      expect(next.listings.length).toBe(3);
    });

    it('ROLLBACK_LISTING inserts at index 0 when index is out of bounds', () => {
      const state = { ...initialState, listings: [{ id: 'l1' }], favoritedListingIds: new Set(['l1']) };
      const next = favoriteListingsReducer(state, {
        type: 'ROLLBACK_LISTING',
        payload: { listing: { id: 'l2' }, index: -1, listingId: 'l2' },
      });
      expect(next.listings[0].id).toBe('l2');
      expect(next.favoritedListingIds.has('l2')).toBe(true);
    });
  });

  // ========================================
  // PROPOSAL MAP UPDATE
  // ========================================
  describe('UPDATE_PROPOSAL', () => {
    it('adds a proposal entry to the map', () => {
      const state = { ...initialState, proposalsByListingId: new Map() };
      const next = favoriteListingsReducer(state, {
        type: 'UPDATE_PROPOSAL',
        payload: { listingId: 'l1', proposal: { id: 'p1' } },
      });
      expect(next.proposalsByListingId.get('l1')).toEqual({ id: 'p1' });
    });

    it('replaces existing proposal for same listing', () => {
      const state = {
        ...initialState,
        proposalsByListingId: new Map([['l1', { id: 'p-old' }]]),
      };
      const next = favoriteListingsReducer(state, {
        type: 'UPDATE_PROPOSAL',
        payload: { listingId: 'l1', proposal: { id: 'p-new' } },
      });
      expect(next.proposalsByListingId.get('l1')).toEqual({ id: 'p-new' });
    });

    it('does not mutate original map', () => {
      const originalMap = new Map([['l1', { id: 'p1' }]]);
      const state = { ...initialState, proposalsByListingId: originalMap };
      favoriteListingsReducer(state, {
        type: 'UPDATE_PROPOSAL',
        payload: { listingId: 'l2', proposal: { id: 'p2' } },
      });
      expect(originalMap.size).toBe(1);
    });
  });

  // ========================================
  // PROPOSAL FLOW
  // ========================================
  describe('Proposal flow actions', () => {
    it('PREPARE_PROPOSAL sets schedule state and clears priceBreakdown', () => {
      const state = { ...initialState, priceBreakdown: { total: 100 } };
      const next = favoriteListingsReducer(state, {
        type: 'PREPARE_PROPOSAL',
        payload: { selectedDayObjects: [{ dayOfWeek: 1 }], moveInDate: '2026-04-01', reservationSpan: 20 },
      });
      expect(next.selectedDayObjects).toEqual([{ dayOfWeek: 1 }]);
      expect(next.moveInDate).toBe('2026-04-01');
      expect(next.reservationSpan).toBe(20);
      expect(next.priceBreakdown).toBeNull();
    });

    it('SET_PRICE_BREAKDOWN sets priceBreakdown', () => {
      const breakdown = { total: 500, nightly: 50 };
      const next = favoriteListingsReducer(initialState, { type: 'SET_PRICE_BREAKDOWN', payload: breakdown });
      expect(next.priceBreakdown).toBe(breakdown);
    });

    it('SET_PENDING_PROPOSAL sets pendingProposalData', () => {
      const data = { moveInDate: '2026-04-01' };
      const next = favoriteListingsReducer(initialState, { type: 'SET_PENDING_PROPOSAL', payload: data });
      expect(next.pendingProposalData).toBe(data);
    });

    it('SET_PENDING_PROPOSAL can set to null', () => {
      const state = { ...initialState, pendingProposalData: { data: true } };
      const next = favoriteListingsReducer(state, { type: 'SET_PENDING_PROPOSAL', payload: null });
      expect(next.pendingProposalData).toBeNull();
    });

    it('START_PROPOSAL_SUBMIT sets isSubmittingProposal to true', () => {
      const next = favoriteListingsReducer(initialState, { type: 'START_PROPOSAL_SUBMIT' });
      expect(next.isSubmittingProposal).toBe(true);
    });

    it('END_PROPOSAL_SUBMIT sets isSubmittingProposal to false', () => {
      const state = { ...initialState, isSubmittingProposal: true };
      const next = favoriteListingsReducer(state, { type: 'END_PROPOSAL_SUBMIT' });
      expect(next.isSubmittingProposal).toBe(false);
    });
  });

  // ========================================
  // UI
  // ========================================
  describe('UI actions', () => {
    it('SET_VIEW_MODE sets viewMode', () => {
      const next = favoriteListingsReducer(initialState, { type: 'SET_VIEW_MODE', payload: 'list' });
      expect(next.viewMode).toBe('list');
    });

    it('SET_MOBILE_MAP_VISIBLE sets mobileMapVisible', () => {
      const next = favoriteListingsReducer(initialState, { type: 'SET_MOBILE_MAP_VISIBLE', payload: true });
      expect(next.mobileMapVisible).toBe(true);
    });

    it('SET_MENU_OPEN sets menuOpen', () => {
      const next = favoriteListingsReducer(initialState, { type: 'SET_MENU_OPEN', payload: true });
      expect(next.menuOpen).toBe(true);
    });

    it('SHOW_TOAST sets toast visible with message and type', () => {
      const next = favoriteListingsReducer(initialState, {
        type: 'SHOW_TOAST',
        payload: { message: 'Saved!', type: 'success' },
      });
      expect(next.toast).toEqual({ show: true, message: 'Saved!', type: 'success' });
    });

    it('HIDE_TOAST resets toast to default', () => {
      const state = { ...initialState, toast: { show: true, message: 'Hello', type: 'info' } };
      const next = favoriteListingsReducer(state, { type: 'HIDE_TOAST' });
      expect(next.toast).toEqual({ show: false, message: '', type: 'success' });
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = favoriteListingsReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
