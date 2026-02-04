# Document Preview Feasibility Analysis

**Date**: 2026-02-04
**Purpose**: Assess feasibility of embedding document preview for in-page editing
**Status**: Analysis Complete

---

## Executive Summary

The current document generation flow produces **DOCX files** (not PDFs) that are uploaded to Google Drive and/or Supabase Storage. The system uses **docxtemplater** for template rendering, which operates on DOCX/XML format with placeholder substitution.

**Key Finding**: Embedding editable document preview is **technically feasible but architecturally complex**. The most practical approach would be adding an HTML preview step before final DOCX generation, rather than trying to edit the DOCX directly in-browser.

---

## 1. Edge Function Analysis: `lease-documents`

### Location
`supabase/functions/lease-documents/`

### What It Returns

The edge function returns **JSON** with document metadata, not the document binary itself:

```typescript
// Response format from DocumentResult type (lib/types.ts)
interface DocumentResult {
  success: boolean;
  filename?: string;           // e.g., "periodic_tenancy_agreement-AGR-12345.docx"
  driveUrl?: string;           // Google Drive web view link
  drive_url?: string;          // Python compatibility alias
  web_view_link?: string;      // Python compatibility alias
  fileId?: string;             // Supabase Storage path
  file_id?: string;            // Python compatibility alias
  error?: string;
  returned_error?: 'yes' | 'no';
}
```

### Document Generation Service/Library

Uses **docxtemplater** (npm package) with supporting libraries:
- `docxtemplater@3.47.4` - Core DOCX template engine
- `pizzip@3.1.7` - ZIP manipulation (DOCX files are ZIP archives)
- `docxtemplater-image-module-free@1.1.1` - Image embedding in templates

### Template Rendering Flow (`lib/templateRenderer.ts`)

```
DOCX Template (Supabase Storage)
        ↓
   Download via Supabase Storage API
        ↓
   Load into PizZip (parse DOCX ZIP structure)
        ↓
   Process images (fetch URLs, convert to base64)
        ↓
   Docxtemplater renders {{placeholders}}
        ↓
   Generate new DOCX binary (Uint8Array)
        ↓
   Upload to Google Drive + Supabase Storage
        ↓
   Return URLs to client
```

### Output Formats Supported

**Current**: DOCX only (`.docx`)

**No intermediate HTML** - The system goes directly from DOCX template to rendered DOCX. There is no HTML representation at any point.

### Template Storage Location

Templates are stored in Supabase Storage bucket `document-templates`:
- `host_payout/hostpayoutscheduleform.docx`
- `supplemental/supplementalagreement.docx`
- `periodic_tenancy/periodictenancyagreement.docx`
- `credit_card_auth/recurringcreditcardauthorizationprorated.docx`
- `credit_card_auth/recurringcreditcardauthorization.docx`

---

## 2. ManageLeasesPaymentRecordsPage Analysis

### Location
`app/src/islands/pages/ManageLeasesPaymentRecordsPage/`

### "Generate Documents" Button Implementation

```jsx
// DocumentsSection.jsx (lines 149-172)
<button
  type="button"
  className="mlpr-btn mlpr-btn-primary"
  onClick={onGenerateAllDocs}
  disabled={isGeneratingDocs}
>
  {isGeneratingDocs ? (
    <>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Generating...
    </>
  ) : (
    <>
      <FileUp size={16} />
      Generate Documents
    </>
  )}
</button>
```

### What Happens When Documents Are Generated

1. **User clicks "Generate Documents"** button
2. **`handleGenerateAllDocs`** in `useManageLeasesPageLogic.js` is called
3. **Builds payload** from selected lease data (lines 521-657):
   - Extracts guest/host names, emails, phones
   - Formats dates (MM/DD/YY format)
   - Calculates rental amounts, weeks, payment schedules
   - Fetches listing photos from `listing_photo` table or `Features - Photos` column
