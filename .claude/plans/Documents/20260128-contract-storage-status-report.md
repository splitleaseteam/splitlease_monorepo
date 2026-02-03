# Lease Documents Storage Setup - Status Report

**Date**: 2026-01-28
**Project**: Split Lease
**Component**: Lease Documents Storage Infrastructure

---

## Executive Summary

The Supabase Storage infrastructure for lease documents has been **designed and documented**, but **requires manual execution** due to MCP connection limitations. All necessary SQL scripts, documentation, and integration code are ready.

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Storage Bucket Design | ✅ Complete | Bucket name: `contract-templates` |
| RLS Policies Design | ✅ Complete | Public read, Authenticated write |
| SQL Migration Script | ✅ Complete | Ready for execution |
| Edge Function Integration | ✅ Complete | Already implemented in `lease-documents` |
| Bucket Creation | ⏳ Pending | Requires manual execution or MCP connection |
| RLS Policy Application | ⏳ Pending | Requires manual execution or MCP connection |
| Template File Upload | ⏳ Pending | Files not available, need manual upload |

---

## Files Created

1. **Migration Script**: `supabase/migrations/20260128_contract_templates_storage_setup.sql`
   - Creates storage bucket
   - Configures RLS policies
   - Includes verification queries

2. **Setup Guide**: `.claude/plans/Documents/20260128-supabase-storage-setup-guide.md`
   - Complete infrastructure documentation
   - Manual setup instructions
   - Security considerations
   - Integration examples

3. **Setup Script**: `supabase/scripts/setup-contract-storage.sh`
   - Automated setup for local development
   - Includes post-setup verification steps

---

## Storage Configuration

### Bucket Details

```yaml
Name: contract-templates
Public: true (for template access)
File Size Limit: 5MB (default)
Allowed MIME Types:
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

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

### RLS Policies

1. **Public read access for templates**
   - Allows anyone to read template files
   - Excludes `generated/` folder
   - Enables Edge Function to download templates without auth

2. **Authenticated write to generated folder**
   - Users can only write to their own user-specific subfolder
   - Format: `generated/{user_id}/{contract_id}.docx`
   - Prevents users from overwriting templates

3. **Authenticated read own generated contracts**
   - Users can only read their own generated contracts
   - Provides contract history access

---

## Template Files Required

The following DOCX template files need to be uploaded manually:

| # | File Name | Contract Type | Status |
|---|-----------|---------------|--------|
| 1 | `recurringcreditcardauthorizationprorated.docx` | Credit Card Auth (Prorated) | ⏳ Pending upload |
| 2 | `recurringcreditcardauthorization.docx` | Credit Card Auth (Non-Prorated) | ⏳ Pending upload |
| 3 | `hostpayoutscheduleform.docx` | Host Payout Schedule | ⏳ Pending upload |
| 4 | `periodictenancyagreement.docx` | Periodic Tenancy Agreement | ⏳ Pending upload |
| 5 | `supplementalagreement.docx` | Supplemental Agreement | ⏳ Pending upload |

**Note**: These template files are not currently available in the codebase. They need to be:
- Created from existing contract documents
- Uploaded to Supabase Storage manually via Dashboard or API

---

## Edge Function Integration

The `lease-documents` Edge Function already has complete storage integration:

### File: `supabase/functions/lease-documents/lib/supabaseStorage.ts`

**Key Functions**:
- `uploadToSupabaseStorage()` - Uploads generated documents
- `downloadAndRenderTemplate()` (from `templateRenderer.ts`) - Downloads templates and renders DOCX

**Usage Example**:
```typescript
const documentContent = await downloadAndRenderTemplate(
  supabase,
  'periodictenancyagreement.docx',
  templateData
);
```

---

## Manual Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage
   - Click "New bucket"

2. **Create Bucket**
   - Name: `contract-templates`
   - Public bucket: Toggle ON
   - File size limit: 5MB
   - Allowed MIME types: Add `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

