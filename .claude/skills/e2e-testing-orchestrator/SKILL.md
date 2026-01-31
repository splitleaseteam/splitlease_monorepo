---
name: e2e-testing-orchestrator
description: Orchestrates end-to-end testing of the Split Lease rental application flow using Playwright MCP. Use when: (1) Testing the full guest journey from signup to proposal submission, (2) Validating rental application completion flow, (3) Running bug analysis and fix cycles with automated retesting, (4) Performing iterative test-fix-verify workflows. This skill handles user creation, application flow testing, and automated bug resolution with continuous iteration until all bugs are resolved.
---

# E2E Testing Orchestrator

Orchestrates complete end-to-end testing of Split Lease guest journey with automated bug detection, analysis, fixing, and verification in a continuous loop until bug-free.

## Overview

This skill automates the entire E2E testing and bug fixing lifecycle:
1. **Test Execution**: Run complete guest journey from signup to proposal submission
2. **Bug Detection**: Capture errors, failures, and unexpected behavior
3. **Bug Analysis**: Analyze root causes and patterns
4. **Fix Planning**: Generate implementation plans for identified issues
5. **Fix Implementation**: Apply fixes to codebase
6. **Verification Loop**: Re-test until all bugs are resolved

## Prerequisites

### Environment Setup
- Application running on **localhost:8000** (Split Lease dev server)
- Playwright MCP available and configured in `.mcp.json`
- Test credentials set in environment variables (see Test Credentials section)

### Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `TESTGUESTEMAILADDRESS` | Guest test account email | `guest.test@splitlease.com` |
| `TESTPASSWORD` | Shared test account password | `TestPass123!` |
| `TESTHOSTEMAILADDRESS` | Host test account email (if needed) | `host.test@splitlease.com` |

**Set in PowerShell**:
```powershell
setx TESTGUESTEMAILADDRESS "guest.test@splitlease.com"
setx TESTPASSWORD "TestPass123!"
```

---

## Session Management (NEW)

### Session Initialization

Before running the orchestrator, initialize a session using the startup script:

```powershell
# From project root
.\scripts\Start-E2ESession.ps1 -TestFlow "guest-proposal" -MaxTimeMinutes 30
```

This creates:
- `test-session/config.json` - Budget and scope settings
- `test-session/state.json` - Progress tracking
- `test-session/screenshots/{session-id}/` - Evidence storage

### Budget Enforcement

At the **start of each iteration**, check budget limits:

1. **Read** `test-session/state.json` to get current metrics
2. **Read** `test-session/config.json` to get limits
3. **Calculate** elapsed time: `(now - session.startedAt) / 60000`
4. **Check** limits:
   - `elapsedMinutes >= config.budget.maxTimeMinutes` -> STOP
   - `currentIteration >= config.budget.maxIterations` -> STOP
   - `bugs.fixed.length >= config.budget.maxBugsToFix` -> STOP

**Budget Check Output Format:**
```
BUDGET CHECK [Iteration X]:
- Time: {elapsed}/{max} minutes ({percent}%)
- Iterations: {current}/{max}
- Bugs Fixed: {fixed}/{maxBugsToFix}
- Status: CONTINUE | WARN | STOP
```

### State Updates

**Update state.json at these checkpoints:**
- After each test step completion
- After each bug found
- After each fix applied
- After each data reset
- At session end

**Example state update:**
```javascript
// After finding a bug
state.bugs.found.push({
  id: "BUG-001",
  category: "validation",
  description: "Submit button disabled when form valid",
  step: "2.5",
  timestamp: new Date().toISOString()
});
state.progress.currentStep = "2.5-bug-detected";
// Write to test-session/state.json
```

### Data Reset Phase

After fixing bugs and before retesting, reset test data:

1. **Check** if `config.dataReset.enabled` is true
2. **Read** `test-session/data-reset.sql` for the reset queries
3. **Execute** via mcp-tool-specialist -> Supabase MCP:
   - `mcp__supabase__execute_sql` with SELECT queries first (preview)
   - `mcp__supabase__execute_sql` with DELETE queries (cleanup)
4. **Update** `state.metrics.dataResets++`

**Data Reset Rules:**
- ALWAYS target `splitlease-backend-dev` (NEVER production)
- ALWAYS preview with SELECT before DELETE
- ALWAYS preserve test accounts unless explicitly configured otherwise
- DELETE in correct order: rental_applications -> proposals -> messages

