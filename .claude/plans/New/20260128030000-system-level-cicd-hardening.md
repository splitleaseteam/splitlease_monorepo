# System-Level CI/CD Hardening Plan

**Date**: 2026-01-28
**Status**: NEW - Ready for Implementation
**Priority**: CRITICAL
**Prerequisite**: [20260128012000-cicd-comprehensive-audit.md](../Documents/20260128012000-cicd-comprehensive-audit.md)

---

## Philosophy

> **"Make the right thing automatic. Make the wrong thing impossible. Make errors visible, never hidden."**

This plan focuses on **structural changes** - automation, validation, and enforcement that work regardless of individual behavior. Human discipline is unreliable; systems are not.

---

## Part 1: CI/CD Enforcement Layer

### Problem
GitHub Actions reports "tests passed" when tests don't run. The `|| true` pattern hides errors.

### System Solution: CI Verification Scripts

#### 1.1 Create Test Verification Script

**File**: `.github/scripts/verify-tests-ran.sh`

```bash
#!/bin/bash
# SYSTEM ENFORCEMENT: Verify tests actually executed and produced results
# This script FAILS if no test output exists or if tests were skipped

set -e

TEST_OUTPUT_FILE="${1:-.vitest-results.json}"
MIN_TESTS_REQUIRED=5  # Minimum tests that must pass for CI to succeed

echo "🔍 Verifying test execution..."

# Check if test output exists
if [ ! -f "$TEST_OUTPUT_FILE" ]; then
    echo "❌ SYSTEM BLOCK: No test results file found at $TEST_OUTPUT_FILE"
    echo "   This means tests did not run. CI cannot pass without test results."
    exit 1
fi

# Parse test results
TESTS_RAN=$(jq '.numTotalTests // 0' "$TEST_OUTPUT_FILE")
TESTS_PASSED=$(jq '.numPassedTests // 0' "$TEST_OUTPUT_FILE")
TESTS_FAILED=$(jq '.numFailedTests // 0' "$TEST_OUTPUT_FILE")

echo "📊 Test Results:"
echo "   Total Tests: $TESTS_RAN"
echo "   Passed: $TESTS_PASSED"
echo "   Failed: $TESTS_FAILED"

# Enforce minimum test count
if [ "$TESTS_RAN" -lt "$MIN_TESTS_REQUIRED" ]; then
    echo "❌ SYSTEM BLOCK: Only $TESTS_RAN tests ran. Minimum required: $MIN_TESTS_REQUIRED"
    echo "   This prevents 'fake' test suites that pass by doing nothing."
    exit 1
fi

# Fail on any test failures
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo "❌ SYSTEM BLOCK: $TESTS_FAILED tests failed."
    exit 1
fi

echo "✅ Test verification passed: $TESTS_PASSED tests executed successfully"
```

#### 1.2 Create TypeScript Verification Script

**File**: `.github/scripts/verify-typescript.sh`

```bash
#!/bin/bash
# SYSTEM ENFORCEMENT: TypeScript errors are NEVER ignored
# The || true pattern is BANNED at the system level

set -e

echo "🔍 Running TypeScript verification..."

# Run typecheck and capture output
TSC_OUTPUT=$(cd app && bun run typecheck 2>&1) || TSC_EXIT=$?

if [ "${TSC_EXIT:-0}" -ne 0 ]; then
    echo "❌ SYSTEM BLOCK: TypeScript errors detected"
    echo ""
    echo "$TSC_OUTPUT"
    echo ""
    echo "📝 TypeScript errors MUST be fixed. The '|| true' escape hatch has been removed."
    echo "   If you believe this is a false positive, open a PR with justification."
    exit 1
fi

# Count errors/warnings even if exit code was 0
ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
WARNING_COUNT=$(echo "$TSC_OUTPUT" | grep -c "warning" || true)

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "❌ SYSTEM BLOCK: $ERROR_COUNT TypeScript errors found"
    echo "$TSC_OUTPUT"
    exit 1
fi

echo "✅ TypeScript verification passed (0 errors, $WARNING_COUNT warnings)"
```

