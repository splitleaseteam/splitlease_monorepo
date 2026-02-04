# E2E Debug Plan: Counteroffer Flow Complete Validation

## Objective
Systematically test, debug, and fix the counteroffer acceptance flow until ALL acceptance criteria pass.

## Test Data
```
Proposal ID: 1768674109497x26858129648361608
Guest Email: terrencegrey@test.com
Guest Bubble ID: 1767918595624x88062023316464928
Host Bubble ID: 1768496609507x04459521370938590
Thread ID: 1768674109837x50519304058830336
Listing ID: 1768602263778x74873452510159664
Supabase Project: qzsmhgyojmwvtjmnrdea (dev)
```

## Acceptance Criteria

### AC1: AI Counteroffer Summary Display
- [ ] Guest proposals page shows expandable "Counteroffer Summary" section
- [ ] Summary contains BBCode-formatted text explaining what changed
- [ ] Summary appears for proposals where `counter offer happened = true`

### AC2: Message Generation on Acceptance
- [ ] When guest accepts host terms, a message is created for the GUEST in the thread
- [ ] When guest accepts host terms, a message is created for the HOST in the thread
- [ ] Messages contain appropriate call-to-action

### AC3: Lease Creation
- [ ] Lease record is created in `lease` table
- [ ] Lease has correct `move_in_date` based on proposal
- [ ] Lease has correct `nights_per_week` from counteroffer
- [ ] Lease has correct `reservation_span_weeks` from counteroffer
- [ ] Lease dates are correctly calculated based on the above fields
- [ ] Agreement number is generated in correct format

### AC4: Admin Visibility
- [ ] Lease appears in Manage Lease and Payment Records internal page
- [ ] All lease details are correctly displayed

---

## Phase 1: Data Verification via Supabase MCP

### Step 1.1: Verify Proposal State
```sql
SELECT
  _id,
  "Status",
  "counter offer happened",
  "Guest",
  "Listing",
  "HC reservation Span (weeks)" as hc_weeks,
  "HC nights per week (num)" as hc_nights,
  "HC Move in range start" as hc_move_in,
  "HC Days Selected" as hc_days,
  "HC nightly price" as hc_price
FROM proposal
WHERE _id = '1768674109497x26858129648361608'
```

### Step 1.2: Verify Thread Exists
```sql
SELECT
  _id,
  "Proposal",
  guest_user_id,
  host_user_id
FROM thread
WHERE "Proposal" = '1768674109497x26858129648361608'
```

### Step 1.3: Verify SplitBot Messages Exist
```sql
SELECT
  _id,
  "Message Body",
  "Call to Action",
  "is Split Bot",
  "Created Date"
FROM _message
WHERE "Associated Thread/Conversation" = '1768674109837x50519304058830336'
  AND "is Split Bot" = true
ORDER BY "Created Date" DESC
LIMIT 5
```

### Step 1.4: Check RLS Function
```sql
-- Verify get_user_bubble_id() function exists and works
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_user_bubble_id'
```

---

## Phase 2: Frontend Debug via Playwright MCP

### Step 2.1: Login as Guest
1. Navigate to login page
2. Login with `terrencegrey@test.com`
3. Verify redirect to appropriate page

### Step 2.2: Navigate to Guest Proposals
1. Navigate to `/guest-proposals?proposal=1768674109497x26858129648361608`
2. Wait for page load
3. Take snapshot

### Step 2.3: Check Console Logs
1. Get browser console messages
2. Look for `[DEBUG]` entries showing:
   - Thread query results
   - Message query results
   - counterofferSummaryMap contents
3. Look for `[EPC DEBUG]` entries showing:
   - isCounteroffer value
   - counterofferSummary value

### Step 2.4: Verify UI State
1. Check if proposal card is expanded
2. Look for "Counteroffer Summary" section in accessibility snapshot
3. If not found, document the actual DOM structure

---

## Phase 3: Root Cause Analysis

### Potential Issues to Check:

#### Issue A: RLS Blocking Thread Access
```sql
-- Test as authenticated user simulation
-- Check if thread is visible to guest
SELECT * FROM thread
WHERE "Proposal" = '1768674109497x26858129648361608'
  AND (guest_user_id = '1767918595624x88062023316464928'
       OR host_user_id = '1767918595624x88062023316464928')
```