---

## Orchestration Loop (Enhanced)

The enhanced loop incorporates budget checking and state management:

```
+-------------------------------------------------------------+
|                 E2E ORCHESTRATION LOOP                       |
+-------------------------------------------------------------+
|                                                              |
|  +--------------------------------------------------------+  |
|  | 0. BUDGET CHECK                                         |  |
|  |    - Read config.json and state.json                    |  |
|  |    - Calculate elapsed time and progress                |  |
|  |    - If exceeded -> Jump to REPORT phase                |  |
|  |    - Output budget status                               |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 1. ENVIRONMENT VERIFICATION (Phase 1)                   |  |
|  |    - Check dev server at localhost:8000                 |  |
|  |    - Verify Playwright MCP via mcp-tool-specialist      |  |
|  |    - Update state.progress.currentPhase                 |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 2. EXECUTE TEST FLOW (Phase 2)                          |  |
|  |    - Run test steps via mcp-tool-specialist             |  |
|  |    - Update state.progress after each step              |  |
|  |    - Save screenshots to session directory              |  |
|  |    - Log bugs to state.bugs.found                       |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 3. BUG ANALYSIS (Phase 3.1)                             |  |
|  |    - If no bugs -> Skip to VERIFY                       |  |
|  |    - Analyze bugs using bug-analysis-patterns.md        |  |
|  |    - Create bug reports in .claude/plans/New/           |  |
|  |    - Move to state.bugs.pending                         |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 4. FIX BUGS (Phase 3.2-3.3)                             |  |
|  |    - Budget check before each fix                       |  |
|  |    - Apply fixes using existing fix patterns            |  |
|  |    - Commit with /git-commits skill                     |  |
|  |    - Move to state.bugs.fixed                           |  |
|  |    - Increment state.metrics.fixAttempts                |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 5. RESET DATA                                           |  |
|  |    - Execute data-reset.sql via Supabase MCP            |  |
|  |    - Preview with SELECT, then DELETE                   |  |
|  |    - Increment state.metrics.dataResets                 |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 6. VERIFY (Phase 3.4)                                   |  |
|  |    - Budget check                                       |  |
|  |    - Re-run affected test steps                         |  |
|  |    - If bugs remain -> Loop to BUG ANALYSIS             |  |
|  |    - If clean -> Continue                               |  |
|  |    - Increment state.progress.currentIteration          |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 7. EXIT CONDITION CHECK                                 |  |
|  |    - Clean run achieved? -> REPORT                      |  |
|  |    - Consecutive failures > max? -> REPORT              |  |
|  |    - More bugs to fix? -> Loop to BUDGET CHECK          |  |
|  +--------------------------------------------------------+  |
|                           |                                   |
|  +--------------------------------------------------------+  |
|  | 8. REPORT (Phase 4)                                     |  |
|  |    - Finalize state.json with end time and status       |  |
|  |    - Generate report in .claude/plans/Documents/        |  |
|  |    - Output summary to user                             |  |
|  |    - Invoke /slack-webhook with results                 |  |
|  +--------------------------------------------------------+  |
|                                                              |
+-------------------------------------------------------------+
```

---

## Critical Rules

### MCP Invocation Rule (MANDATORY)
**ALL Playwright MCP calls MUST go through `mcp-tool-specialist` subagent.**

❌ **NEVER DO THIS**:
```
Direct call to mcp__playwright__browser_navigate(...)
```

✅ **ALWAYS DO THIS**:
```
Task tool → mcp-tool-specialist → Playwright MCP tools
```

### Test Account Creation

When creating a new test account:
1. **First check** if test credentials exist in environment variables
2. **If credentials exist**: Use existing account (login instead of signup)
3. **If no credentials**: Create new account with these defaults:
   - Email: `guest.test.{timestamp}@splitlease.com`
   - Password: `TestPass123!`
   - Save credentials to environment for future use

## Workflow Phases

### Phase 1: Environment Verification

**Objective**: Verify application and Playwright MCP readiness

**Steps**:
1. Check if dev server is running at `http://localhost:8000`
2. Verify Playwright MCP connectivity
3. Load test credentials from environment variables
4. Create screenshot directory for test evidence: `C:\Users\SPLITL~1\AppData\Local\Temp\claude\...\scratchpad\e2e-test-{timestamp}\`

**Invoke via mcp-tool-specialist**:
- `mcp__playwright__browser_navigate` → `http://localhost:8000`
- `mcp__playwright__browser_snapshot` → Verify page loads

