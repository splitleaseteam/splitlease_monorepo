/**
 * Handler: Attach Narration
 * Attaches a completed narration to a visit
 */

import { HandlerContext } from "../index.ts";
import { ValidationError } from "../../_shared/errors.ts";

export async function handleAttachNarration(context: HandlerContext) {
  const { supabaseClient, payload } = context;
  const { narrationId, visitId } = payload;

  if (!narrationId) {
    throw new ValidationError("narrationId is required");
  }
  if (!visitId) {
    throw new ValidationError("visitId is required");
  }

  console.log(`[ai-tools:attach_narration] Attaching narration ${narrationId} to visit ${visitId}`);

  // Verify narration exists and has audio
  const { data: narration, error: narrationError } = await supabaseClient
    .from("narration")
    .select("*")
    .eq("id", narrationId)
    .single();

  if (narrationError || !narration) {
    throw new ValidationError("Narration not found");
  }

  if (!narration.Narration_Audio) {
    throw new ValidationError("Narration has no audio URL");
  }

  // Verify visit exists
  const { data: visit, error: visitError } = await supabaseClient
    .from("visit")
    .select("id")
    .eq("id", visitId)
    .single();

  if (visitError || !visit) {
    throw new ValidationError("Visit not found");
  }

  // Update narration to link to visit
  const { error: updateError } = await supabaseClient
    .from("narration")
    .update({
      Visit: visitId,
    })
    .eq("id", narrationId);

  if (updateError) {
    console.error("[ai-tools:attach_narration] Failed to attach narration:", updateError);
    throw new Error("Failed to attach narration to visit");
  }

  console.log(`[ai-tools:attach_narration] Successfully attached narration to visit`);

  return {
    success: true,
    narrationId,
    visitId,
    audioUrl: narration.Narration_Audio,
  };
}
