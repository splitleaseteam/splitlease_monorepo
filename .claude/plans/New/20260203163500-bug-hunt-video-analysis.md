# Bug Hunt Video Analysis - Comprehensive Bug Report

**Video Source**: https://www.loom.com/share/ca37756b12ee4540abdfdd858728cc18
**Video Title**: bughunt only discrepancies host compensation and prices for guests, leases bugs
**Duration**: 32:33
**Recorded by**: Frederick Klindt
**Analysis Date**: 2026-02-03

---

## Executive Summary

This bug hunt session identified **28+ distinct bugs** across multiple areas of the Split Lease application. The most critical issues involve:
1. **Price/Compensation Discrepancies** - Host earnings vs Guest prices not showing correctly
2. **Messages System Failures** - Messages not being created for key actions
3. **Rental Application Regressions** - Previously working flow now broken
4. **Deployment/Environment Discrepancies** - Code working locally but not on production

---

## Bugs By Severity

### CRITICAL SEVERITY

#### BUG-001: Host Compensation vs Guest Price Discrepancy
- **Timestamp**: 17:02 - 17:53
- **Area**: Pricing | Proposals
- **Description**: The host side shows "YOUR EARNINGS: $11,000" but both host and guest see the same price per night ($181). There should be different numbers displayed - hosts see compensation, guests see price with markup/fees included.
- **Expected Behavior**: Host sees net compensation amount, Guest sees total price including platform fees
- **Actual Behavior**: Both see identical values with no markup or fees differentiation
- **User Quote**: "We are not properly seeing here the difference between compensation and prices. That's a major bug that we spend a lot of time fixing, a lot of time deploying and we still are not seeing on the gas side and the host side the different prices."

#### BUG-002: Messages Not Created for Key Actions
- **Timestamp**: 07:59 - 08:27, 16:29, 27:28, 28:37
- **Area**: Messages | Conversations
- **Description**: Multiple actions that should create messages are not doing so:
  - Proposal submission
  - Counter-offer acceptance
  - Meeting scheduling
  - Rental application submission
- **Expected Behavior**: Each major action creates a message in the conversation thread
- **Actual Behavior**: Thread created but no messages appear
- **User Quote**: "We have a new thread created but again no messages on the conversation so this is a bug that we experienced yesterday again"

#### BUG-003: Rental Application Flow Regression
- **Timestamp**: 13:00 - 14:54
- **Area**: Rental Application
- **Description**: The rental application submission flow is broken:
  - File upload fails with "loader is not defined" error
  - 500 status error on resource load
  - Profile not updating after submission
  - Progress not being saved
- **Expected Behavior**: Complete rental application, save progress, update profile strength
- **Actual Behavior**: Submission fails, progress lost, profile not updated
- **User Quote**: "The submission of the rental application should have submitted my profile. That's a regression and I need a report on why we're having this regression."

#### BUG-004: Deployment Mismatch - Local vs Production
- **Timestamp**: 03:36 - 04:39
- **Area**: Deployment | Infrastructure
- **Description**: Features working on localhost are not appearing on split.lease production despite successful deployment verification
- **Expected Behavior**: Deployed code matches production behavior
- **Actual Behavior**: Host Overview page styling/functionality differs between local and production
- **User Quote**: "On localhost I am seeing the right host overview so that's a differentiation... on split.lease we are not seeing it right now so that's one bug that we definitely want to fix by today"

---

### HIGH SEVERITY

#### BUG-005: Lease Link Not Redirecting
- **Timestamp**: 02:04 - 02:18
- **Area**: Host Dashboard | Leases
- **Description**: When clicking on "Leases" indicator showing a lease was created, it should redirect to the host leases page but nothing happens
- **Expected Behavior**: Click redirects to host leases page
- **Actual Behavior**: No navigation occurs
- **User Quote**: "When we click here we should redirect to the host leases page. Nothing of that is happening."

#### BUG-006: Proposal Status Not Reflecting Lease Creation
- **Timestamp**: 02:18 - 03:00
- **Area**: Host Proposals | Status
- **Description**: Host side doesn't show indication that proposal has progressed to lease status
- **Expected Behavior**: Proposal card shows lease creation status
- **Actual Behavior**: No visual indication of lease creation on host proposals page
- **User Quote**: "Some of these have the lease already created but we are not seeing on the host side any indication that the proposal landed to that status"

