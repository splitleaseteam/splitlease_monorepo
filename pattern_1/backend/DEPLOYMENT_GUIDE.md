# Pattern 1: Personalized Defaults - Deployment Guide

**Complete step-by-step deployment instructions for production**

---

## Pre-Deployment Checklist

- [ ] All tests passing (`deno test`)
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment window

---

## Step 1: Database Migrations

### 1.1 Backup Current Database

```bash
# Create backup
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### 1.2 Run Migrations (Staging First)

```bash
# Switch to staging project
supabase link --project-ref staging-project-ref

# Run migrations
supabase db push

# Verify tables created
supabase db diff --schema public
```

### 1.3 Run Migrations (Production)

```bash
# Switch to production project
supabase link --project-ref prod-project-ref

# Review migration plan
supabase db diff --schema public

# Apply migrations
supabase db push

# Verify
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%archetype%';"
```

**Expected Tables:**
- `user_archetypes`
- `recommendation_logs`
- `admin_audit_log`
- `archetype_job_logs`

---

## Step 2: Deploy Edge Functions

### 2.1 Build and Test Locally

```bash
cd functions

# Test transaction-recommendations locally
supabase functions serve transaction-recommendations --env-file .env.local

# Test in another terminal
curl -i --location --request GET \
  'http://localhost:54321/functions/v1/transaction-recommendations?userId=test&targetDate=2026-03-15&roommateId=test2' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

### 2.2 Deploy to Staging

```bash
# Link to staging
supabase link --project-ref staging-project-ref

# Deploy all functions
supabase functions deploy transaction-recommendations
supabase functions deploy user-archetype
supabase functions deploy archetype-recalculation-job

# Verify deployment
supabase functions list
```

### 2.3 Deploy to Production

```bash
# Link to production
supabase link --project-ref prod-project-ref

# Deploy functions
supabase functions deploy transaction-recommendations
supabase functions deploy user-archetype
supabase functions deploy archetype-recalculation-job

# Verify
curl -i 'https://YOUR_PROJECT.supabase.co/functions/v1/transaction-recommendations?userId=test&targetDate=2026-03-15&roommateId=test2' \
  --header 'Authorization: Bearer YOUR_ANON_KEY'
```

---

## Step 3: Configure Environment Variables

### 3.1 Set Secrets via Supabase CLI

```bash
# Set environment variables
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Verify
supabase secrets list
```

### 3.2 Alternative: Set via Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 4: Set Up Background Job

### 4.1 Enable pg_cron Extension

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### 4.2 Create Cron Job

```sql
-- Schedule daily archetype recalculation at 2 AM
SELECT cron.schedule(
  'daily-archetype-recalculation',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/archetype-recalculation-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'config', jsonb_build_object(
          'batchSize', 100,
          'onlyStaleUsers', true
        )
      )
    ) as request_id;
  $$
);

-- Verify cron job created
SELECT * FROM cron.job;
```

### 4.3 Test Cron Job Manually

```bash
# Trigger job manually
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/archetype-recalculation-job' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "config": {
      "batchSize": 10,
      "onlyStaleUsers": false
    }
  }'

# Check job logs
psql $DATABASE_URL -c "SELECT * FROM archetype_job_logs ORDER BY completed_at DESC LIMIT 5;"
```

---

## Step 5: Configure Row Level Security (RLS)

### 5.1 Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE '%archetype%';

-- List policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE '%archetype%';
```

### 5.2 Test RLS Policies

```bash
# Test as regular user
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/user_archetypes?user_id=eq.USER_ID' \
  --header 'Authorization: Bearer USER_JWT_TOKEN' \
  --header 'apikey: YOUR_ANON_KEY'

# Should only return user's own archetype

# Test as admin
curl 'https://YOUR_PROJECT.supabase.co/rest/v1/user_archetypes' \
  --header 'Authorization: Bearer ADMIN_JWT_TOKEN' \
  --header 'apikey: YOUR_ANON_KEY'

# Should return all archetypes
```

---

## Step 6: Set Up Monitoring

### 6.1 Configure Alerts

In Supabase Dashboard → **Settings** → **Alerts**:

1. **High Error Rate Alert**
   - Metric: Edge Function errors
   - Threshold: >5% error rate
   - Window: 5 minutes

2. **Slow Response Time Alert**
   - Metric: Edge Function P95 latency
   - Threshold: >500ms
   - Window: 10 minutes

3. **Background Job Failure Alert**
   - Metric: Job failure count
   - Threshold: >0
   - Window: Daily

### 6.2 Set Up Log Drains (Optional)

```bash
# Configure log drain to external service
supabase logs drain create \
  --name "pattern1-logs" \
  --destination "https://your-logging-service.com/ingest" \
  --filters "function_name=transaction-recommendations"
```

---

## Step 7: Seed Initial Data (Optional)

### 7.1 Calculate Archetypes for Existing Users

```bash
# Trigger background job for all users
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/archetype-recalculation-job' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "config": {
      "batchSize": 100,
      "onlyStaleUsers": false
    }
  }'

# Monitor progress
watch -n 5 "psql $DATABASE_URL -c 'SELECT COUNT(*) FROM user_archetypes;'"
```

### 7.2 Verify Data Quality

```sql
-- Check archetype distribution
SELECT
  archetype_type,
  COUNT(*) as user_count,
  AVG(confidence) as avg_confidence
FROM user_archetypes
GROUP BY archetype_type;

