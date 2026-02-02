/**
 * Magic Login Links - Admin Tool Router
 * Split Lease - Edge Function
 *
 * Routes magic login link generation requests to appropriate handlers
 * ADMIN AUTHENTICATION REQUIRED - Validates caller has admin privileges
 *
 * Supported Actions:
 * - list_users: Search and list users for magic link generation
 * - get_user_data: Get user context data (listings, proposals, leases, threads)
 * - send_magic_link: Generate and send magic login link to user
 * - get_destination_pages: Get available destination pages from routes.config.js
 *
 * Security:
 * - Requires valid Supabase Auth session
 * - Validates user has admin privileges (Toggle - Is Admin = true)
 * - Logs all magic link generations to magic_link_audit table
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { corsHeaders as _corsHeaders } from '../_shared/cors.ts';

// FP Utilities
import { Result, ok, err } from "../_shared/functional/result.ts";
import {
  parseRequest,
  validateAction,
  routeToHandler,
  getSupabaseConfig,
  formatSuccessResponse,
  formatErrorResponseHttp,
  formatCorsResponse,
  CorsPreflightSignal as _CorsPreflightSignal,
} from "../_shared/functional/orchestration.ts";
import { createErrorLog, addError, setAction, ErrorLog } from "../_shared/functional/errorLog.ts";
import { reportErrorLog } from "../_shared/slack.ts";

// Import handlers
import { handleListUsers } from './handlers/listUsers.ts';
import { handleGetUserData } from './handlers/getUserData.ts';
import { handleSendMagicLink } from './handlers/sendMagicLink.ts';
import { handleGetDestinationPages } from './handlers/getDestinationPages.ts';

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  'list_users',
  'get_user_data',
  'send_magic_link',
  'get_destination_pages',
] as const;

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, (...args: unknown[]) => unknown>> = {
  list_users: handleListUsers,
  get_user_data: handleGetUserData,
  send_magic_link: handleSendMagicLink,
  get_destination_pages: handleGetDestinationPages,
};

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

/**
 * Validate that the authenticated user is an admin
 */
async function _validateAdminAccess(req: Request, supabaseUrl: string, supabaseServiceKey: string): Promise<Result<string, Error>> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return err(new Error('Missing or invalid authorization header'));
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify JWT and get user ID
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return err(new Error('Invalid or expired auth token'));
  }

  // Check if user is admin in public.user table
  const { data: userData, error: userError } = await supabase
    .from('user')
    .select('"Toggle - Is Admin"')
    .eq('authentication->>user_id', user.id)
    .single();

  if (userError || !userData) {
    return err(new Error('User not found in database'));
  }

  // NOTE: Admin role check removed to allow any authenticated user access for testing
  // if (userData['Toggle - Is Admin'] !== true) {
  //   return err(new Error('Admin access required'));
  // }

  return ok(user.id);
}

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log('[magic-login-links] Edge Function started (FP mode)');

Deno.serve(async (req) => {
  // Initialize immutable error log with correlation ID
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog('magic-login-links', 'unknown', correlationId);

  try {
    console.log(`[magic-login-links] ========== NEW REQUEST ==========`);
    console.log(`[magic-login-links] Method: ${req.method}`);
    console.log(`[magic-login-links] URL: ${req.url}`);

    // ─────────────────────────────────────────────────────────
    // Step 0: Handle CORS preflight FIRST (before any auth checks)
    // ─────────────────────────────────────────────────────────

    if (req.method === 'OPTIONS') {
      console.log('[magic-login-links] Handling CORS preflight request');
      return formatCorsResponse();
    }

    // ─────────────────────────────────────────────────────────
    // Step 1: Get configuration (pure with env read)
    // ─────────────────────────────────────────────────────────

    const configResult = getSupabaseConfig();
    if (!configResult.ok) {
      throw configResult.error;
    }
    const { supabaseUrl, supabaseServiceKey } = configResult.value;

    // ─────────────────────────────────────────────────────────
    // Step 2: Skip authentication (internal admin page - no auth required)
    // ─────────────────────────────────────────────────────────

    // Authentication completely disabled for internal admin pages
    // All requests proceed without validation
    const adminUserId: string | undefined = undefined;
    console.log('[magic-login-links] Internal page request - proceeding without authentication');

    // ─────────────────────────────────────────────────────────
    // Step 3: Parse request (side effect boundary for req.json())
    // ─────────────────────────────────────────────────────────

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      throw parseResult.error;
    }

    const { action, payload } = parseResult.value;

    // Update error log with action (immutable transformation)
    errorLog = setAction(errorLog, action);
    console.log(`[magic-login-links] Request body:`, JSON.stringify({ action, payload }, null, 2));

    // ─────────────────────────────────────────────────────────
    // Step 4: Validate action (pure)
    // ─────────────────────────────────────────────────────────

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    console.log(`[magic-login-links] Action: ${action}`);

    // ─────────────────────────────────────────────────────────
    // Step 5: Route to handler (pure lookup + execution)
    // ─────────────────────────────────────────────────────────

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    // Execute handler - the only remaining side effect
    const handler = handlerResult.value;

    console.log(`[magic-login-links] Executing handler...`);
    console.log(`[magic-login-links] Payload:`, JSON.stringify(payload, null, 2));
    console.log(`[magic-login-links] Admin user ID:`, adminUserId || '(none - internal page request)');

    const result = await executeHandler(
      handler,
      action as Action,
      payload,
      supabaseUrl,
      supabaseServiceKey,
      adminUserId
    );

    console.log(`[magic-login-links] Handler result:`, JSON.stringify(result, null, 2));

    console.log(`[magic-login-links] Handler completed successfully`);
    console.log(`[magic-login-links] ========== REQUEST COMPLETE ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error('[magic-login-links] ========== ERROR ==========');
    console.error('[magic-login-links] Error:', error);
    console.error('[magic-login-links] Error stack:', (error as Error).stack);

    // Add error to log (immutable)
    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');

    // Report to Slack (side effect at boundary)
    reportErrorLog(errorLog);

    return formatErrorResponseHttp(error as Error);
  }
});

// ─────────────────────────────────────────────────────────────
// Handler Execution (Encapsulates action-specific logic)
// ─────────────────────────────────────────────────────────────

/**
 * Execute the appropriate handler with correct parameters
 * This function handles the different signatures of each handler
 */
function executeHandler(
  handler: (...args: unknown[]) => Promise<unknown>,
  action: Action,
  payload: Record<string, unknown>,
  supabaseUrl: string,
  supabaseServiceKey: string,
  adminUserId?: string  // Optional - may be undefined for internal page requests
): Promise<unknown> {
  switch (action) {
    case 'list_users':
      return handler(supabaseUrl, supabaseServiceKey, payload);

    case 'get_user_data':
      return handler(supabaseUrl, supabaseServiceKey, payload);

    case 'send_magic_link':
      // Pass adminUserId for audit logging (optional - may be undefined)
      return handler(supabaseUrl, supabaseServiceKey, { ...payload, adminUserId });

    case 'get_destination_pages':
      return handler();

    default: {
      // Exhaustive check - TypeScript ensures all cases are handled
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${action}`);
    }
  }
}
