/**
 * Set Auto-Bid Edge Function
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Actions:
 * - set: Set max auto-bid amount for participant
 * - get: Get current auto-bid settings
 * - clear: Remove auto-bid configuration
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

console.log("[set-auto-bid] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || 'set';
    const payload = body.payload || {};

    console.log(`[set-auto-bid] Action: ${action}`);

    const validActions = ['set', 'get', 'clear'];
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
      case 'set': {
        const { sessionId, maxAmount } = payload;
        if (!sessionId || maxAmount === undefined) {
          throw new ValidationError('sessionId and maxAmount are required');
        }

        console.log(`[set-auto-bid] User ${user.id} setting auto-bid to ${maxAmount} on session ${sessionId}`);

        await biddingService.setMaxAutoBid(sessionId, user.id, Number(maxAmount));
        result = { sessionId, userId: user.id, maxAmount: Number(maxAmount) };
        break;
      }

      case 'get': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }

        result = await biddingService.getAutoBidSettings(sessionId, user.id);
        break;
      }

      case 'clear': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }

        console.log(`[set-auto-bid] User ${user.id} clearing auto-bid on session ${sessionId}`);

        await biddingService.clearAutoBid(sessionId, user.id);
        result = { sessionId, userId: user.id, maxAmount: null };
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
    console.error('[set-auto-bid] Error:', error);
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
    console.log('[set-auto-bid:auth] No Authorization header');
    return null;
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      console.error('[set-auto-bid:auth] getUser failed:', error?.message);
      return null;
    }

    // Lookup application user ID by email
    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('_id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) {
      console.error('[set-auto-bid:auth] User lookup failed:', appUserError?.message);
      return null;
    }

    return { id: appUser._id, email: user.email ?? '' };
  } catch (err) {
    console.error('[set-auto-bid:auth] Exception:', (err as Error).message);
    return null;
  }
}

console.log("[set-auto-bid] Edge Function ready");
