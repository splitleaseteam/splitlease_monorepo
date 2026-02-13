/**
 * Search Candidates Action Handler
 * Split Lease - Quick Match Edge Function
 *
 * Finds candidate listings that could match the proposal,
 * calculates match scores, and returns sorted results.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';
import {
  calculateMatchScore,
  getMatchTier,
} from '../lib/scoring.ts';
import type {
  SearchCandidatesPayload,
  SearchCandidatesResult,
  CandidateMatch,
  ListingInfo,
  HostInfo,
  ProposalDetails,
  NightlyRates,
  ListingRow,
  UserRow,
} from '../lib/types.ts';

// Default configuration
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Handle searching for candidate listings
 */
export async function handleSearchCandidates(
  payload: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<SearchCandidatesResult> {
  console.log('[quick-match:search_candidates] ========== SEARCH CANDIDATES ==========');

  // Validate required fields
  validateRequiredFields(payload, ['proposal_id']);
  const {
    proposal_id,
    filters = {},
    limit = DEFAULT_LIMIT,
  } = payload as SearchCandidatesPayload;

  const effectiveLimit = Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT);

  console.log('[quick-match:search_candidates] Proposal ID:', proposal_id);
  console.log('[quick-match:search_candidates] Filters:', JSON.stringify(filters));
  console.log('[quick-match:search_candidates] Limit:', effectiveLimit);

  // First, fetch the proposal to get matching criteria
  const proposal = await fetchProposalDetails(supabase, proposal_id);
  console.log('[quick-match:search_candidates] Proposal loaded, listing:', proposal.listing.id);

  // Build and execute the candidates query
  const candidates = await fetchAndScoreCandidates(
    supabase,
    proposal,
    filters,
    effectiveLimit
  );

  console.log('[quick-match:search_candidates] Candidates found:', candidates.length);
  console.log('[quick-match:search_candidates] ========== SUCCESS ==========');

  return {
    candidates,
    total: candidates.length,
    filtersApplied: filters,
  };
}

/**
 * Fetch proposal details for matching
 */
async function fetchProposalDetails(
  supabase: SupabaseClient,
  proposalId: string
): Promise<ProposalDetails> {
  // Fetch proposal
  const { data: proposalData, error: proposalError } = await supabase
    .from('booking_proposal')
    .select(`
      id,
      guest_user_id,
      listing_id,
      guest_email_address,
      move_in_range_start_date,
      move_in_range_end_date,
      reservation_span_in_weeks,
      guest_selected_days_numbers_json,
      nights_per_week_count,
      calculated_nightly_price,
      proposal_workflow_status
    `)
    .eq('id', proposalId)
    .single();

  if (proposalError || !proposalData) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  // Fetch the proposal's listing for comparison
  const listingInfo = await fetchListingInfo(supabase, proposalData.listing_id);

  return {
    id: proposalData.id,
    guest: {
      id: proposalData.guest_user_id || '',
      firstName: null,
      lastName: null,
      fullName: null,
      email: proposalData.guest_email_address || null,
    },
    listing: listingInfo,
    daysSelected: normalizeJsonbArray(proposalData.guest_selected_days_numbers_json),
    nightsPerWeek: proposalData.nights_per_week_count || 0,
    nightlyPrice: proposalData.calculated_nightly_price || 0,
    moveInStart: proposalData.move_in_range_start_date,
    moveInEnd: proposalData.move_in_range_end_date,
    status: proposalData.proposal_workflow_status,
    reservationWeeks: proposalData.reservation_span_in_weeks,
  };
}

/**
 * Fetch candidate listings and calculate scores
 */
