# BUG-003: SplitBot Message Creation Failure

**Date**: 2026-02-02
**Priority**: HIGH
**Status**: DIAGNOSED - AWAITING IMPLEMENTATION

---

## Bug Summary

When a guest creates a proposal, the thread is created successfully but **no SplitBot messages are created**. This results in:
- Guests not receiving confirmation that their proposal was submitted
- Hosts not being notified of new proposals
- Empty message threads (thread exists, but 0 messages inside)

**Console Warning**: `"[WARN] Thread creation failed (non-bl...)"` (truncated in browser console)

---

## Evidence

### From E2E Test (2026-02-02)

**Test Case**: Phase 3 Re-test after BUG-001 and BUG-002 fixes
**Proposal ID**: `1770052324942x64452081892439584`
**Thread ID**: Created successfully
**Message Count**: 0 (Expected: 1+)

**Console Output**:
```
[WARN] Thread creation failed (non-bl...)
```

**Visual Evidence**: Messages page shows "No messages yet" despite thread existing

---

## Root Cause Analysis

### Primary Issue: Missing CTAs in Database

The SplitBot message creation flow depends on **CTA (Call-to-Action) records** stored in `reference_table.os_messaging_cta`. When these CTAs are missing or the lookup fails, message creation is **silently skipped** due to non-blocking error handling.

### Code Flow

**File**: `supabase/functions/proposal/actions/create.ts` (lines 700-777)

```typescript
// Line 728-731: Fetch CTAs for guest and host
const [guestCTA, hostCTA] = await Promise.all([
  getCTAForProposalStatus(supabase, status, 'guest', templateContext),
  getCTAForProposalStatus(supabase, status, 'host', templateContext),
]);

// Line 736-749: Create guest message ONLY IF guestCTA exists
if (guestCTA) {
  await createSplitBotMessage(supabase, {
    threadId,
    messageBody: guestMessageBody,
    callToAction: guestCTA.display,  // <-- REQUIRES CTA
    // ...
  });
  console.log(`[proposal:create] SplitBot message sent to guest`);
}

// Line 752-765: Create host message ONLY IF hostCTA exists
if (hostCTA) {
  await createSplitBotMessage(supabase, {
    threadId,
    messageBody: hostMessageBody,
    callToAction: hostCTA.display,  // <-- REQUIRES CTA
    // ...
  });
  console.log(`[proposal:create] SplitBot message sent to host`);
}
```

**The Problem**: `if (guestCTA)` and `if (hostCTA)` are **false** because CTAs are not found in the database.

### CTA Lookup Chain

1. **Status Mapping** (`supabase/functions/_shared/ctaHelpers.ts`, lines 30-73)
   ```typescript
   'Proposal Submitted by guest - Awaiting Rental Application': {
     guest: 'fill_out_rental_application',  // CTA name
     host: 'view_proposal_host',            // CTA name
   }
   ```

2. **Database Lookup** (`ctaHelpers.ts`, lines 193-210)
   ```typescript
   export async function getCTAByName(supabase, ctaName) {
     const { data, error } = await supabase
       .schema('reference_table')
       .from('os_messaging_cta')
       .select('*')
       .eq('name', ctaName)
       .single();

     if (error) {
       console.error(`[ctaHelpers] Failed to fetch CTA '${ctaName}':`, error);
       return null;  // <-- Returns null, causing message creation to be skipped
     }

     return data;
   }
   ```

3. **Result**: If CTA does not exist in `reference_table.os_messaging_cta`, the function returns `null`, and message creation is **silently skipped**.

### Why It's Non-Blocking

The entire SplitBot message creation block (lines 700-777) is wrapped in a try-catch:

```typescript
try {
  // ... create messages
} catch (msgError) {
  // Non-blocking - proposal and thread are created, messages are secondary
  console.error(`[proposal:create] SplitBot messages failed:`, msgError);
  console.warn(`[proposal:create] Proposal and thread created, but SplitBot messages failed`);
}
```

This ensures proposal creation succeeds even if messages fail, but it **hides the issue** from the frontend.

---

## Required CTAs (Missing or Broken)

The following CTAs must exist in `reference_table.os_messaging_cta`:

| CTA Name | Used By | Role |
|----------|---------|------|
| `fill_out_rental_application` | Proposal creation | Guest |
| `view_proposal_host` | Proposal creation | Host |
| `view_proposal_guest` | Proposal creation | Guest |
| `create_proposal_guest` | Contact Host welcome messages | Guest |
| `new_inquiry_host_view` | Contact Host welcome messages | Host |

