/**
 * Messaging Service
 *
 * Shared API layer for messaging operations used by both:
 * - MessagingPage (full page)
 * - HeaderMessagingPanel (compact dropdown)
 *
 * All calls go through the messages Edge Function which handles
 * enrichment, auth resolution, and visibility filtering server-side.
 *
 * Auth: Supports both modern Supabase JWT and legacy user_id fallback.
 */

import { supabase } from './supabase.js';
import { getUserId } from './secureStorage.js';

/**
 * Build authenticated request config for the messages edge function.
 * Prefers Supabase JWT; falls back to legacy user_id in payload.
 *
 * @returns {{ headers: Record<string, string>, authPayload: Record<string, string> }}
 */
async function getAuthConfig() {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers = { 'Content-Type': 'application/json' };
  const authPayload = {};

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    const legacyUserId = getUserId();
    if (legacyUserId) {
      authPayload.user_id = legacyUserId;
    } else {
      throw new Error('Not authenticated. Please log in again.');
    }
  }

  return { headers, authPayload };
}

/**
 * Call the messages edge function with the given action and payload.
 *
 * @param {string} action - Edge function action name
 * @param {Record<string, unknown>} payload - Action-specific payload
 * @returns {Promise<unknown>} - The `data` field from success response
 */
async function callMessagesEdge(action, payload = {}) {
  const { headers, authPayload } = await getAuthConfig();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action,
      payload: { ...authPayload, ...payload },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[messagingService] ${action} error:`, response.status, errorText);
    throw new Error(`Failed: ${action} (${response.status})`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error(data?.error || `Failed: ${action}`);
  }

  return data.data;
}

/**
 * Fetch all message threads for the authenticated user.
 * Server-side enrichment includes contact names, listing titles,
 * proposal statuses, unread counts, and visibility-aware previews.
 *
 * @returns {Promise<Array>} Enriched thread objects
 */
export async function fetchThreads() {
  const result = await callMessagesEdge('get_threads');
  return result?.threads || [];
}

/**
 * Fetch messages for a specific thread.
 * Server marks messages as read for the requesting user.
 *
 * @param {string} threadId
 * @returns {Promise<{ messages: Array, has_more: boolean, thread_info: object }>}
 */
export async function fetchMessages(threadId) {
  return await callMessagesEdge('get_messages', { thread_id: threadId });
}

/**
 * Send a message to an existing thread.
 *
 * @param {string} threadId
 * @param {string} messageBody
 * @returns {Promise<{ message_id: string, thread_id: string, is_new_thread: boolean }>}
 */
export async function sendMessage(threadId, messageBody) {
  return await callMessagesEdge('send_message', {
    thread_id: threadId,
    message_body: messageBody,
  });
}

/**
 * Send a message to a new conversation (no existing thread).
 *
 * @param {string} recipientUserId
 * @param {string} messageBody
 * @param {object} [options]
 * @param {string} [options.listingId]
 * @param {boolean} [options.sendWelcomeMessages]
 * @returns {Promise<{ message_id: string, thread_id: string, is_new_thread: boolean }>}
 */
export async function sendNewMessage(recipientUserId, messageBody, options = {}) {
  return await callMessagesEdge('send_message', {
    recipient_user_id: recipientUserId,
    message_body: messageBody,
    listing_id: options.listingId,
    send_welcome_messages: options.sendWelcomeMessages,
  });
}
