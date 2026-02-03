# BUG-001: Proposal Workflow Requires Rental Application Before Host Acceptance

**Status**: OPEN
**Priority**: HIGH
**Type**: Workflow Blocker
**Discovered**: 2026-02-02 (E2E Test Session)
**Proposal ID**: `1770050561455x12931805482580172`

---

## Summary

The proposal workflow currently requires guests to submit a rental application before the host can review and accept the proposal. This creates a blocker where proposals remain stuck in "Awaiting Rental Application" status, and the host cannot proceed with acceptance even if they want to.

**Expected Behavior**: Host should be able to accept a proposal regardless of rental application status. The rental application can be collected later in the workflow if needed.

**Actual Behavior**: Proposal remains in "Proposal Submitted by guest - Awaiting Rental Application" status. Host acceptance workflow is blocked. No messages are created in the thread (0 messages, expected 2+).

---

## Root Cause Analysis

### 1. Workflow Design Issue

The current workflow enforces this sequence:
```
Guest submits proposal
  → Status: "Proposal Submitted by guest - Awaiting Rental Application"
  → Guest must submit rental application
  → Status changes to "Host Review" (via rental-application/handlers/submit.ts:309)
  → Host can now accept proposal
```

**File**: `supabase/functions/rental-application/handlers/submit.ts` (lines 304-316)

```typescript
// Batch update proposals with rental application reference AND status change to Host Review
// Only update proposals that are in "Awaiting Rental Application" status
const { error: proposalsUpdateError } = await supabase
  .from('proposal')
  .update({
    'rental application': rentalAppId,
    'Status': 'Host Review',
    'Modified Date': now,
  })
  .in('_id', proposalIds)
  .in('Status', [
    'Proposal Submitted by guest - Awaiting Rental Application',
    'Proposal Submitted for guest by Split Lease - Awaiting Rental Application',
  ]);
```

### 2. Status Transition Rules

**File**: `supabase/functions/proposal/lib/status.ts` (lines 22-27)

```typescript
"Proposal Submitted by guest - Awaiting Rental Application": [
  "Host Review",
  "Proposal Cancelled by Guest",
],
```

The status can ONLY transition to:
- "Host Review" (which happens when rental app is submitted)
- "Proposal Cancelled by Guest"

There is NO direct path from "Awaiting Rental Application" to "Proposal or Counteroffer Accepted / Drafting Lease Documents".

### 3. Host Acceptance Workflow

**File**: `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js`

The host acceptance workflow (lines 30-184) creates a lease and updates the proposal status to "Proposal or Counteroffer Accepted / Drafting Lease Documents". However, this workflow is likely never reached because the UI doesn't show the "Accept" button when the proposal is in "Awaiting Rental Application" status.

### 4. UI Business Rules

**File**: `app/src/logic/rules/proposals/proposalRules.js` (lines 119-127)

```javascript
export function canSubmitRentalApplication(proposal) {
  if (!proposal) {
    return false;
  }

  const status = proposal.status || proposal.Status;

  return status === PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key;
}
```

The UI only allows rental application submission when in this status, but provides no alternative path for the host to proceed.

---

## Why This Is Wrong

### Business Logic Perspective

1. **Premature requirement**: Requiring a rental application before the host even reviews the proposal is premature. The host might reject the proposal, making the rental application submission wasted effort.

2. **Workflow flexibility**: Hosts should be able to:
   - Review proposals without waiting for rental applications
   - Accept proposals and collect rental applications later
   - Request rental applications only for proposals they're seriously considering

3. **User experience**: Guests are forced to complete a lengthy rental application before knowing if the host is even interested in their proposal.

### Comparison with Successful Flow

The E2E test shows that another proposal (`1770049694673x84502900247355872`) successfully went through the workflow with 3 messages exchanged. This suggests that when the rental application is submitted early, the workflow proceeds smoothly. The difference is timing, not capability.

---

## Impact

- **Test failure**: E2E test failed at step 3.7 (Host accepts proposal)
- **Blocked workflow**: Proposal ID `1770050561455x12931805482580172` stuck in "awaiting-rental-application" status
- **No messages created**: 0 messages in thread (expected 2+)
- **User frustration**: Both host and guest are blocked from progressing

---

## Proposed Fix Options

### Option 1: Allow Direct Host Acceptance (Recommended)

**Change status transition rules** to allow hosts to accept proposals directly from "Awaiting Rental Application" status.

**File to modify**: `supabase/functions/proposal/lib/status.ts`

```typescript
"Proposal Submitted by guest - Awaiting Rental Application": [
  "Host Review",
  "Proposal or Counteroffer Accepted / Drafting Lease Documents", // ADD THIS
  "Host Counteroffer Submitted / Awaiting Guest Review", // ADD THIS
  "Proposal Cancelled by Guest",
  "Proposal Rejected by Host", // ADD THIS
],
```

