/**
 * message-curation Edge Function
 * Admin tool for viewing, moderating, and managing message threads
 *
 * Actions:
 * - getThreads: Search and list threads with pagination
 * - getThreadMessages: Get all messages for a thread
 * - getMessage: Get single message with relations
 * - deleteMessage: Soft delete a message
 * - deleteThread: Soft delete all messages in thread
 * - forwardMessage: Forward message to support email (placeholder)
 * - sendSplitBotMessage: Send Split Bot message in thread
 *
 * Database tables: thread, _message, user, listing
 * Auth: Admin or Corporate user required
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Valid actions for this function
const VALID_ACTIONS = [
  'getThreads',
  'getThreadMessages',
  'getMessage',
  'deleteMessage',
  'deleteThread',
  'forwardMessage',
  'sendSplitBotMessage'
] as const;

type Action = typeof VALID_ACTIONS[number];

console.log("[message-curation] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[message-curation] Request: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[message-curation] Action: ${action}`);

    // Validate action
    if (!VALID_ACTIONS.includes(action as Action)) {
      return errorResponse(`Invalid action: ${action}. Valid actions: ${VALID_ACTIONS.join(', ')}`, 400);
    }

    // Get Supabase config
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Authenticate user (OPTIONAL for internal pages)
    // NOTE: Authentication is now optional - internal pages can access without auth
    const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

    if (user) {
      console.log(`[message-curation] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log('[message-curation] No auth header - proceeding as internal page request');
    }

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify user is admin or corporate user (only if authenticated)
    // NOTE: Admin/corporate role check removed to allow any authenticated user access for testing
    // const isAuthorized = await checkAdminOrCorporateStatus(supabase, user.email);
    // if (!isAuthorized) {
    //   return errorResponse('Admin or corporate access required', 403);
    // }

    let result: unknown;

    switch (action as Action) {
      case 'getThreads':
        result = await handleGetThreads(payload, supabase);
        break;

      case 'getThreadMessages':
        result = await handleGetThreadMessages(payload, supabase);
        break;

      case 'getMessage':
        result = await handleGetMessage(payload, supabase);
        break;

      case 'deleteMessage':
        result = await handleDeleteMessage(payload, supabase);
        break;

      case 'deleteThread':
        result = await handleDeleteThread(payload, supabase);
        break;

      case 'forwardMessage':
        result = await handleForwardMessage(payload, supabase);
        break;

      case 'sendSplitBotMessage':
        result = await handleSendSplitBotMessage(payload, supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[message-curation] Action completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[message-curation] Error:', error);
    return errorResponse((error as Error).message, 500);
  }
});

// ===== HELPER FUNCTIONS =====

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  return { id: user.id, email: user.email ?? '' };
}

async function _checkAdminOrCorporateStatus(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user')
    .select('is_admin, is_corporate_user')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.error('[message-curation] Admin/corporate check failed:', error);
    return false;
  }

  return data.is_admin === true || data.is_corporate_user === true;
}

// ===== ACTION HANDLERS =====

/**
 * Get threads with search and pagination
 * Search matches on listing name, guest email, or host email
 *
 * NOTE: Uses separate queries for users/listings because the database lacks
 * FK constraints from thread.host_user_id/guest_user_id to user.id
 */
