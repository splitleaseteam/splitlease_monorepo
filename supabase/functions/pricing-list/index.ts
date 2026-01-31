/**
 * Pricing List Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Main router for pricing list operations:
 * - create: Create/calculate pricing_list for a listing
 * - get: Get pricing_list by listing_id
 * - update: Update inputs and recalculate pricing
 * - recalculate: Force full recalculation
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import {
  ValidationError as _ValidationError,
} from "../_shared/errors.ts";

// FP Utilities
import { Result, ok, err as _err } from "../_shared/functional/result.ts";
import {
  parseRequest,
  validateAction,
  routeToHandler,
  isPublicAction as _isPublicAction,
  getSupabaseConfig,
  formatSuccessResponse,
  formatErrorResponseHttp,
  formatCorsResponse,
  CorsPreflightSignal,
} from "../_shared/functional/orchestration.ts";
import { createErrorLog, addError, setAction, ErrorLog } from "../_shared/functional/errorLog.ts";
import { reportErrorLog } from "../_shared/slack.ts";

// Handlers
import { handleCreate } from "./handlers/create.ts";
import { handleGet } from "./handlers/get.ts";
import { handleUpdate } from "./handlers/update.ts";
import { handleRecalculate } from "./handlers/recalculate.ts";

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = ["create", "get", "update", "recalculate"] as const;

// All pricing-list actions are public (called internally by listing submission)
const _PUBLIC_ACTIONS: ReadonlySet<string> = new Set(["create", "get", "update", "recalculate"]);

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, (...args: unknown[]) => unknown>> = {
  create: handleCreate,
  get: handleGet,
  update: handleUpdate,
  recalculate: handleRecalculate,
};

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

interface PricingListConfig {
  readonly supabaseUrl: string;
  readonly supabaseServiceKey: string;
}

/**
 * Get Supabase configuration
 */
const getConfigForAction = (): Result<PricingListConfig, Error> => {
  const supabaseResult = getSupabaseConfig();
  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  return ok({
    supabaseUrl: supabaseResult.value.supabaseUrl,
    supabaseServiceKey: supabaseResult.value.supabaseServiceKey,
  });
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log("[pricing-list] Edge Function started (FP mode)");

Deno.serve(async (req: Request) => {
  // Initialize immutable error log with correlation ID
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog('pricing-list', 'unknown', correlationId);

  try {
    console.log(`[pricing-list] ========== REQUEST ==========`);
    console.log(`[pricing-list] Method: ${req.method}`);

    // ─────────────────────────────────────────────────────────
    // Step 1: Parse request (side effect boundary for req.json())
    // ─────────────────────────────────────────────────────────

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      // Handle CORS preflight (not an error, just control flow)
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    const { action, payload } = parseResult.value;

    // Update error log with action (immutable transformation)
    errorLog = setAction(errorLog, action);
    console.log(`[pricing-list] Action: ${action}`);

    // ─────────────────────────────────────────────────────────
    // Step 2: Validate action (pure)
    // ─────────────────────────────────────────────────────────

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    // ─────────────────────────────────────────────────────────
    // Step 3: Get configuration
    // ─────────────────────────────────────────────────────────

    const configResult = getConfigForAction();
    if (!configResult.ok) {
      throw configResult.error;
    }

    // ─────────────────────────────────────────────────────────
    // Step 4: Route to handler (pure lookup + execution)
    // ─────────────────────────────────────────────────────────

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    // Execute handler - the only remaining side effect
    const handler = handlerResult.value;
    const result = await handler(payload);

    console.log(`[pricing-list] ========== SUCCESS ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error(`[pricing-list] ========== ERROR ==========`);
    console.error(`[pricing-list]`, error);

    // Add error to log (immutable)
    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');

    // Report to Slack (side effect at boundary)
    reportErrorLog(errorLog);

    return formatErrorResponseHttp(error as Error);
  }
});
