import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { MOCK_CALENDAR_OWNERSHIP, MOCK_PENDING_NIGHTS, MOCK_BLOCKED_NIGHTS, MOCK_SHARED_NIGHTS } from '../data/mockCalendar.js';
import { MOCK_MESSAGES } from '../data/mockMessages.js';
import { MOCK_TRANSACTIONS } from '../data/mockTransactions.js';
import { derivePerspective } from './deriveData.js';
import { ACTION_TYPES, applyEffect, getActionEffects } from '../actions/transactionActions.js';
import { buildMessage, buildSystemMessage } from '../actions/messageActions.js';
import { toDateString } from '../helpers/dateHelpers.js';

const STORAGE_KEYS = {
  messages: 'sl_messages',
  transactions: 'sl_transactions',
  calendar: 'sl_calendar'
};

function parseStoredItem(key) {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Invalid ${key} JSON in localStorage, using defaults`);
    return null;
  }
}

function hydrateTransactions(transactions = []) {
  return transactions.map((transaction) => ({
    ...transaction,
    date: transaction.date ? new Date(transaction.date) : transaction.date,
    nights: (transaction.nights || []).map((night) => new Date(night))
  }));
}

function hydrateMessages(messages = []) {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp ? new Date(message.timestamp) : message.timestamp,
    requestData: message.requestData ? {
      ...message.requestData,
      nights: (message.requestData.nights || []).map((night) => new Date(night))
    } : message.requestData
  }));
}

function serializeTransactions(transactions = []) {
  return transactions.map((transaction) => ({
    ...transaction,
    date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
    nights: (transaction.nights || []).map((night) => night instanceof Date ? night.toISOString() : night)
  }));
}

function serializeMessages(messages = []) {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
    requestData: message.requestData ? {
      ...message.requestData,
      nights: (message.requestData.nights || []).map((night) => night instanceof Date ? night.toISOString() : night)
    } : message.requestData
  }));
}

function initialState() {
  const storedMessagesRaw = parseStoredItem(STORAGE_KEYS.messages);
  const storedTransactionsRaw = parseStoredItem(STORAGE_KEYS.transactions);
  const storedCalendar = parseStoredItem(STORAGE_KEYS.calendar);

  const storedMessages = storedMessagesRaw ? hydrateMessages(storedMessagesRaw) : null;
  const storedTransactions = storedTransactionsRaw ? hydrateTransactions(storedTransactionsRaw) : null;

  const hasStoredCalendar = storedCalendar && storedCalendar.calendarOwnership && [
    storedCalendar.calendarOwnership,
    storedCalendar.pendingNights,
    storedCalendar.blockedNights,
    storedCalendar.sharedNights
  ].some((list) => list && (Array.isArray(list) ? list.length > 0 : Object.keys(list || {}).length > 0));

  return {
    calendarOwnership: hasStoredCalendar ? storedCalendar.calendarOwnership : { ...MOCK_CALENDAR_OWNERSHIP },
    pendingNights: hasStoredCalendar ? (storedCalendar.pendingNights || []) : [...MOCK_PENDING_NIGHTS],
    blockedNights: hasStoredCalendar ? (storedCalendar.blockedNights || []) : [...MOCK_BLOCKED_NIGHTS],
    sharedNights: hasStoredCalendar ? (storedCalendar.sharedNights || []) : [...MOCK_SHARED_NIGHTS],
    transactions: storedTransactions && storedTransactions.length > 0 ? storedTransactions : [...MOCK_TRANSACTIONS],
    messages: storedMessages && storedMessages.length > 0 ? storedMessages : [...MOCK_MESSAGES]
  };
}

function reducer(state, action) {
  if (action.type === 'HYDRATE') {
    return action.payload;
  }
  const effects = getActionEffects(action, state);
  return effects.reduce((nextState, effect) => applyEffect(nextState, effect), state);
}

export function useScheduleState({ currentUserId, coTenantId, roommateId }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const resolvedCoTenantId = coTenantId || roommateId;

  const derived = useMemo(() => derivePerspective({
    currentUserId,
    coTenantId: resolvedCoTenantId,
    calendarOwnership: state.calendarOwnership,
    transactions: state.transactions,
    messages: state.messages
  }), [currentUserId, resolvedCoTenantId, state.calendarOwnership, state.transactions, state.messages]);

  const sendMessage = useCallback((text) => {
    const message = buildMessage({ senderId: currentUserId, text });
    dispatch({ type: ACTION_TYPES.SEND_MESSAGE, payload: message });
  }, [currentUserId]);

  const createTransactionRequest = useCallback(({ transaction, requestMessage, pendingNights }) => {
    dispatch({
      type: ACTION_TYPES.CREATE_TRANSACTION,
      payload: { transaction, requestMessage, pendingNights }
    });
  }, []);

  const acceptRequest = useCallback(({ requestId, transaction }) => {
    const systemMessage = buildSystemMessage({
      text: 'Request accepted.',
      requestData: {
        type: transaction.type,
        nights: transaction.nights,
        transactionId: transaction.id
      }
    });
    dispatch({
      type: ACTION_TYPES.ACCEPT_REQUEST,
      payload: { requestId, transaction, systemMessage }
    });
  }, []);

  const declineRequest = useCallback(({ requestId, transaction }) => {
    const systemMessage = buildSystemMessage({
      text: 'Request declined.',
      requestData: {
        type: transaction.type,
        nights: transaction.nights,
        transactionId: transaction.id
      }
    });
    dispatch({
      type: ACTION_TYPES.DECLINE_REQUEST,
      payload: {
        requestId,
        transactionId: transaction.id,
        nights: (transaction.nights || []).map(toDateString),
        systemMessage
      }
    });
  }, []);

  const cancelRequest = useCallback(({ requestId, transaction }) => {
    const systemMessage = buildSystemMessage({
      text: 'Request cancelled.',
      requestData: {
        type: transaction.type,
        nights: transaction.nights,
        transactionId: transaction.id
      }
    });
    dispatch({
      type: ACTION_TYPES.CANCEL_REQUEST,
      payload: {
        requestId,
        transactionId: transaction.id,
        nights: (transaction.nights || []).map(toDateString),
        systemMessage
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(serializeMessages(state.messages)));
  }, [state.messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(serializeTransactions(state.transactions)));
  }, [state.transactions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.calendar, JSON.stringify({
      calendarOwnership: state.calendarOwnership,
      pendingNights: state.pendingNights,
      blockedNights: state.blockedNights,
      sharedNights: state.sharedNights
    }));
  }, [state.calendarOwnership, state.pendingNights, state.blockedNights, state.sharedNights]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.storageArea !== localStorage) return;
      if (!Object.values(STORAGE_KEYS).includes(event.key)) return;
      const storedMessagesRaw = parseStoredItem(STORAGE_KEYS.messages);
      const storedTransactionsRaw = parseStoredItem(STORAGE_KEYS.transactions);
      const storedCalendar = parseStoredItem(STORAGE_KEYS.calendar);

      const hydratedMessages = storedMessagesRaw ? hydrateMessages(storedMessagesRaw) : state.messages;
      const hydratedTransactions = storedTransactionsRaw ? hydrateTransactions(storedTransactionsRaw) : state.transactions;
      const nextCalendar = storedCalendar?.calendarOwnership
        ? {
            calendarOwnership: storedCalendar.calendarOwnership,
            pendingNights: storedCalendar.pendingNights || [],
            blockedNights: storedCalendar.blockedNights || [],
            sharedNights: storedCalendar.sharedNights || []
          }
        : {
            calendarOwnership: state.calendarOwnership,
            pendingNights: state.pendingNights,
            blockedNights: state.blockedNights,
            sharedNights: state.sharedNights
          };

      dispatch({
        type: 'HYDRATE',
        payload: {
          ...state,
          ...nextCalendar,
          messages: hydratedMessages,
          transactions: hydratedTransactions
        }
      });
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [state]);

  return {
    ...state,
    ...derived,
    actions: {
      sendMessage,
      createTransactionRequest,
      acceptRequest,
      declineRequest,
      cancelRequest
    }
  };
}
