-- Migration: Backfill notification_preferences for existing users
-- Purpose: Ensure all existing users have default notification preferences (opt-out model)
-- Date: 2026-01-28
-- Related: Notification Preferences System Implementation

-- ============================================================================
-- BACKFILL NOTIFICATION PREFERENCES
-- ============================================================================
-- This migration creates notification_preferences rows for all users who
-- don't already have one, using the opt-out model (all enabled by default,
-- except promotional_sms which is false by default).
-- ============================================================================

-- Insert default preferences for all users without a notification_preferences row
INSERT INTO notification_preferences (
  user_id,
  -- Check-in/Check-out - Both enabled
  checkin_checkout_sms,
  checkin_checkout_email,
  -- Account Assistance - Both enabled
  account_assistance_sms,
  account_assistance_email,
  -- Message Forwarding - Both enabled
  message_forwarding_sms,
  message_forwarding_email,
  -- Payment Reminders - Both enabled
  payment_reminders_sms,
  payment_reminders_email,
  -- Proposal Updates - Both enabled
  proposal_updates_sms,
  proposal_updates_email,
  -- Reservation Updates - Both enabled
  reservation_updates_sms,
  reservation_updates_email,
  -- Reviews - Both enabled
  reviews_sms,
  reviews_email,
  -- Virtual Meetings - Both enabled
  virtual_meetings_sms,
  virtual_meetings_email,
  -- Lease Requests - Both enabled
  lease_requests_sms,
  lease_requests_email,
  -- Tips/Insights - Both enabled
  tips_insights_sms,
  tips_insights_email,
  -- Promotional - Email only (no SMS per Bubble behavior)
  promotional_sms,
  promotional_email
)
SELECT
  u._id AS user_id,
  -- Check-in/Check-out
  true, true,
  -- Account Assistance
  true, true,
  -- Message Forwarding
  true, true,
  -- Payment Reminders
  true, true,
  -- Proposal Updates
  true, true,
  -- Reservation Updates
  true, true,
  -- Reviews
  true, true,
  -- Virtual Meetings
  true, true,
  -- Lease Requests
  true, true,
  -- Tips/Insights
  true, true,
  -- Promotional (Email only, SMS disabled)
  false, true
FROM public.user u
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np
  WHERE np.user_id = u._id
);

-- ============================================================================
-- VERIFICATION QUERY (for debugging - can be run manually)
-- ============================================================================
-- After running this migration, you can verify with:
--
-- SELECT
--   COUNT(*) as total_users,
--   COUNT(np.user_id) as users_with_preferences,
--   COUNT(*) - COUNT(np.user_id) as users_without_preferences
-- FROM public.user u
-- LEFT JOIN notification_preferences np ON np.user_id = u._id;
--
-- Expected: users_without_preferences = 0
-- ============================================================================

-- Log the backfill result
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  -- Count how many rows were inserted (this runs after the INSERT)
  SELECT COUNT(*) INTO backfilled_count
  FROM notification_preferences np
  WHERE np.user_id IN (
    SELECT u._id FROM public.user u
  );

  RAISE NOTICE 'Notification preferences backfill complete. Total rows: %', backfilled_count;
END $$;
