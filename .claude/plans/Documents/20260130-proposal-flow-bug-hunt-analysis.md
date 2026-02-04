# Proposal Flow Bug Hunt Analysis
**Date:** 2026-01-30
**Video:** https://www.loom.com/share/17024672bdfa4ada872b5ca33e2f8e8c
**Duration:** 44:11

## Executive Summary

Comprehensive bug hunt session testing the full proposal flow from host listing creation through guest proposal submission, host counteroffer, and acceptance. **18 critical bugs identified** across messaging, proposal status tracking, pricing calculations, AI summaries, and lease creation.

**Severity Breakdown:**
- 🔴 **Critical (blocking core workflows):** 5 bugs
- 🟠 **High (major functionality broken):** 8 bugs
- 🟡 **Medium (UX/display issues):** 5 bugs

---

## Bug Catalog

### 🔴 BUG-01: Entire Messaging Functionality Broken
**Timestamp:** 15:35-17:00
**Screenshot:** `bug-06-messaging-errors.png`

**What Failed:**
- Messages page shows "failed to load resources, right panel, error fetching"
- Cannot see any existing messages
- Cannot send new messages (returns "something went wrong" error)
- Entire in-app messaging system is non-functional

**Circumstances:**
- Occurs on both `/messages` page and messaging shared island in header
- After proposal creation, expected messages are not visible
- Affects both host and guest users

**Expected Behavior:**
- Messages should load and display in conversations
- Users should be able to send new messages
- Messaging icon should show unread message count
- System should create automatic messages when proposal status changes

**Systematic Fix Approach:**
1. Investigate message fetching API errors in Edge Functions (`messages/` function)
2. Check Supabase database schema for `messages` table
3. Verify RLS policies on messages table
4. Test message creation on proposal actions (create, counteroffer, accept)
5. Fix shared island data fetching for messaging icon
6. Add comprehensive error handling with specific error messages

---

### 🔴 BUG-02: Virtual Meeting Creation Fails - "Host User Not Found"
**Timestamp:** 18:18-20:00
**Screenshot:** `bug-07-virtual-meeting-error.png`

**What Failed:**
- Virtual meeting creation returns error: "Host user not found"
- Occurs on both guest and host sides when requesting meeting
- Error: `create virtual meeting. Host user not found`

**Circumstances:**
- When host tries to create meeting from proposals page: fails
- When guest tries to create meeting from proposals page: fails
- Likely regression from deletion of `account_host` and `account_guest` tables

**Expected Behavior:**
- Host/guest can click "Request Meeting" button
- Modal opens with calendar to select dates
- Virtual meeting created and both parties notified

**Systematic Fix Approach:**
1. Investigate virtual meetings Edge Function (`virtual-meetings/` or within `proposal/`)
2. Check database queries - likely referencing deleted `account_host`/`account_guest` tables
3. Update queries to use current user auth structure (Supabase Auth)
4. Verify user lookup logic uses correct user ID references
5. Test meeting creation from both host and guest perspectives
6. Add proper error handling with user-friendly messages

---

### 🔴 BUG-03: Proposal Acceptance Error - Lease Not Created
**Timestamp:** 32:39-34:42, 42:00-42:50
**Screenshot:** `bug-10-acceptance-error.png`

**What Failed:**
- Accepting proposal or counteroffer returns error
- After page refresh, lease appears in UI but is incomplete
- Searching by proposal ID in "Manage Lease Payment" page: lease not found
- Lease data not properly created in database

**Circumstances:**
- Occurs when host accepts guest proposal directly
- Occurs when guest accepts host counteroffer
- Error appears in modal, page must be refreshed to see partial data
- Lease creation partially completes but fails to save critical data

**Expected Behavior:**
- On acceptance, lease should be fully created in database
- Lease should be searchable by proposal ID
- User should see success message and be redirected to lease page
- All lease data should be persisted (dates, pricing, house rules, etc.)

**Systematic Fix Approach:**
1. Review `proposal/` Edge Function `accept` action
2. Check lease creation transaction logic
3. Verify all FK constraints are satisfied during lease creation
4. Test with null FK values (legacy data compatibility)
5. Add transaction rollback on any error
6. Log full error details: `code`, `message`, `details`, `hint`
7. Test acceptance flow end-to-end

---

### 🔴 BUG-04: AI Summaries Not Created After Counteroffer
**Timestamp:** 25:47-26:43

