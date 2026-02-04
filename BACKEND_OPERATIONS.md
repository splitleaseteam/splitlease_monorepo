# Pattern 5: Fee Transparency - Backend Operations Guide

**Version:** 1.0
**Date:** 2026-01-29
**Status:** Production-Ready

---

## Overview

Pattern 5 implements a transparent **1.5% split fee model** for Split Lease transactions:
- **0.75%** Platform fee (Split Lease revenue)
- **0.75%** Landlord share
- **$5 minimum fee** for small transactions

This guide covers deployment, configuration, and operation of the fee transparency backend infrastructure.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Database Migrations](#database-migrations)
3. [Edge Functions](#edge-functions)
4. [Stripe Integration](#stripe-integration)
5. [Environment Variables](#environment-variables)
6. [Deployment Checklist](#deployment-checklist)
7. [API Reference](#api-reference)
8. [PCI Compliance](#pci-compliance)
9. [Testing](#testing)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FEE TRANSPARENCY FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. FEE CALCULATION                                                          │
│     Frontend → process-date-change-fee → fee_breakdown JSONB                │
│                                                                              │
│  2. PAYMENT INITIATION                                                       │
│     Frontend → create-payment-intent → Stripe PaymentIntent                 │
│                                                                              │
│  3. PAYMENT CONFIRMATION (client-side)                                       │
│     Stripe Elements → Stripe API → Card tokenization (PCI compliant)        │
│                                                                              │
│  4. WEBHOOK PROCESSING                                                       │
│     Stripe → stripe-webhook → Database update                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Migrations 1-5 | `supabase/migrations/20260129100001-5_*` | Schema changes |
| process-date-change-fee | `supabase/functions/process-date-change-fee/` | Fee calculation |
| create-payment-intent | `supabase/functions/create-payment-intent/` | Stripe integration |
| stripe-webhook | `supabase/functions/stripe-webhook/` | Payment events |

---

## Database Migrations

### Migration Order (MUST run sequentially)

| # | File | Description | Runtime |
|---|------|-------------|---------|
| 1 | `20260129100001_pattern5_add_user_archetype_fields.sql` | Add archetype columns to `user` table | < 1 min |
| 2 | `20260129100002_pattern5_add_datechangerequest_fee_fields.sql` | Add fee columns to `datechangerequest` table | < 1 min |
| 3 | `20260129100003_pattern5_backfill_user_archetypes.sql` | Calculate archetypes for existing users | 1-5 min |
| 4 | `20260129100004_pattern5_backfill_datechangerequest_fees.sql` | Calculate fees for historical requests | 2-10 min |
| 5 | `20260129100005_pattern5_add_fee_calculation_trigger.sql` | Auto-calculate fees on new requests | < 1 min |

### Schema Changes

**User Table Additions:**
```sql
archetype VARCHAR(50)           -- budget_conscious, flexibility_seeker, etc.
flexibility_score INTEGER       -- 0-100
spending_score INTEGER          -- 0-100
archetype_calculated_at TIMESTAMP WITH TIME ZONE
archetype_metadata JSONB
```

**DateChangeRequest Table Additions:**
```sql
transaction_type VARCHAR(50)    -- date_change, lease_takeover, sublet, renewal
fee_breakdown JSONB             -- Detailed fee structure
base_price DECIMAL(10, 2)       -- Monthly rent
total_price DECIMAL(10, 2)      -- Base + fees
fee_structure_version VARCHAR(50)
payment_status VARCHAR(50)      -- unpaid, pending, paid, refunded, failed, processing
payment_processed_at TIMESTAMP WITH TIME ZONE
stripe_payment_intent_id VARCHAR(255)
stripe_charge_id VARCHAR(255)
payment_metadata JSONB
```

### Running Migrations

```bash
# Apply all migrations (dev environment)
supabase db push

# Apply to specific environment
supabase db push --db-url "postgresql://..."

# Verify migration status
supabase migration list
```

---

## Edge Functions

### 1. process-date-change-fee

**Purpose:** Calculate fee breakdown for date change requests.

**Endpoint:** `POST /functions/v1/process-date-change-fee`

**Request:**
```json
{
  "leaseId": "uuid",
  "monthlyRent": 2000,
  "transactionType": "date_change",
  "requestId": "uuid (optional - for updates)"
}
```

**Response:**
```json
{
  "success": true,
  "feeBreakdown": {
    "base_price": 2000,
    "platform_fee": 15,
    "landlord_share": 15,
    "tenant_share": 30,
    "total_fee": 30,
    "total_price": 2030,
    "effective_rate": 1.5,
    "savings_vs_traditional": 310
  },
  "preview": true
}
```

### 2. create-payment-intent

**Purpose:** Create Stripe PaymentIntent for fee payment.

**Endpoint:** `POST /functions/v1/create-payment-intent`

**Request:**
```json
{
  "requestId": "uuid",
  "paymentMethodId": "pm_xxx (optional)",
  "savePaymentMethod": false
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "amount": 203000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

### 3. stripe-webhook

**Purpose:** Handle Stripe webhook events.

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Events Handled:**
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Set `payment_status = 'paid'` |
| `payment_intent.payment_failed` | Set `payment_status = 'failed'` |
| `payment_intent.canceled` | Set `payment_status = 'unpaid'` |
| `charge.refunded` | Set `payment_status = 'refunded'` |
| `charge.dispute.created` | Record dispute in metadata |

### Deploying Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy individual function
supabase functions deploy process-date-change-fee
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

---

## Stripe Integration

### Required Stripe Configuration

1. **Create Stripe Account** (if not exists)
   - Mode: Test (development) or Live (production)

2. **Get API Keys** (Dashboard → Developers → API keys)
   - `STRIPE_SECRET_KEY`: `sk_test_xxx` or `sk_live_xxx`

3. **Configure Webhook**
   - URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events to subscribe:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.refunded`
     - `charge.dispute.created`
   - Get `STRIPE_WEBHOOK_SECRET`: `whsec_xxx`

### Stripe Dashboard Setup

```
Stripe Dashboard → Developers → Webhooks → Add endpoint

Endpoint URL: https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook
Select events: payment_intent.succeeded, payment_intent.payment_failed,
               payment_intent.canceled, charge.refunded, charge.dispute.created
```

---

## Environment Variables

### Required Secrets

```bash
# Set Supabase secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

# Verify secrets
supabase secrets list
```

### Environment Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_51xxx` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` |
| `SUPABASE_URL` | Auto-set by Supabase | - |
| `SUPABASE_ANON_KEY` | Auto-set by Supabase | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-set by Supabase | - |

---

## Deployment Checklist

### Pre-Deployment

- [ ] Stripe account configured (test or live)
- [ ] Stripe API keys obtained
- [ ] Webhook endpoint configured in Stripe
- [ ] Environment variables set in Supabase

### Database Deployment

- [ ] Backup production database
- [ ] Run migration 1 (user archetype fields)
- [ ] Run migration 2 (datechangerequest fee fields)
- [ ] Run migration 3 (backfill user archetypes)
- [ ] Run migration 4 (backfill datechangerequest fees)
- [ ] Run migration 5 (fee calculation trigger)
- [ ] Verify views created: `user_archetype_summary`, `datechangerequest_fee_analytics`, `admin_fee_revenue_summary`

### Function Deployment

- [ ] Deploy `process-date-change-fee`
- [ ] Deploy `create-payment-intent`
- [ ] Deploy `stripe-webhook`
- [ ] Test each function endpoint
- [ ] Verify webhook receives events

### Post-Deployment

- [ ] Monitor function logs for errors
- [ ] Test complete payment flow (dev)
- [ ] Verify database updates on payment success
- [ ] Test refund flow

---

## API Reference

### Authentication

All endpoints (except webhook) require JWT authentication:

```javascript
const { data, error } = await supabase.functions.invoke('process-date-change-fee', {
  body: { leaseId: 'xxx', monthlyRent: 2000 }
});
```

### Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Validation error |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (not request owner) |
| 500 | Server error |

### Fee Calculation Formula

```
platform_fee = base_price × 0.0075
landlord_share = base_price × 0.0075
total_fee = MAX(platform_fee + landlord_share, $5.00)
total_price = base_price + total_fee
effective_rate = (total_fee / base_price) × 100
```

---

## PCI Compliance

### Compliance Model: SAQ A-EP

Pattern 5 uses **Stripe Elements** for card data collection, ensuring:

1. **Card data never touches our servers**
   - Stripe.js tokenizes card details client-side
   - Only PaymentIntent ID/clientSecret passed to backend

2. **Webhook signature verification**
   - All webhook events verified against `STRIPE_WEBHOOK_SECRET`
   - Prevents tampered events

3. **No card data in database**
   - Only Stripe IDs stored: `stripe_payment_intent_id`, `stripe_charge_id`
   - Payment methods referenced by token only

### Security Headers

```typescript
// All responses include:
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'POST, OPTIONS',
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
```

---

## Testing

### Test Suite Summary

| File | Tests | Coverage |
|------|-------|----------|
| `process-date-change-fee/index.test.ts` | 55 | Fee calculation, validation, errors |
| `create-payment-intent/index.test.ts` | 40 | Application fees, authorization |
| `stripe-webhook/index.test.ts` | 39 | All webhook handlers |
| **Total** | **134** | Full coverage |

### Running Tests

```bash
# Run all tests
deno test supabase/functions/ --allow-all

# Run specific test file
deno test supabase/functions/process-date-change-fee/index.test.ts

# Run with coverage
deno test --coverage=coverage supabase/functions/
```

### Manual Testing

```bash
# Test fee calculation
curl -X POST https://[PROJECT].supabase.co/functions/v1/process-date-change-fee \
  -H "Authorization: Bearer [JWT]" \
  -H "Content-Type: application/json" \
  -d '{"leaseId": "xxx", "monthlyRent": 2000}'

# Test webhook (use Stripe CLI)
stripe trigger payment_intent.succeeded
```

---

## Monitoring & Troubleshooting

### Viewing Logs

```bash
# Function logs
supabase functions logs process-date-change-fee
supabase functions logs create-payment-intent
supabase functions logs stripe-webhook

# Real-time logs
supabase functions logs --follow
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on webhook | Invalid signature | Check `STRIPE_WEBHOOK_SECRET` |
| Fee not calculated | Missing lease data | Verify lease has `monthly_rent` |
| Payment stuck on processing | Webhook not received | Check Stripe Dashboard for delivery |
| Duplicate payments | Re-using PaymentIntent | Check `stripe_payment_intent_id` before creating |

### Stripe CLI for Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
```

### Database Queries

```sql
-- Check fee analytics
SELECT * FROM datechangerequest_fee_analytics LIMIT 10;

-- Revenue summary
SELECT * FROM admin_fee_revenue_summary;

-- Pending payments
SELECT id, payment_status, total_price, created_at
FROM datechangerequest
WHERE payment_status = 'processing'
ORDER BY created_at DESC;

-- Failed payments
SELECT id, payment_status, payment_metadata
FROM datechangerequest
WHERE payment_status = 'failed'
ORDER BY created_at DESC;
```

---

## Fee Structure Reference

### Fee Model: 1.5% Split

| Rent Amount | Platform Fee | Landlord Share | Total Fee | Total Price | Savings vs 17% |
|-------------|--------------|----------------|-----------|-------------|----------------|
| $500 | $3.75 | $3.75 | $7.50 | $507.50 | $77.50 |
| $1,000 | $7.50 | $7.50 | $15.00 | $1,015.00 | $155.00 |
| $1,500 | $11.25 | $11.25 | $22.50 | $1,522.50 | $232.50 |
| $2,000 | $15.00 | $15.00 | $30.00 | $2,030.00 | $310.00 |
| $2,500 | $18.75 | $18.75 | $37.50 | $2,537.50 | $387.50 |
| $3,000 | $22.50 | $22.50 | $45.00 | $3,045.00 | $465.00 |
| $5,000 | $37.50 | $37.50 | $75.00 | $5,075.00 | $775.00 |

### Minimum Fee

For transactions under $333.33 (where 1.5% < $5), a **$5 minimum fee** applies, split 50/50 between platform and landlord.

---

## Support

- **Stripe Documentation:** https://stripe.com/docs
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Pattern 5 Source:** `pattern_5/backend/` (reference implementation)

---

**Last Updated:** 2026-01-29
**Maintainer:** Split Lease Engineering Team
