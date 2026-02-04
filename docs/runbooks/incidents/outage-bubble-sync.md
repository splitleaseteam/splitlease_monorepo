# Bubble Sync Outage Response

## Overview

This runbook covers diagnosing and resolving issues with the Supabase to Bubble synchronization system. The sync system uses a queue-based approach where changes in Supabase are queued and processed to update Bubble (legacy system).

## Prerequisites

- Access to Supabase Dashboard
- Access to Bubble.io Admin
- Understanding of the sync architecture
- Access to `bubble_sync` Edge Function logs

## Architecture Overview

```
Supabase Tables
    ↓ (Insert/Update/Delete)
sync_queue table (status: pending)
    ↓ (bubble_sync function processes)
Bubble.io Data API
    ↓ (on success)
sync_queue updated (status: completed)
```

## Symptoms

- Data changes in Supabase not appearing in Bubble
- `sync_queue` table growing with pending items
- High number of failed sync items
- Bubble showing stale data
- "Sync failed" errors in logs

## Diagnostic Steps

### Step 1: Check Sync Queue Status

In Supabase SQL Editor:
```sql
-- Queue summary
SELECT status, COUNT(*)
FROM sync_queue
GROUP BY status;

-- Recent failed items
SELECT id, table_name, record_id, operation, error_message, created_at
FROM sync_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- Pending items older than 1 hour (backlog)
SELECT COUNT(*)
FROM sync_queue
WHERE status = 'pending'
AND created_at < now() - interval '1 hour';
```

### Step 2: Check bubble_sync Logs

```bash
supabase functions logs bubble_sync --project-ref <project-id> --tail 100
```

Look for:
- Error messages
- Bubble API response codes
- Processing rate
- Specific record failures

### Step 3: Verify Bubble API

Test Bubble API directly:
```bash
curl -X GET "https://<app-name>.bubbleapps.io/api/1.1/obj/User" \
  -H "Authorization: Bearer <BUBBLE_API_KEY>"
```

Expected: JSON response with data.

### Step 4: Check Bubble Status

1. Log into Bubble.io Admin
2. Check Server logs for errors
3. Verify API workflows are active
4. Check capacity/rate limits

### Step 5: Verify Secrets

```bash
supabase secrets list --project-ref <project-id>
```

Ensure these are set:
- `BUBBLE_API_KEY`
- `BUBBLE_BASE_URL`

## Resolution Steps

### Scenario 1: Sync Queue Backlog

**Symptoms:** Large number of pending items.

**Resolution:**

1. Check current processing:
```bash
supabase functions logs bubble_sync --project-ref <project-id>
```

2. Manually trigger processing:
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "process_queue_data_api", "payload": {"batch_size": 50}}'
```

3. Monitor progress:
```sql
SELECT status, COUNT(*) FROM sync_queue GROUP BY status;
```

4. If backlog is huge (>1000), increase batch size:
```bash
curl -X POST ... -d '{"action": "process_queue_data_api", "payload": {"batch_size": 100}}'
```

### Scenario 2: Bubble API Errors (401/403)

**Symptoms:** All sync items failing with auth errors.

**Resolution:**

1. Verify API key is correct:
   - Check Bubble > Settings > API > API Token
   - Compare with Supabase secret

2. Update secret if needed:
```bash
supabase secrets set BUBBLE_API_KEY=new_key --project-ref <project-id>
```

3. Check Bubble API is enabled:
   - Bubble > Settings > API > "Enable Data API"

4. Retry failed items:
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "retry_failed", "payload": {"batch_size": 20}}'
```

### Scenario 3: Bubble API Rate Limited (429)

**Symptoms:** Sync items failing with 429 errors.

**Resolution:**

1. Check Bubble capacity limits in Bubble > Settings > Logs

2. Reduce batch size:
```bash
curl -X POST ... -d '{"action": "process_queue_data_api", "payload": {"batch_size": 10}}'
```

3. Add delay between batches (requires code change)

4. Contact Bubble support for capacity increase

### Scenario 4: Specific Records Failing

**Symptoms:** Most items succeed, some consistently fail.

