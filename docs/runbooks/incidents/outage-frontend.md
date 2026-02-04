# Frontend Outage Response

## Overview

This runbook covers diagnosing and resolving issues when the Split Lease frontend (https://split.lease) is unavailable, displaying errors, or performing poorly. The frontend is hosted on Cloudflare Pages.

## Prerequisites

- Access to Cloudflare Dashboard
- Access to GitHub repository
- Wrangler CLI installed
- Browser developer tools knowledge

## Symptoms

- Site returns 5xx errors
- Blank white page
- "Page not found" for known routes
- JavaScript errors in console
- Extremely slow page loads
- Static assets not loading

## Diagnostic Steps

### Step 1: Verify the Issue

```bash
# Check if site is reachable
curl -I https://split.lease

# Check specific pages
curl -I https://split.lease/search
curl -I https://split.lease/login
```

Expected: HTTP 200 responses with correct content-type headers.

### Step 2: Check Cloudflare Status

1. Visit https://www.cloudflarestatus.com/
2. Look for any ongoing incidents
3. Check if Cloudflare Pages specifically is affected

### Step 3: Check Recent Deployments

```bash
# List recent deployments
npx wrangler pages deployment list --project-name splitlease
```

Note the timestamp of the last deployment. If issues started after a recent deployment, this is likely the cause.

### Step 4: Check Browser Console

1. Open https://split.lease in Chrome/Firefox
2. Open Developer Tools (F12)
3. Check Console tab for JavaScript errors
4. Check Network tab for failed requests

Common issues:
- Failed to load JavaScript bundle
- API endpoint errors (CORS, 500)
- Missing static assets

### Step 5: Check Edge Function Health

If pages load but features don't work:

```bash
# Test auth-user function
curl -X POST https://<project-id>.supabase.co/functions/v1/auth-user \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "payload": {}}'
```

If Edge Functions are failing, see [outage-edge-functions.md](outage-edge-functions.md).

## Resolution Steps

### Scenario 1: Bad Deployment

**Symptoms:** Issues started immediately after a deployment.

**Resolution:**

1. Identify the last known good deployment:
```bash
npx wrangler pages deployment list --project-name splitlease
```

2. Rollback via Cloudflare Dashboard:
   - Go to Cloudflare Dashboard > Pages > splitlease
   - Navigate to Deployments tab
   - Find the previous successful deployment
   - Click "..." > "Rollback to this deployment"

3. Verify site is working

4. Investigate the failed deployment code

### Scenario 2: Build Artifact Issues

**Symptoms:** JavaScript errors, missing chunks, broken routing.

**Resolution:**

1. Rebuild and redeploy:
```bash
cd app
bun install --force
bun run build
bun run deploy
```

2. If build fails, check for:
   - Dependency issues
   - TypeScript errors
   - Route configuration errors

### Scenario 3: DNS/SSL Issues

**Symptoms:** ERR_SSL_PROTOCOL_ERROR, DNS resolution failures.

**Resolution:**

1. Check Cloudflare DNS settings:
   - Verify split.lease CNAME points to Cloudflare Pages
   - Check SSL/TLS mode is set to "Full (strict)"

2. Verify SSL certificate:
   - Go to Cloudflare Dashboard > SSL/TLS > Edge Certificates
   - Ensure certificate is active and valid

3. If certificate issue:
   - Try "Advanced Certificate Manager" to issue new cert
   - Or wait for automatic renewal (usually 15 minutes)

### Scenario 4: Rate Limiting/DDoS

**Symptoms:** Intermittent 429 errors, slow responses, traffic spikes.

**Resolution:**

1. Check Cloudflare Analytics for traffic patterns

2. Enable Under Attack Mode (temporary):
   - Cloudflare Dashboard > Security > Under Attack Mode
   - This adds a challenge page for all visitors

3. Review firewall rules:
   - Block suspicious IP ranges
   - Rate limit aggressive bots

### Scenario 5: Cache Issues

**Symptoms:** Stale content, old version showing after deployment.

**Resolution:**

1. Purge Cloudflare cache:
   - Dashboard > Caching > Configuration > Purge Everything

2. Or purge specific URLs:
   - Dashboard > Caching > Configuration > Custom Purge
   - Enter specific URLs

3. Verify with cache-busting:
```bash
curl -H "Cache-Control: no-cache" https://split.lease
```

### Scenario 6: Route Configuration Issues

**Symptoms:** 404 errors on valid routes, SPA routing broken.

**Resolution:**

1. Regenerate routes:
```bash
cd app
bun run generate-routes
```

2. Check `_redirects` and `_routes.json` files in `dist/`

3. Verify `routes.config.js` is correct

4. Redeploy:
```bash
bun run deploy
```

## Verification

After applying any fix:

1. **Test core pages:**
   - [ ] Home page: https://split.lease
   - [ ] Search: https://split.lease/search
   - [ ] Login: https://split.lease/login
   - [ ] A listing detail page

2. **Test in incognito mode** (bypasses browser cache)

3. **Check from multiple locations:**
   - Use https://downforeveryoneorjustme.com/split.lease
   - Test from mobile network (different ISP)

4. **Monitor for 15 minutes:**
   - Watch error rates
   - Check Cloudflare Analytics

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Cloudflare platform outage | Cloudflare Support |
| Cannot determine root cause | Engineering Lead |
| Security incident suspected | Security Team + Engineering Lead |
| Extended outage (>30 min) | CTO |

## Related Runbooks

- [../deployment/deploy-frontend.md](../deployment/deploy-frontend.md) - Frontend deployment
- [outage-edge-functions.md](outage-edge-functions.md) - Backend function issues
- [incident-response-template.md](incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
