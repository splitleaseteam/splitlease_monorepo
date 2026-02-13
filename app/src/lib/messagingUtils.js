import { supabase } from './supabase.js';

/**
 * Find thread ID for a given proposal
 * @param {string} proposalId - The proposal ID
 * @returns {Promise<string|null>} The thread ID or null if not found
 */
export async function findThreadByProposal(proposalId) {
  if (!proposalId) return null;

  const { data, error } = await supabase
    .from('message_thread')
    .select('id')
    .eq('proposal_id', proposalId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[messagingUtils] Thread lookup error:', error);
    return null;
  }

  return data?.id || null;
}
