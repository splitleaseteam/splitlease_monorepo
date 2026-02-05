# Unread Message Count System Analysis

**Generated**: 2026-02-03 18:00:00
**Author**: Claude Code (context-lookup analysis)
**Purpose**: Document the unread message count system architecture and flow

---

## Executive Summary

The unread message count system tracks which messages a user has not yet viewed. It uses a JSONB array field (`Unread Users`) on the `_message` table to store user IDs who have not read each message. The count is displayed in the header as a red badge on the messaging icon.

---

## 1. Database Schema

### `_message` Table

The key field for unread tracking is:

| Column | Type | Description |
|--------|------|-------------|
| `Unread Users` | JSONB Array | Array of user IDs (Bubble _id format) who have NOT read this message |

**Example value**: `["1765872300914x25497779776179264", "1634177189464x117577733821174320"]`

### How Unread Users Gets Populated

When a new message is created (in `supabase/functions/_shared/messagingHelpers.ts`):

```typescript
// Line 240-243 in messagingHelpers.ts
const unreadUsers = [thread.hostUser, thread.guestUser]
  .filter(id => id && id !== params.senderUserId);
```

**Logic**: Everyone in the thread EXCEPT the sender is added to the unread array.

---

## 2. Unread Count Tracking (State Management)

### Header-Level Count (`useLoggedInAvatarData.js`)

**File**: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`

This hook fetches the total unread count for the logged-in user:

```javascript
// Lines 214-217: Initial fetch
const { count: messagesResult } = await supabase
  .from('_message')
  .select('_id', { count: 'exact', head: true })
  .filter('"Unread Users"', 'cs', JSON.stringify([userId]));
```

**Query**: Uses `cs` (contains) operator to find messages where the user's ID is in the `Unread Users` array.

### Real-time Updates (Lines 441-489)

The hook sets up a Supabase Realtime subscription to detect message changes:

```javascript
const channel = supabase
  .channel('header-unread-messages')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: '_message',
    },
    (payload) => {
      // Re-fetch unread count on any message change
      fetchUnreadCount();
    }
  )
  .subscribe();
```

**Result**: When any message is inserted, updated, or deleted, the unread count is re-fetched.

### Thread-Level Unread Count (`useHeaderMessagingPanelLogic.js`)

**File**: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`

Lines 577-596 fetch per-thread unread counts:

```javascript
const { data: unreadData } = await supabase
  .from('_message')
  .select('"thread_id"')
  .in('"thread_id"', threadIds)
  .filter('"Unread Users"', 'cs', JSON.stringify([bubbleId]));

// Count occurrences of each thread ID
unreadCountMap = unreadData.reduce((acc, msg) => {
  const threadId = msg['thread_id'];
  acc[threadId] = (acc[threadId] || 0) + 1;
  return acc;
}, {});
```

---

## 3. Where the Red Badge is Rendered

### Header Messaging Icon (`LoggedInAvatar.jsx`)

**File**: `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`

Lines 439-444 render the red unread badge:

```jsx
{effectiveUnreadMessagesCount > 0 && (
  <span className="messages-badge">
    {effectiveUnreadMessagesCount > 9 ? '9+' : effectiveUnreadMessagesCount}
  </span>
)}
```

**Badge Colors**:
- **Red badge** (`.messages-badge`): Total unread messages
- **Amber/Gold badge** (`.proposals-badge`): Pending proposals for hosts

The badge appears on the envelope/mail icon button (lines 426-451).

---

## 4. Mark as Read Mechanism

### Backend: When Messages are Fetched (`getMessages.ts`)

**File**: `supabase/functions/messages/handlers/getMessages.ts`

Lines 329-353 mark messages as read:

```typescript
// Get messages with Unread Users containing this user
const { data: unreadMessages } = await supabaseAdmin
  .from('_message')
  .select('_id, "Unread Users"')
  .in('_id', messageIds);

for (const msg of unreadMessages) {
  const unreadUsers = msg['Unread Users'] || [];
  if (Array.isArray(unreadUsers) && unreadUsers.includes(userBubbleId)) {
    // Remove user from unread list
    const updatedUnread = unreadUsers.filter((id: string) => id !== userBubbleId);
    await supabaseAdmin
      .from('_message')
      .update({ "Unread Users": updatedUnread })
      .eq('_id', msg._id);
  }
}
```

