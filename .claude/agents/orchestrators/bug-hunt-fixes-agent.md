# Bug Hunt Fixes Agent - Master Orchestrator

## Overview

This orchestrator automates the complete bug hunting and fixing workflow for the Split Lease application. It watches a Loom video where bugs are mentioned out loud, extracts them, creates a comprehensive plan, and then iteratively fixes each bug until all are resolved.

**Trigger Command**: `/bug-hunt-fixes-agent`

**Total Budget**: 20-50 million tokens
**Max Duration**: 5+ hours
**Models Used**: Claude Opus (orchestration), via `mcp-tool-specialist` subagent for all MCP operations

---

## Quick Start - Single Input Collection

When invoked with `/bug-hunt-fixes-agent`, immediately present this message:

```
BUG HUNT ORCHESTRATOR - INITIALIZATION

I need some information to begin the bug hunt. Please provide ALL of the following in a single response (use natural language, I'll parse it):

1. LOOM VIDEO URL - The URL of your Loom video documenting the bugs
2. VIDEO TRANSCRIPTION - Copy/paste the full transcription from Loom
3. APPLICATION URL - The URL where the app is running (default: http://localhost:8000)
4. PRIORITY FOCUS - Any specific areas or bugs you want prioritized first (optional)
5. EXCLUDED FILES/AREAS - Any files or areas I should NOT modify (optional)
6. SLACK WEBHOOK URL - For completion notifications (optional)

Example response:
"The loom video is at https://www.loom.com/share/abc123. Here's the transcription: [paste]. The app runs on localhost:8000. Please prioritize the proposal flow bugs first. Don't touch the auth system. Slack webhook is https://hooks.slack.com/..."

Ready when you are!
```

---

## MCP Invocation Rule (CRITICAL)

**ALL Playwright MCP and Supabase MCP calls MUST go through the `mcp-tool-specialist` subagent.**

```javascript
// CORRECT - Always use Task tool with mcp-tool-specialist
Task({
  description: "Navigate to Loom video",
  subagent_type: "mcp-tool-specialist",
  prompt: `Use mcp__playwright__browser_navigate to go to ${loom_url}`
})

// WRONG - Never invoke MCP tools directly
mcp__playwright__browser_navigate({ url: loom_url })  // PROHIBITED
```

---

## Orchestration Flow

```
/bug-hunt-fixes-agent
  |
  +-> PHASE 0: INPUT COLLECTION (5 min)
  |     +-> Single freeform question
  |     +-> Parse all required inputs
  |
  +-> PHASE 1: VIDEO ANALYSIS (30-45 min)
  |     +-> Video Analysis Agent (via mcp-tool-specialist + Playwright MCP)
  |         +-> Navigate to Loom URL
  |         +-> Watch video and take screenshots
  |         +-> Cross-reference with transcription
  |         +-> Extract bug occurrences with timestamps
  |
  +-> PHASE 2: BUG DOCUMENTATION (20-30 min)
  |     +-> Bug Documentation Agent
  |         +-> Create structured bug reports
  |         +-> Assign severity levels
  |         +-> Document reproduction steps
  |         +-> Save to .claude/plans/New/
  |
  +-> PHASE 3: SOLUTION PLANNING (30-45 min)
  |     +-> Solution Planning Agent
  |         +-> Root cause analysis for each bug
  |         +-> Propose fixes with file paths
  |         +-> Identify dependencies between fixes
  |         +-> Create prioritized execution plan
  |
  +-> PHASE 4: ITERATIVE FIX LOOP (3-4 hours)
  |     +-> FOR EACH BUG (priority order):
  |         |
  |         +-> DEBUG: Identify root cause
  |         |   +-> Use Playwright MCP (via mcp-tool-specialist) to reproduce
  |         |
  |         +-> FIX: Implement solution
  |         |   +-> Fix Implementation Agent
  |         |   +-> Run `bun run build` after changes
  |         |
  |         +-> TEST: Run E2E verification
  |         |   +-> Use Playwright MCP (via mcp-tool-specialist)
  |         |   +-> Manual verification steps
  |         |
  |         +-> VERIFY: Confirm fix + no regressions
  |         |   +-> Run regression tests
  |         |   +-> Check previously fixed bugs still work
  |         |
  |         +-> IF FAIL: Loop back to DEBUG (max 5 iterations)
  |         +-> IF PASS: Commit changes (no push)
  |         +-> CONTINUE to next bug
  |
  +-> PHASE 5: FINAL VERIFICATION (30 min)
  |     +-> Run full E2E suite
  |     +-> Generate final report
  |     +-> Invoke /slack-webhook
  |
  +-> END: Comprehensive report + all commits staged

TOTAL MAX TIME: 5+ HOURS
TOKEN BUDGET: 20-50 MILLION
```

