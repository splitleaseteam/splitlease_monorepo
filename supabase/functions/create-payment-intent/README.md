# Create Payment Intent Edge Function

Creates Stripe PaymentIntents for date change request fee payments. Handles customer creation, amount calculation, and application fee splitting.

## Overview

This Edge Function implements **Pattern 5: Fee Transparency** payment initiation. It creates a Stripe PaymentIntent for a date change request, returning a `clientSecret` for client-side Stripe Elements payment confirmation. No card data passes through this function (PCI compliant).

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Auth**: JWT authentication required (user must own the request)
- **PCI Compliance**: Card data handled by Stripe Elements client-side; this function only creates PaymentIntents
- **Fee Structure**: 1.5% total fee (0.75% platform + 0.75% landlord)

## API Endpoint

### POST /functions/v1/create-payment-intent

Requires `Authorization: Bearer <JWT>` header.

**Request**:
```json
{
  "requestId": "dcr-abc123",
  "paymentMethodId": "pm_1234567890",
  "savePaymentMethod": false
}
```

**Success Response** (200):
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abc",
    "amount": 18000,
    "currency": "usd",
    "status": "requires_payment_method"
  },
  "request": {
    "id": "dcr-abc123",
    "totalPrice": 180.00,
    "feeBreakdown": {
      "baseFee": 175.00,
      "platformFee": 2.63,
      "totalFee": 5.00
    }
  }
}
```

**Auth Failure** (401):
```json
{
  "error": "Unauthorized - please log in",
  "success": false
}
```

**Forbidden** (403):
```json
{
  "error": "Unauthorized - you do not own this request",
  "success": false
}
```

**Validation Error** (400):
```json
{
  "error": "Validation failed: Missing required field: requestId",
  "success": false
}
```

## Payment Flow

1. Authenticate user via JWT
2. Validate `requestId` exists and user owns it
3. Verify request status is `pending` or `approved`
4. Calculate payment amount from `total_price` or `base_price`
5. Get or create Stripe customer for user
6. Create or retrieve existing PaymentIntent
7. Return `clientSecret` for client-side payment confirmation

## Dependencies

- `stripe@14.11.0` - Stripe SDK for PaymentIntent creation
- `@supabase/supabase-js@2` - Auth and database operations

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `SUPABASE_URL` | Yes | Supabase project URL (auto-configured) |
| `SUPABASE_ANON_KEY` | Yes | Anon key for auth validation (auto-configured) |

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve create-payment-intent

# Test endpoint (requires valid JWT)
curl -X POST http://localhost:54321/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId":"dcr-abc123"}'
```

## File Structure

```
create-payment-intent/
├── index.ts          # Main handler with auth, validation, and Stripe integration
└── index.test.ts     # Tests
```

## Critical Notes

- **JWT authentication required** - User must be logged in
- **Ownership verification** - Only the request creator can initiate payment
- **Idempotent** - If a PaymentIntent already exists for the request, it retrieves and updates it
- **Amount updates** - If the price changed since PaymentIntent creation, it updates the amount
- **Automatic payment methods** - Stripe determines available payment methods
- **Statement descriptor** - Appears as "SPLITLEASE FEE" on bank statements
- **Application fee** - Platform keeps 0.75% of base price via Stripe application fee
- **No card data** - PCI compliant; card handling is entirely client-side via Stripe Elements

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Pattern 5: Fee Transparency (Payment Intent)