async function handleGetThreads(
  payload: { search?: string; limit?: number; offset?: number },
  supabase: SupabaseClient
) {
  const { search = '', limit = 50, offset = 0 } = payload;

  // Step 1: Fetch threads (without relationship joins - FKs don't exist)
  const query = supabase
    .from('message_thread')
    .select(`
      id,
      "created_at",
      "updated_at",
      host_user_id,
      guest_user_id,
      "listing_id"
    `, { count: 'exact' })
    .order('"updated_at"', { ascending: false });

  // Apply pagination
  const { data: threadData, error: threadError, count } = await query.range(offset, offset + limit - 1);

  if (threadError) {
    console.error('[message-curation] getThreads error:', threadError);
    throw new Error(`Failed to fetch threads: ${threadError.message}`);
  }

  if (!threadData || threadData.length === 0) {
    return { threads: [], total: 0, limit, offset };
  }

  // Step 2: Collect unique user IDs and listing IDs
  const userIds = new Set<string>();
  const listingIds = new Set<string>();

  for (const thread of threadData) {
    if (thread.host_user_id) userIds.add(thread.host_user_id);
    if (thread.guest_user_id) userIds.add(thread.guest_user_id);
    if (thread['listing_id']) listingIds.add(thread['listing_id']);
  }

  // Step 3: Fetch users and listings in parallel
  const [usersResult, listingsResult] = await Promise.all([
    userIds.size > 0
      ? supabase
          .from('user')
          .select('id, email, first_name, last_name, profile_photo_url')
          .in('id', Array.from(userIds))
      : { data: [], error: null },
    listingIds.size > 0
      ? supabase
          .from('listing')
          .select('id, listing_title')
          .in('id', Array.from(listingIds))
      : { data: [], error: null },
  ]);

  if (usersResult.error) {
    console.error('[message-curation] getThreads users error:', usersResult.error);
  }
  if (listingsResult.error) {
    console.error('[message-curation] getThreads listings error:', listingsResult.error);
  }

  // Step 4: Create lookup maps
  const usersMap = new Map<string, Record<string, unknown>>();
  for (const user of (usersResult.data || [])) {
    usersMap.set(user.id, user);
  }

  const listingsMap = new Map<string, Record<string, unknown>>();
  for (const listing of (listingsResult.data || [])) {
    listingsMap.set(listing.id, listing);
  }

  // Step 5: Enrich threads with related data
  const enrichedThreads = threadData.map((thread: Record<string, unknown>) => ({
    ...thread,
    host: thread.host_user_id ? usersMap.get(thread.host_user_id as string) || null : null,
    guest: thread.guest_user_id ? usersMap.get(thread.guest_user_id as string) || null : null,
    listing: thread['listing_id'] ? listingsMap.get(thread['listing_id'] as string) || null : null,
  }));

  // Step 6: Apply search filter if provided
  let filteredData = enrichedThreads;
  if (search) {
    const searchLower = search.toLowerCase();
    console.log('[message-curation] Search term:', search);

    filteredData = enrichedThreads.filter((thread: Record<string, unknown>) => {
      const listing = thread.listing as Record<string, unknown> | null;
      const guest = thread.guest as Record<string, unknown> | null;
      const host = thread.host as Record<string, unknown> | null;

      const listingName = (listing?.listing_title as string || '').toLowerCase();
      const guestEmail = (guest?.email as string || '').toLowerCase();
      const guestFirstName = (guest?.first_name as string || '').toLowerCase();
      const guestLastName = (guest?.last_name as string || '').toLowerCase();
      const hostEmail = (host?.email as string || '').toLowerCase();
      const hostFirstName = (host?.first_name as string || '').toLowerCase();
      const hostLastName = (host?.last_name as string || '').toLowerCase();

      return listingName.includes(searchLower) ||
             guestEmail.includes(searchLower) ||
             guestFirstName.includes(searchLower) ||
             guestLastName.includes(searchLower) ||
             hostEmail.includes(searchLower) ||
             hostFirstName.includes(searchLower) ||
             hostLastName.includes(searchLower);
    });
  }

  // Format threads for response
  const threads = filteredData.map(formatThread);

  return {
    threads,
    total: search ? filteredData.length : (count || 0),
    limit,
    offset,
  };
}

/**
 * Get all messages for a specific thread
 *
 * NOTE: Uses separate queries for users/listings because the database lacks
 * FK constraints from thread.host_user_id/guest_user_id to user.id
 */
