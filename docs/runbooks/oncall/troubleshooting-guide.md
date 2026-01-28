# Troubleshooting Guide

## Overview

This guide provides general troubleshooting procedures for Split Lease platform issues. Use this as a starting point when investigating problems that don't have a specific runbook.

## Prerequisites

- Access to Supabase Dashboard
- Access to Cloudflare Dashboard
- Supabase CLI installed
- Browser developer tools knowledge
- Basic SQL knowledge

## General Troubleshooting Framework

### 1. Identify the Problem

- What is the user experiencing?
- When did it start?
- Is it reproducible?
- How many users affected?

### 2. Gather Information

- Check monitoring dashboards
- Review recent changes
- Collect error messages
- Get user context (browser, device, account)

### 3. Form Hypothesis

- Based on symptoms, what could cause this?
- What changed recently?
- Is it infrastructure or application?

### 4. Test and Verify

- Test the hypothesis
- Make one change at a time
- Document what you try

### 5. Resolve and Document

- Implement fix
- Verify fix works
- Document for future reference

---

## How to Access Logs

### Edge Function Logs

**Via CLI:**
```bash
# Real-time logs for a function
supabase functions logs <function-name> --project-ref <project-id>

# Last 100 lines
supabase functions logs <function-name> --project-ref <project-id> --tail 100

# Grep for specific text
supabase functions logs auth-user --project-ref <project-id> | grep "ERROR"
```

**Via Dashboard:**
1. Go to Supabase Dashboard
2. Select your project
3. Navigate to Edge Functions
4. Click on the function
5. View Logs tab

### Database Logs

**Via Dashboard:**
1. Supabase Dashboard > Database
2. Logs tab
3. Filter by time and level

**Via SQL (for query history):**
```sql
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Frontend Errors

**Via Browser:**
1. Open Chrome/Firefox DevTools (F12)
2. Console tab for JavaScript errors
3. Network tab for API failures
4. Application tab for storage issues

---

## How to Check Function Health

### Quick Health Check

```bash
# Test if function responds
curl -X POST https://<project-id>.supabase.co/functions/v1/<function-name> \
  -H "Content-Type: application/json" \
  -d '{"action": "get_status", "payload": {}}'
```

### Check All Functions

```bash
# List deployed functions
supabase functions list --project-ref <project-id>
```

### Function Not Responding

1. Check if deployed: `supabase functions list`
2. Check logs for startup errors
3. Verify secrets are set: `supabase secrets list`
4. Try redeploying: `supabase functions deploy <name>`

---

## How to Verify Database State

### Check Table Counts

```sql
SELECT
    'user' as table_name, COUNT(*) as count FROM "user"
UNION ALL
SELECT 'listing', COUNT(*) FROM listing
UNION ALL
SELECT 'proposal', COUNT(*) FROM proposal
UNION ALL
SELECT 'message', COUNT(*) FROM message;
```

### Check for Orphaned Records

```sql
-- Proposals without valid listings
SELECT p._id FROM proposal p
LEFT JOIN listing l ON p.listing_id = l._id
WHERE p.listing_id IS NOT NULL AND l._id IS NULL;

-- Messages without valid threads
SELECT m._id FROM message m
LEFT JOIN thread t ON m.thread_id = t._id
WHERE m.thread_id IS NOT NULL AND t._id IS NULL;
```

### Check Sync Queue Status

```sql
SELECT
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM sync_queue
GROUP BY status;
```

### Check for Locks

```sql
SELECT pid, usename, query, state, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

---

## How to Restart Services

### Redeploy Edge Function

```bash
# Redeploy single function
supabase functions deploy <function-name> --project-ref <project-id>

# Redeploy all functions
supabase functions deploy --project-ref <project-id>
```

### Clear Frontend Cache

**Cloudflare:**
1. Dashboard > Caching > Configuration
2. Purge Everything (or specific URLs)

**User's Browser:**
- Instruct user to hard refresh (Ctrl+Shift+R)
- Or clear browser cache

