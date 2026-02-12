/**
 * Withdraw Bid Edge Function
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Actions:
 * - withdraw: Withdraw from session (cancels participation)
 * - get_withdrawal_status: Check if user can withdraw
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BiddingService } from "../_shared/bidding/index.ts";
import { ValidationError } from "../_shared/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[withdraw-bid] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || 'withdraw';
    const payload = body.payload || {};

    console.log(`[withdraw-bid] Action: ${action}`);

    const validActions = ['withdraw', 'get_withdrawal_status'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Require authentication for all actions
    const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const biddingService = new BiddingService(supabase);
    let result: unknown;

    switch (action) {
      case 'withdraw': {
        const { sessionId, reason } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }

        console.log(`[withdraw-bid] User ${user.id} withdrawing from session ${sessionId}`);

        await biddingService.withdrawFromSession(sessionId, user.id, reason);
        result = { sessionId, userId: user.id, withdrawn: true };
        break;
      }

      case 'get_withdrawal_status': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }

        result = await biddingService.canWithdraw(sessionId, user.id);
        break;
      }

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[withdraw-bid] Error:', error);
    const statusCode = (error as { name?: string }).name === 'ValidationError' ? 400 :
                       (error as { name?: string }).name === 'AuthenticationError' ? 401 : 500;
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Authentication helper (same pattern as proposal/index.ts)
async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    console.log('[withdraw-bid:auth] No Authorization header');
    return null;
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      console.error('[withdraw-bid:auth] getUser failed:', error?.message);
      return null;
    }

    // Lookup application user ID by email
    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) {
      console.error('[withdraw-bid:auth] User lookup failed:', appUserError?.message);
      return null;
    }

    return { id: appUser.id, email: user.email ?? '' };
  } catch (err) {
    console.error('[withdraw-bid:auth] Exception:', (err as Error).message);
    return null;
  }
}

console.log("[withdraw-bid] Edge Function ready");
