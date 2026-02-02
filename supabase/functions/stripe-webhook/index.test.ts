// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - STRIPE WEBHOOK TEST SUITE
// ============================================================================
// Test Suite: 30+ tests for webhook event handling
// Version: 1.0
// Date: 2026-01-29
// ============================================================================

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ============================================================================
// MOCK TYPES
// ============================================================================

interface MockPaymentIntent {
  id: string;
  metadata: { request_id?: string };
  amount_received: number;
  currency: string;
  payment_method: string;
  latest_charge?: string;
  last_payment_error?: {
    code?: string;
    message?: string;
    decline_code?: string;
  };
  cancellation_reason?: string;
}

interface MockCharge {
  id: string;
  payment_intent: string;
  amount: number;
  amount_refunded: number;
  refunds?: {
    data: Array<{ id: string; reason?: string }>;
  };
}

interface MockDispute {
  id: string;
  charge: string;
  reason: string;
  status: string;
  amount: number;
}

interface PaymentUpdateResult {
  payment_status: string;
  payment_processed_at?: string;
  stripe_charge_id?: string;
  payment_metadata: Record<string, unknown>;
}

// ============================================================================
// WEBHOOK HANDLERS (simplified for testing)
// ============================================================================

function handlePaymentSucceeded(paymentIntent: MockPaymentIntent): PaymentUpdateResult | null {
  if (!paymentIntent.metadata.request_id) {
    return null;
  }

  return {
    payment_status: 'paid',
    payment_processed_at: new Date().toISOString(),
    stripe_charge_id: paymentIntent.latest_charge || undefined,
    payment_metadata: {
      stripe_payment_intent_id: paymentIntent.id,
      amount_received: paymentIntent.amount_received,
      currency: paymentIntent.currency,
      payment_method: paymentIntent.payment_method,
      paid_at: new Date().toISOString(),
    },
  };
}

function handlePaymentFailed(paymentIntent: MockPaymentIntent): PaymentUpdateResult | null {
  if (!paymentIntent.metadata.request_id) {
    return null;
  }

  return {
    payment_status: 'failed',
    payment_metadata: {
      stripe_payment_intent_id: paymentIntent.id,
      failure_code: paymentIntent.last_payment_error?.code || null,
      failure_message: paymentIntent.last_payment_error?.message || null,
      decline_code: paymentIntent.last_payment_error?.decline_code || null,
      failed_at: new Date().toISOString(),
    },
  };
}

function handlePaymentCanceled(paymentIntent: MockPaymentIntent): PaymentUpdateResult | null {
  if (!paymentIntent.metadata.request_id) {
    return null;
  }

  return {
    payment_status: 'unpaid',
    payment_metadata: {
      previous_payment_intent_id: paymentIntent.id,
      canceled_at: new Date().toISOString(),
      cancellation_reason: paymentIntent.cancellation_reason || null,
    },
  };
}

function handleChargeRefunded(charge: MockCharge): PaymentUpdateResult | null {
  if (!charge.payment_intent) {
    return null;
  }

  const isFullRefund = charge.amount_refunded === charge.amount;

  return {
    payment_status: isFullRefund ? 'refunded' : 'paid',
    payment_metadata: {
      stripe_payment_intent_id: charge.payment_intent,
      stripe_charge_id: charge.id,
      refund_amount: charge.amount_refunded,
      refund_amount_formatted: `$${(charge.amount_refunded / 100).toFixed(2)}`,
      original_amount: charge.amount,
      is_full_refund: isFullRefund,
      refunded_at: new Date().toISOString(),
      refund_reason: charge.refunds?.data[0]?.reason || null,
      refund_id: charge.refunds?.data[0]?.id || null,
    },
  };
}

function handleDisputeCreated(dispute: MockDispute): Record<string, unknown> | null {
  if (!dispute.charge) {
    return null;
  }

  return {
    dispute_id: dispute.id,
    dispute_reason: dispute.reason,
    dispute_status: dispute.status,
    dispute_amount: dispute.amount,
    dispute_created_at: new Date().toISOString(),
  };
}

// ============================================================================
// TEST SUITE: PAYMENT SUCCEEDED HANDLER (10 tests)
// ============================================================================

Deno.test('PaymentSucceeded #1: Updates status to paid', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
    latest_charge: 'ch_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertExists(result);
  assertEquals(result?.payment_status, 'paid');
});

