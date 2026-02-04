/**
 * Calendar Automation Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Main router for calendar automation operations:
 * - process_virtual_meeting: Process virtual meeting and create Google Calendar events with Meet links
 * - health: Health check endpoint
 * - test_config: Configuration verification
 *
 * Migrated from Python/Flask calendar automation service.
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import 'jsr:@supabase/functions-js@2/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  ValidationError as _ValidationError,
  AuthenticationError,
} from '../_shared/errors.ts';

// FP Utilities
import { Result, ok, err } from '../_shared/functional/result.ts';
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
} from '../_shared/functional/orchestration.ts';
import { createErrorLog, addError, setUserId, setAction, ErrorLog } from '../_shared/functional/errorLog.ts';
import { reportErrorLog } from '../_shared/slack.ts';

import { handleProcessVirtualMeeting } from './handlers/processVirtualMeeting.ts';
import { handleHealth } from './handlers/health.ts';
import { handleTestConfig } from './handlers/testConfig.ts';

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  'process_virtual_meeting',
  'health',
  'test_config',
] as const;

// All actions are public (no authentication required)
const PUBLIC_ACTIONS: ReadonlySet<string> = new Set([
  'process_virtual_meeting',
  'health',
  'test_config',
]);

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, (...args: unknown[]) => unknown>> = {
  process_virtual_meeting: handleProcessVirtualMeeting,
  health: handleHealth,
  test_config: handleTestConfig,
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
): Promise<Result<AuthenticatedUser | null, AuthenticationError>> => {
  if (!requireAuth) {
    return ok(null);
  }

  const tokenResult = extractAuthToken(headers);
  if (!tokenResult.ok) {
    return tokenResult;
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: tokenResult.value } },
  });

  const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();

  if (authError || !authUser) {
    return err(new AuthenticationError('Invalid or expired token'));
  }

  return ok({ id: authUser.id, email: authUser.email ?? '' });
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log('[calendar-automation] Edge Function started (FP mode)');

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog('calendar-automation', 'unknown', correlationId);

  try {
    console.log(`[calendar-automation] ========== REQUEST ==========`);
    console.log(`[calendar-automation] Method: ${req.method}`);

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    const { action, payload, headers } = parseResult.value;
    errorLog = setAction(errorLog, action);
    console.log(`[calendar-automation] Action: ${action}`);
    console.log(`[calendar-automation] Payload:`, JSON.stringify(payload, null, 2));

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
      console.log(`[calendar-automation] Authenticated: ${user.email}`);
    } else {
      console.log(`[calendar-automation] Public action - skipping authentication`);
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

    console.log(`[calendar-automation] ========== SUCCESS ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error(`[calendar-automation] ========== ERROR ==========`);
    console.error(`[calendar-automation] Error name:`, (error as Error).name);
    console.error(`[calendar-automation] Error message:`, (error as Error).message);
    console.error(`[calendar-automation] Full error:`, error);

    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');
    reportErrorLog(errorLog);

    return formatErrorResponseHttp(error as Error);
  }
});
