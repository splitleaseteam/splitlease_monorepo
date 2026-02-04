# Autonomous Counteroffer Acceptance End-to-End Debug & Fix Cycle

**Target Proposal ID**: `1769130751870x21602817865937584`
**Test User**: terrencegrey@test.com
**Password**: eCom2023$
**Maximum Runtime**: 4 hours
**Token Budget**: 15,000,000 tokens

---

## Objective

Systematically test, debug, and fix the counteroffer acceptance flow until ALL of the following acceptance criteria are met:

### Acceptance Criteria (ALL MUST PASS)

1. **Message Generation**: Accepting a counteroffer MUST generate TWO distinct messages:
   - One message to the GUEST in the proposal thread
   - One message to the HOST in the proposal thread
   - Both messages must be visible in the UI when viewing the proposal

2. **Lease Record Creation**: A lease record MUST be created and visible at:
   - Internal page: "Manage Lease and Payment Records"
   - Database table: `lease` (verify via Supabase MCP)

3. **Lease Date Accuracy**: The created lease MUST have correct dates calculated from:
   - `nights_per_week` (from reservation)
   - Reservation span (start date → end date)
   - Move-in date
   - All date fields in the lease must reflect accurate calculations

4. **Agreement Number Generation**: The lease MUST have a properly formatted agreement number:
   - Format: `AGR-{timestamp}-{unique_id}` or similar documented pattern
   - Must not be null, empty, or a placeholder value

---

## Execution Loop Structure

```
FOR EACH ITERATION (max 4 hours):
  ├─ PHASE 1: SETUP & DATA RESET (5 min)
  │   └─ Reset proposal to "counteroffer_pending" state
  │
  ├─ PHASE 2: EXECUTE TEST (10 min)
  │   ├─ Login as terrencegrey@test.com
  │   ├─ Navigate to proposal 1769130751870x21602817865937584
  │   ├─ Accept counteroffer
  │   └─ Capture all network requests & console logs
  │
  ├─ PHASE 3: VALIDATION (10 min)
  │   ├─ Check messages in proposal thread (guest + host)
  │   ├─ Navigate to "Manage Lease and Payment Records"
  │   ├─ Verify lease exists for this proposal
  │   ├─ Verify lease dates are correct
  │   └─ Verify agreement number is present
  │
  ├─ PHASE 4: DIAGNOSIS (15 min if failures found)
  │   ├─ Analyze database state via Supabase MCP
  │   ├─ Review Edge Function logs
  │   ├─ Identify root cause of any failing criteria
  │   └─ Generate diagnosis report
  │
  ├─ PHASE 5: FIX (30 min if failures found)
  │   ├─ Invoke task-classifier → debug-analyst → plan-executor
  │   ├─ Implement fixes for identified issues
  │   └─ Commit changes with /git-commits skill
  │
  └─ PHASE 6: REVIEW & LOOP DECISION (5 min)
      ├─ If ALL acceptance criteria PASS → EXIT SUCCESSFULLY
      └─ If ANY acceptance criteria FAIL → CONTINUE TO NEXT ITERATION

FINAL OUTPUT:
  ├─ Summary of all iterations
  ├─ Final acceptance criteria status
  └─ Comprehensive changelog of all fixes applied
```

---

## Phase 1: Setup & Data Reset

### Reset Proposal State

**CRITICAL**: Use `mcp-tool-specialist` subagent for ALL Supabase MCP operations.

```sql
-- Step 1: Get current proposal state
SELECT
  id,
  status,
  guest_id,
  host_id,
  listing_id,
  reservation_id
FROM proposal
WHERE id = '1769130751870x21602817865937584';

-- Step 2: Delete any existing lease for this proposal
DELETE FROM lease
WHERE proposal_id = '1769130751870x21602817865937584';

-- Step 3: Delete any messages in this proposal thread
DELETE FROM messages
WHERE thread_id IN (
  SELECT thread_id FROM proposal
  WHERE id = '1769130751870x21602817865937584'
);

-- Step 4: Reset proposal status to counteroffer_pending
UPDATE proposal
SET
  status = 'counteroffer_pending',
  updated_at = NOW()
WHERE id = '1769130751870x21602817865937584';

-- Step 5: Verify reset successful
SELECT
  id,
  status,
  thread_id,
  updated_at
FROM proposal
WHERE id = '1769130751870x21602817865937584';
```

