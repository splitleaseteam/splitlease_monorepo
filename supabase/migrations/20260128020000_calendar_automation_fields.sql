-- Migration: 20260128_calendar_automation_fields.sql
-- Description: Add Google Calendar automation fields to virtualmeetingschedulesandlinks table
-- This migration adds fields for tracking Google Calendar event creation and invite status

-- Add Google Calendar event IDs for tracking
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "team_calendar_event_id" text,
ADD COLUMN IF NOT EXISTS "guest_calendar_event_id" text,
ADD COLUMN IF NOT EXISTS "host_calendar_event_id" text;

-- Add calendar invite sent timestamps
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "guest_invite_sent_at" timestamptz,
ADD COLUMN IF NOT EXISTS "host_invite_sent_at" timestamptz;

-- Add calendar processing status
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "calendar_status" text DEFAULT 'pending'
CHECK ("calendar_status" IN ('pending', 'meet_link_created', 'invites_sent', 'failed'));

-- Add error tracking
ALTER TABLE "virtualmeetingschedulesandlinks"
ADD COLUMN IF NOT EXISTS "calendar_error_message" text;

-- Index for processing queue
CREATE INDEX IF NOT EXISTS "idx_virtual_meetings_calendar_status"
ON "virtualmeetingschedulesandlinks"("calendar_status", "confirmedBySplitLease");

-- Comment columns for documentation
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."team_calendar_event_id" IS 'Google Calendar event ID for team calendar (with Meet link)';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."guest_calendar_event_id" IS 'Google Calendar event ID for guest invite';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."host_calendar_event_id" IS 'Google Calendar event ID for host invite';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."calendar_status" IS 'Calendar automation processing status: pending, meet_link_created, invites_sent, or failed';
COMMENT ON COLUMN "virtualmeetingschedulesandlinks"."calendar_error_message" IS 'Error details if calendar processing failed';