**What Failed:**
- After host submits counteroffer, guest does not see AI summary
- Only guest bio is shown, not AI-generated summary of proposal terms
- Regression - AI summaries were working previously

**Circumstances:**
- When host sends counteroffer to guest
- AI summary should be generated describing what changed
- Guest should see summary on proposal card

**Expected Behavior:**
AI summaries should be created for:
1. **Guest creates proposal** → Host sees AI summary
2. **Host creates suggested proposal** → Guest sees AI summary
3. **Host submits counteroffer** → Guest sees AI summary
4. **Mock-up proposal created** → Host sees AI summary

**Systematic Fix Approach:**
1. Locate AI summary generation logic (likely in `ai-gateway/` or `proposal/` Edge Function)
2. Verify AI summary creation is triggered on counteroffer action
3. Check database schema - ensure `ai_summary` field exists and is being populated
4. Test OpenAI API call for summary generation
5. Add AI summary generation to mock-up proposal creation flow
6. Test all 4 scenarios listed above

---

### 🔴 BUG-05: No Messages Created After Proposal Actions
**Timestamp:** 24:50-26:00

**What Failed:**
- After host sends counteroffer, no in-app message is created for guest
- After guest creates proposal, no message notification for host
- Message synchronization completely broken

**Circumstances:**
- Proposal actions (create, counteroffer, accept) should trigger automatic message creation
- Messages should appear in messaging system and update notification badge
- Currently no messages are being created

**Expected Behavior:**
- When proposal created: message sent to host
- When counteroffer sent: message sent to guest
- When proposal accepted: message sent to both parties
- Messages should include summary of action taken

**Systematic Fix Approach:**
1. Review proposal Edge Function actions (create, counteroffer, accept)
2. Ensure message creation logic is called after each action
3. Verify message format and content
4. Check if messages are being created but not displayed (vs not created at all)
5. Test message creation in isolation
6. Integrate with messaging system fix (BUG-01)

---

### 🟠 BUG-06: Mock-up Proposal Status Issues
**Timestamp:** 04:04-05:27
**Screenshot:** `bug-02-mockup-proposal.png`

**What Failed:**
- No clear visual indication that proposal is a mock-up
- Status shows "Rental App Submitted" in grey instead of purple
- Missing AI summary (only showing guest about bio)

**Circumstances:**
- When host creates new listing, mock-up proposal is auto-created
- Mock-up should be clearly labeled and differentiated from real proposals

**Expected Behavior:**
- Mock-up proposals should have distinct visual indicator (badge/label)
- "Rental Application Submitted" step should be highlighted in purple (default state)
- Mock-up should include AI summary just like real proposals

**Systematic Fix Approach:**
1. Add `is_mockup` boolean field to proposal display logic
2. Show "MOCK-UP" badge prominently on proposal card
3. Update progress bar to highlight completed steps in purple
4. Generate AI summary for mock-up proposals using template data
5. Differentiate mock-up styling from real proposals

---

### 🟠 BUG-07: Progress Bar Status Not Updating After Counteroffer
**Timestamp:** 24:25-24:50
**Screenshot:** `bug-09-progress-bar-status.png`

**What Failed:**
- After counteroffer, progress bar still shows previous status
- "Rental App Submitted" step not highlighted in purple despite completion
- Status text doesn't update to "Guest is reviewing counteroffer"

**Circumstances:**
- After host sends counteroffer
- Progress bar should reflect new proposal state

**Expected Behavior:**
- "Proposal Submitted" step: purple (completed)
- "Rental App Submitted" step: purple (completed)
- Current status: "Edit/Review Proposal" section should show "Guest is reviewing the counteroffer"
- Progress bar dynamically updates based on proposal state

**Systematic Fix Approach:**
1. Review progress bar component logic
2. Map proposal statuses to progress bar states
3. Ensure status updates after counteroffer action
4. Update status text based on who needs to act (host vs guest)
5. Test all proposal state transitions

---

### 🟠 BUG-08: Price Per Night Not Updated After Counteroffer
**Timestamp:** 29:21-32:15

**What Failed:**
- Guest still sees old price per night ($300.32) after host counteroffer
- Browse listings page shows correct pricing calculation ($437 for Mon-Wed nights)
- Counteroffer doesn't recalculate pricing using pricing list structure

