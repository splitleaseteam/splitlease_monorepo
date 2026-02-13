/**
 * Get Suggestions Handler
 *
 * Fetches pending AI suggestions for a house manual along with the manual's
 * current state (progress, transcript availability).
 *
 * @module house-manual/handlers/getSuggestions
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../../_shared/errors.ts";

interface GetSuggestionsPayload {
  houseManualId: string;
}

interface HandlerContext {
  userId: string;
  supabaseClient: SupabaseClient;
  payload: GetSuggestionsPayload;
}

interface AISuggestion {
  id: string;
  content: string;
  previous_content: string | null;
  field_suggested_house_manual: string;
  field_suggested_listing: string | null;
  being_processed: boolean;
  decision: "pending" | "accepted" | "ignored" | "combined";
  house_manual_id: string;
  created_at: string;
  updated_at: string;
}

interface HouseManual {
  id: string;
  manual_creation_progress_stage: string;
  full_transcript_text: string | null;
  transcript_source_type: string | null;
  is_ai_suggestion_generation_complete: boolean;
}

interface GetSuggestionsResult {
  houseManual: HouseManual | null;
  suggestions: AISuggestion[];
  pendingCount: number;
}

/**
 * Fetch pending AI suggestions for a house manual
 *
 * Returns:
 * - houseManual: Current state of the house manual (progress, transcript)
 * - suggestions: Array of non-ignored suggestions sorted by creation date
 * - pendingCount: Number of pending suggestions
 */
export async function handleGetSuggestions(
  context: HandlerContext
): Promise<GetSuggestionsResult> {
  const { supabaseClient, payload } = context;
  const { houseManualId } = payload;

  // Validate input
  if (!houseManualId || typeof houseManualId !== "string") {
    throw new ValidationError("houseManualId is required");
  }

  console.log(`[getSuggestions] Fetching suggestions for manual: ${houseManualId}`);

  // Fetch house manual with progress info
  const { data: houseManual, error: hmError } = await supabaseClient
    .from("house_manual")
    .select("id, manual_creation_progress_stage, full_transcript_text, transcript_source_type, is_ai_suggestion_generation_complete")
    .eq("id", houseManualId)
    .single();

  if (hmError) {
    console.error(`[getSuggestions] Error fetching house manual:`, hmError);
    throw new ValidationError(`House manual not found: ${houseManualId}`);
  }

  // Fetch non-ignored suggestions for this house manual
  // Ordered by creation date (oldest first for review workflow)
  const { data: suggestions, error: sugError } = await supabaseClient
    .from("zat_aisuggestions")
    .select("*")
    .eq("house_manual", houseManualId)
    .neq("decision", "ignored")
    .eq("being_processed", false)
    .order("created_at", { ascending: true });

  if (sugError) {
    console.error(`[getSuggestions] Error fetching suggestions:`, sugError);
    throw new Error(`Failed to fetch suggestions: ${sugError.message}`);
  }

  const pendingCount = (suggestions || []).filter(
    (s: AISuggestion) => s.decision === "pending"
  ).length;

  console.log(
    `[getSuggestions] Found ${suggestions?.length || 0} suggestions (${pendingCount} pending)`
  );

  return {
    houseManual,
    suggestions: suggestions || [],
    pendingCount,
  };
}

export default handleGetSuggestions;
