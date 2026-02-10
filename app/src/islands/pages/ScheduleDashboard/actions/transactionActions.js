import { applyTransactionOwnership, validateNotLocked, validateOwnership, validateSwapOwnership } from '../state/validators.js';

export const ACTION_TYPES = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  ACCEPT_REQUEST: 'ACCEPT_REQUEST',
  DECLINE_REQUEST: 'DECLINE_REQUEST',
  CANCEL_REQUEST: 'CANCEL_REQUEST'
};

export const EFFECT_TYPES = {
  UPDATE_MESSAGE_STATUS: 'UPDATE_MESSAGE_STATUS',
  UPDATE_TRANSACTION_STATUS: 'UPDATE_TRANSACTION_STATUS',
  ADD_MESSAGE: 'ADD_MESSAGE',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  ADD_PENDING_NIGHTS: 'ADD_PENDING_NIGHTS',
  REMOVE_PENDING_NIGHTS: 'REMOVE_PENDING_NIGHTS',
  TRANSFER_OWNERSHIP: 'TRANSFER_OWNERSHIP'
};

export function getActionEffects(action, state) {
  switch (action.type) {
    case ACTION_TYPES.SEND_MESSAGE:
      return [{ type: EFFECT_TYPES.ADD_MESSAGE, payload: action.payload }];
    case ACTION_TYPES.CREATE_TRANSACTION: {
      const { transaction, requestMessage, pendingNights } = action.payload;
      validateNotLocked({ nights: transaction.nights, pendingNights: state.pendingNights });
      return [
        { type: EFFECT_TYPES.ADD_TRANSACTION, payload: transaction },
        { type: EFFECT_TYPES.ADD_MESSAGE, payload: requestMessage },
        { type: EFFECT_TYPES.ADD_PENDING_NIGHTS, payload: pendingNights }
      ];
    }
    case ACTION_TYPES.ACCEPT_REQUEST: {
      const { requestId, transaction } = action.payload;
      if (transaction.type === 'alternating') {
        validateSwapOwnership({
          nights: transaction.nights,
          payerId: transaction.payerId,
          payeeId: transaction.payeeId,
          calendarOwnership: state.calendarOwnership
        });
      } else {
        validateOwnership({
          nights: transaction.nights,
          fromUserId: transaction.payeeId,
          calendarOwnership: state.calendarOwnership
        });
      }
      return [
        { type: EFFECT_TYPES.UPDATE_MESSAGE_STATUS, payload: { requestId, status: 'accepted' } },
        { type: EFFECT_TYPES.UPDATE_TRANSACTION_STATUS, payload: { id: transaction.id, status: 'complete' } },
        { type: EFFECT_TYPES.TRANSFER_OWNERSHIP, payload: transaction },
        { type: EFFECT_TYPES.REMOVE_PENDING_NIGHTS, payload: transaction.nights },
        { type: EFFECT_TYPES.ADD_MESSAGE, payload: action.payload.systemMessage }
      ];
    }
    case ACTION_TYPES.DECLINE_REQUEST:
      return [
        { type: EFFECT_TYPES.UPDATE_MESSAGE_STATUS, payload: { requestId: action.payload.requestId, status: 'declined' } },
        { type: EFFECT_TYPES.UPDATE_TRANSACTION_STATUS, payload: { id: action.payload.transactionId, status: 'declined' } },
        { type: EFFECT_TYPES.REMOVE_PENDING_NIGHTS, payload: action.payload.nights },
        { type: EFFECT_TYPES.ADD_MESSAGE, payload: action.payload.systemMessage }
      ];
    case ACTION_TYPES.CANCEL_REQUEST:
      return [
        { type: EFFECT_TYPES.UPDATE_MESSAGE_STATUS, payload: { requestId: action.payload.requestId, status: 'declined' } },
        { type: EFFECT_TYPES.UPDATE_TRANSACTION_STATUS, payload: { id: action.payload.transactionId, status: 'cancelled' } },
        { type: EFFECT_TYPES.REMOVE_PENDING_NIGHTS, payload: action.payload.nights },
        { type: EFFECT_TYPES.ADD_MESSAGE, payload: action.payload.systemMessage }
      ];
    default:
      return [];
  }
}

export function applyEffect(state, effect) {
  switch (effect.type) {
    case EFFECT_TYPES.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, effect.payload] };
    case EFFECT_TYPES.ADD_TRANSACTION:
      return { ...state, transactions: [effect.payload, ...state.transactions] };
    case EFFECT_TYPES.UPDATE_MESSAGE_STATUS:
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === effect.payload.requestId ? { ...msg, status: effect.payload.status } : msg
        )
      };
    case EFFECT_TYPES.UPDATE_TRANSACTION_STATUS:
      return {
        ...state,
        transactions: state.transactions.map((txn) =>
          txn.id === effect.payload.id ? { ...txn, status: effect.payload.status } : txn
        )
      };
    case EFFECT_TYPES.ADD_PENDING_NIGHTS: {
      const nextPending = Array.from(new Set([...(state.pendingNights || []), ...(effect.payload || [])]));
      return { ...state, pendingNights: nextPending };
    }
    case EFFECT_TYPES.REMOVE_PENDING_NIGHTS: {
      const removeSet = new Set(effect.payload || []);
      return {
        ...state,
        pendingNights: (state.pendingNights || []).filter((night) => !removeSet.has(night))
      };
    }
    case EFFECT_TYPES.TRANSFER_OWNERSHIP:
      return {
        ...state,
        calendarOwnership: applyTransactionOwnership({
          calendarOwnership: state.calendarOwnership,
          transaction: effect.payload
        })
      };
    default:
      return state;
  }
}