#### 1.3 Update GitHub Actions Workflow

**File**: `.github/workflows/deploy-frontend-prod.yml` (modified)

```yaml
# Add these steps BEFORE deployment

- name: Run unit tests with JSON output
  working-directory: ./app
  run: |
    bun run test:unit:run --reporter=json --outputFile=.vitest-results.json
  # NO continue-on-error - failures block deployment

- name: SYSTEM CHECK - Verify tests actually ran
  run: |
    chmod +x .github/scripts/verify-tests-ran.sh
    .github/scripts/verify-tests-ran.sh app/.vitest-results.json

- name: SYSTEM CHECK - TypeScript verification
  run: |
    chmod +x .github/scripts/verify-typescript.sh
    .github/scripts/verify-typescript.sh
  # NO || true - errors block deployment

- name: SYSTEM CHECK - Lint with zero tolerance
  working-directory: ./app
  run: bun run lint:check  # Uses --max-warnings 0
  # NO continue-on-error
```

#### 1.4 Create Vitest Config for JSON Output

**File**: `app/vitest.config.js` (updated)

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // SYSTEM ENFORCEMENT: Minimum coverage thresholds
      thresholds: {
        statements: 30,  // Start low, increase over time
        branches: 25,
        functions: 30,
        lines: 30,
      },
    },
    // SYSTEM ENFORCEMENT: Fail on coverage threshold violations
    passWithNoTests: false,  // CRITICAL: Empty test suites fail
    // JSON reporter for CI verification
    reporters: ['default', 'json'],
    outputFile: '.vitest-results.json',
  },
});
```

---

## Part 2: Edge Function Sync Automation

### Problem
55 Edge Functions exist, only 28 configured in `config.toml`. No way to detect drift.

### System Solution: Auto-Sync and Validation

#### 2.1 Create Edge Function Registry Script

**File**: `supabase/scripts/sync-edge-functions.js`

```javascript
#!/usr/bin/env node
/**
 * SYSTEM ENFORCEMENT: Edge Function Registry Sync
 *
 * This script:
 * 1. Scans supabase/functions/ for all function directories
 * 2. Compares against config.toml
 * 3. FAILS if any function is missing from config
 * 4. Optionally auto-generates missing config entries
 *
 * Run in CI to block deployments with unregistered functions.
 */

import fs from 'fs';
import path from 'path';
import { parse as parseToml, stringify as stringifyToml } from '@iarna/toml';

const FUNCTIONS_DIR = path.join(process.cwd(), 'supabase/functions');
const CONFIG_FILE = path.join(process.cwd(), 'supabase/config.toml');

// Discover all function directories
function discoverFunctions() {
  const entries = fs.readdirSync(FUNCTIONS_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !entry.name.startsWith('_'))  // Exclude _shared
    .filter(entry => fs.existsSync(path.join(FUNCTIONS_DIR, entry.name, 'index.ts')))
    .map(entry => entry.name);
}

// Parse config.toml for registered functions
function getRegisteredFunctions() {
  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = parseToml(configContent);
  return Object.keys(config.functions || {});
}

// Generate config entry for a function
function generateFunctionConfig(functionName) {
  const hasDenoJson = fs.existsSync(
    path.join(FUNCTIONS_DIR, functionName, 'deno.json')
  );

  const config = {
    enabled: true,
    verify_jwt: false,  // Default - should be reviewed
    entrypoint: `./functions/${functionName}/index.ts`,
  };

  if (hasDenoJson) {
    config.import_map = `./functions/${functionName}/deno.json`;
  }

  return config;
}

