# Proposal Flow Playwright Debug Session Plan

**Duration:** 5 hours continuous debugging session
**Approach:** Test → Debug → Fix → Verify cycle using Playwright MCP
**Goal:** Fix all 18 bugs identified in bug hunt video

---

## Session Setup

### Test Accounts Needed

**Host Account:**
- Email: `host-debug-2026@splitlease.test`
- Password: `TestHost2026!`
- Role: Host (creates listings)

**Guest Account:**
- Email: `guest-debug-2026@splitlease.test`
- Password: `TestGuest2026!`
- Role: Guest (creates proposals)

### Browser Session Flow

Throughout this 5-hour session, I will:
1. **Navigate to split.lease** (or localhost if testing locally)
2. **Sign in as HOST** → perform host actions → **Sign out**
3. **Sign in as GUEST** → perform guest actions → **Sign out**
4. **Repeat** for each test scenario
5. **Take screenshots** at each step to verify fixes
6. **Capture errors** in console and network tabs

---

## Test Data Creation (First 30 minutes)

### Step 1: Create Host Account
```
Playwright Actions:
1. Navigate to https://split.lease/signup
2. Fill email: host-debug-2026@splitlease.test
3. Fill password: TestHost2026!
4. Fill name: Host Debugger
5. Fill birthdate: 01/01/1990
6. Submit signup
7. Verify email (check inbox or use Supabase to confirm)
8. Take screenshot: "host-account-created.png"
```

### Step 2: Create Guest Account
```
Playwright Actions:
1. Sign out
2. Navigate to /signup
3. Fill email: guest-debug-2026@splitlease.test
4. Fill password: TestGuest2026!
5. Fill name: Guest Debugger
6. Fill birthdate: 01/01/1995
7. Submit signup
8. Verify email
9. Take screenshot: "guest-account-created.png"
```

### Step 3: Create Test Listing (as Host)
```
Playwright Actions:
1. Sign in as host
2. Navigate to /create-listing
3. Select "I manage listings for landlords"
4. Rental type: Monthly
5. Monthly rate: $3500
6. Security deposit: $1000
7. Cleaning fee: $150
8. Type of space: Entire Place
9. Address: "123 Test Street, Manhattan, NY 10001"
10. Skip photos (or upload test image)
11. Submit listing
12. Capture listing ID from URL
13. Take screenshot: "listing-created.png"
14. Store listing ID: [LISTING_ID]
```

---

## Phase 1: Critical Infrastructure Bugs (P0) - 2 hours

### BUG-01 & BUG-05: Messaging System Broken

**Test Scenario:**
```
1. [GUEST] Create proposal for [LISTING_ID]
   - Sign in as guest
   - Navigate to /browse/listings/[LISTING_ID]
   - Select Mon-Thu (3 nights)
   - Duration: 8 weeks
   - Submit proposal
   - Take screenshot: "proposal-created.png"

2. [HOST] Check for message notification
   - Sign out guest
   - Sign in as host
   - Navigate to /messages
   - EXPECTED: See message from guest about new proposal
   - ACTUAL: Screenshot error state
   - Check browser console for errors
   - Check Network tab for failed requests

3. [GUEST] Try to send message
   - Sign out host
   - Sign in as guest
   - Navigate to /messages/[PROPOSAL_ID]
   - Type: "Hello, I'm interested in this property"
   - Click Send
   - EXPECTED: Message sent successfully
   - ACTUAL: Screenshot error
```

**Debug Steps:**
```
1. Open browser DevTools (Network + Console)
2. Reproduce error
3. Identify failing API endpoint
4. Check response error code/message
5. Locate Edge Function: supabase/functions/messages/
6. Read function code
7. Identify issue (likely RLS policy or user ID lookup)
```

**Fix Steps:**
```
1. If RLS issue:
   - Check Supabase RLS policies on messages table
   - Update policy to allow authenticated users to read their messages

2. If Edge Function issue:
   - Update messages/index.ts with fix
   - Deploy: supabase functions deploy messages

3. If database schema issue:
   - Check messages table structure
   - Verify foreign keys correct
```

