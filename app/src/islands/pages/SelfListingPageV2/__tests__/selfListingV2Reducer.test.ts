import { describe, it, expect } from 'vitest';
import {
  selfListingV2Reducer,
  initialState,
  type SelfListingV2State,
  type SelfListingV2Action,
} from '../selfListingV2Reducer';
import { DEFAULT_FORM_DATA } from '../types';

// =============================================================================
// HELPERS
// =============================================================================

function makeState(overrides: Partial<SelfListingV2State> = {}): SelfListingV2State {
  return { ...initialState, ...overrides };
}

// =============================================================================
// INITIAL STATE
// =============================================================================

describe('initialState', () => {
  it('has correct default values', () => {
    expect(initialState.currentStep).toBe(1);
    expect(initialState.formData).toEqual(DEFAULT_FORM_DATA);
    expect(initialState.isLoggedIn).toBe(false);
    expect(initialState.pendingSubmit).toBe(false);
    expect(initialState.headerKey).toBe(0);
    expect(initialState.isSubmitting).toBe(false);
    expect(initialState.submitSuccess).toBe(false);
    expect(initialState.createdListingId).toBeNull();
    expect(initialState.addressError).toBeNull();
    expect(initialState.isAddressValid).toBe(false);
    expect(initialState.continueOnPhoneLink).toBeNull();
    expect(initialState.phoneNumber).toBe('');
    expect(initialState.userPhoneNumber).toBeNull();
    expect(initialState.isSavingDraft).toBe(false);
    expect(initialState.draftListingId).toBeNull();
    expect(initialState.isEditMode).toBe(false);
    expect(initialState.editingListingId).toBeNull();
    expect(initialState.isMobile).toBe(false);
    expect(initialState.validationErrors).toEqual({});
    expect(initialState.activeInfoTooltip).toBeNull();
    expect(initialState.informationalTexts).toEqual({});
    expect(initialState.isCheckingAccess).toBe(true);
  });
});

// =============================================================================
// NAVIGATION
// =============================================================================

describe('SET_CURRENT_STEP', () => {
  it('updates currentStep', () => {
    const prev = makeState({ currentStep: 1 });
    const next = selfListingV2Reducer(prev, { type: 'SET_CURRENT_STEP', payload: 5 });
    expect(next.currentStep).toBe(5);
  });
});

// =============================================================================
// FORM
// =============================================================================

describe('SET_FORM_DATA', () => {
  it('replaces entire formData', () => {
    const newFormData = { ...DEFAULT_FORM_DATA, hostType: 'liveout' as const };
    const next = selfListingV2Reducer(initialState, { type: 'SET_FORM_DATA', payload: newFormData });
    expect(next.formData).toBe(newFormData);
    expect(next.formData.hostType).toBe('liveout');
  });
});

describe('UPDATE_FORM_DATA', () => {
  it('merges partial updates into formData', () => {
    const prev = makeState();
    const next = selfListingV2Reducer(prev, {
      type: 'UPDATE_FORM_DATA',
      payload: { hostType: 'agent', marketStrategy: 'public' },
    });
    expect(next.formData.hostType).toBe('agent');
    expect(next.formData.marketStrategy).toBe('public');
    // Other fields preserved
    expect(next.formData.leaseStyle).toBe(DEFAULT_FORM_DATA.leaseStyle);
  });

  it('does not mutate original formData', () => {
    const prev = makeState();
    const originalFormData = prev.formData;
    selfListingV2Reducer(prev, {
      type: 'UPDATE_FORM_DATA',
      payload: { hostType: 'coliving' },
    });
    expect(originalFormData.hostType).toBe('resident');
  });
});

// =============================================================================
// AUTH-RELATED
// =============================================================================

describe('SET_IS_LOGGED_IN', () => {
  it('sets isLoggedIn to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_IS_LOGGED_IN', payload: true });
    expect(next.isLoggedIn).toBe(true);
  });

  it('sets isLoggedIn to false', () => {
    const prev = makeState({ isLoggedIn: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_LOGGED_IN', payload: false });
    expect(next.isLoggedIn).toBe(false);
  });
});

describe('SET_PENDING_SUBMIT', () => {
  it('sets pendingSubmit to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_PENDING_SUBMIT', payload: true });
    expect(next.pendingSubmit).toBe(true);
  });

  it('sets pendingSubmit to false', () => {
    const prev = makeState({ pendingSubmit: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_PENDING_SUBMIT', payload: false });
    expect(next.pendingSubmit).toBe(false);
  });
});