---

## Verification Steps

### 1. Check Database

Run this query to verify if CTAs exist:

```sql
SELECT name, display, message
FROM reference_table.os_messaging_cta
WHERE name IN (
  'fill_out_rental_application',
  'view_proposal_host',
  'view_proposal_guest',
  'create_proposal_guest',
  'new_inquiry_host_view'
);
```

**Expected**: 5 rows returned
**If 0 rows**: CTAs are missing (root cause confirmed)

### 2. Check Edge Function Logs

Look for these error messages in `supabase functions logs proposal`:

```
[ctaHelpers] Failed to fetch CTA 'fill_out_rental_application': ...
[ctaHelpers] No CTA mapping for status: ...
[proposal:create] CTAs resolved - guest: none, host: none
[proposal:create] SplitBot messages failed: ...
```

---

## Proposed Fix

### Option A: Insert Missing CTAs (RECOMMENDED)

**Why**: This is the correct long-term solution. CTAs are part of the application's reference data and should exist in the database.

**Action**: Insert CTAs into `reference_table.os_messaging_cta`:

```sql
-- Insert missing CTAs with template messages
INSERT INTO reference_table.os_messaging_cta (
  name,
  display,
  message,
  button_text,
  is_proposal_cta,
  visible_to_guest_only,
  visible_to_host_only
)
VALUES
  (
    'fill_out_rental_application',
    'Fill Out Rental Application',
    'Hi [Guest name]! Your proposal for [Listing name] has been submitted. Please complete your rental application to continue.',
    'Complete Application',
    true,
    true,
    false
  ),
  (
    'view_proposal_host',
    'View Proposal',
    'Hi [Host name]! [Guest name] has submitted a proposal for [Listing name]. Review their request and respond.',
    'View Proposal',
    true,
    false,
    true
  ),
  (
    'view_proposal_guest',
    'View Proposal',
    'Your proposal for [Listing name] is being reviewed by the host.',
    'View Status',
    true,
    true,
    false
  ),
  (
    'create_proposal_guest',
    'Create Proposal',
    'Hi [Guest name]! Start a conversation with [Host name] about [Listing name].',
    'Create Proposal',
    false,
    true,
    false
  ),
  (
    'new_inquiry_host_view',
    'New Inquiry',
    'Hi [Host name]! [Guest name] is interested in [Listing name].',
    'View Inquiry',
    false,
    false,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  message = EXCLUDED.message,
  button_text = EXCLUDED.button_text;
```

**Note**: The template placeholders (`[Guest name]`, `[Host name]`, `[Listing name]`) are replaced by the Edge Function using the `renderTemplate()` function.

### Option B: Add Fallback Message Creation (SECONDARY)

**Why**: Provides defense-in-depth. If CTAs are missing, messages should still be created with default content.

**File**: `supabase/functions/proposal/actions/create.ts`

**Changes**:

**Lines 735-749** (Guest message):
```typescript
// BEFORE (current code - skips if CTA is null)
if (guestCTA) {
  const guestMessageBody = guestCTA.message || getDefaultMessage(status, 'guest', templateContext);
  const guestVisibility = getVisibilityForRole('guest');

  await createSplitBotMessage(supabase, {
    threadId,
    messageBody: guestMessageBody,
    callToAction: guestCTA.display,
    visibleToHost: guestVisibility.visibleToHost,
    visibleToGuest: guestVisibility.visibleToGuest,
    recipientUserId: input.guestId,
  });
  console.log(`[proposal:create] SplitBot message sent to guest`);
}

// AFTER (create message even if CTA is missing)
const guestMessageBody = guestCTA?.message || getDefaultMessage(status, 'guest', templateContext);
const guestDisplay = guestCTA?.display || 'View Proposal';
const guestVisibility = getVisibilityForRole('guest');

await createSplitBotMessage(supabase, {
  threadId,
  messageBody: guestMessageBody,
  callToAction: guestDisplay,
  visibleToHost: guestVisibility.visibleToHost,
  visibleToGuest: guestVisibility.visibleToGuest,
  recipientUserId: input.guestId,
});
console.log(`[proposal:create] SplitBot message sent to guest${guestCTA ? '' : ' (fallback)'}`);
```

