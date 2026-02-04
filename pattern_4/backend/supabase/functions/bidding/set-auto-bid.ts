/**
 * =====================================================
 * SUPABASE EDGE FUNCTION: Set Auto-Bid
 * =====================================================
 * Sets maximum auto-bid amount for proxy bidding
 * Path: /functions/v1/bidding/set-auto-bid
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BiddingService } from '../../../src/services/BiddingService.ts';
import { SetMaxAutoBidRequest } from '../../../src/types/bidding.types.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

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

        const body = await req.json() as SetMaxAutoBidRequest;

        if (!body.sessionId || !body.maxAmount) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: sessionId, maxAmount' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate max amount is reasonable
        if (body.maxAmount < 100 || body.maxAmount > 100000) {
            return new Response(
                JSON.stringify({ error: 'Max auto-bid must be between $100 and $100,000' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const biddingService = new BiddingService(supabaseClient);

        await biddingService.setMaxAutoBid({
            sessionId: body.sessionId,
            userId: user.id,
            maxAmount: body.maxAmount,
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: `Max auto-bid set to $${body.maxAmount.toFixed(2)}`,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Set auto-bid error:', error);

        return new Response(
            JSON.stringify({
                error: error.message || 'Internal server error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
