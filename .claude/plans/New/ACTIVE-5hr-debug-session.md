# ACTIVE 5-Hour Playwright Debug Session
**Started:** 2026-01-30
**Environment:** http://localhost:3000 (bun run dev)
**Status:** IN PROGRESS

---

## Test Accounts

- **Host:** Will be created during listing flow
  - Email: `hostdebug2026@test.com`
  - Password: `HostTest2026!`
  - Birthdate: 01/15/1988

- **Guest:** Existing account
  - Email: `terrencegrey@test.com`
  - Password: `eCom2023$`

---

## PHASE 1: DATA SETUP (60 minutes)

### Step 1: Create Nightly Listing (WHILE SIGNED OUT)

**CRITICAL: Must start listing creation BEFORE signing up**

1. **Navigate to /create-listing** (currently signed out)
2. **Fill listing details FIRST:**
   - Who are you? → "I manage listings for landlords"
   - Rental type: **Nightly**
   - Nightly rate: $155
   - Discount: Set to 20% for longer stays
   - Security deposit: $500
   - Cleaning fee: $150 (then DELETE it to test BUG-13)
   - Type of space: Entire Place
   - Address: "123 Test St, Manhattan, NY 10001"
   - Bedrooms: 1
   - Bathrooms: 1
   - Upload photos OR skip
3. **Click "Continue" or "Submit"**
4. **GET PROMPTED TO SIGN UP** ← This is the key step
5. **Complete signup flow:**
   - First name: Host
   - Last name: Debugger
   - Email: hostdebug2026@test.com
   - Birthdate: 01/15/1988
   - Password: HostTest2026!
   - Submit account creation
6. **VERIFY: Listing created successfully after signup**
7. **Store Listing ID #1** (nightly)
8. **Check for mock-up proposal:**
   - Navigate to /host/proposals
   - Verify mock-up exists
   - **BUG-06 TEST:** Check for "MOCK-UP" badge (should exist)
   - **BUG-04 TEST:** Check for AI summary (should exist)
9. **Take screenshot:** `listing-1-nightly-created.png`

### Step 2: Create Weekly Listing (NOW SIGNED IN)

1. **Navigate to /create-listing** (already signed in as host)
2. **Fill listing details:**
   - Who are you? → "I manage listings for landlords"
   - Rental type: **Weekly**
   - Weekly rate: $800
   - Security deposit: $800
   - Cleaning fee: $100
   - Type of space: Private Room
   - Address: "456 Weekly Ave, Manhattan, NY 10002"
   - Bedrooms: 1
   - Bathrooms: 1
   - Upload photos OR skip
3. **Submit listing**
4. **Store Listing ID #2** (weekly)
5. **Check for mock-up proposal**
6. **Take screenshot:** `listing-2-weekly-created.png`

### Step 3: Create Monthly Listing (SIGNED IN)

1. **Navigate to /create-listing** (already signed in)
2. **Fill listing details:**
   - Who are you? → "I manage listings for landlords"
   - Rental type: **Monthly**
   - Monthly rate: $3,500
   - Security deposit: $1,000
   - Cleaning fee: $200
   - Type of space: Entire Place
   - Address: "789 Monthly Blvd, Manhattan, NY 10003"
   - Bedrooms: 2
   - Bathrooms: 1
   - Upload photos OR skip
3. **Submit listing**
4. **Store Listing ID #3** (monthly)
5. **Check for mock-up proposal**
6. **Take screenshot:** `listing-3-monthly-created.png`

### Step 4: Verify All Mock-ups

**Navigate to /host/proposals**

For EACH of the 3 mock-up proposals:
- [ ] Mock-up badge visible (BUG-06)
- [ ] AI summary present (BUG-04)
- [ ] Progress bar shows correct default state (BUG-07)
- [ ] Guest bio displayed

**Take screenshot:** `all-mockups-verified.png`

