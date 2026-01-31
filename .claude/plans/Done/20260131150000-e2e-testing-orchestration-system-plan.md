# E2E Testing Orchestration System - Implementation Plan

**Created**: 2026-01-31T15:00:00
**Status**: NEW
**Classification**: BUILD
**Complexity**: HIGH (Multi-file, cross-system integration)

---

## Executive Summary

This plan outlines the implementation of a comprehensive E2E Testing Orchestration System for Split Lease. The system enhances the existing `e2e-testing-orchestrator` skill with budget/time tracking, session state management, a startup script, and optional Cursor IDE integration for development workflows.

---

## Current State Analysis

### Existing Infrastructure

The project already has significant E2E testing infrastructure:

| Component | Location | Status |
|-----------|----------|--------|
| **E2E Orchestrator Skill** | `.claude/skills/e2e-testing-orchestrator/SKILL.md` | Exists - comprehensive 816 lines |
| **Bug Analysis Patterns** | `.claude/skills/e2e-testing-orchestrator/references/bug-analysis-patterns.md` | Exists - 610 lines |
| **Guest Proposal Flow** | `.claude/skills/e2e-testing-orchestrator/references/test-flows/guest-proposal-flow.md` | Exists - 496 lines |
| **Test E2E Command** | `.claude/commands/test_e2e.md` | Exists - basic test runner |
| **Resolve Failed E2E Test** | `.claude/commands/resolve_failed_e2e_test.md` | Exists - fix workflow |
| **MCP Tool Specialist** | `.claude/agents/mcp-tool-specialist.md` | Exists - MCP routing agent |
| **Playwright MCP** | `.mcp.json` | Configured |
| **Supabase MCP** | `.mcp.json` | Configured |
| **Knip MCP** | `.mcp.json` | Configured (code analysis) |

### Gaps to Fill

| Gap | Priority | Description |
|-----|----------|-------------|
| **Budget Tracking** | HIGH | No token/time limit enforcement |
| **Session State** | HIGH | No persistent state across orchestration loops |
| **Startup Script** | MEDIUM | No automated session initialization |
| **Data Reset Capability** | HIGH | No automated test data cleanup |
| **Cursor Rules** | LOW | Optional IDE integration (not critical path) |

---

## Architecture Design

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    E2E Testing Orchestration System                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Claude Code (Main Orchestrator)                    │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │  /test-orchestrator skill invocation                           │  │  │
│  │  │  - Reads session config + state                                │  │  │
│  │  │  - Checks budget/time limits                                   │  │  │
│  │  │  - Orchestrates test → fix → verify loop                       │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Playwright    │    │    Supabase     │    │   Filesystem    │        │
│  │      MCP        │    │      MCP        │    │   (Native)      │        │
│  │                 │    │                 │    │                 │        │
│  │ Via mcp-tool-   │    │ Via mcp-tool-   │    │ Read/Write/     │        │
│  │ specialist      │    │ specialist      │    │ Glob/Grep       │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Session Management Layer                           │  │
│  │                                                                       │  │
│  │  test-session/                                                        │  │
│  │  ├── config.json         # Budget limits, test scope, exit conditions│  │
│  │  ├── state.json          # Current progress, bugs found/fixed        │  │
│  │  ├── budget-tracker.ts   # Token/time tracking logic                 │  │
│  │  └── screenshots/        # Test evidence                              │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Orchestration Loop                                 │  │
│  │                                                                       │  │
│  │  1. CHECK BUDGET → Exit if exceeded                                  │  │
│  │  2. GENERATE TEST → Use existing skill phases                        │  │
│  │  3. EXECUTE → Playwright MCP via mcp-tool-specialist                 │  │
│  │  4. ANALYZE → Bug detection and logging                              │  │
│  │  5. FIX → Apply code changes if bugs found                           │  │
│  │  6. RESET DATA → Clear test artifacts via Supabase MCP               │  │
│  │  7. RETEST → Loop until clean or budget exceeded                     │  │
│  │  8. REPORT → Generate final summary                                  │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Session Configuration and State Management