**Error Handling**:
- If server not responding → **STOP** with message: "Dev server not running. Run `bun run dev` first."
- If MCP not available → **STOP** with message: "Playwright MCP not configured. Check `.mcp.json`."

---

### Phase 2: Guest Journey Test Flow

**Objective**: Complete the full guest journey from landing page to proposal submission

#### Step 2.1: Landing Page → Search

**Actions** (via mcp-tool-specialist):
1. Navigate to `http://localhost:8000`
2. Take snapshot to verify page structure
3. Wait for listings to populate (check for listing cards)
4. Take screenshot: `01-landing-page.png`

**Expected Elements**:
- Header with "Sign In" and "Sign Up" buttons (if logged out)
- Search bar or listing cards
- Filter/search controls

**Bug Detection**:
- Page fails to load → **LOG**: "Landing page load failure"
- No listings visible → **LOG**: "Listings failed to populate"

---

#### Step 2.2: Guest Signup/Login

**Decision Tree**:
```
Are test credentials available?
├─ YES → Skip to login (Step 2.2.1)
└─ NO  → Create new account (Step 2.2.2)
```

##### Step 2.2.1: Login with Existing Account

**Prerequisites**: `TESTGUESTEMAILADDRESS` and `TESTPASSWORD` exist

**Actions** (via mcp-tool-specialist):
1. Check login state (see Login State Detection below)
2. If already logged in as guest → Skip to Step 2.3
3. If logged out:
   - Click "Sign In" button in header
   - Wait for login form
   - Fill email: `process.env.TESTGUESTEMAILADDRESS`
   - Fill password: `process.env.TESTPASSWORD`
   - Submit form
   - Wait for redirect to authenticated state (username appears in header)
4. Take screenshot: `02-logged-in.png`

**Login State Detection** (from playwrightTestGuideLoginInstructions):
- **Logged Out**: "Sign In" and "Sign Up" buttons visible in header
- **Logged In**: Username + profile picture visible, no Sign In/Sign Up buttons
- **Guest Account**: "Stay with Us" visible in navigation

**Bug Detection**:
- Login form doesn't appear → **LOG**: "Login page navigation failure"
- Credentials rejected → **LOG**: "Authentication failure"
- No redirect after login → **LOG**: "Post-login redirect failure"

##### Step 2.2.2: Create New Guest Account

**Prerequisites**: No test credentials available

**Actions** (via mcp-tool-specialist):
1. Click "Sign Up" button in header
2. Wait for signup form to appear
3. Generate test credentials:
   - Email: `guest.test.{timestamp}@splitlease.com` (e.g., `guest.test.20260128143022@splitlease.com`)
   - Password: `TestPass123!`
4. Fill signup form:
   - Email field
   - Password field
   - First name: "Test"
   - Last name: "Guest"
   - Phone: "555-0100"
5. Submit form
6. Handle email verification if required (check for verification message/redirect)
7. Save credentials to environment variables:
   - `TESTGUESTEMAILADDRESS` = generated email
   - `TESTPASSWORD` = `TestPass123!`
8. Take screenshot: `02-signup-complete.png`

**Bug Detection**:
- Signup form doesn't appear → **LOG**: "Signup page navigation failure"
- Form validation errors → **LOG**: "Signup validation failure: {error message}"
- Email verification fails → **LOG**: "Email verification failure"
- No redirect after signup → **LOG**: "Post-signup redirect failure"

---

#### Step 2.3: Browse and Select Listing

**Actions** (via mcp-tool-specialist):
1. Take snapshot of search page
2. Identify first available listing card
3. Extract listing ID and name for reference
4. Click on listing card
5. Wait for navigation to `/view-split-lease/{id}`
6. Verify listing detail page loaded (check for "Book" or "Create Proposal" button)
7. Take screenshot: `03-listing-detail.png`

**Bug Detection**:
- No listings visible → **LOG**: "No listings available for testing"
- Click doesn't navigate → **LOG**: "Listing card click failure"
- Detail page fails to load → **LOG**: "Listing detail page load failure"
- Missing booking controls → **LOG**: "Booking UI elements missing"

---

#### Step 2.4: Initiate Proposal Flow

**Actions** (via mcp-tool-specialist):
1. Take snapshot to identify booking controls
2. Look for one of:
   - "Book" button
   - "Create Proposal" button
   - "Contact Host" button
