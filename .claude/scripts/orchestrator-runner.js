/**
 * Self-Healing Debug Orchestrator Runner
 *
 * Orchestrates a multi-pass debugging workflow for the Host Proposals payment bug.
 * Scheduled to run at 11 PM EST with a 4-hour maximum runtime.
 *
 * Passes:
 * 1. Investigation - Gather bug catalog
 * 2. Planning - Create fix strategy
 * 3. Implementation - Apply fixes with Playwright verification
 * 4. Verification - E2E testing and log analysis
 */

import { spawn } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  maxRuntime: 4 * 60 * 60 * 1000, // 4 hours in ms
  maxIterations: 8,
  iterationTimeout: 30 * 60 * 1000, // 30 min per iteration
  projectRoot: join(__dirname, '..', '..'),
  logFile: join(__dirname, '..', 'logs', 'orchestrator-run.log'),
  stateFile: join(__dirname, '..', 'state', 'orchestrator-state.json'),
  planFile: join(__dirname, '..', 'plans', 'New', '20260129-host-proposals-payment-bug-orchestrator.md')
};

const PASSES = {
  INVESTIGATE: 'investigate',
  PLAN: 'plan',
  IMPLEMENT: 'implement',
  VERIFY: 'verify'
};

// Ensure directories exist
function ensureDirs() {
  [join(__dirname, '..', 'logs'), join(__dirname, '..', 'state'), join(__dirname, '..', 'screenshots')]
    .forEach(dir => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); });
}

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  try { appendFileSync(CONFIG.logFile, logMessage + '\n'); } catch (e) { /* ignore */ }
}

// State management
function loadState() {
  if (existsSync(CONFIG.stateFile)) {
    return JSON.parse(readFileSync(CONFIG.stateFile, 'utf-8'));
  }
  return {
    startTime: Date.now(),
    currentPass: PASSES.INVESTIGATE,
    iteration: 0,
    bugs: [],
    fixes: [],
    testResults: [],
    completed: false
  };
}