**Files to Create:**

#### 1.1 `test-session/config.schema.json`

JSON Schema for session configuration validation.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["budget", "scope", "exitConditions"],
  "properties": {
    "budget": {
      "type": "object",
      "required": ["maxTimeMinutes", "maxIterations"],
      "properties": {
        "maxTimeMinutes": { "type": "number", "minimum": 5, "maximum": 120 },
        "maxIterations": { "type": "number", "minimum": 1, "maximum": 50 },
        "maxBugsToFix": { "type": "number", "minimum": 1, "maximum": 20 }
      }
    },
    "scope": {
      "type": "object",
      "required": ["testFlow"],
      "properties": {
        "testFlow": { "enum": ["guest-proposal", "host-listing", "full-suite"] },
        "startFromStep": { "type": "string" },
        "skipSteps": { "type": "array", "items": { "type": "string" } }
      }
    },
    "exitConditions": {
      "type": "object",
      "properties": {
        "stopOnFirstBug": { "type": "boolean", "default": false },
        "requireCleanRun": { "type": "boolean", "default": true },
        "maxConsecutiveFailures": { "type": "number", "default": 3 }
      }
    },
    "dataReset": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "preserveTestAccounts": { "type": "boolean", "default": true },
        "cleanupProposals": { "type": "boolean", "default": true }
      }
    }
  }
}
```

#### 1.2 `test-session/config.example.json`

Example configuration file for users.

```json
{
  "budget": {
    "maxTimeMinutes": 30,
    "maxIterations": 10,
    "maxBugsToFix": 5
  },
  "scope": {
    "testFlow": "guest-proposal",
    "startFromStep": null,
    "skipSteps": []
  },
  "exitConditions": {
    "stopOnFirstBug": false,
    "requireCleanRun": true,
    "maxConsecutiveFailures": 3
  },
  "dataReset": {
    "enabled": true,
    "preserveTestAccounts": true,
    "cleanupProposals": true
  }
}
```

#### 1.3 `test-session/state.schema.json`

JSON Schema for session state tracking.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["session", "progress", "bugs", "metrics"],
  "properties": {
    "session": {
      "type": "object",
      "required": ["id", "startedAt", "status"],
      "properties": {
        "id": { "type": "string" },
        "startedAt": { "type": "string", "format": "date-time" },
        "endedAt": { "type": ["string", "null"], "format": "date-time" },
        "status": { "enum": ["running", "paused", "completed", "failed", "budget_exceeded"] }
      }
    },
    "progress": {
      "type": "object",
      "properties": {
        "currentIteration": { "type": "number" },
        "currentPhase": { "type": "string" },
        "currentStep": { "type": "string" },
        "completedSteps": { "type": "array", "items": { "type": "string" } },
        "lastScreenshot": { "type": ["string", "null"] }
      }
    },
    "bugs": {
      "type": "object",
      "properties": {
        "found": { "type": "array" },
        "fixed": { "type": "array" },
        "pending": { "type": "array" },
        "wontFix": { "type": "array" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "elapsedMinutes": { "type": "number" },
        "testsRun": { "type": "number" },
        "testsPassed": { "type": "number" },
        "testsFailed": { "type": "number" },
        "fixAttempts": { "type": "number" },
        "dataResets": { "type": "number" }
      }
    }
  }
}
```

---

### Task 2: Budget Tracker Utility

**File to Create:** `test-session/budget-tracker.ts`

This is a TypeScript utility that Claude Code will read and reference during orchestration, not a runtime executable.

