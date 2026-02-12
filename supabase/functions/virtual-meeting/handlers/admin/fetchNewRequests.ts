/**
 * Admin Handler: Fetch New Virtual Meeting Requests
 *
 * Fetches all pending meeting requests (status = 'new_request', no booked date)
 * with related guest, host, and listing data
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AuthenticationError as _AuthenticationError, ValidationError } from "../../../_shared/errors.ts";

interface FetchFilters {
  proposalId?: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function handleAdminFetchNewRequests(
  payload: FetchFilters,
  user: AuthenticatedUser | null,
  supabase: SupabaseClient
): Promise<unknown[]> {
  // Authentication is now optional - internal pages can access without login
  console.log(`[admin_fetch_new_requests] Fetching new requests${user ? ` for admin: ${user.email}` : ' (unauthenticated)'}`);

  // Build query for pending requests (no FK-based joins - table has no FK constraints)
  let query = supabase
    .from("virtualmeetingschedulesandlinks")
    .select("*")
    .is("booked date", null)
    .order("created_at", { ascending: false });

  // Apply optional proposal filter
  if (payload.proposalId) {
    query = query.ilike("proposal_unique_id", `%${payload.proposalId}%`);
  }

  const { data: meetings, error } = await query;

  if (error) {
    console.error("[admin_fetch_new_requests] Database error:", error);
    throw new ValidationError(`Failed to fetch new requests: ${error.message}`);
  }

  if (!meetings || meetings.length === 0) {
    console.log("[admin_fetch_new_requests] No pending requests found");
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

  // Fetch users in parallel (table is "user" singular, columns have legacy Bubble naming)
  const usersPromise = userIds.size > 0
    ? supabase
        .from("user")
        .select('id, first_name, last_name, email, phone_number, profile_photo_url')
        .in("id", Array.from(userIds))
    : Promise.resolve({ data: [], error: null });

  // Fetch listings in parallel
  const listingsPromise = listingIds.size > 0
    ? supabase
        .from("listing")
        .select("id, title, street_address, unit_apt, neighborhood_1")
        .in("id", Array.from(listingIds))
    : Promise.resolve({ data: [], error: null });

  const [usersResult, listingsResult] = await Promise.all([usersPromise, listingsPromise]);

  // Build lookup maps with normalized field names for frontend compatibility
  const usersMap = new Map<string, unknown>();
  if (usersResult.data) {
    for (const user of usersResult.data) {
      // Normalize legacy Bubble column names to frontend-expected property names
      usersMap.set(user.id, {
        id: user.id,
        name_first: user.first_name || "",
        name_last: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        profile_photo_url: user.profile_photo_url || "",
      });
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
    guest: meeting.guest ? usersMap.get(meeting.guest) || null : null,
    host: meeting.host ? usersMap.get(meeting.host) || null : null,
    listing: meeting["Listing (for Co-Host feature)"]
      ? listingsMap.get(meeting["Listing (for Co-Host feature)"]) || null
      : null,
  }));

  console.log(`[admin_fetch_new_requests] Found ${enrichedMeetings.length} pending requests`);

  return enrichedMeetings;
}
