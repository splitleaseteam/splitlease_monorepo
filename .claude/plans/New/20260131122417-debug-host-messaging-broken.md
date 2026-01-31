# Debug Analysis: Host Message Sending Not Working

**Date**: 2026-01-31
**Status**: Investigation Complete
**Classification**: DEBUG
**Priority**: High

---

## Problem Statement

The user reports that message sending by hosts is not working. Console logs show:
1. `effectiveThreadsCount: 0` with `shouldShowMessagingIcon: false`
2. Realtime subscription `CHANNEL_ERROR` status
3. 400 Bad Request errors for some database tables

The user is logged in as "fred" with `userType: "Guest"` - this appears to be a test scenario where the user type is Guest, but the issue may affect hosts as well.

---

## Files Investigated

### Frontend Components
1. **`app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx`** - Header messaging panel component
2. **`app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`** - Logic hook for header messaging
3. **`app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`** - Avatar component that shows messaging icon
4. **`app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`** - Data hook that fetches thread counts
5. **`app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`** - Main messaging page logic

### Backend Edge Functions
6. **`supabase/functions/messages/index.ts`** - Messages edge function entry point
7. **`supabase/functions/messages/handlers/sendMessage.ts`** - Send message handler
8. **`supabase/functions/messages/handlers/getThreads.ts`** - Get threads handler
9. **`supabase/functions/messages/handlers/getMessages.ts`** - Get messages handler
10. **`supabase/functions/_shared/messagingHelpers.ts`** - Messaging helper utilities

### Database Migrations
11. **`supabase/migrations/20260128040000_create_count_user_threads_function.sql`** - count_user_threads RPC
12. **`supabase/migrations/20260128060000_fix_rls_policies_for_new_users.sql`** - RLS policy fixes
13. **`supabase/migrations/20260130141623_message_trigger_fix_production.sql`** - Message trigger fixes

---

## Root Cause Analysis

### Issue 1: `effectiveThreadsCount: 0` - Why the messaging icon is hidden

**Location**: `useLoggedInAvatarData.js` (lines 254-257)

The hook fetches thread count using an RPC function:
```javascript
// 11. Count message threads where user is a participant (host or guest)
supabase.rpc('count_user_threads', { user_id: userId }),
```

**Root Cause**: The RPC function `count_user_threads` queries the `thread` table looking for matches on `host_user_id` or `guest_user_id` columns:

```sql
SELECT COUNT(*)::integer
FROM thread t
WHERE t.host_user_id = user_id
   OR t.guest_user_id = user_id;
```

**Potential Problems**:
1. **Column name mismatch**: The thread table may have columns with different names than `host_user_id`/`guest_user_id`. Historical migrations show renaming from `-Host User`/`-Guest User` to `host_user_id`/`guest_user_id`.
2. **No threads exist**: If the user has never had a conversation, `threadsCount` would legitimately be 0.
3. **User ID format mismatch**: The user's Bubble ID (e.g., `1234567890123x12345678901234567`) may not match what's stored in the thread table.

**Debug Check**: In `useLoggedInAvatarData.js` (lines 378-387), there's debug logging:
```javascript
console.log('🧵 [useLoggedInAvatarData] Threads RPC result:', {
  rawData: threadsResult.data,
  dataType: typeof threadsResult.data,
  error: threadsResult.error,
  errorMessage: threadsResult.error?.message,
  userId: userId
});
```

If this shows `error: { message: ... }`, the RPC is failing.

### Issue 2: Realtime Subscription `CHANNEL_ERROR`

**Location**: `useMessagingPageLogic.js` (lines 365-478)

The realtime subscription setup:
```javascript
const channel = supabase.channel(channelName);

channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: '_message'
  },
  (payload) => { ... }
);

channel.subscribe(async (status) => {
  console.log('[Realtime] Subscription status:', status);
  if (status === 'CHANNEL_ERROR') {
    console.error('[Realtime] Channel error - check RLS policies on _message table');
  }
});
```

**Root Cause**: `CHANNEL_ERROR` typically occurs when:
1. **RLS policies block access**: The `_message` table has RLS enabled but the authenticated user cannot read from it.
2. **Realtime not enabled**: The table may not have Realtime enabled in Supabase.
3. **JWT/Auth issues**: The user's session token may not be valid for Realtime subscriptions.