```typescript
/**
 * Budget Tracker - E2E Testing Orchestration
 *
 * This file defines the budget tracking logic for the E2E testing orchestration system.
 * Claude Code reads this file to understand how to track and enforce budget limits.
 *
 * Usage: Claude Code reads this file during orchestration to:
 * 1. Calculate elapsed time from session start
 * 2. Check if any budget limit is exceeded
 * 3. Determine appropriate exit behavior
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BudgetConfig {
  maxTimeMinutes: number;
  maxIterations: number;
  maxBugsToFix?: number;
}

interface SessionState {
  session: {
    startedAt: string;
    status: 'running' | 'paused' | 'completed' | 'failed' | 'budget_exceeded';
  };
  progress: {
    currentIteration: number;
  };
  bugs: {
    fixed: Array<unknown>;
  };
  metrics: {
    elapsedMinutes: number;
  };
}

interface BudgetCheckResult {
  exceeded: boolean;
  reason: string | null;
  remaining: {
    timeMinutes: number;
    iterations: number;
    bugsToFix: number | null;
  };
  recommendation: 'continue' | 'warn' | 'stop';
}

// ============================================================================
// BUDGET CHECK LOGIC
// ============================================================================

/**
 * Check if any budget limit has been exceeded.
 *
 * @param config - Budget configuration from config.json
 * @param state - Current session state from state.json
 * @returns BudgetCheckResult with exceeded status and details
 */
function checkBudget(config: BudgetConfig, state: SessionState): BudgetCheckResult {
  const now = new Date();
  const started = new Date(state.session.startedAt);
  const elapsedMinutes = (now.getTime() - started.getTime()) / (1000 * 60);

  // Update elapsed time in state
  state.metrics.elapsedMinutes = elapsedMinutes;

  // Check time limit
  if (elapsedMinutes >= config.maxTimeMinutes) {
    return {
      exceeded: true,
      reason: `Time limit exceeded: ${elapsedMinutes.toFixed(1)}/${config.maxTimeMinutes} minutes`,
      remaining: {
        timeMinutes: 0,
        iterations: config.maxIterations - state.progress.currentIteration,
        bugsToFix: config.maxBugsToFix ? config.maxBugsToFix - state.bugs.fixed.length : null
      },
      recommendation: 'stop'
    };
  }

  // Check iteration limit
  if (state.progress.currentIteration >= config.maxIterations) {
    return {
      exceeded: true,
      reason: `Iteration limit exceeded: ${state.progress.currentIteration}/${config.maxIterations}`,
      remaining: {
        timeMinutes: config.maxTimeMinutes - elapsedMinutes,
        iterations: 0,
        bugsToFix: config.maxBugsToFix ? config.maxBugsToFix - state.bugs.fixed.length : null
      },
      recommendation: 'stop'
    };
  }

  // Check bugs-to-fix limit (optional)
  if (config.maxBugsToFix && state.bugs.fixed.length >= config.maxBugsToFix) {
    return {
      exceeded: true,
      reason: `Bug fix limit reached: ${state.bugs.fixed.length}/${config.maxBugsToFix} bugs fixed`,
      remaining: {
        timeMinutes: config.maxTimeMinutes - elapsedMinutes,
        iterations: config.maxIterations - state.progress.currentIteration,
        bugsToFix: 0
      },
      recommendation: 'stop'
    };
  }

  // Calculate remaining budget
  const remaining = {
    timeMinutes: config.maxTimeMinutes - elapsedMinutes,
    iterations: config.maxIterations - state.progress.currentIteration,
    bugsToFix: config.maxBugsToFix ? config.maxBugsToFix - state.bugs.fixed.length : null
  };

  // Warn if approaching limits (80% threshold)
  const timeWarning = remaining.timeMinutes < config.maxTimeMinutes * 0.2;
  const iterationWarning = remaining.iterations < config.maxIterations * 0.2;

  return {
    exceeded: false,
    reason: null,
    remaining,
    recommendation: (timeWarning || iterationWarning) ? 'warn' : 'continue'
  };
}

// ============================================================================
// STATE UPDATE HELPERS
// ============================================================================

/**
 * Initialize a new session state.
 */
function initializeState(sessionId: string): SessionState {
  return {
    session: {
      id: sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: 'running'
    },
    progress: {
      currentIteration: 0,
      currentPhase: 'initialization',
      currentStep: 'environment_verification',
      completedSteps: [],
      lastScreenshot: null
    },
    bugs: {
      found: [],
      fixed: [],
      pending: [],
      wontFix: []
    },
    metrics: {
      elapsedMinutes: 0,
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      fixAttempts: 0,
      dataResets: 0
    }
  };
}

/**
 * Update session status and end time.
 */
function finalizeSession(
  state: SessionState,
  status: 'completed' | 'failed' | 'budget_exceeded'
): SessionState {
  return {
    ...state,
    session: {
      ...state.session,
      endedAt: new Date().toISOString(),
      status
    }
  };
}

// ============================================================================
// BUDGET DECISION MATRIX
// ============================================================================

/**
 * Decision matrix for budget-aware orchestration:
 *
 * | Time Remaining | Iterations Left | Bugs Pending | Action              |
 * |----------------|-----------------|--------------|---------------------|
 * | > 20%          | > 20%           | Any          | Continue normally   |
 * | > 20%          | <= 20%          | Any          | Warn, prioritize    |
 * | <= 20%         | > 20%           | Any          | Warn, prioritize    |
 * | <= 20%         | <= 20%          | None         | Complete and report |
 * | <= 20%         | <= 20%          | Some         | Fix critical only   |
 * | 0              | Any             | Any          | Stop immediately    |
 * | Any            | 0               | Any          | Stop immediately    |
 */

export {
  BudgetConfig,
  SessionState,
  BudgetCheckResult,
  checkBudget,
  initializeState,
  finalizeSession
};
```

