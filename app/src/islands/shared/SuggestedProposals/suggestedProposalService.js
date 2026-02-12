/**
 * Suggested Proposal Service
 *
 * API layer for fetching and managing suggested proposals.
 * Uses native Supabase field names throughout.
 */

import { supabase } from '../../../lib/supabase.js';
import { loadProposalDetails } from '../../../lib/proposalDataFetcher.js';
import { PROPOSAL_STATUSES, isSuggestedProposal, isPendingConfirmationProposal } from '../../../logic/constants/proposalStatuses.js';

/**
 * Fetch all suggested proposals for a user
 *
 * @param {string} userId - The user's _id
 * @returns {Promise<Array>} Array of enriched proposal objects
 */
export async function fetchSuggestedProposals(userId) {
  if (!userId) {
    console.warn('fetchSuggestedProposals: No userId provided');
    return [];
  }

  try {
    // Fetch suggested proposals directly by guest_user_id
    // (Previously queried "Proposals List" column on user table, which doesn't exist)
    const { data: proposalsData, error: proposalsError } = await supabase
      .from('booking_proposal')
      .select('*')
      .eq('guest_user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('original_created_at', { ascending: false });

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
      return [];
    }

    // Filter to only suggested proposals
    const suggestedProposals = (proposalsData || []).filter(
      p => isSuggestedProposal(p.proposal_workflow_status)
    );

    console.log(`Found ${suggestedProposals.length} suggested proposals out of ${proposalsData?.length || 0} total`);

    if (suggestedProposals.length === 0) {
      return [];
    }

    // Step 4: Enrich each proposal with listing, guest, host data
    const enrichedProposals = await Promise.all(
      suggestedProposals.map(proposal => loadProposalDetails(proposal))
    );

    // Step 5: Fetch negotiation summaries if available
    // Note: Column name uses Bubble convention with space and capital P
    // IMPORTANT: Filter by "To Account" to only show summaries intended for this user
    const proposalIdsForSummaries = enrichedProposals.map(p => p.id);
    const { data: summariesData } = await supabase
      .from('negotiationsummary')
      .select('*')
      .in('"Proposal associated"', proposalIdsForSummaries)
      .eq('"To Account"', userId)
      .order('original_created_at', { ascending: false });

    // Attach summaries to proposals
    if (summariesData && summariesData.length > 0) {
      const summaryMap = {};
      summariesData.forEach(summary => {
        const proposalId = summary['Proposal associated'];
        if (!summaryMap[proposalId]) {
          summaryMap[proposalId] = [];
        }
        summaryMap[proposalId].push(summary);
      });

      enrichedProposals.forEach(proposal => {
        const pId = proposal.id;
        proposal._negotiationSummaries = summaryMap[pId] || [];
      });
    }

    return enrichedProposals;
  } catch (err) {
    console.error('Exception in fetchSuggestedProposals:', err);
    return [];
  }
}

/**
 * Mark a suggested proposal as "interested"
 *
 * This transitions the proposal from suggested status to active status,
 * indicating the guest wants to proceed with this suggestion.
 *
 * @param {string} proposalId - The proposal's _id
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markProposalInterested(proposalId) {
  if (!proposalId) {
    return { success: false, error: 'No proposal ID provided' };
  }

  try {
    // Update proposal status to indicate guest interest
    // This moves it from "Suggested" to "Awaiting Rental Application"
    const { error } = await supabase
      .from('booking_proposal')
      .update({
        proposal_workflow_status: PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key,
        original_updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (error) {
      console.error('Error marking proposal interested:', error);
      return { success: false, error: error.message };
    }

    console.log(`Marked proposal ${proposalId} as interested`);
    return { success: true };
  } catch (err) {
    console.error('Exception marking proposal interested:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Dismiss/remove a suggested proposal
 *
 * This soft-deletes the proposal or marks it as not interested,
 * removing it from the suggestions list. Optionally stores
 * feedback about why the user wasn't interested.
 *
 * @param {string} proposalId - The proposal's _id
 * @param {string|null} feedback - Optional feedback text explaining why not interested
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function dismissProposal(proposalId, feedback = null) {
  if (!proposalId) {
    return { success: false, error: 'No proposal ID provided' };
  }

  try {
    // Build update payload
    const updatePayload = {
      is_deleted: true,
      original_updated_at: new Date().toISOString()
    };

    // Store feedback if provided (using Guest Comments field)
    if (feedback && feedback.trim()) {
      updatePayload['Guest Comments'] = `[Not Interested] ${feedback.trim()}`;
    }

    // Soft delete the proposal
    const { error } = await supabase
      .from('booking_proposal')
      .update(updatePayload)
      .eq('id', proposalId);

    if (error) {
      console.error('Error dismissing proposal:', error);
      return { success: false, error: error.message };
    }

    console.log(`Dismissed proposal ${proposalId}${feedback ? ' with feedback' : ''}`);
    return { success: true };
  } catch (err) {
    console.error('Exception dismissing proposal:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch count of pending confirmation proposals for a user
 * Lightweight function for header badge display - no enrichment needed
 *
 * @param {string} userId - The user's _id
 * @returns {Promise<number>} Count of pending confirmation proposals
 */