### Verify Clean State

Before proceeding to test, confirm:
- ✅ Proposal status = `'counteroffer_pending'`
- ✅ No lease records exist for this proposal
- ✅ No messages exist in the proposal thread
- ✅ Proposal has valid `guest_id`, `host_id`, `listing_id`, `reservation_id`

---

## Phase 2: Execute Test

### Playwright Test Script

**CRITICAL**: Use `mcp-tool-specialist` subagent for ALL Playwright MCP operations.

#### Step 1: Login

```javascript
// Navigate to login page
await mcp__playwright__browser_navigate({ url: "https://www.split.lease/login.html" });

// Wait for page load
await mcp__playwright__browser_wait_for({ time: 2 });

// Take snapshot to locate email/password fields
await mcp__playwright__browser_snapshot({});

// Fill email field (use ref from snapshot)
await mcp__playwright__browser_type({
  ref: "[email field ref from snapshot]",
  text: "terrencegrey@test.com",
  element: "Email input field"
});

// Fill password field (use ref from snapshot)
await mcp__playwright__browser_type({
  ref: "[password field ref from snapshot]",
  text: "eCom2023$",
  element: "Password input field"
});

// Click login button
await mcp__playwright__browser_click({
  ref: "[login button ref from snapshot]",
  element: "Login button"
});

// Wait for redirect to dashboard/home
await mcp__playwright__browser_wait_for({ time: 3 });
```

#### Step 2: Navigate to Proposal

```javascript
// Navigate directly to proposal page
await mcp__playwright__browser_navigate({
  url: "https://www.split.lease/proposal-details.html?id=1769130751870x21602817865937584"
});

// Wait for page load
await mcp__playwright__browser_wait_for({ time: 3 });

// Take snapshot to verify proposal loaded
await mcp__playwright__browser_snapshot({});

// Verify proposal status shows "counteroffer_pending" or similar
```

#### Step 3: Accept Counteroffer

```javascript
// Take snapshot to locate "Accept Counteroffer" button
await mcp__playwright__browser_snapshot({});

// Click "Accept Counteroffer" button
await mcp__playwright__browser_click({
  ref: "[accept button ref from snapshot]",
  element: "Accept Counteroffer button"
});

// Wait for processing (loading spinner, etc.)
await mcp__playwright__browser_wait_for({ time: 5 });

// Take snapshot after acceptance
await mcp__playwright__browser_snapshot({});
```

#### Step 4: Capture Network & Console

```javascript
// Get all network requests since page load
const networkRequests = await mcp__playwright__browser_network_requests({
  includeStatic: false
});

// Get all console messages (including errors)
const consoleLogs = await mcp__playwright__browser_console_messages({
  level: "info" // Captures info, warning, error
});

// Save to files for analysis
await mcp__playwright__browser_network_requests({
  includeStatic: false,
  filename: "counteroffer-network-logs.json"
});

await mcp__playwright__browser_console_messages({
  level: "info",
  filename: "counteroffer-console-logs.txt"
});
```

---

## Phase 3: Validation

### Validation 1: Messages in Proposal Thread

#### Via Playwright UI Check

```javascript
// Still on proposal details page
await mcp__playwright__browser_snapshot({});

// Scroll to messages section
// Look for TWO new messages:
//   1. Message to guest (e.g., "Your counteroffer has been accepted...")
//   2. Message to host (e.g., "You accepted the counteroffer...")

// Document what messages are visible
```

#### Via Database Check

```sql
-- Get proposal thread_id
SELECT thread_id FROM proposal
WHERE id = '1769130751870x21602817865937584';

-- Fetch all messages in thread (should be 2 new messages)
SELECT
  id,
  thread_id,
  sender_type, -- 'system' or 'user'
  recipient_id,
  message_body,
  created_at
FROM messages
WHERE thread_id = [thread_id from above]
ORDER BY created_at DESC
LIMIT 5;

-- EXPECTED RESULT:
-- 2 new messages created after counteroffer acceptance
-- One message with recipient_id = guest_id
-- One message with recipient_id = host_id
```

**VALIDATION 1 PASSES IF**:
- ✅ 2 new messages exist in database
- ✅ One message recipient = guest_id
- ✅ One message recipient = host_id
- ✅ Both messages visible in UI

---

### Validation 2: Lease Record Exists

