# Pattern 5: Fee Transparency - Backend Implementation

## Overview

Complete production-ready backend implementation for Pattern 5 (Fee Transparency) with Stripe integration, database migrations, edge functions, and comprehensive testing.

**Fee Model:** 1.5% split (0.75% platform + 0.75% landlord)

## Directory Structure

```
backend/
├── migrations/
│   ├── 20260128000001_add_user_archetype_fields.sql
│   ├── 20260128000002_add_datechangerequest_fee_fields.sql
│   ├── 20260128000003_backfill_user_archetypes.sql
│   ├── 20260128000004_backfill_datechangerequest_fees.sql
│   └── 20260128000005_add_fee_calculation_trigger.sql
├── edge-functions/
│   ├── process-date-change-fee/
│   │   └── index.ts
│   ├── create-payment-intent/
│   │   └── index.ts
│   ├── stripe-webhook/
│   │   └── index.ts
│   └── admin-fee-dashboard/
│       └── index.ts
├── tests/
│   ├── fee-calculations.test.ts
│   ├── edge-functions.test.ts
│   └── database-triggers.test.sql
└── README.md (this file)
```

## Components

### 1. Database Migrations (5 files)

#### Migration 1: User Archetype Fields
- Adds behavioral archetype tracking to user table
- Fields: `archetype`, `flexibility_score`, `spending_score`
- 5 archetype types: budget_conscious, flexibility_seeker, premium_convenience, balanced_renter, high_value_hunter

#### Migration 2: Fee Breakdown Fields
- Adds fee tracking to datechangerequest table
- Fields: `fee_breakdown` (JSONB), `transaction_type`, `payment_status`, `stripe_payment_intent_id`
- Includes Stripe integration fields

#### Migration 3: User Archetype Backfill
- Calculates initial archetype values for existing users
- Uses behavioral data (request frequency, response times, fee acceptance)

#### Migration 4: Fee Breakdown Backfill
- Populates fee_breakdown for historical requests
- Applies 1.5% split model retroactively

#### Migration 5: Fee Calculation Trigger
- Auto-calculates fees on INSERT
- Recalculates on base_price UPDATE

### 2. Edge Functions (4 functions)

#### Function 1: process-date-change-fee
**Endpoint:** `/functions/v1/process-date-change-fee`

Calculate and store fee breakdown for date change requests.

**Request:**
```json
{
  "leaseId": "uuid",
  "monthlyRent": 2000,
  "transactionType": "date_change",
  "requestId": "uuid" // optional, for updates
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
    "total_fee": 30,
    "total_price": 2030,
    "effective_rate": 1.5,
    "savings_vs_traditional": 310
  },
  "preview": true
}
```

#### Function 2: create-payment-intent
**Endpoint:** `/functions/v1/create-payment-intent`

Create Stripe PaymentIntent for fee payment.

**Request:**
```json
{
  "requestId": "uuid",
  "paymentMethodId": "pm_xxx", // optional
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
    "amount": 2030,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

#### Function 3: stripe-webhook
**Endpoint:** `/functions/v1/stripe-webhook`

Handle Stripe webhook events for payment status updates.

**Events Handled:**
- `payment_intent.succeeded` - Mark payment as paid
- `payment_intent.payment_failed` - Mark payment as failed
- `payment_intent.canceled` - Mark as unpaid
- `charge.refunded` - Process refund

#### Function 4: admin-fee-dashboard
**Endpoint:** `/functions/v1/admin-fee-dashboard`

Admin analytics and revenue reporting (requires admin role).

**Query Parameters:**
- `startDate` - ISO date string (optional)
- `endDate` - ISO date string (optional)
- `groupBy` - day|week|month (default: day)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTransactions": 150,
      "totalRevenue": 300000,
      "totalPlatformFees": 2250,
      "totalLandlordShare": 2250,
      "averageTransactionValue": 2000,
      "averageFeePerTransaction": 30,
      "effectiveFeeRate": 1.5
    },
    "byTransactionType": [...],
    "timeSeries": [...],
    "topRequests": [...]
  }
}
```

## Fee Calculation Logic

### 1.5% Split Model

```typescript
const PLATFORM_RATE = 0.0075;  // 0.75%
const LANDLORD_RATE = 0.0075;  // 0.75%
const TOTAL_RATE = 0.015;      // 1.5%

// Example: $2000 base price
platformFee = 2000 * 0.0075 = $15
landlordShare = 2000 * 0.0075 = $15
totalFee = $15 + $15 = $30
totalPrice = $2000 + $30 = $2030
effectiveRate = (30 / 2000) * 100 = 1.5%
```

### Fee Breakdown JSONB Structure

```json
{
  "base_price": 2000,
  "platform_fee": 15,
  "landlord_share": 15,
  "tenant_share": 30,
  "total_fee": 30,
  "total_price": 2030,
  "effective_rate": 1.5,
  "platform_rate": 0.0075,
  "landlord_rate": 0.0075,
  "transaction_type": "date_change",
  "calculated_at": "2026-01-28T12:00:00Z",
  "fee_structure_version": "1.5_split_model_v1",
  "auto_calculated": true
}
```

## Deployment

### Prerequisites