3. Click the booking action button
4. Wait for `CreateProposalFlowV2` modal to appear
5. Verify modal opened (check for "Create Proposal" title)
6. Take screenshot: `04-proposal-modal-opened.png`

**Expected State**:
- Modal overlay visible
- Title: "Create Proposal"
- Subtitle: "Start the conversation! After submitting a proposal..."
- Current section: User Details (Step 1 of flow)

**Bug Detection**:
- Button doesn't exist → **LOG**: "Booking button missing"
- Click doesn't open modal → **LOG**: "Proposal modal failed to open"
- Modal appears but is empty → **LOG**: "Proposal modal rendering failure"

---

#### Step 2.5: Complete Proposal User Details

**Objective**: Fill out User Details section of proposal flow

**Actions** (via mcp-tool-specialist):
1. Take snapshot to identify form fields
2. Fill "Need for Space" textarea (minimum 10 words):
   - Example: "Looking for a comfortable and affordable place to stay during my work rotation in the city."
3. Fill "About Yourself" textarea (minimum 10 words):
   - Example: "I am a quiet and responsible professional who values clean and peaceful living spaces."
4. Check if "Unique Requirements" checkbox should be tested:
   - For this test: Leave unchecked
5. Take screenshot: `05-user-details-filled.png`
6. Click "Next" button
7. Wait for navigation to next section

**Field Requirements** (from CreateProposalFlowV2.jsx:571-587):
- `needForSpace`: Required, minimum 10 words
- `aboutYourself`: Required, minimum 10 words
- `uniqueRequirements`: Optional, required only if `hasUniqueRequirements` is checked

**Bug Detection**:
- Form fields missing → **LOG**: "User details form fields missing"
- Validation fails despite meeting requirements → **LOG**: "User details validation error: {error}"
- Next button disabled when fields valid → **LOG**: "Next button incorrectly disabled"
- Click doesn't navigate to next section → **LOG**: "User details navigation failure"

---

#### Step 2.6: Review and Adjust Proposal Details

**Objective**: Navigate through the proposal flow based on the active flow type

**Flow Types** (from CreateProposalFlowV2.jsx:29-35):
- **Short Flow** (ViewSplitLeasePage): User Details → Review
- **Full Flow** (FavoriteListingsPage): User Details → Move-in → Days → Review

**For ViewSplitLeasePage (Short Flow)**:
After Step 2.5, the next section should be **Review** (since days/move-in are pre-selected on the listing page).

**Actions** (via mcp-tool-specialist):
1. Verify current section is "Confirm Proposal" (Review section)
2. Take snapshot to verify all proposal details are populated:
   - User details (Need for Space, About Yourself)
   - Move-in date (pre-filled from listing page selection)
   - Days selected (pre-filled from listing page selection)
   - Pricing breakdown (pre-calculated)
3. Take screenshot: `06-proposal-review.png`
4. Verify "Submit Proposal" button is enabled
5. Click "Submit Proposal"
6. Wait for submission to complete

**Expected Review Section Data** (from CreateProposalFlowV2.jsx:618-626):
- `moveInDate`: Should be populated from listing page
- `daysSelected`: Array of selected day names
- `checkInDay`, `checkOutDay`: Calculated from selected days
- `pricePerNight`, `totalPrice`, `pricePerFourWeeks`: Calculated pricing
- `listingId`, `listingAddress`: Listing metadata

**Bug Detection**:
- Review section doesn't appear → **LOG**: "Review section navigation failure"
- Missing proposal data in review → **LOG**: "Proposal data missing in review: {field}"
- Pricing calculations incorrect → **LOG**: "Pricing calculation error: {details}"
- Submit button disabled when data is valid → **LOG**: "Submit button incorrectly disabled"
- Submission fails → **LOG**: "Proposal submission failure: {error}"

---

#### Step 2.7: Rental Application Wizard

**Objective**: Complete the 7-step rental application wizard after proposal submission

**Trigger**: After successful proposal submission, the rental application wizard should appear automatically or be accessible via a prompt/button.

**If Not Automatically Triggered**:
- Look for "Complete Rental Application" button or link
- Navigate to rental application from guest proposals page

**7-Step Flow** (from RentalApplicationWizardModal.jsx:82-131):

