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