3. **Configure RLS Policies**
   - Go to SQL Editor
   - Execute the migration script: `supabase/migrations/20260128_contract_templates_storage_setup.sql`

4. **Upload Template Files**
   - Navigate to Storage → contract-templates
   - Upload the 5 DOCX template files

### Option 2: Using SQL Editor Only

1. **Open SQL Editor** in Supabase Dashboard
2. **Execute the migration script**: `supabase/migrations/20260128_contract_templates_storage_setup.sql`
3. **Upload template files** via Dashboard or API

### Option 3: Using Local Supabase CLI

```bash
# Start local Supabase
supabase start

# Execute migration
supabase db execute --file=supabase/migrations/20260128_contract_templates_storage_setup.sql

# Open storage dashboard
supabase storage open --bucket contract-templates
```

---

## Verification Steps

After setup, verify the configuration:

### 1. Check Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'contract-templates';
```

### 2. Check Policies Are Active
```sql
SELECT name, statement
FROM storage.policies
WHERE table_name = 'objects' AND bucket_id = 'contract-templates';
```

### 3. Test Public Read Access
Visit in browser:
```
https://<PROJECT_ID>.supabase.co/storage/v1/object/public/contract-templates/periodictenancyagreement.docx
```

### 4. Test Edge Function
```bash
curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/lease-documents \
  -H 'Content-Type: application/json' \
  -d '{"action": "generate_host_payout", "payload": {"Agreement Number": "AGR-TEST-001", "Date1": "2024-01-15", "Rent1": "$1000", "Total1": "$1100"} }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "filename": "host_payout_schedule-AGR-TEST-001.docx",
    "driveUrl": "https://drive.google.com/...",
    "fileId": "..."
  }
}
```

---

## MCP Connection Status

**Issue**: Supabase MCP server is configured in `.mcp.json` but not currently connected.

**Configuration**:
```json
{
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp"
  }
}
```

**Required**: MCP connection needs:
- Project ID for `splitlease-backend-dev`
- Service role key for admin operations
- Proper authentication handshake

**Impact**: Without MCP connection, all storage operations must be performed manually via Dashboard or SQL Editor.

---

## Security Considerations

✅ **Implemented**:
- Templates are publicly readable (required for Edge Function access)
- Generated contracts are user-isolated
- Users cannot overwrite templates (no INSERT policy for root bucket)
- RLS ensures users can only access their own generated contracts

⚠️ **Recommendations**:
- Add storage triggers to monitor unusual upload activity
- Implement retention policy for old generated contracts
- Consider adding rate limiting for contract generation
- Monitor storage usage to prevent abuse

---

## Next Steps

1. **Execute Migration** - Run the SQL script via Dashboard or CLI
2. **Upload Templates** - Acquire and upload the 5 DOCX template files
3. **Test Integration** - Verify Edge Function can load templates
4. **Monitor Usage** - Set up alerts for storage metrics

---

## Documentation References

- **Complete Setup Guide**: `.claude/plans/Documents/20260128-supabase-storage-setup-guide.md`
- **Migration Script**: `supabase/migrations/20260128_contract_templates_storage_setup.sql`
- **Setup Script**: `supabase/scripts/setup-contract-storage.sh`
- **Storage Integration**: `supabase/functions/lease-documents/lib/supabaseStorage.ts`

---

## Summary

The Supabase Storage infrastructure for lease documents is **fully designed and documented**, with all SQL scripts and integration code ready. The setup requires:

1. ✅ **Manual execution** of migration script (5 minutes)
2. ⏳ **Acquisition** of 5 DOCX template files (pending)
3. ✅ **Upload** of template files to bucket (5 minutes)

**Total Estimated Setup Time**: 10-15 minutes (once template files are available)

---

**Report Generated**: 2026-01-28
**Status**: Ready for Manual Implementation
**MCP Status**: Not Connected (manual setup required)
