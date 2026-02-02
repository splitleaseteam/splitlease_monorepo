# Urgency Pricing Deployment Checklist

Complete deployment guide for the urgency-pricing Edge Function.

## Pre-Deployment Checklist

### 1. Database Migration

- [ ] Review migration file: `supabase/migrations/20260129_create_urgency_pricing_tables.sql`
- [ ] Apply migration locally:
  ```bash
  supabase db reset
  # or
  supabase db push
  ```
- [ ] Verify tables created:
  ```sql
  -- Check tables exist
  \dt urgency_pricing_cache
  \dt market_demand_multipliers
  \dt event_multipliers
  \dt urgency_pricing_config

  -- Check default config
  SELECT * FROM urgency_pricing_config WHERE is_active = true;
  ```

### 2. Local Testing

- [ ] Start Supabase locally: `supabase start`
- [ ] Serve function: `supabase functions serve urgency-pricing`
- [ ] Run verification script:
  ```bash
  cd supabase/functions/urgency-pricing/tests
  deno run --allow-net --allow-env verify-urgency-pricing.ts
  ```
- [ ] Verify all tests pass: **READY FOR DEPLOYMENT** status

### 3. Code Review

- [ ] Review FP architecture compliance:
  - Pure functions in `core/` (no side effects)
  - Immutable data structures (no `let` reassignment in business logic)
  - Side effects only in handlers and `index.ts`
  - Fail-fast error propagation (no fallback logic)

- [ ] Review formula integrity:
  - Steepness = 2.0 (non-negotiable)
  - Exponential formula: `exp(steepness × (1 - days_out/lookback_window))`
  - UTC-based date calculations

- [ ] Review security:
  - Public actions: calculate, batch, calendar, stats, health
  - Protected actions: events (add_event, remove_event)
  - No API keys in code
  - Input validation on all payloads

### 4. Configuration Verification

- [ ] Check `supabase/config.toml`:
  ```toml
  [functions.urgency-pricing]
  enabled = true
  verify_jwt = false
  import_map = "./functions/urgency-pricing/deno.json"
  entrypoint = "./functions/urgency-pricing/index.ts"
  ```

- [ ] Check `deno.json` imports:
  ```json
  {
    "imports": {
      "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
      "shared/": "../_shared/"
    }
  }
  ```

## Deployment Steps

### Development Environment

```bash
# 1. Apply migration
supabase db push

# 2. Deploy function
supabase functions deploy urgency-pricing --no-verify-jwt

# 3. Test deployed function
curl -X POST https://YOUR_DEV_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"health","payload":{}}'
```

### Production Environment

```bash
# 1. Create production migration (if not auto-synced)
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# 2. Deploy function to production
supabase functions deploy urgency-pricing --project-ref YOUR_PROD_PROJECT_ID --no-verify-jwt

# 3. Test production function
curl -X POST https://YOUR_PROD_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
  -H "Authorization: Bearer YOUR_PROD_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"health","payload":{}}'

# 4. Run verification suite against production
export SUPABASE_URL="https://YOUR_PROD_PROJECT_ID.supabase.co"
export SUPABASE_ANON_KEY="YOUR_PROD_ANON_KEY"
deno run --allow-net --allow-env verify-urgency-pricing.ts
```

## Post-Deployment Verification

### 1. Smoke Tests

- [ ] Health check returns 200:
  ```bash
  curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"action":"health","payload":{}}'
  ```

- [ ] Calculate endpoint returns valid pricing:
  ```bash
  curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "calculate",
      "payload": {
        "targetDate": "2026-02-15T00:00:00Z",
        "basePrice": 180,
        "urgencySteepness": 2.0
      }
    }'
  ```

- [ ] Verify steepness 2.0 formula:
  - 7 days out → ~4.5x multiplier
  - 1 day out → ~8.8x multiplier

### 2. Cache Verification

- [ ] First call shows `cacheHit: false`
- [ ] Second identical call shows `cacheHit: true`
- [ ] Cache expires according to urgency level TTL

### 3. Error Handling

- [ ] Negative base price returns 400 error
- [ ] Invalid date format returns 400 error
- [ ] Missing required fields returns 400 error

### 4. Performance Check

- [ ] Calculate endpoint responds in < 100ms (with cache)
- [ ] Calculate endpoint responds in < 500ms (without cache)
- [ ] Batch processing handles 10+ requests efficiently

## Monitoring Setup

### Supabase Dashboard

1. Navigate to **Functions** → **urgency-pricing**
2. Monitor:
   - Request count
   - Error rate
   - Execution time (p50, p95, p99)
   - Memory usage

### Database Monitoring

```sql
-- Check cache hit rate
SELECT
  urgency_level,
  COUNT(*) as total_cached,
  COUNT(*) FILTER (WHERE cache_hit_count > 0) as cache_hits,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit_count > 0) / COUNT(*), 2) as hit_rate_pct
FROM urgency_pricing_cache
WHERE expires_at > NOW()
GROUP BY urgency_level;

-- Check cache size by urgency level
SELECT
  urgency_level,
  COUNT(*) as count,
  AVG(current_price) as avg_price,
  MIN(current_price) as min_price,
  MAX(current_price) as max_price
FROM urgency_pricing_cache
WHERE expires_at > NOW()
GROUP BY urgency_level;
```

### Alerts

Set up alerts for:
- Error rate > 1%
- Average response time > 500ms
- Cache hit rate < 70%

## Rollback Procedure

If deployment fails:

```bash
# 1. Revert function deployment (deploy previous version)
supabase functions deploy urgency-pricing --project-ref YOUR_PROJECT_ID

# 2. Rollback database migration
supabase migration repair --status reverted --version 20260129_create_urgency_pricing_tables

# 3. Verify rollback
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"health","payload":{}}'
```

## Troubleshooting

### Function Not Found (404)

**Symptom**: `404 Not Found` on function endpoint

**Solution**:
1. Check function is deployed: `supabase functions list`
2. Verify config.toml has correct entrypoint
3. Redeploy: `supabase functions deploy urgency-pricing`

### Database Connection Error

**Symptom**: `Database connection failed`

**Solution**:
1. Check migration is applied: `supabase db remote list`
2. Verify service role key is set in Supabase dashboard
3. Check database is accessible

### Formula Returns Wrong Multiplier

**Symptom**: Multiplier doesn't match expected values

**Solution**:
1. Verify steepness = 2.0 in request payload
2. Check default config in database: `SELECT * FROM urgency_pricing_config WHERE config_key = 'default_urgency_steepness'`
3. Verify date calculation is UTC-based

### Cache Not Working

**Symptom**: Every request shows `cacheHit: false`

**Solution**:
1. Check urgency_pricing_cache table exists
2. Verify cache_key generation is consistent
3. Check expires_at timestamps are in future

## Environment Variables

No environment variables required - function uses Supabase's built-in env vars:
- `SUPABASE_URL` (auto-configured)
- `SUPABASE_ANON_KEY` (auto-configured)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-configured)

## Success Criteria

Deployment is successful when:
- ✅ All verification tests pass
- ✅ Health check returns 200
- ✅ Calculate endpoint returns correct multipliers (±tolerance)
- ✅ Cache hit rate > 70% after warmup
- ✅ Average response time < 100ms (cached)
- ✅ Error rate < 1%

---

**READY FOR DEPLOYMENT** if all pre-deployment checklist items are complete.