#### Issue B: Column Name Case Sensitivity
- Check if `.in('Proposal', ...)` vs `.in('"Proposal"', ...)` matters
- Verify Supabase JS client behavior with quoted identifiers

#### Issue C: Data Not Being Attached to Proposal Object
- Check `userProposalQueries.js` line 619 where counterofferSummary is attached
- Verify the enrichment step is executing

#### Issue D: Component Conditional Rendering
- Check `ExpandableProposalCard.jsx` line 854-856
- Verify both `isCounteroffer` and `counterofferSummary` are truthy

---

## Phase 4: Fix Implementation

Based on root cause, implement fix in appropriate file:

### If RLS Issue:
- Modify RLS policy on `thread` table
- Or use service role for this specific query

### If Column Name Issue:
- Update query in `userProposalQueries.js` lines 506-508
- Test with both quoted and unquoted variants

### If Data Flow Issue:
- Add missing data attachment in enrichment step
- Verify map lookups are working

### If Component Issue:
- Fix conditional rendering logic
- Ensure CSS isn't hiding the component

---

## Phase 5: Test Counteroffer Acceptance

### Step 5.1: Reset Test Data (if needed)
```sql
-- Reset proposal to awaiting guest review state
UPDATE proposal
SET "Status" = 'Host Counteroffer Submitted / Awaiting Guest Review'
WHERE _id = '1768674109497x26858129648361608'
```

### Step 5.2: Accept Counteroffer via UI
1. Login as guest
2. Navigate to guest proposals
3. Find the test proposal
4. Click "Accept Host Terms" button
5. Confirm acceptance

### Step 5.3: Verify Messages Created
```sql
SELECT
  _id,
  "Message Body",
  "Call to Action",
  "is Split Bot",
  "Recipient Account",
  "Created Date"
FROM _message
WHERE "Associated Thread/Conversation" = '1768674109837x50519304058830336'
ORDER BY "Created Date" DESC
LIMIT 10
```

### Step 5.4: Verify Lease Created
```sql
SELECT
  _id,
  "Agreement Number",
  "Proposal",
  "Move In Date",
  "Move Out Date",
  "nights_per_week",
  "reservation_span_weeks",
  "Status",
  "Created Date"
FROM lease
WHERE "Proposal" = '1768674109497x26858129648361608'
```

### Step 5.5: Verify Admin Page Shows Lease
1. Navigate to internal admin page for leases
2. Search for the lease by agreement number
3. Verify all fields display correctly

---

## Phase 6: Regression Prevention

### Add E2E Test
Create Playwright test that:
1. Logs in as test guest
2. Views proposal with counteroffer
3. Verifies AI summary is visible
4. Accepts counteroffer
5. Verifies messages created
6. Verifies lease created with correct dates

### Add Console Warnings
If data is missing, log warning with proposal ID for debugging

---

## Debug Loop Protocol

```
WHILE acceptance_criteria_not_met:
    1. RUN Phase 2 (Playwright test)
    2. COLLECT console logs and UI state
    3. RUN Phase 1 (Supabase verification)
    4. ANALYZE discrepancies
    5. IDENTIFY root cause
    6. IMPLEMENT fix
    7. COMMIT fix
    8. REPEAT
```

---

## Files Likely Involved

| File | Purpose |
|------|---------|
| `app/src/lib/proposals/userProposalQueries.js` | Thread/message fetching |
| `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` | UI rendering |
| `app/src/islands/pages/proposals/CounterofferSummarySection.jsx` | Summary component |
| `supabase/functions/proposal/actions/*.ts` | Proposal status updates |
| `supabase/functions/lease/handlers/*.ts` | Lease creation |
| `supabase/functions/messages/handlers/*.ts` | Message creation |

---

## Success Metrics

1. **Console shows**: `[DEBUG] Final counterofferSummaryMap: [['1768674109497x26858129648361608', '...']]`
2. **UI shows**: Expandable "Counteroffer Summary" section with BBCode content
3. **After acceptance**: New messages in thread for both guest and host
4. **Lease created**: With correct dates matching nights_per_week × reservation_span_weeks
5. **Admin page**: Lease visible with correct agreement number

---

## Estimated Iterations
- Best case: 2-3 iterations
- Typical: 4-6 iterations
- Worst case: 8-10 iterations (if multiple issues)
