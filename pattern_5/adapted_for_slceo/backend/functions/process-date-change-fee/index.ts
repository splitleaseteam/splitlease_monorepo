// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - PROCESS DATE CHANGE FEE (ADAPTED)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FEE_RATES = {
    PLATFORM_RATE: 0.0075,
    LANDLORD_RATE: 0.0075,
    TOTAL_RATE: 0.015,
};

const FEE_VERSION = '1.5_split_model_v1';

serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
            });
        }

        if (req.method !== 'POST') throw new Error('Method not allowed.');

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const input = await req.json();
        const { requestId, monthlyRent, transactionType = 'date_change' } = input;

        // Calculate Fees
        const platformFee = monthlyRent * FEE_RATES.PLATFORM_RATE;
        const landlordShare = monthlyRent * FEE_RATES.LANDLORD_RATE;
        const totalFee = platformFee + landlordShare;
        const totalPrice = monthlyRent + totalFee;

        const feeBreakdown = {
            base_price: Number(monthlyRent.toFixed(2)),
            platform_fee: Number(platformFee.toFixed(2)),
            landlord_share: Number(landlordShare.toFixed(2)),
            total_fee: Number(totalFee.toFixed(2)),
            total_price: Number(totalPrice.toFixed(2)),
            effective_rate: Number(((totalFee / monthlyRent) * 100).toFixed(2)),
            platform_rate: FEE_RATES.PLATFORM_RATE,
            landlord_rate: FEE_RATES.LANDLORD_RATE,
            transaction_type: transactionType,
            calculated_at: new Date().toISOString(),
            fee_structure_version: FEE_VERSION,
        };

        if (requestId) {
            const { data: updateData, error: updateError } = await supabaseClient
                .from('datechangerequest')
                .update({
                    fee_breakdown: feeBreakdown,
                    base_price: monthlyRent,
                    total_price: feeBreakdown.total_price,
                    transaction_type: transactionType,
                    fee_structure_version: FEE_VERSION,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .select()
                .single();

            if (updateError) throw new Error(`Update error: ${updateError.message}`);

            return new Response(JSON.stringify({ success: true, feeBreakdown, request: updateData }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        return new Response(JSON.stringify({ success: true, feeBreakdown, preview: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
