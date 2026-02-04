# Host Proposal Notification System

**Created**: 2026-01-29
**Classification**: BUILD
**Status**: Ready for Execution

---

## Objective

Implement a notification system that alerts hosts when they receive new proposals. Notifications should appear in:
1. **Header Message Element** - Badge/indicator showing unread proposal notifications
2. **Messages Page** - Visual indicator showing new proposal-related threads/messages

---

## Context Analysis

### Current System State

1. **Header Component** (`app/src/islands/shared/Header.jsx`):
   - Already has `LoggedInAvatar` component that shows a messaging icon with unread count
   - Uses `useLoggedInAvatarData.js` to fetch user data including `unreadMessagesCount`
   - Has pattern for showing notification badges (see `HeaderSuggestedProposalTrigger`)

2. **LoggedInAvatar** (`app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`):
   - Already displays a messaging icon with badge for `effectiveUnreadMessagesCount`
   - Fetches data via `useLoggedInAvatarData` hook
   - Badge shows count of unread messages (red badge for urgency)

3. **Messages Edge Function** (`supabase/functions/messages/index.ts`):
   - Has `get_threads` action that returns threads with `unread_count`
   - Each thread can be associated with a proposal via `thread.Proposal` field
   - Messages system already tracks read/unread state

4. **Proposal System**:
   - Proposals create messaging threads when hosts receive them
   - Thread table has `Proposal` field linking to the proposal
   - `_message` table has `Unread Users` jsonb field

5. **ThreadCard Component** (`app/src/islands/pages/MessagingPage/components/ThreadCard.jsx`):
   - Already shows `unread_count` with visual indicator
   - Could be enhanced to highlight proposal-related threads

### Key Files to Modify

| File | Changes Needed |
|------|----------------|
| `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` | Add host proposal notification count query |
| `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx` | Show host proposal notification badge on messaging icon |
| `supabase/functions/messages/handlers/getThreads.ts` | Include proposal status info in thread data |
| `app/src/islands/pages/MessagingPage/components/ThreadCard.jsx` | Highlight proposal threads with pending status |
| `app/src/islands/pages/MessagingPage/components/ThreadSidebar.jsx` | Add "New Proposals" section indicator |

---

## Implementation Plan

### Phase 1: Backend - Add Proposal Notification Query

**File**: `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`

**Task**: Add a query to count unread proposal-related messages for hosts.

**Current Logic**:
- The hook already fetches `unreadMessagesCount` by querying `_message` table
- Need to add a separate count for proposal-related unread messages

**Implementation**:
```javascript
// Add to existing queries in useLoggedInAvatarData
// Count of threads where:
// 1. User is the host
// 2. Thread has an associated proposal
// 3. Thread has unread messages (thread "~Date Last Message" > last read timestamp)

const { data: proposalThreads, error: proposalError } = await supabase
  .from('thread')
  .select('_id, Proposal, "~Date Last Message"')
  .eq('"-Host User"', bubbleId)
  .not('Proposal', 'is', null)
  .order('"~Date Last Message"', { ascending: false });
```

**Return Value Addition**:
- Add `pendingProposalThreadsCount` to returned data object

### Phase 2: Frontend - Add Notification Badge for Host Proposals

**File**: `app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`

**Task**: Display a separate badge or combined badge showing host has new proposals to review.

**Approach**:
The existing messaging icon already shows `effectiveUnreadMessagesCount`. For hosts, we can enhance this to specifically indicate when unread messages are related to proposals.

**Options** (choose one):
A. **Separate Badge**: Add a second indicator specifically for "New Proposals"
B. **Combined Badge**: Keep single badge but include proposal-related unread count
C. **Badge Color Logic**: Change badge color to indicate proposal-related unread messages

**Recommended**: Option C - Use badge color logic
- Red badge = urgent (includes new proposals)
- The count already includes unread messages which would include proposal threads

**Alternative Enhancement**: Add tooltip or hover text indicating "X new proposal messages"

### Phase 3: Messages Page - Highlight Proposal Threads

**File**: `app/src/islands/pages/MessagingPage/components/ThreadCard.jsx`

**Task**: Add visual indicator for threads associated with proposals.

**Current State**:
- ThreadCard already shows unread_count badge
- Has `property_name` display

**Implementation**:
```jsx
// Add prop for proposal info
const hasProposal = thread.proposal_id || thread.Proposal;
const isNewProposal = thread.proposal_status === 'pending';

// Add visual indicator
{hasProposal && (
  <span className={`proposal-indicator ${isNewProposal ? 'new' : ''}`}>
    Proposal
  </span>
)}
```

**CSS Addition**:
```css
.proposal-indicator {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.proposal-indicator.new {
  background: #fef3cd;
  color: #856404;
  font-weight: 500;
}
```

