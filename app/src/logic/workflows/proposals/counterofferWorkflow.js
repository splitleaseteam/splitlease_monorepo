/**
 * Counteroffer Workflow Module
 *
 * PILLAR IV: Workflow Orchestrators (The "Flow" Layer)
 *
 * Implements the counteroffer acceptance workflow from Bubble.io:
 *
 * 7 Steps (Accept Counteroffer):
 * 1. Show success alert (48-hour timeline)
 * 2. Calculate lease numbering format (based on count)
 * 3. Set state: Number of zeros
 * 4. Calculate 4-week compensation (original proposal)
 * 5. Update proposal status -> "Drafting Lease Documents"
 * 6. Calculate 4-week rent (counteroffer terms)
 * 7. Schedule API workflow: CORE-create-lease (+15 seconds)
 */

import { supabase } from '../../../lib/supabase.js';
import { hasReviewableCounteroffer } from '../../rules/proposals/proposalRules.js';
import { PROPOSAL_STATUSES } from '../../constants/proposalStatuses.js';

/**
 * Accept a counteroffer
 * Updates proposal status and prepares for lease creation
 *
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Updated proposal data
 */
export async function acceptCounteroffer(proposalId) {
  if (!proposalId) {
    throw new Error('Proposal ID is required');
  }

  console.log('[counterofferWorkflow] Accepting counteroffer for proposal:', proposalId);

  // First, fetch the proposal to validate it has a counteroffer
  // Use .maybeSingle() instead of .single() to avoid 406 error when proposal not found
  const { data: proposal, error: fetchError } = await supabase
    .from('proposal')
    .select('*')
    .eq('_id', proposalId)
    .maybeSingle();

  if (fetchError) {
    console.error('[counterofferWorkflow] Error fetching proposal:', {
      code: fetchError.code,
      message: fetchError.message,
      details: fetchError.details,
      hint: fetchError.hint
    });
    throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
  }

  if (!proposal) {
    throw new Error(`Proposal not found with ID: ${proposalId}. It may not be synced to Supabase yet.`);
  }

  if (!proposal['counter offer happened']) {
    throw new Error('Proposal does not have a counteroffer to accept');
  }

  // Update proposal status to accepted
  const now = new Date().toISOString();
  const updateData = {
    'Status': PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key,
    'Modified Date': now,
    'Is Finalized': true
  };

  // Remove .single() to avoid 406 error - handle array response instead
  const { data, error } = await supabase
    .from('proposal')
    .update(updateData)
    .eq('_id', proposalId)
    .select();

  if (error) {
    console.error('[counterofferWorkflow] Error accepting counteroffer:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to accept counteroffer: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No proposal updated - proposal may not exist with ID: ${proposalId}`);
  }

  const updatedProposal = data[0];

  console.log('[counterofferWorkflow] Counteroffer accepted successfully:', proposalId);

  // Trigger lease creation via Edge Function (fire and forget)
  // Note: When called from CompareTermsModal, the modal handles lease creation directly
  // This is a fallback for other code paths that call acceptCounteroffer directly
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && proposal) {
    const originalNightsPerWeek = proposal['nights per week (num)'] || 0;
    const originalNightlyPrice = proposal['proposal nightly price'] || 0;
    const fourWeekCompensation = originalNightsPerWeek * 4 * originalNightlyPrice;
    const fourWeekRent = fourWeekCompensation; // Same for non-counteroffer flow

    fetch(`${supabaseUrl}/functions/v1/lease`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        payload: {
          proposalId,
          isCounteroffer: false,
          fourWeekRent,
          fourWeekCompensation,
        },
      }),
    }).catch(err => {
      console.warn('[counterofferWorkflow] Lease creation trigger failed (non-blocking):', err);
    });
  }

  return updatedProposal;
}

/**
 * Decline a counteroffer (equivalent to cancel proposal)
 *
 * @param {string} proposalId - Proposal ID
 * @param {string} reason - Reason for declining
 * @returns {Promise<Object>} Updated proposal data
 */