4. **Calls Edge Function**:
   ```javascript
   await fetch(`${SUPABASE_URL}/functions/v1/lease-documents`, {
     method: 'POST',
     headers: { ... },
     body: JSON.stringify({
       action: 'generate_all',
       payload
     })
   });
   ```
5. **Handles response** - shows success/partial success/failure toast
6. **Refreshes lease details** to get updated document URLs

### Where Generated Documents Go

Documents are uploaded to **two locations** (fail-safe pattern):
1. **Google Drive** - Primary storage, shared folder
2. **Supabase Storage** - Backup/fallback storage

The UI shows links to view documents via `driveUrl` or `web_view_link`.

---

## 3. Document Generation Flow (Complete)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMPLETE DOCUMENT GENERATION FLOW                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND (ManageLeasesPaymentRecordsPage)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. User clicks "Generate Documents"                                  │   │
│  │ 2. useManageLeasesPageLogic builds payload from lease data           │   │
│  │    - Fetches listing photos from Supabase                            │   │
│  │    - Formats dates, calculates amounts                               │   │
│  │ 3. POST to /functions/v1/lease-documents                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓                                             │
│  EDGE FUNCTION (lease-documents)                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. Validate payload (validateGenerateAllPayload)                     │   │
│  │ 5. For each document type:                                           │   │
│  │    a. Download DOCX template from Supabase Storage                   │   │
│  │    b. Fetch images from URLs, convert to base64                      │   │
│  │    c. Render template with docxtemplater                             │   │
│  │    d. Upload DOCX to Google Drive + Supabase Storage                 │   │
│  │    e. Notify Slack                                                   │   │
│  │ 6. Return JSON with document URLs                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               ↓                                             │
│  STORAGE                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7. Documents stored in:                                              │   │
│  │    - Google Drive (primary): driveUrl / web_view_link                │   │
│  │    - Supabase Storage (backup): fileId / file_id                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Calls Involved

| Step | Endpoint/Service | Purpose |
|------|------------------|---------|
| 1 | Supabase (direct) | Fetch listing photos |
| 2 | `/functions/v1/lease-documents` | Document generation |
| 3 | Supabase Storage (internal) | Download DOCX templates |
| 4 | External URLs (internal) | Fetch images for embedding |
| 5 | Google Drive API (internal) | Upload rendered DOCX |
| 6 | Supabase Storage (internal) | Upload backup DOCX |
| 7 | Slack Webhook (internal) | Success/error notification |

### Data Sent to Edge Function

Full payload structure for `generate_all` action:

```javascript
{
  hostPayout: {
    'Agreement Number': string,
    'Host Name': string,
    'Host Email': string,
    'Host Phone': string,
    'Address': string,
    'Payout Number': string,
    'Maintenance Fee': string,
    'Date1'-'Date13': string,  // Optional payment dates
    'Rent1'-'Rent13': string,  // Optional rent amounts
    'Total1'-'Total13': string // Optional totals
  },
  supplemental: {
    'Agreement Number': string,
    'Check in Date': string,
    'Check Out Date': string,
    'Number of weeks': string,
    'Guests Allowed': string,
    'Host Name': string,
    'Listing Title': string,
    'Listing Description': string,
    'Location': string,
    'Type of Space': string,
    'Space Details': string,
    'Supplemental Number': string,
    'image1': string,  // URL
    'image2': string,
    'image3': string
  },
  periodicTenancy: {
    'Agreement Number': string,
    'Check in Date': string,
    'Check Out Date': string,
    'Check In Day': string,
    'Check Out Day': string,
    'Number of weeks': string,
    'Guests Allowed': string,
    'Host name': string,
    'Guest name': string,
    'Supplemental Number': string,
    'Authorization Card Number': string,
    'Host Payout Schedule Number': string,
    'Extra Requests on Cancellation Policy': string,
    'Damage Deposit': string,
    'Listing Title': string,
    'Listing Description': string,
    'Location': string,
    'Type of Space': string,
    'Space Details': string,
    'House Rules': string[],
    'image1': string,
    'image2': string,
    'image3': string
  },
  creditCardAuth: {
    'Agreement Number': string,
    'Host Name': string,
    'Guest Name': string,
    'Four Week Rent': string,
    'Maintenance Fee': string,
    'Damage Deposit': string,
    'Splitlease Credit': string,
    'Last Payment Rent': string,
    'Weeks Number': string,
    'Listing Description': string,
    'Penultimate Week Number': string,
    'Number of Payments': string,
    'Last Payment Weeks': string,
    'Is Prorated': boolean
  }
}
```