### Step 5: Sign Out Host, Sign In As Guest

1. **Click user menu → Sign Out**
2. **Navigate to homepage**
3. **Click "Sign In"**
4. **Enter credentials:**
   - Email: `terrencegrey@test.com`
   - Password: `eCom2023$`
5. **Sign in**
6. **Verify signed in as guest**
7. **Take screenshot:** `guest-signed-in.png`

### Step 6: Guest Creates Proposal #1 (Nightly Listing)

1. **Navigate to:** `/browse/listings/[LISTING_ID_1]`
2. **Select schedule:**
   - Check-in: Next Monday
   - Nights: Monday, Tuesday, Wednesday (3 nights/week)
   - Duration: 4 weeks
3. **Fill "About" section:** "I'm Terrence, interested in this nightly rental for work commute."
4. **Submit proposal**
5. **VERIFY on guest proposals page:**
   - Proposal created
   - AI summary exists (BUG-04)
   - Schedule shown correctly
   - Nights calculation correct (BUG-10)
6. **Take screenshot:** `guest-proposal-1-nightly.png`

### Step 7: Guest Creates Proposal #2 (Weekly Listing)

1. **Navigate to:** `/browse/listings/[LISTING_ID_2]`
2. **Select schedule:**
   - Check-in: Next Monday
   - Nights: Monday-Thursday (4 nights/week)
   - Duration: 8 weeks
3. **Fill "About" section:** "Interested in weekly rental."
4. **Submit proposal**
5. **Take screenshot:** `guest-proposal-2-weekly.png`

### Step 8: Guest Creates Proposal #3 (Monthly Listing)

1. **Navigate to:** `/browse/listings/[LISTING_ID_3]`
2. **Select schedule:**
   - Check-in: Next Monday
   - Nights: Monday-Friday (5 nights/week)
   - Duration: 16 weeks
3. **Fill "About" section:** "Need monthly rental for extended project."
4. **Submit proposal**
5. **Take screenshot:** `guest-proposal-3-monthly.png`

**END OF PHASE 1 - Data Setup Complete**

---

## PHASE 2: BUG TESTING & FIXING (180 minutes)

### BUG-01 & BUG-05: Messaging System (30 min)

**Test Scenario:**

1. **As GUEST:** Navigate to /messages
   - **EXPECTED:** See conversations with host
   - **ACTUAL:** Check for errors
   - **Screenshot:** `bug-01-messaging-page.png`

2. **Try to send message:**
   - Type: "Hello, I have questions about the listing"
   - Click Send
   - **EXPECTED:** Message sent
   - **ACTUAL:** Check for errors
   - **Screenshot:** `bug-01-send-message.png`

3. **Check console errors:**
   - Open DevTools Console tab
   - Check Network tab for failed requests
   - **Screenshot:** `bug-01-console-errors.png`

**Debug:**
- Identify failing API endpoint
- Check Edge Function: `supabase/functions/messages/`
- Check RLS policies on messages table

**Fix:**
- [Document fix here as implemented]

**Verify Fix:**
- Reload /messages page
- Verify messages load
- Send test message
- Verify message appears
- **Screenshot:** `bug-01-fixed.png`

---

### BUG-18: Messaging Icon Not Updating (15 min)

**Test Scenario:**

1. **As GUEST:** After creating proposals, check header messaging icon
   - **EXPECTED:** Badge showing unread message count
   - **ACTUAL:** Shows "no messages yet"
   - **Screenshot:** `bug-18-messaging-icon.png`

**Debug:**
- Check shared island component for messaging icon
- Verify data fetching logic
- Check real-time subscriptions

**Fix:**
- [Document fix here]

**Verify:**
- Message icon shows correct unread count
- **Screenshot:** `bug-18-fixed.png`

---

### BUG-02: Virtual Meeting Creation (20 min)

**Test Scenario:**