// Main execution
function main() {
  const discovered = discoverFunctions();
  const registered = getRegisteredFunctions();

  console.log(`📦 Discovered ${discovered.length} Edge Functions`);
  console.log(`📝 Registered ${registered.length} in config.toml`);

  // Find unregistered functions
  const unregistered = discovered.filter(fn => !registered.includes(fn));

  // Find orphaned registrations (in config but no directory)
  const orphaned = registered.filter(fn => !discovered.includes(fn));

  if (unregistered.length > 0) {
    console.log('\n❌ SYSTEM BLOCK: Unregistered Edge Functions detected:');
    unregistered.forEach(fn => console.log(`   - ${fn}`));
    console.log('\n📝 Add these to supabase/config.toml:');
    console.log('');
    unregistered.forEach(fn => {
      const config = generateFunctionConfig(fn);
      console.log(`[functions.${fn}]`);
      console.log(`enabled = ${config.enabled}`);
      console.log(`verify_jwt = ${config.verify_jwt}`);
      if (config.import_map) {
        console.log(`import_map = "${config.import_map}"`);
      }
      console.log(`entrypoint = "${config.entrypoint}"`);
      console.log('');
    });

    // Auto-fix mode
    if (process.argv.includes('--fix')) {
      console.log('🔧 Auto-fix mode enabled. Updating config.toml...');
      const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      let newContent = configContent;

      unregistered.forEach(fn => {
        const config = generateFunctionConfig(fn);
        newContent += `\n[functions.${fn}]\n`;
        newContent += `enabled = ${config.enabled}\n`;
        newContent += `verify_jwt = ${config.verify_jwt}\n`;
        if (config.import_map) {
          newContent += `import_map = "${config.import_map}"\n`;
        }
        newContent += `entrypoint = "${config.entrypoint}"\n`;
      });

      fs.writeFileSync(CONFIG_FILE, newContent);
      console.log('✅ Config updated. Please review and commit.');
    } else {
      process.exit(1);  // SYSTEM BLOCK
    }
  }

  if (orphaned.length > 0) {
    console.log('\n⚠️ WARNING: Orphaned registrations (no function directory):');
    orphaned.forEach(fn => console.log(`   - ${fn}`));
    console.log('   These should be removed from config.toml');
  }

  if (unregistered.length === 0 && orphaned.length === 0) {
    console.log('\n✅ Edge Function registry is in sync!');
    console.log(`   All ${discovered.length} functions are properly registered.`);
  }
}

main();
```

#### 2.2 Add CI Check for Edge Function Sync

**File**: `.github/workflows/deploy-edge-functions-prod.yml` (add step)

```yaml
- name: SYSTEM CHECK - Edge Function Registry Sync
  run: |
    node supabase/scripts/sync-edge-functions.js
  # Fails deployment if unregistered functions exist
```

#### 2.3 Pre-Commit Hook for Edge Functions

**File**: `.husky/pre-commit` (add to existing)

```bash
# SYSTEM ENFORCEMENT: Edge Function registry check
echo "🔍 Checking Edge Function registry..."
node supabase/scripts/sync-edge-functions.js || {
    echo "❌ Edge Function registry out of sync. Run: node supabase/scripts/sync-edge-functions.js --fix"
    exit 1
}
```

---

## Part 3: Local Development Parity

### Problem
Local environment doesn't match production. Developers can't catch Cloudflare routing issues locally.

### System Solution: Docker-Based Local Stack

#### 3.1 Create Docker Compose for Full Local Stack

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Supabase local stack (replaces supabase start)
  supabase-db:
    image: supabase/postgres:15.1.0.117
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase-db-data:/var/lib/postgresql/data

  supabase-studio:
    image: supabase/studio:20240101
    ports:
      - "54323:3000"
    environment:
      SUPABASE_URL: http://localhost:54321
      STUDIO_PG_META_URL: http://supabase-db:5432

  # Edge Functions local runtime
  edge-functions:
    image: supabase/edge-runtime:v1.45.2
    ports:
      - "54321:9000"
    volumes:
      - ./supabase/functions:/home/deno/functions
    environment:
      SUPABASE_URL: http://supabase-db:5432
      VERIFY_JWT: "false"
    command: ["start", "--main-service", "/home/deno/functions"]

  # Cloudflare Pages local simulator
  cloudflare-pages:
    build:
      context: .
      dockerfile: Dockerfile.cloudflare-local
    ports:
      - "8788:8788"
    volumes:
      - ./app/dist:/app/dist
      - ./app/public/_redirects:/app/_redirects
      - ./app/public/_headers:/app/_headers
    depends_on:
      - edge-functions

  # Frontend dev server
  frontend:
    build:
      context: ./app
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./app/src:/app/src
      - ./app/public:/app/public
    environment:
      VITE_SUPABASE_URL: http://localhost:54321
    depends_on:
      - cloudflare-pages
      - edge-functions

volumes:
  supabase-db-data:
```