**Verify Fix:**
```
Playwright Actions:
1. Refresh /messages page
2. Verify messages load without errors
3. Send test message
4. Verify message appears in conversation
5. Check messaging icon updates with badge
6. Take screenshot: "messaging-fixed.png"
```

---

### BUG-02: Virtual Meeting "Host User Not Found"

**Test Scenario:**
```
1. [HOST] Request virtual meeting
   - Sign in as host
   - Navigate to /host/proposals
   - Click on proposal from guest
   - Click "Request Meeting" button
   - Select dates in calendar
   - Click "Submit Request"
   - EXPECTED: Meeting created
   - ACTUAL: Error "Host user not found"
   - Take screenshot: "virtual-meeting-error.png"

2. [GUEST] Request virtual meeting
   - Sign out host
   - Sign in as guest
   - Navigate to /guest/proposals
   - Click on proposal
   - Click "Request Meeting"
   - EXPECTED: Meeting created
   - ACTUAL: Same error
   - Take screenshot: "guest-meeting-error.png"
```

**Debug Steps:**
```
1. Open DevTools Network tab
2. Find API call to virtual meeting endpoint
3. Check request payload
4. Check response error details
5. Locate Edge Function handling virtual meetings
6. Grep for "host user not found" error message
7. Identify query referencing deleted account_host/account_guest tables
```

**Fix Steps:**
```
1. Update user lookup query to use Supabase Auth:
   // OLD: SELECT * FROM account_host WHERE id = ?
   // NEW: Use auth.users or current_user

2. Update function code
3. Deploy function
4. Test locally first with supabase functions serve
```

**Verify Fix:**
```
Playwright Actions:
1. [HOST] Request meeting → verify success
2. [GUEST] Request meeting → verify success
3. Check both calendars show meeting
4. Take screenshot: "meeting-fixed.png"
```

---

### BUG-03: Lease Not Created on Acceptance

**Test Scenario:**
```
1. [GUEST] Create simple proposal
   - Sign in as guest
   - Create proposal (Mon-Wed, 4 weeks)
   - Take screenshot: "proposal-for-acceptance.png"

2. [HOST] Accept proposal immediately
   - Sign out guest
   - Sign in as host
   - Navigate to /host/proposals
   - Click "Accept" on guest proposal
   - EXPECTED: Lease created, success message
   - ACTUAL: Error appears
   - Take screenshot: "acceptance-error.png"
   - Check console for error details

3. [HOST] Check if lease was created
   - Navigate to /manage-lease-payment
   - Search by proposal ID
   - EXPECTED: Lease found
   - ACTUAL: "Lease not found"
   - Take screenshot: "lease-not-found.png"
```

**Debug Steps:**
```
1. Check Network tab for API error response
2. Look for FK constraint violation (code 23503)
3. Identify which FK field is causing failure
4. Check proposal data - identify null FK values
5. Locate acceptance logic in proposal Edge Function
6. Review lease creation transaction
```

**Fix Steps:**
```
1. Update acceptance logic to handle null FK values:
   - Only include FK fields that have values
   - Add validation before insert

2. Add comprehensive error logging:
   console.error({ code, message, details, hint });

3. Test transaction rollback on error

4. Deploy fix
```

**Verify Fix:**
```
Playwright Actions:
1. Create new proposal
2. Accept proposal
3. Verify success message appears
4. Search for lease by proposal ID → verify found
5. Check lease data is complete
6. Take screenshot: "lease-created-success.png"
```

---

### BUG-04: AI Summaries Not Generated

**Test Scenario:**
```
1. [HOST] Send counteroffer
   - Sign in as host
   - Navigate to existing proposal
   - Click "Modify"
   - Change nights from Mon-Wed to Mon-Tue
   - Add house rules
   - Submit counteroffer
   - Take screenshot: "counteroffer-sent.png"

2. [GUEST] Check for AI summary
   - Sign out host
   - Sign in as guest
   - Navigate to proposal
   - EXPECTED: See AI summary of counteroffer changes
   - ACTUAL: Only see guest bio, no AI summary
   - Take screenshot: "no-ai-summary.png"

3. [HOST] Check mock-up proposal
   - Sign out guest
   - Sign in as host (or create new listing)
   - Check auto-generated mock-up proposal
   - EXPECTED: Has AI summary
   - ACTUAL: No AI summary
   - Take screenshot: "mockup-no-summary.png"
```

