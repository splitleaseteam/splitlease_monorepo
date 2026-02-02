# Bug Fix Orchestrator Plan: Create Proposal Flow + Phone Number Sync

**Created**: 2026-01-29
**Max Runtime**: 4 hours
**Status**: ACTIVE

---

## Executive Summary

This orchestrator addresses two bugs:
1. **Message Page Create Proposal Flow**: CTA button not showing correct CreateProposalFlowV2 modal
2. **Phone Number Sync**: Verify rental application phone number syncs to user table

## Bugs Overview

### Bug 1: Message Page Create Proposal Flow (HIGH PRIORITY)

**Symptom**: When a guest starts a message thread without a proposal, SplitBot sends a welcome message with a "Create Proposal" CTA. Clicking this CTA does not open the CreateProposalFlowV2 modal.

**Root Causes**:
1. `create_proposal_guest` is MISSING from `CTA_ROUTES` in `app/src/lib/ctaConfig.js`
2. `MessagingPage.jsx` has `activeModal`/`modalContext` state but NO modal rendering logic
3. Missing state management for: `selectedListingForProposal`, `zatConfig`, `moveInDate`, `selectedDayObjects`, `reservationSpan`, `priceBreakdown`

**Expected Behavior**: Should work like FavoriteListingsPage - clicking "Create Proposal" opens CreateProposalFlowV2 with `useFullFlow={true}`, pre-populated with listing data.

**Files to Modify**:
- `app/src/lib/ctaConfig.js` - Add `create_proposal_guest` route with `actionType: 'modal'`
- `app/src/islands/pages/MessagingPage/MessagingPage.jsx` - Add modal rendering
- `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` - Add modal state management

### Bug 2: Phone Number Sync (VERIFICATION)

**Symptom**: Phone number entered in rental application may not sync to user table.

**Current Implementation**: `useRentalApplicationWizardLogic.js` has `syncFieldToUserTable` that syncs phone on blur IF the user's profile phone was originally empty.

**Verification Needed**: E2E test to confirm:
1. New user signs up (no phone)
2. Opens rental application
3. Enters phone number
4. Phone syncs to user table on blur

**Files to Review**:
- `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js`

---

## Orchestrator Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BUG FIX ORCHESTRATOR                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: INVESTIGATION (Pass 1)                                            │
│  ├─ Agent: investigation-planner                                            │
│  ├─ Input: Bug descriptions + file paths                                    │
│  ├─ Actions: Read files, analyze patterns, identify all issues              │
│  └─ Output: Detailed bug list with fix locations                            │
│                                                                             │
│  PHASE 2: IMPLEMENTATION (Pass 2)                                           │
│  ├─ Agent: fix-implementer                                                  │
│  ├─ Input: Bug list from Phase 1                                            │
│  ├─ Actions: Implement fixes, use Playwright MCP to test                    │
│  └─ Output: Fixed code + test results                                       │
│                                                                             │
│  PHASE 3: VERIFICATION LOOP                                                 │
│  ├─ Agent: verification-agent                                               │
│  ├─ Actions:                                                                │
│  │   1. Run Playwright E2E test                                             │
│  │   2. If FAIL: Use Supabase MCP to check logs                             │
│  │   3. Analyze failure, create fix plan                                    │
│  │   4. Implement fix                                                       │
│  │   5. Repeat until PASS or timeout                                        │
│  └─ Output: Final test results + changelog                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Investigation Checklist

### Bug 1: Message Page Create Proposal Flow

- [ ] Confirm `create_proposal_guest` is missing from `CTA_ROUTES`
- [ ] Confirm `MessagingPage.jsx` lacks modal rendering
- [ ] Identify what `onOpenModal` callback does in `useCTAHandler`
- [ ] Review `useMessagingPageLogic.js` for existing modal state
- [ ] Compare with FavoriteListingsPage implementation
- [ ] Identify all required state variables for CreateProposalFlowV2
- [ ] Check if ZAT config fetching is available in messaging context
- [ ] Verify threadInfo has listing_id for fetching listing data

### Bug 2: Phone Number Sync

- [ ] Verify `syncFieldToUserTable` function exists and is called
- [ ] Check `handleInputBlur` triggers sync for phone field
- [ ] Verify field mapping: `phone` → `'Phone Number (as text)'`
- [ ] Check edge case: What if user already has phone in profile?

