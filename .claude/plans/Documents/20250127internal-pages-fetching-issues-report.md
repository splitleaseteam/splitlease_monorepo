# Internal Pages Data Fetching Issues - Systematic Fix Report

**Date:** 2025-01-27
**Issue:** Internal pages failing to fetch data due to missing `apikey` header
**Status:** Analysis Complete

---

## Executive Summary

Most internal pages in the Split Lease application are failing to fetch data because their Edge Function calls are missing the required `apikey` header. This is a systematic issue affecting approximately 10+ internal pages. Only 2 pages (CoHostRequestsPage and ViewSplitLeasePage_LEGACY) have the correct pattern implemented.

---

## Root Cause Analysis

### The Problem

Supabase Edge Functions require the `apikey` header for all requests (both authenticated and unauthenticated). Without this header, the Edge Function rejects the request with a 401/403 error, even when the Edge Function is configured with auth-optional settings.

### Working Pattern (✅ CORRECT)

From [CoHostRequestsPage/useCoHostRequestsPageLogic.js](../../app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js:121-125):

```javascript
const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,  // REQUIRED
  'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
};
```

**Key points:**
1. `apikey` header is always present (using SUPABASE_ANON_KEY constant)
2. `Authorization` header uses session token if available, otherwise falls back to anon key
3. This is the "soft headers" pattern for auth-optional internal pages

### Broken Pattern (❌ INCORRECT)

From most other internal pages (example from [useVerifyUsersPageLogic.js](../../app/src/islands/pages/useVerifyUsersPageLogic.js:122-125)):

```javascript
const headers = { 'Content-Type': 'application/json' };
if (session?.access_token) {
  headers.Authorization = `Bearer ${session.access_token}`;
}
// MISSING: 'apikey' header!
```

**Why this fails:**
- Supabase Edge Functions require `apikey` header even for public/auth-optional endpoints
- Without it, the request is rejected before reaching the function logic
- The `Authorization` header alone is insufficient

---

## Affected Pages Inventory

### Pages WITH `apikey` Header (Working) ✅

| Page | Path | Edge Function | Status |
|------|------|---------------|--------|
| Co-Host Requests | `/_co-host-requests` | `co-host-requests` | ✅ FIXED (recently) |
| View Split Lease (Legacy) | `/view-split-lease` | N/A | ✅ WORKING |

### Pages WITHOUT `apikey` Header (Broken) ❌

| Page | Path | Edge Function | Logic File |
|------|------|---------------|------------|
| Verify Users | `/_verify-users` | `verify-users` | [useVerifyUsersPageLogic.js](../../app/src/islands/pages/useVerifyUsersPageLogic.js) |
| Message Curation | `/_message-curation` | `message-curation` | [useMessageCurationPageLogic.js](../../app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js) |
| Manage Virtual Meetings | `/_manage-virtual-meetings` | `virtual-meeting` | [useManageVirtualMeetingsPageLogic.js](../../app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js) |
| Send Magic Login Links | `/_send-magic-login-links` | `magic-login-links` | [useSendMagicLoginLinksPageLogic.js](../../app/src/islands/pages/SendMagicLoginLinksPage/useSendMagicLoginLinksPageLogic.js) |
| Admin Threads | `/_admin-threads` | `admin-threads` | [useAdminThreadsPageLogic.js](../../app/src/islands/pages/AdminThreadsPage/useAdminThreadsPageLogic.js) |
| Create Document | `/_create-document` | `create-document` | [useCreateDocumentPageLogic.js](../../app/src/islands/pages/CreateDocumentPage/useCreateDocumentPageLogic.js) |
| Leases Overview | `/_leases-overview` | `leases-overview` | [useLeasesOverviewPageLogic.js](../../app/src/islands/pages/LeasesOverviewPage/useLeasesOverviewPageLogic.js) |
| Manage Informational Texts | `/_manage-informational-texts` | `manage-informational-texts` | [useManageInformationalTextsPageLogic.js](../../app/src/islands/pages/ManageInformationalTextsPage/useManageInformationalTextsPageLogic.js) |
| Manage Rental Applications | `/_manage-rental-applications` | `manage-rental-applications` | [useManageRentalApplicationsPageLogic.js](../../app/src/islands/pages/ManageRentalApplicationsPage/useManageRentalApplicationsPageLogic.js) |
| Quick Price | `/_quick-price` | `quick-price` | [useQuickPricePageLogic.js](../../app/src/islands/pages/QuickPricePage/useQuickPricePageLogic.js) |
| Simulation Admin | `/_simulation-admin` | `simulation-admin` | [useSimulationAdminPageLogic.js](../../app/src/islands/pages/SimulationAdminPage/useSimulationAdminPageLogic.js) |

