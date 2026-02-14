/**
 * Track Engagement Handler
 *
 * Tracks guest engagement with the house manual.
 * Updates visit fields to record what the guest has seen/heard.
 *
 * Tracked engagements:
 * - link_saw: Guest viewed the house manual link
 * - map_saw: Guest viewed the map
 * - narration_heard: Guest listened to audio narration
 *
 * @module house-manual/handlers/trackEngagement
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, AuthenticationError } from "../../_shared/errors.ts";

interface TrackEngagementPayload {
  visitId: string;
  engagementType: "link_saw" | "map_saw" | "narration_heard";
}

interface HandlerContext {
  userId: string;
  supabaseClient: SupabaseClient;
  payload: TrackEngagementPayload;
}

interface TrackEngagementResult {
  success: boolean;
  visitId: string;
  engagementType: string;
  previousValue: boolean;
  newValue: boolean;
}

// Map engagement types to database column names
const ENGAGEMENT_FIELD_MAP: Record<string, string> = {
  link_saw: "guest_opened_visit_link",
  map_saw: "guest_opened_map_view",
  narration_heard: "guest_listened_to_narration",
};

/**
 * Track guest engagement with house manual
 *
 * SECURITY: Only the guest of the visit can track engagement.
 * Verifies the authenticated user matches the visit's guest.
 */
export async function handleTrackEngagement(
  context: HandlerContext
): Promise<TrackEngagementResult> {
  const { userId, supabaseClient, payload } = context;
  const { visitId, engagementType } = payload;

  // Validate input
  if (!visitId || typeof visitId !== "string") {
    throw new ValidationError("visitId is required");
  }

  if (!engagementType || !ENGAGEMENT_FIELD_MAP[engagementType]) {
    throw new ValidationError(
      `Invalid engagementType. Must be one of: ${Object.keys(ENGAGEMENT_FIELD_MAP).join(", ")}`
    );
  }

  console.log(`[trackEngagement] Tracking ${engagementType} for visit: ${visitId}`);

  // Step 1: Fetch the visit and verify guest ownership
  const { data: visit, error: visitError } = await supabaseClient
    .from("house_manual_visit")
    .select(`
      id,
      guest_user_id,
      guest_opened_visit_link,
      guest_opened_map_view,
      guest_listened_to_narration,
      timestamp_guest_first_logged_in
    `)
    .eq("id", visitId)
    .single();

  if (visitError || !visit) {
    console.error(`[trackEngagement] Visit not found:`, visitError);
    throw new ValidationError(`Visit not found: ${visitId}`);
  }

  // Step 2: Verify the authenticated user is the guest of this visit
  const { data: userData, error: userError } = await supabaseClient
    .from("user")
    .select("id, supabase_user_id")
    .eq("supabase_user_id", userId)
    .maybeSingle();

  if (userError || !userData) {
    console.error(`[trackEngagement] User not found for supabase ID:`, userError);
    throw new AuthenticationError("User not found");
  }

  const guestId = visit.guest_user_id;

  if (userData.id !== guestId) {
    console.error(`[trackEngagement] Access denied. User ${userData.id} is not guest ${guestId}`);
    throw new AuthenticationError("You are not authorized to track engagement for this visit");
  }

  // Step 3: Get current value and update if not already true
  const fieldName = ENGAGEMENT_FIELD_MAP[engagementType];
  const previousValue = Boolean(visit[fieldName as keyof typeof visit]);

  // Only update if not already true (idempotent)
  if (!previousValue) {
    const updatePayload: Record<string, unknown> = {
      [fieldName]: true,
      updated_at: new Date().toISOString(),
    };

    // Also track first login time if this is link_saw
    if (engagementType === "link_saw" && !visit.timestamp_guest_first_logged_in) {
      updatePayload.timestamp_guest_first_logged_in = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("house_manual_visit")
      .update(updatePayload)
      .eq("id", visitId);

    if (updateError) {
      console.error(`[trackEngagement] Failed to update visit:`, updateError);
      throw new Error(`Failed to track engagement: ${updateError.message}`);
    }

    console.log(`[trackEngagement] Updated ${fieldName} to true for visit ${visitId}`);
  } else {
    console.log(`[trackEngagement] ${fieldName} already true for visit ${visitId}, skipping update`);
  }

  return {
    success: true,
    visitId,
    engagementType,
    previousValue,
    newValue: true,
  };
}

export default handleTrackEngagement;
