/**
 * Admin Handler: Fetch Confirmed Virtual Meetings
 *
 * Fetches all confirmed meetings (those with a booked date)
 * with related guest, host, and listing data
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AuthenticationError as _AuthenticationError, ValidationError } from "../../../_shared/errors.ts";

interface FetchFilters {
  proposalId?: string;
  status?: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function handleAdminFetchConfirmed(
  payload: FetchFilters,
  user: AuthenticatedUser | null,
  supabase: SupabaseClient
): Promise<unknown[]> {
  // Authentication is now optional - internal pages can access without login
  console.log(`[admin_fetch_confirmed] Fetching confirmed meetings${user ? ` for admin: ${user.email}` : ' (unauthenticated)'}`);

  // Build query for confirmed meetings (no FK-based joins - table has no FK constraints)
  let query = supabase
    .from("virtualmeetingschedulesandlinks")
    .select("*")
    .not("booked_date", "is", null)
    .order("booked_date", { ascending: true });

  // Apply optional filters
  if (payload.proposalId) {
    query = query.ilike("proposal", `%${payload.proposalId}%`);
  }

  if (payload.status) {
    if (payload.status === 'completed') {
      query = query.not("end_of_meeting", "is", null);
    } else if (payload.status === 'confirmed') {
      query = query.is("end_of_meeting", null).neq("meeting_declined", true);
    }
  }

  const { data: meetings, error } = await query;

  if (error) {
    console.error("[admin_fetch_confirmed] Database error:", error);
    throw new ValidationError(`Failed to fetch confirmed meetings: ${error.message}`);
  }

  if (!meetings || meetings.length === 0) {
    console.log("[admin_fetch_confirmed] No confirmed meetings found");
    return [];
  }

  // Collect unique user IDs and listing IDs for separate queries
  const userIds = new Set<string>();
  const listingIds = new Set<string>();

  for (const meeting of meetings) {
    if (meeting.guest) userIds.add(String(meeting.guest));
    if (meeting.host) userIds.add(String(meeting.host));
    if (meeting.listing_for_co_host_feature) {
      listingIds.add(String(meeting.listing_for_co_host_feature));
    }
  }

  // Fetch users in parallel
  const usersPromise = userIds.size > 0
    ? supabase
        .from("user")
        .select("id, first_name, last_name, email, phone_number, profile_photo_url")
        .in("id", Array.from(userIds))
    : Promise.resolve({ data: [], error: null });

  // Fetch listings in parallel
  const listingsPromise = listingIds.size > 0
    ? supabase
        .from("listing")
        .select("id, listing_title, address_with_lat_lng_json, neighborhood_name_entered_by_host")
        .in("id", Array.from(listingIds))
    : Promise.resolve({ data: [], error: null });

  const [usersResult, listingsResult] = await Promise.all([usersPromise, listingsPromise]);

  // Build lookup maps
  const usersMap = new Map<string, unknown>();
  if (usersResult.data) {
    for (const user of usersResult.data) {
      usersMap.set(user.id, user);
    }
  }

  const listingsMap = new Map<string, unknown>();
  if (listingsResult.data) {
    for (const listing of listingsResult.data) {
      listingsMap.set(listing.id, listing);
    }
  }

  // Enrich meetings with related data
  const enrichedMeetings = meetings.map((meeting: Record<string, unknown>) => ({
    ...meeting,
    proposal_unique_id: meeting.proposal,
    status: meeting.end_of_meeting ? 'completed' : 'confirmed',
    guest: meeting.guest ? usersMap.get(String(meeting.guest)) || null : null,
    host: meeting.host ? usersMap.get(String(meeting.host)) || null : null,
    listing: meeting.listing_for_co_host_feature
      ? (() => {
          const listing = listingsMap.get(String(meeting.listing_for_co_host_feature)) as Record<string, unknown> | null;
          if (!listing) return null;
          const address = listing.address_with_lat_lng_json as Record<string, unknown> | null;
          return {
            id: listing.id,
            title: listing.listing_title,
            street_address: address?.address || '',
            unit_apt: '',
            neighborhood_1: listing.neighborhood_name_entered_by_host || '',
          };
        })()
      : null,
  }));

  console.log(`[admin_fetch_confirmed] Found ${enrichedMeetings.length} confirmed meetings`);

  return enrichedMeetings;
}
