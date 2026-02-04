// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - STRIPE WEBHOOK HANDLER
// ============================================================================
// Edge Function: Handle Stripe webhooks for payment status updates
// Version: 1.0
// Date: 2026-01-29
// PCI Compliance: Webhook signature verification prevents tampered events
//                 No card data in webhook payloads
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
// TYPE DEFINITIONS
// ============================================================================

interface WebhookLogEntry {
  event_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  processed_at: string;
  status: 'success' | 'error';
  error_message?: string;
}

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

/**
 * Handle successful payment (payment_intent.succeeded)
 * Updates request status to 'paid' and records payment details
 */
async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return null;
  }

  console.log('Payment succeeded for request:', requestId);

  // Get the charge for receipt URL
  const chargeId = paymentIntent.latest_charge as string;
  let receiptUrl: string | null = null;

  if (chargeId) {
    try {
      const charge = await stripe.charges.retrieve(chargeId);
      receiptUrl = charge.receipt_url;
    } catch (e) {
      console.error('Failed to retrieve charge:', e);
    }
  }

  // Update request payment status
  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'paid',
      payment_processed_at: new Date().toISOString(),
      stripe_charge_id: chargeId || null,
      payment_metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        amount_received: paymentIntent.amount_received,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method,
        receipt_url: receiptUrl,
        paid_at: new Date().toISOString(),
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
 * Handle failed payment (payment_intent.payment_failed)
 * Records failure reason for debugging and user notification
 */
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return null;
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
        decline_code: paymentIntent.last_payment_error?.decline_code || null,
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
 * Handle payment cancellation (payment_intent.canceled)
 * Resets payment status to allow new payment attempt
 */
async function handlePaymentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const requestId = paymentIntent.metadata.request_id;

  if (!requestId) {
    console.error('No request_id in PaymentIntent metadata');
    return null;
  }

  console.log('Payment canceled for request:', requestId);

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: 'unpaid',
      stripe_payment_intent_id: null, // Clear to allow new payment
      payment_metadata: {
        previous_payment_intent_id: paymentIntent.id,
        canceled_at: new Date().toISOString(),
        cancellation_reason: paymentIntent.cancellation_reason || null,
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
 * Handle refund (charge.refunded)
 * Records refund details and updates payment status
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  supabaseClient: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('No payment_intent in Charge');
    return null;
  }

  console.log('Charge refunded:', charge.id);

  // Find request by payment intent ID
  const { data: requests, error: findError } = await supabaseClient
    .from('datechangerequest')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (findError || !requests || requests.length === 0) {
    console.error('Request not found for payment intent:', paymentIntentId);
    return null;
  }

  const requestId = requests[0].id;

  // Determine if full or partial refund
  const isFullRefund = charge.amount_refunded === charge.amount;
  const refundStatus = isFullRefund ? 'refunded' : 'paid'; // Keep as paid for partial refunds

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_status: refundStatus,
      payment_metadata: {
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: charge.id,
        refund_amount: charge.amount_refunded,
        refund_amount_formatted: `$${(charge.amount_refunded / 100).toFixed(2)}`,
        original_amount: charge.amount,
        is_full_refund: isFullRefund,
        refunded_at: new Date().toISOString(),
        refund_reason: charge.refunds?.data[0]?.reason || null,
        refund_id: charge.refunds?.data[0]?.id || null,
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
  // TODO: Revert any completed actions if needed

  return data;
}

/**
 * Handle charge dispute (charge.dispute.created)
 * Records dispute for admin review
 */
async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  supabaseClient: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const chargeId = dispute.charge as string;

  console.log('Dispute created for charge:', chargeId);

  // Find request by charge ID
  const { data: requests, error: findError } = await supabaseClient
    .from('datechangerequest')
    .select('id, payment_metadata')
    .eq('stripe_charge_id', chargeId);

  if (findError || !requests || requests.length === 0) {
    console.error('Request not found for charge:', chargeId);
    return null;
  }

  const requestId = requests[0].id;
  const existingMetadata = requests[0].payment_metadata || {};

  const { data, error } = await supabaseClient
    .from('datechangerequest')
    .update({
      payment_metadata: {
        ...existingMetadata,
        dispute_id: dispute.id,
        dispute_reason: dispute.reason,
        dispute_status: dispute.status,
        dispute_amount: dispute.amount,
        dispute_created_at: new Date().toISOString(),
      },
    })
    .eq('id', requestId)
    .select();

  if (error) {
    console.error('Failed to update dispute status:', error);
    throw error;
  }

  // TODO: Send urgent notification to admin
  // TODO: Prepare evidence submission

  return data;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  try {
    // ========================================================================
    // VERIFY WEBHOOK SIGNATURE (PCI requirement)
    // ========================================================================
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response(
        JSON.stringify({ error: 'Missing Stripe signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
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
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook event received:', event.type, event.id);

    // ========================================================================
    // CREATE SUPABASE CLIENT (service role for webhooks)
    // ========================================================================
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role bypasses RLS
    );

    // ========================================================================
    // HANDLE EVENT
    // ========================================================================
    let result: Record<string, unknown> | null = null;
    let logStatus: 'success' | 'error' = 'success';
    let errorMessage: string | undefined;

    try {
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

        case 'charge.dispute.created':
          result = await handleDisputeCreated(
            event.data.object as Stripe.Dispute,
            supabaseClient
          );
          break;

        case 'payment_intent.created':
        case 'payment_intent.processing':
        case 'payment_intent.requires_action':
          // Log but don't process - these are informational
          console.log('Payment intent status update:', event.type);
          break;

        default:
          console.log('Unhandled event type:', event.type);
      }
    } catch (handlerError) {
      console.error('Handler error:', handlerError);
      logStatus = 'error';
      errorMessage = handlerError.message;
    }

    // ========================================================================
    // LOG WEBHOOK EVENT
    // ========================================================================
    const logEntry: WebhookLogEntry = {
      event_id: event.id,
      event_type: event.type,
      event_data: event.data.object as Record<string, unknown>,
      processed_at: new Date().toISOString(),
      status: logStatus,
      error_message: errorMessage,
    };

    await supabaseClient
      .from('webhook_logs')
      .insert(logEntry)
      .catch((logError) => {
        console.error('Failed to log webhook event:', logError);
        // Don't throw - webhook should still succeed even if logging fails
      });

    // ========================================================================
    // RETURN SUCCESS (200 tells Stripe not to retry)
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
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);

    // Return 500 to trigger Stripe retry
    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        success: false,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// END EDGE FUNCTION
// ============================================================================
