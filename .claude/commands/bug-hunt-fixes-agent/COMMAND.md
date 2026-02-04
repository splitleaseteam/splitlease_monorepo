# Bug Hunt Fixes Agent - Cursor Command

## Command: `/bug-hunt-fixes-agent`

When this command is invoked, immediately respond with the following prompt to collect all necessary information in a SINGLE user response:

---

## BUG HUNT ORCHESTRATOR - INITIALIZATION

I'm ready to hunt down and fix all the bugs in your application! To get started, I need some information from you. **Please answer ALL of the following in a single message** (use natural language - I'll parse it):

### Required Information:

1. **LOOM VIDEO URL**
   The URL of your Loom video documenting the bugs

2. **VIDEO TRANSCRIPTION**
   Copy and paste the full transcription from Loom (click the three dots -> "View transcript" -> copy all)

3. **APPLICATION URL**
   Where is your app running? (e.g., `http://localhost:8000`, `http://localhost:3000`, or a staging URL)

### Optional Information:

4. **PRIORITY FOCUS**
   Any specific bugs or areas you want me to prioritize first?

5. **EXCLUDED FILES/AREAS**
   Any files or directories I should NOT modify? (e.g., auth system, payment processing)

6. **SLACK WEBHOOK URL**
   For completion notifications (I'll ping you when done!)

---

### Example Response:

```
Here's my bug report video: https://www.loom.com/share/abc123xyz

The transcription is:
"Okay so let me show you the bugs we're dealing with. First, when I go to the messages page and click on Create Proposal... nothing happens. The modal should open but it doesn't. Second issue - on the rental application, the phone number field isn't syncing to the database when I tab out..."

The app runs on localhost:8000.

Please prioritize the Create Proposal flow bugs first since those are blocking users. Don't touch anything in the /auth folder or the Stripe integration.

My Slack webhook is https://hooks.slack.com/services/xxx/yyy/zzz
```

---

### What happens next:

Once you provide this info, I'll:

1. **Analyze your Loom video** using Playwright to extract all bugs with timestamps
2. **Document every bug** with severity, reproduction steps, and affected files
3. **Create solution plans** for intelligent code analysis
4. **Fix bugs iteratively** in priority order with automated testing
5. **Verify each fix** with E2E tests and regression checks
6. **Generate a final report** with all changes and commits

**Time Budget**: Up to 5 hours
**Token Budget**: 20-50 million tokens
**Commits**: After each fix (no push until you review)

---

**Ready when you are! Just paste everything in one message and I'll take it from there.**

---

## Input Parsing Logic

After receiving the user's response, parse it using these patterns:

```javascript
function parseUserInput(response) {
  const parsed = {
    loom_url: null,
    transcription: null,
    application_url: 'http://localhost:8000', // default
    priority_focus: null,
    excluded_areas: [],
    slack_webhook: null
  };

  // Extract Loom URL
  const loomMatch = response.match(/https?:\/\/(?:www\.)?loom\.com\/share\/[a-zA-Z0-9]+/);
  if (loomMatch) {
    parsed.loom_url = loomMatch[0];
  }

  // Extract transcription (after "transcription" keyword until next section)
  const transcriptMatch = response.match(/transcription[:\s]+["']?(.+?)["']?(?=\n\n|app.*runs|localhost|priority|don't touch|slack|$)/is);
  if (transcriptMatch) {
    parsed.transcription = transcriptMatch[1].trim();
  }

  // Extract application URL
  const urlMatch = response.match(/(?:localhost:\d+|https?:\/\/[^\s]+(?:staging|dev|app)[^\s]*)/i);
  if (urlMatch) {
    parsed.application_url = urlMatch[0];
  }

  // Extract priority focus
  const priorityMatch = response.match(/prioritize?\s+(.+?)(?:\.|don't|slack|$)/i);
  if (priorityMatch) {
    parsed.priority_focus = priorityMatch[1].trim();
  }

  // Extract excluded areas
  const excludeMatch = response.match(/(?:don't touch|exclude|skip|avoid)\s+(.+?)(?:\.|slack|$)/i);
  if (excludeMatch) {
    parsed.excluded_areas = excludeMatch[1].split(/,|and/).map(s => s.trim());
  }

  // Extract Slack webhook
  const slackMatch = response.match(/https?:\/\/hooks\.slack\.com\/[^\s]+/);
  if (slackMatch) {
    parsed.slack_webhook = slackMatch[0];
  }

  return parsed;
}
```

## Validation

Before proceeding, validate:

```javascript
function validateInput(parsed) {
  const errors = [];

  if (!parsed.loom_url) {
    errors.push("Missing Loom video URL - I need this to see the bugs!");
  }

  if (!parsed.transcription || parsed.transcription.length < 50) {
    errors.push("Missing or too short transcription - please paste the full transcript");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: `I'm missing some required information:\n\n${errors.join('\n')}\n\nPlease provide these and I'll get started!`
    };
  }

  return { valid: true };
}
```

## Confirmation Message

After parsing, confirm with the user:

```markdown
## Got it! Here's what I understood:

**Loom Video**: ${loom_url}
**Transcription**: ${transcription.slice(0, 200)}...
**App URL**: ${application_url}
**Priority**: ${priority_focus || 'None specified - will use severity order'}
**Excluded**: ${excluded_areas.join(', ') || 'None'}
**Slack**: ${slack_webhook ? 'Configured' : 'Not configured'}

---

## Starting Bug Hunt Orchestration...

**Phase 1**: Analyzing Loom video with Playwright MCP...
(This may take 15-30 minutes depending on video length)
```

## Handoff to Orchestrator

```javascript
// After validation, invoke the orchestrator agents
// ALL MCP calls MUST go through mcp-tool-specialist subagent

// Phase 1: Video Analysis (via mcp-tool-specialist)
Task({
  description: "Video Analysis",
  subagent_type: "mcp-tool-specialist",
  prompt: buildVideoAnalysisPrompt(parsedInput)
})

// Phase 2: Bug Documentation
Task({
  description: "Bug Documentation",
  subagent_type: "general-purpose",
  prompt: buildDocumentationPrompt(videoAnalysisResult)
})

// Phase 3: Solution Planning
Task({
  description: "Solution Planning",
  subagent_type: "general-purpose",
  prompt: buildSolutionPlanningPrompt(bugInventory)
})

// Phase 4: Iterative Fix Loop
// For each bug:
//   - Fix Implementation (general-purpose)
//   - E2E Verification (mcp-tool-specialist)
//   - Commit if passed

// Phase 5: Final Report
```

## Output Files

After completion, the following files will be generated:

```
.claude/
+-- plans/
|   +-- New/
|       +-- YYYYMMDD-bug-hunt-inventory.md    # All bugs documented
|       +-- YYYYMMDD-bug-hunt-solutions.md    # Solution plans
|       +-- YYYYMMDD-bug-hunt-final-report.md # Final results
+-- screenshots/
    +-- bug-hunt-YYYYMMDD/
        +-- video-analysis/     # Screenshots from video
        +-- bug-reproduction/   # Bug state captures
        +-- fix-verification/   # Fix proof screenshots
```

## Agent Reference

| Agent | Subagent Type | Purpose |
|-------|---------------|---------|
| Video Analysis | `mcp-tool-specialist` | Watch Loom, extract bugs via Playwright |
| Bug Documentation | `general-purpose` | Create structured bug reports |
| Solution Planning | `general-purpose` | Analyze code, plan fixes |
| Fix Implementation | `general-purpose` | Implement code changes |
| E2E Verification | `mcp-tool-specialist` | Verify fixes via Playwright |

## Success Metrics

- **Bug Fix Rate**: Target 90%+ of identified bugs
- **Regression Rate**: Target 0% - no new bugs introduced
- **Time Efficiency**: Complete within 5-hour budget
