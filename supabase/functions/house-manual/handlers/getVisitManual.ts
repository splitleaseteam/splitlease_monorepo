/**
 * Get Visit Manual Handler
 *
 * Fetches house manual data for guest viewing, with authentication via:
 * 1. Supabase Auth (authenticated user is the guest of the visit)
 * 2. Magic link access token (validates token, user must still be authenticated)
 *
 * NO ANONYMOUS ACCESS: User must be authenticated as the visit's guest.
 *
 * @module house-manual/handlers/getVisitManual
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, AuthenticationError } from "../../_shared/errors.ts";

interface GetVisitManualPayload {
  visitId: string;
  accessToken?: string;
}

interface HandlerContext {
  userId: string;
  supabaseClient: SupabaseClient;
  payload: GetVisitManualPayload;
}

interface ManualSection {
  id: string;
  title: string;
  type: string;
  content: unknown;
  order: number;
}

interface VisitManualResult {
  visit: {
    id: string;
    guestId: string;
    arrivalDate: string | null;
    language: string | null;
    shortUrl: string | null;
    hasReviewed: boolean;
    linkSaw: boolean;
    mapSaw: boolean;
    narrationHeard: boolean;
  };
  houseManual: {
    id: string;
    title: string;
    hostName: string | null;
    propertyAddress: string | null;
    sections: ManualSection[];
  };
}

/**
 * Build sections from flat house manual database row
 */
function buildManualSections(dbRow: Record<string, unknown>): ManualSection[] {
  const sections: ManualSection[] = [];
  let order = 1;

  // WiFi Section
  if (dbRow.wifi_network_name || dbRow.wifi_network_password) {
    sections.push({
      id: "wifi",
      title: "WiFi & Internet",
      type: "wifi",
      content: {
        networkName: dbRow.wifi_network_name,
        password: dbRow.wifi_network_password,
        photo: dbRow.wifi_credentials_photo_url,
      },
      order: order++,
    });
  }

  // Check-In Section
  if (dbRow.checkin_instructions_by_host) {
    sections.push({
      id: "checkin",
      title: "Check-In Instructions",
      type: "text",
      content: dbRow.checkin_instructions_by_host,
      order: order++,
    });
  }

  // Check-Out Section
  if (dbRow.checkout_instructions_by_host) {
    sections.push({
      id: "checkout",
      title: "Check-Out Instructions",
      type: "text",
      content: dbRow.checkout_instructions_by_host,
      order: order++,
    });
  }

  // House Rules Section
  if (dbRow.house_rules_reference_ids_json) {
    sections.push({
      id: "rules",
      title: "House Rules",
      type: "rules",
      content: dbRow.house_rules_reference_ids_json,
      order: order++,
    });
  }

  // Departure Checklist Section
  if (dbRow.departure_checklist_items_json) {
    sections.push({
      id: "checklist",
      title: "Departure Checklist",
      type: "checklist",
      content: dbRow.departure_checklist_items_json,
      order: order++,
    });
  }

  // Parking Section
  if (dbRow.parking_tips_text) {
    sections.push({
      id: "parking",
      title: "Parking",
      type: "text",
      content: dbRow.parking_tips_text,
      order: order++,
    });
  }

  // Trash & Recycling Section
  if (dbRow.waste_disposal_and_recycling_text) {
    sections.push({
      id: "trash",
      title: "Trash & Recycling",
      type: "text",
      content: dbRow.waste_disposal_and_recycling_text,
      order: order++,
    });
  }

  // HVAC / Heating & Cooling Section
  if (dbRow.temperature_control_instructions_text) {
    sections.push({
      id: "hvac",
      title: "Heating & Cooling",
      type: "text",
      content: dbRow.temperature_control_instructions_text,
      order: order++,
    });
  }

  // Kitchen Section
  if (dbRow.kitchen_specific_tips_text) {
    sections.push({
      id: "kitchen",
      title: "Kitchen",
      type: "text",
      content: dbRow.kitchen_specific_tips_text,
      order: order++,
    });
  }

  // Laundry Section
  if (dbRow.laundry_options_text) {
    sections.push({
      id: "laundry",
      title: "Laundry",
      type: "text",
      content: dbRow.laundry_options_text,
      order: order++,
    });
  }

  // Emergency Contacts Section
  if (dbRow.important_contact_information_other) {
    sections.push({
      id: "emergency",
      title: "Emergency Contacts",
      type: "contacts",
      content: dbRow.important_contact_information_other,
      order: order++,
    });
  }

  // Local Recommendations Section
  if (dbRow.local_attractions_and_activities_text) {
    sections.push({
      id: "local",
      title: "Local Recommendations",
      type: "text",
      content: dbRow.local_attractions_and_activities_text,
      order: order++,
    });
  }

  // Additional Notes Section
  if (dbRow.good_to_know_general_tips_text) {
    sections.push({
      id: "notes",
      title: "Additional Notes",
      type: "text",
      content: dbRow.good_to_know_general_tips_text,
      order: order++,
    });
  }

  return sections;
}