#### Via UI Navigation

```javascript
// Navigate to internal lease management page
await mcp__playwright__browser_navigate({
  url: "https://www.split.lease/manage-leases.html" // Adjust URL as needed
});

// Wait for page load
await mcp__playwright__browser_wait_for({ time: 3 });

// Take snapshot
await mcp__playwright__browser_snapshot({});

// Search for proposal ID or agreement number
// Verify lease appears in the list
```

#### Via Database Check

```sql
-- Fetch lease for this proposal
SELECT
  id,
  proposal_id,
  guest_id,
  host_id,
  listing_id,
  move_in_date,
  move_out_date,
  agreement_number,
  status,
  created_at
FROM lease
WHERE proposal_id = '1769130751870x21602817865937584';

-- EXPECTED RESULT: 1 lease record exists
```

**VALIDATION 2 PASSES IF**:
- ✅ Lease record exists in database
- ✅ Lease visible in "Manage Lease and Payment Records" UI
- ✅ `proposal_id` matches target proposal

---

### Validation 3: Lease Dates Accuracy

#### Fetch Reservation Data

```sql
-- Get reservation details for date calculation
SELECT
  id,
  start_date,
  end_date,
  nights_per_week,
  move_in_date
FROM reservation
WHERE id = (
  SELECT reservation_id FROM proposal
  WHERE id = '1769130751870x21602817865937584'
);
```

#### Calculate Expected Dates

**Formula** (document the actual business logic):
```
reservation_span_days = end_date - start_date
total_weeks = reservation_span_days / 7
total_nights = nights_per_week * total_weeks

expected_move_in_date = move_in_date (from reservation)
expected_move_out_date = move_in_date + total_nights (adjusted for nights_per_week pattern)
```

#### Compare with Lease Dates

```sql
-- Fetch lease dates
SELECT
  move_in_date,
  move_out_date,
  nights_per_week
FROM lease
WHERE proposal_id = '1769130751870x21602817865937584';

-- Manually compare:
--   lease.move_in_date == reservation.move_in_date ✅
--   lease.move_out_date == calculated_move_out_date ✅
--   lease.nights_per_week == reservation.nights_per_week ✅
```

**VALIDATION 3 PASSES IF**:
- ✅ `move_in_date` matches reservation
- ✅ `move_out_date` correctly calculated from nights_per_week + span
- ✅ All date fields are non-null and logical

---

### Validation 4: Agreement Number Present

```sql
-- Check agreement_number field
SELECT
  id,
  agreement_number,
  created_at
FROM lease
WHERE proposal_id = '1769130751870x21602817865937584';

-- EXPECTED RESULT:
-- agreement_number is NOT NULL
-- agreement_number follows format: AGR-{timestamp}-{uuid} or documented pattern
-- agreement_number is unique across all leases
```

**VALIDATION 4 PASSES IF**:
- ✅ `agreement_number` is NOT NULL
- ✅ `agreement_number` follows documented format
- ✅ `agreement_number` is unique (no duplicates)

---

## Phase 4: Diagnosis (If Any Validation Fails)

### Diagnosis Checklist

For EACH failing validation, investigate:

#### If Messages Missing:

1. **Check Edge Function Logs**:
   ```bash
   supabase functions logs messages --tail 50
   ```

2. **Inspect Proposal Edge Function**:
   - File: `supabase/functions/proposal/index.ts`
   - Action: `accept_counteroffer`
   - Look for message creation logic

3. **Check Database Triggers**:
   ```sql
   -- List all triggers on proposal table
   SELECT
     trigger_name,
     event_manipulation,
     action_statement
   FROM information_schema.triggers
   WHERE event_object_table = 'proposal';
   ```

4. **Review `_shared/messaging.ts`** (if exists):
   - Verify `sendMessageToGuest()` and `sendMessageToHost()` functions
   - Check if they're called in counteroffer acceptance flow

5. **Capture Root Cause**:
   - Is message creation code missing?
   - Is there an error thrown before messages are sent?
   - Are messages created but with wrong thread_id?

---

#### If Lease Record Missing:

1. **Check Edge Function Logs**:
   ```bash
   supabase functions logs proposal --tail 50
   ```

2. **Inspect Proposal Edge Function**:
   - File: `supabase/functions/proposal/index.ts`
   - Action: `accept_counteroffer`
   - Look for lease creation logic (direct insert or another function call)