#### BUG-007: Price Per Night Wrong for Night Count
- **Timestamp**: 19:14 - 19:26
- **Area**: Pricing | Proposals
- **Description**: Listing has tiered pricing (different rates for 3, 4, 5 nights) but proposal shows wrong price
- **Expected Behavior**: 5 nights should show $164/night as per listing configuration
- **Actual Behavior**: Shows $181/night for 5 nights
- **User Quote**: "We shouldn't be seeing here 181 for 5 nights. For 5 nights, as you see on this listing, it has 164 per night."

#### BUG-008: Counter-Offer Price Calculation Wrong
- **Timestamp**: 19:26 - 20:01
- **Area**: Pricing | Counter-Offers
- **Description**: After submitting counter-offer, price changed to $145/night which doesn't match stored pricing structure
- **Expected Behavior**: Price should match listing's pricing tiers
- **Actual Behavior**: Price shows $145 which is inconsistent with listing data
- **User Quote**: "The price per night did change to 145 which makes no sense to what we are having stored here so that's a discrepancy between the prices safe and the pricing list structure"

#### BUG-009: Move-In Date Mismatch Between Host and Guest Views
- **Timestamp**: 20:27 - 21:13
- **Area**: Proposals | Data Sync
- **Description**: Host sees February 22 as move-in date, but guest side shows "TBD" or different date
- **Expected Behavior**: Both sides show same move-in date
- **Actual Behavior**: Guest side shows wrong/TBD date while host shows correct date
- **User Quote**: "On the host side we also see February 22 so that's some inconsistency on the data"

#### BUG-010: AI Summary Not Generated for Counter-Offers
- **Timestamp**: 21:43 - 22:26
- **Area**: AI Features | Counter-Offers
- **Description**: AI summary that should be generated for counter-offer submissions is not appearing
- **Expected Behavior**: AI generates summary message for counter-offer
- **Actual Behavior**: No AI summary displayed
- **User Quote**: "We didn't receive the AI summary for this counter-offer that's something that keeps happening"

#### BUG-011: Lease Dates Not Starting from Move-In Date
- **Timestamp**: 23:49 - 24:40
- **Area**: Leases | Date Generation
- **Description**: Lease dates don't start from the agreed move-in date. Move-in was February 22 but dates start from Saturday 28
- **Expected Behavior**: First lease date should be the move-in date (Sunday, Feb 22)
- **Actual Behavior**: Dates start from Saturday 28, skipping the actual move-in
- **User Quote**: "Moving date was February 22 why we are not creating the dates since that move in"

#### BUG-012: Lease Dates Wrong Ordering
- **Timestamp**: 24:40 - 25:11
- **Area**: Leases | Date Management
- **Description**: Lease dates are created with wrong sequence numbers (1, 11, 2, 12, 3, 13, etc. instead of 1, 2, 3, 4, 5)
- **Expected Behavior**: Dates ordered sequentially (1, 2, 3, 4, 5...)
- **Actual Behavior**: Dates showing as (1, 11, 2, 12, 3, 13, 4, 14...)
- **User Quote**: "It needs to be one two three four five so the order of how we are creating this is wrong"

#### BUG-013: Payment Records Not Being Created
- **Timestamp**: 25:11 - 25:40
- **Area**: Payments | Edge Functions
- **Description**: "Recreate all payment records" button triggers edge function but nothing happens, just shows error in logs
- **Expected Behavior**: Payment records created successfully
- **Actual Behavior**: Function fails silently with log errors
- **User Quote**: "If I trigger the recreate all payment records we should be creating the payment records using the edge functions but nothing happens I'm just seeing this logs error"

#### BUG-014: Documents Not Being Generated
- **Timestamp**: 25:40 - 26:52
- **Area**: Documents | Python Script
- **Description**: Document generation via Python script claims success but documents not appearing in Google Drive
- **Expected Behavior**: Documents generated and visible in Drive folder
- **Actual Behavior**: No new documents in the expected folder
- **User Quote**: "The documents were not generated still"

---

### MEDIUM SEVERITY

#### BUG-015: Nights Change Not Reflected on Guest Side
- **Timestamp**: 26:52 - 27:28
- **Area**: Proposals | Counter-Offers
- **Description**: When nights changed from 4 to 5 via counter-offer, guest side still shows "5 nights before and after" instead of "4 nights before, 5 nights after"
- **Expected Behavior**: Show original (4 nights) and new (5 nights) values
- **Actual Behavior**: Shows 5 and 5 (same value)
- **User Quote**: "It was four nights originally and five nights after and on the guest side we are not showing that change"