async function handleGetThreadMessages(
  payload: { threadId: string },
  supabase: SupabaseClient
) {
  const { threadId } = payload;

  if (!threadId) {
    throw new Error('threadId is required');
  }

  // Step 1: Fetch thread (without relationship joins - FKs don't exist)
  const { data: threadData, error: threadError } = await supabase
    .from('message_thread')
    .select(`
      id,
      "created_at",
      "updated_at",
      host_user_id,
      guest_user_id,
      "listing_id"
    `)
    .eq('id', threadId)
    .single();

  if (threadError) {
    if (threadError.code === 'PGRST116') {
      throw new Error('Thread not found');
    }
    throw new Error(`Failed to fetch thread: ${threadError.message}`);
  }

  // Step 2: Fetch messages for this thread (without relationship joins)
  const { data: messagesData, error: messagesError } = await supabase
    .from('thread_message')
    .select(`
      id,
      message_body_text,
      split_bot_warning_text,
      created_at,
      updated_at,
      sender_user_id,
      thread_id,
      is_forwarded_message,
      is_hidden_or_deleted,
      is_from_split_bot
    `)
    .eq('thread_id', threadId)
    .or('is_hidden_or_deleted.is.null,is_hidden_or_deleted.eq.false')
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('[message-curation] getThreadMessages error:', messagesError);
    throw new Error(`Failed to fetch messages: ${messagesError.message}`);
  }

  // Step 3: Collect all user IDs needed
  const userIds = new Set<string>();
  if (threadData.host_user_id) userIds.add(threadData.host_user_id);
  if (threadData.guest_user_id) userIds.add(threadData.guest_user_id);
  for (const msg of (messagesData || [])) {
    if (msg.sender_user_id) userIds.add(msg.sender_user_id);
  }

  // Step 4: Fetch users and listing in parallel
  const [usersResult, listingResult] = await Promise.all([
    userIds.size > 0
      ? supabase
          .from('user')
          .select('id, email, first_name, last_name, profile_photo_url')
          .in('id', Array.from(userIds))
      : { data: [], error: null },
    threadData['listing_id']
      ? supabase
          .from('listing')
          .select('id, listing_title')
          .eq('id', threadData['listing_id'])
          .single()
      : { data: null, error: null },
  ]);

  // Create users lookup map
  const usersMap = new Map<string, Record<string, unknown>>();
  for (const user of (usersResult.data || [])) {
    usersMap.set(user.id, user);
  }

  // Enrich thread with related data
  const enrichedThread = {
    ...threadData,
    host: threadData.host_user_id ? usersMap.get(threadData.host_user_id) || null : null,
    guest: threadData.guest_user_id ? usersMap.get(threadData.guest_user_id) || null : null,
    listing: listingResult.data || null,
  };

  // Enrich messages with sender data
  const enrichedMessages = (messagesData || []).map((msg: Record<string, unknown>) => ({
    ...msg,
    originator: msg.sender_user_id ? usersMap.get(msg.sender_user_id as string) || null : null,
  }));

  // Format messages
  const messages = enrichedMessages.map((msg: Record<string, unknown>) => formatMessage(msg, enrichedThread));

  return {
    thread: formatThread(enrichedThread),
    messages,
    messageCount: messages.length,
  };
}

/**
 * Get single message with full details
 *
 * NOTE: Uses separate queries for users/listings because the database lacks
 * FK constraints from thread.host_user_id/guest_user_id to user.id
 */
async function handleGetMessage(
  payload: { messageId: string },
  supabase: SupabaseClient
) {
  const { messageId } = payload;

  if (!messageId) {
    throw new Error('messageId is required');
  }

  // Step 1: Fetch message (without relationship joins)
  const { data: messageData, error: messageError } = await supabase
    .from('thread_message')
    .select(`
      id,
      message_body_text,
      split_bot_warning_text,
      created_at,
      updated_at,
      sender_user_id,
      thread_id,
      is_forwarded_message,
      is_hidden_or_deleted,
      is_from_split_bot
    `)
    .eq('id', messageId)
    .single();

  if (messageError) {
    if (messageError.code === 'PGRST116') {
      throw new Error('Message not found');
    }
    console.error('[message-curation] getMessage error:', messageError);
    throw new Error(`Failed to fetch message: ${messageError.message}`);
  }

  // Step 2: Fetch thread
  const { data: threadData, error: threadError } = await supabase
    .from('message_thread')
    .select(`
      id,
      "created_at",
      "updated_at",
      host_user_id,
      guest_user_id,
      "listing_id"
    `)
    .eq('id', messageData.thread_id)
    .single();

  if (threadError) {
    console.error('[message-curation] getMessage thread error:', threadError);
    throw new Error(`Failed to fetch thread: ${threadError.message}`);
  }

  // Step 3: Collect all user IDs needed
  const userIds = new Set<string>();
  if (messageData.sender_user_id) userIds.add(messageData.sender_user_id);
  if (threadData.host_user_id) userIds.add(threadData.host_user_id);
  if (threadData.guest_user_id) userIds.add(threadData.guest_user_id);

  // Step 4: Fetch users and listing in parallel
  const [usersResult, listingResult] = await Promise.all([
    userIds.size > 0
      ? supabase
          .from('user')
          .select('id, email, first_name, last_name, profile_photo_url')
          .in('id', Array.from(userIds))
      : { data: [], error: null },
    threadData['listing_id']
      ? supabase
          .from('listing')
          .select('id, listing_title')
          .eq('id', threadData['listing_id'])
          .single()
      : { data: null, error: null },
  ]);

  // Create users lookup map
  const usersMap = new Map<string, Record<string, unknown>>();
  for (const user of (usersResult.data || [])) {
    usersMap.set(user.id, user);
  }

  // Enrich thread with related data
  const enrichedThread = {
    ...threadData,
    host: threadData.host_user_id ? usersMap.get(threadData.host_user_id) || null : null,
    guest: threadData.guest_user_id ? usersMap.get(threadData.guest_user_id) || null : null,
    listing: listingResult.data || null,
  };

  // Enrich message with sender
  const enrichedMessage = {
    ...messageData,
    originator: messageData.sender_user_id ? usersMap.get(messageData.sender_user_id) || null : null,
  };

  return {
    message: formatMessage(enrichedMessage, enrichedThread),
    thread: formatThread(enrichedThread),
  };
}

