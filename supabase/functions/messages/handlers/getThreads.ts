/**
 * Get Threads Handler
 * Split Lease - Messages Edge Function
 *
 * Fetches all message threads for the authenticated user
 * Uses service role key to bypass RLS (supports legacy auth users)
 *
 * NO FALLBACK PRINCIPLE: Throws if database query fails
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { User as _User } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import { getLastVisibleMessagesForThreads } from '../../_shared/messagingHelpers.ts';
import { resolveUser } from '../../_shared/auth.ts';

interface Thread {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  property_name?: string;
  last_message_preview: string;
  last_message_time: string;
  unread_count: number;
  is_with_splitbot: boolean;
  host_user_id: string;
  guest_user_id: string;
  proposal_id?: string;
  proposal_status?: string;
  has_pending_proposal: boolean;
}

interface GetThreadsResult {
  threads: Thread[];
}

/**
 * Handle get_threads action
 * Fetches all threads for the authenticated user
 */
export async function handleGetThreads(
  supabaseAdmin: SupabaseClient,
  _payload: Record<string, unknown>,
  user: { id: string; email: string; platformId?: string }
): Promise<GetThreadsResult> {
  console.log('[getThreads] ========== GET THREADS ==========');
  console.log('[getThreads] User ID:', user.id, 'Email:', user.email, 'BubbleId from metadata:', user.platformId);

  // Resolve user's Bubble ID via shared auth utility
  const resolvedUser = await resolveUser(supabaseAdmin, user);
  const userBubbleId = resolvedUser.id;

  // Step 1: Query threads where user is host or guest
  // Direct query now works with normalized column names
  const { data: threads, error: threadsError } = await supabaseAdmin
    .from('message_thread')
    .select('*')
    .or(`host_user_id.eq.${userBubbleId},guest_user_id.eq.${userBubbleId}`)
    .order('original_updated_at', { ascending: false, nullsFirst: false })
    .limit(20);

  console.log('[getThreads] Query result:', {
    threadCount: threads?.length || 0,
    error: threadsError?.message
  });

  if (threadsError) {
    console.error('[getThreads] Threads query failed:', threadsError);
    throw new Error(`Failed to fetch threads: ${threadsError.message}`);
  }

  if (!threads || threads.length === 0) {
    console.log('[getThreads] No threads found');
    return { threads: [] };
  }

  console.log('[getThreads] Found', threads.length, 'threads');

  // Step 2: Collect contact IDs and listing IDs for batch lookup
  const contactIds = new Set<string>();
  const listingIds = new Set<string>();

  threads.forEach(thread => {
    const hostId = thread.host_user_id;
    const guestId = thread.guest_user_id;
    const contactId = hostId === userBubbleId ? guestId : hostId;
    if (contactId) contactIds.add(contactId);
    if (thread.listing_id) listingIds.add(thread.listing_id);
  });

  // Step 3: Batch fetch contact user data
  let contactMap: Record<string, { name: string; avatar?: string }> = {};
  if (contactIds.size > 0) {
    const { data: contacts } = await supabaseAdmin
      .from('user')
      .select('legacy_platform_id, first_name, last_name, profile_photo_url')
      .in('legacy_platform_id', Array.from(contactIds));

    if (contacts) {
      contactMap = contacts.reduce((acc, contact) => {
        acc[contact.legacy_platform_id] = {
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown User',
          avatar: contact.profile_photo_url,
        };
        return acc;
      }, {} as Record<string, { name: string; avatar?: string }>);
    }
  }

  // Step 4: Batch fetch listing data
  let listingMap: Record<string, string> = {};
  if (listingIds.size > 0) {
    const { data: listings } = await supabaseAdmin
      .from('listing')
      .select('legacy_platform_id, listing_title')
      .in('legacy_platform_id', Array.from(listingIds));

    if (listings) {
      listingMap = listings.reduce((acc, listing) => {
        acc[listing.legacy_platform_id] = listing.listing_title || 'Unnamed Property';
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // Step 5: Fetch unread message counts per thread
  const threadIds = threads.map(t => t.id);
  let unreadCountMap: Record<string, number> = {};
  if (threadIds.length > 0) {
    const { data: unreadData, error: unreadError } = await supabaseAdmin
      .from('thread_message')
      .select('thread_id')
      .in('thread_id', threadIds)
      .contains('unread_by_user_ids_json', JSON.stringify([userBubbleId]));

    if (!unreadError && unreadData) {
      // Count messages per thread
      unreadCountMap = unreadData.reduce((acc, msg) => {
        const threadId = msg.thread_id;
        acc[threadId] = (acc[threadId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  // Step 5b: Fetch proposal data for threads with proposals
  // This enables hosts to see which threads have pending proposals
  const proposalIds = new Set<string>();
  threads.forEach(thread => {
    if (thread.proposal_id) proposalIds.add(thread.proposal_id);
  });

  let proposalMap: Record<string, { status: string }> = {};
  if (proposalIds.size > 0) {
    const { data: proposals, error: proposalsError } = await supabaseAdmin
      .from('booking_proposal')
      .select('legacy_platform_id, proposal_workflow_status')
      .in('legacy_platform_id', Array.from(proposalIds));

    if (!proposalsError && proposals) {
      proposalMap = proposals.reduce((acc, proposal) => {
        acc[proposal.legacy_platform_id] = {
          status: proposal.proposal_workflow_status || 'unknown',
        };
        return acc;
      }, {} as Record<string, { status: string }>);
    }
    console.log('[getThreads] Fetched proposal data for', Object.keys(proposalMap).length, 'proposals');
  }

  // Step 5c: Compute visibility-aware message previews
  // The static last_message_preview_text field doesn't consider visibility, so we compute
  // the preview based on the most recent message visible to the current user
  const threadUserRoles = new Map<string, 'host' | 'guest'>();
  threads.forEach(thread => {
    const role = thread.host_user_id === userBubbleId ? 'host' : 'guest';
    threadUserRoles.set(thread.id, role);
  });

  const visiblePreviewMap = await getLastVisibleMessagesForThreads(
    supabaseAdmin,
    threadIds,
    threadUserRoles
  );
  console.log('[getThreads] Computed visibility-aware previews for', visiblePreviewMap.size, 'threads');

  // Step 6: Transform threads to UI format
  const transformedThreads: Thread[] = threads.map(thread => {
    const hostId = thread.host_user_id;
    const guestId = thread.guest_user_id;
    const contactId = hostId === userBubbleId ? guestId : hostId;
    const contact = contactId ? contactMap[contactId] : null;

    // Format the last modified time
    const modifiedDate = thread.original_updated_at ? new Date(thread.original_updated_at) : new Date();
    const now = new Date();
    const diffMs = now.getTime() - modifiedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let lastMessageTime: string;
    if (diffDays === 0) {
      lastMessageTime = modifiedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      lastMessageTime = 'Yesterday';
    } else if (diffDays < 7) {
      lastMessageTime = modifiedDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      lastMessageTime = modifiedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Get proposal data if thread has a proposal
    const proposalId = thread.proposal_id;
    const proposalData = proposalId ? proposalMap[proposalId] : null;
    const proposalStatus = proposalData?.status;

    // Determine if this is a pending proposal that needs host attention
    // Pending statuses that require host review:
    const pendingStatuses = [
      'Proposal Pending',
      'Proposal Submitted for guest by Split Lease - Awaiting Rental Application',
      'Proposal Submitted for guest by Split Lease - Pending Confirmation',
      'Counter Proposal Sent',
      'Counter Proposal Pending'
    ];
    const hasPendingProposal = proposalStatus ? pendingStatuses.includes(proposalStatus) : false;

    return {
      id: thread.id,
      host_user_id: hostId,
      guest_user_id: guestId,
      contact_name: contact?.name || 'Split Lease',
      contact_avatar: contact?.avatar,
      property_name: thread.listing_id ? listingMap[thread.listing_id] : undefined,
      // Use visibility-aware preview if available, fall back to static last_message_preview_text
      last_message_preview: visiblePreviewMap.get(thread.id) || thread.last_message_preview_text || 'No messages yet',
      last_message_time: lastMessageTime,
      unread_count: unreadCountMap[thread.id] || 0,
      is_with_splitbot: false,
      proposal_id: proposalId,
      proposal_status: proposalStatus,
      has_pending_proposal: hasPendingProposal,
    };
  });

  console.log('[getThreads] Returning', transformedThreads.length, 'threads');
  console.log('[getThreads] ========== GET THREADS COMPLETE ==========');

  return { threads: transformedThreads };
}
