/**
 * Get Host Leases Handler
 * Split Lease - Supabase Edge Functions
 *
 * Fetches all leases for a host user across all their listings.
 * Includes related data: guest info, stays, payment records, date change requests.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError, AuthenticationError } from '../../_shared/errors.ts';
import type { UserContext, LeaseData, StayData } from '../lib/types.ts';

/**
 * Extended lease data with related records for host view
 */
export interface HostLeaseData extends LeaseData {
  guest: GuestInfo | null;
  listing: ListingInfo | null;
  stays: StayWithReview[];
  paymentRecords: PaymentRecord[];
  dateChangeRequests: DateChangeRequest[];
}

interface GuestInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  phone_number: string | null;
  is_user_verified: boolean;
  linkedin_profile_id: string | null;
  selfie_with_id_photo_url: string | null;
}

interface ListingInfo {
  id: string;
  listing_title: string;
  photos_with_urls_captions_and_sort_order_json: unknown[] | null;
  neighborhood_name_entered_by_host: string | null;
}

interface StayWithReview extends StayData {
  'Review Submitted by Host': boolean;
}

interface PaymentRecord {
  id: string;
  booking_reservation: string;
  payment: number;
  scheduled_date: string;
  actual_date_of_payment: string | null;
  rent: number;
  maintenance_fee: number;
  damage_deposit: number;
  total_paid_to_host: number;
  bank_transaction_number: string | null;
  payment_receipt: string | null;
  payment_to_host: boolean;
}

interface DateChangeRequest {
  id: string;
  lease: string;
  requested_by: string;
  request_receiver: string;
  stay_associated_1: string | null;
  stay_associated_2: string | null;
  request_status: string;
  type_of_request: string;
  list_of_old_dates_in_the_stay: string;
  list_of_new_dates_in_the_stay: string;
  price_rate_of_the_night: number | null;
  original_created_at: string;
  requestedByUser?: GuestInfo | null;
}

interface GetHostLeasesPayload {
  hostUserId: string;
  listingId?: string;
}

/**
 * Handle get host leases request
 *
 * Fetches all leases where the authenticated user is the host.
 * Optionally filters by a specific listing.
 *
 * @param payload - Request payload with hostUserId and optional listingId
 * @param user - Authenticated user context
 * @param supabase - Supabase client
 * @returns Array of leases with related data
 */