**Debug Steps:**
```
1. Check if ai_summary field exists in proposals table
2. Check if AI gateway function exists
3. Trace proposal/counteroffer code path
4. Look for AI summary generation call
5. Verify OpenAI API key configured
```

**Fix Steps:**
```
1. Add AI summary generation to counteroffer action
2. Add AI summary to mock-up creation
3. Test AI gateway function independently
4. Deploy fixes
```

**Verify Fix:**
```
Playwright Actions:
1. Send new counteroffer
2. Check guest sees AI summary
3. Create new listing with mock-up
4. Check host sees AI summary on mock-up
5. Take screenshots: "ai-summary-working.png"
```

---

## Phase 2: Data Accuracy Bugs (P1) - 1.5 hours

### BUG-08: Price Not Recalculated After Counteroffer

**Test Scenario:**
```
1. [GUEST] Note original pricing
   - Sign in as guest
   - Navigate to proposal
   - Note price per night: e.g., $300
   - Take screenshot: "original-pricing.png"

2. [HOST] Send counteroffer changing schedule
   - Sign out guest, sign in as host
   - Modify proposal: change Mon-Wed to Mon-Tue (reduce 1 night)
   - Submit counteroffer
   - Take screenshot: "counteroffer-schedule-change.png"

3. [GUEST] Check if price updated
   - Sign out host, sign in as guest
   - View proposal
   - EXPECTED: New price reflecting 2 nights instead of 3
   - ACTUAL: Still shows old price $300
   - Take screenshot: "price-not-updated.png"

4. [GUEST] Compare with browse listings
   - Navigate to /browse/listings/[LISTING_ID]
   - Select Mon-Tue (2 nights)
   - Note calculated price
   - Compare with proposal price
   - Should match but doesn't
   - Take screenshot: "browse-vs-proposal-price.png"
```

**Debug Steps:**
```
1. Identify pricing calculation logic in browse listings
2. Find counteroffer action in proposal function
3. Check if pricing recalculation is triggered
4. Verify pricing list structure is being used
```

**Fix Steps:**
```
1. Import pricing calculation from browse listings logic
2. Add recalculation trigger on schedule change
3. Update proposal pricing fields in database
4. Deploy fix
```

**Verify Fix:**
```
Playwright Actions:
1. Send counteroffer with schedule change
2. Check guest sees updated pricing
3. Verify matches browse listings calculation
4. Take screenshot: "pricing-recalculated.png"
```

---

### BUG-09: House Rules Not Displayed

**Test Scenario:**
```
1. [HOST] Add house rules in counteroffer
   - Sign in as host
   - Edit proposal
   - Select 5 house rules (quiet hours, no smoking, etc.)
   - Submit counteroffer
   - Take screenshot: "house-rules-selected.png"

2. [HOST] Check if rules visible on host view
   - View proposal card
   - EXPECTED: See house rules listed
   - ACTUAL: No house rules shown
   - Take screenshot: "host-no-rules.png"

3. [GUEST] Check if rules visible on guest view
   - Sign out host, sign in as guest
   - View proposal
   - EXPECTED: See house rules
   - ACTUAL: No house rules
   - Take screenshot: "guest-no-rules.png"
```

**Debug Steps:**
```
1. Check if house rules saved to database
2. Query proposals table directly for hc_* fields
3. Check if frontend is reading hc_* fields
4. Verify proposal card component displays rules
```

**Fix Steps:**
```
1. Ensure counteroffer saves house rules to database
2. Update proposal card to display hc_* fields
3. Add to review modal
4. Deploy fixes
```

**Verify Fix:**
```
Playwright Actions:
1. Add house rules in counteroffer
2. Verify visible on host side
3. Verify visible on guest side
4. Take screenshot: "house-rules-fixed.png"
```

---

### BUG-10: Nights Calculation Wrong

