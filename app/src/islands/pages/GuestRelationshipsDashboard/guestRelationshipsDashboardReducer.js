/**
 * Guest Relationships Dashboard Reducer
 *
 * Reducer-based state management for the Guest Relationships Dashboard page.
 * Handles guest search, customer creation, messaging, proposals,
 * listings, multi-user selection, knowledge base, and UI flags.
 *
 * @module GuestRelationshipsDashboard/guestRelationshipsDashboardReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

const CREATE_CUSTOMER_FORM_DEFAULTS = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phoneNumber: '',
  userType: 'guest',
};

export const initialState = {
  // Guest Selection
  selectedGuest: null,
  guestSearchResults: [],
  isSearchingGuests: false,

  // Search Inputs
  nameSearch: '',
  phoneSearch: '',
  emailSearch: '',

  // Dropdown Visibility
  showNameDropdown: false,
  showPhoneDropdown: false,
  showEmailDropdown: false,

  // Create Customer Form
  createCustomerForm: { ...CREATE_CUSTOMER_FORM_DEFAULTS },
  createCustomerErrors: {},
  isCreatingCustomer: false,

  // Messaging
  messageType: 'custom',
  emailSubject: '',
  emailBody: '',
  smsBody: '',
  messageHistory: [],
  isSendingMessage: false,

  // Proposals & Listings
  currentProposals: [],
  suggestedProposals: [],
  suggestedListings: [],
  allListings: [],
  isLoadingProposals: false,

  // Multi-user Selection
  selectedUsers: [],
  allGuests: [],

  // Knowledge Base
  allArticles: [],
  assignedArticles: [],
  selectedArticleToAdd: '',
  isLoadingArticles: false,

  // UI
  toast: null,
};

// =============================================================================
// REDUCER
// =============================================================================

export function guestRelationshipsDashboardReducer(state, action) {
  switch (action.type) {
    // ----- Guest Selection -----
    case 'SET_SELECTED_GUEST':
      return { ...state, selectedGuest: action.payload };

    case 'SET_GUEST_SEARCH_RESULTS':
      return { ...state, guestSearchResults: action.payload };

    case 'SET_IS_SEARCHING_GUESTS':
      return { ...state, isSearchingGuests: action.payload };

    case 'GUEST_SELECT':
      return {
        ...state,
        selectedGuest: action.payload,
        nameSearch: '',
        phoneSearch: '',
        emailSearch: '',
        showNameDropdown: false,
        showPhoneDropdown: false,
        showEmailDropdown: false,
        guestSearchResults: [],
      };

    case 'CLEAR_GUEST_DETAILS':
      return {
        ...state,
        assignedArticles: [],
        currentProposals: [],
        suggestedProposals: [],
      };

    // ----- Search Inputs -----
    case 'SET_NAME_SEARCH':
      return { ...state, nameSearch: action.payload };

    case 'SET_PHONE_SEARCH':
      return { ...state, phoneSearch: action.payload };

    case 'SET_EMAIL_SEARCH':
      return { ...state, emailSearch: action.payload };

    // ----- Dropdown Visibility -----
    case 'SET_SHOW_NAME_DROPDOWN':
      return { ...state, showNameDropdown: action.payload };

    case 'SET_SHOW_PHONE_DROPDOWN':
      return { ...state, showPhoneDropdown: action.payload };

    case 'SET_SHOW_EMAIL_DROPDOWN':
      return { ...state, showEmailDropdown: action.payload };

    // ----- Create Customer Form -----
    case 'UPDATE_CREATE_CUSTOMER_FIELD':
      return {
        ...state,
        createCustomerForm: {
          ...state.createCustomerForm,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'CLEAR_CREATE_CUSTOMER_FIELD_ERROR': {
      const next = { ...state.createCustomerErrors };
      delete next[action.payload];
      return { ...state, createCustomerErrors: next };
    }

    case 'SET_CREATE_CUSTOMER_ERRORS':
      return { ...state, createCustomerErrors: action.payload };

    case 'RESET_CREATE_CUSTOMER_FORM':
      return {
        ...state,
        createCustomerForm: { ...CREATE_CUSTOMER_FORM_DEFAULTS },
      };

    case 'SET_IS_CREATING_CUSTOMER':
      return { ...state, isCreatingCustomer: action.payload };

    // ----- Messaging -----
    case 'SET_MESSAGE_TYPE':
      return { ...state, messageType: action.payload };

    case 'SET_EMAIL_SUBJECT':
      return { ...state, emailSubject: action.payload };

    case 'SET_EMAIL_BODY':
      return { ...state, emailBody: action.payload };

    case 'SET_SMS_BODY':
      return { ...state, smsBody: action.payload };

    case 'PREPEND_MESSAGE':
      return { ...state, messageHistory: [action.payload, ...state.messageHistory] };

    case 'SET_IS_SENDING_MESSAGE':
      return { ...state, isSendingMessage: action.payload };

    case 'CLEAR_EMAIL_FORM':
      return { ...state, emailSubject: '', emailBody: '' };

    case 'CLEAR_SMS_FORM':
      return { ...state, smsBody: '' };

    // ----- Proposals -----
    case 'SET_CURRENT_PROPOSALS':
      return { ...state, currentProposals: action.payload };

    case 'SET_SUGGESTED_PROPOSALS':
      return { ...state, suggestedProposals: action.payload };

    case 'ADD_SUGGESTED_PROPOSAL':
      return { ...state, suggestedProposals: [...state.suggestedProposals, action.payload] };

    case 'REMOVE_PROPOSAL':
      return {
        ...state,
        currentProposals: state.currentProposals.filter(p => p.id !== action.payload),
        suggestedProposals: state.suggestedProposals.filter(p => p.id !== action.payload),
      };

    case 'SET_IS_LOADING_PROPOSALS':
      return { ...state, isLoadingProposals: action.payload };

    // ----- Listings -----
    case 'SET_ALL_LISTINGS':
      return { ...state, allListings: action.payload };

    case 'ADD_SUGGESTED_LISTING':
      return { ...state, suggestedListings: [...state.suggestedListings, action.payload] };

    case 'REMOVE_SUGGESTED_LISTING':
      return {
        ...state,
        suggestedListings: state.suggestedListings.filter(l => l.id !== action.payload),
      };

    // ----- Multi-user Selection -----
    case 'SET_SELECTED_USERS':
      return { ...state, selectedUsers: action.payload };

    case 'TOGGLE_USER_SELECTION': {
      const userId = action.payload;
      const next = state.selectedUsers.includes(userId)
        ? state.selectedUsers.filter(id => id !== userId)
        : [...state.selectedUsers, userId];
      return { ...state, selectedUsers: next };
    }

    case 'SET_ALL_GUESTS':
      return { ...state, allGuests: action.payload };

    case 'PREPEND_GUEST':
      return { ...state, allGuests: [action.payload, ...state.allGuests] };

    // ----- Knowledge Base -----
    case 'SET_ALL_ARTICLES':
      return { ...state, allArticles: action.payload };

    case 'SET_ASSIGNED_ARTICLES':
      return { ...state, assignedArticles: action.payload };

    case 'ADD_ASSIGNED_ARTICLE':
      return { ...state, assignedArticles: [...state.assignedArticles, action.payload] };

    case 'REMOVE_ASSIGNED_ARTICLE':
      return {
        ...state,
        assignedArticles: state.assignedArticles.filter(a => a.id !== action.payload),
      };

    case 'SET_SELECTED_ARTICLE_TO_ADD':
      return { ...state, selectedArticleToAdd: action.payload };

    case 'SET_IS_LOADING_ARTICLES':
      return { ...state, isLoadingArticles: action.payload };

    // ----- UI -----
    case 'SHOW_TOAST':
      return {
        ...state,
        toast: { message: action.payload.message, type: action.payload.type },
      };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    default:
      return state;
  }
}
