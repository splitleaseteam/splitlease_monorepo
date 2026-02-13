/**
 * Get Guest Leases Handler
 * Split Lease - Supabase Edge Functions
 *
 * Fetches all leases for a guest user.
 * Includes related data: host info, listing, stays, payment records, date change requests.
 *
 * All tables use snake_case column names. Raw DB rows are returned directly;
 * frontend adapter (adaptLeaseFromSupabase.js) handles camelCase conversion.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError, AuthenticationError } from '../../_shared/errors.ts';
import type { UserContext } from '../lib/types.ts';

/**
 * Handle get guest leases request
 *
 * Fetches all leases where the authenticated user is the guest.
 */
export async function handleGetGuestLeases(
  _payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<Record<string, unknown>[]> {
  console.log('[lease:getGuestLeases] Fetching guest leases...');

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  const guestUserId = user.id;
  console.log('[lease:getGuestLeases] Guest user ID:', guestUserId);

  // Step 1: Fetch leases where the user is the guest
  const { data: leases, error: leasesError } = await supabase
    .from('booking_lease')
    .select('*')
    .eq('guest_user_id', guestUserId)
    .order('created_at', { ascending: false });

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
  const hostIds = [...new Set(leases.map((l: Record<string, unknown>) => l.host_user_id).filter(Boolean))] as string[];
  const listingIds = [...new Set(leases.map((l: Record<string, unknown>) => l.listing_id).filter(Boolean))] as string[];
  const leaseIds = leases.map((l: Record<string, unknown>) => l.id) as string[];

  // Step 3: Fetch hosts (user table uses snake_case)
  const hostMap: Record<string, Record<string, unknown>> = {};
  if (hostIds.length > 0) {
    const { data: hosts, error: hostsError } = await supabase
      .from('user')
      .select('id, email, first_name, last_name, profile_photo_url, phone_number, is_user_verified')
      .in('id', hostIds);

    if (hostsError) {
      console.warn('[lease:getGuestLeases] Error fetching hosts:', hostsError.message);
    } else if (hosts) {
      hosts.forEach((h: Record<string, unknown>) => {
        hostMap[h.id as string] = h;
      });
    }
  }

  // Step 4: Fetch listing details (listing table uses snake_case)
  const listingMap: Record<string, Record<string, unknown>> = {};
  if (listingIds.length > 0) {
    const { data: listings, error: listingsError } = await supabase
      .from('listing')
      .select('id, listing_title, photos_with_urls_captions_and_sort_order_json, neighborhood_name_entered_by_host, address_with_lat_lng_json, city, state, zip_code, borough, primary_neighborhood_reference_id')
      .in('id', listingIds);

    if (listingsError) {
      console.warn('[lease:getGuestLeases] Error fetching listings:', listingsError.message);
    } else if (listings) {
      listings.forEach((l: Record<string, unknown>) => {
        listingMap[l.id as string] = l;
      });
    }
  }

  // Step 5: Fetch stays for all leases (lease_weekly_stay uses snake_case)
  const staysByLease: Record<string, Record<string, unknown>[]> = {};
  if (leaseIds.length > 0) {
    const { data: stays, error: staysError } = await supabase
      .from('lease_weekly_stay')
      .select('id, lease_id, week_number_in_lease, guest_user_id, host_user_id, listing_id, dates_in_this_stay_period_json, checkin_night_date, last_night_date, checkout_day_date, stay_status, created_at, updated_at')
      .in('lease_id', leaseIds)
      .order('week_number_in_lease', { ascending: true });

    if (staysError) {
      console.warn('[lease:getGuestLeases] Error fetching stays:', staysError.message);
    } else if (stays) {
      stays.forEach((s: Record<string, unknown>) => {
        const leaseId = s.lease_id as string;
        if (!staysByLease[leaseId]) {
          staysByLease[leaseId] = [];
        }
        staysByLease[leaseId].push(s);
      });
    }
  }

  // Step 6: Fetch payment records
  const paymentsByLease: Record<string, Record<string, unknown>[]> = {};
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
        total_paid_by_guest,
        bank_transaction_number,
        payment_receipt,
        payment_from_guest,
        pending
      `)
      .in('booking_reservation', leaseIds)
      .order('payment', { ascending: true });

    if (paymentsError) {
      console.warn('[lease:getGuestLeases] Error fetching payments:', paymentsError.message);
    } else if (payments) {
      payments.forEach((p: Record<string, unknown>) => {
        const leaseId = p.booking_reservation as string;
        if (!paymentsByLease[leaseId]) {
          paymentsByLease[leaseId] = [];
        }
        paymentsByLease[leaseId].push(p);
      });
    }
  }

  // Step 7: Fetch date change requests
  const dateChangesByLease: Record<string, Record<string, unknown>[]> = {};
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
        original_created_at,
        visible_to_the_guest
      `)
      .in('lease', leaseIds)
      .or(`visible_to_the_guest.eq.true,requested_by.eq.${guestUserId}`)
      .order('original_created_at', { ascending: false });

    if (dateChangesError) {
      console.warn('[lease:getGuestLeases] Error fetching date changes:', dateChangesError.message);
    } else if (dateChanges) {
      // Collect requestedBy user IDs for fetching names
      const requestedByIds = [...new Set(dateChanges.map((dc: Record<string, unknown>) => dc.requested_by).filter(Boolean))] as string[];

      const requestedByMap: Record<string, Record<string, unknown>> = {};
      if (requestedByIds.length > 0) {
        const { data: requestedByUsers } = await supabase
          .from('user')
          .select('id, first_name, last_name, profile_photo_url')
          .in('id', requestedByIds);

        if (requestedByUsers) {
          requestedByUsers.forEach((u: Record<string, unknown>) => {
            requestedByMap[u.id as string] = u;
          });
        }
      }

      dateChanges.forEach((dc: Record<string, unknown>) => {
        const leaseId = dc.lease as string;
        if (!dateChangesByLease[leaseId]) {
          dateChangesByLease[leaseId] = [];
        }
        dateChangesByLease[leaseId].push({
          ...dc,
          requestedByUser: requestedByMap[dc.requested_by as string] || null,
        });
      });
    }
  }

  // Step 8: Assemble the complete lease data
  const enrichedLeases = leases.map((lease: Record<string, unknown>) => ({
    // Pass through all lease fields (snake_case from booking_lease)
    ...lease,
    // Related entities
    host: hostMap[lease.host_user_id as string] || null,
    listing: listingMap[lease.listing_id as string] || null,
    stays: staysByLease[lease.id as string] || [],
    paymentRecords: paymentsByLease[lease.id as string] || [],
    dateChangeRequests: dateChangesByLease[lease.id as string] || [],
  }));

  console.log('[lease:getGuestLeases] Returning enriched leases:', enrichedLeases.length);

  return enrichedLeases;
}
