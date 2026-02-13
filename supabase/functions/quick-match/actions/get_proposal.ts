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
    .from('booking_proposal')
    .select(`
      id,
      guest_user_id,
      listing_id,
      guest_email_address,
      host_user_id,
      proposal_workflow_status,
      move_in_range_start_date,
      move_in_range_end_date,
      reservation_span_in_weeks,
      guest_selected_days_numbers_json,
      guest_selected_nights_numbers_json,
      nights_per_week_count,
      calculated_nightly_price,
      cleaning_fee_amount,
      damage_deposit_amount,
      is_deleted
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
    daysSelected: normalizeJsonbArray(proposal.guest_selected_days_numbers_json),
    nightsPerWeek: proposal.nights_per_week_count || 0,
    nightlyPrice: proposal.calculated_nightly_price || 0,
    moveInStart: proposal.move_in_range_start_date,
    moveInEnd: proposal.move_in_range_end_date,
    status: proposal.proposal_workflow_status,
    reservationWeeks: proposal.reservation_span_in_weeks,
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
      listing_title,
      host_user_id,
      borough,
      primary_neighborhood_reference_id,
      address_with_lat_lng_json,
      available_days_as_day_numbers_json,
      available_nights_as_day_numbers_json,
      minimum_nights_per_stay,
      maximum_nights_per_stay,
      nightly_rate_for_1_night_stay,
      nightly_rate_for_2_night_stay,
      nightly_rate_for_3_night_stay,
      nightly_rate_for_4_night_stay,
      nightly_rate_for_5_night_stay,
      nightly_rate_for_7_night_stay,
      cleaning_fee_amount,
      damage_deposit_amount,
      is_active,
      is_deleted
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
  if (listing.borough) {
    const { data: boroughData } = await supabase
      .schema('reference_table')
      .from('zat_geo_borough_toplevel')
      .select('display_borough')
      .eq('id', listing.borough)
      .single();

    boroughName = boroughData?.display_borough || listing.borough;
  }

  // Fetch hood name if we have a hood ID
  let hoodName: string | null = null;
  if (listing.primary_neighborhood_reference_id) {
    const { data: hoodData } = await supabase
      .schema('reference_table')
      .from('zat_geo_hood_mediumlevel')
      .select('display')
      .eq('id', listing.primary_neighborhood_reference_id)
      .single();

    hoodName = hoodData?.display || listing.primary_neighborhood_reference_id;
  }

  const nightlyRates: NightlyRates = {
    rate1: listing.nightly_rate_for_1_night_stay ?? null,
    rate2: listing.nightly_rate_for_2_night_stay ?? null,
    rate3: listing.nightly_rate_for_3_night_stay ?? null,
    rate4: listing.nightly_rate_for_4_night_stay ?? null,
    rate5: listing.nightly_rate_for_5_night_stay ?? null,
    rate6: null,
    rate7: listing.nightly_rate_for_7_night_stay ?? null,
  };

  return {
    id: listing.id,
    title: listing.listing_title,
    borough: listing.borough,
    boroughName,
    hood: listing.primary_neighborhood_reference_id,
    hoodName,
    address: listing.address_with_lat_lng_json,
    nightlyRates,
    cleaningFee: listing.cleaning_fee_amount ?? null,
    damageDeposit: listing.damage_deposit_amount ?? null,
    minimumNights: listing.minimum_nights_per_stay,
    maximumNights: listing.maximum_nights_per_stay,
    daysAvailable: normalizeJsonbArray(listing.available_days_as_day_numbers_json),
    nightsAvailable: normalizeJsonbArray(listing.available_nights_as_day_numbers_json),
    active: listing.is_active ?? false,
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
