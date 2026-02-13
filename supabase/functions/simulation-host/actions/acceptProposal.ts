/**
 * Accept Proposal Action Handler
 * Host accepts a proposal and creates a lease
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AcceptProposalPayload {
  simulationId: string;
  proposalId: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AcceptProposalResult {
  proposalId: string;
  leaseId: string | null;
  status: string;
  simulationId: string;
}

export async function handleAcceptProposal(
  payload: AcceptProposalPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<AcceptProposalResult> {
  console.log('[acceptProposal] Starting for proposal:', payload.proposalId);

  const { simulationId, proposalId } = payload;

  if (!simulationId || !proposalId) {
    throw new Error('simulationId and proposalId are required');
  }

  // Verify proposal exists
  const { data: proposal, error: fetchError } = await supabase
    .from('booking_proposal')
    .select('id, proposal_workflow_status, guest_user_id, host_user_id, listing_id')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) {
    console.error('[acceptProposal] Proposal not found:', fetchError);
    throw new Error('Proposal not found');
  }

  // Step 1: Update proposal status to accepted
  const { error: acceptError } = await supabase
    .from('booking_proposal')
    .update({
      proposal_workflow_status: 'Host Accepted - Lease Pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (acceptError) {
    console.error('[acceptProposal] Error accepting proposal:', acceptError);
    throw new Error('Failed to accept proposal');
  }

  // Step 2: Create lease record
  // booking_lease columns: guest_user_id, host_user_id, listing_id, is_lease_signed, lease_type, created_at
  let leaseId: string | null = null;

  try {
    const { data: lease, error: leaseError } = await supabase
      .from('booking_lease')
      .insert({
        guest_user_id: proposal.guest_user_id,
        host_user_id: proposal.host_user_id,
        listing_id: proposal.listing_id,
        lease_type: 'Drafting',
        is_lease_signed: false,
        created_at: new Date().toISOString(),
      })
       .select('id')
       .single();

    if (leaseError) {
      console.warn('[acceptProposal] Could not create lease:', leaseError);
    } else if (lease) {
      leaseId = lease.id;
      console.log('[acceptProposal] Created lease:', leaseId);
    }
  } catch (leaseErr) {
    console.warn('[acceptProposal] Lease creation failed:', leaseErr);
  }

  // Update host's usability step
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (hostUser) {
    await supabase
      .from('user')
      .update({ onboarding_usability_step: 4 })
      .eq('id', hostUser.id);
  }

  console.log('[acceptProposal] Completed - proposal accepted, lease created');

  return {
    proposalId,
    leaseId,
    status: 'Host Accepted - Lease Pending',
    simulationId,
  };
}
