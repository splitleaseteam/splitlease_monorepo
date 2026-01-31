-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - USER ARCHETYPE FIELDS MIGRATION
-- ============================================================================
-- Migration: Add archetype, flexibility_score, spending_score
-- Version: 1.0
-- Date: 2026-01-29
-- Description: Adds behavioral archetype tracking to user table
-- ============================================================================

-- Add archetype-related fields to user table
ALTER TABLE public.user
ADD COLUMN IF NOT EXISTS archetype VARCHAR(50),
ADD COLUMN IF NOT EXISTS flexibility_score INTEGER CHECK (flexibility_score >= 0 AND flexibility_score <= 100),
ADD COLUMN IF NOT EXISTS spending_score INTEGER CHECK (spending_score >= 0 AND spending_score <= 100),
ADD COLUMN IF NOT EXISTS archetype_calculated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archetype_metadata JSONB DEFAULT '{}'::jsonb;

-- Add constraint for valid archetypes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_archetype'
    ) THEN
        ALTER TABLE public.user
        ADD CONSTRAINT valid_archetype
        CHECK (archetype IS NULL OR archetype IN (
            'budget_conscious',
            'flexibility_seeker',
            'premium_convenience',
            'balanced_renter',
            'high_value_hunter'
        ));
    END IF;
END $$;

-- Create indexes for archetype queries
CREATE INDEX IF NOT EXISTS idx_user_archetype ON public.user(archetype);
CREATE INDEX IF NOT EXISTS idx_user_flexibility_score ON public.user(flexibility_score);
CREATE INDEX IF NOT EXISTS idx_user_spending_score ON public.user(spending_score);

-- Create GIN index for archetype_metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_archetype_metadata ON public.user USING GIN (archetype_metadata);

-- Add column documentation
COMMENT ON COLUMN public.user.archetype IS 'User behavioral archetype based on flexibility and spending patterns';
COMMENT ON COLUMN public.user.flexibility_score IS 'Score 0-100 indicating user flexibility preference (higher = more flexible)';
COMMENT ON COLUMN public.user.spending_score IS 'Score 0-100 indicating spending willingness (higher = willing to pay more for convenience)';
COMMENT ON COLUMN public.user.archetype_calculated_at IS 'Timestamp when archetype was last calculated';
COMMENT ON COLUMN public.user.archetype_metadata IS 'Additional metadata about archetype calculation (interactions, history, etc.)';

-- Create view for archetype analytics
CREATE OR REPLACE VIEW public.user_archetype_summary AS
SELECT
    archetype,
    COUNT(*) as user_count,
    AVG(flexibility_score) as avg_flexibility_score,
    AVG(spending_score) as avg_spending_score,
    MIN(archetype_calculated_at) as earliest_calculation,
    MAX(archetype_calculated_at) as latest_calculation
FROM public.user
WHERE archetype IS NOT NULL
GROUP BY archetype;

-- Grant permissions
GRANT SELECT ON public.user_archetype_summary TO authenticated;

-- Update RLS policies to include new fields
-- (Existing policies remain, users can still view/update own profile including archetype)

COMMENT ON TABLE public.user IS 'Core user table with authentication, profile, and behavioral archetype data';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
