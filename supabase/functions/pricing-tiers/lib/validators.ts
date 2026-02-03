/**
 * Validators for Pricing Tiers Edge Function
 * Split Lease - Pattern 3: Price Anchoring
 *
 * NO FALLBACK PRINCIPLE: All validation errors throw immediately
 */

import { ValidationError } from "../../_shared/errors.ts";
import {
  CalculateTiersInput,
  SelectTierInput,
  PricingTierId,
} from "./types.ts";

// ─────────────────────────────────────────────────────────────
// Calculate Input Validation
// ─────────────────────────────────────────────────────────────

export function validateCalculateInput(
  payload: Record<string, unknown>
): CalculateTiersInput {
  const { basePriceCents, currentBuyoutPriceCents, urgencyMultiplier } =
    payload;

  // Validate basePriceCents (required)
  if (typeof basePriceCents !== "number") {
    throw new ValidationError(
      "basePriceCents must be a number",
      "INVALID_BASE_PRICE"
    );
  }

  if (basePriceCents <= 0) {
    throw new ValidationError(
      "basePriceCents must be positive",
      "INVALID_BASE_PRICE"
    );
  }

  // Validate currentBuyoutPriceCents (optional)
  if (
    currentBuyoutPriceCents !== undefined &&
    currentBuyoutPriceCents !== null
  ) {
    if (typeof currentBuyoutPriceCents !== "number") {
      throw new ValidationError(
        "currentBuyoutPriceCents must be a number",
        "INVALID_BUYOUT_PRICE"
      );
    }

    if (currentBuyoutPriceCents < 0) {
      throw new ValidationError(
        "currentBuyoutPriceCents must be non-negative",
        "INVALID_BUYOUT_PRICE"
      );
    }
  }

  // Validate urgencyMultiplier (optional)
  if (urgencyMultiplier !== undefined && urgencyMultiplier !== null) {
    if (typeof urgencyMultiplier !== "number") {
      throw new ValidationError(
        "urgencyMultiplier must be a number",
        "INVALID_URGENCY"
      );
    }

    if (urgencyMultiplier < 1.0 || urgencyMultiplier > 2.0) {
      throw new ValidationError(
        "urgencyMultiplier must be between 1.0 and 2.0",
        "INVALID_URGENCY"
      );
    }
  }

  return {
    basePriceCents,
    currentBuyoutPriceCents:
      currentBuyoutPriceCents !== undefined
        ? currentBuyoutPriceCents
        : undefined,
    urgencyMultiplier:
      urgencyMultiplier !== undefined ? urgencyMultiplier : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Select Input Validation
// ─────────────────────────────────────────────────────────────

const VALID_TIER_IDS: ReadonlySet<string> = new Set([
  "budget",
  "recommended",
  "premium",
]);

export function validateSelectInput(
  payload: Record<string, unknown>
): SelectTierInput {
  const { tierId, priceCents, basePriceCents, bookingId, sessionId } = payload;

  // Validate tierId (required)
  if (typeof tierId !== "string") {
    throw new ValidationError("tierId must be a string", "INVALID_TIER_ID");
  }

  if (!VALID_TIER_IDS.has(tierId)) {
    throw new ValidationError(
      `tierId must be one of: ${Array.from(VALID_TIER_IDS).join(", ")}`,
      "INVALID_TIER_ID"
    );
  }

  // Validate priceCents (required)
  if (typeof priceCents !== "number") {
    throw new ValidationError("priceCents must be a number", "INVALID_PRICE");
  }

  if (priceCents <= 0) {
    throw new ValidationError("priceCents must be positive", "INVALID_PRICE");
  }

  // Validate basePriceCents (required)
  if (typeof basePriceCents !== "number") {
    throw new ValidationError(
      "basePriceCents must be a number",
      "INVALID_BASE_PRICE"
    );
  }

  if (basePriceCents <= 0) {
    throw new ValidationError(
      "basePriceCents must be positive",
      "INVALID_BASE_PRICE"
    );
  }

  // Validate sessionId (required)
  if (typeof sessionId !== "string" || sessionId.trim() === "") {
    throw new ValidationError(
      "sessionId is required and must be non-empty",
      "INVALID_SESSION_ID"
    );
  }

  // Validate bookingId (optional)
  if (bookingId !== undefined && bookingId !== null) {
    if (typeof bookingId !== "string") {
      throw new ValidationError(
        "bookingId must be a string",
        "INVALID_BOOKING_ID"
      );
    }
  }

  return {
    tierId: tierId as PricingTierId,
    priceCents,
    basePriceCents,
    bookingId: bookingId as string | undefined,
    sessionId: sessionId as string,
  };
}