---

## Agent Definitions

### Agent 1: Video Analysis Agent

**Purpose**: Watch Loom video and extract bug occurrences

**Execution** (via mcp-tool-specialist):
```javascript
Task({
  description: "Analyze Loom video for bugs",
  subagent_type: "mcp-tool-specialist",
  model: "opus",
  prompt: `
    You are the Video Analysis Agent.

    LOOM URL: ${loom_url}
    TRANSCRIPTION: ${transcription}

    Use Playwright MCP tools to:
    1. Navigate to the Loom video URL (mcp__playwright__browser_navigate)
    2. Take accessibility snapshot (mcp__playwright__browser_snapshot)
    3. Play the video (find and click play button)
    4. At each moment a bug is mentioned in the transcription:
       - Take a screenshot (mcp__playwright__browser_take_screenshot)
       - Note the approximate timestamp
       - Cross-reference with transcription
    5. Continue until video ends or all bugs are captured

    OUTPUT: JSON with bugs_found array containing timestamp, screenshot_path,
    transcription_excerpt, visual_description, bug_type for each bug.
  `
})
```

**Agent File**: [video-analysis-agent.md](./video-analysis-agent.md)

### Agent 2: Bug Documentation Agent

**Purpose**: Create structured bug reports from video analysis

**Output Location**: `.claude/plans/New/YYYYMMDD-bug-hunt-inventory.md`