1. **As HOST:** Sign out guest, sign in as host
2. **Navigate to /host/proposals**
3. **Click on Proposal #1**
4. **Click "Request Meeting" button**
5. **Select date in calendar**
6. **Click "Submit Request"**
   - **EXPECTED:** Meeting created
   - **ACTUAL:** Error "Host user not found"
   - **Screenshot:** `bug-02-host-error.png`

7. **As GUEST:** Sign out host, sign in as guest
8. **Try same flow from guest side**
   - **EXPECTED:** Meeting created
   - **ACTUAL:** Same error
   - **Screenshot:** `bug-02-guest-error.png`

**Debug:**
- Check browser Console for error details
- Check Network tab for API call
- Locate virtual meeting Edge Function
- Search for "host user not found" in code
- Identify query referencing deleted `account_host`/`account_guest` tables

**Fix:**
- Update user lookup to use Supabase Auth
- Deploy Edge Function
- Test locally first

**Verify:**
- Host can request meeting successfully
- Guest can request meeting successfully
- **Screenshot:** `bug-02-fixed.png`

---

### BUG-04: AI Summaries Missing After Counteroffer (30 min)

**Test Scenario:**

1. **As HOST:** Navigate to Proposal #2 (weekly listing)
2. **Click "Modify" button**
3. **Change schedule:**
   - From Mon-Thu (4 nights) → Mon-Wed (3 nights)
4. **Add house rules:**
   - Quiet hours 10pm-8am
   - No smoking
5. **Submit counteroffer**
6. **Sign out host, sign in as GUEST**
7. **Navigate to Proposal #2**
   - **EXPECTED:** AI summary of counteroffer changes
   - **ACTUAL:** No AI summary, only guest bio
   - **Screenshot:** `bug-04-no-ai-summary.png`

**Debug:**
- Locate AI summary generation logic
- Check if triggered on counteroffer action
- Test AI gateway function

**Fix:**
- Add AI summary generation to counteroffer flow
- Test OpenAI API call
- Deploy fix

**Verify:**
- Send new counteroffer
- Guest sees AI summary
- **Screenshot:** `bug-04-fixed.png`

---

### BUG-08: Pricing Not Recalculated (25 min)

**Test Scenario:**

1. **Continue from BUG-04 test** (counteroffer already sent)
2. **As GUEST:** View Proposal #2
3. **Check price per night displayed**
   - Original: 4 nights/week schedule
   - New: 3 nights/week schedule
   - **EXPECTED:** Price recalculated for 3 nights
   - **ACTUAL:** Still shows old price
   - **Screenshot:** `bug-08-price-not-updated.png`

4. **Compare with browse listings:**
   - Navigate to `/browse/listings/[LISTING_ID_2]`
   - Select Mon-Wed (3 nights)
   - Check calculated price
   - **Compare:** Should match proposal price but doesn't
   - **Screenshot:** `bug-08-browse-vs-proposal.png`

**Debug:**
- Locate pricing calculation in browse listings
- Check counteroffer action in proposal Edge Function
- Verify pricing recalculation is triggered

**Fix:**
- Add pricing recalculation on schedule change
- Use same logic as browse listings
- Update proposal pricing fields

**Verify:**
- Send counteroffer with schedule change
- Guest sees updated pricing
- Matches browse listings calculation
- **Screenshot:** `bug-08-fixed.png`

---

### BUG-09: House Rules Not Displayed (20 min)

**Test Scenario:**

1. **Continue from BUG-04** (house rules added in counteroffer)
2. **As GUEST:** View Proposal #2
   - **EXPECTED:** See house rules (quiet hours, no smoking)
   - **ACTUAL:** No house rules shown
   - **Screenshot:** `bug-09-guest-no-rules.png`

3. **As HOST:** Sign out guest, sign in as host
4. **View Proposal #2 on /host/proposals**
   - **EXPECTED:** See house rules
   - **ACTUAL:** No house rules shown
   - **Screenshot:** `bug-09-host-no-rules.png`