---

### Task 3: Data Reset Capability

**File to Create:** `test-session/data-reset.sql`

SQL script for Supabase MCP to reset test data.

```sql
-- ============================================================================
-- E2E Test Data Reset Script
--
-- Execute via Supabase MCP: mcp__supabase__execute_sql
-- Target: splitlease-backend-dev (NEVER production)
--
-- This script cleans up test data created during E2E testing while
-- preserving test accounts for reuse.
-- ============================================================================

-- Configuration (modify as needed)
-- Test email pattern: guest.test.%@splitlease.com
-- Test user prefix: Test Guest, Test Host

-- ============================================================================
-- STEP 1: Identify test data (SELECT first, then DELETE)
-- ============================================================================

-- Preview proposals to delete (created by test accounts)
SELECT p.id, p.listing_id, p.user_id, u.email, p.created_at
FROM proposals p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com'
ORDER BY p.created_at DESC;

-- Preview rental applications to delete
SELECT ra.id, ra.proposal_id, ra.created_at
FROM rental_applications ra
JOIN proposals p ON ra.proposal_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com'
ORDER BY ra.created_at DESC;

-- ============================================================================
-- STEP 2: Delete test data (in correct order for FK constraints)
-- ============================================================================

-- Delete rental applications first (FK to proposals)
DELETE FROM rental_applications ra
WHERE ra.proposal_id IN (
  SELECT p.id FROM proposals p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- Delete proposals
DELETE FROM proposals p
WHERE p.user_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- Delete messages (if any)
DELETE FROM messages m
WHERE m.sender_id IN (
  SELECT u.id FROM auth.users u
  WHERE u.email LIKE 'guest.test.%@splitlease.com'
    OR u.email = 'guest.test@splitlease.com'
);

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================

-- Confirm no test proposals remain
SELECT COUNT(*) as remaining_proposals
FROM proposals p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'guest.test.%@splitlease.com'
  OR u.email = 'guest.test@splitlease.com';

-- Should return 0

-- ============================================================================
-- OPTIONAL: Delete test accounts (only if preserveTestAccounts = false)
-- ============================================================================

-- WARNING: This deletes the test accounts themselves
-- Only run if you want to recreate accounts fresh each session

-- DELETE FROM auth.users
-- WHERE email LIKE 'guest.test.%@splitlease.com'
--   OR email = 'guest.test@splitlease.com';
```

---

### Task 4: Startup Script (PowerShell)

**File to Create:** `scripts/Start-E2ESession.ps1`

