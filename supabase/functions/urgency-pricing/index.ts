/**
 * Urgency Pricing Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Main router for urgency pricing operations:
 * - calculate: Calculate urgency pricing for a single request
 * - batch: Batch calculate multiple requests in parallel
 * - calendar: Get pricing for multiple dates (calendar view)
 * - events: Manage event multipliers (add/remove/list)
 * - stats: Get cache and system statistics
 * - health: Health check endpoint
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Fail-fast error propagation
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  ValidationError,
  AuthenticationError,
} from "shared/errors.ts";

// FP Utilities
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
} from "shared/functional/orchestration.ts";

import { handleCalculate } from "./handlers/calculate.ts";
import { handleBatch } from "./handlers/batch.ts";
import { handleCalendar } from "./handlers/calendar.ts";
import { handleEvents } from "./handlers/events.ts";
import { handleStats } from "./handlers/stats.ts";
import { handleHealth } from "./handlers/health.ts";

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  "calculate",
  "batch",
  "calendar",
  "events",
  "stats",
  "health",
] as const;

// PUBLIC_ACTIONS: All pricing calculations are public
// Only 'events' (add_event, remove_event) requires auth
const PUBLIC_ACTIONS: ReadonlySet<string> = new Set([
  "calculate",
  "batch",
  "calendar",
  "stats",
  "health",
]);

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, Function>> = {
  calculate: handleCalculate,
  batch: handleBatch,
  calendar: handleCalendar,
  events: handleEvents,
  stats: handleStats,
  health: handleHealth,
};

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

/**
 * Authenticate user from request headers
 * Returns Result with user or error
 */
const authenticateUser = async (
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string,
  requireAuth: boolean
): Promise<AuthenticatedUser | null> => {
  if (!requireAuth) {
    return null;
  }

  const tokenResult = extractAuthToken(headers);
  if (!tokenResult.ok) {
    throw tokenResult.error;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: tokenResult.value } },
  });

  const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

  if (authError || !authUser) {
    throw new AuthenticationError("Invalid or expired token");
  }

  return { id: authUser.id, email: authUser.email ?? "" };
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log("[urgency-pricing] Edge Function started (FP mode)");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[urgency-pricing] ========== REQUEST ==========`);
    console.log(`[urgency-pricing] Method: ${req.method}`);

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    const { action, payload, headers } = parseResult.value;
    console.log(`[urgency-pricing] Action: ${action}`);
    console.log(`[urgency-pricing] Payload:`, JSON.stringify(payload, null, 2));

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    const configResult = getSupabaseConfig();
    if (!configResult.ok) {
      throw configResult.error;
    }
    const config = configResult.value;

    const requireAuth = !isPublicAction(PUBLIC_ACTIONS, action);
    const user = await authenticateUser(
      headers,
      config.supabaseUrl,
      config.supabaseAnonKey,
      requireAuth
    );

    if (user) {
      console.log(`[urgency-pricing] Authenticated: ${user.email}`);
    } else {
      console.log(`[urgency-pricing] Public action - skipping authentication`);
    }

    const serviceClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    const handler = handlerResult.value;
    const result = await handler(payload, user, serviceClient);

    console.log(`[urgency-pricing] ========== SUCCESS ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error(`[urgency-pricing] ========== ERROR ==========`);
    console.error(`[urgency-pricing] Error name:`, (error as Error).name);
    console.error(`[urgency-pricing] Error message:`, (error as Error).message);
    console.error(`[urgency-pricing] Full error:`, error);

    return formatErrorResponseHttp(error as Error);
  }
});