3. **Check for Lease Creation Function**:
   - File: `supabase/functions/lease/index.ts` (if exists)
   - Action: `create_lease` or similar
   - Verify it's called during counteroffer acceptance

4. **Review Network Logs**:
   - File: `counteroffer-network-logs.json` (from Playwright)
   - Look for POST requests to `/functions/v1/lease` or `/functions/v1/proposal`
   - Check response status codes (200, 400, 500?)

5. **Capture Root Cause**:
   - Is lease creation code missing entirely?
   - Is there an error preventing lease insert?
   - Is the lease being created but for the wrong proposal?

---

#### If Lease Dates Incorrect:

1. **Inspect Date Calculation Logic**:
   - File: `app/src/logic/calculators/leaseCalculator.js` (or similar)
   - Function: `calculateLeaseEndDate()`, `calculateMoveOutDate()`, etc.

2. **Check Edge Function Date Logic**:
   - File: `supabase/functions/proposal/index.ts` or `supabase/functions/lease/index.ts`
   - Look for date calculations when creating lease

3. **Verify Reservation Data**:
   ```sql
   SELECT * FROM reservation WHERE id = [reservation_id];
   ```
   - Confirm `nights_per_week`, `start_date`, `end_date`, `move_in_date` are valid

4. **Test Date Calculator in Isolation**:
   - Create a test script with sample inputs
   - Verify calculator produces expected outputs

5. **Capture Root Cause**:
   - Is the date calculation formula wrong?
   - Is the wrong data being passed to the calculator?
   - Is the calculator not being called at all?

---

#### If Agreement Number Missing:

1. **Inspect Lease Creation Logic**:
   - File: `supabase/functions/lease/index.ts` or `supabase/functions/proposal/index.ts`
   - Look for `agreement_number` generation

2. **Check for Agreement Number Generator**:
   - File: `app/src/logic/calculators/agreementNumberGenerator.js` (or similar)
   - Function: `generateAgreementNumber()`

3. **Verify Database Schema**:
   ```sql
   -- Check if agreement_number has a default value or trigger
   SELECT
     column_name,
     column_default,
     is_nullable
   FROM information_schema.columns
   WHERE table_name = 'lease'
   AND column_name = 'agreement_number';
   ```

4. **Review Lease Insert Statement**:
   - Is `agreement_number` included in the INSERT?
   - Is it being set to a calculated value or hardcoded?

5. **Capture Root Cause**:
   - Is agreement number generation missing?
   - Is it being generated but not saved to the database?
   - Is the format incorrect?

---

## Phase 5: Fix Implementation

### Fix Strategy

For EACH root cause identified in Phase 4:

1. **Invoke Task-Classifier**:
   ```
   "Fix [specific issue] in counteroffer acceptance flow:
   - Root cause: [diagnosis from Phase 4]
   - Expected behavior: [acceptance criteria]
   - Files likely involved: [list from diagnosis]"
   ```

2. **Let Debug-Analyst Plan**:
   - Receives classification output
   - Generates detailed fix plan in `.claude/plans/New/`

3. **Execute Plan**:
   - `plan-executor` subagent implements fixes
   - Commits changes with `/git-commits` skill

4. **Review Fix**:
   - `input-reviewer` subagent verifies fix aligns with acceptance criteria

---

### Common Fix Patterns

#### Fix 1: Add Missing Message Creation

**Likely File**: `supabase/functions/proposal/index.ts`

```typescript
// In accept_counteroffer action, after updating proposal status:

// Import messaging utility
import { sendMessageToThread } from '../_shared/messaging.ts';

// Get proposal details
const { guest_id, host_id, thread_id } = proposal;

// Send message to guest
await sendMessageToThread({
  thread_id,
  recipient_id: guest_id,
  message_body: "Your counteroffer has been accepted! The host has agreed to your terms.",
  sender_type: 'system'
});

// Send message to host
await sendMessageToThread({
  thread_id,
  recipient_id: host_id,
  message_body: "You have accepted the counteroffer. The guest will be notified.",
  sender_type: 'system'
});
```

---

#### Fix 2: Add Missing Lease Creation

**Likely File**: `supabase/functions/proposal/index.ts`

