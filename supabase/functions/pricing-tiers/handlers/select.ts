/**
 * Select Pricing Tier Handler
 * Split Lease - Pattern 3: Price Anchoring
 *
 * Records a user's pricing tier selection for analytics and tracking.
 * Optionally updates the associated date change request.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SupabaseSyncError } from "../../_shared/errors.ts";
import {
  SelectTierInput,
  SelectTierResponse,
  UserContext,
  TIER_CONFIGS,
} from "../lib/types.ts";
import { validateSelectInput } from "../lib/validators.ts";
import {
  calculateTierPrice,
  calculateAnchorSavings,
} from "../lib/calculations.ts";

/**
 * Handle select pricing tier
 *
 * Steps:
 * 1. Validate input
 * 2. Calculate tier price and savings
 * 3. Insert selection record into pricing_tier_selection
 * 4. Update date change request if ID provided
 * 5. Return selection confirmation
 */
export async function handleSelect(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<SelectTierResponse> {
  console.log(
    `[pricing-tiers:select] Starting selection for user: ${
      user?.email || "public"
    }`
  );

  // ================================================
  // VALIDATION
  // ================================================

  const input = validateSelectInput(payload);

  console.log(
    `[pricing-tiers:select] Validated input: tier=${input.selectedTier}, lease=${input.leaseId}`
  );

  // ================================================
  // CALCULATE TIER PRICE AND SAVINGS
  // ================================================

  const tierConfig = TIER_CONFIGS[input.selectedTier];
  const tierPriceCents = calculateTierPrice(
    input.basePriceCents,
    tierConfig.multiplier,
    input.urgencyMultiplier ?? 1.0
  );
  const anchorSavingsCents = calculateAnchorSavings(
    tierPriceCents,
    input.currentBuyoutPriceCents
  );

  console.log(
    `[pricing-tiers:select] Calculated: price=${tierPriceCents}c, savings=${anchorSavingsCents}c`
  );

  // ================================================
  // GENERATE SELECTION ID
  // ================================================

  const { data: selectionId, error: idError } = await supabase.rpc(
    "generate_unique_id"
  );
  if (idError || !selectionId) {
    console.error(
      `[pricing-tiers:select] ID generation failed:`,
      idError
    );
    throw new SupabaseSyncError("Failed to generate selection ID");
  }

  console.log(`[pricing-tiers:select] Generated selection ID: ${selectionId}`);

  // ================================================
  // INSERT SELECTION RECORD
  // ================================================

  const selectionRecord = {
    id: selectionId,
    date_change_request_id: input.dateChangeRequestId ?? null,
    user_id: input.userId,
    lease_id: input.leaseId,
    selected_tier: input.selectedTier,
    base_price_cents: input.basePriceCents,
    tier_price_cents: tierPriceCents,
    tier_multiplier: tierConfig.multiplier,
    anchor_savings_cents: anchorSavingsCents,
    current_buyout_price_cents: input.currentBuyoutPriceCents ?? null,
    urgency_multiplier: input.urgencyMultiplier ?? null,
    tiers_viewed: input.tiersViewed ?? null,
    time_to_selection_ms: input.timeToSelectionMs ?? null,
  };

  const { error: insertError } = await supabase
    .from("pricing_tier_selection")
    .insert(selectionRecord);

  if (insertError) {
    console.error(
      `[pricing-tiers:select] Insert failed:`,
      insertError
    );
    throw new SupabaseSyncError(
      `Failed to record tier selection: ${insertError.message}`
    );
  }

  console.log(`[pricing-tiers:select] Selection recorded: ${selectionId}`);

  // ================================================
  // UPDATE DATE CHANGE REQUEST (if ID provided)
  // ================================================

  if (input.dateChangeRequestId) {
    const { error: updateError } = await supabase
      .from("datechangerequest")
      .update({
        selected_tier: input.selectedTier,
        tier_price_cents: tierPriceCents,
        anchor_savings_cents: anchorSavingsCents,
      })
      .eq("id", input.dateChangeRequestId);

    if (updateError) {
      console.error(
        `[pricing-tiers:select] Date change request update failed:`,
        updateError
      );
      // Non-blocking - selection was recorded, just log the error
      console.warn(
        `[pricing-tiers:select] Continuing despite update failure`
      );
    } else {
      console.log(
        `[pricing-tiers:select] Updated date change request: ${input.dateChangeRequestId}`
      );
    }
  }

  // ================================================
  // RETURN RESPONSE
  // ================================================

  const now = new Date().toISOString();

  console.log(`[pricing-tiers:select] Complete`);

  return {
    selectionId,
    selectedTier: input.selectedTier,
    tierPriceCents,
    anchorSavingsCents,
    recordedAt: now,
  };
}
