# Iteration 22: Cleanup Old Auth Patterns

**Purpose**: Remove remaining legacy authentication patterns from internal pages to ensure clean state before implementing modern auth next week.

**Context**: Authentication was intentionally removed for flexible modernization. This document identifies pages that still have remnants of the old auth patterns that should be cleaned up.

---

## Pages Requiring Cleanup

### Category 1: Pages with Partial Auth Checks (Need Removal)

These pages still call `checkAuthStatus()` but don't enforce it properly. Clean them up to be consistent with the no-auth modernization approach.

#### 1. `/_ai-tools`

**File**: `app/src/islands/pages/AiToolsPage/useAiToolsPageLogic.js`

**Current Code** (lines 194-218):
```javascript
try {
  // Step 1: Check auth status
  const isAuthenticated = await checkAuthStatus();

  if (!isAuthenticated) {
    setError('Please log in to access AI Tools');
    setLoading(false);
    setTimeout(() => {
      window.location.href = '/?login=true';
    }, 2000);
    return;
  }

  // Step 2: Validate user and check admin status
  const userData = await validateTokenAndFetchUser({ clearOnFailure: false });

  if (!userData) {
    setError('Unable to verify user. Please log in again.');
    setLoading(false);
    return;
  }

  // NOTE: Admin check removed - any authenticated user can access for testing
  const isUserAdmin = true;

  setUser({
    // ... user data
  });
}
```

**Code to Replace With**:
```javascript
try {
  // Auth removed for modernization - to be re-implemented next week
  setUser({
    authenticated: false,
    email: null,
    isAdmin: false,
  });

  // Continue loading page data without auth check
  await loadPageData();
}
```

**Lines to Delete**: 194-218
**Lines to Add**: New simplified version (8 lines)

---

#### 2. `/_create-document`

**File**: `app/src/islands/pages/CreateDocumentPage/useCreateDocumentPageLogic.js`

**Current Code** (lines 82-90):
```javascript
// Uses checkAuthStatus() which supports both Supabase Auth and legacy token auth
useEffect(() => {
  const initializeAuth = async () => {
    try {
      // checkAuthStatus handles both Supabase Auth and legacy token auth
      const isAuthenticated = await checkAuthStatus();

      if (!isAuthenticated) {
        // Handle not authenticated
      }
    }
  }
})
```

**Code to Replace With**:
```javascript
// Auth removed for modernization - to be re-implemented next week
useEffect(() => {
  const initializePage = async () => {
    try {
      // Skip auth check
      setLoading(false);
      await loadDocumentTypes();
    } catch (err) {
      console.error('[CreateDocument] Init failed:', err);
      setError(err.message);
    }
  };

  initializePage();
}, []);
```

**Lines to Delete**: 82-90 (auth check section)
**Lines to Add**: Simplified initialization

---

#### 3. `/_usability-data-management`

**File**: `app/src/islands/pages/UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js`

**Current Code** (line 119):
```javascript
const isLoggedIn = await checkAuthStatus();
if (!isLoggedIn) {
  // redirect or error
}
```

**Code to Replace With**:
```javascript
// Auth removed for modernization - to be re-implemented next week
// Skip auth check and proceed with data load
```

**Lines to Delete**: 119-125 (auth check block)
**Lines to Add**: Comment only

---

### Category 2: Pages Already Cleaned (No Action Needed)

These pages have already been properly cleaned to skip auth:

