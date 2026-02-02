/**
 * pgTAP Tests: Notification System Migrations
 * Split Lease - Database Verification Tests
 *
 * These tests verify that the notification system database schema is correctly
 * set up according to the migration specifications.
 *
 * To run these tests:
 * 1. Install pgTAP extension in your database
 * 2. Run: psql -f notification-migrations.test.sql
 *
 * Tests verify:
 * - notification_preferences table schema
 * - notification_audit table schema
 * - Column definitions and defaults
 * - RLS policies
 * - Indexes
 * - Enum types
 * - Backfill completeness
 */

-- Begin test transaction (rolled back at end)
BEGIN;

-- Plan the number of tests
SELECT plan(50);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Schema Verification: notification_preferences table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: notification_preferences table exists
SELECT has_table(
  'public',
  'notification_preferences',
  'notification_preferences table should exist'
);

-- Test: Primary key exists
SELECT has_pk(
  'public',
  'notification_preferences',
  'notification_preferences should have a primary key'
);

-- Test: user_id column exists and is required
SELECT has_column(
  'public',
  'notification_preferences',
  'user_id',
  'notification_preferences should have user_id column'
);

SELECT col_not_null(
  'public',
  'notification_preferences',
  'user_id',
  'user_id should be NOT NULL'
);

-- Test: All 22 preference columns exist (11 categories x 2 channels)
-- Message Forwarding
SELECT has_column(
  'public',
  'notification_preferences',
  'message_forwarding_sms',
  'should have message_forwarding_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'message_forwarding_email',
  'should have message_forwarding_email column'
);

-- Payment Reminders
SELECT has_column(
  'public',
  'notification_preferences',
  'payment_reminders_sms',
  'should have payment_reminders_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'payment_reminders_email',
  'should have payment_reminders_email column'
);

-- Promotional
SELECT has_column(
  'public',
  'notification_preferences',
  'promotional_sms',
  'should have promotional_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'promotional_email',
  'should have promotional_email column'
);

-- Reservation Updates
SELECT has_column(
  'public',
  'notification_preferences',
  'reservation_updates_sms',
  'should have reservation_updates_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'reservation_updates_email',
  'should have reservation_updates_email column'
);

-- Lease Requests
SELECT has_column(
  'public',
  'notification_preferences',
  'lease_requests_sms',
  'should have lease_requests_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'lease_requests_email',
  'should have lease_requests_email column'
);

-- Proposal Updates
SELECT has_column(
  'public',
  'notification_preferences',
  'proposal_updates_sms',
  'should have proposal_updates_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'proposal_updates_email',
  'should have proposal_updates_email column'
);

-- Check-in/Check-out
SELECT has_column(
  'public',
  'notification_preferences',
  'checkin_checkout_sms',
  'should have checkin_checkout_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'checkin_checkout_email',
  'should have checkin_checkout_email column'
);

-- Reviews
SELECT has_column(
  'public',
  'notification_preferences',
  'reviews_sms',
  'should have reviews_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'reviews_email',
  'should have reviews_email column'
);

-- Tips/Insights
SELECT has_column(
  'public',
  'notification_preferences',
  'tips_insights_sms',
  'should have tips_insights_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'tips_insights_email',
  'should have tips_insights_email column'
);

-- Account Assistance
SELECT has_column(
  'public',
  'notification_preferences',
  'account_assistance_sms',
  'should have account_assistance_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'account_assistance_email',
  'should have account_assistance_email column'
);

-- Virtual Meetings
SELECT has_column(
  'public',
  'notification_preferences',
  'virtual_meetings_sms',
  'should have virtual_meetings_sms column'
);

