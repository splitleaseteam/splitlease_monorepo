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
  _id: string;
  email: string;
  'Name - Full': string;
  'Name - First': string;
  'Profile Photo': string | null;
  'Phone Number': string | null;
  'user verified?': boolean;
  'Verify - Linked In ID': string | null;
  'Selfie with ID': string | null;
}

interface ListingInfo {
  _id: string;
  Name: string;
  'Cover Photo': string | null;
  Neighborhood: string | null;
}

interface StayWithReview extends StayData {
  'Review Submitted by Host': boolean;
}

interface PaymentRecord {
  _id: string;
  'Booking - Reservation': string;
  'Payment #': number;
  'Scheduled Date': string;
  'Actual Date': string | null;
  'Rent Amount': number;
  'Maintenance Fee': number;
  'Damage Deposit': number;
  'Total Amount': number;
  'Bank Transaction Number': string | null;
  'Payment Receipt': string | null;
  'Is Paid': boolean;
  'Is Refunded': boolean;
}

interface DateChangeRequest {
  _id: string;
  Lease: string;
  'Requested by': string;
  'Request receiver': string;
  'Stay Associated 1': string | null;
  'Stay Associated 2': string | null;
  status: string;
  'Request Type': string;
  'Original Date': string;
  'Requested Date': string;
  'Price Adjustment': number | null;
  'Created Date': string;
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

  const listingIds = hostListings.map((l: { _id: string }) => l._id);
  console.log('[lease:getHostLeases] Found listings:', listingIds.length);

  // If a specific listing is requested, filter to that listing
  const targetListingIds = listingId ? [listingId] : listingIds;

  // Step 2: Fetch leases for these listings
  const { data: leases, error: leasesError } = await supabase
    .from('bookings_leases')
    .select('*')
    .in('Listing', targetListingIds)
    .order('"Created Date"', { ascending: false });

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
  const guestIds = [...new Set(leases.map((l: LeaseData) => l.Guest).filter(Boolean))];
  const leaseListingIds = [...new Set(leases.map((l: LeaseData) => l.Listing).filter(Boolean))];
  const leaseIds = leases.map((l: LeaseData) => l._id);

  // Step 4: Fetch guests
  const guestMap: Record<string, GuestInfo> = {};
  if (guestIds.length > 0) {
    const { data: guests, error: _guestsError } = await supabase
      .from('user')
      .select(`
        _id,
        email,
        "Name - Full",
        "Name - First",
        "Profile Photo",
        "Phone Number",
        "user verified?",
        "Verify - Linked In ID",
        "Selfie with ID"
      `)
      .in('_id', guestIds);

    if (guestsError) {
      console.warn('[lease:getHostLeases] Error fetching guests:', guestsError.message);
    } else if (guests) {
      guests.forEach((g: GuestInfo) => {
        guestMap[g._id] = g;
      });
    }
  }

  // Step 5: Fetch listing details
  const listingMap: Record<string, ListingInfo> = {};
  if (leaseListingIds.length > 0) {
    const { data: listings, error: listingsError2 } = await supabase
      .from('listing')
      .select(`
        _id,
        Name,
        "Cover Photo",
        Neighborhood
      `)
      .in('_id', leaseListingIds);

    if (listingsError2) {
      console.warn('[lease:getHostLeases] Error fetching listing details:', listingsError2.message);
    } else if (listings) {
      listings.forEach((l: ListingInfo) => {
        listingMap[l._id] = l;
      });
    }
  }

  // Step 6: Fetch stays for all leases
  const staysByLease: Record<string, StayWithReview[]> = {};
  if (leaseIds.length > 0) {
    const { data: stays, error: staysError } = await supabase
      .from('bookings_stays')
      .select(`
        _id,
        Lease,
        "Week Number",
        Guest,
        Host,
        listing,
        "Dates - List of dates in this period",
        "Check In (night)",
        "Last Night (night)",
        "Stay Status",
        "Review Submitted by Host",
        "Created Date",
        "Modified Date"
      `)
      .in('Lease', leaseIds)
      .order('"Week Number"', { ascending: true });

    if (staysError) {
      console.warn('[lease:getHostLeases] Error fetching stays:', staysError.message);
    } else if (stays) {
      stays.forEach((s: StayWithReview) => {
        if (!staysByLease[s.Lease]) {
          staysByLease[s.Lease] = [];
        }
        staysByLease[s.Lease].push(s);
      });
    }
  }

  // Step 7: Fetch payment records for all leases
  const paymentsByLease: Record<string, PaymentRecord[]> = {};
  if (leaseIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from('paymentrecords')
      .select(`
        _id,
        "Booking - Reservation",
        "Payment #",
        "Scheduled Date",
        "Actual Date",
        "Rent Amount",
        "Maintenance Fee",
        "Damage Deposit",
        "Total Amount",
        "Bank Transaction Number",
        "Payment Receipt",
        "Is Paid",
        "Is Refunded"
      `)
      .in('"Booking - Reservation"', leaseIds)
      .order('"Payment #"', { ascending: true });

    if (paymentsError) {
      console.warn('[lease:getHostLeases] Error fetching payments:', paymentsError.message);
    } else if (payments) {
      payments.forEach((p: PaymentRecord) => {
        const leaseId = p['Booking - Reservation'];
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
        _id,
        Lease,
        "Requested by",
        "Request receiver",
        "Stay Associated 1",
        "Stay Associated 2",
        status,
        "Request Type",
        "Original Date",
        "Requested Date",
        "Price Adjustment",
        "Created Date"
      `)
      .in('Lease', leaseIds)
      .order('"Created Date"', { ascending: false });

    if (dateChangesError) {
      console.warn('[lease:getHostLeases] Error fetching date changes:', dateChangesError.message);
    } else if (dateChanges) {
      // Collect requestedBy user IDs for fetching names
      const requestedByIds = [...new Set(dateChanges.map((dc: DateChangeRequest) => dc['Requested by']).filter(Boolean))];

      // Fetch user info for requestedBy
      const requestedByMap: Record<string, GuestInfo> = {};
      if (requestedByIds.length > 0) {
        const { data: requestedByUsers } = await supabase
          .from('user')
          .select(`_id, "Name - Full", "Name - First", "Profile Photo"`)
          .in('_id', requestedByIds);

        if (requestedByUsers) {
          requestedByUsers.forEach((u: GuestInfo) => {
            requestedByMap[u._id] = u;
          });
        }
      }

      dateChanges.forEach((dc: DateChangeRequest) => {
        if (!dateChangesByLease[dc.Lease]) {
          dateChangesByLease[dc.Lease] = [];
        }
        dc.requestedByUser = requestedByMap[dc['Requested by']] || null;
        dateChangesByLease[dc.Lease].push(dc);
      });
    }
  }

  // Step 9: Assemble the complete lease data
  const enrichedLeases: HostLeaseData[] = leases.map((lease: LeaseData) => ({
    ...lease,
    guest: guestMap[lease.Guest] || null,
    listing: listingMap[lease.Listing] || null,
    stays: staysByLease[lease._id] || [],
    paymentRecords: paymentsByLease[lease._id] || [],
    dateChangeRequests: dateChangesByLease[lease._id] || [],
  }));

  console.log('[lease:getHostLeases] Returning enriched leases:', enrichedLeases.length);

  return enrichedLeases;
}
