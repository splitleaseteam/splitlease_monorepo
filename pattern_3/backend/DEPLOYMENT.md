# Deployment Guide - Pattern 3: Price Anchoring Backend

## Overview

This guide covers deploying the complete Pattern 3 (Price Anchoring) backend to production using Supabase.

## Prerequisites

- Supabase project (create at https://supabase.com)
- Supabase CLI installed: `npm install -g supabase`
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 15+ knowledge
- Git

## Quick Start

```bash
# 1. Clone and install dependencies
cd pattern_3/backend
npm install

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref your-project-ref

# 4. Deploy database migrations
supabase db push

# 5. Deploy Edge Functions
npm run functions:deploy

# 6. Run tests
npm test
```

## Detailed Deployment Steps

### 1. Project Setup

#### Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details:
   - Name: "pattern-3-price-anchoring"
   - Database Password: (strong password)
   - Region: (closest to users)
4. Wait for project to be created (~2 minutes)

#### Get Project Credentials

```bash
# From Supabase Dashboard > Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Database Migration

#### Option A: Using Supabase CLI (Recommended)

```bash
# Link to your project
supabase link --project-ref xxxxx

# Push migrations
supabase db push

# Verify tables created
supabase db ls
```

#### Option B: Manual SQL Execution

```bash
# Get database connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Run migration
\i supabase/migrations/001_pricing_tiers_schema.sql

# Verify tables
\dt
```

#### Verify Migration

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'pricing_tiers',
    'tier_features',
    'price_anchoring_events',
    'tier_selections',
    'ab_test_variants'
);

-- Check seed data loaded
SELECT tier_id, tier_name, multiplier FROM pricing_tiers;

-- Expected output:
-- budget      | Budget      | 0.90
-- recommended | Recommended | 1.00
-- premium     | Premium     | 1.15
```

### 3. Deploy Edge Functions

#### Deploy All Functions

```bash
# Deploy all at once
npm run functions:deploy

# Or individually
supabase functions deploy get_pricing_tiers
supabase functions deploy track_tier_selection
supabase functions deploy calculate_savings
```

#### Set Environment Variables

```bash
# Set secrets for Edge Functions
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# Verify secrets
supabase secrets list
```

#### Test Edge Functions

```bash
# Test get_pricing_tiers
curl -X POST \
  "https://xxxxx.supabase.co/functions/v1/get_pricing_tiers" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price": 450,
    "anchor_price": 2835,
    "anchor_type": "buyout",
    "session_id": "test-session-001"
  }'

# Expected: 200 OK with tier data
```

### 4. Configure Security

#### Row Level Security (RLS)

RLS policies are already created in the migration. Verify they're active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'pricing_tiers',
    'tier_features',
    'price_anchoring_events',
    'tier_selections'
);

-- All should show rowsecurity = true
```

#### API Keys

- **Anon Key**: Use in client-side code (safe to expose)
- **Service Role Key**: Use in server-side code only (keep secret)

```typescript
// Client-side (safe)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-side only (keep secret)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

### 5. Database Indexes

Indexes are already created in migration. Verify:

```sql
-- Check indexes exist
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'pricing_tiers',
    'price_anchoring_events',
    'tier_selections'
)
ORDER BY tablename, indexname;
```

### 6. Testing

#### Run Unit Tests

```bash
npm test
```

#### Run Integration Tests

```bash
# Start local Supabase (for testing)
supabase start

# Run integration tests
npm run test:integration

# Stop local Supabase
supabase stop
```

#### Manual Testing Checklist

- [ ] Can fetch pricing tiers
- [ ] Tier calculations correct (90%, 100%, 115%)
- [ ] Savings calculations correct
- [ ] Can track tier selection
- [ ] Analytics events recorded
- [ ] Recommended tier logic works
- [ ] Edge cases handled (negative savings, etc.)

### 7. Monitoring Setup

#### Enable Logs

```bash
# View Edge Function logs
supabase functions logs get_pricing_tiers

# View database logs
supabase db logs

# Follow logs in real-time
supabase functions logs -f
```

#### Database Performance

```sql
-- Monitor query performance
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%pricing_tiers%'
ORDER BY total_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Set Up Alerts

Configure alerts in Supabase Dashboard > Database > Monitoring:

- Query duration > 100ms
- Error rate > 1%
- Database CPU > 80%
- Connection pool exhausted

### 8. Performance Optimization

#### Enable Connection Pooling

In Supabase Dashboard > Settings > Database:
- Enable connection pooling
- Set pool size: 15 (for most use cases)
- Set pool mode: Transaction

#### Enable Caching

```typescript
// Implement caching layer
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

