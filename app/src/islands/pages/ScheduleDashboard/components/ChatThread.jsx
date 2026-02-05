/**
 * Chat Thread Component
 *
 * Inline messaging with roommate:
 * - Message history (scrollable)
 * - Quick response chips
 * - Message input
 * - Inline transaction confirmations
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// CONSTANTS
// ============================================================================

const QUICK_RESPONSES = [
  'Sounds good!',
  'Can we do a different date?',
  'What nights work for you?'
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const MessageBubble = React.forwardRef(({ message, isCurrentUser, displayName, onAccept, onDecline, onCounter }, ref) => {
  if (message.type === 'system') {
    return <TransactionNotice message={message} />;
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div
      ref={ref}
      className={`chat-bubble ${isCurrentUser ? 'chat-bubble--sent' : 'chat-bubble--received'} ${message.type === 'request' ? 'chat-bubble--request' : ''}`}
    >
      <div className="chat-bubble__content">
        <div className="chat-bubble__sender">{displayName}</div>
        {message.text || message.content}

        {/* Price info hidden from initial request bubble per spec - price shows only in Accept button */}

        {message.type === 'request' && message.status && message.status !== 'pending' && (
          <div className={`chat-bubble__status chat-bubble__status--${message.status}`}>
            {message.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
          </div>
        )}

        {message.type === 'request' && message.status === 'pending' && !isCurrentUser && (
          <div className="chat-bubble__actions">
            {message.requestData?.suggestedPrice && message.requestData?.offeredPrice !== message.requestData?.suggestedPrice && (
              <div className="chat-bubble__context">
                <span className="chat-bubble__context-text">
                  Your suggested price: ${message.requestData.suggestedPrice.toFixed(2)}
                </span>
              </div>
            )}
            <div className="chat-bubble__action-buttons">
              <button
                className="chat-bubble__action-btn chat-bubble__action-btn--accept"
                onClick={() => onAccept(message.id)}
              >
                Accept{message.requestData?.amount ? ` $${message.requestData.amount.toFixed(2)}` : message.requestData?.offeredPrice ? ` $${message.requestData.offeredPrice.toFixed(2)}` : ''}
              </button>
              <button
                className="chat-bubble__action-btn chat-bubble__action-btn--counter"
                onClick={() => onCounter(message.id)}
              >
                Counter
              </button>
              <button
                className="chat-bubble__action-btn chat-bubble__action-btn--decline"
                onClick={() => onDecline(message.id)}
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="chat-bubble__meta">
        <span className="chat-bubble__time">{formattedTime}</span>
      </div>
    </div>
  );
});

function TransactionNotice({ message }) {
  const getNoticeText = () => {
    if (message?.text) return message.text;
    const transaction = message?.requestData;
    if (!transaction) return 'Transaction processed';

    const nightStr = transaction.nights?.[0] ? new Date(transaction.nights[0]).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) : '';

    if (transaction.type === 'buyout') {
      return `Night bought: You get ${nightStr}`;
    }
    if (transaction.type === 'swap') {
      return `Night swapped: You get ${nightStr}`;
    }
    if (transaction.type === 'offer') {
      return `Night offered: ${nightStr}`;
    }
    return 'Transaction processed';
  };

  return (
    <div className="chat-notice">
      <hr className="chat-notice__divider" />
      <div className="chat-notice__body">
        <span className="chat-notice__icon" aria-hidden="true">✓</span>
        <span className="chat-notice__text">{getNoticeText()}</span>
      </div>
      <hr className="chat-notice__divider" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatThread({
  messages = [],
  currentUserId,
  roommateName,
  lease,
  guestName,
  hostName,
  onSendMessage,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  isSending = false,
  activeTransactionId,
  onClearActiveTransaction
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  // Compute counterparty label based on lease type
  const counterpartyLabel = useMemo(() => {
    if (!lease || lease.isCoTenant) {
      return roommateName || 'Co-tenant';
    }
    if (lease.userRole === 'guest') {
      return hostName ? `Host (${hostName})` : 'Host';
    }
    return guestName ? `Guest (${guestName})` : 'Guest';
  }, [lease, roommateName, guestName, hostName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to request message when transaction selected
  useEffect(() => {
    if (!activeTransactionId) return;
    const targetId = Object.keys(messageRefs.current).find((messageId) => {
      const message = messages.find((msg) => msg.id === messageId);
      return message?.requestData?.transactionId === activeTransactionId;
    });

    if (!targetId) return;

    const messageElement = messageRefs.current[targetId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('chat-bubble--highlighted');
      setTimeout(() => {
        messageElement.classList.remove('chat-bubble--highlighted');
        onClearActiveTransaction?.();
      }, 1500);
    }
  }, [activeTransactionId, messages, onClearActiveTransaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isSending) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickResponse = (response) => {
    setInputValue(response);
  };

  return (
    <div className="chat-thread">
      <h3 className="chat-thread__heading">
        Chat with {counterpartyLabel}
      </h3>

      {/* Messages Area */}
      <div className="chat-thread__messages">
        {messages.length === 0 ? (
          <div className="chat-thread__empty">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              ref={(el) => { messageRefs.current[msg.id] = el; }}
              isCurrentUser={msg.senderId === currentUserId}
              displayName={msg.senderId === currentUserId ? 'You' : counterpartyLabel}
              onAccept={onAcceptRequest}
              onDecline={onDeclineRequest}
              onCounter={onCounterRequest}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses */}
      <div className="chat-thread__quick-responses">
        {QUICK_RESPONSES.map((response) => (
          <button
            key={response}
            className="chat-thread__quick-btn"
            onClick={() => handleQuickResponse(response)}
            disabled={isSending}
          >
            {response}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form className="chat-thread__input-area" onSubmit={handleSubmit}>
        <textarea
          className="chat-thread__input"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={500}
          disabled={isSending}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (inputValue.trim()) {
                handleSubmit(e);
              }
            }
          }}
        />
        <button
          type="submit"
          className="chat-thread__send-btn"
          disabled={!inputValue.trim() || isSending}
          aria-label="Send message"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

ChatThread.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    senderId: PropTypes.string,
    text: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    type: PropTypes.oneOf(['message', 'system', 'request']),
    status: PropTypes.oneOf(['pending', 'accepted', 'declined']),
    requestData: PropTypes.object,
  })),
  currentUserId: PropTypes.string,
  roommateName: PropTypes.string,
  lease: PropTypes.shape({
    isCoTenant: PropTypes.bool,
    userRole: PropTypes.oneOf(['guest', 'host']),
  }),
  guestName: PropTypes.string,
  hostName: PropTypes.string,
  onSendMessage: PropTypes.func,
  onAcceptRequest: PropTypes.func,
  onDeclineRequest: PropTypes.func,
  onCounterRequest: PropTypes.func,
  isSending: PropTypes.bool,
  activeTransactionId: PropTypes.string,
  onClearActiveTransaction: PropTypes.func,
};
