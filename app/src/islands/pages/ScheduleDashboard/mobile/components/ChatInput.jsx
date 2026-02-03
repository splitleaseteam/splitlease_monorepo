/**
 * ChatInput Component
 *
 * Sticky bottom input bar for sending messages.
 */

import React, { useState, useRef, useCallback } from 'react';

/**
 * Chat input bar with auto-expanding textarea
 * @param {Object} props
 * @param {function} props.onSend - Callback when message is sent
 * @param {string} [props.placeholder='Type a message...'] - Input placeholder
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 */
export default function ChatInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText || disabled) return;

    onSend?.(trimmedText);
    setText('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="mobile-chat__input">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="mobile-chat__textarea"
        aria-label="Message input"
      />
      <button
        onClick={handleSubmit}
        disabled={!canSend}
        className="mobile-chat__send-btn"
        aria-label="Send message"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