```powershell
<#
.SYNOPSIS
    Initialize an E2E testing orchestration session for Split Lease.

.DESCRIPTION
    This script:
    1. Creates the test-session directory structure
    2. Initializes session configuration and state
    3. Verifies dev server is running
    4. Outputs the orchestration command to run

.PARAMETER TestFlow
    The test flow to execute: 'guest-proposal', 'host-listing', or 'full-suite'
    Default: 'guest-proposal'

.PARAMETER MaxTimeMinutes
    Maximum time budget in minutes
    Default: 30

.PARAMETER MaxIterations
    Maximum orchestration loop iterations
    Default: 10

.PARAMETER SkipDevServerCheck
    Skip the dev server availability check
    Default: false

.EXAMPLE
    .\Start-E2ESession.ps1

.EXAMPLE
    .\Start-E2ESession.ps1 -TestFlow "guest-proposal" -MaxTimeMinutes 45 -MaxIterations 15

.NOTES
    Run from the project root directory.
    Requires: PowerShell 7+, Node.js/Bun, Claude Code CLI
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('guest-proposal', 'host-listing', 'full-suite')]
    [string]$TestFlow = 'guest-proposal',

    [Parameter()]
    [ValidateRange(5, 120)]
    [int]$MaxTimeMinutes = 30,

    [Parameter()]
    [ValidateRange(1, 50)]
    [int]$MaxIterations = 10,

    [Parameter()]
    [switch]$SkipDevServerCheck
)

# ============================================================================
# Configuration
# ============================================================================

$ProjectRoot = Get-Location
$TestSessionDir = Join-Path $ProjectRoot "test-session"
$SessionId = "e2e-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$ScreenshotDir = Join-Path $TestSessionDir "screenshots" $SessionId

# ============================================================================
# Functions
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "[$Step] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Test-DevServer {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# ============================================================================
# Main Execution
# ============================================================================

Write-Header "E2E Testing Orchestration - Session Initialization"

# Step 1: Create directory structure
Write-Step "1/5" "Creating session directory structure..."

if (-not (Test-Path $TestSessionDir)) {
    New-Item -ItemType Directory -Path $TestSessionDir -Force | Out-Null
}

if (-not (Test-Path $ScreenshotDir)) {
    New-Item -ItemType Directory -Path $ScreenshotDir -Force | Out-Null
}

Write-Host "       Created: $ScreenshotDir" -ForegroundColor DarkGray

# Step 2: Create configuration
Write-Step "2/5" "Generating session configuration..."

$config = @{
    budget = @{
        maxTimeMinutes = $MaxTimeMinutes
        maxIterations = $MaxIterations
        maxBugsToFix = 5
    }
    scope = @{
        testFlow = $TestFlow
        startFromStep = $null
        skipSteps = @()
    }
    exitConditions = @{
        stopOnFirstBug = $false
        requireCleanRun = $true
        maxConsecutiveFailures = 3
    }
    dataReset = @{
        enabled = $true
        preserveTestAccounts = $true
        cleanupProposals = $true
    }
}

$configPath = Join-Path $TestSessionDir "config.json"
$config | ConvertTo-Json -Depth 4 | Set-Content -Path $configPath -Encoding UTF8

Write-Host "       Config: $configPath" -ForegroundColor DarkGray

# Step 3: Initialize state
Write-Step "3/5" "Initializing session state..."

$state = @{
    session = @{
        id = $SessionId
        startedAt = (Get-Date -Format "o")
        endedAt = $null
        status = "initialized"
    }
    progress = @{
        currentIteration = 0
        currentPhase = "initialization"
        currentStep = "environment_verification"
        completedSteps = @()
        lastScreenshot = $null
    }
    bugs = @{
        found = @()
        fixed = @()
        pending = @()
        wontFix = @()
    }
    metrics = @{
        elapsedMinutes = 0
        testsRun = 0
        testsPassed = 0
        testsFailed = 0
        fixAttempts = 0
        dataResets = 0
    }
}

$statePath = Join-Path $TestSessionDir "state.json"
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $statePath -Encoding UTF8

Write-Host "       State: $statePath" -ForegroundColor DarkGray

# Step 4: Check dev server
Write-Step "4/5" "Checking dev server status..."

if (-not $SkipDevServerCheck) {
    if (Test-DevServer) {
        Write-Host "       Dev server is running at http://localhost:8000" -ForegroundColor Green
    }
    else {
        Write-Host "       WARNING: Dev server not responding at http://localhost:8000" -ForegroundColor Yellow
        Write-Host "       Run 'bun run dev' in the app/ directory first." -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "       Continue anyway? (y/N)"
        if ($continue -ne 'y') {
            Write-Host "Aborted. Start the dev server and try again." -ForegroundColor Red
            exit 1
        }
    }
}
else {
    Write-Host "       Skipped (--SkipDevServerCheck)" -ForegroundColor DarkGray
}

# Step 5: Output orchestration command
Write-Step "5/5" "Session initialized successfully!"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Green
Write-Host " SESSION READY" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Green
Write-Host ""
Write-Host "Session ID:    $SessionId"
Write-Host "Test Flow:     $TestFlow"
Write-Host "Time Budget:   $MaxTimeMinutes minutes"
Write-Host "Max Iterations: $MaxIterations"
Write-Host "Screenshots:   $ScreenshotDir"
Write-Host ""
Write-Host "To start the E2E orchestration, run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  claude '/e2e-testing-orchestrator'" -ForegroundColor White
Write-Host ""
Write-Host "Or with explicit session path:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  claude 'Run E2E testing orchestration with session at $TestSessionDir'" -ForegroundColor White
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Green
```

