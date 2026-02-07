-- Migration: Create User Archetypes Table
-- Pattern 1: Personalized Defaults
-- Description: Stores user behavioral archetypes with signals and confidence scores

-- Create user_archetypes table
CREATE TABLE IF NOT EXISTS public.user_archetypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_type TEXT NOT NULL CHECK (archetype_type IN ('big_spender', 'high_flexibility', 'average_user')),
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one archetype per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_user_archetypes_user_id ON public.user_archetypes(user_id);
CREATE INDEX idx_user_archetypes_type ON public.user_archetypes(archetype_type);
CREATE INDEX idx_user_archetypes_updated_at ON public.user_archetypes(updated_at);

-- Create index on signals for common queries
CREATE INDEX idx_user_archetypes_signals ON public.user_archetypes USING GIN (signals);

-- Add comments
COMMENT ON TABLE public.user_archetypes IS 'Stores user behavioral archetypes for personalized defaults';
COMMENT ON COLUMN public.user_archetypes.archetype_type IS 'User archetype: big_spender, high_flexibility, or average_user';
COMMENT ON COLUMN public.user_archetypes.confidence IS 'Confidence score (0-1) in archetype classification';
COMMENT ON COLUMN public.user_archetypes.signals IS 'JSON object containing archetype signals (economic, behavioral, flexibility)';
COMMENT ON COLUMN public.user_archetypes.reasoning IS 'Array of human-readable reasons for archetype classification';
COMMENT ON COLUMN public.user_archetypes.is_manual_override IS 'True if archetype was manually set by admin';

-- Enable Row Level Security
ALTER TABLE public.user_archetypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own archetype
CREATE POLICY "Users can read own archetype"
  ON public.user_archetypes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all archetypes
CREATE POLICY "Admins can read all archetypes"
  ON public.user_archetypes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert/update archetypes (via service role)
-- No policy needed for service role, but add one for completeness

-- Admins can update archetypes
CREATE POLICY "Admins can update archetypes"
  ON public.user_archetypes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
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
