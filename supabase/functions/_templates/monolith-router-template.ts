/**
 * [MONOLITH_NAME] Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Consolidated router for [DESCRIPTION]
 *
 * Actions:
 * [LIST_ACTIONS_HERE]
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * ARCHITECTURE:
 * - Action-based routing with lazy handler imports
 * - Explicit switch statements for clarity
 * - Service role client for database operations
 * - Optional authentication based on action requirements
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  ValidationError,
  AuthenticationError,
  getStatusCodeFromError,
} from '../_shared/errors.ts';

console.log('[MONOLITH_NAME] Edge Function initializing...');

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = [
  // Add your actions here
  'example_action',
] as const;

type Action = typeof ALLOWED_ACTIONS[number];

// Actions that don't require authentication
const PUBLIC_ACTIONS = new Set<Action>([
  // Add public actions here
]);

// ─────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    console.log(`[MONOLITH_NAME] ========== REQUEST ==========`);
    console.log(`[MONOLITH_NAME] Method: ${req.method}`);

    // ─────────────────────────────────────────────────────────
    // Handle CORS preflight
    // ─────────────────────────────────────────────────────────

    if (req.method === 'OPTIONS') {
      console.log(`[MONOLITH_NAME] CORS preflight - returning 200`);
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

    console.log(`[MONOLITH_NAME] Action: ${action}`);

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
    // Authenticate (if required)
    // ─────────────────────────────────────────────────────────

    let user: { id: string; email: string } | null = null;

    if (!PUBLIC_ACTIONS.has(action as Action)) {
      user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
      if (!user) {
        throw new AuthenticationError('Authentication required');
      }
      console.log(`[MONOLITH_NAME] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log(`[MONOLITH_NAME] Public action - skipping authentication`);
    }

    // ─────────────────────────────────────────────────────────
    // Route to handler with lazy imports
    // ─────────────────────────────────────────────────────────

    let result: unknown;

    switch (action) {
      // Add your action handlers here
      // Example:
      // case 'example_action': {
      //   console.log('[MONOLITH_NAME] Loading example handler...');
      //   const { handleExample } = await import("./handlers/example/action.ts");
      //   result = await handleExample(payload, user, supabase);
      //   break;
      // }

      default:
        throw new ValidationError(`Unhandled action: ${action}`);
    }

    console.log('[MONOLITH_NAME] Handler completed successfully');
    console.log('[MONOLITH_NAME] ========== SUCCESS ==========');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MONOLITH_NAME] ========== ERROR ==========');
    console.error('[MONOLITH_NAME] Error:', error);
    console.error('[MONOLITH_NAME] Error stack:', (error as Error).stack);

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
    console.log('[MONOLITH_NAME:auth] No Authorization header');
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
      console.error('[MONOLITH_NAME:auth] getUser failed:', error?.message);
      return null;
    }

    // Lookup application user ID by email
    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) {
      console.error('[MONOLITH_NAME:auth] User lookup failed:', appUserError?.message);
      return null;
    }

    return { id: appUser.id, email: user.email ?? '' };
  } catch (err) {
    console.error('[MONOLITH_NAME:auth] Exception:', (err as Error).message);
    return null;
  }
}

console.log('[MONOLITH_NAME] Edge Function ready');
