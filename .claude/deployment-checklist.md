# Production Deployment Checklist

**Document Version**: 1.0
**Last Updated**: 2026-01-29
**Scope**: Phase 4 - Production Deployment Readiness

---

## Overview

This checklist ensures all production deployments follow a consistent, safe process. Complete all applicable items before deploying to `split.lease` production.

---

## Pre-Deployment Gates

### Gate 1: E2E Tests Passing (Phase 1)

| Item | Command | Expected Result |
|------|---------|-----------------|
| All Playwright E2E tests pass | `npx playwright test` | 0 failures |
| Pattern-specific E2E tests pass | `npx playwright test e2e/tests/pattern*.spec.ts` | 0 failures |
| Critical user flows verified | Manual review of test reports | All flows covered |

**Verification Commands:**
```bash
# Run full E2E suite
cd app && npx playwright test --reporter=html

# Run specific pattern tests
npx playwright test e2e/tests/pattern1-personalized-defaults.spec.ts
npx playwright test e2e/tests/pattern2-urgency-countdown.spec.ts
npx playwright test e2e/tests/pattern3-price-anchoring.spec.ts
npx playwright test e2e/tests/pattern4-bidding.spec.ts
npx playwright test e2e/tests/pattern5-fee-transparency.spec.ts
```

**Sign-off**: [ ] E2E tests complete - Date: _______ Verified by: _______

---

### Gate 2: Security Audit Complete (Phase 2)

| Item | Status | Notes |
|------|--------|-------|
| No secrets in frontend code | [ ] | Check for exposed API keys |
| Environment variables configured | [ ] | VITE_ prefix for client, secrets for server |
| RLS policies verified | [ ] | All tables have appropriate RLS |
| Edge Functions JWT verification | [ ] | Auth required where needed |
| CORS configuration secure | [ ] | Only allow expected origins |
| SQL injection prevention | [ ] | Parameterized queries only |
| XSS prevention | [ ] | Input sanitization in place |

**Security Checklist:**
```bash
# Search for potential secret exposure
grep -r "SUPABASE_SERVICE_ROLE" app/src/
grep -r "sk_live" app/src/
grep -r "apiKey.*=" app/src/

# Verify no hardcoded credentials
grep -rn "password\s*=" app/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Check Edge Function auth requirements
grep -l "verify_jwt = false" supabase/config.toml
```

**Sign-off**: [ ] Security audit complete - Date: _______ Verified by: _______

---

### Gate 3: Performance Benchmarks Met (Phase 3)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| First Contentful Paint (FCP) | < 1.5s | _____ | [ ] |
| Largest Contentful Paint (LCP) | < 2.5s | _____ | [ ] |
| Cumulative Layout Shift (CLS) | < 0.1 | _____ | [ ] |
| Time to Interactive (TTI) | < 3.5s | _____ | [ ] |
| Edge Function Response Time (p95) | < 500ms | _____ | [ ] |
| Database Query Time (p95) | < 200ms | _____ | [ ] |

**Performance Verification:**
```bash
# Build and analyze bundle
cd app && bun run build
npx vite-bundle-analyzer dist

# Check build output size
du -sh app/dist/

# Lighthouse audit (requires Chrome)
npx lighthouse https://preview-url.pages.dev --output=json --output-path=./lighthouse-report.json
```

**Sign-off**: [ ] Performance benchmarks met - Date: _______ Verified by: _______

---

### Gate 4: Database Migrations Tested

| Item | Status | Notes |
|------|--------|-------|
| Migrations run on dev project | [ ] | All migrations applied |
| Migrations run on local db | [ ] | `supabase db reset` successful |
| Rollback migrations exist | [ ] | Down migrations where needed |
| Data integrity verified | [ ] | No orphaned records |
| FK constraints validated | [ ] | All relationships intact |
| RLS policies still work | [ ] | Test with different user roles |

**Migration Verification:**
```bash
# List pending migrations
supabase db diff

# Apply migrations to local
supabase db reset

# Check migration status on dev
supabase migration list --project-ref $SUPABASE_PROJECT_ID_DEV

# Verify table structure
supabase db remote status --project-ref $SUPABASE_PROJECT_ID_DEV
```

