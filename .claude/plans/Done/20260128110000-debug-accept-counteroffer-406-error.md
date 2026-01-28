# Debug Plan: Accept Counteroffer 406 Error

**Created**: 2026-01-28 11:00:00
**Status**: New
**Priority**: High
**Classification**: DEBUG

---

## Bug Summary

When a guest accepts a counteroffer, two issues occur:
1. **Bug 1**: The "Accept Host Terms" button on the proposal card does not work
2. **Bug 2**: When opening the CompareTermsModal (ReviewTerms shared island) and clicking accept, a 406 error occurs

### Key Error from Logs

```
[counterofferWorkflow] Accepting counteroffer for proposal: 1769130751870x21602817865937584
qzsmhgyojmwvtjmnrdea.supabase.co/rest/v1/proposal?_id=eq.1769130751870x21602817865937584&select=*:1 Failed to load resource: the server responded with a status of 406 ()
[counterofferWorkflow] Error accepting counteroffer: Object
[useCompareTermsModalLogic] Error accepting counteroffer: Error: Failed to accept counteroffer: Cannot coerce the result to a single JSON object
```

---

## Root Cause Analysis

### Bug 2: 406 Error - PostgREST `.single()` on Non-Existent Row

**Location**: `app/src/logic/workflows/proposals/counterofferWorkflow.js` lines 37-41

**The Problem**: The `acceptCounteroffer` function uses `.single()` modifier which requires exactly ONE row to be returned. The 406 error with "Cannot coerce the result to a single JSON object" means:

1. The query is looking for a row with `_id = '1769130751870x21602817865937584'`
2. **The row does not exist** in the `proposal` table, OR
3. The `_id` field is stored with a different format than expected

**Code Analysis**:
```javascript
// Line 37-41 in counterofferWorkflow.js
const { data: proposal, error: fetchError } = await supabase
  .from('proposal')
  .select('*')
  .eq('_id', proposalId)
  .single();
```

**Root Cause**: The proposal ID `1769130751870x21602817865937584` is in Bubble format. The Supabase `proposal` table may:
- Not have this proposal synced from Bubble yet
- Have the proposal stored under a different ID format
- Have the `_id` column indexed differently

**Evidence**: The PostgREST error 406 with message "Cannot coerce the result to a single JSON object" specifically occurs when `.single()` is used but returns 0 rows (or multiple rows).

### Bug 1: Button Not Working on Proposal Card

**Location**: `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` lines 1086-1108

**The Problem**: Looking at the button configuration system, when the status is "Host Counteroffer Submitted / Awaiting Guest Review", the `guestAction2` button should show "Review Host Terms" with action `review_counteroffer`. However, the primary action button (`guestAction1`) shows "Accept Host Terms" with action `accept_counteroffer`.

The button click handler in `ExpandableProposalCard.jsx` (lines 1060-1075) handles various actions but **does NOT have a case for `accept_counteroffer`**:

```javascript
onClick={() => {
  if (buttonConfig.guestAction1.action === 'modify_proposal') {
    setProposalDetailsModalInitialView('pristine');
    setShowProposalDetailsModal(true);
  } else if (buttonConfig.guestAction1.action === 'submit_rental_app') {
    goToRentalApplication(proposal._id);
  } else if (buttonConfig.guestAction1.action === 'delete_proposal') {
    handleDeleteProposal();
  } else if (buttonConfig.guestAction1.action === 'confirm_proposal') {
    handleConfirmProposal();
  }
  // MISSING: No case for 'accept_counteroffer' action!
}}
```

**Root Cause**: The `accept_counteroffer` action is defined in `statusButtonConfig.js` (line 298-299) but there's no handler for it in `ExpandableProposalCard.jsx`. The button clicks but nothing happens because the action falls through without executing any code.

---

## Detailed Findings

### File: `app/src/lib/proposals/statusButtonConfig.js`

Lines 297-299 define the action mapping:
```javascript
case 'Accept Host Terms':
  guestAction1.action = 'accept_counteroffer';
  break;
```

This correctly maps the database label "Accept Host Terms" to action `accept_counteroffer`.

### File: `app/src/islands/pages/proposals/ExpandableProposalCard.jsx`

**Missing handler**: The button click handler (lines 1060-1075) does not handle `accept_counteroffer`. It handles:
- `modify_proposal`
- `submit_rental_app`
- `delete_proposal`
- `confirm_proposal`

But NOT `accept_counteroffer`.

### File: `app/src/logic/workflows/proposals/counterofferWorkflow.js`

The `acceptCounteroffer` function has a fundamental flaw - it assumes the proposal exists in Supabase with the given Bubble ID. If the proposal sync is delayed or the ID format is different, the `.single()` call will fail with 406.

### File: `app/src/islands/modals/useCompareTermsModalLogic.js`

The `handleAcceptCounteroffer` function (lines 246-333) calls `acceptCounteroffer(proposal._id)` on line 273. This passes the Bubble-format ID to the workflow function.

---

## Proposed Fixes

### Fix 1: Add `accept_counteroffer` handler to ExpandableProposalCard.jsx

