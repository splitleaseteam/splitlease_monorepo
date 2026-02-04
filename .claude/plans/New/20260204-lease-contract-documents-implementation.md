# Lease Contract Documents Implementation Plan

**Created**: 2026-02-04
**Status**: Ready for Review
**Scope**: Comprehensive implementation of lease contract documents feature in `_manage-leases-payment-records` page

---

## Executive Summary

This plan outlines the complete implementation of the lease contract documents feature, integrating the documented API specifications from `documentation/api/lease-documents/` into the existing `ManageLeasesPaymentRecordsPage`. The implementation covers document generation, viewing, status management, and signing workflows.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Feature Requirements](#2-feature-requirements)
3. [Architecture Design](#3-architecture-design)
4. [Implementation Tasks](#4-implementation-tasks)
5. [Component Specifications](#5-component-specifications)
6. [Logic Layer Specifications](#6-logic-layer-specifications)
7. [Edge Function Enhancements](#7-edge-function-enhancements)
8. [Database Considerations](#8-database-considerations)
9. [File Manifest](#9-file-manifest)
10. [Testing Strategy](#10-testing-strategy)
11. [Risk Assessment](#11-risk-assessment)

---

## 1. Current State Analysis

### Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Document Generation | ✅ Implemented | `lease-documents` edge function |
| DocumentsSection UI | ✅ Basic | `ManageLeasesPaymentRecordsPage/components/DocumentsSection.jsx` |
| Document Upload | ✅ Working | File input with base64 conversion |
| 4 Document Cards | ✅ Displaying | Shows upload state and view links |
| Generate Button | ✅ Functional | Calls `lease-documents` edge function |
| Document Preview | ❌ Missing | No in-app document viewer |
| Document Status Tracking | ❌ Missing | No state machine for document lifecycle |
| HelloSign Integration | ⚠️ Placeholder | Button exists, no implementation |

### Documented API Specifications

**Source**: `documentation/api/lease-documents/`

| Document | API Action | Template Variants |
|----------|------------|-------------------|
| Host Payout Schedule | `generate_host_payout` | Single template |
| Supplemental Agreement | `generateSupplemental` | Single template with 3 images |
| Periodic Tenancy Agreement | `generate_periodic_tenancy` | Single template |
| Credit Card Authorization | `generateCreditCardAuth` | 2 variants (prorated/non-prorated) |

### Gap Analysis

| Feature | Documentation | Implementation | Gap |
|---------|--------------|----------------|-----|
| Document Generation | Complete | Partial | Field mapping refinement needed |
| Payment Record Population | Complete | Working | Integration with doc gen needed |
| Proration Logic | Complete | Missing | Template selection logic needed |
| Document Viewer | Not specified | Missing | Full implementation needed |
| Status Management | Implied | Missing | Full implementation needed |
| Signing Workflow | Implied | Missing | HelloSign integration needed |

---

## 2. Feature Requirements

### Core Requirements

1. **Document Generation** (Enhancement)
   - Generate all 4 documents with correct field mappings
   - Handle proration logic for Credit Card Authorization
   - Populate payment records (13 guest + 13 host payments)
   - Embed listing images in Supplemental and Periodic agreements

2. **Document Viewing** (New)
   - In-app document preview modal
   - Support for Google Drive links
   - Support for Supabase Storage URLs
   - Download functionality

3. **Document Status Management** (New)
   - Track document lifecycle states
   - Visual indicators per document
   - Audit trail for status changes

4. **Document Signing** (New)
   - HelloSign integration for e-signatures
   - Signature status tracking
   - Signed document storage

### Document Lifecycle States

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  NOT_GENERATED │────▶│  GENERATED  │────▶│   SENT      │────▶│   SIGNED    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐      ┌─────────────┐
                    │  REGENERATED │      │   DECLINED  │
                    └─────────────┘      └─────────────┘
```

---

## 3. Architecture Design

### Component Architecture

```
ManageLeasesPaymentRecordsPage/
├── components/
│   ├── DocumentsSection/
│   │   ├── DocumentsSection.jsx          # Main container (ENHANCE)
│   │   ├── DocumentCard.jsx              # Individual document card (NEW)
│   │   ├── DocumentStatusBadge.jsx       # Status indicator (NEW)
│   │   ├── DocumentGenerationPanel.jsx   # Generation controls (ENHANCE)
│   │   ├── DocumentActionsMenu.jsx       # Action dropdown (NEW)
│   │   └── SignedDocumentsDisplay.jsx    # Signed docs list (ENHANCE)
│   └── ...
├── modals/
│   ├── DocumentPreviewModal.jsx          # Document viewer (NEW)
│   ├── DocumentSigningModal.jsx          # Signing flow (NEW)
│   └── DocumentStatusHistoryModal.jsx    # Audit log (NEW)
└── useManageLeasesPageLogic.js           # Hook (ENHANCE)
```

### Logic Layer Architecture (Four-Layer)

```
app/src/logic/
├── calculators/
│   └── documents/
│       ├── calculateProration.js         # Proration math (NEW)
│       └── calculatePaymentSchedule.js   # Payment calculations (NEW)
├── rules/
│   └── documents/
│       ├── canGenerateDocuments.js       # Permission rules (NEW)
│       ├── shouldUseProrated.js          # Template selection (NEW)
│       └── validateDocumentPayload.js    # Payload validation (NEW)
├── processors/
│   └── documents/
│       ├── buildDocumentPayload.js       # Payload construction (NEW)
│       ├── transformPaymentRecords.js    # Payment formatting (NEW)
│       └── adaptDocumentStatus.js        # Status normalization (NEW)
└── workflows/
    └── documents/
        ├── generateAllDocuments.js       # Orchestration (NEW)
        └── submitForSigning.js           # Signing workflow (NEW)
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT GENERATION FLOW                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User clicks "Generate Documents"                                        │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │ canGenerateDocuments() │ ◄── Rules layer validates                    │
│  └─────────────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │ buildDocumentPayload() │ ◄── Processors layer builds payload          │
│  └─────────────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │ transformPaymentRecords() │ ◄── Format 13 guest + 13 host payments    │
│  └─────────────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │ shouldUseProrated() │ ◄── Rules layer selects CC Auth template        │
│  └─────────────────┘                                                     │
│           │                                                              │
│           ▼                                                              │
│  ┌─────────────────┐                                                     │
│  │ generateAllDocuments() │ ◄── Workflows layer orchestrates             │
│  └─────────────────┘                                                     │
│           │                                                              │
│           ├────────┬────────┬────────┐                                   │
│           ▼        ▼        ▼        ▼                                   │
│       HostPayout  Suppl   Periodic  CCAuth                               │
│       (parallel API calls)                                               │
│           │        │        │        │                                   │
│           └────────┴────────┴────────┘                                   │
│                    │                                                     │
│                    ▼                                                     │
│           Update lease.documents field                                   │
│           Update document status to GENERATED                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Tasks

### Phase 1: Logic Layer Foundation (Priority: HIGH)

| Task | File | Description |
|------|------|-------------|
| 1.1 | `logic/calculators/documents/calculateProration.js` | Implement proration calculation based on week patterns |
| 1.2 | `logic/calculators/documents/calculatePaymentSchedule.js` | Calculate 13 payment cycles with dates and amounts |
| 1.3 | `logic/rules/documents/canGenerateDocuments.js` | Validate lease has required data for generation |
| 1.4 | `logic/rules/documents/shouldUseProrated.js` | Determine CC Auth template variant |
| 1.5 | `logic/rules/documents/validateDocumentPayload.js` | Validate payload completeness |
| 1.6 | `logic/processors/documents/buildDocumentPayload.js` | Construct API payload from lease data |
| 1.7 | `logic/processors/documents/transformPaymentRecords.js` | Format payment records for API |
| 1.8 | `logic/processors/documents/adaptDocumentStatus.js` | Normalize document status from API |
| 1.9 | `logic/workflows/documents/generateAllDocuments.js` | Orchestrate parallel document generation |

### Phase 2: Component Enhancements (Priority: HIGH)

| Task | File | Description |
|------|------|-------------|
| 2.1 | `components/DocumentsSection/DocumentCard.jsx` | Refactor document card with status badge |
| 2.2 | `components/DocumentsSection/DocumentStatusBadge.jsx` | Status indicator component |
| 2.3 | `components/DocumentsSection/DocumentActionsMenu.jsx` | Dropdown menu for document actions |
| 2.4 | `components/DocumentsSection/DocumentGenerationPanel.jsx` | Enhanced generation controls |
| 2.5 | `components/DocumentsSection/DocumentsSection.jsx` | Integrate new components |

### Phase 3: Document Viewer (Priority: MEDIUM)

| Task | File | Description |
|------|------|-------------|
| 3.1 | `modals/DocumentPreviewModal.jsx` | Document preview modal with iframe/viewer |
| 3.2 | `modals/DocumentStatusHistoryModal.jsx` | Status audit log modal |
| 3.3 | Update `useManageLeasesPageLogic.js` | Add modal state management |

### Phase 4: Signing Integration (Priority: LOW)

| Task | File | Description |
|------|------|-------------|
| 4.1 | `modals/DocumentSigningModal.jsx` | HelloSign signing flow modal |
| 4.2 | `logic/workflows/documents/submitForSigning.js` | Signing workflow orchestration |
| 4.3 | Edge function enhancement | HelloSign webhook handler |

---

## 5. Component Specifications

### 5.1 DocumentCard.jsx (NEW)

```jsx
/**
 * Individual document card displaying status, actions, and view link
 *
 * @prop {string} documentType - 'hostPayoutSchedule' | 'supplementalAgreement' | 'periodicTenancyAgreement' | 'creditCardAuthorizationForm'
 * @prop {string} title - Display title
 * @prop {object} documentData - Document metadata (url, driveUrl, status, generatedAt)
 * @prop {function} onView - View document callback
 * @prop {function} onUpload - Upload file callback
 * @prop {function} onRegenerate - Regenerate document callback
 * @prop {function} onDownload - Download document callback
 * @prop {boolean} isLoading - Loading state
 */
```

**States**:
- `NOT_GENERATED`: Shows upload button, disabled view
- `GENERATED`: Shows view/download/regenerate actions
- `SENT`: Shows signing status, disabled regenerate
- `SIGNED`: Shows "Signed" badge, view only

### 5.2 DocumentStatusBadge.jsx (NEW)

```jsx
/**
 * Visual status indicator badge
 *
 * @prop {string} status - 'NOT_GENERATED' | 'GENERATED' | 'SENT' | 'SIGNED' | 'DECLINED'
 * @prop {boolean} compact - Compact mode for inline display
 */
```

**Visual Design**:
| Status | Color | Icon |
|--------|-------|------|
| NOT_GENERATED | Gray | ○ (empty circle) |
| GENERATED | Blue | ✓ (checkmark) |
| SENT | Yellow | ↗ (arrow) |
| SIGNED | Green | ✓✓ (double check) |
| DECLINED | Red | ✗ (cross) |

### 5.3 DocumentPreviewModal.jsx (NEW)

```jsx
/**
 * Modal for viewing document content
 *
 * @prop {boolean} isOpen - Modal visibility
 * @prop {function} onClose - Close callback
 * @prop {object} document - Document data with URLs
 * @prop {string} document.title - Document title
 * @prop {string} document.url - Supabase Storage URL
 * @prop {string} document.driveUrl - Google Drive URL (optional)
 */
```

**Features**:
- Iframe-based viewing for Google Drive URLs (native preview)
- Download fallback for Supabase Storage URLs
- "Open in new tab" button for full-screen viewing
- Print button (triggers browser print dialog)

### 5.4 DocumentGenerationPanel.jsx (ENHANCED)

```jsx
/**
 * Panel containing document generation controls
 *
 * @prop {object} lease - Current lease data
 * @prop {object} guestPayments - Guest payment records array
 * @prop {object} hostPayments - Host payment records array
 * @prop {function} onGenerate - Generate all documents callback
 * @prop {function} onGenerateSingle - Generate single document callback
 * @prop {boolean} isGenerating - Loading state
 * @prop {array} errors - Generation error messages
 */
```

**New Features**:
- Progress indicator during generation (4 steps)
- Individual document generation buttons
- Error display per document
- "Regenerate All" with confirmation

---

## 6. Logic Layer Specifications

### 6.1 calculateProration.js

```javascript
/**
 * Calculates proration amounts based on week pattern
 *
 * @param {number} baseRent - 4-week rent amount
 * @param {string} weekPattern - 'every_week' | 'one_on_one_off' | 'two_on_two_off' | 'one_on_three_off'
 * @param {Date} startDate - Lease start date
 * @param {Date} endDate - Lease end date
 * @returns {object} { isProrated, firstPayment, lastPayment, regularPayment }
 */
export function calculateProration(baseRent, weekPattern, startDate, endDate) {
  // Business rules:
  // 1. Proration applies when last payment period is shorter than first
  // 2. Currency values round DOWN to 2 decimals (not standard rounding)
  // 3. Service fee (10%) applies before proration calculation
}
```

### 6.2 shouldUseProrated.js

```javascript
/**
 * Determines if prorated Credit Card Authorization template should be used
 *
 * @param {object} lease - Lease data
 * @param {array} guestPayments - Guest payment records
 * @returns {boolean} true if prorated template should be used
 */
export function shouldUseProrated(lease, guestPayments) {
  // Business rules:
  // 1. Compare first payment amount to last payment amount
  // 2. If last < first, use prorated template
  // 3. If equal, use standard template
}
```

### 6.3 buildDocumentPayload.js

```javascript
/**
 * Constructs complete API payload for document generation
 *
 * @param {string} documentType - Document type identifier
 * @param {object} lease - Lease record with joins
 * @param {object} proposal - Proposal data
 * @param {object} listing - Listing data with photos
 * @param {object} guest - Guest user data
 * @param {object} host - Host user data
 * @param {array} guestPayments - Formatted guest payment records
 * @param {array} hostPayments - Formatted host payment records
 * @returns {object} API-ready payload
 */
export function buildDocumentPayload(documentType, lease, proposal, listing, guest, host, guestPayments, hostPayments) {
  // Field mappings from documentation:
  // - Agreement Number: lease.agreementNumber
  // - Date: CURRENT_DATE formatted MM/DD/YYYY
  // - Guest Name: `${guest.firstName} ${guest.lastName}`
  // - Host Name: `${host.firstName} ${host.lastName}`
  // - etc. (see FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md)
}
```

### 6.4 transformPaymentRecords.js

```javascript
/**
 * Transforms raw payment records into document-ready format
 *
 * @param {array} paymentRecords - Raw payment records from database
 * @param {string} recordType - 'guest' | 'host'
 * @returns {array} Formatted payment records (13 items with null padding)
 */
export function transformPaymentRecords(paymentRecords, recordType) {
  // Business rules:
  // 1. Always return 13 records (pad with nulls if fewer)
  // 2. Guest records: filter by `Payment from guest? = true`
  // 3. Host records: filter by `Payment to Host? = true`
  // 4. Format dates as MM/DD/YYYY
  // 5. Format currency as $X,XXX.XX
}
```

### 6.5 generateAllDocuments.js (Workflow)

```javascript
/**
 * Orchestrates parallel generation of all 4 lease documents
 *
 * @param {object} params - Generation parameters
 * @param {string} params.leaseId - Lease ID
 * @param {object} params.lease - Full lease data
 * @param {array} params.guestPayments - Guest payment records
 * @param {array} params.hostPayments - Host payment records
 * @param {array} params.listingPhotos - Listing photos for embedding
 * @param {function} params.onProgress - Progress callback (0-4)
 * @returns {Promise<object>} { success, documents, errors }
 */
export async function generateAllDocuments(params) {
  // Workflow steps:
  // 1. Validate inputs with canGenerateDocuments()
  // 2. Build payloads with buildDocumentPayload() for each type
  // 3. Determine CC Auth template with shouldUseProrated()
  // 4. Call lease-documents edge function in parallel for all 4
  // 5. Collect results and errors
  // 6. Return aggregated result
}
```

---

## 7. Edge Function Enhancements

### Current State

The `lease-documents` edge function exists with handlers for:
- `generate_host_payout`
- `generateSupplemental`
- `generate_periodic_tenancy`
- `generateCreditCardAuth`
- `generate_all`

### Required Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Error detail logging | HIGH | Add Slack alerts for generation failures |
| Payload validation | HIGH | Validate all required fields before processing |
| Proration detection | HIGH | Auto-detect and select CC Auth template |
| Document status update | MEDIUM | Update lease record with document URLs |
| HelloSign webhook | LOW | Handle signature completion callbacks |

### New Handler: `update_document_status`

```typescript
/**
 * Updates document status in lease record
 *
 * Request:
 * {
 *   "action": "update_document_status",
 *   "payload": {
 *     "leaseId": "string",
 *     "documentType": "string",
 *     "status": "GENERATED" | "SENT" | "SIGNED" | "DECLINED",
 *     "metadata": { ... }
 *   }
 * }
 */
```

---

## 8. Database Considerations

### Current Schema (bookings_leases table)

```sql
-- Existing document-related columns
periodicTenancyAgreement    TEXT  -- URL to document
supplementalAgreement       TEXT  -- URL to document
hostPayoutSchedule          TEXT  -- URL to document
creditCardAuthorizationForm TEXT  -- URL to document
signedDocuments             JSONB -- Array of signed document URLs
```

### Proposed Schema Enhancement

```sql
-- Add document metadata column (optional, for status tracking)
ALTER TABLE bookings_leases
ADD COLUMN document_metadata JSONB DEFAULT '{}'::jsonb;

-- Structure:
-- {
--   "hostPayoutSchedule": {
--     "status": "GENERATED",
--     "generatedAt": "2026-02-04T12:00:00Z",
--     "driveFileId": "abc123",
--     "driveUrl": "https://drive.google.com/...",
--     "storageUrl": "https://supabase.../..."
--   },
--   ...
-- }
```

**Note**: This schema change is OPTIONAL. The current implementation can work without it by deriving status from URL presence.

---

## 9. File Manifest

### Files to CREATE

```
app/src/logic/
├── calculators/documents/
│   ├── calculateProration.js
│   ├── calculatePaymentSchedule.js
│   └── index.js
├── rules/documents/
│   ├── canGenerateDocuments.js
│   ├── shouldUseProrated.js
│   ├── validateDocumentPayload.js
│   └── index.js
├── processors/documents/
│   ├── buildDocumentPayload.js
│   ├── transformPaymentRecords.js
│   ├── adaptDocumentStatus.js
│   └── index.js
└── workflows/documents/
    ├── generateAllDocuments.js
    ├── submitForSigning.js
    └── index.js

app/src/islands/pages/ManageLeasesPaymentRecordsPage/
├── components/DocumentsSection/
│   ├── DocumentCard.jsx
│   ├── DocumentStatusBadge.jsx
│   ├── DocumentActionsMenu.jsx
│   └── DocumentGenerationPanel.jsx
└── modals/
    ├── DocumentPreviewModal.jsx
    ├── DocumentSigningModal.jsx
    └── DocumentStatusHistoryModal.jsx
```

### Files to MODIFY

```
app/src/islands/pages/ManageLeasesPaymentRecordsPage/
├── components/DocumentsSection/
│   ├── DocumentsSection.jsx           # Integrate new components
│   └── SignedDocumentsDisplay.jsx     # Enhance display
├── useManageLeasesPageLogic.js        # Add document state management
└── manage-leases.css                  # Add new styles

supabase/functions/lease-documents/
├── index.ts                           # Add new handlers
└── lib/
    ├── payloadBuilder.ts              # Enhance payload construction
    └── validators.ts                  # Add payload validation
```

### Files to REFERENCE (Read-Only)

```
documentation/api/lease-documents/
├── FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md
├── PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md
├── guest-payment-records-mapping.md
├── HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md
├── HOST_PAYOUT_SCHEDULE_FORM.md
├── SUPPLEMENTAL_AGREEMENT_GUIDE.md
├── PERIODIC_TENANCY_AGREEMENT.md
├── CREDIT_CARD_AUTHORIZATION.md
└── CREDIT_CARD_AUTH_GUIDE.md
```

---

## 10. Testing Strategy

### Unit Tests

| Layer | Test File | Coverage |
|-------|-----------|----------|
| Calculators | `calculateProration.test.js` | Proration edge cases |
| Calculators | `calculatePaymentSchedule.test.js` | Payment cycle calculations |
| Rules | `shouldUseProrated.test.js` | Template selection logic |
| Rules | `validateDocumentPayload.test.js` | Payload validation |
| Processors | `buildDocumentPayload.test.js` | Payload construction |
| Processors | `transformPaymentRecords.test.js` | Payment record formatting |

### Integration Tests

| Test | Description |
|------|-------------|
| Document Generation Flow | Generate all 4 docs with mock API |
| Status State Machine | Verify status transitions |
| Modal Interactions | Open/close/navigate modals |

### Manual Testing Checklist

- [ ] Generate documents for lease with full payment records
- [ ] Generate documents for lease with partial payment records
- [ ] Verify proration detection selects correct CC Auth template
- [ ] View document in preview modal
- [ ] Download document from preview modal
- [ ] Regenerate single document
- [ ] Regenerate all documents

---

## 11. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Payment record format mismatch | HIGH | MEDIUM | Validate against API spec before submission |
| Proration calculation errors | HIGH | LOW | Comprehensive unit tests with edge cases |
| Google Drive API rate limits | MEDIUM | LOW | Implement retry logic with exponential backoff |
| HelloSign integration complexity | MEDIUM | HIGH | Implement as separate phase, mock initially |
| Image embedding failures | LOW | MEDIUM | Graceful fallback to text-only documents |

---

## Implementation Sequence

```
WEEK 1: Logic Layer Foundation
├── Day 1-2: Calculators (calculateProration, calculatePaymentSchedule)
├── Day 3: Rules (canGenerateDocuments, shouldUseProrated, validateDocumentPayload)
├── Day 4-5: Processors (buildDocumentPayload, transformPaymentRecords)

WEEK 2: Component Development
├── Day 1-2: DocumentCard, DocumentStatusBadge
├── Day 3: DocumentActionsMenu, DocumentGenerationPanel
├── Day 4-5: DocumentsSection integration, styling

WEEK 3: Modals & Integration
├── Day 1-2: DocumentPreviewModal
├── Day 3: DocumentStatusHistoryModal
├── Day 4-5: Hook enhancements, end-to-end testing

WEEK 4: Polish & Signing (Optional)
├── Day 1-2: DocumentSigningModal skeleton
├── Day 3-4: HelloSign integration research
├── Day 5: Documentation, cleanup
```

---

## Approval Checklist

- [ ] Logic layer architecture approved
- [ ] Component specifications reviewed
- [ ] Database schema change decision made
- [ ] Signing integration scope confirmed
- [ ] Timeline accepted

---

**Next Steps**: Upon approval, begin with Phase 1 (Logic Layer Foundation) starting with `calculateProration.js` and `calculatePaymentSchedule.js`.
