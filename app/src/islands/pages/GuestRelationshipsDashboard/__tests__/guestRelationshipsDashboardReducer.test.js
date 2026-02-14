import { describe, it, expect } from 'vitest';
import {
  guestRelationshipsDashboardReducer,
  initialState,
} from '../guestRelationshipsDashboardReducer.js';

describe('guestRelationshipsDashboardReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.selectedGuest).toBeNull();
      expect(initialState.guestSearchResults).toEqual([]);
      expect(initialState.isSearchingGuests).toBe(false);
      expect(initialState.nameSearch).toBe('');
      expect(initialState.phoneSearch).toBe('');
      expect(initialState.emailSearch).toBe('');
      expect(initialState.showNameDropdown).toBe(false);
      expect(initialState.showPhoneDropdown).toBe(false);
      expect(initialState.showEmailDropdown).toBe(false);
      expect(initialState.createCustomerForm).toEqual({
        firstName: '',
        lastName: '',
        birthDate: '',
        email: '',
        phoneNumber: '',
        userType: 'guest',
      });
      expect(initialState.createCustomerErrors).toEqual({});
      expect(initialState.isCreatingCustomer).toBe(false);
      expect(initialState.messageType).toBe('custom');
      expect(initialState.emailSubject).toBe('');
      expect(initialState.emailBody).toBe('');
      expect(initialState.smsBody).toBe('');
      expect(initialState.messageHistory).toEqual([]);
      expect(initialState.isSendingMessage).toBe(false);
      expect(initialState.currentProposals).toEqual([]);
      expect(initialState.suggestedProposals).toEqual([]);
      expect(initialState.suggestedListings).toEqual([]);
      expect(initialState.allListings).toEqual([]);
      expect(initialState.isLoadingProposals).toBe(false);
      expect(initialState.selectedUsers).toEqual([]);
      expect(initialState.allGuests).toEqual([]);
      expect(initialState.allArticles).toEqual([]);
      expect(initialState.assignedArticles).toEqual([]);
      expect(initialState.selectedArticleToAdd).toBe('');
      expect(initialState.isLoadingArticles).toBe(false);
      expect(initialState.toast).toBeNull();
    });
  });

  // ========================================
  // GUEST SELECTION
  // ========================================
  describe('Guest Selection actions', () => {
    it('SET_SELECTED_GUEST sets selectedGuest', () => {
      const guest = { id: 'g1', firstName: 'Alice' };
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SELECTED_GUEST',
        payload: guest,
      });
      expect(next.selectedGuest).toBe(guest);
    });

    it('SET_SELECTED_GUEST can set to null', () => {
      const state = { ...initialState, selectedGuest: { id: 'g1' } };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'SET_SELECTED_GUEST',
        payload: null,
      });
      expect(next.selectedGuest).toBeNull();
    });

    it('SET_GUEST_SEARCH_RESULTS sets guestSearchResults', () => {
      const results = [{ id: 'g1' }, { id: 'g2' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_GUEST_SEARCH_RESULTS',
        payload: results,
      });
      expect(next.guestSearchResults).toBe(results);
    });

    it('SET_IS_SEARCHING_GUESTS sets isSearchingGuests', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_IS_SEARCHING_GUESTS',
        payload: true,
      });
      expect(next.isSearchingGuests).toBe(true);
    });

    it('GUEST_SELECT sets guest and clears search state', () => {
      const state = {
        ...initialState,
        nameSearch: 'Alice',
        phoneSearch: '555',
        emailSearch: 'alice@',
        showNameDropdown: true,
        showPhoneDropdown: true,
        showEmailDropdown: true,
        guestSearchResults: [{ id: 'g1' }],
      };
      const guest = { id: 'g1', firstName: 'Alice' };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'GUEST_SELECT',
        payload: guest,
      });
      expect(next.selectedGuest).toBe(guest);
      expect(next.nameSearch).toBe('');
      expect(next.phoneSearch).toBe('');
      expect(next.emailSearch).toBe('');
      expect(next.showNameDropdown).toBe(false);
      expect(next.showPhoneDropdown).toBe(false);
      expect(next.showEmailDropdown).toBe(false);
      expect(next.guestSearchResults).toEqual([]);
    });

    it('CLEAR_GUEST_DETAILS clears guest-specific data', () => {
      const state = {
        ...initialState,
        assignedArticles: [{ id: 'a1' }],
        currentProposals: [{ id: 'p1' }],
        suggestedProposals: [{ id: 'sp1' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'CLEAR_GUEST_DETAILS',
      });
      expect(next.assignedArticles).toEqual([]);
      expect(next.currentProposals).toEqual([]);
      expect(next.suggestedProposals).toEqual([]);
    });
  });

  // ========================================
  // SEARCH INPUTS
  // ========================================
  describe('Search Input actions', () => {
    it('SET_NAME_SEARCH sets nameSearch', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_NAME_SEARCH',
        payload: 'Bob',
      });
      expect(next.nameSearch).toBe('Bob');
    });

    it('SET_PHONE_SEARCH sets phoneSearch', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_PHONE_SEARCH',
        payload: '555-1234',
      });
      expect(next.phoneSearch).toBe('555-1234');
    });

    it('SET_EMAIL_SEARCH sets emailSearch', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_EMAIL_SEARCH',
        payload: 'bob@test.com',
      });
      expect(next.emailSearch).toBe('bob@test.com');
    });
  });

  // ========================================
  // DROPDOWN VISIBILITY
  // ========================================
  describe('Dropdown Visibility actions', () => {
    it('SET_SHOW_NAME_DROPDOWN sets showNameDropdown', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SHOW_NAME_DROPDOWN',
        payload: true,
      });
      expect(next.showNameDropdown).toBe(true);
    });

    it('SET_SHOW_PHONE_DROPDOWN sets showPhoneDropdown', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SHOW_PHONE_DROPDOWN',
        payload: true,
      });
      expect(next.showPhoneDropdown).toBe(true);
    });

    it('SET_SHOW_EMAIL_DROPDOWN sets showEmailDropdown', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SHOW_EMAIL_DROPDOWN',
        payload: true,
      });
      expect(next.showEmailDropdown).toBe(true);
    });
  });

  // ========================================
  // CREATE CUSTOMER FORM
  // ========================================
  describe('Create Customer Form actions', () => {
    it('UPDATE_CREATE_CUSTOMER_FIELD updates a single field', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'UPDATE_CREATE_CUSTOMER_FIELD',
        payload: { field: 'firstName', value: 'Charlie' },
      });
      expect(next.createCustomerForm.firstName).toBe('Charlie');
      expect(next.createCustomerForm.lastName).toBe('');
    });

    it('CLEAR_CREATE_CUSTOMER_FIELD_ERROR removes error for a field', () => {
      const state = {
        ...initialState,
        createCustomerErrors: { firstName: 'Required', email: 'Invalid' },
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'CLEAR_CREATE_CUSTOMER_FIELD_ERROR',
        payload: 'firstName',
      });
      expect(next.createCustomerErrors.firstName).toBeUndefined();
      expect(next.createCustomerErrors.email).toBe('Invalid');
    });

    it('SET_CREATE_CUSTOMER_ERRORS sets all errors', () => {
      const errors = { firstName: 'Required', email: 'Invalid' };
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_CREATE_CUSTOMER_ERRORS',
        payload: errors,
      });
      expect(next.createCustomerErrors).toBe(errors);
    });

    it('RESET_CREATE_CUSTOMER_FORM resets to defaults', () => {
      const state = {
        ...initialState,
        createCustomerForm: {
          firstName: 'Charlie',
          lastName: 'Brown',
          birthDate: '2000-01-01',
          email: 'charlie@test.com',
          phoneNumber: '555-1234',
          userType: 'host',
        },
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'RESET_CREATE_CUSTOMER_FORM',
      });
      expect(next.createCustomerForm).toEqual({
        firstName: '',
        lastName: '',
        birthDate: '',
        email: '',
        phoneNumber: '',
        userType: 'guest',
      });
    });

    it('SET_IS_CREATING_CUSTOMER sets isCreatingCustomer', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_IS_CREATING_CUSTOMER',
        payload: true,
      });
      expect(next.isCreatingCustomer).toBe(true);
    });
  });

  // ========================================
  // MESSAGING
  // ========================================
  describe('Messaging actions', () => {
    it('SET_MESSAGE_TYPE sets messageType', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_MESSAGE_TYPE',
        payload: 'welcome',
      });
      expect(next.messageType).toBe('welcome');
    });

    it('SET_EMAIL_SUBJECT sets emailSubject', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_EMAIL_SUBJECT',
        payload: 'Hello',
      });
      expect(next.emailSubject).toBe('Hello');
    });

    it('SET_EMAIL_BODY sets emailBody', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_EMAIL_BODY',
        payload: 'Dear Guest',
      });
      expect(next.emailBody).toBe('Dear Guest');
    });

    it('SET_SMS_BODY sets smsBody', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SMS_BODY',
        payload: 'Hi there',
      });
      expect(next.smsBody).toBe('Hi there');
    });

    it('PREPEND_MESSAGE adds message to the front of history', () => {
      const state = {
        ...initialState,
        messageHistory: [{ id: 'msg-1', messageBody: 'Old' }],
      };
      const newMsg = { id: 'msg-2', messageBody: 'New' };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'PREPEND_MESSAGE',
        payload: newMsg,
      });
      expect(next.messageHistory).toEqual([newMsg, { id: 'msg-1', messageBody: 'Old' }]);
      expect(next.messageHistory.length).toBe(2);
    });

    it('SET_IS_SENDING_MESSAGE sets isSendingMessage', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_IS_SENDING_MESSAGE',
        payload: true,
      });
      expect(next.isSendingMessage).toBe(true);
    });

    it('CLEAR_EMAIL_FORM clears emailSubject and emailBody', () => {
      const state = {
        ...initialState,
        emailSubject: 'Hello',
        emailBody: 'World',
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'CLEAR_EMAIL_FORM',
      });
      expect(next.emailSubject).toBe('');
      expect(next.emailBody).toBe('');
    });

    it('CLEAR_SMS_FORM clears smsBody', () => {
      const state = { ...initialState, smsBody: 'Hello' };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'CLEAR_SMS_FORM',
      });
      expect(next.smsBody).toBe('');
    });
  });

  // ========================================
  // PROPOSALS
  // ========================================
  describe('Proposal actions', () => {
    it('SET_CURRENT_PROPOSALS sets currentProposals', () => {
      const proposals = [{ id: 'p1' }, { id: 'p2' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_CURRENT_PROPOSALS',
        payload: proposals,
      });
      expect(next.currentProposals).toBe(proposals);
    });

    it('SET_SUGGESTED_PROPOSALS sets suggestedProposals', () => {
      const proposals = [{ id: 'sp1' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SUGGESTED_PROPOSALS',
        payload: proposals,
      });
      expect(next.suggestedProposals).toBe(proposals);
    });

    it('ADD_SUGGESTED_PROPOSAL appends a proposal', () => {
      const state = {
        ...initialState,
        suggestedProposals: [{ id: 'sp1' }],
      };
      const newProposal = { id: 'sp2' };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'ADD_SUGGESTED_PROPOSAL',
        payload: newProposal,
      });
      expect(next.suggestedProposals).toEqual([{ id: 'sp1' }, { id: 'sp2' }]);
    });

    it('REMOVE_PROPOSAL removes from both currentProposals and suggestedProposals', () => {
      const state = {
        ...initialState,
        currentProposals: [{ id: 'p1' }, { id: 'p2' }],
        suggestedProposals: [{ id: 'p1' }, { id: 'sp1' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'REMOVE_PROPOSAL',
        payload: 'p1',
      });
      expect(next.currentProposals).toEqual([{ id: 'p2' }]);
      expect(next.suggestedProposals).toEqual([{ id: 'sp1' }]);
    });

    it('REMOVE_PROPOSAL is a no-op for nonexistent id', () => {
      const state = {
        ...initialState,
        currentProposals: [{ id: 'p1' }],
        suggestedProposals: [{ id: 'sp1' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'REMOVE_PROPOSAL',
        payload: 'p99',
      });
      expect(next.currentProposals.length).toBe(1);
      expect(next.suggestedProposals.length).toBe(1);
    });

    it('SET_IS_LOADING_PROPOSALS sets isLoadingProposals', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_IS_LOADING_PROPOSALS',
        payload: true,
      });
      expect(next.isLoadingProposals).toBe(true);
    });
  });

  // ========================================
  // LISTINGS
  // ========================================
  describe('Listing actions', () => {
    it('SET_ALL_LISTINGS sets allListings', () => {
      const listings = [{ id: 'l1' }, { id: 'l2' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_ALL_LISTINGS',
        payload: listings,
      });
      expect(next.allListings).toBe(listings);
    });

    it('ADD_SUGGESTED_LISTING appends a listing', () => {
      const state = {
        ...initialState,
        suggestedListings: [{ id: 'l1' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'ADD_SUGGESTED_LISTING',
        payload: { id: 'l2' },
      });
      expect(next.suggestedListings).toEqual([{ id: 'l1' }, { id: 'l2' }]);
    });

    it('REMOVE_SUGGESTED_LISTING removes a listing by id', () => {
      const state = {
        ...initialState,
        suggestedListings: [{ id: 'l1' }, { id: 'l2' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'REMOVE_SUGGESTED_LISTING',
        payload: 'l1',
      });
      expect(next.suggestedListings).toEqual([{ id: 'l2' }]);
    });
  });

  // ========================================
  // MULTI-USER SELECTION
  // ========================================
  describe('Multi-user Selection actions', () => {
    it('SET_SELECTED_USERS sets selectedUsers', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SELECTED_USERS',
        payload: ['u1', 'u2'],
      });
      expect(next.selectedUsers).toEqual(['u1', 'u2']);
    });

    it('TOGGLE_USER_SELECTION adds user if not present', () => {
      const state = { ...initialState, selectedUsers: ['u1'] };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'TOGGLE_USER_SELECTION',
        payload: 'u2',
      });
      expect(next.selectedUsers).toEqual(['u1', 'u2']);
    });

    it('TOGGLE_USER_SELECTION removes user if already present', () => {
      const state = { ...initialState, selectedUsers: ['u1', 'u2'] };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'TOGGLE_USER_SELECTION',
        payload: 'u1',
      });
      expect(next.selectedUsers).toEqual(['u2']);
    });

    it('SET_ALL_GUESTS sets allGuests', () => {
      const guests = [{ id: 'g1' }, { id: 'g2' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_ALL_GUESTS',
        payload: guests,
      });
      expect(next.allGuests).toBe(guests);
    });

    it('PREPEND_GUEST adds guest to front of list', () => {
      const state = { ...initialState, allGuests: [{ id: 'g1' }] };
      const newGuest = { id: 'g2' };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'PREPEND_GUEST',
        payload: newGuest,
      });
      expect(next.allGuests).toEqual([{ id: 'g2' }, { id: 'g1' }]);
    });
  });

  // ========================================
  // KNOWLEDGE BASE
  // ========================================
  describe('Knowledge Base actions', () => {
    it('SET_ALL_ARTICLES sets allArticles', () => {
      const articles = [{ id: 'a1' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_ALL_ARTICLES',
        payload: articles,
      });
      expect(next.allArticles).toBe(articles);
    });

    it('SET_ASSIGNED_ARTICLES sets assignedArticles', () => {
      const articles = [{ id: 'a1' }];
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_ASSIGNED_ARTICLES',
        payload: articles,
      });
      expect(next.assignedArticles).toBe(articles);
    });

    it('ADD_ASSIGNED_ARTICLE appends an article', () => {
      const state = { ...initialState, assignedArticles: [{ id: 'a1' }] };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'ADD_ASSIGNED_ARTICLE',
        payload: { id: 'a2', assignedAt: '2026-02-14' },
      });
      expect(next.assignedArticles).toEqual([
        { id: 'a1' },
        { id: 'a2', assignedAt: '2026-02-14' },
      ]);
    });

    it('REMOVE_ASSIGNED_ARTICLE removes article by id', () => {
      const state = {
        ...initialState,
        assignedArticles: [{ id: 'a1' }, { id: 'a2' }],
      };
      const next = guestRelationshipsDashboardReducer(state, {
        type: 'REMOVE_ASSIGNED_ARTICLE',
        payload: 'a1',
      });
      expect(next.assignedArticles).toEqual([{ id: 'a2' }]);
    });

    it('SET_SELECTED_ARTICLE_TO_ADD sets selectedArticleToAdd', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_SELECTED_ARTICLE_TO_ADD',
        payload: 'a3',
      });
      expect(next.selectedArticleToAdd).toBe('a3');
    });

    it('SET_IS_LOADING_ARTICLES sets isLoadingArticles', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SET_IS_LOADING_ARTICLES',
        payload: true,
      });
      expect(next.isLoadingArticles).toBe(true);
    });
  });

  // ========================================
  // UI
  // ========================================
  describe('UI actions', () => {
    it('SHOW_TOAST sets toast with message and type', () => {
      const next = guestRelationshipsDashboardReducer(initialState, {
        type: 'SHOW_TOAST',
        payload: { message: 'Saved!', type: 'success' },
      });
      expect(next.toast).toEqual({ message: 'Saved!', type: 'success' });
    });

    it('HIDE_TOAST resets toast to null', () => {
      const state = {
        ...initialState,
        toast: { message: 'Hello', type: 'info' },
      };
      const next = guestRelationshipsDashboardReducer(state, { type: 'HIDE_TOAST' });
      expect(next.toast).toBeNull();
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = guestRelationshipsDashboardReducer(initialState, {
        type: 'UNKNOWN_ACTION',
      });
      expect(result).toBe(initialState);
    });
  });
});
