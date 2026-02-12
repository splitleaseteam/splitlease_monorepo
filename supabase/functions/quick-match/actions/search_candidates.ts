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
    .from('proposal')
    .select(`
      id,
      guest_user_id,
      listing_id,
      "Guest email",
      "Move in range start",
      "Move in range end",
      "Reservation Span (Weeks)",
      "Days Selected",
      "nights per week (num)",
      "proposal nightly price",
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
      email: proposalData['Guest email'] || null,
    },
    listing: listingInfo,
    daysSelected: normalizeJsonbArray(proposalData['Days Selected']),
    nightsPerWeek: proposalData['nights per week (num)'] || 0,
    nightlyPrice: proposalData['proposal nightly price'] || 0,
    moveInStart: proposalData['Move in range start'],
    moveInEnd: proposalData['Move in range end'],
    status: proposalData.proposal_workflow_status,
    reservationWeeks: proposalData['Reservation Span (Weeks)'],
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
    .eq('Active', true)
    .or('Deleted.is.null,Deleted.eq.false');

  // Exclude the proposal's original listing
  if (proposal.listing.id) {
    query = query.neq('id', proposal.listing.id);
  }

  // Apply borough filter if specified
  if (filters?.borough) {
    query = query.eq('Location - Borough', filters.borough);
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
      .map((l: ListingRow) => l['Location - Borough'])
      .filter((id): id is string => id !== null)
  )];
  const boroughNamesMap = await fetchBoroughNamesMap(supabase, boroughIds);

  // Batch fetch hood names
  const hoodIds = [...new Set(
    listingsData
      .map((l: ListingRow) => l['Location - Hood'])
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
      Name,
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
      Active
    `)
    .eq('id', listingId)
    .single();

  if (error || !data) {
    return { ...emptyListing, id: listingId };
  }

  // Fetch borough name
  let boroughName: string | null = null;
  if (data['Location - Borough']) {
    const { data: boroughData } = await supabase
      .from('zat_geo_borough_toplevel')
      .select('Display')
      .eq('id', data['Location - Borough'])
      .single();
    boroughName = boroughData?.Display || data['Location - Borough'];
  }

  // Fetch hood name
  let hoodName: string | null = null;
  if (data['Location - Hood']) {
    const { data: hoodData } = await supabase
      .from('zat_geo_hood_mediumlevel')
      .select('Display')
      .eq('id', data['Location - Hood'])
      .single();
    hoodName = hoodData?.Display || data['Location - Hood'];
  }

  return transformListing(
    data as ListingRow,
    new Map([[data['Location - Borough'] || '', boroughName || '']]),
    new Map([[data['Location - Hood'] || '', hoodName || '']])
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
      "Verify - Linked In ID",
      "Verify - Phone",
      "user verified?"
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
      linkedInVerified: user['Verify - Linked In ID'] ?? false,
      phoneVerified: user['Verify - Phone'] ?? false,
      userVerified: user['user verified?'] ?? false,
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
    rate1: row['nightly_rate_1_night'],
    rate2: row['nightly_rate_2_nights'],
    rate3: row['nightly_rate_3_nights'],
    rate4: row['nightly_rate_4_nights'],
    rate5: row['nightly_rate_5_nights'],
    rate6: row['nightly_rate_6_nights'],
    rate7: row['nightly_rate_7_nights'],
  };

  return {
    id: row.id,
    title: row.Name,
    borough: row['Location - Borough'],
    boroughName: boroughNamesMap.get(row['Location - Borough'] || '') || row['Location - Borough'],
    hood: row['Location - Hood'],
    hoodName: hoodNamesMap.get(row['Location - Hood'] || '') || row['Location - Hood'],
    address: row['Location - Address'],
    nightlyRates,
    cleaningFee: row['cleaning_fee'],
    damageDeposit: row['damage_deposit'],
    minimumNights: row['Minimum Nights'],
    maximumNights: row['Maximum Nights'],
    daysAvailable: normalizeJsonbArray(row['Days Available (List of Days)']),
    nightsAvailable: normalizeJsonbArray(row['Nights Available (List of Nights)']),
    active: row.Active ?? false,
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
