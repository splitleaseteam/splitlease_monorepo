/**
 * Submit Bid Edge Function
 * Pattern 4: BS+BS Competitive Bidding
 *
 * Actions:
 * - submit: Submit a new bid on a session
 * - get_session: Get current session state
 * - get_bid_history: Get all bids in a session
 * - create_session: Create a new bidding session
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

console.log("[submit-bid] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const body = await req.json();
    const action = body.action || 'submit';
    const payload = body.payload || {};

    console.log(`[submit-bid] Action: ${action}`);

    const validActions = ['submit', 'get_session', 'get_bid_history', 'create_session'];
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const biddingService = new BiddingService(supabase);
    let result: unknown;

    switch (action) {
      case 'submit': {
        // Require authentication
        const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { sessionId, amount } = payload;
        if (!sessionId || amount === undefined) {
          throw new ValidationError('sessionId and amount are required');
        }

        console.log(`[submit-bid] User ${user.id} submitting bid of ${amount} on session ${sessionId}`);

        result = await biddingService.placeBid({
          sessionId,
          userId: user.id,
          amount: Number(amount),
          isManualBid: true,
        });
        break;
      }

      case 'get_session': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }
        result = await biddingService.getSession(sessionId);
        break;
      }

      case 'get_bid_history': {
        const { sessionId } = payload;
        if (!sessionId) {
          throw new ValidationError('sessionId is required');
        }
        result = await biddingService.getBidHistory(sessionId);
        break;
      }

      case 'create_session': {
        // Require authentication for session creation
        const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { targetNight, propertyId, listingId, participantUserIds, startingBid, maxRounds, roundDurationSeconds } = payload;

        if (!targetNight || !propertyId || !participantUserIds || !startingBid) {
          throw new ValidationError('targetNight, propertyId, participantUserIds, and startingBid are required');
        }

        console.log(`[submit-bid] Creating session for property ${propertyId}`);

        result = await biddingService.createSession({
          targetNight,
          propertyId,
          listingId,
          participantUserIds,
          startingBid: Number(startingBid),
          maxRounds,
          roundDurationSeconds,
        });
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
    console.error('[submit-bid] Error:', error);
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
    console.log('[submit-bid:auth] No Authorization header');
    return null;
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      console.error('[submit-bid:auth] getUser failed:', error?.message);
      return null;
    }

    // Lookup application user ID by email
    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('_id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) {
      console.error('[submit-bid:auth] User lookup failed:', appUserError?.message);
      return null;
    }

    return { id: appUser._id, email: user.email ?? '' };
  } catch (err) {
    console.error('[submit-bid:auth] Exception:', (err as Error).message);
    return null;
  }
}

console.log("[submit-bid] Edge Function ready");
