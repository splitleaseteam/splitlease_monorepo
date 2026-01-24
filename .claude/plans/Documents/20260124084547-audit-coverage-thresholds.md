# Coverage Thresholds Audit Report

**Generated:** 2026-01-24 08:45:47 UTC
**Codebase:** Split Lease
**Repository:** splitlease
**Platform:** Windows 11 / PowerShell

---

## Executive Summary

| Metric | Status |
|--------|--------|
| **Coverage config exists** | ❌ No (frontend) / ✅ Yes (Edge Functions) |
| **Global thresholds set** | ❌ No |
| **Per-directory overrides** | ❌ No |
| **CI enforcement** | ❌ No |
| **Test framework installed** | ❌ No |

### Key Findings

- **No test framework configured** for frontend (app/)
- **No coverage thresholds defined** for any code
- **No CI/CD coverage enforcement** in GitHub Actions
- **Deno test runner configured** for Edge Functions (supabase/functions/) but **no thresholds**
- **No coverage service integration** (Codecov, Coveralls, etc.)
- **0% test coverage** across the entire codebase (confirmed in previous audit)
- **No coverage ignore comments** found (because no tests exist)

---

## Configuration Check

### Frontend (app/)

#### Coverage Provider Status
- [ ] Coverage provider configured (v8/istanbul) - **MISSING**
- [ ] Reporters configured (text, html, lcov) - **MISSING**
- [ ] Reports directory specified - **MISSING**
- [ ] Include patterns defined - **MISSING**
- [ ] Exclude patterns defined - **MISSING**

#### Test Framework Status
```json
// app/package.json - NO test dependencies
{
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^9.39.2",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3",
    "vite": "^5.0.0"
    // ❌ No vitest, @vitest/ui, @testing-library, jsdom, etc.
  }
}
```

#### Current Configuration
```javascript
// app/vite.config.js - NO coverage configuration
export default defineConfig({
  plugins: [react()],
  // ❌ No test configuration
  // ❌ No coverage section
  // ❌ No thresholds
});
```

### Edge Functions (supabase/functions/)

#### Coverage Provider Status
- [x] Coverage provider configured (Deno native) - **PARTIAL**
- [ ] Reporters configured (text, html, lcov) - **NO**
- [x] Reports directory specified (coverage/) - **YES**
- [ ] Include patterns defined - **PARTIAL**
- [ ] Exclude patterns defined - **PARTIAL**

#### Current Configuration
```json
// supabase/functions/deno.json
{
  "tasks": {
    "test": "deno test --allow-env --allow-read",
    "test:coverage": "deno test --allow-env --allow-read --coverage=coverage",
    "test:watch": "deno test --allow-env --allow-read --watch"
  },
  "test": {
    "include": ["./**/*_test.ts"],
    "exclude": ["./tests/integration/**"]
  }
}
```

**Status:** Test runner configured but **NO THRESHOLDS** defined.

---

## Global Threshold Gaps

### Missing or Low Thresholds

| Metric | Current | Recommended | Status |
|--------|---------|-------------|--------|
| Statements | **None** | 80% | ❌ Not configured |
| Branches | **None** | 75% | ❌ Not configured |
| Functions | **None** | 80% | ❌ Not configured |
| Lines | **None** | 80% | ❌ Not configured |

---

## Per-Directory Threshold Gaps

### Critical Paths (Should be 95%+)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `app/src/lib/auth.js` | None | 95% | ❌ Not configured |
| `app/src/hooks/useAuthenticatedUser.js` | None | 95% | ❌ Not configured |
| `app/src/logic/workflows/auth/**` | None | 95% | ❌ Not configured |
| `supabase/functions/auth-user/**` | None | 95% | ❌ Not configured |
| `supabase/functions/proposal/**` | None | 95% | ❌ Not configured |
| `supabase/functions/listing/**` | None | 95% | ❌ Not configured |

