// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - STRIPE WEBHOOK (ADAPTED)
// ============================================================================
// Handles: payment_intent.succeeded, payment_intent.payment_failed,
//          payment_intent.canceled, charge.refunded
// Security: Webhook signature verification using STRIPE_WEBHOOK_SECRET
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
    let logStatus = 'success';
    let errorMessage: string | null = null;

    try {
        // ====================================================================
        // SIGNATURE VERIFICATION (PCI Compliance)
        // ====================================================================
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            throw new Error('Missing Stripe signature - webhook rejected');
        }

        if (!WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }

        const body = await req.text();
        let event: Stripe.Event;

        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
        } catch (signatureError) {
            console.error('Webhook signature verification failed:', signatureError);
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log('Webhook received:', event.type, event.id);

        // ====================================================================
        // SUPABASE CLIENT (Service Role for bypassing RLS)
        // ====================================================================
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // ====================================================================
        // EVENT HANDLERS
        // ====================================================================

        // PAYMENT SUCCEEDED
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const requestId = paymentIntent.metadata.request_id;

            if (requestId) {
                console.log('Processing payment success for request:', requestId);

                const { error } = await supabaseClient
                    .from('datechangerequest')
                    .update({
                        payment_status: 'paid',
                        payment_processed_at: new Date().toISOString(),
                        stripe_charge_id: paymentIntent.latest_charge as string,
                        payment_metadata: {
                            stripe_payment_intent_id: paymentIntent.id,
                            amount_received: paymentIntent.amount_received,
                            currency: paymentIntent.currency,
                            payment_method: paymentIntent.payment_method,
                            paid_at: new Date().toISOString(),
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', requestId);

                if (error) {
                    console.error('Failed to update payment status:', error);
                    logStatus = 'error';
                    errorMessage = error.message;
                }
            }
        }

        // PAYMENT FAILED
        else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const requestId = paymentIntent.metadata.request_id;

            if (requestId) {
                console.log('Processing payment failure for request:', requestId);

                const { error } = await supabaseClient
                    .from('datechangerequest')
                    .update({
                        payment_status: 'failed',
                        payment_metadata: {
                            stripe_payment_intent_id: paymentIntent.id,
                            failure_code: paymentIntent.last_payment_error?.code || null,
                            failure_message: paymentIntent.last_payment_error?.message || null,
                            decline_code: paymentIntent.last_payment_error?.decline_code || null,
                            failed_at: new Date().toISOString(),
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', requestId);

                if (error) {
                    logStatus = 'error';
                    errorMessage = error.message;
                }
            }
        }

        // PAYMENT CANCELED
        else if (event.type === 'payment_intent.canceled') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const requestId = paymentIntent.metadata.request_id;

            if (requestId) {
                console.log('Processing payment cancellation for request:', requestId);

                const { error } = await supabaseClient
                    .from('datechangerequest')
                    .update({
                        payment_status: 'unpaid',
                        stripe_payment_intent_id: null, // Clear to allow new payment
                        payment_metadata: {
                            previous_payment_intent_id: paymentIntent.id,
                            canceled_at: new Date().toISOString(),
                            cancellation_reason: paymentIntent.cancellation_reason || null,
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', requestId);

                if (error) {
                    logStatus = 'error';
                    errorMessage = error.message;
                }
            }
        }

        // CHARGE REFUNDED
        else if (event.type === 'charge.refunded') {
            const charge = event.data.object as Stripe.Charge;
            const paymentIntentId = charge.payment_intent as string;

            if (paymentIntentId) {
                console.log('Processing refund for payment intent:', paymentIntentId);

                // Find request by payment intent ID
                const { data: requests } = await supabaseClient
                    .from('datechangerequest')
                    .select('id')
                    .eq('stripe_payment_intent_id', paymentIntentId);

                if (requests && requests.length > 0) {
                    const requestId = requests[0].id;
                    const isFullRefund = charge.amount_refunded === charge.amount;

                    const { error } = await supabaseClient
                        .from('datechangerequest')
                        .update({
                            payment_status: isFullRefund ? 'refunded' : 'paid',
                            payment_metadata: {
                                stripe_payment_intent_id: paymentIntentId,
                                stripe_charge_id: charge.id,
                                refund_amount: charge.amount_refunded,
                                refund_amount_formatted: `$${(charge.amount_refunded / 100).toFixed(2)}`,
                                original_amount: charge.amount,
                                is_full_refund: isFullRefund,
                                refunded_at: new Date().toISOString(),
                                refund_reason: charge.refunds?.data[0]?.reason || null,
                            },
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', requestId);

                    if (error) {
                        logStatus = 'error';
                        errorMessage = error.message;
                    }
                }
            }
        }

        // ====================================================================
        // LOG WEBHOOK EVENT
        // ====================================================================
        await supabaseClient.from('webhook_logs').insert({
            event_id: event.id,
            event_type: event.type,
            event_data: event.data.object,
            status: logStatus,
            error_message: errorMessage,
            processed_at: new Date().toISOString(),
        }).catch(logError => {
            console.error('Failed to log webhook:', logError);
        });

        return new Response(JSON.stringify({ success: true, eventType: event.type }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(
            JSON.stringify({ error: error.message, success: false }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
