/**
 * Get Review Details Handler
 *
 * Returns the full details of a specific review.
 * Verifies the user is authorized to view (reviewer or reviewee).
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../../_shared/cors.ts";
import { ValidationError } from "../../_shared/errors.ts";

interface GetReviewDetailsPayload {
  reviewId: string;
}

export async function handleGetReviewDetails(
  supabase: SupabaseClient,
  user: User,
  payload: GetReviewDetailsPayload
): Promise<Response> {
  if (!payload?.reviewId) {
    throw new ValidationError("Review ID is required");
  }

  // Get user record
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("[getReviewDetails] User lookup error:", userError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "User not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = userData.id;

  // Query review with all related data
  const { data: review, error: queryError } = await supabase
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
        week_number,
        review_by_host_id,
        review_by_guest_id
      ),
      listing:listing_id (
        name,
        cover_image_url,
        address_city,
        address_state
      ),
      reviewer:reviewer_id (
        id,
        first_name,
        last_name,
        profile_photo_url
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
    .eq("id", payload.reviewId)
    .single();

  if (queryError || !review) {
    console.error("[getReviewDetails] Query error:", queryError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Review not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify user is authorized to view this review
  if (review.reviewer_id !== userId && review.reviewee_id !== userId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Not authorized to view this review"
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Transform review
  const stay = review.stay as any;
  const listing = review.listing as any;
  const reviewer = review.reviewer as any;
  const reviewee = review.reviewee as any;

  const transformedReview = {
    review_id: review.id,
    stay_id: review.stay_id,
    lease_id: review.lease_id,
    listing_id: review.listing_id,
    listing_name: listing?.name || "Unknown Listing",
    listing_image_url: listing?.cover_image_url || null,
    listing_location: listing ? `${listing.address_city || ""}, ${listing.address_state || ""}`.trim() : null,
    check_in_date: stay?.check_in_date,
    check_out_date: stay?.check_out_date,
    week_number: stay?.week_number,
    review_type: review.review_type,
    reviewer_id: review.reviewer_id,
    reviewer_name: reviewer
      ? `${reviewer.first_name || ""} ${reviewer.last_name || ""}`.trim()
      : "Anonymous",
    reviewer_image_url: reviewer?.profile_photo_url || null,
    reviewee_id: review.reviewee_id,
    reviewee_name: reviewee
      ? `${reviewee.first_name || ""} ${reviewee.last_name || ""}`.trim()
      : "Unknown",
    reviewee_image_url: reviewee?.profile_photo_url || null,
    overall_rating: review.overall_rating,
    comment: review.comment,
    would_recommend: review.would_recommend,
    rating_details: review.rating_details || [],
    created_at: review.created_at,
    is_reviewer: review.reviewer_id === userId
  };

  console.log(`[getReviewDetails] Retrieved review ${payload.reviewId} for user ${userId}`);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        review: transformedReview
      }
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
