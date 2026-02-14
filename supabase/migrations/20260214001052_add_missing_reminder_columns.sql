-- Add missing columns to remindersfromhousemanual
-- These columns are referenced by reminder-scheduler edge function but don't exist in the table
-- R22 Agent 4: Found 8 columns used in all 5 handlers that were never created

ALTER TABLE public.remindersfromhousemanual
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS visit text,
  ADD COLUMN IF NOT EXISTS fallback_email text,
  ADD COLUMN IF NOT EXISTS sendgrid_message_id text,
  ADD COLUMN IF NOT EXISTS twilio_message_sid text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add indexes for webhook lookup columns (these are used in .eq() filters)
CREATE INDEX IF NOT EXISTS idx_reminders_sendgrid_msg_id ON public.remindersfromhousemanual (sendgrid_message_id) WHERE sendgrid_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_twilio_msg_sid ON public.remindersfromhousemanual (twilio_message_sid) WHERE twilio_message_sid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.remindersfromhousemanual (status);
CREATE INDEX IF NOT EXISTS idx_reminders_visit ON public.remindersfromhousemanual (visit) WHERE visit IS NOT NULL;
