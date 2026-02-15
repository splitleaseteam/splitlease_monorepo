# Database Reset Script - Quick Reference

## Overview

This directory contains the database reset script for safely deleting test data from the Split Lease database.

## Files

| File | Purpose |
|------|---------|
| `reset_test_data.sql` | Main reset script with configurable isolation strategies |
| `README_reset_guide.md` | This file - quick reference guide |
| *(schema analysis available on request)* | Complete schema analysis |

## Quick Start

### Option 1: Delete All Test Data After a Date (Recommended)

```sql
-- Edit reset_test_data.sql, set your cutoff date:
test_data_cutoff_date TIMESTAMPTZ := '2026-02-01 00:00:00+00'::timestAMPTZ;

-- Run the script
\i supabase/scripts/reset_test_data.sql
```

### Option 2: Preview Before Deleting (Safe)

```sql
-- Wrap in transaction and rollback
BEGIN;
\i supabase/scripts/reset_test_data.sql
-- Check the output
ROLLBACK;  -- or COMMIT; if satisfied
```

### Option 3: Count Rows Before Deleting

```sql
-- Check how many rows will be deleted
SELECT COUNT(*) FROM review WHERE created_at >= '2026-02-01';
SELECT COUNT(*) FROM proposal WHERE created_at >= '2026-02-01';
-- ... repeat for other tables
```

## Isolation Strategies

The script supports 3 strategies for identifying test data:

### Strategy A: Date-Based (Default)

Delete all data created after a specific date:

```sql
test_data_cutoff_date TIMESTAMPTZ := '2026-02-01 00:00:00+00'::timestAMPTZ;
```

**Pros:**
- Simple to use
- Works for all tables
- No data tagging required

**Cons:**
- May delete production data if date is incorrect
- Requires consistent created_at timestamps

### Strategy B: Email Domain-Based

Delete data associated with test email domains:

```sql
test_email_domains TEXT[] := ARRAY['@test.example.com', '@splitlease.test'];
```

**Pros:**
- Precise targeting of test users
- Safe for production data

**Cons:**
- Requires test users to use specific domains
- Doesn't catch data without email references

### Strategy C: User ID-Based

Delete specific test users:

```sql
test_user_ids TEXT[] := ARRAY['test-user-id-1', 'test-user-id-2'];
```

**Pros:**
- Most precise
- Easy to verify

**Cons:**
- Requires knowing user IDs
- Manual for each test user

## What Gets Deleted

The script deletes data in 10 rounds, respecting FK constraints:

1. **CASCADE children** - Auto-deleted via FK CASCADE
2. **Transactional data** - document_change_request, qr_codes, review
3. **Booking & Lease** - lease_nights, bookings_stays, bookings_leases
4. **Pricing** - urgency_pricing_cache
5. **Proposal & Property** - proposal, visits, listing, properties
6. **User-related** - recommendation_logs, admin_audit_log, user_archetypes
7. **Core documents** - documentssent
8. **Configuration** - urgency_pricing_config (preserves defaults), daily_counter
9. **Reference data** - SKIPPED (should not be deleted)
10. **Auth users** - SKIPPED (use Supabase Dashboard)

## What Does NOT Get Deleted

- `auth.users` - Use Supabase Dashboard or admin API
- `public.user` - Requires manual deletion (uncomment in script)
- `reference_table.*` - Static reference data
- Default `urgency_pricing_config` values

## Running via CLI

### Using psql

```bash
# Direct execution
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/scripts/reset_test_data.sql

# With transaction and rollback
psql -h db.xxx.supabase.co -U postgres -d postgres -c "BEGIN; \i supabase/scripts/reset_test_data.sql; ROLLBACK;"
```

### Using Supabase CLI

```bash
# Local development
supabase db reset  # Complete reset (using migrations)

# Execute script on local
supabase db execute -f supabase/scripts/reset_test_data.sql

# Execute script on linked remote project
supabase db execute --remote -f supabase/scripts/reset_test_data.sql
```

## Safety Checks

### Before Running

1. **Backup your database**
   ```bash
   supabase db dump --remote > backup_$(date +%Y%m%d).sql
   ```

2. **Check current row counts**
   ```sql
   SELECT schemaname, tablename, n_live_tup
   FROM pg_stat_user_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

3. **Verify isolation strategy**
   - Ensure cutoff date is correct
   - Or ensure test email domains are accurate

### After Running

1. **Verify no orphaned records**
   ```sql
   -- Check for review_rating_detail without parent
   SELECT COUNT(*) FROM review_rating_detail rrd
   WHERE NOT EXISTS (SELECT 1 FROM review r WHERE r.id = rrd.review_id);
   ```

2. **Check FK integrity**
   ```sql
   -- Should return 0
   SELECT COUNT(*) FROM review r
   WHERE NOT EXISTS (SELECT 1 FROM public."user" u WHERE u.id = r.reviewer_id);
   ```

3. **Review row counts again**
   ```sql
   SELECT tablename, n_live_tup FROM pg_stat_user_tables;
   ```

## Troubleshooting

### Error: "table not found, skipping"

This is expected behavior. Some tables may not exist in your environment.

### Error: "foreign key violation"

Check the deletion order in the script. Child tables must be deleted before parents.

### Error: "must be owner of table"

Run the script using a database owner or service_role account.

### Rollback needed

```sql
-- If script was run in a transaction
ROLLBACK;

-- If not, restore from backup
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup_20260203.sql
```

## Best Practices

1. **Use a separate test database** when possible
2. **Add `is_test_data` flag** to tables for future isolation
3. **Run in transactions** with rollback option
4. **Backup before running** on any database
5. **Verify cutoff dates** carefully
6. **Monitor row counts** before and after
7. **Never run on production** without approval

## Test Data Isolation Recommendations

### For New Development

Add an `is_test_data` column to key tables:

```sql
ALTER TABLE review ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
ALTER TABLE bidding_sessions ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;
-- etc.

-- Then delete with:
DELETE FROM review WHERE is_test_data = TRUE;
```

### For Existing Data

Use date-based deletion with a carefully chosen cutoff date that separates test from production data.

### For Continuous Testing

Consider:
- Separate database schema for testing
- Supabase database branching (if available)
- Docker containers for isolated test environments

## Related Documentation

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL DELETE Documentation](https://www.postgresql.org/docs/current/sql-delete.html)

## Support

For issues or questions:
1. Check the complete schema analysis document
2. Review migration files in `supabase/migrations/`
3. Consult Supabase documentation for FK constraints
4. Contact database administrator for production changes

---

**Last Updated**: 2026-02-03
**Version**: 1.0.0