async function fetchAndScoreCandidates(
  supabase: SupabaseClient,
  proposal: ProposalDetails,
  filters: SearchCandidatesPayload['filters'],
  limit: number
): Promise<CandidateMatch[]> {
  // Build query for candidate listings
  let query = supabase
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
    .eq('is_active', true)
    .or('is_deleted.is.null,is_deleted.eq.false');

  // Exclude the proposal's original listing
  if (proposal.listing.id) {
    query = query.neq('id', proposal.listing.id);
  }

  // Apply borough filter if specified
  if (filters?.borough) {
    query = query.eq('borough', filters.borough);
  }

  // Fetch more candidates than needed to allow for scoring/filtering
  const fetchLimit = limit * 3; // Fetch 3x to have room for score filtering
  query = query.limit(fetchLimit);

  const { data: listingsData, error: listingsError } = await query;

  if (listingsError) {
    console.error('[quick-match:search_candidates] Database error:', listingsError);
    throw new Error(`Failed to fetch listings: ${listingsError.message}`);
  }

  if (!listingsData || listingsData.length === 0) {
    return [];
  }

  // Collect unique host IDs for batch fetching
  const hostIds = [...new Set(
    listingsData
      .map((l: ListingRow) => l.host_user_id)
      .filter((id): id is string => id !== null)
  )];

  // Batch fetch hosts
  const hostsMap = await fetchHostsMap(supabase, hostIds);

  // Batch fetch borough names
  const boroughIds = [...new Set(
    listingsData
      .map((l: ListingRow) => l.borough)
      .filter((id): id is string => id !== null)
  )];
  const boroughNamesMap = await fetchBoroughNamesMap(supabase, boroughIds);

  // Batch fetch hood names
  const hoodIds = [...new Set(
    listingsData
      .map((l: ListingRow) => l.primary_neighborhood_reference_id)
      .filter((id): id is string => id !== null)
  )];
  const hoodNamesMap = await fetchHoodNamesMap(supabase, hoodIds);

  // Score each candidate
  const scoredCandidates: CandidateMatch[] = [];

  for (const listingRow of listingsData as ListingRow[]) {
    const listing = transformListing(listingRow, boroughNamesMap, hoodNamesMap);
    const host = hostsMap.get(listingRow.host_user_id || '') || createEmptyHost();

    const { score, breakdown } = calculateMatchScore(listing, proposal, host);
    const tier = getMatchTier(score);

    // Apply min score filter
    if (filters?.min_score !== undefined && score < filters.min_score) {
      continue;
    }

    // Apply max price filter (based on proposal's nights per week)
    if (filters?.max_price !== undefined) {
      const nightsPerWeek = proposal.nightsPerWeek || 4;
      const candidatePrice = getNightlyRate(listing.nightlyRates, nightsPerWeek);
      if (candidatePrice !== null && candidatePrice > filters.max_price) {
        continue;
      }
    }

    scoredCandidates.push({
      listing,
      host,
      score,
      breakdown,
      tier,
    });
  }

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Return top N
  return scoredCandidates.slice(0, limit);
}

/**
 * Fetch listing info for proposal
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
    nightlyRates: createEmptyRates(),
    cleaningFee: null,
    damageDeposit: null,
    minimumNights: null,
    maximumNights: null,
    daysAvailable: [],
    nightsAvailable: [],
    active: false,
  };

  if (!listingId) return emptyListing;

  const { data, error } = await supabase
    .from('listing')
    .select(`
      id,
      listing_title,
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
      is_active
    `)
    .eq('id', listingId)
    .single();

  if (error || !data) {
    return { ...emptyListing, id: listingId };
  }

  // Fetch borough name
  let boroughName: string | null = null;
  if (data.borough) {
    const { data: boroughData } = await supabase
      .from('zat_geo_borough_toplevel')
      .select('Display')
      .eq('id', data.borough)
      .single();
    boroughName = boroughData?.Display || data.borough;
  }

  // Fetch hood name
  let hoodName: string | null = null;
  if (data.primary_neighborhood_reference_id) {
    const { data: hoodData } = await supabase
      .from('zat_geo_hood_mediumlevel')
      .select('Display')
      .eq('id', data.primary_neighborhood_reference_id)
      .single();
    hoodName = hoodData?.Display || data.primary_neighborhood_reference_id;
  }

  return transformListing(
    data as ListingRow,
    new Map([[data.borough || '', boroughName || '']]),
    new Map([[data.primary_neighborhood_reference_id || '', hoodName || '']])
  );
}

/**
 * Batch fetch hosts by IDs
 */
