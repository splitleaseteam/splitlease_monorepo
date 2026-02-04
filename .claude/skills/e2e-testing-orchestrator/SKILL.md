---
name: e2e-testing-orchestrator
description: Autonomous E2E testing orchestrator with multi-agent loop. Use when: (1) Running autonomous test-fix-verify cycles, (2) Testing full user journeys with budget constraints, (3) Performing iterative bug detection and resolution until all tests pass or budget exhausted. This skill ASKS for required inputs then orchestrates Test Planner, Playwright Runner, Debug Analyst, Fix Engineer, and Data Validator agents in a continuous loop.
---

# E2E Testing Orchestrator

Autonomous multi-agent E2E testing system that loops continuously until all tests pass or budget limits are reached.

## Phase 0: Input Collection (MANDATORY FIRST STEP)

**Before any testing begins, ALWAYS use AskUserQuestion to gather required inputs.**

### Required Questions

Ask these questions using AskUserQuestion tool:

```
Question 1: What test scope do you want to run?
Header: "Test Scope"
Options:
  - "Guest Journey (signup → proposal → rental app)" - Full guest flow from landing to submission
  - "Host Journey (login → listing management)" - Host dashboard and listing operations
  - "Authentication Only" - Login, signup, password reset flows
  - "Custom" - I'll specify the exact flows to test
```

```
Question 2: What's your budget for this test run?
Header: "Budget"
Options:
  - "Quick (30 min, 1M tokens)" - Fast iteration, limited scope
  - "Standard (2 hours, 5M tokens)" - Recommended for most tests
  - "Extended (5 hours, 15M tokens)" - Comprehensive, overnight runs
  - "Unlimited" - Run until all tests pass (no budget limit)
```

```
Question 3: What's the target URL?
Header: "Target URL"
Options:
  - "localhost:8000 (Recommended)" - Local dev server
  - "split.lease" - Production (read-only validation)
  - "Custom URL" - I'll specify the URL
```

```
Question 4: How should test failures be handled?
Header: "Fix Mode"
Options:
  - "Auto-fix and verify (Recommended)" - Automatically implement fixes and re-test
  - "Report only" - Document bugs without implementing fixes
  - "Pause on failure" - Stop and ask before each fix attempt
```

```
Question 5: Which test account should be used?
Header: "Test Account"
Options:
  - "Default test accounts (Recommended)" - Use TESTGUESTEMAILADDRESS/TESTHOSTEMAILADDRESS from env
  - "Create fresh account" - Sign up a new test user during the test
  - "Custom credentials" - I'll provide specific email/password to use
```

```
Question 6: Any specific focus areas or requirements?
Header: "Focus"
Options:
  - "Standard flow" - Test the complete flow as defined
  - "Messaging focus" - Extra validation on message creation and threads
  - "Payment focus" - Extra validation on pricing calculations and payments
  - "Custom requirements" - I'll describe specific things to test or verify
```

### Optional Follow-up Questions

If user selects "Custom" for any option, ask a follow-up:

- **Custom Test Scope**: "Please describe the specific user journey or flows you want to test."
- **Custom URL**: "What URL should I test against? (e.g., https://staging.split.lease)"
- **Custom Credentials**: "Please provide the test account email and password to use."
- **Custom Requirements**: "Please describe any specific areas, bugs, or behaviors you want me to focus on."

### Store Collected Inputs

After collecting inputs, store in session variables:
- `TEST_SCOPE`: Selected test scope
- `TOKEN_BUDGET`: Max tokens (e.g., 15000000)
- `TIME_BUDGET_HOURS`: Max hours (e.g., 5)
- `TARGET_URL`: URL to test against
- `FIX_MODE`: auto | report | pause
- `TEST_ACCOUNT`: default | fresh | custom
- `TEST_CREDENTIALS`: Email/password if custom
- `FOCUS_AREA`: standard | messaging | payment | custom
- `CUSTOM_REQUIREMENTS`: Free-text description if provided

---

## Budget Constraints

| Budget Level | Token Limit | Time Limit | Use Case |
|--------------|-------------|------------|----------|
| Quick | 1,000,000 | 30 min | Fast iteration, smoke tests |
| Standard | 5,000,000 | 2 hours | Normal development testing |
| Extended | 15,000,000 | 5 hours | Comprehensive overnight runs |
| Unlimited | None | None | Critical releases, full coverage |