```typescript
// In accept_counteroffer action, after updating proposal status:

// Import lease creation utility
import { createLeaseFromProposal } from '../_shared/leaseCreation.ts';

// Create lease record
const lease = await createLeaseFromProposal({
  proposal_id: proposalId,
  guest_id: proposal.guest_id,
  host_id: proposal.host_id,
  listing_id: proposal.listing_id,
  reservation_id: proposal.reservation_id
});

if (!lease) {
  throw new Error('Failed to create lease record');
}
```

---

#### Fix 3: Correct Date Calculation

**Likely File**: `app/src/logic/calculators/leaseCalculator.js`

```javascript
export function calculateLeaseEndDate({ moveInDate, nightsPerWeek, reservationEndDate }) {
  const moveIn = new Date(moveInDate);
  const resEnd = new Date(reservationEndDate);

  // Calculate total span in days
  const spanDays = Math.ceil((resEnd - moveIn) / (1000 * 60 * 60 * 24));

  // Calculate total weeks
  const totalWeeks = Math.ceil(spanDays / 7);

  // Calculate total nights stayed
  const totalNights = nightsPerWeek * totalWeeks;

  // Move-out date = move-in + total nights
  const moveOut = new Date(moveIn);
  moveOut.setDate(moveOut.getDate() + totalNights);

  return moveOut.toISOString().split('T')[0]; // Return YYYY-MM-DD
}
```

---

#### Fix 4: Generate Agreement Number

**Likely File**: `supabase/functions/_shared/agreementNumberGenerator.ts`

```typescript
export function generateAgreementNumber(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AGR-${timestamp}-${randomSuffix}`;
}
```

**Then in lease creation**:

```typescript
import { generateAgreementNumber } from '../_shared/agreementNumberGenerator.ts';

const agreementNumber = generateAgreementNumber();

const { data: lease, error } = await supabaseAdmin
  .from('lease')
  .insert({
    proposal_id: proposalId,
    guest_id,
    host_id,
    listing_id,
    move_in_date: moveInDate,
    move_out_date: moveOutDate,
    agreement_number: agreementNumber, // ✅ Now included
    status: 'active'
  })
  .select()
  .single();
```

---

## Phase 6: Review & Loop Decision

### Review Checklist

After implementing fixes:

1. **Run All Validations Again** (Phase 3)
2. **Count Passing Validations**:
   ```
   Validation 1 (Messages): PASS / FAIL
   Validation 2 (Lease Exists): PASS / FAIL
   Validation 3 (Dates Correct): PASS / FAIL
   Validation 4 (Agreement Number): PASS / FAIL

   Total: X / 4 validations passing
   ```

3. **Decision**:
   - If **4 / 4 PASS** → ✅ EXIT SUCCESSFULLY
   - If **ANY FAIL** → 🔁 CONTINUE TO NEXT ITERATION

---

### Iteration Tracking

Maintain a running log:

```
ITERATION 1:
├─ Duration: 45 minutes
├─ Fixes Applied: Added message creation logic
├─ Validations Passing: 2 / 4 (Messages ✅, Lease Exists ✅, Dates ❌, Agreement ❌)
└─ Status: CONTINUE

ITERATION 2:
├─ Duration: 40 minutes
├─ Fixes Applied: Corrected date calculation, added agreement number
├─ Validations Passing: 4 / 4 (All ✅)
└─ Status: SUCCESS - EXIT
```

---

## Exit Conditions

### Success Exit

**Condition**: All 4 validations pass in a single iteration.

**Output**:
```
✅ COUNTEROFFER ACCEPTANCE FLOW FIXED

Acceptance Criteria:
✅ Messages to guest and host generated
✅ Lease record created and visible
✅ Lease dates correctly calculated
✅ Agreement number properly generated

Total Iterations: [X]
Total Duration: [X hours X minutes]
Total Fixes Applied: [X]

Changelog:
• [file1.ts] (+X, -Y) - [description]
• [file2.js] (+X, -Y) - [description]
...

Final Database State:
- Proposal ID: 1769130751870x21602817865937584
- Proposal Status: accepted (or final status)
- Lease ID: [lease_id]
- Agreement Number: [agreement_number]
- Messages Sent: 2 (guest + host)
```

---

### Timeout Exit

**Condition**: 4 hours elapsed, regardless of validation status.

**Output**:
```
⚠️ TIMEOUT REACHED - COUNTEROFFER FLOW PARTIALLY FIXED

