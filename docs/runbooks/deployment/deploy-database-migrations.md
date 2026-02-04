# Deploy Database Migrations

## Overview

This runbook covers running database migrations on Supabase PostgreSQL. Migrations are stored in `supabase/migrations/` and are applied sequentially. Always test migrations in development before running in production.

## Prerequisites

- Supabase CLI installed
- Access to Supabase projects (dev and production)
- PostgreSQL knowledge for writing migrations
- Database backup procedures understood

## Migration File Naming

Migrations follow the naming convention:
```
YYYYMMDD_description.sql
```

Example: `20260128_create_notification_audit.sql`

## Pre-Migration Checklist

- [ ] Migration tested on local Supabase instance
- [ ] Migration tested on development database
- [ ] Database backup created (production)
- [ ] Migration is idempotent (safe to run twice)
- [ ] Rollback script prepared if needed
- [ ] Off-peak hours for production (if destructive)
- [ ] Affected services identified and team notified

## Procedure

### Step 1: Create Migration File

```bash
# Generate new migration file
supabase migration new <description>
```

This creates a file in `supabase/migrations/` with timestamp prefix.

### Step 2: Write Migration SQL

Edit the migration file with your SQL changes:

```sql
-- Example: Create a new table
CREATE TABLE IF NOT EXISTS notification_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "user"(_id),
    notification_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Add index
CREATE INDEX IF NOT EXISTS idx_notification_audit_user
    ON notification_audit(user_id);

-- Example: Enable RLS
ALTER TABLE notification_audit ENABLE ROW LEVEL SECURITY;

-- Example: Create RLS policy
CREATE POLICY "Users can view own audit" ON notification_audit
    FOR SELECT USING (auth.uid() = user_id);
```

### Step 3: Test Locally

```bash
# Start local Supabase
supabase start

# Reset local database (runs all migrations)
supabase db reset

# Verify migration applied
supabase db diff
```

### Step 4: Deploy to Development

```bash
# Push migrations to development
supabase db push --project-ref <dev-project-id>
```

Verify in Supabase Studio that the migration applied correctly.

### Step 5: Test in Development

1. Open Supabase Studio for dev project
2. Verify table/schema changes exist
3. Test affected Edge Functions
4. Run integration tests

### Step 6: Backup Production Database

**Before any production migration:**

```bash
# Create a backup via Supabase Dashboard
# Or use pg_dump if you have direct access

pg_dump -h <host> -U postgres -d postgres -F c -f backup_$(date +%Y%m%d).dump
```

### Step 7: Deploy to Production

```bash
# Push migrations to production
supabase db push --project-ref <live-project-id>
```

### Step 8: Verify Migration

```sql
-- Check migration was applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;

-- Verify new objects exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'your_new_table';
```

## Verification

### Via Supabase Studio

1. Open Supabase Dashboard
2. Navigate to Table Editor
3. Verify new tables/columns exist
4. Check RLS policies in Authentication > Policies

### Via SQL

```sql
-- Check table structure
\d+ table_name

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'table_name';

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'table_name';
```

### Application Testing

1. Test affected API endpoints
2. Verify Edge Functions work correctly
3. Check frontend forms that use affected tables

## Rollback

### Option 1: Reverse Migration Script

Create a rollback script and run it:

```sql
-- Rollback example: Drop the new table
DROP TABLE IF EXISTS notification_audit;
```

```bash
# Run rollback SQL
supabase db execute --project-ref <project-id> < rollback.sql
```

### Option 2: Restore from Backup

If the migration caused data loss or corruption:

```bash
# Contact Supabase support for point-in-time recovery
# Or restore from your backup
pg_restore -h <host> -U postgres -d postgres backup_YYYYMMDD.dump
```

### Option 3: Create Compensating Migration

```bash
# Create a new migration that undoes the changes
supabase migration new rollback_previous_change
```

Then deploy the rollback migration.

## Common Migration Patterns

### Adding a Column (Safe)

```sql
ALTER TABLE listing ADD COLUMN IF NOT EXISTS new_field TEXT;
```

### Adding NOT NULL Column

```sql
-- First add nullable
ALTER TABLE listing ADD COLUMN new_field TEXT;

-- Then backfill
UPDATE listing SET new_field = 'default_value' WHERE new_field IS NULL;

-- Then add constraint
ALTER TABLE listing ALTER COLUMN new_field SET NOT NULL;
```

### Creating Index (Can Lock Table)

```sql
-- Use CONCURRENTLY for large tables (no lock, slower)
CREATE INDEX CONCURRENTLY idx_name ON large_table(column);
```

### Modifying RLS Policies

```sql
-- Drop old policy
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- Create new policy
CREATE POLICY "new_policy_name" ON table_name
    FOR SELECT USING (condition);
```

## Troubleshooting

### Migration Fails with Syntax Error

1. Check SQL syntax
2. Test in local Supabase first
3. Verify table/column names exist

### Migration Hangs

1. Check for table locks:
```sql
SELECT * FROM pg_locks WHERE NOT granted;
```
2. Kill blocking queries if safe:
```sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;
```

### Foreign Key Constraint Error

1. Ensure referenced table exists
2. Ensure referenced column has matching data type
3. Check for orphaned records

### RLS Policy Blocks All Access

1. Temporarily disable RLS for debugging:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```
2. Fix the policy
3. Re-enable RLS

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Migration fails | Database Admin |
| Data corruption | Database Admin + Engineering Lead |
| Need to restore backup | Supabase Support + Engineering Lead |
| Production lock/hang | Immediate escalation to all hands |

## Related Runbooks

- [deploy-edge-functions.md](deploy-edge-functions.md) - Function updates after schema changes
- [../maintenance/database-maintenance.md](../maintenance/database-maintenance.md) - Regular DB maintenance
- [../incidents/outage-database.md](../incidents/outage-database.md) - Database outage response

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
