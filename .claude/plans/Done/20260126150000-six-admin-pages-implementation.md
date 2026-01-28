# Implementation Plan: Six Admin Pages Implementation

## Overview
Implement 6 new admin pages for the Split Lease application using the established Hollow Component + Logic Hook pattern. Each page requires creating a page structure with separated concerns (hollow component for UI, logic hook for state/data), and styling to match Bubble.io reference designs with 95%+ visual fidelity. All pages will use the AdminHeader shared component.

## Success Criteria
- [x] All 6 pages render correctly with AdminHeader
- [x] Each page follows Hollow Component pattern (no logic in component)
- [x] Each page has a corresponding `use[PageName]PageLogic.js` hook
- [x] CSS styling matches Bubble reference (95%+ fidelity)
- [x] Routes properly configured in `routes.config.js`
- [x] Entry points (HTML + JSX) created for each page
- [x] Each page passes lint check (`bun run lint`)

## Context & References

### Relevant Files
| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/routes.config.js` | Route definitions | Routes already exist for all 6 pages |
| `app/src/islands/shared/AdminHeader/AdminHeader.jsx` | Shared admin navigation | Import in each page |
| `app/src/islands/pages/CoHostRequestsPage/` | Existing page pattern reference | Use as template |
| `app/src/islands/pages/ManageVirtualMeetingsPage/` | Existing page pattern reference | Use as template |
| `app/src/islands/pages/ProposalManagePage/` | Existing page pattern reference | Use as template |

### Requirements Documents
| Page | Requirements Doc |
|------|-----------------|
| Verify Users | `docs/Pending/BUBBLE APP_ _verify-users PAGE - COMPREHENSIVE REQUIREMENTS DOCUMENT.md` |
| Proposal Management | `docs/Pending/SL - _proposal-manage Page - COMPREHENSIVE REQUIREMENTS DOCUMENTATION .md` |
| Virtual Meetings | `docs/Pending/SL _manage-virtual-meetings - COMPREHENSIVE REQUIREMENTS DOCUMENT.md` |
| Message Curation | `docs/Pending/EXHAUSTIVE REQUIREMENTS DOCUMENT_ _MESSAGE-CURATION MIGRATION.md` |
| Co-Host Requests | `docs/Pending/SL - _co-host-requests Page - BUBBLE PAGE REQUIREMENTS DOCUMENTATION_ .md` |
| Internal Emergency | `docs/Pending/SL _internal-emergency Page - Comprehensive Requirements Document.md` |

### Existing Patterns to Follow
1. **Hollow Component Pattern**: Page component contains ONLY JSX, delegates ALL logic to custom hook
2. **Logic Hook Pattern**: `use[PageName]PageLogic.js` contains all state, effects, handlers, computed values
3. **AdminHeader Usage**: Import and render `<AdminHeader />` at top of page
4. **CSS Co-location**: CSS file in same directory as page component
5. **Component Organization**: Reusable components in `components/` subdirectory
6. **Edge Function Calls**: Use pattern from `useCoHostRequestsPageLogic.js` for API calls

### Route Verification (Already Configured)
Routes already exist in `routes.config.js`:
- `/_verify-users` -> `verify-users.html`
- `/_proposal-manage` -> `proposal-manage.html`
- `/_manage-virtual-meetings` -> `manage-virtual-meetings.html`
- `/_message-curation` -> `message-curation.html`
- `/_co-host-requests` -> `co-host-requests.html`
- `/_emergency` -> `internal-emergency.html`

---

## Implementation Steps

### PHASE 1: VERIFY USERS PAGE

#### Step 1.1: Review Existing VerifyUsersPage Structure
**Files:**
- `app/src/islands/pages/VerifyUsersPage.jsx` (exists - needs review)
- `app/src/islands/pages/useVerifyUsersPageLogic.js` (exists - needs review)

**Purpose:** Verify existing implementation status and identify gaps
**Details:**
- Check if hollow component pattern is followed
- Check if AdminHeader is used
- Identify missing features from requirements doc

**Validation:** Compare against requirements document checklist

#### Step 1.2: Refactor/Complete VerifyUsersPage
**Files:**
- `app/src/islands/pages/VerifyUsersPage/VerifyUsersPage.jsx` (create folder structure)
- `app/src/islands/pages/VerifyUsersPage/useVerifyUsersPageLogic.js`
- `app/src/islands/pages/VerifyUsersPage/VerifyUsersPage.css`
- `app/src/islands/pages/VerifyUsersPage/index.js`

**Purpose:** Implement user identity verification dashboard
**Details:**
Per requirements document:
- User selection section with email input and dropdown
- 4-image verification grid (profile photo, selfie with ID, front ID, back ID)
- Toggle switch for verification status
- Workflows for verification (email/SMS notifications)

**Key Features:**
1. Email input field for user lookup
2. Dynamic user dropdown with search
3. Identity Verification section (2x2 image grid)
4. Verification toggle with workflow triggers
5. Image click-to-enlarge functionality

**Logic Hook Responsibilities:**
- `fetchUsers(searchText)` - Search users by email/name
- `selectUser(userId)` - Set selected user context
- `toggleVerification(userId, verified)` - Update verification status
- `openImage(imageUrl)` - Open image in new window
- State: `selectedUser`, `users`, `isLoading`, `error`

**Validation:** Run page, select user, view images, toggle verification

---

### PHASE 2: PROPOSAL MANAGEMENT PAGE

#### Step 2.1: Review Existing ProposalManagePage Structure
**Files:**
- `app/src/islands/pages/ProposalManagePage/index.jsx` (exists)
- `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js` (exists)

**Purpose:** Verify existing implementation and identify gaps
**Details:**
- Check hollow component pattern compliance
- Verify all 49 workflows mapped to handlers
- Check filter/search functionality

#### Step 2.2: Complete/Enhance ProposalManagePage
**Files:**
- `app/src/islands/pages/ProposalManagePage/ProposalManagePage.jsx`
- `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js`
- `app/src/islands/pages/ProposalManagePage/ProposalManagePage.css`
- `app/src/islands/pages/ProposalManagePage/components/FilterSection.jsx`
- `app/src/islands/pages/ProposalManagePage/components/ProposalItem.jsx`
- `app/src/islands/pages/ProposalManagePage/components/QuickProposalCreation.jsx`

**Purpose:** Comprehensive proposal management interface
**Details:**
Per requirements document:
- Header with count display and action buttons
- 6 filter inputs (guest, host, status, date, ID, listing)
- Date range filter
- Repeating proposal list with detailed info per row
- Quick proposal creation wizard (2-step)

**Key Features:**
1. Filter by Guest (searchbox with autocomplete)
2. Filter by Host (searchbox with autocomplete)
3. Filter by Status (15 options dropdown)
4. Sort by Modified Date with direction controls
5. Filter by Proposal ID
6. Filter by Listing
7. Date range filter
8. Clear all filters button
9. Proposal item rows with guest/host/listing info
10. Action buttons per proposal (View, Modify as Host/Guest, Reminders, Cancel)
11. Quick Proposal Creation section

**Logic Hook Responsibilities:**
- `filters` state object with all filter values
- `handleFilterChange(filterName, value)`
- `handleClearFilters()`
- `handleStatusChange(proposalId, newStatus)`
- `handleAction(proposalId, actionType)`
- `handleCreateProposal(proposalData)`
- Pagination state and handlers

**Validation:** Apply filters, verify results update, test proposal creation

---

### PHASE 3: VIRTUAL MEETINGS PAGE

#### Step 3.1: Review Existing ManageVirtualMeetingsPage Structure
**Files:**
- `app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.jsx` (exists)
- `app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js` (exists)

**Purpose:** Verify implementation status
**Details:**
- Page structure appears complete based on earlier read
- Verify all 26 frontend workflows mapped
- Verify 6 backend workflows integrated

#### Step 3.2: Complete/Enhance ManageVirtualMeetingsPage
**Files:**
- `app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.css`
- `app/src/islands/pages/ManageVirtualMeetingsPage/components/SearchFilters.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/components/NewRequestsSection.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/components/ConfirmedMeetingsSection.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/components/AvailabilityCalendar.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/modals/ConfirmMeetingModal.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/modals/EditDatesModal.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/modals/DeleteConfirmationModal.jsx`

**Purpose:** Virtual meeting management dashboard
**Details:**
Per requirements document:
- Search by guest name/email, host name/email, proposal ID
- New Requests section (unconfirmed meetings)
- Confirmed Meetings section
- Timezone comparison display
- Availability calendar with block/unblock

**Key Features:**
1. 3 search inputs (guest, host, proposal ID)
2. New Requests repeating group with meeting details
3. Confirmed Requests repeating group with booked date/link
4. Action buttons: Confirm, Delete, Edit as guest/host, Change Date
5. Timezone display section (User, EST, US/Eastern, database)
6. Weekly availability calendar (7 days x 10 hours)
7. Block/Unblock controls for time slots

**Logic Hook Responsibilities:**
- `filters` with search values
- `newRequests` and `confirmedMeetings` arrays
- `blockedSlots` for calendar
- Modal state management
- `handleConfirmMeeting`, `handleDeleteMeeting`, `handleEditDates`
- `handleBlockSlot`, `handleUnblockSlot`, `handleBlockFullDay`
- Week navigation for calendar

**Validation:** Search meetings, confirm request, view calendar, block time slots

---

### PHASE 4: MESSAGE CURATION PAGE

#### Step 4.1: Review Existing MessageCurationPage Structure
**Files:**
- `app/src/islands/pages/MessageCurationPage/MessageCurationPage.jsx` (exists)
- `app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js` (exists)

**Purpose:** Verify implementation status

#### Step 4.2: Complete/Enhance MessageCurationPage
**Files:**
- `app/src/islands/pages/MessageCurationPage/MessageCurationPage.jsx`
- `app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js`
- `app/src/islands/pages/MessageCurationPage/MessageCurationPage.css`
- `app/src/islands/pages/MessageCurationPage/components/ThreadSelector.jsx`
- `app/src/islands/pages/MessageCurationPage/components/ConversationFeed.jsx`
- `app/src/islands/pages/MessageCurationPage/components/CurationConsole.jsx`
- `app/src/islands/pages/MessageCurationPage/components/MessageBubble.jsx`

**Purpose:** Message monitoring and intervention dashboard
**Details:**
Per requirements document:
- Thread selection sidebar with dropdown
- Feed dashboard showing thread metadata
- Conversation feed (repeating group of messages)
- Curation console for composing/forwarding messages
- Split Bot intervention capability

**Key Features:**
1. Thread dropdown selector (Search for threads)
2. Guest/Host info display (name, email)
3. Listing name display
4. Message feed with conditional alignment (Guest left, Host right, Bot center)
5. Multiline input for composing messages
6. Forward button
7. Send as Split Bot button
8. Quick text presets
9. CTA dropdown for bot actions

**Logic Hook Responsibilities:**
- `threads` list and `selectedThread`
- `messages` array for current thread
- `handleSelectThread(threadId)`
- `handleForwardMessage(messageId)`
- `handleSendAsBot(body, cta)`
- Message composition state

**Validation:** Select thread, view messages, forward message, send bot message

---

### PHASE 5: CO-HOST REQUESTS PAGE

#### Step 5.1: Review Existing CoHostRequestsPage Structure
**Files:**
- `app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.jsx` (exists - complete)
- `app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js` (exists - complete)

**Purpose:** This page appears to be fully implemented already
**Details:**
- Hollow component pattern is followed
- AdminHeader is used
- All features from requirements appear implemented
- 22 frontend workflows referenced in requirements

#### Step 5.2: Verify/Polish CoHostRequestsPage
**Files:**
- `app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.jsx`
- `app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.css`
- `app/src/islands/pages/CoHostRequestsPage/components/*.jsx`

**Purpose:** Verify visual fidelity and functionality
**Details:**
- Compare against Bubble reference at `https://app.split.lease/version-test/_co-host-requests`
- Verify statistics bar displays correctly
- Verify card layout matches reference
- Test all action buttons (approve, reject, view details, assign)
- Test filter functionality

**Validation:** Visual comparison with Bubble, functional testing of all features

---

### PHASE 6: INTERNAL EMERGENCY PAGE

#### Step 6.1: Review Existing InternalEmergencyPage Structure
**Files:**
- `app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx` (exists)
- `app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js` (exists)

**Purpose:** Verify implementation status

#### Step 6.2: Complete/Enhance InternalEmergencyPage
**Files:**
- `app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx`
- `app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js`
- `app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.css`
- `app/src/islands/pages/InternalEmergencyPage/components/EmergencyReport.jsx`
- `app/src/islands/pages/InternalEmergencyPage/components/CommunicationSection.jsx`
- `app/src/islands/pages/InternalEmergencyPage/components/EmergencyList.jsx`

**Purpose:** Emergency management dashboard for staff
**Details:**
Per requirements document:
- Emergency report display with agreement number, guest/host info
- Photo display (2 uploaded photos)
- Team member assignment
- SMS communication (custom + presets)
- Email communication (custom + presets with CC/BCC)
- Message/email thread history
- Slack integration for team alerts

**Key Features:**
1. Emergency list sidebar with selection
2. Emergency report display (agreement#, guest info, host info, listing address)
3. Emergency type and description
4. Photo display (2 images)
5. Team member assignment input
6. SMS section with custom input and presets
7. Email section with custom input, presets, CC/BCC
8. Message thread history
9. Email history
10. Slack notification on assignment

**Logic Hook Responsibilities:**
- `emergencies` list and `selectedEmergency`
- `handleSelectEmergency(emergencyId)`
- `handleAssignTeamMember(emergencyId, memberName)`
- `handleSendSms(emergencyId, message)`
- `handleSendEmail(emergencyId, body, cc, bcc)`
- `handleUpdateStatus(emergencyId, status)`
- Communication history state

**Validation:** Select emergency, assign team member, send SMS/email, verify Slack notification

---

## PHASE 7: CROSS-CUTTING TASKS

### Step 7.1: Verify Route Entry Points
**Files:**
- `app/public/verify-users.html`
- `app/public/proposal-manage.html`
- `app/public/manage-virtual-meetings.html`
- `app/public/message-curation.html`
- `app/public/co-host-requests.html`
- `app/public/internal-emergency.html`

**Purpose:** Ensure HTML entry points exist and mount correct components
**Details:**
Each HTML file should:
- Have `<div id="root"></div>`
- Import corresponding JSX entry point

### Step 7.2: Verify JSX Entry Points
**Files:**
- `app/src/verify-users.jsx`
- `app/src/proposal-manage.jsx`
- `app/src/manage-virtual-meetings.jsx`
- `app/src/message-curation.jsx`
- `app/src/co-host-requests.jsx`
- `app/src/internal-emergency.jsx`

**Purpose:** Ensure entry points render page components
**Details:**
Each JSX entry point should:
- Import React and createRoot
- Import page component
- Create root and render component

### Step 7.3: Generate Routes
**Command:** `bun run generate-routes`
**Purpose:** Regenerate `_redirects` and `_routes.json`
**Validation:** Check files are generated without errors

### Step 7.4: Lint Check
**Command:** `bun run lint` (from app/ directory)
**Purpose:** Ensure no lint errors
**Validation:** Zero errors, address warnings if critical

---

## Edge Cases & Error Handling

### API Errors
- Display error banner with retry button (pattern from CoHostRequestsPage)
- Log errors to console with `[PageName]` prefix
- Show toast notifications for user-facing errors

### Empty States
- Display helpful empty state message when no data
- Offer action to clear filters if filters applied

### Loading States
- Show loading spinner during data fetch
- Disable action buttons while processing

### Authentication
- Per task constraints: SKIP AUTH (assume full access)
- No permission checks required

---

## Testing Considerations

### Manual Testing Checklist Per Page
1. Page loads without errors
2. AdminHeader renders correctly
3. Initial data fetches successfully
4. Filters work correctly
5. Actions trigger expected behavior
6. Error states display properly
7. Loading states appear during operations
8. Empty states show when no data

### Visual Comparison
- Compare each page against Bubble reference URL
- Target 95%+ visual fidelity

---

## Rollback Strategy
- Each page is independent (Islands Architecture)
- Can revert individual page changes without affecting others
- Git commits per phase for easy rollback

---

## Dependencies & Blockers

### Dependencies
- AdminHeader component (exists)
- Supabase client (exists)
- Toast notification system (exists)
- CSS variables (exists)

### Blockers
- None identified - all dependencies exist

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing Edge Function endpoints | Medium | High | Create placeholder API calls, document needed endpoints |
| Database table schema mismatch | Low | Medium | Reference existing working pages for schema |
| CSS styling complexity | Medium | Low | Use existing page CSS as templates |
| Large file sizes | Low | Low | Split into components as needed |

---

## Files Referenced in This Plan

### Requirements Documents
- `docs/Pending/BUBBLE APP_ _verify-users PAGE - COMPREHENSIVE REQUIREMENTS DOCUMENT.md`
- `docs/Pending/SL - _proposal-manage Page - COMPREHENSIVE REQUIREMENTS DOCUMENTATION .md`
- `docs/Pending/SL _manage-virtual-meetings - COMPREHENSIVE REQUIREMENTS DOCUMENT.md`
- `docs/Pending/EXHAUSTIVE REQUIREMENTS DOCUMENT_ _MESSAGE-CURATION MIGRATION.md`
- `docs/Pending/SL - _co-host-requests Page - BUBBLE PAGE REQUIREMENTS DOCUMENTATION_ .md`
- `docs/Pending/SL _internal-emergency Page - Comprehensive Requirements Document.md`

### Reference Implementations
- `app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.jsx`
- `app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js`
- `app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.jsx`
- `app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js`
- `app/src/islands/pages/ProposalManagePage/index.jsx`
- `app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js`

### Shared Components
- `app/src/islands/shared/AdminHeader/AdminHeader.jsx`
- `app/src/islands/shared/Toast.jsx`

### Configuration
- `app/src/routes.config.js`

### Existing Page Files (to Review/Enhance)
- `app/src/islands/pages/VerifyUsersPage.jsx`
- `app/src/islands/pages/useVerifyUsersPageLogic.js`
- `app/src/islands/pages/MessageCurationPage/MessageCurationPage.jsx`
- `app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js`
- `app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx`
- `app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js`

---

## Execution Notes

### Implementation Order
1. CoHostRequestsPage - Already complete, verify only
2. ManageVirtualMeetingsPage - Already complete, verify and polish
3. ProposalManagePage - Partially complete, enhance
4. VerifyUsersPage - May need refactoring into folder structure
5. MessageCurationPage - Review and enhance
6. InternalEmergencyPage - Review and enhance

### Per-Page Checklist
- [x] Read existing implementation
- [x] Compare against requirements doc
- [x] Identify gaps
- [x] Implement/enhance hollow component
- [x] Implement/enhance logic hook
- [x] Create/update CSS file
- [x] Create reusable components in components/ subfolder
- [x] Test page functionality
- [x] Visual comparison with Bubble reference

---

**VERSION**: 1.0
**CREATED**: 2026-01-26
**AUTHOR**: Implementation Planner
**STATUS**: COMPLETED - 2026-01-26
