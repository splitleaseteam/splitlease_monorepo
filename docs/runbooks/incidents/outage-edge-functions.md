# Edge Functions Outage Response

## Overview

This runbook covers diagnosing and resolving issues when Supabase Edge Functions are failing, timing out, or returning errors. Edge Functions handle all backend API operations including authentication, proposals, listings, and sync.

## Prerequisites

- Access to Supabase Dashboard
- Supabase CLI installed
- Understanding of Edge Function architecture

## Symptoms

- API calls returning 500 errors
- "Function not found" (404) errors
- Timeout errors (504)
- CORS errors in browser
- Authentication failing
- Data not saving/loading

## Critical Functions

These functions, if failing, cause major user impact:

| Function | Impact if Down |
|----------|---------------|
| auth-user | All authentication fails |
| proposal | Cannot create/view proposals |
| listing | Cannot view/edit listings |
| messages | Chat broken |
| pricing | Price calculations fail |
| bubble_sync | Data out of sync with Bubble |

## Diagnostic Steps

### Step 1: Identify Failing Function(s)

Check browser Network tab or server logs to identify which function is failing.

### Step 2: Check Function Logs

```bash
# View real-time logs
supabase functions logs <function-name> --project-ref <project-id>

# View last 100 lines
supabase functions logs <function-name> --project-ref <project-id> --tail 100
```

Look for:
- Error messages
- Stack traces
- Request/response patterns
- Memory/timeout issues

### Step 3: Check Supabase Status

1. Visit https://status.supabase.com/
2. Check for Edge Functions incidents
3. Check for database/auth incidents (may affect functions)

### Step 4: Test Function Directly

```bash
# Test a function with curl
curl -X POST https://<project-id>.supabase.co/functions/v1/auth-user \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "validate", "payload": {}}'
```

Expected: JSON response (even if error, should be formatted)

### Step 5: Check Secrets

```bash
# List configured secrets
supabase secrets list --project-ref <project-id>
```

Verify all required secrets are present.

### Step 6: Check Database Connectivity

If functions are timing out on DB operations:

1. Go to Supabase Dashboard > Database
2. Check connection pool usage
3. Verify database is responsive

## Resolution Steps

### Scenario 1: Function Code Error

**Symptoms:** 500 errors with stack traces in logs.

**Resolution:**

1. Identify the error from logs:
```bash
supabase functions logs <function-name> --project-ref <project-id>
```

2. Fix the code locally

3. Test locally:
```bash
supabase functions serve <function-name>
```

4. Deploy fix:
```bash
supabase functions deploy <function-name> --project-ref <project-id>
```

### Scenario 2: Missing/Invalid Secrets

**Symptoms:** "Environment variable not found" errors.

**Resolution:**

1. Identify missing secret from logs

2. Set the secret:
```bash
supabase secrets set SECRET_NAME=value --project-ref <project-id>
```

3. Verify function works

Common secrets needed:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for AI functions)
- `BUBBLE_API_KEY` (for bubble_sync)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` (for SMS)

### Scenario 3: Function Not Deployed

**Symptoms:** 404 "Function not found" errors.

**Resolution:**

1. Check if function exists:
```bash
supabase functions list --project-ref <project-id>
```

2. Deploy the function:
```bash
supabase functions deploy <function-name> --project-ref <project-id>
```

3. Verify:
```bash
supabase functions list --project-ref <project-id>
```

### Scenario 4: Timeout Issues

**Symptoms:** 504 Gateway Timeout, function takes too long.

**Resolution:**

1. Check what operation is slow:
   - Database queries
   - External API calls
   - Heavy computation

2. For slow database queries:
   - Add indexes
   - Optimize query
   - Use pagination

3. For external API calls:
   - Add timeouts
   - Implement caching
   - Use async processing (queue)

4. Emergency: Break up the operation
   - Use queue-based processing
   - Return immediately, process async

### Scenario 5: Memory Issues

**Symptoms:** Function crashes, "Out of memory" errors.

**Resolution:**

1. Check for memory leaks:
   - Large data processing
   - Unbounded loops
   - Accumulated state

2. Optimize memory usage:
   - Process data in chunks
   - Stream large responses
   - Clear intermediate data

3. Consider splitting function

### Scenario 6: CORS Errors

**Symptoms:** Browser shows CORS errors, OPTIONS requests fail.

**Resolution:**

1. Verify CORS headers in function:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

2. Ensure OPTIONS requests return 200 with headers

3. Check if function is throwing error before returning headers

### Scenario 7: Database Connection Pool Exhausted

**Symptoms:** Functions hang then timeout, "connection pool" errors.

**Resolution:**

1. Check Supabase Dashboard > Database > Connection Pooling

2. Immediate mitigation:
   - Increase pool size (if available)
   - Restart functions (may close connections)

3. Long-term fix:
   - Use connection pooling properly
   - Close connections after use
   - Reduce concurrent operations

### Scenario 8: All Functions Down (Platform Issue)

**Symptoms:** All Edge Functions failing, Supabase status shows issues.

**Resolution:**

1. Check https://status.supabase.com/

2. If confirmed Supabase outage:
   - Document incident
   - Notify stakeholders
   - Wait for Supabase to resolve

3. If not acknowledged by Supabase:
   - Open support ticket
   - Escalate if critical

## Quick Recovery Commands

```bash
# Redeploy a single function
supabase functions deploy <function-name> --project-ref <project-id>

# Redeploy all functions
supabase functions deploy --project-ref <project-id>

# Check function logs
supabase functions logs <function-name> --project-ref <project-id> --tail 100

# Set a secret
supabase secrets set KEY=value --project-ref <project-id>
```

## Verification

After applying any fix:

1. **Test the specific function:**
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/<function-name> \
  -H "Content-Type: application/json" \
  -d '{"action": "test_action", "payload": {}}'
```

2. **Test from frontend:**
   - Perform the user action that was failing
   - Check browser Network tab for 200 responses

3. **Monitor logs:**
```bash
supabase functions logs <function-name> --project-ref <project-id>
```

4. **Check error rates** for 15 minutes

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Supabase platform outage | Supabase Support |
| Cannot diagnose issue | Engineering Lead |
| Multiple functions failing | All hands |
| Security-related error | Security Team |

## Related Runbooks

- [../deployment/deploy-edge-functions.md](../deployment/deploy-edge-functions.md) - Function deployment
- [outage-database.md](outage-database.md) - Database issues
- [outage-bubble-sync.md](outage-bubble-sync.md) - Bubble sync issues
- [incident-response-template.md](incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