---

## 4. Complexity Assessment for Embedding Preview

### Question 1: Can the document be rendered as HTML before PDF conversion?

**Current State**: No. The system generates DOCX files, not PDFs. There is no HTML intermediate format.

**Options for HTML Preview**:

| Option | Description | Complexity | Pros | Cons |
|--------|-------------|------------|------|------|
| **A. Create HTML templates alongside DOCX** | Maintain parallel HTML templates that mirror DOCX structure | Medium | Can show accurate preview before generation | Requires maintaining 2 template formats; may drift |
| **B. Use mammoth.js to convert DOCX to HTML** | Convert rendered DOCX to HTML for preview | Medium-High | Uses final DOCX; single source of truth | Conversion may lose formatting; requires download first |
| **C. Use docx-preview library** | Render DOCX in browser without conversion | Medium | Maintains DOCX fidelity | Read-only; not editable |
| **D. Preview payload data only** | Show editable form with the data that will be injected | Low | Simple; editable | Not a true document preview |

### Question 2: Would we need a PDF viewer library?

**Not directly** - documents are DOCX, not PDF. However, Google Drive automatically provides PDF preview for DOCX files.

If we wanted in-browser preview without leaving the page:
- **For DOCX**: Use `docx-preview` (npm package) or embed Google Docs viewer iframe
- **For PDF**: Would need `pdf.js` or `react-pdf` (not currently in codebase)

### Question 3: Is there a WYSIWYG editing opportunity?

**Pre-generation editing**: Yes, very feasible
- Edit the payload data before sending to edge function
- All editable fields are already in the payload structure
- Could show a form-based editor with live preview

**Post-generation editing**: More complex
- Would require re-generating the document
- Or: Use Google Docs API to open for editing (documents already in Drive)

**True WYSIWYG editing of DOCX in browser**: Possible but heavyweight
- Would require libraries like:
  - `docx` (npm) - programmatic DOCX editing
  - OnlyOffice Document Editor (self-hosted, complex)
  - Google Docs embedded editor (requires workspace integration)

### Question 4: What are the architectural implications?

#### Minimal Change (Recommended First Step)

Add a **"Preview Data"** step before generation:
1. User clicks "Preview Documents"
2. System shows editable form with all document fields
3. User can modify values
4. User clicks "Generate Documents" with modified data

**Files affected**:
- `DocumentsSection.jsx` - Add preview mode UI
- `useManageLeasesPageLogic.js` - Add preview state and handlers

**Effort**: ~4-8 hours

#### Medium Change (HTML Preview)

Add HTML template rendering alongside DOCX:
1. Create HTML versions of each template
2. Render HTML preview in modal/panel
3. Allow editing form fields
4. Generate DOCX with confirmed values

**Files affected**:
- New: `supabase/functions/lease-documents/lib/htmlTemplates.ts`
- New: `app/src/islands/shared/DocumentPreview/` component
- `DocumentsSection.jsx` - Add preview modal
- `useManageLeasesPageLogic.js` - Add preview handlers
- Edge function - Add `preview_html` action

**Effort**: ~16-24 hours

#### Major Change (WYSIWYG DOCX Editing)

Full in-browser document editing:
1. Integrate OnlyOffice or similar WYSIWYG editor
2. Load DOCX into editor
3. User edits visually
4. Save back to storage

**Files affected**: Significant - new infrastructure required
- New npm dependencies (~500KB+ bundle size impact)
- Server component for editor backend
- New storage/versioning logic

**Effort**: ~40-80+ hours

---

