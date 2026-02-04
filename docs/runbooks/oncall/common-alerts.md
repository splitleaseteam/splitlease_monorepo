# Common Alerts

## Overview

This runbook documents common alerts, their causes, and resolution steps. Use this as a quick reference when responding to alerts.

## Prerequisites

- Access to Supabase Dashboard
- Access to Cloudflare Dashboard
- Supabase CLI installed
- Understanding of Split Lease architecture

## Alert Categories

| Category | Source | Severity Range |
|----------|--------|---------------|
| Frontend | Cloudflare | SEV2-SEV4 |
| Edge Functions | Supabase Logs | SEV1-SEV3 |
| Database | Supabase | SEV1-SEV3 |
| Sync Queue | Custom Monitoring | SEV2-SEV4 |
| Authentication | Edge Function Logs | SEV1-SEV3 |

---

## Frontend Alerts

### Alert: High Error Rate (5xx)

**Severity:** SEV2

**Symptoms:**
- Cloudflare showing elevated 5xx errors
- Users reporting "site down" or errors

**Quick Diagnosis:**
1. Check Cloudflare Analytics for error patterns
2. Check recent deployments
3. Check Edge Function health

**Resolution:**
1. If recent deployment: Rollback via Cloudflare Dashboard
2. If Edge Functions failing: See [Edge Function Alerts](#edge-function-alerts)
3. If Cloudflare issue: Check status.cloudflare.com

**Runbook:** [../incidents/outage-frontend.md](../incidents/outage-frontend.md)

---

### Alert: Slow Response Times

**Severity:** SEV3

**Symptoms:**
- Cloudflare showing TTFB >1s
- Users reporting slow page loads

**Quick Diagnosis:**
1. Check which pages are slow
2. Check Edge Function response times
3. Check database query performance

**Resolution:**
1. If all pages slow: Check Edge Functions or database
2. If specific pages: Check those page's data queries
3. If intermittent: May be traffic spike

**Runbook:** [../incidents/outage-frontend.md](../incidents/outage-frontend.md)

---

## Edge Function Alerts

### Alert: Function Error Spike

**Severity:** SEV2

**Symptoms:**
- Slack notification of function errors
- High error count in function logs

**Quick Diagnosis:**
```bash
supabase functions logs <function-name> --project-ref <project-id> --tail 50
```

**Resolution:**
1. Identify error type from logs
2. If secret missing: `supabase secrets set KEY=value`
3. If code error: Fix and redeploy
4. If dependency issue: Check Deno cache

**Runbook:** [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md)

---

### Alert: Function Timeout

**Severity:** SEV3

**Symptoms:**
- 504 Gateway Timeout errors
- Functions not completing

**Quick Diagnosis:**
1. Check which operation is slow
2. Check database for blocking queries
3. Check external API responses

**Resolution:**
1. If database slow: Check for locks, run ANALYZE
2. If external API slow: Add timeout, consider queue
3. If computation heavy: Optimize or split operation

**Runbook:** [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md)

---

### Alert: Auth Function Failing

**Severity:** SEV1

**Symptoms:**
- Users cannot log in
- auth-user function returning errors
- Login page showing errors

**Quick Diagnosis:**
```bash
supabase functions logs auth-user --project-ref <project-id> --tail 50
```

**Resolution:**
1. Check SUPABASE_SERVICE_ROLE_KEY is set
2. Verify Supabase Auth service status
3. Check for code regression
4. Redeploy if needed

**Runbook:** [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md)

---

## Database Alerts

### Alert: Connection Pool Exhausted

**Severity:** SEV2

**Symptoms:**
- "Too many connections" errors
- Queries timing out
- Functions failing

**Quick Diagnosis:**
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Resolution:**
1. Kill idle connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '5 minutes';
```
2. Check for connection leaks in functions
3. Increase pool size if needed

**Runbook:** [../incidents/outage-database.md](../incidents/outage-database.md)

---

### Alert: High CPU Usage

**Severity:** SEV3

**Symptoms:**
- Slow query execution
- Dashboard showing high CPU

**Quick Diagnosis:**
```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC
LIMIT 5;
```

**Resolution:**
1. Identify and kill expensive queries
2. Check for missing indexes
3. Run ANALYZE on affected tables

**Runbook:** [../incidents/outage-database.md](../incidents/outage-database.md)

---

### Alert: Disk Space Warning

**Severity:** SEV2 (>80%), SEV1 (>90%)

**Symptoms:**
- Dashboard disk usage alert
- Write operations failing (if full)

**Quick Diagnosis:**
```sql
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
LIMIT 10;
```

**Resolution:**
1. Delete old sync_queue records
2. Archive old data
3. Run VACUUM FULL on large tables
4. Consider upgrading plan if persistent

**Runbook:** [../incidents/outage-database.md](../incidents/outage-database.md)

---

## Sync Queue Alerts

### Alert: Sync Queue Growing

**Severity:** SEV3

**Symptoms:**
- Pending items count increasing
- Data not appearing in Bubble

**Quick Diagnosis:**
```sql
SELECT status, COUNT(*)
FROM sync_queue
GROUP BY status;
```

**Resolution:**
1. Trigger manual processing:
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "process_queue_data_api", "payload": {"batch_size": 50}}'
```
2. Check for Bubble API issues
3. Check for failed items blocking queue

**Runbook:** [../incidents/outage-bubble-sync.md](../incidents/outage-bubble-sync.md)

---

### Alert: High Sync Failure Rate

**Severity:** SEV3

**Symptoms:**
- Many items in 'failed' status
- Repeated failures for same records

**Quick Diagnosis:**
```sql
SELECT error_message, COUNT(*)
FROM sync_queue
WHERE status = 'failed'
GROUP BY error_message
ORDER BY count DESC
LIMIT 5;
```

**Resolution:**
1. If auth error: Update BUBBLE_API_KEY
2. If field error: Update field mapping
3. If rate limited: Reduce batch size
4. Retry after fixing:
```bash
curl ... -d '{"action": "retry_failed", "payload": {"batch_size": 20}}'
```

**Runbook:** [../incidents/outage-bubble-sync.md](../incidents/outage-bubble-sync.md)

---

## Application Alerts

### Alert: Payment Processing Failure

**Severity:** SEV2

**Symptoms:**
- Users reporting payment failures
- Stripe webhook errors in logs

**Quick Diagnosis:**
1. Check Stripe Dashboard for webhook status
2. Check payment-related function logs
3. Verify Stripe API keys

**Resolution:**
1. Verify STRIPE_SECRET_KEY is set
2. Check Stripe service status
3. Review recent code changes to payment flow

**Runbook:** [../business/payment-issues.md](../business/payment-issues.md)

---

### Alert: Proposal Creation Failing

**Severity:** SEV2

**Symptoms:**
- Users cannot create proposals
- proposal function returning errors

**Quick Diagnosis:**
```bash
supabase functions logs proposal --project-ref <project-id> --tail 50
```

**Resolution:**
1. Check for database constraint errors
2. Verify listing exists
3. Check for auth issues
4. Review validation errors

**Runbook:** [../business/proposal-stuck.md](../business/proposal-stuck.md)

---

## Quick Reference Commands

```bash
# Check function logs
supabase functions logs <name> --project-ref <id> --tail 50

# Redeploy function
supabase functions deploy <name> --project-ref <id>

# Set secret
supabase secrets set KEY=value --project-ref <id>

# Trigger sync processing
curl -X POST https://<id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "process_queue_data_api", "payload": {"batch_size": 50}}'
```

## Escalation Matrix

| Alert Type | First Response | Escalate If |
|------------|---------------|-------------|
| Frontend down | Fix or rollback | >15 min unresolved |
| Auth failing | Investigate | >15 min unresolved |
| Database connection | Kill connections | Recurring |
| Sync failures | Manual process | >1hr backlog |
| Payment failures | Investigate | Any user-reported |

## Related Runbooks

- [troubleshooting-guide.md](troubleshooting-guide.md) - General troubleshooting
- [oncall-handoff.md](oncall-handoff.md) - Shift handoffs
- [../incidents/incident-response-template.md](../incidents/incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
