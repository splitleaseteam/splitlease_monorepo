# Contract Generator Migration Plan

**Created**: 2026-01-28
**Source**: Python Flask application in `C:\Users\Split Lease\Downloads\contract_generator_export`
**Target**: Split Lease codebase (React 18 + Vite Islands + Supabase Edge Functions)

---

## Executive Summary

Migrate a Python Flask contract generator system to the Split Lease architecture. The source system generates 5 types of DOCX documents using `docxtpl` library and uploads them to Google Drive.

**Key Decisions:**
- **DOCX Library**: `docx-templates` (TypeScript-native, Jinja2-style templating)
- **Template Storage**: Supabase Storage bucket (`contract-templates`)
- **Edge Function**: Single `contract-generator` function with action-based routing
- **Google Drive**: Synchronous upload from Edge Function
- **Est. Duration**: 16-18 days

---

## Document Types Overview

| Document Type | Template File | Key Features |
|---------------|---------------|--------------|
| `credit_card_auth` | recurringcreditcardauthorizationprorated.docx | Prorated payment calculations |
| `credit_card_auth_nonprorated` | recurringcreditcardauthorization.docx | Standard payment schedule |
| `host_payout` | hostpayoutscheduleform.docx | 13-period payout schedule |
| `periodic_tenancy` | periodictenancyagreement.docx | Full tenancy agreement with images |
| `supplemental` | supplementalagreement.docx | Supplemental agreement addendum |

---

## Architecture Decisions

### 1. DOCX Generation Library: `docx-templates`

**Rationale:**
- TypeScript-native with full type support
- Jinja2-style templating matches Python's `docxtpl`
- Supports loops, conditionals, and images
- Actively maintained (200+ weekly downloads)

**Alternative considered:** `docx` (lower-level, more verbose)

### 2. Template Storage: Supabase Storage

**Rationale:**
- Already integrated into Split Lease
- Easy version control and updates
- No need to bundle large DOCX files with Edge Function
- Can be secured with RLS policies

**Structure:**
```
contract-templates/
├── recurringcreditcardauthorizationprorated.docx
├── recurringcreditcardauthorization.docx
├── hostpayoutscheduleform.docx
├── periodictenancyagreement.docx
└── supplementalagreement.docx
```

### 3. Google Drive Integration

**Pattern**: Direct API call from Edge Function (synchronous)

**Rationale:**
- Simpler than queue-based approach
- User gets immediate result
- Function timeout (25s) is sufficient for DOCX generation

**Credentials**: Service account OAuth2 (stored in Supabase secrets)

### 4. Edge Function Structure

**Pattern**: Single function with action-based routing (matching `listing/index.ts`)

**Actions:**
- `generate_credit_card_auth` - Prorated CC authorization
- `generate_credit_card_auth_nonprorated` - Non-prorated CC authorization
- `generate_host_payout` - Host payout schedule
- `generate_periodic_tenancy` - Periodic tenancy agreement
- `generate_supplemental` - Supplemental agreement
- `list_templates` - Get available document types
- `get_template_schema` - Get field definitions for a document type

---

## File Structure

### Backend (Edge Function)

```
supabase/functions/contract-generator/
├── index.ts                           # Main router with action switch
├── deno.json                          # Deno config
├── actions/
│   ├── generateCreditCardAuth.ts      # Prorated CC authorization
│   ├── generateCreditCardAuthNonProrated.ts
│   ├── generateHostPayout.ts
│   ├── generatePeriodicTenancy.ts
│   ├── generateSupplemental.ts
│   ├── listTemplates.ts
│   └── getTemplateSchema.ts
├── lib/
│   ├── docx.ts                        # docx-templates wrapper
│   ├── storage.ts                     # Supabase Storage template loader
│   ├── googleDrive.ts                 # Google Drive API integration
│   ├── currency.ts                    # Currency formatting utilities
│   ├── dates.ts                       # Date formatting utilities
│   ├── images.ts                      # Image processing (base64, URL)
│   └── validation.ts                  # Input validation schemas
└── types/
    └── contracts.ts                   # TypeScript types
```

### Frontend (React Islands)

```
app/src/islands/pages/contracts/
├── CreditCardAuthPage.jsx
├── HostPayoutPage.jsx
├── PeriodicTenancyPage.jsx
└── SupplementalPage.jsx

app/src/islands/components/contracts/
├── ContractForm.jsx                   # Reusable form wrapper
├── ContractDownload.jsx               # Download/display result
└── ContractPreview.jsx                # Optional preview

app/src/lib/api/contracts.js           # Contract generator API client
app/src/hooks/useContractGenerator.js  # Custom hook for contract operations
```

### Business Logic (Four-Layer Architecture)

