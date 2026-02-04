# Systematic Plan: Remove Authentication from Internal Admin Pages

**Date**: 2026-01-27
**Status**: Ready for Implementation
**Priority**: High
**Reference Implementation**: Co-Host Requests Page (`/_co-host-requests`)

---

## Executive Summary

This document provides a **systematic, repeatable approach** for removing authentication requirements from internal admin pages in the Split Lease application. The approach has been successfully implemented on the Co-Host Requests page and can be applied to all other internal pages experiencing 401 Unauthorized errors.

### Problem Statement

Internal admin pages are failing with **401 Unauthorized errors** when fetching data because:
1. Edge Functions require authentication headers
2. Frontend pages don't send proper headers for unauthenticated requests
3. Some pages still have auth checks in their logic

### Solution Overview

Apply the **"Soft Headers + Service Role"** pattern:
1. **Frontend**: Always send required headers (`apikey` + `Authorization`) with anon key fallback
2. **Backend**: Make authentication optional, use service role for database access
3. **Deploy**: Test with fresh browser context to verify

---

## Target Pages (From 20260127-remove-auth-from-internal-pages.md)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Manage Virtual Meetings | `/_manage-virtual-meetings` | ❌ 401 errors | Needs both frontend + backend fixes |
| Message Curation | `/_message-curation` | ❌ 401 errors | Needs both frontend + backend fixes |
| Send Magic Login Links | `/_send-magic-login-links` | ❌ 401 errors | Needs both frontend + backend fixes |
| Manage Informational Texts | `/_manage-informational-texts` | ❌ 401 errors | Needs both frontend + backend fixes |
| Verify Users | `/_verify-users` | ❌ 401 errors | Needs both frontend + backend fixes |
| Co-Host Requests | `/_co-host-requests` | ✅ **COMPLETE** | Reference implementation |

---

## Phase 1: Frontend Pattern (Apply to ALL pages)

### 1.1 Identify the Logic Hook File

For each internal page, find the corresponding logic hook file:

```
app/src/islands/pages/<PageName>/use<PageName>PageLogic.js
```

### 1.2 Add Hardcoded Supabase Credentials

Add these constants at the top of the file (after imports):

```javascript
// Get dev project credentials from .env or hardcode for reliability
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTE2NDksImV4cCI6MjA4MzUyNzY0OX0.cSPOwU1wyiBorIicEGoyDEmoh34G0Hf_39bRXkwvCDc';
```

**Note**: The anon key above is the dev project key. For production, this would need to be environment-specific.

### 1.3 Update the `callEdgeFunction` Helper

Find the `callEdgeFunction` (or similar) helper function and update it to include both headers:

