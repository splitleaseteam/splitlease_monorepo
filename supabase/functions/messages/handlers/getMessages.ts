/**
 * Get Messages Handler
 * Split Lease - Messages Edge Function
 *
 * Fetches messages for a specific thread
 * Filters by visibility based on user type (host/guest)
 * Marks messages as read by removing user from unread_users
 *
 * NO FALLBACK PRINCIPLE: Throws if database query fails
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { User as _User } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { resolveUser } from '../../_shared/auth.ts';

interface Message {
  id: string;
  message_body: string;
  sender_name: string;
  sender_avatar?: string;
  sender_type: 'guest' | 'host' | 'splitbot';
  is_outgoing: boolean;
  timestamp: string;
  call_to_action?: {
    type: string;
    message: string;
    link?: string;
  };
  split_bot_warning?: string;
}

interface ThreadInfo {
  contact_name: string;
  contact_avatar?: string;
  property_name?: string;
  status?: string;
  status_type?: string;
  proposal_id?: string;
  listing_id?: string;
}

interface GetMessagesPayload {
  thread_id: string;
  limit?: number;
  offset?: number;
}

interface GetMessagesResult {
  messages: Message[];
  has_more: boolean;
  thread_info: ThreadInfo;
}

/**
 * Handle get_messages action
 * Fetches messages for a specific thread and marks them as read
 */