**Lines 752-765** (Host message):
```typescript
// BEFORE (current code - skips if CTA is null)
if (hostCTA) {
  const hostMessageBody = aiHostSummary || hostCTA.message || getDefaultMessage(status, 'host', templateContext);
  const hostVisibility = getVisibilityForRole('host');

  await createSplitBotMessage(supabase, {
    threadId,
    messageBody: hostMessageBody,
    callToAction: hostCTA.display,
    visibleToHost: hostVisibility.visibleToHost,
    visibleToGuest: hostVisibility.visibleToGuest,
    recipientUserId: hostAccountData.User,
  });
  console.log(`[proposal:create] SplitBot message sent to host${aiHostSummary ? ' (with AI summary)' : ''}`);
}

// AFTER (create message even if CTA is missing)
const hostMessageBody = aiHostSummary || hostCTA?.message || getDefaultMessage(status, 'host', templateContext);
const hostDisplay = hostCTA?.display || 'View Proposal';
const hostVisibility = getVisibilityForRole('host');

await createSplitBotMessage(supabase, {
  threadId,
  messageBody: hostMessageBody,
  callToAction: hostDisplay,
  visibleToHost: hostVisibility.visibleToHost,
  visibleToGuest: hostVisibility.visibleToGuest,
  recipientUserId: hostAccountData.User,
});
console.log(`[proposal:create] SplitBot message sent to host${aiHostSummary ? ' (with AI summary)' : ''}${hostCTA ? '' : ' (fallback)'}`);
```

**Impact**: Messages are now **always created**, even when CTAs are missing. Default values are used for missing fields.

---

## Recommended Implementation Strategy

1. **Short-term** (IMMEDIATE):
   - Verify if CTAs exist in database using the SQL query
   - If missing, insert CTAs using Option A SQL
   - Test proposal creation to confirm messages appear

2. **Long-term** (NEXT SPRINT):
   - Implement Option B (fallback message creation) as defense-in-depth
   - Add logging to track when fallbacks are used
   - Add CTA existence checks to E2E test suite

---

## Test Verification

After implementing the fix:

1. **Create a test proposal**:
   - Guest: Any test account
   - Listing: Any listing
   - Status: Should be "Proposal Submitted by guest - Awaiting Rental Application"

2. **Verify messages**:
   - Navigate to Messages page
   - Thread should exist
   - **Expected**: 2 messages (1 for guest, 1 for host)
   - Guest message should have CTA: "Fill Out Rental Application"
   - Host message should have CTA: "View Proposal"

3. **Check console**:
   - **No warnings** about thread creation failure
   - **No errors** about CTA lookup
   - Should see: `[proposal:create] SplitBot message sent to guest`
   - Should see: `[proposal:create] SplitBot message sent to host`

---

## Related Bugs

- **BUG-001**: Proposal workflow rental app requirement (FIXED)
- **BUG-002**: Supabase not defined in proposal manage (FIXED)

**Note**: BUG-003 was discovered during re-test after fixing BUG-001 and BUG-002.

---

## Impact Assessment

| Category | Impact |
|----------|--------|
| **Severity** | HIGH |
| **User Experience** | Critical - users see empty threads, no feedback on actions |
| **Data Integrity** | No data loss, but messages missing from history |
| **Workaround** | None - users cannot receive notifications |
| **Scope** | All proposal creations, potentially Contact Host messages |

---

## Affected Files

| File | Lines | Role |
|------|-------|------|
| `supabase/functions/proposal/actions/create.ts` | 700-777 | Main proposal creation with SplitBot messages |
| `supabase/functions/_shared/ctaHelpers.ts` | 30-73, 193-210, 247-283 | CTA mapping and database lookup |
| `supabase/functions/_shared/messagingHelpers.ts` | 483-528 | createSplitBotMessage function |
| `supabase/functions/messages/handlers/sendMessage.ts` | 57-117, 119-345 | Send message handler with welcome messages (also affected) |
| `reference_table.os_messaging_cta` (database table) | - | CTA reference data storage |

---

## References

- Previous investigation: `.claude/plans/New/20260131-messaging-bug-investigation.md`
- E2E test report: `.claude/plans/Documents/20260202110000-e2e-test-final-report.md`
- CTA config (frontend): `app/src/lib/ctaConfig.js`

---

**Status**: Ready for implementation
**Next Action**: Verify CTA existence in database, then apply Option A (insert CTAs)
