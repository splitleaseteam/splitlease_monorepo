/**
 * Accept Proposal Action Handler
 *
 * Accepts a proposal on behalf of the host.
 * Used in usability simulations to simulate host acceptance.
 *
 * @param payload - Contains proposalId and test flags
 * @param supabase - Supabase client with service role
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSplitBotMessage } from "../../_shared/messagingHelpers.ts";

interface AcceptProposalPayload {
  proposalId: string;
  isUsabilityTest?: boolean;
  hostPersona?: string; // e.g., "Host #2" for simulation tracking
}

export async function handleAcceptProposal(
  payload: AcceptProposalPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  console.log('[accept_proposal] Starting with proposalId:', payload.proposalId);

  const { proposalId, isUsabilityTest: _isUsabilityTest = false, hostPersona } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  // Fetch proposal to get user IDs for messaging
  const { data: proposal, error: fetchError } = await supabase
    .from('proposal')
    .select('Guest, "Host User", Listing')
    .eq('_id', proposalId)
    .single();

  if (fetchError) {
    console.error('[accept_proposal] Fetch error:', fetchError);
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  // Update proposal status to accepted
  // SCHEMA-VERIFIED COLUMNS ONLY (2026-01-28):
  // - Status: text ✅
  // - Modified Date: timestamp ✅
  // - Is Finalized: boolean ✅
  // REMOVED non-existent: acceptance_date, accepted_by_persona
  const { error: updateError } = await supabase
    .from('proposal')
    .update({
      Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
      'Modified Date': new Date().toISOString(),
      'Is Finalized': true
    })
    .eq('_id', proposalId);

  if (updateError) {
    console.error('[accept_proposal] Update error:', updateError);
    throw new Error(`Failed to accept proposal: ${updateError.message}`);
  }

  console.log('[accept_proposal] Proposal accepted:', proposalId);

  // Create notification messages for guest and host
  // Multi-strategy thread lookup to handle missing Proposal FK
  try {
    let threadId: string | null = null;

    // Strategy 1: Look up thread by Proposal FK
    const { data: threadByProposal, error: threadError } = await supabase
      .from('thread')
      .select('_id')
      .eq('Proposal', proposalId)
      .limit(1)
      .maybeSingle();

    if (threadError) {
      console.error('[accept_proposal] Thread lookup by Proposal error:', threadError);
    }

    threadId = threadByProposal?._id || null;
    console.log('[accept_proposal] Strategy 1 (Proposal FK) result:', threadId || 'none');

    // Strategy 2: Fallback - find thread by host+guest+listing match
    if (!threadId) {
      console.log('[accept_proposal] No thread found by Proposal FK, trying host+guest+listing match');

      const { data: threadByMatch, error: matchError } = await supabase
        .from('thread')
        .select('_id')
        .eq('host_user_id', proposal['Host User'])
        .eq('guest_user_id', proposal.Guest)
        .eq('Listing', proposal.Listing)
        .limit(1)
        .maybeSingle();

      if (matchError) {
        console.error('[accept_proposal] Thread lookup by match error:', matchError);
      }

      threadId = threadByMatch?._id || null;
      console.log('[accept_proposal] Strategy 2 (host+guest+listing) result:', threadId || 'none');

      // If found via Strategy 2, update the Proposal FK for future lookups
      if (threadId) {
        const { error: updateThreadError } = await supabase
          .from('thread')
          .update({
            "Proposal": proposalId,
            "Modified Date": new Date().toISOString()
          })
          .eq('_id', threadId);

        if (updateThreadError) {
          console.error('[accept_proposal] Failed to update thread Proposal FK:', updateThreadError);
        } else {
          console.log('[accept_proposal] Updated thread Proposal FK:', threadId);
        }
      }
    }

    // Strategy 3: Last resort - create new thread
    if (!threadId) {
      console.warn('[accept_proposal] No existing thread found, creating new one');

      // Get listing name for thread subject
      const { data: listing } = await supabase
        .from('listing')
        .select('"Name"')
        .eq('_id', proposal.Listing)
        .single();

      const listingName = listing?.['Name'] || 'Proposal Thread';

      // Generate new thread ID
      const { data: newId } = await supabase.rpc('generate_bubble_id');
      threadId = newId || `${Date.now()}x${Math.floor(Math.random() * 1e17).toString().padStart(17, '0')}`;

      const now = new Date().toISOString();
      const { error: createError } = await supabase
        .from('thread')
        .insert({
          _id: threadId,
          host_user_id: proposal['Host User'],
          guest_user_id: proposal.Guest,
          "Listing": proposal.Listing,
          "Proposal": proposalId,
          "Thread Subject": listingName,
          "Created By": proposal['Host User'],
          "Created Date": now,
          "Modified Date": now,
          "Participants": [proposal['Host User'], proposal.Guest],
          "from logged out user?": false,
          created_at: now,
          updated_at: now,
        });

      if (createError) {
        console.error('[accept_proposal] Failed to create thread:', createError);
        threadId = null;
      } else {
        console.log('[accept_proposal] Created new thread:', threadId);
      }
    }

    if (threadId) {
      // Message to guest (isolated error handling)
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: "Great news! The host has accepted your proposal. The lease documents are now being prepared. You'll be notified once they're ready for your review.",
          callToAction: 'View Lease',
          visibleToHost: false,
          visibleToGuest: true,
          recipientUserId: proposal.Guest
        });
        console.log('[accept_proposal] Guest message created');
      } catch (guestMsgError) {
        console.error('[accept_proposal] Failed to notify guest:', guestMsgError instanceof Error ? guestMsgError.message : guestMsgError);
      }

      // Message to host (isolated error handling)
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: "You have successfully accepted the guest's proposal. The lease documents are now being prepared.",
          callToAction: 'View Lease',
          visibleToHost: true,
          visibleToGuest: false,
          recipientUserId: proposal['Host User']
        });
        console.log('[accept_proposal] Host message created');
      } catch (hostMsgError) {
        console.error('[accept_proposal] Failed to notify host:', hostMsgError instanceof Error ? hostMsgError.message : hostMsgError);
      }

      console.log('[accept_proposal] Notification messages processing complete');
    } else {
      console.warn('[accept_proposal] All thread lookup strategies failed - messages not sent');
    }
  } catch (messageError) {
    console.error('[accept_proposal] Failed to create messages:', messageError);
    // Non-blocking - proposal was still accepted
  }

  return {
    success: true,
    message: `Proposal accepted${hostPersona ? ` by ${hostPersona}` : ''}`
  };
}