describe('INCREMENT_HEADER_KEY', () => {
  it('increments headerKey by 1', () => {
    const prev = makeState({ headerKey: 3 });
    const next = selfListingV2Reducer(prev, { type: 'INCREMENT_HEADER_KEY' });
    expect(next.headerKey).toBe(4);
  });

  it('increments from 0', () => {
    const next = selfListingV2Reducer(initialState, { type: 'INCREMENT_HEADER_KEY' });
    expect(next.headerKey).toBe(1);
  });
});

// =============================================================================
// SUBMISSION
// =============================================================================

describe('SET_IS_SUBMITTING', () => {
  it('sets isSubmitting to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_IS_SUBMITTING', payload: true });
    expect(next.isSubmitting).toBe(true);
  });

  it('sets isSubmitting to false', () => {
    const prev = makeState({ isSubmitting: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_SUBMITTING', payload: false });
    expect(next.isSubmitting).toBe(false);
  });
});

describe('SET_SUBMIT_SUCCESS', () => {
  it('sets submitSuccess to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_SUBMIT_SUCCESS', payload: true });
    expect(next.submitSuccess).toBe(true);
  });
});

describe('SET_CREATED_LISTING_ID', () => {
  it('sets createdListingId to a string', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_CREATED_LISTING_ID',
      payload: 'lst-abc-123',
    });
    expect(next.createdListingId).toBe('lst-abc-123');
  });

  it('sets createdListingId to null', () => {
    const prev = makeState({ createdListingId: 'lst-abc-123' });
    const next = selfListingV2Reducer(prev, { type: 'SET_CREATED_LISTING_ID', payload: null });
    expect(next.createdListingId).toBeNull();
  });
});

// =============================================================================
// ADDRESS
// =============================================================================

describe('SET_ADDRESS_ERROR', () => {
  it('sets addressError to a message', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_ADDRESS_ERROR',
      payload: 'Address outside service area',
    });
    expect(next.addressError).toBe('Address outside service area');
  });

  it('clears addressError with null', () => {
    const prev = makeState({ addressError: 'some error' });
    const next = selfListingV2Reducer(prev, { type: 'SET_ADDRESS_ERROR', payload: null });
    expect(next.addressError).toBeNull();
  });
});

describe('SET_IS_ADDRESS_VALID', () => {
  it('sets isAddressValid to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_IS_ADDRESS_VALID', payload: true });
    expect(next.isAddressValid).toBe(true);
  });

  it('sets isAddressValid to false', () => {
    const prev = makeState({ isAddressValid: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_ADDRESS_VALID', payload: false });
    expect(next.isAddressValid).toBe(false);
  });
});

// =============================================================================
// CONTINUE ON PHONE
// =============================================================================

describe('SET_CONTINUE_ON_PHONE_LINK', () => {
  it('sets continueOnPhoneLink', () => {
    const link = 'https://example.com/self-listing-v2?draft=abc';
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_CONTINUE_ON_PHONE_LINK',
      payload: link,
    });
    expect(next.continueOnPhoneLink).toBe(link);
  });

  it('clears continueOnPhoneLink with null', () => {
    const prev = makeState({ continueOnPhoneLink: 'https://example.com' });
    const next = selfListingV2Reducer(prev, { type: 'SET_CONTINUE_ON_PHONE_LINK', payload: null });
    expect(next.continueOnPhoneLink).toBeNull();
  });
});

describe('SET_PHONE_NUMBER', () => {
  it('sets phoneNumber', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_PHONE_NUMBER',
      payload: '(555) 123-4567',
    });
    expect(next.phoneNumber).toBe('(555) 123-4567');
  });
});

describe('SET_USER_PHONE_NUMBER', () => {
  it('sets userPhoneNumber', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_USER_PHONE_NUMBER',
      payload: '5551234567',
    });
    expect(next.userPhoneNumber).toBe('5551234567');
  });

  it('clears userPhoneNumber with null', () => {
    const prev = makeState({ userPhoneNumber: '5551234567' });
    const next = selfListingV2Reducer(prev, { type: 'SET_USER_PHONE_NUMBER', payload: null });
    expect(next.userPhoneNumber).toBeNull();
  });
});

describe('SET_IS_SAVING_DRAFT', () => {
  it('sets isSavingDraft to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_IS_SAVING_DRAFT', payload: true });
    expect(next.isSavingDraft).toBe(true);
  });

  it('sets isSavingDraft to false', () => {
    const prev = makeState({ isSavingDraft: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_SAVING_DRAFT', payload: false });
    expect(next.isSavingDraft).toBe(false);
  });
});

