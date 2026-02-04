/**
 * =====================================================
 * SUPABASE EDGE FUNCTION: Submit Bid
 * =====================================================
 * Handles bid submission requests via HTTP
 * Path: /functions/v1/bidding/submit-bid
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BiddingService } from '../../../src/services/BiddingService.ts';
import { RealtimeBiddingService } from '../../../src/services/RealtimeBiddingService.ts';
import { PlaceBidRequest } from '../../../src/types/bidding.types.ts';

// =================================================
// CORS HEADERS
// =================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =================================================
// MAIN HANDLER
// =================================================

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Get current user
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const body = await req.json() as PlaceBidRequest;

        // Validate request
        if (!body.sessionId || !body.amount) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: sessionId, amount' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Ensure user is bidding for themselves
        if (body.userId && body.userId !== user.id) {
            return new Response(
                JSON.stringify({ error: 'Cannot place bid for another user' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize services
        const biddingService = new BiddingService(supabaseClient);
        const realtimeService = new RealtimeBiddingService(supabaseClient);

        // Place bid
        const result = await biddingService.placeBid({
            sessionId: body.sessionId,
            userId: user.id,
            amount: body.amount,
            isManualBid: body.isManualBid ?? true,
        });

        // Broadcast to all participants via Realtime
        await realtimeService.broadcastBidPlaced(
            body.sessionId,
            result.bid,
            result.newHighBidder,
            result.bid.amount * 1.1 // Minimum next bid (simplified)
        );

        // If auto-bid was triggered, broadcast that too
        if (result.autoBid) {
            await realtimeService.broadcastAutoBid(
                body.sessionId,
                result.autoBid,
                user.id
            );
        }

        // Return success
        return new Response(
            JSON.stringify({
                success: true,
                bid: result.bid,
                autoBid: result.autoBid || null,
                newHighBidder: result.newHighBidder,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Submit bid error:', error);

        return new Response(
            JSON.stringify({
                error: error.message || 'Internal server error',
                code: error.code || 'UNKNOWN_ERROR',
            }),
            {
                status: error.statusCode || 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
