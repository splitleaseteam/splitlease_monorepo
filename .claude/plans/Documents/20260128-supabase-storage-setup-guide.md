# Supabase Storage Setup for Lease Documents

**Date**: 2026-01-28
**Project**: splitlease-backend-dev (default)
**Purpose**: Infrastructure setup for contract template storage

---

## Overview

This document outlines the setup required for Supabase Storage to support the lease documents feature. The storage bucket will host:

1. **Template files** (read-only, public access) - DOCX templates used for contract generation
2. **Generated contracts** (authenticated write) - Generated DOCX files stored in `generated/` subfolder

---

## Storage Bucket Configuration

### Bucket Details

- **Name**: `contract-templates`
- **Public**: Yes (for template file access)
- **File Size Limit**: Default (5MB for free tier, sufficient for DOCX files)

### Folder Structure

```
contract-templates/
├── recurringcreditcardauthorizationprorated.docx    # Template
├── recurringcreditcardauthorization.docx             # Template
├── hostpayoutscheduleform.docx                      # Template
├── periodictenancyagreement.docx                    # Template
├── supplementalagreement.docx                       # Template
└── generated/                                       # Generated contracts
    ├── {user_id}/
    │   └── {contract_id}.docx
    └── ...
```

---

## RLS (Row Level Security) Policies

### Policy 1: Public Read Access for Templates

```sql
-- Allow anyone to read template files (not in generated/ folder)
CREATE POLICY "Public read access for templates"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] <> 'generated'
);
```

**Purpose**: Allow the Edge Function to read template files without authentication.

### Policy 2: Authenticated Write to Generated Folder

```sql
-- Allow authenticated users to write to generated/ subfolder only
CREATE POLICY "Authenticated write to generated folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

**Purpose**: Allow users to generate contracts, which are stored in their user-specific folder.

### Policy 3: Authenticated Read Own Generated Contracts

```sql
-- Allow users to read their own generated contracts
CREATE POLICY "Authenticated read own generated contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

**Purpose**: Users can access their own generated contract history.

---

## Manual Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for Initial Setup)

1. **Navigate to Storage**
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage
   - Click "New bucket"

2. **Create Bucket**
   - Name: `contract-templates`
   - Public bucket: Toggle ON
   - File size limit: Leave default
   - Allowed MIME types: Add `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

3. **Configure RLS Policies**
   - Go to Authentication → Policies
   - Select `storage.objects` table
   - Create the three policies listed above using SQL Editor

4. **Upload Template Files**
   - Navigate to Storage → contract-templates
   - Upload the following template files (to be provided):
     - `recurringcreditcardauthorizationprorated.docx`
     - `recurringcreditcardauthorization.docx`
     - `hostpayoutscheduleform.docx`
     - `periodictenancyagreement.docx`
     - `supplementalagreement.docx`

### Option 2: Using SQL Editor

```sql
-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-templates', 'contract-templates', true);

-- Step 2: Enable RLS on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
CREATE POLICY "Public read access for templates"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] <> 'generated'
);

CREATE POLICY "Authenticated write to generated folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Authenticated read own generated contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-templates'
  AND (storage.foldername(name))[1] = 'generated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

---

## Template Files Required

The following DOCX template files need to be manually uploaded to the `contract-templates` bucket:

| File Name | Purpose | Status |
|-----------|---------|--------|
| `recurringcreditcardauthorizationprorated.docx` | Recurring credit card authorization (prorated) | ⏳ Pending upload |
| `recurringcreditcardauthorization.docx` | Recurring credit card authorization | ⏳ Pending upload |
| `hostpayoutscheduleform.docx` | Host payout schedule form | ⏳ Pending upload |
| `periodictenancyagreement.docx` | Periodic tenancy agreement | ⏳ Pending upload |
| `supplementalagreement.docx` | Supplemental agreement | ⏳ Pending upload |

**Note**: These template files are not currently available in the codebase. They need to be:
1. Created from existing contract documents
2. Uploaded to Supabase Storage manually via Dashboard or API

---

## Storage Access from Edge Functions

### Download Template

```typescript
// In lease-documents Edge Function
const { data, error } = await supabaseAdmin
  .storage
  .from('contract-templates')
  .download('periodictenancyagreement.docx');

if (error) throw new Error(`Failed to download template: ${error.message}`);
```

### Upload Generated Contract

```typescript
// In lease-documents Edge Function
const fileName = `generated/${userId}/${contractId}.docx`;
const { data, error } = await supabaseAdmin
  .storage
  .from('contract-templates')
  .upload(fileName, docxBuffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false
  });

if (error) throw new Error(`Failed to upload contract: ${error.message}`);
```

### Get Public URL for Template

```typescript
// For Edge Function to access template
const templateUrl = supabaseAdmin
  .storage
  .from('contract-templates')
  .getPublicUrl('periodictenancyagreement.docx')
  .data.publicUrl;
```

---

## Verification Steps

After setup, verify the configuration:

1. **Bucket exists**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'contract-templates';
   ```

2. **Policies are active**
   ```sql
   SELECT * FROM storage.policies WHERE table_name = 'objects' AND bucket_id = 'contract-templates';
   ```

3. **Public read works**
   - Try accessing: `https://<PROJECT_ID>.supabase.co/storage/v1/object/public/contract-templates/periodictenancyagreement.docx`

4. **Template files are present**
   - Check Dashboard: Storage → contract-templates
   - Or query: `SELECT * FROM storage.objects WHERE bucket_id = 'contract-templates';`

---

## Security Considerations

1. **Template files**: Publicly readable but not writable (no INSERT policy for templates)
2. **Generated files**: User-isolated, users can only read/write their own contracts
3. **File size monitoring**: Consider adding storage triggers to alert on unusual upload activity
4. **Retention policy**: Consider implementing a cleanup job for old generated contracts

---

## MCP Tool Usage (Once Available)

Once the Supabase MCP server is properly connected with project credentials, the following operations can be executed programmatically:

```javascript
// List buckets
mcp__supabase__list_buckets()

// Create bucket
mcp__supabase__create_bucket({
  name: 'contract-templates',
  public: true
})

// Execute SQL for policies
mcp__supabase__execute_sql({
  query: `CREATE POLICY "Public read access for templates" ...`
})

// Upload template files (once available)
mcp__supabase__upload_file({
  bucket: 'contract-templates',
  path: 'periodictenancyagreement.docx',
  file: /* file content */
})
```

---

## Status

- [x] Storage bucket design completed
- [x] RLS policies designed
- [x] Documentation created
- [ ] Bucket created in Supabase (requires MCP connection or manual setup)
- [ ] RLS policies applied (requires MCP connection or manual setup)
- [ ] Template files uploaded (pending file acquisition)

---

**Next Steps**:
1. Establish Supabase MCP connection with `splitlease-backend-dev` project credentials
2. Execute bucket creation and policy setup via MCP tools or manual SQL
3. Acquire or create the 5 required DOCX template files
4. Upload templates to the bucket
5. Test Edge Function integration

---

**Document ID**: 20260128-supabase-storage-setup-guide.md
**Status**: Ready for Implementation