### Core Business Logic (Should be 85%+)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `app/src/logic/calculators/pricing/**` | None | 85% | ❌ Not configured |
| `app/src/logic/calculators/matching/**` | None | 85% | ❌ Not configured |
| `app/src/logic/rules/proposals/**` | None | 85% | ❌ Not configured |
| `app/src/logic/workflows/booking/**` | None | 85% | ❌ Not configured |
| `app/src/hooks/useDataLookups.js` | None | 85% | ❌ Not configured |

### UI Components (Can be 60%)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `app/src/islands/pages/**` | None | 60% | ❌ Not configured |
| `app/src/islands/modals/**` | None | 60% | ❌ Not configured |
| `app/src/islands/shared/**` | None | 60% | ❌ Not configured |

---

## Exclude Patterns Check

### Files That Should Be Excluded

| Pattern | Currently Excluded | Status |
|---------|-------------------|--------|
| `app/src/**/*.test.{ts,tsx}` | N/A | ⚠️ No tests to exclude |
| `app/src/**/*.spec.{ts,tsx}` | N/A | ⚠️ No tests to exclude |
| `app/src/test/**` | N/A | ⚠️ No test directory |
| `app/src/mocks/**` | N/A | ⚠️ No mocks directory |
| `app/src/**/*.d.ts` | N/A | ⚠️ Should exclude |
| `app/src/**/index.ts` (barrel files) | N/A | ⚠️ Should exclude |
| `app/src/**/*.stories.tsx` | N/A | ⚠️ No stories found |
| `app/src/types/**` | N/A | ⚠️ Should exclude |
| `app/src/generated/**` | N/A | ⚠️ No generated directory |
| `supabase/functions/**/*_test.ts` | ✅ Yes (deno.json) | ✅ Configured |
| `supabase/functions/tests/integration/**` | ✅ Yes (deno.json) | ✅ Configured |

---

## CI Integration Gaps

### GitHub Actions Check

**Existing Workflows:**
- `.github/workflows/claude.yml` - Claude Code automation
- `.github/workflows/claude-code-review.yml` - PR review automation

**CI Coverage Status:**
- [ ] Coverage runs in CI - **NOT CONFIGURED**
- [ ] Thresholds enforced (fail on violation) - **NOT CONFIGURED**
- [ ] Coverage artifacts uploaded - **NOT CONFIGURED**
- [ ] Codecov/coverage service configured - **NOT CONFIGURED**

### Current CI Configuration (No Coverage)