**Debug:**
- Check if house rules saved to database
- Query proposals table for hc_* fields
- Check proposal card component

**Fix:**
- Ensure counteroffer saves house rules
- Update UI to display hc_* fields
- Test from both sides

**Verify:**
- House rules visible on host view
- House rules visible on guest view
- **Screenshot:** `bug-09-fixed.png`

---

### BUG-10: Nights Calculation Wrong (20 min)

**Test Scenario:**

1. **Review Proposal #3** (monthly, 5 nights/week × 16 weeks)
   - **EXPECTED:** 5 × 16 = 80 total nights
   - **ACTUAL:** Check displayed value
   - **Screenshot:** `bug-10-nights-wrong.png`

2. **Send counteroffer changing schedule:**
   - From 5 nights/week → 3 nights/week
   - Still 16 weeks
   - **EXPECTED:** 3 × 16 = 48 total nights
   - **ACTUAL:** Check calculation
   - **Screenshot:** `bug-10-counteroffer-nights.png`

**Debug:**
- Find nights calculation logic
- Review formula
- Test edge cases

**Fix:**
- Correct formula: nights_per_week × weeks
- Apply on creation and counteroffer
- Test calculations

**Verify:**
- All proposals show correct nights
- Counteroffer recalculates correctly
- **Screenshot:** `bug-10-fixed.png`

---

### BUG-11: Host Sees Guest Pricing (15 min)

**Test Scenario:**

1. **As HOST:** Navigate to /host/proposals
2. **Check Proposal #1 pricing display**
   - **EXPECTED:** Host compensation (what host earns)
   - **ACTUAL:** Guest pricing (what guest pays)
   - **Screenshot:** `bug-11-wrong-pricing.png`

**Debug:**
- Check HostProposalsPage component
- Identify pricing field used
- Verify data structure

**Fix:**
- Use `price_per_night_host` instead of `price_per_night_guest`
- Test from host view

**Verify:**
- Host sees compensation amount
- Guest still sees guest pricing
- **Screenshot:** `bug-11-fixed.png`

---

### BUG-12: Moving Date Shows "TBD" (15 min)

**Test Scenario:**

1. **As HOST:** Send counteroffer on Proposal #1
2. **Set moving date:** February 17, 2026
3. **Submit counteroffer**
4. **Verify date shown on host view**
5. **As GUEST:** Sign in as guest
6. **Open "Review Terms" popup**
   - **EXPECTED:** Moving date: February 17, 2026
   - **ACTUAL:** Shows "TBD"
   - **Screenshot:** `bug-12-tbd-date.png`

**Debug:**
- Check review popup component
- Verify data binding for moving_date

**Fix:**
- Ensure moving_date passed to popup
- Fix date formatting
- Test consistency

**Verify:**
- Guest sees correct moving date
- Matches host view
- **Screenshot:** `bug-12-fixed.png`

---

### BUG-03: Lease Creation Failure (30 min)

**Test Scenario - Direct Acceptance:**

1. **As HOST:** Navigate to Proposal #1
2. **Click "Accept" button immediately** (no counteroffer)
3. **EXPECTED:** Lease created, success message
4. **ACTUAL:** Error appears
5. **Screenshot:** `bug-03-acceptance-error.png`

6. **Check console for error details**
7. **Navigate to /manage-lease-payment**
8. **Search by Proposal ID**
   - **EXPECTED:** Lease found
   - **ACTUAL:** "Lease not found"
   - **Screenshot:** `bug-03-lease-not-found.png`

**Debug:**
- Check Network tab for error response
- Look for FK constraint violation (code 23503)
- Review acceptance logic in proposal Edge Function
- Check lease creation transaction

**Fix:**
- Handle null FK values
- Add error logging
- Test with legacy data
- Deploy fix