**Execution**:
```javascript
Task({
  description: "Document all bugs from video analysis",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the Bug Documentation Agent.

    VIDEO ANALYSIS: ${video_analysis_output}

    Create structured documentation for each bug:
    - BUG-XXX ID format
    - Severity: CRITICAL / HIGH / MEDIUM / LOW
    - Type: UI / LOGIC / DATA / NAVIGATION
    - Expected vs Actual behavior
    - Affected components (search codebase)
    - Reproduction steps
    - Screenshot reference
    - Transcription quote
    - Priority score calculation

    Save to: .claude/plans/New/YYYYMMDD-bug-hunt-inventory.md
  `
})
```

**Agent File**: [bug-documentation-agent.md](./bug-documentation-agent.md)

### Agent 3: Solution Planning Agent

**Purpose**: Analyze codebase and plan fixes for each bug

**Output Location**: `.claude/plans/New/YYYYMMDD-bug-hunt-solutions.md`

**Execution**:
```javascript
Task({
  description: "Plan solutions for all documented bugs",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the Solution Planning Agent.

    BUG INVENTORY: ${bug_inventory_path}

    For each bug:
    1. Investigate the codebase deeply (use Grep, Glob, Read)
    2. Identify root cause with file paths and line numbers
    3. Propose fix with before/after code snippets
    4. Document dependencies between bugs
    5. Create test strategy
    6. Estimate time and risk

    Create prioritized execution order respecting dependencies.

    Save to: .claude/plans/New/YYYYMMDD-bug-hunt-solutions.md
  `
})
```

**Agent File**: [solution-planning-agent.md](./solution-planning-agent.md)

### Agent 4: Fix Implementation Agent

**Purpose**: Implement fixes one by one following the solution plan

**Execution**:
```javascript
Task({
  description: "Implement fix for BUG-XXX",
  subagent_type: "general-purpose",
  model: "opus",
  prompt: `
    You are the Fix Implementation Agent.

    CURRENT BUG: ${current_bug}
    SOLUTION PLAN: ${solution_for_bug}
    ITERATION: ${iteration} of 5
    PREVIOUS FAILURE: ${previous_failure || 'None'}

    INSTRUCTIONS:
    1. Read the relevant files
    2. Implement the proposed fix using Edit tool
    3. Run \`bun run build\` to verify compilation
    4. If build fails, analyze error and fix
    5. Report changes made

    DO NOT modify: ${excluded_areas}

    OUTPUT: JSON with bug_id, files_modified, build_status, ready_for_test
  `
})
```

**Agent File**: [fix-implementation-agent.md](./fix-implementation-agent.md)

### Agent 5: E2E Test Verification Agent

**Purpose**: Verify fixes through Playwright MCP automation

**Execution** (via mcp-tool-specialist):
```javascript
Task({
  description: "E2E test verification for BUG-XXX",
  subagent_type: "mcp-tool-specialist",
  model: "opus",
  prompt: `
    You are the E2E Test Agent.

    APPLICATION URL: ${application_url}
    BUG TO VERIFY: ${current_bug}
    REPRODUCTION STEPS: ${reproduction_steps}
    EXPECTED BEHAVIOR: ${expected_behavior}

    Use Playwright MCP tools to:
    1. Navigate to application (mcp__playwright__browser_navigate)
    2. Take snapshot to find elements (mcp__playwright__browser_snapshot)
    3. Follow reproduction steps using click/type tools
    4. Verify expected behavior now occurs
    5. Take verification screenshot
    6. Check console for errors (mcp__playwright__browser_console_messages)

    ALSO run regression checks on previously fixed bugs.

    OUTPUT: JSON with test_result (PASS/FAIL), screenshots, console_errors,
    regression_check results
  `
})
```

**Agent File**: [e2e-test-verification-agent.md](./e2e-test-verification-agent.md)

---

## Main Execution Script

```javascript
async function runBugHuntOrchestrator(userInput) {
  const startTime = Date.now();
  const maxDuration = 5 * 60 * 60 * 1000; // 5 hours
  const sessionId = `bug-hunt-${formatDate(new Date(), 'YYYYMMDD-HHmmss')}`;

  // Phase 0: Parse input
  const config = parseUserInput(userInput);
  validateConfig(config);

  // Phase 1: Video Analysis
  const videoAnalysis = await Task({
    description: "Video Analysis",
    subagent_type: "mcp-tool-specialist",
    prompt: buildVideoAnalysisPrompt(config)
  });

  // Phase 2: Bug Documentation
  const bugInventory = await Task({
    description: "Bug Documentation",
    subagent_type: "general-purpose",
    prompt: buildBugDocumentationPrompt(videoAnalysis)
  });

  // Phase 3: Solution Planning
  const solutionPlan = await Task({
    description: "Solution Planning",
    subagent_type: "general-purpose",
    prompt: buildSolutionPlanningPrompt(bugInventory)
  });

  // Phase 4: Iterative Fix Loop
  const bugs = solutionPlan.prioritized_bugs;
  const fixResults = [];
  const fixedBugs = [];

  for (const bug of bugs) {
    let fixed = false;
    let attempts = 0;
    const maxAttempts = 5;
    let lastFailure = null;

    while (!fixed && attempts < maxAttempts) {
      attempts++;

      // FIX
      const fixResult = await Task({
        description: `Fix ${bug.id} (attempt ${attempts})`,
        subagent_type: "general-purpose",
        prompt: buildFixPrompt(bug, lastFailure)
      });

      if (fixResult.build_status !== "SUCCESS") {
        lastFailure = fixResult;
        continue;
      }

      // TEST (via mcp-tool-specialist)
      const testResult = await Task({
        description: `Test ${bug.id}`,
        subagent_type: "mcp-tool-specialist",
        prompt: buildTestPrompt(bug, fixedBugs)
      });

      if (testResult.test_result === "PASS" && testResult.regression_check.all_passing) {
        fixed = true;
        await commitChanges(bug.id, fixResult.changes_summary);
        fixResults.push({ bug_id: bug.id, status: "FIXED", attempts });
        fixedBugs.push(bug);
      } else {
        lastFailure = testResult;
      }
    }

    if (!fixed) {
      fixResults.push({ bug_id: bug.id, status: "FAILED", attempts, lastFailure });
    }

    // Check time budget
    if (Date.now() - startTime > maxDuration) {
      console.log("Time budget exceeded, generating partial report");
      break;
    }
  }

  // Phase 5: Final Report
  const finalReport = generateFinalReport(sessionId, config, fixResults);
  saveFinalReport(finalReport);

  // Slack notification
  if (config.slack_webhook) {
    await invokeSlackWebhook(config.slack_webhook, finalReport);
  }

  return finalReport;
}
```

---

## File Structure

```
.claude/
+-- agents/
|   +-- orchestrators/
|       +-- bug-hunt-fixes-agent.md (this file)
|       +-- video-analysis-agent.md
|       +-- bug-documentation-agent.md
|       +-- solution-planning-agent.md
|       +-- fix-implementation-agent.md
|       +-- e2e-test-verification-agent.md
+-- commands/
|   +-- bug-hunt-fixes-agent/
|       +-- COMMAND.md
+-- plans/
|   +-- New/
|       +-- YYYYMMDD-bug-hunt-inventory.md
|       +-- YYYYMMDD-bug-hunt-solutions.md
|       +-- YYYYMMDD-bug-hunt-final-report.md
+-- screenshots/
    +-- bug-hunt-YYYYMMDD/
        +-- video-analysis/
        +-- bug-reproduction/
        +-- fix-verification/
