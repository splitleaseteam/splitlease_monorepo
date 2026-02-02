-- ============================================================================
-- Pattern 1: Personalized Defaults - Consolidated Migration Script
-- Date: 2026-01-29
-- Safe to run multiple times (uses IF NOT EXISTS clauses)
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Create user_archetypes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_archetypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL)),
  archetype_type TEXT NOT NULL CHECK (archetype_type IN ('big_spender', 'high_flexibility', 'average_user')),
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by_auth_user_id UUID REFERENCES auth.users(id),
  override_by_bubble_user_id TEXT REFERENCES "user"(_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id),
  UNIQUE(bubble_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_archetypes_auth_user_id ON public.user_archetypes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_bubble_user_id ON public.user_archetypes(bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_type ON public.user_archetypes(archetype_type);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_updated_at ON public.user_archetypes(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_signals ON public.user_archetypes USING GIN (signals);

COMMENT ON TABLE public.user_archetypes IS 'Stores user behavioral archetypes for personalized defaults';
COMMENT ON COLUMN public.user_archetypes.archetype_type IS 'User archetype: big_spender, high_flexibility, or average_user';
COMMENT ON COLUMN public.user_archetypes.confidence IS 'Confidence score (0-1) in archetype classification';
COMMENT ON COLUMN public.user_archetypes.signals IS 'JSON object containing archetype signals (economic, behavioral, flexibility)';

ALTER TABLE public.user_archetypes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to user_archetypes') THEN
    CREATE POLICY "Service role full access to user_archetypes"
      ON public.user_archetypes FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own archetype') THEN
    CREATE POLICY "Users can read own archetype"
      ON public.user_archetypes FOR SELECT
      USING (auth.uid() = auth_user_id OR auth.uid()::text = bubble_user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_user_archetype_timestamp()
RETURNS TRIGGER AS $trig$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$trig$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_archetype_timestamp ON public.user_archetypes;
CREATE TRIGGER update_user_archetype_timestamp
  BEFORE UPDATE ON public.user_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_archetype_timestamp();

GRANT SELECT ON public.user_archetypes TO authenticated;
GRANT ALL ON public.user_archetypes TO service_role;

-- ============================================================================
-- MIGRATION 002: Create recommendation_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((auth_user_id IS NOT NULL) OR (bubble_user_id IS NOT NULL)),
  primary_recommendation TEXT NOT NULL CHECK (primary_recommendation IN ('buyout', 'crash', 'swap')),
  archetype_type TEXT NOT NULL,
  archetype_confidence DECIMAL(3, 2),
  days_until_checkin INTEGER,
  urgency_level TEXT CHECK (urgency_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  target_date DATE,
  roommate_auth_user_id UUID REFERENCES auth.users(id),
  roommate_bubble_user_id TEXT REFERENCES "user"(_id),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_selected TEXT CHECK (user_selected IN ('buyout', 'crash', 'swap', NULL)),
  time_to_decision_seconds INTEGER,
  followed_recommendation BOOLEAN,
  request_submitted BOOLEAN DEFAULT FALSE,
  request_accepted BOOLEAN,
  final_transaction_type TEXT CHECK (final_transaction_type IN ('buyout', 'crash', 'swap', NULL)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID,
  user_agent TEXT,
  experiment_variant TEXT,
  experiment_id UUID
);

CREATE INDEX IF NOT EXISTS idx_recommendation_logs_auth_user ON public.recommendation_logs(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_bubble_user ON public.recommendation_logs(bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_created_at ON public.recommendation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_archetype ON public.recommendation_logs(archetype_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_followed ON public.recommendation_logs(followed_recommendation);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_experiment ON public.recommendation_logs(experiment_id) WHERE experiment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_analytics ON public.recommendation_logs(archetype_type, primary_recommendation, followed_recommendation, created_at);

COMMENT ON TABLE public.recommendation_logs IS 'Logs all recommendation events for analytics and optimization';

ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to recommendation_logs') THEN
    CREATE POLICY "Service role full access to recommendation_logs"
      ON public.recommendation_logs FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own logs') THEN
    CREATE POLICY "Users can read own logs"
      ON public.recommendation_logs FOR SELECT
      USING (auth.uid() = auth_user_id OR auth.uid()::text = bubble_user_id);
  END IF;
END $$;

GRANT SELECT ON public.recommendation_logs TO authenticated;
GRANT ALL ON public.recommendation_logs TO service_role;

-- ============================================================================
-- MIGRATION 003: Create admin_audit_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,
  CHECK ((admin_auth_user_id IS NOT NULL) OR (admin_bubble_user_id IS NOT NULL)),
  action TEXT NOT NULL CHECK (action IN ('recalculate_archetype', 'override_archetype', 'reset_archetype', 'update_config')),
  target_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_auth ON public.admin_audit_log(admin_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_bubble ON public.admin_audit_log(admin_bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions on user archetypes';

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to admin_audit_log') THEN
    CREATE POLICY "Service role full access to admin_audit_log"
      ON public.admin_audit_log FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

-- ============================================================================
-- MIGRATION 004: Add archetype fields to datechangerequest + Create lease_nights
-- ============================================================================

-- Add columns to datechangerequest
ALTER TABLE public.datechangerequest
  ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('buyout', 'crash', 'swap')),
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS proposed_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS urgency_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS market_demand DECIMAL(3, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS recommended_option TEXT CHECK (recommended_option IN ('buyout', 'crash', 'swap')),
  ADD COLUMN IF NOT EXISTS user_followed_recommendation BOOLEAN,
  ADD COLUMN IF NOT EXISTS requester_archetype TEXT,
  ADD COLUMN IF NOT EXISTS receiver_archetype TEXT;

CREATE INDEX IF NOT EXISTS idx_datechangerequest_transaction_type ON public.datechangerequest(transaction_type);
CREATE INDEX IF NOT EXISTS idx_datechangerequest_recommended ON public.datechangerequest(recommended_option);

COMMENT ON COLUMN public.datechangerequest.transaction_type IS 'Type of transaction: buyout, crash, or swap';
COMMENT ON COLUMN public.datechangerequest.urgency_multiplier IS 'Urgency pricing multiplier applied';
COMMENT ON COLUMN public.datechangerequest.recommended_option IS 'What option the system recommended';
COMMENT ON COLUMN public.datechangerequest.user_followed_recommendation IS 'Whether user selected the recommended option';

-- Create lease_nights table
CREATE TABLE IF NOT EXISTS public.lease_nights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID REFERENCES public.bookings_leases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  market_demand DECIMAL(3, 2) DEFAULT 1.0,
  day_of_week TEXT,
  is_weekend BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lease_id, date)
);

CREATE INDEX IF NOT EXISTS idx_lease_nights_date ON public.lease_nights(date);
CREATE INDEX IF NOT EXISTS idx_lease_nights_lease_id ON public.lease_nights(lease_id);

COMMENT ON TABLE public.lease_nights IS 'Stores nightly pricing data for each lease date';
COMMENT ON COLUMN public.lease_nights.market_demand IS 'Market demand multiplier (0.7-1.4)';

ALTER TABLE public.lease_nights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to lease_nights') THEN
    CREATE POLICY "Service role full access to lease_nights"
      ON public.lease_nights FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read lease nights') THEN
    CREATE POLICY "Users can read lease nights"
      ON public.lease_nights FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.bookings_leases WHERE bookings_leases.id = lease_nights.lease_id));
  END IF;
END $$;

GRANT SELECT ON public.lease_nights TO authenticated;
GRANT ALL ON public.lease_nights TO service_role;

-- ============================================================================
-- MIGRATION 005: Create archetype_job_logs table
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_archetype_job_logs_job_type ON public.archetype_job_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_archetype_job_logs_completed_at ON public.archetype_job_logs(completed_at);

COMMENT ON TABLE public.archetype_job_logs IS 'Tracks background job executions for archetype system';

ALTER TABLE public.archetype_job_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access to archetype_job_logs') THEN
    CREATE POLICY "Service role full access to archetype_job_logs"
      ON public.archetype_job_logs FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

GRANT SELECT ON public.archetype_job_logs TO authenticated;
GRANT ALL ON public.archetype_job_logs TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Pattern 1 migrations applied successfully!' AS status;