```yaml
# .github/workflows/claude.yml
name: Claude Code

on:
  issue_comment:
    types: [created]
  # ... no coverage steps
```

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    # ... no coverage steps
```

---

## Codecov Configuration Gaps

### Missing codecov.yml

| Check | Status |
|-------|--------|
| File exists | ❌ No |
| Project targets set | ❌ No |
| Patch targets set | ❌ No |
| Per-path flags configured | ❌ No |
| Comment layout configured | ❌ No |

---

## Coverage Ignore Usage

### Excessive Ignore Comments Found

**Result:** No coverage ignore comments found in the codebase.

**Search Results:**
- `istanbul ignore` comments: 0 found
- `c8 ignore` comments: 0 found

**Reason:** Since there are no tests in the codebase, there are no coverage ignore comments.

---

## NPM Scripts Check

### Missing Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `test` | Run tests | ❌ Missing |
| `test:coverage` | Run tests with coverage | ❌ Missing |
| `test:coverage:watch` | Watch mode with coverage | ❌ Missing |
| `test:coverage:check` | Strict threshold check | ❌ Missing |
| `test:ui` | Run tests with UI (watch mode) | ❌ Missing |

### Current NPM Scripts (app/package.json)

```json
{
  "scripts": {
    "dev": "bun run lint && vite --port 3000",
    "dev:test": "bun run lint && vite --port 8010 --strictPort",
    "generate-routes": "node scripts/generate-redirects.js",
    "prebuild": "bun run generate-routes",
    "build": "bun run lint && bun run typecheck && vite build",
    "preview": "vite preview --port 3000",
    "deploy": "node scripts/check-branch.js --require-main && wrangler pages deploy dist --project-name splitlease",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "lint:check": "eslint src/ --max-warnings 0",
    "typecheck": "tsc --noEmit"
    // ❌ No test scripts
  }
}
```

### Edge Functions Deno Tasks (supabase/functions/deno.json)

```json
{
  "tasks": {
    "test": "deno test --allow-env --allow-read",
    "test:coverage": "deno test --allow-env --allow-read --coverage=coverage",
    "test:watch": "deno test --allow-env --allow-read --watch"
  }
}
```

**Status:** Test tasks exist but **no thresholds configured**.

---

## Current Coverage Levels

### If Coverage Report Exists

**Result:** No coverage reports exist.

**Reason:** With only 1 test file in the entire codebase (from previous audit), and no coverage configuration, no coverage reports have been generated.

**Estimated Coverage:** 0% across all directories (confirmed in test file co-location audit).

---

## Recommended Configuration

### Complete Vitest Config (Frontend)

**File:** `app/vitest.config.ts` (NEW FILE)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['app/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'e2e/**',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      all: true,
      include: ['app/src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'app/src/**/*.test.{js,jsx,ts,tsx}',
        'app/src/**/*.spec.{js,jsx,ts,tsx}',
        'app/src/test/**',
        'app/src/mocks/**',
        'app/src/**/*.d.ts',
        'app/src/**/index.{js,ts,jsx,tsx}',
        'app/src/**/*.stories.{jsx,tsx}',
        'app/src/types/**',
        'app/src/generated/**',
        'node_modules',
        'dist',
        'build',
        'e2e/**',
      ],

      thresholds: {
        // === GLOBAL BASELINE ===
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,

        // === CRITICAL PATH (95%+) ===
        // Authentication
        'app/src/lib/auth.js': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        'app/src/hooks/useAuthenticatedUser.js': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        'app/src/logic/workflows/auth/**/*.{js,jsx}': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },

        // Payments & Pricing (when implemented)
        // 'app/src/lib/stripe/**/*.{js,ts}': {
        //   statements: 95,
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        // },
        // 'app/src/hooks/usePayment.{js,ts}': {
        //   statements: 95,
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        // },

        // === CORE BUSINESS LOGIC (85%+) ===
        // Pricing Calculators
        'app/src/logic/calculators/pricing/**/*.{js,jsx}': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        // Matching Algorithm
        'app/src/logic/calculators/matching/**/*.{js,jsx}': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        // Proposal Rules
        'app/src/logic/rules/proposals/**/*.{js,jsx}': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        // Booking Workflows
        'app/src/logic/workflows/booking/**/*.{js,jsx}': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        // Data Lookups
        'app/src/hooks/useDataLookups.js': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },

        // === REDUCED COVERAGE (60%) ===
        // Page Components (Hollow Components)
        'app/src/islands/pages/**/*.{jsx,tsx}': {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60,
        },
        // Modal Components
        'app/src/islands/modals/**/*.{jsx,tsx}': {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60,
        },
        // Shared UI Components
        'app/src/islands/shared/**/*.{jsx,tsx}': {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60,
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/src'),
      '@tests': path.resolve(__dirname, './app/src/test'),
    },
  },
});
```

### Deno Coverage Configuration (Edge Functions)

**File:** `supabase/functions/deno.json` (UPDATE EXISTING)

```json
{
  "tasks": {
    "test": "deno test --allow-env --allow-read",
    "test:coverage": "deno test --allow-env --allow-read --coverage=coverage --coverage-threshold=80",
    "test:watch": "deno test --allow-env --allow-read --watch",
    "test:ci": "deno task --coverage --coverage-threshold=80 --allow-env --allow-read"
  },
  "lint": {
    "include": ["./**/*.ts"],
    "exclude": ["./**/*_test.ts"],
    "rules": {
      "tags": ["recommended"],
      "include": [
        "ban-untagged-todo",
        "no-unused-vars"
      ],
      "exclude": [
        "no-explicit-any"
      ]
    }
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "singleQuote": true,
    "proseWrap": "always"
  },
  "test": {
    "include": ["./**/*_test.ts"],
    "exclude": ["./tests/integration/**"],
    "coverage": [
      "threshold": 80,
      "include": ["./functions/**/*.ts"],
      "exclude": [
        "./**/*_test.ts",
        "./tests/**",
        "./**/*.d.ts"
      ]
    }
  }
}
```

