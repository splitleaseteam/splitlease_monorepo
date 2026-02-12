/**
 * Messaging Helpers
 * Split Lease - Native Supabase Messaging
 *
 * Helper functions for native message and thread creation.
 * All operations are Supabase-native.
 *
 * The database triggers handle:
 * - Broadcasting new messages to Realtime channels
 * - Updating thread's last message preview
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// ID GENERATION
// ============================================

/**
 * Generate a platform-compatible ID using the database function
 * Format: {13-digit-timestamp}x{17-digit-random}
 * Example: 1765872300914x25497779776179264
 */
export async function generatePlatformId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('generate_unique_id');

  if (error) {
    console.error('[messagingHelpers] Failed to generate ID:', error);
    // Fallback: generate client-side (same format)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1e17).toString().padStart(17, '0');
    return `${timestamp}x${random}`;
  }

  return data;
}

// ============================================
// USER LOOKUP
// ============================================

/**
 * Get user's platform ID from email
 * Maps auth.users.email -> public.user.legacy_platform_id
 */
export async function getUserPlatformId(
  supabase: SupabaseClient,
  userEmail: string
): Promise<string | null> {
  // Try the 'email' column first (case-insensitive)
  const normalizedEmail = userEmail.toLowerCase();

  const { data, error } = await supabase
    .from('user')
    .select('legacy_platform_id')
    .ilike('email', normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error('[messagingHelpers] User lookup failed:', error?.message, 'for email:', normalizedEmail);
    return null;
  }

  return data.legacy_platform_id;
}

/**
 * Get user profile by platform ID
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; firstName: string; lastName: string; avatar?: string } | null> {
  const { data, error } = await supabase
    .from('user')
    .select('legacy_platform_id, first_name, last_name, profile_photo_url')
    .eq('legacy_platform_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.legacy_platform_id,
    firstName: data.first_name || '',
    lastName: data.last_name || '',
    avatar: data.profile_photo_url,
  };
}

// ============================================
// THREAD OPERATIONS
// ============================================

export interface CreateThreadParams {
  hostUserId: string;
  guestUserId: string;
  listingId?: string;
  proposalId?: string;
  subject?: string;
  createdBy: string;
}

/**
 * Create a new thread (native Supabase)
 * Returns the new thread ID
 */
export async function createThread(
  supabase: SupabaseClient,
  params: CreateThreadParams
): Promise<string> {
  const threadId = await generatePlatformId(supabase);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('message_thread')
    .insert({
      id: threadId,
      host_user_id: params.hostUserId,
      guest_user_id: params.guestUserId,
      listing_id: params.listingId || null,
      proposal_id: params.proposalId || null,
      thread_subject_text: params.subject || null,
      created_by_user_id: params.createdBy,
      original_created_at: now,
      original_updated_at: now,
      participant_user_ids_json: [params.hostUserId, params.guestUserId],
      is_from_logged_out_user: false,
      created_at: now,
      updated_at: now,
    });

  if (error) {
    console.error('[messagingHelpers] Failed to create thread:', error);
    throw new Error(`Failed to create thread: ${error.message}`);
  }

  // Junction tables (thread_participant) are now auto-populated by database trigger
  // trigger_populate_thread_participant_junction handles this automatically on thread INSERT

  console.log('[messagingHelpers] Created thread:', threadId);
  return threadId;
}

/**
 * Find existing thread between two users for a listing
 * Returns thread ID if found, null otherwise
 */