#### 3.2 Cloudflare Pages Local Simulator

**File**: `Dockerfile.cloudflare-local`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install miniflare for local Cloudflare Pages simulation
RUN npm install -g miniflare wrangler

COPY app/public/_redirects /_redirects
COPY app/public/_headers /_headers
COPY app/public/_routes.json /_routes.json

# Start miniflare to simulate Cloudflare Pages
CMD ["npx", "wrangler", "pages", "dev", "/app/dist", "--port", "8788", "--local"]
```

#### 3.3 One-Command Local Setup

**File**: `scripts/start-local-stack.sh`

```bash
#!/bin/bash
# SYSTEM: One-command local development that mirrors production
# This ensures developers can't deploy code that breaks in production

set -e

echo "🚀 Starting Split Lease Local Stack..."
echo "   This mirrors production exactly."

# Build frontend
echo "📦 Building frontend..."
cd app && bun run build && cd ..

# Start Docker stack
echo "🐳 Starting services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run Edge Function sync check
echo "🔍 Verifying Edge Function registry..."
node supabase/scripts/sync-edge-functions.js

echo ""
echo "✅ Local stack is running!"
echo ""
echo "   Frontend:        http://localhost:3000"
echo "   Cloudflare Sim:  http://localhost:8788"
echo "   Supabase Studio: http://localhost:54323"
echo "   Edge Functions:  http://localhost:54321"
echo ""
echo "   Run 'docker-compose logs -f' to see all logs"
echo "   Run 'docker-compose down' to stop"
```

#### 3.4 Package.json Integration

**File**: `package.json` (root level, create if needed)

```json
{
  "name": "split-lease-monorepo",
  "scripts": {
    "start": "./scripts/start-local-stack.sh",
    "start:frontend": "cd app && bun run dev",
    "start:edge": "cd supabase && supabase functions serve",
    "stop": "docker-compose down",
    "logs": "docker-compose logs -f",
    "sync:edge-functions": "node supabase/scripts/sync-edge-functions.js",
    "sync:edge-functions:fix": "node supabase/scripts/sync-edge-functions.js --fix"
  }
}
```

---

## Part 4: Error Visibility Infrastructure

### Problem
Errors are hidden (|| true), swallowed (try-catch), or invisible (no monitoring).

### System Solution: Error Surfacing at Every Layer

#### 4.1 Create Error Reporting Wrapper

**File**: `app/src/lib/errorReporting.js`

```javascript
/**
 * SYSTEM ENFORCEMENT: All errors must be reported
 *
 * This module wraps error handling to ensure:
 * 1. Errors are logged to console (development)
 * 2. Errors are sent to Sentry (production)
 * 3. Critical errors trigger Slack alerts
 * 4. Errors are NEVER silently swallowed
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SLACK_WEBHOOK = import.meta.env.VITE_SLACK_ERROR_WEBHOOK;
const IS_PRODUCTION = import.meta.env.PROD;

// Initialize Sentry if in production
let Sentry = null;
if (IS_PRODUCTION && SENTRY_DSN) {
  import('@sentry/react').then(module => {
    Sentry = module;
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
    });
  });
}

/**
 * Report an error. NEVER silently fails.
 */
