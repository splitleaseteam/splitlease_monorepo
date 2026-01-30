-- Add reminder_sent_at column to datechangerequest table
-- This column tracks when reminder emails were sent for expiring requests
-- Used by the date-change-reminder-cron Edge Function to prevent duplicate reminders

-- Migration: 20260130_add_date_change_reminder_tracking.sql
-- Author: Claude (Split Lease)
-- Description: Add reminder tracking for date change request expiry notifications

-- Add reminder_sent_at column to datechangerequest table
ALTER TABLE reference_table.datechangerequest
ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamptz NULL;

-- Add comment for documentation
COMMENT ON COLUMN reference_table.datechangerequest."reminder_sent_at" IS 'Timestamp when the last reminder email was sent for this expiring request. Used to prevent duplicate reminders within the cooldown period.';

-- Create index on expiration_date and reminder_sent_at for efficient cron job queries
-- This index helps the cron job quickly find requests expiring soon that haven't had recent reminders
CREATE INDEX IF NOT EXISTS idx_datechangerequest_expiration_reminder
ON reference_table.datechangerequest ("expiration date", "reminder_sent_at")
WHERE "request status" = 'waiting_for_answer';

-- Add comment for the index
COMMENT ON INDEX reference_table.idx_datechangerequest_expiration_reminder IS 'Index for date change reminder cron job queries. Optimizes finding pending requests expiring soon without recent reminders.';
