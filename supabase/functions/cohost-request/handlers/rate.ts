/**
 * Rate Co-Host Request Handler
 * Split Lease - Supabase Edge Functions
 *
 * Submits a rating for a completed co-host session.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError, SupabaseSyncError } from "../../_shared/errors.ts";
import { validateRequired } from "../../_shared/validation.ts";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UserContext {
  id: string;
  email: string;
}

interface RateCoHostRequestInput {
  requestId: string;       // Co-host request legacy id
  Rating: number;          // 1-5 star rating
  "Rating message (optional)"?: string;  // Optional feedback message
}

interface RateCoHostRequestResponse {
  requestId: string;
  rating: number;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

/**
 * Handle rate co-host request
 *
 * Steps:
 * 1. Validate input (requestId, Rating required)
 * 2. Verify co-host request exists
 * 3. Update co-host request with rating and close status
 * 4. Return success response
 */
export async function handleRate(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<RateCoHostRequestResponse> {
  console.log(`[cohost-request:rate] Starting rate for user: ${user?.email || 'public'}`);

  // ================================================
  // VALIDATION
  // ================================================

  const input = payload as unknown as RateCoHostRequestInput;

  validateRequired(input.requestId, "requestId");
  validateRequired(input.Rating, "Rating");

  if (typeof input.Rating !== 'number' || input.Rating < 1 || input.Rating > 5) {
    throw new ValidationError("Rating must be a number between 1 and 5");
  }

  console.log(`[cohost-request:rate] Validated input for request: ${input.requestId}`);

  // ================================================
  // VERIFY REQUEST EXISTS
  // ================================================

  const { data: existingRequest, error: fetchError } = await supabase
    .from("co_hostrequest")
    .select("id, status")
    .eq("id", input.requestId)
    .single();

  if (fetchError || !existingRequest) {
    console.error(`[cohost-request:rate] Request not found:`, fetchError);
    throw new ValidationError(`Co-host request not found: ${input.requestId}`);
  }

  console.log(`[cohost-request:rate] Found request with status: ${existingRequest.status}`);

  // ================================================
  // UPDATE CO-HOST REQUEST
  // ================================================

  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    Rating: input.Rating,
    "Rating message (optional)": input["Rating message (optional)"] || null,
    status: "Request closed",
    "Modified Date": now,
  };

  const { error: updateError } = await supabase
    .from("co_hostrequest")
    .update(updateData)
    .eq("id", input.requestId);

  if (updateError) {
    console.error(`[cohost-request:rate] Update failed:`, updateError);
    throw new SupabaseSyncError(`Failed to update co-host request: ${updateError.message}`);
  }

  console.log(`[cohost-request:rate] Co-host request updated successfully`);

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[cohost-request:rate] Complete, returning response`);

  return {
    requestId: input.requestId,
    rating: input.Rating,
    updatedAt: now,
  };
}
