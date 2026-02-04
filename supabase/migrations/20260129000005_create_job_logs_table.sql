-- Migration: Create Archetype Job Logs Table (ADAPTED)
-- Pattern 1: Personalized Defaults

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
CREATE INDEX IF NOT EXISTS idx_archetype_job_logs_job_type ON public.archetype_job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_archetype_job_logs_completed_at ON public.archetype_job_logs(completed_at);

-- Add comments
COMMENT ON TABLE public.archetype_job_logs IS 'Tracks background job executions for archetype system';

-- Enable RLS
ALTER TABLE public.archetype_job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to archetype_job_logs"
  ON public.archetype_job_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.archetype_job_logs TO authenticated;
GRANT ALL ON public.archetype_job_logs TO service_role;

-- ⚠️ pg_cron setup - VERIFY pg_cron extension is enabled first
-- Check with: SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ⚠️ Commenting out cron job - uncomment after verifying environment settings
/*
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
*/

-- Alternative: Use Supabase Edge Function cron trigger (preferred for Supabase hosted)
-- Add this to supabase/config.toml:
-- [functions.archetype-recalculation-job]
-- schedule = "0 2 * * *"