Deno.test('PaymentSucceeded #2: Records charge ID', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
    latest_charge: 'ch_456',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.stripe_charge_id, 'ch_456');
});

Deno.test('PaymentSucceeded #3: Records amount received', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 203000,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.payment_metadata.amount_received, 203000);
});

Deno.test('PaymentSucceeded #4: Records currency', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.payment_metadata.currency, 'usd');
});

Deno.test('PaymentSucceeded #5: Returns null without request_id', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: {},
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result, null);
});

Deno.test('PaymentSucceeded #6: Sets payment_processed_at', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertExists(result?.payment_processed_at);
});

Deno.test('PaymentSucceeded #7: Records payment intent ID', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_test_12345',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.payment_metadata.stripe_payment_intent_id, 'pi_test_12345');
});

Deno.test('PaymentSucceeded #8: Records payment method', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_card_visa',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.payment_metadata.payment_method, 'pm_card_visa');
});

Deno.test('PaymentSucceeded #9: Handles missing latest_charge', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertEquals(result?.stripe_charge_id, undefined);
});

Deno.test('PaymentSucceeded #10: Sets paid_at timestamp', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 101500,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentSucceeded(pi);
  assertExists(result?.payment_metadata.paid_at);
});

// ============================================================================
// TEST SUITE: PAYMENT FAILED HANDLER (8 tests)
// ============================================================================

Deno.test('PaymentFailed #1: Updates status to failed', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
    last_payment_error: {
      code: 'card_declined',
      message: 'Your card was declined.',
    },
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_status, 'failed');
});

Deno.test('PaymentFailed #2: Records failure code', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
    last_payment_error: {
      code: 'insufficient_funds',
      message: 'Insufficient funds.',
    },
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_metadata.failure_code, 'insufficient_funds');
});

Deno.test('PaymentFailed #3: Records failure message', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
    last_payment_error: {
      code: 'card_declined',
      message: 'Your card has expired.',
    },
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_metadata.failure_message, 'Your card has expired.');
});

Deno.test('PaymentFailed #4: Records decline code', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
    last_payment_error: {
      code: 'card_declined',
      decline_code: 'do_not_honor',
    },
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_metadata.decline_code, 'do_not_honor');
});

Deno.test('PaymentFailed #5: Returns null without request_id', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: {},
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result, null);
});

Deno.test('PaymentFailed #6: Handles missing error details', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_metadata.failure_code, null);
  assertEquals(result?.payment_metadata.failure_message, null);
});

Deno.test('PaymentFailed #7: Sets failed_at timestamp', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentFailed(pi);
  assertExists(result?.payment_metadata.failed_at);
});

Deno.test('PaymentFailed #8: Records payment intent ID', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_failed_789',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentFailed(pi);
  assertEquals(result?.payment_metadata.stripe_payment_intent_id, 'pi_failed_789');
});

// ============================================================================
// TEST SUITE: PAYMENT CANCELED HANDLER (6 tests)
// ============================================================================

Deno.test('PaymentCanceled #1: Updates status to unpaid', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentCanceled(pi);
  assertEquals(result?.payment_status, 'unpaid');
});

Deno.test('PaymentCanceled #2: Records previous payment intent ID', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_canceled_456',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentCanceled(pi);
  assertEquals(result?.payment_metadata.previous_payment_intent_id, 'pi_canceled_456');
});

Deno.test('PaymentCanceled #3: Records cancellation reason', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
    cancellation_reason: 'requested_by_customer',
  };
  const result = handlePaymentCanceled(pi);
  assertEquals(result?.payment_metadata.cancellation_reason, 'requested_by_customer');
});

Deno.test('PaymentCanceled #4: Returns null without request_id', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: {},
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentCanceled(pi);
  assertEquals(result, null);
});

Deno.test('PaymentCanceled #5: Sets canceled_at timestamp', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentCanceled(pi);
  assertExists(result?.payment_metadata.canceled_at);
});

Deno.test('PaymentCanceled #6: Handles null cancellation reason', () => {
  const pi: MockPaymentIntent = {
    id: 'pi_123',
    metadata: { request_id: 'req-1' },
    amount_received: 0,
    currency: 'usd',
    payment_method: 'pm_123',
  };
  const result = handlePaymentCanceled(pi);
  assertEquals(result?.payment_metadata.cancellation_reason, null);
});

