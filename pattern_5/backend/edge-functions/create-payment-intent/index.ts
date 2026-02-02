// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - CREATE STRIPE PAYMENT INTENT
// ============================================================================
// Edge Function: Create Stripe PaymentIntent for date change request fees
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

const PLATFORM_FEE_PERCENTAGE = 0.0075; // 0.75%
const APPLICATION_FEE_PERCENTAGE = 0.015; // 1.5% total (platform + landlord)

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PaymentIntentRequest {
  requestId: string;
  userId?: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

interface PaymentIntentResponse {
  success: boolean;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: string;
  };
  request?: any;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(
  supabaseClient: any,
  userId: string,
  userEmail: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const { data: userData, error: userError } = await supabaseClient
    .from('user')
    .select('stripe_customer_id, full_name')
    .eq('auth_id', userId)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch user: ${userError.message}`);
  }

  // Return existing customer ID if available
  if (userData?.stripe_customer_id) {
    return userData.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: userEmail,
    name: userData?.full_name || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Save customer ID to database
  await supabaseClient
    .from('user')
    .update({ stripe_customer_id: customer.id })
    .eq('auth_id', userId);

  return customer.id;
}

/**
 * Calculate application fee (what platform keeps)
 */
function calculateApplicationFee(totalAmount: number): number {
  // Platform keeps 0.75% of the base price
  // Total fee is 1.5%, so platform gets half
  return Math.round(totalAmount * (PLATFORM_FEE_PERCENTAGE / APPLICATION_FEE_PERCENTAGE));
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  try {
    // ========================================================================
    // CORS HEADERS
    // ========================================================================
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================
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
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized - please log in');
    }

    // ========================================================================
    // PARSE INPUT
    // ========================================================================
    const input: PaymentIntentRequest = await req.json();
    const {
      requestId,
      paymentMethodId,
      savePaymentMethod = false
    } = input;

    if (!requestId) {
      throw new Error('Missing required field: requestId');
    }

    // ========================================================================
    // FETCH DATE CHANGE REQUEST
    // ========================================================================
    const { data: request, error: requestError } = await supabaseClient
      .from('datechangerequest')
      .select(`
        id,
        user_id,
        lease_id,
        status,
        total_price,
        base_price,
        fee_breakdown,
        transaction_type,
        payment_status,
        stripe_payment_intent_id,
        leases (
          id,
          landlord_id,
          monthly_rent,
          property_id
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError) {
      throw new Error(`Failed to fetch request: ${requestError.message}`);
    }

    if (!request) {
      throw new Error('Request not found');
    }

    // Verify ownership
    if (request.user_id !== user.id) {
      throw new Error('Unauthorized - you do not own this request');
    }

    // Verify status
    if (request.status !== 'pending' && request.status !== 'approved') {
      throw new Error(`Cannot create payment for ${request.status} request`);
    }

    // Check if payment already exists
    if (request.stripe_payment_intent_id && request.payment_status === 'paid') {
      throw new Error('Payment already completed for this request');
    }

    // ========================================================================
    // CALCULATE PAYMENT AMOUNT
    // ========================================================================
    const totalAmount = request.total_price || request.base_price;
    if (!totalAmount || totalAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Convert to cents for Stripe
    const amountCents = Math.round(totalAmount * 100);
    const applicationFeeCents = calculateApplicationFee(amountCents);

    console.log('Payment calculation:', {
      requestId,
      totalAmount,
      amountCents,
      applicationFeeCents,
      feeBreakdown: request.fee_breakdown,
    });

    // ========================================================================
    // GET OR CREATE STRIPE CUSTOMER
    // ========================================================================
    const customerId = await getOrCreateStripeCustomer(
      supabaseClient,
      user.id,
      user.email!
    );

    // ========================================================================
    // CREATE OR RETRIEVE PAYMENT INTENT
    // ========================================================================
    let paymentIntent;

    if (request.stripe_payment_intent_id) {
      // Retrieve existing PaymentIntent
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(
          request.stripe_payment_intent_id
        );

        // If amount changed, update it
        if (paymentIntent.amount !== amountCents) {
          paymentIntent = await stripe.paymentIntents.update(
            paymentIntent.id,
            {
              amount: amountCents,
              application_fee_amount: applicationFeeCents,
            }
          );
        }
      } catch (error) {
        console.error('Failed to retrieve existing PaymentIntent:', error);
        // Create new one if retrieval fails
        paymentIntent = null;
      }
    }

    if (!paymentIntent) {
      // Create new PaymentIntent
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        application_fee_amount: applicationFeeCents,
        payment_method: paymentMethodId || undefined,
        setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
        metadata: {
          request_id: requestId,
          user_id: user.id,
          lease_id: request.lease_id,
          transaction_type: request.transaction_type || 'date_change',
          fee_breakdown: JSON.stringify(request.fee_breakdown),
        },
        description: `Date Change Request Fee - ${request.transaction_type}`,
        statement_descriptor: 'SPLITLEASE FEE',
      });

      // Save PaymentIntent ID to database
      await supabaseClient
        .from('datechangerequest')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          payment_status: 'processing',
          payment_metadata: {
            stripe_customer_id: customerId,
            amount_cents: amountCents,
            application_fee_cents: applicationFeeCents,
            created_at: new Date().toISOString(),
          },
        })
        .eq('id', requestId);
    }

    // ========================================================================
    // RETURN PAYMENT INTENT
    // ========================================================================
    return new Response(
      JSON.stringify({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
        request: {
          id: request.id,
          totalPrice: totalAmount,
          feeBreakdown: request.fee_breakdown,
        },
      } as PaymentIntentResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error in create-payment-intent:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        success: false,
      } as PaymentIntentResponse),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// ============================================================================
// END EDGE FUNCTION
// ============================================================================
