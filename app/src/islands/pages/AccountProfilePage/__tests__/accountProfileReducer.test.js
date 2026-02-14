import { describe, it, expect } from 'vitest';
import { accountProfileReducer, initialState } from '../accountProfileReducer.js';

describe('accountProfileReducer', () => {
  // ========================================
  // INITIAL STATE
  // ========================================
  describe('initialState', () => {
    it('has correct default values', () => {
      expect(initialState.loading).toBe(true);
      expect(initialState.saving).toBe(false);
      expect(initialState.error).toBeNull();
      expect(initialState.loggedInUserId).toBeNull();
      expect(initialState.profileUserId).toBeNull();
      expect(initialState.isAuthenticated).toBe(false);
      expect(initialState.profileData).toBeNull();
      expect(initialState.formData).toEqual({
        firstName: '',
        lastName: '',
        jobTitle: '',
        dateOfBirth: '',
        bio: '',
        needForSpace: '',
        specialNeeds: '',
        selectedDays: [],
        transportationTypes: [],
        goodGuestReasons: [],
        storageItems: [],
      });
      expect(initialState.formErrors).toEqual({});
      expect(initialState.isDirty).toBe(false);
      expect(initialState.goodGuestReasonsList).toEqual([]);
      expect(initialState.storageItemsList).toEqual([]);
      expect(initialState.transportationOptions).toHaveLength(4);
      expect(initialState.hostListings).toEqual([]);
      expect(initialState.loadingListings).toBe(false);
      expect(initialState.rentalApplicationStatus).toBe('not_started');
      expect(initialState.rentalApplicationProgress).toBe(0);
      expect(initialState.previewMode).toBe(false);
      expect(initialState.isVerifyingEmail).toBe(false);
      expect(initialState.verificationEmailSent).toBe(false);
    });
  });

  // ========================================
  // CORE LOADING
  // ========================================
  describe('Core loading actions', () => {
    it('SET_LOADING sets loading flag', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_LOADING', payload: false });
      expect(next.loading).toBe(false);
    });

    it('SET_SAVING sets saving flag', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_SAVING', payload: true });
      expect(next.saving).toBe(true);
    });

    it('SET_ERROR sets error message', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_ERROR', payload: 'Network error' });
      expect(next.error).toBe('Network error');
    });

    it('SET_ERROR can clear error with null', () => {
      const state = { ...initialState, error: 'old error' };
      const next = accountProfileReducer(state, { type: 'SET_ERROR', payload: null });
      expect(next.error).toBeNull();
    });
  });

  // ========================================
  // USER IDENTITY
  // ========================================
  describe('User identity actions', () => {
    it('SET_LOGGED_IN_USER_ID sets loggedInUserId', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_LOGGED_IN_USER_ID', payload: 'user-123' });
      expect(next.loggedInUserId).toBe('user-123');
    });

    it('SET_PROFILE_USER_ID sets profileUserId', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_PROFILE_USER_ID', payload: 'profile-456' });
      expect(next.profileUserId).toBe('profile-456');
    });

    it('SET_IS_AUTHENTICATED sets isAuthenticated', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_IS_AUTHENTICATED', payload: true });
      expect(next.isAuthenticated).toBe(true);
    });
  });

  // ========================================
  // PROFILE DATA
  // ========================================
  describe('Profile data actions', () => {
    it('SET_PROFILE_DATA sets profileData', () => {
      const data = { first_name: 'John', last_name: 'Doe' };
      const next = accountProfileReducer(initialState, { type: 'SET_PROFILE_DATA', payload: data });
      expect(next.profileData).toBe(data);
    });

    it('SET_PROFILE_DATA can set to null', () => {
      const state = { ...initialState, profileData: { first_name: 'John' } };
      const next = accountProfileReducer(state, { type: 'SET_PROFILE_DATA', payload: null });
      expect(next.profileData).toBeNull();
    });

    it('MERGE_PROFILE_DATA merges into existing profileData', () => {
      const state = { ...initialState, profileData: { first_name: 'John', email: 'john@test.com' } };
      const next = accountProfileReducer(state, {
        type: 'MERGE_PROFILE_DATA',
        payload: { profile_photo_url: 'https://example.com/photo.jpg' },
      });
      expect(next.profileData).toEqual({
        first_name: 'John',
        email: 'john@test.com',
        profile_photo_url: 'https://example.com/photo.jpg',
      });
    });
  });

  // ========================================
  // FORM STATE
  // ========================================
  describe('Form state actions', () => {
    it('SET_FORM_DATA replaces entire formData', () => {
      const newFormData = { firstName: 'Jane', lastName: 'Smith', jobTitle: 'Engineer', dateOfBirth: '', bio: '', needForSpace: '', specialNeeds: '', selectedDays: [], transportationTypes: [], goodGuestReasons: [], storageItems: [] };
      const next = accountProfileReducer(initialState, { type: 'SET_FORM_DATA', payload: newFormData });
      expect(next.formData).toBe(newFormData);
      expect(next.formData.firstName).toBe('Jane');
    });

    it('UPDATE_FORM_FIELD updates a single form field', () => {
      const next = accountProfileReducer(initialState, {
        type: 'UPDATE_FORM_FIELD',
        payload: { field: 'firstName', value: 'Alice' },
      });
      expect(next.formData.firstName).toBe('Alice');
      expect(next.formData.lastName).toBe(''); // unchanged
    });

    it('SET_FORM_ERRORS sets formErrors', () => {
      const errors = { firstName: 'First name is required' };
      const next = accountProfileReducer(initialState, { type: 'SET_FORM_ERRORS', payload: errors });
      expect(next.formErrors).toEqual({ firstName: 'First name is required' });
    });

    it('CLEAR_FORM_ERROR removes a specific error', () => {
      const state = { ...initialState, formErrors: { firstName: 'Required', lastName: 'Required' } };
      const next = accountProfileReducer(state, { type: 'CLEAR_FORM_ERROR', payload: 'firstName' });
      expect(next.formErrors).toEqual({ lastName: 'Required' });
      expect(next.formErrors.firstName).toBeUndefined();
    });

    it('CLEAR_FORM_ERROR is safe when field does not exist', () => {
      const state = { ...initialState, formErrors: { firstName: 'Required' } };
      const next = accountProfileReducer(state, { type: 'CLEAR_FORM_ERROR', payload: 'nonExistent' });
      expect(next.formErrors).toEqual({ firstName: 'Required' });
    });

    it('SET_IS_DIRTY sets isDirty flag', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_IS_DIRTY', payload: true });
      expect(next.isDirty).toBe(true);
    });
  });

  // ========================================
  // REFERENCE DATA
  // ========================================
  describe('Reference data actions', () => {
    it('SET_GOOD_GUEST_REASONS_LIST sets goodGuestReasonsList', () => {
      const reasons = [{ id: 'r1', name: 'Friendly' }];
      const next = accountProfileReducer(initialState, { type: 'SET_GOOD_GUEST_REASONS_LIST', payload: reasons });
      expect(next.goodGuestReasonsList).toBe(reasons);
    });

    it('SET_STORAGE_ITEMS_LIST sets storageItemsList', () => {
      const items = [{ id: 's1', name: 'Books' }];
      const next = accountProfileReducer(initialState, { type: 'SET_STORAGE_ITEMS_LIST', payload: items });
      expect(next.storageItemsList).toBe(items);
    });
  });

  // ========================================
  // HOST LISTINGS
  // ========================================
  describe('Host listings actions', () => {
    it('SET_HOST_LISTINGS sets hostListings', () => {
      const listings = [{ id: 'l1', listing_title: 'My Place' }];
      const next = accountProfileReducer(initialState, { type: 'SET_HOST_LISTINGS', payload: listings });
      expect(next.hostListings).toBe(listings);
    });

    it('SET_LOADING_LISTINGS sets loadingListings', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_LOADING_LISTINGS', payload: true });
      expect(next.loadingListings).toBe(true);
    });
  });

  // ========================================
  // RENTAL APPLICATION
  // ========================================
  describe('Rental application actions', () => {
    it('SET_RENTAL_APPLICATION_STATUS sets rentalApplicationStatus', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_RENTAL_APPLICATION_STATUS', payload: 'submitted' });
      expect(next.rentalApplicationStatus).toBe('submitted');
    });

    it('SET_RENTAL_APPLICATION_PROGRESS sets rentalApplicationProgress', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_RENTAL_APPLICATION_PROGRESS', payload: 75 });
      expect(next.rentalApplicationProgress).toBe(75);
    });

    it('SET_RENTAL_APPLICATION sets both status and progress', () => {
      const next = accountProfileReducer(initialState, {
        type: 'SET_RENTAL_APPLICATION',
        payload: { status: 'in_progress', progress: 50 },
      });
      expect(next.rentalApplicationStatus).toBe('in_progress');
      expect(next.rentalApplicationProgress).toBe(50);
    });
  });

  // ========================================
  // PREVIEW MODE
  // ========================================
  describe('Preview mode actions', () => {
    it('TOGGLE_PREVIEW_MODE toggles from false to true', () => {
      const next = accountProfileReducer(initialState, { type: 'TOGGLE_PREVIEW_MODE' });
      expect(next.previewMode).toBe(true);
    });

    it('TOGGLE_PREVIEW_MODE toggles from true to false', () => {
      const state = { ...initialState, previewMode: true };
      const next = accountProfileReducer(state, { type: 'TOGGLE_PREVIEW_MODE' });
      expect(next.previewMode).toBe(false);
    });
  });

  // ========================================
  // EMAIL VERIFICATION
  // ========================================
  describe('Email verification actions', () => {
    it('SET_IS_VERIFYING_EMAIL sets isVerifyingEmail', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_IS_VERIFYING_EMAIL', payload: true });
      expect(next.isVerifyingEmail).toBe(true);
    });

    it('SET_VERIFICATION_EMAIL_SENT sets verificationEmailSent', () => {
      const next = accountProfileReducer(initialState, { type: 'SET_VERIFICATION_EMAIL_SENT', payload: true });
      expect(next.verificationEmailSent).toBe(true);
    });
  });

  // ========================================
  // UNKNOWN ACTION
  // ========================================
  describe('Unknown action', () => {
    it('returns the same state reference', () => {
      const result = accountProfileReducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(initialState);
    });
  });
});
