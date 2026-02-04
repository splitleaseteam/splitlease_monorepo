# Database Maintenance

## Overview

This runbook covers routine database maintenance tasks for the Supabase PostgreSQL database including vacuuming, index maintenance, backup verification, and performance monitoring.

## Prerequisites

- Access to Supabase Dashboard
- SQL knowledge
- Understanding of PostgreSQL maintenance concepts

## Maintenance Schedule

| Task | Frequency | When |
|------|-----------|------|
| Check disk usage | Daily | Automated |
| Review slow queries | Weekly | Monday |
| Analyze tables | Weekly | Sunday night |
| Vacuum large tables | Weekly | Sunday night |
| Verify backups | Weekly | Monday |
| Index maintenance | Monthly | First Sunday |
| Connection pool review | Monthly | First Monday |
| Full vacuum | Quarterly | During maintenance window |

## Routine Checks

### Daily: Disk Usage

Check disk usage in Supabase Dashboard > Database > Database Settings.

Or via SQL:
```sql
SELECT
    pg_size_pretty(pg_database_size('postgres')) as database_size;
```

**Alert threshold:** >80% disk usage

### Weekly: Slow Query Review

```sql
-- Find slow queries from stats
SELECT
    calls,
    round(total_exec_time::numeric, 2) as total_time_ms,
    round(mean_exec_time::numeric, 2) as mean_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as percent_time,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Action:** Investigate queries taking >100ms on average.

### Weekly: Table Statistics

```sql
-- Tables that need ANALYZE
SELECT
    schemaname,
    relname,
    last_analyze,
    last_autoanalyze,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup::numeric * 100 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC
LIMIT 20;
```

**Action:** Tables with >10% dead tuples need VACUUM.

## Procedure: VACUUM and ANALYZE

### Step 1: Check Current State

```sql
-- Check autovacuum activity
SELECT
    relname,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```

### Step 2: Run ANALYZE on High-Write Tables

```sql
-- Analyze specific table
ANALYZE listing;
ANALYZE proposal;
ANALYZE "user";
ANALYZE sync_queue;
ANALYZE message;
```

### Step 3: VACUUM Tables with Dead Tuples

```sql
-- Standard vacuum (non-blocking)
VACUUM ANALYZE listing;
VACUUM ANALYZE proposal;

-- Aggressive vacuum for heavily updated tables
VACUUM (VERBOSE) sync_queue;
```

### Step 4: Verify

```sql
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```

## Procedure: Index Maintenance

### Step 1: Check Index Usage

```sql
-- Find unused indexes
SELECT
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Step 2: Check Index Bloat

```sql
-- Simplified bloat check
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as scans
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

### Step 3: Reindex Bloated Indexes

```sql
-- Non-blocking reindex
REINDEX INDEX CONCURRENTLY index_name;

-- Or reindex entire table
REINDEX TABLE CONCURRENTLY table_name;
```

### Step 4: Consider Removing Unused Indexes

```sql
-- Drop unused index (after verification)
DROP INDEX CONCURRENTLY idx_name;
```

## Procedure: Backup Verification

### Step 1: Check Backup Status

1. Go to Supabase Dashboard > Database > Backups
2. Verify recent backups completed successfully
3. Note the latest backup timestamp

### Step 2: Point-in-Time Recovery Test (Monthly)

1. Create a test project or branch
2. Restore from backup
3. Verify data integrity:
```sql
SELECT COUNT(*) FROM "user";
SELECT COUNT(*) FROM listing;
SELECT COUNT(*) FROM proposal;
```

### Step 3: Document Results

Record backup verification in maintenance log.

## Procedure: Connection Pool Review

### Step 1: Check Current Usage

In Supabase Dashboard > Database > Connection Pooling:
- Active connections
- Available connections
- Wait queue

### Step 2: Review Connection Patterns

```sql
-- Current connections by state
SELECT state, COUNT(*)
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state;

-- Connections by client
SELECT client_addr, COUNT(*)
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY client_addr
ORDER BY COUNT(*) DESC;
```

### Step 3: Adjust Pool Size if Needed

If connections frequently exhausted:
1. Dashboard > Database > Connection Pooling
2. Increase pool size (within plan limits)
3. Monitor for improvement

## Procedure: Table Size Management

### Step 1: Check Table Sizes

```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
    pg_size_pretty(pg_relation_size(quote_ident(table_name))) as table_size,
    pg_size_pretty(pg_indexes_size(quote_ident(table_name))) as index_size
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
LIMIT 20;
```

### Step 2: Archive Old Data

For large tables, consider archiving old data:

```sql
-- Example: Archive old sync_queue records
-- First, create archive table if needed
CREATE TABLE IF NOT EXISTS sync_queue_archive (LIKE sync_queue INCLUDING ALL);

-- Move old completed records to archive
INSERT INTO sync_queue_archive
SELECT * FROM sync_queue
WHERE status = 'completed'
AND created_at < now() - interval '90 days';

-- Delete from main table
DELETE FROM sync_queue
WHERE status = 'completed'
AND created_at < now() - interval '90 days';

-- Vacuum to reclaim space
VACUUM ANALYZE sync_queue;
```

### Step 3: Clean Up Logs and Temporary Data

```sql
-- Clean up old message_read_status
DELETE FROM message_read_status
WHERE updated_at < now() - interval '180 days';

-- Clean up old notification records
DELETE FROM notification_audit
WHERE created_at < now() - interval '90 days';
```

## Monitoring Queries

### Performance Dashboard Query

```sql
-- Overall database health
SELECT
    'Connections' as metric,
    COUNT(*)::text as value
FROM pg_stat_activity
UNION ALL
SELECT
    'Database Size',
    pg_size_pretty(pg_database_size('postgres'))
UNION ALL
SELECT
    'Active Queries',
    COUNT(*)::text
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT
    'Idle Connections',
    COUNT(*)::text
FROM pg_stat_activity
WHERE state = 'idle';
```

### Index Health Check

```sql
SELECT
    'Total Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
    'Unused Indexes',
    COUNT(*)::text
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

## Troubleshooting

### High CPU Usage

1. Check for long-running queries:
```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

2. Look for missing indexes on filtered columns

3. Check for sequential scans on large tables:
```sql
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

### Memory Issues

1. Check for queries using excessive memory:
```sql
SELECT query, calls, rows
FROM pg_stat_statements
ORDER BY rows DESC
LIMIT 10;
```

2. Review and optimize queries returning too many rows

## Verification

After any maintenance:

1. **Test basic queries:**
```sql
SELECT COUNT(*) FROM listing WHERE status = 'active';
```

2. **Check Edge Functions:**
```bash
supabase functions logs auth-user --project-ref <project-id>
```

3. **Monitor performance metrics** for 15 minutes

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Disk >90% full | Engineering Lead immediately |
| Backup failures | Database Admin + Supabase Support |
| Performance degradation | Engineering Lead |
| Data corruption | All hands |

## Related Runbooks

- [../deployment/deploy-database-migrations.md](../deployment/deploy-database-migrations.md) - Schema changes
- [../incidents/outage-database.md](../incidents/outage-database.md) - Database outage response
- [log-management.md](log-management.md) - Log management

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