**Test Scenario:**
```
1. [GUEST] Create proposal
   - Sign in as guest
   - Select Mon-Wed (3 nights per week)
   - Duration: 16 weeks
   - EXPECTED: 3 × 16 = 48 total nights
   - Submit proposal
   - Check "Nights Reserved" display
   - ACTUAL: Shows 0 or incorrect number
   - Take screenshot: "nights-calculation-wrong.png"

2. [HOST] Modify in counteroffer
   - Sign in as host
   - Change to Mon-Tue (2 nights per week)
   - Duration: 16 weeks
   - EXPECTED: 2 × 16 = 32 total nights
   - Submit counteroffer
   - ACTUAL: Shows incorrect number
   - Take screenshot: "counteroffer-nights-wrong.png"
```

**Debug Steps:**
```
1. Find nights calculation logic
2. Review formula being used
3. Check if nights_per_week is calculated correctly
4. Verify reservation_length is in weeks
```

**Fix Steps:**
```
1. Fix formula: nights_per_week × reservation_length_weeks
2. Apply on proposal creation
3. Apply on counteroffer schedule change
4. Deploy fix
```

**Verify Fix:**
```
Playwright Actions:
1. Create proposal with known values
2. Verify calculation is correct
3. Send counteroffer changing schedule
4. Verify recalculation correct
5. Take screenshot: "nights-calculation-fixed.png"
```

---

### BUG-11: Host Sees Guest Price Instead of Compensation

**Test Scenario:**
```
1. [GUEST] Create proposal
   - Sign in as guest
   - Create proposal
   - Note guest price shown: e.g., $300/night
   - Take screenshot: "guest-sees-price.png"

2. [HOST] Check price on proposals page
   - Sign out guest, sign in as host
   - Navigate to /host/proposals
   - Check price displayed
   - EXPECTED: Host compensation (e.g., $250/night)
   - ACTUAL: Shows guest price ($300/night)
   - Take screenshot: "host-sees-guest-price.png"
```

**Debug Steps:**
```
1. Check HostProposalsPage component
2. Find where price is displayed
3. Verify using wrong field (guest_price vs host_compensation)
```

**Fix Steps:**
```
1. Update to use price_per_night_host field
2. Ensure both fields exist in proposal data
3. Deploy fix
```

**Verify Fix:**
```
Playwright Actions:
1. Check host proposals page
2. Verify shows host compensation
3. Check guest proposals page still shows guest price
4. Take screenshot: "correct-pricing-display.png"
```

---

### BUG-12: Moving Date Shows "TBD"

**Test Scenario:**
```
1. [HOST] Send counteroffer with confirmed date
   - Sign in as host
   - Set moving date: February 17, 2026
   - Submit counteroffer
   - Verify date shown on host view
   - Take screenshot: "host-moving-date.png"

2. [GUEST] Check review popup
   - Sign out host, sign in as guest
   - Open review terms popup
   - EXPECTED: Moving date: February 17, 2026
   - ACTUAL: Shows "TBD"
   - Take screenshot: "guest-moving-date-tbd.png"
```

**Debug Steps:**
```
1. Check if moving_date saved to database
2. Check guest review popup component
3. Verify data binding for moving_date field
```

**Fix Steps:**
```
1. Ensure moving_date passed to popup
2. Fix date formatting
3. Deploy fix
```

**Verify Fix:**
```
Playwright Actions:
1. Check guest popup shows correct date
2. Verify consistency with host view
3. Take screenshot: "moving-date-fixed.png"
```

---

## Phase 3: UX Polish Bugs (P2) - 1.5 hours

### BUG-06 & BUG-07: Progress Bar and Mock-up Indicators

**Test Scenario:**
```
1. [HOST] Check mock-up proposal
   - Sign in as host
   - Navigate to new listing's proposals
   - View auto-generated mock-up
   - EXPECTED: "MOCK-UP" badge, purple progress steps
   - ACTUAL: No badge, grey progress
   - Take screenshot: "mockup-no-indicator.png"

2. [GUEST] Send proposal, host sends counteroffer
   - Create proposal as guest
   - Send counteroffer as host
   - EXPECTED: Progress bar updates, shows "Guest reviewing counteroffer"
   - ACTUAL: Progress bar doesn't update
   - Take screenshot: "progress-not-updated.png"
```

