-- Migration: Create Recommendation Logs Table (ADAPTED)
-- Pattern 1: Personalized Defaults

CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dual-reference for user
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL)),

  -- Recommendation details
  primary_recommendation TEXT NOT NULL CHECK (primary_recommendation IN ('buyout', 'crash', 'swap')),
  archetype_type TEXT NOT NULL,
  archetype_confidence DECIMAL(3, 2),

  -- Context
  days_until_checkin INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  target_date DATE,

  -- Roommate reference (dual)
  roommate_auth_user_id UUID REFERENCES auth.users(id),
  roommate_bubble_user_id TEXT REFERENCES "user"(_id),

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
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_auth_user ON public.recommendation_logs(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_bubble_user ON public.recommendation_logs(bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_created_at ON public.recommendation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_archetype ON public.recommendation_logs(archetype_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_followed ON public.recommendation_logs(followed_recommendation);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_experiment ON public.recommendation_logs(experiment_id) WHERE experiment_id IS NOT NULL;

-- Create composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_analytics ON public.recommendation_logs(
  archetype_type,
  primary_recommendation,
  followed_recommendation,
  created_at
);

-- Add comments
COMMENT ON TABLE public.recommendation_logs IS 'Logs all recommendation events for analytics and optimization';

-- Enable Row Level Security
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access to recommendation_logs"
  ON public.recommendation_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read own logs"
  ON public.recommendation_logs
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR auth.uid()::text = bubble_user_id
  );

-- Grant permissions
GRANT SELECT ON public.recommendation_logs TO authenticated;
GRANT ALL ON public.recommendation_logs TO service_role;