---

### Task 5: Enhanced Orchestrator Skill Update

**File to Modify:** `.claude/skills/e2e-testing-orchestrator/SKILL.md`

Add the following sections to the existing skill (insert after the ## Prerequisites section):

```markdown
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
   - `elapsedMinutes >= config.budget.maxTimeMinutes` → STOP
   - `currentIteration >= config.budget.maxIterations` → STOP
   - `bugs.fixed.length >= config.budget.maxBugsToFix` → STOP

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
3. **Execute** via mcp-tool-specialist → Supabase MCP:
   - `mcp__supabase__execute_sql` with SELECT queries first (preview)
   - `mcp__supabase__execute_sql` with DELETE queries (cleanup)
4. **Update** `state.metrics.dataResets++`

**Data Reset Rules:**
- ALWAYS target `splitlease-backend-dev` (NEVER production)
- ALWAYS preview with SELECT before DELETE
- ALWAYS preserve test accounts unless explicitly configured otherwise
- DELETE in correct order: rental_applications → proposals → messages

---

## Orchestration Loop (Enhanced)

The enhanced loop incorporates budget checking and state management:

```
┌─────────────────────────────────────────────────────────────────┐
│                 E2E ORCHESTRATION LOOP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 0. BUDGET CHECK                                           │  │
│  │    - Read config.json and state.json                      │  │
│  │    - Calculate elapsed time and progress                  │  │
│  │    - If exceeded → Jump to REPORT phase                   │  │
│  │    - Output budget status                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. ENVIRONMENT VERIFICATION (Phase 1)                     │  │
│  │    - Check dev server at localhost:8000                   │  │
│  │    - Verify Playwright MCP via mcp-tool-specialist        │  │
│  │    - Update state.progress.currentPhase                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. EXECUTE TEST FLOW (Phase 2)                            │  │
│  │    - Run test steps via mcp-tool-specialist               │  │
│  │    - Update state.progress after each step                │  │
│  │    - Save screenshots to session directory                │  │
│  │    - Log bugs to state.bugs.found                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. BUG ANALYSIS (Phase 3.1)                               │  │
│  │    - If no bugs → Skip to VERIFY                          │  │
│  │    - Analyze bugs using bug-analysis-patterns.md          │  │
│  │    - Create bug reports in .claude/plans/New/             │  │
│  │    - Move to state.bugs.pending                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. FIX BUGS (Phase 3.2-3.3)                               │  │
│  │    - Budget check before each fix                         │  │
│  │    - Apply fixes using existing fix patterns              │  │
│  │    - Commit with /git-commits skill                       │  │
│  │    - Move to state.bugs.fixed                             │  │
│  │    - Increment state.metrics.fixAttempts                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. RESET DATA                                             │  │
│  │    - Execute data-reset.sql via Supabase MCP              │  │
│  │    - Preview with SELECT, then DELETE                     │  │
│  │    - Increment state.metrics.dataResets                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. VERIFY (Phase 3.4)                                     │  │
│  │    - Budget check                                         │  │
│  │    - Re-run affected test steps                           │  │
│  │    - If bugs remain → Loop to BUG ANALYSIS                │  │
│  │    - If clean → Continue                                  │  │
│  │    - Increment state.progress.currentIteration            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 7. EXIT CONDITION CHECK                                   │  │
│  │    - Clean run achieved? → REPORT                         │  │
│  │    - Consecutive failures > max? → REPORT                 │  │
│  │    - More bugs to fix? → Loop to BUDGET CHECK             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 8. REPORT (Phase 4)                                       │  │
│  │    - Finalize state.json with end time and status         │  │
│  │    - Generate report in .claude/plans/Documents/          │  │
│  │    - Output summary to user                               │  │
│  │    - Invoke /slack-webhook with results                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---
```

---

### Task 6: Cursor Rules Configuration (Optional)

**File to Create:** `.cursorrules`

This file provides guidance for Cursor IDE when working alongside Claude Code.

```
# Split Lease - Cursor IDE Rules for E2E Testing Orchestration

## Overview

This project uses Claude Code as the primary orchestrator for E2E testing with MCPs (Model Context Protocol). Cursor IDE serves as the development environment for viewing, editing, and debugging code during the orchestration loop.

## MCP Invocation Pattern

CRITICAL: MCPs must be invoked through the orchestration pattern, not directly.

Pattern:
```
Claude Code → mcp-tool-specialist subagent → MCP tools
```

MCPs available:
- Playwright MCP: Browser automation, screenshots, web testing
- Supabase MCP: Database operations, auth, edge functions
- Knip MCP: Dead code detection

## E2E Testing Workflow

When the E2E Testing Orchestrator is running:

1. READ-ONLY in Cursor: During test execution, do not modify files being tested
2. WAIT for fix phase: Claude Code will indicate when fixes are needed
3. ASSIST with debugging: Help identify issues in console output, screenshots
4. VERIFY changes: After Claude Code applies fixes, review the diffs

## Session Files

The `test-session/` directory contains orchestration state:

- `config.json` - Do not modify during session
- `state.json` - Read-only, tracks progress
- `screenshots/` - Test evidence, viewable in Cursor

## Code Conventions

When assisting with bug fixes:

1. Follow existing patterns in the codebase
2. Use 0-indexed days (0=Sunday through 6=Saturday)
3. Only send changed fields in database updates
4. Use hollow component pattern (logic in useXxxPageLogic hooks)
5. Use four-layer logic architecture (calculators → rules → processors → workflows)

## MCP Tool Reference

### Playwright MCP (via mcp-tool-specialist)
- browser_navigate - Navigate to URL
- browser_snapshot - Get page structure (use before interactions)
- browser_click - Click element (requires ref from snapshot)
- browser_type - Type text into element
- browser_take_screenshot - Capture visual evidence

### Supabase MCP (via mcp-tool-specialist)
- execute_sql - Run SQL queries (dev database only)
- list_tables - View database schema
- get_logs - Check edge function logs

## Testing Guidelines

1. Always start dev server before testing: `bun run dev`
2. Test credentials in environment variables (never hardcode)
3. Screenshots saved to `test-session/screenshots/{session-id}/`
4. Bug reports go to `.claude/plans/New/`

## Integration Points

Claude Code orchestrates, Cursor assists:

| Task | Owner | Cursor Role |
|------|-------|-------------|
| Test execution | Claude Code | View screenshots |
| Bug detection | Claude Code | Review console logs |
| Bug analysis | Claude Code | Verify analysis |
| Fix planning | Claude Code | Review plan |
| Fix implementation | Claude Code | Review diff, assist |
| Verification | Claude Code | View retest results |

## Environment Variables

Required for E2E testing (set via PowerShell):
- TESTGUESTEMAILADDRESS - Test guest account email
- TESTPASSWORD - Shared test account password
- TESTHOSTEMAILADDRESS - Test host account email (optional)
```

---

## File Summary

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `test-session/config.schema.json` | Configuration validation schema | HIGH |
| `test-session/config.example.json` | Example configuration | HIGH |
| `test-session/state.schema.json` | State tracking schema | HIGH |
| `test-session/budget-tracker.ts` | Budget tracking logic reference | HIGH |
| `test-session/data-reset.sql` | Test data cleanup queries | HIGH |
| `scripts/Start-E2ESession.ps1` | Session initialization script | MEDIUM |
| `.cursorrules` | Cursor IDE integration | LOW |

### Files to Modify

| File | Modification | Priority |
|------|--------------|----------|
| `.claude/skills/e2e-testing-orchestrator/SKILL.md` | Add session management sections | HIGH |

---

## Referenced Existing Files

| File | Purpose |
|------|---------|
| `.claude/skills/e2e-testing-orchestrator/SKILL.md` | Existing orchestrator skill to enhance |
| `.claude/skills/e2e-testing-orchestrator/references/bug-analysis-patterns.md` | Bug categorization patterns |
| `.claude/skills/e2e-testing-orchestrator/references/test-flows/guest-proposal-flow.md` | Guest journey test flow |
| `.claude/agents/mcp-tool-specialist.md` | MCP routing agent definition |
| `.claude/commands/test_e2e.md` | Basic E2E test runner command |
| `.claude/commands/resolve_failed_e2e_test.md` | Fix workflow command |
| `.mcp.json` | MCP server configuration |
| `.claude/settings.json` | Project settings with hooks |
| `.claude/skills/skill-creator/SKILL.md` | Skill creation guidelines |

---

## Implementation Order

1. **Phase 1 - Core Infrastructure** (Priority: HIGH)
   - Create `test-session/config.schema.json`
   - Create `test-session/config.example.json`
   - Create `test-session/state.schema.json`
   - Create `test-session/budget-tracker.ts`

2. **Phase 2 - Data Management** (Priority: HIGH)
   - Create `test-session/data-reset.sql`

3. **Phase 3 - Skill Enhancement** (Priority: HIGH)
   - Update `.claude/skills/e2e-testing-orchestrator/SKILL.md`

4. **Phase 4 - Automation** (Priority: MEDIUM)
   - Create `scripts/Start-E2ESession.ps1`

5. **Phase 5 - IDE Integration** (Priority: LOW)
   - Create `.cursorrules`

---

## Success Criteria

- [ ] Session can be initialized via PowerShell script
- [ ] Budget limits are enforced and session stops when exceeded
- [ ] State is persisted and can be resumed
- [ ] Test data can be reset via Supabase MCP
- [ ] Orchestration loop follows: Test → Analyze → Fix → Reset → Verify
- [ ] Final report generated with full session metrics
- [ ] Slack notification sent on session completion

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase MCP targets wrong database | Hardcode dev project check in data-reset.sql comments |
| Budget exceeded mid-fix | Check budget before each fix, allow current fix to complete |
| State corruption | Use JSON schemas for validation, backup state before writes |
| Screenshots fill disk | Limit to 100 screenshots per session, warn at 80% |

---

## Notes

- The existing `e2e-testing-orchestrator` skill is comprehensive (816 lines) and covers most test flow logic. The enhancements focus on orchestration management (budget, state, data reset) rather than modifying core test logic.
- The `mcp-tool-specialist` agent pattern is already established and should be strictly followed for all MCP invocations.
- The Cursor IDE integration (`.cursorrules`) is optional and provides guidance for developers using Cursor alongside Claude Code, but is not required for the orchestration to function.
- Windows 11 PowerShell is the target environment; the startup script uses PowerShell 7+ features.