**Pros**:
- Simple, minimal code change
- Preserves existing workflow for guests who want to submit rental app early
- Gives hosts full control over acceptance timing

**Cons**:
- May need to adjust lease creation logic to handle missing rental application data

### Option 2: Make Rental Application Optional in Workflow

**Add a "Skip for Now" option** in rental application wizard that transitions proposal to "Host Review" without requiring form completion.

**Files to modify**:
- `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`
- Status transition rules (as in Option 1)

**Pros**:
- More explicit user flow
- Guest maintains control over when to submit rental app

**Cons**:
- More UI changes required
- More complex implementation

### Option 3: Auto-Transition to Host Review

**Automatically move proposals** from "Awaiting Rental Application" to "Host Review" after 24-48 hours, allowing the host to see and accept proposals even without rental applications.

**Pros**:
- No UI changes needed
- Time-based automation feels natural

**Cons**:
- Requires cron job or background worker
- May feel inconsistent to users (why did status change automatically?)

---

## Recommended Solution

**Option 1** is recommended because:

1. **Minimal code change**: Only requires updating status transition rules
2. **Preserves flexibility**: Both workflows (rental app first OR host acceptance first) remain valid
3. **Fast to implement**: Can be deployed quickly to unblock E2E tests
4. **Business logic aligned**: Hosts should have control over their acceptance process

---

## Implementation Steps

### Step 1: Update Status Transition Rules

**File**: `supabase/functions/proposal/lib/status.ts`

Add the following allowed transitions:

```typescript
"Proposal Submitted by guest - Awaiting Rental Application": [
  "Host Review",
  "Proposal or Counteroffer Accepted / Drafting Lease Documents",
  "Host Counteroffer Submitted / Awaiting Guest Review",
  "Proposal Cancelled by Guest",
  "Proposal Rejected by Host",
],

"Proposal Submitted for guest by Split Lease - Awaiting Rental Application": [
  "Host Review",
  "Proposal or Counteroffer Accepted / Drafting Lease Documents",
  "Host Counteroffer Submitted / Awaiting Guest Review",
  "Proposal Cancelled by Split Lease",
  "Guest Ignored Suggestion",
],
```

### Step 2: Update Host Acceptance Workflow (If Needed)

**File**: `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js`

Verify that the workflow handles cases where rental application data is missing (it likely already does via `proposal.has_guest_counteroffer` checks).

### Step 3: Update UI Business Rules

**File**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`

Ensure that the "Accept" button is visible for proposals in "Awaiting Rental Application" status. The current implementation in `handleAcceptProposal` (line 756) should already work, but verify button visibility logic.

### Step 4: Add Validation

Consider adding a check in the lease creation workflow to prompt for rental application if missing (non-blocking warning).

### Step 5: Test

1. Create a proposal without submitting rental application
2. Verify host can see and accept the proposal
3. Verify lease creation workflow handles missing rental application gracefully
4. Verify messages are created in thread (2+ messages expected)
5. Re-run E2E test to confirm fix

---

## Related Files

### Workflow Files
- `supabase/functions/rental-application/handlers/submit.ts` (rental app submission)
- `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js` (host acceptance)
- `supabase/functions/proposal/actions/update.ts` (proposal status updates)

### Status Configuration
- `supabase/functions/proposal/lib/status.ts` (status transition rules)
- `app/src/logic/constants/proposalStatuses.js` (frontend status config)
- `app/src/config/proposalStatusConfig.js` (deprecated, verify not in use)

### Business Rules
- `app/src/logic/rules/proposals/proposalRules.js` (proposal rule predicates)
- `app/src/logic/rules/proposals/canAcceptProposal.js` (acceptance rules)

### UI Components
- `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` (host UI logic)
- `app/src/islands/pages/HostProposalsPage/index.jsx` (host UI component)

---

## Test Data

**Proposal ID**: `1770050561455x12931805482580172`
**Listing ID**: `1770049404893x91412297566369040` (Spacious Brooklyn Loft - Test Listing B)
**Guest Email**: `guest_test_1770049457612@example.com`
**Host Email**: `host_test_1770049063660@example.com`
**Current Status**: "awaiting-rental-application"
**Messages Created**: 0 (expected 2+)

---

## References

- E2E Test Session State: `test-session/state.json`
- Proposal Submit Handler: `supabase/functions/rental-application/handlers/submit.ts:304-316`
- Status Transition Rules: `supabase/functions/proposal/lib/status.ts:22-27`
- Host Acceptance Workflow: `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js`
