# BUG-002: 'supabase is not defined' Error in useProposalManagePageLogic.js

**Status**: OPEN
**Priority**: MEDIUM
**Type**: Edge Function Error
**Discovered**: 2026-02-02 (E2E Test Session)
**Error Location**: `useProposalManagePageLogic.js`

---

## Summary

When attempting to update a proposal status from the internal admin page (`/_internal/manage-proposals`), a 500 error occurs with the message "supabase is not defined". This appears to be a reference error in an Edge Function or a scope issue in the logic hook.

**Expected Behavior**: Admin should be able to update proposal status via the Edge Function without errors.

**Actual Behavior**: 500 error returned from Edge Function with "supabase is not defined" message.

---

## Root Cause Analysis

### 1. Likely Culprit: Edge Function Scope Error

**File**: `supabase/functions/proposal/actions/update.ts` (line 437)

```typescript
async function checkIsAdmin(
  _supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase  // ❌ ERROR: 'supabase' is not defined
    .from("user")
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
```

**Problem**: The function parameter is `_supabase` (with underscore), but the function body references `supabase` (without underscore). The underscore prefix in TypeScript conventionally indicates an unused parameter, and the developer likely forgot to use it.

**Line 437** should read:
```typescript
const { data } = await _supabase  // ✅ CORRECT: Use the parameter
```

### 2. Similar Issue in checkIsHost

**File**: `supabase/functions/proposal/actions/update.ts` (line 419)

```typescript
function checkIsHost(
  _supabase: SupabaseClient,  // Parameter not used anywhere in function
  hostUserId: string,
  userId: string
): Promise<boolean> {
  if (!hostUserId) return false;

  // Host User column now contains user._id directly - just compare
  return hostUserId === userId;
}
```

This function doesn't use `_supabase` at all, which is fine for its current implementation (simple equality check). However, this suggests the functions were recently refactored and the `_supabase` parameter was kept for consistency but not properly used in `checkIsAdmin`.

---

## Why This Error Occurred

### Context from Error Discovery

The error was triggered when:
1. E2E test attempted to update proposal status via admin interface
2. Admin page called `handleStatusChange` (line 610 in `useProposalManagePageLogic.js`)
3. This invoked the Edge Function via `callProposalEdgeFunction('update', { proposal_id, status })`
4. Edge Function's `handleUpdate` ran authorization checks (line 119)
5. `checkIsAdmin` was called to verify admin permissions
6. **ERROR**: `supabase` (global) was referenced instead of `_supabase` (parameter)

### Why It Wasn't Caught Earlier

1. **Admin updates are rare**: Most proposal updates come from guests or hosts, not admins. The `checkIsAdmin` function is only called for:
   - Internal admin pages (like `/_internal/manage-proposals`)
   - Edge cases where user is neither guest nor host

2. **No TypeScript compilation error**: The Edge Function likely has access to a global `supabase` client in its environment, but this client may not be initialized or may have different permissions than the passed `_supabase` client.

3. **Test coverage gap**: Unit tests may not have covered the admin authorization path.

---

## Impact

- **Admin functionality broken**: Internal admin page cannot update proposal statuses
- **500 error returned**: Graceful error handling doesn't catch this reference error
- **Non-blocking for guests/hosts**: Regular proposal workflows (guest cancellation, host counteroffer) are unaffected
- **E2E test failure**: Attempted admin status update during test cleanup failed

---

## Fix

### Simple One-Line Fix

**File**: `supabase/functions/proposal/actions/update.ts` (line 437)

**Change**:
```typescript
const { data } = await supabase
```

**To**:
```typescript
const { data } = await _supabase
```

### Complete Fixed Function

```typescript
async function checkIsAdmin(
  _supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await _supabase  // ✅ FIX: Use the parameter, not global
    .from("user")
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
```

---

## Implementation Steps

### Step 1: Fix the Reference Error

Update line 437 in `supabase/functions/proposal/actions/update.ts` to use `_supabase` instead of `supabase`.

### Step 2: Review Other Functions

