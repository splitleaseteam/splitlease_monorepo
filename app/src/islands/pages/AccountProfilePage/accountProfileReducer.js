/**
 * Account Profile Reducer
 *
 * Reducer-based state management for the Account Profile page.
 * Handles core loading, user identity, profile data, form state,
 * reference data, host listings, rental application, preview mode,
 * and email verification.
 *
 * Note: Modal state is managed separately via useModalManager (profileModals).
 *
 * @module AccountProfilePage/accountProfileReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  // Core state
  loading: true,
  saving: false,
  error: null,

  // User identity
  loggedInUserId: null,
  profileUserId: null,
  isAuthenticated: false,

  // Profile data from database
  profileData: null,

  // Form state (for editor view)
  formData: {
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
  },

  // Form validation
  formErrors: {},
  isDirty: false,

  // Reference data
  goodGuestReasonsList: [],
  storageItemsList: [],
  transportationOptions: [
    { value: '', label: 'Select transportation...' },
    { value: 'car', label: 'Car' },
    { value: 'public_transit', label: 'Public Transit' },
    { value: 'plane', label: 'Plane' },
  ],

  // Host listings
  hostListings: [],
  loadingListings: false,

  // Rental application (guest-only)
  rentalApplicationStatus: 'not_started',
  rentalApplicationProgress: 0,

  // Preview mode
  previewMode: false,

  // Email verification
  isVerifyingEmail: false,
  verificationEmailSent: false,
};

// =============================================================================
// REDUCER
// =============================================================================

export function accountProfileReducer(state, action) {
  switch (action.type) {
    // ----- Core loading -----
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_SAVING':
      return { ...state, saving: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    // ----- User identity -----
    case 'SET_LOGGED_IN_USER_ID':
      return { ...state, loggedInUserId: action.payload };

    case 'SET_PROFILE_USER_ID':
      return { ...state, profileUserId: action.payload };

    case 'SET_IS_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    // ----- Profile data -----
    case 'SET_PROFILE_DATA':
      return { ...state, profileData: action.payload };

    case 'MERGE_PROFILE_DATA':
      return { ...state, profileData: { ...state.profileData, ...action.payload } };

    // ----- Form state -----
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };

    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.payload.field]: action.payload.value },
      };

    case 'SET_FORM_ERRORS':
      return { ...state, formErrors: action.payload };

    case 'CLEAR_FORM_ERROR': {
      const next = { ...state.formErrors };
      delete next[action.payload];
      return { ...state, formErrors: next };
    }

    case 'SET_IS_DIRTY':
      return { ...state, isDirty: action.payload };

    // ----- Reference data -----
    case 'SET_GOOD_GUEST_REASONS_LIST':
      return { ...state, goodGuestReasonsList: action.payload };

    case 'SET_STORAGE_ITEMS_LIST':
      return { ...state, storageItemsList: action.payload };

    // ----- Host listings -----
    case 'SET_HOST_LISTINGS':
      return { ...state, hostListings: action.payload };

    case 'SET_LOADING_LISTINGS':
      return { ...state, loadingListings: action.payload };

    // ----- Rental application -----
    case 'SET_RENTAL_APPLICATION_STATUS':
      return { ...state, rentalApplicationStatus: action.payload };

    case 'SET_RENTAL_APPLICATION_PROGRESS':
      return { ...state, rentalApplicationProgress: action.payload };

    case 'SET_RENTAL_APPLICATION': {
      const { status, progress } = action.payload;
      return { ...state, rentalApplicationStatus: status, rentalApplicationProgress: progress };
    }

    // ----- Preview mode -----
    case 'TOGGLE_PREVIEW_MODE':
      return { ...state, previewMode: !state.previewMode };

    // ----- Email verification -----
    case 'SET_IS_VERIFYING_EMAIL':
      return { ...state, isVerifyingEmail: action.payload };

    case 'SET_VERIFICATION_EMAIL_SENT':
      return { ...state, verificationEmailSent: action.payload };

    default:
      return state;
  }
}
