# CI/CD Pipeline Design for Split Lease

**Created**: 2026-01-27 14:30
**Status**: Ready for Implementation
**Priority**: High (Infrastructure Foundation)

---

## Executive Summary

Design and implement a **speed-optimized CI/CD pipeline** for Split Lease's dual-deployment architecture:
- **Frontend** (`app/`) → Cloudflare Pages
- **Backend** (`supabase/functions/`) → Supabase Edge Functions

### User Requirements
1. ✅ **Speed of deployment** - Optimize for fast feedback cycles
2. ✅ **Auto on main push** - Automatic production deployments
3. ✅ **Deploy only changed** - Smart detection of changed Edge Functions
4. ✅ **Separate workflows** - Distinct dev and production pipelines

---

## Current State Analysis

### Manual Deployment Process

**Frontend**:
```bash
cd app
bun run build
npx wrangler pages deploy dist --project-name splitlease
```

**Backend**:
```bash
# Deploy all (slow)
supabase functions deploy

# Deploy single function (requires manual identification)
supabase functions deploy auth-user
```

### Pain Points
- ❌ Manual identification of changed Edge Functions
- ❌ No automated testing before deployment
- ❌ Risk of deploying to wrong environment
- ❌ No deployment history/rollback mechanism
- ❌ ~2-3 minutes to deploy all 17 Edge Functions (even if only 1 changed)

---

