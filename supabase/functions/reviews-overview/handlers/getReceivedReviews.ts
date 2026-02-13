/**
 * Get Received Reviews Handler
 *
 * Returns reviews that others have written about the current user.
 * Includes rating details and reviewer information.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../../_shared/cors.ts";

interface ReceivedReviewsPayload {
  limit?: number;
  offset?: number;
}

export async function handleGetReceivedReviews(
  supabase: SupabaseClient,
  user: User,
  payload: ReceivedReviewsPayload
): Promise<Response> {
  const { limit = 20, offset = 0 } = payload;

  // Get user record
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("[getReceivedReviews] User lookup error:", userError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "User not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = userData.id;

  // Query reviews where current user is the reviewee
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
        check_in_date,
        check_out_date,
        review_by_host_id,
        review_by_guest_id
      ),
      listing:listing_id (
        name,
        cover_image_url
      ),
      reviewer:reviewer_id (
        id,
        first_name,
        last_name,
        profile_image_url
      ),
      rating_details:review_rating_detail (
        category,
        category_label,
        rating
      )
    `)
    .eq("reviewee_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryError) {
    console.error("[getReceivedReviews] Query error:", {
      code: queryError.code,
      message: queryError.message,
      details: queryError.details,
      hint: queryError.hint
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch received reviews"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Transform reviews
  const transformedReviews = (reviews || []).map(review => {
    const stay = review.stay as any;
    const listing = review.listing as any;
    const reviewer = review.reviewer as any;

    return {
      review_id: review.id,
      stay_id: review.stay_id,
      lease_id: review.lease_id,
      listing_name: listing?.name || "Unknown Listing",
      listing_image_url: listing?.cover_image_url || null,
      check_in_date: stay?.check_in_date,
      check_out_date: stay?.check_out_date,
      review_type: review.review_type,
      reviewer_id: review.reviewer_id,
      reviewer_name: reviewer
        ? `${reviewer.first_name || ""} ${reviewer.last_name || ""}`.trim()
        : "Anonymous",
      reviewer_image_url: reviewer?.profile_image_url || null,
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
    .eq("reviewee_id", userId)
    .eq("status", "published");

  // Calculate average rating
  const ratingsSum = transformedReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0);
  const averageRating = transformedReviews.length > 0
    ? Math.round((ratingsSum / transformedReviews.length) * 10) / 10
    : null;

  console.log(`[getReceivedReviews] Found ${transformedReviews.length} received reviews for user ${userId}`);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reviews: transformedReviews,
        totalCount: count || transformedReviews.length,
        averageRating
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
