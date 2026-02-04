/**
 * Get Pending Reviews Handler
 *
 * Returns stays where the current user has not yet submitted a review.
 * Supports both Host and Guest users.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../../_shared/cors.ts";
import { calculateDaysUntilExpiry } from "../lib/utils.ts";

interface PendingReviewPayload {
  limit?: number;
  offset?: number;
}

export async function handleGetPendingReviews(
  supabase: SupabaseClient,
  user: User,
  payload: PendingReviewPayload
): Promise<Response> {
  const { limit = 50, offset = 0 } = payload;

  // Get user record to determine user type
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("_id, user_type")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("[getPendingReviews] User lookup error:", userError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "User not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userType = userData.user_type; // 'Host' or 'Guest'
  const userId = userData._id;

  // Build query based on user type
  // Pending = completed stays without a review from this user
  let query = supabase
    .from("bookings_stays")
    .select(`
      _id,
      lease_id,
      listing_id,
      check_in_date,
      check_out_date,
      week_number,
      status,
      host_id,
      guest_id,
      review_by_host_id,
      review_by_guest_id,
      listing:listing_id (
        _id,
        name,
        cover_image_url
      ),
      lease:lease_id (
        _id,
        host_id,
        guest_id,
        host:host_id ( _id, name_first, name_last ),
        guest:guest_id ( _id, name_first, name_last )
      )
    `)
    .eq("status", "completed")
    .order("check_out_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by user type and pending review status
  if (userType === "Host") {
    query = query
      .eq("host_id", userId)
      .is("review_by_host_id", null);
  } else {
    query = query
      .eq("guest_id", userId)
      .is("review_by_guest_id", null);
  }

  const { data: stays, error: queryError } = await query;

  if (queryError) {
    console.error("[getPendingReviews] Query error:", {
      code: queryError.code,
      message: queryError.message,
      details: queryError.details,
      hint: queryError.hint
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch pending reviews"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Filter out expired reviews (> 14 days since checkout) and transform
  const REVIEW_WINDOW_DAYS = 14;
  const now = new Date();

  const pendingReviews = (stays || [])
    .filter(stay => {
      if (!stay.check_out_date) return false;
      const checkOut = new Date(stay.check_out_date);
      const daysSince = Math.floor((now.getTime() - checkOut.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= REVIEW_WINDOW_DAYS;
    })
    .map(stay => {
      // Determine reviewee based on user type
      const lease = stay.lease as any;
      const listing = stay.listing as any;

      let revieweeId: string;
      let revieweeName: string;
      let revieweeType: string;

      if (userType === "Host") {
        // Host reviews Guest
        revieweeId = lease?.guest?._id || stay.guest_id;
        revieweeName = lease?.guest
          ? `${lease.guest.name_first || ""} ${lease.guest.name_last || ""}`.trim()
          : "Guest";
        revieweeType = "guest";
      } else {
        // Guest reviews Host
        revieweeId = lease?.host?._id || stay.host_id;
        revieweeName = lease?.host
          ? `${lease.host.name_first || ""} ${lease.host.name_last || ""}`.trim()
          : "Host";
        revieweeType = "host";
      }

      return {
        stay_id: stay._id,
        lease_id: stay.lease_id,
        listing_id: stay.listing_id,
        listing_name: listing?.name || "Unknown Listing",
        listing_image_url: listing?.cover_image_url || null,
        check_in_date: stay.check_in_date,
        check_out_date: stay.check_out_date,
        week_number: stay.week_number,
        reviewee_id: revieweeId,
        reviewee_name: revieweeName,
        reviewee_type: revieweeType,
        days_until_expiry: calculateDaysUntilExpiry(stay.check_out_date)
      };
    });

  // Get total count for pagination
  let countQuery = supabase
    .from("bookings_stays")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  if (userType === "Host") {
    countQuery = countQuery.eq("host_id", userId).is("review_by_host_id", null);
  } else {
    countQuery = countQuery.eq("guest_id", userId).is("review_by_guest_id", null);
  }

  const { count } = await countQuery;

  console.log(`[getPendingReviews] Found ${pendingReviews.length} pending reviews for user ${userId}`);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reviews: pendingReviews,
        totalCount: count || pendingReviews.length
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