**Circumstances:**
- Host modifies schedule in counteroffer (changes nights)
- Pricing list structure should recalculate nightly rate based on new schedule
- Guest sees stale pricing data

**Expected Behavior:**
- Counteroffer should trigger recalculation using pricing list structure
- Guest should see updated:
  - Nightly price
  - 4-week rent
  - Total price
- Calculations should match browse listings page logic

**Systematic Fix Approach:**
1. Review counteroffer action in proposal Edge Function
2. Ensure pricing recalculation is triggered when schedule changes
3. Use same logic as browse listings page (pricing list structure)
4. Update proposal pricing fields in database
5. Test with different schedule combinations
6. Verify guest sees updated prices immediately

---

### 🟠 BUG-09: House Rules Not Displayed After Counteroffer
**Timestamp:** 28:29-29:20

**What Failed:**
- Host added 5 house rules in counteroffer
- House rules not visible on proposal card for either host or guest
- House rules fields (`hc` fields in database?) not being saved or not being displayed

**Circumstances:**
- Host edits counteroffer and adds house rules (quiet hours, etc.)
- Rules should appear on proposal card and in review popup

**Expected Behavior:**
- House rules selected in counteroffer modal should save to database
- House rules should display on proposal card
- Guest should see house rules in review popup

**Systematic Fix Approach:**
1. Verify house rules are being saved to database in counteroffer action
2. Check database field names for house rules (`hc_*` fields)
3. Ensure frontend reads and displays house rules from proposal data
4. Test house rules display on both host and guest views
5. Verify house rules persist through proposal state changes

---

### 🟠 BUG-10: Nights Reserved Calculation Incorrect
**Timestamp:** 20:56-21:31
**Screenshot:** `bug-08-nights-reserved-calculation.png`

**What Failed:**
- Nights reserved shows "0 nights" initially
- After edit, shows "32 nights" but calculation is wrong
- Should be: Originally 48 nights (3 nights/week × 16 weeks), reduced to 32 nights (2 nights/week × 16 weeks)

**Circumstances:**
- Initial proposal: Monday-Wednesday (3 nights), 16 weeks duration
- After counteroffer: Monday-Tuesday (2 nights), 16 weeks duration
- Nights calculation not reflecting correct math

**Expected Behavior:**
- Initial proposal: 3 nights × 16 weeks = 48 total nights
- After counteroffer: 2 nights × 16 weeks = 32 total nights
- Calculation should accurately reflect (nights per week) × (weeks duration)

**Systematic Fix Approach:**
1. Locate nights calculation logic (likely in calculators or processors)
2. Verify calculation: `nights_per_week × reservation_length_weeks`
3. Ensure calculation runs on proposal creation and counteroffer
4. Test edge cases (1 night, 7 nights, varying weeks)
5. Display calculation in review modal for transparency

---

### 🟠 BUG-11: Host Proposals Page Shows Guest Pricing Instead of Compensation
**Timestamp:** 41:03-42:00

**What Failed:**
- Host seeing guest's price per night ($156.45) instead of host compensation ($130)
- Bug was reportedly fixed previously but regression occurred (or not deployed)

**Circumstances:**
- On host proposals dashboard
- Should show host compensation (what host earns per night)
- Instead showing guest pricing (what guest pays per night)

**Expected Behavior:**
- Host proposals page displays host compensation per night
- Guest proposals page displays guest pricing per night
- Use correct calculation for each user perspective

**Systematic Fix Approach:**
1. Review host proposals page component
2. Ensure using `host_compensation` field not `guest_price`
3. Verify calculation logic differentiates host vs guest views
4. Check if fix was deployed to production
5. Add test coverage to prevent regression
6. Verify on split.lease (production) vs local branch

---

### 🟠 BUG-12: Moving Date Shows "TBD" in Guest Review Popup
**Timestamp:** 27:00-28:00

**What Failed:**
- Guest review terms popup shows "TBD" (To Be Determined) for moving date
- Host proposals page shows correct date (February 17)
- Inconsistent data display between views

**Circumstances:**
- After counteroffer with confirmed moving date
- Date is saved and visible on host side
- Guest popup doesn't read the date properly

**Expected Behavior:**
- Moving date should display consistently across all views
- Guest review popup should show actual date (February 17)
- "TBD" should only appear if date is genuinely not determined

