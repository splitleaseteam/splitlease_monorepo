# Debug Investigation: OAuth Users Missing public.user Entries

**Created**: 2026-01-27 15:30:00
**Status**: Analysis Complete - Ready for Implementation
**Priority**: HIGH - Production Bug

---

## Executive Summary

After tracing the OAuth signup and login flows, I've identified **two distinct bugs**:

### Bug 1: OAuth Login Creates auth.users Without public.user Records
**Root Cause**: The `oauth_login` handler only **verifies** if a user exists - it does NOT create one. When users click "Login with LinkedIn/Google" but have never registered, Supabase creates an `auth.users` entry automatically, but our Edge Function returns `userNotFound: true` without cleaning up the orphaned auth.users record.

### Bug 2: getThreads Throws Instead of Returning Empty Array
**Root Cause**: Lines 69-72 in `getThreads.ts` throw `ValidationError` when the user profile lookup fails, instead of returning `{ threads: [] }` for new users with zero threads.

---

## Bug 1: OAuth Flow Creates Orphaned auth.users Records

### The Problem

When a user clicks "Login with LinkedIn" or "Login with Google" on an account that doesn't exist:

1. **Supabase OAuth flow** creates an `auth.users` record (automatic - we can't prevent this)
2. **Frontend calls** `oauth_login` Edge Function action
3. **Edge Function** checks if `public.user` exists by email
4. **If not found**: Returns `userNotFound: true` to frontend
5. **Frontend** prompts user to sign up instead
6. **Result**: Orphaned `auth.users` record with NO corresponding `public.user`

### Code Evidence

**File**: `supabase/functions/auth-user/handlers/oauthLogin.ts` (lines 55-78)

```typescript
// ========== CHECK IF USER EXISTS ==========
console.log('[oauth-login] Checking if user exists in database...');

const { data: existingUser, error: userCheckError } = await supabaseAdmin
  .from('user')
  .select('_id, email, "Name - First", "Name - Last", "Type - User Current", "Profile Photo"')
  .eq('email', email.toLowerCase())
  .maybeSingle();

if (userCheckError) {
  console.error('[oauth-login] Error checking user:', userCheckError.message);
  throw new BubbleApiError('Failed to verify user', 500);
}

if (!existingUser) {
  console.log('[oauth-login] User NOT found for email:', email);
  // Return userNotFound indicator for frontend to prompt signup
  return {
    userNotFound: true,
    email: email,
    message: 'No account found with this email. Please sign up first.',
  };
}
```

**The missing piece**: When `existingUser` is null, we should:
1. Create the `public.user` record using the OAuth data
2. Return success with the new user data
3. NOT just return `userNotFound`

### Expected vs Actual Behavior

| Scenario | Expected | Actual |
|----------|----------|--------|
| User clicks "Login with Google" (no account) | Create public.user, log them in | auth.users created, user shown error, orphan created |
| User clicks "Sign up with Google" | Create public.user, log them in | Works correctly (uses `oauth_signup`) |

### Why This Creates Orphans

The Supabase OAuth flow **always** creates an `auth.users` record when a user authenticates:

1. User clicks "Login with LinkedIn/Google"
2. Supabase redirects to provider
3. User authenticates with provider
4. Supabase creates/updates `auth.users` record (automatic)
5. User is redirected back with session
6. Our `oauth_login` handler runs and says "user not found"
7. **auth.users exists but public.user does not**

---

## Bug 2: getThreads Throws Error Instead of Returning Empty Array

### The Problem

When a user visits `/messages` and:
1. They have a valid session (auth.users exists)
2. But their `public.user` record is missing (orphan case from Bug 1)
3. The `getThreads` handler throws a `ValidationError`
4. Frontend displays error page instead of empty state

### Code Evidence

**File**: `supabase/functions/messages/handlers/getThreads.ts` (lines 56-76)

```typescript
if (isBubbleId) {
  // Legacy auth - user.id is already the Bubble ID
  userBubbleId = user.id;
  console.log('[getThreads] Using direct Bubble ID from legacy auth:', userBubbleId);
} else {
  // JWT auth - need to look up Bubble ID by email
  if (!user.email) {
    console.error('[getThreads] No email in auth token');
    throw new ValidationError('Could not find user profile. Please try logging in again.');  // <-- THROWS
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('user')
    .select('_id, "Type - User Current"')
    .ilike('email', user.email)
    .single();

  if (userError || !userData?._id) {
    console.error('[getThreads] User lookup failed:', userError?.message);
    throw new ValidationError('Could not find user profile. Please try logging in again.');  // <-- THROWS
  }

  userBubbleId = userData._id;
  console.log('[getThreads] Looked up Bubble ID from email:', userBubbleId);
}
```

### Expected Behavior

Per the user clarification:
- **Error should never throw** for missing user profiles
- Should return `{ threads: [] }` when user has no profile
- Frontend should display "Start a conversation" empty state

### Why This Is Wrong

The current logic assumes:
1. If a user has a valid JWT session, they MUST have a `public.user` record
2. If the lookup fails, something is seriously wrong (hence ValidationError)

But with Bug 1, users can have valid sessions without `public.user` records.

---

## Root Cause Analysis

### Why oauth_login Doesn't Create Users

Looking at the design intent:

**`oauth_signup`** (line 1-222 of oauthSignup.ts):
- Checks if email exists
- If duplicate: Returns indicator for confirmation modal
- If new: Generates ID, creates user record, queues Bubble sync

**`oauth_login`** (line 1-143 of oauthLogin.ts):
- Only checks if email exists
- If not found: Returns `userNotFound` indicator
- Does NOT create user records

The design assumes users will always go through signup first. But OAuth makes this ambiguous - users might click "Login" thinking they'll be registered automatically (common pattern on many sites).

### Why getThreads Throws

The messaging system was built assuming `public.user` is always populated for authenticated users. This was true before OAuth was added, because:

1. Native signup (`signup` action) creates `public.user` synchronously
2. Legacy Bubble auth always had `public.user` records

OAuth broke this assumption by allowing sessions to exist without `public.user`.

---

## Recommended Fixes

### Fix 1: Auto-Create User in oauth_login

Modify `oauthLogin.ts` to create a `public.user` record when one doesn't exist, using the OAuth provider's data.

**Key change**: Instead of returning `userNotFound`, the handler should:
1. Call the same user creation logic as `oauthSignup`
2. Return success with the new user data
3. This makes OAuth login "auto-register" like most modern OAuth implementations

### Fix 2: Return Empty Threads for Missing Profiles

Modify `getThreads.ts` to return empty array instead of throwing:

```typescript
if (userError || !userData?._id) {
  console.log('[getThreads] No user profile found - returning empty threads');
  return { threads: [] };
}
```

This allows the frontend to show the empty state UI properly.

---

## Files to Modify

### Primary Changes

1. **`supabase/functions/auth-user/handlers/oauthLogin.ts`**
   - Lines 70-78: Change `userNotFound` return to create user instead
   - Import user creation logic from `oauthSignup.ts` or extract to shared function

2. **`supabase/functions/messages/handlers/getThreads.ts`**
   - Lines 69-72: Change `throw ValidationError` to `return { threads: [] }`

### Secondary Considerations

3. **Frontend OAuth Login Callback** (`app/src/lib/auth.js`)
   - Lines 1636-1654: Remove `userNotFound` handling since it won't occur
   - Update `handleLinkedInOAuthLoginCallback` and `handleGoogleOAuthLoginCallback`

4. **SignUpLoginModal** (`app/src/islands/shared/SignUpLoginModal.jsx`)
   - Lines 2446-2498: Remove "User not found" modal since it won't be needed

---

## Testing Plan

### Bug 1: OAuth Auto-Registration

1. Create new Google/LinkedIn account (never registered with Split Lease)
2. Go to split.lease, click "Login with Google/LinkedIn"
3. Complete OAuth flow
4. Verify `public.user` record was created
5. Verify user is logged in and can access account

### Bug 2: Empty Threads

1. Create test user with no message threads
2. Visit `/messages`
3. Verify empty state shows "Start a conversation"
4. Verify no error page or console errors

### Edge Cases

1. User with auth.users but no public.user visits /messages
2. User clicks Login, then signs up with different email
3. OAuth session exists but public.user email mismatch

---

## Related Files

| File | Purpose |
|------|---------|
| `supabase/functions/auth-user/handlers/oauthLogin.ts` | OAuth login handler (Bug 1) |
| `supabase/functions/auth-user/handlers/oauthSignup.ts` | OAuth signup handler (reference) |
| `supabase/functions/messages/handlers/getThreads.ts` | Thread fetching (Bug 2) |
| `supabase/functions/messages/index.ts` | Messages router |
| `supabase/functions/auth-user/index.ts` | Auth router |
| `app/src/lib/auth.js` | Frontend OAuth handling |
| `app/src/islands/shared/SignUpLoginModal.jsx` | Login/signup modal |

---

## Implementation Notes

### Option A: Merge oauth_login into oauth_signup Logic

Make `oauth_login` call the user creation logic from `oauth_signup` when no user exists. This is the cleanest approach.

### Option B: Unify into Single oauth_auth Action

Create a single `oauth_auth` action that handles both signup and login scenarios, creating users when needed.

### Option C: Keep Separate but Add Creation to Login

Add user creation to `oauth_login` but keep the handlers separate. More code duplication but less refactoring.

**Recommended**: Option A - extracts user creation to a shared function used by both handlers.

---

## Deployment Reminder

After implementing fixes, remember to:
1. Deploy `auth-user` Edge Function: `supabase functions deploy auth-user`
2. Deploy `messages` Edge Function: `supabase functions deploy messages`
3. Test in development first with `supabase functions serve`