**Trigger**: This runs every time a user calls `get_messages` action (i.e., opens a thread).

### Shared Helper (`messagingHelpers.ts`)

**File**: `supabase/functions/_shared/messagingHelpers.ts`

Lines 281-302 provide a reusable function:

```typescript
export async function markMessagesAsRead(
  supabase: SupabaseClient,
  messageIds: string[],
  userId: string
): Promise<void> {
  for (const messageId of messageIds) {
    const { data: message } = await supabase
      .from('_message')
      .select('"Unread Users"')
      .eq('_id', messageId)
      .single();

    if (message && Array.isArray(message['Unread Users'])) {
      const updatedUnread = message['Unread Users'].filter((id: string) => id !== userId);
      await supabase
        .from('_message')
        .update({ "Unread Users": updatedUnread })
        .eq('_id', messageId);
    }
  }
}
```

### Frontend: Local State Update

**File**: `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`

Lines 785-794 (in `handleThreadSelect`):

```javascript
// Clear unread badge for this thread in local state
// The backend will mark messages as read; this keeps UI in sync
if (thread.unread_count > 0) {
  setThreads((prevThreads) =>
    prevThreads.map((t) =>
      t._id === thread._id ? { ...t, unread_count: 0 } : t
    )
  );
}
```

Also in `useMessagingPageLogic.js` lines 1010-1016 and 1035-1040.

---

## 5. Complete Flow Diagram

```
USER OPENS THREAD
       |
       v
+-------------------------------+
| Frontend: handleThreadSelect  |
| - Sets unread_count to 0      |
| - Calls fetchMessages()       |
+-------------------------------+
       |
       v
+-------------------------------+
| Edge Function: get_messages   |
| - Fetches messages            |
| - Marks all as read           |
|   (removes userId from        |
|    Unread Users array)        |
+-------------------------------+
       |
       v
+-------------------------------+
| Database: _message UPDATE     |
| - Triggers postgres_changes   |
+-------------------------------+
       |
       v
+-------------------------------+
| Realtime: Header subscription |
| - Detects UPDATE event        |
| - Re-fetches unread count     |
+-------------------------------+
       |
       v
+-------------------------------+
| Header: Badge updates         |
| - Shows new count (or hides)  |
+-------------------------------+
```

---

## 6. Key Files Reference

| File | Purpose |
|------|---------|
| `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` | Fetches total unread count, sets up realtime subscription |
| `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx` | Renders the messaging icon with red badge |
| `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` | Thread list with per-thread unread counts, local state clearing |
| `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx` | Renders the messaging dropdown panel |
| `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` | Full messaging page logic, thread selection |
| `supabase/functions/messages/handlers/getMessages.ts` | Backend handler that marks messages as read |
| `supabase/functions/_shared/messagingHelpers.ts` | Shared `markMessagesAsRead` function, `createMessage` with unread tracking |

---

## 7. Potential Issues/Considerations

### Performance
- The `markMessagesAsRead` function iterates one message at a time (N+1 queries)
- For threads with many messages, this could be slow
- Consider batch update: `UPDATE _message SET "Unread Users" = ... WHERE _id = ANY(array[...])`

### Race Conditions
- If two users read messages simultaneously, they could overwrite each other's updates
- Current implementation reads, modifies, writes - not atomic
- Could use Postgres array functions: `array_remove("Unread Users", userId)`

### Real-time Subscription Scope
- Header subscription listens to ALL `_message` changes
- For large-scale deployment, this could be noisy
- Consider filtering by user participation

---

## 8. Summary

The unread message count system works as follows:

1. **New Message**: Sender's ID excluded from `Unread Users` array, all other participants included
2. **Display Count**: Header queries messages where user ID is in `Unread Users` array
3. **Real-time Updates**: Supabase Realtime subscription re-fetches count on any message change
4. **Mark as Read**: When user opens thread, backend removes their ID from `Unread Users` for all fetched messages
5. **Badge Rendering**: Red badge on messaging icon shows count, hidden when 0
