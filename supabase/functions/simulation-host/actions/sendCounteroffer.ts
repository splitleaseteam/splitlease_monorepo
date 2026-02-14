/**
 * Send Counteroffer Action Handler
 * Host sends a counteroffer, then guest automatically rejects it (simulated)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SendCounterofferPayload {
  simulationId: string;
  proposalId: string;
  counterofferData?: {
    nightlyPrice?: number;
    nightsPerWeek?: number;
    checkInDay?: number;
    checkOutDay?: number;
  };
}

interface AuthUser {
  id: string;
  email: string;
}

interface CounterofferResult {
  proposalId: string;
  status: string;
  counterofferSent: boolean;
  guestRejected: boolean;
  simulationId: string;
}

export async function handleSendCounteroffer(
  payload: SendCounterofferPayload,
  user: AuthUser,
  supabase: SupabaseClient
): Promise<CounterofferResult> {
  console.log('[sendCounteroffer] Starting for proposal:', payload.proposalId);

  const { simulationId, proposalId, counterofferData } = payload;

  if (!simulationId || !proposalId) {
    throw new Error('simulationId and proposalId are required');
  }

  // Verify proposal exists and belongs to this simulation
  const { data: proposal, error: fetchError } = await supabase
    .from('booking_proposal')
    .select('id, proposal_workflow_status, simulation_id, calculated_nightly_price, nights_per_week_count')
    .eq('id', proposalId)
    .single();

  if (fetchError || !proposal) {
    console.error('[sendCounteroffer] Proposal not found:', fetchError);
    throw new Error('Proposal not found');
  }

  if (proposal.simulation_id !== simulationId) {
    throw new Error('Proposal does not belong to this simulation');
  }

  // Default counteroffer values (10% higher price)
  const defaultCounteroffer = {
    nightlyPrice: Math.round((proposal.calculated_nightly_price || 100) * 1.1),
    nightsPerWeek: (proposal.nights_per_week_count || 4) - 1,
    checkInDay: 3, // Wednesday
    checkOutDay: 0, // Sunday
  };

  const offer = { ...defaultCounteroffer, ...counterofferData };

  // Step 1: Update proposal with host counteroffer
  const { error: counterError } = await supabase
    .from('booking_proposal')
    .update({
      host_proposed_nightly_price: offer.nightlyPrice,
      host_proposed_nights_per_week: offer.nightsPerWeek,
      host_proposed_checkin_day: offer.checkInDay,
      host_proposed_checkout_day: offer.checkOutDay,
      proposal_workflow_status: 'Host Counteroffer Sent',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (counterError) {
    console.error('[sendCounteroffer] Error sending counteroffer:', counterError);
    throw new Error('Failed to send counteroffer');
  }

  console.log('[sendCounteroffer] Counteroffer sent, simulating guest rejection...');

  // Step 2: Simulate guest rejection (after a brief pause conceptually)
  const { error: rejectError } = await supabase
    .from('booking_proposal')
    .update({
      proposal_workflow_status: 'Guest Rejected Host Counteroffer',
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId);

  if (rejectError) {
    console.error('[sendCounteroffer] Error simulating rejection:', rejectError);
    throw new Error('Failed to simulate guest rejection');
  }

  // Update host's usability step
  const { data: hostUser } = await supabase
    .from('user')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  if (hostUser) {
    await supabase
      .from('user')
      .update({ onboarding_usability_step: 3 })
      .eq('id', hostUser.id);
  }

  console.log('[sendCounteroffer] Completed - guest rejected counteroffer');

  return {
    proposalId,
    status: 'Guest Rejected Host Counteroffer',
    counterofferSent: true,
    guestRejected: true,
    simulationId,
  };
}
