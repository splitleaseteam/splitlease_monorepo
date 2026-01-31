// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - STRIPE WEBHOOK HANDLER
// ============================================================================
// Edge Function: Handle Stripe webhooks for payment status updates
// Version: 1.0
// Date: 2026-01-28
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

// ============================================================================
// CONFIGURATION
// ============================================================================

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return;
  }

  console.log('Payment succeeded for request:', requestId);

  // Update request payment status
  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'paid',
      payment_processed_at: new Date().toISOString(),
      stripe_charge_id: paymentIntent.charges.data[0]?.id || null,
      payment_metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        amount_received: paymentIntent.amount_received,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        receipt_url: paymentIntent.charges.data[0]?.receipt_url || null,
        paid_at: new Date(paymentIntent.created * 1000).toISOString(),
      },
    })
    .eq('id', requestId)
    .select();

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }

  console.log('Payment status updated successfully:', data);

  // TODO: Send confirmation email to user
  // TODO: Notify landlord of payment
  // TODO: Trigger any post-payment workflows

  return data;
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return;
  }

  console.log('Payment failed for request:', requestId);

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'failed',
      payment_metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_code: paymentIntent.last_payment_error?.code || null,
        failure_message: paymentIntent.last_payment_error?.message || null,
        failed_at: new Date().toISOString(),
      },
    })
    .eq('id', requestId)
    .select();

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }

  console.log('Payment failure recorded:', data);

  // TODO: Send failure notification to user
  // TODO: Provide retry instructions

  return data;
}

/**
 * Handle payment cancellation
 */
async function handlePaymentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return;
  }

  console.log('Payment canceled for request:', requestId);

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'unpaid',
      payment_metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        canceled_at: new Date().toISOString(),
        cancelation_reason: paymentIntent.cancellation_reason || null,
      },
    })
    .eq('id', requestId)
    .select();

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }

  return data;
}

/**
 * Handle refund
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  supabaseClient: any
) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('No payment_intent in Charge');
    return;
  }

  console.log('Charge refunded:', charge.id);

  // Find request by payment intent ID
  const { data: requests, error: findError } = await supabaseClient
    .from('datechangerequest')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (findError || !requests || requests.length === 0) {
    console.error('Request not found for payment intent:', paymentIntentId);
    return;
  }

  const requestId = requests[0].id;

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'refunded',
      payment_metadata: {
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: charge.id,
        refund_amount: charge.amount_refunded,
        refunded_at: new Date().toISOString(),
        refund_reason: charge.refunds.data[0]?.reason || null,
      },
    })
    .eq('id', requestId)
    .select();

  if (error) {
    console.error('Failed to update refund status:', error);
    throw error;
  }

  console.log('Refund status updated:', data);

  // TODO: Send refund confirmation email
  // TODO: Revert any completed actions

  return data;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  try {
    // ========================================================================
    // VERIFY WEBHOOK SIGNATURE
    // ========================================================================
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      );
    }

    console.log('Webhook event received:', event.type, event.id);

    // ========================================================================
    // CREATE SUPABASE CLIENT
    // ========================================================================
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for webhooks
    );

    // ========================================================================
    // HANDLE EVENT
    // ========================================================================
    let result;

    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          supabaseClient
        );
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
          supabaseClient
        );
        break;

      case 'payment_intent.canceled':
        result = await handlePaymentCanceled(
          event.data.object as Stripe.PaymentIntent,
          supabaseClient
        );
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          supabaseClient
        );
        break;

      case 'payment_intent.created':
      case 'payment_intent.processing':
        // Log but don't process
        console.log('Payment intent status update:', event.type);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    // ========================================================================
    // LOG WEBHOOK EVENT
    // ========================================================================
    await supabaseClient
      .from('webhook_logs')
      .insert({
        event_id: event.id,
        event_type: event.type,
        event_data: event.data.object,
        processed_at: new Date().toISOString(),
        status: 'success',
      })
      .catch((error: any) => {
        console.error('Failed to log webhook event:', error);
      });

    // ========================================================================
    // RETURN SUCCESS
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        eventType: event.type,
        eventId: event.id,
        result,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        success: false,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

// ============================================================================
// END EDGE FUNCTION
// ============================================================================
