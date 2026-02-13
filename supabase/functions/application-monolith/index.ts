/**
 * Application Monolith Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Consolidated router for rental applications and identity verification
 *
 * Actions:
 * - rental_application:submit - Submit rental application form data
 * - rental_application:get - Get existing application data
 * - rental_application:upload - Upload supporting documents
 * - identity:submit_verification - Submit identity verification documents
 * - identity:get_status - Get current verification status
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * ARCHITECTURE:
 * - Action-based routing with lazy handler imports
 * - Explicit switch statements for clarity
 * - Service role client for database operations
 * - Authentication required for all identity actions
 * - Rental application actions support legacy user_id in payload
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  ValidationError,
  AuthenticationError,
  getStatusCodeFromError,
} from '../_shared/errors.ts';

console.log('[application-monolith] Edge Function initializing...');

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  'rental_application:submit',
  'rental_application:get',
  'rental_application:upload',
  'identity:submit_verification',
  'identity:get_status',
] as const;

type Action = typeof ALLOWED_ACTIONS[number];

// Rental application actions are public (legacy Bubble token users provide user_id in payload)
// Identity actions require authentication
const PUBLIC_ACTIONS = new Set<Action>([
  'rental_application:submit',
  'rental_application:get',
  'rental_application:upload',
]);

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    console.log(`[application-monolith] ========== REQUEST ==========`);
    console.log(`[application-monolith] Method: ${req.method}`);

    // ─────────────────────────────────────────────────────────
    // Handle CORS preflight
    // ─────────────────────────────────────────────────────────

    if (req.method === 'OPTIONS') {
      console.log(`[application-monolith] CORS preflight - returning 200`);
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Only allow POST
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed');
    }

    // ─────────────────────────────────────────────────────────
    // Parse request
    // ─────────────────────────────────────────────────────────

    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[application-monolith] Action: ${action}`);

    // ─────────────────────────────────────────────────────────
    // Validate action
    // ─────────────────────────────────────────────────────────

    if (!ALLOWED_ACTIONS.includes(action as Action)) {
      throw new ValidationError(
        `Invalid action: ${action}. Allowed: ${ALLOWED_ACTIONS.join(', ')}`
      );
    }

    // ─────────────────────────────────────────────────────────
    // Get Supabase configuration
    // ─────────────────────────────────────────────────────────

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ─────────────────────────────────────────────────────────
    // Authenticate based on action requirements
    // ─────────────────────────────────────────────────────────

    let user: { id: string; email: string } | null = null;
    let userId: string | null = null;

    if (action.startsWith('identity:')) {
      // Identity actions require authentication
      user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }
      userId = user.id;
      console.log(`[application-monolith] Authenticated user: ${user.email} (${user.id})`);
    } else if (action.startsWith('rental_application:')) {
      // Rental application actions support legacy user_id in payload
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
        if (user) {
          userId = user.id;
          console.log(`[application-monolith] Authenticated user: ${user.email} (${user.id})`);
        }
      }

      // Fall back to payload user_id for legacy support
      if (!userId && payload.user_id) {
        userId = payload.user_id as string;
        console.log(`[application-monolith] Using user_id from payload: ${userId}`);
      }

      if (!userId) {
        throw new AuthenticationError('User ID required (provide in payload or via JWT)');
      }
    }

    // ─────────────────────────────────────────────────────────
    // Route to handler with lazy imports
    // ─────────────────────────────────────────────────────────

    let result: unknown;

    switch (action) {
      case 'rental_application:submit': {
        console.log('[application-monolith] Loading rental application submit handler...');
        const { handleSubmit } = await import("./handlers/rental-application/submit.ts");
        result = await handleSubmit(payload, supabase, userId!);
        break;
      }

      case 'rental_application:get': {
        console.log('[application-monolith] Loading rental application get handler...');
        const { handleGet } = await import("./handlers/rental-application/get.ts");
        result = await handleGet(payload, supabase, userId!);
        break;
      }

      case 'rental_application:upload': {
        console.log('[application-monolith] Loading rental application upload handler...');
        const { handleUpload } = await import("./handlers/rental-application/upload.ts");
        result = await handleUpload(payload, supabase, userId!);
        break;
      }

      case 'identity:submit_verification': {
        console.log('[application-monolith] Loading identity verification submit handler...');
        const { handleSubmitVerification } = await import("./handlers/identity-verification/submit.ts");
        result = await handleSubmitVerification(supabaseUrl, supabaseServiceKey, user!, payload);
        break;
      }

      case 'identity:get_status': {
        console.log('[application-monolith] Loading identity verification status handler...');
        const { handleGetStatus } = await import("./handlers/identity-verification/getStatus.ts");
        result = await handleGetStatus(supabaseUrl, supabaseServiceKey, user!, payload);
        break;
      }

      default:
        throw new ValidationError(`Unhandled action: ${action}`);
    }

    console.log('[application-monolith] Handler completed successfully');
    console.log('[application-monolith] ========== SUCCESS ==========');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[application-monolith] ========== ERROR ==========');
    console.error('[application-monolith] Error:', error);
    console.error('[application-monolith] Error stack:', (error as Error).stack);

    const statusCode = getStatusCodeFromError(error as Error);

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Authenticate user from Authorization header
 *
 * @param headers - Request headers
 * @param supabaseUrl - Supabase URL
 * @param supabaseAnonKey - Supabase anonymous key
 * @returns User context or null if not authenticated
 */
async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');

  if (!authHeader) {
    console.log('[application-monolith:auth] No Authorization header');
    return null;
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error,
    } = await authClient.auth.getUser();

    if (error || !user) {
      console.error('[application-monolith:auth] getUser failed:', error?.message);
      return null;
    }

    return { id: user.id, email: user.email ?? '' };
  } catch (err) {
    console.error('[application-monolith:auth] Exception:', (err as Error).message);
    return null;
  }
}

console.log('[application-monolith] Edge Function ready');
