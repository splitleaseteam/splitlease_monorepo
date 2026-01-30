# Counteroffer Summary Debug Analysis

**Date**: 2026-01-29
**Issue**: AI Counteroffer Summary not showing on Guest Proposals page
**URL Tested**: http://localhost:3000/guest-proposals?proposal=1768674109497x26858129648361608

---

## Testing Limitations

The Playwright browser session was unable to fully test the Guest Proposals page because:

1. **User Type Mismatch**: The currently logged-in user (`host.e2e.nightly.20260129110832@split.lease`) is a **Host** type, not a Guest
2. **Access Control**: The Guest Proposals page (`/guest-proposals`) only allows Guest users
3. **Redirect Behavior**: The page correctly redirects Host users to the home page with the log message: `"User is not a Guest (type: Host), redirecting to home"`

---

## Code Analysis: How Counteroffer Summary Should Work

### 1. Data Fetching (`app/src/lib/proposals/userProposalQueries.js`)

Lines 495-545 fetch the counteroffer summary:

```javascript
// Step 6.6: Fetch SplitBot counteroffer summary messages
// These are created when a host submits a counteroffer - stored in _message table
// Link: proposal._id -> thread."Proposal" -> _message."Associated Thread/Conversation"

const counterofferSummaryMap = new Map();

if (proposalIdsForSummaries.length > 0) {
  // First, fetch threads for all proposals
  const { data: threadsData, error: threadsError } = await supabase
    .from('thread')
    .select('_id, "Proposal"')
    .in('"Proposal"', proposalIdsForSummaries);

  if (threadsData && threadsData.length > 0) {
    const threadIds = threadsData.map(t => t._id);

    // Fetch SplitBot counteroffer messages
    const { data: counterofferMsgs, error: counterofferError } = await supabase
      .from('_message')
      .select(`
        _id,
        "Message Body",
        "Call to Action",
        "Associated Thread/Conversation",
        "Created Date"
      `)
      .in('"Associated Thread/Conversation"', threadIds)
      .eq('"is Split Bot"', true)
      .eq('"Call to Action"', 'Respond to Counter Offer')
      .order('"Created Date"', { ascending: false });

    // Map messages to proposals (take most recent per proposal)
    counterofferMsgs.forEach(msg => {
      const threadId = msg['Associated Thread/Conversation'];
      const proposalId = threadToProposalMap.get(threadId);
      if (proposalId && !counterofferSummaryMap.has(proposalId)) {
        counterofferSummaryMap.set(proposalId, msg['Message Body']);
      }
    });
  }
}
```

### 2. Data Attachment (Line 583, 619)

The `counterofferSummary` is attached to each proposal:

```javascript
const counterofferSummary = counterofferSummaryMap.get(proposal._id) || null;

return {
  ...proposal,
  // ... other fields
  counterofferSummary
};
```

### 3. UI Display (`app/src/islands/pages/proposals/ExpandableProposalCard.jsx`)

Lines 629 and 854-855:

```javascript
// Extract from proposal
const counterofferSummary = proposal?.counterofferSummary || null;

// Conditional rendering (only shows if BOTH conditions are true)
{isCounteroffer && counterofferSummary && (
  <CounterofferSummarySection summary={counterofferSummary} />
)}
```

---

## Potential Causes for Missing Summary

### 1. No Thread Exists for the Proposal
- The query joins through `thread."Proposal"` to link proposals to messages
- If no thread exists for the proposal, no messages will be found
- **Check**: Does a thread record exist with `Proposal = 1768674109497x26858129648361608`?

### 2. No SplitBot Message with Correct Call to Action
- The query filters for: `"is Split Bot" = true` AND `"Call to Action" = 'Respond to Counter Offer'`
- **Check**: Does a message exist in the thread with these exact field values?

### 3. `counter offer happened` Flag is False
- The UI only shows the summary when `isCounteroffer && counterofferSummary`
- Line 570: `const isCounteroffer = proposal?.['counter offer happened'];`
- **Check**: Is the `counter offer happened` field true on the proposal?

### 4. Query Errors (Silent Failures)
- The code catches errors but doesn't re-throw them
- Errors in thread or message fetch would result in empty `counterofferSummaryMap`
- **Check**: Look for console errors during data fetching

### 5. Edge Function Issues
- Console showed: `"Failed to send a request to the Edge Function"`
- This could affect data fetching if edge functions are involved

---

## Recommended Next Steps

### 1. Test with a Guest User Account
Log in as a Guest user to access the Guest Proposals page and observe:
- Console logs for "Fetching counteroffer summaries"
- Whether `counterofferMsgs` contains any data
- The actual `counterofferSummaryMap` content

### 2. Database Verification
Check the following tables for proposal ID `1768674109497x26858129648361608`:

```sql
-- Check if proposal has counteroffer flag
SELECT _id, "counter offer happened"
FROM proposal
WHERE _id = '1768674109497x26858129648361608';

-- Check if thread exists
SELECT * FROM thread
WHERE "Proposal" = '1768674109497x26858129648361608';

-- Check for SplitBot counteroffer messages (if thread exists)
SELECT m.*
FROM _message m
JOIN thread t ON m."Associated Thread/Conversation" = t._id
WHERE t."Proposal" = '1768674109497x26858129648361608'
  AND m."is Split Bot" = true
  AND m."Call to Action" = 'Respond to Counter Offer';
```

### 3. Add Debug Logging
Temporarily add console.log statements in `userProposalQueries.js`:
- After thread fetch: Log `threadsData` content
- After message fetch: Log `counterofferMsgs` content
- After map creation: Log `counterofferSummaryMap` size

---

## Files Involved

| File | Purpose |
|------|---------|
| `app/src/lib/proposals/userProposalQueries.js` | Fetches and enriches proposal data including counterofferSummary |
| `app/src/islands/pages/proposals/useGuestProposalsPageLogic.js` | Page logic hook that calls `fetchUserProposalsFromUrl()` |
| `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` | UI component that displays `CounterofferSummarySection` |
| `app/src/islands/pages/proposals/CounterofferSummarySection.jsx` | The actual summary display component |

---

## Console Logs Observed

From the Playwright session, these relevant logs were captured:

```
❌ Guest Proposals: User is not a Guest (type: Host), redirecting to home
```

The page correctly identified the Host user and redirected before any proposal data fetching occurred. A Guest user session is required for further debugging.
