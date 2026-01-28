# Debug Plan: Host Proposals "Message Guest" Navigation

**Created**: 2026-01-28
**Type**: DEBUG
**Priority**: Medium
**Status**: Ready for Implementation

---

## Problem Summary

The "Message Guest" button on the Host Proposals page shows a placeholder toast ("Opening Messages / Opening message thread with Guest") instead of navigating to the actual messaging page. This is an incomplete implementation with a `TODO` comment.

---

## Root Cause Analysis

### Current Implementation (Broken)
**File**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` (lines 1053-1058)

```javascript
const handleSendMessage = useCallback((proposal) => {
  const guest = proposal.guest || proposal.Guest || proposal['Created By'] || {};
  const guestName = guest.firstName || guest['First Name'] || 'Guest';
  showToast({ title: 'Opening Messages', content: `Opening message thread with ${guestName}`, type: 'info' });
  // TODO: Navigate to messaging or open message modal
}, []);
```

**Root Cause**: The navigation was never implemented. The function only shows a toast and does nothing else.

---

## Existing Pattern Analysis

### Guest Side Implementation (Working)
The guest side already uses `navigateToMessaging` from the navigation workflow:

**File**: `app/src/islands/pages/proposals/ProposalCard.jsx` (line 1187)
```javascript
import { navigateToMessaging } from '../../../logic/workflows/proposals/navigationWorkflow.js';
// ...
<button className="link-item" onClick={() => navigateToMessaging(host?._id, proposal._id)}>
  Message Host
</button>
```

### Navigation Workflow
**File**: `app/src/logic/workflows/proposals/navigationWorkflow.js` (lines 34-57)

```javascript
export function navigateToMessaging(hostId, proposalId) {
  if (!hostId) {
    console.error('[navigationWorkflow] No host ID found for messaging');
    return;
  }

  let url = `/messages`;
  const params = new URLSearchParams();

  if (hostId) {
    params.append('recipient', hostId);
  }
  if (proposalId) {
    params.append('proposal', proposalId);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  console.log('[navigationWorkflow] Navigating to messaging:', url);
  window.location.href = url;
}
```

### Messaging Page Thread Selection
**File**: `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` (lines 189-205)

The messaging page reads the `?thread=THREAD_ID` parameter to auto-select a thread:
```javascript
const params = new URLSearchParams(window.location.search);
const threadId = params.get('thread');

if (threadId) {
  const thread = threads.find(t => t._id === threadId);
  if (thread) {
    hasAutoSelectedThread.current = true;
    handleThreadSelectInternal(thread);
  }
}
```

### Thread-Proposal Relationship
Threads are linked to proposals via the `Proposal` column in the `thread` table. The backend provides `findThreadByProposal` to look up existing threads:

**File**: `supabase/functions/_shared/messagingHelpers.ts` (lines 329-346)

```typescript
export async function findThreadByProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('thread')
    .select('_id')
    .eq('"Proposal"', proposalId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[messagingHelpers] Thread lookup by proposal error:', error);
    return null;
  }

  return data?._id || null;
}
```

---

## Solution Options

### Option A: Navigate with `?thread=THREAD_ID` (Recommended)
Query for the thread ID using the proposal ID, then navigate directly with `?thread=` parameter.

**Pros**:
- Auto-selects the correct thread immediately
- Consistent with how the messaging page expects to receive context
- No fallback needed if thread exists

**Cons**:
- Requires async lookup before navigation
- Thread may not exist yet (edge case)

### Option B: Navigate with `?recipient=GUEST_ID&proposal=PROPOSAL_ID`
Use the existing `navigateToMessaging` workflow function.

**Pros**:
- Already implemented in navigation workflow
- Simple to use

**Cons**:
- Messaging page currently only reads `?thread=` parameter
- The `recipient` and `proposal` params are not currently handled

### Option C: Create new navigation function `navigateToMessageThread`
Create a dedicated function that:
1. First queries for thread ID by proposal
2. Falls back to `?proposal=` if thread not found
3. Navigates to `/messages?thread=THREAD_ID`

**Pros**:
- Clean, purpose-built solution
- Can handle edge cases

**Cons**:
- Adds complexity vs reusing existing patterns

---

## Recommended Solution: Option A (Modified)

Since the proposal already has a thread created when it's submitted (via `createProposalThread` handler), we should:

1. Query for the thread ID using the proposal's `_id`
2. Navigate to `/messages?thread=THREAD_ID`
3. If no thread found (rare edge case), fall back to showing an error toast

---

## Implementation Plan

### Step 1: Add Thread Lookup Utility
Create a lightweight client-side function to query thread by proposal.

**File**: `app/src/lib/messagingUtils.js` (new file)

```javascript
import { supabase } from './supabase.js';