✅ `/_admin-threads` - Line 166: `setAuthState('authorized')`
✅ `/_experience-responses` - No auth enforcement
✅ `/_emergency` - Line 49: "no auth redirect for internal pages"
✅ `/_leases-overview` - No auth enforcement
✅ `/_listings-overview` - Lines 141-146: Hardcoded authorized state
✅ `/_manage-rental-applications` - No auth enforcement
✅ `/_manage-virtual-meetings` - No auth enforcement
✅ `/_proposal-manage` - No auth enforcement
✅ `/_quick-price` - Lines 132-154: Optional auth (doesn't redirect)

---

### Category 3: Unknown Status (Audit Needed)

These pages need to be checked for old auth patterns:

⚠️ `/_co-host-requests`
⚠️ `/_create-suggested-proposal`
⚠️ `/_email-sms-unit`
⚠️ `/_guest-relationships`
⚠️ `/_guest-simulation`
⚠️ `/_manage-informational-texts`
⚠️ `/_message-curation`
⚠️ `/_modify-listings`
⚠️ `/_send-magic-login-links`
⚠️ `/_simulation-admin`
⚠️ `/_verify-users`

**Action Required**: Scan these files for:
- `checkAuthStatus()`
- `validateTokenAndFetchUser()`
- Auth-related `useEffect` blocks
- Redirect logic to login pages

**Search Command**:
```bash
# Run from project root
grep -n "checkAuthStatus\|validateTokenAndFetchUser" app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js
grep -n "checkAuthStatus\|validateTokenAndFetchUser" app/src/islands/pages/GuestRelationshipsDashboard/useGuestRelationshipsDashboardLogic.js
# ... repeat for all files
```

---

## Cleanup Checklist

### Step 1: Remove Partial Auth from Known Pages (30 min)

- [ ] Remove auth check from `AiToolsPage/useAiToolsPageLogic.js` (lines 194-218)
- [ ] Remove auth check from `CreateDocumentPage/useCreateDocumentPageLogic.js` (lines 82-90)
- [ ] Remove auth check from `UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js` (line 119)

### Step 2: Audit Unknown Pages (1 hour)

- [ ] Scan all 11 unknown pages for auth patterns
- [ ] Document any found patterns
- [ ] Remove them using same pattern as Step 1

### Step 3: Remove Auth Imports (15 min)

After removing all auth checks, clean up unused imports:

```bash
# Search for unused imports
grep -n "import.*checkAuthStatus" app/src/islands/pages/**/*Logic.js
grep -n "import.*validateTokenAndFetchUser" app/src/islands/pages/**/*Logic.js
```

**Files to Update** (remove unused imports):
- `AiToolsPage/useAiToolsPageLogic.js` - Line 15
- `CreateDocumentPage/useCreateDocumentPageLogic.js` - Import line
- `UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js` - Line 9

**Before**:
```javascript
import { checkAuthStatus, validateTokenAndFetchUser } from '../../../lib/auth.js';
```

**After**:
```javascript
// Auth imports removed - modernization in progress
```

### Step 4: Update Routes Config (5 min)

Verify all internal routes have `protected: false` in `app/src/routes.config.js`:

```javascript
// Lines 393-686 - All internal pages should have:
{
  path: '/_internal-page',
  file: 'internal-page.html',
  protected: false,  // ✅ Correct for modernization phase
  // ...
}
```

**Verification Command**:
```bash
# Should return 0 matches (all should be false)
grep -n "path: '/_.*protected: true" app/src/routes.config.js
```

---

## Testing After Cleanup

### Test 1: Verify No Auth Redirects

```javascript
// Manual test in browser console on each internal page:
console.log('Testing no-auth access...');

// 1. Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// 2. Clear localStorage
localStorage.clear();
sessionStorage.clear();

// 3. Reload page
location.reload();

// Expected: Page loads without redirect to login
```

### Test 2: Verify No Console Errors

After cleanup, check for auth-related errors:

```bash
# Should return 0 matches
grep -r "checkAuthStatus is not defined" app/src/islands/pages/
grep -r "validateTokenAndFetchUser is not defined" app/src/islands/pages/
```

---

## Summary

**Total Pages**: 24 internal pages
**Already Clean**: 9 pages
**Need Cleanup**: 3 pages (ai-tools, create-document, usability-data-management)
**Need Audit**: 11 pages (status unknown)
**Estimated Time**: 2-3 hours

**Ready for Modernization**: Once cleanup complete, all internal pages will have consistent no-auth state, ready for modern auth implementation next week.

---

**Next Document**: `IT22_MODERN_AUTH_IMPLEMENTATION.md` - Contains the auth system to implement after modernization.