### Pages Using Service Layer (Separate Pattern)

| Page | Path | Service | Status |
|------|------|---------|--------|
| Internal Emergency | `/_emergency` | [emergencyService.js](../../app/src/lib/emergencyService.js) | Needs investigation |

---

## Systematic Fix Strategy

### Option 1: Centralized API Caller (Recommended)

Create a shared utility function for Edge Function calls with correct headers:

**File:** `app/src/lib/edgeFunctionClient.js`

```javascript
import { supabase } from './supabase.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call a Supabase Edge Function with proper headers
 * Soft headers: auth is optional for internal pages
 *
 * @param {string} functionName - Edge Function name
 * @param {string} action - Action identifier
 * @param {Object} payload - Request payload
 * @returns {Promise<any>} Response data
 */
export async function callEdgeFunction(functionName, action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data;
}
```

**Benefits:**
- Single source of truth for Edge Function calling
- Consistent headers across all pages
- Easy to update if pattern changes
- Reduces code duplication

### Option 2: Individual File Fixes

Fix each page's `callEdgeFunction` function individually to add the `apikey` header.

**Template change for each file:**

```javascript
// BEFORE (Broken)
const headers = { 'Content-Type': 'application/json' };
if (session?.access_token) {
  headers.Authorization = `Bearer ${session.access_token}`;
}

// AFTER (Fixed)
const headers = {
  'Content-Type': 'application/json',
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
};
```

---

## Implementation Priority

### High Priority (Core Admin Functions)
1. `useVerifyUsersPageLogic.js` - User verification
2. `useMessageCurationPageLogic.js` - Message moderation
3. `useAdminThreadsPageLogic.js` - Thread management

### Medium Priority (Operational Tools)
4. `useManageVirtualMeetingsPageLogic.js` - Meeting management
5. `useSendMagicLoginLinksPageLogic.js` - Magic links
6. `useManageInformationalTextsPageLogic.js` - Content management

### Lower Priority (Reporting/Analysis)
7. `useLeasesOverviewPageLogic.js`
8. `useManageRentalApplicationsPageLogic.js`
9. `useQuickPricePageLogic.js`
10. `useSimulationAdminPageLogic.js`

---

## Testing Checklist

After fixing each page:

- [ ] Page loads without errors
- [ ] Data fetches successfully (check Network tab)
- [ ] Requests include `apikey` header
- [ ] Unauthenticated requests work (if applicable)
- [ ] Authenticated requests work (if applicable)
- [ ] Error handling displays properly
- [ ] Pagination/filtering works

---

## Additional Notes

### Special Cases

1. **InternalEmergencyPage** - Uses a service layer (`emergencyService.js`) instead of direct Edge Function calls. This service layer should also be audited for the `apikey` header.

2. **SUPABASE_ANON_KEY Constant** - CoHostRequestsPage hardcodes the anon key constant at the top of the file. The recommended approach is to use `import.meta.env.VITE_SUPABASE_ANON_KEY` from the environment.

3. **Service Layer Pattern** - Some pages may use service layers in `app/src/lib/` for data fetching. These services should also follow the same header pattern.

---

## References

- CoHostRequestsPage fix example: [app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js](../../app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js)
- Supabase Edge Functions auth: https://supabase.com/docs/guides/functions/auth
- Navigation config: [app/src/islands/shared/AdminHeader/config/navigationConfig.js](../../app/src/islands/shared/AdminHeader/config/navigationConfig.js)

---

## Next Steps

1. Choose fix approach (Option 1: Centralized or Option 2: Individual)
2. Implement fixes for high-priority pages
3. Test each page thoroughly
4. Verify service layer functions (if any)
5. Document any edge cases discovered during implementation
