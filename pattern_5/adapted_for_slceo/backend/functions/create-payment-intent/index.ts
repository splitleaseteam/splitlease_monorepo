// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - CREATE PAYMENT INTENT (ADAPTED)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

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

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { requestId } = await req.json();

        const { data: request, error: requestError } = await supabaseClient
            .from('datechangerequest')
            .select(`
        id,
        total_price,
        base_price,
        fee_breakdown,
        transaction_type,
        stripe_payment_intent_id,
        payment_status,
        bookings_leases:lease_id (
          _id,
          "Total Rent",
          "Host"
        )
      `)
            .eq('id', requestId)
            .single();

        if (requestError || !request) throw new Error('Request not found');

        const totalAmount = request.total_price || request.base_price;
        const amountCents = Math.round(totalAmount * 100);
        const applicationFeeCents = Math.round((totalAmount - (request.base_price || totalAmount)) * 0.5 * 100);

        let paymentIntent;
        if (request.stripe_payment_intent_id) {
            paymentIntent = await stripe.paymentIntents.retrieve(request.stripe_payment_intent_id);
        } else {
            paymentIntent = await stripe.paymentIntents.create({
                amount: amountCents,
                currency: 'usd',
                application_fee_amount: applicationFeeCents > 0 ? applicationFeeCents : undefined,
                metadata: {
                    request_id: requestId,
                    transaction_type: request.transaction_type || 'date_change',
                },
            });

            await supabaseClient
                .from('datechangerequest')
                .update({
                    stripe_payment_intent_id: paymentIntent.id,
                    payment_status: 'processing',
                })
                .eq('id', requestId);
        }

        return new Response(JSON.stringify({
            success: true,
            paymentIntent: {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                status: paymentIntent.status,
            }
        }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
