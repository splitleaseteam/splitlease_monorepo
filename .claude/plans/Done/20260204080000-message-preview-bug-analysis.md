# Message Thread Preview Shows Incorrect/Stale Message - Bug Analysis

**Created**: 2026-02-04 08:00:00
**Bug Type**: Data Consistency / Query Logic Mismatch
**Severity**: Medium (User Experience Impact)
**Status**: Analysis Complete

---

## Bug Summary

The message thread list preview displays an outdated message ("Your proposal for Charming 1-Bedroom in Trendy") while the actual thread shows a more recent Split Bot system message ("The reservation spans 16 weeks from February 23, 2026...").

---

## Root Cause Analysis

### The Core Issue

The **thread preview** (`~Last Message` field on the `thread` table) and the **actual latest visible message** (from the `_message` table) are being updated through **different mechanisms** that do NOT consider visibility filtering:

1. **Thread Preview (`~Last Message`)**: Updated by `updateThreadLastMessage()` function which is called **manually** at various points - not automatically by a database trigger on message insert
2. **Actual Messages**: Fetched with **visibility filtering** based on user role (`is Visible to Host` / `is Visible to Guest`)

### Why the Mismatch Occurs

When a Split Bot message is sent:

1. The message is created with visibility flags (e.g., `is Visible to Host: true`, `is Visible to Guest: false`)
2. The `updateThreadLastMessage()` function updates `~Last Message` with the **raw message body** WITHOUT checking if this message will be visible to all users
3. When a HOST views the thread list, they see the preview of a message that may be **visible to them**
4. But when a GUEST views the thread list, they see the **same preview** even though that message may NOT be visible to them

---

## Data Flow Analysis

### How Thread Preview is Updated

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THREAD PREVIEW UPDATE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Message Creation                                                        │
│     └─ createSplitBotMessage() or createMessage()                          │
│         - Inserts into _message table                                       │
│         - Sets visibility flags per role                                    │
│         - NO automatic thread preview update                                │
│                                                                             │
│  2. Manual Thread Preview Update (OPTIONAL - called separately)             │
│     └─ updateThreadLastMessage(supabase, threadId, messageBody)            │
│         - Updates thread."~Last Message" = messageBody.substring(0, 100)   │
│         - Updates thread."~Date Last Message" = now                        │
│         - Does NOT consider visibility flags                                │
│                                                                             │
│  PROBLEM: Preview shows message that may not be visible to all users       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How Thread List Fetches Preview

The preview comes directly from the `thread` table's `~Last Message` field:

**File**: `supabase/functions/messages/handlers/getThreads.ts` (line 250)
```typescript
last_message_preview: thread['~Last Message'] || 'No messages yet',
```

**File**: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` (line 639)
```typescript
last_message_preview: thread['~Last Message'] || 'No messages yet',
```

### How Full Thread Fetches Messages

Messages are fetched with **visibility filtering** based on user role:

**File**: `supabase/functions/messages/handlers/getMessages.ts` (lines 167-188)
```typescript
let query = supabaseAdmin
  .from('_message')
  .select('...')
  .eq('thread_id', thread_id)
  .order('"Created Date"', { ascending: true });

// Apply visibility filter
if (isHostInThread) {
  query = query.eq('"is Visible to Host"', true);
} else {
  query = query.eq('"is Visible to Guest"', true);
}
```

---

## Specific Bug Scenario

### What Happened

1. Guest submitted a proposal for a listing
2. System created Split Bot messages for BOTH host and guest, but with **different visibility**:
   - Guest-visible message: "Your proposal for Charming 1-Bedroom in Trendy..."
   - Host-visible message: "The reservation spans 16 weeks from February 23, 2026..."
3. `updateThreadLastMessage()` was called with the **host's message** (the most recent call)
4. The thread's `~Last Message` now shows the host-visible message
5. When the **host** views the thread list, they see "The reservation spans 16 weeks..." which matches what they see when opening the thread - **CORRECT**
6. When the **guest** views the thread list, they see "The reservation spans 16 weeks..." but when opening the thread, they see "Your proposal for Charming 1-Bedroom..." - **INCORRECT**

### Evidence from Code

**File**: `supabase/functions/messages/handlers/sendSplitBotMessage.ts` (line 246)
```typescript
// Step 7: Update thread's last message (non-blocking)
await updateThreadLastMessage(supabase, resolvedThreadId!, messageBody);
```

This updates the preview with the **last message created**, regardless of which users can see it.

---

## Affected Files

### Backend (Edge Functions)

| File | Issue |
|------|-------|
| `supabase/functions/_shared/messagingHelpers.ts` | `updateThreadLastMessage()` doesn't consider visibility |
| `supabase/functions/messages/handlers/sendSplitBotMessage.ts` | Calls `updateThreadLastMessage()` with visibility-filtered message |
| `supabase/functions/messages/handlers/sendMessage.ts` | Same issue when welcome messages are sent |
| `supabase/functions/messages/handlers/getThreads.ts` | Reads `~Last Message` without visibility context |
| `supabase/functions/proposal/actions/create.ts` | Calls `updateThreadLastMessage()` at end of proposal creation |

### Frontend

| File | Issue |
|------|-------|
| `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` | Uses RPC `get_user_threads` which reads `~Last Message` without visibility |
| `app/src/islands/pages/MessagingPage/components/ThreadCard.jsx` | Renders `last_message_preview` from thread data |

### Database

| Component | Issue |
|-----------|-------|
| `thread` table | `~Last Message` column stores a single value, not per-user preview |
| No database trigger | Message inserts don't automatically update thread preview |

---

## Proposed Solutions

### Solution 1: Per-User Thread Preview (Recommended) - COMPLEX

**Approach**: Store separate `~Last Message` values for host and guest on the thread table.

**Changes**:
1. Add columns `~Last Message Host` and `~Last Message Guest` to `thread` table
2. Update `updateThreadLastMessage()` to set the appropriate column based on message visibility
3. Update `getThreads.ts` to select the correct column based on viewer's role

**Pros**: Accurate preview for each user
**Cons**: Schema change, more complex update logic

---

### Solution 2: Compute Preview on Read (Simpler) - RECOMMENDED

**Approach**: Instead of reading `~Last Message` from the thread table, compute the preview by fetching the **most recent visible message** for the current user.

**Changes**:
1. Modify `getThreads.ts` to include a subquery or join that fetches the most recent message visible to the requesting user
2. Modify the frontend RPC call or direct query to do the same

**Implementation in `getThreads.ts`**:
```typescript
// For each thread, get the most recent message visible to this user
const { data: lastMessages } = await supabaseAdmin
  .from('_message')
  .select('thread_id, "Message Body", "Created Date"')
  .in('thread_id', threadIds)
  .eq(isHost ? '"is Visible to Host"' : '"is Visible to Guest"', true)
  .order('"Created Date"', { ascending: false });

