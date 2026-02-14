/**
 * useGuestRelationshipsDashboardLogic
 *
 * All business logic for the Guest Relationships Dashboard page.
 * Follows the Hollow Component Pattern - page components contain ONLY JSX rendering.
 *
 * Architecture:
 * - Islands Architecture (independent React root)
 * - Corporate internal tool for managing guest relationships
 * - useReducer for centralized state management
 */

import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';
import {
  guestRelationshipsDashboardReducer,
  initialState,
} from './guestRelationshipsDashboardReducer.js';
import {
  searchGuests,
  getGuest,
  createGuest,
  listArticles,
  assignArticle,
  removeArticle,
  sendEmailToGuest,
  sendSMSToGuest,
  searchListings,
  getUserProposals
} from '../../../lib/guestRelationshipsApi.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_TYPES = [
  { value: 'guest', label: 'Guest' },
  { value: 'host', label: 'Host' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'admin', label: 'Admin' }
];

const MESSAGE_TYPES = [
  { value: 'custom', label: 'Custom Email' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'reminder', label: 'Reminder Email' },
  { value: 'follow-up', label: 'Follow Up' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format phone number for display
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Strip non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useGuestRelationshipsDashboardLogic() {
  const [state, dispatch] = useReducer(guestRelationshipsDashboardReducer, initialState);

  // -------------------------------------------------------------------------
  // STATE - UI (useAsyncOperation for initial load)
  // -------------------------------------------------------------------------
  const {
    isLoading,
    error: rawLoadError,
    execute: executeLoadInitialData
  } = useAsyncOperation(
    async () => {
      // Load articles and recent guests in parallel
      const [articlesResult, guestsResult, listingsResult] = await Promise.all([
        listArticles({ limit: 50 }).catch(() => ({ articles: [] })),
        searchGuests({ query: '', limit: 20 }).catch(() => []),
        searchListings({}, 20).catch(() => [])
      ]);

      dispatch({ type: 'SET_ALL_ARTICLES', payload: articlesResult.articles || [] });
      dispatch({ type: 'SET_ALL_GUESTS', payload: guestsResult || [] });
      dispatch({ type: 'SET_ALL_LISTINGS', payload: listingsResult || [] });
    }
  );

  // Normalize error to string for consumers
  const error = rawLoadError?.message || (rawLoadError ? 'Failed to load data. Please refresh the page.' : null);

  // -------------------------------------------------------------------------
  // EFFECTS - Initial Data Load
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Load initial data on mount
    executeLoadInitialData().catch((err) => {
      console.error('Failed to load initial data:', err);
    });
  }, [executeLoadInitialData]);

  // -------------------------------------------------------------------------
  // EFFECTS - Load Guest Details
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (state.selectedGuest?.id) {
      loadGuestDetails(state.selectedGuest.id);
    } else {
      // Clear guest-specific data
      dispatch({ type: 'CLEAR_GUEST_DETAILS' });
    }
  }, [state.selectedGuest?.id]);

  async function loadGuestDetails(guestId) {
    try {
      dispatch({ type: 'SET_IS_LOADING_PROPOSALS', payload: true });

      const [guestData, proposalsData] = await Promise.all([
        getGuest(guestId, { includeHistory: true, includeArticles: true }),
        getUserProposals(guestId).catch(() => [])
      ]);

      // Update assigned articles from guest data
      if (guestData.assignedArticles) {
        dispatch({ type: 'SET_ASSIGNED_ARTICLES', payload: guestData.assignedArticles });
      }

      // Separate proposals by type
      const proposals = proposalsData || [];
      dispatch({ type: 'SET_CURRENT_PROPOSALS', payload: proposals.filter(p => p.type === 'current' || !p.type) });
      dispatch({ type: 'SET_SUGGESTED_PROPOSALS', payload: proposals.filter(p => p.type === 'suggested') });

    } catch (err) {
      console.error('Failed to load guest details:', err);
      showToast('Failed to load guest details', 'error');
    } finally {
      dispatch({ type: 'SET_IS_LOADING_PROPOSALS', payload: false });
    }
  }

  // -------------------------------------------------------------------------
  // HELPERS - Toast Notifications
  // -------------------------------------------------------------------------

  function showToast(message, type = 'info') {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 4000);
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Guest Search
  // -------------------------------------------------------------------------

  const handleSearchByName = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: [] });
        return;
      }

      try {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
        const results = await searchGuests({ query, searchType: 'name', limit: 10 });
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: results || [] });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
      }
    }, 300),
    []
  );

  const handleSearchByPhone = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: [] });
        return;
      }

      try {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
        const results = await searchGuests({ query, searchType: 'phone', limit: 10 });
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: results || [] });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
      }
    }, 300),
    []
  );

  const handleSearchByEmail = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: [] });
        return;
      }

      try {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: true });
        const results = await searchGuests({ query, searchType: 'email', limit: 10 });
        dispatch({ type: 'SET_GUEST_SEARCH_RESULTS', payload: results || [] });
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING_GUESTS', payload: false });
      }
    }, 300),
    []
  );

  function handleNameSearchChange(value) {
    dispatch({ type: 'SET_NAME_SEARCH', payload: value });
    handleSearchByName(value);
  }

  function handlePhoneSearchChange(value) {
    dispatch({ type: 'SET_PHONE_SEARCH', payload: value });
    handleSearchByPhone(value);
  }

  function handleEmailSearchChange(value) {
    dispatch({ type: 'SET_EMAIL_SEARCH', payload: value });
    handleSearchByEmail(value);
  }

  function handleGuestSelect(guest) {
    dispatch({ type: 'GUEST_SELECT', payload: guest });
  }

  function handleClearSelectedGuest() {
    dispatch({ type: 'SET_SELECTED_GUEST', payload: null });
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Create Customer Form
  // -------------------------------------------------------------------------

  function handleCreateCustomerFieldChange(field, value) {
    dispatch({ type: 'UPDATE_CREATE_CUSTOMER_FIELD', payload: { field, value } });
    // Clear error for this field
    if (state.createCustomerErrors[field]) {
      dispatch({ type: 'CLEAR_CREATE_CUSTOMER_FIELD_ERROR', payload: field });
    }
  }

  function validateCreateCustomerForm() {
    const errors = {};

    if (!state.createCustomerForm.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!state.createCustomerForm.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!state.createCustomerForm.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.createCustomerForm.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!state.createCustomerForm.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
    }

    dispatch({ type: 'SET_CREATE_CUSTOMER_ERRORS', payload: errors });
    return Object.keys(errors).length === 0;
  }

  async function handleCreateCustomer() {
    if (!validateCreateCustomerForm()) return;

    try {
      dispatch({ type: 'SET_IS_CREATING_CUSTOMER', payload: true });
      const newGuest = await createGuest(state.createCustomerForm);

      // Select the newly created guest
      dispatch({
        type: 'SET_SELECTED_GUEST',
        payload: {
          id: newGuest.id,
          firstName: newGuest.firstName,
          lastName: newGuest.lastName,
          email: newGuest.email,
          phoneNumber: newGuest.phoneNumber
        }
      });

      // Clear form
      dispatch({ type: 'RESET_CREATE_CUSTOMER_FORM' });

      // Add to allGuests
      dispatch({ type: 'PREPEND_GUEST', payload: newGuest });

      showToast('Customer created successfully', 'success');
    } catch (err) {
      console.error('Failed to create customer:', err);
      showToast(err.message || 'Failed to create customer', 'error');
    } finally {
      dispatch({ type: 'SET_IS_CREATING_CUSTOMER', payload: false });
    }
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Messaging
  // -------------------------------------------------------------------------

  async function handleSendEmail() {
    if (!state.selectedGuest || !state.emailSubject || !state.emailBody) {
      showToast('Please fill in all email fields', 'error');
      return;
    }

    try {
      dispatch({ type: 'SET_IS_SENDING_MESSAGE', payload: true });

      await sendEmailToGuest({
        to: state.selectedGuest.email,
        subject: state.emailSubject,
        body: state.emailBody
      });

      // Add to message history
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'staff',
        recipientId: state.selectedGuest.id,
        messageBody: `Subject: ${state.emailSubject}\n\n${state.emailBody}`,
        messageType: 'email',
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'PREPEND_MESSAGE', payload: newMessage });

      // Clear form
      dispatch({ type: 'CLEAR_EMAIL_FORM' });

      showToast('Email sent successfully', 'success');
    } catch (err) {
      console.error('Failed to send email:', err);
      showToast(err.message || 'Failed to send email', 'error');
    } finally {
      dispatch({ type: 'SET_IS_SENDING_MESSAGE', payload: false });
    }
  }

  async function handleSendSMS() {
    if (!state.selectedGuest || !state.smsBody) {
      showToast('Please enter a message', 'error');
      return;
    }

    // Format phone for E.164
    const phone = state.selectedGuest.phoneNumber?.replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      showToast('Invalid phone number', 'error');
      return;
    }

    const formattedPhone = phone.length === 10 ? `+1${phone}` : `+${phone}`;

    try {
      dispatch({ type: 'SET_IS_SENDING_MESSAGE', payload: true });

      await sendSMSToGuest({
        to: formattedPhone,
        body: state.smsBody
      });

      // Add to message history
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'staff',
        recipientId: state.selectedGuest.id,
        messageBody: state.smsBody,
        messageType: 'sms',
        status: 'sent',
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'PREPEND_MESSAGE', payload: newMessage });

      // Clear form
      dispatch({ type: 'CLEAR_SMS_FORM' });

      showToast('SMS sent successfully', 'success');
    } catch (err) {
      console.error('Failed to send SMS:', err);
      showToast(err.message || 'Failed to send SMS', 'error');
    } finally {
      dispatch({ type: 'SET_IS_SENDING_MESSAGE', payload: false });
    }
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Proposals
  // -------------------------------------------------------------------------

  function handleRemoveProposal(proposalId) {
    dispatch({ type: 'REMOVE_PROPOSAL', payload: proposalId });
    showToast('Proposal removed', 'success');
  }

  function handleConfirmPricing(_proposalId) {
    showToast('Pricing confirmation not yet implemented', 'info');
  }

  function handleAddSuggestedProposal(listingId) {
    const listing = state.allListings.find(l => l.id === listingId);
    if (!listing) return;

    const newProposal = {
      id: `prop-${Date.now()}`,
      listingId,
      listing,
      userId: state.selectedGuest?.id || '',
      moveInDate: new Date().toISOString().split('T')[0],
      daysSelected: 7,
      nights: 7,
      duration: '1 week',
      nightlyPrice: 100,
      status: 'pending',
      type: 'suggested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_SUGGESTED_PROPOSAL', payload: newProposal });
    showToast('Suggested proposal added', 'success');
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Listings
  // -------------------------------------------------------------------------

  function handleAddListing(listingId, _userIds) {
    const listing = state.allListings.find(l => l.id === listingId);
    if (listing && !state.suggestedListings.some(l => l.id === listingId)) {
      dispatch({ type: 'ADD_SUGGESTED_LISTING', payload: listing });
      showToast('Listing added', 'success');
    }
  }

  function handleRemoveListing(listingId) {
    dispatch({ type: 'REMOVE_SUGGESTED_LISTING', payload: listingId });
    showToast('Listing removed', 'success');
  }

  function handleAddCuratedListing(_listingId) {
    showToast('Curated listing feature not yet implemented', 'info');
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Multi-user Selection
  // -------------------------------------------------------------------------

  function handleSelectAllGuests() {
    dispatch({ type: 'SET_SELECTED_USERS', payload: state.allGuests.map(g => g.id) });
  }

  function handleDeselectAllGuests() {
    dispatch({ type: 'SET_SELECTED_USERS', payload: [] });
  }

  function handleToggleUserSelection(userId) {
    dispatch({ type: 'TOGGLE_USER_SELECTION', payload: userId });
  }

  // -------------------------------------------------------------------------
  // HANDLERS - Knowledge Base
  // -------------------------------------------------------------------------

  async function handleAddArticle(articleId) {
    if (!state.selectedGuest || !articleId) return;

    try {
      dispatch({ type: 'SET_IS_LOADING_ARTICLES', payload: true });
      await assignArticle(state.selectedGuest.id, articleId);

      // Find the article and add to assigned list
      const article = state.allArticles.find(a => a.id === articleId);
      if (article) {
        dispatch({
          type: 'ADD_ASSIGNED_ARTICLE',
          payload: {
            ...article,
            assignedAt: new Date().toISOString()
          }
        });
      }

      dispatch({ type: 'SET_SELECTED_ARTICLE_TO_ADD', payload: '' });
      showToast('Article assigned', 'success');
    } catch (err) {
      console.error('Failed to assign article:', err);
      showToast(err.message || 'Failed to assign article', 'error');
    } finally {
      dispatch({ type: 'SET_IS_LOADING_ARTICLES', payload: false });
    }
  }

  async function handleRemoveArticle(articleId) {
    if (!state.selectedGuest || !articleId) return;

    try {
      dispatch({ type: 'SET_IS_LOADING_ARTICLES', payload: true });
      await removeArticle(state.selectedGuest.id, articleId);

      dispatch({ type: 'REMOVE_ASSIGNED_ARTICLE', payload: articleId });
      showToast('Article removed', 'success');
    } catch (err) {
      console.error('Failed to remove article:', err);
      showToast(err.message || 'Failed to remove article', 'error');
    } finally {
      dispatch({ type: 'SET_IS_LOADING_ARTICLES', payload: false });
    }
  }

  // -------------------------------------------------------------------------
  // COMPUTED VALUES
  // -------------------------------------------------------------------------

  const availableArticles = useMemo(() => {
    const assignedIds = new Set(state.assignedArticles.map(a => a.id));
    return state.allArticles.filter(a => !assignedIds.has(a.id));
  }, [state.allArticles, state.assignedArticles]);

  const guestHistory = state.selectedGuest?.history || [];

  // -------------------------------------------------------------------------
  // BACKWARD-COMPATIBLE DISPATCH WRAPPERS
  // (Consumer passes these as direct setters to child components)
  // -------------------------------------------------------------------------

  const setShowNameDropdown = useCallback(
    (value) => dispatch({ type: 'SET_SHOW_NAME_DROPDOWN', payload: value }),
    []
  );
  const setShowPhoneDropdown = useCallback(
    (value) => dispatch({ type: 'SET_SHOW_PHONE_DROPDOWN', payload: value }),
    []
  );
  const setShowEmailDropdown = useCallback(
    (value) => dispatch({ type: 'SET_SHOW_EMAIL_DROPDOWN', payload: value }),
    []
  );
  const setMessageType = useCallback(
    (value) => dispatch({ type: 'SET_MESSAGE_TYPE', payload: value }),
    []
  );
  const setEmailSubject = useCallback(
    (value) => dispatch({ type: 'SET_EMAIL_SUBJECT', payload: value }),
    []
  );
  const setEmailBody = useCallback(
    (value) => dispatch({ type: 'SET_EMAIL_BODY', payload: value }),
    []
  );
  const setSmsBody = useCallback(
    (value) => dispatch({ type: 'SET_SMS_BODY', payload: value }),
    []
  );
  const setSelectedArticleToAdd = useCallback(
    (value) => dispatch({ type: 'SET_SELECTED_ARTICLE_TO_ADD', payload: value }),
    []
  );

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------

  return {
    // Constants
    USER_TYPES,
    MESSAGE_TYPES,

    // Guest Selection
    selectedGuest: state.selectedGuest,
    guestSearchResults: state.guestSearchResults,
    isSearchingGuests: state.isSearchingGuests,
    nameSearch: state.nameSearch,
    phoneSearch: state.phoneSearch,
    emailSearch: state.emailSearch,
    showNameDropdown: state.showNameDropdown,
    showPhoneDropdown: state.showPhoneDropdown,
    showEmailDropdown: state.showEmailDropdown,

    // Guest Selection Handlers
    handleNameSearchChange,
    handlePhoneSearchChange,
    handleEmailSearchChange,
    handleGuestSelect,
    handleClearSelectedGuest,
    setShowNameDropdown,
    setShowPhoneDropdown,
    setShowEmailDropdown,

    // Create Customer
    createCustomerForm: state.createCustomerForm,
    createCustomerErrors: state.createCustomerErrors,
    isCreatingCustomer: state.isCreatingCustomer,
    handleCreateCustomerFieldChange,
    handleCreateCustomer,

    // Messaging
    messageType: state.messageType,
    setMessageType,
    emailSubject: state.emailSubject,
    setEmailSubject,
    emailBody: state.emailBody,
    setEmailBody,
    smsBody: state.smsBody,
    setSmsBody,
    messageHistory: state.messageHistory,
    isSendingMessage: state.isSendingMessage,
    handleSendEmail,
    handleSendSMS,

    // Proposals
    currentProposals: state.currentProposals,
    suggestedProposals: state.suggestedProposals,
    isLoadingProposals: state.isLoadingProposals,
    handleRemoveProposal,
    handleConfirmPricing,
    handleAddSuggestedProposal,

    // Listings
    suggestedListings: state.suggestedListings,
    allListings: state.allListings,
    handleAddListing,
    handleRemoveListing,
    handleAddCuratedListing,

    // Multi-user Selection
    selectedUsers: state.selectedUsers,
    allGuests: state.allGuests,
    handleSelectAllGuests,
    handleDeselectAllGuests,
    handleToggleUserSelection,

    // Knowledge Base
    allArticles: state.allArticles,
    assignedArticles: state.assignedArticles,
    availableArticles,
    selectedArticleToAdd: state.selectedArticleToAdd,
    setSelectedArticleToAdd,
    isLoadingArticles: state.isLoadingArticles,
    handleAddArticle,
    handleRemoveArticle,

    // History
    guestHistory,

    // UI State
    isLoading,
    error,
    toast: state.toast,

    // Helpers
    formatPhoneNumber
  };
}
