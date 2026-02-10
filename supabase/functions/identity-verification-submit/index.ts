/**
 * Identity Verification - Edge Function
 * Split Lease
 *
 * Routes identity verification requests to appropriate handlers.
 * Allows users to submit identity documents (selfie, front ID, back ID) for verification.
 *
 * Supported Actions:
 * - submit_verification: Submit all documents and update user record
 * - get_status: Get current verification status for a user
 *
 * Security:
 * - Requires authenticated user for all actions
 * - Users can only access their own verification data
 * - Service role has full access for admin operations
 *
 * FP Architecture:
 * - Pure functions for validation and routing
 * - Immutable data structures
 * - Side effects isolated to boundaries
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { ValidationError, AuthenticationError } from '../_shared/errors.ts';
import { createClient } from '@supabase/supabase-js';

// Import handlers
import { handleSubmitVerification } from './handlers/submit.ts';
import { handleGetStatus } from './handlers/getStatus.ts';

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  'submit_verification',
  'get_status',
] as const;

type Action = typeof ALLOWED_ACTIONS[number];

// Handler map (immutable record)
const handlers: Readonly<Record<Action, (...args: unknown[]) => unknown>> = {
  submit_verification: handleSubmitVerification,
  get_status: handleGetStatus,
};

// ─────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────

/**
 * Validate action is one of allowed actions
 */
function validateAction(action: string): action is Action {
  return ALLOWED_ACTIONS.includes(action as Action);
}

/**
 * Format success response with CORS headers
 */
function formatSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Format error response with CORS headers
 */
function formatErrorResponse(error: Error, statusCode: number = 500): Response {
  console.error('[identity-verification-submit] Error:', error.message);
  return new Response(
    JSON.stringify({ success: false, error: error.message }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log('[identity-verification-submit] Edge Function started');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[identity-verification-submit] ========== NEW REQUEST ==========`);
    console.log(`[identity-verification-submit] Method: ${req.method}`);

    // ─────────────────────────────────────────────────────────
    // Step 1: Parse request body
    // ─────────────────────────────────────────────────────────

    const body = await req.json();
    const { action, payload } = body;

    console.log(`[identity-verification-submit] Action: ${action}`);

    // ─────────────────────────────────────────────────────────
    // Step 2: Validate action
    // ─────────────────────────────────────────────────────────

    if (!action) {
      throw new ValidationError('Missing required field: action');
    }

    if (!validateAction(action)) {
      throw new ValidationError(
        `Unknown action: ${action}. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}`
      );
    }

    // ─────────────────────────────────────────────────────────
    // Step 3: Get Supabase config
    // ─────────────────────────────────────────────────────────

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // ─────────────────────────────────────────────────────────
    // Step 4: Authenticate user
    // ─────────────────────────────────────────────────────────

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new AuthenticationError('Missing Authorization header');
    }

    // Create Supabase client with user's token for RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[identity-verification-submit] Auth error:', authError);
      throw new AuthenticationError('Invalid or expired token');
    }

    console.log(`[identity-verification-submit] Authenticated user: ${user.id}`);

    // ─────────────────────────────────────────────────────────
    // Step 5: Route to handler
    // ─────────────────────────────────────────────────────────

    const handler = handlers[action];
    const result = await handler(
      supabaseUrl,
      supabaseServiceKey,
      user,
      payload || {}
    );

    console.log(`[identity-verification-submit] Handler completed successfully`);
    console.log(`[identity-verification-submit] ========== REQUEST COMPLETE ==========`);

    return formatSuccessResponse(result);

  } catch (error) {
    console.error('[identity-verification-submit] ========== ERROR ==========');
    console.error('[identity-verification-submit] Error:', error);

    if (error instanceof ValidationError) {
      return formatErrorResponse(error, 400);
    }

    if (error instanceof AuthenticationError) {
      return formatErrorResponse(error, 401);
    }

    return formatErrorResponse(error as Error, 500);
  }
});