**Migrations to Deploy:**
- [ ] `20260129000000_pattern_3_pricing.sql`
- [ ] `20260129000001_create_user_archetypes_table.sql`
- [ ] `20260129000002_create_recommendation_logs_table.sql`
- [ ] `20260129000003_create_admin_audit_log_table.sql`
- [ ] `20260129000004_add_archetype_fields_to_existing_tables.sql`
- [ ] `20260129000005_create_job_logs_table.sql`
- [ ] `20260129100000_create_bidding_tables.sql`
- [ ] `20260129100001_pattern5_add_user_archetype_fields.sql`
- [ ] `20260129100002_pattern5_add_datechangerequest_fee_fields.sql`
- [ ] `20260129100003_pattern5_backfill_user_archetypes.sql`
- [ ] `20260129100004_pattern5_backfill_datechangerequest_fees.sql`
- [ ] `20260129100005_pattern5_add_fee_calculation_trigger.sql`

**Sign-off**: [ ] Database migrations tested - Date: _______ Verified by: _______

---

### Gate 5: Environment Variables Verified

#### Cloudflare Pages (Production)

| Variable | Configured | Notes |
|----------|------------|-------|
| `VITE_SUPABASE_URL` | [ ] | `https://qcfifybkaddcoimjroca.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | [ ] | Production anon key |
| `VITE_GOOGLE_MAPS_API_KEY` | [ ] | Has domain restrictions |
| `VITE_HOTJAR_SITE_ID` | [ ] | Production site ID |
| `VITE_ENVIRONMENT` | [ ] | `production` |

#### Supabase Edge Functions (Production)

| Secret | Configured | Notes |
|--------|------------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | [ ] | Never expose |
| `BUBBLE_API_BASE_URL` | [ ] | Production Bubble endpoint |
| `BUBBLE_API_KEY` | [ ] | Production Bubble key |
| `OPENAI_API_KEY` | [ ] | Has rate limits |
| `SLACK_WEBHOOK_DATABASE_WEBHOOK` | [ ] | Database alerts channel |
| `SLACK_WEBHOOK_ACQUISITION` | [ ] | Acquisition channel |
| `SLACK_WEBHOOK_GENERAL` | [ ] | General channel |
| `STRIPE_SECRET_KEY` | [ ] | Production Stripe key |
| `STRIPE_WEBHOOK_SECRET` | [ ] | Webhook signing secret |
| `TWILIO_ACCOUNT_SID` | [ ] | SMS service |
| `TWILIO_AUTH_TOKEN` | [ ] | SMS auth |

**Verification:**
```bash
# Check Supabase secrets (production)
supabase secrets list --project-ref $SUPABASE_PROJECT_ID_PROD

# Verify Cloudflare environment
# (Check Cloudflare Dashboard > Pages > splitlease > Settings > Environment variables)
```

**Sign-off**: [ ] Environment variables verified - Date: _______ Verified by: _______

---

### Gate 6: Edge Functions Deployed to Staging First

| Function | Deployed to Dev | Health Check | Notes |
|----------|-----------------|--------------|-------|
| `auth-user` | [ ] | [ ] | |
| `proposal` | [ ] | [ ] | |
| `listing` | [ ] | [ ] | |
| `messages` | [ ] | [ ] | |
| `lease` | [ ] | [ ] | |
| `urgency-pricing` | [ ] | [ ] | Pattern 2 |
| `pricing-tiers` | [ ] | [ ] | Pattern 3 |
| `submit-bid` | [ ] | [ ] | Pattern 4 |
| `set-auto-bid` | [ ] | [ ] | Pattern 4 |
| `withdraw-bid` | [ ] | [ ] | Pattern 4 |
| `create-payment-intent` | [ ] | [ ] | Pattern 5 |
| `process-date-change-fee` | [ ] | [ ] | Pattern 5 |
| `stripe-webhook` | [ ] | [ ] | Pattern 5 |
| `transaction-recommendations` | [ ] | [ ] | Pattern 1 |
| `user-archetype` | [ ] | [ ] | Pattern 1 |
| `archetype-recalculation-job` | [ ] | [ ] | Pattern 1 |

**Deploy to Staging:**
```bash
# Deploy all functions to dev
supabase functions deploy --project-ref $SUPABASE_PROJECT_ID_DEV

# Or deploy specific functions
supabase functions deploy urgency-pricing --project-ref $SUPABASE_PROJECT_ID_DEV
supabase functions deploy submit-bid --project-ref $SUPABASE_PROJECT_ID_DEV

