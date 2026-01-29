# Implementation Plan: Update ProgressTrackerV7 Stage Labels

**Created**: 2026-01-28
**Type**: BUILD - Feature Modification
**Complexity**: Simple (single file update)
**Context File**: miniCLAUDE.md

---

## Objective

Update the ProgressTrackerV7 component to display new progress bar step labels that better reflect the actual proposal workflow stages.

---

## Current State

The progress bar currently displays 6 stages:
1. Submitted
2. Application
3. Review
4. Accepted
5. Signing
6. Active

Located in `PROGRESS_STAGES` constant at line 19:
```javascript
const PROGRESS_STAGES = ['Submitted', 'Application', 'Review', 'Accepted', 'Signing', 'Active'];
```

---

## Desired State

Update the progress bar to display 6 new stage labels:
1. Proposal submitted
2. Rental App Submitted
3. Edit/Review Proposal
4. Review Documents
5. Lease documents
6. Initial Payment

---

## Implementation Steps

### Step 1: Update PROGRESS_STAGES constant

**File**: `app/src/islands/pages/HostProposalsPage/ProgressTrackerV7.jsx`
**Line**: 19

**Change from**:
```javascript
const PROGRESS_STAGES = ['Submitted', 'Application', 'Review', 'Accepted', 'Signing', 'Active'];
```

**Change to**:
```javascript
const PROGRESS_STAGES = ['Proposal submitted', 'Rental App Submitted', 'Edit/Review Proposal', 'Review Documents', 'Lease documents', 'Initial Payment'];
```

### Step 2: Update component header comments

**File**: `app/src/islands/pages/HostProposalsPage/ProgressTrackerV7.jsx`
**Lines**: 1-12

**Change from**:
```javascript
/**
 * ProgressTrackerV7 Component (V7 Design)
 *
 * Horizontal progress steps for ALL proposals (matches guest proposals page):
 * - Steps: Submitted → Application → Review → Accepted → Signing → Active
 * - Completed steps: purple dot + line
 * - Current step: green dot
 * - Future steps: gray dot + line
 * - Terminal (cancelled/rejected): red dot
 *
 * Part of the Host Proposals V7 redesign.
 */
```

**Change to**:
```javascript
/**
 * ProgressTrackerV7 Component (V7 Design)
 *
 * Horizontal progress steps for ALL proposals (matches guest proposals page):
 * - Steps: Proposal submitted → Rental App Submitted → Edit/Review Proposal → Review Documents → Lease documents → Initial Payment
 * - Completed steps: purple dot + line
 * - Current step: green dot
 * - Future steps: gray dot + line
 * - Terminal (cancelled/rejected): red dot
 *
 * Part of the Host Proposals V7 redesign.
 */
```

### Step 3: Review getStageColor() function (No Changes Required)

After analyzing the `getStageColor()` function (lines 50-114), I've determined that **no changes are required** to the status-to-stage mapping logic. Here's why:

The function uses `stageIndex` (0-5) to determine colors based on:
- `normalizedStatus` - The actual proposal status string
- `usualOrder` - The numeric order from `proposalStatuses.js`
- `hasRentalApp` - Boolean for rental application presence

**Mapping Analysis**:

| Stage Index | New Label | Status Conditions (unchanged) |
|-------------|-----------|------------------------------|
| 0 | Proposal submitted | Always purple (completed) |
| 1 | Rental App Submitted | Green if "Awaiting Rental Application" or "Pending"; Purple if hasRentalApp or usualOrder >= 1 |
| 2 | Edit/Review Proposal | Green if "Host Review" or "Counteroffer"; Purple if usualOrder >= 3 |
| 3 | Review Documents | Green if "Documents Sent for Review" or "accepted"; Purple if usualOrder >= 4 |
| 4 | Lease documents | Green if "Signatures" or "Signed"; Purple if usualOrder >= 5 |
| 5 | Initial Payment | Green if "Awaiting Initial payment/Payment"; Purple if completed |

The existing logic correctly maps proposal statuses to stage indices. The labels are just display text and don't affect the logic.

---

## Files Changed

1. `app/src/islands/pages/HostProposalsPage/ProgressTrackerV7.jsx`
   - Update `PROGRESS_STAGES` constant (line 19)
   - Update header comments (lines 5)

---

## Acceptance Criteria Verification

| Criteria | Verification Method |
|----------|---------------------|
| Progress bar displays 6 new stage labels in order | Visual inspection after change |
| Proposal statuses correctly map to stages | Existing logic unchanged; verified by analysis |
| Visual styling remains intact | No CSS changes; only label text updated |
| Component functions correctly in host proposals page | No functional changes; test with existing proposals |

---

## Testing Notes

1. Navigate to `/host-proposals` page
2. View proposals in various statuses
3. Verify progress bar shows new labels
4. Verify correct stages are highlighted based on proposal status
5. Verify terminal statuses (cancelled/rejected) still show red dot

---

## Rollback Plan

If issues arise, revert the single file change to restore original labels.
