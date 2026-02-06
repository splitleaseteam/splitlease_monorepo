-- Pre-Migration Validation Checks for Pattern 1 Backend Integration
-- These checks must pass before applying migrations

-- Check 1: Verify required tables exist
\echo '=== Check 1: Required Tables ==='
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('datechangerequest', 'bookings_leases', 'user', 'profiles')
ORDER BY table_name;

-- Check 2: Inspect datechangerequest columns (check for conflicts)
\echo '\n=== Check 2: datechangerequest Columns ==='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'datechangerequest'
ORDER BY ordinal_position;

-- Check 3: Check bookings_leases ID column type (UUID vs TEXT)
\echo '\n=== Check 3: bookings_leases ID Type ==='
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bookings_leases'
  AND column_name IN ('id', '_id');

-- Check 4: Verify pg_cron extension
\echo '\n=== Check 4: pg_cron Extension ==='
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pg_cron';

-- Check 5: Confirm no archetype tables exist yet
\echo '\n=== Check 5: Archetype Tables (should be empty) ==='
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_archetypes', 'recommendation_logs', 'admin_audit_log', 'archetype_job_logs', 'lease_nights')
ORDER BY table_name;

\echo '\n=== Pre-Migration Checks Complete ==='
