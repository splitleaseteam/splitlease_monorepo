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
    .select("id, user_type")
    .eq("auth_user_id", user.id)
    .maybeSingle();

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
  const userId = userData.id;

  // Build query based on user type
  // Pending = completed stays without a review from this user
  let query = supabase
    .from("lease_weekly_stay")
    .select(`
      id,
      lease_id,
      listing_id,
      checkin_night_date,
      checkout_day_date,
      week_number_in_lease,
      stay_status,
      host_user_id,
      guest_user_id,
      listing:listing_id (
        id,
        listing_title
      ),
      lease:lease_id (
        id,
        host_user_id,
        guest_user_id,
        host:host_user_id ( id, first_name, last_name ),
        guest:guest_user_id ( id, first_name, last_name )
      )
    `)
    .eq("stay_status", "completed")
    .order("checkout_day_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by user type
  if (userType === "Host") {
    query = query
      .eq("host_user_id", userId);
  } else {
    query = query
      .eq("guest_user_id", userId);
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
      if (!stay.checkout_day_date) return false;
      const checkOut = new Date(stay.checkout_day_date);
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
        revieweeId = lease?.guest?.id || stay.guest_user_id;
        revieweeName = lease?.guest
          ? `${lease.guest.first_name || ""} ${lease.guest.last_name || ""}`.trim()
          : "Guest";
        revieweeType = "guest";
      } else {
        // Guest reviews Host
        revieweeId = lease?.host?.id || stay.host_user_id;
        revieweeName = lease?.host
          ? `${lease.host.first_name || ""} ${lease.host.last_name || ""}`.trim()
          : "Host";
        revieweeType = "host";
      }

      return {
        stay_id: stay.id,
        lease_id: stay.lease_id,
        listing_id: stay.listing_id,
        listing_name: listing?.listing_title || "Unknown Listing",
        listing_image_url: null,
        check_in_date: stay.checkin_night_date,
        check_out_date: stay.checkout_day_date,
        week_number: stay.week_number_in_lease,
        reviewee_id: revieweeId,
        reviewee_name: revieweeName,
        reviewee_type: revieweeType,
        days_until_expiry: calculateDaysUntilExpiry(stay.checkout_day_date)
      };
    });

  // Get total count for pagination
  let countQuery = supabase
    .from("lease_weekly_stay")
    .select("*", { count: "exact", head: true })
    .eq("stay_status", "completed");

  if (userType === "Host") {
    countQuery = countQuery.eq("host_user_id", userId);
  } else {
    countQuery = countQuery.eq("guest_user_id", userId);
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