**Systematic Fix Approach:**
1. Check guest review popup component data binding
2. Verify `moving_date` field is being passed to popup
3. Ensure date formatting is correct
4. Test with various date scenarios
5. Verify data consistency between host and guest views

---

### 🟡 BUG-13: Cleaning Fee Placeholder Not Clear When Empty
**Timestamp:** 01:48-02:03
**Screenshot:** `bug-01-cleaning-fee-placeholder.png`

**What Failed:**
- When cleaning fee input is deleted, placeholder "150" is still visible
- Not clear that field is actually empty vs having value of 150

**Circumstances:**
- User enters cleaning fee, then deletes it
- Placeholder text makes it appear field still has value

**Expected Behavior:**
- Clear visual indication when field is empty
- Placeholder should be styled differently (lighter color, italic)
- Or show "$0" explicitly when field is empty

**Systematic Fix Approach:**
1. Update input field styling to differentiate placeholder from value
2. Consider showing explicit "$0" when field is empty instead of placeholder
3. Add visual cue (icon, color) to indicate empty state
4. Test with other financial input fields for consistency

---

### 🟡 BUG-14: Pricing Unit Test Page Fails to Load
**Timestamp:** 08:14-08:37
**Screenshot:** `bug-03-pricing-unit-test-fail.png`

**What Failed:**
- Pricing unit test page at `/pricing-unit-test` fails to load
- No data displayed
- Header not showing properly

**Circumstances:**
- Navigate to pricing unit test page after listing creation
- Page should display pricing structure for testing

**Expected Behavior:**
- Pricing unit test page loads successfully
- Shows pricing structure data
- Header displays correctly

**Systematic Fix Approach:**
1. Check if route exists in `routes.config.js`
2. Verify page component exists and is properly configured
3. Check data fetching logic for pricing structure
4. Test with newly created listing
5. Ensure listing ID is passed correctly to page

---

### 🟡 BUG-15: Quick Price Calculator Table Display Issues
**Timestamp:** 10:17-11:17
**Screenshot:** `bug-04-quick-price-table.png`

**What Failed:**
Multiple issues on Quick Price Calculator page:
- Edit/override buttons have no visible text (only visible on hover)
- Location column breaking entire table layout
- Shows "Unknown host" instead of host name
- Cannot search by listing ID (only by name)
- Table incomplete with various display bugs

**Circumstances:**
- Quick Price Calculator page loaded
- Listing just created with valid host account
- Table rendering broken

**Expected Behavior:**
- Button labels visible without hover
- Location column properly formatted
- Host name displayed correctly
- Search by listing ID or name
- Clean table layout

**Systematic Fix Approach:**
1. Fix button label visibility (CSS issue)
2. Constrain location column width with ellipsis
3. Ensure host name is fetched and displayed
4. Add listing ID search capability
5. Review table component styling
6. Test responsive layout

---

### 🟡 BUG-16: Host Overview Cards Button Alignment
**Timestamp:** 13:15-13:55
**Screenshot:** `bug-05-host-overview-cards.png`

**What Failed:**
- Four buttons on host overview cards not horizontally aligned
- Buttons should be aligned together at bottom of card

**Circumstances:**
- Host overview page display
- Card layout changed recently

**Expected Behavior:**
- Four action buttons horizontally aligned at bottom of card
- Consistent spacing and sizing
- Professional visual appearance

**Systematic Fix Approach:**
1. Review card component flexbox/grid layout
2. Ensure buttons are in flex container with proper alignment
3. Set `justify-content` and `align-items` appropriately
4. Test with cards of varying content heights
5. Verify responsive behavior

---

### 🟡 BUG-17: Request Meeting Button Styling and Functionality
**Timestamp:** 17:07-17:58

**What Failed:**
- "Request Meeting" button described as "super ugly"
- Doesn't match header design aesthetic
- Doesn't trigger correct shared island modal
- Should show same virtual meeting modal as proposals page

**Circumstances:**
- Request Meeting button on messaging page
- Button exists but poorly styled and non-functional

**Expected Behavior:**
- Button styled consistently with app design system
- Clicking button opens virtual meeting modal
- Same modal as shown on proposals page "Schedule Meeting"
- Professional appearance

**Systematic Fix Approach:**
1. Apply consistent button styling from design system
2. Wire button to correct modal component
3. Reuse virtual meeting modal from proposals page
4. Test button click triggers modal
5. Ensure modal functions correctly from messaging context

---

