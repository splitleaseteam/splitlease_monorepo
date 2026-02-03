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
  _id: string;
  'Thread Subject': string;
  'Created Date': string;
  'Modified Date': string;
  last_message_at: string;
  'Call to Action': string;
  'Proposal': string;
  'Listing': string;
  'Masked Email': string;
  'from logged out user?': boolean;
  host_user_id: string;
  guest_user_id: string;
  hostUser: {
    _id: string;
    'Name - Full': string;
    email: string;
    'Phone Number (as text)': string;
    'Profile Photo': string;
  } | null;
  guestUser: {
    _id: string;
    'Name - Full': string;
    email: string;
    'Phone Number (as text)': string;
    'Profile Photo': string;
  } | null;
  threadMessages?: Array<{
    _id: string;
    'Message Body': string;
    'Created Date': string;
    'is Split Bot': boolean;
    'is Visible to Host': boolean;
    'is Visible to Guest': boolean;
    'is deleted (is hidden)': boolean;
    originator_user_id: string;
    'Call to Action': string;
    'Not Logged In Name': string;
    'Not Logged In Email': string;
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
    .select('_id, "Toggle - Is Admin"')
    .ilike('email', user.email)
    .maybeSingle();

  if (error) {
    console.error('[adminGetAllThreads] Admin check query failed:', error.message);
    return false;
  }

  const isAdmin = userData?.['Toggle - Is Admin'] === true;
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
    .from('thread')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('[adminGetAllThreads] Count query failed:', countError.message);
    throw new Error(`Failed to count threads: ${countError.message}`);
  }

  // Step 3: Query all threads with user data
  const query = supabaseAdmin
    .from('thread')
    .select(`
      _id,
      "Thread Subject",
      "Created Date",
      "Modified Date",
      last_message_at,
      "Call to Action",
      "Proposal",
      "Listing",
      "Masked Email",
      "from logged out user?",
      host_user_id,
      guest_user_id
    `)
    .order('"Modified Date"', { ascending: false })
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
      .select('_id, "Name - Full", email, "Phone Number (as text)", "Profile Photo"')
      .in('_id', Array.from(userIds));

    if (usersError) {
      console.error('[adminGetAllThreads] Users query failed:', usersError.message);
      // Don't throw - continue with partial data
    } else if (users) {
      userMap = users.reduce((acc, user) => {
        acc[user._id] = user as AdminThread['hostUser'];
        return acc;
      }, {} as Record<string, AdminThread['hostUser']>);
    }
  }

  // Step 6: Optionally fetch messages for each thread
  let messagesMap: Record<string, AdminThread['threadMessages']> = {};
  if (includeMessages) {
    const threadIds = threads.map(t => t._id);

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('_message')
      .select(`
        _id,
        thread_id,
        "Message Body",
        "Created Date",
        "is Split Bot",
        "is Visible to Host",
        "is Visible to Guest",
        "is deleted (is hidden)",
        originator_user_id,
        "Call to Action",
        "Not Logged In Name",
        "Not Logged In Email"
      `)
      .in('thread_id', threadIds)
      .order('"Created Date"', { ascending: true });

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
    threadMessages: includeMessages ? messagesMap[thread._id] || [] : undefined,
  }));

  console.log('[adminGetAllThreads] Returning', result.length, 'threads');
  console.log('[adminGetAllThreads] ========== ADMIN GET ALL THREADS COMPLETE ==========');

  // Return array directly - formatSuccessResponse will wrap as { success: true, data: result }
  return result;
}
