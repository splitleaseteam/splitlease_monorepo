/**
 * Delete Proposal Action Handler
 * Deletes a proposal by ID (supports both id and legacy platform ID)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DeleteProposalPayload {
  proposalId: string;
  deleteThread?: boolean;  // Whether to also delete the associated thread (default: true)
}

export async function handleDeleteProposal(
  payload: DeleteProposalPayload,
  supabase: SupabaseClient
) {
  const { proposalId, deleteThread = true } = payload;

  if (!proposalId) {
    throw new Error('proposalId is required');
  }

  console.log('[usability-data-admin] Deleting proposal:', proposalId);

  // First, try to find the proposal
  let { data: proposal, error: fetchError } = await supabase
    .from('booking_proposal')
    .select('id')
    .eq('id', proposalId)
    .single();

  // If not found by id, try by legacy_platform_id
  if (fetchError && fetchError.code === 'PGRST116') {
    const result = await supabase
      .from('booking_proposal')
      .select('id')
      .eq('legacy_platform_id', proposalId)
      .single();

    proposal = result.data;
    fetchError = result.error;
  }

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error(`Proposal not found: ${proposalId}`);
    }
    console.error('[usability-data-admin] Fetch proposal error:', fetchError);
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  const actualProposalId = proposal.id;
  let threadId: string | null = null;

  // Delete the proposal
  const { error: deleteError } = await supabase
    .from('booking_proposal')
    .delete()
    .eq('id', actualProposalId);

  if (deleteError) {
    console.error('[usability-data-admin] Delete proposal error:', deleteError);
    throw new Error(`Failed to delete proposal: ${deleteError.message}`);
  }

  console.log('[usability-data-admin] Proposal deleted:', actualProposalId);

  // Optionally delete the associated thread
  let threadDeleted = false;
  if (deleteThread) {
    const { data: deletedThreads, error: threadDeleteError } = await supabase
      .from('message_threads')
      .delete()
      .eq('proposal_id', actualProposalId)
      .select('thread_id');

    if (threadDeleteError) {
      console.warn('[usability-data-admin] Failed to delete thread:', threadDeleteError);
    } else {
      threadId = deletedThreads?.[0]?.thread_id || null;
      threadDeleted = (deletedThreads?.length || 0) > 0;
      console.log('[usability-data-admin] Thread deleted for proposal:', actualProposalId);
    }
  }

  const timestamp = new Date().toISOString();

  return {
    success: true,
    message: `Deleted proposal ${actualProposalId}`,
    proposalId: actualProposalId,
    threadId: threadId || null,
    threadDeleted,
    timestamp,
  };
}
