# Lease Documents Generation - Migration Plan

## Overview

Migrate the PythonAnywhere-based document generation system to Supabase Edge Functions to align with Split Lease's architecture.

---

## Current State Analysis

### PythonAnywhere Implementation (Flask/Python)

**5 Document Types Generated:**
1. **Host Payout Schedule Form** - Payment schedule for hosts
2. **Supplemental Agreement** - Property details supplement
3. **Periodic Tenancy Agreement** - Main lease agreement
4. **Credit Card Authorization (Prorated)** - CC auth for prorated leases
5. **Credit Card Authorization (Non-Prorated)** - CC auth for standard leases

**Technology Stack:**
- Flask API routes
- `docxtpl` (python-docx-template) for DOCX templating
- `python-docx` for document manipulation
- Google Drive API for file uploads
- Slack webhooks for logging

**Template Variables Per Document:**

| Document | Key Variables |
|----------|---------------|
| Host Payout | address, agreement_number, host_email/name/phone, date1-13, rent1-13, total1-13, maintenance_fee1-13 |
| Supplemental | agreement_number, start_date, end_date, weeks_number, guest_allowed, host_name, listing_title/description, location, type_of_space, image1-3 |
| Periodic Tenancy | agreement_number, start_date, end_date, check_in/out, week_duration, guests_allowed, host_name, guest_name, supplemental_number, credit_card_form_number, payout_number, damage_deposit, house_rules_items |
| CC Auth (Prorated) | agreement_number, host_name, guest_name, fourweekrent, damagedeposit, maintenancefee, totalfirstpayment, totalsecondpayment, lastpaymenttotal, slcredit, weeks_number, numberofpayments |
| CC Auth (Non-Prorated) | Same as prorated |

---

## Target Architecture

### Supabase Edge Function: `lease-documents`

```
supabase/functions/lease-documents/
├── index.ts                    # Main entry point with action routing
├── handlers/
│   ├── generateHostPayout.ts
│   ├── generateSupplemental.ts
│   ├── generatePeriodicTenancy.ts
│   ├── generateCreditCardAuth.ts
│   └── generateAll.ts          # Orchestrates all 5 documents
├── lib/
│   ├── types.ts               # TypeScript interfaces
│   ├── validators.ts          # Input validation
│   ├── calculations.ts        # Payment calculations
│   ├── templateRenderer.ts    # DOCX generation wrapper
│   ├── googleDrive.ts         # Google Drive upload
│   └── formatters.ts          # Date/currency formatting
└── templates/                  # DOCX template storage reference
```

### Action-Based API Pattern

```typescript
// Request format
{
  "action": "generate_host_payout" | "generate_supplemental" | "generate_periodic_tenancy" | "generate_credit_card_auth" | "generate_all",
  "payload": {
    // Document-specific fields
  }
}

// Response format
{
  "success": true,
  "data": {
    "filename": "host_payout_schedule-AGR-12345.docx",
    "driveUrl": "https://drive.google.com/...",
    "fileId": "abc123"
  }
}
```

---

## Technical Decisions

### 1. DOCX Generation in Deno

**Option A: docxtemplater (via npm specifier)** - RECOMMENDED
- Mature library with Deno compatibility via `npm:docxtemplater`
- Requires `npm:pizzip` for ZIP handling
- Well-documented, handles complex templates

```typescript
import Docxtemplater from "npm:docxtemplater@3.x";
import PizZip from "npm:pizzip@3.x";
```

**Option B: Build DOCX manually**
- More control but significant effort
- Not recommended due to complexity

### 2. Template Storage

**Option A: Supabase Storage** - RECOMMENDED
- Store templates in `templates` bucket
- Download at runtime via Supabase client
- Easy to update templates without code deployment

**Option B: Bundle with function**
- Embed base64-encoded templates in code
- Faster execution but harder to update

### 3. Google Drive Integration

- Use Google Service Account for server-to-server auth
- Store credentials in Supabase Vault/Secrets
- Use `googleapis` via npm specifier or direct REST API calls

### 4. Image Handling