// Group by thread_id and take first (most recent)
const lastMessageMap = lastMessages?.reduce((acc, msg) => {
  if (!acc[msg.thread_id]) {
    acc[msg.thread_id] = msg['Message Body'];
  }
  return acc;
}, {});

// Use lastMessageMap instead of thread['~Last Message']
```

**Pros**: No schema change, accurate preview, simpler migration
**Cons**: Slightly more expensive query (subquery per thread)

---

### Solution 3: Database Trigger (Most Robust)

**Approach**: Create a database trigger on `_message` INSERT that updates the thread's `~Last Message` based on visibility.

**Changes**:
1. Create trigger function `update_thread_last_message_on_insert()`
2. The trigger checks visibility flags and updates the appropriate preview field

**Pros**: Automatic, consistent, no manual calls needed
**Cons**: Requires schema change for per-user preview fields, trigger complexity

---

### Solution 4: Quick Fix - Update Preview Based on "All-Visible" Messages Only

**Approach**: Only update `~Last Message` when a message is visible to BOTH host and guest.

**Changes**:
1. Modify `updateThreadLastMessage()` calls to only run when `visibleToHost && visibleToGuest`
2. For role-specific messages, don't update the preview

**Pros**: Minimal code change
**Cons**: Preview may become stale if many role-specific messages are sent

---

## Recommended Fix: Solution 2 (Compute Preview on Read)

This provides the best balance of:
- **Accuracy**: Each user sees a preview of a message they can actually see
- **Simplicity**: No database schema changes
- **Performance**: Can be optimized with proper indexing

### Implementation Steps

1. **Modify `getThreads.ts`**:
   - After fetching threads, batch-fetch the most recent visible message per thread
   - Replace `thread['~Last Message']` with the computed preview

2. **Modify `useHeaderMessagingPanelLogic.js`**:
   - The frontend currently uses RPC `get_user_threads` which reads from the thread table
   - Either update the RPC function OR fetch last visible message separately

3. **Add Index** (optional performance optimization):
   ```sql
   CREATE INDEX idx_message_thread_visible_date
   ON _message (thread_id, "Created Date" DESC)
   WHERE "is Visible to Host" = true OR "is Visible to Guest" = true;
   ```

4. **Keep `~Last Message` for fallback**:
   - Don't remove existing `~Last Message` updates
   - Use computed preview when available, fall back to `~Last Message` if not

---

## Testing Checklist

After implementing the fix:

1. [ ] Create a proposal as guest
2. [ ] Verify guest sees their welcome message in preview
3. [ ] Verify host sees their welcome message in preview (different content)
4. [ ] Send a host-to-guest message
5. [ ] Verify both see correct preview after message
6. [ ] Send a Split Bot message visible only to host
7. [ ] Verify host preview updates, guest preview stays the same
8. [ ] Send a Split Bot message visible only to guest
9. [ ] Verify guest preview updates, host preview stays the same

---

## Files to Modify

### Primary Changes

| File | Change Description |
|------|-------------------|
| `supabase/functions/messages/handlers/getThreads.ts` | Add subquery to fetch last visible message per thread |
| `supabase/functions/_shared/messagingHelpers.ts` | Add `getLastVisibleMessage()` helper function |

### Secondary Changes (if using RPC approach)

| File | Change Description |
|------|-------------------|
| `supabase/migrations/YYYYMMDDHHMMSS_fix_thread_preview.sql` | Update `get_user_threads` RPC to compute preview |
| `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` | Update to use new RPC or compute preview client-side |

---

## References

### Related Files Analyzed

- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\_shared\messagingHelpers.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\getThreads.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\getMessages.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\sendMessage.ts`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\messages\handlers\sendSplitBotMessage.ts`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\shared\HeaderMessagingPanel\useHeaderMessagingPanelLogic.js`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\shared\HeaderMessagingPanel\HeaderMessagingPanel.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\MessagingPage\components\ThreadCard.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\supabase\migrations\20260128050000_database_views.sql`

### Related Documentation

- `.claude/plans/Documents/20260203143000-message-creation-system-analysis.md`
- `.claude/Documentation/Pages/MESSAGING_PAGE_REFERENCE.md`

---

## Summary

The bug occurs because the thread preview (`~Last Message`) is updated with the most recently sent message, regardless of whether that message is visible to all users. The solution is to compute the preview dynamically based on the most recent message that the **requesting user** can see.

**Priority**: Medium - Causes confusion but doesn't block functionality
**Effort**: 4-8 hours depending on solution chosen
**Risk**: Low - Fix is isolated to message preview logic

---

**End of Analysis**