### Recommended NPM Scripts (app/package.json)

```json
{
  "scripts": {
    "dev": "bun run lint && vite --port 3000",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:coverage:watch": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:coverage:check": "vitest run --coverage --reporter=json --reporter=html",
    "generate-routes": "node scripts/generate-redirects.js",
    "prebuild": "bun run generate-routes",
    "build": "bun run lint && bun run typecheck && vite build",
    "preview": "vite preview --port 3000",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "lint:check": "eslint src/ --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^9.39.2",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.0.1",
    "globals": "^17.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.5.6",
    "supabase": "^2.58.5",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3",
    "vite": "^5.0.0",
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8"
  }
}
```

### Test Setup File (NEW)

**File:** `app/src/test/setup.ts` (NEW FILE)

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

---

## GitHub Actions Integration

### Complete Test Workflow (NEW)

**File:** `.github/workflows/test.yml` (NEW FILE)

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./app
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: ./app/package-lock.json

      - name: Install dependencies (Bun)
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        working-directory: ./app
        run: bun install

      - name: Run tests with coverage
        working-directory: ./app
        run: bun run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./app/coverage/lcov.info
          flags: frontend
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload coverage report artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage-report
          path: app/coverage/
          retention-days: 7

  edge-function-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./supabase/functions
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - name: Run Edge Function tests with coverage
        run: deno task test:ci

      - name: Upload Edge Function coverage report
        uses: actions/upload-artifact@v4
        with:
          name: edge-functions-coverage-report
          path: supabase/functions/coverage/
          retention-days: 7

  coverage-check:
    needs: [frontend-tests, edge-function-tests]
    runs-on: ubuntu-latest
    steps:
      - name: All tests passed
        run: echo "✅ Test coverage checks passed"
```

---

## Codecov Configuration

### Complete Codecov Config (NEW)

**File:** `codecov.yml` (NEW FILE - ROOT)

```yaml
coverage:
  precision: 2
  round: down
  range: "70...100"

  status:
    project:
      default:
        target: 80%
        threshold: 2%
    patch:
      default:
        target: 85%
        threshold: 5%

  flags:
    critical:
      paths:
        - app/src/lib/auth.*
        - app/src/hooks/useAuthenticatedUser.*
        - app/src/logic/workflows/auth/**
        - supabase/functions/auth-user/**
        - supabase/functions/proposal/**
        - supabase/functions/listing/**
      target: 95%

    core:
      paths:
        - app/src/logic/calculators/**
        - app/src/logic/rules/proposals/**
        - app/src/logic/workflows/booking/**
        - app/src/hooks/useDataLookups.*
      target: 85%

    ui:
      paths:
        - app/src/islands/pages/**
        - app/src/islands/modals/**
        - app/src/islands/shared/**
      target: 60%

    edge-functions:
      paths:
        - supabase/functions/**/*.ts
      target: 80%

comment:
  layout: "reach,diff,flags,files,footer"
  behavior: default
  require_changes: false
  require_base: false
```

---

## Coverage Metrics Explained

### Metric Definitions

| Metric | What It Measures | Example |
|--------|------------------|---------|
| **Statements** | Lines of executable code covered | `const x = 1; // statement` |
| **Branches** | Decision paths covered (if/else) | `if (x) {} else {}` |
| **Functions** | Function definitions called | `function foo() {}` |
| **Lines** | Physical lines covered | Similar to statements |

### Why Branch Coverage Matters Most

Branch coverage catches untested edge cases like:
- Missing `else` branches
- Unhandled error conditions
- Boundary conditions in loops
- Null/undefined checks

---

## Core Principles

1. **MEANINGFUL**: Cover critical paths, not vanity metrics
2. **GRADUATED**: Higher thresholds for critical code (95% for auth/payments, 85% for business logic, 60% for UI)
3. **ENFORCED**: Fail CI when thresholds not met
4. **PRACTICAL**: Allow exceptions for generated/UI code
5. **PROGRESSIVE**: Increase thresholds over time as coverage improves

---

## Handling Uncoverable Code

