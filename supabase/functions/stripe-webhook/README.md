# Stripe Webhook Edge Function

Handles Stripe payment webhook events for date change request fee processing. Verifies webhook signatures, processes payment lifecycle events, and updates request payment status.

## Overview

This Edge Function implements **Pattern 5: Fee Transparency** webhook handling with PCI-compliant signature verification. It processes payment status changes from Stripe and updates the corresponding `datechangerequest` records.

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Auth**: Stripe webhook signature verification (no JWT auth)
- **PCI Compliance**: Webhook signature prevents tampered events; no card data in payloads
- **Database Client**: Service role (bypasses RLS for webhook operations)
- **Logging**: All events logged to `webhook_logs` table

## Handled Events

| Stripe Event | Handler | Effect |
|-------------|---------|--------|
| `payment_intent.succeeded` | handlePaymentSucceeded | Sets `payment_status` to `paid`, stores receipt URL |
| `payment_intent.payment_failed` | handlePaymentFailed | Sets `payment_status` to `failed`, stores failure reason |
| `payment_intent.canceled` | handlePaymentCanceled | Resets `payment_status` to `unpaid`, clears payment intent |
| `charge.refunded` | handleChargeRefunded | Sets `payment_status` to `refunded` (full) or keeps `paid` (partial) |
| `charge.dispute.created` | handleDisputeCreated | Records dispute details in `payment_metadata` |
| `payment_intent.created` | (logged only) | Informational |
| `payment_intent.processing` | (logged only) | Informational |
| `payment_intent.requires_action` | (logged only) | Informational |

## API Endpoint

### POST /functions/v1/stripe-webhook

Called by Stripe. Requires `stripe-signature` header.

**Request**: Raw Stripe event body (verified via webhook secret)

**Success Response** (200 - tells Stripe not to retry):
```json
{
  "success": true,
  "eventType": "payment_intent.succeeded",
  "eventId": "evt_1234567890",
  "result": {
    "id": "dcr-abc123",
    "payment_status": "paid"
  }
}
```

**Error Response** (500 - triggers Stripe retry):
```json
{
  "success": false,
  "error": "Error description"
}
```

**Signature Failure** (401):
```json
{
  "error": "Invalid signature"
}
```

## Dependencies

- `stripe@14.11.0` - Stripe SDK for webhook verification and charge retrieval
- `@supabase/supabase-js@2` - Database operations (service role)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key for API calls |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret for signature verification |
| `SUPABASE_URL` | Yes | Supabase project URL (auto-configured) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for admin DB access |

## Database Tables

### datechangerequest (updated)

**Payment columns updated by webhook**:
- `payment_status`: `unpaid` | `processing` | `paid` | `failed` | `refunded`
- `payment_processed_at`: Timestamp of successful payment
- `stripe_charge_id`: Stripe charge identifier
- `payment_metadata`: JSONB with payment details (receipt URL, failure codes, refund info, dispute data)

### webhook_logs (inserted)

**Columns**:
- `event_id`: Stripe event ID
- `event_type`: e.g., `payment_intent.succeeded`
- `event_data`: Full event object (JSONB)
- `processed_at`: Processing timestamp
- `status`: `success` | `error`
- `error_message`: Error details if processing failed

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve stripe-webhook

# Forward Stripe events to local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

## File Structure

```
stripe-webhook/
├── index.ts          # Main handler with webhook verification and event routing
└── index.test.ts     # Tests
```

## Critical Notes

- **Webhook signature verification is mandatory** - Rejects requests without valid `stripe-signature` header
- **Returns 200 on success** - Prevents Stripe from retrying successfully processed events
- **Returns 500 on error** - Triggers Stripe automatic retry (up to 3 days)
- **Service role client** - Uses service role key to bypass RLS for webhook operations
- **Metadata routing** - Uses `request_id` from PaymentIntent metadata to find the correct `datechangerequest` record
- **Refund handling** - Distinguishes between full and partial refunds
- **Logging is non-blocking** - Webhook succeeds even if `webhook_logs` insert fails

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Pattern 5: Fee Transparency (Webhook)
