-- ============================================================================
-- Split Lease Database Reset Script
-- ============================================================================
-- Purpose: Safely delete test data respecting FK constraints
-- Project: splitlease-backend-dev
-- Created: 2026-02-03
--
-- USAGE:
--   1. Review the WHERE clause in each DELETE statement
--   2. Adjust the date range or test data criteria as needed
--   3. Run in a transaction: BEGIN; \i reset_test_data.sql; COMMIT;
--   4. Or run with rollback: BEGIN; \i reset_test_data.sql; ROLLBACK;
--
-- CRITICAL:
--   - This script respects foreign key constraints
--   - Deletes in correct order (children before parents)
--   - Uses TRUNCATE for tables with no dependencies (faster)
--   - Uses DELETE with WHERE for selective data removal
--   - All operations are transaction-safe
--
-- ISOLATION STRATEGIES (choose one):
--
--   Strategy A: Date-based (RECOMMENDED)
--     - Deletes all data created after a specific date
--     - Modify @test_data_cutoff_date variable
--
--   Strategy B: Email domain-based
--     - Deletes data associated with test email domains
--     - Modify @test_email_domains array
--
--   Strategy C: User ID-based
--     - Deletes specific test users and all related data
--     - Modify @test_user_ids array
--
-- ============================================================================

-- ============================================================================
-- CONFIGURATION - ADJUST THESE VALUES
-- ============================================================================

-- Strategy A: Date-based cutoff (RECOMMENDED)
-- All data created on or after this date will be deleted
DO $$
DECLARE
  test_data_cutoff_date TIMESTAMPTZ := '2026-02-01 00:00:00+00'::timestAMPTZ;
  delete_count INTEGER := 0;
  table_name TEXT;
BEGIN
  RAISE NOTICE '==========================================================================';
  RAISE NOTICE 'Split Lease Database Reset - Started at %', NOW();
  RAISE NOTICE 'Test Data Cutoff Date: %', test_data_cutoff_date;
  RAISE NOTICE '==========================================================================';

  -- ============================================================================
  -- ROUND 1: Child tables with CASCADE dependencies
  -- ============================================================================
  -- These will be auto-deleted when parents are deleted due to ON DELETE CASCADE
  -- No explicit DELETE needed, but we log for clarity

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 1: Child tables with CASCADE dependencies';
  RAISE NOTICE '  (Will be auto-deleted via CASCADE - no explicit DELETE needed)';

  -- review_rating_detail → review (CASCADE)
  -- bidding_participants → bidding_sessions (CASCADE)
  -- bids → bidding_sessions (CASCADE)
  -- bidding_results → bidding_sessions (CASCADE)
  -- bidding_notifications → bidding_sessions (CASCADE)

  -- ============================================================================
  -- ROUND 2: Transactional data
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 2: Transactional data';

  -- document_change_request
  DELETE FROM document_change_request
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  document_change_request: % rows deleted', delete_count;

  -- qr_codes
  DELETE FROM qr_codes
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  qr_codes: % rows deleted', delete_count;

  -- review (parent table, but needs to be deleted before stays/leases)
  DELETE FROM review
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  review: % rows deleted', delete_count;

  -- ============================================================================
  -- ROUND 3: Booking & Lease data
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 3: Booking & Lease data';

  -- lease_nights
  DELETE FROM lease_nights
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  lease_nights: % rows deleted', delete_count;

  -- pricing_tier_selection (if exists)
  BEGIN
    DELETE FROM pricing_tier_selection
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  pricing_tier_selection: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  pricing_tier_selection: table not found, skipping';
  END;

  -- bookings_stays
  BEGIN
    DELETE FROM bookings_stays
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  bookings_stays: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  bookings_stays: table not found, skipping';
  END;

  -- bookings_leases
  BEGIN
    DELETE FROM bookings_leases
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  bookings_leases: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  bookings_leases: table not found, skipping';
  END;

  -- ============================================================================
  -- ROUND 4: Bidding & Pricing
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 4: Bidding & Pricing';

  -- urgency_pricing_cache
  DELETE FROM urgency_pricing_cache
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  urgency_pricing_cache: % rows deleted', delete_count;

  -- market_demand_multipliers
  DELETE FROM market_demand_multipliers
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  market_demand_multipliers: % rows deleted', delete_count;

  -- event_multipliers
  DELETE FROM event_multipliers
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  event_multipliers: % rows deleted', delete_count;

  -- bidding_sessions (will CASCADE to participants, bids, results, notifications)
  DELETE FROM bidding_sessions
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  bidding_sessions: % rows deleted (CASCADE to 4 child tables)', delete_count;

  -- ============================================================================
  -- ROUND 5: Proposal & Property data
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 5: Proposal & Property data';

  -- proposal
  BEGIN
    DELETE FROM proposal
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  proposal: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  proposal: table not found, skipping';
  END;

  -- visits
  BEGIN
    DELETE FROM visits
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  visits: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  visits: table not found, skipping';
  END;

  -- listing
  BEGIN
    DELETE FROM listing
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  listing: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  listing: table not found, skipping';
  END;

  -- properties
  BEGIN
    DELETE FROM properties
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  properties: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  properties: table not found, skipping';
  END;

  -- ============================================================================
  -- ROUND 6: User-related tables
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 6: User-related tables';

  -- recommendation_logs
  DELETE FROM recommendation_logs
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  recommendation_logs: % rows deleted', delete_count;

  -- admin_audit_log
  DELETE FROM admin_audit_log
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  admin_audit_log: % rows deleted', delete_count;

  -- user_archetypes
  DELETE FROM user_archetypes
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  user_archetypes: % rows deleted', delete_count;

  -- experience_survey
  DELETE FROM experience_survey
  WHERE created_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  experience_survey: % rows deleted', delete_count;

  -- ============================================================================
  -- ROUND 7: Core documents & users
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 7: Core documents & users';

  -- documentssent
  BEGIN
    DELETE FROM documentssent
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  documentssent: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  documentssent: table not found, skipping';
  END;

  -- ============================================================================
  -- WARNING: Deleting from public.user should be done carefully
  -- Only delete users that match your test criteria
  -- ============================================================================

  -- Uncomment to delete test users (DANGER!)
  -- DELETE FROM public."user"
  -- WHERE created_at >= test_data_cutoff_date;

  RAISE NOTICE '  public.user: SKIPPED (manual deletion required - add your WHERE clause)';

  -- ============================================================================
  -- ROUND 8: Configuration & Logging
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 8: Configuration & Logging';

  -- urgency_pricing_config (preserve default config, only delete test additions)
  DELETE FROM urgency_pricing_config
  WHERE created_at >= test_data_cutoff_date
    AND config_key NOT IN (
      'default_urgency_steepness',
      'default_lookback_window',
      'urgency_thresholds',
      'cache_ttl_seconds',
      'update_intervals_ms',
      'day_of_week_multipliers_urban',
      'day_of_week_multipliers_resort',
      'seasonal_multipliers'
    );
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  urgency_pricing_config: % rows deleted (preserved defaults)', delete_count;

  -- daily_counter (reset to 0 for test dates)
  DELETE FROM daily_counter
  WHERE counter_date >= (test_data_cutoff_date::date);
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  daily_counter: % rows deleted', delete_count;

  -- archetype_job_logs
  DELETE FROM archetype_job_logs
  WHERE started_at >= test_data_cutoff_date;
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE '  archetype_job_logs: % rows deleted', delete_count;

  -- sync_queue (if exists)
  BEGIN
    DELETE FROM sync_queue
    WHERE created_at >= test_data_cutoff_date;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE '  sync_queue: % rows deleted', delete_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '  sync_queue: table not found, skipping';
  END;

  -- ============================================================================
  -- ROUND 9: Reference data
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE 'ROUND 9: Reference data';
  RAISE NOTICE '  reference_table.*: SKIPPED (reference data should not be deleted)';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '==========================================================================';
  RAISE NOTICE 'Reset completed at %', NOW();
  RAISE NOTICE '==========================================================================';

