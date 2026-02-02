/**
 * Chat Thread Component
 *
 * Inline messaging with roommate:
 * - Message history (scrollable)
 * - Quick response chips
 * - Message input
 * - Inline transaction confirmations
 */

import React, { useState, useRef, useEffect } from 'react';
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

function MessageBubble({ message, isCurrentUser, onAccept, onDecline, onCounter }) {
  if (message.type === 'system') {
    return <TransactionNotice transaction={message.requestData} />;
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div
      className={`chat-bubble ${isCurrentUser ? 'chat-bubble--sent' : 'chat-bubble--received'} ${message.type === 'request' ? 'chat-bubble--request' : ''}`}
    >
      <div className="chat-bubble__content">
        {message.text || message.content}

        {message.type === 'request' && !isCurrentUser && (
          <div className="chat-bubble__actions">
            <button
              className="chat-bubble__btn chat-bubble__btn--accept"
              onClick={() => onAccept(message.id)}
            >
              Accept
            </button>
            <button
              className="chat-bubble__btn chat-bubble__btn--decline"
              onClick={() => onDecline(message.id)}
            >
              Decline
            </button>
            <button
              className="chat-bubble__btn chat-bubble__btn--counter"
              onClick={() => onCounter(message.id)}
            >
              Counter
            </button>
          </div>
        )}
      </div>
      <div className="chat-bubble__meta">
        <span className="chat-bubble__time">{formattedTime}</span>
      </div>
    </div>
  );
}

function TransactionNotice({ transaction }) {
  const getNoticeText = () => {
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
  onSendMessage,
  onAcceptRequest,
  onDeclineRequest,
  onCounterRequest,
  isSending = false
}) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        Chat with {roommateName || 'Split Partner'}
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
              isCurrentUser={msg.senderId === currentUserId}
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
    requestData: PropTypes.object,
  })),
  currentUserId: PropTypes.string,
  roommateName: PropTypes.string,
  onSendMessage: PropTypes.func,
  onAcceptRequest: PropTypes.func,
  onDeclineRequest: PropTypes.func,
  onCounterRequest: PropTypes.func,
  isSending: PropTypes.bool,
};
