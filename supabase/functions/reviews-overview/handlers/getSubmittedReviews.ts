/**
 * Get Submitted Reviews Handler
 *
 * Returns reviews that the current user has written.
 * Includes rating details and reviewee information.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../../_shared/cors.ts";

interface SubmittedReviewsPayload {
  limit?: number;
  offset?: number;
}

export async function handleGetSubmittedReviews(
  supabase: SupabaseClient,
  user: User,
  payload: SubmittedReviewsPayload
): Promise<Response> {
  const { limit = 20, offset = 0 } = payload;

  // Get user record
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (userError || !userData) {
    console.error("[getSubmittedReviews] User lookup error:", userError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "User not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = userData.id;

  // Query reviews where current user is the reviewer
  const { data: reviews, error: queryError } = await supabase
    .from("review")
    .select(`
      id,
      stay_id,
      lease_id,
      listing_id,
      reviewer_id,
      reviewee_id,
      review_type,
      comment,
      overall_rating,
      would_recommend,
      created_at,
      status,
      stay:stay_id (
        checkin_night_date,
        checkout_day_date
      ),
      listing:listing_id (
        listing_title
      ),
      reviewee:reviewee_id (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      rating_details:review_rating_detail (
        category,
        category_label,
        rating
      )
    `)
    .eq("reviewer_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryError) {
    console.error("[getSubmittedReviews] Query error:", {
      code: queryError.code,
      message: queryError.message,
      details: queryError.details,
      hint: queryError.hint
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch submitted reviews"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Transform reviews
  const transformedReviews = (reviews || []).map(review => {
    const stay = review.stay as any;
    const listing = review.listing as any;
    const reviewee = review.reviewee as any;

    return {
      review_id: review.id,
      stay_id: review.stay_id,
      lease_id: review.lease_id,
      listing_name: listing?.listing_title || "Unknown Listing",
      listing_image_url: null,
      check_in_date: stay?.checkin_night_date,
      check_out_date: stay?.checkout_day_date,
      review_type: review.review_type,
      reviewee_id: review.reviewee_id,
      reviewee_name: reviewee
        ? `${reviewee.first_name || ""} ${reviewee.last_name || ""}`.trim()
        : "Unknown",
      reviewee_image_url: reviewee?.profile_photo_url || null,
      overall_rating: review.overall_rating,
      comment: review.comment,
      would_recommend: review.would_recommend,
      rating_details: review.rating_details || [],
      created_at: review.created_at
    };
  });

  // Get total count
  const { count } = await supabase
    .from("review")
    .select("*", { count: "exact", head: true })
    .eq("reviewer_id", userId);

  console.log(`[getSubmittedReviews] Found ${transformedReviews.length} submitted reviews for user ${userId}`);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reviews: transformedReviews,
        totalCount: count || transformedReviews.length
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