##### Step 1: Personal Info
**Fields**:
- First Name (may be pre-filled from user profile)
- Last Name (may be pre-filled)
- Email (may be pre-filled)
- Phone (may be pre-filled)

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Personal Info step
2. Fill any empty required fields:
   - First Name: "Test"
   - Last Name: "Guest"
   - Email: Use `TESTGUESTEMAILADDRESS`
   - Phone: "555-0100"
3. Take screenshot: `07-rental-app-step1-personal.png`
4. Click "Continue" button
5. Wait for Step 2 to appear

**Bug Detection**:
- Required fields not marked → **LOG**: "Personal info validation unclear"
- Pre-filled data incorrect → **LOG**: "Personal info prefill error"
- Navigation fails → **LOG**: "Personal info step navigation failure"

##### Step 2: Address
**Fields**:
- Current address (with autocomplete/Google Places API)

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Address step
2. Type into address field: "123 Test Street, New York, NY 10001"
3. Wait for autocomplete suggestions (if applicable)
4. Select address or complete manual entry
5. Take screenshot: `08-rental-app-step2-address.png`
6. Click "Continue"

**Bug Detection**:
- Address autocomplete not working → **LOG**: "Address autocomplete failure"
- Valid address rejected → **LOG**: "Address validation error"

##### Step 3: Occupants
**Fields**:
- List of additional occupants (optional, can skip)
- Add/Remove occupant controls

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Occupants step
2. For this test: Skip without adding occupants (click "Skip" or "Continue")
3. Take screenshot: `09-rental-app-step3-occupants.png`

**Bug Detection**:
- Cannot skip optional step → **LOG**: "Occupants step incorrectly required"

##### Step 4: Employment
**Fields**:
- Employment status (dropdown)
- Employer name (if employed)
- Income information

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Employment step
2. Select employment status: "Employed"
3. Fill employer name: "Test Company Inc."
4. Fill income field (if required): "75000"
5. Take screenshot: `10-rental-app-step4-employment.png`
6. Click "Continue"

**Bug Detection**:
- Employment status options missing → **LOG**: "Employment status dropdown error"
- Conditional fields don't appear → **LOG**: "Employment conditional logic failure"

##### Step 5: Requirements
**Fields**:
- Special requirements or preferences (optional)

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Requirements step
2. Fill requirements field (optional): "Non-smoking, quiet environment preferred"
3. Take screenshot: `11-rental-app-step5-requirements.png`
4. Click "Continue" or "Skip"

##### Step 6: Documents
**Fields**:
- File upload controls for supporting documents
- Document types (ID, proof of income, etc.)

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Documents step
2. For this test: Skip document uploads (optional)
3. Take screenshot: `12-rental-app-step6-documents.png`
4. Click "Review Application"

**Bug Detection**:
- File upload UI broken → **LOG**: "Document upload UI failure"
- Cannot skip optional uploads → **LOG**: "Document uploads incorrectly required"

##### Step 7: Review & Submit
**Objective**: Review all entered data and submit application

**Actions** (via mcp-tool-specialist):
1. Take snapshot of Review step
2. Verify all entered data is displayed correctly
3. Check for any validation errors highlighted
4. Take screenshot: `13-rental-app-step7-review.png`
5. Click "Submit Application" button
6. Wait for submission to complete
7. Verify success message or redirect

**Expected Behavior** (from RentalApplicationWizardModal.jsx:226-234):
- Submit button enabled only when `canSubmit` is true
- Button shows "Submitting..." during submission
- On success: `onSuccess` callback fires (may close modal or redirect)

**Bug Detection**:
- Review data doesn't match entered data → **LOG**: "Review data mismatch: {field}"
- Submit button disabled when data is valid → **LOG**: "Submit button incorrectly disabled in review"
- Submission fails → **LOG**: "Rental application submission failure: {error}"
- No success confirmation → **LOG**: "Success state not displayed after submission"

---

#### Step 2.8: Verify Success State

**Objective**: Confirm proposal and rental application were successfully submitted

**Actions** (via mcp-tool-specialist):
1. Check for success modal/message/toast
2. Verify redirect to `/guest-proposals` page (or similar)
3. Take snapshot of proposals list page
4. Verify new proposal appears in list
5. Take screenshot: `14-success-proposals-list.png`

**Expected Success Indicators**:
- Success toast/modal with confirmation message
- Redirect to guest proposals dashboard
- New proposal visible in proposals list
- Proposal status: "Pending" or "Submitted"

