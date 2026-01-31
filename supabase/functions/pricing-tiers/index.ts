/**
 * Pricing Tiers Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Pattern 3: Price Anchoring - Dynamic pricing tier generation
 *
 * Main router for pricing tier operations:
 * - calculate: Calculate pricing tiers from base price
 * - select: Record user's tier selection
 * - get_history: Get user's tier selection history
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../_shared/errors.ts";

// FP Utilities
import { Result, ok, err } from "../_shared/functional/result.ts";
import {
  parseRequest,
  validateAction,
  routeToHandler,
  isPublicAction,
  getSupabaseConfig,
  formatSuccessResponse,
  formatErrorResponseHttp,
  formatCorsResponse,
  CorsPreflightSignal,
  AuthenticatedUser,
  extractAuthToken,
} from "../_shared/functional/orchestration.ts";
import {
  createErrorLog,
  addError,
  setAction,
  setUserId,
  ErrorLog,
} from "../_shared/functional/errorLog.ts";
import { reportErrorLog } from "../_shared/slack.ts";

// Types
import {
  PricingTierId,
  CalculateTiersInput,
  CalculateTiersResponse,
  SelectTierInput,
  SelectTierResponse,
  PricingTierConfig,
  UserContext,
} from "./lib/types.ts";

// Handlers
import { handleCalculate } from "./handlers/calculate.ts";
import { handleSelect } from "./handlers/select.ts";

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = ["calculate", "select"] as const;

// All pricing-tiers actions are public (user may not be authenticated yet)
const PUBLIC_ACTIONS: ReadonlySet<string> = new Set(["calculate", "select"]);

type Action = (typeof ALLOWED_ACTIONS)[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, Function>> = {
  calculate: handleCalculate,
  select: handleSelect,
};

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

/**
 * Authenticate user from request headers (optional for public actions)
 * Returns Result with user or null for public access
 */
const authenticateUser = async (
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string,
  requireAuth: boolean
): Promise<Result<AuthenticatedUser | null, Error>> => {
  if (!requireAuth) {
    return ok(null);
  }

  const tokenResult = extractAuthToken(headers);
  if (!tokenResult.ok) {
    return ok(null); // Public action, no auth required
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: tokenResult.value } },
  });

  const {
    data: { user: authUser },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !authUser) {
    return ok(null); // Public action, no auth required
  }

  return ok({ id: authUser.id, email: authUser.email ?? "" });
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log("[pricing-tiers] Edge Function started (FP mode)");

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog(
    "pricing-tiers",
    "unknown",
    correlationId
  );

  try {
    console.log(`[pricing-tiers] ========== REQUEST ==========`);
    console.log(`[pricing-tiers] Method: ${req.method}`);

    // ─────────────────────────────────────────────────────────
    // Step 1: Parse request
    // ─────────────────────────────────────────────────────────

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    const { action, payload, headers } = parseResult.value;
    errorLog = setAction(errorLog, action);
    console.log(`[pricing-tiers] Action: ${action}`);
    console.log(
      `[pricing-tiers] Payload:`,
      JSON.stringify(payload, null, 2)
    );

    // ─────────────────────────────────────────────────────────
    // Step 2: Validate action
    // ─────────────────────────────────────────────────────────

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    // ─────────────────────────────────────────────────────────
    // Step 3: Get configuration
    // ─────────────────────────────────────────────────────────

    const configResult = getSupabaseConfig();
    if (!configResult.ok) {
      throw configResult.error;
    }
    const config = configResult.value;

    // ─────────────────────────────────────────────────────────
    // Step 4: Authenticate (optional for public actions)
    // ─────────────────────────────────────────────────────────

    const requireAuth = !isPublicAction(PUBLIC_ACTIONS, action);
    const authResult = await authenticateUser(
      headers,
      config.supabaseUrl,
      config.supabaseAnonKey,
      requireAuth
    );

    if (!authResult.ok) {
      throw authResult.error;
    }

    const user = authResult.value;

    if (user) {
      errorLog = setUserId(errorLog, user.id);
      console.log(`[pricing-tiers] Authenticated: ${user.email}`);
    } else {
      console.log(`[pricing-tiers] Public action - no authentication`);
    }

    // ─────────────────────────────────────────────────────────
    // Step 5: Create service client for database operations
    // ─────────────────────────────────────────────────────────

    const serviceClient = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // ─────────────────────────────────────────────────────────
    // Step 6: Route to handler
    // ─────────────────────────────────────────────────────────

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    const handler = handlerResult.value;
    const result = await handler(payload, user, serviceClient);

    console.log(`[pricing-tiers] ========== SUCCESS ==========`);

    return formatSuccessResponse(result);
  } catch (error) {
    console.error(`[pricing-tiers] ========== ERROR ==========`);
    console.error(`[pricing-tiers] Error name:`, (error as Error).name);
    console.error(`[pricing-tiers] Error message:`, (error as Error).message);
    console.error(`[pricing-tiers] Full error:`, error);

    errorLog = addError(
      errorLog,
      error as Error,
      "Fatal error in main handler"
    );
    reportErrorLog(errorLog);

    return formatErrorResponseHttp(error as Error);
  }
});