**Verify:**
- Accept new proposal
- Lease created successfully
- Searchable by proposal ID
- **Screenshot:** `bug-03-fixed.png`

---

### BUG-07: Progress Bar Not Updating (15 min)

**Test Scenario:**

1. **After sending counteroffer** (from previous tests)
2. **Check progress bar on proposal card**
   - **EXPECTED:** "Rental App Submitted" highlighted purple
   - **EXPECTED:** Status text: "Guest is reviewing counteroffer"
   - **ACTUAL:** Progress bar not updated
   - **Screenshot:** `bug-07-progress-bar.png`

**Debug:**
- Review progress bar component
- Map proposal statuses to progress states

**Fix:**
- Update progress bar logic
- Set status text dynamically
- Highlight completed steps

**Verify:**
- Progress bar updates after counteroffer
- Correct status message
- **Screenshot:** `bug-07-fixed.png`

---

### BUG-06: Mock-up Visual Indicators (15 min)

**Test Scenario:**

1. **Navigate to /host/proposals**
2. **View all 3 mock-up proposals**
   - **EXPECTED:** "MOCK-UP" badge on each
   - **EXPECTED:** Purple progress bar default state
   - **ACTUAL:** Check current state
   - **Screenshot:** `bug-06-mockup-indicators.png`

**Fix:**
- Add MOCK-UP badge component
- Style mock-ups differently
- Set default progress state

**Verify:**
- All mock-ups have badge
- Distinct visual styling
- **Screenshot:** `bug-06-fixed.png`

---

### BUG-13-18: UX Bugs (30 min)

**BUG-13: Cleaning Fee Placeholder**
- Test deleting cleaning fee
- Verify empty state clear
- **Screenshot:** `bug-13.png`

**BUG-14: Pricing Unit Test Page**
- Navigate to /pricing-unit-test
- Test page loading
- **Screenshot:** `bug-14.png`

**BUG-15: Quick Price Calculator**
- Navigate to /quick-price
- Test table display
- Test search by ID
- **Screenshot:** `bug-15.png`

**BUG-16: Host Overview Cards**
- Navigate to /host-overview
- Check button alignment
- **Screenshot:** `bug-16.png`

**BUG-17: Request Meeting Button**
- Check styling
- Test functionality
- **Screenshot:** `bug-17.png`

---

## PHASE 3: GUEST ACCEPTANCE FLOW (60 minutes)

### Complete Acceptance Test

1. **As GUEST:** Navigate to Proposal #2
2. **Review counteroffer terms**
3. **Click "Accept" button**
4. **VERIFY:**
   - Lease created
   - Both parties get message
   - Success notification
5. **Screenshot:** `acceptance-flow-complete.png`

---

## PHASE 4: FULL END-TO-END VERIFICATION (60 minutes)

**Test complete proposal journey:**

1. Create new listing (as host)
2. Create proposal (as guest)
3. Send counteroffer (as host)
4. Accept counteroffer (as guest)
5. Verify lease created
6. Send messages
7. Request virtual meeting
8. Verify all bugs fixed

**Screenshot:** `final-e2e-test.png`

---

## Session Notes

### Bugs Fixed:
- [ ] BUG-01: Messaging
- [ ] BUG-02: Virtual meetings
- [ ] BUG-03: Lease creation
- [ ] BUG-04: AI summaries
- [ ] BUG-05: Proposal messages
- [ ] BUG-06: Mock-up indicators
- [ ] BUG-07: Progress bar
- [ ] BUG-08: Pricing recalculation
- [ ] BUG-09: House rules
- [ ] BUG-10: Nights calculation
- [ ] BUG-11: Host pricing display
- [ ] BUG-12: Moving date TBD
- [ ] BUG-13-18: UX bugs

### Blockers:
- [Document any blockers encountered]

### Code Changes:
- [List files modified and fixes applied]

---

**TOTAL ESTIMATED TIME: 5 hours**
**STATUS: IN PROGRESS**