export async function fetchPendingConfirmationCount(userId) {
  if (!userId) return 0;

  try {
    // Fetch proposals directly by guest_user_id and filter for pending confirmation
    const { data: proposalsData, error: proposalsError } = await supabase
      .from('booking_proposal')
      .select('id, proposal_workflow_status')
      .eq('guest_user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false');

    if (proposalsError || !proposalsData) {
      return 0;
    }

    const pendingCount = proposalsData.filter(
      p => isPendingConfirmationProposal(p.proposal_workflow_status)
    ).length;

    return pendingCount;
  } catch (err) {
    console.error('Exception in fetchPendingConfirmationCount:', err);
    return 0;
  }
}

/**
 * Fetch pending confirmation proposals for a user (with full enrichment)
 *
 * @param {string} userId - The user's _id
 * @returns {Promise<Array>} Array of enriched proposal objects
 */
export async function fetchPendingConfirmationProposals(userId) {
  if (!userId) {
    console.warn('fetchPendingConfirmationProposals: No userId provided');
    return [];
  }

  try {
    // Fetch proposals directly by guest_user_id
    const { data: proposalsData, error: proposalsError } = await supabase
      .from('booking_proposal')
      .select('*')
      .eq('guest_user_id', userId)
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('original_created_at', { ascending: false });

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
      return [];
    }

    // Filter to only pending confirmation proposals
    const pendingProposals = (proposalsData || []).filter(
      p => isPendingConfirmationProposal(p.proposal_workflow_status)
    );

    if (pendingProposals.length === 0) {
      return [];
    }

    // Step 4: Enrich each proposal with listing, guest, host data
    const enrichedProposals = await Promise.all(
      pendingProposals.map(proposal => loadProposalDetails(proposal))
    );

    // Step 5: Fetch negotiation summaries if available
    // Note: Column name uses Bubble convention with space and capital P
    // IMPORTANT: Filter by "To Account" to only show summaries intended for this user
    const proposalIdsForSummaries = enrichedProposals.map(p => p.id);
    const { data: summariesData } = await supabase
      .from('negotiationsummary')
      .select('*')
      .in('"Proposal associated"', proposalIdsForSummaries)
      .eq('"To Account"', userId)
      .order('original_created_at', { ascending: false });

    // Attach summaries to proposals
    if (summariesData && summariesData.length > 0) {
      const summaryMap = {};
      summariesData.forEach(summary => {
        const proposalId = summary['Proposal associated'];
        if (!summaryMap[proposalId]) {
          summaryMap[proposalId] = [];
        }
        summaryMap[proposalId].push(summary);
      });

      enrichedProposals.forEach(proposal => {
        const pId = proposal.id;
        proposal._negotiationSummaries = summaryMap[pId] || [];
      });
    }

    return enrichedProposals;
  } catch (err) {
    console.error('Exception in fetchPendingConfirmationProposals:', err);
    return [];
  }
}

/**
 * Get a single suggested proposal by ID with full details
 *
 * @param {string} proposalId - The proposal's _id
 * @returns {Promise<Object|null>} Enriched proposal or null
 */
export async function getSuggestedProposal(proposalId) {
  if (!proposalId) return null;

  try {
    const { data, error } = await supabase
      .from('booking_proposal')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error || !data) {
      console.error('Error fetching proposal:', error);
      return null;
    }

    // Verify it's a suggested proposal
    if (!isSuggestedProposal(data.proposal_workflow_status)) {
      console.warn('Proposal is not a suggested proposal:', data.proposal_workflow_status);
      return null;
    }

    // Enrich with related data
    return await loadProposalDetails(data);
  } catch (err) {
    console.error('Exception fetching suggested proposal:', err);
    return null;
  }
}