**Resolution:**

1. Find failing records:
```sql
SELECT * FROM sync_queue
WHERE status = 'failed'
ORDER BY retry_count DESC
LIMIT 10;
```

2. Check the payload:
```sql
SELECT id, table_name, record_id, payload, error_message
FROM sync_queue
WHERE record_id = '<failing-record-id>';
```

3. Common issues:
   - Invalid data format
   - Missing required fields
   - Bubble field doesn't exist
   - Data too large

4. Fix the data or mark as skipped:
```sql
-- Skip permanently broken records
UPDATE sync_queue
SET status = 'skipped'
WHERE record_id = '<record-id>'
AND status = 'failed';
```

### Scenario 5: Bubble Field Mismatch

**Symptoms:** "Unrecognized field" errors.

**Resolution:**

1. Check error message for field name

2. Verify field exists in Bubble data type

3. If field shouldn't sync, add to filter list:
   - Edit `supabase/functions/_shared/queueSync.ts`
   - Add field to `BUBBLE_INCOMPATIBLE_FIELDS`

4. Deploy updated function:
```bash
supabase functions deploy bubble_sync --project-ref <project-id>
```

5. Retry failed items

### Scenario 6: Function Not Running

**Symptoms:** Queue growing, no processing happening.

**Resolution:**

1. Check if function exists:
```bash
supabase functions list --project-ref <project-id>
```

2. Check function logs for startup errors:
```bash
supabase functions logs bubble_sync --project-ref <project-id>
```

3. Redeploy function:
```bash
supabase functions deploy bubble_sync --project-ref <project-id>
```

4. Manually trigger:
```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_status", "payload": {}}'
```

### Scenario 7: Complete Sync Failure

**Symptoms:** All syncs failing, possibly Bubble down.

**Resolution:**

1. Check Bubble status at https://status.bubble.io/

2. If Bubble is down:
   - Document the outage
   - Monitor Bubble status
   - Items will queue and process when Bubble recovers

3. If Bubble is up but all syncs fail:
   - Check Bubble API endpoint URL
   - Verify BUBBLE_BASE_URL secret
   - Check for Bubble app changes (renamed?)

## Cleanup Procedures

### Clean Up Old Completed Items

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"action": "cleanup", "payload": {"older_than_days": 7}}'
```

Or via SQL:
```sql
DELETE FROM sync_queue
WHERE status = 'completed'
AND created_at < now() - interval '7 days';
```

### Reset Stuck Items

```sql
-- Reset items stuck in 'processing' (may have crashed)
UPDATE sync_queue
SET status = 'pending'
WHERE status = 'processing'
AND updated_at < now() - interval '30 minutes';
```

## Monitoring Queries

### Daily Health Check

```sql
-- Last 24 hours summary
SELECT
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM sync_queue
WHERE created_at > now() - interval '24 hours'
GROUP BY status;
```

### Error Patterns

```sql
-- Group errors by message
SELECT
    error_message,
    COUNT(*) as count
FROM sync_queue
WHERE status = 'failed'
AND created_at > now() - interval '24 hours'
GROUP BY error_message
ORDER BY count DESC;
```

## Verification

After applying any fix:

1. **Check queue status:**
```sql
SELECT status, COUNT(*) FROM sync_queue GROUP BY status;
```

2. **Trigger processing:**
```bash
curl -X POST ... -d '{"action": "process_queue_data_api", "payload": {"batch_size": 10}}'
```

3. **Verify in Bubble:**
   - Check a recently synced record appears correctly

4. **Monitor for 15 minutes:**
   - Watch function logs
   - Check queue isn't growing

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Bubble platform issues | Bubble Support |
| Consistent sync failures | Engineering Lead |
| Data corruption/mismatch | Engineering Lead + Database Admin |
| High-volume backlog | DevOps for capacity |

## Related Runbooks

- [../deployment/deploy-edge-functions.md](../deployment/deploy-edge-functions.md) - Function deployment
- [outage-database.md](outage-database.md) - Database issues
- [outage-edge-functions.md](outage-edge-functions.md) - Function issues
- [incident-response-template.md](incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