export function reportError(error, context = {}) {
  // ALWAYS log to console - never hidden
  console.error('[ERROR REPORT]', error, context);

  // Send to Sentry in production
  if (Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  // Critical errors go to Slack
  if (context.critical && SLACK_WEBHOOK) {
    sendSlackAlert(error, context);
  }
}

/**
 * Wrapper for async functions that ensures errors are reported
 */
export function withErrorReporting(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, { ...context, args });
      throw error;  // Re-throw - NEVER swallow
    }
  };
}

/**
 * Wrapper for try-catch that enforces error reporting
 * Use instead of bare try-catch
 */
export async function trySafe(fn, context = {}) {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    reportError(error, context);
    return { data: null, error };
  }
}

async function sendSlackAlert(error, context) {
  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *CRITICAL ERROR*\n\`\`\`${error.message}\`\`\`\nContext: ${JSON.stringify(context)}`,
      }),
    });
  } catch (slackError) {
    // Log Slack failure but don't recursively report
    console.error('[SLACK ALERT FAILED]', slackError);
  }
}
```

#### 4.2 ESLint Rules to Ban Silent Errors

**File**: `app/eslint.config.js` (add rules)

```javascript
// Add to existing config
export default [
  // ... existing config ...
  {
    rules: {
      // SYSTEM ENFORCEMENT: No silent error swallowing
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Custom rule to detect || true patterns
      'no-restricted-syntax': [
        'error',
        {
          selector: 'BinaryExpression[operator="||"][right.raw="true"]',
          message: 'SYSTEM BLOCK: The "|| true" pattern hides errors. Use proper error handling.',
        },
        {
          selector: 'CatchClause[param=null]',
          message: 'SYSTEM BLOCK: Empty catch blocks swallow errors. Use reportError().',
        },
      ],
    },
  },
];
```

#### 4.3 Edge Function Error Reporting

**File**: `supabase/functions/_shared/errorReporting.ts`

```typescript
/**
 * SYSTEM ENFORCEMENT: Edge Function Error Reporting
 * All Edge Function errors must be logged and reported.
 */

const SLACK_WEBHOOK = Deno.env.get('SLACK_ERROR_WEBHOOK');

export interface ErrorContext {
  functionName: string;
  action?: string;
  userId?: string;
  payload?: unknown;
  critical?: boolean;
}

/**
 * Report an error from Edge Functions
 */
export async function reportEdgeFunctionError(
  error: Error,
  context: ErrorContext
): Promise<void> {
  // ALWAYS log - never hidden
  console.error('[EDGE FUNCTION ERROR]', {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // Send to Slack for critical errors or all errors in production
  if (SLACK_WEBHOOK) {
    try {
      await fetch(SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Edge Function Error: ${context.functionName}*\n` +
                `Action: ${context.action || 'unknown'}\n` +
                `Error: \`${error.message}\`\n` +
                `User: ${context.userId || 'anonymous'}`,
        }),
      });
    } catch {
      // Log but don't fail the request
      console.error('[SLACK ALERT FAILED]');
    }
  }
}

/**
 * Wrapper for Edge Function handlers
 */