describe('SET_DRAFT_LISTING_ID', () => {
  it('sets draftListingId', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_DRAFT_LISTING_ID',
      payload: 'draft-xyz',
    });
    expect(next.draftListingId).toBe('draft-xyz');
  });

  it('clears draftListingId with null', () => {
    const prev = makeState({ draftListingId: 'draft-xyz' });
    const next = selfListingV2Reducer(prev, { type: 'SET_DRAFT_LISTING_ID', payload: null });
    expect(next.draftListingId).toBeNull();
  });
});

// =============================================================================
// EDIT MODE
// =============================================================================

describe('SET_EDIT_MODE', () => {
  it('enables edit mode with listing ID', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_EDIT_MODE',
      payload: { isEditMode: true, editingListingId: 'lst-edit-1' },
    });
    expect(next.isEditMode).toBe(true);
    expect(next.editingListingId).toBe('lst-edit-1');
  });

  it('disables edit mode', () => {
    const prev = makeState({ isEditMode: true, editingListingId: 'lst-edit-1' });
    const next = selfListingV2Reducer(prev, {
      type: 'SET_EDIT_MODE',
      payload: { isEditMode: false, editingListingId: null },
    });
    expect(next.isEditMode).toBe(false);
    expect(next.editingListingId).toBeNull();
  });
});

// =============================================================================
// UI
// =============================================================================

describe('SET_IS_MOBILE', () => {
  it('sets isMobile to true', () => {
    const next = selfListingV2Reducer(initialState, { type: 'SET_IS_MOBILE', payload: true });
    expect(next.isMobile).toBe(true);
  });

  it('sets isMobile to false', () => {
    const prev = makeState({ isMobile: true });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_MOBILE', payload: false });
    expect(next.isMobile).toBe(false);
  });
});

describe('SET_VALIDATION_ERRORS', () => {
  it('sets validationErrors', () => {
    const errors = { nightSelector: true, address: true };
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_VALIDATION_ERRORS',
      payload: errors,
    });
    expect(next.validationErrors).toEqual(errors);
  });

  it('clears validationErrors with empty object', () => {
    const prev = makeState({ validationErrors: { price: true } });
    const next = selfListingV2Reducer(prev, { type: 'SET_VALIDATION_ERRORS', payload: {} });
    expect(next.validationErrors).toEqual({});
  });
});

describe('SET_ACTIVE_INFO_TOOLTIP', () => {
  it('sets activeInfoTooltip to an ID', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_ACTIVE_INFO_TOOLTIP',
      payload: 'baseNightlyRate',
    });
    expect(next.activeInfoTooltip).toBe('baseNightlyRate');
  });

  it('clears activeInfoTooltip with null', () => {
    const prev = makeState({ activeInfoTooltip: 'baseNightlyRate' });
    const next = selfListingV2Reducer(prev, { type: 'SET_ACTIVE_INFO_TOOLTIP', payload: null });
    expect(next.activeInfoTooltip).toBeNull();
  });
});

describe('SET_INFORMATIONAL_TEXTS', () => {
  it('sets informationalTexts', () => {
    const texts = { 'Base Nightly Rate': { desktop: 'Rate info', showMore: true } };
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_INFORMATIONAL_TEXTS',
      payload: texts,
    });
    expect(next.informationalTexts).toBe(texts);
  });
});

describe('SET_IS_CHECKING_ACCESS', () => {
  it('sets isCheckingAccess to false', () => {
    const next = selfListingV2Reducer(initialState, {
      type: 'SET_IS_CHECKING_ACCESS',
      payload: false,
    });
    expect(next.isCheckingAccess).toBe(false);
  });

  it('sets isCheckingAccess to true', () => {
    const prev = makeState({ isCheckingAccess: false });
    const next = selfListingV2Reducer(prev, { type: 'SET_IS_CHECKING_ACCESS', payload: true });
    expect(next.isCheckingAccess).toBe(true);
  });
});

// =============================================================================
// UNKNOWN ACTION
// =============================================================================

describe('unknown action', () => {
  it('returns same state reference (no unnecessary re-renders)', () => {
    const prev = makeState();
    const next = selfListingV2Reducer(prev, { type: 'NONEXISTENT' } as unknown as SelfListingV2Action);
    expect(next).toBe(prev);
  });
});