## 5. Existing Patterns in Codebase

### Document Handling Patterns Found

| Pattern | Location | Description |
|---------|----------|-------------|
| PDF/Image Upload | `AITools/PdfDocUploader.jsx` | Drag-drop upload, file validation, sends to edge function for AI extraction |
| Document Links | `DocumentsSection.jsx` | External link opens in new tab via Google Drive |
| No PDF viewer | - | No `pdf.js` or `react-pdf` in codebase |
| No DOCX preview | - | No `docx-preview` or similar |

### Relevant Existing Infrastructure

1. **Modal system** - For preview overlay
2. **Toast notifications** - For save/error feedback
3. **Form components** - For editing fields
4. **Supabase Storage** - For template/document storage
5. **Edge Function pattern** - For server-side processing

---

## 6. Recommendations

### Phase 1: Quick Win (Recommended Starting Point)

**Add "Edit Before Generate" functionality**

1. Add state for `previewMode` and `editablePayload`
2. When user clicks "Generate", show modal with editable form
3. Form displays all document fields grouped by document type
4. User can edit values before confirming generation
5. "Confirm & Generate" sends modified payload to edge function

**Benefits**:
- No new dependencies
- Uses existing form patterns
- Immediate value for data correction
- Low risk

### Phase 2: HTML Preview (If Phase 1 succeeds)

**Add read-only HTML preview**

1. Create simplified HTML templates on backend
2. Add `preview` action to edge function that returns HTML
3. Render HTML in preview modal alongside edit form
4. User sees formatted preview while editing

### Phase 3: WYSIWYG (Only if strong business need)

**Only pursue if**:
- Users frequently need complex formatting changes
- Google Docs editing workflow is insufficient
- Budget allows for significant development effort

---

## 7. Key Files Referenced

### Edge Function Files
- `supabase/functions/lease-documents/index.ts` - Entry point, action routing
- `supabase/functions/lease-documents/lib/templateRenderer.ts` - DOCX rendering with docxtemplater
- `supabase/functions/lease-documents/lib/types.ts` - TypeScript interfaces
- `supabase/functions/lease-documents/lib/googleDrive.ts` - Google Drive upload
- `supabase/functions/lease-documents/handlers/generateAll.ts` - Orchestrates all 4 documents
- `supabase/functions/lease-documents/handlers/generatePeriodicTenancy.ts` - Example handler

### Frontend Files
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/DocumentsSection/DocumentsSection.jsx` - UI component
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js` - Business logic

### Supporting Files
- `supabase/functions/lease/lib/documentPayloadBuilder.ts` - Alternative payload builder (for internal use)
- `app/src/islands/shared/AITools/PdfDocUploader.jsx` - Reference for document upload patterns

---

## Appendix: Template Variables by Document Type

### Host Payout Schedule
- `agreement_number`, `host_name`, `host_email`, `host_phone`, `address`, `payout_number`
- Payment rows: `date1-13`, `rent1-13`, `total1-13`, `maintenance_fee1-13`

### Supplemental Agreement
- `agreement_number`, `start_date`, `end_date`, `weeks_number`, `guests_allowed`
- `host_name`, `listing_title`, `listing_description`, `location`, `type_of_space`
- `spacedetails`, `supplement_number`, `image1`, `image2`, `image3`

### Periodic Tenancy Agreement
- All supplemental fields plus:
- `guest_name`, `check_in`, `check_out`, `week_duration`
- `supplemental_number`, `credit_card_form_number`, `payout_number`
- `cancellation_policy_rest`, `damage_deposit`, `House_rules_items`

### Credit Card Authorization
- `agreement_number`, `host_name`, `guest_name`, `maintenancefee`
- `weeks_number`, `ListingDescription`, `fourweekrent`, `damagedeposit`
- `totalfirstpayment`, `penultimateweeknumber`, `totalsecondpayment`
- `slcredit`, `lastpaymenttotal`, `numberofpayments`, `lastpaymentweeks`, `lastpaymentrent`

---

**Analysis Complete**