---

## Phase 2: Implementation Plan

### Fix 1: Add CTA Route

```javascript
// app/src/lib/ctaConfig.js - Add to CTA_ROUTES
'create_proposal_guest': {
  actionType: 'modal',
  destination: 'CreateProposalModal'
},
```

### Fix 2: Add Modal State to useMessagingPageLogic.js

```javascript
// State additions
const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
const [selectedListingForProposal, setSelectedListingForProposal] = useState(null);
const [zatConfig, setZatConfig] = useState(null);
const [moveInDate, setMoveInDate] = useState(null);
const [selectedDayObjects, setSelectedDayObjects] = useState([]);
const [reservationSpan, setReservationSpan] = useState(13);
const [priceBreakdown, setPriceBreakdown] = useState(null);

// Handler for opening modal
const handleOpenProposalModal = async (context) => {
  // Fetch listing data using threadInfo.listing_id
  // Set up defaults similar to FavoriteListingsPage
  // Open modal
};

// onOpenModal callback for useCTAHandler
const handleOpenModal = (modalName, context) => {
  if (modalName === 'CreateProposalModal') {
    handleOpenProposalModal(context);
  }
  // Handle other modals...
};
```

### Fix 3: Add Modal Rendering to MessagingPage.jsx

```jsx
{/* After main content, add: */}
{isProposalModalOpen && selectedListingForProposal && (
  <CreateProposalFlowV2
    listing={selectedListingForProposal}
    moveInDate={moveInDate}
    daysSelected={selectedDayObjects}
    reservationSpan={reservationSpan}
    pricingBreakdown={priceBreakdown}
    zatConfig={zatConfig}
    isFirstProposal={true}
    useFullFlow={true}
    onClose={handleCloseProposalModal}
    onSubmit={handleProposalSubmit}
    isSubmitting={isSubmittingProposal}
  />
)}
```

---

## Phase 3: E2E Test Scenarios

### Test 1: Create Proposal from Message Page

```
1. Login as guest user
2. Navigate to a listing without existing proposal
3. Click "Message Host" / start inquiry
4. Verify SplitBot message appears with "Create Proposal" CTA
5. Click "Create Proposal" CTA button
6. Verify CreateProposalFlowV2 modal opens
7. Verify modal has correct listing data
8. Complete proposal flow (User Details → Move-in → Days → Review)
9. Submit proposal
10. Verify success message
11. Verify thread now shows proposal info in RightPanel
```

### Test 2: Phone Number Sync

```
1. Create new test user (no phone)
2. Navigate to account profile → rental application
3. Open rental application wizard
4. Fill in phone number field
5. Tab to next field (trigger blur)
6. Use Supabase MCP to check user table
7. Verify 'Phone Number (as text)' column updated
```

---

## Debugging Protocol

When a test fails:

1. **Capture Error**: Log exact error message from Playwright
2. **Check Console**: Use `browser_console_messages` to get frontend errors
3. **Check Network**: Use `browser_network_requests` to see failed API calls
4. **Check Supabase Logs**: Use Supabase MCP to query logs
5. **Analyze**: Determine root cause
6. **Fix**: Implement targeted fix
7. **Retry**: Run test again
8. **Repeat**: Until pass or 4-hour timeout

---

## Success Criteria

- [ ] "Create Proposal" CTA on message page opens CreateProposalFlowV2 modal
- [ ] Modal pre-populates with correct listing data
- [ ] Full proposal flow works (4 steps)
- [ ] Proposal submission succeeds
- [ ] Phone number sync works in rental application
- [ ] All E2E tests pass

---

## File References

| File | Purpose |
|------|---------|
| `app/src/lib/ctaConfig.js` | CTA routes mapping |
| `app/src/islands/pages/MessagingPage/MessagingPage.jsx` | Main component |
| `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js` | Page logic hook |
| `app/src/islands/pages/MessagingPage/useCTAHandler.js` | CTA click handling |
| `app/src/islands/shared/CreateProposalFlowV2.jsx` | Proposal modal component |
| `app/src/islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx` | Reference implementation |
| `app/src/islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js` | Phone sync logic |
