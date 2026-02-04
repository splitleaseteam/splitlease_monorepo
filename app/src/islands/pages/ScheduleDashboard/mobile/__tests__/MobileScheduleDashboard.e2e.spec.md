# Mobile Schedule Dashboard E2E Test Specification

**Version:** 1.0
**Last Updated:** 2026-02-03
**Components Covered:** Phases 1-6 Mobile Implementation

---

## Overview

End-to-end test specification for the Mobile Schedule Dashboard. Tests should run against a mobile viewport (375x667 - iPhone SE) to trigger mobile-specific rendering.

### Test Environment Setup

```javascript
// playwright.config.js mobile project
{
  name: 'mobile-chrome',
  use: {
    ...devices['iPhone SE'],
    viewport: { width: 375, height: 667 },
  },
}
```

### Test URL
```
/schedule/{leaseId}
```

---

## 1. Viewport-Based Routing

### 1.1 Mobile Viewport Detection
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| VR-001 | Mobile layout renders on small viewport | 1. Set viewport to 375x667<br>2. Navigate to /schedule/test-lease | `.mobile-schedule-dashboard` visible, `.schedule-dashboard` (desktop) hidden |
| VR-002 | Desktop layout on large viewport | 1. Set viewport to 1280x800<br>2. Navigate to /schedule/test-lease | `.schedule-dashboard` visible, `.mobile-schedule-dashboard` hidden |
| VR-003 | Breakpoint boundary at 768px | 1. Set viewport to 767px width<br>2. Verify mobile<br>3. Resize to 768px<br>4. Verify desktop | Mobile at 767px, Desktop at 768px |

---

## 2. Mobile Header

### 2.1 Header Display
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MH-001 | Header shows property address | 1. Load mobile dashboard | Header displays lease property address |
| MH-002 | Header shows roommate name | 1. Load mobile dashboard | Subtitle shows roommate's first name |
| MH-003 | User avatar displays | 1. Load mobile dashboard | Avatar with initials or photo visible |

---

## 3. Bottom Navigation

### 3.1 Tab Navigation
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| BN-001 | Calendar tab is default active | 1. Load mobile dashboard | Calendar tab has `.mobile-nav-tab--active` class |
| BN-002 | Tap Chat tab switches view | 1. Tap Chat tab | Chat view renders, tab becomes active |
| BN-003 | Tap Transactions tab switches view | 1. Tap Transactions tab | Transaction list renders, tab becomes active |
| BN-004 | Tap Settings tab switches view | 1. Tap Settings tab | Settings menu renders, tab becomes active |
| BN-005 | Tab icons display correctly | 1. Load mobile dashboard | All 4 tabs show correct icons (📅💬📋⚙️) |
| BN-006 | Active tab visual feedback | 1. Tap each tab in sequence | Active tab has distinct color (primary purple) |

---

## 4. Mobile Calendar (Phase 2)

### 4.1 Week View Display
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MC-001 | Calendar renders current week | 1. Load Calendar tab | 7 day cells visible for current week |
| MC-002 | Day labels show correctly | 1. Load Calendar tab | Sun-Sat labels visible above day cells |
| MC-003 | Month/year header displays | 1. Load Calendar tab | Header shows current month and year |
| MC-004 | Week range shows in header | 1. Load Calendar tab | Shows "Jan 5 - Jan 11" style range |

### 4.2 Week Navigation
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MC-005 | Next week button works | 1. Tap › button | Calendar shows next week, header updates |
| MC-006 | Previous week button works | 1. Tap ‹ button | Calendar shows previous week |
| MC-007 | Swipe left navigates forward | 1. Swipe left on calendar | Advances to next week with animation |
| MC-008 | Swipe right navigates back | 1. Swipe right on calendar | Goes to previous week with animation |

### 4.3 Day Cell States
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MC-009 | User nights show "mine" style | 1. Load calendar with user nights | Cells have `.mobile-day-cell--mine` class, blue border |
| MC-010 | Roommate nights show distinct style | 1. Load calendar | Roommate cells have `.mobile-day-cell--roommate`, purple border |
| MC-011 | Pending nights show warning style | 1. Load calendar with pending | Pending cells have orange border, dot indicator |
| MC-012 | Today marker displays | 1. Load calendar | Today's cell has `.mobile-day-cell--today` with dot |
| MC-013 | Price overlay shows on cells | 1. Load calendar with prices | Price displays as "$XX" in cell |