function saveState(state) {
  writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// Execute Claude CLI command
function executeClaudeCommand(prompt, timeout = CONFIG.iterationTimeout) {
  return new Promise((resolve, reject) => {
    log(`Executing Claude command (timeout: ${Math.round(timeout / 60000)} min)`);

    const child = spawn('claude', [
      '-p', prompt,
      '--allowedTools', 'Task,Bash,Read,Write,Edit,Grep,Glob'
    ], {
      cwd: CONFIG.projectRoot,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Command timeout'));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0
        ? { success: true, output: stdout }
        : { success: false, output: stdout, error: stderr, code });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Pass 1: Investigation
async function runInvestigationPass(state) {
  log('=== PASS 1: INVESTIGATION ===', 'PASS');

  const prompt = `You are investigating a bug in the Host Proposals page where payments are sometimes shown calculated FOR the host instead of showing host COMPENSATION.

TASK:
1. Read app/src/islands/pages/HostProposalsPage/PricingRow.jsx
2. Read app/src/islands/pages/HostProposalsPage/ProposalCard.jsx
3. Identify ALL locations where guest payment fields might be used instead of host compensation fields
4. Write a JSON bug catalog to .claude/state/bug-catalog.json with format:
   { "bugs": [{ "id": 1, "file": "...", "line": 54, "issue": "...", "severity": "HIGH|MEDIUM|LOW" }] }

KEY FIELDS:
- HOST (correct for earnings): 'host compensation', 'Total Compensation (proposal - host)'
- GUEST (wrong for earnings): 'proposal nightly price', 'Total Price for Reservation (guest)'`;

  try {
    const result = await executeClaudeCommand(prompt, 30 * 60 * 1000);
    state.currentPass = PASSES.PLAN;
    log(`Investigation complete`);
    return result.success;
  } catch (err) {
    log(`Investigation failed: ${err.message}`, 'ERROR');
    return false;
  }
}

// Pass 2: Planning
async function runPlanningPass(state) {
  log('=== PASS 2: PLANNING ===', 'PASS');

  const prompt = `Read the bug catalog from .claude/state/bug-catalog.json and create a fix plan.

For each bug, specify the exact code change needed.

Write the fix plan to .claude/state/fix-plan.json with format:
{
  "fixes": [{
    "bugId": 1,
    "file": "...",
    "oldCode": "const totalEarnings = ...",
    "newCode": "const hostCompensation = proposal?.['Total Compensation (proposal - host)'] || 0; const totalEarnings = ..."
  }]
}`;

  try {
    const result = await executeClaudeCommand(prompt, 30 * 60 * 1000);
    state.currentPass = PASSES.IMPLEMENT;
    log(`Planning complete`);
    return result.success;
  } catch (err) {
    log(`Planning failed: ${err.message}`, 'ERROR');
    return false;
  }
}

// Pass 3: Implementation with Playwright
async function runImplementationPass(state) {
  log('=== PASS 3: IMPLEMENTATION ===', 'PASS');

  const prompt = `Read fix plan from .claude/state/fix-plan.json and implement each fix.

For each fix:
1. Apply the code change using Edit tool
2. Use Task tool with mcp-tool-specialist subagent to invoke Playwright MCP:
   - Navigate to http://localhost:8000/host-proposals
   - Take a snapshot to verify payment displays
   - Check that "Your Compensation" shows valid dollar amounts
3. If test fails, use mcp-tool-specialist to invoke Supabase MCP get_logs to debug

Write results to .claude/state/implementation-results.json`;

  try {
    const result = await executeClaudeCommand(prompt, 2 * 60 * 60 * 1000);
    state.currentPass = PASSES.VERIFY;
    return result.success;
  } catch (err) {
    log(`Implementation failed: ${err.message}`, 'ERROR');
    return false;
  }
}

// Pass 4: Verification
async function runVerificationPass(state) {
  log('=== PASS 4: FINAL VERIFICATION ===', 'PASS');

  const prompt = `Run final verification of Host Proposals payment fixes.

1. Use mcp-tool-specialist for Playwright MCP:
   - Navigate to host proposals page
   - Verify ALL proposal cards show valid "Your Compensation" amounts
   - Open a proposal modal and verify PricingRow shows "Your Earnings"
   - Take screenshots

2. Run: bun run build (verify no build errors)

3. Write final report to .claude/state/verification-report.json:
   { "allTestsPassed": boolean, "finalStatus": "SUCCESS|PARTIAL|FAILED" }`;

  try {
    const result = await executeClaudeCommand(prompt, 60 * 60 * 1000);
    state.completed = true;
    log(`Verification complete`);
    return result.success;
  } catch (err) {
    log(`Verification failed: ${err.message}`, 'ERROR');
    return false;
  }
}

// Main orchestration
async function main() {
  ensureDirs();
  log('=== SELF-HEALING DEBUG ORCHESTRATOR STARTED ===');
  log(`Max runtime: ${CONFIG.maxRuntime / (60 * 60 * 1000)} hours`);
  log(`Max iterations: ${CONFIG.maxIterations}`);

  const state = loadState();

  try {
    // Resume from current pass
    if (state.currentPass === PASSES.INVESTIGATE) {
      if (!await runInvestigationPass(state)) {
        log('Investigation pass failed. Aborting.', 'ERROR');
        process.exit(1);
      }
      saveState(state);
    }

    if (state.currentPass === PASSES.PLAN) {
      if (!await runPlanningPass(state)) {
        log('Planning pass failed. Aborting.', 'ERROR');
        process.exit(1);
      }
      saveState(state);
    }

    if (state.currentPass === PASSES.IMPLEMENT) {
      await runImplementationPass(state);
      saveState(state);
    }

    if (state.currentPass === PASSES.VERIFY) {
      const success = await runVerificationPass(state);
      state.completed = success;
      saveState(state);

      if (success) {
        log('=== ALL FIXES VERIFIED SUCCESSFULLY ===', 'SUCCESS');
        process.exit(0);
      } else {
        log('=== VERIFICATION INCOMPLETE - MANUAL REVIEW REQUIRED ===', 'WARN');
        process.exit(1);
      }
    }
  } catch (err) {
    log(`Orchestrator error: ${err.message}`, 'ERROR');
    saveState(state);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1]?.includes('orchestrator-runner')) {
  main();
}

export { main, CONFIG, PASSES };