**Bug Detection**:
- No success confirmation → **LOG**: "Success confirmation missing"
- Redirect doesn't happen → **LOG**: "Post-submission redirect failure"
- Proposal not in list → **LOG**: "Proposal not saved to database"
- Proposal has incorrect data → **LOG**: "Proposal data integrity issue: {details}"

---

### Phase 3: Bug Analysis and Fix Loop

**Objective**: Iterate on bug fixes until all issues are resolved

**Trigger**: Any bugs logged during Phase 2

#### Step 3.1: Bug Analysis

**For each logged bug**:

1. **Categorize Bug Type**:
   - Authentication/Authorization (401, 403 errors)
   - Validation Errors (form validation, data validation)
   - UI/Rendering Issues (elements missing, modal not appearing)
   - Navigation Failures (redirects, page transitions)
   - Data Integrity Issues (missing data, incorrect calculations)
   - Network/API Errors (edge function failures, timeouts)

2. **Extract Error Details**:
   - Error message (from console, network logs, UI)
   - Stack trace (if available via `browser_console_messages`)
   - Network request failures (via `browser_network_requests`)
   - Component/file likely involved (based on error context)

3. **Cross-Reference Known Patterns** (see Common Bug Patterns below)

4. **Generate Bug Report**:
   Create markdown file: `.claude/plans/New/{timestamp}-e2e-bug-report.md`

   **Bug Report Template**:
   ```markdown
   # E2E Test Bug Report - {timestamp}

   ## Bug Summary
   {One-line description}

   ## Bug Category
   {Authentication | Validation | UI | Navigation | Data | Network}

   ## Steps to Reproduce
   1. {Step 1}
   2. {Step 2}
   ...

   ## Expected Behavior
   {What should happen}

   ## Actual Behavior
   {What actually happened}

   ## Error Details
   - **Error Message**: {message}
   - **Error Code**: {code if applicable}
   - **Console Logs**: {relevant console output}
   - **Network Logs**: {relevant network failures}

   ## Likely Affected Files
   - {file path 1}
   - {file path 2}

   ## Suggested Fix
   {Initial hypothesis for fix}

   ## Screenshots
   - {screenshot filename 1}
   - {screenshot filename 2}
   ```

#### Step 3.2: Fix Planning

**For each bug report**:

1. **Use existing planning agents**:
   - For bugs in React components → Use `debug-analyst` agent (when available)
   - For architectural issues → Use `implementation-planner` agent (when available)

2. **Generate Fix Plan**:
   Create plan file: `.claude/plans/New/{timestamp}-e2e-fix-{bug-id}.md`

   **Plan should include**:
   - Root cause analysis
   - Files to modify
   - Step-by-step fix instructions
   - Test verification steps

#### Step 3.3: Implement Fixes

**For each fix plan**:

1. **Execute via plan-executor** (when available) or manually implement changes
2. **Commit changes** after each fix:
   - Use `/git-commits` skill for structured commit messages
   - Format: `fix(e2e): {description of fix}`
   - Example: `fix(e2e): correct proposal modal click handler event propagation`

3. **Log fix application**:
   ```
   ✅ Applied fix: {bug-id} - {one-line description}
   ```

#### Step 3.4: Re-Test (Verification Loop)

**After applying fixes**:

1. **Re-run affected test flow**:
   - If fix affects signup → Re-run from Step 2.2
   - If fix affects proposal → Re-run from Step 2.4
   - If fix affects rental app → Re-run from Step 2.7

2. **Invoke mcp-tool-specialist for re-testing**:
   - Use same Playwright MCP commands as initial test
   - Take new screenshots: `{original-screenshot}-retest-{attempt}.png`

3. **Compare Results**:
   - Bug still present → Return to Step 3.2 (refine fix plan)
   - Bug resolved → Mark as fixed, continue to next bug

4. **Iterate until all bugs resolved**:
   ```
   While bugs exist:
     - Analyze bug
     - Plan fix
     - Implement fix
     - Re-test
     - If bug persists → refine approach
     - If bug resolved → next bug
   ```

5. **Final Verification**:
   When all bugs marked as resolved:
   - Run complete E2E test from Phase 2 start to finish
   - No bugs → **SUCCESS**
   - New bugs found → Return to Step 3.1

---

### Phase 4: Reporting

**Objective**: Generate comprehensive test report

**Actions**:

