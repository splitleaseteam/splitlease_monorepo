# Deploy Supabase Edge Functions

## Overview

This runbook covers deploying Supabase Edge Functions (Deno-based serverless functions) to both development and production environments. Edge Functions handle all backend API operations including authentication, proposals, listings, messaging, and Bubble sync.

## Prerequisites

- Supabase CLI installed (`bun add -g supabase`)
- Access to Supabase projects:
  - Development: `splitlease-backend-dev`
  - Production: `splitlease-backend-live`
- Supabase project linked locally
- Environment secrets configured in Supabase dashboard

## Edge Functions Inventory

| Function | Purpose | Critical |
|----------|---------|----------|
| auth-user | Authentication (login, signup, password reset) | YES |
| proposal | Proposal CRUD operations | YES |
| listing | Listing CRUD operations | YES |
| messages | Real-time messaging | YES |
| bubble_sync | Supabase to Bubble synchronization | YES |
| pricing | Price calculations | YES |
| ai-gateway | OpenAI proxy for AI features | NO |
| communications | Email/SMS sending | YES |
| send-email | Email delivery | YES |
| send-sms | SMS delivery | YES |
| virtual-meeting | Virtual meeting management | NO |
| cohost-request | Co-host request handling | NO |
| emergency | Emergency contact management | NO |

## Pre-Deployment Checklist

- [ ] Deno linting passes (`deno lint supabase/functions/`)
- [ ] Deno formatting correct (`deno fmt --check supabase/functions/`)
- [ ] Function tested locally with `supabase functions serve`
- [ ] Secrets verified in Supabase dashboard
- [ ] No breaking API changes (or frontend updated accordingly)

## Procedure

### Step 1: Verify Local Environment

```bash
# Check Supabase CLI version
supabase --version

# Verify linked project
supabase projects list
```

### Step 2: Run Deno Checks

```bash
# Lint all functions
deno lint supabase/functions/

# Check formatting
deno fmt --check supabase/functions/
```

Fix any issues before proceeding.

### Step 3: Test Functions Locally

```bash
# Start local Supabase (if not running)
supabase start

# Serve all functions locally with hot reload
supabase functions serve

# Or serve a specific function
supabase functions serve auth-user
```

Test the function with curl or Postman:
```bash
curl -X POST http://localhost:54321/functions/v1/auth-user \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "payload": {}}'
```

### Step 4: Deploy Single Function

**To Development:**
```bash
supabase functions deploy <function-name> --project-ref <dev-project-id>
```

**To Production:**
```bash
supabase functions deploy <function-name> --project-ref <live-project-id>
```

Example:
```bash
# Deploy auth-user to development
supabase functions deploy auth-user --project-ref <dev-project-id>
```

### Step 5: Deploy All Functions

**Deploy all functions to development:**
```bash
supabase functions deploy --project-ref <dev-project-id>
```

**Deploy all functions to production:**
```bash
supabase functions deploy --project-ref <live-project-id>
```

### Step 6: Verify Secrets

Ensure all required secrets are set for the deployed function:

```bash
# List secrets (shows names, not values)
supabase secrets list --project-ref <project-id>
```

Required secrets for most functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Function-specific secrets:
- `OPENAI_API_KEY` - ai-gateway, ai-tools
- `BUBBLE_API_KEY` - bubble_sync
- `BUBBLE_BASE_URL` - bubble_sync
- `TWILIO_ACCOUNT_SID` - send-sms
- `TWILIO_AUTH_TOKEN` - send-sms
- `SENDGRID_API_KEY` - send-email
- `SLACK_WEBHOOK_URL` - slack

### Step 7: Set/Update Secrets

```bash
# Set a single secret
supabase secrets set SECRET_NAME=value --project-ref <project-id>

# Set multiple secrets from file
supabase secrets set --env-file .env.production --project-ref <project-id>
```

## Verification

### Check Function Status

```bash
# View function logs
supabase functions logs <function-name> --project-ref <project-id>
```

### Test Deployed Function

```bash
# Get the function URL
# Development: https://<dev-project-id>.supabase.co/functions/v1/<function-name>
# Production: https://<live-project-id>.supabase.co/functions/v1/<function-name>

# Test with curl
curl -X POST https://<project-id>.supabase.co/functions/v1/auth-user \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "payload": {}}'
```

### Health Check Pattern

Most functions support a health check action:
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/<function-name> \
  -H "Content-Type: application/json" \
  -d '{"action": "health", "payload": {}}'
```

## Rollback

### Option 1: Redeploy Previous Version

```bash
# Check out the previous working commit
git checkout <previous-commit-hash>

# Deploy that version
supabase functions deploy <function-name> --project-ref <project-id>

# Return to main
git checkout main
```

### Option 2: Disable Function (Emergency)

In extreme cases, you can disable a function through the Supabase dashboard:
1. Go to Supabase Dashboard > Edge Functions
2. Find the problematic function
3. Toggle it off (if available) or delete it
4. Note: This will cause 404 errors for that endpoint

### Option 3: Quick Fix Deploy

For critical fixes:
```bash
# Make the fix
# Test locally
supabase functions serve <function-name>

# Deploy immediately
supabase functions deploy <function-name> --project-ref <project-id>
```

## Troubleshooting

### Function Not Found (404)

1. Verify function is deployed: `supabase functions list --project-ref <project-id>`
2. Check function name matches exactly
3. Ensure JWT verification setting matches your request

### Function Errors (500)

1. Check logs: `supabase functions logs <function-name> --project-ref <project-id>`
2. Verify all required secrets are set
3. Check for runtime errors in the code

### Timeout Errors

1. Edge Functions have a 150-second timeout (Pro plan) or 2-second (Free plan)
2. Optimize slow operations
3. Consider breaking into multiple functions

### Secret Not Found

```bash
# List current secrets
supabase secrets list --project-ref <project-id>

# Set missing secret
supabase secrets set MISSING_SECRET=value --project-ref <project-id>
```

### CORS Issues

Verify CORS headers are set in the function's response:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Deployment fails repeatedly | DevOps Lead |
| Secret management issues | Security Team |
| Function timeout/performance | Engineering Lead |
| Supabase platform issues | Supabase Support |

## Related Runbooks

- [deploy-frontend.md](deploy-frontend.md) - Frontend deployment
- [deploy-database-migrations.md](deploy-database-migrations.md) - Database changes
- [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md) - Function outage response
- [../incidents/outage-bubble-sync.md](../incidents/outage-bubble-sync.md) - Bubble sync issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
