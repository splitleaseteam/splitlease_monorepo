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

import { PROPOSAL_STATUSES } from '../../constants/proposalStatuses.js';

/**
 * Accept a counteroffer
 * Updates proposal status and prepares for lease creation
 *
 * Uses Edge Function to bypass RLS policies (legacy auth users don't have
 * Supabase Auth sessions, so direct Supabase calls are blocked by RLS).
 *
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} Result from Edge Function
 */
export async function acceptCounteroffer(proposalId) {
  if (!proposalId) {
    throw new Error('Proposal ID is required');
  }

  console.log('[counterofferWorkflow] Accepting counteroffer for proposal:', proposalId);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }

  // Call Edge Function which uses service_role key to bypass RLS
  const response = await fetch(`${supabaseUrl}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'acceptCounteroffer',
      payload: {
        proposalId,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error('[counterofferWorkflow] Edge Function error:', result);
    throw new Error(result.error || 'Failed to accept counteroffer');
  }

  console.log('[counterofferWorkflow] Counteroffer accepted successfully via Edge Function:', proposalId);

  // Note: Lease creation is handled separately by useCompareTermsModalLogic.js
  // The Edge Function only updates the proposal status and copies counteroffer terms

  return result.data;
}

/**
 * Decline a counteroffer (equivalent to cancel proposal)
 *
 * Uses Edge Function to bypass RLS policies.
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }

  // Call Edge Function which uses service_role key to bypass RLS
  // Uses 'update' action with the expected payload structure
  const response = await fetch(`${supabaseUrl}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'update',
      payload: {
        proposal_id: proposalId,  // underscore format expected by Edge Function
        status: PROPOSAL_STATUSES.CANCELLED_BY_GUEST.key,
        reason_for_cancellation: reason
      },
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error('[counterofferWorkflow] Edge Function error:', result);
    throw new Error(result.error || 'Failed to decline counteroffer');
  }

  console.log('[counterofferWorkflow] Counteroffer declined successfully via Edge Function:', proposalId);
  return result.data;
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