```
app/src/logic/calculators/contracts/
├── calculatePaymentTotals.ts          # CC auth calculations
├── calculatePayoutSchedule.ts         # Host payout calculations
├── calculateTenancyDates.ts           # Tenancy date calculations
└── calculateProratedAmount.ts

app/src/logic/rules/contracts/
├── isValidCurrency.ts                 # Currency validation
├── isValidDateFormat.ts               # Date format validation
├── hasRequiredFields.ts               # Required field checks
└── canGenerateDocument.ts

app/src/logic/processors/contracts/
├── formatCurrencyForTemplate.ts       # Currency template formatting
├── formatDatesForTemplate.ts          # Date template formatting
├── processHouseRules.ts               # House rules to list
└── processImagesForTemplate.ts        # Image processing

app/src/logic/workflows/contracts/
├── generateContractWorkflow.ts        # Main generation orchestration
└── uploadToDriveWorkflow.ts           # Drive upload orchestration
```

---

## Edge Function API Contract

### Request Format

```typescript
POST /contract-generator/v1/
{
  "action": "generate_credit_card_auth",
  "payload": {
    // Document-specific fields
    "agreementNumber": "string",
    "hostName": "string",
    "guestName": "string",
    "fourWeekRent": "string",
    // ... other fields
  }
}
```

### Response Format

```typescript
// Success
{
  "success": true,
  "data": {
    "filename": "recurring_credit_card_auth-123.docx",
    "downloadUrl": "https://...",     // Supabase Storage URL
    "driveUrl": "https://drive.google.com/...",  // Google Drive URL
    "driveFileId": "abc123"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid currency format",
    "details": { ... }
  }
}
```

---

## Implementation Phases

### Phase 1: Infrastructure Setup (2 days)

**Tasks:**
1. Create Supabase Storage bucket `contract-templates`
2. Upload DOCX templates from source
3. Set up RLS policies for templates (public read)
4. Create Google Drive service account credentials
5. Store credentials in Supabase Edge Function secrets

**Deliverables:**
- Templates in Supabase Storage
- RLS policies configured
- Google Drive credentials ready

---

### Phase 2: Core Utilities (2 days)

**Tasks:**
1. Implement `lib/docx.ts` - docx-templates wrapper
2. Implement `lib/storage.ts` - Template loader from Supabase
3. Implement `lib/currency.ts` - Currency formatting
4. Implement `lib/dates.ts` - Date formatting
5. Implement `lib/validation.ts` - Zod schemas

**Deliverables:**
- All utility modules in `supabase/functions/contract-generator/lib/`

---

### Phase 3: Document Handlers (3 days)

**Tasks:**
1. Implement `actions/generateCreditCardAuth.ts`
2. Implement `actions/generateCreditCardAuthNonProrated.ts`
3. Implement `actions/generateHostPayout.ts`
4. Implement `actions/generatePeriodicTenancy.ts`
5. Implement `actions/generateSupplemental.ts`

**Deliverables:**
- All 5 document generation actions

---

### Phase 4: Edge Function Router (2 days)

**Tasks:**
1. Implement main router in `index.ts`
2. Implement `actions/listTemplates.ts`
3. Implement `actions/getTemplateSchema.ts`
4. Add CORS headers
5. Add authentication check

**Deliverables:**
- Complete Edge Function

---

### Phase 5: Frontend Implementation (5 days)

**Tasks:**
1. Create API client (`app/src/lib/api/contracts.js`)
2. Create `useContractGenerator` hook
3. Create `ContractForm` component
4. Create `ContractDownload` component
5. Create `CreditCardAuthPage`
6. Create `HostPayoutPage`
7. Create `PeriodicTenancyPage`
8. Create `SupplementalPage`
9. Add routes to `routes.config.js`

**Deliverables:**
- All React components and pages

---

### Phase 6: Business Logic (2 days)

**Tasks:**
1. Implement calculator functions
2. Implement rule functions
3. Implement processor functions
4. Implement workflow functions
5. Update page hooks to use business logic

**Deliverables:**
- Complete four-layer business logic

---

### Phase 7: Testing & Integration (2 days)

**Tasks:**
1. Unit tests for calculators
2. Unit tests for processors
3. Integration tests for Edge Function
4. E2E tests for document generation
5. Performance testing (<5s target)

**Deliverables:**
- Test suite
- Performance benchmarks

---

## Data Flow Diagram

```
┌─────────────┐
│ User Form   │
│ (React)     │
└──────┬──────┘
       │ POST /contract-generator/v1/
       │ { action, payload }
       ▼
┌─────────────────────────┐
│ Edge Function Router    │
│ (index.ts)              │
└──────┬──────────────────┘
       │ action switch
       ▼
┌─────────────────────────┐
│ Document Handler        │
│ (actions/*.ts)          │
└──────┬──────────────────┘
       │
       ├──────────────────┐
       │                  ▼
       │          ┌──────────────┐
       │          │ Load Template│
       │          │ (Supabase)   │
       │          └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐   ┌─────────────┐
│ Validate     │   │ docx-       │
│ Input        │   │ templates   │
└──────┬───────┘   └──────┬──────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌─────────────┐
│ Calculate    │   │ Render DOCX │
│ Values       │   │ (template)  │
└──────┬───────┘   └──────┬──────┘
       │                  │
       └────────┬─────────┘
                ▼
       ┌────────────────┐
       │ Upload to Drive│
       │ (Google API)   │
       └───────┬────────┘
               │
               ▼
       ┌────────────────┐
       │ Return Result  │
       │ (download URL, │
       │  Drive URL)    │
       └────────────────┘
```

