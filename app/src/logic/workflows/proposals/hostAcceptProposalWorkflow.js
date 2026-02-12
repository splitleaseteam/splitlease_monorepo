/**
 * Host Accept Proposal Workflow
 *
 * Implements the complete proposal acceptance workflow for hosts:
 * 1. Calculate lease numbering format
 * 2. Determine if this is a counteroffer acceptance
 * 3. Calculate 4-week compensation (from proposal)
 * 4. Calculate 4-week rent
 * 5. Call lease creation Edge Function
 * 6. Update proposal status to "Drafting Lease Documents"
 * 7. Send notification messages to both parties
 *
 * This workflow mirrors the guest counteroffer acceptance flow in
 * useCompareTermsModalLogic.js but is initiated by the host.
 *
 * @module hostAcceptProposalWorkflow
 */

import { supabase } from '../../../lib/supabase.js';

/**
 * Execute the host proposal acceptance workflow
 *
 * @param {Object} params - Workflow parameters
 * @param {string} params.proposalId - The proposal ID to accept
 * @param {Object} params.proposal - Full proposal object with all fields
 * @returns {Promise<Object>} Result with success status and lease data
 * @throws {Error} If any step fails
 */
export async function hostAcceptProposalWorkflow({ proposalId, proposal }) {
  console.log('[hostAcceptProposalWorkflow] Starting acceptance workflow for proposal:', proposalId);

  // Step 1: Calculate lease numbering format
  const { count: leaseCount, error: countError } = await supabase
    .from('booking_lease')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn('[hostAcceptProposalWorkflow] Could not count leases:', countError);
  }

  const numberOfZeros = (leaseCount || 0) < 10 ? 4 : (leaseCount || 0) < 100 ? 3 : 2;
  console.log('[hostAcceptProposalWorkflow] Lease count:', leaseCount, 'numberOfZeros:', numberOfZeros);

  // Step 2: Determine if this is a counteroffer acceptance
  // Check if guest submitted a counteroffer (last_modified_by === 'guest' or has_guest_counteroffer)
  const hasGuestCounteroffer = proposal.has_guest_counteroffer ||
    proposal['has_guest_counteroffer'] ||
    proposal.last_modified_by === 'guest' ||
    proposal['last_modified_by'] === 'guest';

  const isCounteroffer = hasGuestCounteroffer ? 'yes' : 'no';
  console.log('[hostAcceptProposalWorkflow] Is counteroffer:', isCounteroffer);

  // Step 3: Calculate 4-week compensation (from ORIGINAL or HC proposal terms)
  // If guest counteroffer exists, use hc_ fields; otherwise use original fields
  const nightsPerWeek = hasGuestCounteroffer
    ? (proposal['host_counter_offer_nights_per_week'] || proposal['host_counter_offer_nights_per_week'] || proposal['nights per week (num)'] || 0)
    : (proposal['nights per week (num)'] || proposal.nights_per_week || 0);

  const nightlyPrice = hasGuestCounteroffer
    ? (proposal['host_counter_offer_nightly_price'] || proposal['host_counter_offer_nightly_price'] || proposal['proposal nightly price'] || 0)
    : (proposal['proposal nightly price'] || proposal.nightly_rate || 0);

  // 4-week compensation = nights/week * 4 weeks * nightly price * 85% (host share)
  const fourWeekCompensation = nightsPerWeek * 4 * nightlyPrice * 0.85;
  console.log('[hostAcceptProposalWorkflow] 4-week compensation:', fourWeekCompensation);

  // Step 4: Calculate 4-week rent (guest pays full price)
  const fourWeekRent = nightsPerWeek * 4 * nightlyPrice;
  console.log('[hostAcceptProposalWorkflow] 4-week rent:', fourWeekRent);

  // Step 5: Call lease creation Edge Function
  console.log('[hostAcceptProposalWorkflow] Creating lease with parameters:', {
    proposalId,
    isCounteroffer,
    fourWeekRent,
    fourWeekCompensation,
    numberOfZeros
  });

  let leaseResponse;
  try {
    leaseResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lease`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          payload: {
            proposalId,
            isCounteroffer,
            fourWeekRent,
            fourWeekCompensation,
            numberOfZeros,
          },
        }),
      }
    );
  } catch (fetchErr) {
    console.error('[hostAcceptProposalWorkflow] Network error calling lease Edge Function:', fetchErr);
    throw new Error('Network error: Could not connect to lease service. Please try again.');
  }

  console.log('[hostAcceptProposalWorkflow] Lease response status:', leaseResponse.status);

  let leaseResult;
  try {
    leaseResult = await leaseResponse.json();
  } catch (parseErr) {
    console.error('[hostAcceptProposalWorkflow] Failed to parse lease response:', parseErr);
    throw new Error('Invalid response from lease service. Please contact support.');
  }

  console.log('[hostAcceptProposalWorkflow] Lease response:', leaseResult);

  if (!leaseResult.success) {
    console.error('[hostAcceptProposalWorkflow] Lease creation failed:', leaseResult.error);
    throw new Error(leaseResult.error || 'Failed to create lease');
  }

  console.log('[hostAcceptProposalWorkflow] Lease created successfully:', leaseResult.data);

  // Step 6: Send notification messages to guest and host
  try {
    // Find the thread associated with this proposal
    const { data: thread, error: threadError } = await supabase
      .from('thread')
      .select('id')
      .eq('Proposal', proposalId)
      .maybeSingle();

    if (threadError) {
      console.warn('[hostAcceptProposalWorkflow] Could not find thread for proposal:', threadError);
    } else if (thread) {
      console.log('[hostAcceptProposalWorkflow] Found thread:', thread.id);

      // Send SplitBot messages to both guest and host
      const messageResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send_splitbot_message',
            payload: {
              threadId: thread.id,
              ctaName: 'proposal_accepted',
              recipientRole: 'both',
              customMessageBody: 'Great news! The proposal has been accepted. Split Lease will now draft the lease documents. Please allow up to 48 hours for completion.',
            },
          }),
        }
      );

      const messageResult = await messageResponse.json();
      if (messageResult.success) {
        console.log('[hostAcceptProposalWorkflow] Notification messages sent:', messageResult.data);
      } else {
        console.warn('[hostAcceptProposalWorkflow] Could not send notification messages:', messageResult.error);
      }
    } else {
      console.log('[hostAcceptProposalWorkflow] No thread found for proposal - skipping messages');
    }
  } catch (msgErr) {
    // Non-fatal: log but don't fail the acceptance
    console.warn('[hostAcceptProposalWorkflow] Error sending notification messages:', msgErr);
  }

  return {
    success: true,
    data: {
      lease: leaseResult.data,
      isCounteroffer: hasGuestCounteroffer,
      fourWeekRent,
      fourWeekCompensation
    }
  };
}

export default hostAcceptProposalWorkflow;