### Istanbul Ignore Comments (for Vitest)

```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('debug')
}

/* istanbul ignore else */
if (condition) {
  doSomething()
} else {
  // This else is hard to test
}

/* istanbul ignore if */
if (typeof window === 'undefined') {
  // SSR-only code
}
```

### V8 Ignore Comments (for Deno)

```typescript
/* c8 ignore next */
const debugOnly = () => console.log('debug')

/* c8 ignore start */
// Entire block ignored
/* c8 ignore stop */
```

---

## Anti-Patterns to Flag

| Anti-Pattern | Why It's Problematic | Recommended Instead |
|-------------|----------------------|---------------------|
| 100% coverage requirement | Unrealistic, leads to testing implementation details | 80-95% for critical, 60% for UI |
| Same threshold everywhere | Not all code is equally critical | Per-directory thresholds (95/85/60) |
| Ignoring branch coverage | Branch coverage catches edge cases | Always include branch coverage |
| No CI enforcement | Thresholds are ignored without enforcement | Fail CI on threshold violation |
| Testing for coverage metrics | Write tests for behavior, measure coverage separately | Test behaviors, use coverage as measurement |
| Excessive ignore comments | Hides untested code paths | Minimize ignore comments, use sparingly |

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Install Vitest and testing dependencies
2. ✅ Create `vitest.config.ts` with thresholds
3. ✅ Add test scripts to package.json
4. ✅ Create test setup file

### Phase 2: CI Integration (Week 1-2)
1. ✅ Create GitHub Actions test workflow
2. ✅ Add Codecov configuration
3. ✅ Configure coverage reporting
4. ✅ Set up coverage artifacts

### Phase 3: Edge Functions (Week 2)
1. ✅ Update Deno configuration with thresholds
2. ✅ Add coverage tasks to deno.json
3. ✅ Integrate with CI workflow

### Phase 4: Coverage Growth (Ongoing)
1. Start with global threshold at 50% (realistic starting point)
2. Increment to 60% once tests stabilize
3. Target 80% for global baseline
4. Maintain graduated thresholds (95/85/60)

---

## Migration Commands

### Install Dependencies (app/)

```bash
cd app
bun add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

### Create Configuration Files

```bash
# Create Vitest config
cat > app/vitest.config.ts << 'EOF'
[paste the recommended config above]
EOF

# Create test setup
mkdir -p app/src/test
cat > app/src/test/setup.ts << 'EOF'
[paste the recommended setup above]
EOF
```

### Update package.json Scripts

```bash
cd app
# Add test scripts (manual edit or use jq/npm set)
```

### Update Deno Configuration

```bash
# Update supabase/functions/deno.json with coverage thresholds
# [Manual edit required]
```

---

## Summary

### Critical Gaps Identified

1. **No test framework** for frontend (app/)
2. **No coverage thresholds** configured anywhere
3. **No CI/CD integration** for coverage enforcement
4. **No coverage service** integration (Codecov)
5. **No test scripts** in package.json
6. **0% coverage** across entire codebase

### Immediate Actions Required

1. **Install Vitest** and testing dependencies
2. **Create `vitest.config.ts`** with recommended thresholds
3. **Add test scripts** to package.json
4. **Create GitHub Actions workflow** for CI
5. **Set up Codecov** for coverage reporting
6. **Update Deno config** with Edge Function thresholds
7. **Start with 50% threshold** and grow from there

### Success Criteria

- [ ] Vitest configured with 80% global baseline
- [ ] Per-directory thresholds (95/85/60) defined
- [ ] CI workflow runs tests on every PR
- [ ] CI fails when thresholds not met
- [ ] Coverage reports uploaded to Codecov
- [ ] Edge Functions have 80% threshold
- [ ] Coverage grows from 0% → 50% → 80% over time

---

**Report Generated:** 2026-01-24 08:45:47 UTC
**Audit Duration:** ~15 minutes
**Configuration Files Reviewed:** 5 (package.json, vite.config.js, deno.json, 2 GitHub workflows)
**Recommended Next Step:** Install Vitest and create vitest.config.ts with graduated thresholds
