/**
 * MobileChatView Component
 *
 * Full-screen chat layout for mobile ScheduleDashboard.
 * Contains message list and input bar.
 */

import React from 'react';
import ChatMessages from './ChatMessages.jsx';
import ChatInput from './ChatInput.jsx';

/**
 * Mobile chat view container
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {string} props.currentUserId - Current user's ID
 * @param {Object} props.coTenant - Co-tenant user object
 * @param {Object} [props.roommate] - @deprecated Use coTenant
 * @param {function} props.onSendMessage - Callback when message is sent
 * @param {function} props.onAccept - Callback when request is accepted
 * @param {function} props.onDecline - Callback when request is declined
 * @param {function} props.onCounter - Callback when counter is initiated
 */
export default function MobileChatView({
  messages,
  currentUserId,
  coTenant,
  roommate, // @deprecated - use coTenant
  onSendMessage,
  onAccept,
  onDecline,
  onCounter
}) {
  // Support both new and deprecated prop names
  const resolvedCoTenant = coTenant || roommate;

  return (
    <div className="mobile-chat">
      <ChatMessages
        messages={messages}
        currentUserId={currentUserId}
        coTenant={resolvedCoTenant}
        onAccept={onAccept}
        onDecline={onDecline}
        onCounter={onCounter}
      />
      <ChatInput onSend={onSendMessage} />
    </div>
  );
}
