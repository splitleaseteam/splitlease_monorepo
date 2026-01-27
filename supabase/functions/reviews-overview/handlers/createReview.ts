/**
 * Create Review Handler
 *
 * Handles new review submissions. Validates the request, creates the review
 * and rating details, and updates the stay record.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../../_shared/cors.ts";
import { ValidationError } from "../../_shared/errors.ts";

interface RatingInput {
  category: string;
  rating: number;
}

interface CreateReviewPayload {
  stayId: string;
  overallRating: number;
  comment?: string;
  wouldRecommend?: boolean;
  ratings: RatingInput[];
}

// Review category labels for hosts reviewing guests
const HOST_REVIEW_CATEGORIES: Record<string, string> = {
  check_in_out: "Check-in/Check-out Etiquette",
  communication: "Communication",
  cleanliness: "Cleanliness",
  payment: "Payment Reliability",
  house_rules: "House Rules Compliance",
  noise: "Noise Consideration",
  amenity_usage: "Amenity Usage",
  trash: "Trash & Recycling",
  neighbor_respect: "Neighbor Respect",
  property_care: "Property Care",
  guest_behavior: "Guest Behavior",
  recommendation: "Would Recommend"
};

// Review category labels for guests reviewing hosts
const GUEST_REVIEW_CATEGORIES: Record<string, string> = {
  accuracy: "Listing Accuracy",
  cleanliness: "Cleanliness",
  communication: "Host Communication",
  check_in: "Check-in Process",
  location: "Location",
  value: "Value for Money"
};

export async function handleCreateReview(
  supabase: SupabaseClient,
  user: User,
  payload: CreateReviewPayload,
  collector: any
): Promise<Response> {
  // 1. Validate required fields
  if (!payload?.stayId) {
    throw new ValidationError("Stay ID is required");
  }

  if (!payload.ratings || !Array.isArray(payload.ratings) || payload.ratings.length === 0) {
    throw new ValidationError("At least one rating is required");
  }

  if (!payload.overallRating || payload.overallRating < 1 || payload.overallRating > 5) {
    throw new ValidationError("Overall rating must be between 1 and 5");
  }

  // Validate individual ratings
  for (const rating of payload.ratings) {
    if (!rating.category || typeof rating.rating !== "number") {
      throw new ValidationError("Invalid rating format");
    }
    if (rating.rating < 1 || rating.rating > 5) {
      throw new ValidationError(`Rating for ${rating.category} must be between 1 and 5`);
    }
  }

  // 2. Get user record
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("_id, user_type")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    console.error("[createReview] User lookup error:", userError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "User not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const reviewerId = userData._id;
  const userType = userData.user_type;

  // 3. Verify stay exists and user is authorized
  const { data: stay, error: stayError } = await supabase
    .from("bookings_stays")
    .select(`
      _id,
      lease_id,
      listing_id,
      host_id,
      guest_id,
      status,
      check_out_date,
      review_by_host_id,
      review_by_guest_id
    `)
    .eq("_id", payload.stayId)
    .single();

  if (stayError || !stay) {
    console.error("[createReview] Stay lookup error:", stayError);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Stay not found"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 4. Verify authorization and determine review type
  let reviewType: string;
  let revieweeId: string;

  if (userType === "Host" && stay.host_id === reviewerId) {
    reviewType = "host_reviews_guest";
    revieweeId = stay.guest_id;

    // Check if already reviewed
    if (stay.review_by_host_id) {
      throw new ValidationError("You have already reviewed this stay");
    }
  } else if (userType === "Guest" && stay.guest_id === reviewerId) {
    reviewType = "guest_reviews_host";
    revieweeId = stay.host_id;

    // Check if already reviewed
    if (stay.review_by_guest_id) {
      throw new ValidationError("You have already reviewed this stay");
    }
  } else {
    throw new ValidationError("You are not authorized to review this stay");
  }

  // 5. Check stay is completed
  if (stay.status !== "completed") {
    throw new ValidationError("Reviews can only be submitted for completed stays");
  }

  // 6. Check review window (14 days)
  const REVIEW_WINDOW_DAYS = 14;
  const checkOutDate = new Date(stay.check_out_date);
  const now = new Date();
  const daysSinceCheckout = Math.floor((now.getTime() - checkOutDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceCheckout > REVIEW_WINDOW_DAYS) {
    throw new ValidationError("The review window has expired (14 days after checkout)");
  }

  // 7. Insert review
  const { data: review, error: insertError } = await supabase
    .from("review")
    .insert({
      stay_id: payload.stayId,
      lease_id: stay.lease_id,
      listing_id: stay.listing_id,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      review_type: reviewType,
      comment: payload.comment?.trim() || null,
      overall_rating: payload.overallRating,
      would_recommend: payload.wouldRecommend ?? null,
      status: "published"
    })
    .select()
    .single();

  if (insertError) {
    console.error("[createReview] Insert error:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    throw new Error(`Failed to create review: ${insertError.message}`);
  }

  console.log("[createReview] Review created:", review._id);

  // 8. Insert rating details
  const categoryLabels = reviewType === "host_reviews_guest"
    ? HOST_REVIEW_CATEGORIES
    : GUEST_REVIEW_CATEGORIES;

  const ratingDetails = payload.ratings.map(r => ({
    review_id: review._id,
    category: r.category,
    category_label: categoryLabels[r.category] || r.category,
    rating: r.rating
  }));

  const { error: ratingError } = await supabase
    .from("review_rating_detail")
    .insert(ratingDetails);

  if (ratingError) {
    console.error("[createReview] Rating detail insert error:", {
      code: ratingError.code,
      message: ratingError.message,
      details: ratingError.details,
      hint: ratingError.hint
    });
    // Don't fail the whole request, log the error
    collector.add(new Error(ratingError.message), "insert rating details");
  }

  // 9. Update stay with review reference
  const stayUpdate = reviewType === "host_reviews_guest"
    ? { review_by_host_id: review._id, review_by_host_submitted_at: new Date().toISOString() }
    : { review_by_guest_id: review._id, review_by_guest_submitted_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("bookings_stays")
    .update(stayUpdate)
    .eq("_id", payload.stayId);

  if (updateError) {
    console.error("[createReview] Stay update error:", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint
    });
    collector.add(new Error(updateError.message), "update stay reference");
  }

  console.log("[createReview] Successfully created review for stay:", payload.stayId);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        reviewId: review._id,
        message: "Review submitted successfully"
      }
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
