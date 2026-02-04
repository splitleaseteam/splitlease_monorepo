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
    .not("booked date", "is", null)
    .order("booked date", { ascending: true });

  // Apply optional filters
  if (payload.proposalId) {
    query = query.ilike("proposal_unique_id", `%${payload.proposalId}%`);
  }

  if (payload.status) {
    query = query.eq("status", payload.status);
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
    if (meeting.guest) userIds.add(meeting.guest);
    if (meeting.host) userIds.add(meeting.host);
    if (meeting["Listing (for Co-Host feature)"]) {
      listingIds.add(meeting["Listing (for Co-Host feature)"]);
    }
  }

  // Fetch users in parallel
  const usersPromise = userIds.size > 0
    ? supabase
        .from("users")
        .select("id, _id, name_first, name_last, email, phone_number, profile_photo_url, timezone")
        .in("_id", Array.from(userIds))
    : Promise.resolve({ data: [], error: null });

  // Fetch listings in parallel
  const listingsPromise = listingIds.size > 0
    ? supabase
        .from("listing")
        .select("_id, title, street_address, unit_apt, neighborhood_1")
        .in("_id", Array.from(listingIds))
    : Promise.resolve({ data: [], error: null });

  const [usersResult, listingsResult] = await Promise.all([usersPromise, listingsPromise]);

  // Build lookup maps
  const usersMap = new Map<string, unknown>();
  if (usersResult.data) {
    for (const user of usersResult.data) {
      usersMap.set(user._id, user);
    }
  }

  const listingsMap = new Map<string, unknown>();
  if (listingsResult.data) {
    for (const listing of listingsResult.data) {
      listingsMap.set(listing._id, listing);
    }
  }

  // Enrich meetings with related data
  const enrichedMeetings = meetings.map((meeting) => ({
    ...meeting,
    guest: meeting.guest ? usersMap.get(meeting.guest) || null : null,
    host: meeting.host ? usersMap.get(meeting.host) || null : null,
    listing: meeting["Listing (for Co-Host feature)"]
      ? listingsMap.get(meeting["Listing (for Co-Host feature)"]) || null
      : null,
  }));

  console.log(`[admin_fetch_confirmed] Found ${enrichedMeetings.length} confirmed meetings`);

  return enrichedMeetings;
}
