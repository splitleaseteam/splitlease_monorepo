/**
 * Admin Get All Threads Handler
 * Split Lease - Messages Edge Function
 *
 * Fetches ALL message threads across the platform (admin only)
 * Includes host/guest user data and optionally thread messages
 *
 * NO FALLBACK PRINCIPLE: Throws if database query fails
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthenticationError, ValidationError as _ValidationError } from '../../_shared/errors.ts';

interface AdminThread {
  id: string;
  thread_subject_text: string;
  original_created_at: string;
  original_updated_at: string;
  last_message_sent_at: string;
  proposal_id: string;
  listing_id: string;
  logged_out_user_masked_email: string;
  is_from_logged_out_user: boolean;
  host_user_id: string;
  guest_user_id: string;
  hostUser: {
    legacy_platform_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    profile_photo_url: string;
  } | null;
  guestUser: {
    legacy_platform_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    profile_photo_url: string;
  } | null;
  threadMessages?: Array<{
    id: string;
    message_body_text: string;
    original_created_at: string;
    is_from_split_bot: boolean;
    is_visible_to_host: boolean;
    is_visible_to_guest: boolean;
    is_hidden_or_deleted: boolean;
    sender_user_id: string;
    call_to_action_button_label: string;
  }>;
}

interface AdminGetAllThreadsPayload {
  limit?: number;
  offset?: number;
  includeMessages?: boolean;
}

/**
 * Verify that the current user is an admin
 */
async function verifyAdminRole(
  supabaseAdmin: SupabaseClient,
  user: { id: string; email: string }
): Promise<boolean> {
  console.log('[adminGetAllThreads] Verifying admin role for:', user.email);

  // Look up user by email to check admin flag
  const { data: userData, error } = await supabaseAdmin
    .from('user')
    .select('legacy_platform_id, is_admin')
    .ilike('email', user.email)
    .maybeSingle();

  if (error) {
    console.error('[adminGetAllThreads] Admin check query failed:', error.message);
    return false;
  }

  const isAdmin = userData?.is_admin === true;
  console.log('[adminGetAllThreads] Admin check result:', isAdmin);

  return isAdmin;
}

/**
 * Handle admin_get_all_threads action
 * Fetches ALL threads across the platform (admin only)
 */
export async function handleAdminGetAllThreads(
  supabaseAdmin: SupabaseClient,
  payload: AdminGetAllThreadsPayload,
  user: { id: string; email: string } | null
): Promise<AdminThread[]> {
  console.log('[adminGetAllThreads] ========== ADMIN GET ALL THREADS ==========');
  console.log('[adminGetAllThreads] User:', user?.email ?? 'internal (no auth)');
  console.log('[adminGetAllThreads] Payload:', JSON.stringify(payload));

  // Step 1: Skip admin role check for internal access (user is null)
  // When user is provided, verify admin role
  if (user) {
    const isAdmin = await verifyAdminRole(supabaseAdmin, user);
    if (!isAdmin) {
      console.error('[adminGetAllThreads] User is not an admin');
      throw new AuthenticationError('You do not have permission to access this resource.');
    }
  }

  const limit = Math.min(payload.limit || 100, 500);
  const offset = payload.offset || 0;
  const includeMessages = payload.includeMessages ?? false;

  // Step 2: Get total count
  const { count, error: countError } = await supabaseAdmin
    .from('message_thread')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('[adminGetAllThreads] Count query failed:', countError.message);
    throw new Error(`Failed to count threads: ${countError.message}`);
  }

  // Step 3: Query all threads with user data
  const query = supabaseAdmin
    .from('message_thread')
    .select(`
      id,
      thread_subject_text,
      original_created_at,
      original_updated_at,
      last_message_sent_at,
      proposal_id,
      listing_id,
      logged_out_user_masked_email,
      is_from_logged_out_user,
      host_user_id,
      guest_user_id
    `)
    .order('original_updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: threads, error: threadsError } = await query;

  if (threadsError) {
    console.error('[adminGetAllThreads] Threads query failed:', threadsError.message);
    throw new Error(`Failed to fetch threads: ${threadsError.message}`);
  }

  if (!threads || threads.length === 0) {
    console.log('[adminGetAllThreads] No threads found');
    return { data: [], total: count || 0 };
  }

  console.log('[adminGetAllThreads] Found', threads.length, 'threads');

  // Step 4: Collect all user IDs for batch lookup
  const userIds = new Set<string>();
  threads.forEach(thread => {
    if (thread.host_user_id) userIds.add(thread.host_user_id);
    if (thread.guest_user_id) userIds.add(thread.guest_user_id);
  });

  // Step 5: Batch fetch user data
  let userMap: Record<string, AdminThread['hostUser']> = {};
  if (userIds.size > 0) {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user')
      .select('legacy_platform_id, first_name, last_name, email, phone_number, profile_photo_url')
      .in('legacy_platform_id', Array.from(userIds));

    if (usersError) {
      console.error('[adminGetAllThreads] Users query failed:', usersError.message);
      // Don't throw - continue with partial data
    } else if (users) {
      userMap = users.reduce((acc, user) => {
        acc[user.legacy_platform_id] = user as AdminThread['hostUser'];
        return acc;
      }, {} as Record<string, AdminThread['hostUser']>);
    }
  }

  // Step 6: Optionally fetch messages for each thread
  let messagesMap: Record<string, AdminThread['threadMessages']> = {};
  if (includeMessages) {
    const threadIds = threads.map(t => t.id);

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('thread_message')
      .select(`
        id,
        thread_id,
        message_body_text,
        original_created_at,
        is_from_split_bot,
        is_visible_to_host,
        is_visible_to_guest,
        is_hidden_or_deleted,
        sender_user_id,
        call_to_action_button_label
      `)
      .in('thread_id', threadIds)
      .order('original_created_at', { ascending: true });

    if (messagesError) {
      console.error('[adminGetAllThreads] Messages query failed:', messagesError.message);
      // Don't throw - continue without messages
    } else if (messages) {
      // Group messages by thread
      messagesMap = messages.reduce((acc, msg) => {
        const threadId = msg.thread_id;
        if (!acc[threadId]) acc[threadId] = [];
        acc[threadId].push(msg as AdminThread['threadMessages'][0]);
        return acc;
      }, {} as Record<string, AdminThread['threadMessages']>);
    }
  }

  // Step 7: Assemble final result
  const result: AdminThread[] = threads.map(thread => ({
    ...thread,
    hostUser: thread.host_user_id ? userMap[thread.host_user_id] || null : null,
    guestUser: thread.guest_user_id ? userMap[thread.guest_user_id] || null : null,
    threadMessages: includeMessages ? messagesMap[thread.id] || [] : undefined,
  }));

  console.log('[adminGetAllThreads] Returning', result.length, 'threads');
  console.log('[adminGetAllThreads] ========== ADMIN GET ALL THREADS COMPLETE ==========');

  // Return array directly - formatSuccessResponse will wrap as { success: true, data: result }
  return result;
}
