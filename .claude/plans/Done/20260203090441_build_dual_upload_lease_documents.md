# BUILD Plan: Dual Upload in lease-documents

1. Review current handler flows and confirm where document content and filenames are generated for each contract type so uploads can be added without changing response shape.
2. Update `generateHostPayout` to upload to Google Drive in addition to the existing Supabase Storage upload, returning Drive links while keeping the Supabase backup metadata.
3. Update `generatePeriodicTenancy`, `generateCreditCardAuth`, and `generateSupplemental` to add Supabase Storage uploads in parallel with existing Google Drive uploads, using the specified folder names for backups.
4. Align response payloads to prefer Drive URLs (`driveUrl`, `webViewLink`) while preserving Supabase identifiers for traceability.
5. Validate behavior using the `_test-contracts` page and confirm Drive links resolve plus Supabase backups exist in the correct folders.

Files to change:
- supabase/functions/lease-documents/handlers/generateHostPayout.ts
- supabase/functions/lease-documents/handlers/generatePeriodicTenancy.ts
- supabase/functions/lease-documents/handlers/generateCreditCardAuth.ts
- supabase/functions/lease-documents/handlers/generateSupplemental.ts
