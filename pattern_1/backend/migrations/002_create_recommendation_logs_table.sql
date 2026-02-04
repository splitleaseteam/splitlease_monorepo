-- Migration: Create Recommendation Logs Table
-- Pattern 1: Personalized Defaults
-- Description: Logs all recommendation events for analytics and A/B testing

-- Create recommendation_logs table
CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recommendation details
  primary_recommendation TEXT NOT NULL CHECK (primary_recommendation IN ('buyout', 'crash', 'swap')),
  archetype_type TEXT NOT NULL,
  archetype_confidence DECIMAL(3, 2),

  -- Context
  days_until_checkin INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  target_date DATE,
  roommate_id UUID REFERENCES auth.users(id),

  -- All options presented
  options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- User interaction
  user_selected TEXT CHECK (user_selected IN ('buyout', 'crash', 'swap', NULL)),
  time_to_decision_seconds INTEGER,
  followed_recommendation BOOLEAN,

  -- Outcome
  request_submitted BOOLEAN DEFAULT FALSE,
  request_accepted BOOLEAN,
  final_transaction_type TEXT CHECK (final_transaction_type IN ('buyout', 'crash', 'swap', NULL)),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  user_agent TEXT,

  -- A/B testing
  experiment_variant TEXT,
  experiment_id UUID
);

-- Create indexes
CREATE INDEX idx_recommendation_logs_user_id ON public.recommendation_logs(user_id);
CREATE INDEX idx_recommendation_logs_created_at ON public.recommendation_logs(created_at);
CREATE INDEX idx_recommendation_logs_archetype ON public.recommendation_logs(archetype_type);
CREATE INDEX idx_recommendation_logs_followed ON public.recommendation_logs(followed_recommendation);
CREATE INDEX idx_recommendation_logs_experiment ON public.recommendation_logs(experiment_id) WHERE experiment_id IS NOT NULL;

-- Create composite index for analytics queries
CREATE INDEX idx_recommendation_logs_analytics ON public.recommendation_logs(
  archetype_type,
  primary_recommendation,
  followed_recommendation,
  created_at
);

-- Add comments
COMMENT ON TABLE public.recommendation_logs IS 'Logs all recommendation events for analytics and optimization';
COMMENT ON COLUMN public.recommendation_logs.followed_recommendation IS 'True if user selected the recommended option';
COMMENT ON COLUMN public.recommendation_logs.time_to_decision_seconds IS 'Time from viewing options to making selection';
COMMENT ON COLUMN public.recommendation_logs.experiment_variant IS 'A/B test variant identifier';

-- Enable Row Level Security
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own logs
CREATE POLICY "Users can read own logs"
  ON public.recommendation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all logs
CREATE POLICY "Admins can read all logs"
  ON public.recommendation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert
-- (No policy needed for service role)

-- Grant permissions
GRANT SELECT ON public.recommendation_logs TO authenticated;
GRANT ALL ON public.recommendation_logs TO service_role;
