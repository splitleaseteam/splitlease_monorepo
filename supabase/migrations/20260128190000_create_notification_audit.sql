-- Migration: Create notification_audit table
-- Purpose: Track all notification decisions (sent vs skipped) for compliance and debugging
-- Date: 2026-01-28
-- Related: Notification Preferences System Implementation

-- ============================================================================
-- NOTIFICATION AUDIT TABLE
-- ============================================================================
-- Logs every notification decision to provide:
-- 1. Compliance tracking for admin overrides
-- 2. Debugging visibility into skipped notifications
-- 3. Analytics on notification preferences impact
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id TEXT NOT NULL REFERENCES public.user(_id),

  -- Notification classification
  category TEXT NOT NULL CHECK (category IN (
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
  )),

  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),

  -- Decision outcome
  action TEXT NOT NULL CHECK (action IN ('sent', 'skipped')),
  skip_reason TEXT, -- Populated when action = 'skipped'

  -- Admin override tracking (for compliance)
  admin_override BOOLEAN DEFAULT FALSE,
  admin_user_id TEXT, -- Who triggered the override (if applicable)

  -- Notification details
  template_id TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Tracing
  edge_function TEXT, -- Which Edge Function triggered this
  correlation_id TEXT, -- Links related notifications (e.g., email + SMS for same event)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookups by user (for preference verification)
CREATE INDEX idx_notification_audit_user ON notification_audit(user_id);

-- Time-based queries for analytics and cleanup
CREATE INDEX idx_notification_audit_created ON notification_audit(created_at);

-- Find overrides for compliance reporting
CREATE INDEX idx_notification_audit_override ON notification_audit(admin_override) WHERE admin_override = TRUE;

-- Find skipped notifications for debugging
CREATE INDEX idx_notification_audit_skipped ON notification_audit(action) WHERE action = 'skipped';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notification_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit records
CREATE POLICY "Users can view own notification audit"
  ON notification_audit
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

-- Service role can insert (Edge Functions)
CREATE POLICY "Service role can insert audit records"
  ON notification_audit
  FOR INSERT
  WITH CHECK (TRUE);

-- Admin users can view all audit records
CREATE POLICY "Admins can view all notification audit"
  ON notification_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user u
      WHERE u._id = current_setting('app.current_user_id', true)
      AND u."Type - User Current" = 'Split Lease'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification_audit IS 'Audit log for all notification decisions (sent/skipped) with preference and admin override tracking';
COMMENT ON COLUMN notification_audit.category IS 'Notification category from NotificationCategory type';
COMMENT ON COLUMN notification_audit.channel IS 'Delivery channel: email or sms';
COMMENT ON COLUMN notification_audit.action IS 'Outcome: sent (delivered to channel) or skipped (preference blocked)';
COMMENT ON COLUMN notification_audit.skip_reason IS 'Human-readable reason when action=skipped';
COMMENT ON COLUMN notification_audit.admin_override IS 'True if admin bypassed user preferences';
COMMENT ON COLUMN notification_audit.correlation_id IS 'UUID linking related notifications for the same event';