Check if `checkIsHost` or any other helper functions have similar issues. Current inspection shows `checkIsHost` doesn't use `_supabase` at all, which is acceptable for its current implementation.

### Step 3: Deploy Edge Function

```bash
supabase functions deploy proposal
```

### Step 4: Test Admin Status Update

1. Navigate to `/_internal/manage-proposals`
2. Select a proposal
3. Change its status using the dropdown
4. Verify the update succeeds (no 500 error)
5. Check proposal status in database

### Step 5: Add Unit Test

Add a test case for `checkIsAdmin` to ensure it correctly validates admin users:

```typescript
// Test file: supabase/functions/proposal/__tests__/update.test.ts

describe('checkIsAdmin', () => {
  it('should return true for admin users', async () => {
    const mockSupabase = createMockSupabaseClient({
      'user': [
        { _id: 'user123', 'Toggle - Is Admin': true }
      ]
    });

    const result = await checkIsAdmin(mockSupabase, 'user123');
    expect(result).toBe(true);
  });

  it('should return false for non-admin users', async () => {
    const mockSupabase = createMockSupabaseClient({
      'user': [
        { _id: 'user456', 'Toggle - Is Admin': false }
      ]
    });

    const result = await checkIsAdmin(mockSupabase, 'user456');
    expect(result).toBe(false);
  });
});
```

---

## Why The Parameter Has An Underscore

In TypeScript, prefixing a parameter name with `_` is a convention to indicate:

1. **Intentionally unused**: The parameter is part of the function signature for consistency or future use, but currently not used in the function body.

2. **Linter suppression**: Prevents TypeScript/ESLint warnings about unused parameters (e.g., `@typescript-eslint/no-unused-vars`).

### Example: checkIsHost

```typescript
function checkIsHost(
  _supabase: SupabaseClient,  // Not currently used
  hostUserId: string,
  userId: string
): Promise<boolean> {
  // Simple equality check - no database query needed
  return hostUserId === userId;
}
```

This is **correct usage** because the function doesn't need database access. The `_supabase` parameter exists for consistency with other check functions.

### Example: checkIsAdmin

```typescript
async function checkIsAdmin(
  _supabase: SupabaseClient,  // ❌ WRONG: Should be used, not ignored
  userId: string
): Promise<boolean> {
  const { data } = await supabase  // ❌ BUG: Wrong variable
    .from("user")
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
```

This is **incorrect usage** because the function DOES need database access. The underscore was likely added by mistake or during refactoring.

---

## Related Files

### Edge Function
- `supabase/functions/proposal/actions/update.ts` (lines 433-444) - Contains the bug

### Admin Page Logic
- `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js` (lines 610-635) - Calls the Edge Function

### Related Functions
- `supabase/functions/proposal/actions/update.ts:419` - `checkIsHost` (similar signature, correct usage)

---

## Test Data

**Error Type**: ReferenceError
**Error Message**: "supabase is not defined"
**HTTP Status**: 500
**Edge Function**: `proposal` (action: `update`)
**Admin Page**: `/_internal/manage-proposals`
**Discovered During**: E2E test attempt to update proposal status administratively

---

## Prevention

### Code Review Checklist

When reviewing Edge Functions with helper functions:

1. ✅ Check that all parameters are used or intentionally prefixed with `_`
2. ✅ Verify database client references match parameter names
3. ✅ Ensure global `supabase` is not accidentally referenced when client is passed as parameter
4. ✅ Add unit tests for all authorization helper functions

### Linting Rule

Consider adding ESLint rule to catch unused parameters:

```json
{
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }
  ]
}
```

This would:
- Allow `_supabase` to exist without triggering warnings (intentionally unused)
- But still catch if `supabase` is referenced without being declared (ReferenceError)

---

## References

- Edge Function Update Handler: `supabase/functions/proposal/actions/update.ts:54-413`
- Authorization Helpers: `supabase/functions/proposal/actions/update.ts:419-444`
- Admin Page Logic: `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js:610-635`
- E2E Test Session State: `test-session/state.json:30-38`