#### BUG-016: Virtual Meeting Not Visible to Host
- **Timestamp**: 28:24 - 29:04
- **Area**: Meetings | Host View
- **Description**: Guest requested virtual meeting, it appears on guest's proposal page, but host cannot see it anywhere
- **Expected Behavior**: Host sees meeting request and can interact with it
- **Actual Behavior**: Host sees no meeting section or notification
- **User Quote**: "I'm not seeing any section or anything related to the meeting that I just requested"

#### BUG-017: Rental Application Status Not Persisting
- **Timestamp**: 29:37 - 30:02
- **Area**: Rental Application | Persistence
- **Description**: After submitting rental application, returning to create another proposal still shows "Submit rental application recommended" and "Apply now"
- **Expected Behavior**: System recognizes application already submitted
- **Actual Behavior**: Prompts to submit again as if never submitted
- **User Quote**: "It keeps saying submit rental application recommended but again I already submitted it"

#### BUG-018: Listing Selection URL Mismatch
- **Timestamp**: 30:45 - 31:11
- **Area**: Host Dashboard | URL State
- **Description**: When switching between listings, the URL doesn't update to reflect the currently selected listing
- **Expected Behavior**: URL updates when listing selection changes
- **Actual Behavior**: URL remains static, causing wrong listing to load on refresh
- **User Quote**: "Changing listings here should also change the listing in the URL, so we land in the last one selected"

#### BUG-019: Profile Strength Not Updating
- **Timestamp**: 14:54 - 15:22
- **Area**: Profile | Progress Tracking
- **Description**: Filling out profile fields and clicking save doesn't update profile strength percentage
- **Expected Behavior**: Profile strength updates as fields are completed
- **Actual Behavior**: Profile strength remains unchanged
- **User Quote**: "They are not incrementing my profile strength I click on save changes nothing happens profile strength should be updated if I fill out stuff"

#### BUG-020: Notification Settings Missing Default Values
- **Timestamp**: 15:57 - 16:29
- **Area**: Notifications | User Setup
- **Description**: New users should have default notification settings pre-populated, but seeing empty/unchecked settings
- **Expected Behavior**: Default notification preferences set on user creation
- **Actual Behavior**: No default values shown
- **User Quote**: "Notification settings every time a new user is signed up we have default values to pre-feed here that we not seeing them"

#### BUG-021: Rental Application Wizard Sections Not Marking Complete
- **Timestamp**: 10:58 - 11:40
- **Area**: Rental Application | UX
- **Description**: After completing a section and clicking Continue, the section should show a checkmark but it doesn't
- **Expected Behavior**: Section marked with checkmark after completion
- **Actual Behavior**: No visual indication of completion
- **User Quote**: "The rental application wizard needs to have the check mark done after you click on continue that's as simple as that"

#### BUG-022: Host Proposal Progress Indicator Wrong
- **Timestamp**: 10:32 - 10:46
- **Area**: Host Proposals | Status
- **Description**: Host proposal page shows "Rental application submitted" when guest hasn't actually submitted it yet
- **Expected Behavior**: Show accurate status of rental application
- **Actual Behavior**: Shows submitted when still awaiting
- **User Quote**: "It says that the rental application is submitted but that's not true. Like as we can see here we are waiting for submitting the rental application."

---

### LOW SEVERITY

#### BUG-023: Filter UI Overflow Issue
- **Timestamp**: 05:26 - 05:38
- **Area**: Search | UI
- **Description**: Below/overflow content in filter panel not displaying properly
- **Expected Behavior**: Content fits or scrolls properly
- **Actual Behavior**: Content overflows awkwardly
- **User Quote**: "Below is overflowing... we need a better friendly way to display the below here"

#### BUG-024: Filter Buttons Stacking
- **Timestamp**: 05:38 - 06:11
- **Area**: Search | UI
- **Description**: Cancel and Apply filters buttons appearing stacked vertically instead of side by side
- **Expected Behavior**: Buttons aligned horizontally
- **Actual Behavior**: Buttons stacked on top of each other
- **User Quote**: "On these buttons, cancel and apply filters, they are one on top of the other"

#### BUG-025: No Loading State After Account Creation
- **Timestamp**: 07:29 - 07:59
- **Area**: Auth | UX
- **Description**: After creating account during proposal flow, there's a pause with no visual feedback before showing confirmation
- **Expected Behavior**: Loading spinner or progress indicator shown
- **Actual Behavior**: Blank/static screen for several seconds
- **User Quote**: "After creation of account and sign up this pop-up appears and shows you some sort of loading state because there were some seconds in which nothing was printed on the screen"

