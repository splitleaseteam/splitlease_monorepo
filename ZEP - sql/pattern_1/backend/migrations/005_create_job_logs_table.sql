-- Migration: Create Archetype Job Logs Table
-- Pattern 1: Personalized Defaults
-- Description: Tracks background job executions for monitoring

-- Create archetype_job_logs table
CREATE TABLE IF NOT EXISTS public.archetype_job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('recalculation', 'cleanup', 'migration')),
  processed_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_archetype_job_logs_job_type ON public.archetype_job_logs(job_type);
CREATE INDEX idx_archetype_job_logs_completed_at ON public.archetype_job_logs(completed_at);

-- Add comments
COMMENT ON TABLE public.archetype_job_logs IS 'Tracks background job executions for archetype system';
COMMENT ON COLUMN public.archetype_job_logs.processed_count IS 'Number of users processed';
COMMENT ON COLUMN public.archetype_job_logs.updated_count IS 'Number of archetypes actually updated';

-- Enable RLS
ALTER TABLE public.archetype_job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can read job logs"
  ON public.archetype_job_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.archetype_job_logs TO authenticated;
GRANT ALL ON public.archetype_job_logs TO service_role;

-- Create pg_cron job for daily recalculation
-- Note: Requires pg_cron extension
SELECT cron.schedule(
  'daily-archetype-recalculation',
  '0 2 * * *',  -- Run at 2 AM daily
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/archetype-recalculation-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'config', jsonb_build_object(
          'batchSize', 100,
          'onlyStaleUsers', true
        )
      )
    ) as request_id;
  $$
);

-- Alternative: Use Supabase Edge Function cron trigger
-- Add this to supabase/functions/archetype-recalculation-job/index.ts:
-- // @ts-ignore
-- Deno.cron("daily-archetype-recalculation", "0 2 * * *", async () => {
--   // Job execution logic
-- });
