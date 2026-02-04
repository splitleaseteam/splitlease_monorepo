# Database Outage Response

## Overview

This runbook covers diagnosing and resolving issues with the Supabase PostgreSQL database including connection failures, performance degradation, query errors, and data inconsistencies.

## Prerequisites

- Access to Supabase Dashboard
- SQL knowledge
- Understanding of Supabase architecture
- Access to database (if direct connection available)

## Symptoms

- "Connection refused" errors
- "Too many connections" errors
- Queries timing out
- Extremely slow queries
- Data not persisting
- Inconsistent data between reads
- RLS policy blocking all access

## Diagnostic Steps

### Step 1: Check Supabase Status

1. Visit https://status.supabase.com/
2. Look for database-related incidents
3. Check if your region is affected

### Step 2: Check Dashboard Metrics

1. Open Supabase Dashboard > Database
2. Check:
   - Connection count
   - CPU usage
   - Memory usage
   - Disk usage

### Step 3: Test Database Connectivity

**Via Supabase Studio:**
1. Go to Dashboard > SQL Editor
2. Run a simple query:
```sql
SELECT 1;
```

**Via Edge Function logs:**
```bash
supabase functions logs auth-user --project-ref <project-id>
```
Look for database connection errors.

### Step 4: Check Connection Pool

1. Dashboard > Database > Connection Pooling
2. Check:
   - Active connections
   - Waiting connections
   - Pool exhaustion

### Step 5: Identify Slow Queries

In Supabase SQL Editor:
```sql
-- Find slow running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
AND state != 'idle';
```

### Step 6: Check for Locks

```sql
-- Find blocking locks
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query,
       blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

## Resolution Steps

### Scenario 1: Connection Pool Exhausted

**Symptoms:** "Too many connections", timeouts.

**Resolution:**

1. Check current connections:
```sql
SELECT count(*) FROM pg_stat_activity;
```

2. Kill idle connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '10 minutes';
```

3. Review connection settings:
   - Dashboard > Database > Connection Pooling
   - Increase pool size if needed

4. Long-term: Ensure Edge Functions close connections properly

### Scenario 2: Long-Running Query Blocking

**Symptoms:** Database slow, queries queuing.

**Resolution:**

1. Find the blocking query:
```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC
LIMIT 10;
```

2. Kill the problematic query:
```sql
SELECT pg_terminate_backend(<pid>);
```

3. Investigate why the query ran long:
   - Missing index?
   - Large data scan?
   - Lock contention?

### Scenario 3: Disk Space Full

**Symptoms:** Write failures, "disk full" errors.

**Resolution:**

1. Check disk usage in Dashboard

2. Identify large tables:
```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
LIMIT 10;
```

3. Clean up old data:
```sql
-- Example: Delete old sync_queue entries
DELETE FROM sync_queue
WHERE status = 'completed'
AND created_at < now() - interval '30 days';
```

4. Run VACUUM:
```sql
VACUUM FULL table_name;
```

### Scenario 4: RLS Policy Blocking Access

**Symptoms:** "Policy violation", empty results when data exists.

**Resolution:**

1. Check RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

2. Review policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

3. Temporarily disable RLS for debugging:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

4. Fix the policy:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "new_policy_name" ON table_name ...;
```

5. Re-enable RLS:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Scenario 5: Index Corruption

**Symptoms:** Inconsistent query results, index errors.

**Resolution:**

1. Reindex the affected index:
```sql
REINDEX INDEX CONCURRENTLY index_name;
```

2. Or reindex entire table:
```sql
REINDEX TABLE CONCURRENTLY table_name;
```

### Scenario 6: Data Inconsistency

**Symptoms:** Data doesn't match expectations, orphaned records.

**Resolution:**

1. Identify inconsistencies:
```sql
-- Example: Find proposals with invalid listing_id
SELECT p._id
FROM proposal p
LEFT JOIN listing l ON p.listing_id = l._id
WHERE p.listing_id IS NOT NULL
AND l._id IS NULL;
```

2. Fix orphaned records:
```sql
-- Either delete orphans
DELETE FROM proposal
WHERE listing_id NOT IN (SELECT _id FROM listing);

-- Or set to NULL
UPDATE proposal SET listing_id = NULL
WHERE listing_id NOT IN (SELECT _id FROM listing);
```

### Scenario 7: Performance Degradation

**Symptoms:** All queries slow, not a specific query.

**Resolution:**

1. Check for missing analyze:
```sql
SELECT relname, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_analyze NULLS FIRST;
```

2. Run ANALYZE:
```sql
ANALYZE;
```

3. Check for index bloat:
```sql
SELECT
    tablename,
    round(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages::float/otta END,2) AS tbloat
FROM (
    -- Complex bloat query here
) AS sml
WHERE schemaname = 'public'
ORDER BY tbloat DESC;
```

4. Vacuum if needed:
```sql
VACUUM ANALYZE table_name;
```

## Emergency Procedures

### Kill All Non-Essential Connections

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres'
AND pid <> pg_backend_pid()
AND state = 'idle';
```

### Enable Maintenance Mode

If database needs maintenance:

1. Update frontend to show maintenance page
2. Stop Edge Functions from hitting database
3. Perform maintenance
4. Restore services

## Verification

After applying any fix:

1. **Test basic connectivity:**
```sql
SELECT 1;
```

2. **Test affected queries:**
   Run the queries that were failing

3. **Check Edge Functions:**
```bash
supabase functions logs auth-user --project-ref <project-id>
```

4. **Monitor performance:**
   Watch Dashboard metrics for 15 minutes

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Supabase platform issue | Supabase Support |
| Data corruption | Database Admin + Engineering Lead |
| Cannot diagnose | Engineering Lead |
| Need backup restore | Supabase Support |

## Related Runbooks

- [../deployment/deploy-database-migrations.md](../deployment/deploy-database-migrations.md) - Migrations
- [../maintenance/database-maintenance.md](../maintenance/database-maintenance.md) - Regular maintenance
- [outage-edge-functions.md](outage-edge-functions.md) - Function issues
- [incident-response-template.md](incident-response-template.md) - Incident management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