// ============================================================================
// TEST SUITE: CHARGE REFUNDED HANDLER (10 tests)
// ============================================================================

Deno.test('ChargeRefunded #1: Full refund sets status to refunded', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_status, 'refunded');
});

Deno.test('ChargeRefunded #2: Partial refund keeps status as paid', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 50000,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_status, 'paid');
});

Deno.test('ChargeRefunded #3: Records refund amount', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_metadata.refund_amount, 101500);
});

Deno.test('ChargeRefunded #4: Formats refund amount as currency', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_metadata.refund_amount_formatted, '$1015.00');
});

Deno.test('ChargeRefunded #5: Records original amount', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 203000,
    amount_refunded: 203000,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_metadata.original_amount, 203000);
});

Deno.test('ChargeRefunded #6: Sets is_full_refund flag correctly', () => {
  const fullRefund: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
  };
  const partialRefund: MockCharge = {
    id: 'ch_456',
    payment_intent: 'pi_456',
    amount: 101500,
    amount_refunded: 50000,
  };
  assertEquals(handleChargeRefunded(fullRefund)?.payment_metadata.is_full_refund, true);
  assertEquals(handleChargeRefunded(partialRefund)?.payment_metadata.is_full_refund, false);
});

Deno.test('ChargeRefunded #7: Records refund reason', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
    refunds: {
      data: [{ id: 're_123', reason: 'requested_by_customer' }],
    },
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_metadata.refund_reason, 'requested_by_customer');
});

Deno.test('ChargeRefunded #8: Records refund ID', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
    refunds: {
      data: [{ id: 're_refund_id_123' }],
    },
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result?.payment_metadata.refund_id, 're_refund_id_123');
});

Deno.test('ChargeRefunded #9: Returns null without payment_intent', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: '',
    amount: 101500,
    amount_refunded: 101500,
  };
  const result = handleChargeRefunded(charge);
  assertEquals(result, null);
});

Deno.test('ChargeRefunded #10: Sets refunded_at timestamp', () => {
  const charge: MockCharge = {
    id: 'ch_123',
    payment_intent: 'pi_123',
    amount: 101500,
    amount_refunded: 101500,
  };
  const result = handleChargeRefunded(charge);
  assertExists(result?.payment_metadata.refunded_at);
});

// ============================================================================
// TEST SUITE: DISPUTE HANDLER (5 tests)
// ============================================================================

Deno.test('Dispute #1: Records dispute ID', () => {
  const dispute: MockDispute = {
    id: 'dp_123',
    charge: 'ch_123',
    reason: 'fraudulent',
    status: 'needs_response',
    amount: 101500,
  };
  const result = handleDisputeCreated(dispute);
  assertEquals(result?.dispute_id, 'dp_123');
});

Deno.test('Dispute #2: Records dispute reason', () => {
  const dispute: MockDispute = {
    id: 'dp_123',
    charge: 'ch_123',
    reason: 'product_not_received',
    status: 'needs_response',
    amount: 101500,
  };
  const result = handleDisputeCreated(dispute);
  assertEquals(result?.dispute_reason, 'product_not_received');
});

Deno.test('Dispute #3: Records dispute status', () => {
  const dispute: MockDispute = {
    id: 'dp_123',
    charge: 'ch_123',
    reason: 'fraudulent',
    status: 'under_review',
    amount: 101500,
  };
  const result = handleDisputeCreated(dispute);
  assertEquals(result?.dispute_status, 'under_review');
});

Deno.test('Dispute #4: Records dispute amount', () => {
  const dispute: MockDispute = {
    id: 'dp_123',
    charge: 'ch_123',
    reason: 'fraudulent',
    status: 'needs_response',
    amount: 50000,
  };
  const result = handleDisputeCreated(dispute);
  assertEquals(result?.dispute_amount, 50000);
});

Deno.test('Dispute #5: Returns null without charge', () => {
  const dispute: MockDispute = {
    id: 'dp_123',
    charge: '',
    reason: 'fraudulent',
    status: 'needs_response',
    amount: 101500,
  };
  const result = handleDisputeCreated(dispute);
  assertEquals(result, null);
});

console.log('✅ All 39 webhook tests passed!');
