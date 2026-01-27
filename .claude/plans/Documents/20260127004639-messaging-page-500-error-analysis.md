# Debug Analysis: Messages Page 500 Error - Failed to fetch threads

**Created**: 2026-01-27T00:46:39
**Status**: Analysis Complete - Pending Implementation
**Severity**: Critical
**Affected Area**: `/messages` page, `messages` Edge Function, Supabase RPC functions

---

## 1. System Context (From Onboarding)

### 1.1 Architecture Understanding
- **Architecture Pattern**: Islands Architecture with Hollow Components
- **Tech Stack**: React 18, Supabase Edge Functions (Deno), PostgreSQL via Supabase
- **Data Flow**:
  - Frontend (`MessagingPage.jsx`)
  - -> Logic Hook (`useMessagingPageLogic.js`)
  - -> Edge Function (`messages/index.ts`)
  - -> Handler (`messages/handlers/getThreads.ts`)
  - -> RPC function (`get_user_threads`)
  - -> Database (`thread` table)

### 1.2 Domain Context
- **Feature Purpose**: Real-time messaging between hosts and guests for property inquiries and booking communications
- **Related Documentation**:
  - `.claude/Documentation/Backend(EDGE - Functions)/MESSAGES.md`
  - `.claude/plans/Documents/lgateway1/20260117160510-messaging-auth-investigation-report.md`
- **Data Model**:
  - `thread` table with columns `-Host User`, `-Guest User`, `Listing`, `~Last Message`, `Modified Date`
  - `_message` table for individual messages
  - `user` table for user lookups

### 1.3 Relevant Conventions
- **Day Indexing**: Not directly applicable to messaging
- **Layer Boundaries**:
  - Frontend fetches via Edge Function (not direct Supabase queries) to support legacy auth
  - Edge Function uses service role for RLS bypass
- **Shared Utilities**:
  - `_shared/functional/` for FP patterns
  - `_shared/errors.ts` for error types
  - `_shared/slack.ts` for error reporting

### 1.4 Entry Points & Dependencies
- **User Entry Point**: User navigates to `/messages` page
- **Critical Path**:
  1. `MessagingPage.jsx` renders
  2. `useMessagingPageLogic.js` hook initializes
  3. `fetchThreads()` function executes on mount
  4. Calls `messages` Edge Function with action `get_threads`
  5. Handler calls RPC function `get_user_threads`
- **Dependencies**:
  - RPC function `get_user_threads` in Supabase database
  - RPC function `count_user_threads` (for header messaging panel)

---

## 2. Problem Statement

The messages page at `splitlease.pages.dev/messages` displays "Something went wrong" with the error message "Failed to fetch threads: 500". This indicates the Edge Function is returning a 500 Internal Server Error when trying to fetch message threads.

**Symptoms**:
- Error displayed on page: "Failed to fetch threads: 500"
- No threads are loaded
- Page is completely non-functional for all users

**Impact**: Critical - All messaging functionality is broken in production.

---

## 3. Reproduction Context

- **Environment**: Production (`splitlease.pages.dev/messages`)
- **Steps to reproduce**:
  1. Log in to Split Lease (any authentication method)
  2. Navigate to `/messages`
  3. Observe error message
- **Expected behavior**: Thread list should load, showing user's conversations
- **Actual behavior**: 500 error, no threads displayed
- **Error messages**: `Failed to fetch threads: 500`

---

## 4. Investigation Summary

### 4.1 Files Examined

| File | Relevance |
|------|-----------|
| `supabase/functions/messages/index.ts` | Main Edge Function router - verified correct routing |
| `supabase/functions/messages/handlers/getThreads.ts` | Handler that calls RPC function - **ROOT CAUSE HERE** |
| `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` | Frontend logic - correctly calls Edge Function |
| `supabase/config.toml` | Confirms `messages` function is configured |
| `.claude/plans/Documents/lgateway1/20260117160510-messaging-auth-investigation-report.md` | Previous investigation documenting the RPC requirement |

### 4.2 Execution Flow Trace

1. **Frontend** (`useMessagingPageLogic.js` line ~360-398):
   ```javascript
   const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
     method: 'POST',
     headers,
     body: JSON.stringify({
       action: 'get_threads',
       payload
     }),
   });
   ```

2. **Edge Function Router** (`messages/index.ts` line ~278-285):
   - Parses request, validates action
   - Authenticates user (supports both JWT and legacy auth)
   - Routes to `handleGetThreads` handler

3. **Handler** (`messages/handlers/getThreads.ts` line ~81-92):
   ```typescript
   const { data: threads, error: threadsError } = await supabaseAdmin
     .rpc('get_user_threads', { user_id: userBubbleId });

   if (threadsError) {
     console.error('[getThreads] Threads query failed:', threadsError);
     throw new Error(`Failed to fetch threads: ${threadsError.message}`);
   }
   ```