export function withErrorHandling(
  functionName: string,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (error) {
      await reportEdgeFunctionError(error as Error, { functionName });

      // Return error response - NEVER hide the error from the client
      return new Response(
        JSON.stringify({
          error: true,
          message: (error as Error).message,
          // Include stack in development
          stack: Deno.env.get('DENO_ENV') !== 'production'
            ? (error as Error).stack
            : undefined,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
```

#### 4.4 CI/CD Error Visibility

**File**: `.github/workflows/shared/error-handling.yml`

```yaml
# Reusable workflow for consistent error handling

on:
  workflow_call:
    inputs:
      step_name:
        required: true
        type: string
    secrets:
      SLACK_WEBHOOK:
        required: true

jobs:
  notify-on-failure:
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Send failure notification
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "❌ *CI/CD Failure*\n*Step:* ${{ inputs.step_name }}\n*Branch:* ${{ github.ref_name }}\n*Commit:* ${{ github.sha }}\n*Author:* ${{ github.actor }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Logs>"
            }'
```

---

## Part 5: Regression Prevention Automation

### Problem
Same bugs recur (check-in/checkout broken 13+ times) because no tests exist for critical logic.

### System Solution: Mandatory Test Requirements

#### 5.1 Create Test Coverage Gate Script

**File**: `.github/scripts/check-critical-coverage.sh`

```bash
#!/bin/bash
# SYSTEM ENFORCEMENT: Critical logic MUST have tests
# Deployments blocked if critical files lack test coverage

set -e

CRITICAL_PATHS=(
  "src/logic/calculators/scheduling"
  "src/logic/calculators/pricing"
  "src/logic/rules/scheduling"
  "src/logic/workflows/booking"
  "src/lib/auth.js"
)

MIN_COVERAGE=60  # Percentage

echo "🔍 Checking coverage for critical paths..."

for path in "${CRITICAL_PATHS[@]}"; do
    if [ -d "app/$path" ] || [ -f "app/$path" ]; then
        # Extract coverage from vitest JSON output
        COVERAGE=$(jq -r --arg path "$path" '
          .coverageMap[$path] // {} |
          .s // {} |
          to_entries |
          if length == 0 then 0
          else (map(select(.value > 0)) | length) / length * 100
          end
        ' app/coverage/coverage-final.json 2>/dev/null || echo "0")

        if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
            echo "❌ SYSTEM BLOCK: $path has $COVERAGE% coverage (required: $MIN_COVERAGE%)"
            echo "   This is critical logic that has caused regressions."
            echo "   Add tests before deploying."
            exit 1
        else
            echo "✅ $path: $COVERAGE% coverage"
        fi
    fi
done

echo ""
echo "✅ All critical paths meet coverage requirements"
```

#### 5.2 Create Regression Test Template Generator

**File**: `scripts/generate-regression-test.js`

```javascript
#!/usr/bin/env node
/**
 * SYSTEM: Generate regression test templates for new bug fixes
 *
 * When fixing a bug, run:
 *   node scripts/generate-regression-test.js "BUG-123" "Description of the bug"
 *
 * This creates a test file that:
 * 1. Documents the original bug
 * 2. Tests the fix
 * 3. Prevents the same bug from recurring
 */

const fs = require('fs');
const path = require('path');

const [,, bugId, description] = process.argv;

if (!bugId || !description) {
  console.log('Usage: node scripts/generate-regression-test.js "BUG-123" "Description"');
  process.exit(1);
}

const testContent = `/**
 * Regression Test: ${bugId}
 *
 * Bug Description:
 * ${description}
 *
 * This test ensures the bug does not recur.
 * Created: ${new Date().toISOString()}
 */

import { describe, it, expect } from 'vitest';

describe('Regression: ${bugId}', () => {
  it('should not exhibit the original bug behavior', () => {
    // TODO: Add test for the specific bug scenario
    //
    // Original bug:
    // ${description}
    //
    // Expected behavior after fix:
    // (describe what should happen now)

    expect(true).toBe(true);  // Replace with actual test
  });

  it('should handle the edge case that caused the bug', () => {
    // TODO: Test the specific edge case

    expect(true).toBe(true);  // Replace with actual test
  });
});
`;

const fileName = `${bugId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.test.js`;
const filePath = path.join('app/src/__tests__/regression', fileName);

fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, testContent);

console.log(`✅ Created regression test template: ${filePath}`);
console.log(`   Edit the file to add actual test logic for the bug fix.`);
`;
```

#### 5.3 Pre-Commit Check for Bug Fixes

**File**: `.husky/commit-msg` (create)

```bash
#!/bin/bash
# SYSTEM ENFORCEMENT: Bug fixes MUST include tests

COMMIT_MSG=$(cat "$1")

# Check if this is a bug fix commit
if echo "$COMMIT_MSG" | grep -qiE "^fix(\([^)]+\))?:"; then
    echo "🔍 Detected bug fix commit. Checking for tests..."

    # Get staged test files
    STAGED_TESTS=$(git diff --cached --name-only | grep -E "\.test\.(js|jsx|ts|tsx)$" || true)

    if [ -z "$STAGED_TESTS" ]; then
        echo ""
        echo "⚠️  WARNING: Bug fix without test"
        echo ""
        echo "   Your commit message suggests this is a bug fix, but no test files"
        echo "   are included. Consider adding a regression test to prevent recurrence."
        echo ""
        echo "   Generate a template: node scripts/generate-regression-test.js 'BUG-ID' 'Description'"
        echo ""
        echo "   If you're sure no test is needed, use: git commit --no-verify"
        echo ""
        # Warning only, not blocking (for now)
    else
        echo "✅ Test files included with bug fix:"
        echo "$STAGED_TESTS" | sed 's/^/   /'
    fi
fi
```

---

## Part 6: Branch Protection Enforcement

### Problem
Direct commits to main bypass all checks.

### System Solution: GitHub Branch Protection + Local Enforcement

#### 6.1 GitHub Branch Protection Rules (via API)

**File**: `scripts/setup-branch-protection.sh`

```bash
#!/bin/bash
# SYSTEM: Configure GitHub branch protection rules
# Run once during initial setup

REPO_OWNER="splitleaseteam"
REPO_NAME="splitlease"
BRANCH="main"

# Requires GITHUB_TOKEN with admin:repo scope
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable required"
    exit 1
fi

echo "🔒 Configuring branch protection for $BRANCH..."

curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "Build & Deploy to Cloudflare Pages",
        "SYSTEM CHECK - Verify tests actually ran",
        "SYSTEM CHECK - TypeScript verification",
        "SYSTEM CHECK - Edge Function Registry Sync"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "required_linear_history": false,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'

echo "✅ Branch protection configured"
```

#### 6.2 Local Git Hook to Prevent Direct Main Commits

**File**: `.husky/pre-push`

```bash
#!/bin/bash
# SYSTEM ENFORCEMENT: Prevent direct pushes to main

CURRENT_BRANCH=$(git branch --show-current)
PROTECTED_BRANCHES=("main" "master" "production")

for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "$CURRENT_BRANCH" = "$branch" ]; then
        echo ""
        echo "❌ SYSTEM BLOCK: Direct push to '$branch' is not allowed"
        echo ""
        echo "   Create a feature branch instead:"
        echo "   git checkout -b feature/your-feature-name"
        echo "   git push origin feature/your-feature-name"
        echo ""
        echo "   Then create a Pull Request for review."
        echo ""
        exit 1
    fi
done

echo "✅ Pushing to branch: $CURRENT_BRANCH"
```

---

## Part 7: Documentation Drift Prevention

### Problem
README says 17 Edge Functions, reality is 55. Documentation rots.

### System Solution: Auto-Generated Documentation

#### 7.1 Create Documentation Generator

**File**: `scripts/generate-docs.js`

```javascript
#!/usr/bin/env node
/**
 * SYSTEM: Auto-generate documentation from source code
 * This ensures documentation matches reality.
 *
 * Run in CI to update docs automatically.
 */

const fs = require('fs');
const path = require('path');

// Generate Edge Functions list
function generateEdgeFunctionsDocs() {
  const functionsDir = path.join(process.cwd(), 'supabase/functions');
  const functions = fs.readdirSync(functionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))
    .filter(d => fs.existsSync(path.join(functionsDir, d.name, 'index.ts')));

  let content = `# Edge Functions Reference

> ⚠️ **This file is auto-generated. Do not edit manually.**
> Run \`node scripts/generate-docs.js\` to update.

**Total Functions:** ${functions.length}
**Last Updated:** ${new Date().toISOString()}

## Functions List

| Function | Description |
|----------|-------------|
`;

  for (const func of functions) {
    const indexPath = path.join(functionsDir, func.name, 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf8');

    // Extract first comment line as description
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\/|\/\/.*$/m);
    const description = commentMatch
      ? commentMatch[0].replace(/[/*]/g, '').trim().split('\n')[0]
      : 'No description';

    content += `| \`${func.name}\` | ${description} |\n`;
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'supabase/FUNCTIONS.md'),
    content
  );

  console.log(`✅ Generated Edge Functions docs: ${functions.length} functions`);
}

// Generate component inventory
function generateComponentDocs() {
  const pagesDir = path.join(process.cwd(), 'app/src/islands/pages');
  const pages = fs.readdirSync(pagesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() || d.name.endsWith('.jsx'));

  let content = `# Page Components Reference

> ⚠️ **This file is auto-generated. Do not edit manually.**

**Total Pages:** ${pages.length}
**Last Updated:** ${new Date().toISOString()}

## Pages

`;

  for (const page of pages) {
    content += `- \`${page.name}\`\n`;
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'app/PAGES.md'),
    content
  );

  console.log(`✅ Generated Page Components docs: ${pages.length} pages`);
}

// Main
generateEdgeFunctionsDocs();
generateComponentDocs();
```

#### 7.2 CI Step to Verify Docs Are Current

**File**: `.github/workflows/verify-docs.yml`

```yaml
name: Verify Documentation

on:
  push:
    paths:
      - 'supabase/functions/**'
      - 'app/src/islands/pages/**'

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate docs
        run: node scripts/generate-docs.js

      - name: Check for uncommitted changes
        run: |
          if [[ -n $(git status --porcelain) ]]; then
            echo "❌ SYSTEM BLOCK: Documentation is out of date"
            echo ""
            echo "Run 'node scripts/generate-docs.js' and commit the changes."
            git diff
            exit 1
          fi
          echo "✅ Documentation is up to date"
```

---

## Implementation Checklist

### Phase 1: Immediate (Day 1)

- [ ] Create `.github/scripts/verify-tests-ran.sh`
- [ ] Create `.github/scripts/verify-typescript.sh`
- [ ] Update GitHub Actions to use verification scripts
- [ ] Update `app/package.json` test command
- [ ] Update `app/vitest.config.js` with `passWithNoTests: false`

### Phase 2: This Week

- [ ] Create `supabase/scripts/sync-edge-functions.js`
- [ ] Add Edge Function sync to CI
- [ ] Create `.husky/pre-commit` hook
- [ ] Create `.husky/pre-push` hook
- [ ] Create `.husky/commit-msg` hook
- [ ] Run `scripts/setup-branch-protection.sh`

### Phase 3: Next Week

- [ ] Create Docker Compose local stack
- [ ] Create `app/src/lib/errorReporting.js`
- [ ] Create `supabase/functions/_shared/errorReporting.ts`
- [ ] Update ESLint rules to ban silent errors
- [ ] Create regression test template generator

### Phase 4: This Month

- [ ] Set up Sentry integration
- [ ] Create documentation generator
- [ ] Add coverage gates for critical paths
- [ ] Create test coverage dashboard

---

## Files to Create/Modify

### New Files
- `.github/scripts/verify-tests-ran.sh`
- `.github/scripts/verify-typescript.sh`
- `.github/scripts/check-critical-coverage.sh`
- `supabase/scripts/sync-edge-functions.js`
- `scripts/start-local-stack.sh`
- `scripts/generate-regression-test.js`
- `scripts/generate-docs.js`
- `scripts/setup-branch-protection.sh`
- `docker-compose.yml`
- `Dockerfile.cloudflare-local`
- `.husky/pre-commit`
- `.husky/pre-push`
- `.husky/commit-msg`
- `app/src/lib/errorReporting.js`
- `supabase/functions/_shared/errorReporting.ts`

### Modified Files
- `.github/workflows/deploy-frontend-prod.yml`
- `.github/workflows/deploy-edge-functions-prod.yml`
- `app/vitest.config.js`
- `app/eslint.config.js`
- `app/package.json`
- `package.json` (root)
- `supabase/config.toml` (add missing functions)

---

**This plan transforms behavioral guidelines into structural enforcement. The system prevents errors, corrects drift, and surfaces problems immediately - without relying on human discipline.**
