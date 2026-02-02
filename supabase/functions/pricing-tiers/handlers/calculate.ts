/**
 * Calculate Pricing Tiers Handler
 * Split Lease - Pattern 3: Price Anchoring
 *
 * Calculates pricing tiers from a base price.
 * Returns budget (0.9x), recommended (1.0x), and premium (1.15x) options.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CalculateTiersInput,
  CalculateTiersResponse,
  UserContext,
} from "../lib/types.ts";
import { validateCalculateInput } from "../lib/validators.ts";
import { calculateAllTiers } from "../lib/calculations.ts";

/**
 * Handle calculate pricing tiers
 *
 * Steps:
 * 1. Validate input
 * 2. Calculate all tiers using pure functions
 * 3. Return tiers with anchor savings
 */
export async function handleCalculate(
  payload: Record<string, unknown>,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<CalculateTiersResponse> {
  console.log(
    `[pricing-tiers:calculate] Starting calculation for user: ${
      user?.email || "public"
    }`
  );

  // ================================================
  // VALIDATION
  // ================================================

  const input = validateCalculateInput(payload);

  console.log(
    `[pricing-tiers:calculate] Validated input: basePriceCents=${input.basePriceCents}, buyout=${input.currentBuyoutPriceCents}, urgency=${input.urgencyMultiplier}`
  );

  // ================================================
  // CALCULATE TIERS (Pure function)
  // ================================================

  const result = calculateAllTiers(input);

  console.log(
    `[pricing-tiers:calculate] Calculated ${result.tiers.length} tiers`
  );
  console.log(
    `[pricing-tiers:calculate] Budget: ${result.tiers[0].priceCents}c, Recommended: ${result.tiers[1].priceCents}c, Premium: ${result.tiers[2].priceCents}c`
  );

  // ================================================
  // RETURN RESPONSE
  // ================================================

  console.log(`[pricing-tiers:calculate] Complete`);

  return result;
}