export async function findExistingThread(
  supabase: SupabaseClient,
  hostUserId: string,
  guestUserId: string,
  listingId?: string
): Promise<string | null> {
  let query = supabase
    .from('message_thread')
    .select('id')
    .eq('host_user_id', hostUserId)
    .eq('guest_user_id', guestUserId);

  if (listingId) {
    query = query.eq('listing_id', listingId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('[messagingHelpers] Thread lookup error:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get thread by ID with participant info
 */
export async function getThread(
  supabase: SupabaseClient,
  threadId: string
): Promise<{ id: string; hostUser: string; guestUser: string; listing?: string } | null> {
  const { data, error } = await supabase
    .from('message_thread')
    .select('id, host_user_id, guest_user_id, listing_id')
    .eq('id', threadId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    hostUser: data.host_user_id,
    guestUser: data.guest_user_id,
    listing: data.listing_id,
  };
}

// ============================================
// MESSAGE OPERATIONS
// ============================================

export interface CreateMessageParams {
  threadId: string;
  messageBody: string;
  senderUserId: string;
  isSplitBot?: boolean;
  callToAction?: string;
  splitBotWarning?: string;
  visibleToHost?: boolean;
  visibleToGuest?: boolean;
}

/**
 * Create a new message (native Supabase)
 * The database trigger will automatically:
 * 1. Broadcast to Realtime channel
 * 2. Update thread's last message
 *
 * Returns the new message ID
 */
export async function createMessage(
  supabase: SupabaseClient,
  params: CreateMessageParams
): Promise<string> {
  const messageId = await generatePlatformId(supabase);
  const now = new Date().toISOString();

  // Get thread info to determine host/guest
  const thread = await getThread(supabase, params.threadId);

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Determine unread users (everyone except sender)
  const unreadUsers = [thread.hostUser, thread.guestUser]
    .filter(id => id && id !== params.senderUserId);

  const { error } = await supabase
    .from('thread_message')
    .insert({
      id: messageId,
      thread_id: params.threadId,
      message_body_text: params.messageBody,
      sender_user_id: params.senderUserId,
      host_user_id: thread.hostUser,
      guest_user_id: thread.guestUser,
      is_from_split_bot: params.isSplitBot || false,
      is_visible_to_host: params.visibleToHost ?? true,
      is_visible_to_guest: params.visibleToGuest ?? true,
      is_forwarded_message: false,
      is_hidden_or_deleted: false,
      call_to_action_button_label: params.callToAction || null,
      split_bot_warning_text: params.splitBotWarning || null,
      unread_by_user_ids_json: unreadUsers,
      original_created_at: now,
      original_updated_at: now,
      created_by_user_id: params.senderUserId,
      created_at: now,
      updated_at: now,
      is_pending_migration: false,
    });

  if (error) {
    console.error('[messagingHelpers] Failed to create message:', error);
    throw new Error(`Failed to create message: ${error.message}`);
  }

  console.log('[messagingHelpers] Created message:', messageId);
  return messageId;
}

/**
 * Mark messages as read by removing user from unread_by_user_ids_json
 */
export async function markMessagesAsRead(
  supabase: SupabaseClient,
  messageIds: string[],
  userId: string
): Promise<void> {
  for (const messageId of messageIds) {
    const { data: message } = await supabase
      .from('thread_message')
      .select('unread_by_user_ids_json')
      .eq('id', messageId)
      .single();

    if (message && Array.isArray(message.unread_by_user_ids_json)) {
      const updatedUnread = message.unread_by_user_ids_json.filter((id: string) => id !== userId);

      await supabase
        .from('thread_message')
        .update({ unread_by_user_ids_json: updatedUnread })
        .eq('id', messageId);
    }
  }
}

/**
 * Get unread message count for a user in a thread
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  threadId: string,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('thread_message')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId)
    .contains('unread_by_user_ids_json', [userId]);

  if (error) {
    console.error('[messagingHelpers] Failed to get unread count:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// PROPOSAL THREAD OPERATIONS
// ============================================

/**
 * Find existing thread for a proposal
 * Returns thread ID if found, null otherwise
 */
export async function findThreadByProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('message_thread')
    .select('id')
    .eq('proposal_id', proposalId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[messagingHelpers] Thread lookup by proposal error:', error);
    return null;
  }

  return data?.id || null;
}

/**
 * Get listing name by ID
 */
export async function getListingName(
  supabase: SupabaseClient,
  listingId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('listing')
    .select('listing_title')
    .eq('legacy_platform_id', listingId)
    .single();

  if (error || !data) {
    console.error('[messagingHelpers] Listing lookup error:', error);
    return null;
  }

  return data.listing_title || null;
}

export interface CreateProposalThreadParams {
  proposalId: string;
  hostUserId: string;
  guestUserId: string;
  listingId: string;
  listingName: string;
}

/**
 * Create a new thread for a proposal
 * Uses listing name as thread subject
 * Returns the new thread ID
 */
export async function createProposalThread(
  supabase: SupabaseClient,
  params: CreateProposalThreadParams
): Promise<string> {
  const threadId = await createThread(supabase, {
    hostUserId: params.hostUserId,
    guestUserId: params.guestUserId,
    listingId: params.listingId,
    proposalId: params.proposalId,
    subject: params.listingName,
    createdBy: params.guestUserId, // Proposals are initiated by guests
  });

  console.log('[messagingHelpers] Created proposal thread:', threadId, 'for proposal:', params.proposalId);
  return threadId;
}

/**
 * Find or create a thread for a proposal
 * Returns { threadId, isNew }
 *
 * Logic:
 * 1. First check if thread already exists for this proposal
 * 2. If not, check if thread exists for same listing+guest (from ContactHost)
 * 3. If found, update that thread with the proposal ID
 * 4. If nothing found, create a new thread
 */
export async function findOrCreateProposalThread(
  supabase: SupabaseClient,
  params: CreateProposalThreadParams
): Promise<{ threadId: string; isNew: boolean }> {
  // First, check if thread already exists for this proposal
  const existingThreadByProposal = await findThreadByProposal(supabase, params.proposalId);

  if (existingThreadByProposal) {
    console.log('[messagingHelpers] Found existing thread for proposal:', existingThreadByProposal);
    return { threadId: existingThreadByProposal, isNew: false };
  }

  // Second, check if thread exists for the same listing+guest (from ContactHost flow)
  const existingThreadByListing = await findExistingThread(
    supabase,
    params.hostUserId,
    params.guestUserId,
    params.listingId
  );

  if (existingThreadByListing) {
    console.log('[messagingHelpers] Found existing thread for listing+guest, updating with proposal:', existingThreadByListing);

    // Update the existing thread to link it to this proposal
    const { error: updateError } = await supabase
      .from('message_thread')
      .update({
        proposal_id: params.proposalId,
        original_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingThreadByListing);

    if (updateError) {
      console.error('[messagingHelpers] Failed to update thread with proposal:', updateError);
      // Continue anyway - thread exists, just won't be linked
    }

    return { threadId: existingThreadByListing, isNew: false };
  }

  // Create new thread
  const newThreadId = await createProposalThread(supabase, params);
  return { threadId: newThreadId, isNew: true };
}

// ============================================
// SPLITBOT MESSAGE OPERATIONS
// ============================================

export interface CreateSplitBotMessageParams {
  threadId: string;
  messageBody: string;
  callToAction: string; // CTA display name (FK to os_messaging_cta.display)
  visibleToHost: boolean;
  visibleToGuest: boolean;
  splitBotWarning?: string;
  recipientUserId: string; // The user who should see this as unread
}

/**
 * SplitBot user ID - constant for automated messages
 */
export const SPLITBOT_USER_ID = '1634177189464x117577733821174320';

/**
 * Create a SplitBot automated message
 * Sets is_from_split_bot = true and is_forwarded_message = true (per legacy pattern)
 */
export async function createSplitBotMessage(
  supabase: SupabaseClient,
  params: CreateSplitBotMessageParams
): Promise<string> {
  const messageId = await generatePlatformId(supabase);
  const now = new Date().toISOString();

  // Get thread info for host/guest IDs
  const thread = await getThread(supabase, params.threadId);
  if (!thread) {
    throw new Error('Thread not found');
  }

  const { error } = await supabase
    .from('thread_message')
    .insert({
      id: messageId,
      thread_id: params.threadId,
      message_body_text: params.messageBody,
      sender_user_id: SPLITBOT_USER_ID,
      host_user_id: thread.hostUser,
      guest_user_id: thread.guestUser,
      is_from_split_bot: true,
      is_forwarded_message: true, // SplitBot messages are marked as forwarded per legacy pattern
      is_visible_to_host: params.visibleToHost,
      is_visible_to_guest: params.visibleToGuest,
      is_hidden_or_deleted: false,
      call_to_action_button_label: params.callToAction,
      split_bot_warning_text: params.splitBotWarning || null,
      unread_by_user_ids_json: [params.recipientUserId],
      original_created_at: now,
      original_updated_at: now,
      created_by_user_id: SPLITBOT_USER_ID,
      created_at: now,
      updated_at: now,
      is_pending_migration: false,
    });

  if (error) {
    console.error('[messagingHelpers] Failed to create SplitBot message:', error);
    throw new Error(`Failed to create SplitBot message: ${error.message}`);
  }

  console.log('[messagingHelpers] Created SplitBot message:', messageId);
  return messageId;
}

/**
 * Update thread's last message info after sending a message
 */
export async function updateThreadLastMessage(
  supabase: SupabaseClient,
  threadId: string,
  messageBody: string
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('message_thread')
    .update({
      last_message_preview_text: messageBody.substring(0, 100), // Truncate for preview
      last_message_sent_at: now,
      original_updated_at: now,
      updated_at: now,
    })
    .eq('id', threadId);

  if (error) {
    console.error('[messagingHelpers] Failed to update thread last message:', error);
    // Non-blocking - don't throw
  }
}

// ============================================
// THREAD PREVIEW OPERATIONS
// ============================================

export interface LastVisibleMessageResult {
  threadId: string;
  messageBody: string;
  createdDate: string;
}

/**
 * Get the last visible message for multiple threads based on user role
 * This computes the correct preview for each user based on visibility flags
 *
 * @param supabase - Supabase client
 * @param threadIds - Array of thread IDs to fetch last messages for
 * @param threadUserRoles - Map of threadId -> 'host' | 'guest' indicating user's role in each thread
 * @returns Map of threadId -> last visible message body
 */
export async function getLastVisibleMessagesForThreads(
  supabase: SupabaseClient,
  threadIds: string[],
  threadUserRoles: Map<string, 'host' | 'guest'>
): Promise<Map<string, string>> {
  if (threadIds.length === 0) {
    return new Map();
  }

  // Fetch all recent messages for these threads with visibility info
  // We fetch the most recent messages per thread, then filter by visibility
  const { data: messages, error } = await supabase
    .from('thread_message')
    .select('thread_id, message_body_text, original_created_at, is_visible_to_host, is_visible_to_guest')
    .in('thread_id', threadIds)
    .order('original_created_at', { ascending: false });

  if (error) {
    console.error('[messagingHelpers] Failed to fetch messages for preview:', error);
    return new Map();
  }

  if (!messages || messages.length === 0) {
    return new Map();
  }

  // Group messages by thread and find the most recent visible one for each user
  const resultMap = new Map<string, string>();

  for (const threadId of threadIds) {
    const role = threadUserRoles.get(threadId);
    if (!role) continue;

    // Find the most recent message visible to this user in this thread
    const visibleMessage = messages.find(msg => {
      if (msg.thread_id !== threadId) return false;

      // Check visibility based on user's role in this thread
      if (role === 'host') {
        return msg.is_visible_to_host === true;
      } else {
        return msg.is_visible_to_guest === true;
      }
    });

    if (visibleMessage && visibleMessage.message_body_text) {
      resultMap.set(threadId, visibleMessage.message_body_text.substring(0, 100));
    }
  }

  return resultMap;
}