/**
 * Extract address text from geo field
 */
function extractAddressText(geoField: unknown): string | null {
  if (!geoField) return null;

  // If it's a string, return as-is
  if (typeof geoField === "string") return geoField;

  // If it's an object with address property
  if (typeof geoField === "object" && geoField !== null) {
    const geo = geoField as Record<string, unknown>;
    if (geo.address) return String(geo.address);
    if (geo.formatted_address) return String(geo.formatted_address);
  }

  return null;
}

/**
 * Fetch house manual for guest viewing
 *
 * SECURITY: Only the guest associated with the visit can access the manual.
 * Magic link tokens provide a second layer of validation but user must be authenticated.
 */
export async function handleGetVisitManual(
  context: HandlerContext
): Promise<VisitManualResult> {
  const { userId, supabaseClient, payload } = context;
  const { visitId, accessToken } = payload;

  // Validate input
  if (!visitId || typeof visitId !== "string") {
    throw new ValidationError("visitId is required");
  }

  console.log(`[getVisitManual] Fetching manual for visit: ${visitId}, user: ${userId}`);

  // Step 1: Fetch the visit with house manual join
  const { data: visit, error: visitError } = await supabaseClient
    .from("house_manual_visit")
    .select(`
      id,
      guest_user_id,
      arrival_checkin_date,
      translation_language,
      short_url_for_sharing,
      guest_review_text,
      guest_opened_visit_link,
      guest_opened_map_view,
      guest_listened_to_narration,
      access_token,
      token_expires_at,
      token_used_at,
      review_submitted_at,
      house_manual_id
    `)
    .eq("id", visitId)
    .single();

  if (visitError || !visit) {
    console.error(`[getVisitManual] Visit not found:`, visitError);
    throw new ValidationError(`Visit not found: ${visitId}`);
  }

  // Step 2: Verify the authenticated user is the guest of this visit
  // We need to look up the user table to match supabase auth user to guest ID
  const { data: userData, error: userError } = await supabaseClient
    .from("user")
    .select("id, supabase_user_id")
    .eq("supabase_user_id", userId)
    .maybeSingle();

  if (userError || !userData) {
    console.error(`[getVisitManual] User not found for supabase ID:`, userError);
    throw new AuthenticationError("User not found");
  }

  const guestId = visit.guest_user_id;

  // Verify user is the guest of this visit
  if (userData.id !== guestId) {
    console.error(`[getVisitManual] Access denied. User ${userData.id} is not guest ${guestId}`);
    throw new AuthenticationError("You are not authorized to view this house manual");
  }

  // Step 3: If access token provided, validate it
  if (accessToken) {
    const storedToken = visit.access_token;
    const expiresAt = visit.token_expires_at;

    if (!storedToken || storedToken !== accessToken) {
      throw new AuthenticationError("Invalid access token");
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw new AuthenticationError("Access token has expired");
    }

    // Update token_used_at if not already set
    if (!visit.token_used_at) {
      await supabaseClient
        .from("house_manual_visit")
        .update({
          token_used_at: new Date().toISOString(),
        })
        .eq("id", visitId);
    }
  }

  // Step 4: Fetch the house manual
  const houseManualId = visit.house_manual_id;

  if (!houseManualId) {
    throw new ValidationError("No house manual associated with this visit");
  }

  const { data: houseManual, error: hmError } = await supabaseClient
    .from("house_manual")
    .select("*")
    .eq("id", houseManualId)
    .single();

  if (hmError || !houseManual) {
    console.error(`[getVisitManual] House manual not found:`, hmError);
    throw new ValidationError(`House manual not found: ${houseManualId}`);
  }

  console.log(`[getVisitManual] Successfully retrieved manual for visit ${visitId}`);

  // Build response
  return {
    visit: {
      id: visit.id,
      guestId: guestId,
      arrivalDate: visit.arrival_checkin_date,
      language: visit.translation_language,
      shortUrl: visit.short_url_for_sharing,
      hasReviewed: Boolean(visit.guest_review_text || visit.review_submitted_at),
      linkSaw: Boolean(visit.guest_opened_visit_link),
      mapSaw: Boolean(visit.guest_opened_map_view),
      narrationHeard: Boolean(visit.guest_listened_to_narration),
    },
    houseManual: {
      id: houseManual.id,
      title: houseManual.manual_title || "House Manual",
      hostName: houseManual.host_display_name,
      propertyAddress: extractAddressText(houseManual.address_with_coordinates_json),
      sections: buildManualSections(houseManual),
    },
  };
}

export default handleGetVisitManual;