Add case for `accept_counteroffer` in the button click handler to open the CompareTermsModal:

```javascript
// In ExpandableProposalCard.jsx, around line 1060
onClick={() => {
  if (buttonConfig.guestAction1.action === 'modify_proposal') {
    setProposalDetailsModalInitialView('pristine');
    setShowProposalDetailsModal(true);
  } else if (buttonConfig.guestAction1.action === 'submit_rental_app') {
    goToRentalApplication(proposal._id);
  } else if (buttonConfig.guestAction1.action === 'delete_proposal') {
    handleDeleteProposal();
  } else if (buttonConfig.guestAction1.action === 'confirm_proposal') {
    handleConfirmProposal();
  } else if (buttonConfig.guestAction1.action === 'accept_counteroffer') {
    setShowCompareTermsModal(true); // ADD THIS CASE
  }
}}
```

### Fix 2: Remove `.single()` or handle missing row gracefully in counterofferWorkflow.js

Option A - Remove `.single()` and handle array:
```javascript
const { data: proposals, error: fetchError } = await supabase
  .from('proposal')
  .select('*')
  .eq('_id', proposalId);

if (fetchError) {
  throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
}

if (!proposals || proposals.length === 0) {
  throw new Error(`Proposal not found with ID: ${proposalId}`);
}

if (proposals.length > 1) {
  throw new Error(`Multiple proposals found with ID: ${proposalId}`);
}

const proposal = proposals[0];
```

Option B - Use `.maybeSingle()` (returns null instead of error if no row):
```javascript
const { data: proposal, error: fetchError } = await supabase
  .from('proposal')
  .select('*')
  .eq('_id', proposalId)
  .maybeSingle();

if (fetchError) {
  throw new Error(`Failed to fetch proposal: ${fetchError.message}`);
}

if (!proposal) {
  throw new Error(`Proposal not found with ID: ${proposalId}`);
}
```

### Fix 3: Same pattern for the update query (line 59-64)

The update query also uses `.single()`:
```javascript
const { data, error } = await supabase
  .from('proposal')
  .update(updateData)
  .eq('_id', proposalId)
  .select()
  .single();
```

Should be changed to handle the case where no row is updated:
```javascript
const { data, error } = await supabase
  .from('proposal')
  .update(updateData)
  .eq('_id', proposalId)
  .select();

if (error) {
  console.error('[counterofferWorkflow] Error accepting counteroffer:', error);
  throw new Error(`Failed to accept counteroffer: ${error.message}`);
}

if (!data || data.length === 0) {
  throw new Error(`No proposal updated - proposal may not exist with ID: ${proposalId}`);
}

const updatedProposal = data[0];
```

---

## Files to Modify

1. **`app/src/islands/pages/proposals/ExpandableProposalCard.jsx`**
   - Line ~1060-1075: Add `accept_counteroffer` case to button click handler

2. **`app/src/logic/workflows/proposals/counterofferWorkflow.js`**
   - Line 37-41: Change `.single()` to `.maybeSingle()` or remove and handle array
   - Line 59-64: Same pattern for update query

3. **`app/src/islands/pages/proposals/ProposalCard.jsx`**
   - Line ~1330-1350: Verify if same issue exists in the non-expandable ProposalCard

---

## Testing Checklist

- [ ] Create a proposal with status "Host Counteroffer Submitted / Awaiting Guest Review"
- [ ] Verify "Accept Host Terms" button opens CompareTermsModal
- [ ] Click "Accept Host Terms" in CompareTermsModal
- [ ] Verify no 406 error occurs
- [ ] Verify proposal status updates correctly
- [ ] Verify lease creation flow triggers

---

## Related Files

| File | Path | Purpose |
|------|------|---------|
| counterofferWorkflow.js | `app/src/logic/workflows/proposals/counterofferWorkflow.js` | Contains acceptCounteroffer function with 406 bug |
| useCompareTermsModalLogic.js | `app/src/islands/modals/useCompareTermsModalLogic.js` | Modal logic that calls acceptCounteroffer |
| CompareTermsModal.jsx | `app/src/islands/modals/CompareTermsModal.jsx` | UI component for comparing terms |
| ExpandableProposalCard.jsx | `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` | Missing button handler |
| ProposalCard.jsx | `app/src/islands/pages/proposals/ProposalCard.jsx` | May have same missing handler |
| statusButtonConfig.js | `app/src/lib/proposals/statusButtonConfig.js` | Defines button actions |

---

## Implementation Priority

1. **HIGH**: Fix Button 1 (missing handler) - Quick fix, high impact
2. **HIGH**: Fix 406 error - Replace `.single()` with safer pattern
3. **MEDIUM**: Add better error logging for debugging

---

## Notes

- The Bubble-format proposal ID `1769130751870x21602817865937584` suggests this proposal may not be synced to Supabase yet, or there's an ID format mismatch
- The `proposal` table uses Bubble IDs as the `_id` column
- This pattern of `.single()` causing 406 errors has been seen before in the codebase (see `20251217091827-edit-listing-409-regression-report.md`)
