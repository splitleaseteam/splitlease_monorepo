# Bug Fix Orchestrator

## Overview

This is the main orchestration script for fixing the Create Proposal Flow and Phone Number Sync bugs. It coordinates investigation, implementation, and verification agents in an iterative loop.

## Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  START                                                                      │
│    │                                                                        │
│    ├─► PHASE 1: INVESTIGATION (30 min max)                                 │
│    │     └─► Bug Investigation Agent                                        │
│    │         ├─► Analyze codebase                                           │
│    │         └─► Produce bug report with fix locations                      │
│    │                                                                        │
│    ├─► PHASE 2: IMPLEMENTATION (1 hour max)                                │
│    │     └─► Fix Implementation Agent                                       │
│    │         ├─► Implement fixes from investigation                         │
│    │         └─► Run initial smoke test                                     │
│    │                                                                        │
│    ├─► PHASE 3: VERIFICATION LOOP (2.5 hours max)                          │
│    │     └─► LOOP until PASS or timeout:                                   │
│    │         ├─► E2E Verification Agent                                     │
│    │         │   ├─► Run Playwright tests                                   │
│    │         │   ├─► Capture failures with MCP tools                        │
│    │         │   └─► Report results                                         │
│    │         │                                                              │
│    │         ├─► IF FAIL:                                                   │
│    │         │   ├─► Analyze error with Supabase MCP                        │
│    │         │   ├─► Determine fix                                          │
│    │         │   └─► Fix Implementation Agent (quick fix)                   │
│    │         │                                                              │
│    │         └─► IF PASS: EXIT LOOP                                         │
│    │                                                                        │
│    └─► END: Produce final report                                            │
│                                                                             │
│  TOTAL MAX TIME: 4 HOURS                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Execution Instructions

### To Run This Orchestrator

Use the Task tool to spawn agents in sequence. The orchestrator itself runs as a coordinating prompt.

### Phase 1: Run Investigation Agent

```javascript
Task({
  description: "Investigate create proposal bugs",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the Bug Investigation Agent.

    Read the agent prompt at: .claude/agents/orchestrators/bug-investigation-agent.md
    Read the plan at: .claude/plans/New/20260129-create-proposal-flow-orchestrator-plan.md

    Execute the investigation tasks and produce the JSON report.

    Focus on:
    1. Message Page Create Proposal Flow - check ctaConfig.js, MessagingPage.jsx, useMessagingPageLogic.js
    2. Phone Number Sync - verify it's working in useRentalApplicationWizardLogic.js

    Output your findings as a structured JSON report.
  `
})
```

### Phase 2: Run Implementation Agent

```javascript
Task({
  description: "Implement bug fixes",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the Fix Implementation Agent.

    Read the agent prompt at: .claude/agents/orchestrators/fix-implementation-agent.md
    Read the investigation report from Phase 1.

    Implement the fixes:
    1. Add create_proposal_guest to CTA_ROUTES in ctaConfig.js
    2. Add modal state to useMessagingPageLogic.js
    3. Add modal rendering to MessagingPage.jsx

    After implementing, report what was changed.
  `
})
```

### Phase 3: Run E2E Verification Loop

```javascript
// Initial test
Task({
  description: "E2E test create proposal flow",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the E2E Verification Agent.

    Read: .claude/agents/orchestrators/e2e-verification-agent.md

    Run Test 1: Create Proposal from Message Page

    Use Playwright MCP tools:
    1. browser_navigate to the messaging page
    2. browser_snapshot to see the state
    3. Find and click on a thread
    4. Look for Create Proposal CTA
    5. Click it and verify modal opens

    Report PASS or FAIL with details.
  `
})

// If FAIL, iterate:
WHILE (test_result === "FAIL" && elapsed_time < 4_hours) {
  // Analyze failure
  // Fix the issue
  // Re-run test
}
```

## Test Credentials & Setup

### Dev Environment
- **App URL**: http://localhost:8000 (or production URL if deployed)
- **Supabase MCP**: Use `supabase-dev` for all queries

### Test User
Create a test user or use existing:
- Email: e2e-test@splitlease.com
- Role: Guest (to test create proposal)

### Test Listing
Use a listing that:
- Has no existing proposal from the test user
- Is active and bookable

## Iteration Protocol

### On Test Failure

1. **Capture**: Get console logs, network requests, page snapshot
2. **Analyze**: Determine root cause category:
   - MISSING_ELEMENT: Element not found on page
   - JS_ERROR: JavaScript runtime error
   - NETWORK_ERROR: API call failed
   - STATE_ERROR: Incorrect application state
3. **Fix**: Apply targeted fix based on category
4. **Verify**: Re-run only the failed test

### Max Iterations
- Per test: 5 fix attempts max
- Total orchestrator: 4 hours

## Success Criteria

### Test 1: Create Proposal from Message Page
- [ ] CTA button visible on SplitBot message
- [ ] Click opens CreateProposalFlowV2 modal
- [ ] User Details step renders correctly
- [ ] Move-in step renders correctly
- [ ] Days selection step renders correctly
- [ ] Review step renders correctly
- [ ] Submit creates proposal successfully

### Test 2: Phone Number Sync
- [ ] Phone field in rental application accepts input
- [ ] On blur, phone syncs to user table
- [ ] User table 'Phone Number (as text)' column updated

## Final Report Template

```json
{
  "orchestration_id": "20260129-proposal-flow-fix",
  "start_time": "ISO timestamp",
  "end_time": "ISO timestamp",
  "duration_hours": 2.5,
  "status": "SUCCESS|PARTIAL|FAILED",

  "bugs_fixed": [
    {
      "id": "MSG_PROPOSAL_FLOW",
      "status": "FIXED",
      "changes": ["file1", "file2"],
      "test_result": "PASS"
    }
  ],

  "iterations": [
    {
      "iteration": 1,
      "test_result": "FAIL",
      "error": "Modal not opening",
      "fix_applied": "Added CTA route"
    },
    {
      "iteration": 2,
      "test_result": "PASS"
    }
  ],

  "files_changed": [
    "app/src/lib/ctaConfig.js",
    "app/src/islands/pages/MessagingPage/MessagingPage.jsx",
    "app/src/islands/pages/MessagingPage/useMessagingPageLogic.js"
  ],

  "remaining_issues": [],

  "recommendations": [
    "Add unit tests for CTA handling",
    "Add E2E test to CI pipeline"
  ]
}
```

## Troubleshooting

### Playwright Browser Not Available
```
Error: Browser not installed
Fix: mcp__playwright__browser_install
```

### Supabase MCP Connection Issues
```
Error: Cannot connect to Supabase
Fix: Verify supabase-dev MCP server is configured in settings.json
```

### Test User Not Found
```
Error: Authentication failed
Fix: Create test user via Supabase MCP or use existing credentials
```
