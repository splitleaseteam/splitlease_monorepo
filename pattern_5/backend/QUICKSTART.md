# Pattern 5: Fee Transparency - Quick Start Guide

Get up and running with Pattern 5 backend in under 10 minutes.

---

## Prerequisites

```bash
# Required
✓ Supabase account
✓ Stripe account
✓ Node.js 18+
✓ Deno 1.37+
✓ PostgreSQL client

# Optional
✓ Supabase CLI
✓ Stripe CLI (for webhook testing)
```

---

## 5-Minute Setup

### Step 1: Clone & Navigate (30 seconds)

```bash
cd C:\Users\igor\implementation\pattern_5\backend
```

### Step 2: Set Environment Variables (1 minute)

Create `.env` file:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional - Testing
TEST_AUTH_TOKEN=your-test-token
```

### Step 3: Run Migrations (2 minutes)

```bash
# Apply all migrations in order
supabase migration up

# Or manually:
psql -h db.your-project.supabase.co -U postgres -d postgres << EOF
\i migrations/20260128000001_add_user_archetype_fields.sql
\i migrations/20260128000002_add_datechangerequest_fee_fields.sql
\i migrations/20260128000003_backfill_user_archetypes.sql
\i migrations/20260128000004_backfill_datechangerequest_fees.sql
\i migrations/20260128000005_add_fee_calculation_trigger.sql
\i utils/database-helpers.sql
EOF
```

### Step 4: Deploy Edge Functions (1.5 minutes)

```bash
# Deploy all functions
supabase functions deploy process-date-change-fee
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy admin-fee-dashboard

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
```

### Step 5: Test (30 seconds)

```bash
# Run all tests
deno test tests/fee-calculations.test.ts
deno test tests/edge-functions.test.ts
psql -f tests/database-triggers.test.sql
```

**✅ Done! You're ready to use Pattern 5.**

---

## Quick Test

### Test Fee Calculation

```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-date-change-fee \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "test-lease-id",
    "monthlyRent": 2000,
    "transactionType": "date_change"
  }'
```

Expected response:
```json
{
  "success": true,
  "feeBreakdown": {
    "base_price": 2000,
    "platform_fee": 15,
    "landlord_share": 15,
    "total_fee": 30,
    "total_price": 2030,
    "effective_rate": 1.5
  },
  "preview": true
}
```

---

## Common Commands

### Development

```bash
# Run tests
deno test tests/*.test.ts

# Run specific test
deno test tests/fee-calculations.test.ts

# Watch mode
deno test --watch tests/*.test.ts

# Check edge function locally
supabase functions serve process-date-change-fee
```

### Database

```bash
# Connect to database
psql -h db.your-project.supabase.co -U postgres

# Check migrations
supabase migration list

# Create new migration
supabase migration new your_migration_name

# Rollback last migration
supabase migration down
```

### Stripe

```bash
# Test webhook locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger payment_intent.succeeded

# View recent events
stripe events list --limit 10
```

---

## Quick Reference

### Fee Calculation

```typescript
// 1.5% split model
platformFee = basePrice * 0.0075    // 0.75%
landlordShare = basePrice * 0.0075  // 0.75%
totalFee = platformFee + landlordShare
totalPrice = basePrice + totalFee
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/process-date-change-fee` | POST | Calculate fees |
| `/functions/v1/create-payment-intent` | POST | Create payment |
| `/functions/v1/stripe-webhook` | POST | Handle webhooks |
| `/functions/v1/admin-fee-dashboard` | GET | View analytics |

### Database Views

| View | Purpose |
|------|---------|
| `datechangerequest_fee_analytics` | Fee breakdown data |
| `admin_fee_revenue_summary` | Revenue metrics |
| `user_archetype_summary` | Archetype distribution |

---

## Troubleshooting

### "Fee breakdown not calculated"

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_calculate_fee_breakdown';

-- Manually recalculate
SELECT recalculate_fee_breakdown('request-id');
```

### "Stripe webhook failing"

**Solution:**
```bash
# Verify webhook secret
supabase secrets list

# Check webhook signature
stripe webhook-endpoints list

# Test webhook
stripe trigger payment_intent.succeeded
```

### "Tests failing"

**Solution:**
```bash
# Update test token
export TEST_AUTH_TOKEN=new-token

# Check database connection
psql -h db.your-project.supabase.co -U postgres -c "SELECT 1"

# Clear test data
psql -f tests/cleanup.sql
```

---

## Need Help?

### Documentation
- [Full API Docs](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Project Summary](PROJECT_SUMMARY.md)

### Test Data
```sql
-- Create test user
INSERT INTO public.user (id, email, role)
VALUES (gen_random_uuid(), 'test@example.com', 'tenant');

-- Create test lease
INSERT INTO public.leases (id, monthly_rent, landlord_id)
VALUES (gen_random_uuid(), 2000, gen_random_uuid());

-- Create test request
INSERT INTO public.datechangerequest (
  lease_id, user_id, requested_date, status
) VALUES (
  'lease-id', 'user-id', CURRENT_DATE + 30, 'pending'
);
```

### Support
- Technical: dev-team@splitlease.com
- Stripe: stripe-support@splitlease.com
- Database: database-admin@splitlease.com

---

## Next Steps

1. ✅ **Explore the API** - Try all endpoints
2. ✅ **Review Tests** - Understand test coverage
3. ✅ **Check Analytics** - View admin dashboard
4. ✅ **Read Docs** - Complete API documentation
5. ✅ **Deploy to Production** - Follow deployment guide

---

**Happy Coding! 🚀**

*Pattern 5: Fee Transparency Backend*
*Version 1.0 - Production Ready*