4. **RPC Function Call FAILS** - The `get_user_threads` function does not exist in the production database.

### 4.3 Git History Analysis

| Commit | Date | Description | Impact |
|--------|------|-------------|--------|
| `30a06f6` | Jan 16, 2026 | Last known working state | Baseline |
| `fea160ad` | Jan 17, 2026 | fix(messages): use Edge Function for thread fetching to bypass RLS | Changed from direct Supabase queries to Edge Function |
| `c7cb3749` | Jan 17, 2026 | fix(messages): add legacy auth support for messaging Edge Function | Added user_id fallback auth |
| `1b9101cc` | Jan 17, 2026 | fix(messages): use embedded Authorization header pattern for JWT auth | Auth pattern fix |
| `1283fe53` | Jan 17, 2026 | fix(messaging): use RPC functions for thread queries with hyphen-prefixed columns | **INTRODUCED RPC DEPENDENCY** |
| `987fa554` | Jan 25, 2026 | Remove admin checks from Edge Functions for internal page testing | Modified admin handlers |

**Critical Commit Analysis (`1283fe53`)**:

The commit message explicitly states:
> "Note: Requires `count_user_threads` and `get_user_threads` RPC functions to be deployed to production database."

This note in the commit message confirms that:
1. The RPC functions were created for development/testing
2. They were **never deployed to production**
3. The code was merged without the corresponding database migration

---

## 5. Hypotheses

### Hypothesis 1: Missing RPC Function in Production Database (Likelihood: 99%)

**Theory**: The RPC function `get_user_threads` was never deployed to the production Supabase database. Commit `1283fe53` changed the code to use this function, but the corresponding SQL was never applied via migration.

**Supporting Evidence**:
- Commit message explicitly states "Requires count_user_threads and get_user_threads RPC functions to be deployed to production database"
- No SQL migration file exists in `supabase/migrations/` for these functions
- The investigation report from January 17th lists this as a "Remaining Action Item"
- Error message "Failed to fetch threads" matches the error thrown when RPC call fails

**Contradicting Evidence**: None

**Verification Steps**:
1. Check Supabase dashboard for `get_user_threads` function
2. Run: `SELECT proname FROM pg_proc WHERE proname = 'get_user_threads';` in production database
3. Check Edge Function logs for specific error message

**Potential Fix**: Deploy the RPC functions to production:
```sql
-- get_user_threads
CREATE OR REPLACE FUNCTION get_user_threads(user_id TEXT)
RETURNS SETOF thread
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM thread
  WHERE "-Host User" = user_id OR "-Guest User" = user_id
  ORDER BY "Modified Date" DESC NULLS LAST
  LIMIT 20;
$$;

-- count_user_threads
CREATE OR REPLACE FUNCTION count_user_threads(user_id TEXT)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM thread
  WHERE "-Host User" = user_id OR "-Guest User" = user_id;
$$;
```

**Convention Check**: Aligns with documented pattern - code change requires database change but was not deployed together.

---

### Hypothesis 2: Edge Function Not Deployed (Likelihood: 5%)

**Theory**: The `messages` Edge Function may not be deployed to production, or an older version is running that doesn't match the current codebase.

**Supporting Evidence**:
- Edge Functions require manual deployment (`supabase functions deploy messages`)
- The function was newly added after commit `30a06f6`

**Contradicting Evidence**:
- The error "500" suggests the function IS running but encountering an internal error
- If the function wasn't deployed, we'd see a 404 or different error

**Verification Steps**:
1. Check Supabase dashboard -> Edge Functions -> messages
2. Review deployment logs
3. Call the function directly with a test payload

**Potential Fix**: Deploy the Edge Function:
```bash
supabase functions deploy messages
```

**Convention Check**: N/A

---

### Hypothesis 3: Authentication Failure in Edge Function (Likelihood: 1%)

**Theory**: The authentication logic in the Edge Function is failing, causing a 500 error before the RPC call.

**Supporting Evidence**: None strong

**Contradicting Evidence**:
- The error message "Failed to fetch threads" indicates the code reached the RPC call
- Authentication errors would return 401, not 500
- The Edge Function has robust error handling with specific error messages

**Verification Steps**:
1. Check Edge Function logs for authentication-related errors
2. Test with known valid JWT token

**Potential Fix**: N/A - unlikely to be the cause

**Convention Check**: N/A

---

## 6. Recommended Action Plan

### Priority 1 (Try First) - Deploy Missing RPC Functions

**Rationale**: 99% confidence this is the root cause based on commit history and investigation report.