### 4.4 Day Selection
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| MC-014 | Tap day selects it | 1. Tap on a day cell | Cell gets `.mobile-day-cell--selected` class |
| MC-015 | Selected day changes styling | 1. Select a day | Background becomes primary purple, text white |
| MC-016 | Selecting new day deselects previous | 1. Select day A<br>2. Select day B | Day A deselected, Day B selected |

---

## 5. Mobile Chat View (Phase 4)

### 5.1 Message Display
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| CV-001 | Messages render in list | 1. Switch to Chat tab | Messages visible in scrollable container |
| CV-002 | User messages align right | 1. View chat with user messages | `.chat-bubble--mine` aligned to right, purple background |
| CV-003 | Roommate messages align left | 1. View chat | `.chat-bubble--theirs` aligned left, white background |
| CV-004 | Sender name shows on received | 1. View roommate message | Sender name displayed above message |
| CV-005 | Timestamps display | 1. View messages | Each message shows time (e.g., "2:30 PM") |
| CV-006 | Empty state when no messages | 1. Load chat with no messages | Shows empty state with "No messages yet" |

### 5.2 Message Scrolling
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| CV-007 | Auto-scroll to bottom on load | 1. Load chat with many messages | Scrolled to most recent message |
| CV-008 | Auto-scroll on new message | 1. Send a message | View scrolls to show new message |
| CV-009 | Manual scroll works | 1. Scroll up in message list | Can view older messages |

### 5.3 Chat Input
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| CV-010 | Input bar visible at bottom | 1. Switch to Chat tab | Input bar fixed at bottom |
| CV-011 | Send button disabled when empty | 1. View empty input | Send button has disabled styling |
| CV-012 | Type enables send button | 1. Type "Hello" | Send button becomes active |
| CV-013 | Send message clears input | 1. Type message<br>2. Tap Send | Message sent, input cleared |
| CV-014 | Enter key sends message | 1. Type message<br>2. Press Enter | Message sent |
| CV-015 | Shift+Enter adds newline | 1. Type<br>2. Press Shift+Enter | Newline added, not sent |
| CV-016 | Input expands with content | 1. Type multi-line text | Textarea grows (up to max height) |

### 5.4 Request Messages
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| CV-017 | Request bubble shows special styling | 1. View request message | Has `.chat-bubble--request` with border |
| CV-018 | Pending request shows actions | 1. View pending request from roommate | Accept/Counter/Decline buttons visible |
| CV-019 | Accept button works | 1. Tap Accept on request | Handler called, UI updates |
| CV-020 | Decline button works | 1. Tap Decline | Handler called |
| CV-021 | Counter button works | 1. Tap Counter | Counter flow initiates |
| CV-022 | Own requests don't show actions | 1. View own pending request | No action buttons (user can't accept own) |

---

## 6. Transaction List (Phase 5)

### 6.1 List Display
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-001 | Transactions list renders | 1. Switch to Transactions tab | List of transaction rows visible |
| TL-002 | Sorted by date (newest first) | 1. View transactions | Most recent at top |
| TL-003 | Empty state when none | 1. Load with no transactions | Shows "No transactions yet" |
| TL-004 | Transaction type icons show | 1. View transactions | 💰 for buyout, 🔄 for swap, 🏠 for share |

### 6.2 Transaction Row
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-005 | Row shows type label | 1. View transaction row | "Buyout", "Swap", or "Share" text |
| TL-006 | Row shows date | 1. View row | Date displays (e.g., "Jan 15") |
| TL-007 | Row shows amount | 1. View buyout row | Amount displays (e.g., "$150") |
| TL-008 | Status badge displays | 1. View row | Status badge with icon and label |

### 6.3 Status Badges
**Priority:** Medium

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-009 | Pending badge styling | 1. View pending transaction | Orange background, "⏳ Pending" |
| TL-010 | Accepted badge styling | 1. View accepted transaction | Blue/green background, "✓ Accepted" |
| TL-011 | Declined badge styling | 1. View declined transaction | Red background, "✗ Declined" |
| TL-012 | Cancelled badge styling | 1. View cancelled transaction | Gray background, "⊘ Cancelled" |

### 6.4 Expand/Collapse
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-013 | Tap row expands details | 1. Tap transaction row | Details section animates open |
| TL-014 | Tap again collapses | 1. Tap expanded row | Details collapse |
| TL-015 | Only one expanded at a time | 1. Expand row A<br>2. Tap row B | Row A collapses, Row B expands |
| TL-016 | Chevron rotates on expand | 1. Expand row | ▼ rotates to ▲ |