```

---

## Input Parsing Logic

```javascript
function parseUserInput(response) {
  const parsed = {
    loom_url: null,
    transcription: null,
    application_url: 'http://localhost:8000',
    priority_focus: null,
    excluded_areas: [],
    slack_webhook: null
  };

  // Extract Loom URL
  const loomMatch = response.match(/https?:\/\/(?:www\.)?loom\.com\/share\/[a-zA-Z0-9]+/);
  if (loomMatch) parsed.loom_url = loomMatch[0];

  // Extract transcription (after "transcription:" or in quotes)
  const transcriptMatch = response.match(/transcription[:\s]+["']?(.+?)["']?(?=\n\n|app.*runs|localhost|priority|don't touch|slack|$)/is);
  if (transcriptMatch) parsed.transcription = transcriptMatch[1].trim();

  // Extract application URL
  const urlMatch = response.match(/(?:localhost:\d+|https?:\/\/[^\s]+(?:staging|dev|app)[^\s]*)/i);
  if (urlMatch) parsed.application_url = urlMatch[0];

  // Extract priority focus
  const priorityMatch = response.match(/prioritize?\s+(.+?)(?:\.|don't|slack|$)/i);
  if (priorityMatch) parsed.priority_focus = priorityMatch[1].trim();

  // Extract excluded areas
  const excludeMatch = response.match(/(?:don't touch|exclude|skip|avoid)\s+(.+?)(?:\.|slack|$)/i);
  if (excludeMatch) parsed.excluded_areas = excludeMatch[1].split(/,|and/).map(s => s.trim());

  // Extract Slack webhook
  const slackMatch = response.match(/https?:\/\/hooks\.slack\.com\/[^\s]+/);
  if (slackMatch) parsed.slack_webhook = slackMatch[0];

  return parsed;
}
```

---

## Success Metrics

- **Bug Fix Rate**: Target 90%+ of identified bugs fixed
- **Regression Rate**: Target 0% - no new bugs introduced
- **Time Efficiency**: Complete within 5-hour budget
- **Token Efficiency**: Stay within 50M token budget

---

## Troubleshooting

### Loom Video Won't Play
```
Error: Cannot interact with video player
Fix: Ensure Playwright browser is running, try keyboard shortcuts (space for play/pause)
```

### Build Failures
```
Error: bun run build failed
Action: Capture build output, analyze errors, iterate fix
```

### Test Timeouts
```
Error: E2E test timed out
Action: Increase wait times, verify app is running at application_url
```

### Max Iterations Reached
```
Status: Bug marked as FAILED after 5 attempts
Action: Manual intervention required - see recommendations in final report
```

---

## References

- [COMMAND.md](../../commands/bug-hunt-fixes-agent/COMMAND.md) - Skill invocation
- [video-analysis-agent.md](./video-analysis-agent.md)
- [bug-documentation-agent.md](./bug-documentation-agent.md)
- [solution-planning-agent.md](./solution-planning-agent.md)
- [fix-implementation-agent.md](./fix-implementation-agent.md)
- [e2e-test-verification-agent.md](./e2e-test-verification-agent.md)
