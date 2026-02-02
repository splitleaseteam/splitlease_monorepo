-- Migration: Create identity-documents storage bucket with RLS policies
-- Purpose: Secure storage for identity verification documents (selfie, front ID, back ID)
-- Date: 2026-01-25

-- ============================================================================
-- Step 1: Create the identity-documents storage bucket
-- ============================================================================

-- Note: Bucket creation is typically done via Supabase Dashboard or supabase storage API
-- This SQL handles the RLS policies for the bucket

-- Insert bucket record if using SQL-based bucket creation
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('identity-documents', 'identity-documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Step 2: RLS Policies for identity-documents bucket
-- ============================================================================

-- Policy: Users can upload identity documents to their own folder
-- Path format: {user_id}/{document_type}_{timestamp}.{extension}
DROP POLICY IF EXISTS "Users can upload identity documents" ON storage.objects;
CREATE POLICY "Users can upload identity documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own identity documents
DROP POLICY IF EXISTS "Users can view own identity documents" ON storage.objects;
CREATE POLICY "Users can view own identity documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update/replace their own identity documents
DROP POLICY IF EXISTS "Users can update own identity documents" ON storage.objects;
CREATE POLICY "Users can update own identity documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own identity documents
DROP POLICY IF EXISTS "Users can delete own identity documents" ON storage.objects;
CREATE POLICY "Users can delete own identity documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Service role has full access (for Edge Function operations)
DROP POLICY IF EXISTS "Service role full access to identity documents" ON storage.objects;
CREATE POLICY "Service role full access to identity documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'identity-documents')
WITH CHECK (bucket_id = 'identity-documents');

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Allowed MIME types (enforced at application level): image/jpeg, image/png, image/webp, image/heic
-- 2. Max file size (enforced at application level): 10MB per file
-- 3. The bucket should be created as PRIVATE via Supabase Dashboard:
--    - Go to Storage > New Bucket
--    - Name: identity-documents
--    - Public: OFF (unchecked)
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
--    - File size limit: 10MB
