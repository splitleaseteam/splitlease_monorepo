/**
 * Pure calculation functions for Pricing Tiers
 * Split Lease - Pattern 3: Price Anchoring
 *
 * NO FALLBACK PRINCIPLE: All calculations are deterministic
 * FP ARCHITECTURE: Pure functions with no side effects
 */

import {
  PricingTier,
  PricingTierId,
  CalculateTiersInput,
  CalculateTiersResponse,
  PricingTierConfig,
} from "./types.ts";

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const TIER_CONFIGS: ReadonlyArray<PricingTierConfig> = [
  {
    tierId: "budget",
    tierName: "Budget",
    multiplier: 0.9,
    badgeText: null,
    description: "Basic offer - may take longer to accept",
  },
  {
    tierId: "recommended",
    tierName: "Recommended",
    multiplier: 1.0,
    badgeText: "Most Popular",
    description: "Best value - preferred by 73% of users",
  },
  {
    tierId: "premium",
    tierName: "Premium",
    multiplier: 1.15,
    badgeText: "Fastest",
    description: "Priority handling - highest acceptance rate",
  },
];

// ─────────────────────────────────────────────────────────────
// Pure Calculation Functions
// ─────────────────────────────────────────────────────────────

/**
 * Calculate price for a single tier
 * Pure function: same inputs always produce same output
 */
function calculateTierPrice(
  basePriceCents: number,
  multiplier: number,
  urgencyMultiplier: number = 1.0
): number {
  return Math.round(basePriceCents * multiplier * urgencyMultiplier);
}

/**
 * Calculate savings against anchor price
 * Pure function: same inputs always produce same output
 */
function calculateSavings(
  tierPriceCents: number,
  anchorPriceCents: number
): { savingsCents: number; savingsPercentage: number } {
  const savingsCents = anchorPriceCents - tierPriceCents;
  const savingsPercentage =
    anchorPriceCents > 0 ? (savingsCents / anchorPriceCents) * 100 : 0;

  return {
    savingsCents: Math.max(0, savingsCents),
    savingsPercentage: Math.max(0, Math.round(savingsPercentage * 100) / 100),
  };
}

/**
 * Build a single pricing tier
 * Pure function: same inputs always produce same output
 */
function buildTier(
  config: PricingTierConfig,
  basePriceCents: number,
  anchorPriceCents: number,
  urgencyMultiplier: number
): PricingTier {
  const priceCents = calculateTierPrice(
    basePriceCents,
    config.multiplier,
    urgencyMultiplier
  );

  const { savingsCents, savingsPercentage } = calculateSavings(
    priceCents,
    anchorPriceCents
  );

  return {
    tierId: config.tierId,
    tierName: config.tierName,
    priceCents,
    multiplier: config.multiplier,
    savingsCents,
    savingsPercentage,
    badgeText: config.badgeText,
    description: config.description,
  };
}

/**
 * Determine anchor price
 * Pure function: same inputs always produce same output
 */
function determineAnchorPrice(
  basePriceCents: number,
  currentBuyoutPriceCents?: number
): number {
  // If buyout price provided and higher than base, use it as anchor
  if (
    currentBuyoutPriceCents !== undefined &&
    currentBuyoutPriceCents > basePriceCents
  ) {
    return currentBuyoutPriceCents;
  }

  // Otherwise, use base price as anchor
  return basePriceCents;
}

/**
 * Determine recommended tier based on urgency
 * Pure function: same inputs always produce same output
 */
function determineRecommendedTier(urgencyMultiplier: number): PricingTierId {
  if (urgencyMultiplier >= 1.5) {
    return "premium"; // High urgency → recommend premium
  }

  return "recommended"; // Default recommendation
}

/**
 * Calculate all pricing tiers
 * Pure function: same inputs always produce same output
 */
export function calculateAllTiers(
  input: CalculateTiersInput
): CalculateTiersResponse {
  const urgencyMultiplier = input.urgencyMultiplier ?? 1.0;
  const anchorPriceCents = determineAnchorPrice(
    input.basePriceCents,
    input.currentBuyoutPriceCents
  );

  const tiers = TIER_CONFIGS.map((config) =>
    buildTier(
      config,
      input.basePriceCents,
      anchorPriceCents,
      urgencyMultiplier
    )
  );

  const recommendedTierId = determineRecommendedTier(urgencyMultiplier);

  return {
    tiers,
    anchorPriceCents,
    recommendedTierId,
  };
}
