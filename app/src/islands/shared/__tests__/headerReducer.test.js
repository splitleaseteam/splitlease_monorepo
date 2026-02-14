import { describe, it, expect } from 'vitest';
import { headerReducer, initialState } from '../headerReducer.js';

describe('headerReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.mobileMenuActive).toBe(false);
      expect(initialState.activeDropdown).toBeNull();
      expect(initialState.headerVisible).toBe(true);
      expect(initialState.lastScrollY).toBe(0);
      expect(initialState.currentUser).toBeNull();
      expect(initialState.authChecked).toBe(false);
      expect(initialState.userType).toBeNull();
      expect(initialState.pendingProposalCount).toBe(0);
      expect(initialState.pendingProposals).toEqual([]);
      expect(initialState.currentProposalIndex).toBe(0);
      expect(initialState.isProcessingProposal).toBe(false);
    });
  });

  // ========================================
  // UI NAVIGATION
  // ========================================
  describe('UI Navigation actions', () => {
    it('TOGGLE_MOBILE_MENU toggles mobileMenuActive', () => {
      const next = headerReducer(initialState, { type: 'TOGGLE_MOBILE_MENU' });
      expect(next.mobileMenuActive).toBe(true);

      const next2 = headerReducer(next, { type: 'TOGGLE_MOBILE_MENU' });
      expect(next2.mobileMenuActive).toBe(false);
    });

    it('SET_MOBILE_MENU_ACTIVE sets mobileMenuActive to payload', () => {
      const next = headerReducer(initialState, { type: 'SET_MOBILE_MENU_ACTIVE', payload: true });
      expect(next.mobileMenuActive).toBe(true);

      const next2 = headerReducer(next, { type: 'SET_MOBILE_MENU_ACTIVE', payload: false });
      expect(next2.mobileMenuActive).toBe(false);
    });

    it('SET_ACTIVE_DROPDOWN sets activeDropdown to payload', () => {
      const next = headerReducer(initialState, { type: 'SET_ACTIVE_DROPDOWN', payload: 'host' });
      expect(next.activeDropdown).toBe('host');
    });

    it('SET_ACTIVE_DROPDOWN can set to null', () => {
      const state = { ...initialState, activeDropdown: 'host' };
      const next = headerReducer(state, { type: 'SET_ACTIVE_DROPDOWN', payload: null });
      expect(next.activeDropdown).toBeNull();
    });

    it('TOGGLE_DROPDOWN opens dropdown when closed', () => {
      const next = headerReducer(initialState, { type: 'TOGGLE_DROPDOWN', payload: 'stay' });
      expect(next.activeDropdown).toBe('stay');
    });

    it('TOGGLE_DROPDOWN closes dropdown when same name is active', () => {
      const state = { ...initialState, activeDropdown: 'stay' };
      const next = headerReducer(state, { type: 'TOGGLE_DROPDOWN', payload: 'stay' });
      expect(next.activeDropdown).toBeNull();
    });

    it('TOGGLE_DROPDOWN switches to different dropdown', () => {
      const state = { ...initialState, activeDropdown: 'host' };
      const next = headerReducer(state, { type: 'TOGGLE_DROPDOWN', payload: 'stay' });
      expect(next.activeDropdown).toBe('stay');
    });

    it('SET_HEADER_VISIBLE sets headerVisible', () => {
      const next = headerReducer(initialState, { type: 'SET_HEADER_VISIBLE', payload: false });
      expect(next.headerVisible).toBe(false);
    });

    it('SET_LAST_SCROLL_Y sets lastScrollY', () => {
      const next = headerReducer(initialState, { type: 'SET_LAST_SCROLL_Y', payload: 250 });
      expect(next.lastScrollY).toBe(250);
    });

    it('HANDLE_SCROLL hides header when scrolling down past 100px', () => {
      const state = { ...initialState, lastScrollY: 50 };
      const next = headerReducer(state, { type: 'HANDLE_SCROLL', payload: { scrollY: 200 } });
      expect(next.headerVisible).toBe(false);
      expect(next.lastScrollY).toBe(200);
    });

    it('HANDLE_SCROLL shows header when scrolling up', () => {
      const state = { ...initialState, lastScrollY: 300, headerVisible: false };
      const next = headerReducer(state, { type: 'HANDLE_SCROLL', payload: { scrollY: 150 } });
      expect(next.headerVisible).toBe(true);
      expect(next.lastScrollY).toBe(150);
    });

    it('HANDLE_SCROLL shows header when scrolling down but under 100px', () => {
      const state = { ...initialState, lastScrollY: 20 };
      const next = headerReducer(state, { type: 'HANDLE_SCROLL', payload: { scrollY: 80 } });
      expect(next.headerVisible).toBe(true);
      expect(next.lastScrollY).toBe(80);
    });

    it('CLOSE_MENUS closes both dropdown and mobile menu', () => {
      const state = { ...initialState, activeDropdown: 'host', mobileMenuActive: true };
      const next = headerReducer(state, { type: 'CLOSE_MENUS' });
      expect(next.activeDropdown).toBeNull();
      expect(next.mobileMenuActive).toBe(false);
    });
  });

  // ========================================
  // AUTH
  // ========================================
  describe('Auth actions', () => {
    it('SET_CURRENT_USER sets currentUser', () => {
      const user = { userId: 'u1', firstName: 'Test' };
      const next = headerReducer(initialState, { type: 'SET_CURRENT_USER', payload: user });
      expect(next.currentUser).toBe(user);
    });

    it('SET_CURRENT_USER can set to null', () => {
      const state = { ...initialState, currentUser: { userId: 'u1' } };
      const next = headerReducer(state, { type: 'SET_CURRENT_USER', payload: null });
      expect(next.currentUser).toBeNull();
    });

    it('SET_AUTH_CHECKED sets authChecked', () => {
      const next = headerReducer(initialState, { type: 'SET_AUTH_CHECKED', payload: true });
      expect(next.authChecked).toBe(true);
    });

    it('SET_USER_TYPE sets userType', () => {
      const next = headerReducer(initialState, { type: 'SET_USER_TYPE', payload: 'A Host (I have a space available to rent)' });
      expect(next.userType).toBe('A Host (I have a space available to rent)');
    });

    it('SET_AUTH_STATE sets multiple auth fields at once', () => {
      const user = { userId: 'u1', firstName: 'Jane' };
      const next = headerReducer(initialState, {
        type: 'SET_AUTH_STATE',
        payload: { currentUser: user, userType: 'Guest', authChecked: true },
      });
      expect(next.currentUser).toBe(user);
      expect(next.userType).toBe('Guest');
      expect(next.authChecked).toBe(true);
    });

    it('CLEAR_AUTH clears currentUser and sets authChecked to true', () => {
      const state = { ...initialState, currentUser: { userId: 'u1' }, authChecked: false };
      const next = headerReducer(state, { type: 'CLEAR_AUTH' });
      expect(next.currentUser).toBeNull();
      expect(next.authChecked).toBe(true);
    });
  });

  // ========================================
  // SUGGESTED PROPOSALS
  // ========================================
  describe('Suggested Proposals actions', () => {
    it('SET_PENDING_PROPOSAL_COUNT sets pendingProposalCount', () => {
      const next = headerReducer(initialState, { type: 'SET_PENDING_PROPOSAL_COUNT', payload: 5 });
      expect(next.pendingProposalCount).toBe(5);
    });

    it('SET_PENDING_PROPOSALS sets pendingProposals', () => {
      const proposals = [{ id: 'p1' }, { id: 'p2' }];
      const next = headerReducer(initialState, { type: 'SET_PENDING_PROPOSALS', payload: proposals });
      expect(next.pendingProposals).toBe(proposals);
      expect(next.pendingProposals.length).toBe(2);
    });

    it('SET_CURRENT_PROPOSAL_INDEX sets currentProposalIndex', () => {
      const next = headerReducer(initialState, { type: 'SET_CURRENT_PROPOSAL_INDEX', payload: 3 });
      expect(next.currentProposalIndex).toBe(3);
    });

    it('SET_IS_PROCESSING_PROPOSAL sets isProcessingProposal', () => {
      const next = headerReducer(initialState, { type: 'SET_IS_PROCESSING_PROPOSAL', payload: true });
      expect(next.isProcessingProposal).toBe(true);
    });

    it('REMOVE_PROPOSAL removes proposal at index and decrements count', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        pendingProposalCount: 3,
        currentProposalIndex: 1,
      };
      const next = headerReducer(state, { type: 'REMOVE_PROPOSAL', payload: 1 });
      expect(next.pendingProposals).toEqual([{ id: 'p1' }, { id: 'p3' }]);
      expect(next.pendingProposalCount).toBe(2);
      expect(next.currentProposalIndex).toBe(1);
    });

    it('REMOVE_PROPOSAL adjusts index when it would be out of bounds', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }],
        pendingProposalCount: 2,
        currentProposalIndex: 1,
      };
      const next = headerReducer(state, { type: 'REMOVE_PROPOSAL', payload: 1 });
      expect(next.pendingProposals).toEqual([{ id: 'p1' }]);
      expect(next.pendingProposalCount).toBe(1);
      expect(next.currentProposalIndex).toBe(0);
    });

    it('REMOVE_PROPOSAL does not go below 0 for count', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }],
        pendingProposalCount: 0,
        currentProposalIndex: 0,
      };
      const next = headerReducer(state, { type: 'REMOVE_PROPOSAL', payload: 0 });
      expect(next.pendingProposalCount).toBe(0);
      expect(next.pendingProposals).toEqual([]);
      expect(next.currentProposalIndex).toBe(0);
    });

    it('NEXT_PROPOSAL increments currentProposalIndex when not at end', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        currentProposalIndex: 0,
      };
      const next = headerReducer(state, { type: 'NEXT_PROPOSAL' });
      expect(next.currentProposalIndex).toBe(1);
    });

    it('NEXT_PROPOSAL returns same state when at last proposal', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }],
        currentProposalIndex: 1,
      };
      const next = headerReducer(state, { type: 'NEXT_PROPOSAL' });
      expect(next).toBe(state);
    });

    it('PREVIOUS_PROPOSAL decrements currentProposalIndex when not at start', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
        currentProposalIndex: 2,
      };
      const next = headerReducer(state, { type: 'PREVIOUS_PROPOSAL' });
      expect(next.currentProposalIndex).toBe(1);
    });

    it('PREVIOUS_PROPOSAL returns same state when at first proposal', () => {
      const state = {
        ...initialState,
        pendingProposals: [{ id: 'p1' }, { id: 'p2' }],
        currentProposalIndex: 0,
      };
      const next = headerReducer(state, { type: 'PREVIOUS_PROPOSAL' });
      expect(next).toBe(state);
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = headerReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
