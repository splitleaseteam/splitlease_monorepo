# Implementation Plan: `_manage-leases-and-payment-records` Admin Page

**Version:** 1.0
**Date:** January 27, 2026
**Status:** Ready for Implementation
**Estimated Complexity:** High (Multi-phase implementation)

---

## Executive Summary

This plan details the migration of Bubble's `_manage-leases-and-payment-records` internal page to the Split Lease React/Supabase codebase. The page provides comprehensive admin functionality for managing lease agreements, payment records, stay periods, identity verification, and document management.

### Key Decisions

1. **Leverage Existing Infrastructure**: Extend `leases-admin` Edge Function rather than creating new ones
2. **Reuse Components**: Build on `LeasesOverviewPage` patterns and reuse `PaymentRecordsTable`, `StaysTable` components
3. **Modular Architecture**: Break into focused sub-sections that can be developed incrementally
4. **Admin-Only Access**: Route under `/_` prefix, no public access

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Structure](#2-file-structure)
3. [Phase 1: Route & Scaffold Setup](#3-phase-1-route--scaffold-setup)
4. [Phase 2: Lease Selection & Search](#4-phase-2-lease-selection--search)
5. [Phase 3: Lease Details Section](#5-phase-3-lease-details-section)
6. [Phase 4: Calendar & Date Management](#6-phase-4-calendar--date-management)
7. [Phase 5: Document Management](#7-phase-5-document-management)
8. [Phase 6: Identity Verification](#8-phase-6-identity-verification)
9. [Phase 7: Payment Records Management](#9-phase-7-payment-records-management)
10. [Phase 8: Stays Management](#10-phase-8-stays-management)
11. [Phase 9: Document Change Requests](#11-phase-9-document-change-requests)
12. [Edge Function Extensions](#12-edge-function-extensions)
13. [Database Considerations](#13-database-considerations)
14. [Testing Strategy](#14-testing-strategy)
15. [Migration Notes](#15-migration-notes)

---

## 1. Architecture Overview

### Pattern Alignment

```
┌─────────────────────────────────────────────────────────────────┐
│                    ManageLeasesPage (Hollow)                    │
│                  Pure JSX, no business logic                    │
├─────────────────────────────────────────────────────────────────┤
│               useManageLeasesPageLogic (Hook)                   │
│         All state, effects, handlers, API calls                 │
├─────────────────────────────────────────────────────────────────┤
│                    Component Sections                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ LeaseSearch  │ │ LeaseDetails │ │   Calendar   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Documents   │ │   Identity   │ │   Payments   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │    Stays     │ │ChangeRequest│                              │
│  └──────────────┘ └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  leases-admin Edge Function                     │
│        Extended with new actions for this page                  │
└─────────────────────────────────────────────────────────────────┘
```

### Existing Assets to Leverage

| Asset | Location | Purpose |
|-------|----------|---------|
| `LeasesOverviewPage` | `app/src/islands/pages/LeasesOverviewPage/` | Reference for admin page patterns |
| `AdminThreadsPage` | `app/src/islands/pages/AdminThreadsPage/` | Reference for admin UI patterns |
| `AdminHeader` | `app/src/islands/shared/AdminHeader/` | Shared admin navigation |
| `PaymentRecordsTable` | `app/src/islands/pages/HostLeasesPage/components/` | Reusable payment display |
| `StaysTable` | `app/src/islands/pages/HostLeasesPage/components/` | Reusable stays display |
| `leases-admin` | `supabase/functions/leases-admin/` | Existing Edge Function |
| `guest-payment-records` | `supabase/functions/guest-payment-records/` | Payment generation logic |
| `host-payment-records` | `supabase/functions/host-payment-records/` | Payment generation logic |
| `adaptLeaseFromSupabase` | `app/src/logic/processors/leases/` | Data normalization |

---

## 2. File Structure

```
app/
├── public/
│   └── manage-leases-payment-records.html          # New HTML entry
├── src/
│   ├── manage-leases-payment-records.jsx           # React mount point
│   ├── islands/
│   │   └── pages/
│   │       └── ManageLeasesPaymentRecordsPage/
│   │           ├── ManageLeasesPaymentRecordsPage.jsx
│   │           ├── useManageLeasesPageLogic.js
│   │           ├── manage-leases.css
│   │           ├── constants.js
│   │           ├── adapters/
│   │           │   ├── adaptPaymentRecordForEdit.js
│   │           │   ├── adaptStayForDisplay.js
│   │           │   └── adaptDocumentChangeRequest.js
│   │           ├── components/
│   │           │   ├── LeaseSearchSection/
│   │           │   │   ├── LeaseSearchSection.jsx
│   │           │   │   └── LeaseDropdown.jsx
│   │           │   ├── LeaseDetailsSection/
│   │           │   │   ├── LeaseDetailsSection.jsx
│   │           │   │   ├── ReservationDatesCard.jsx
│   │           │   │   └── ProposalStatusCard.jsx
│   │           │   ├── CalendarSection/
│   │           │   │   ├── CalendarSection.jsx
│   │           │   │   ├── MonthCalendar.jsx
│   │           │   │   ├── CalendarDay.jsx
│   │           │   │   ├── BookedDatesDisplay.jsx
│   │           │   │   └── CalendarControls.jsx
│   │           │   ├── DocumentsSection/
│   │           │   │   ├── DocumentsSection.jsx
│   │           │   │   ├── DocumentUploadCard.jsx
│   │           │   │   ├── DocumentGenerationPanel.jsx
│   │           │   │   └── SignedDocumentsDisplay.jsx
│   │           │   ├── IdentitySection/
│   │           │   │   ├── IdentitySection.jsx
│   │           │   │   ├── UserIdentityCard.jsx
│   │           │   │   └── IdentityImageViewer.jsx
│   │           │   ├── PaymentRecordsSection/
│   │           │   │   ├── PaymentRecordsSection.jsx
│   │           │   │   ├── PaymentRecordForm.jsx
│   │           │   │   ├── GuestPaymentTable.jsx
│   │           │   │   ├── HostPayoutTable.jsx
│   │           │   │   ├── PaymentRecordRow.jsx
│   │           │   │   └── PaymentDebugInfo.jsx
│   │           │   ├── StaysSection/
│   │           │   │   ├── StaysSection.jsx
│   │           │   │   ├── StayCard.jsx
│   │           │   │   └── StayManagementControls.jsx
│   │           │   ├── DocumentChangeSection/
│   │           │   │   ├── DocumentChangeSection.jsx
│   │           │   │   ├── ChangeRequestCard.jsx
│   │           │   │   └── ChangeRequestTabs.jsx
│   │           │   ├── CancellationSection/
│   │           │   │   └── CancellationSection.jsx
│   │           │   └── AdminFlowControl/
│   │           │       └── AdminFlowControl.jsx (Run-As functionality)
│   │           └── modals/
│   │               ├── EditPaymentRecordModal.jsx
│   │               ├── ConfirmDeleteModal.jsx
│   │               ├── DocumentPreviewModal.jsx
│   │               └── IdentityImageModal.jsx
│   └── logic/
│       └── processors/
│           └── leases/
│               └── adaptPaymentRecordFromSupabase.js (if not exists)

supabase/
└── functions/
    └── leases-admin/
        ├── index.ts                    # Add new actions
        └── handlers/
            ├── createPaymentRecord.ts  # NEW
            ├── updatePaymentRecord.ts  # NEW
            ├── deletePaymentRecord.ts  # NEW
            ├── regeneratePaymentRecords.ts  # NEW
            ├── createStays.ts          # NEW
            ├── clearStays.ts           # NEW
            ├── updateBookedDates.ts    # NEW
            └── cancelLease.ts          # NEW (terms disagreement)
```

---

## 3. Phase 1: Route & Scaffold Setup

### 3.1 Add Route to Registry

**File:** `app/src/routes.config.js`

```javascript
// Add to CORPORATE INTERNAL TOOLS section
{
  path: '/_manage-leases-payment-records',
  file: 'manage-leases-payment-records.html',
  aliases: ['/_manage-leases-payment-records.html', '/_mlpr'],
  protected: false,  // Internal page, access controlled by URL obscurity + auth
  cloudflareInternal: true,
  internalName: 'manage-leases-payment-records-view',
  hasDynamicSegment: true,
  dynamicPattern: '/_manage-leases-payment-records/:leaseId'
}
```

### 3.2 Create HTML Entry Point

**File:** `app/public/manage-leases-payment-records.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Manage Leases & Payment Records | Split Lease Admin</title>
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/manage-leases-payment-records.jsx"></script>
</body>
</html>
```

### 3.3 Create React Mount Point

**File:** `app/src/manage-leases-payment-records.jsx`

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import ManageLeasesPaymentRecordsPage from './islands/pages/ManageLeasesPaymentRecordsPage/ManageLeasesPaymentRecordsPage.jsx';
import './styles/global.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ManageLeasesPaymentRecordsPage />
  </React.StrictMode>
);
```

### 3.4 Create Page Scaffold

**File:** `app/src/islands/pages/ManageLeasesPaymentRecordsPage/ManageLeasesPaymentRecordsPage.jsx`

```jsx
/**
 * ManageLeasesPaymentRecordsPage - Comprehensive Admin Interface
 *
 * Hollow Component Pattern: ALL logic delegated to useManageLeasesPageLogic
 * This component is purely presentational.
 */
import React from 'react';
import { useManageLeasesPageLogic } from './useManageLeasesPageLogic.js';
import { AdminHeader } from '../../shared/AdminHeader/AdminHeader.jsx';
import { Toast, ToastProvider, useToast } from '../../shared/Toast.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import './manage-leases.css';

// Section components (to be created in subsequent phases)
import LeaseSearchSection from './components/LeaseSearchSection/LeaseSearchSection.jsx';
import LeaseDetailsSection from './components/LeaseDetailsSection/LeaseDetailsSection.jsx';
// ... more sections

function ManageLeasesPaymentRecordsPageContent() {
  const { showToast } = useToast();
  const logic = useManageLeasesPageLogic({ showToast });

  if (logic.isLoading && !logic.selectedLease) {
    return <LoadingState message="Loading..." />;
  }

  if (logic.error && !logic.selectedLease) {
    return <ErrorState error={logic.error} onRetry={logic.handleRetry} />;
  }

  return (
    <div className="mlpr-page">
      <AdminHeader
        title="Manage Leases & Payment Records"
        subtitle={logic.selectedLease ? `Selected: ${logic.selectedLease.agreementNumber || logic.selectedLease.id}` : null}
      />

      <main className="mlpr-content">
        {/* Admin Flow Control (Run-As) */}
        {logic.isAdmin && (
          <AdminFlowControl
            users={logic.allUsers}
            selectedUser={logic.runAsUser}
            onUserChange={logic.handleRunAsChange}
          />
        )}

        {/* Lease Search & Selection */}
        <LeaseSearchSection
          searchQuery={logic.searchQuery}
          onSearchChange={logic.setSearchQuery}
          leases={logic.filteredLeases}
          selectedLease={logic.selectedLease}
          onLeaseSelect={logic.handleLeaseSelect}
        />

        {logic.selectedLease && (
          <>
            {/* Lease Details */}
            <LeaseDetailsSection lease={logic.selectedLease} />

            {/* Calendar & Date Management */}
            <CalendarSection
              lease={logic.selectedLease}
              onUpdateBookedDates={logic.handleUpdateBookedDates}
              onClearDates={logic.handleClearDates}
            />

            {/* Document Management */}
            <DocumentsSection
              lease={logic.selectedLease}
              onUploadDocument={logic.handleUploadDocument}
              onGenerateDocs={logic.handleGenerateDocs}
              onSendDocuments={logic.handleSendDocuments}
            />

            {/* Identity Verification */}
            <IdentitySection
              guest={logic.selectedLease.guest}
              host={logic.selectedLease.host}
            />

            {/* Cancellation Section */}
            <CancellationSection
              lease={logic.selectedLease}
              onCancel={logic.handleCancelLease}
            />

            {/* Payment Records Management */}
            <PaymentRecordsSection
              lease={logic.selectedLease}
              guestPayments={logic.guestPayments}
              hostPayments={logic.hostPayments}
              onCreatePayment={logic.handleCreatePaymentRecord}
              onEditPayment={logic.handleEditPaymentRecord}
              onDeletePayment={logic.handleDeletePaymentRecord}
              onRegenerateGuest={logic.handleRegenerateGuestPayments}
              onRegenerateHost={logic.handleRegenerateHostPayments}
              onRegenerateAll={logic.handleRegenerateAllPayments}
            />

            {/* Stays Management */}
            <StaysSection
              stays={logic.selectedLease.stays}
              onCreateStays={logic.handleCreateStays}
              onClearStays={logic.handleClearStays}
            />

            {/* Document Change Requests */}
            <DocumentChangeSection
              guestRequests={logic.guestChangeRequests}
              hostRequests={logic.hostChangeRequests}
              onOpenPdf={logic.handleOpenPdf}
            />
          </>
        )}
      </main>

      <Toast />
    </div>
  );
}

export default function ManageLeasesPaymentRecordsPage() {
  return (
    <ToastProvider>
      <ManageLeasesPaymentRecordsPageContent />
    </ToastProvider>
  );
}
```

### 3.5 Create Logic Hook Scaffold

**File:** `app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js`

```javascript
/**
 * useManageLeasesPageLogic - All business logic for ManageLeasesPaymentRecordsPage
 *
 * Hollow Component Pattern: ALL logic lives here
 *
 * State Groups:
 * - Auth & Admin: User authentication, run-as functionality
 * - Lease Selection: Search, filtering, selected lease
 * - Payment Records: CRUD operations, regeneration
 * - Stays: Create, clear, display
 * - Documents: Upload, generation, change requests
 * - UI: Loading, errors, modals
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { adaptLeaseFromSupabase } from '../../../logic/processors/leases/adaptLeaseFromSupabase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useManageLeasesPageLogic({ showToast }) {
  // ============================================================================
  // AUTH & ADMIN STATE
  // ============================================================================
  const [accessToken, setAccessToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [runAsUser, setRunAsUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // ============================================================================
  // LEASE SELECTION STATE
  // ============================================================================
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // PAYMENT RECORDS STATE
  // ============================================================================
  const [guestPayments, setGuestPayments] = useState([]);
  const [hostPayments, setHostPayments] = useState([]);

  // ============================================================================
  // DOCUMENT CHANGE REQUESTS STATE
  // ============================================================================
  const [guestChangeRequests, setGuestChangeRequests] = useState([]);
  const [hostChangeRequests, setHostChangeRequests] = useState([]);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================================
  // AUTH SETUP
  // ============================================================================
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || localStorage.getItem('sl_auth_token') || '';
        setAccessToken(token);

        // TODO: Check if user is admin (check user metadata or dedicated admin table)
        // For now, assume any authenticated user on this internal page is admin
        setIsAdmin(!!token);

        if (token) {
          await fetchLeases(token);
        }
      } catch (err) {
        console.error('[ManageLeases] Auth failed:', err);
        setError('Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  // ============================================================================
  // API HELPERS
  // ============================================================================
  const buildHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` })
  }), [accessToken]);

  const callEdgeFunction = useCallback(async (action, payload) => {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/leases-admin`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Action ${action} failed`);
    }

    return result.data;
  }, [buildHeaders]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchLeases = useCallback(async (token) => {
    setIsLoading(true);
    try {
      const data = await callEdgeFunction('list', { limit: 500 });
      const adapted = (data || []).map(adaptLeaseFromSupabase);
      setLeases(adapted);

      // Check URL for pre-selected lease
      const urlParams = new URLSearchParams(window.location.search);
      const leaseId = urlParams.get('leaseId') || window.location.pathname.split('/').pop();

      if (leaseId && leaseId !== '_manage-leases-payment-records') {
        const lease = adapted.find(l => l.id === leaseId);
        if (lease) {
          setSelectedLease(lease);
          await fetchLeaseDetails(lease.id);
        }
      }
    } catch (err) {
      console.error('[ManageLeases] Fetch failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [callEdgeFunction]);

  const fetchLeaseDetails = useCallback(async (leaseId) => {
    try {
      const data = await callEdgeFunction('get', { leaseId });
      const adapted = adaptLeaseFromSupabase(data);
      setSelectedLease(adapted);

      // Separate guest vs host payments
      const payments = adapted.paymentRecords || [];
      setGuestPayments(payments.filter(p => p.paymentFromGuest));
      setHostPayments(payments.filter(p => p.paymentToHost));

      // Fetch document change requests
      await fetchDocumentChangeRequests(leaseId);
    } catch (err) {
      console.error('[ManageLeases] Fetch details failed:', err);
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  }, [callEdgeFunction, showToast]);

  const fetchDocumentChangeRequests = useCallback(async (leaseId) => {
    // TODO: Implement document change requests fetch
    // This would query the updates_to_documents table
    setGuestChangeRequests([]);
    setHostChangeRequests([]);
  }, []);

  // ============================================================================
  // FILTERED LEASES (for search)
  // ============================================================================
  const filteredLeases = useMemo(() => {
    if (!searchQuery.trim()) return leases;

    const query = searchQuery.toLowerCase();
    return leases.filter(lease => {
      return (
        lease.id?.toLowerCase().includes(query) ||
        lease.agreementNumber?.toLowerCase().includes(query) ||
        lease.guest?.email?.toLowerCase().includes(query) ||
        lease.guest?.fullName?.toLowerCase().includes(query) ||
        lease.guest?.phone?.includes(query) ||
        lease.host?.email?.toLowerCase().includes(query) ||
        lease.listing?.name?.toLowerCase().includes(query)
      );
    });
  }, [leases, searchQuery]);

  // ============================================================================
  // LEASE SELECTION HANDLERS
  // ============================================================================
  const handleLeaseSelect = useCallback(async (lease) => {
    setSelectedLease(lease);
    if (lease) {
      await fetchLeaseDetails(lease.id);
      // Update URL without full navigation
      window.history.pushState({}, '', `/_manage-leases-payment-records/${lease.id}`);
    }
  }, [fetchLeaseDetails]);

  // ============================================================================
  // PAYMENT RECORD HANDLERS
  // ============================================================================
  const handleCreatePaymentRecord = useCallback(async (paymentData) => {
    try {
      await callEdgeFunction('createPaymentRecord', {
        leaseId: selectedLease.id,
        ...paymentData
      });
      showToast({ title: 'Success', content: 'Payment record created', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleEditPaymentRecord = useCallback(async (paymentId, updates) => {
    try {
      await callEdgeFunction('updatePaymentRecord', { paymentId, ...updates });
      showToast({ title: 'Success', content: 'Payment record updated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleDeletePaymentRecord = useCallback(async (paymentId) => {
    try {
      await callEdgeFunction('deletePaymentRecord', { paymentId });
      showToast({ title: 'Success', content: 'Payment record deleted', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateGuestPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'guest'
      });
      showToast({ title: 'Success', content: 'Guest payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateHostPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'host'
      });
      showToast({ title: 'Success', content: 'Host payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleRegenerateAllPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('regeneratePaymentRecords', {
        leaseId: selectedLease.id,
        type: 'all'
      });
      showToast({ title: 'Success', content: 'All payment records regenerated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // STAYS HANDLERS
  // ============================================================================
  const handleCreateStays = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('createStays', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Stays created', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleClearStays = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('clearStays', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Stays cleared', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // BOOKED DATES HANDLERS
  // ============================================================================
  const handleUpdateBookedDates = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('updateBookedDates', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Booked dates updated', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  const handleClearDates = useCallback(async () => {
    try {
      setIsLoading(true);
      await callEdgeFunction('clearBookedDates', { leaseId: selectedLease.id });
      showToast({ title: 'Success', content: 'Dates cleared', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // DOCUMENT HANDLERS
  // ============================================================================
  const handleUploadDocument = useCallback(async (documentType, file) => {
    // TODO: Implement document upload via Storage
    showToast({ title: 'Info', content: 'Document upload coming soon', type: 'info' });
  }, [showToast]);

  const handleGenerateDocs = useCallback(async (method) => {
    // TODO: Integrate with Zapier/Python document generation
    showToast({ title: 'Info', content: `Document generation via ${method} coming soon`, type: 'info' });
  }, [showToast]);

  const handleSendDocuments = useCallback(async () => {
    // TODO: Integrate with HelloSign
    showToast({ title: 'Info', content: 'Document sending coming soon', type: 'info' });
  }, [showToast]);

  const handleOpenPdf = useCallback((url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast({ title: 'Not Available', content: 'Document not found', type: 'warning' });
    }
  }, [showToast]);

  // ============================================================================
  // CANCELLATION HANDLER
  // ============================================================================
  const handleCancelLease = useCallback(async (reason, disagreeingParty) => {
    try {
      await callEdgeFunction('cancelLease', {
        leaseId: selectedLease.id,
        reason,
        disagreeingParty
      });
      showToast({ title: 'Success', content: 'Lease cancelled', type: 'success' });
      await fetchLeaseDetails(selectedLease.id);
    } catch (err) {
      showToast({ title: 'Error', content: err.message, type: 'error' });
    }
  }, [selectedLease, callEdgeFunction, showToast, fetchLeaseDetails]);

  // ============================================================================
  // ADMIN HANDLERS
  // ============================================================================
  const handleRunAsChange = useCallback((user) => {
    setRunAsUser(user);
    // TODO: Implement run-as functionality for testing
  }, []);

  const handleRetry = useCallback(() => {
    fetchLeases(accessToken);
  }, [accessToken, fetchLeases]);

  // ============================================================================
  // RETURN API
  // ============================================================================
  return {
    // Auth & Admin
    isAdmin,
    runAsUser,
    allUsers,
    handleRunAsChange,

    // Lease Selection
    leases,
    filteredLeases,
    selectedLease,
    searchQuery,
    setSearchQuery,
    handleLeaseSelect,

    // Payment Records
    guestPayments,
    hostPayments,
    handleCreatePaymentRecord,
    handleEditPaymentRecord,
    handleDeletePaymentRecord,
    handleRegenerateGuestPayments,
    handleRegenerateHostPayments,
    handleRegenerateAllPayments,

    // Stays
    handleCreateStays,
    handleClearStays,

    // Booked Dates
    handleUpdateBookedDates,
    handleClearDates,

    // Documents
    handleUploadDocument,
    handleGenerateDocs,
    handleSendDocuments,
    handleOpenPdf,

    // Change Requests
    guestChangeRequests,
    hostChangeRequests,

    // Cancellation
    handleCancelLease,

    // UI
    isLoading,
    error,
    handleRetry,
  };
}
```

### 3.6 Run Route Generation

After adding the route, run:
```bash
cd app && bun run generate-routes
```

---

## 4. Phase 2: Lease Selection & Search

### 4.1 LeaseSearchSection Component

**File:** `components/LeaseSearchSection/LeaseSearchSection.jsx`

```jsx
/**
 * LeaseSearchSection - Search and select leases
 *
 * Features:
 * - Search by phone, email, IDs, names, agreement number
 * - Dropdown for lease selection
 * - Shows selected booking header
 */
import React from 'react';
import { Search, X } from 'lucide-react';
import LeaseDropdown from './LeaseDropdown.jsx';

export default function LeaseSearchSection({
  searchQuery,
  onSearchChange,
  leases,
  selectedLease,
  onLeaseSelect
}) {
  return (
    <section className="mlpr-section mlpr-search-section">
      <h2 className="mlpr-section-title">Lease Selection</h2>

      {/* Selected Booking Header */}
      {selectedLease && (
        <div className="mlpr-selected-header">
          <span>Selected Booking:</span>
          <strong>{selectedLease.agreementNumber || selectedLease.id}</strong>
          {selectedLease.guest?.fullName && (
            <span className="mlpr-guest-name">({selectedLease.guest.fullName})</span>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="mlpr-search-bar">
        <Search size={18} className="mlpr-search-icon" />
        <input
          type="text"
          placeholder="Search Lease using phone number, email, IDs, names, agreement number, etc"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mlpr-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="mlpr-search-clear"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Lease Dropdown */}
      <LeaseDropdown
        leases={leases}
        selectedLease={selectedLease}
        onSelect={onLeaseSelect}
      />
    </section>
  );
}
```

### 4.2 LeaseDropdown Component

**File:** `components/LeaseSearchSection/LeaseDropdown.jsx`

```jsx
/**
 * LeaseDropdown - Dropdown for selecting a lease
 *
 * Shows: Guest name, Agreement #, Date range, Status
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { formatShortDate } from '../../../../lib/dateUtils.js';

export default function LeaseDropdown({ leases, selectedLease, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLeaseOption = (lease) => {
    const guestName = lease.guest?.fullName || 'Unknown Guest';
    const agreement = lease.agreementNumber || lease.id?.slice(0, 8);
    const dates = lease.startDate && lease.endDate
      ? `${formatShortDate(lease.startDate)} - ${formatShortDate(lease.endDate)}`
      : 'No dates';
    return { guestName, agreement, dates, status: lease.status };
  };

  return (
    <div className="mlpr-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="mlpr-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {selectedLease ? (
          <span className="mlpr-dropdown-selected">
            {formatLeaseOption(selectedLease).guestName} - #{formatLeaseOption(selectedLease).agreement}
          </span>
        ) : (
          <span className="mlpr-dropdown-placeholder">Choose Lease</span>
        )}
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <ul className="mlpr-dropdown-menu">
          {leases.length === 0 ? (
            <li className="mlpr-dropdown-empty">No leases found</li>
          ) : (
            leases.map((lease) => {
              const { guestName, agreement, dates, status } = formatLeaseOption(lease);
              const isSelected = selectedLease?.id === lease.id;

              return (
                <li
                  key={lease.id}
                  className={`mlpr-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(lease);
                    setIsOpen(false);
                  }}
                >
                  <div className="mlpr-dropdown-item-main">
                    <span className="mlpr-dropdown-guest">{guestName}</span>
                    <span className="mlpr-dropdown-agreement">#{agreement}</span>
                  </div>
                  <div className="mlpr-dropdown-item-sub">
                    <span className="mlpr-dropdown-dates">{dates}</span>
                    <span className={`mlpr-status mlpr-status-${status}`}>{status}</span>
                  </div>
                  {isSelected && <Check size={16} className="mlpr-dropdown-check" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
```

---

## 5. Phase 3: Lease Details Section

### 5.1 LeaseDetailsSection Component

**File:** `components/LeaseDetailsSection/LeaseDetailsSection.jsx`

```jsx
/**
 * LeaseDetailsSection - Display lease booking details
 *
 * Shows:
 * - Listing info with photo
 * - Agreement & Proposal IDs
 * - Reservation dates
 * - Check-in/out days
 * - Proposal status
 * - Guests allowed
 */
import React from 'react';
import { Calendar, Home, FileText, Users } from 'lucide-react';
import ReservationDatesCard from './ReservationDatesCard.jsx';
import ProposalStatusCard from './ProposalStatusCard.jsx';
import { formatDate } from '../../../../lib/dateUtils.js';

export default function LeaseDetailsSection({ lease }) {
  if (!lease) return null;

  const listing = lease.listing || {};
  const proposal = lease.proposal || {};

  return (
    <section className="mlpr-section mlpr-details-section">
      <h2 className="mlpr-section-title">Booking Details</h2>

      <div className="mlpr-details-grid">
        {/* Listing Info */}
        <div className="mlpr-detail-card mlpr-listing-card">
          <div className="mlpr-listing-photo">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.name} />
            ) : (
              <div className="mlpr-listing-placeholder">
                <Home size={32} />
              </div>
            )}
          </div>
          <div className="mlpr-listing-info">
            <h3>{listing.name || 'Unnamed Listing'}</h3>
            <p className="mlpr-listing-address">
              {[listing.address, listing.neighborhood, listing.city].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* IDs Card */}
        <div className="mlpr-detail-card">
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Unique ID of this Agreement:</span>
            <span className="mlpr-detail-value mlpr-id">{lease.id}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Unique ID of this Proposal:</span>
            <span className="mlpr-detail-value mlpr-id">{proposal.id || 'N/A'}</span>
          </div>
          <div className="mlpr-detail-row">
            <span className="mlpr-detail-label">Agreement Number:</span>
            <span className="mlpr-detail-value">{lease.agreementNumber || 'Not assigned'}</span>
          </div>
        </div>

        {/* Reservation Dates */}
        <ReservationDatesCard lease={lease} />

        {/* Proposal Status */}
        <ProposalStatusCard status={proposal.status || lease.status} />

        {/* Guests Allowed */}
        <div className="mlpr-detail-card mlpr-guests-card">
          <div className="mlpr-detail-row">
            <Users size={16} />
            <span className="mlpr-detail-label">Guests Allowed:</span>
            <span className="mlpr-detail-value">{lease.guestsAllowed || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 5.2 ReservationDatesCard Component

**File:** `components/LeaseDetailsSection/ReservationDatesCard.jsx`

```jsx
/**
 * ReservationDatesCard - Display reservation date information
 */
import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate, formatDayName } from '../../../../lib/dateUtils.js';

export default function ReservationDatesCard({ lease }) {
  return (
    <div className="mlpr-detail-card mlpr-dates-card">
      <div className="mlpr-card-header">
        <Calendar size={18} />
        <h4>Reservation Dates</h4>
      </div>

      <div className="mlpr-dates-grid">
        <div className="mlpr-date-field">
          <label>Reservation Start (Move-In)</label>
          <input
            type="text"
            readOnly
            value={formatDate(lease.startDate) || 'Not set'}
          />
        </div>

        <div className="mlpr-date-field">
          <label>Reservation End (Move-Out)</label>
          <input
            type="text"
            readOnly
            value={formatDate(lease.endDate) || 'Not set'}
          />
        </div>

        <div className="mlpr-date-field">
          <label>Check-In Day</label>
          <span className="mlpr-day-badge">{formatDayName(lease.checkInDay)}</span>
        </div>

        <div className="mlpr-date-field">
          <label>Check-Out Day</label>
          <span className="mlpr-day-badge">{formatDayName(lease.checkOutDay)}</span>
        </div>

        <div className="mlpr-date-field">
          <label>Move-In Date</label>
          <input
            type="text"
            readOnly
            value={formatDate(lease.moveInDate) || 'Not set'}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Phase 4: Calendar & Date Management

### 6.1 CalendarSection Component

**File:** `components/CalendarSection/CalendarSection.jsx`

```jsx
/**
 * CalendarSection - Calendar display and booked dates management
 *
 * Features:
 * - Month calendar with 6x7 grid
 * - Toggle views: Lease Nights, Blocked Manually, Move-Out
 * - Booked dates display (original, after request, proposal)
 * - Date management buttons
 */
import React, { useState } from 'react';
import MonthCalendar from './MonthCalendar.jsx';
import CalendarControls from './CalendarControls.jsx';
import BookedDatesDisplay from './BookedDatesDisplay.jsx';

export default function CalendarSection({ lease, onUpdateBookedDates, onClearDates }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('lease'); // 'lease' | 'blocked' | 'moveout'

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <section className="mlpr-section mlpr-calendar-section">
      <h2 className="mlpr-section-title">Calendar & Date Management</h2>

      {/* View Mode Toggles */}
      <div className="mlpr-calendar-toggles">
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'lease' ? 'active' : ''}`}
          onClick={() => setViewMode('lease')}
        >
          Lease Nights/Occupied
        </button>
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'blocked' ? 'active' : ''}`}
          onClick={() => setViewMode('blocked')}
        >
          Blocked Manually
        </button>
        <button
          type="button"
          className={`mlpr-toggle-btn ${viewMode === 'moveout' ? 'active' : ''}`}
          onClick={() => setViewMode('moveout')}
        >
          Move-Out
        </button>
      </div>

      {/* Month Navigation */}
      <CalendarControls
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Calendar Grid */}
      <MonthCalendar
        month={currentMonth}
        bookedDates={lease.bookedDates || []}
        bookedDatesAfterRequest={lease.bookedDatesAfterRequest || []}
        viewMode={viewMode}
        leaseStartDate={lease.startDate}
        leaseEndDate={lease.endDate}
      />

      {/* Booked Dates Lists */}
      <BookedDatesDisplay
        original={lease.bookedDates}
        afterRequest={lease.bookedDatesAfterRequest}
        proposalDates={lease.proposal?.bookedDates}
      />

      {/* Date Management Buttons */}
      <div className="mlpr-date-actions">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={onUpdateBookedDates}
        >
          Create List of Booked Dates
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-danger"
          onClick={onClearDates}
        >
          CLEAR dates in leases and proposals
        </button>
      </div>
    </section>
  );
}
```

### 6.2 MonthCalendar Component

**File:** `components/CalendarSection/MonthCalendar.jsx`

```jsx
/**
 * MonthCalendar - 6x7 calendar grid for displaying booked dates
 */
import React, { useMemo } from 'react';
import CalendarDay from './CalendarDay.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthCalendar({
  month,
  bookedDates,
  bookedDatesAfterRequest,
  viewMode,
  leaseStartDate,
  leaseEndDate
}) {
  // Generate calendar days for 6-week grid
  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // First day of month
    const firstDay = new Date(year, monthIndex, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Calculate start date (may be in previous month)
    const startDate = new Date(year, monthIndex, 1 - startingDayOfWeek);

    // Generate 42 days (6 weeks)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  }, [month]);

  const isBooked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedDates?.includes(dateStr);
  };

  const isBookedAfterRequest = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedDatesAfterRequest?.includes(dateStr);
  };

  const isInLeaseRange = (date) => {
    if (!leaseStartDate || !leaseEndDate) return false;
    return date >= new Date(leaseStartDate) && date <= new Date(leaseEndDate);
  };

  return (
    <div className="mlpr-calendar">
      {/* Weekday Headers */}
      <div className="mlpr-calendar-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="mlpr-calendar-weekday">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="mlpr-calendar-grid">
        {calendarDays.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            currentMonth={month}
            isBooked={isBooked(date)}
            isBookedAfterRequest={isBookedAfterRequest(date)}
            isInLeaseRange={isInLeaseRange(date)}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Phase 5: Document Management

### 7.1 DocumentsSection Component

**File:** `components/DocumentsSection/DocumentsSection.jsx`

```jsx
/**
 * DocumentsSection - Document upload, generation, and viewing
 *
 * Document Types:
 * 1. Draft 1: Periodic Tenancy Agreement (Guest and Host)
 * 2. Draft 2: Supplemental Agreement (Host only)
 * 3. Draft 3: Host Payout Schedule (Host only)
 * 4. Draft 4: Authorization for Credit Card Charges
 */
import React from 'react';
import { FileText, Upload, Send, ExternalLink, Check } from 'lucide-react';
import DocumentUploadCard from './DocumentUploadCard.jsx';
import DocumentGenerationPanel from './DocumentGenerationPanel.jsx';
import SignedDocumentsDisplay from './SignedDocumentsDisplay.jsx';

const DOCUMENT_TYPES = [
  {
    key: 'periodicTenancy',
    label: 'Draft 1: Periodic Tenancy Agreement (Guest and Host)',
    field: 'periodicTenancyAgreement'
  },
  {
    key: 'supplemental',
    label: 'Draft 2: Supplemental Agreement (Host only)',
    field: 'supplementalAgreement'
  },
  {
    key: 'payoutSchedule',
    label: 'Draft 3: Host Payout Schedule (Host only)',
    field: 'hostPayoutSchedule'
  },
  {
    key: 'creditCard',
    label: 'Draft 4: Authorization for Credit Card Charges',
    field: 'creditCardAuthorizationForm'
  },
];

export default function DocumentsSection({
  lease,
  onUploadDocument,
  onGenerateDocs,
  onSendDocuments
}) {
  return (
    <section className="mlpr-section mlpr-documents-section">
      <h2 className="mlpr-section-title">Document Management</h2>

      {/* Draft Document Uploads */}
      <div className="mlpr-documents-grid">
        {DOCUMENT_TYPES.map(docType => (
          <DocumentUploadCard
            key={docType.key}
            label={docType.label}
            documentUrl={lease[docType.field]}
            onUpload={(file) => onUploadDocument(docType.key, file)}
          />
        ))}
      </div>

      {/* Document Generation Panel */}
      <DocumentGenerationPanel
        onGenerateZap={() => onGenerateDocs('zapier')}
        onGeneratePython={() => onGenerateDocs('python')}
        splitleaseCredit={lease.splitleaseCredit || 0}
      />

      {/* Send Documents Button */}
      <button
        type="button"
        className="mlpr-btn mlpr-btn-primary mlpr-send-docs-btn"
        onClick={onSendDocuments}
      >
        <Send size={16} />
        Send Documents
      </button>

      {/* Signed Documents Display */}
      <SignedDocumentsDisplay lease={lease} />
    </section>
  );
}
```

---

## 8. Phase 6: Identity Verification

### 8.1 IdentitySection Component

**File:** `components/IdentitySection/IdentitySection.jsx`

```jsx
/**
 * IdentitySection - Display identity verification documents
 *
 * Shows for both guest and host:
 * - Selfie with ID
 * - ID front
 * - ID back
 * - Profile photo
 * - Verification status
 */
import React from 'react';
import UserIdentityCard from './UserIdentityCard.jsx';

export default function IdentitySection({ guest, host }) {
  return (
    <section className="mlpr-section mlpr-identity-section">
      <h2 className="mlpr-section-title">Identity Verification</h2>

      <div className="mlpr-identity-grid">
        {/* Guest Identity */}
        <UserIdentityCard
          title="Guest / Parent User"
          user={guest}
        />

        {/* Host Identity */}
        <UserIdentityCard
          title="Host"
          user={host}
        />
      </div>
    </section>
  );
}
```

### 8.2 UserIdentityCard Component

**File:** `components/IdentitySection/UserIdentityCard.jsx`

```jsx
/**
 * UserIdentityCard - Display identity documents for a user
 */
import React, { useState } from 'react';
import { User, CheckCircle, XCircle, Maximize2 } from 'lucide-react';
import IdentityImageModal from '../../modals/IdentityImageModal.jsx';

export default function UserIdentityCard({ title, user }) {
  const [modalImage, setModalImage] = useState(null);

  if (!user) {
    return (
      <div className="mlpr-identity-card mlpr-identity-empty">
        <h4>{title}</h4>
        <p>No user data available</p>
      </div>
    );
  }

  const images = [
    { label: 'Selfie with ID', url: user.selfieUrl || user['Selfie with ID'] },
    { label: 'ID Front', url: user.frontIdUrl || user['ID front'] },
    { label: 'ID Back', url: user.backIdUrl || user['ID Back'] },
    { label: 'Profile Photo', url: user.avatarUrl || user['Profile Photo'] },
  ];

  const isVerified = user.identityVerified || user['user verified?'];

  return (
    <div className="mlpr-identity-card">
      <div className="mlpr-identity-header">
        <h4>{title}</h4>
        <span className={`mlpr-verification-status ${isVerified ? 'verified' : 'pending'}`}>
          {isVerified ? (
            <>
              <CheckCircle size={14} />
              Verified
            </>
          ) : (
            <>
              <XCircle size={14} />
              Not Verified
            </>
          )}
        </span>
      </div>

      <div className="mlpr-identity-name">
        {user.fullName || user['Name - Full'] || 'Unknown'}
      </div>

      <div className="mlpr-identity-images">
        {images.map(({ label, url }) => (
          <div key={label} className="mlpr-identity-image-wrapper">
            <span className="mlpr-identity-image-label">{label}</span>
            {url ? (
              <div
                className="mlpr-identity-image"
                onClick={() => setModalImage({ url, label })}
              >
                <img src={url} alt={label} />
                <div className="mlpr-identity-image-overlay">
                  <Maximize2 size={16} />
                </div>
              </div>
            ) : (
              <div className="mlpr-identity-image-placeholder">
                <User size={24} />
                <span>Not provided</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalImage && (
        <IdentityImageModal
          imageUrl={modalImage.url}
          imageLabel={modalImage.label}
          userName={user.fullName || user['Name - Full']}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}
```

---

## 9. Phase 7: Payment Records Management

### 9.1 PaymentRecordsSection Component

**File:** `components/PaymentRecordsSection/PaymentRecordsSection.jsx`

```jsx
/**
 * PaymentRecordsSection - Complete payment record management
 *
 * Features:
 * - Create new payment records
 * - Guest payment schedule table
 * - Host payout schedule table
 * - Edit/delete payment records
 * - Regenerate payment records
 * - Debug info display
 */
import React, { useState } from 'react';
import PaymentRecordForm from './PaymentRecordForm.jsx';
import GuestPaymentTable from './GuestPaymentTable.jsx';
import HostPayoutTable from './HostPayoutTable.jsx';
import PaymentDebugInfo from './PaymentDebugInfo.jsx';

export default function PaymentRecordsSection({
  lease,
  guestPayments,
  hostPayments,
  onCreatePayment,
  onEditPayment,
  onDeletePayment,
  onRegenerateGuest,
  onRegenerateHost,
  onRegenerateAll
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  return (
    <section className="mlpr-section mlpr-payments-section">
      <h2 className="mlpr-section-title">Payment Record Management</h2>

      {/* Payment Creation Form */}
      <div className="mlpr-payment-creation">
        <h3>Payment Record Creation</h3>
        <PaymentRecordForm
          leaseId={lease.id}
          onSubmit={onCreatePayment}
          onCancel={() => setIsCreating(false)}
        />
      </div>

      {/* Guest Payment Schedule */}
      <div className="mlpr-payment-table-section">
        <h3>Guest Payment Schedule</h3>
        <GuestPaymentTable
          payments={guestPayments}
          onEdit={setEditingPayment}
          onDelete={onDeletePayment}
        />
      </div>

      {/* Host Payout Schedule */}
      <div className="mlpr-payment-table-section">
        <h3>Host Payout Schedule</h3>
        <HostPayoutTable
          payments={hostPayments}
          onEdit={setEditingPayment}
          onDelete={onDeletePayment}
        />
      </div>

      {/* Regeneration Buttons */}
      <div className="mlpr-payment-actions">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateAll}
        >
          Recreate ALL payment records
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateGuest}
        >
          Recreate Guest Payment Records
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-secondary"
          onClick={onRegenerateHost}
        >
          Recreate Host Payment Records
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-outline"
          onClick={() => {/* TODO: schedule reminders */}}
        >
          Schedule check out reminders
        </button>
      </div>

      {/* Debug Info */}
      <PaymentDebugInfo lease={lease} />
    </section>
  );
}
```

### 9.2 PaymentRecordForm Component

**File:** `components/PaymentRecordsSection/PaymentRecordForm.jsx`

```jsx
/**
 * PaymentRecordForm - Form for creating/editing payment records
 */
import React, { useState } from 'react';
import { Upload } from 'lucide-react';

export default function PaymentRecordForm({
  leaseId,
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false
}) {
  const [formData, setFormData] = useState({
    scheduledDate: initialData.scheduledDate || '',
    actualDate: initialData.actualDate || '',
    rent: initialData.rent || '',
    maintenanceFee: initialData.maintenanceFee || '',
    totalPaid: initialData.totalPaid || '',
    bankTransactionNumber: initialData.bankTransactionNumber || '',
    paymentDelayed: initialData.paymentDelayed || 'no',
    receiptFile: null,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="mlpr-payment-form" onSubmit={handleSubmit}>
      <div className="mlpr-form-grid">
        <div className="mlpr-form-field">
          <label>Scheduled Date of Payment</label>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => handleChange('scheduledDate', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Actual Date of Payment</label>
          <input
            type="date"
            value={formData.actualDate}
            onChange={(e) => handleChange('actualDate', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Rent</label>
          <input
            type="number"
            step="0.01"
            value={formData.rent}
            onChange={(e) => handleChange('rent', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Maintenance Fee</label>
          <input
            type="number"
            step="0.01"
            value={formData.maintenanceFee}
            onChange={(e) => handleChange('maintenanceFee', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Total Paid to the Host</label>
          <input
            type="number"
            step="0.01"
            value={formData.totalPaid}
            onChange={(e) => handleChange('totalPaid', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Bank Transaction Number</label>
          <input
            type="text"
            value={formData.bankTransactionNumber}
            onChange={(e) => handleChange('bankTransactionNumber', e.target.value)}
          />
        </div>

        <div className="mlpr-form-field">
          <label>Payment Delayed?</label>
          <select
            value={formData.paymentDelayed}
            onChange={(e) => handleChange('paymentDelayed', e.target.value)}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="mlpr-form-field mlpr-form-field-upload">
          <label>Payment Receipt</label>
          <div className="mlpr-upload-area">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleChange('receiptFile', e.target.files[0])}
            />
            <Upload size={20} />
            <span>Click to upload a file</span>
          </div>
        </div>
      </div>

      <div className="mlpr-form-actions">
        <button type="submit" className="mlpr-btn mlpr-btn-primary">
          {isEditing ? 'Update Payment Record' : 'Create Payment Record'}
        </button>
        {onCancel && (
          <button type="button" className="mlpr-btn mlpr-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
```

---

## 10. Phase 8: Stays Management

### 10.1 StaysSection Component

**File:** `components/StaysSection/StaysSection.jsx`

```jsx
/**
 * StaysSection - Manage stay periods for a lease
 *
 * Displays:
 * - Unique ID
 * - Check-in date
 * - Last night
 * - Dates list
 * - First index
 * - Check-out date
 */
import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import StayCard from './StayCard.jsx';

export default function StaysSection({ stays = [], onCreateStays, onClearStays }) {
  return (
    <section className="mlpr-section mlpr-stays-section">
      <h2 className="mlpr-section-title">Stays Management</h2>

      {/* Action Buttons */}
      <div className="mlpr-stays-actions">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={onCreateStays}
        >
          <Plus size={16} />
          Create Stays
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-danger"
          onClick={onClearStays}
        >
          <Trash2 size={16} />
          Clear Stays
        </button>
      </div>

      {/* Stays List */}
      {stays.length === 0 ? (
        <div className="mlpr-stays-empty">
          <Calendar size={48} />
          <p>No stays have been created for this lease.</p>
        </div>
      ) : (
        <div className="mlpr-stays-list">
          {stays.map((stay, index) => (
            <StayCard key={stay.id || index} stay={stay} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
```

### 10.2 StayCard Component

**File:** `components/StaysSection/StayCard.jsx`

```jsx
/**
 * StayCard - Display individual stay details
 */
import React from 'react';
import { Calendar, Hash, Clock } from 'lucide-react';
import { formatDate } from '../../../../lib/dateUtils.js';

export default function StayCard({ stay, index }) {
  return (
    <div className="mlpr-stay-card">
      <div className="mlpr-stay-header">
        <span className="mlpr-stay-number">Stay #{index + 1}</span>
        <span className="mlpr-stay-id" title={stay.id}>
          <Hash size={12} />
          {stay.id?.slice(0, 8)}...
        </span>
      </div>

      <div className="mlpr-stay-details">
        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Check-in:</span>
          <span className="mlpr-stay-value">{formatDate(stay.checkIn)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Last Night:</span>
          <span className="mlpr-stay-value">{formatDate(stay.lastNight)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">Check-out:</span>
          <span className="mlpr-stay-value">{formatDate(stay.checkOut)}</span>
        </div>

        <div className="mlpr-stay-row">
          <span className="mlpr-stay-label">First Index:</span>
          <span className="mlpr-stay-value">{stay.firstIndex ?? 'N/A'}</span>
        </div>

        <div className="mlpr-stay-row mlpr-stay-dates">
          <span className="mlpr-stay-label">Dates ({stay.dates?.length || 0}):</span>
          <div className="mlpr-stay-dates-list">
            {(stay.dates || []).slice(0, 7).map((date, i) => (
              <span key={i} className="mlpr-stay-date-badge">{formatDate(date)}</span>
            ))}
            {(stay.dates?.length || 0) > 7 && (
              <span className="mlpr-stay-date-more">+{stay.dates.length - 7} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 11. Phase 9: Document Change Requests

### 11.1 DocumentChangeSection Component

**File:** `components/DocumentChangeSection/DocumentChangeSection.jsx`

```jsx
/**
 * DocumentChangeSection - Display and manage document change requests
 *
 * Tabs:
 * - Guest Requesting Changes
 * - Host Requesting Changes
 */
import React, { useState } from 'react';
import { FileEdit } from 'lucide-react';
import ChangeRequestTabs from './ChangeRequestTabs.jsx';
import ChangeRequestCard from './ChangeRequestCard.jsx';

export default function DocumentChangeSection({
  guestRequests = [],
  hostRequests = [],
  onOpenPdf
}) {
  const [activeTab, setActiveTab] = useState('guest');

  const activeRequests = activeTab === 'guest' ? guestRequests : hostRequests;

  return (
    <section className="mlpr-section mlpr-change-requests-section">
      <h2 className="mlpr-section-title">Document Change Requests</h2>

      {/* Tabs */}
      <ChangeRequestTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        guestCount={guestRequests.length}
        hostCount={hostRequests.length}
      />

      {/* Requests List */}
      {activeRequests.length === 0 ? (
        <div className="mlpr-change-empty">
          <FileEdit size={48} />
          <p>No {activeTab === 'guest' ? 'guest' : 'host'} change requests.</p>
        </div>
      ) : (
        <div className="mlpr-change-list">
          {activeRequests.map((request, index) => (
            <ChangeRequestCard
              key={request.id || index}
              request={request}
              onOpenPdf={onOpenPdf}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

---

## 12. Edge Function Extensions

### 12.1 New Actions for leases-admin

Add these actions to `supabase/functions/leases-admin/index.ts`:

```typescript
// Add to validActions array
const validActions = [
  // Existing...
  'createPaymentRecord',
  'updatePaymentRecord',
  'deletePaymentRecord',
  'regeneratePaymentRecords',
  'createStays',
  'clearStays',
  'updateBookedDates',
  'clearBookedDates',
  'cancelLease',
  'getDocumentChangeRequests',
];
```

### 12.2 Create Payment Record Handler

**File:** `supabase/functions/leases-admin/handlers/createPaymentRecord.ts`

```typescript
/**
 * Create a new payment record for a lease
 */
export async function handleCreatePaymentRecord(
  payload: {
    leaseId: string;
    scheduledDate: string;
    actualDate?: string;
    rent: number;
    maintenanceFee: number;
    damageDeposit?: number;
    totalPaid: number;
    bankTransactionNumber?: string;
    paymentDelayed: boolean;
    isGuestPayment: boolean;
  },
  supabase: SupabaseClient
) {
  const { leaseId, ...paymentData } = payload;

  // Generate unique ID
  const { data: recordId } = await supabase.rpc('generate_bubble_id');

  const now = new Date().toISOString();

  const record = {
    _id: recordId,
    'Booking - Reservation': leaseId,
    'Scheduled Date': paymentData.scheduledDate,
    'Actual Date': paymentData.actualDate || null,
    Rent: paymentData.rent,
    'Maintenance Fee': paymentData.maintenanceFee,
    'Damage Deposit': paymentData.damageDeposit || null,
    'Total Paid by Guest': paymentData.isGuestPayment ? paymentData.totalPaid : null,
    'Total Paid to Host': !paymentData.isGuestPayment ? paymentData.totalPaid : null,
    'Bank Transaction Number': paymentData.bankTransactionNumber || null,
    'Payment from guest?': paymentData.isGuestPayment,
    'Payment to Host?': !paymentData.isGuestPayment,
    'Created Date': now,
    'Modified Date': now,
  };

  const { data, error } = await supabase
    .from('paymentrecords')
    .insert(record)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create payment record: ${error.message}`);
  }

  return data;
}
```

### 12.3 Regenerate Payment Records Handler

**File:** `supabase/functions/leases-admin/handlers/regeneratePaymentRecords.ts`

```typescript
/**
 * Regenerate payment records for a lease
 *
 * Steps:
 * 1. Delete existing payment records
 * 2. Fetch lease and proposal data
 * 3. Call guest-payment-records or host-payment-records functions
 */
export async function handleRegeneratePaymentRecords(
  payload: { leaseId: string; type: 'guest' | 'host' | 'all' },
  supabase: SupabaseClient
) {
  const { leaseId, type } = payload;

  // Delete existing payment records based on type
  const deleteFilter: Record<string, unknown> = { 'Booking - Reservation': leaseId };

  if (type === 'guest') {
    deleteFilter['Payment from guest?'] = true;
  } else if (type === 'host') {
    deleteFilter['Payment to Host?'] = true;
  }

  const { error: deleteError } = await supabase
    .from('paymentrecords')
    .delete()
    .match(deleteFilter);

  if (deleteError) {
    console.warn('Failed to delete existing records:', deleteError);
    // Continue anyway
  }

  // Fetch lease with proposal
  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .select(`
      *,
      proposal:Proposal(*)
    `)
    .eq('_id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error(`Lease not found: ${leaseError?.message}`);
  }

  const proposal = lease.proposal;

  // Call the appropriate payment generation function
  // This would invoke the guest-payment-records or host-payment-records edge functions
  // For now, return success and let the frontend handle the regeneration

  return {
    regenerated: true,
    type,
    leaseId,
    message: `Payment records regeneration triggered for ${type}`
  };
}
```

### 12.4 Create/Clear Stays Handlers

**File:** `supabase/functions/leases-admin/handlers/stayOperations.ts`

```typescript
/**
 * Create stays for a lease based on reservation dates and week pattern
 */
export async function handleCreateStays(
  payload: { leaseId: string },
  supabase: SupabaseClient
) {
  const { leaseId } = payload;

  // Fetch lease with proposal for week pattern
  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .select(`
      *,
      proposal:Proposal(*)
    `)
    .eq('_id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error(`Lease not found: ${leaseError?.message}`);
  }

  // Calculate stays based on dates and week pattern
  // This logic would mirror Bubble's stay creation workflow
  // ... implementation details ...

  return { created: true, leaseId };
}

/**
 * Clear all stays for a lease
 */
export async function handleClearStays(
  payload: { leaseId: string },
  supabase: SupabaseClient
) {
  const { leaseId } = payload;

  const { error } = await supabase
    .from('bookings_stays')
    .delete()
    .eq('Lease', leaseId);

  if (error) {
    throw new Error(`Failed to clear stays: ${error.message}`);
  }

  // Also clear the list reference on the lease
  await supabase
    .from('bookings_leases')
    .update({
      'List of Stays': [],
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId);

  return { cleared: true, leaseId };
}
```

---

## 13. Database Considerations

### 13.1 Tables Used

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `bookings_leases` | Lease records | `_id`, `Guest`, `Host`, `Listing`, `Proposal`, dates, status |
| `bookings_stays` | Stay periods | `_id`, `Lease`, dates, status |
| `paymentrecords` | Payment records | `_id`, `Booking - Reservation`, amounts, dates |
| `proposal` | Proposals | `_id`, pricing, duration, dates |
| `user` | Users | Identity verification fields |
| `updates_to_documents` | Document change requests | `_id`, document name, old/new text |

### 13.2 New RPC Functions (if needed)

```sql
-- Generate booked dates list from proposal data
CREATE OR REPLACE FUNCTION generate_booked_dates(lease_id TEXT)
RETURNS TEXT[] AS $$
  -- Implementation
$$ LANGUAGE plpgsql;
```

---

## 14. Testing Strategy

### 14.1 Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Lease search filters correctly
- [ ] Lease selection updates URL and loads details
- [ ] Calendar displays correct dates
- [ ] Payment records display in tables
- [ ] Create/edit/delete payment records works
- [ ] Regenerate payment records works
- [ ] Create/clear stays works
- [ ] Document uploads work
- [ ] Identity verification images display
- [ ] Document change requests display

### 14.2 Edge Cases

- Lease with no proposal
- Lease with no payment records
- Lease with no stays
- User with missing identity documents
- Very long lease (many payment cycles)

---

## 15. Migration Notes

### 15.1 Bubble Workflow Mapping

| Bubble Workflow Category | Implementation |
|--------------------------|----------------|
| Bookings-Create/Modify (8) | Edge Function actions |
| Calendar (2) | React state + helpers |
| Custom Events (5) | Hook callbacks |
| Generate/Send Document (3) | External integrations (Zapier, Python) |
| Login/Run As (4) | Auth state + admin impersonation |
| Money (6) | Edge Function payment operations |
| Navigation (7+4) | React Router / URL management |
| page loaded (1) | useEffect initialization |
| PDF (2) | External link opens |
| Proposals-Cancel (1) | Edge Function cancelLease |
| Reset Input Fields (1) | Form state reset |
| Send Message (2) | Message Edge Function |
| Set States (6) | React useState |
| Show/Hide Elements (5) | Conditional rendering |
| Toggles (5) | React state toggles |

### 15.2 External Integrations to Preserve

1. **Zapier** - Document generation (keep existing Zap, trigger from Edge Function)
2. **Python Script** - Advanced document generation
3. **HelloSign** - Digital signatures (API integration needed)
4. **Google Drive** - Document storage (via Supabase Storage or direct)

---

## Appendix: CSS Skeleton

**File:** `manage-leases.css`

```css
/* Base Styles */
.mlpr-page {
  min-height: 100vh;
  background-color: var(--color-gray-50, #f9fafb);
}

.mlpr-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-6, 1.5rem);
}

/* Sections */
.mlpr-section {
  background: white;
  border-radius: var(--radius-lg, 0.5rem);
  padding: var(--spacing-6, 1.5rem);
  margin-bottom: var(--spacing-6, 1.5rem);
  box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
}

.mlpr-section-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  margin-bottom: var(--spacing-4, 1rem);
  color: var(--color-gray-900, #111827);
}

/* Grid Layouts */
.mlpr-details-grid,
.mlpr-identity-grid,
.mlpr-documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-4, 1rem);
}

/* Buttons */
.mlpr-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2, 0.5rem);
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mlpr-btn-primary {
  background: var(--color-primary, #7c3aed);
  color: white;
  border: none;
}

.mlpr-btn-secondary {
  background: var(--color-gray-100, #f3f4f6);
  color: var(--color-gray-700, #374151);
  border: 1px solid var(--color-gray-300, #d1d5db);
}

.mlpr-btn-danger {
  background: var(--color-red-600, #dc2626);
  color: white;
  border: none;
}

/* Status Badges */
.mlpr-status {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
  border-radius: var(--radius-full, 9999px);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 500;
}

.mlpr-status-active { background: #dcfce7; color: #166534; }
.mlpr-status-completed { background: #dbeafe; color: #1e40af; }
.mlpr-status-cancelled { background: #fee2e2; color: #991b1b; }
.mlpr-status-pending { background: #fef3c7; color: #92400e; }

/* Additional styles would continue... */
```

---

## Summary

This implementation plan provides a comprehensive roadmap for building the `_manage-leases-and-payment-records` admin page. The plan:

1. **Leverages existing patterns** from `LeasesOverviewPage` and `AdminThreadsPage`
2. **Reuses components** like `PaymentRecordsTable` and `StaysTable`
3. **Extends existing Edge Functions** rather than creating new ones
4. **Follows the Hollow Component Pattern** with all logic in hooks
5. **Uses the four-layer architecture** for business logic organization
6. **Maintains compatibility** with Bubble data formats during migration

The implementation should proceed in phases, with each phase delivering testable functionality before moving to the next.

---

**Files Modified:** New file created
**Total Estimated Components:** 30+
**Total Estimated Lines of Code:** ~3,000-4,000
**Recommended Implementation Order:** Phases 1-4 first, then 5-9 in parallel
