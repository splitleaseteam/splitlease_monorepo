# Deploy Frontend to Cloudflare Pages

## Overview

This runbook covers deploying the React frontend application to Cloudflare Pages. The frontend uses Vite for building and islands architecture where each page is an independent React root.

## Prerequisites

- Access to the Split Lease GitHub repository
- Cloudflare account with Pages access
- Wrangler CLI installed and authenticated
- Node.js 18+ and Bun installed
- Git access with push permissions

## Pre-Deployment Checklist

- [ ] All tests pass locally (`bun run test`)
- [ ] Lint checks pass (`bun run lint`)
- [ ] Type checks pass (`bun run typecheck`)
- [ ] Build succeeds locally (`bun run build`)
- [ ] Routes configuration verified (`app/src/routes.config.js`)
- [ ] Environment variables confirmed for target environment
- [ ] Changes reviewed and approved (PR merged to main)

## Procedure

### Step 1: Verify Current Branch

```bash
cd app
git status
git branch
```

Expected output: You should be on `main` branch with a clean working directory.

### Step 2: Pull Latest Changes

```bash
git pull origin main
```

Verify you have the latest commits.

### Step 3: Install Dependencies

```bash
bun install
```

### Step 4: Run Pre-Build Checks

```bash
# Run linter
bun run lint

# Run type checking
bun run typecheck

# Run tests
bun run test
```

All checks must pass before proceeding.

### Step 5: Generate Route Configuration

```bash
bun run generate-routes
```

This generates `_redirects` and `_routes.json` files from `routes.config.js`.

### Step 6: Build for Production

```bash
bun run build
```

Expected output:
- Build artifacts in `dist/` directory
- No build errors
- Bundle size report displayed

### Step 7: Preview Build Locally (Optional)

```bash
bun run preview
```

Navigate to http://localhost:3000 and verify key pages work.

### Step 8: Deploy to Cloudflare Pages

**Production Deployment (main branch only):**
```bash
bun run deploy
```

**Development/Preview Deployment:**
```bash
bun run deploy:dev
```

The deploy script includes branch verification:
- `deploy` requires main branch
- `deploy:dev` blocks main branch

### Step 9: Verify Deployment

1. Check Cloudflare Pages dashboard for deployment status
2. Navigate to production URL: https://split.lease
3. Verify key pages:
   - Home page loads
   - Search page works
   - Login/signup accessible
   - At least one listing detail page loads

## Verification

### Automated Checks
```bash
# Check deployment status via Wrangler
npx wrangler pages deployment list --project-name splitlease
```

### Manual Verification
1. Open https://split.lease in incognito browser
2. Check browser console for JavaScript errors
3. Verify critical user flows:
   - [ ] Home page renders
   - [ ] Search returns results
   - [ ] Login form works
   - [ ] Listing details display

### Health Check Endpoints
- Frontend: https://split.lease (should return 200)
- Static assets: Verify images/CSS/JS load correctly

## Rollback

### Immediate Rollback via Cloudflare Dashboard

1. Log into Cloudflare Dashboard
2. Navigate to Pages > splitlease
3. Go to Deployments tab
4. Find the previous successful deployment
5. Click the three dots menu (...)
6. Select "Rollback to this deployment"
7. Confirm the rollback

### Rollback via CLI

```bash
# List recent deployments
npx wrangler pages deployment list --project-name splitlease

# Note the deployment ID of the known-good version
# Redeploy that version through the dashboard or trigger a new deployment from the previous commit
```

### Git-Based Rollback

If you need to revert the code:

```bash
# Find the last known good commit
git log --oneline -10

# Revert to that commit
git revert HEAD

# Push and redeploy
git push origin main
bun run deploy
```

## Troubleshooting

### Build Failures

**Issue: TypeScript errors**
```bash
bun run typecheck
```
Fix all TypeScript errors before building.

**Issue: Lint errors**
```bash
bun run lint:fix
```
Auto-fix lint issues where possible.

**Issue: Route generation fails**
Check `app/src/routes.config.js` for syntax errors.

### Deployment Failures

**Issue: Wrangler authentication**
```bash
npx wrangler login
```

**Issue: Branch restriction**
- Production deploys require main branch
- Development deploys require non-main branch

**Issue: Asset upload timeout**
Retry the deployment. If persistent, check Cloudflare status page.

## Escalation

| Severity | Action |
|----------|--------|
| Build fails repeatedly | Escalate to Engineering Lead |
| Deployment succeeds but site broken | Immediate rollback, then escalate |
| Cloudflare outage | Monitor status.cloudflare.com, inform stakeholders |

## Related Runbooks

- [deploy-edge-functions.md](deploy-edge-functions.md) - Backend function deployment
- [deploy-database-migrations.md](deploy-database-migrations.md) - Database changes
- [../incidents/outage-frontend.md](../incidents/outage-frontend.md) - Frontend outage response

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
