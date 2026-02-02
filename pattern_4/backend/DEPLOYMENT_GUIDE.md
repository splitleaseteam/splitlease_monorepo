# Pattern 4: BS+BS Competitive Bidding - Deployment Guide

**Complete step-by-step deployment instructions for production**

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Edge Functions Deployment](#edge-functions-deployment)
4. [Background Jobs Configuration](#background-jobs-configuration)
5. [Real-time Configuration](#real-time-configuration)
6. [Security Configuration](#security-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Testing Deployment](#testing-deployment)
9. [Production Checklist](#production-checklist)
10. [Rollback Plan](#rollback-plan)

---

## Prerequisites

### Required Tools

```bash
# Supabase CLI
npm install -g supabase

# Deno (for Edge Functions and tests)
curl -fsSL https://deno.land/install.sh | sh

# PostgreSQL client (for migrations)
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

### Environment Setup

Create `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key
```

---

## Database Setup

### Step 1: Apply Migration

```bash
# Connect to Supabase
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# OR manually via SQL Editor
psql $DATABASE_URL < supabase/migrations/20260128000000_create_bidding_tables.sql
```

### Step 2: Verify Tables Created

```sql
-- Run in Supabase SQL Editor
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'bidding%';

-- Expected output:
-- bidding_sessions
-- bidding_participants
-- bids
-- bidding_results
-- bidding_notifications
```

### Step 3: Enable Realtime

```sql
-- Enable realtime for bidding tables
ALTER PUBLICATION supabase_realtime
ADD TABLE bidding_sessions,
         bids,
         bidding_participants;
```

### Step 4: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('bidding_sessions', 'bids', 'bidding_participants');

-- Should show rowsecurity = true for all
```

---

## Edge Functions Deployment

### Step 1: Deploy Submit Bid Function

```bash
cd supabase/functions/bidding

# Deploy
supabase functions deploy submit-bid --no-verify-jwt

# Verify deployment
supabase functions list
```

### Step 2: Deploy Set Auto-Bid Function

```bash
supabase functions deploy set-auto-bid --no-verify-jwt

# Test function
curl -X POST https://your-project.supabase.co/functions/v1/bidding/set-auto-bid \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session",
    "maxAmount": 3800
  }'
```

### Step 3: Configure Function Secrets

```bash
# Set secrets for Edge Functions
supabase secrets set SUPABASE_URL=$SUPABASE_URL
supabase secrets set SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Verify
supabase secrets list
```

---

## Background Jobs Configuration

### Step 1: Enable pg_cron Extension

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 2: Deploy Cleanup Job Edge Function

```bash
# Create cleanup job function
supabase functions deploy session-cleanup --no-verify-jwt
```

### Step 3: Schedule pg_cron Jobs

```sql
-- Session cleanup (every 5 minutes)
SELECT cron.schedule(
    'cleanup-expired-bidding-sessions',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/jobs/session-cleanup',
        headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Expiration warnings (every minute)
SELECT cron.schedule(
    'send-expiration-warnings',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/jobs/expiration-warnings',
        headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Archive old sessions (daily at 2 AM)
SELECT cron.schedule(
    'archive-old-sessions',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/jobs/archive-sessions',
        headers := jsonb_build_object(
            'Authorization',
            'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
```

### Step 4: Verify Jobs Scheduled

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## Real-time Configuration

### Step 1: Enable Realtime in Supabase Dashboard

1. Go to Supabase Dashboard → Project Settings → API
2. Scroll to "Realtime" section
3. Enable "Realtime Server"
4. Set max connections: **1000**

### Step 2: Configure Realtime Policies

```sql
-- Allow authenticated users to subscribe to their sessions
CREATE POLICY "Users can subscribe to their session updates"
    ON bidding_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bidding_participants
            WHERE session_id = bidding_sessions.session_id
              AND user_id = auth.uid()
        )
    );
```

### Step 3: Test Realtime Connection

```typescript
// Test script: test_realtime.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
);

const channel = supabase.channel('test-channel')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids'
    }, (payload) => {
        console.log('Received update:', payload);
    })
    .subscribe();

console.log('Subscribed to realtime updates');
```

```bash
# Run test
deno run --allow-net --allow-env test_realtime.ts
```

---

## Security Configuration

### Step 1: Update RLS Policies for Production

```sql
-- Stricter bid placement policy
CREATE POLICY "Users can only place bids in their sessions"
    ON bids FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bidding_participants
            WHERE session_id = bids.session_id
              AND user_id = auth.uid()
        )
    );

-- Prevent bid modification
CREATE POLICY "Bids are immutable"
    ON bids FOR UPDATE
    USING (false);
```

### Step 2: Configure Rate Limiting

In Supabase Dashboard → Edge Functions:

```json
{
  "submit-bid": {
    "rateLimit": {
      "requests": 10,
      "period": "1m"
    }
  },
  "set-auto-bid": {
    "rateLimit": {
      "requests": 5,
      "period": "1m"
    }
  }
}
```

### Step 3: Set Up API Key Rotation

```bash
# Generate new anon key (rotate monthly)
supabase keys rotate anon

# Update .env and redeploy functions
```

---

## Monitoring Setup

### Step 1: Configure Logging

```typescript
// Add to Edge Functions
import * as Sentry from 'https://deno.land/x/sentry/index.ts';

Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN'),
    tracesSampleRate: 1.0,
});
```

### Step 2: Set Up Metrics Dashboard

In Supabase Dashboard → Observability:

**Key Metrics to Track:**
- Bidding sessions created/hour
- Bids placed/minute
- Auto-bid trigger rate
- Session completion rate
- Average session duration
- Average bids per session
- Error rate
- P95 latency

### Step 3: Configure Alerts

```yaml
# alerts.yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    channels: [email, slack]

  - name: Slow Latency
    condition: p95_latency > 500ms
    duration: 5m
    channels: [slack]

  - name: Stuck Sessions
    condition: active_sessions_24h > 0
    channels: [email]

  - name: Failed Payments
    condition: payment_failures > 0
    channels: [email, pagerduty]
```

---

## Testing Deployment

### Step 1: Run Unit Tests

```bash
# Run all tests
deno test --allow-all tests/

# Should see output:
# test validateBid - should accept valid bid above minimum ... ok
# test processAutoBid - should trigger auto-bid when below max ... ok
# test determineWinner - should correctly identify winner ... ok
# ...
# test result: ok. 20 passed; 0 failed; 0 ignored; 0 measured
```

### Step 2: Run Integration Tests

```bash
# Test Edge Functions
curl -X POST https://your-project.supabase.co/functions/v1/bidding/submit-bid \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "amount": 3300,
    "isManualBid": true
  }'

# Expected response: 200 OK with bid details
```

### Step 3: Run Load Tests

```bash
# Small load test
deno run --allow-all load_tests/biddingLoadTest.ts --sessions 5 --bids 10

# Full load test
deno run --allow-all load_tests/biddingLoadTest.ts --sessions 20 --bids 30

# Verify results:
# - Success rate > 95%
# - P95 latency < 200ms
# - No database errors
```

### Step 4: Test Background Jobs

```bash
# Manually trigger cleanup job
curl -X POST https://your-project.supabase.co/functions/v1/jobs/session-cleanup \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Check logs in Supabase Dashboard
```

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Load test results acceptable
- [ ] Database migration reviewed
- [ ] RLS policies verified
- [ ] Edge Functions tested locally
- [ ] Background jobs tested
- [ ] Security review completed
- [ ] Monitoring configured

### Deployment

- [ ] Database migration applied
- [ ] Edge Functions deployed
- [ ] Background jobs scheduled
- [ ] Realtime enabled
- [ ] Rate limiting configured
- [ ] API keys rotated
- [ ] Secrets configured

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Monitoring dashboard active
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan documented

### Monitoring (First 24 Hours)

- [ ] Check error rates every hour
- [ ] Monitor latency
- [ ] Verify cron jobs running
- [ ] Check database performance
- [ ] Review user feedback

---

## Rollback Plan

### If Deployment Fails

**Step 1: Revert Edge Functions**

```bash
# Get previous version
supabase functions list --show-versions

# Rollback to previous version
supabase functions deploy submit-bid --version previous_version_id
```

**Step 2: Revert Database Migration**

```sql
-- Drop new tables (CAUTION: Data loss!)
DROP TABLE bidding_notifications CASCADE;
DROP TABLE bidding_results CASCADE;
DROP TABLE bids CASCADE;
DROP TABLE bidding_participants CASCADE;
DROP TABLE bidding_sessions CASCADE;

-- OR restore from backup
pg_restore -d postgres backup_file.dump
```

**Step 3: Disable Background Jobs**

```sql
-- Unschedule cron jobs
SELECT cron.unschedule('cleanup-expired-bidding-sessions');
SELECT cron.unschedule('send-expiration-warnings');
SELECT cron.unschedule('archive-old-sessions');
```

**Step 4: Notify Users**

```typescript
// Send notification
await supabase.from('notifications').insert({
    user_id: 'all',
    type: 'system_maintenance',
    message: 'Competitive bidding temporarily unavailable. We apologize for the inconvenience.',
});
```

### Post-Rollback

1. Analyze failure logs
2. Fix identified issues
3. Test fixes in staging
4. Schedule new deployment
5. Document lessons learned

---

## Support & Troubleshooting

### Common Deployment Issues

**Issue: Migration fails with "relation already exists"**

Solution:
```sql
-- Check existing tables
\dt bidding*

-- Drop if necessary (staging only!)
DROP TABLE IF EXISTS bidding_sessions CASCADE;
```

**Issue: Edge Function deployment timeout**

Solution:
```bash
# Increase timeout
supabase functions deploy submit-bid --timeout 300s
```

**Issue: Realtime not working**

Solution:
1. Check Realtime enabled in dashboard
2. Verify ALTER PUBLICATION command executed
3. Test connection with simple subscribe

**Issue: Background jobs not running**

Solution:
```sql
-- Check pg_cron extension
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If missing, enable:
CREATE EXTENSION pg_cron;
```

### Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Deno Docs:** https://deno.land/manual
- **Internal Wiki:** [link]
- **Dev Team Slack:** #bidding-system

---

## Version History

- **v1.0.0** (2026-01-28) - Initial production release
  - Complete bidding system
  - Realtime updates
  - Background jobs
  - Load tested up to 50 concurrent sessions

---

**Deployed by:** [Your Name]
**Date:** 2026-01-28
**Environment:** Production
**Status:** ✅ Ready for Deployment
