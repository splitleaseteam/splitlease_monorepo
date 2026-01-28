# Log Management

## Overview

This runbook covers log management for the Split Lease platform including Edge Function logs, application logs, and audit trails. Proper log management helps with debugging, compliance, and capacity planning.

## Prerequisites

- Access to Supabase Dashboard
- Supabase CLI installed
- Understanding of log levels and formats

## Log Sources

| Source | Location | Retention |
|--------|----------|-----------|
| Edge Function logs | Supabase Dashboard / CLI | 7 days (Supabase managed) |
| Database logs | Supabase Dashboard | 7 days (Supabase managed) |
| Frontend errors | Browser console / Error boundary | Session only |
| Audit logs | Database tables | Configurable |
| Sync logs | sync_queue table | Until cleanup |

## Viewing Logs

### Edge Function Logs

**Via CLI (preferred for debugging):**
```bash
# Real-time logs
supabase functions logs <function-name> --project-ref <project-id>

# Last N lines
supabase functions logs <function-name> --project-ref <project-id> --tail 200

# Filter by keyword (requires grep)
supabase functions logs auth-user --project-ref <project-id> | grep "ERROR"
```

**Via Dashboard:**
1. Go to Supabase Dashboard > Edge Functions
2. Select the function
3. Click "Logs" tab
4. Filter by time range and level

### Database Logs

**Via Dashboard:**
1. Go to Supabase Dashboard > Database
2. Click "Logs" tab
3. Filter by:
   - Log level (info, warning, error)
   - Time range
   - Query pattern

### Application Audit Logs

```sql
-- View recent audit entries
SELECT * FROM notification_audit
ORDER BY created_at DESC
LIMIT 50;

-- View sync history
SELECT id, table_name, record_id, operation, status, created_at, error_message
FROM sync_queue
ORDER BY created_at DESC
LIMIT 100;
```

## Log Analysis

### Finding Errors

**Edge Function errors:**
```bash
supabase functions logs auth-user --project-ref <project-id> | grep -i "error\|exception\|fail"
```

**Database errors:**
```sql
-- Check pg_stat_statements for failed queries
SELECT query, calls
FROM pg_stat_statements
WHERE query LIKE '%ERROR%' OR query LIKE '%error%'
ORDER BY calls DESC
LIMIT 20;
```

### Tracking User Activity

```sql
-- Recent user actions (if logged)
SELECT user_id, action_type, created_at, details
FROM activity_log
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Sync History

```sql
-- Sync success rate last 24 hours
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sync_queue
WHERE created_at > now() - interval '24 hours'
GROUP BY status;

-- Failed syncs by table
SELECT table_name, COUNT(*) as failures
FROM sync_queue
WHERE status = 'failed'
AND created_at > now() - interval '7 days'
GROUP BY table_name
ORDER BY failures DESC;
```

## Log Cleanup

### Sync Queue Cleanup

**Via Edge Function:**
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup", "payload": {"older_than_days": 30}}'
```

**Via SQL:**
```sql
-- Delete completed sync items older than 30 days
DELETE FROM sync_queue
WHERE status = 'completed'
AND created_at < now() - interval '30 days';

-- Count remaining
SELECT COUNT(*) FROM sync_queue;

-- Vacuum to reclaim space
VACUUM ANALYZE sync_queue;
```

### Audit Log Cleanup

```sql
-- Clean up old audit records
DELETE FROM notification_audit
WHERE created_at < now() - interval '90 days';

-- Archive before deleting (optional)
INSERT INTO notification_audit_archive
SELECT * FROM notification_audit
WHERE created_at < now() - interval '90 days';

DELETE FROM notification_audit
WHERE created_at < now() - interval '90 days';
```

## Log Retention Policy

| Log Type | Retention Period | Action After |
|----------|------------------|--------------|
| Edge Function logs | 7 days | Auto-deleted by Supabase |
| Database logs | 7 days | Auto-deleted by Supabase |
| sync_queue (completed) | 30 days | Delete via cleanup |
| sync_queue (failed) | 90 days | Manual review, then delete |
| notification_audit | 90 days | Archive, then delete |
| Activity logs | 1 year | Archive to cold storage |

## Log-Based Alerting

### Setting Up Alerts

While Supabase doesn't have built-in alerting, you can:

1. **Use Slack notifications** (already implemented):
   - Error logs are sent to Slack via `_shared/slack.ts`
   - Check #alerts channel for function errors

2. **Create monitoring queries:**
```sql
-- High error rate check
SELECT
    CASE
        WHEN COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) > 10
        THEN 'ALERT: High failure rate'
        ELSE 'OK'
    END as status
FROM sync_queue
WHERE created_at > now() - interval '1 hour';
```

3. **Schedule health checks** via external monitoring (e.g., Uptime Robot)

## Debugging with Logs

### Tracing a Request

1. **Identify correlation ID** from error message
2. **Search logs:**
```bash
supabase functions logs auth-user --project-ref <project-id> | grep "<correlation-id>"
```

3. **Check related tables:**
```sql
SELECT * FROM sync_queue
WHERE idempotency_key LIKE '%<record-id>%'
ORDER BY created_at DESC;
```

### Common Log Patterns

**Successful request:**
```
[auth-user] ========== REQUEST RECEIVED ==========
[auth-user] Method: POST
[auth-user] Action: validate
[auth-user] ========== REQUEST SUCCESS ==========
```

**Failed request:**
```
[auth-user] ========== REQUEST RECEIVED ==========
[auth-user] Method: POST
[auth-user] Action: login
[auth-user] ========== REQUEST ERROR ==========
[auth-user] Error: Invalid credentials
```

**Sync failure:**
```
[bubble_sync] Processing: user/abc123 (UPDATE)
[bubble_sync] Error: 400 Unrecognized field: pending
[bubble_sync] Marked as failed: abc123
```

## Log Security

### Sensitive Data

Logs should NOT contain:
- Passwords
- API keys
- Full credit card numbers
- Personal identification numbers

If sensitive data is found in logs:
1. Identify the source
2. Fix the logging code
3. Document the incident

### Access Control

- Only authorized personnel should access production logs
- Use Supabase RBAC to limit dashboard access
- Audit who accesses logs

## Troubleshooting

### Can't Find Logs

1. **Check time range** - logs may have expired
2. **Check project** - ensure correct project-ref
3. **Check function name** - exact match required

### Logs Missing Information

1. **Add structured logging** to functions
2. **Include correlation IDs** in all requests
3. **Log input/output** for debugging (but sanitize sensitive data)

### High Log Volume

1. **Reduce log level** in non-critical functions
2. **Sample logging** for high-volume operations
3. **Aggregate** similar logs

## Verification

After any log cleanup:

1. **Verify data retained:**
```sql
SELECT MIN(created_at), MAX(created_at), COUNT(*)
FROM sync_queue;
```

2. **Check table size reduced:**
```sql
SELECT pg_size_pretty(pg_total_relation_size('sync_queue'));
```

3. **Monitor for issues** related to missing historical data

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Logs showing security incident | Security Team immediately |
| Can't access production logs | DevOps Lead |
| Unexpected log deletion | Database Admin |
| Log volume causing issues | Engineering Lead |

## Related Runbooks

- [database-maintenance.md](database-maintenance.md) - Database maintenance
- [../incidents/incident-response-template.md](../incidents/incident-response-template.md) - Incident response
- [../oncall/troubleshooting-guide.md](../oncall/troubleshooting-guide.md) - Troubleshooting

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
