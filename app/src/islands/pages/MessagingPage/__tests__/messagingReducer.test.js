import { describe, it, expect } from 'vitest';
import { messagingReducer, initialState } from '../messagingReducer.js';

describe('messagingReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.authState).toEqual({ isChecking: true, shouldRedirect: false });
      expect(initialState.user).toBeNull();
      expect(initialState.threads).toEqual([]);
      expect(initialState.selectedThread).toBeNull();
      expect(initialState.messages).toEqual([]);
      expect(initialState.threadInfo).toBeNull();
      expect(initialState.isLoading).toBe(true);
      expect(initialState.isLoadingMessages).toBe(false);
      expect(initialState.error).toBeNull();
      expect(initialState.messageInput).toBe('');
      expect(initialState.isSending).toBe(false);
      expect(initialState.proposalData).toBeNull();
      expect(initialState.listingData).toBeNull();
      expect(initialState.isLoadingPanelData).toBe(false);
      expect(initialState.isOtherUserTyping).toBe(false);
      expect(initialState.typingUserName).toBeNull();
      expect(initialState.proposalModalData).toBeNull();
      expect(initialState.zatConfig).toBeNull();
      expect(initialState.isSubmittingProposal).toBe(false);
    });
  });

  // ========================================
  // AUTH
  // ========================================
  describe('Auth actions', () => {
    it('SET_AUTH_STATE sets authState', () => {
      const next = messagingReducer(initialState, {
        type: 'SET_AUTH_STATE',
        payload: { isChecking: false, shouldRedirect: false },
      });
      expect(next.authState).toEqual({ isChecking: false, shouldRedirect: false });
    });

    it('SET_USER sets user', () => {
      const user = { id: 'u1', firstName: 'Test' };
      const next = messagingReducer(initialState, { type: 'SET_USER', payload: user });
      expect(next.user).toBe(user);
    });
  });

  // ========================================
  // THREAD DATA
  // ========================================
  describe('Thread data actions', () => {
    it('SET_THREADS sets threads', () => {
      const threads = [{ id: 't1' }, { id: 't2' }];
      const next = messagingReducer(initialState, { type: 'SET_THREADS', payload: threads });
      expect(next.threads).toBe(threads);
      expect(next.threads.length).toBe(2);
    });

    it('SET_SELECTED_THREAD sets selectedThread', () => {
      const thread = { id: 't1' };
      const next = messagingReducer(initialState, { type: 'SET_SELECTED_THREAD', payload: thread });
      expect(next.selectedThread).toBe(thread);
    });

    it('SET_MESSAGES sets messages', () => {
      const msgs = [{ id: 'm1' }, { id: 'm2' }];
      const next = messagingReducer(initialState, { type: 'SET_MESSAGES', payload: msgs });
      expect(next.messages).toBe(msgs);
    });

    it('ADD_MESSAGE appends a new message', () => {
      const state = { ...initialState, messages: [{ id: 'm1' }] };
      const next = messagingReducer(state, { type: 'ADD_MESSAGE', payload: { id: 'm2' } });
      expect(next.messages).toEqual([{ id: 'm1' }, { id: 'm2' }]);
    });

    it('ADD_MESSAGE skips duplicate message', () => {
      const state = { ...initialState, messages: [{ id: 'm1' }] };
      const next = messagingReducer(state, { type: 'ADD_MESSAGE', payload: { id: 'm1' } });
      expect(next).toBe(state);
    });

    it('MARK_THREAD_READ sets unread_count to 0 for the target thread', () => {
      const state = {
        ...initialState,
        threads: [
          { id: 't1', unread_count: 3 },
          { id: 't2', unread_count: 5 },
        ],
      };
      const next = messagingReducer(state, { type: 'MARK_THREAD_READ', payload: 't1' });
      expect(next.threads[0].unread_count).toBe(0);
      expect(next.threads[1].unread_count).toBe(5);
    });

    it('MARK_THREAD_READ does not mutate threads for unknown id', () => {
      const state = {
        ...initialState,
        threads: [{ id: 't1', unread_count: 3 }],
      };
      const next = messagingReducer(state, { type: 'MARK_THREAD_READ', payload: 't99' });
      expect(next.threads[0].unread_count).toBe(3);
    });

    it('SET_THREAD_INFO sets threadInfo', () => {
      const info = { proposal_id: 'p1', listing_id: 'l1' };
      const next = messagingReducer(initialState, { type: 'SET_THREAD_INFO', payload: info });
      expect(next.threadInfo).toBe(info);
    });
  });

  // ========================================
  // UI
  // ========================================
  describe('UI actions', () => {
    it('SET_IS_LOADING sets isLoading', () => {
      const next = messagingReducer(initialState, { type: 'SET_IS_LOADING', payload: false });
      expect(next.isLoading).toBe(false);
    });

    it('SET_IS_LOADING_MESSAGES sets isLoadingMessages', () => {
      const next = messagingReducer(initialState, { type: 'SET_IS_LOADING_MESSAGES', payload: true });
      expect(next.isLoadingMessages).toBe(true);
    });

    it('SET_ERROR sets error', () => {
      const next = messagingReducer(initialState, { type: 'SET_ERROR', payload: 'Network error' });
      expect(next.error).toBe('Network error');
    });

    it('SET_ERROR can clear error with null', () => {
      const state = { ...initialState, error: 'old error' };
      const next = messagingReducer(state, { type: 'SET_ERROR', payload: null });
      expect(next.error).toBeNull();
    });

    it('SET_MESSAGE_INPUT sets messageInput', () => {
      const next = messagingReducer(initialState, { type: 'SET_MESSAGE_INPUT', payload: 'hello' });
      expect(next.messageInput).toBe('hello');
    });

    it('SET_IS_SENDING sets isSending', () => {
      const next = messagingReducer(initialState, { type: 'SET_IS_SENDING', payload: true });
      expect(next.isSending).toBe(true);
    });
  });

  // ========================================
  // RIGHT PANEL DATA
  // ========================================
  describe('Right panel data actions', () => {
    it('SET_PROPOSAL_DATA sets proposalData', () => {
      const data = { id: 'p1', status: 'pending' };
      const next = messagingReducer(initialState, { type: 'SET_PROPOSAL_DATA', payload: data });
      expect(next.proposalData).toBe(data);
    });

    it('SET_LISTING_DATA sets listingData', () => {
      const data = { id: 'l1', name: 'Test Listing' };
      const next = messagingReducer(initialState, { type: 'SET_LISTING_DATA', payload: data });
      expect(next.listingData).toBe(data);
    });

    it('SET_IS_LOADING_PANEL_DATA sets isLoadingPanelData', () => {
      const next = messagingReducer(initialState, { type: 'SET_IS_LOADING_PANEL_DATA', payload: true });
      expect(next.isLoadingPanelData).toBe(true);
    });
  });

  // ========================================
  // REALTIME
  // ========================================
  describe('Realtime actions', () => {
    it('SET_TYPING sets isOtherUserTyping and typingUserName', () => {
      const next = messagingReducer(initialState, {
        type: 'SET_TYPING',
        payload: { isOtherUserTyping: true, typingUserName: 'Alice' },
      });
      expect(next.isOtherUserTyping).toBe(true);
      expect(next.typingUserName).toBe('Alice');
    });

    it('SET_TYPING can clear typing state', () => {
      const state = { ...initialState, isOtherUserTyping: true, typingUserName: 'Alice' };
      const next = messagingReducer(state, {
        type: 'SET_TYPING',
        payload: { isOtherUserTyping: false, typingUserName: null },
      });
      expect(next.isOtherUserTyping).toBe(false);
      expect(next.typingUserName).toBeNull();
    });
  });

  // ========================================
  // PROPOSAL MODAL
  // ========================================
  describe('Proposal modal actions', () => {
    it('SET_PROPOSAL_MODAL_DATA sets proposalModalData', () => {
      const data = { listing: { id: 'l1' }, moveInDate: '2026-04-01' };
      const next = messagingReducer(initialState, { type: 'SET_PROPOSAL_MODAL_DATA', payload: data });
      expect(next.proposalModalData).toBe(data);
    });

    it('SET_PROPOSAL_MODAL_DATA can set to null', () => {
      const state = { ...initialState, proposalModalData: { listing: {} } };
      const next = messagingReducer(state, { type: 'SET_PROPOSAL_MODAL_DATA', payload: null });
      expect(next.proposalModalData).toBeNull();
    });

    it('SET_ZAT_CONFIG sets zatConfig', () => {
      const config = { fee: 10 };
      const next = messagingReducer(initialState, { type: 'SET_ZAT_CONFIG', payload: config });
      expect(next.zatConfig).toBe(config);
    });

    it('SET_IS_SUBMITTING_PROPOSAL sets isSubmittingProposal', () => {
      const next = messagingReducer(initialState, { type: 'SET_IS_SUBMITTING_PROPOSAL', payload: true });
      expect(next.isSubmittingProposal).toBe(true);
    });
  });

  // ========================================
  // COMPOUND ACTIONS
  // ========================================
  describe('Compound actions', () => {
    it('SELECT_THREAD resets thread-related state', () => {
      const state = {
        ...initialState,
        selectedThread: { id: 'old' },
        messages: [{ id: 'm1' }],
        threadInfo: { proposal_id: 'p1' },
        proposalData: { id: 'p1' },
        listingData: { id: 'l1' },
        isOtherUserTyping: true,
        typingUserName: 'Bob',
      };
      const newThread = { id: 'new' };
      const next = messagingReducer(state, { type: 'SELECT_THREAD', payload: newThread });
      expect(next.selectedThread).toBe(newThread);
      expect(next.messages).toEqual([]);
      expect(next.threadInfo).toBeNull();
      expect(next.proposalData).toBeNull();
      expect(next.listingData).toBeNull();
      expect(next.isOtherUserTyping).toBe(false);
      expect(next.typingUserName).toBeNull();
    });

    it('START_RETRY clears error and sets isLoading', () => {
      const state = { ...initialState, error: 'Network error', isLoading: false };
      const next = messagingReducer(state, { type: 'START_RETRY' });
      expect(next.error).toBeNull();
      expect(next.isLoading).toBe(true);
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = messagingReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