**Stop Conditions**: All tests pass OR token budget exhausted OR time limit reached.

---

## Agent Roles

### 1. Test Planner Agent
**Role**: Generate test scenarios based on scope
**Invoke via**: Task tool → general-purpose agent
**Output**: Ordered list of test steps with expected outcomes

### 2. Playwright Runner Agent
**Role**: Execute tests via Playwright MCP
**Invoke via**: Task tool → mcp-tool-specialist (MANDATORY)
**Output**: Test results with failures, console logs, network logs, screenshots

### 3. Debug Analyst Agent
**Role**: Analyze failures and identify root causes
**Invoke via**: Task tool → debug-analyst (from existing agents)
**Output**: Bug reports with root cause, affected files, reproduction steps

### 4. Fix Engineer Agent
**Role**: Implement code fixes
**Invoke via**: Task tool → plan-executor (from existing agents)
**Output**: Applied code changes with changelog

### 5. Data Validator Agent
**Role**: Verify database state via Supabase MCP
**Invoke via**: Task tool → mcp-tool-specialist (MANDATORY)
**Output**: Data validation report, orphaned records check

---

## Autonomous Loop Workflow

```
iteration = 0
tests_passing = false
tokens_used = 0
start_time = now()

WHILE (tests_passing == false AND
       tokens_used < TOKEN_BUDGET AND
       elapsed_time < TIME_BUDGET_HOURS):

    iteration++
    PRINT "=== ITERATION {iteration} ==="

    1. PLAN PHASE
       IF iteration == 1:
           Test Planner Agent → Generate initial test plan from TEST_SCOPE
       ELSE:
           Test Planner Agent → Refine plan based on previous failures

    2. RESET PHASE (if using dev database)
       Data Validator Agent → Reset test data to clean state
       - Query for stale test records
       - Delete orphaned proposals/applications from previous runs

    3. EXECUTION PHASE
       Playwright Runner Agent → Execute tests via mcp-tool-specialist
       - Navigate to TARGET_URL
       - Run each test step from plan
       - Capture ALL console logs (browser_console_messages)
       - Record network activity (browser_network_requests)
       - Screenshot on failures (browser_take_screenshot)
       - Save accessibility snapshots (browser_snapshot)

    4. VALIDATION PHASE
       Data Validator Agent → Verify expected data state
       - Check records created during test
       - Validate relationships and foreign keys
       - Query for anomalies

    5. ANALYSIS PHASE
       Debug Analyst Agent → Analyze any failures
       - Parse Playwright logs
       - Correlate console errors with test failures
       - Cross-reference with database state
       - Identify root causes

       IF no_failures_found:
           tests_passing = true
           BREAK

    6. FIX PHASE (if FIX_MODE == "auto" or "pause")
       IF FIX_MODE == "pause":
           AskUserQuestion → "Proceed with fix for {bug}?"

       Fix Engineer Agent → Implement fixes
       - Apply code changes
       - Update tests if needed
       - Commit with /git-commits skill

    7. BUDGET CHECK
       tokens_used = estimate_tokens_from_conversation()
       elapsed_time = now() - start_time

       PRINT iteration status (see Output Format below)

END WHILE

IF tests_passing:
    PRINT "✅ ALL TESTS PASSING - SUCCESS"
ELSE:
    PRINT "⚠️ STOPPED - Budget limit reached"
    PRINT "Remaining failures: {count}"
```

---

## Output Format Per Iteration

```
=== ITERATION {N} ===

[PLAN] Test scenarios: {count}
[RESET] Database reset: ✓ | ✗
[EXEC] Tests run: {total} | Passed: {pass} | Failed: {fail}
[VALID] Data check: {status}
[DEBUG] Bugs identified: {count}
[FIX] Files modified: {count}
[BUDGET] Tokens: {used:,}/{max:,} ({pct}%) | Time: {elapsed}/{limit} ({pct}%)

--- Failures ---
{List of failed test steps with error messages}

--- Fixes Applied ---
{List of files modified with change summary}
```

---

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

**ALL Playwright and Supabase MCP calls MUST go through `mcp-tool-specialist` subagent.**