1. **Create Test Report**:
   File: `.claude/plans/Documents/{timestamp}-e2e-test-report.md`

   **Template**:
   ```markdown
   # E2E Test Report - {timestamp}

   ## Test Summary
   - **Test Date**: {date}
   - **Test Duration**: {duration}
   - **Test Flow**: Guest Journey (Signup → Proposal → Rental Application)
   - **Test Status**: {PASS | FAIL | PARTIAL}

   ## Test Results

   ### Phase 1: Environment Verification
   - ✅ Dev server running
   - ✅ Playwright MCP connected
   - ✅ Test credentials loaded

   ### Phase 2: Guest Journey

   #### 2.1 Landing Page
   - ✅ Page loaded successfully
   - ✅ Listings visible
   - Screenshot: `01-landing-page.png`

   #### 2.2 Guest Signup/Login
   - ✅ Signup form appeared
   - ✅ Account created successfully
   - ✅ Logged in as guest
   - Screenshot: `02-logged-in.png`

   #### 2.3 Browse Listing
   - ✅ Listing detail page loaded
   - Listing ID: {id}
   - Screenshot: `03-listing-detail.png`

   #### 2.4 Initiate Proposal
   - ✅ Proposal modal opened
   - Screenshot: `04-proposal-modal-opened.png`

   #### 2.5 User Details
   - ✅ Form fields filled
   - ✅ Validation passed
   - Screenshot: `05-user-details-filled.png`

   #### 2.6 Review Proposal
   - ✅ Review section displayed
   - ✅ Data correct
   - Screenshot: `06-proposal-review.png`

   #### 2.7 Rental Application
   - ✅ Step 1: Personal Info
   - ✅ Step 2: Address
   - ✅ Step 3: Occupants (skipped)
   - ✅ Step 4: Employment
   - ✅ Step 5: Requirements
   - ✅ Step 6: Documents (skipped)
   - ✅ Step 7: Review & Submit
   - Screenshots: `07-rental-app-step1-personal.png` through `13-rental-app-step7-review.png`

   #### 2.8 Success Verification
   - ✅ Success message displayed
   - ✅ Redirected to proposals list
   - ✅ Proposal appears in list
   - Screenshot: `14-success-proposals-list.png`

   ### Phase 3: Bug Analysis & Fixes

   **Bugs Found**: {count}

   #### Bug #1: {title}
   - **Category**: {category}
   - **Status**: {FIXED | IN_PROGRESS | BLOCKED}
   - **Fix Iterations**: {count}
   - **Files Modified**: {file list}
   - **Bug Report**: {link to bug report file}

   #### Bug #2: {title}
   ...

   ## Summary

   - **Total Test Steps**: {count}
   - **Passed**: {count}
   - **Failed**: {count}
   - **Bugs Found**: {count}
   - **Bugs Fixed**: {count}
   - **Bugs Remaining**: {count}

   ## Recommendations
   {Any suggestions for code improvements, test coverage, etc.}

   ## Screenshots
   All screenshots saved to: `{scratchpad path}`
   ```

2. **Output to user**:
   - Print summary to console
   - Provide path to full report
   - List all screenshots with paths

3. **Cleanup**:
   - Move completed bug reports to `.claude/plans/Done/`
   - Keep test report in `.claude/plans/Documents/`

---

## Common Bug Patterns

| Pattern | Symptoms | Likely Cause | Typical Fix Location |
|---------|----------|--------------|---------------------|
| **Modal Close on Click** | Modal closes unexpectedly when clicking inside | Event propagation issue - click event bubbling to overlay | Modal container: add `onClick` handler with `e.stopPropagation()` |
| **401 Unauthorized** | API calls fail with 401 error | Auth token expired or missing | `app/src/lib/auth.js` - check token refresh logic |
| **Form Validation Stuck** | Submit button disabled despite valid fields | Field validation state not updating | Component validation logic - check `fieldValid` state updates |
| **Pricing Calculation Wrong** | Prices don't match expected values | Incorrect price calculation parameters | `app/src/lib/scheduleSelector/priceCalculations.js` |
| **Element Not Found** | Playwright can't find element | Selector incorrect or element not rendered | Component JSX - verify element exists and selector is correct |
| **Network Timeout** | Edge function call times out | Function execution time exceeds limit | `supabase/functions/{name}/index.ts` - optimize or increase timeout |
| **FK Constraint Violation** | Database update fails with code 23503 | Sending unchanged FK fields with null/invalid values | Update logic - only send changed fields, not entire formData |
| **Data Not Persisting** | Form data disappears after navigation | localStorage or state management issue | Check localStorage save/load logic or state persistence |