**RLS Policy Check** (from `20260128060000_fix_rls_policies_for_new_users.sql`):
```sql
-- Policy 2: Authenticated users can read messages
CREATE POLICY "Authenticated users can read messages"
  ON _message FOR SELECT
  USING (auth.role() = 'authenticated');
```

This policy requires the user to be `authenticated` role. If using legacy auth (Bubble tokens) without a Supabase session, Realtime won't work.

### Issue 3: 400 Bad Request Errors

**Location**: `useLoggedInAvatarData.js`

The hook makes multiple parallel queries, some of which may fail with 400 errors:

```javascript
// 3. Count visits for this user (as guest)
// NOTE: visit table may not exist in Supabase yet (legacy Bubble table)
supabase
  .from('visit')
  .select('_id', { count: 'exact', head: true })
  .eq('Guest', userId)
  .then(result => {
    // If table doesn't exist or query fails, return count = 0
    if (result.error) {
      console.warn('[useLoggedInAvatarData] visit table query failed (table may not exist):', result.error.message);
      return { count: 0, error: null }; // Override error with safe default
    }
    return result;
  }),
```

**Root Cause**: Tables like `visit` and `virtualmeetingschedulesandlinks` may not exist yet (legacy Bubble tables not migrated). The code handles this gracefully by defaulting to 0.

---

## Specific Analysis for Host Message Sending

The user scenario mentions "host message sending not working". Let me trace the flow:

### Message Sending Flow

1. **Frontend** (`useMessagingPageLogic.js` lines 668-762):
   ```javascript
   async function sendMessage() {
     // ... auth checks ...
     const response = await fetch(`${supabaseUrl}/functions/v1/messages`, {
       method: 'POST',
       headers,
       body: JSON.stringify({
         action: 'send_message',
         payload: {
           thread_id: selectedThread._id,
           message_body: messageInput.trim(),
         },
       }),
     });
   }
   ```

2. **Edge Function** (`sendMessage.ts`):
   - Validates user authentication
   - Gets user's Bubble ID from JWT metadata or legacy auth
   - Creates message in `_message` table
   - Updates thread's last message

### Potential Host-Specific Issues

1. **User Type Detection**: In `getMessages.ts` (lines 130-132):
   ```typescript
   const isHost = userType.includes('Host');
   ```
   If `userType` is incorrectly set or empty, message visibility filtering could fail.

2. **Thread Participant Validation** (`getMessages.ts` lines 156-159):
   ```typescript
   if (threadHost !== userBubbleId && threadGuest !== userBubbleId) {
     throw new ValidationError('You do not have access to this conversation');
   }
   ```
   If the Bubble ID lookup fails, the user won't be recognized as a participant.

3. **Bubble ID Resolution** (`getThreads.ts` lines 51-83):
   Three priority levels for getting user's Bubble ID:
   - Priority 1: `user.bubbleId` from JWT user_metadata
   - Priority 2: `user.id` if it matches Bubble ID pattern (`/^\d+x\d+$/`)
   - Priority 3: Lookup by email in `public.user` table

   If none of these work, the user gets: "Could not find user profile. Please try logging in again."

---

## Proposed Fix

### Investigation Steps (To Confirm Root Cause)

1. **Check Console Logs**: Look for the `🧵 [useLoggedInAvatarData]` log to see if `threadsResult.error` is populated.

2. **Check Supabase Logs**: Use Supabase MCP to check edge function logs:
   - Look for `[getThreads]` logs to see if the query is returning threads
   - Check `[sendMessage]` logs for any errors during message creation

3. **Verify Thread Table Data**: Query the thread table to confirm:
   - Threads exist for the user
   - `host_user_id`/`guest_user_id` columns have correct values (not the old `-Host User`/`-Guest User` format)

4. **Verify RLS Policies**: Confirm the `_message` and `thread` tables have the correct RLS policies that allow authenticated users to read.

### Likely Fixes

**If Issue is Thread Column Names**:
The thread table may still have old column names. A migration to normalize column names may be needed.

**If Issue is Realtime RLS**:
For legacy auth users (Bubble tokens), Realtime subscriptions won't work because they require Supabase Auth. The fix would be:
1. Migrate users to Supabase Auth (preferred)
2. Or fall back to polling for messages instead of Realtime