### 🟡 BUG-18: Messaging Icon in Header Not Updating
**Timestamp:** 13:15-14:18

**What Failed:**
- Messaging icon in header shows "no messages yet"
- Despite 2 active proposals with messages
- Shared island not updating with message count

**Circumstances:**
- After proposals created with messages
- Header messaging icon should show unread count
- Icon state not synchronized with message data

**Expected Behavior:**
- Messaging icon shows unread message count badge
- Badge updates in real-time when new messages arrive
- Clicking icon shows message dropdown/navigation

**Systematic Fix Approach:**
1. Fix messaging data fetching (related to BUG-01)
2. Ensure shared island subscribes to message updates
3. Add real-time subscription to messages table
4. Update badge count based on unread messages
5. Test message count updates across user actions

---

## Root Cause Analysis

### Common Patterns

1. **Database Schema Changes:**
   - Deletion of `account_host` and `account_guest` tables causing cascading failures
   - Functions still referencing old table structure

2. **Message System Breakdown:**
   - Core messaging infrastructure completely broken
   - Affects multiple features (notifications, proposal updates, in-app chat)

3. **Calculation Regressions:**
   - Pricing calculations not running after proposal modifications
   - Nights calculation logic broken
   - Host vs guest pricing display issues

4. **AI Summary System:**
   - AI summary generation not triggered on key actions
   - Missing from mock-ups and counteroffers

5. **Deployment/Branch Confusion:**
   - Some fixes mentioned as "already fixed" not visible in production
   - Possible branch/deployment synchronization issues

---

## Systematic Fix Strategy

### Phase 1: Critical Infrastructure (BUG-01, BUG-02, BUG-03, BUG-05)
**Goal:** Restore core messaging and proposal acceptance functionality

1. **Messaging System Restoration**
   - Fix message fetching API
   - Restore message creation on proposal actions
   - Fix RLS policies
   - Update header shared island

2. **Virtual Meeting Fix**
   - Update user lookup queries (remove account_host/guest references)
   - Use Supabase Auth user IDs directly
   - Test from both sides

3. **Lease Creation Fix**
   - Debug proposal acceptance transaction
   - Ensure all FK constraints satisfied
   - Add proper error logging
   - Test with legacy data (null FKs)

**Estimated Complexity:** High
**Priority:** P0 (blocks entire proposal flow)

---

### Phase 2: Data Accuracy (BUG-04, BUG-08, BUG-09, BUG-10, BUG-11, BUG-12)
**Goal:** Ensure data calculations and display are accurate

1. **AI Summary System**
   - Trigger AI generation on counteroffer
   - Add to mock-up creation
   - Test all 4 scenarios

2. **Pricing Recalculation**
   - Trigger on counteroffer schedule changes
   - Use pricing list structure logic
   - Update database fields

3. **House Rules Persistence**
   - Verify save on counteroffer
   - Display on all views

4. **Nights Calculation**
   - Fix formula: nights_per_week × weeks
   - Test edge cases

5. **Host Compensation Display**
   - Show correct values on host view
   - Verify deployment status

6. **Moving Date Display**
   - Fix guest popup data binding
   - Ensure consistency

**Estimated Complexity:** Medium
**Priority:** P1 (data accuracy critical)

---

### Phase 3: UX Polish (BUG-06, BUG-07, BUG-13-18)
**Goal:** Fix visual and UX issues

1. **Progress Bar Logic**
   - Map statuses to progress states
   - Update on all transitions

2. **Mock-up Indicators**
   - Add visual badge
   - Generate AI summary

3. **UI Fixes**
   - Cleaning fee placeholder styling
   - Quick Price table layout
   - Host overview button alignment
   - Request Meeting button styling

4. **Page Fixes**
   - Pricing unit test page loading
   - Search by listing ID

**Estimated Complexity:** Low-Medium
**Priority:** P2 (UX improvements)

---

## Testing Checklist

After fixes, test complete end-to-end flow:

### Listing Creation Flow
- [ ] Create listing as signed-out user
- [ ] Prompted to sign up during creation
- [ ] Mock-up proposal created with AI summary
- [ ] Mock-up clearly labeled and styled
- [ ] Pricing unit test page loads with data

### Proposal Creation Flow
- [ ] Guest creates proposal
- [ ] Host receives in-app message notification
- [ ] Host sees AI summary of proposal
- [ ] Messaging icon updates with unread count
- [ ] Progress bar shows correct status

