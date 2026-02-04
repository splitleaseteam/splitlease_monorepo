# E2E Test: Counteroffer Acceptance Flow

**Purpose**: Systematically test counteroffer acceptance to verify lease creation AND in-app SplitBot messages for both guest and host
**Budget**: 15 minutes
**Tools**: Playwright MCP + Supabase MCP
**Project Ref**: `qzsmhgyojmwvtjmnrdea`

---

## PROMPT FOR AGENT

You are testing the counteroffer acceptance flow for Split Lease. Your goal is to verify that when a guest accepts a counteroffer:
1. ✅ Lease is created successfully
2. ✅ SplitBot in-app messages are created for BOTH guest AND host
3. ✅ Success modal displays correctly

You have access to **Playwright MCP** for browser automation and **Supabase MCP** for database operations. Use both systematically.

---

## PHASE 1: SETUP & DATA PREPARATION (3 min)

### Step 1.1: Identify Test Proposal

Use Supabase MCP to find a proposal in "Host Counteroffer Submitted / Awaiting Guest Review" status:

```sql
SELECT
  p._id as proposal_id,
  p."Status",
  p."Guest",
  p."Host",
  p."Listing",
  t._id as thread_id,
  u_guest.email as guest_email,
  u_host.email as host_email
FROM proposal p
LEFT JOIN thread t ON t."Proposal" = p._id
LEFT JOIN "user" u_guest ON u_guest._id = p."Guest"
LEFT JOIN "user" u_host ON u_host._id = p."Host"
WHERE p."Status" = 'Host Counteroffer Submitted / Awaiting Guest Review'
  AND p."Deleted" IS NOT TRUE
ORDER BY p."Modified Date" DESC
LIMIT 1;
```

**Record**:
- `PROPOSAL_ID`: _______________
- `THREAD_ID`: _______________
- `GUEST_EMAIL`: _______________
- `HOST_EMAIL`: _______________
- `GUEST_USER_ID`: _______________
- `HOST_USER_ID`: _______________

### Step 1.2: Verify Thread Exists

If no thread found, this is a blocker. The thread must exist before testing.

```sql
SELECT _id, "Proposal", host_user_id, guest_user_id
FROM thread
WHERE "Proposal" = '<PROPOSAL_ID>';
```

### Step 1.3: Check Current Message Count (Baseline)

```sql
SELECT COUNT(*) as message_count, MAX(created_at) as last_message
FROM _message
WHERE thread_id = '<THREAD_ID>';
```

**Record**:
- `BASELINE_MESSAGE_COUNT`: _______________

### Step 1.4: Reset Proposal Status (If Needed)

If proposal was previously accepted, reset it:

```sql
UPDATE proposal
SET "Status" = 'Host Counteroffer Submitted / Awaiting Guest Review',
    "Modified Date" = NOW()
WHERE _id = '<PROPOSAL_ID>';
```

### Step 1.5: Delete Any Existing Lease for This Proposal

```sql
DELETE FROM bookings_leases WHERE "Proposal" = '<PROPOSAL_ID>';
```

---

## PHASE 2: BROWSER AUTHENTICATION (2 min)

### Step 2.1: Navigate to Login Page

Using Playwright MCP:
```
browser_navigate to: https://splitlease.pages.dev/login
```

Take a snapshot to verify page loaded.

### Step 2.2: Login as Guest User

Using the guest email from Phase 1:
```
Fill email field with: <GUEST_EMAIL>
Fill password field with: [Use test password or ask user]
Click "Log In" button
```

### Step 2.3: Verify Login Success

Wait for redirect, take snapshot. Should see dashboard or proposals page.

### Step 2.4: Navigate to Active Proposals

```
browser_navigate to: https://splitlease.pages.dev/manage-proposals
```

Or find the "Proposals" link and click it.

---

## PHASE 3: LOCATE AND OPEN COUNTEROFFER (2 min)

### Step 3.1: Find the Test Proposal Card

