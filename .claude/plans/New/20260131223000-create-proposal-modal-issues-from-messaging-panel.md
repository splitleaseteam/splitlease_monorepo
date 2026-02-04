# CreateProposalFlowV2 Modal Issues from Header Messaging Panel

**Created:** 2026-01-31 22:30:00
**Status:** Analysis Complete - Ready for Implementation
**Priority:** High (UX Breaking Bug)

---

## Executive Summary

The CreateProposalFlowV2 modal exhibits two critical issues when opened from the Header Messaging Panel:
1. **Horizontal scrollbar appears** at the bottom of the modal
2. **Modal closes unexpectedly** when clicking "edit" buttons on the review step

These issues do NOT occur when the same modal is opened from the Search page.

---

## Investigation Findings

### Issue 1: Horizontal Scrollbar

**Symptom:** A horizontal scrollbar appears at the bottom of the modal when opened from messaging panel.

**Root Cause:** The modal's `.create-proposal-popup` element:
- Has `position: fixed` with `top: 0; left: 0; right: 0; bottom: 0`
- When rendered inside the header DOM hierarchy, its computed width becomes 1910px (full viewport)
- `overflow: visible` (default) allows content to overflow

**Evidence from DOM inspection:**
```
From Messaging Panel:
- Modal parent chain: .header-messages-wrapper (48px) -> .logged-in-avatar -> .nav-right -> header.main-header (position: fixed)
- Modal computed width: 1910px
- Modal overflow: visible

From Search Page:
- Modal parent chain: .search-page -> #root -> body
- Modal computed width: 1910px (same)
- But NO horizontal scrollbar visible
```

### Issue 2: Edit Buttons Close Modal

**Symptom:** Clicking any "edit" button on the Confirm Proposal step closes both the modal AND the messaging panel.

**Root Cause:** Event propagation and click-outside detection conflict:

1. The HeaderMessagingPanel has a `handleClickOutside` listener that closes the panel
2. Although there's a check for `e.target.closest('.create-proposal-popup')`, the event still causes closure
3. The edit button clicks bubble up through the DOM
4. The modal and panel share React lifecycle - state changes in the modal may affect timing of `activeModal` check

**Evidence:**
- Console log shows: `Edit: Jumping to Move-in (section 3) from Review`
- Immediately after, the modal and panel both disappear
- On Search page, the same action works correctly (modal stays open, navigates to edit section)

---

## Comparison: Search Page vs Messaging Panel

| Aspect | From Messaging Panel | From Search Page |
|--------|---------------------|------------------|
| Horizontal Scrollbar | YES - visible at bottom | NO |
| Edit Buttons Work | NO - closes modal | YES - works correctly |
| Modal z-index | 10002 (via CSS rule) | 10000 |
| Parent Container | Nested in header (48px wrapper) | Direct child of page |
| React Portal Used | NO | NO |

### DOM Structure Comparison

**From Messaging Panel:**
```
body
└── #root
    └── .home-page
        └── header.main-header (position: fixed)
            └── nav.nav-container
                └── .nav-right
                    └── .logged-in-avatar
                        └── .header-messages-wrapper (width: 48px)
                            ├── .header-messaging-panel (dialog)
                            └── .create-proposal-popup (MODAL - sibling, not portal)
```

**From Search Page:**
```
body
└── #root
    └── .search-page
        ├── main (listings)
        └── .create-proposal-popup (MODAL - direct child)
```

---

## Proposed Solution

### Option A: React Portal (RECOMMENDED)

Render the CreateProposalFlowV2 modal using `ReactDOM.createPortal` to mount it directly to `document.body`, completely outside the header DOM hierarchy.

**Changes Required:**

1. **`HeaderMessagingPanel.jsx`** - Wrap modal in portal:
```jsx
import { createPortal } from 'react-dom';

// In render:
{activeModal === 'CreateProposalFlowV2' && proposalModalData && createPortal(
  <CreateProposalFlowV2
    // ... props
  />,
  document.body
)}
```

2. **Benefits:**
   - Modal renders at body level, avoiding all header DOM issues
   - No overflow/positioning issues from parent containers
   - Clean separation between panel and modal DOM
   - Click outside handling simplified

### Option B: Event Propagation Fix (Partial Fix)

Add `onClick={(e) => e.stopPropagation()}` to the modal's outer container.

**Changes Required:**

1. **`CreateProposalFlowV2.jsx`** - Add stopPropagation:
```jsx
<div className="create-proposal-popup" onClick={(e) => e.stopPropagation()}>
```

2. **`create-proposal-flow-v2.css`** - Add overflow:hidden:
```css
.create-proposal-popup {
  overflow: hidden; /* Prevent horizontal scrollbar */
}
```

**Note:** This only partially fixes the issue and is less robust than Option A.

---

## Files to Modify

### For Option A (Portal):

| File | Change |
|------|--------|
| `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx` | Wrap CreateProposalFlowV2 in `createPortal(...)` |

### For Option B (Propagation):

| File | Change |
|------|--------|
| `app/src/islands/shared/CreateProposalFlowV2.jsx` | Add `onClick={e => e.stopPropagation()}` to outer div |
| `app/src/styles/create-proposal-flow-v2.css` | Add `overflow: hidden` to `.create-proposal-popup` |

---

## Test Plan

1. **Open modal from messaging panel:**
   - Click Messages icon in header
   - Select a thread with "Create Proposal" button
   - Click "Create Proposal"
   - Verify: No horizontal scrollbar

2. **Navigate through modal:**
   - Fill in step 1 (text fields)
   - Click Next through all steps
   - On Confirm Proposal step, click "edit" button next to "Approx Move-in"
   - Verify: Modal stays open and navigates to edit section
   - Click "Save & Review" to return
   - Verify: Returns to Confirm Proposal step

3. **Verify search page still works:**
   - Navigate to /search
   - Click "Create Proposal" on any listing
   - Verify: Same behavior as before (no regressions)

---

## Screenshots

Screenshots captured during investigation are located in:
- `.playwright-mcp/01-initial-state.png`
- `.playwright-mcp/02-modal-opened-from-messaging.png`
- `.playwright-mcp/03-modal-step2-adjust-proposal.png`
- `.playwright-mcp/04-modal-review-step-with-edit-buttons.png`
- `.playwright-mcp/05-modal-closed-after-edit-click.png` (BUG)
- `.playwright-mcp/06-modal-from-search-page.png`
- `.playwright-mcp/07-edit-works-on-search-page.png` (WORKING)

---

## Related Files

- `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.jsx` - Panel component that renders modal
- `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` - Panel logic hook
- `app/src/islands/shared/CreateProposalFlowV2.jsx` - Modal component
- `app/src/islands/shared/CreateProposalFlowV2Components/ReviewSection.jsx` - Review section with edit buttons
- `app/src/styles/create-proposal-flow-v2.css` - Modal styles
- `app/src/islands/shared/HeaderMessagingPanel/HeaderMessagingPanel.css` - Panel styles (z-index override)
