/**
 * Messaging Hook for ScheduleDashboard
 * @module hooks/useMessaging
 *
 * Manages messages and sending state.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing messaging state in ScheduleDashboard
 * @returns {object} Messaging state and handlers
 */
export function useMessaging() {
  // -------------------------------------------------------------------------
  // MESSAGING STATE
  // -------------------------------------------------------------------------
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Create a send message handler with leaseId bound
   * @param {string} leaseId - The lease ID for the API call
   * @param {string} currentUserId - The current user's ID
   * @param {function} sendMessageApi - The API function to send messages
   * @returns {function} Handler function that takes message text
   */
  const createSendMessageHandler = useCallback((leaseId, currentUserId, sendMessageApi) => {
    return async (text) => {
      if (!text.trim() || isSending) return;

      try {
        setIsSending(true);
        const newMessage = {
          id: `msg-${Date.now()}`,
          senderId: currentUserId,
          text: text,
          timestamp: new Date(),
          type: 'message'
        };

        setMessages(prev => [...prev, newMessage]);

        // Call API to send message
        if (sendMessageApi) {
          await sendMessageApi(leaseId, text);
        }

      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setIsSending(false);
      }
    };
  }, [isSending]);

  /**
   * Add a message to the messages array
   * @param {object} message - The message object to add
   */
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // State
    messages,
    isSending,

    // Handlers
    createSendMessageHandler,
    addMessage,

    // Direct setters (for cross-hook coordination)
    setMessages,
    setIsSending,
  };
}
