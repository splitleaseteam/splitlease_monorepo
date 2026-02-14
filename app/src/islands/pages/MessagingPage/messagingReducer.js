/**
 * Messaging Reducer
 *
 * Reducer-based state management for the messaging page.
 * Handles auth state, thread/message data, right panel data,
 * realtime state, proposal flow, and UI flags.
 *
 * @module MessagingPage/messagingReducer
 */

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  // Auth
  authState: { isChecking: true, shouldRedirect: false },
  user: null,

  // Thread data
  threads: [],
  selectedThread: null,
  messages: [],
  threadInfo: null,

  // UI
  isLoading: true,
  isLoadingMessages: false,
  error: null,
  messageInput: '',
  isSending: false,

  // Right panel data
  proposalData: null,
  listingData: null,
  isLoadingPanelData: false,

  // Realtime
  isOtherUserTyping: false,
  typingUserName: null,

  // Proposal modal
  proposalModalData: null,
  zatConfig: null,
  isSubmittingProposal: false,
};

// =============================================================================
// REDUCER
// =============================================================================

export function messagingReducer(state, action) {
  switch (action.type) {
    // ----- Auth -----
    case 'SET_AUTH_STATE':
      return { ...state, authState: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    // ----- Thread data -----
    case 'SET_THREADS':
      return { ...state, threads: action.payload };

    case 'SET_SELECTED_THREAD':
      return { ...state, selectedThread: action.payload };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE': {
      const msg = action.payload;
      if (state.messages.some(m => m.id === msg.id)) return state;
      return { ...state, messages: [...state.messages, msg] };
    }

    case 'MARK_THREAD_READ': {
      const threadId = action.payload;
      return {
        ...state,
        threads: state.threads.map(t =>
          t.id === threadId ? { ...t, unread_count: 0 } : t
        ),
      };
    }

    case 'SET_THREAD_INFO':
      return { ...state, threadInfo: action.payload };

    // ----- UI -----
    case 'SET_IS_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_IS_LOADING_MESSAGES':
      return { ...state, isLoadingMessages: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_MESSAGE_INPUT':
      return { ...state, messageInput: action.payload };

    case 'SET_IS_SENDING':
      return { ...state, isSending: action.payload };

    // ----- Right panel data -----
    case 'SET_PROPOSAL_DATA':
      return { ...state, proposalData: action.payload };

    case 'SET_LISTING_DATA':
      return { ...state, listingData: action.payload };

    case 'SET_IS_LOADING_PANEL_DATA':
      return { ...state, isLoadingPanelData: action.payload };

    // ----- Realtime -----
    case 'SET_TYPING': {
      const { isOtherUserTyping, typingUserName } = action.payload;
      return { ...state, isOtherUserTyping, typingUserName };
    }

    // ----- Proposal modal -----
    case 'SET_PROPOSAL_MODAL_DATA':
      return { ...state, proposalModalData: action.payload };

    case 'SET_ZAT_CONFIG':
      return { ...state, zatConfig: action.payload };

    case 'SET_IS_SUBMITTING_PROPOSAL':
      return { ...state, isSubmittingProposal: action.payload };

    // ----- Compound actions -----
    case 'SELECT_THREAD':
      return {
        ...state,
        selectedThread: action.payload,
        messages: [],
        threadInfo: null,
        proposalData: null,
        listingData: null,
        isOtherUserTyping: false,
        typingUserName: null,
      };

    case 'START_RETRY':
      return { ...state, error: null, isLoading: true };

    default:
      return state;
  }
}
