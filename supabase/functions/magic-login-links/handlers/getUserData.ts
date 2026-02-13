/**
 * Get User Data Handler - Get user context data for magic link attachment
 * Split Lease - magic-login-links
 *
 * Flow:
 * 1. Accept userId in payload
 * 2. Query related entities: listings, proposals, leases, threads
 * 3. Return comprehensive user context for data attachment selection
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key for admin operations
 * @param payload - Request payload {userId}
 * @returns {listings, proposals, leases, threads}
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError } from '../../_shared/errors.ts';
import { validateRequiredFields } from '../../_shared/validation.ts';

interface GetUserDataPayload {
  userId: string;
}

interface UserDataResponse {
  listings: Array<{ id: string; title: string; address: string }>;
  proposals: Array<{ id: string; listingTitle: string; status: string }>;
  leases: Array<{ id: string; listingTitle: string; status: string }>;
  threads: Array<{ id: string; subject: string; lastMessageAt: string }>;
}

export async function handleGetUserData(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: GetUserDataPayload
): Promise<UserDataResponse> {
  console.log('[get-user-data] ========== GET USER DATA ==========');

  // Validate required fields
  validateRequiredFields(payload, ['userId']);
  const { userId } = payload;

  console.log(`[get-user-data] Fetching data for user: ${userId}`);

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Fetch listings where user is owner or co-host
    const { data: listingsData, error: listingsError } = await supabaseAdmin
      .from('listing')
      .select('id, listing_title, address_with_lat_lng_json')
      .eq('host_user_id', userId)
      .limit(50);

    if (listingsError) {
      console.error('[get-user-data] Listings query error:', listingsError.message);
    }

    // Fetch proposals where user is guest or host (via listing)
    const { data: proposalsData, error: proposalsError } = await supabaseAdmin
      .from('booking_proposal')
      .select('id, listing_id, proposal_workflow_status, listing!inner(listing_title)')
      .or(`guest_user_id.eq.${userId},host_user_id.eq.${userId}`)
      .limit(50);

    if (proposalsError) {
      console.error('[get-user-data] Proposals query error:', proposalsError.message);
    }

    // Fetch leases where user is guest or host
    let leasesData: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('booking_lease')
        .select('id, listing_id, lease_type, agreement_number')
        .or(`guest_user_id.eq.${userId},host_user_id.eq.${userId}`)
        .limit(50);

      if (!error) {
        leasesData = data || [];
      }
    } catch (_e) {
      console.log('[get-user-data] Lease table query skipped');
    }

    // Fetch message threads where user is a participant
    const { data: threadsData, error: threadsError } = await supabaseAdmin
      .from('message_thread')
      .select('id, thread_subject_text, last_message_sent_at')
      .contains('participant_user_ids_json', [userId])
      .limit(50);

    if (threadsError) {
      console.error('[get-user-data] Threads query error:', threadsError.message);
    }

    console.log('[get-user-data] Data fetched successfully');
    console.log(`[get-user-data] Listings: ${listingsData?.length || 0}`);
    console.log(`[get-user-data] Proposals: ${proposalsData?.length || 0}`);
    console.log(`[get-user-data] Leases: ${leasesData?.length || 0}`);
    console.log(`[get-user-data] Threads: ${threadsData?.length || 0}`);

    // Transform to API response format
    const listings = (listingsData || []).map((listing: any) => ({
      id: listing.id,
      title: listing.listing_title || 'Untitled Listing',
      address: (listing.address_with_lat_lng_json as Record<string, unknown>)?.address || '',
    }));

    const proposals = (proposalsData || []).map((proposal: any) => ({
      id: proposal.id,
      listingTitle: proposal.listing?.listing_title || 'Unknown Listing',
      status: proposal.proposal_workflow_status || 'Unknown',
    }));

    const leases = leasesData.map((lease: any) => ({
      id: lease.id,
      listingTitle: 'Lease ' + (lease.agreement_number || lease.id),
      status: lease.lease_type || 'Unknown',
    }));

    const threads = (threadsData || []).map(thread => ({
      id: thread.id,
      subject: thread.thread_subject_text || 'No Subject',
      lastMessageAt: thread.last_message_sent_at || '',
    }));

    return {
      listings,
      proposals,
      leases,
      threads,
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('[get-user-data] ========== ERROR ==========');
    console.error('[get-user-data] Error:', error);

    throw new ApiError(
      `Failed to get user data: ${error.message}`,
      500,
      error
    );
  }
}