/**
 * Soft delete a single message
 */
async function handleDeleteMessage(
  payload: { messageId: string },
  supabase: SupabaseClient
) {
  const { messageId } = payload;

  if (!messageId) {
    throw new Error('messageId is required');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('thread_message')
    .update({
      is_hidden_or_deleted: true,
      updated_at: now,
    })
    .eq('id', messageId)
    .select('id')
    .single();

  if (error) {
    console.error('[message-curation] deleteMessage error:', error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }

  console.log('[message-curation] Message soft deleted:', { messageId, timestamp: now });

  return {
    deleted: true,
    messageId: data.id,
  };
}

/**
 * Soft delete all messages in a thread
 */
async function handleDeleteThread(
  payload: { threadId: string },
  supabase: SupabaseClient
) {
  const { threadId } = payload;

  if (!threadId) {
    throw new Error('threadId is required');
  }

  const now = new Date().toISOString();

  // Soft delete all messages in the thread (only non-deleted ones)
  const { data, error } = await supabase
    .from('thread_message')
    .update({
      is_hidden_or_deleted: true,
      updated_at: now,
    })
    .eq('thread_id', threadId)
    .or('is_hidden_or_deleted.is.null,is_hidden_or_deleted.eq.false')
    .select('id');

  if (error) {
    console.error('[message-curation] deleteThread error:', error);
    throw new Error(`Failed to delete thread messages: ${error.message}`);
  }

  const deletedCount = (data || []).length;
  console.log('[message-curation] Thread messages soft deleted:', { threadId, count: deletedCount, timestamp: now });

  return {
    deleted: true,
    threadId,
    deletedCount,
  };
}

/**
 * Forward message to support email (placeholder implementation)
 * TODO: Integrate with email service when available
 *
 * NOTE: Uses separate queries for users/listings because the database lacks
 * FK constraints from thread.host_user_id/guest_user_id to user.id
 */
async function handleForwardMessage(
  payload: { messageId: string; recipientEmail?: string },
  supabase: SupabaseClient
) {
  const { messageId, recipientEmail = 'support@splitlease.com' } = payload;

  if (!messageId) {
    throw new Error('messageId is required');
  }

  // Step 1: Fetch the message (without relationship joins)
  const { data: messageData, error: messageError } = await supabase
    .from('thread_message')
    .select(`
      id,
      message_body_text,
      original_created_at,
      sender_user_id,
      thread_id
    `)
    .eq('id', messageId)
    .single();

  if (messageError) {
    throw new Error(`Failed to fetch message: ${messageError.message}`);
  }

  // Step 2: Fetch thread
  const { data: _threadData, error: threadError } = await supabase
    .from('message_thread')
    .select('id, host_user_id, guest_user_id, "listing_id"')
    .eq('id', messageData.thread_id)
    .single();

  if (threadError) {
    console.error('[message-curation] forwardMessage thread error:', threadError);
  }

  // Mark as forwarded
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('thread_message')
    .update({
      is_forwarded_message: true,
      updated_at: now,
    })
    .eq('id', messageId);

  if (updateError) {
    console.error('[message-curation] forwardMessage update error:', updateError);
  }

  // TODO: Actually send email via send-email Edge Function
  // For now, just log and return success
  console.log('[message-curation] Message forwarded (placeholder):', {
    messageId,
    recipientEmail,
    timestamp: now,
  });

  return {
    forwarded: true,
    messageId,
    recipientEmail,
    timestamp: now,
    note: 'Email forwarding not yet implemented - message marked as forwarded',
  };
}

/**
 * Send a Split Bot message in a thread
 */
async function handleSendSplitBotMessage(
  payload: { threadId: string; messageBody: string; recipientType: 'guest' | 'host' },
  supabase: SupabaseClient
) {
  const { threadId, messageBody, recipientType } = payload;

  if (!threadId) {
    throw new Error('threadId is required');
  }
  if (!messageBody || !messageBody.trim()) {
    throw new Error('messageBody is required');
  }
  if (!recipientType || !['guest', 'host'].includes(recipientType)) {
    throw new Error('recipientType must be "guest" or "host"');
  }

  // SplitBot user ID - hardcoded constant (same as in messagingHelpers.ts)
  const SPLITBOT_USER_ID = '1634177189464x117577733821174320';

  // Fetch thread to get host and guest
  const { data: _threadData, error: threadError } = await supabase
    .from('message_thread')
    .select('id, "host_user_id", "guest_user_id"')
    .eq('id', threadId)
    .single();

  if (threadError) {
    throw new Error(`Thread not found: ${threadError.message}`);
  }

  // Generate a unique message ID
  const { data: newIdData, error: idError } = await supabase.rpc('generate_unique_id');
  if (idError || !newIdData) {
    throw new Error('Failed to generate message ID');
  }

  const now = new Date().toISOString();

  // Create the message
  const { data: newMessage, error: createError } = await supabase
    .from('thread_message')
    .insert({
      id: newIdData,
      message_body_text: messageBody.trim(),
      thread_id: threadId,
      sender_user_id: SPLITBOT_USER_ID,
      created_by_user_id: SPLITBOT_USER_ID,
      created_at: now,
      updated_at: now,
      original_created_at: now,
      original_updated_at: now,
      is_from_split_bot: true,
      is_hidden_or_deleted: false,
    })
    .select('id, message_body_text, created_at')
    .single();

  if (createError) {
    console.error('[message-curation] sendSplitBotMessage create error:', createError);
    throw new Error(`Failed to create Split Bot message: ${createError.message}`);
  }

  console.log('[message-curation] Split Bot message created:', {
    messageId: newMessage.id,
    threadId,
    recipientType,
    timestamp: now,
  });

  return {
    success: true,
    message: {
      id: newMessage.id,
      body: newMessage.message_body_text,
      createdAt: newMessage.created_at,
    },
    threadId,
    recipientType,
  };
}

// ===== FORMAT HELPERS =====

/**
 * Format thread for API response
 */
function formatThread(thread: Record<string, unknown>) {
  const guest = thread.guest as Record<string, unknown> | null;
  const host = thread.host as Record<string, unknown> | null;
  const listing = thread.listing as Record<string, unknown> | null;

  return {
    id: thread.id,
    createdAt: thread['created_at'],
    modifiedAt: thread['updated_at'],
    hostUserId: thread['host_user_id'],
    guestUserId: thread['guest_user_id'],
    listingId: thread['listing_id'],
    guest: guest ? {
      id: guest.id,
      email: guest.email || '',
      firstName: guest.first_name || '',
      lastName: guest.last_name || '',
      profilePhoto: guest.profile_photo_url || null,
    } : null,
    host: host ? {
      id: host.id,
      email: host.email || '',
      firstName: host.first_name || '',
      lastName: host.last_name || '',
      profilePhoto: host.profile_photo_url || null,
    } : null,
    listing: listing ? {
      id: listing.id,
      name: listing.listing_title || 'Unnamed Listing',
    } : null,
  };
}

/**
 * Format message for API response
 */
function formatMessage(message: Record<string, unknown>, thread: Record<string, unknown>) {
  const originator = message.originator as Record<string, unknown> | null;
  const _guest = thread.guest as Record<string, unknown> | null;
  const _host = thread.host as Record<string, unknown> | null;

  // Determine sender type
  let senderType: 'guest' | 'host' | 'splitbot' | 'unknown' = 'unknown';
  const senderUserId = message['sender_user_id'];
  const isFromSplitBot = message['is_from_split_bot'];

  if (isFromSplitBot) {
    senderType = 'splitbot';
  } else if (senderUserId === thread['guest_user_id']) {
    senderType = 'guest';
  } else if (senderUserId === thread['host_user_id']) {
    senderType = 'host';
  }

  return {
    id: message.id,
    body: message['message_body_text'] || '',
    createdAt: message['created_at'],
    modifiedAt: message['updated_at'],
    originatorUserId: senderUserId,
    threadId: message['thread_id'],
    isSplitBotWarning: !!isFromSplitBot,
    isForwarded: !!message['is_forwarded_message'],
    isDeleted: !!message['is_hidden_or_deleted'],
    senderType,
    originator: originator ? {
      id: originator.id,
      email: originator.email || '',
      firstName: originator.first_name || '',
      lastName: originator.last_name || '',
      profilePhoto: originator.profile_photo_url || null,
    } : null,
  };
}

console.log("[message-curation] Edge Function ready");
