# Host Proposals Page - Accept/Decline Proposal Actions Implementation Plan

**Created**: 2026-01-29
**Status**: New
**Type**: BUILD

---

## Overview

The Host Proposals page currently has Accept and Decline buttons that need to be connected to proper workflows. When a host accepts a proposal, the system should create a lease, show success alerts, and send messages. When a host declines, it should show a rejection form with reasons and process the rejection.

### Current State Analysis

1. **Accept Proposal Flow (Current)**: `handleAcceptProposal` in `useHostProposalsPageLogic.js` only updates status to "Drafting Lease Documents" - it does NOT create a lease or send notifications.

2. **Decline Proposal Flow (Current)**: `handleRejectProposal` opens `HostEditingProposal` with `initialShowReject=true`, which renders `CancelProposalModal`. This flow is working correctly.

3. **Guest Acceptance Pattern (Reference)**: `useCompareTermsModalLogic.js` contains the complete 7-step workflow for accepting counteroffers:
   - Step 2-3: Calculate lease numbering format
   - Step 4: Calculate 4-week compensation
   - Step 5: Update proposal status
   - Step 6: Calculate 4-week rent
   - Step 7: Call lease creation Edge Function
   - Step 8: Send notification messages

---

## Requirements

### 1. Accept Proposal Flow (HOST accepting GUEST's original proposal or GUEST's counteroffer)

When host clicks "Accept":
- [ ] Open HostEditingProposal in "accept mode" (readonly view with reservation breakdown)
- [ ] Show complete reservation breakdown before confirmation
- [ ] On confirmation:
  - [ ] Create lease via `/functions/v1/lease` Edge Function
  - [ ] Update proposal status to "Drafting Lease Documents"
  - [ ] Send SplitBot messages to both guest and host
  - [ ] Show success alert with 48-hour timeline message
  - [ ] Refresh proposals list

### 2. Decline Proposal Flow (already working)

When host clicks "Decline":
- [x] Open CancelProposalModal (via HostEditingProposal)
- [x] Show form for rejection reasons
- [x] Process rejection via Edge Function
- [x] Send notifications (handled by Edge Function)

---

## Implementation Plan

### Phase 1: Create Host Accept Proposal Workflow

**File**: `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js` (NEW)

Create a new workflow function that replicates the 7-step acceptance pattern from guest side:

```javascript
/**
 * Host Accept Proposal Workflow
 *
 * Implements the complete proposal acceptance workflow for hosts:
 * 1. Calculate lease numbering format
 * 2. Calculate 4-week compensation (from proposal)
 * 3. Update proposal status to "Drafting Lease Documents"
 * 4. Calculate 4-week rent
 * 5. Call lease creation Edge Function
 * 6. Send notification messages
 *
 * @param {Object} params
 * @param {string} params.proposalId - Proposal ID
 * @param {Object} params.proposal - Full proposal object
 * @param {boolean} params.isCounteroffer - Whether this is a counteroffer acceptance
 * @returns {Promise<Object>} Result with success status and lease data
 */
export async function hostAcceptProposalWorkflow({ proposalId, proposal, isCounteroffer = false }) {
  // Implementation follows useCompareTermsModalLogic pattern
}
```

### Phase 2: Add Accept Mode to HostEditingProposal

**File**: `app/src/islands/shared/HostEditingProposal/HostEditingProposal.jsx`

Add new prop `mode` with values: `'edit'` (default), `'accept'`

When `mode === 'accept'`:
- Skip to 'general' view (readonly breakdown)
- Change header to "Accept Proposal"
- Change footer buttons to "Cancel" and "Confirm Acceptance"
- Disable all editing fields
- Show full reservation breakdown with final pricing

Changes needed:
1. Add `mode` prop with default `'edit'`
2. Add conditional rendering for accept mode
3. Add new header/footer for accept mode
4. Connect confirmation to acceptance workflow

### Phase 3: Update useHostProposalsPageLogic Hook

