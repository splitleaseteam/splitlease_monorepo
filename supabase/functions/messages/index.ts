/**
 * Messages Edge Function - Main Router
 * Split Lease - Edge Function
 *
 * Routes client requests to appropriate messaging handlers
 *
 * Supported Actions:
 * - send_message: Send a message in a thread (requires auth)
 * - get_messages: Get messages for a specific thread (requires auth)
 * - get_threads: Get all threads for authenticated user (requires auth)
 * - send_guest_inquiry: Contact host without auth (name/email required)
 * - create_proposal_thread: Create thread for proposal (internal service call)
 * - send_splitbot_message: Send SplitBot automated message (internal service call)
 *
 * Admin Actions (require auth + admin role):
 * - admin_get_all_threads: Fetch ALL threads across platform
 * - admin_delete_thread: Soft-delete a thread and its messages
 * - admin_send_reminder: Send reminder email/SMS to participants
 *
 * NOTE: get_threads uses service role to bypass RLS (supports legacy auth)
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures (no let reassignment in orchestration)
 * - Side effects isolated to boundaries (entry/exit of handler)
 * - Result type for error propagation (exceptions only at outer boundary)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Shared Supabase client factory (Phase 1)
import {
  createServiceClient,
  authenticateRequest,
  type AuthenticatedUser,
} from '../_shared/supabaseClient.ts';

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
} from "../_shared/functional/orchestration.ts";
import { createErrorLog, addError, setUserId, setAction, ErrorLog } from "../_shared/functional/errorLog.ts";
import { reportErrorLog } from "../_shared/slack.ts";
import { getStatusCodeFromError } from '../_shared/errors.ts';

// Import handlers
import { handleSendMessage } from './handlers/sendMessage.ts';
import { handleGetMessages } from './handlers/getMessages.ts';
import { handleGetThreads } from './handlers/getThreads.ts';
import { handleSendGuestInquiry } from './handlers/sendGuestInquiry.ts';
import { handleCreateProposalThread } from './handlers/createProposalThread.ts';
import { handleSendSplitBotMessage } from './handlers/sendSplitBotMessage.ts';

// Admin handlers
import { handleAdminGetAllThreads } from './handlers/adminGetAllThreads.ts';
import { handleAdminDeleteThread } from './handlers/adminDeleteThread.ts';
import { handleAdminSendReminder } from './handlers/adminSendReminder.ts';

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  'send_message',
  'get_messages',
  'get_threads',
  'send_guest_inquiry',
  'create_proposal_thread',
  'send_splitbot_message',
  // Admin actions
  'admin_get_all_threads',
  'admin_delete_thread',
  'admin_send_reminder',
] as const;

// Actions that don't require authentication
// - send_guest_inquiry: Public form submission
// - create_proposal_thread: Internal service-to-service call
// - send_splitbot_message: Internal service call (SplitBot automation)
// - admin_* actions: Internal admin pages (no auth gating)
const PUBLIC_ACTIONS: ReadonlySet<string> = new Set([
  'send_guest_inquiry',
  'create_proposal_thread',
  'send_splitbot_message',
  'admin_get_all_threads',
  'admin_delete_thread',
  'admin_send_reminder',
]);

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record) - replaces switch statement
const handlers: Readonly<Record<Action, (...args: unknown[]) => unknown>> = {
  send_message: handleSendMessage,
  get_messages: handleGetMessages,
  get_threads: handleGetThreads,
  send_guest_inquiry: handleSendGuestInquiry,
  create_proposal_thread: handleCreateProposalThread,
  send_splitbot_message: handleSendSplitBotMessage,
  // Admin handlers
  admin_get_all_threads: handleAdminGetAllThreads,
  admin_delete_thread: handleAdminDeleteThread,
  admin_send_reminder: handleAdminSendReminder,
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log('[messages] Edge Function started (FP mode)');

Deno.serve(async (req) => {
  // Initialize immutable error log with correlation ID
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog('messages', 'unknown', correlationId);

  try {
    console.log(`[messages] ========== NEW REQUEST ==========`);
    console.log(`[messages] Method: ${req.method}`);
    console.log(`[messages] URL: ${req.url}`);

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

    const { action, payload, headers } = parseResult.value;

    // Update error log with action (immutable transformation)
    errorLog = setAction(errorLog, action);
    console.log(`[messages] Request body:`, JSON.stringify({ action, payload }, null, 2));

    // ─────────────────────────────────────────────────────────
    // Step 2: Validate action (pure)
    // ─────────────────────────────────────────────────────────

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    console.log(`[messages] Action: ${action}`);

    // ─────────────────────────────────────────────────────────
    // Step 3: Get configuration (pure with env read)
    // ─────────────────────────────────────────────────────────

    const configResult = getSupabaseConfig();
    if (!configResult.ok) {
      throw configResult.error;
    }
    const config = configResult.value;

    // ─────────────────────────────────────────────────────────
    // Step 4: Authenticate user (side effect boundary)
    // Uses shared factory — supports JWT auth + legacy user_id fallback
    // ─────────────────────────────────────────────────────────

    const requireAuth = !isPublicAction(PUBLIC_ACTIONS, action);
    const authResult = await authenticateRequest(headers, config, payload, {
      optional: !requireAuth,
      allowLegacyFallback: true,
    });

    if (!authResult.ok) {
      throw authResult.error;
    }

    const user = authResult.value;

    if (user) {
      errorLog = setUserId(errorLog, user.id);
      console.log(`[messages] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log(`[messages] No-auth action: ${action}`);
    }

    // ─────────────────────────────────────────────────────────
    // Step 5: Create admin client (shared factory)
    // ─────────────────────────────────────────────────────────

    const supabaseAdmin = createServiceClient(config);

    // ─────────────────────────────────────────────────────────
    // Step 6: Route to handler (pure lookup + execution)
    // ─────────────────────────────────────────────────────────

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    // Execute handler - the only remaining side effect
    const handler = handlerResult.value;
    const result = await executeHandler(handler, action as Action, payload, user, supabaseAdmin);

    console.log(`[messages] Handler completed successfully`);
    console.log(`[messages] ========== REQUEST COMPLETE ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error('[messages] ========== ERROR ==========');
    console.error('[messages] Error:', error);
    console.error('[messages] Error stack:', (error as Error).stack);

    // Add error to log (immutable)
    errorLog = addError(errorLog, error as Error, 'Fatal error in main handler');

    // Report to Slack (side effect at boundary)
    const statusCode = getStatusCodeFromError(error as Error);
    if (statusCode >= 500) {
      reportErrorLog(errorLog);
    } else {
      console.log(`[messages] Skipping Slack report for ${statusCode} error`);
    }

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
  user: AuthenticatedUser | null,
  supabaseAdmin: SupabaseClient
): Promise<unknown> {
  switch (action) {
    case 'send_message':
      // User is guaranteed non-null for auth-required actions
      return handler(supabaseAdmin, payload, user!);

    case 'get_messages':
      // User is guaranteed non-null for auth-required actions
      return handler(supabaseAdmin, payload, user!);

    case 'get_threads':
      // User is guaranteed non-null for auth-required actions
      return handler(supabaseAdmin, payload, user!);

    case 'send_guest_inquiry':
      return handler(supabaseAdmin, payload);

    case 'create_proposal_thread':
      // Internal action - no user auth needed (service-level call)
      return handler(supabaseAdmin, payload);

    case 'send_splitbot_message':
      // Internal action - SplitBot automation (service-level call)
      return handler(supabaseAdmin, payload);

    // Admin actions - no auth gating for internal admin pages
    // Pass user (nullable) - handlers will skip admin check when user is null
    case 'admin_get_all_threads':
      return handler(supabaseAdmin, payload, user);

    case 'admin_delete_thread':
      return handler(supabaseAdmin, payload, user);

    case 'admin_send_reminder':
      return handler(supabaseAdmin, payload, user);

    default: {
      // Exhaustive check - TypeScript ensures all cases are handled
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${action}`);
    }
  }
}
