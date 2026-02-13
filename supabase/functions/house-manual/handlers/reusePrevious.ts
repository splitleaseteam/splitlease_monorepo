/**
 * Reuse Previous Handler
 *
 * Copies suggestions from a previous house manual to the current one.
 * Useful when a host has created suggestions for one listing and wants
 * to apply similar content to another.
 *
 * @module house-manual/handlers/reusePrevious
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../../_shared/errors.ts";

interface ReusePreviousPayload {
  targetHouseManualId: string;
  sourceHouseManualId: string;
  fieldsToReuse?: string[]; // Optional: specific fields to copy
}

interface HandlerContext {
  userId: string;
  supabaseClient: SupabaseClient;
  payload: ReusePreviousPayload;
}

interface ReusePreviousResult {
  success: boolean;
  targetHouseManualId: string;
  sourceHouseManualId: string;
  suggestionsCreated: number;
  fields: string[];
}

// Fields that can be reused from house manuals
const REUSABLE_FIELDS = [
  "checkin_instructions_by_host",
  "checkout_instructions_by_host",
  "house_rules_reference_ids_json",
  "wifi_network_name",
  "wifi_network_password",
  "temperature_control_instructions_text",
  "security_features_description_text",
  "parking_tips_text",
  "local_attractions_and_activities_text",
  "important_contact_information_other",
  "amenities_usage_tips_text",
  "good_to_know_general_tips_text",
];

/**
 * Generate a platform-compatible ID
 */
function generatePlatformId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}x${randomPart}`;
}

/**
 * Reuse content from a previous house manual as suggestions
 *
 * 1. Validate source and target house manuals exist
 * 2. Fetch content from source house manual
 * 3. Create suggestions for each field with content
 */
export async function handleReusePrevious(
  context: HandlerContext
): Promise<ReusePreviousResult> {
  const { supabaseClient, payload, userId } = context;
  const { targetHouseManualId, sourceHouseManualId, fieldsToReuse } = payload;

  // Validate input
  if (!targetHouseManualId || typeof targetHouseManualId !== "string") {
    throw new ValidationError("targetHouseManualId is required and must be a string");
  }

  if (!sourceHouseManualId || typeof sourceHouseManualId !== "string") {
    throw new ValidationError("sourceHouseManualId is required and must be a string");
  }

  if (targetHouseManualId === sourceHouseManualId) {
    throw new ValidationError("Source and target house manuals must be different");
  }

  // Determine which fields to reuse
  const fieldsToCheck = fieldsToReuse && fieldsToReuse.length > 0
    ? fieldsToReuse.filter(f => REUSABLE_FIELDS.includes(f))
    : REUSABLE_FIELDS;

  console.log(`[reusePrevious] Reusing from ${sourceHouseManualId} to ${targetHouseManualId}`);
  console.log(`[reusePrevious] Fields to check: ${fieldsToCheck.join(", ")}`);

  // Verify target house manual exists
  const { data: targetManual, error: targetError } = await supabaseClient
    .from("house_manual")
    .select("id")
    .eq("id", targetHouseManualId)
    .single();

  if (targetError || !targetManual) {
    throw new ValidationError(`Target house manual not found: ${targetHouseManualId}`);
  }

  // Fetch source house manual with all reusable fields
  const { data: sourceManual, error: sourceError } = await supabaseClient
    .from("house_manual")
    .select("*")
    .eq("id", sourceHouseManualId)
    .single();

  if (sourceError || !sourceManual) {
    throw new ValidationError(`Source house manual not found: ${sourceHouseManualId}`);
  }

  // Fetch existing content from target to set as "Previous Content"
  const { data: targetContent } = await supabaseClient
    .from("house_manual")
    .select("*")
    .eq("id", targetHouseManualId)
    .single();

  // Create suggestions for fields with content
  const suggestionsToCreate = [];
  const now = new Date().toISOString();

  for (const field of fieldsToCheck) {
    const sourceValue = sourceManual[field];

    // Skip empty fields
    if (!sourceValue || (typeof sourceValue === "string" && sourceValue.trim() === "")) {
      continue;
    }

    // Handle JSON fields
    const contentValue = typeof sourceValue === "object"
      ? JSON.stringify(sourceValue)
      : sourceValue;

    // Get existing content from target (if any) for comparison
    const previousContent = targetContent?.[field]
      ? (typeof targetContent[field] === "object"
          ? JSON.stringify(targetContent[field])
          : targetContent[field])
      : null;

    suggestionsToCreate.push({
      id: generatePlatformId(),
      content: contentValue,
      previous_content: previousContent,
      field_suggested_house_manual: field,
      house_manual: targetHouseManualId,
      being_processed: false,
      decision: "pending",
      from_call: false,
      from_audio: false,
      from_pdf: false,
      from_google_doc: false,
      from_listing: false,
      from_free_text_form: false,
      created_by: userId,
      created_at: now,
      updated_at: now,
    });
  }

  if (suggestionsToCreate.length === 0) {
    console.log(`[reusePrevious] No content found in source to reuse`);
    return {
      success: true,
      targetHouseManualId,
      sourceHouseManualId,
      suggestionsCreated: 0,
      fields: [],
    };
  }

  // Insert suggestions
  const { error: insertError } = await supabaseClient
    .from("zat_aisuggestions")
    .insert(suggestionsToCreate);

  if (insertError) {
    console.error(`[reusePrevious] Failed to create suggestions:`, insertError);
    throw new Error(`Failed to create suggestions: ${insertError.message}`);
  }

  const reusedFields = suggestionsToCreate.map(s => s.field_suggested_house_manual);

  console.log(`[reusePrevious] Created ${suggestionsToCreate.length} suggestions`);
  console.log(`[reusePrevious] Fields: ${reusedFields.join(", ")}`);

  return {
    success: true,
    targetHouseManualId,
    sourceHouseManualId,
    suggestionsCreated: suggestionsToCreate.length,
    fields: reusedFields,
  };
}

export default handleReusePrevious;