- Images come as URLs from Supabase Storage
- Fetch images and embed in DOCX using docxtemplater's image module
- Use `npm:docxtemplater-image-module-free` for image support

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT GENERATION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Frontend calls Edge Function with action + payload                      │
│     POST /functions/v1/lease-documents                                      │
│     { action: "generate_host_payout", payload: {...} }                      │
│                                                                             │
│  2. Edge Function validates input                                           │
│     - Required fields check                                                 │
│     - Date format validation                                                │
│     - Currency format validation                                            │
│                                                                             │
│  3. Download template from Supabase Storage                                 │
│     templates/host_payout/hostpayoutscheduleform.docx                       │
│                                                                             │
│  4. Process template with docxtemplater                                     │
│     - Substitute variables                                                  │
│     - Process conditionals (empty row removal)                              │
│     - Embed images (if applicable)                                          │
│                                                                             │
│  5. Upload generated DOCX to Google Drive                                   │
│     - Authenticate with service account                                     │
│     - Upload to designated folder                                           │
│     - Return web view link                                                  │
│                                                                             │
│  6. Return response with success/error + drive URL                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Infrastructure Setup

1. **Create Supabase Storage bucket for templates**
   - Bucket name: `document-templates`
   - Folders: `host_payout/`, `supplemental/`, `periodic_tenancy/`, `credit_card_auth/`
   - Upload existing DOCX templates

2. **Configure Google Service Account**
   - Create service account in Google Cloud Console
   - Grant Drive API access
   - Store credentials JSON in Supabase Vault
   - Share target Drive folder with service account email

3. **Create Edge Function scaffold**
   - Initialize `lease-documents` function
   - Set up action routing pattern
   - Configure CORS and error handling

### Phase 2: Core Library Development

4. **Implement template renderer** (`lib/templateRenderer.ts`)
   ```typescript
   export async function renderTemplate(
     templatePath: string,
     data: Record<string, unknown>
   ): Promise<Uint8Array>
   ```

5. **Implement Google Drive uploader** (`lib/googleDrive.ts`)
   ```typescript
   export async function uploadToGoogleDrive(
     fileContent: Uint8Array,
     fileName: string,
     mimeType: string
   ): Promise<{ fileId: string; webViewLink: string }>
   ```

6. **Implement formatters** (`lib/formatters.ts`)
   - `formatDate(dateStr: string): string` - "1/20/26" → "January 20, 2026"
   - `formatCurrency(value: number): string` - 1028.58 → "$1,028.58"
   - `roundDown(value: number): number` - Floor to 2 decimal places

7. **Implement calculations** (`lib/calculations.ts`)
   - Payment total calculations
   - Prorated vs non-prorated logic

### Phase 3: Handler Implementation

8. **Host Payout Schedule** (`handlers/generateHostPayout.ts`)
   - Template: `hostpayoutscheduleform.docx`
   - Variables: 13 payment dates, rents, totals + host info
   - Post-processing: Remove empty payment rows

9. **Supplemental Agreement** (`handlers/generateSupplemental.ts`)
   - Template: `supplementalagreement.docx`
   - Variables: Property details, dates, images
   - Image embedding for image1-3

10. **Periodic Tenancy Agreement** (`handlers/generatePeriodicTenancy.ts`)
    - Template: `periodictenancyagreement.docx`
    - Variables: Full lease terms, house rules
    - Post-processing: Format house rules as bullet list

11. **Credit Card Authorization** (`handlers/generateCreditCardAuth.ts`)
    - Templates: `recurringcreditcardauthorization.docx` (non-prorated), `recurringcreditcardauthorizationprorated.docx` (prorated)
    - Conditional template selection based on `isProrated` flag
    - Payment calculations

12. **Generate All** (`handlers/generateAll.ts`)
    - Orchestrates sequential generation of all 5 documents
    - Returns array of results
    - Handles partial failures gracefully

### Phase 4: Integration & Testing

13. **Update frontend caller**
    - Replace PythonAnywhere API calls with Edge Function calls
    - Update Bubble.io workflow to call Supabase instead

14. **Testing**
    - Unit tests for formatters and calculations
    - Integration tests for each document type
    - End-to-end test with real template and Drive upload

---

## Type Definitions