---

## Technical Specifications

### Currency Calculations (Credit Card Auth)

```typescript
// From Python source
const fourWeekRent = roundDown(convertCurrencyToFloat(data.fourWeekRent));
const maintenanceFee = roundDown(convertCurrencyToFloat(data.maintenanceFee));
const damageDeposit = roundDown(convertCurrencyToFloat(data.damageDeposit));
const splitleaseCredit = roundDown(convertCurrencyToFloat(data.splitleaseCredit));
const lastPaymentRent = roundDown(convertCurrencyToFloat(data.lastPaymentRent));

const totalFirstPayment = roundDown(fourWeekRent + maintenanceFee + damageDeposit);
const totalSecondPayment = roundDown(fourWeekRent + maintenanceFee);
const totalLastPayment = roundDown(lastPaymentRent + maintenanceFee - splitleaseCredit);
```

### Date Formatting

```typescript
// Supports two input formats
function parseDate(dateStr: string): Date | null {
  const formats = ['MM/dd/yy', 'yyyy-MM-dd'];
  for (const fmt of formats) {
    // Try parsing
  }
  return null;
}

// Output: "January 28, 2026"
function formatDateForTemplate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

### Template Variables Mapping

| Source Field | Template Variable | Notes |
|--------------|-------------------|-------|
| Agreement Number | agreement_number | Snake case |
| Host Name | host_name | Snake case |
| Four Week Rent | fourweekrent | Snake case |
| Listing Description | ListingDescription | Title case |
| Total First Payment | totalfirstpayment | Snake case |

---

## Google Drive Integration

### OAuth2 Flow (Service Account)

```typescript
// lib/googleDrive.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS')!),
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

const drive = google.drive({ version: 'v3', auth });

async function uploadDocx(file: Uint8Array, filename: string) {
  const result = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')!]
    },
    media: {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: file
    },
    fields: 'id,webViewLink'
  });
  return result.data;
}
```

---

## Error Handling Strategy

**No Fallback Principle**: Errors surface immediately without fallback logic

```typescript
// Validation errors
if (!isValidCurrency(value)) {
  throw new ValidationError(`Invalid currency: ${value}`);
}

// Template loading errors
const template = await loadTemplate(name);
if (!template) {
  throw new TemplateLoadError(`Template not found: ${name}`);
}

// DOCX generation errors
try {
  const doc = await createDocx(template, data);
} catch (error) {
  throw new DocumentGenerationError(`Failed to render: ${error.message}`);
}

// Google Drive errors
if (!driveResult.success) {
  throw new DriveUploadError(driveResult.error);
}
```

---

## Security Considerations

1. **Input Validation**: All inputs validated via Zod schemas
2. **Rate Limiting**: Implement per-user rate limiting
3. **Authentication**: Required for all actions except `list_templates`
4. **Template Security**: RLS policies on Supabase Storage
5. **Credential Security**: Google Drive credentials in Edge Function secrets
6. **Output Sanitization**: All template values sanitized

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Document Generation | <3s | Template render + calculations |
| Google Drive Upload | <2s | Average upload time |
| Total Response Time | <5s | End-to-end generation |
| Template Load | <500ms | From Supabase Storage |

---

## Testing Strategy

### Unit Tests
- Calculator functions (all calculations)
- Processor functions (formatting)
- Validation schemas (Zod)

### Integration Tests
- Edge Function actions
- Template loading from Supabase
- Google Drive upload

### E2E Tests
- Complete document generation flow
- Error scenarios
- Concurrent requests

---

## Rollout Plan

1. **Phase 1**: Deploy Edge Function (no UI access)
2. **Phase 2**: Internal testing via API client
3. **Phase 3**: Deploy UI pages (internal only)
4. **Phase 4**: Beta release to select users
5. **Phase 5**: Full release

---

## Migration Checklist

### Infrastructure
- [ ] Create Supabase Storage bucket
- [ ] Upload DOCX templates
- [ ] Configure RLS policies
- [ ] Set up Google Drive service account
- [ ] Store credentials in secrets

### Backend
- [ ] Create Edge Function structure
- [ ] Implement all utility modules
- [ ] Implement all document handlers
- [ ] Implement main router
- [ ] Add CORS configuration
- [ ] Add authentication

### Frontend
- [ ] Create API client
- [ ] Create custom hook
- [ ] Create shared components
- [ ] Create page components
- [ ] Add to route registry
- [ ] Add navigation links

### Business Logic
- [ ] Implement calculators
- [ ] Implement rules
- [ ] Implement processors
- [ ] Implement workflows

### Testing
- [ ] Unit tests for calculators
- [ ] Unit tests for processors
- [ ] Integration tests for Edge Function
- [ ] E2E tests for pages
- [ ] Performance testing

---

## Post-Migration Considerations

1. **Monitoring**: Track document generation success rates
2. **Analytics**: Track most-used document types
3. **Template Updates**: Process for updating templates
4. **New Document Types**: Extensibility for future documents

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
