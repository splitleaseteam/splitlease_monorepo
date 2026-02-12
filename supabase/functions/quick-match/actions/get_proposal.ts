/**
 * Get Proposal Action Handler
 * Split Lease - Quick Match Edge Function
 *
 * Fetches a proposal with its associated guest and listing details
 * for display in the Quick Match interface.
 */

import { createClient as _createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';
import type {
  GetProposalPayload,
  ProposalDetails,
  GuestInfo,
  ListingInfo,
  NightlyRates,
  ProposalRow,
  ListingRow,
  UserRow,
} from '../lib/types.ts';

/**
 * Handle fetching proposal details for Quick Match
 */
export async function handleGetProposal(
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<{ proposal: ProposalDetails }> {
  console.log('[quick-match:get_proposal] ========== GET PROPOSAL ==========');

  // Validate required fields
  validateRequiredFields(payload, ['proposal_id']);
  const { proposal_id } = payload as GetProposalPayload;

  console.log('[quick-match:get_proposal] Fetching proposal:', proposal_id);

  // Fetch proposal with related data
  const { data: proposalData, error: proposalError } = await supabase
    .from('proposal')
    .select(`
      id,
      guest_user_id,
      listing_id,
      "Guest email",
      host_user_id,
      proposal_workflow_status,
      "Move in range start",
      "Move in range end",
      "Reservation Span (Weeks)",
      "Days Selected",
      "Nights Selected (Nights list)",
      "nights per week (num)",
      "proposal nightly price",
      "cleaning fee",
      "damage deposit",
      Deleted
    `)
    .eq('id', proposal_id)
    .single();

  if (proposalError) {
    console.error('[quick-match:get_proposal] Database error:', proposalError);
    throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
  }

  if (!proposalData) {
    throw new Error(`Proposal not found: ${proposal_id}`);
  }

  const proposal = proposalData as ProposalRow;
  console.log('[quick-match:get_proposal] Proposal found, status:', proposal.proposal_workflow_status);

  // Fetch guest data
  const guest = await fetchGuestInfo(supabase, proposal.guest_user_id);
  console.log('[quick-match:get_proposal] Guest:', guest.fullName || guest.email);

  // Fetch listing data with borough/hood names
  const listing = await fetchListingInfo(supabase, proposal.listing_id);
  console.log('[quick-match:get_proposal] Listing:', listing.title);

  // Build response
  const proposalDetails: ProposalDetails = {
    id: proposal.id,
    guest,
    listing,
    daysSelected: normalizeJsonbArray(proposal['Days Selected']),
    nightsPerWeek: proposal['nights per week (num)'] || 0,
    nightlyPrice: proposal['proposal nightly price'] || 0,
    moveInStart: proposal['Move in range start'],
    moveInEnd: proposal['Move in range end'],
    status: proposal.proposal_workflow_status,
    reservationWeeks: proposal['Reservation Span (Weeks)'],
  };

  console.log('[quick-match:get_proposal] ========== SUCCESS ==========');

  return { proposal: proposalDetails };
}

/**
 * Fetch guest information
 */
async function fetchGuestInfo(
  supabase: SupabaseClient,
  guestId: string | null
): Promise<GuestInfo> {
  if (!guestId) {
    return {
      id: '',
      firstName: null,
      lastName: null,
      fullName: null,
      email: null,
    };
  }

  const { data, error } = await supabase
    .from('user')
    .select(`
      id,
      first_name,
      last_name,
      email
    `)
    .eq('id', guestId)
    .single();

  if (error || !data) {
    console.warn('[quick-match:get_proposal] Guest not found:', guestId);
    return {
      id: guestId,
      firstName: null,
      lastName: null,
      fullName: null,
      email: null,
    };
  }

  const user = data as UserRow;
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
    email: user.email,
  };
}

/**
 * Fetch listing information with borough and hood names
 */
async function fetchListingInfo(
  supabase: SupabaseClient,
  listingId: string | null
): Promise<ListingInfo> {
  const emptyListing: ListingInfo = {
    id: '',
    title: null,
    borough: null,
    boroughName: null,
    hood: null,
    hoodName: null,
    address: null,
    nightlyRates: {
      rate1: null,
      rate2: null,
      rate3: null,
      rate4: null,
      rate5: null,
      rate6: null,
      rate7: null,
    },
    cleaningFee: null,
    damageDeposit: null,
    minimumNights: null,
    maximumNights: null,
    daysAvailable: [],
    nightsAvailable: [],
    active: false,
  };

  if (!listingId) {
    return emptyListing;
  }

  // Fetch listing
  const { data, error } = await supabase
    .from('listing')
    .select(`
      id,
      Name,
      host_user_id,
      "Location - Borough",
      "Location - Hood",
      "Location - Address",
      "Days Available (List of Days)",
      "Nights Available (List of Nights)",
      "Minimum Nights",
      "Maximum Nights",
      "nightly_rate_1_night",
      "nightly_rate_2_nights",
      "nightly_rate_3_nights",
      "nightly_rate_4_nights",
      "nightly_rate_5_nights",
      "nightly_rate_6_nights",
      "nightly_rate_7_nights",
      "cleaning_fee",
      "damage_deposit",
      Active,
      Deleted
    `)
    .eq('id', listingId)
    .single();

  if (error || !data) {
    console.warn('[quick-match:get_proposal] Listing not found:', listingId);
    return { ...emptyListing, id: listingId };
  }

  const listing = data as ListingRow;

  // Fetch borough name if we have a borough ID
  let boroughName: string | null = null;
  if (listing['Location - Borough']) {
    const { data: boroughData } = await supabase
      .from('zat_geo_borough_toplevel')
      .select('Display')
      .eq('id', listing['Location - Borough'])
      .single();

    boroughName = boroughData?.Display || listing['Location - Borough'];
  }

  // Fetch hood name if we have a hood ID
  let hoodName: string | null = null;
  if (listing['Location - Hood']) {
    const { data: hoodData } = await supabase
      .from('zat_geo_hood_mediumlevel')
      .select('Display')
      .eq('id', listing['Location - Hood'])
      .single();

    hoodName = hoodData?.Display || listing['Location - Hood'];
  }

  const nightlyRates: NightlyRates = {
    rate1: listing['nightly_rate_1_night'],
    rate2: listing['nightly_rate_2_nights'],
    rate3: listing['nightly_rate_3_nights'],
    rate4: listing['nightly_rate_4_nights'],
    rate5: listing['nightly_rate_5_nights'],
    rate6: listing['nightly_rate_6_nights'],
    rate7: listing['nightly_rate_7_nights'],
  };

  return {
    id: listing.id,
    title: listing.Name,
    borough: listing['Location - Borough'],
    boroughName,
    hood: listing['Location - Hood'],
    hoodName,
    address: listing['Location - Address'],
    nightlyRates,
    cleaningFee: listing['cleaning_fee'],
    damageDeposit: listing['damage_deposit'],
    minimumNights: listing['Minimum Nights'],
    maximumNights: listing['Maximum Nights'],
    daysAvailable: normalizeJsonbArray(listing['Days Available (List of Days)']),
    nightsAvailable: normalizeJsonbArray(listing['Nights Available (List of Nights)']),
    active: listing.Active ?? false,
  };
}

/**
 * Normalize JSONB array fields (handle both array and stringified array)
 */
function normalizeJsonbArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((v) => typeof v === 'number' ? v : parseInt(String(v), 10))
      .filter((v) => !isNaN(v));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v: unknown) => typeof v === 'number' ? v : parseInt(String(v), 10))
          .filter((v: number) => !isNaN(v));
      }
    } catch {
      // Not valid JSON
    }
  }

  return [];
}