❌ **NEVER**:
```
Direct call to mcp__playwright__browser_navigate(...)
Direct call to mcp__supabase__...
```

✅ **ALWAYS**:
```
Task tool → mcp-tool-specialist → Playwright/Supabase MCP tools
```

### Other Rules

1. **Ask inputs first** - Never start testing without Phase 0 input collection
2. **Comprehensive logging** - Capture everything; don't skip logs
3. **Data reset every iteration** - Clean database state before re-running
4. **Track budget** - Estimate and report tokens after each iteration
5. **Never skip steps** - Complete all 7 phases each iteration
6. **Commit after fixes** - Use `/git-commits` skill for structured commits

---

## Test Scope Definitions

### Guest Journey (Full)
1. Landing page load
2. Guest signup OR login (check env vars)
3. Browse listings
4. Select listing → view detail page
5. Initiate proposal flow
6. Complete User Details section
7. Review and submit proposal
8. Complete Rental Application wizard (7 steps)
9. Verify success state

### Host Journey
1. Host login
2. Navigate to listing dashboard
3. View existing listings
4. Edit listing details
5. Check proposal inbox
6. Respond to proposal

### Authentication Only
1. Login with valid credentials
2. Login with invalid credentials (expect error)
3. Signup new account
4. Password reset flow
5. Logout

---

## Playwright MCP Tools Reference

**All invoked via Task → mcp-tool-specialist**

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Go to URL |
| `browser_snapshot` | Accessibility tree (use for finding element refs) |
| `browser_take_screenshot` | Visual evidence |
| `browser_click` | Click element (needs `ref` from snapshot) |
| `browser_type` | Type into input |
| `browser_fill_form` | Fill multiple fields |
| `browser_console_messages` | Get console logs |
| `browser_network_requests` | Get network activity |
| `browser_wait_for` | Wait for text/element |

---

## Common Bug Patterns

| Pattern | Symptoms | Typical Fix |
|---------|----------|-------------|
| Modal closes on click | Click inside modal closes it | Add `e.stopPropagation()` to container |
| 401 Unauthorized | API calls fail | Check token refresh in `auth.js` |
| Element not found | Playwright can't find element | Verify selector matches snapshot ref |
| FK Constraint (23503) | Database update fails | Only send changed fields, not full form |
| Form validation stuck | Submit disabled despite valid fields | Check field validation state updates |

---

## Example Invocation

**User**:
```
Run the E2E orchestrator
```

**Assistant**:
1. Use AskUserQuestion to collect: scope, budget, URL, fix mode
2. Store inputs in session variables
3. Begin autonomous loop at Iteration 1
4. Continue until success or budget exhausted
5. Output final report

**Example collected inputs**:
- Scope: Guest Journey
- Budget: Standard (2 hours, 5M tokens)
- URL: localhost:8000
- Fix Mode: Auto-fix and verify

**Example final output**:
```
✅ E2E Test Complete

Test Summary:
- Iterations: 3
- Total Steps: 14
- Final Status: ALL PASSING

Bugs Found & Fixed: 2
- Bug #1: Proposal modal event propagation (FIXED iter 2)
- Bug #2: Rental app Step 4 validation (FIXED iter 3)

Budget Used:
- Tokens: 2,341,000 / 5,000,000 (47%)
- Time: 1.2 / 2.0 hours (60%)

Full Report: .claude/plans/Documents/{timestamp}-e2e-test-report.md
Screenshots: {scratchpad}/e2e-test-{timestamp}/
```

---

## Environment Requirements

- Dev server running at target URL (`bun run dev` for localhost:8000)
- Playwright MCP configured in `.mcp.json`
- Supabase MCP configured (for data validation)
- Test credentials in env vars (optional):
  - `TESTGUESTEMAILADDRESS`
  - `TESTPASSWORD`
  - `TESTHOSTEMAILADDRESS`

---

## Best Practices

1. **Start with Quick budget** for new test flows, scale up once stable
2. **Use localhost** for fix iterations, production for read-only validation
3. **Take snapshots before actions** to get element refs
4. **Screenshot failures** for debugging and documentation
5. **Reset database** between iterations to avoid stale data
6. **Commit incrementally** after each successful fix