**If Issue is Missing Threads**:
If the user genuinely has no threads, the messaging icon correctly hides. Create a test thread to verify functionality.

**If Issue is Bubble ID Mismatch**:
Ensure the user's Bubble ID is correctly stored in JWT user_metadata during signup/login.

---

## Extended Investigation Results (2026-01-31)

### Database Verification - ALL CORRECT

| Check | Result | Status |
|-------|--------|--------|
| User "fred" exists | `1769557609595x49864288621866896` | ✅ |
| User has email | `splitleasefrederick+guest55jes@gmail.com` | ✅ |
| Thread columns | `host_user_id`, `guest_user_id` (correct format) | ✅ |
| User has threads | 2 threads as guest | ✅ |
| `count_user_threads` RPC | Returns `2` for this user | ✅ |

**Conclusion**: Database is correctly configured. The issue is **NOT** in the backend.

### Frontend Issue Identified

**Symptom**: Console logs show `dataLoading: true` persisting indefinitely, with `supabaseThreadsCount: 0`.

**Evidence**:
```
📧 Messaging icon visibility check: {
  effectiveThreadsCount: 0,
  isMessagesPage: false,
  shouldShowMessagingIcon: false,
  supabaseThreadsCount: 0,
  dataLoading: true  // <-- STUCK AT TRUE
}
```

**Root Cause**: The `Promise.all` in `useLoggedInAvatarData.js` (lines 143-273) is not completing. One of the 12 parallel queries is hanging.

**Likely Culprit**: One of these queries may be hanging or timing out:
1. `get_host_listings` RPC (line 171) - Query for host's listings
2. `get_user_junction_counts` RPC (line 232) - Junction table counts
3. `bookings_leases` query (line 206-209) - May have RLS issues

**Why This Breaks Messaging**: When `dataLoading` stays `true`, the `effectiveThreadsCount` falls back to prop value (0), so the messaging icon is hidden.

---

## Proposed Fix

### Immediate Fix: Add Timeout Wrapper

Wrap the `Promise.all` with a timeout to prevent indefinite hanging:

```javascript
// Add timeout wrapper function
const withTimeout = (promise, timeoutMs, fallback) => {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
};

// In fetchData function, wrap each query with timeout
const [
  userResult,
  listingsResult,
  // ... etc
] = await Promise.all([
  withTimeout(supabase.from('user').select(...), 5000, { data: null, error: { message: 'Timeout' } }),
  withTimeout(supabase.rpc('get_host_listings', ...), 5000, { data: [], error: { message: 'Timeout' } }),
  // ... etc
]);
```

### Diagnostic Fix: Add Individual Query Timing

Add timing logs to identify which query is slow:

```javascript
const startTime = Date.now();

// After each query completes in Promise.all
console.log('[useLoggedInAvatarData] Query 1 (user) completed in', Date.now() - startTime, 'ms');
// ... etc
```

### Recommended Action

1. Add timeout wrapper to prevent indefinite hanging (5-10 second timeout)
2. Add individual query timing to identify the slow query
3. Once identified, optimize or fix the problematic query

---

## Next Steps

1. ~~Check Supabase Logs~~ ✅ - Edge function is working (some 400s but expected)
2. ~~Query Thread Table~~ ✅ - Verified user has 2 threads with correct columns
3. **Add timeout handling** to `useLoggedInAvatarData.js` to prevent UI blocking
4. **Identify hanging query** by adding timing logs
5. **Fix the underlying query** once identified

---

## Referenced Files

### Frontend
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\app\src\islands\shared\LoggedInAvatar\useLoggedInAvatarData.js`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\app\src\islands\pages\MessagingPage\useMessagingPageLogic.js`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\app\src\islands\shared\HeaderMessagingPanel\useHeaderMessagingPanelLogic.js`

### Backend
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\functions\messages\handlers\sendMessage.ts`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\functions\messages\handlers\getThreads.ts`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\functions\messages\handlers\getMessages.ts`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\functions\_shared\messagingHelpers.ts`

### Database
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\migrations\20260128040000_create_count_user_threads_function.sql`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\migrations\20260128060000_fix_rls_policies_for_new_users.sql`
- `c:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\supabase\migrations\20260130141623_message_trigger_fix_production.sql`
