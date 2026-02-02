-- Migration: Create User Archetypes Table (ADAPTED)
-- Pattern 1: Personalized Defaults
-- Adapted for Split Lease existing schema

-- Create user_archetypes table
CREATE TABLE IF NOT EXISTS public.user_archetypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Dual-reference for hybrid auth system
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bubble_user_id TEXT REFERENCES "user"(_id) ON DELETE CASCADE,

  -- At least one user reference must be present
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

  -- Ensure one archetype per user (check both IDs)
  UNIQUE(auth_user_id),
  UNIQUE(bubble_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_archetypes_auth_user_id ON public.user_archetypes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_bubble_user_id ON public.user_archetypes(bubble_user_id);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_type ON public.user_archetypes(archetype_type);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_updated_at ON public.user_archetypes(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_archetypes_signals ON public.user_archetypes USING GIN (signals);

-- Add comments
COMMENT ON TABLE public.user_archetypes IS 'Stores user behavioral archetypes for personalized defaults';
COMMENT ON COLUMN public.user_archetypes.archetype_type IS 'User archetype: big_spender, high_flexibility, or average_user';
COMMENT ON COLUMN public.user_archetypes.confidence IS 'Confidence score (0-1) in archetype classification';
COMMENT ON COLUMN public.user_archetypes.signals IS 'JSON object containing archetype signals (economic, behavioral, flexibility)';

-- Enable Row Level Security
ALTER TABLE public.user_archetypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified - Service role only for admin operations)

-- Policy 1: Service role has full access
CREATE POLICY "Service role full access to user_archetypes"
  ON public.user_archetypes FOR ALL
  USING (auth.role() = 'service_role');

-- Policy 2: Users can read their own archetype (check both ID types)
CREATE POLICY "Users can read own archetype"
  ON public.user_archetypes
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR auth.uid()::text = bubble_user_id
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_archetype_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_user_archetype_timestamp
  BEFORE UPDATE ON public.user_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_archetype_timestamp();

-- Grant permissions
GRANT SELECT ON public.user_archetypes TO authenticated;
GRANT ALL ON public.user_archetypes TO service_role;
