/**
 * Accept Counteroffer Action Handler
 *
 * Accepts a host's counteroffer on behalf of the guest.
 * Used in usability simulations for the counteroffer path.
 *
 * @param payload - Contains proposalId and test flags
 * @param supabase - Supabase client with service role
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSplitBotMessage } from "../../_shared/messagingHelpers.ts";

interface AcceptCounterofferPayload {
  proposalId: string;
  isUsabilityTest?: boolean;
}

export async function handleAcceptCounteroffer(
  payload: AcceptCounterofferPayload,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  console.log('[accept_counteroffer] Starting with proposalId:', payload.proposalId);

  const { proposalId, isUsabilityTest: _isUsabilityTest = false } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  // Fetch proposal to get counteroffer terms and user IDs
  const { data: proposal, error: fetchError } = await supabase
    .from('proposal')
    .select('*, "hc nightly price", "hc nights per week", "hc check in day", "hc check out day", Guest, "Host User"')
    .eq('_id', proposalId)
    .single();

  if (fetchError) {
    console.error('[accept_counteroffer] Fetch error:', {
      code: fetchError.code,
      message: fetchError.message,
      details: fetchError.details,
      hint: fetchError.hint,
    });
    throw new Error(`Failed to fetch proposal: code=${fetchError.code}, message=${fetchError.message}`);
  }

  // Accept the counteroffer - move to drafting lease status
  // Copy counteroffer terms to active terms
  // Status must match exactly: 'Proposal or Counteroffer Accepted / Drafting Lease Documents'
  // from proposalStatuses.js PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key
  //
  // SCHEMA-VERIFIED COLUMNS ONLY (2026-01-28):
  // - Status: text ✅
  // - Modified Date: timestamp ✅
  // - Is Finalized: boolean ✅
  // - counter offer happened: boolean ✅ (NOT counteroffer_accepted)
  // - proposal nightly price, nights per week (num), check in day, check out day: ✅
  const updateData: Record<string, unknown> = {
    Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
    'Modified Date': new Date().toISOString(),
    'Is Finalized': true
    // Note: 'counter offer happened' is already true if there was a counteroffer
    // No need to set it again during acceptance
  };

  // Apply counteroffer values as the final agreed terms
  if (proposal['hc nightly price']) {
    updateData['proposal nightly price'] = proposal['hc nightly price'];
  }
  if (proposal['hc nights per week']) {
    updateData['nights per week (num)'] = proposal['hc nights per week'];
  }
  if (proposal['hc check in day'] !== undefined) {
    updateData['check in day'] = proposal['hc check in day'];
  }
  if (proposal['hc check out day'] !== undefined) {
    updateData['check out day'] = proposal['hc check out day'];
  }

  const { error: updateError } = await supabase
    .from('proposal')
    .update(updateData)
    .eq('_id', proposalId);

  if (updateError) {
    console.error('[accept_counteroffer] Update error:', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });
    throw new Error(`Failed to accept counteroffer: code=${updateError.code}, message=${updateError.message}`);
  }

  console.log('[accept_counteroffer] Counteroffer accepted for proposal:', proposalId);

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
      console.error('[accept_counteroffer] Thread lookup by Proposal error:', threadError);
    }

    threadId = threadByProposal?._id || null;
    console.log('[accept_counteroffer] Strategy 1 (Proposal FK) result:', threadId || 'none');

    // Strategy 2: Fallback - find thread by host+guest+listing match
    if (!threadId) {
      console.log('[accept_counteroffer] No thread found by Proposal FK, trying host+guest+listing match');

      const { data: threadByMatch, error: matchError } = await supabase
        .from('thread')
        .select('_id')
        .eq('host_user_id', proposal['Host User'])
        .eq('guest_user_id', proposal.Guest)
        .eq('Listing', proposal.Listing)
        .limit(1)
        .maybeSingle();

      if (matchError) {
        console.error('[accept_counteroffer] Thread lookup by match error:', matchError);
      }

      threadId = threadByMatch?._id || null;
      console.log('[accept_counteroffer] Strategy 2 (host+guest+listing) result:', threadId || 'none');

      // If found via Strategy 2, update the Proposal FK for future lookups
      if (threadId) {
        const { error: updateError } = await supabase
          .from('thread')
          .update({
            "Proposal": proposalId,
            "Modified Date": new Date().toISOString()
          })
          .eq('_id', threadId);

        if (updateError) {
          console.error('[accept_counteroffer] Failed to update thread Proposal FK:', updateError);
        } else {
          console.log('[accept_counteroffer] Updated thread Proposal FK:', threadId);
        }
      }
    }

    // Strategy 3: Last resort - create new thread
    if (!threadId) {
      console.warn('[accept_counteroffer] No existing thread found, creating new one');

      // Get listing name for thread subject
      const { data: listing } = await supabase
        .from('listing')
        .select('"Name"')
        .eq('_id', proposal.Listing)
        .single();

      const listingName = listing?.['Name'] || 'Proposal Thread';

      // Generate new thread ID
      const { data: newId } = await supabase.rpc('generate_unique_id');
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
          "Created By": proposal.Guest,
          "Created Date": now,
          "Modified Date": now,
          "Participants": [proposal['Host User'], proposal.Guest],
          "from logged out user?": false,
          created_at: now,
          updated_at: now,
        });

      if (createError) {
        console.error('[accept_counteroffer] Failed to create thread:', createError);
        threadId = null;
      } else {
        console.log('[accept_counteroffer] Created new thread:', threadId);
      }
    }

    if (threadId) {
      // Message to guest (isolated error handling)
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: "You have successfully accepted the host's counteroffer. The lease documents are now being prepared. You'll be notified once they're ready for your review.",
          callToAction: 'View Lease',
          visibleToHost: false,
          visibleToGuest: true,
          recipientUserId: proposal.Guest
        });
        console.log('[accept_counteroffer] Guest message created');
      } catch (guestMsgError) {
        console.error('[accept_counteroffer] Failed to notify guest:', guestMsgError instanceof Error ? guestMsgError.message : guestMsgError);
      }

      // Message to host (isolated error handling)
      try {
        await createSplitBotMessage(supabase, {
          threadId,
          messageBody: "Great news! The guest has accepted your counteroffer. The lease documents are now being prepared.",
          callToAction: 'View Lease',
          visibleToHost: true,
          visibleToGuest: false,
          recipientUserId: proposal['Host User'] || proposal.Host
        });
        console.log('[accept_counteroffer] Host message created');
      } catch (hostMsgError) {
        console.error('[accept_counteroffer] Failed to notify host:', hostMsgError instanceof Error ? hostMsgError.message : hostMsgError);
      }

      console.log('[accept_counteroffer] Notification messages processing complete');
    } else {
      console.warn('[accept_counteroffer] All thread lookup strategies failed - messages not sent');
    }
  } catch (messageError) {
    console.error('[accept_counteroffer] Failed to create messages:', messageError);
    // Non-blocking - counteroffer was still accepted
  }

  return {
    success: true,
    message: 'Counteroffer accepted - proceeding to lease drafting'
  };
}