END $$;

-- ============================================================================
-- Alternative Strategy B: Email domain-based deletion
-- ============================================================================
-- Uncomment and use this section if you prefer to delete by email domain
-- instead of date range.

/*
DO $$
DECLARE
  test_email_domains TEXT[] := ARRAY['@test.example.com', '@splitlease.test', '@localhost'];
  delete_count INTEGER;
BEGIN
  -- Delete from tables that have user_email FK

  DELETE FROM document_change_request
  WHERE user_email = ANY(SELECT email || domain FROM test_email_domains);

  -- ... similar DELETE statements for other tables

END $$;
*/

-- ============================================================================
-- Alternative Strategy C: User ID-based deletion
-- ============================================================================
-- Uncomment and use this section if you prefer to delete specific users

/*
DO $$
DECLARE
  test_user_ids TEXT[] := ARRAY['test-user-id-1', 'test-user-id-2'];
  delete_count INTEGER;
BEGIN
  -- Delete all data related to specific test users

  DELETE FROM document_change_request
  WHERE user_id = ANY(test_user_ids);

  -- ... similar DELETE statements for other tables

END $$;
*/

-- ============================================================================
-- POST-RESET VERIFICATION QUERIES
-- ============================================================================
-- Run these after the reset to verify data integrity

-- Check row counts for key tables
SELECT
  'review' as table_name, COUNT(*) as row_count FROM review
UNION ALL
SELECT 'bidding_sessions', COUNT(*) FROM bidding_sessions
UNION ALL
SELECT 'urgency_pricing_cache', COUNT(*) FROM urgency_pricing_cache
UNION ALL
SELECT 'user_archetypes', COUNT(*) FROM user_archetypes
UNION ALL
SELECT 'recommendation_logs', COUNT(*) FROM recommendation_logs
ORDER BY table_name;

-- Check for orphaned records (should return 0 if clean)
SELECT 'Orphaned review_rating_detail' as check_name, COUNT(*) as count
FROM review_rating_detail rrd
WHERE NOT EXISTS (SELECT 1 FROM review r WHERE r._id = rrd.review_id);

-- Check constraint violations
SELECT 'FK violations' as check_name, COUNT(*) as count
FROM (
  SELECT 1 FROM review r
  WHERE NOT EXISTS (SELECT 1 FROM public."user" u WHERE u._id = r.reviewer_id)
     OR NOT EXISTS (SELECT 1 FROM public."user" u WHERE u._id = r.reviewee_id)
) checks;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. This script does NOT delete from auth.users (Supabase Auth)
--    - Use Supabase Dashboard or auth admin API for user deletion
--    - Deleting auth.users will CASCADE to many tables automatically
--
-- 2. This script does NOT delete from public.user (Bubble legacy)
--    - Uncomment the DELETE statement in ROUND 7 if you want to delete test users
--    - Add appropriate WHERE clause to identify test users
--
-- 3. Reference data tables are never deleted
--    - reference_table.* tables contain static data
--    - urgency_pricing_config default values are preserved
--
-- 4. Run in EXPLAIN ANALYZE mode first to preview impact:
--    EXPLAIN ANALYZE DELETE FROM table_name WHERE created_at >= '2026-02-01';
--
-- 5. For production use, consider:
--    - Adding is_test_data BOOLEAN flag to tables
--    - Using separate database for testing
--    - Implementing soft deletes with deleted_at column
--
-- ============================================================================