export async function handleGetHostLeases(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<HostLeaseData[]> {
  console.log('[lease:getHostLeases] Fetching host leases...');

  // Validate authentication
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  // Validate payload
  const { hostUserId, listingId } = payload as GetHostLeasesPayload;

  if (!hostUserId) {
    throw new ValidationError('hostUserId is required');
  }

  // Verify the requesting user matches the hostUserId
  if (user.id !== hostUserId) {
    console.warn('[lease:getHostLeases] User mismatch:', { requestUser: user.id, hostUserId });
    throw new AuthenticationError('Not authorized to view these leases');
  }

  // Step 1: Get host's listings using the existing RPC
  const { data: hostListings, error: listingsError } = await supabase
    .rpc('get_host_listings', { host_user_id: hostUserId });

  if (listingsError) {
    console.error('[lease:getHostLeases] Error fetching host listings:', listingsError.message);
    throw new ValidationError(`Failed to fetch listings: ${listingsError.message}`);
  }

  if (!hostListings || hostListings.length === 0) {
    console.log('[lease:getHostLeases] No listings found for host');
    return [];
  }

  const listingIds = hostListings.map((l: { id: string }) => l.id);
  console.log('[lease:getHostLeases] Found listings:', listingIds.length);

  // If a specific listing is requested, filter to that listing
  const targetListingIds = listingId ? [listingId] : listingIds;

  // Step 2: Fetch leases for these listings
  const { data: leases, error: leasesError } = await supabase
    .from('booking_lease')
    .select('*')
    .in('listing_id', targetListingIds)
    .order('created_at', { ascending: false });

  if (leasesError) {
    console.error('[lease:getHostLeases] Error fetching leases:', leasesError.message);
    throw new ValidationError(`Failed to fetch leases: ${leasesError.message}`);
  }

  if (!leases || leases.length === 0) {
    console.log('[lease:getHostLeases] No leases found');
    return [];
  }

  console.log('[lease:getHostLeases] Found leases:', leases.length);

  // Step 3: Collect all unique IDs needed for related data
  const guestIds = [...new Set(leases.map((l: LeaseData) => l.guest_user_id).filter(Boolean))];
  const leaseListingIds = [...new Set(leases.map((l: LeaseData) => l.listing_id).filter(Boolean))];
  const leaseIds = leases.map((l: LeaseData) => l.id);

  // Step 4: Fetch guests
  const guestMap: Record<string, GuestInfo> = {};
  if (guestIds.length > 0) {
    const { data: guests, error: _guestsError } = await supabase
      .from('user')
      .select(`
        id,
        email,
        first_name,
        last_name,
        profile_photo_url,
        phone_number,
        is_user_verified,
        linkedin_profile_id,
        selfie_with_id_photo_url
      `)
      .in('id', guestIds);

    if (_guestsError) {
      console.warn('[lease:getHostLeases] Error fetching guests:', _guestsError.message);
    } else if (guests) {
      guests.forEach((g: GuestInfo) => {
        guestMap[g.id] = g;
      });
    }
  }

  // Step 5: Fetch listing details
  const listingMap: Record<string, ListingInfo> = {};
  if (leaseListingIds.length > 0) {
    const { data: listings, error: listingsError2 } = await supabase
      .from('listing')
      .select(`
        id,
        listing_title,
        photos_with_urls_captions_and_sort_order_json,
        neighborhood_name_entered_by_host
      `)
      .in('id', leaseListingIds);

    if (listingsError2) {
      console.warn('[lease:getHostLeases] Error fetching listing details:', listingsError2.message);
    } else if (listings) {
      listings.forEach((l: ListingInfo) => {
        listingMap[l.id] = l;
      });
    }
  }

  // Step 6: Fetch stays for all leases
  const staysByLease: Record<string, StayWithReview[]> = {};
  if (leaseIds.length > 0) {
    const { data: stays, error: staysError } = await supabase
      .from('lease_weekly_stay')
      .select(`
        id,
        lease_id,
        week_number_in_lease,
        guest_user_id,
        host_user_id,
        listing_id,
        dates_in_this_stay_period_json,
        checkin_night_date,
        last_night_date,
        stay_status,
        created_at,
        updated_at
      `)
      .in('lease_id', leaseIds)
      .order('week_number_in_lease', { ascending: true });

    if (staysError) {
      console.warn('[lease:getHostLeases] Error fetching stays:', staysError.message);
    } else if (stays) {
      stays.forEach((s: StayWithReview) => {
        if (!staysByLease[s.lease_id]) {
          staysByLease[s.lease_id] = [];
        }
        staysByLease[s.lease_id].push(s);
      });
    }
  }

  // Step 7: Fetch payment records for all leases
  const paymentsByLease: Record<string, PaymentRecord[]> = {};
  if (leaseIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from('paymentrecords')
      .select(`
        id,
        booking_reservation,
        payment,
        scheduled_date,
        actual_date_of_payment,
        rent,
        maintenance_fee,
        damage_deposit,
        total_paid_to_host,
        bank_transaction_number,
        payment_receipt,
        payment_to_host
      `)
      .in('booking_reservation', leaseIds)
      .order('payment', { ascending: true });

    if (paymentsError) {
      console.warn('[lease:getHostLeases] Error fetching payments:', paymentsError.message);
    } else if (payments) {
      payments.forEach((p: PaymentRecord) => {
        const leaseId = p.booking_reservation;
        if (!paymentsByLease[leaseId]) {
          paymentsByLease[leaseId] = [];
        }
        paymentsByLease[leaseId].push(p);
      });
    }
  }

  // Step 8: Fetch date change requests for all leases
  const dateChangesByLease: Record<string, DateChangeRequest[]> = {};
  if (leaseIds.length > 0) {
    const { data: dateChanges, error: dateChangesError } = await supabase
      .from('datechangerequest')
      .select(`
        id,
        lease,
        requested_by,
        request_receiver,
        stay_associated_1,
        stay_associated_2,
        request_status,
        type_of_request,
        list_of_old_dates_in_the_stay,
        list_of_new_dates_in_the_stay,
        price_rate_of_the_night,
        original_created_at
      `)
      .in('lease', leaseIds)
      .order('original_created_at', { ascending: false });

    if (dateChangesError) {
      console.warn('[lease:getHostLeases] Error fetching date changes:', dateChangesError.message);
    } else if (dateChanges) {
      // Collect requestedBy user IDs for fetching names
      const requestedByIds = [...new Set(dateChanges.map((dc: DateChangeRequest) => dc.requested_by).filter(Boolean))];

      // Fetch user info for requestedBy
      const requestedByMap: Record<string, GuestInfo> = {};
      if (requestedByIds.length > 0) {
        const { data: requestedByUsers } = await supabase
          .from('user')
          .select('id, first_name, last_name, profile_photo_url')
          .in('id', requestedByIds);

        if (requestedByUsers) {
          requestedByUsers.forEach((u: GuestInfo) => {
            requestedByMap[u.id] = u;
          });
        }
      }

      dateChanges.forEach((dc: DateChangeRequest) => {
        if (!dateChangesByLease[dc.lease]) {
          dateChangesByLease[dc.lease] = [];
        }
        dc.requestedByUser = requestedByMap[dc.requested_by] || null;
        dateChangesByLease[dc.lease].push(dc);
      });
    }
  }

  // Step 9: Assemble the complete lease data
  const enrichedLeases: HostLeaseData[] = leases.map((lease: LeaseData) => ({
    ...lease,
    guest: guestMap[lease.guest_user_id] || null,
    listing: listingMap[lease.listing_id] || null,
    stays: staysByLease[lease.id] || [],
    paymentRecords: paymentsByLease[lease.id] || [],
    dateChangeRequests: dateChangesByLease[lease.id] || [],
  }));

  console.log('[lease:getHostLeases] Returning enriched leases:', enrichedLeases.length);

  return enrichedLeases;
}
