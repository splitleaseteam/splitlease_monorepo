/**
 * Get Threads Handler
 * Split Lease - Messages Edge Function
 *
 * Fetches all message threads for the authenticated user.
 * Queries message_thread table directly (the old RPCs reference dropped tables).
 * Enriches threads with contact info, listing names, proposal status, and unread counts.
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
 * Fetches all threads for the authenticated user via direct queries
 */
export async function handleGetThreads(
  supabaseAdmin: SupabaseClient,
  _payload: Record<string, unknown>,
  user: { id: string; email: string; platformId?: string }
): Promise<GetThreadsResult> {
  console.log('[getThreads] ========== GET THREADS ==========');
  console.log('[getThreads] User ID:', user.id, 'Email:', user.email);

  // Resolve user's platform ID via shared auth utility
  const resolvedUser = await resolveUser(supabaseAdmin, user);
  const userId = resolvedUser.id;

  // Step 1: Fetch threads where user is host or guest
  const { data: rawThreads, error: threadsError } = await supabaseAdmin
    .from('message_thread')
    .select('id, host_user_id, guest_user_id, listing_id, proposal_id, last_message_preview_text, original_updated_at')
    .or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`)
    .order('original_updated_at', { ascending: false, nullsFirst: false })
    .limit(20);

  if (threadsError) {
    console.error('[getThreads] Thread query failed:', threadsError);
    throw new Error(`Failed to fetch threads: ${threadsError.message}`);
  }

  if (!rawThreads || rawThreads.length === 0) {
    console.log('[getThreads] No threads found');
    return { threads: [] };
  }

  console.log('[getThreads] Found', rawThreads.length, 'threads');

  const threadIds = rawThreads.map(t => t.id);

  // Step 2: Batch fetch contact user data
  const contactIds = new Set<string>();
  const listingIds = new Set<string>();
  const proposalIds = new Set<string>();

  rawThreads.forEach(t => {
    const contactId = t.host_user_id === userId ? t.guest_user_id : t.host_user_id;
    if (contactId) contactIds.add(contactId);
    if (t.listing_id) listingIds.add(t.listing_id);
    if (t.proposal_id) proposalIds.add(t.proposal_id);
  });

  // Parallel batch lookups
  const [contactResult, listingResult, proposalResult, unreadResult] = await Promise.all([
    // Contact names/avatars — look up by legacy_platform_id (thread stores platform IDs)
    contactIds.size > 0
      ? supabaseAdmin
          .from('user')
          .select('legacy_platform_id, first_name, last_name, profile_photo_url')
          .in('legacy_platform_id', Array.from(contactIds))
      : Promise.resolve({ data: [], error: null }),

    // Listing names — try both id and legacy_platform_id since threads may use either
    listingIds.size > 0
      ? supabaseAdmin
          .from('listing')
          .select('id, legacy_platform_id, listing_title')
          .or(`id.in.(${Array.from(listingIds).map(id => `"${id}"`).join(',')}),legacy_platform_id.in.(${Array.from(listingIds).map(id => `"${id}"`).join(',')})`)
      : Promise.resolve({ data: [], error: null }),

    // Proposal statuses — try both id and legacy_platform_id
    proposalIds.size > 0
      ? supabaseAdmin
          .from('booking_proposal')
          .select('id, legacy_platform_id, proposal_workflow_status')
          .or(`id.in.(${Array.from(proposalIds).map(id => `"${id}"`).join(',')}),legacy_platform_id.in.(${Array.from(proposalIds).map(id => `"${id}"`).join(',')})`)
      : Promise.resolve({ data: [], error: null }),

    // Unread counts per thread for this user
    threadIds.length > 0
      ? supabaseAdmin
          .from('thread_message')
          .select('thread_id')
          .in('thread_id', threadIds)
          .filter('unread_by_user_ids_json', 'cs', JSON.stringify([userId]))
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Build lookup maps
  const contactMap: Record<string, { name: string; avatar?: string }> = {};
  if (contactResult.data) {
    for (const c of contactResult.data) {
      const firstName = c.first_name || '';
      const lastName = c.last_name || '';
      const lastInitial = lastName ? ` ${lastName.charAt(0)}.` : '';
      contactMap[c.legacy_platform_id] = {
        name: firstName ? `${firstName}${lastInitial}` : 'Unknown User',
        avatar: c.profile_photo_url,
      };
    }
  }

  const listingMap: Record<string, string> = {};
  if (listingResult.data) {
    for (const l of listingResult.data) {
      const title = l.listing_title || 'Unnamed Property';
      if (l.id) listingMap[l.id] = title;
      if (l.legacy_platform_id) listingMap[l.legacy_platform_id] = title;
    }
  }

  const proposalStatusMap: Record<string, string> = {};
  if (proposalResult.data) {
    for (const p of proposalResult.data) {
      const status = p.proposal_workflow_status || 'unknown';
      if (p.id) proposalStatusMap[p.id] = status;
      if (p.legacy_platform_id) proposalStatusMap[p.legacy_platform_id] = status;
    }
  }

  const unreadCountMap: Record<string, number> = {};
  if (unreadResult.data) {
    for (const msg of unreadResult.data) {
      unreadCountMap[msg.thread_id] = (unreadCountMap[msg.thread_id] || 0) + 1;
    }
  }

  // Step 3: Compute visibility-aware message previews
  const threadUserRoles = new Map<string, 'host' | 'guest'>();
  for (const t of rawThreads) {
    threadUserRoles.set(t.id, t.host_user_id === userId ? 'host' : 'guest');
  }

  let visiblePreviewMap = new Map<string, string>();
  try {
    visiblePreviewMap = await getLastVisibleMessagesForThreads(
      supabaseAdmin,
      threadIds,
      threadUserRoles
    );
  } catch (previewError) {
    console.warn('[getThreads] Visibility preview lookup failed:', previewError);
  }

  // Step 4: Transform to UI format
  const pendingStatuses = [
    'Proposal Pending',
    'Proposal Submitted for guest by Split Lease - Awaiting Rental Application',
    'Proposal Submitted for guest by Split Lease - Pending Confirmation',
    'Counter Proposal Sent',
    'Counter Proposal Pending'
  ];

  const transformedThreads: Thread[] = rawThreads.map(thread => {
    // Format time
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

    // Contact info
    const contactId = thread.host_user_id === userId ? thread.guest_user_id : thread.host_user_id;
    const contact = contactId ? contactMap[contactId] : null;
    const contactName = contact?.name?.trim() || 'Split Lease';

    // Proposal status
    const proposalStatus = thread.proposal_id ? proposalStatusMap[thread.proposal_id] : undefined;
    const hasPendingProposal = proposalStatus ? pendingStatuses.includes(proposalStatus) : false;

    // Message preview
    const preview = visiblePreviewMap.get(thread.id) || thread.last_message_preview_text || 'No messages yet';

    return {
      id: thread.id,
      host_user_id: thread.host_user_id,
      guest_user_id: thread.guest_user_id,
      contact_name: contactName,
      contact_avatar: contact?.avatar || undefined,
      property_name: thread.listing_id ? listingMap[thread.listing_id] : undefined,
      last_message_preview: preview,
      last_message_time: lastMessageTime,
      unread_count: unreadCountMap[thread.id] || 0,
      is_with_splitbot: false,
      proposal_id: thread.proposal_id || undefined,
      proposal_status: proposalStatus,
      has_pending_proposal: hasPendingProposal,
    };
  });

  console.log('[getThreads] Returning', transformedThreads.length, 'threads');
  console.log('[getThreads] ========== GET THREADS COMPLETE ==========');

  return { threads: transformedThreads };
}
