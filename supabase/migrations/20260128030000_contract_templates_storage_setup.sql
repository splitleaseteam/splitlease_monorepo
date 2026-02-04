-- Migration: Contract Templates Storage Bucket Setup
-- Date: 2026-01-28
-- Purpose: Create storage bucket and RLS policies for lease documents
-- Project: splitlease-backend-dev

-- ============================================================================
-- STEP 1: Create Storage Bucket
-- ============================================================================

-- Insert storage bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-templates',
  'contract-templates',
  true,
  5242880, -- 5MB default limit
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[];

-- ============================================================================
-- STEP 2: Enable RLS on storage.objects (usually enabled by default)
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Drop existing policies if they exist (for idempotency)
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated write to generated folder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read own generated contracts" ON storage.objects;

-- ============================================================================
-- STEP 4: Create RLS Policies
-- ============================================================================

-- Policy 1: Public read access for template files (not in generated/ folder)
CREATE POLICY "Public read access for templates"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] <> 'generated'
);

-- Policy 2: Authenticated users can write to their own generated/ subfolder
CREATE POLICY "Authenticated write to generated folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 3: Authenticated users can read their own generated contracts
CREATE POLICY "Authenticated read own generated contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ============================================================================
-- STEP 5: Verification Queries (run these to verify setup)
-- ============================================================================

-- Verify bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'contract-templates';

-- Verify policies are active
-- SELECT * FROM storage.policies WHERE table_name = 'objects' AND bucket_id = 'contract-templates';

-- List all objects in bucket (will be empty until templates are uploaded)
-- SELECT * FROM storage.objects WHERE bucket_id = 'contract-templates';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Next Steps:
-- 1. Upload the following DOCX template files to the contract-templates bucket:
--    - recurringcreditcardauthorizationprorated.docx
--    - recurringcreditcardauthorization.docx
--    - hostpayoutscheduleform.docx
--    - periodictenancyagreement.docx
--    - supplementalagreement.docx
--
-- 2. Test public access by visiting:
--    https://<PROJECT_ID>.supabase.co/storage/v1/object/public/contract-templates/periodictenancyagreement.docx
--
-- 3. Verify Edge Function can access templates:
--    Call lease-documents Edge Function with action 'generate_host_payout'