### 6.5 Transaction Details
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-017 | Details show full date | 1. Expand transaction | Shows "Mon, Jan 15, 2026" format |
| TL-018 | Details show amount | 1. Expand buyout | Amount with "$XX.XX" format |
| TL-019 | Details show "Requested" time | 1. Expand transaction | Shows relative time (e.g., "2h ago") |
| TL-020 | Note displays if present | 1. Expand with note | Note text visible in styled box |

### 6.6 Transaction Actions
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TL-021 | Pending from roommate shows Accept/Decline | 1. Expand pending from roommate | Accept and Decline buttons visible |
| TL-022 | Own pending shows Cancel | 1. Expand own pending request | "Cancel Request" button visible |
| TL-023 | Accept button works | 1. Tap Accept | Transaction accepted, status updates |
| TL-024 | Decline button works | 1. Tap Decline | Transaction declined |
| TL-025 | Cancel button works | 1. Tap Cancel Request | Own request cancelled |
| TL-026 | Loading state on action | 1. Tap action button | Spinner shows while processing |

---

## 7. Settings View (Phase 6)

### 7.1 Settings Menu
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SV-001 | Settings menu renders | 1. Switch to Settings tab | Menu with items visible |
| SV-002 | Buyout Pricing item shows | 1. View menu | "💰 Buyout Pricing" with description |
| SV-003 | Sharing Preferences item shows | 1. View menu | "🏠 Sharing Preferences" visible |
| SV-004 | Disabled items show "Coming soon" | 1. View menu | Notifications and Account grayed out |
| SV-005 | Tap disabled item does nothing | 1. Tap "Notifications" | No navigation, remains on menu |

### 7.2 Section Navigation
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SV-006 | Tap Buyout Pricing opens section | 1. Tap "Buyout Pricing" | Pricing section slides in |
| SV-007 | Tap Sharing opens section | 1. Tap "Sharing Preferences" | Sharing section slides in |
| SV-008 | Back button returns to menu | 1. Enter Pricing<br>2. Tap "← Back" | Returns to settings menu |
| SV-009 | Section has sticky header | 1. Scroll in section | Header remains visible at top |

### 7.3 Pricing Section
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SV-010 | Base price input shows | 1. Open Pricing section | Input with current base price value |
| SV-011 | Can edit base price | 1. Change price to $200 | Input updates, dirty state enabled |
| SV-012 | Short notice slider shows | 1. View pricing | Slider with "1.50x" style value |
| SV-013 | Can adjust short notice | 1. Drag slider | Value updates, preview price recalculates |
| SV-014 | Soon notice slider shows | 1. View pricing | Second slider for "soon" multiplier |
| SV-015 | Preview prices calculate | 1. Adjust sliders | Shows computed prices (e.g., "$225/night") |
| SV-016 | Save disabled until changed | 1. Open section fresh | "Save Changes" button disabled |
| SV-017 | Save enabled after change | 1. Change any value | Button becomes enabled |
| SV-018 | Save persists changes | 1. Change price<br>2. Tap Save<br>3. Reopen | Values persisted |
| SV-019 | Cancel discards changes | 1. Change price<br>2. Tap Cancel<br>3. Reopen | Original values restored |

### 7.4 Sharing Section
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| SV-020 | Willingness slider shows | 1. Open Sharing section | Percentage slider visible |
| SV-021 | Slider shows current value | 1. View slider | Shows "50% - Neutral" or similar |
| SV-022 | Slider color changes with value | 1. Drag to low value<br>2. Drag to high | Color shifts (red → green/purple) |
| SV-023 | Level label updates | 1. Drag slider | Label updates (Rarely/Sometimes/Often/Always) |
| SV-024 | Description explains level | 1. View section | Explanation text for current level |
| SV-025 | Save persists willingness | 1. Change slider<br>2. Save | Value persisted to hook |

---

## 8. Bottom Sheet (Phase 3)

### 8.1 Sheet Opening
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| BS-001 | Sheet opens with animation | 1. Trigger sheet open | Sheet slides up from bottom |
| BS-002 | Backdrop appears | 1. Open sheet | Semi-transparent backdrop visible |
| BS-003 | Handle displays | 1. Open sheet | Drag handle bar at top of sheet |

### 8.2 Sheet Interaction
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| BS-004 | Tap backdrop closes sheet | 1. Open sheet<br>2. Tap backdrop | Sheet closes |
| BS-005 | Swipe down dismisses | 1. Open sheet<br>2. Swipe down on handle | Sheet dismisses |
| BS-006 | Partial swipe snaps back | 1. Swipe down slightly<br>2. Release | Sheet snaps back to open |
| BS-007 | Close button works | 1. Open sheet<br>2. Tap X button | Sheet closes |