# Run health checks
.github/scripts/health-check.sh auth-user $SUPABASE_PROJECT_URL_DEV $SUPABASE_ANON_KEY_DEV
```

**Sign-off**: [ ] Edge functions deployed to staging - Date: _______ Verified by: _______

---

### Gate 7: Rollback Plan Ready

| Item | Status | Notes |
|------|--------|-------|
| Previous Cloudflare deployment ID noted | [ ] | ID: _______ |
| Previous Edge Functions deployed | [ ] | List functions |
| Database rollback migrations ready | [ ] | Down migrations exist |
| Rollback script tested | [ ] | `scripts/rollback.sh` works |
| Communication plan for users | [ ] | Downtime notice ready |

**Rollback Preparation:**
```bash
# Get current Cloudflare deployment ID
# (Check Cloudflare Dashboard > Pages > splitlease > Deployments)
# Note the current production deployment ID: _______________________

# Verify rollback script exists and is executable
ls -la scripts/rollback.sh
chmod +x scripts/rollback.sh

# Dry-run rollback (does not execute)
./scripts/rollback.sh --dry-run
```

**Sign-off**: [ ] Rollback plan ready - Date: _______ Verified by: _______

---

## Deployment Execution

### Step 1: Final Pre-Deployment Verification

```bash
# Run all tests one final time
cd app && bun run test && bun run lint

# Build production
bun run build

# Verify build output
ls -la dist/
```

### Step 2: Deploy Database Migrations (if any)

```bash
# Apply migrations to production (CAREFUL!)
supabase db push --project-ref $SUPABASE_PROJECT_ID_PROD

# Verify migration status
supabase migration list --project-ref $SUPABASE_PROJECT_ID_PROD
```

### Step 3: Deploy Edge Functions

```bash
# Deploy all functions to production
supabase functions deploy --project-ref $SUPABASE_PROJECT_ID_PROD

# Run health checks on critical functions
.github/scripts/health-check.sh auth-user $SUPABASE_PROJECT_URL_PROD $SUPABASE_ANON_KEY_PROD
.github/scripts/health-check.sh proposal $SUPABASE_PROJECT_URL_PROD $SUPABASE_ANON_KEY_PROD
.github/scripts/health-check.sh listing $SUPABASE_PROJECT_URL_PROD $SUPABASE_ANON_KEY_PROD
```

### Step 4: Deploy Frontend

```bash
# Push to main branch to trigger production deployment
git checkout main
git merge <feature-branch>
git push origin main

# Or manual deployment
cd app && npx wrangler pages deploy dist --project-name=splitlease
```

### Step 5: Post-Deployment Verification

| Check | Status | Notes |
|-------|--------|-------|
| Site loads at split.lease | [ ] | |
| Login/Signup works | [ ] | |
| Search functionality works | [ ] | |
| Proposal creation works | [ ] | |
| Messaging works | [ ] | |
| Payments work (if applicable) | [ ] | |
| No console errors | [ ] | |
| Correct Supabase project connected | [ ] | Check browser console |

---

## Post-Deployment Monitoring

### First 30 Minutes

- [ ] Monitor Sentry for new errors
- [ ] Check Cloudflare Analytics for traffic
- [ ] Monitor Supabase logs for Edge Function errors
- [ ] Check Slack channels for alerts
- [ ] Verify database connection pool is healthy

### First 24 Hours

- [ ] Review error rates in monitoring
- [ ] Check user feedback channels
- [ ] Verify all scheduled jobs are running
- [ ] Review performance metrics

---

## Emergency Rollback Triggers

Initiate rollback immediately if:

1. **Critical Error Rate** > 5% of requests returning 5xx errors
2. **Auth Failure** - Users cannot log in
3. **Payment Failure** - Stripe integration broken
4. **Database Corruption** - Data integrity issues
5. **Security Incident** - Unauthorized access detected

**Rollback Command:**
```bash
./scripts/rollback.sh --execute
```

---

## Deployment Log

| Date | Deployer | Components | Version/Commit | Status | Notes |
|------|----------|------------|----------------|--------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | | |
| DevOps | | |
| On-call Engineer | | |
| Product Owner | | |

---

**Document maintained by**: Engineering Team
**Review frequency**: Before each production deployment