-- Should see reasonable distribution:
-- big_spender: ~15-20%
-- high_flexibility: ~20-25%
-- average_user: ~55-65%
```

---

## Step 8: Update Frontend (Gradual Rollout)

### 8.1 Feature Flag Configuration

```javascript
// In your feature flag service (e.g., LaunchDarkly, Growthbook)
{
  "pattern_1_personalized_defaults": {
    "enabled": true,
    "rollout": {
      "percentage": 10,  // Start with 10%
      "targeting": {
        "users": ["test_user_1", "test_user_2"]  // Whitelist test users
      }
    }
  }
}
```

### 8.2 Rollout Schedule

| Day | Rollout % | Monitor For |
|-----|-----------|-------------|
| Day 1 | 10% | Errors, latency spikes |
| Day 2 | 25% | User behavior changes |
| Day 3 | 50% | Conversion rates |
| Day 5 | 75% | Revenue impact |
| Day 7 | 100% | Overall metrics |

### 8.3 Integration Code

```typescript
// Example frontend integration
import { usePersonalizedDefaults } from '@/hooks/usePersonalizedDefaults';

function DateChangeRequest() {
  const { primaryOption, options, loading } = usePersonalizedDefaults({
    userId: currentUser.id,
    targetDate: selectedDate,
    roommateId: roommate.id
  });

  if (loading) return <LoadingSpinner />;

  return (
    <TransactionSelector
      recommendedOption={primaryOption}
      options={options}
      onSelect={handleSelect}
    />
  );
}
```

---

## Step 9: Verification & Testing

### 9.1 Smoke Tests

```bash
# Test recommendation API
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/transaction-recommendations?userId=real_user_id&targetDate=2026-03-15&roommateId=roommate_id' \
  --header 'Authorization: Bearer USER_JWT'

# Verify response has all required fields
# - primaryRecommendation
# - options (array of 3)
# - userArchetype
# - contextFactors

# Test archetype API
curl 'https://YOUR_PROJECT.supabase.co/functions/v1/user-archetype?userId=real_user_id' \
  --header 'Authorization: Bearer USER_JWT'

# Verify archetype returned
```

### 9.2 Load Testing

```bash
# Install k6 (load testing tool)
brew install k6  # macOS
# or
apt-get install k6  # Linux

# Create load test script
cat > load_test.js << 'EOF'
import http from 'k6/http';

export const options = {
  vus: 50,  // 50 virtual users
  duration: '60s',
};

export default function () {
  const url = 'https://YOUR_PROJECT.supabase.co/functions/v1/transaction-recommendations?userId=test&targetDate=2026-03-15&roommateId=test2';
  const params = {
    headers: {
      'Authorization': 'Bearer YOUR_ANON_KEY',
    },
  };
  http.get(url, params);
}
EOF

# Run load test
k6 run load_test.js

# Target metrics:
# - P95 latency < 300ms
# - Error rate < 1%
# - Throughput > 100 req/s
```

---

## Step 10: Post-Deployment Monitoring

### 10.1 Monitor Key Metrics (First 24 Hours)

```sql
-- Check API usage
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as request_count,
  AVG(CASE WHEN followed_recommendation THEN 1 ELSE 0 END) as follow_rate
FROM recommendation_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- Check error rates
SELECT
  function_name,
  COUNT(*) as error_count,
  AVG(response_time_ms) as avg_latency
FROM edge_function_logs
WHERE status >= 400
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY function_name;

-- Check archetype distribution
SELECT
  archetype_type,
  COUNT(*) as count
FROM user_archetypes
GROUP BY archetype_type;
```

### 10.2 Business Metrics Dashboard

Track in your analytics platform:

1. **Recommendation Follow Rate**
   - Overall: >65%
   - By archetype: big_spender >75%

2. **Conversion Rate**
   - Requests submitted: >80%
   - Requests accepted: >70%

3. **Revenue Impact**
   - Average transaction value
   - Total platform fees collected

4. **User Experience**
   - Time to decision: <30 seconds
   - User satisfaction (NPS)

---

## Rollback Plan

### If Critical Issues Occur

**1. Disable Feature Flag**
```javascript
// Set rollout to 0%
feature_flag.update('pattern_1_personalized_defaults', { enabled: false });
```

**2. Revert Edge Functions**
```bash
# Redeploy previous version
git checkout HEAD~1
supabase functions deploy transaction-recommendations
supabase functions deploy user-archetype
```

**3. Restore Database (If Needed)**
```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_archetypes;"
```

**4. Disable Cron Job**
```sql
-- Disable cron job
SELECT cron.unschedule('daily-archetype-recalculation');

-- Verify
SELECT * FROM cron.job WHERE jobname = 'daily-archetype-recalculation';
```

---

## Success Criteria

Deployment is considered successful if:

- [ ] All APIs responding with <300ms P95 latency
- [ ] Error rate <1%
- [ ] Recommendation follow rate >65%
- [ ] No critical bugs reported
- [ ] Background job running successfully
- [ ] User satisfaction maintained or improved
- [ ] Revenue per transaction increased

---

## Support Contacts

**On-Call Engineer:** [Your contact]
**Product Manager:** [PM contact]
**Database Admin:** [DBA contact]
**Incident Channel:** #pattern-1-incidents

---

## Post-Deployment Tasks

### Week 1
- [ ] Daily metrics review
- [ ] User feedback collection
- [ ] Performance optimization if needed

### Week 2
- [ ] A/B test analysis
- [ ] Fine-tune archetype thresholds
- [ ] Update documentation with learnings

### Month 1
- [ ] Full performance review
- [ ] Plan next iteration
- [ ] Knowledge transfer to team

---

**Deployment Completed:** _____________

**Deployed By:** _____________

**Sign-off:** _____________