Take snapshot of proposals page. Look for:
- Proposal card with status "Counteroffer Pending" or similar
- The listing name associated with this proposal

### Step 3.2: Click to View Proposal Details

Click on the proposal card or "View Details" button for the test proposal.

### Step 3.3: Verify Counteroffer Terms Display

Take snapshot. Should see:
- "Compare Terms" or counteroffer comparison view
- Original terms vs counteroffer terms
- Accept/Decline buttons

---

## PHASE 4: ACCEPT COUNTEROFFER (3 min)

### Step 4.1: Open Browser Console (Important!)

Before clicking accept, enable console logging:
```javascript
// Playwright: capture console messages
browser_console_messages with level: "info"
```

### Step 4.2: Click Accept Button

Find and click the "Accept Counteroffer" or "Accept" button.

### Step 4.3: Monitor Loading State

The button should show loading state. Wait for completion.
Take snapshots during the process if possible.

### Step 4.4: Check for Success Modal

After acceptance completes, verify:
- Success modal appears with celebration message
- "Got it!" or acknowledgment button visible

Take snapshot of success modal.

### Step 4.5: Capture Console Logs

```
browser_console_messages with level: "info"
```

**Record all console output**, especially:
- `[useCompareTermsModalLogic] Lease created successfully`
- `[useCompareTermsModalLogic] Notification messages sent`
- Any errors or warnings

---

## PHASE 5: DATABASE VERIFICATION (3 min)

### Step 5.1: Verify Lease Created

Using Supabase MCP:

```sql
SELECT
  _id as lease_id,
  "Status",
  "Guest",
  "Host",
  "Proposal",
  "Created Date"
FROM bookings_leases
WHERE "Proposal" = '<PROPOSAL_ID>'
ORDER BY "Created Date" DESC
LIMIT 1;
```

**Expected**: One row returned with lease data
**Record**: `LEASE_ID`: _______________

### Step 5.2: Verify Proposal Status Updated

```sql
SELECT _id, "Status", "Modified Date"
FROM proposal
WHERE _id = '<PROPOSAL_ID>';
```

**Expected**: Status = "Proposal or Counteroffer Accepted / Drafting Lease Documents"

### Step 5.3: Verify SplitBot Messages Created (CRITICAL)

