-- Migration: Add identity verification fields to user table
-- Purpose: Track identity verification status and document URLs
-- Date: 2026-01-25

-- ============================================================================
-- Add identity verification columns to public.user table
-- ============================================================================

ALTER TABLE public.user
ADD COLUMN IF NOT EXISTS identity_document_type TEXT,
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS front_id_url TEXT,
ADD COLUMN IF NOT EXISTS back_id_url TEXT,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMPTZ;

-- ============================================================================
-- Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.user.identity_document_type IS 'Type of ID document: Driver''s License / State ID, Passport, National ID Card, Residence Permit';
COMMENT ON COLUMN public.user.selfie_url IS 'Signed URL to user selfie in identity-documents bucket';
COMMENT ON COLUMN public.user.front_id_url IS 'Signed URL to front of ID document in identity-documents bucket';
COMMENT ON COLUMN public.user.back_id_url IS 'Signed URL to back of ID document in identity-documents bucket';
COMMENT ON COLUMN public.user.identity_verified IS 'Whether user identity has been verified by admin (default: false)';
COMMENT ON COLUMN public.user.identity_submitted_at IS 'Timestamp when user submitted identity verification documents';
COMMENT ON COLUMN public.user.identity_verified_at IS 'Timestamp when admin approved identity verification';

-- ============================================================================
-- Create index for efficient querying of unverified submissions
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_identity_submitted_pending
ON public.user (identity_submitted_at)
WHERE identity_submitted_at IS NOT NULL AND identity_verified = FALSE;