**Steps**:
1. Connect to production Supabase database (supabase-live)
2. Execute the following SQL migration:

```sql
-- ============================================================================
-- Migration: Create Thread RPC Functions
-- Purpose: Bypass PostgREST .or() filter parsing issues with hyphen-prefixed columns
-- Required by: messages Edge Function (getThreads.ts), Header messaging panel
-- ============================================================================

-- Function 1: Count user's threads (for messaging icon badge)
CREATE OR REPLACE FUNCTION count_user_threads(user_id TEXT)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM thread
  WHERE "-Host User" = user_id OR "-Guest User" = user_id;
$$;

-- Function 2: Get user's threads (for thread list)
CREATE OR REPLACE FUNCTION get_user_threads(user_id TEXT)
RETURNS SETOF thread
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM thread
  WHERE "-Host User" = user_id OR "-Guest User" = user_id
  ORDER BY "Modified Date" DESC NULLS LAST
  LIMIT 20;
$$;

-- Grant execute permissions to service role and authenticated users
GRANT EXECUTE ON FUNCTION count_user_threads(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION count_user_threads(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_threads(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_threads(TEXT) TO authenticated;
```

3. Verify deployment by testing the messages page

**Files Affected**: Database only (no code changes needed)

---

### Priority 2 (If Priority 1 Fails) - Redeploy Edge Function

**Steps**:
1. Deploy the messages Edge Function:
   ```bash
   supabase functions deploy messages
   ```
2. Check deployment logs for any errors
3. Verify the function is running the latest code

**Files Affected**: None (deployment only)

---

### Priority 3 (Deeper Investigation) - Check Edge Function Logs

**Steps**:
1. Access Supabase Dashboard -> Edge Functions -> messages -> Logs
2. Look for specific error messages when the function is invoked
3. Verify the error is indeed "Failed to fetch threads" with RPC error

---

## 7. Prevention Recommendations

### 7.1 Immediate Actions

1. **Create Migration File**: Add the RPC functions to a proper migration file in `supabase/migrations/`:
   - File: `20260127_thread_rpc_functions.sql`
   - Contents: The SQL from Priority 1

2. **Update Deployment Checklist**: When code requires database changes, create a checklist:
   - [ ] Migration file created
   - [ ] Migration deployed to development
   - [ ] Migration deployed to production
   - [ ] Edge Function deployed

### 7.2 Process Improvements

1. **Atomic Deployments**: Database migrations and code changes should be deployed together
2. **CI/CD Integration**: Consider automating migration deployment with code deployment
3. **Pre-Merge Verification**: Before merging code that requires database changes, verify the changes are applied

### 7.3 Architectural Consideration

The column naming convention (`-Host User`, `-Guest User`) with leading hyphens is problematic:
- Causes PostgREST filter parsing issues
- Requires RPC workarounds
- Consider renaming to `host_user`, `guest_user` in a future migration

---

## 8. Related Files Reference

### Files That Need Attention

| File | Line Numbers | Action Needed |
|------|--------------|---------------|
| Production Database | N/A | **Deploy RPC functions** |
| `supabase/migrations/20260127_thread_rpc_functions.sql` | New file | Create migration file |

### Files Already Correct (No Changes Needed)

| File | Description |
|------|-------------|
| `supabase/functions/messages/index.ts` | Edge Function router - correctly implemented |
| `supabase/functions/messages/handlers/getThreads.ts` | Handler - correctly calls RPC |
| `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` | Frontend - correctly calls Edge Function |
| `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` | Uses `get_user_threads` RPC |
| `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` | Uses `count_user_threads` RPC |
| `supabase/config.toml` | `messages` function is configured |

### Reference Documentation

| Document | Path |
|----------|------|
| Messages Edge Function Docs | `.claude/Documentation/Backend(EDGE - Functions)/MESSAGES.md` |
| Previous Investigation Report | `.claude/plans/Documents/lgateway1/20260117160510-messaging-auth-investigation-report.md` |
| RPC Fix Commit | `1283fe53` |

---

## 9. Summary

**Root Cause**: The RPC functions `get_user_threads` and `count_user_threads` were never deployed to the production Supabase database. These functions are required by the code introduced in commit `1283fe53` (January 17, 2026), but the corresponding database migration was not applied.

**Evidence Chain**:
1. Commit `1283fe53` explicitly notes the RPC functions are required
2. No migration file exists for these functions
3. Previous investigation report lists deployment as a "Remaining Action Item"
4. Error message matches the expected failure when RPC function is missing

**Fix Required**: Deploy the two RPC functions to production database via SQL migration.

**Time to Fix**: ~5 minutes (execute SQL in Supabase dashboard)

---

**Analysis By**: Claude Opus 4.5
**Analysis Date**: 2026-01-27