```sql
SELECT
  _id as message_id,
  thread_id,
  "Message Body",
  "Call to Action",
  "is Split Bot",
  "is Visible to Host",
  "is Visible to Guest",
  originator_user_id,
  created_at
FROM _message
WHERE thread_id = '<THREAD_ID>'
  AND "is Split Bot" = true
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Expected**:
- 2 new messages (one for guest, one for host)
- Both with "Call to Action" = "Counteroffer Accepted"
- Message body contains "Great news! The counteroffer has been accepted"

**Record**:
- `GUEST_MESSAGE_ID`: _______________
- `HOST_MESSAGE_ID`: _______________
- `GUEST_MESSAGE_VISIBLE_TO_GUEST`: _______________
- `HOST_MESSAGE_VISIBLE_TO_HOST`: _______________

### Step 5.4: Count Total Messages (Comparison)

```sql
SELECT COUNT(*) as new_message_count
FROM _message
WHERE thread_id = '<THREAD_ID>';
```

**Expected**: `new_message_count` = `BASELINE_MESSAGE_COUNT` + 2

---

## PHASE 6: EDGE FUNCTION LOG ANALYSIS (2 min)

### Step 6.1: Get Messages Function Logs

Using Supabase MCP:
```
get_logs for service: "edge-function"
```

Look for recent logs from the "messages" function, specifically:
- `[sendSplitBotMessage] Starting...`
- `[sendSplitBotMessage] Looking up thread by proposalId`
- `[sendSplitBotMessage] Found thread by proposal`
- `[sendSplitBotMessage] CTA found: Counteroffer Accepted`
- `[sendSplitBotMessage] Created guest message`
- `[sendSplitBotMessage] Created host message`
- `[sendSplitBotMessage] Complete, created 2 message(s)`

### Step 6.2: Check for Errors

Look for any error patterns:
- `Thread lookup error`
- `No thread found for proposal`
- `CTA not found`
- `Failed to create SplitBot message`

---

## DECISION POINTS

### If Lease Created BUT Messages Missing:

1. Check Edge Function logs for errors
2. Verify thread exists and is linked to proposal:
   ```sql
   SELECT * FROM thread WHERE "Proposal" = '<PROPOSAL_ID>';
   ```
3. Check if CTA exists:
   ```sql
   SELECT * FROM reference_table.os_messaging_cta WHERE name = 'counteroffer_accepted';
   ```
4. Reset and retry:
   - Delete the lease
   - Reset proposal status
   - Redeploy messages Edge Function if needed
   - Repeat from Phase 4

### If Lease NOT Created:

1. Check console logs for FK constraint errors
2. Check lease Edge Function logs
3. Verify listing has valid cancellation policy:
   ```sql
   SELECT _id, "Cancellation Policy" FROM listing WHERE _id = '<LISTING_ID>';
   ```

### If Success:

Document all recorded values and mark test as PASSED.

---

## SUCCESS CRITERIA CHECKLIST

- [ ] Guest logged in successfully
- [ ] Counteroffer comparison modal opened
- [ ] Accept button clicked
- [ ] Loading state displayed
- [ ] Success modal appeared
- [ ] Console shows "Lease created successfully"
- [ ] Console shows "Notification messages sent"
- [ ] Database: Lease record exists
- [ ] Database: Proposal status updated to "Accepted"
- [ ] Database: 2 new SplitBot messages created
- [ ] Database: Guest message has `is Visible to Guest = true`
- [ ] Database: Host message has `is Visible to Host = true`
- [ ] Edge Function logs show successful message creation

---

## ROLLBACK PROCEDURE (If Test Fails and Need to Retry)

```sql
-- 1. Delete the lease (if created)
DELETE FROM bookings_leases WHERE "Proposal" = '<PROPOSAL_ID>';

-- 2. Delete SplitBot messages created during failed test
DELETE FROM _message
WHERE thread_id = '<THREAD_ID>'
  AND "is Split Bot" = true
  AND created_at > NOW() - INTERVAL '30 minutes'
  AND "Call to Action" = 'Counteroffer Accepted';

-- 3. Reset proposal status
UPDATE proposal
SET "Status" = 'Host Counteroffer Submitted / Awaiting Guest Review',
    "Modified Date" = NOW()
WHERE _id = '<PROPOSAL_ID>';
```

---

## TEST REPORT TEMPLATE

```
# Counteroffer Acceptance E2E Test Report
Date: YYYY-MM-DD HH:MM
Tester: Claude Agent

## Test Data
- Proposal ID:
- Thread ID:
- Guest Email:
- Host Email:

## Results

### Phase 1: Setup
- Proposal found: ✅/❌
- Thread exists: ✅/❌
- Baseline message count:

### Phase 4: Acceptance
- Accept button clicked: ✅/❌
- Success modal displayed: ✅/❌
- Console errors: [list any]

### Phase 5: Database Verification
- Lease created: ✅/❌ (ID: )
- Proposal status updated: ✅/❌
- Guest message created: ✅/❌ (ID: )
- Host message created: ✅/❌ (ID: )

### Phase 6: Logs
- Edge Function logs clean: ✅/❌
- Errors found: [list any]

## Overall Result: PASS / FAIL

## Notes:
[Any observations, issues, or recommendations]
```

---

## IMPORTANT NOTES

1. **Always use Supabase MCP through mcp-tool-specialist subagent** per project rules
2. **Do not modify database schema** - only read/write data for testing
3. **Take screenshots at key moments** for documentation
4. **Record all console messages** before and after acceptance
5. **If test fails, analyze logs before retrying** - don't blindly retry
6. **15 minute budget** - prioritize completing all phases over perfection