async function getCachedTiers(basePrice: number, anchorPrice: number) {
  const cacheKey = `tiers:${basePrice}:${anchorPrice}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const tiers = await fetchTiersFromDB(basePrice, anchorPrice);

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(tiers));

  return tiers;
}
```

### 9. Backup Strategy

#### Enable Point-in-Time Recovery (PITR)

In Supabase Dashboard > Settings > Database:
- Enable daily backups
- Enable PITR (Pro plan)
- Retention: 7 days minimum

#### Manual Backup

```bash
# Backup database
pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump "postgresql://..." \
  --table=pricing_tiers \
  --table=tier_selections \
  > backup_pattern3_$(date +%Y%m%d).sql
```

### 10. Scaling Considerations

#### Database Scaling

For high traffic (>1000 req/s):

1. **Upgrade Supabase Plan**: Pro or Enterprise
2. **Read Replicas**: Enable read replicas for analytics queries
3. **Connection Pooling**: Use PgBouncer (included in Supabase)
4. **Partitioning**: Partition large tables by date

```sql
-- Partition price_anchoring_events by month
CREATE TABLE price_anchoring_events_2026_01 PARTITION OF price_anchoring_events
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

#### Edge Function Scaling

Edge Functions auto-scale, but consider:

- Keep functions under 50MB
- Optimize cold start time (<100ms)
- Use connection pooling
- Cache frequently accessed data

### 11. Production Checklist

- [ ] Database migration applied
- [ ] Seed data loaded
- [ ] All Edge Functions deployed
- [ ] Environment variables set
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Tests passing
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Backups enabled
- [ ] Documentation updated
- [ ] Team trained

### 12. Rollback Plan

#### Database Rollback

```bash
# Revert to previous migration
supabase db reset

# Or manually drop tables
psql "..." -c "DROP TABLE tier_selections, price_anchoring_events, tier_features, pricing_tiers CASCADE;"
```

#### Edge Function Rollback

```bash
# Delete deployed function
supabase functions delete get_pricing_tiers

# Redeploy previous version
git checkout previous-tag
supabase functions deploy get_pricing_tiers
```

### 13. Post-Deployment Validation

#### Smoke Tests

```bash
# Test get_pricing_tiers
curl -X POST "$SUPABASE_URL/functions/v1/get_pricing_tiers" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"base_price":450,"anchor_price":2835,"session_id":"smoke-test"}'

# Expected: 200 OK with 3 tiers
```

#### Health Check Queries

```sql
-- Check active tiers
SELECT COUNT(*) FROM pricing_tiers WHERE is_active = TRUE;
-- Expected: 3

-- Check recent selections
SELECT COUNT(*) FROM tier_selections
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Check event tracking
SELECT event_type, COUNT(*) FROM price_anchoring_events
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY event_type;
```

### 14. Maintenance

#### Regular Tasks

**Daily:**
- Check error logs
- Monitor query performance
- Review alert notifications

**Weekly:**
- Analyze tier selection rates
- Review A/B test results
- Check database size growth

**Monthly:**
- Update tier multipliers if needed
- Archive old analytics events
- Review and optimize slow queries

#### Cleanup Old Data

```sql
-- Archive events older than 90 days
CREATE TABLE price_anchoring_events_archive AS
SELECT * FROM price_anchoring_events
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM price_anchoring_events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum to reclaim space
VACUUM ANALYZE price_anchoring_events;
```

### 15. Troubleshooting

#### Edge Function Not Working

```bash
# Check function logs
supabase functions logs get_pricing_tiers --tail

# Common issues:
# - Missing SUPABASE_SERVICE_ROLE_KEY secret
# - CORS errors (check corsHeaders)
# - Database connection timeout
```

#### Database Connection Issues

```sql
-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity
WHERE datname = 'postgres';

-- Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < NOW() - INTERVAL '5 minutes';
```

#### Performance Issues

```sql
-- Find slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_slow_query
ON table_name(column_name);
```

## Support

For issues:
1. Check logs: `supabase functions logs`
2. Review test files for examples
3. Consult [README.md](./README.md)
4. Contact: backend-team@company.com

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Testing Guide](./tests/README.md)

---

**Deployment Version:** 1.0.0
**Last Updated:** 2026-01-28
**Estimated Deployment Time:** 30-45 minutes