**Before:**
```javascript
async function callEdgeFunction(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/endpoint`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload }),
  });
  // ...
}
```

**After:**
```javascript
async function callEdgeFunction(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  // Build headers with optional auth (soft headers pattern)
  // For unauthenticated requests, use anon key in Authorization header
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/endpoint`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload }),
  });
  // ...
}
```

**Key Changes:**
1. Always include `apikey` header
2. Always include `Authorization` header (with token OR anon key fallback)
3. Remove conditional `if (session)` wrapper around Authorization

### 1.4 Find Edge Function Endpoint Name

Look for the SUPABASE_URL usage to identify which Edge Function the page calls:

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/<FUNCTION_NAME>`, ...);
```

Common function names:
- `co-host-requests`
- `verify-users`
- `message-curation`
- `manage-virtual-meetings`
- `send-magic-login-links`
- `manage-informational-texts`

---

## Phase 2: Backend Pattern (Apply to Edge Functions)

### 2.1 Locate the Edge Function

Find the corresponding Edge Function file:

```
supabase/functions/<function-name>/index.ts
```

### 2.2 Remove 401 Authentication Check

Find the authentication check block and remove the 401 error:

**Before:**
```typescript
// Authenticate user and verify admin status
const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
if (!user) {
  return errorResponse('Authentication required', 401);  // ❌ REMOVE THIS
}

// Create service client for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

**After:**
```typescript
// Create service client for database operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Optional authentication - soft headers pattern for internal admin page
// If auth header is present, extract user info for audit purposes
const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

if (user) {
  console.log(`[<function-name>] Authenticated user: ${user.email} (${user.id})`);
} else {
  console.log('[<function-name>] No auth header - proceeding as internal page request');
}
```

**Key Changes:**
1. Move service client creation BEFORE authentication check
2. Make authentication optional (no 401 error)
3. Add logging for audit trail
4. Keep `user` variable for potential audit logging in action handlers

### 2.3 Update Action Handlers with Nullable User

Find action handlers that accept `adminUser` parameter and make it nullable:

**Before:**
```typescript
async function handleSomeAction(
  payload: { ... },
  supabase: SupabaseClient,
  adminUser: { id: string; email: string }  // ❌ Non-nullable
) {
  // ... uses adminUser.email for logging
}
```

**After:**
```typescript
async function handleSomeAction(
  payload: { ... },
  supabase: SupabaseClient,
  adminUser: { id: string; email: string } | null  // ✅ Nullable
) {
  // ... uses adminUser?.email || 'anonymous' for logging
}
```

**Update all log statements:**
```typescript
console.log('[<function-name>] Action completed:', {
  // ...
  adminEmail: adminUser?.email || 'anonymous',  // ✅ Fallback for null
  timestamp: now,
});
```

### 2.4 Remove Admin Role Filters (If Present)

Some functions filter by admin status or other roles. Remove these filters:

**Before:**
```typescript
let query = supabase
  .from('user')
  .select('*')
  .eq('"Toggle - Is Admin"', true)  // ❌ REMOVE admin filter
  .order('Name - Full', { ascending: true });
```

**After:**
```typescript
let query = supabase
  .from('user')
  .select('*')
  .order('"Name - Full"', { ascending: true });  // ✅ No admin filter
```

### 2.5 Fix Database Column Name Issues

Watch for column name errors in logs. Common issues:

1. **ORDER BY with spaces**: Use quoted column names
   ```typescript
   .order('"Name - Full"', { ascending: true })  // ✅ Quotes around column with spaces
   ```

2. **SELECT with spaces**: Already quoted in most cases
   ```typescript
   .select('_id, email, "Name - Full", "Profile Photo"')  // ✅ Correct
   ```

3. **Client-side filtering for search**: If `.or()` filter fails with column names, move filtering client-side:
   ```typescript
   // Fetch all data first
   const { data, error } = await query;

   // Then filter client-side to avoid column name escaping issues
   let users = data || [];
   if (searchText) {
     const searchLower = searchText.toLowerCase();
     users = users.filter(user =>
       (user.email || '').toLowerCase().includes(searchLower) ||
       ((user['Name - Full'] || '')).toLowerCase().includes(searchLower)
     );
   }
   ```

---

## Phase 3: Create Deno.json (If Missing)

### 3.1 Check if deno.json Exists

```bash
ls supabase/functions/<function-name>/deno.json
```

### 3.2 Create if Missing

If the file doesn't exist, create it:

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

Save as: `supabase/functions/<function-name>/deno.json`

---

## Phase 4: Deploy and Test

### 4.1 Deploy the Edge Function

```bash
# From project root
cd "<path-to-Split-Lease>"
npx supabase functions deploy <function-name> --project-ref qzsmhgyojmwvtjmnrdea
```

**Note**: Use the correct project reference:
- Dev: `qzsmhgyojmwvtjmnrdea` (or check `.env` file)
- Live: `qcfifybkaddcoimjroca` (production - use with caution)

### 4.2 Test with Fresh Browser Context

Using Playwright MCP or manually:

1. **Open incognito/private browser window**
2. **Navigate to the internal page**
3. **Check browser console** - should have NO 401 errors
4. **Verify data loads** - requests should be displayed
5. **Test actions** - buttons, modals, forms should work
6. **Test search/filter** - if applicable

### 4.3 Expected Results

✅ **Success Indicators:**
- Page loads without 401 errors
- Data displays correctly
- Actions work (modals open, forms submit)
- Console shows: `[<function-name>] No auth header - proceeding as internal page request`

❌ **Failure Indicators:**
- 401 Unauthorized errors in console
- "Request failed" messages
- Empty data displays
- Modals won't open

---

## Quick Reference Checklist

### For Each Internal Page:

- [ ] **Frontend**: Update `callEdgeFunction` with `apikey` + `Authorization` headers
- [ ] **Frontend**: Add hardcoded `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- [ ] **Backend**: Remove 401 authentication check
- [ ] **Backend**: Make `adminUser` parameter nullable (`| null`)
- [ ] **Backend**: Add fallback for audit logging (`|| 'anonymous'`)
- [ ] **Backend**: Remove admin role filters (if present)
- [ ] **Backend**: Fix database column name issues (ORDER BY, SELECT)
- [ ] **Create**: `deno.json` file if missing
- [ ] **Deploy**: Edge Function to correct Supabase project
- [ ] **Test**: With fresh browser context
- [ ] **Verify**: No 401 errors, data loads correctly
- [ ] **Commit**: Changes to git

---

## Common Errors and Solutions

### Error: `401 Unauthorized`

**Cause**: Edge Function still requires authentication

**Solution**:
1. Check that frontend sends both `apikey` and `Authorization` headers
2. Check that Edge Function doesn't have `if (!user) return 401` check
3. Re-deploy Edge Function after changes

### Error: `column user.Name-Full does not exist`

**Cause**: Column name not properly quoted in ORDER BY

**Solution**:
```typescript
.order('"Name - Full"', { ascending: true })  // Add quotes
```

### Error: `Failed to get co-hosts: column user.Toggle-Is Admin does not exist`

**Cause**: Admin filter references non-existent column

**Solution**: Remove the `.eq('"Toggle - Is Admin"', true)` filter

### Error: Wrong project (401 on correct credentials)

**Cause**: Deployed to wrong Supabase project

**Solution**:
1. Check `.env` file for `VITE_SUPABASE_URL`
2. Extract project ID from URL (e.g., `https://<project-id>.supabase.co`)
3. Deploy with `--project-ref <project-id>`

---

## File Change Templates

### Frontend Template

**File**: `app/src/islands/pages/<PageName>/use<PageName>PageLogic.js`

```javascript
// ADD AT TOP (after imports):
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTE2NDksImV4cCI6MjA4MzUyNzY0OX0.cSPOwU1wyiBorIicEGoyDEmoh34G0Hf_39bRXkwvCDc';

// FIND AND REPLACE callEdgeFunction:
async function callEdgeFunction(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/<FUNCTION_NAME>`, {
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

### Backend Template

**File**: `supabase/functions/<function-name>/index.ts`

```typescript
// FIND AND REPLACE AUTHENTICATION SECTION:
// BEFORE:
// const user = await authenticateFromHeaders(...);
// if (!user) {
//   return errorResponse('Authentication required', 401);
// }
// const supabase = createClient(...);

// AFTER:
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

if (user) {
  console.log(`[${function-name}] Authenticated user: ${user.email} (${user.id})`);
} else {
  console.log(`[${function-name}] No auth header - proceeding as internal page request`);
}

// FIND AND UPDATE ACTION HANDLERS:
// Change: adminUser: { id: string; email: string }
// To: adminUser: { id: string; email: string } | null

// UPDATE LOGGING:
// adminEmail: adminUser?.email || 'anonymous'
```

---

## Reference Implementation

**Completed Page**: Co-Host Requests (`/_co-host-requests`)

**Files Modified**:
1. [`app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js`](app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js)
2. [`supabase/functions/co-host-requests/index.ts`](supabase/functions/co-host-requests/index.ts)
3. [`supabase/functions/co-host-requests/deno.json`](supabase/functions/co-host-requests/deno.json)

**Git Commits**:
- `99a8eb7d` - Fix: make co-host-requests Edge Function compatible with optional auth
- `40906cbe` - Fix: remove admin filter from co-host assignment
- `4829a112` - Fix: use client-side filtering for co-host search
- `a7594cf6` - Fix: correct user table column names in co-host-requests Edge Function

**Test Results**:
- ✅ Page loads without 401 errors
- ✅ 27 co-host requests displayed
- ✅ Assign Co-Host modal works with 20+ users
- ✅ Search functionality works
- ✅ No console errors

---

## Implementation Priority Order

Based on the 20260127-remove-auth-from-internal-pages.md analysis, implement in this order:

1. **Verify Users** (`/_verify-users`) - High impact, user verification critical
2. **Manage Virtual Meetings** (`/_manage-virtual-meetings`) - High usage page
3. **Message Curation** (`/_message-curation`) - Important for messaging
4. **Send Magic Login Links** (`/_send-magic-login-links`) - Admin tool
5. **Manage Informational Texts** (`/_manage-informational-texts`) - Content management

---

## Notes

- **Always test with fresh browser context** to avoid cached authentication
- **Check the .env file** for correct Supabase project URL
- **Deploy to the correct project** - dev vs live
- **Commit after each page** to maintain clean git history
- **Document any deviations** from this pattern in page-specific notes

---

**Version**: 1.0
**Last Updated**: 2026-01-27
**Status**: Ready for Implementation