```typescript
// lib/types.ts

export interface HostPayoutPayload {
  agreementNumber: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  address: string;
  payoutNumber: string;
  maintenanceFee: string;
  // Payment entries 1-13
  payments: Array<{
    date: string;
    rent: string;
    total: string;
  }>;
}

export interface SupplementalPayload {
  agreementNumber: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfWeeks: string;
  guestsAllowed: string;
  hostName: string;
  listingTitle: string;
  listingDescription: string;
  location: string;
  typeOfSpace: string;
  spaceDetails: string;
  supplementalNumber: string;
  image1Url?: string;
  image2Url?: string;
  image3Url?: string;
}

export interface PeriodicTenancyPayload {
  agreementNumber: string;
  checkInDate: string;
  checkOutDate: string;
  checkInDay: string;
  checkOutDay: string;
  numberOfWeeks: string;
  guestsAllowed: string;
  hostName: string;
  guestName: string;
  supplementalNumber: string;
  authorizationCardNumber: string;
  hostPayoutScheduleNumber: string;
  extraRequestsOnCancellationPolicy?: string;
  damageDeposit: string;
  listingTitle: string;
  listingDescription: string;
  location: string;
  typeOfSpace: string;
  spaceDetails: string;
  houseRules: string[];
  image1Url?: string;
  image2Url?: string;
  image3Url?: string;
}

export interface CreditCardAuthPayload {
  agreementNumber: string;
  hostName: string;
  guestName: string;
  weeksNumber: string;
  listingDescription: string;
  numberOfPayments: string;
  fourWeekRent: string;
  damageDeposit: string;
  maintenanceFee: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
  penultimateWeekNumber: string;
  lastPaymentWeeks: string;
  isProrated: boolean;
}

export interface GenerateAllPayload {
  reservation: {
    agreementNumber: string;
    // All combined fields from above
  };
  listing: {
    // Listing details
  };
  host: {
    // Host details
  };
  guest: {
    // Guest details
  };
  proposal: {
    // Pricing and schedule details
  };
}

export interface DocumentResult {
  success: boolean;
  filename?: string;
  driveUrl?: string;
  fileId?: string;
  error?: string;
}
```

---

## Environment Variables Required

```
# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GOOGLE_DRIVE_FOLDER_ID=abc123

# Slack Webhooks (existing)
SLACK_ERROR_WEBHOOK=https://hooks.slack.com/...
SLACK_SUCCESS_WEBHOOK=https://hooks.slack.com/...

# Supabase (existing)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Migration Checklist

- [ ] Upload DOCX templates to Supabase Storage
- [ ] Configure Google Service Account
- [ ] Create `lease-documents` Edge Function scaffold
- [ ] Implement `lib/templateRenderer.ts`
- [ ] Implement `lib/googleDrive.ts`
- [ ] Implement `lib/formatters.ts`
- [ ] Implement `lib/calculations.ts`
- [ ] Implement `lib/types.ts`
- [ ] Implement `lib/validators.ts`
- [ ] Implement `handlers/generateHostPayout.ts`
- [ ] Implement `handlers/generateSupplemental.ts`
- [ ] Implement `handlers/generatePeriodicTenancy.ts`
- [ ] Implement `handlers/generateCreditCardAuth.ts`
- [ ] Implement `handlers/generateAll.ts`
- [ ] Test each document type individually
- [ ] Test orchestrated generation (generate_all)
- [ ] Update Bubble.io workflow API endpoints
- [ ] Production deployment
- [ ] Decommission PythonAnywhere service

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| DOCX generation library limitations in Deno | Fallback to external API (e.g., Cloudmersive, or keep thin Python wrapper) |
| Google Drive auth complexity | Use JWT-based service account auth (no OAuth flow needed) |
| Template variable mismatch | Create comprehensive test suite with sample data from production |
| Large file handling in Edge Functions | Stream uploads, use chunked processing if needed |
| Image embedding issues | Pre-process images to consistent format before embedding |

---

## File References

### Target Implementation Location
- [supabase/functions/](supabase/functions/) - Edge Functions directory
- [supabase/functions/_shared/](supabase/functions/_shared/) - Shared utilities

### Related Documentation
- [Lease Documents Generation Requirements](attachment: Lease Documents Generation - COMPREHENSIVE REQUIREMENTS DOCUMENT.md)

---

## Estimated Effort

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1: Infrastructure | Storage, Service Account, Scaffold | 2-3 hours |
| Phase 2: Core Libraries | Template renderer, Drive uploader, Formatters | 4-6 hours |
| Phase 3: Handlers | 5 document handlers | 6-8 hours |
| Phase 4: Integration | Testing, Bubble update, Deployment | 3-4 hours |
| **Total** | | **15-21 hours** |

---

*Plan Created: 2026-01-31*
*Author: Claude Code Agent*