/**
 * Find thread ID for a given proposal
 * @param {string} proposalId - The proposal ID
 * @returns {Promise<string|null>} The thread ID or null if not found
 */
export async function findThreadByProposal(proposalId) {
  if (!proposalId) return null;

  const { data, error } = await supabase
    .from('thread')
    .select('_id')
    .eq('Proposal', proposalId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[messagingUtils] Thread lookup error:', error);
    return null;
  }

  return data?._id || null;
}
```

### Step 2: Update handleSendMessage in useHostProposalsPageLogic.js
Replace the placeholder implementation with actual navigation.

**File**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`

**Current** (lines 1053-1058):
```javascript
const handleSendMessage = useCallback((proposal) => {
  const guest = proposal.guest || proposal.Guest || proposal['Created By'] || {};
  const guestName = guest.firstName || guest['First Name'] || 'Guest';
  showToast({ title: 'Opening Messages', content: `Opening message thread with ${guestName}`, type: 'info' });
  // TODO: Navigate to messaging or open message modal
}, []);
```

**New**:
```javascript
const handleSendMessage = useCallback(async (proposal) => {
  const guest = proposal.guest || proposal.Guest || proposal['Created By'] || {};
  const guestName = guest.firstName || guest['First Name'] || 'Guest';

  // Get proposal ID
  const proposalId = proposal._id || proposal.id;
  if (!proposalId) {
    showToast({ title: 'Error', content: 'Unable to find proposal ID', type: 'error' });
    return;
  }

  // Look up thread for this proposal
  const threadId = await findThreadByProposal(proposalId);

  if (threadId) {
    // Navigate to messages page with thread pre-selected
    console.log('[useHostProposalsPageLogic] Navigating to thread:', threadId);
    window.location.href = `/messages?thread=${threadId}`;
  } else {
    // Thread not found - this is unusual, show error
    console.warn('[useHostProposalsPageLogic] No thread found for proposal:', proposalId);
    showToast({
      title: 'Thread Not Found',
      content: `Unable to find message thread for this proposal. Please try again.`,
      type: 'warning'
    });
  }
}, []);
```

### Step 3: Add Import Statement
Add the import for `findThreadByProposal` at the top of the file.

```javascript
import { findThreadByProposal } from '../../../lib/messagingUtils.js';
```

---

## Files to Modify

1. **Create**: `app/src/lib/messagingUtils.js`
   - New utility file with `findThreadByProposal` function

2. **Modify**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
   - Add import for `findThreadByProposal`
   - Update `handleSendMessage` function (lines 1053-1058)

---

## Testing Plan

1. **Basic Flow**:
   - Navigate to Host Proposals page
   - Expand a proposal card
   - Click "Message Guest" button
   - Verify: Navigates to `/messages?thread=THREAD_ID`
   - Verify: Correct thread is auto-selected

2. **Edge Cases**:
   - Test with a proposal that has no thread (should show warning toast)
   - Test with proposal where guest field is in different formats
   - Test navigation when already on messages page

3. **Verify Thread Content**:
   - After navigation, verify the correct guest/listing is shown
   - Verify messages for the proposal are displayed

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Thread not found | Low | Medium | Show warning toast, log for debugging |
| Proposal ID missing | Low | Medium | Show error toast, guard clause |
| RLS blocks thread query | Low | High | User is host, RLS should allow access |

---

## Definition of Done

- [ ] "Message Guest" button navigates to `/messages?thread=THREAD_ID`
- [ ] Correct thread is auto-selected on messages page
- [ ] Error handling for missing thread or proposal ID
- [ ] Console logging for debugging
- [ ] No regressions in other proposal card actions
