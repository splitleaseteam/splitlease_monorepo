/**
 * Self Listing V2 Reducer
 *
 * Reducer-based state management for the SelfListingPageV2 flow.
 * Handles form state, navigation, address validation, pricing,
 * submission, draft persistence, edit mode, and UI flags.
 *
 * @module SelfListingPageV2/selfListingV2Reducer
 */

import type { SelfListingFormData } from './types';
import { DEFAULT_FORM_DATA } from './types';

// =============================================================================
// STATE
// =============================================================================

export interface SelfListingV2State {
  // Navigation
  currentStep: number;

  // Form
  formData: SelfListingFormData;

  // Auth-related
  isLoggedIn: boolean;
  pendingSubmit: boolean;
  headerKey: number;

  // Submission
  isSubmitting: boolean;
  submitSuccess: boolean;
  createdListingId: string | null;

  // Address
  addressError: string | null;
  isAddressValid: boolean;

  // Continue on Phone
  continueOnPhoneLink: string | null;
  phoneNumber: string;
  userPhoneNumber: string | null;
  isSavingDraft: boolean;
  draftListingId: string | null;

  // Edit mode
  isEditMode: boolean;
  editingListingId: string | null;

  // UI
  isMobile: boolean;
  validationErrors: Record<string, boolean>;
  activeInfoTooltip: string | null;
  informationalTexts: Record<string, { desktop?: string; mobile?: string; desktopPlus?: string; showMore?: boolean }>;
  isCheckingAccess: boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState: SelfListingV2State = {
  // Navigation
  currentStep: 1,

  // Form
  formData: DEFAULT_FORM_DATA,

  // Auth-related
  isLoggedIn: false,
  pendingSubmit: false,
  headerKey: 0,

  // Submission
  isSubmitting: false,
  submitSuccess: false,
  createdListingId: null,

  // Address
  addressError: null,
  isAddressValid: false,

  // Continue on Phone
  continueOnPhoneLink: null,
  phoneNumber: '',
  userPhoneNumber: null,
  isSavingDraft: false,
  draftListingId: null,

  // Edit mode
  isEditMode: false,
  editingListingId: null,

  // UI
  isMobile: false,
  validationErrors: {},
  activeInfoTooltip: null,
  informationalTexts: {},
  isCheckingAccess: true,
};

// =============================================================================
// ACTIONS
// =============================================================================

export type SelfListingV2Action =
  // Navigation
  | { type: 'SET_CURRENT_STEP'; payload: number }

  // Form
  | { type: 'SET_FORM_DATA'; payload: SelfListingFormData }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<SelfListingFormData> }

  // Auth-related
  | { type: 'SET_IS_LOGGED_IN'; payload: boolean }
  | { type: 'SET_PENDING_SUBMIT'; payload: boolean }
  | { type: 'INCREMENT_HEADER_KEY' }

  // Submission
  | { type: 'SET_IS_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMIT_SUCCESS'; payload: boolean }
  | { type: 'SET_CREATED_LISTING_ID'; payload: string | null }

  // Address
  | { type: 'SET_ADDRESS_ERROR'; payload: string | null }
  | { type: 'SET_IS_ADDRESS_VALID'; payload: boolean }

  // Continue on Phone
  | { type: 'SET_CONTINUE_ON_PHONE_LINK'; payload: string | null }
  | { type: 'SET_PHONE_NUMBER'; payload: string }
  | { type: 'SET_USER_PHONE_NUMBER'; payload: string | null }
  | { type: 'SET_IS_SAVING_DRAFT'; payload: boolean }
  | { type: 'SET_DRAFT_LISTING_ID'; payload: string | null }

  // Edit mode
  | { type: 'SET_EDIT_MODE'; payload: { isEditMode: boolean; editingListingId: string | null } }

  // UI
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, boolean> }
  | { type: 'SET_ACTIVE_INFO_TOOLTIP'; payload: string | null }
  | { type: 'SET_INFORMATIONAL_TEXTS'; payload: Record<string, { desktop?: string; mobile?: string; desktopPlus?: string; showMore?: boolean }> }
  | { type: 'SET_IS_CHECKING_ACCESS'; payload: boolean };

// =============================================================================
// REDUCER
// =============================================================================

export function selfListingV2Reducer(
  state: SelfListingV2State,
  action: SelfListingV2Action,
): SelfListingV2State {
  switch (action.type) {
    // ----- Navigation -----
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    // ----- Form -----
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };

    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };

    // ----- Auth-related -----
    case 'SET_IS_LOGGED_IN':
      return { ...state, isLoggedIn: action.payload };

    case 'SET_PENDING_SUBMIT':
      return { ...state, pendingSubmit: action.payload };

    case 'INCREMENT_HEADER_KEY':
      return { ...state, headerKey: state.headerKey + 1 };

    // ----- Submission -----
    case 'SET_IS_SUBMITTING':
      return { ...state, isSubmitting: action.payload };

    case 'SET_SUBMIT_SUCCESS':
      return { ...state, submitSuccess: action.payload };

    case 'SET_CREATED_LISTING_ID':
      return { ...state, createdListingId: action.payload };

    // ----- Address -----
    case 'SET_ADDRESS_ERROR':
      return { ...state, addressError: action.payload };

    case 'SET_IS_ADDRESS_VALID':
      return { ...state, isAddressValid: action.payload };

    // ----- Continue on Phone -----
    case 'SET_CONTINUE_ON_PHONE_LINK':
      return { ...state, continueOnPhoneLink: action.payload };

    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload };

    case 'SET_USER_PHONE_NUMBER':
      return { ...state, userPhoneNumber: action.payload };

    case 'SET_IS_SAVING_DRAFT':
      return { ...state, isSavingDraft: action.payload };

    case 'SET_DRAFT_LISTING_ID':
      return { ...state, draftListingId: action.payload };

    // ----- Edit mode -----
    case 'SET_EDIT_MODE':
      return {
        ...state,
        isEditMode: action.payload.isEditMode,
        editingListingId: action.payload.editingListingId,
      };

    // ----- UI -----
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload };

    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };

    case 'SET_ACTIVE_INFO_TOOLTIP':
      return { ...state, activeInfoTooltip: action.payload };

    case 'SET_INFORMATIONAL_TEXTS':
      return { ...state, informationalTexts: action.payload };

    case 'SET_IS_CHECKING_ACCESS':
      return { ...state, isCheckingAccess: action.payload };

    default:
      return state;
  }
}