SELECT has_column(
  'public',
  'notification_preferences',
  'virtual_meetings_email',
  'should have virtual_meetings_email column'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Default Value Verification
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: promotional_sms defaults to false (per Bubble behavior)
SELECT col_default_is(
  'public',
  'notification_preferences',
  'promotional_sms',
  'false',
  'promotional_sms should default to false'
);

-- Test: promotional_email defaults to true
SELECT col_default_is(
  'public',
  'notification_preferences',
  'promotional_email',
  'true',
  'promotional_email should default to true'
);

-- Test: Other SMS columns default to true
SELECT col_default_is(
  'public',
  'notification_preferences',
  'message_forwarding_sms',
  'true',
  'message_forwarding_sms should default to true'
);

SELECT col_default_is(
  'public',
  'notification_preferences',
  'proposal_updates_sms',
  'true',
  'proposal_updates_sms should default to true'
);

-- Test: Other email columns default to true
SELECT col_default_is(
  'public',
  'notification_preferences',
  'message_forwarding_email',
  'true',
  'message_forwarding_email should default to true'
);

SELECT col_default_is(
  'public',
  'notification_preferences',
  'proposal_updates_email',
  'true',
  'proposal_updates_email should default to true'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Schema Verification: notification_audit table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: notification_audit table exists
SELECT has_table(
  'public',
  'notification_audit',
  'notification_audit table should exist'
);

-- Test: Required columns exist
SELECT has_column(
  'public',
  'notification_audit',
  'user_id',
  'notification_audit should have user_id column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'category',
  'notification_audit should have category column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'channel',
  'notification_audit should have channel column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'action',
  'notification_audit should have action column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'skip_reason',
  'notification_audit should have skip_reason column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'admin_override',
  'notification_audit should have admin_override column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'correlation_id',
  'notification_audit should have correlation_id column'
);

SELECT has_column(
  'public',
  'notification_audit',
  'created_at',
  'notification_audit should have created_at column'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Index Verification
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: notification_audit has user_id index
SELECT has_index(
  'public',
  'notification_audit',
  'idx_notification_audit_user_id',
  'notification_audit should have user_id index'
);

-- Test: notification_audit has created_at index
SELECT has_index(
  'public',
  'notification_audit',
  'idx_notification_audit_created_at',
  'notification_audit should have created_at index'
);

-- Test: notification_preferences has user_id unique constraint/index
SELECT has_index(
  'public',
  'notification_preferences',
  'notification_preferences_user_id_key',
  'notification_preferences should have unique user_id index'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS Policy Verification
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: RLS is enabled on notification_preferences
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'notification_preferences'),
  true,
  'RLS should be enabled on notification_preferences'
);

-- Test: RLS is enabled on notification_audit
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'notification_audit'),
  true,
  'RLS should be enabled on notification_audit'
);

-- Test: Users can view own audit records policy exists
SELECT policy_cmd_is(
  'public',
  'notification_audit',
  'Users can view own audit records',
  'SELECT',
  'notification_audit should have SELECT policy'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Enum Type Verification
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: notification_category enum exists
SELECT has_enum(
  'public',
  'notification_category',
  'notification_category enum should exist'
);

-- Test: notification_category has expected labels
SELECT enum_has_labels(
  'public',
  'notification_category',
  ARRAY[
    'proposal_updates',
    'message_forwarding',
    'payment_reminders',
    'promotional',
    'reservation_updates',
    'lease_requests',
    'checkin_checkout',
    'reviews',
    'tips_insights',
    'account_assistance',
    'virtual_meetings'
  ],
  'notification_category should have all 11 category labels'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Backfill Verification (if applicable)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Note: These tests verify that backfill migration ran correctly
-- They should pass after the backfill migration has been applied

-- Test: All auth.users have notification_preferences (if auth table accessible)
-- This may need adjustment based on actual database structure
SELECT ok(
  (
    SELECT NOT EXISTS (
      SELECT 1 FROM auth.users u
      LEFT JOIN public.notification_preferences np ON u.id::text = np.user_id
      WHERE np.user_id IS NULL
    )
  ),
  'All users should have notification preferences (backfill complete)'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Data Integrity Tests
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test: All boolean columns are actually boolean type
SELECT col_type_is(
  'public',
  'notification_preferences',
  'promotional_sms',
  'boolean',
  'promotional_sms should be boolean type'
);

SELECT col_type_is(
  'public',
  'notification_preferences',
  'promotional_email',
  'boolean',
  'promotional_email should be boolean type'
);

-- Finish tests
SELECT * FROM finish();

-- Rollback to leave database unchanged
ROLLBACK;