### 8.3 Sheet Heights
**Priority:** Medium

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| BS-008 | Auto height fits content | 1. Open auto-height sheet | Sheet height matches content |
| BS-009 | Half height mode | 1. Open half-height sheet | Sheet covers 50% of viewport |
| BS-010 | Full height mode | 1. Open full sheet | Sheet covers ~90% of viewport |

---

## 9. Cross-Feature Integration

### 9.1 Data Consistency
**Priority:** Critical

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| INT-001 | Calendar reflects accepted transaction | 1. Accept buyout in Transactions<br>2. Check Calendar | Day ownership updates |
| INT-002 | Chat shows transaction messages | 1. Accept request<br>2. Check Chat | Confirmation message appears |
| INT-003 | Pricing settings affect calendar prices | 1. Change base price<br>2. Check Calendar | Price overlays update |

### 9.2 Navigation State
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| INT-004 | Tab state persists during session | 1. Go to Settings<br>2. Navigate away<br>3. Return | Settings tab still active |
| INT-005 | Settings section state on back | 1. Open Pricing<br>2. Go to Calendar<br>3. Return to Settings | Back at Settings menu (not Pricing) |

---

## 10. Accessibility

### 10.1 Screen Reader Support
**Priority:** High

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| A11Y-001 | Tabs have accessible labels | 1. Focus each tab | Screen reader announces tab purpose |
| A11Y-002 | Calendar has grid role | 1. Focus calendar | Announced as grid with day cells |
| A11Y-003 | Day cells announce status | 1. Focus day cell | Announces date, ownership, price |
| A11Y-004 | Buttons have labels | 1. Focus action buttons | Purpose clearly announced |

### 10.2 Keyboard Navigation
**Priority:** Medium

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| A11Y-005 | Tab through nav items | 1. Tab through bottom nav | All items focusable in order |
| A11Y-006 | Enter activates buttons | 1. Focus button<br>2. Press Enter | Button action triggers |
| A11Y-007 | Escape closes modals | 1. Open bottom sheet<br>2. Press Escape | Sheet closes |

---

## Test Data Requirements

### Mock Lease
```javascript
{
  id: 'test-lease-001',
  propertyAddress: '123 Test Street, Apt 4B',
  startDate: '2026-01-01',
  endDate: '2026-12-31'
}
```

### Mock Users
```javascript
currentUser: {
  id: 'user-001',
  firstName: 'Alex',
  lastName: 'Test'
}
roommate: {
  id: 'user-002',
  firstName: 'Sarah',
  lastName: 'Roommate'
}
```

### Mock Messages
```javascript
[
  { id: 'm1', senderId: 'user-002', text: 'Hey, can I buy out Friday?', type: 'text', timestamp: '2026-02-02T10:00:00Z' },
  { id: 'm2', senderId: 'user-001', text: 'Sure, what price?', type: 'text', timestamp: '2026-02-02T10:05:00Z' },
  { id: 'm3', senderId: 'user-002', text: 'Buyout request for Jan 15', type: 'request', status: 'pending', timestamp: '2026-02-02T10:10:00Z', requestDetails: { dates: 'Jan 15', amount: 150 } }
]
```

### Mock Transactions
```javascript
[
  { id: 't1', type: 'buyout', nights: ['2026-01-10'], amount: 150, status: 'accepted', requesterId: 'user-002', date: '2026-01-08' },
  { id: 't2', type: 'swap', nights: ['2026-01-20'], amount: 0, status: 'pending', requesterId: 'user-001', date: '2026-01-18' },
  { id: 't3', type: 'buyout', nights: ['2026-01-25'], amount: 200, status: 'declined', requesterId: 'user-002', date: '2026-01-22' }
]
```

---

## Execution Notes

### Running Tests
```bash
# Run all mobile E2E tests
bun run test:e2e --project=mobile-chrome

# Run specific test file
bun run test:e2e mobile-schedule-dashboard.spec.ts

# Run with UI mode for debugging
bun run test:e2e --ui --project=mobile-chrome
```

### CI Configuration
```yaml
- name: Mobile E2E Tests
  run: bun run test:e2e --project=mobile-chrome --reporter=html
  env:
    VIEWPORT: mobile
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-03 | Claude | Initial specification covering Phases 1-6 |