### Database Connection Reset

```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '10 minutes';
```

---

## Common Issues and Solutions

### Issue: "Network Error" in Frontend

**Diagnosis:**
1. Check browser Network tab
2. Look for CORS errors
3. Check if API endpoint is correct

**Solutions:**
- If CORS: Check function returns proper headers
- If 404: Check function is deployed
- If timeout: Check function performance

### Issue: Data Not Saving

**Diagnosis:**
1. Check browser Network tab for API response
2. Check Edge Function logs
3. Check database for record

**Solutions:**
- If 400: Check payload validation
- If 500: Check function logs for error
- If success but no data: Check RLS policies

### Issue: User Can't Log In

**Diagnosis:**
1. Check auth-user function logs
2. Check if user exists in database
3. Test with known good credentials

**Solutions:**
- If user not found: Check email/registration
- If password wrong: Reset password flow
- If function error: Check auth-user deployment

### Issue: Slow Page Load

**Diagnosis:**
1. Check browser Network tab for slow requests
2. Check Edge Function execution times
3. Check database query performance

**Solutions:**
- If API slow: Optimize function or queries
- If static assets slow: Check Cloudflare cache
- If JavaScript heavy: Check for unnecessary renders

### Issue: Missing Data

**Diagnosis:**
1. Query database directly for the data
2. Check sync_queue for pending/failed items
3. Check for RLS policy blocking

**Solutions:**
- If in DB but not showing: Check RLS
- If not in DB: Check if created correctly
- If in sync_queue: Check for sync failures

### Issue: Duplicate Records

**Diagnosis:**
1. Check for unique constraints
2. Look for race conditions
3. Check for retry logic issues

**Solutions:**
- Add unique constraints if missing
- Implement idempotency keys
- Review and fix retry logic

---

## Debugging Edge Functions

### Enable Verbose Logging

Add to function:
```typescript
console.log('[function_name] DEBUG:', JSON.stringify(data, null, 2));
```

### Test Locally

```bash
# Start local Supabase
supabase start

# Serve function with hot reload
supabase functions serve <function-name>

# Test with curl
curl -X POST http://localhost:54321/functions/v1/<function-name> \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "payload": {}}'
```

### Check Environment

```bash
# Verify secrets are set
supabase secrets list --project-ref <project-id>

# Set missing secret
supabase secrets set KEY=value --project-ref <project-id>
```

---

## Debugging Database Issues

### Identify Slow Queries

```sql
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
AND state != 'idle';
```

### Check Index Usage

```sql
SELECT
    relname,
    seq_scan,
    idx_scan,
    n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

### Analyze Query Plan

```sql
EXPLAIN ANALYZE
SELECT * FROM listing WHERE status = 'active' LIMIT 10;
```

---

## Debugging Frontend Issues

### Check React Errors

In browser console, look for:
- Red errors from React
- "Uncaught TypeError"
- "Cannot read property of undefined"

### Check Network Requests

1. Open DevTools > Network
2. Filter by "Fetch/XHR"
3. Look for red (failed) requests
4. Check response body for error details

### Check Local Storage

1. DevTools > Application > Local Storage
2. Check for corrupted data
3. Try clearing and refreshing

---

## When to Escalate

| Situation | Escalate To |
|-----------|-------------|
| Cannot diagnose after 30 min | Engineering Lead |
| Security-related | Security Team |
| Data corruption | Database Admin |
| Affecting revenue | Engineering Lead + CTO |
| External service down | Contact that service |

## Escalation Information

When escalating, provide:
1. Summary of the issue
2. What you've tried
3. Relevant logs/screenshots
4. Timeline of events
5. Current impact

## Related Runbooks

- [common-alerts.md](common-alerts.md) - Specific alert responses
- [oncall-handoff.md](oncall-handoff.md) - Shift management
- [../incidents/incident-response-template.md](../incidents/incident-response-template.md) - Incident process

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