## Proposed Architecture

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GitHub Push to `main`                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌──────────────────────┐
    │  Frontend Workflow│    │ Edge Functions       │
    │  (app/**)         │    │ Workflow             │
    │                   │    │ (supabase/functions/**) │
    └─────────┬─────────┘    └──────────┬───────────┘
              │                          │
              ▼                          ▼
    ┌─────────────────┐       ┌────────────────────┐
    │ 1. Lint         │       │ 1. Detect Changes  │
    │ 2. Test         │       │ 2. Deploy Changed  │
    │ 3. Build        │       │ 3. Verify Deploy   │
    │ 4. Deploy       │       │ 4. Slack Notify    │
    └─────────────────┘       └────────────────────┘
```

### Workflow Separation Strategy

| Workflow | Trigger Path | Environment | Auto-Deploy |
|----------|-------------|-------------|-------------|
| `deploy-frontend-dev.yml` | `app/**` changes on any branch | Dev (preview) | ✅ Yes |
| `deploy-frontend-prod.yml` | `app/**` changes on `main` | Production | ✅ Yes |
| `deploy-edge-functions-dev.yml` | `supabase/functions/**` on any branch | `splitlease-backend-dev` | ✅ Yes |
| `deploy-edge-functions-prod.yml` | `supabase/functions/**` on `main` | `splitlease-backend-live` | ✅ Yes |

---

## Implementation Plan

### Phase 1: Edge Function Change Detection (Core Optimization)

**Problem**: Deploying all 17 Edge Functions takes ~2-3 minutes even if only 1 changed.

**Solution**: Git-based change detection script

```bash
# Script: .github/scripts/detect-changed-functions.sh
#!/bin/bash

# Get list of changed files in supabase/functions/ directory
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD -- supabase/functions/)

# Extract unique function names (top-level directories)
CHANGED_FUNCTIONS=$(echo "$CHANGED_FILES" | \
  grep -E '^supabase/functions/[^/]+/' | \
  sed 's|supabase/functions/\([^/]*\)/.*|\1|' | \
  sort -u | \
  grep -v '^_shared$')  # Exclude _shared

# If _shared changed, deploy ALL functions
if echo "$CHANGED_FILES" | grep -q "supabase/functions/_shared"; then
  echo "::set-output name=deploy_all::true"
  echo "::set-output name=changed_functions::"
else
  echo "::set-output name=deploy_all::false"
  echo "::set-output name=changed_functions::$CHANGED_FUNCTIONS"
fi
```

**Edge Cases**:
- ✅ If `_shared/` changes → deploy ALL functions (shared dependencies)
- ✅ If no functions changed → skip deployment job
- ✅ If new function added → detected automatically

---

### Phase 2: GitHub Actions Workflows

#### Workflow 1: Frontend Production Deployment

**File**: `.github/workflows/deploy-frontend-prod.yml`

**Triggers**:
- Push to `main` branch
- Changes in `app/**` directory only

**Jobs**:
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      1. Checkout code
      2. Setup Bun (oven-sh/setup-bun@v1)
      3. Install dependencies (cd app && bun install)
      4. Run linter (bun run lint)
      5. Run tests (bun run test)
      6. Generate routes (bun run generate-routes)
      7. Build production (bun run build)
      8. Deploy to Cloudflare Pages (cloudflare/wrangler-action@v3)
      9. Notify Slack on success/failure
```

**Optimization**: Cache `node_modules` between runs (saves ~30s)

---

#### Workflow 2: Edge Functions Production Deployment (Changed Only)

**File**: `.github/workflows/deploy-edge-functions-prod.yml`

**Triggers**:
- Push to `main` branch
- Changes in `supabase/functions/**` directory only

**Jobs**:
```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      deploy_all: ${{ steps.detect.outputs.deploy_all }}
      changed_functions: ${{ steps.detect.outputs.changed_functions }}
    steps:
      1. Checkout code (with fetch-depth: 2 for diff)
      2. Run detect-changed-functions.sh
      3. Output results

  deploy-changed:
    needs: detect-changes
    if: needs.detect-changes.outputs.deploy_all == 'false'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        function: ${{ fromJson(needs.detect-changes.outputs.changed_functions) }}
    steps:
      1. Setup Supabase CLI
      2. Deploy single function: supabase functions deploy ${{ matrix.function }}
      3. Verify deployment (call health endpoint)

  deploy-all:
    needs: detect-changes
    if: needs.detect-changes.outputs.deploy_all == 'true'
    runs-on: ubuntu-latest
    steps:
      1. Setup Supabase CLI
      2. Deploy all functions: supabase functions deploy
      3. Verify deployments
```

**Key Features**:
- ✅ **Parallel deployment** of changed functions using matrix strategy
- ✅ **Conditional execution**: Only run if changes detected
- ✅ **Shared dependency handling**: Deploy all if `_shared/` changes
- ✅ **Verification step**: Ensure functions are healthy post-deploy

---

#### Workflow 3: Dev Environment Deployments

**Files**:
- `.github/workflows/deploy-frontend-dev.yml`
- `.github/workflows/deploy-edge-functions-dev.yml`

**Triggers**:
- Push to ANY branch (not just `main`)
- Paths: `app/**` or `supabase/functions/**`

**Target Environments**:
- Frontend: Cloudflare Pages preview deployment
- Backend: `splitlease-backend-dev` project

**Differences from Production**:
- Skip some quality gates (faster feedback)
- Use dev environment secrets
- Deploy to preview/staging environments

---

### Phase 3: Secrets & Environment Configuration

#### Required GitHub Secrets

| Secret Name | Used By | Purpose |
|-------------|---------|---------|
| `CLOUDFLARE_API_TOKEN` | Frontend workflows | Deploy to Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Frontend workflows | Cloudflare account identifier |
| `SUPABASE_ACCESS_TOKEN_DEV` | Edge Functions (dev) | Deploy to dev project |
| `SUPABASE_ACCESS_TOKEN_PROD` | Edge Functions (prod) | Deploy to live project |
| `SUPABASE_PROJECT_ID_DEV` | Edge Functions (dev) | Target dev project |
| `SUPABASE_PROJECT_ID_PROD` | Edge Functions (prod) | Target live project |
| `SLACK_WEBHOOK_URL` | All workflows | Deployment notifications |

#### How to Obtain Secrets

**Cloudflare API Token**:
```
1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Token > Edit Cloudflare Workers > Use template
3. Scope: Account (Split Lease account) > Cloudflare Pages (Edit)
```

**Supabase Access Token**:
```
1. Go to Supabase Dashboard > Account Settings > Access Tokens
2. Create new token with name "GitHub Actions CI/CD"
3. Copy token (shown only once)
```

**Supabase Project IDs**:
- Dev: From `splitlease-backend-dev` project settings
- Prod: From `splitlease-backend-live` project settings

---

### Phase 4: Speed Optimizations

#### 1. Caching Strategy

```yaml
# Cache Bun dependencies
- uses: actions/cache@v3
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('app/package.json') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

**Expected Savings**: ~30-45 seconds per run

#### 2. Parallel Job Execution

```yaml
# Deploy multiple changed Edge Functions in parallel
strategy:
  matrix:
    function: [auth-user, proposal, listing]  # Dynamic from detection
  max-parallel: 5  # Deploy up to 5 functions concurrently
```

**Expected Savings**: If 3 functions changed, deploy in ~20s instead of ~60s

#### 3. Conditional Job Execution

```yaml
# Skip frontend workflow if only backend changed
on:
  push:
    paths:
      - 'app/**'  # Only trigger if frontend files changed
```

**Expected Savings**: Avoid unnecessary workflow runs

#### 4. Fast Linting & Testing

```yaml
# Run lint and test in parallel (not sequential)
jobs:
  quality-gates:
    strategy:
      matrix:
        check: [lint, test]
```

**Expected Savings**: ~15-20 seconds

---

### Phase 5: Deployment Verification & Rollback

#### Health Check Pattern

After deploying each Edge Function, verify it's operational:

```bash
# Example health check for auth-user function
curl -X POST https://PROJECT_ID.supabase.co/functions/v1/auth-user \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "validate"}' \
  --fail-with-body
```

**If health check fails**:
1. Mark deployment as failed
2. Send alert to Slack
3. (Optional) Auto-rollback to previous version

#### Rollback Strategy

**Option A**: Git-based rollback
```bash
# Revert the commit that broke production
git revert HEAD
git push origin main  # Triggers re-deployment
```

**Option B**: Supabase version pinning (if supported)
```bash
# Deploy specific version
supabase functions deploy auth-user --version v1.2.3
```

---

## Workflow Execution Timeline

### Scenario 1: Change Single Edge Function

```
Push to main (change auth-user function)
  └─> Trigger: deploy-edge-functions-prod.yml
      ├─> detect-changes (5s)
      │   └─> Output: deploy_all=false, changed_functions=[auth-user]
      ├─> deploy-changed (15s)
      │   └─> Deploy auth-user only
      └─> verify (3s)
          └─> Health check passed

Total: ~23 seconds
```

### Scenario 2: Change Shared Utility

```
Push to main (change supabase/functions/_shared/cors.ts)
  └─> Trigger: deploy-edge-functions-prod.yml
      ├─> detect-changes (5s)
      │   └─> Output: deploy_all=true
      ├─> deploy-all (120s)
      │   └─> Deploy all 17 functions
      └─> verify (10s)
          └─> Health check all functions

Total: ~135 seconds (~2.2 minutes)
```

### Scenario 3: Frontend Change

```
Push to main (change app/src/islands/pages/LoginPage.jsx)
  └─> Trigger: deploy-frontend-prod.yml
      ├─> Install dependencies (30s, cached)
      ├─> Lint + Test in parallel (25s)
      ├─> Generate routes (2s)
      ├─> Build (35s)
      └─> Deploy to Cloudflare (15s)

Total: ~107 seconds (~1.8 minutes)
```

---

## Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Accidental production deployment** | High | Require `main` branch protection, PR reviews |
| **Broken deployment breaks live site** | Critical | Health checks + auto-rollback, staging environment |
| **Secrets leaked in logs** | Critical | Use GitHub secrets, never echo sensitive values |
| **CI/CD cost overrun** | Medium | Cache dependencies, conditional workflows |
| **Deployment of untested code** | High | Mandatory test/lint gates before deploy |
| **Concurrent deployments conflict** | Medium | Use `concurrency` groups in workflows |

### Recommended GitHub Branch Protection

```yaml
Branch: main
Rules:
  ✅ Require pull request before merging
  ✅ Require status checks to pass (lint, test)
  ✅ Require branches to be up to date
  ❌ Do NOT allow force pushes
  ❌ Do NOT allow deletions
```

---

## Monitoring & Observability

### Deployment Metrics to Track

1. **Deployment Frequency**: How often we deploy (target: multiple times/day)
2. **Deployment Duration**: Time from push to live (target: <2 minutes)
3. **Deployment Success Rate**: % of deployments that succeed (target: >95%)
4. **Time to Rollback**: Time to revert broken deployment (target: <5 minutes)

### Slack Notification Template

```
🚀 Deployment to Production - SUCCESS
Environment: Production
Trigger: Push to main by @username
Changed Functions: auth-user, proposal
Duration: 23 seconds
Status: All health checks passed ✅
Commit: abc1234 - "Fix auth token validation"
```

---

## Implementation Checklist

### Prerequisites
- [ ] Create GitHub repository secrets (Cloudflare, Supabase, Slack)
- [ ] Enable GitHub Actions in repository settings
- [ ] Configure branch protection rules for `main`
- [ ] Set up Slack webhook for notifications

### Workflow Files to Create
- [ ] `.github/workflows/deploy-frontend-prod.yml`
- [ ] `.github/workflows/deploy-frontend-dev.yml`
- [ ] `.github/workflows/deploy-edge-functions-prod.yml`
- [ ] `.github/workflows/deploy-edge-functions-dev.yml`
- [ ] `.github/scripts/detect-changed-functions.sh`
- [ ] `.github/scripts/health-check.sh`

### Testing Plan
- [ ] Test dev workflows on feature branch
- [ ] Verify change detection with sample commits
- [ ] Test production workflow on main (low-risk change)
- [ ] Verify Slack notifications
- [ ] Test rollback procedure

---

## Next Steps

### Phase 1: Foundation (Week 1)
1. Create change detection script
2. Implement dev environment workflows
3. Test on feature branches

### Phase 2: Production (Week 2)
1. Implement production workflows
2. Configure secrets and branch protection
3. Test with low-risk deployment

### Phase 3: Optimization (Week 3)
1. Add caching for dependencies
2. Implement health checks
3. Set up Slack notifications

### Phase 4: Documentation (Week 4)
1. Document deployment process
2. Create runbook for rollbacks
3. Train team on CI/CD usage

---

## Alternative Approaches Considered

### 1. Cloudflare Pages Git Integration (Rejected)
**Pros**: Zero configuration, automatic preview deployments
**Cons**: Less control over build process, can't run custom tests
**Why Rejected**: User wants speed optimization and testing gates

### 2. Deploy All Edge Functions Always (Rejected)
**Pros**: Simpler logic, no change detection needed
**Cons**: Slow (~2-3 minutes every time)
**Why Rejected**: User prioritized speed of deployment

### 3. Manual Production Deployments (Rejected)
**Pros**: Maximum safety, human approval
**Cons**: Slow feedback loop, blocks velocity
**Why Rejected**: User wants auto-deploy on main push

---

## References

### External Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Pages CI/CD](https://developers.cloudflare.com/pages/platform/deploy-hooks/)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Supabase Edge Functions CI/CD](https://supabase.com/docs/guides/functions/cicd-workflow)

### Internal Documentation
- [app/README.md](../../app/README.md) - Frontend build commands
- [CLAUDE.md](../../CLAUDE.md) - Deployment procedures
- [.claude/Documentation/Backend(EDGE - Functions)/README.md](../Documentation/Backend(EDGE%20-%20Functions)/README.md) - Edge Functions reference

---

**Plan Status**: ✅ READY FOR REVIEW
**Estimated Implementation Time**: 2-3 weeks (4 phases)
**Expected Deployment Speed Improvement**: 60-80% faster for single-function changes