1. Supabase project with database access
2. Stripe account with API keys
3. Deno runtime for edge functions

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Testing
TEST_AUTH_TOKEN=your-test-token
```

### Step 1: Run Migrations

```bash
# Apply migrations in order
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20260128000001_add_user_archetype_fields.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20260128000002_add_datechangerequest_fee_fields.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20260128000003_backfill_user_archetypes.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20260128000004_backfill_datechangerequest_fees.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/20260128000005_add_fee_calculation_trigger.sql
```

Or use Supabase CLI:

```bash
supabase migration up
```

### Step 2: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy process-date-change-fee
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy admin-fee-dashboard

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Step 3: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
4. Copy webhook secret and update environment variables

### Step 4: Run Tests

```bash
# Run Deno tests
deno test tests/fee-calculations.test.ts
deno test tests/edge-functions.test.ts

# Run SQL tests
psql -h db.your-project.supabase.co -U postgres -d postgres -f tests/database-triggers.test.sql
```

## Testing

### Unit Tests

**Fee Calculations:**
```bash
deno test tests/fee-calculations.test.ts
```

Tests:
- ✅ $1000 base price calculation
- ✅ $2000 base price calculation
- ✅ Very small amounts ($10)
- ✅ Very large amounts ($100,000)
- ✅ Decimal prices ($1234.56)
- ✅ Savings vs traditional model (17%)
- ✅ Consistent 1.5% rate across all amounts
- ✅ Platform + Landlord = Total
- ✅ Error handling (zero, negative, null)
- ✅ Rounding to 2 decimal places

**Edge Functions:**
```bash
deno test tests/edge-functions.test.ts
```

Tests:
- ✅ Preview mode functionality
- ✅ Invalid input handling
- ✅ Authorization checks
- ✅ Different transaction types
- ✅ Fee calculation accuracy
- ✅ Platform/landlord 50/50 split
- ✅ Error handling
- ✅ Performance (<1000ms)

**Database Triggers:**
```bash
psql -f tests/database-triggers.test.sql
```

Tests:
- ✅ Auto-calculate fees on INSERT
- ✅ Fee recalculation on UPDATE
- ✅ Fee breakdown structure validation
- ✅ 1.5% split model accuracy
- ✅ Analytics views
- ✅ Payment status constraints

## API Usage Examples

### Calculate Fee (Preview)

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/process-date-change-fee',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      leaseId: 'lease-uuid',
      monthlyRent: 2000,
      transactionType: 'date_change',
    }),
  }
);

const { feeBreakdown } = await response.json();
console.log('Total fee:', feeBreakdown.total_fee); // 30
```

### Create Payment

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/create-payment-intent',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestId: 'request-uuid',
    }),
  }
);

const { paymentIntent } = await response.json();

// Use Stripe.js to complete payment
const stripe = Stripe(publishableKey);
await stripe.confirmCardPayment(paymentIntent.clientSecret);
```

### Get Admin Dashboard

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/admin-fee-dashboard?' +
  new URLSearchParams({
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    groupBy: 'day',
  }),
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  }
);

const { data } = await response.json();
console.log('Total revenue:', data.summary.totalRevenue);
```

## Database Queries

### Get Fee Analytics

```sql
-- Get fee breakdown for all paid requests
SELECT
  id,
  transaction_type,
  base_price,
  (fee_breakdown->>'platform_fee')::DECIMAL as platform_fee,
  (fee_breakdown->>'landlord_share')::DECIMAL as landlord_share,
  (fee_breakdown->>'total_fee')::DECIMAL as total_fee,
  payment_status,
  created_at
FROM datechangerequest_fee_analytics
WHERE payment_status = 'paid'
ORDER BY created_at DESC;
```

### Get Revenue Summary

```sql
-- Get daily revenue summary
SELECT
  payment_date,
  transaction_count,
  total_platform_fees,
  total_landlord_share,
  total_fees_collected
FROM admin_fee_revenue_summary
WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY payment_date DESC;
```

### Get User Archetypes

```sql
-- Get user archetype distribution
SELECT
  archetype,
  user_count,
  ROUND(avg_flexibility_score, 1) as avg_flexibility,
  ROUND(avg_spending_score, 1) as avg_spending
FROM user_archetype_summary
ORDER BY user_count DESC;
```

## Performance

- **Fee Calculation:** < 10ms
- **Edge Function Response:** < 1000ms
- **Database Trigger:** < 50ms
- **Stripe API Call:** < 500ms

## Security

### Authentication
- All edge functions require valid JWT
- Admin endpoints verify admin role
- Row Level Security (RLS) enabled on all tables

### Data Protection
- Stripe integration uses test keys in development
- Webhook signatures verified
- Payment data encrypted at rest

### Audit Trail
- All fee calculations logged with timestamps
- Payment status changes tracked
- Webhook events logged

## Monitoring

### Key Metrics

1. **Revenue Metrics:**
   - Total fees collected
   - Platform share
   - Landlord share
   - Average fee per transaction

2. **Performance Metrics:**
   - Edge function response time
   - Database query time
   - Stripe API latency

3. **Error Metrics:**
   - Failed payments
   - Webhook failures
   - Database errors

### Dashboards

Use `admin-fee-dashboard` API to build real-time dashboards showing:
- Revenue trends (daily/weekly/monthly)
- Transaction volume
- Fee breakdown by type
- Top transactions
- Payment success rates

## Support

For issues or questions:
1. Check test suite output
2. Review edge function logs
3. Verify Stripe webhook configuration
4. Check database migration status

## License

Proprietary - Split Lease Platform
