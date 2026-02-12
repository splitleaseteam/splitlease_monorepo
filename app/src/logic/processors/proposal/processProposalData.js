/**
 * Process raw proposal data from Supabase into a clean, validated proposal object.
 *
 * @intent Transform raw proposal rows from Supabase into consistent, UI-ready format.
 * @rule NO FALLBACK - Throws explicit errors for missing critical fields.
 * @rule Merges original terms and counteroffer (host-changed) terms into single current terms.
 * @rule Handles dual proposal system (original vs host counteroffer).
 *
 * @param {object} params - Named parameters.
 * @param {object} params.rawProposal - Raw proposal object from Supabase.
 * @param {object} [params.listing] - Processed listing data (if already loaded).
 * @param {object} [params.guest] - Processed guest user data (if already loaded).
 * @param {object} [params.host] - Processed host user data (if already loaded).
 * @returns {object} Clean, validated proposal object with merged terms.
 *
 * @throws {Error} If rawProposal is null/undefined.
 * @throws {Error} If critical id field is missing.
 * @throws {Error} If Listing or Guest reference is missing.
 *
 * @example
 * const proposal = processProposalData({
 *   rawProposal: {
 *     id: 'abc123',
 *     Listing: 'listing123',
 *     Guest: 'user456',
 *     'Move-In Date': '2025-01-15',
 *     'Days of Week': [1, 2, 3],
 *     'host_counter_offer_days_of_week': null,
 *     'Proposal Status': 'Host Countered',
 *     ...
 *   }
 * })
 */
import { PROPOSAL_STATUSES, getUsualOrder } from '../../constants/proposalStatuses.js'

export function processProposalData({ rawProposal, listing = null, guest = null, host = null }) {
  // No Fallback: Proposal data must exist
  if (!rawProposal) {
    throw new Error('processProposalData: rawProposal cannot be null or undefined')
  }

  // Validate critical ID field
  if (!rawProposal.id) {
    throw new Error('processProposalData: Proposal missing critical id field')
  }

  // Validate required foreign key references
  if (!rawProposal.Listing) {
    throw new Error(
      `processProposalData: Proposal ${rawProposal.id} missing required Listing reference`
    )
  }

  if (!rawProposal.Guest) {
    throw new Error(
      `processProposalData: Proposal ${rawProposal.id} missing required Guest reference`
    )
  }

  // Determine which terms are current (original or host-changed)
  const status = typeof rawProposal.Status === 'string'
    ? rawProposal.Status.trim()
    : (typeof rawProposal.status === 'string' ? rawProposal.status.trim() : 'Draft')

  const hasHostCounteroffer = status === PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key.trim()

  // Merge terms: Use host-changed (hc) fields if they exist, otherwise use original
  const currentTerms = {
    moveInDate: hasHostCounteroffer && rawProposal['host_counter_offer_move_in_date']
      ? rawProposal['host_counter_offer_move_in_date']
      : rawProposal['Move-In Date'],

    daysOfWeek: hasHostCounteroffer && rawProposal['host_counter_offer_days_of_week']
      ? rawProposal['host_counter_offer_days_of_week']
      : rawProposal['Days of Week'],

    weeks: hasHostCounteroffer && rawProposal['host_counter_offer_weeks']
      ? rawProposal['host_counter_offer_weeks']
      : rawProposal.Weeks,

    totalRent: hasHostCounteroffer && rawProposal['host_counter_offer_total_price']
      ? rawProposal['host_counter_offer_total_price']
      : rawProposal['Total Rent'],

    cleaningFee: hasHostCounteroffer && rawProposal['host_counter_offer_cleaning_fee']
      ? rawProposal['host_counter_offer_cleaning_fee']
      : rawProposal['Cleaning Fee'],

    securityDeposit: hasHostCounteroffer && rawProposal['host_counter_offer_damage_deposit']
      ? rawProposal['host_counter_offer_damage_deposit']
      : rawProposal['Security Deposit'],

    houseRules: hasHostCounteroffer && rawProposal['host_counter_offer_house_rules']
      ? rawProposal['host_counter_offer_house_rules']
      : rawProposal['House Rules'],

    moveOutDate: hasHostCounteroffer && rawProposal['host_counter_offer_move_out_date']
      ? rawProposal['host_counter_offer_move_out_date']
      : rawProposal['Move-Out Date']
  }

  // Preserve original terms for comparison
  const originalTerms = {
    moveInDate: rawProposal['Move-In Date'],
    daysOfWeek: rawProposal['Days of Week'],
    weeks: rawProposal.Weeks,
    totalRent: rawProposal['Total Rent'],
    cleaningFee: rawProposal['Cleaning Fee'],
    securityDeposit: rawProposal['Security Deposit'],
    houseRules: rawProposal['House Rules'],
    moveOutDate: rawProposal['Move-Out Date']
  }

  return {
    // Identity
    id: rawProposal.id,
    listingId: rawProposal.Listing,
    guestId: rawProposal.Guest,

    // Status and workflow
    status,
    deleted: rawProposal.Deleted === true,
    usualOrder: getUsualOrder(status),

    // Current terms (merged from original or counteroffer)
    currentTerms,

    // Original terms (for comparison in Compare Terms modal)
    originalTerms,
    hasCounteroffer: hasHostCounteroffer,

    // Additional details
    virtualMeetingId: rawProposal['virtual meeting'] || null,
    houseManualAccessed: rawProposal['Did user access house manual?'] === true,

    // Cancellation
    cancellationReason: rawProposal['reason for cancellation'] || null,

    // Timestamps
    createdDate: rawProposal.original_created_at,
    modifiedDate: rawProposal.original_updated_at,

    // Enriched data (if provided)
    _listing: listing,
    _guest: guest,
    _host: host
  }
}
