/**
 * Types for Pricing Tiers Edge Function
 * Split Lease - Pattern 3: Price Anchoring
 */

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

export type PricingTierId = "budget" | "recommended" | "premium";

export interface UserContext {
  id: string;
  email: string;
}

// ─────────────────────────────────────────────────────────────
// Calculate Action
// ─────────────────────────────────────────────────────────────

export interface CalculateTiersInput {
  basePriceCents: number;
  currentBuyoutPriceCents?: number;
  urgencyMultiplier?: number;
}

export interface PricingTier {
  tierId: PricingTierId;
  tierName: string;
  priceCents: number;
  multiplier: number;
  savingsCents: number;
  savingsPercentage: number;
  badgeText: string | null;
  description: string;
}

export interface CalculateTiersResponse {
  tiers: PricingTier[];
  anchorPriceCents: number;
  recommendedTierId: PricingTierId;
}

// ─────────────────────────────────────────────────────────────
// Select Action
// ─────────────────────────────────────────────────────────────

export interface SelectTierInput {
  tierId: PricingTierId;
  priceCents: number;
  basePriceCents: number;
  bookingId?: string;
  sessionId: string;
}

export interface SelectTierResponse {
  success: boolean;
  tierId: PricingTierId;
  recordedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

export interface PricingTierConfig {
  tierId: PricingTierId;
  tierName: string;
  multiplier: number;
  badgeText: string | null;
  description: string;
}