---

## Login State Detection Reference

**From**: `.claude/skills/playwrightTestGuideLoginInstructions/SKILL.md`

### Logged Out State
- "Sign In" button visible in header
- "Sign Up" button visible in header

### Logged In State
- Username displayed in header (clickable)
- User profile picture/avatar visible
- "Sign In" and "Sign Up" buttons **NOT visible**

### Guest Account Type
- "Stay with Us" visible in navigation

### Host Account Type
- "Host with Us" visible in navigation

---

## Playwright MCP Tools Reference

**All tools invoked via Task → mcp-tool-specialist**

### Navigation
- `mcp__playwright__browser_navigate` - Navigate to URL
- `mcp__playwright__browser_navigate_back` - Go back

### Page Inspection
- `mcp__playwright__browser_snapshot` - Accessibility snapshot (better than screenshot for actions)
- `mcp__playwright__browser_take_screenshot` - Visual screenshot (for evidence/reporting)
- `mcp__playwright__browser_console_messages` - Get console logs
- `mcp__playwright__browser_network_requests` - Get network activity

### Interactions
- `mcp__playwright__browser_click` - Click element (requires `ref` from snapshot)
- `mcp__playwright__browser_type` - Type text into editable element
- `mcp__playwright__browser_fill_form` - Fill multiple form fields at once
- `mcp__playwright__browser_press_key` - Press keyboard key
- `mcp__playwright__browser_select_option` - Select dropdown option

### Waiting
- `mcp__playwright__browser_wait_for` - Wait for text to appear/disappear or time to pass

### Advanced
- `mcp__playwright__browser_evaluate` - Execute JavaScript in page context
- `mcp__playwright__browser_run_code` - Run Playwright code snippet

---

## Example Usage

**User invokes skill**:
```
User: "Run the E2E orchestrator to test the guest journey"
```

**Assistant workflow**:
1. Verify environment (Phase 1)
2. Run guest journey test (Phase 2)
   - At each step: invoke mcp-tool-specialist with Playwright MCP tools
   - Capture screenshots
   - Log any errors/failures
3. If bugs found:
   - Generate bug reports (Phase 3.1)
   - Plan fixes (Phase 3.2)
   - Implement fixes (Phase 3.3)
   - Re-test (Phase 3.4)
   - Iterate until all bugs resolved
4. Generate final report (Phase 4)
5. Output summary to user

**Output**:
```
✅ E2E Test Complete

Test Summary:
- Total Steps: 14
- Passed: 12
- Failed: 2

Bugs Found: 2
- Bug #1: Proposal modal click handler (FIXED in 1 iteration)
- Bug #2: Rental application Step 4 validation (FIXED in 2 iterations)

Final Re-Test: ✅ All bugs resolved

Full Report: .claude/plans/Documents/20260128143022-e2e-test-report.md
Screenshots: C:\Users\SPLITL~1\AppData\Local\Temp\claude\...\scratchpad\e2e-test-20260128143022\
```

---

## Best Practices

1. **Always use mcp-tool-specialist** - Never invoke Playwright MCP tools directly
2. **Take snapshots before actions** - Use `browser_snapshot` to identify elements and get `ref` values
3. **Take screenshots for evidence** - Capture visual proof at each major step
4. **Log errors immediately** - Don't skip error logging even for "minor" issues
5. **Iterate until resolved** - Don't accept "partial fixes" - keep iterating until bug-free
6. **Commit after each fix** - Use structured commit messages with `/git-commits` skill
7. **Verify end-to-end** - After all fixes, run complete flow start-to-finish as final verification
8. **Use scratchpad for artifacts** - Save all screenshots and reports to session scratchpad directory

---

## Limitations

- **Email verification**: If the app requires email verification for signup, you may need to use a test email service or mock the verification step
- **Payment flows**: This orchestrator does not test payment processing (Stripe, etc.) - add separate test flows if needed
- **External dependencies**: If the app relies on external services (SMS, third-party APIs), those may need mocking or test endpoints

---

## Future Enhancements

- **Parallel test execution**: Run multiple test scenarios concurrently
- **Performance metrics**: Capture page load times, API response times
- **Visual regression testing**: Compare screenshots across test runs to detect UI regressions
- **Test data cleanup**: Automatically delete test accounts and proposals after testing
- **Integration with CI/CD**: Export test results in JUnit/TAP format for pipeline integration