async function fetchHostsMap(
  supabase: SupabaseClient,
  hostIds: string[]
): Promise<Map<string, HostInfo>> {
  if (hostIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('user')
    .select(`
      id,
      first_name,
      last_name,
      linkedin_profile_id,
      is_phone_verified,
      is_user_verified
    `)
    .in('id', hostIds);

  if (error || !data) {
    console.warn('[quick-match:search_candidates] Failed to fetch hosts:', error);
    return new Map();
  }

  const hostsMap = new Map<string, HostInfo>();
  for (const user of data as UserRow[]) {
    hostsMap.set(user.id, {
      id: user.id,
      firstName: user.first_name,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
      linkedInVerified: !!user.linkedin_profile_id,
      phoneVerified: user.is_phone_verified ?? false,
      userVerified: user.is_user_verified ?? false,
    });
  }

  return hostsMap;
}

/**
 * Batch fetch borough names
 */
async function fetchBoroughNamesMap(
  supabase: SupabaseClient,
  boroughIds: string[]
): Promise<Map<string, string>> {
  if (boroughIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('zat_geo_borough_toplevel')
    .select('id, Display')
    .in('id', boroughIds);

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, string>();
  for (const row of data) {
    map.set(row.id, row.Display);
  }
  return map;
}

/**
 * Batch fetch hood names
 */
async function fetchHoodNamesMap(
  supabase: SupabaseClient,
  hoodIds: string[]
): Promise<Map<string, string>> {
  if (hoodIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('zat_geo_hood_mediumlevel')
    .select('id, Display')
    .in('id', hoodIds);

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, string>();
  for (const row of data) {
    map.set(row.id, row.Display);
  }
  return map;
}

/**
 * Transform listing row to ListingInfo
 */
function transformListing(
  row: ListingRow,
  boroughNamesMap: Map<string, string>,
  hoodNamesMap: Map<string, string>
): ListingInfo {
  const nightlyRates: NightlyRates = {
    rate1: row.nightly_rate_for_1_night_stay ?? null,
    rate2: row.nightly_rate_for_2_night_stay ?? null,
    rate3: row.nightly_rate_for_3_night_stay ?? null,
    rate4: row.nightly_rate_for_4_night_stay ?? null,
    rate5: row.nightly_rate_for_5_night_stay ?? null,
    rate6: null,
    rate7: row.nightly_rate_for_7_night_stay ?? null,
  };

  return {
    id: row.id,
    title: row.listing_title,
    borough: row.borough,
    boroughName: boroughNamesMap.get(row.borough || '') || row.borough,
    hood: row.primary_neighborhood_reference_id,
    hoodName: hoodNamesMap.get(row.primary_neighborhood_reference_id || '') || row.primary_neighborhood_reference_id,
    address: row.address_with_lat_lng_json,
    nightlyRates,
    cleaningFee: row.cleaning_fee_amount ?? null,
    damageDeposit: row.damage_deposit_amount ?? null,
    minimumNights: row.minimum_nights_per_stay,
    maximumNights: row.maximum_nights_per_stay,
    daysAvailable: normalizeJsonbArray(row.available_days_as_day_numbers_json),
    nightsAvailable: normalizeJsonbArray(row.available_nights_as_day_numbers_json),
    active: row.is_active ?? false,
  };
}

/**
 * Create empty host info
 */
function createEmptyHost(): HostInfo {
  return {
    id: '',
    firstName: null,
    fullName: null,
    linkedInVerified: false,
    phoneVerified: false,
    userVerified: false,
  };
}

/**
 * Create empty nightly rates
 */
function createEmptyRates(): NightlyRates {
  return {
    rate1: null,
    rate2: null,
    rate3: null,
    rate4: null,
    rate5: null,
    rate6: null,
    rate7: null,
  };
}

/**
 * Get nightly rate for a specific night count
 */
function getNightlyRate(rates: NightlyRates, nights: number): number | null {
  const n = Math.max(1, Math.min(7, Math.round(nights)));
  const rateMap: Record<number, number | null> = {
    1: rates.rate1,
    2: rates.rate2,
    3: rates.rate3,
    4: rates.rate4,
    5: rates.rate5,
    6: rates.rate6,
    7: rates.rate7,
  };
  return rateMap[n];
}

/**
 * Normalize JSONB array fields
 */
function normalizeJsonbArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => typeof v === 'number' ? v : parseInt(String(v), 10))
      .filter((v) => !isNaN(v));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v: unknown) => typeof v === 'number' ? v : parseInt(String(v), 10))
          .filter((v: number) => !isNaN(v));
      }
    } catch {
      // Not valid JSON
    }
  }

  return [];
}
