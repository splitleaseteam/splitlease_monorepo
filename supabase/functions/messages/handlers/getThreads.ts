/**
 * Get Threads Handler
 * Split Lease - Messages Edge Function
 *
 * Fetches all message threads for the authenticated user.
 * Uses the get_threads_for_user() RPC to replace 4 sequential queries
 * (threads, contacts, listings, unread counts) with a single database call.
 * Two additional queries remain: proposal status lookup and visibility-aware previews.
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

  // Step 1: Single RPC call replaces 4 sequential queries:
  // threads lookup, contact name/avatar lookup, listing name lookup, unread counts
  const { data: rpcThreads, error: rpcError } = await supabaseAdmin
    .rpc('get_threads_for_user', { p_user_id: userBubbleId, p_limit: 20 });

  console.log('[getThreads] RPC result:', {
    threadCount: rpcThreads?.length || 0,
    error: rpcError?.message
  });

  if (rpcError) {
    console.error('[getThreads] RPC query failed:', rpcError);
    throw new Error(`Failed to fetch threads: ${rpcError.message}`);
  }

  if (!rpcThreads || rpcThreads.length === 0) {
    console.log('[getThreads] No threads found');
    return { threads: [] };
  }

  console.log('[getThreads] Found', rpcThreads.length, 'threads via RPC');

  const threadIds = rpcThreads.map((t: { thread_id: string }) => t.thread_id);

  // Step 2: Fetch proposal IDs for these threads (RPC doesn't include proposal data)
  // Query message_thread to get proposal_id for each thread
  const { data: threadProposals } = await supabaseAdmin
    .from('message_thread')
    .select('id, proposal_id')
    .in('id', threadIds);

  const threadProposalMap: Record<string, string> = {};
  const proposalIds = new Set<string>();
  if (threadProposals) {
    for (const tp of threadProposals) {
      if (tp.proposal_id) {
        threadProposalMap[tp.id] = tp.proposal_id;
        proposalIds.add(tp.proposal_id);
      }
    }
  }

  // Fetch proposal statuses for threads that have proposals
  let proposalMap: Record<string, { status: string }> = {};
  if (proposalIds.size > 0) {
    const { data: proposals, error: proposalsError } = await supabaseAdmin
      .from('booking_proposal')
      .select('legacy_platform_id, proposal_workflow_status')
      .in('legacy_platform_id', Array.from(proposalIds));

    if (!proposalsError && proposals) {
      proposalMap = proposals.reduce((acc: Record<string, { status: string }>, proposal: { legacy_platform_id: string; proposal_workflow_status: string }) => {
        acc[proposal.legacy_platform_id] = {
          status: proposal.proposal_workflow_status || 'unknown',
        };
        return acc;
      }, {} as Record<string, { status: string }>);
    }
    console.log('[getThreads] Fetched proposal data for', Object.keys(proposalMap).length, 'proposals');
  }

  // Step 3: Compute visibility-aware message previews
  // The RPC's last_message_preview doesn't consider per-user visibility,
  // so we compute the preview based on the most recent message visible to the current user
  const threadUserRoles = new Map<string, 'host' | 'guest'>();
  for (const t of rpcThreads) {
    threadUserRoles.set(t.thread_id, t.is_host ? 'host' : 'guest');
  }

  const visiblePreviewMap = await getLastVisibleMessagesForThreads(
    supabaseAdmin,
    threadIds,
    threadUserRoles
  );
  console.log('[getThreads] Computed visibility-aware previews for', visiblePreviewMap.size, 'threads');

  // Step 4: Transform RPC results to UI format (identical response shape)
  const transformedThreads: Thread[] = rpcThreads.map((thread: {
    thread_id: string;
    host_user_id: string;
    guest_user_id: string;
    listing_name: string | null;
    last_message_preview: string | null;
    modified_date: string | null;
    contact_name: string | null;
    contact_avatar: string | null;
    unread_count: number;
    is_host: boolean;
  }) => {
    // Format the last modified time
    const modifiedDate = thread.modified_date ? new Date(thread.modified_date) : new Date();
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
    const proposalId = threadProposalMap[thread.thread_id];
    const proposalData = proposalId ? proposalMap[proposalId] : null;
    const proposalStatus = proposalData?.status;

    // Determine if this is a pending proposal that needs host attention
    const pendingStatuses = [
      'Proposal Pending',
      'Proposal Submitted for guest by Split Lease - Awaiting Rental Application',
      'Proposal Submitted for guest by Split Lease - Pending Confirmation',
      'Counter Proposal Sent',
      'Counter Proposal Pending'
    ];
    const hasPendingProposal = proposalStatus ? pendingStatuses.includes(proposalStatus) : false;

    // RPC returns empty string for contacts with no name; normalize to 'Split Lease'
    const contactName = thread.contact_name?.trim() || 'Split Lease';

    return {
      id: thread.thread_id,
      host_user_id: thread.host_user_id,
      guest_user_id: thread.guest_user_id,
      contact_name: contactName,
      contact_avatar: thread.contact_avatar || undefined,
      property_name: thread.listing_name || undefined,
      // Use visibility-aware preview if available, fall back to RPC's last_message_preview
      last_message_preview: visiblePreviewMap.get(thread.thread_id) || thread.last_message_preview || 'No messages yet',
      last_message_time: lastMessageTime,
      unread_count: Number(thread.unread_count) || 0,
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