Acceptance Criteria Status:
[✅/❌] Messages to guest and host generated
[✅/❌] Lease record created and visible
[✅/❌] Lease dates correctly calculated
[✅/❌] Agreement number properly generated

Total Iterations: [X]
Total Duration: 4 hours (timeout)
Total Fixes Applied: [X]

Remaining Issues:
- [Issue 1]: [Description]
- [Issue 2]: [Description]

Recommended Next Steps:
1. [Step 1]
2. [Step 2]

Changelog:
• [file1.ts] (+X, -Y) - [description]
...
```

---

### Token Budget Exit

**Condition**: Approaching 15M token limit.

**Output**:
```
⚠️ TOKEN BUDGET EXCEEDED - STOPPING

Acceptance Criteria Status:
[✅/❌] Messages to guest and host generated
[✅/❌] Lease record created and visible
[✅/❌] Lease dates correctly calculated
[✅/❌] Agreement number properly generated

Total Iterations: [X]
Tokens Used: ~15M
Total Fixes Applied: [X]

Recommendation: Resume with fresh token budget
```

---

## Subagent Invocation Reference

### All MCP Operations

**ALWAYS use `mcp-tool-specialist` subagent**:

```
Task tool → mcp-tool-specialist → [specific MCP tool]
```

Examples:
- Supabase query: `Task(mcp-tool-specialist) → mcp__supabase__execute_sql`
- Playwright navigation: `Task(mcp-tool-specialist) → mcp__playwright__browser_navigate`

---

### Diagnosis & Fix Operations

**Follow 4-phase orchestration**:

```
Task(task-classifier) →
  Task(debug-analyst) →
    Task(plan-executor) →
      Task(input-reviewer)
```

---

## Monitoring & Logging

### Save Artifacts Each Iteration

Create a directory structure:

```
.claude/debug-sessions/counteroffer-20260130/
├─ iteration-001/
│  ├─ network-logs.json
│  ├─ console-logs.txt
│  ├─ database-state-before.sql
│  ├─ database-state-after.sql
│  ├─ validation-results.md
│  └─ diagnosis.md
├─ iteration-002/
│  └─ [same structure]
└─ summary.md
```

### Database Snapshots

Before and after each test:

```sql
-- Save to file: database-state-before.sql
SELECT
  'PROPOSAL' as table_name,
  id, status, thread_id, created_at, updated_at
FROM proposal
WHERE id = '1769130751870x21602817865937584'

UNION ALL

SELECT
  'LEASE' as table_name,
  id::text, status::text, agreement_number::text, move_in_date::text, move_out_date::text
FROM lease
WHERE proposal_id = '1769130751870x21602817865937584'

UNION ALL

SELECT
  'MESSAGES' as table_name,
  id::text, sender_type::text, message_body::text, created_at::text, ''
FROM messages
WHERE thread_id = (SELECT thread_id FROM proposal WHERE id = '1769130751870x21602817865937584')
ORDER BY created_at DESC
LIMIT 10;
```

---

## Error Handling

### Playwright Errors

If browser crashes or navigation fails:
1. Take screenshot: `mcp__playwright__browser_take_screenshot({ fullPage: true })`
2. Capture network logs: `mcp__playwright__browser_network_requests({})`
3. Restart browser: `mcp__playwright__browser_close()` then re-navigate
4. Continue iteration

### Supabase Errors

If query fails:
1. Log full error (code, message, details, hint)
2. Check if database connection is valid
3. Retry query once
4. If persistent, flag in diagnosis phase

### Edge Function Errors

If 500 errors occur:
1. Check `supabase functions logs [function-name]`
2. Look for uncaught exceptions
3. Add try-catch blocks if missing
4. Redeploy function: `supabase functions deploy [function-name]`

---

## Final Reminders

1. **ALWAYS use `mcp-tool-specialist` for MCP tools** (Supabase, Playwright)
2. **Commit after each fix** with `/git-commits` skill
3. **Reset data fully between iterations** (Phase 1)
4. **Do not skip validations** - run all 4 every time
5. **Document diagnosis clearly** - future iterations depend on it
6. **Exit on success** - don't over-iterate once all criteria pass

---

**EXECUTE THIS PROMPT FOR MAX 4 HOURS OR UNTIL ALL ACCEPTANCE CRITERIA PASS**

END OF AUTONOMOUS DEBUG PROMPT