### Counteroffer Flow
- [ ] Host modifies schedule and adds house rules
- [ ] Nights calculation accurate
- [ ] Pricing recalculated based on new schedule
- [ ] Guest receives in-app message
- [ ] Guest sees AI summary of counteroffer
- [ ] House rules visible on both sides
- [ ] Progress bar updates
- [ ] Moving date displays correctly

### Acceptance Flow
- [ ] Guest accepts counteroffer
- [ ] Lease created successfully in database
- [ ] Lease searchable by proposal ID
- [ ] All lease data persisted correctly
- [ ] Both parties receive confirmation message
- [ ] Host sees compensation pricing (not guest pricing)

### Messaging Flow
- [ ] Messages load on /messages page
- [ ] Can send new messages
- [ ] Messages update in real-time
- [ ] Header icon shows correct count
- [ ] Request Meeting button styled and functional
- [ ] Virtual meeting creation works from both sides

### Quick Price Calculator
- [ ] Search by listing ID works
- [ ] Search by listing name works
- [ ] Table displays properly
- [ ] Host name shown correctly
- [ ] Button labels visible
- [ ] Location column formatted correctly

---

## Recommendations

1. **Add Comprehensive Error Logging**
   - Log all database errors with full details (code, message, details, hint)
   - Add error tracking to Edge Functions
   - Monitor PostgREST error codes (23503 = FK violation, 23505 = unique violation)

2. **Implement End-to-End Tests**
   - Automate proposal flow testing
   - Prevent regressions on critical paths
   - Test with legacy data (null FK values)

3. **Code Review for Database Schema Changes**
   - Any table deletion should trigger review of all references
   - Update all queries before deployment
   - Consider database migration scripts

4. **Deployment Verification**
   - Verify fixes deployed to production (split.lease)
   - Maintain changelog of what's deployed vs in local branches
   - Test on production after deployment

5. **Message System Refactor**
   - Consider dedicated message service
   - Real-time subscriptions for updates
   - Retry logic for failed message creation

---

## Files Likely Needing Changes

Based on bug analysis:

### Edge Functions
- `supabase/functions/proposal/index.ts` - Counteroffer, acceptance, AI summary
- `supabase/functions/messages/index.ts` - Message CRUD and fetching
- `supabase/functions/ai-gateway/index.ts` - AI summary generation
- Virtual meetings function (identify location)

### Frontend Components
- `app/src/islands/pages/HostProposalsPage.jsx` - Progress bar, pricing display
- `app/src/islands/pages/MessagingPage.jsx` - Message loading, send button
- `app/src/islands/pages/QuickPriceCalculatorPage.jsx` - Table layout, search
- `app/src/islands/pages/PricingUnitTestPage.jsx` - Page loading
- `app/src/islands/pages/HostOverviewPage.jsx` - Card button alignment
- Shared islands for messaging icon header
- Progress bar component
- Proposal card component
- Request Meeting button component

### Business Logic
- `app/src/logic/calculators/` - Nights calculation, pricing calculation
- `app/src/logic/processors/` - Proposal data processing
- `app/src/logic/workflows/` - Proposal acceptance workflow

### Database
- Check `messages` table RLS policies
- Verify `proposals` table fields (ai_summary, hc_*, pricing fields)
- Verify `leases` table creation logic
- Check user reference fields after account_host/guest deletion

---

## Next Steps

1. **Immediate:** Fix P0 bugs (messaging, virtual meetings, lease creation)
2. **Short-term:** Fix P1 bugs (data accuracy, calculations)
3. **Medium-term:** Fix P2 bugs (UX polish)
4. **Long-term:** Add test coverage and monitoring

**Estimated Total Effort:** 3-5 days for experienced developer familiar with codebase

---

## Appendix: Screenshots

All screenshots saved to `.playwright-mcp/` directory:
- `bug-01-cleaning-fee-placeholder.png`
- `bug-02-mockup-proposal.png`
- `bug-03-pricing-unit-test-fail.png`
- `bug-04-quick-price-table.png`
- `bug-05-host-overview-cards.png`
- `bug-06-messaging-errors.png`
- `bug-07-virtual-meeting-error.png`
- `bug-08-nights-reserved-calculation.png`
- `bug-09-progress-bar-status.png`
- `bug-10-acceptance-error.png`
