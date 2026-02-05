/**
 * ChatMessages Component
 *
 * Scrollable message list with auto-scroll to bottom.
 */

import React, { useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble.jsx';

/**
 * Scrollable message list container
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {string} props.currentUserId - Current user's ID
 * @param {Object} props.coTenant - Co-tenant user object
 * @param {Object} [props.roommate] - @deprecated Use coTenant
 * @param {function} props.onAccept - Callback when request is accepted
 * @param {function} props.onDecline - Callback when request is declined
 * @param {function} props.onCounter - Callback when counter is initiated
 */
export default function ChatMessages({
  messages,
  currentUserId,
  coTenant,
  roommate, // @deprecated - use coTenant
  onAccept,
  onDecline,
  onCounter
}) {
  // Support both new and deprecated prop names
  const resolvedCoTenant = coTenant || roommate;
  const listRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  // Scroll to bottom on initial load (no animation)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  if (!messages || messages.length === 0) {
    return (
      <div className="mobile-chat__messages mobile-chat__messages--empty" ref={listRef}>
        <div className="mobile-chat__empty-state">
          <span className="mobile-chat__empty-icon">💬</span>
          <p>No messages yet</p>
          <p className="mobile-chat__empty-hint">
            Send a message to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-chat__messages" ref={listRef}>
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isMine={msg.senderId === currentUserId}
          senderName={msg.senderId === currentUserId ? 'You' : resolvedCoTenant?.firstName || 'Co-tenant'}
          onAccept={onAccept}
          onDecline={onDecline}
          onCounter={onCounter}
        />
      ))}
    </div>
  );
}