### Phase 4: Thread Data Enhancement

**File**: `supabase/functions/messages/handlers/getThreads.ts`

**Task**: Include proposal status information when returning threads.

**Current State**:
- `get_threads` action fetches threads but may not include proposal status

**Implementation**:
- Join thread data with proposal table to get status
- Return `proposal_id` and `proposal_status` in thread object

```typescript
// In getThreads.ts handler
const { data: threads } = await supabase
  .from('thread')
  .select(`
    _id,
    "Modified Date",
    "-Host User",
    "-Guest User",
    "Listing",
    "~Last Message",
    "Thread Subject",
    "Proposal",
    proposal:Proposal (
      _id,
      "Status"
    )
  `)
  .or(`"-Host User".eq.${userId},"-Guest User".eq.${userId}`)
  .order('"Modified Date"', { ascending: false });
```

### Phase 5: Messages Page Logic Update

**File**: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`

**Task**: Ensure proposal-related thread data flows through correctly.

**Current State**:
- `fetchThreads()` calls the messages Edge Function
- Thread transformation happens in the hook

**Implementation**:
- Ensure the transformed thread object includes `proposal_id` and `proposal_status`
- The Edge Function enhancement (Phase 4) will provide this data

---

## Data Flow

```
Host receives new proposal
    |
    v
Proposal created in Supabase (status: pending)
    |
    v
Thread created with Proposal reference
    |
    v
SplitBot sends welcome message to thread
    |
    v
useLoggedInAvatarData fetches:
  - unreadMessagesCount (general)
  - pendingProposalThreadsCount (host-specific)
    |
    v
LoggedInAvatar shows:
  - Messaging icon with badge (unread count)
  - Badge indicates proposal activity
    |
    v
Host clicks messaging icon
    |
    v
MessagingPage shows:
  - Thread list with "Proposal" badges
  - Pending proposals highlighted
  - Unread indicators on threads
```

---

## Files to Create/Modify

### Files to Modify

1. **`app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`**
   - Add `pendingProposalThreadsCount` to data fetching
   - Add query for threads with pending proposals where user is host

2. **`app/src/islands/shared/LoggedInAvatar/LoggedInAvatar.jsx`**
   - Optionally add visual distinction for proposal notifications
   - Add tooltip text mentioning proposals

3. **`supabase/functions/messages/handlers/getThreads.ts`**
   - Join proposal data when fetching threads
   - Return `proposal_id` and `proposal_status` in response

4. **`app/src/islands/pages/MessagingPage/components/ThreadCard.jsx`**
   - Add proposal indicator badge
   - Highlight new proposal threads

5. **`app/src/islands/pages/MessagingPage/components/ThreadCard.css`** (or relevant CSS file)
   - Add styles for proposal indicator

6. **`app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`**
   - Ensure proposal data is passed through thread transformation

### Files to Read (for context during execution)

1. `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js` - Current data fetching logic
2. `supabase/functions/messages/handlers/getThreads.ts` - Current thread fetching
3. `app/src/islands/pages/MessagingPage/components/ThreadCard.jsx` - Current thread display
4. `app/src/islands/pages/MessagingPage/components/ThreadCard.css` - Current thread styles

---

## Testing Checklist

- [ ] Host without proposals sees normal messaging icon
- [ ] Host with pending proposal sees badge on messaging icon
- [ ] Host opens messages page and sees proposal threads highlighted
- [ ] Thread card shows "Proposal" badge for proposal-related threads
- [ ] New/pending proposals have distinct visual treatment
- [ ] Guest users are not affected by host-specific logic
- [ ] Badge count updates when host reads messages
- [ ] Real-time updates work for new incoming proposals

---

## Success Criteria

1. Hosts receive visual notification in header when new proposals arrive
2. Messages page clearly indicates which threads are proposal-related
3. Pending/new proposals have distinct visual treatment vs. older proposals
4. Notification counts are accurate and update in real-time
5. Guest users see no changes (host-specific feature)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Performance impact from additional queries | Use efficient joins, consider caching |
| RLS policies blocking proposal joins | Test with service role, adjust RLS if needed |
| Real-time updates not triggering | Ensure Realtime is enabled on relevant tables |

---

## Estimated Effort

- **Phase 1**: 30 minutes (backend query)
- **Phase 2**: 20 minutes (badge logic)
- **Phase 3**: 30 minutes (thread card UI)
- **Phase 4**: 30 minutes (Edge Function enhancement)
- **Phase 5**: 20 minutes (logic hook update)
- **Testing**: 30 minutes

**Total**: ~2.5 hours

---

**Plan Author**: Claude (implementation-planner)
**Ready for**: plan-executor