export async function handleGetMessages(
  supabaseAdmin: SupabaseClient,
  payload: Record<string, unknown>,
  user: { id: string; email: string; platformId?: string }
): Promise<GetMessagesResult> {
  console.log('[getMessages] ========== GET MESSAGES ==========');
  console.log('[getMessages] User ID:', user.id, 'Email:', user.email, 'BubbleId from metadata:', user.platformId);
  console.log('[getMessages] Payload:', JSON.stringify(payload, null, 2));

  // Validate required fields
  const typedPayload = payload as unknown as GetMessagesPayload;
  validateRequiredFields(typedPayload, ['thread_id']);

  const { thread_id, limit = 50, offset = 0 } = typedPayload;

  // Resolve user's Bubble ID and type via shared auth utility
  const resolvedUser = await resolveUser(supabaseAdmin, user);
  const userBubbleId = resolvedUser.id;
  const userType = resolvedUser.userType;
  const isHost = userType.includes('Host');
  console.log('[getMessages] User Bubble ID:', userBubbleId);
  console.log('[getMessages] Is Host:', isHost);

  // Verify user has access to this thread
  const { data: thread, error: threadError } = await supabaseAdmin
    .from('message_thread')
    .select(`
      id,
      host_user_id,
      guest_user_id,
      listing_id,
      proposal_id
    `)
    .eq('id', thread_id)
    .single();

  if (threadError || !thread) {
    console.error('[getMessages] Thread lookup failed:', threadError);
    throw new ValidationError('Thread not found');
  }

  const threadHost = thread.host_user_id;
  const threadGuest = thread.guest_user_id;

  // Check user is participant in thread
  if (threadHost !== userBubbleId && threadGuest !== userBubbleId) {
    console.error('[getMessages] User not participant in thread');
    throw new ValidationError('You do not have access to this conversation');
  }

  // Determine if user is host or guest in this thread
  const isHostInThread = threadHost === userBubbleId;
  const contactId = isHostInThread ? threadGuest : threadHost;

  // Fetch messages for this thread
  // Filter by visibility based on user role in thread
  let query = supabaseAdmin
    .from('thread_message')
    .select(`
      id,
      message_body_text,
      original_created_at,
      sender_user_id,
      is_visible_to_guest,
      is_visible_to_host,
      is_from_split_bot,
      split_bot_warning_text,
      call_to_action_button_label
    `)
    .eq('thread_id', thread_id)
    .order('original_created_at', { ascending: true });

  // Apply visibility filter
  if (isHostInThread) {
    query = query.eq('is_visible_to_host', true);
  } else {
    query = query.eq('is_visible_to_guest', true);
  }

  // Apply pagination
  query = query.range(offset, offset + limit);

  const { data: messages, error: messagesError } = await query;

  if (messagesError) {
    console.error('[getMessages] Messages query failed:', messagesError);
    throw new Error(`Failed to fetch messages: ${messagesError.message}`);
  }

  console.log('[getMessages] Found', messages?.length || 0, 'messages');

  // Collect all sender IDs for batch lookup
  const senderIds = new Set<string>();
  messages?.forEach(msg => {
    if (msg.sender_user_id) senderIds.add(msg.sender_user_id);
  });

  // Batch fetch sender user data
  let senderMap: Record<string, { name: string; avatar?: string }> = {};
  if (senderIds.size > 0) {
    const { data: senders, error: sendersError } = await supabaseAdmin
      .from('user')
      .select('legacy_platform_id, first_name, last_name, profile_photo_url')
      .in('legacy_platform_id', Array.from(senderIds));

    if (!sendersError && senders) {
      senderMap = senders.reduce((acc, sender) => {
        acc[sender.legacy_platform_id] = {
          name: `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Unknown',
          avatar: sender.profile_photo_url,
        };
        return acc;
      }, {} as Record<string, { name: string; avatar?: string }>);
    }
  }

  // Fetch contact info for thread header
  let contactInfo: { name: string; avatar?: string } = { name: 'Split Lease' };
  if (contactId) {
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('user')
      .select('first_name, last_name, profile_photo_url')
      .eq('legacy_platform_id', contactId)
      .single();

    if (!contactError && contact) {
      contactInfo = {
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown User',
        avatar: contact.profile_photo_url,
      };
    }
  }

  // Fetch listing name if present (thread may store id or legacy_platform_id)
  let propertyName: string | undefined;
  if (thread.listing_id) {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listing')
      .select('listing_title')
      .or(`id.eq.${thread.listing_id},legacy_platform_id.eq.${thread.listing_id}`)
      .limit(1)
      .maybeSingle();

    if (!listingError && listing) {
      propertyName = listing.listing_title;
    }
  }

  // Fetch proposal status if present (thread may store id or legacy_platform_id)
  let proposalStatus: string | undefined;
  let statusType: string | undefined;
  if (thread.proposal_id) {
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('booking_proposal')
      .select('proposal_workflow_status')
      .or(`id.eq.${thread.proposal_id},legacy_platform_id.eq.${thread.proposal_id}`)
      .limit(1)
      .maybeSingle();

    if (!proposalError && proposal) {
      proposalStatus = proposal.proposal_workflow_status;
      // Map status to type for styling
      if (proposalStatus?.includes('Declined') || proposalStatus?.includes('Cancelled')) {
        statusType = 'declined';
      } else if (proposalStatus?.includes('Accepted') || proposalStatus?.includes('Approved')) {
        statusType = 'accepted';
      } else if (proposalStatus?.includes('Pending')) {
        statusType = 'pending';
      }
    }
  }

  // Transform messages to response format
  const transformedMessages: Message[] = (messages || []).map(msg => {
    const senderId = msg.sender_user_id;
    const sender = senderId ? senderMap[senderId] : null;
    const isOutgoing = senderId === userBubbleId;
    const isSplitBot = msg.is_from_split_bot === true;

    // Determine sender type
    let senderType: 'guest' | 'host' | 'splitbot';
    if (isSplitBot) {
      senderType = 'splitbot';
    } else if (senderId === threadHost) {
      senderType = 'host';
    } else {
      senderType = 'guest';
    }

    // Format timestamp
    const createdDate = msg.original_created_at ? new Date(msg.original_created_at) : new Date();
    const timestamp = createdDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Build call to action if present
    let callToAction: Message['call_to_action'];
    if (msg.call_to_action_button_label) {
      callToAction = {
        type: msg.call_to_action_button_label,
        message: 'View Details',
      };
    }

    return {
      id: msg.id,
      message_body: msg.message_body_text || '',
      sender_name: isSplitBot ? 'Split Bot' : (sender?.name || 'Unknown'),
      sender_avatar: isSplitBot ? undefined : sender?.avatar,
      sender_type: senderType,
      is_outgoing: isOutgoing,
      timestamp,
      call_to_action: callToAction,
      split_bot_warning: msg.split_bot_warning_text,
    };
  });

  // Mark messages as read by removing user from Unread Users
  // This is a fire-and-forget operation
  if (messages && messages.length > 0) {
    const messageIds = messages.map(m => m.id);

    // Get messages with Unread Users containing this user
    const { data: unreadMessages, error: unreadError } = await supabaseAdmin
      .from('thread_message')
      .select('id, unread_by_user_ids_json')
      .in('id', messageIds);

    if (!unreadError && unreadMessages) {
      for (const msg of unreadMessages) {
        const unreadUsers = msg.unread_by_user_ids_json || [];
        if (Array.isArray(unreadUsers) && unreadUsers.includes(userBubbleId)) {
          // Remove user from unread list
          const updatedUnread = unreadUsers.filter((id: string) => id !== userBubbleId);
          await supabaseAdmin
            .from('thread_message')
            .update({ unread_by_user_ids_json: updatedUnread })
            .eq('id', msg.id);
        }
      }
    }
  }

  // Check if there are more messages
  const { count: totalCount } = await supabaseAdmin
    .from('thread_message')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', thread_id);

  const hasMore = totalCount ? (offset + limit) < totalCount : false;

  console.log('[getMessages] Transformed', transformedMessages.length, 'messages');
  console.log('[getMessages] ========== GET MESSAGES COMPLETE ==========');

  return {
    messages: transformedMessages,
    has_more: hasMore,
    thread_info: {
      contact_name: contactInfo.name,
      contact_avatar: contactInfo.avatar,
      property_name: propertyName,
      status: proposalStatus,
      status_type: statusType,
      proposal_id: thread.proposal_id || undefined,
      listing_id: thread.listing_id || undefined,
    },
  };
}