**File**: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`

Modify `handleAcceptProposal` to:
1. Set new state `acceptMode: true`
2. Open HostEditingProposal in accept mode
3. Pass the acceptance handler

Add new handler `handleConfirmAcceptance`:
```javascript
const handleConfirmAcceptance = useCallback(async (proposal) => {
  try {
    // Step 1: Calculate lease numbering format
    const { count: leaseCount } = await supabase
      .from('bookings_leases')
      .select('*', { count: 'exact', head: true });

    const numberOfZeros = (leaseCount || 0) < 10 ? 4 : (leaseCount || 0) < 100 ? 3 : 2;

    // Step 2: Determine if this is a counteroffer acceptance
    const hasGuestCounteroffer = proposal.has_guest_counteroffer ||
      proposal.last_modified_by === 'guest';

    // Step 3: Calculate 4-week compensation and rent
    const nightsPerWeek = proposal['nights per week (num)'] ||
      proposal['hc nights per week'] || 0;
    const nightlyPrice = proposal['proposal nightly price'] ||
      proposal['hc nightly price'] || 0;
    const fourWeekCompensation = nightsPerWeek * 4 * nightlyPrice * 0.85;
    const fourWeekRent = nightsPerWeek * 4 * nightlyPrice;

    // Step 4: Call lease Edge Function
    const leaseResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lease`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          payload: {
            proposalId: proposal._id,
            isCounteroffer: hasGuestCounteroffer ? 'yes' : 'no',
            fourWeekRent,
            fourWeekCompensation,
            numberOfZeros,
          },
        }),
      }
    );

    const leaseResult = await leaseResponse.json();
    if (!leaseResult.success) {
      throw new Error(leaseResult.error || 'Failed to create lease');
    }

    // Step 5: Send notification messages
    const { data: thread } = await supabase
      .from('thread')
      .select('_id')
      .eq('Proposal', proposal._id)
      .maybeSingle();

    if (thread) {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_splitbot_message',
            payload: {
              threadId: thread._id,
              ctaName: 'proposal_accepted',
              recipientRole: 'both',
              customMessageBody: 'Great news! The proposal has been accepted...',
            },
          }),
        }
      );
    }

    // Step 6: Refresh and show success
    await refreshProposals();
    setIsEditingProposal(false);
    setAcceptMode(false);
    showToast({
      title: 'Proposal Accepted!',
      content: 'Lease documents will be ready within 48 hours.',
      type: 'success'
    });

  } catch (error) {
    showToast({
      title: 'Error',
      content: error.message || 'Failed to accept proposal',
      type: 'error'
    });
  }
}, []);
```

### Phase 4: Update Host Proposals Page Component

**File**: `app/src/islands/pages/HostProposalsPage/index.jsx`

Update the HostEditingProposal rendering to support accept mode:

```jsx
{isEditingProposal && selectedProposal && (
  acceptMode ? (
    // Accept mode: show readonly breakdown with confirmation
    <div className="editing-proposal-overlay">
      <div className="editing-proposal-container">
        <HostEditingProposal
          proposal={selectedProposal}
          mode="accept"
          onConfirmAcceptance={() => handleConfirmAcceptance(selectedProposal)}
          onCancel={handleCloseEditing}
          onAlert={handleEditingAlert}
        />
      </div>
    </div>
  ) : showRejectOnOpen ? (
    // Reject mode: only render CancelProposalModal
    <HostEditingProposal ... />
  ) : (
    // Edit mode: full editing interface
    <HostEditingProposal ... />
  )
)}
```

---

## Files to Modify

### Primary Files (In Order of Implementation)

1. **NEW: `app/src/logic/workflows/proposals/hostAcceptProposalWorkflow.js`**
   - Create new workflow file following counterofferWorkflow.js pattern
   - Exports: `hostAcceptProposalWorkflow()`

2. **MODIFY: `app/src/islands/shared/HostEditingProposal/HostEditingProposal.jsx`**
   - Add `mode` prop ('edit' | 'accept')
   - Add `onConfirmAcceptance` prop
   - Add accept mode rendering (readonly breakdown, different buttons)
   - Lines affected: ~50-100 new lines

3. **MODIFY: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`**
   - Add `acceptMode` state
   - Modify `handleAcceptProposal` to set acceptMode
   - Add `handleConfirmAcceptance` handler
   - Lines affected: ~100 new lines

4. **MODIFY: `app/src/islands/pages/HostProposalsPage/index.jsx`**
   - Add acceptMode to destructured hook values
   - Update HostEditingProposal rendering for accept mode
   - Lines affected: ~20 new lines

### Secondary Files (May Need Updates)

5. **MODIFY: `app/src/islands/shared/HostEditingProposal/HostEditingProposal.css`**
   - Add styles for accept mode (success button, readonly state)

6. **REVIEW: `app/src/islands/shared/HostEditingProposal/types.js`**
   - May need new type for accept mode

---

## Implementation Order

1. Create `hostAcceptProposalWorkflow.js` workflow file
2. Add `mode` prop and accept mode rendering to `HostEditingProposal.jsx`
3. Add `acceptMode` state and handlers to `useHostProposalsPageLogic.js`
4. Update `index.jsx` to pass accept mode props
5. Add CSS styles for accept mode
6. Test end-to-end flow

---

## Testing Checklist

### Accept Flow Testing
- [ ] Host can click "Accept" on a new proposal
- [ ] HostEditingProposal opens in accept mode with readonly breakdown
- [ ] Clicking "Confirm Acceptance" triggers lease creation
- [ ] Lease Edge Function creates lease successfully
- [ ] Notification messages are sent to both parties
- [ ] Success toast appears with 48-hour message
- [ ] Proposal list refreshes and shows updated status

### Decline Flow Testing (Already Working - Verify)
- [ ] Host can click "Decline" on a proposal
- [ ] CancelProposalModal opens with rejection reasons
- [ ] Selecting reason and confirming processes rejection
- [ ] Proposal status updates to "Rejected by Host"
- [ ] Proposal list refreshes

### Edge Cases
- [ ] Accept proposal with guest counteroffer terms
- [ ] Accept proposal without any modifications
- [ ] Network error during lease creation shows error toast
- [ ] User can retry after error

---

## Key Reference Files

| Purpose | File Path |
|---------|-----------|
| Guest acceptance pattern | `app/src/islands/modals/useCompareTermsModalLogic.js` |
| Counteroffer workflow | `app/src/logic/workflows/proposals/counterofferWorkflow.js` |
| Accept proposal workflow (booking) | `app/src/logic/workflows/booking/acceptProposalWorkflow.js` |
| Host proposals hook | `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` |
| Host editing proposal | `app/src/islands/shared/HostEditingProposal/HostEditingProposal.jsx` |
| Cancel proposal modal | `app/src/islands/modals/CancelProposalModal.jsx` |
| Lease creation handler | `supabase/functions/lease/handlers/create.ts` |
| Proposal statuses | `app/src/logic/constants/proposalStatuses.js` |

---

## Notes

- The decline flow is already working via `CancelProposalModal`
- The lease Edge Function handles all lease creation logic including date generation, payment records, notifications, and Bubble sync
- Toast notifications use `showToast` from `app/src/islands/shared/Toast.jsx`
- Day conversion is handled by the Edge Function, no frontend conversion needed for acceptance