#### BUG-026: Loading Wheel Needed During Proposal Acceptance
- **Timestamp**: 21:13 - 21:43
- **Area**: Proposals | UX
- **Description**: Accepting host terms processes a lot of data with no loading indicator
- **Expected Behavior**: Loading wheel or progress indicator during processing
- **Actual Behavior**: No visual feedback during processing
- **User Quote**: "Processing a lot of data that takes a lot of time that we probably should display a loading wheel as anxiety reduction"

#### BUG-027: Messages Icon Styling Issue
- **Timestamp**: 29:04 - 29:37
- **Area**: UI | Header
- **Description**: Messages icon in header doesn't match the design criteria and style of the page
- **Expected Behavior**: Icon matches overall design system
- **Actual Behavior**: Icon appears too big and inconsistent
- **User Quote**: "This icon on the header is pretty off it's awful it's big doesn't match with the criteria and style of this page"

#### BUG-028: Move-In Date Strikethrough Misleading
- **Timestamp**: 19:26
- **Area**: Proposals | UI
- **Description**: Counter-offer shows move-in date with strikethrough suggesting change, but date didn't actually change
- **Expected Behavior**: Only show strikethrough if value actually changed
- **Actual Behavior**: Shows strikethrough even when dates are identical
- **User Quote**: "We keep saying that the moving date now is a strike-through but it didn't change it's exactly the same date"

---

## Additional Technical Issues Noted

### Environment-Specific Issues
1. **Local Proposal Submission Failing** (08:53 - 09:42): Edge function issues on localhost preventing proposal creation
2. **File Upload Bucket Issues** (12:16 - 12:49): "loader is not defined" error when trying to upload files in rental application

### Data Integrity Issues
1. **Lease Dates Missing Checkout** (23:22 - 23:49): Lease dates created without checkout date stored
2. **Total Rent vs Compensation Gap** (22:52 - 23:22): Total rent $18,000 vs compensation $14,000 - large gap that needs verification

---

## Priority Ranking for Fixes

### Must Fix Today (P0)
1. BUG-001: Host Compensation vs Guest Price Discrepancy
2. BUG-002: Messages Not Created for Key Actions
3. BUG-004: Deployment Mismatch
4. BUG-003: Rental Application Flow Regression

### Fix This Week (P1)
5. BUG-007: Price Per Night Wrong for Night Count
6. BUG-008: Counter-Offer Price Calculation Wrong
7. BUG-011: Lease Dates Not Starting from Move-In Date
8. BUG-012: Lease Dates Wrong Ordering
9. BUG-013: Payment Records Not Being Created
10. BUG-005: Lease Link Not Redirecting

### Fix Next Sprint (P2)
11. BUG-009: Move-In Date Mismatch
12. BUG-010: AI Summary Not Generated
13. BUG-014: Documents Not Being Generated
14. BUG-015: Nights Change Not Reflected
15. BUG-016: Virtual Meeting Not Visible
16. BUG-019: Profile Strength Not Updating
17. BUG-020: Notification Settings Missing Defaults

### Backlog (P3)
18-28: All Low severity items

---

## Files Likely Affected

Based on the bugs identified, these are the likely files that need investigation:

### Pricing/Compensation
- `app/src/logic/calculators/` - Price calculation logic
- `app/src/logic/processors/` - Price processing
- `supabase/functions/proposal/` - Proposal creation/update

### Messages
- `supabase/functions/messages/` - Message creation edge function
- `app/src/islands/pages/` - Message display components

### Rental Application
- `app/src/islands/pages/RentalApplicationPage.jsx`
- `supabase/functions/` - Related edge functions
- File upload/storage configuration

### Leases
- `supabase/functions/` - Lease creation logic
- Date generation utilities

### Deployment
- Build configuration
- Cloudflare deployment scripts
- Environment variable handling

---

## Screenshots Captured

Location: `.claude/screenshots/bug-hunt-20260203/`

1. `video-start-00-00.png` - Deployment summary showing successful deploy
2. `video-00-46.png` - Search results page with pricing
3. `video-01-54.png` - Host dashboard with listings
4. `video-02-48.png` - Proposal details with earnings display
5. `video-03-50.png` - Host overview with DevTools open
6. `video-04-48-transcript.png` - Search page with transcript visible

---

## Recommendations

1. **Implement E2E Tests**: Many of these bugs are regressions. Automated tests would catch them before deployment.

2. **Add Environment Parity Checks**: Create a script to verify production matches expected state after deployment.

3. **Message Creation Audit**: Trace all actions that should create messages and verify edge function is being called.

4. **Price Calculation Review**: Complete audit of price vs compensation logic throughout the codebase.

5. **Deployment Verification**: Add post-deployment smoke tests that run automatically.

---

*Report generated from video analysis on 2026-02-03*
