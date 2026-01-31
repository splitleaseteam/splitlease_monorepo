/**
 * Get Guest Leases Handler
 * Split Lease - Supabase Edge Functions
 *
 * Fetches all leases for a guest user.
 * Includes related data: host info, listing, stays, payment records, date change requests.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError, AuthenticationError } from '../../_shared/errors.ts';
import type { UserContext, LeaseData, StayData } from '../lib/types.ts';

/**
 * Extended lease data with related records for guest view
 */
export interface GuestLeaseData extends LeaseData {
  host: HostInfo | null;
  listing: ListingInfo | null;
  stays: StayWithReview[];
  paymentRecords: PaymentRecord[];
  dateChangeRequests: DateChangeRequest[];
}

interface HostInfo {
  _id: string;
  email: string;
  'Name - Full': string;
  'Name - First': string;
  'Profile Photo': string | null;
  'Phone Number': string | null;
  'user verified?': boolean;
}

interface ListingInfo {
  _id: string;
  Name: string;
  'Cover Photo': string | null;
  Neighborhood: string | null;
  Address: string | null;
  City: string | null;
}

interface StayWithReview extends StayData {
  'Review Submitted by Guest': boolean;
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
  requestedByUser?: HostInfo | null;
}

/**
 * Handle get guest leases request
 *
 * Fetches all leases where the authenticated user is the guest.
 *
 * @param payload - Request payload (currently empty, uses authenticated user)
 * @param user - Authenticated user context
 * @param supabase - Supabase client
 * @returns Array of leases with related data
 */
export async function handleGetGuestLeases(
  _payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<GuestLeaseData[]> {
  console.log('[lease:getGuestLeases] Fetching guest leases...');

  // Validate authentication
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  const guestUserId = user.id;
  console.log('[lease:getGuestLeases] Guest user ID:', guestUserId);

  // Step 1: Fetch leases where the user is the guest
  const { data: leases, error: leasesError } = await supabase
    .from('bookings_leases')
    .select('*')
    .eq('Guest', guestUserId)
    .order('"Created Date"', { ascending: false });

  if (leasesError) {
    console.error('[lease:getGuestLeases] Error fetching leases:', leasesError.message);
    throw new ValidationError(`Failed to fetch leases: ${leasesError.message}`);
  }

  if (!leases || leases.length === 0) {
    console.log('[lease:getGuestLeases] No leases found for guest');
    return [];
  }

  console.log('[lease:getGuestLeases] Found leases:', leases.length);

  // Step 2: Collect all unique IDs needed for related data
  const hostIds = [...new Set(leases.map((l: LeaseData) => l.Host).filter(Boolean))];
  const listingIds = [...new Set(leases.map((l: LeaseData) => l.Listing).filter(Boolean))];
  const leaseIds = leases.map((l: LeaseData) => l._id);

  // Step 3: Fetch hosts
  const hostMap: Record<string, HostInfo> = {};
  if (hostIds.length > 0) {
    const { data: hosts, error: hostsError } = await supabase
      .from('user')
      .select(`
        _id,
        email,
        "Name - Full",
        "Name - First",
        "Profile Photo",
        "Phone Number",
        "user verified?"
      `)
      .in('_id', hostIds);

    if (hostsError) {
      console.warn('[lease:getGuestLeases] Error fetching hosts:', hostsError.message);
    } else if (hosts) {
      hosts.forEach((h: HostInfo) => {
        hostMap[h._id] = h;
      });
    }
  }

  // Step 4: Fetch listing details
  const listingMap: Record<string, ListingInfo> = {};
  if (listingIds.length > 0) {
    const { data: listings, error: listingsError } = await supabase
      .from('listing')
      .select(`
        _id,
        Name,
        "Cover Photo",
        Neighborhood,
        Address,
        City
      `)
      .in('_id', listingIds);

    if (listingsError) {
      console.warn('[lease:getGuestLeases] Error fetching listings:', listingsError.message);
    } else if (listings) {
      listings.forEach((l: ListingInfo) => {
        listingMap[l._id] = l;
      });
    }
  }

  // Step 5: Fetch stays for all leases
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
        "Check-out day",
        "Stay Status",
        "Review Submitted by Guest",
        "Review Submitted by Host",
        "Created Date",
        "Modified Date"
      `)
      .in('Lease', leaseIds)
      .order('"Week Number"', { ascending: true });

    if (staysError) {
      console.warn('[lease:getGuestLeases] Error fetching stays:', staysError.message);
    } else if (stays) {
      stays.forEach((s: StayWithReview) => {
        if (!staysByLease[s.Lease]) {
          staysByLease[s.Lease] = [];
        }
        staysByLease[s.Lease].push(s);
      });
    }
  }

  // Step 6: Fetch payment records for all leases (guest payments)
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
      console.warn('[lease:getGuestLeases] Error fetching payments:', paymentsError.message);
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

  // Step 7: Fetch date change requests for all leases (visible to guest)
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
        "Created Date",
        "visible to guest"
      `)
      .in('Lease', leaseIds)
      .or(`"visible to guest".eq.true,"Requested by".eq.${guestUserId}`)
      .order('"Created Date"', { ascending: false });

    if (dateChangesError) {
      console.warn('[lease:getGuestLeases] Error fetching date changes:', dateChangesError.message);
    } else if (dateChanges) {
      // Collect requestedBy user IDs for fetching names
      const requestedByIds = [...new Set(dateChanges.map((dc: DateChangeRequest) => dc['Requested by']).filter(Boolean))];

      // Fetch user info for requestedBy
      const requestedByMap: Record<string, HostInfo> = {};
      if (requestedByIds.length > 0) {
        const { data: requestedByUsers } = await supabase
          .from('user')
          .select(`_id, "Name - Full", "Name - First", "Profile Photo"`)
          .in('_id', requestedByIds);

        if (requestedByUsers) {
          requestedByUsers.forEach((u: HostInfo) => {
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

  // Step 8: Assemble the complete lease data
  const enrichedLeases: GuestLeaseData[] = leases.map((lease: LeaseData) => ({
    ...lease,
    host: hostMap[lease.Host] || null,
    listing: listingMap[lease.Listing] || null,
    stays: staysByLease[lease._id] || [],
    paymentRecords: paymentsByLease[lease._id] || [],
    dateChangeRequests: dateChangesByLease[lease._id] || [],
  }));

  console.log('[lease:getGuestLeases] Returning enriched leases:', enrichedLeases.length);

  return enrichedLeases;
}