export async function declineCounteroffer(proposalId, reason = 'Counteroffer declined by guest') {
  if (!proposalId) {
    throw new Error('Proposal ID is required');
  }

  console.log('[counterofferWorkflow] Declining counteroffer for proposal:', proposalId);

  const now = new Date().toISOString();
  const updateData = {
    'Status': PROPOSAL_STATUSES.CANCELLED_BY_GUEST.key,
    'Deleted': true,
    'Modified Date': now,
    'reason for cancellation': reason
  };

  // Remove .single() to avoid 406 error - handle array response instead
  const { data, error } = await supabase
    .from('proposal')
    .update(updateData)
    .eq('_id', proposalId)
    .select();

  if (error) {
    console.error('[counterofferWorkflow] Error declining counteroffer:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to decline counteroffer: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`No proposal updated - proposal may not exist with ID: ${proposalId}`);
  }

  const updatedProposal = data[0];
  console.log('[counterofferWorkflow] Counteroffer declined successfully:', proposalId);
  return updatedProposal;
}

/**
 * Get comparison data between original terms and counteroffer
 *
 * @param {Object} proposal - Proposal object
 * @returns {Object} Comparison data
 */
export function getTermsComparison(proposal) {
  if (!proposal) {
    throw new Error('Proposal is required');
  }

  const originalTerms = {
    daysSelected: proposal.daysSelected || proposal['Days Selected'] || [],
    nightsPerWeek: proposal.nightsPerWeek || proposal['nights per week (num)'] || 0,
    reservationWeeks: proposal.reservationWeeks || proposal['Reservation Span (Weeks)'] || 0,
    checkInDay: proposal.checkInDay || proposal['check in day'] || null,
    checkOutDay: proposal.checkOutDay || proposal['check out day'] || null,
    totalPrice: proposal.totalPrice || proposal['Total Price for Reservation (guest)'] || 0,
    nightlyPrice: proposal.nightlyPrice || proposal['proposal nightly price'] || 0,
    damageDeposit: proposal.damageDeposit || proposal['damage deposit'] || 0,
    cleaningFee: proposal.cleaningFee || proposal['cleaning fee'] || 0
  };

  const counterofferTerms = {
    daysSelected: proposal.hcDaysSelected || proposal['hc days selected'] || originalTerms.daysSelected,
    nightsPerWeek: proposal.hcNightsPerWeek || proposal['hc nights per week'] || originalTerms.nightsPerWeek,
    reservationWeeks: proposal.hcReservationWeeks || proposal['hc reservation span (weeks)'] || originalTerms.reservationWeeks,
    checkInDay: proposal.hcCheckInDay || proposal['hc check in day'] || originalTerms.checkInDay,
    checkOutDay: proposal.hcCheckOutDay || proposal['hc check out day'] || originalTerms.checkOutDay,
    totalPrice: proposal.hcTotalPrice || proposal['hc total price'] || originalTerms.totalPrice,
    nightlyPrice: proposal.hcNightlyPrice || proposal['hc nightly price'] || originalTerms.nightlyPrice,
    damageDeposit: proposal.hcDamageDeposit || proposal['hc damage deposit'] || originalTerms.damageDeposit,
    cleaningFee: proposal.hcCleaningFee || proposal['hc cleaning fee'] || originalTerms.cleaningFee
  };

  // Build list of changes
  const changes = [];

  if (originalTerms.totalPrice !== counterofferTerms.totalPrice) {
    changes.push({
      field: 'totalPrice',
      label: 'Total Price',
      original: originalTerms.totalPrice,
      modified: counterofferTerms.totalPrice
    });
  }

  if (originalTerms.nightlyPrice !== counterofferTerms.nightlyPrice) {
    changes.push({
      field: 'nightlyPrice',
      label: 'Nightly Rate',
      original: originalTerms.nightlyPrice,
      modified: counterofferTerms.nightlyPrice
    });
  }

  if (originalTerms.reservationWeeks !== counterofferTerms.reservationWeeks) {
    changes.push({
      field: 'reservationWeeks',
      label: 'Duration (Weeks)',
      original: originalTerms.reservationWeeks,
      modified: counterofferTerms.reservationWeeks
    });
  }

  if (originalTerms.nightsPerWeek !== counterofferTerms.nightsPerWeek) {
    changes.push({
      field: 'nightsPerWeek',
      label: 'Nights per Week',
      original: originalTerms.nightsPerWeek,
      modified: counterofferTerms.nightsPerWeek
    });
  }

  if (JSON.stringify(originalTerms.daysSelected) !== JSON.stringify(counterofferTerms.daysSelected)) {
    changes.push({
      field: 'daysSelected',
      label: 'Weekly Schedule',
      original: originalTerms.daysSelected,
      modified: counterofferTerms.daysSelected
    });
  }

  return {
    originalTerms,
    counterofferTerms,
    changes,
    hasChanges: changes.length > 0
  };
}