**Fix & Verify:**
```
1. Add is_mockup badge to proposal cards
2. Update progress bar logic to map proposal statuses
3. Test all proposal states
4. Take screenshots of fixes
```

---

### BUG-13-18: UI/UX Issues

**Test Scenarios:**

**BUG-13: Cleaning Fee Placeholder**
```
1. Navigate to /create-listing as host
2. Enter cleaning fee: 150
3. Delete value
4. EXPECTED: Clear indication field is empty
5. ACTUAL: Placeholder "150" looks like value
6. Fix styling, verify
```

**BUG-14: Pricing Unit Test Page**
```
1. Navigate to /pricing-unit-test
2. EXPECTED: Page loads with data
3. ACTUAL: Fails to load
4. Fix routing/data fetching, verify
```

**BUG-15: Quick Price Calculator**
```
1. Navigate to /quick-price
2. Check table layout
3. EXPECTED: Buttons have labels, host name shown, search by ID works
4. ACTUAL: Multiple display issues
5. Fix CSS, add search functionality, verify
```

**BUG-16: Host Overview Cards**
```
1. Navigate to /host/overview
2. Check button alignment on cards
3. EXPECTED: 4 buttons horizontally aligned at bottom
4. ACTUAL: Misaligned
5. Fix flexbox layout, verify
```

**BUG-17: Request Meeting Button**
```
1. Navigate to /messages/[PROPOSAL_ID]
2. Click "Request Meeting"
3. EXPECTED: Styled button, opens modal
4. ACTUAL: Ugly button, doesn't work
5. Fix styling and functionality, verify
```

**BUG-18: Messaging Icon**
```
1. After creating proposal, check header icon
2. EXPECTED: Badge with unread count
3. ACTUAL: Shows "no messages"
4. Fix data fetching, add real-time subscription, verify
```

---

## Continuous Testing Loop

For each bug:

1. **REPRODUCE** with Playwright
   - Navigate to page
   - Perform action
   - Capture error screenshot
   - Check console/network for errors

2. **DEBUG**
   - Identify root cause
   - Locate relevant code
   - Understand the issue

3. **FIX**
   - Make code changes
   - Deploy if Edge Function
   - Rebuild if frontend

4. **VERIFY**
   - Refresh page in Playwright
   - Repeat action
   - Confirm bug is fixed
   - Take success screenshot

5. **DOCUMENT**
   - Update bug status
   - Note what was fixed
   - Save screenshots

---

## Session Checkpoints

**Every 1 hour:**
- Review bugs fixed so far
- Document any blockers
- Adjust approach if needed

**Every 2 hours:**
- Run full end-to-end test
- Verify no regressions
- Update progress report

---

## Sign In/Sign Out Pattern

Throughout session, I will constantly switch between accounts:

```
# Pattern for two-sided testing:
1. Sign in as HOST
2. Perform host action (e.g., create listing, send counteroffer)
3. Sign out
4. Sign in as GUEST
5. Perform guest action (e.g., create proposal, accept counteroffer)
6. Verify guest sees correct data
7. Sign out
8. Sign in as HOST
9. Verify host sees correct data
10. Repeat for next bug
```

This ensures I'm testing from both perspectives and catching any side-specific bugs.

---

## Success Criteria

Session complete when:
- ✅ All 18 bugs reproducible in Playwright
- ✅ All 18 bugs fixed and verified
- ✅ Full end-to-end flow works (create listing → proposal → counteroffer → acceptance → lease)
- ✅ No console errors
- ✅ All screenshots captured
- ✅ Documentation updated

---

## Environment

**Test on:** https://split.lease (production) or http://localhost:8000 (local dev)
**Browser:** Chrome/Chromium via Playwright
**DevTools:** Always open (Network + Console tabs)

---

## Notes

- If a fix requires database migration, document it but may need manual intervention
- If encountering blocker, document and move to next bug
- Keep detailed log of all fixes in session notes
- Save all screenshots to `.playwright-mcp/debug-session/`

**This is an active debugging session, not a passive plan. I will use Playwright to interact with the live application throughout the 5 hours.**
