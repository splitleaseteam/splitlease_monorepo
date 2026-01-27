---
name: audit-coverage-thresholds
description: Audit the codebase to verify test coverage configuration, per-directory thresholds, and CI enforcement. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Coverage Thresholds Audit

You are conducting a comprehensive audit to verify test coverage configuration and identify gaps in coverage threshold settings.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Vitest/Jest configuration** - Look for:
   - `vitest.config.ts` or `vitest.config.js`
   - `jest.config.ts` or `jest.config.js`
   - Coverage provider settings (v8, istanbul)
   - Global threshold settings

2. **Per-directory threshold overrides** - Check for:
   - Critical path thresholds (checkout, payments, auth)
   - Core business logic thresholds (hooks, utils)
   - Reduced thresholds (UI components, pages)

3. **CI configuration** - Look for:
   - `.github/workflows/*.yml`
   - Coverage enforcement in CI
   - Codecov/coverage reporting setup

4. **Coverage ignore patterns** - Check for:
   - `/* istanbul ignore */` comments
   - `/* c8 ignore */` comments
   - Exclude patterns in config

5. **Critical code paths** - Identify:
   - Payment/checkout components
   - Auth context and hooks
   - Webhook handlers
   - API routes

### What to Check for Each Target

For coverage configuration, verify:
- Global thresholds are set (statements, branches, functions, lines)
- Per-directory overrides exist for critical paths
- CI fails on threshold violation
- Coverage reporters configured (text, html, lcov)
- Appropriate files excluded from coverage

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-coverage-thresholds.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Coverage Thresholds Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Coverage config exists: Yes/No
- Global thresholds set: Yes/No
- Per-directory overrides: Yes/No
- CI enforcement: Yes/No

## Configuration Check

### Coverage Provider Status
- [ ] Coverage provider configured (v8/istanbul)
- [ ] Reporters configured (text, html, lcov)
- [ ] Reports directory specified
- [ ] Include patterns defined
- [ ] Exclude patterns defined

### Current Configuration
```typescript
// Found in: vitest.config.ts (or path)
coverage: {
  provider: '?',
  thresholds: {
    statements: ?,
    branches: ?,
    functions: ?,
    lines: ?,
  },
}
```

## Global Threshold Gaps

### Missing or Low Thresholds
| Metric | Current | Recommended | Status |
|--------|---------|-------------|--------|
| Statements | ? | 80% | ? |
| Branches | ? | 75% | ? |
| Functions | ? | 80% | ? |
| Lines | ? | 80% | ? |

## Per-Directory Threshold Gaps

### Critical Paths (Should be 95%+)
| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| src/components/checkout/** | ? | 95% | Missing |
| src/hooks/usePayment.ts | ? | 95% | Missing |
| src/api/webhooks/** | ? | 95% | Missing |
| src/contexts/AuthContext.tsx | ? | 95% | Missing |
| src/lib/stripe/** | ? | 95% | Missing |

### Core Business Logic (Should be 85%+)
| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| src/hooks/useBooking/** | ? | 85% | Missing |
| src/hooks/useListings/** | ? | 85% | Missing |
| src/utils/** | ? | 85% | Missing |

### UI Components (Can be 60%)
| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| src/components/ui/** | ? | 60% | Missing |
| src/pages/** | ? | 60% | Missing |
| src/layouts/** | ? | 60% | Missing |

## Exclude Patterns Check

### Files That Should Be Excluded
| Pattern | Currently Excluded | Status |
|---------|-------------------|--------|
| src/**/*.test.{ts,tsx} | ? | ? |
| src/**/*.spec.{ts,tsx} | ? | ? |
| src/test/** | ? | ? |
| src/mocks/** | ? | ? |
| src/**/*.d.ts | ? | ? |
| src/**/index.ts (barrel files) | ? | ? |
| src/**/*.stories.tsx | ? | ? |
| src/types/** | ? | ? |
| src/generated/** | ? | ? |

## CI Integration Gaps

### GitHub Actions Check
- [ ] Coverage runs in CI
- [ ] Thresholds enforced (fail on violation)
- [ ] Coverage artifacts uploaded
- [ ] Codecov/coverage service configured

### Missing CI Configuration
```yaml
# Recommended addition to CI workflow
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: true
```

## Codecov Configuration Gaps

### Missing codecov.yml
- [ ] File exists
- [ ] Project targets set
- [ ] Patch targets set
- [ ] Per-path flags configured
- [ ] Comment layout configured

## Coverage Ignore Usage

### Excessive Ignore Comments Found
| File | Line | Ignore Type | Reason |
|------|------|-------------|--------|
| path/to/file.ts | 42 | istanbul ignore next | ? |
| path/to/file.ts | 87 | c8 ignore start | ? |

### Potential Overuse of Ignores
Files with more than 3 ignore comments should be reviewed.

## NPM Scripts Check

### Missing Scripts
| Script | Purpose | Status |
|--------|---------|--------|
| test:coverage | Run tests with coverage | ? |
| test:coverage:watch | Watch mode with coverage | ? |
| test:coverage:check | Strict threshold check | ? |

### Recommended Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:watch": "vitest --coverage",
    "test:coverage:check": "vitest run --coverage --coverage.thresholds.100"
  }
}
```

## Current Coverage Levels

### If Coverage Report Exists
| Directory | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| All files | ?% | ?% | ?% | ?% |
| src/components | ?% | ?% | ?% | ?% |
| src/hooks | ?% | ?% | ?% | ?% |
| src/utils | ?% | ?% | ?% | ?% |

## Recommended Configuration

### Complete Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/mocks/**',
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/*.stories.tsx',
        'src/types/**',
        'src/generated/**',
      ],

      thresholds: {
        // Global baseline
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,

        // === CRITICAL PATH (95%+) ===
        'src/components/checkout/**/*.{ts,tsx}': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        'src/hooks/usePayment.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        'src/api/webhooks/**/*.ts': {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        'src/contexts/AuthContext.tsx': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },

        // === CORE BUSINESS (85%+) ===
        'src/hooks/useBooking/**/*.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        'src/hooks/useListings/**/*.ts': {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        'src/utils/**/*.ts': {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },

        // === REDUCED COVERAGE (60%) ===
        'src/components/ui/**/*.tsx': {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60,
        },
        'src/pages/**/*.tsx': {
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
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Recommended Codecov Config
```yaml
# codecov.yml
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
        - src/components/checkout/
        - src/hooks/usePayment.ts
        - src/api/webhooks/
      target: 95%

    core:
      paths:
        - src/hooks/
        - src/utils/
      target: 85%

    ui:
      paths:
        - src/components/ui/
        - src/pages/
      target: 60%

comment:
  layout: "reach,diff,flags,files"
  behavior: default
  require_changes: true
```

### Recommended GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

```

---

## Reference: Coverage Threshold Patterns

### Coverage Metrics Explained

| Metric | What It Measures | Example |
|--------|------------------|---------|
| **Statements** | Lines of executable code covered | `const x = 1; // statement` |
| **Branches** | Decision paths covered (if/else) | `if (x) {} else {}` |
| **Functions** | Function definitions called | `function foo() {}` |
| **Lines** | Physical lines covered | Similar to statements |

**Branch coverage is the most important**—it catches untested edge cases.

### Core Principles

```
1. MEANINGFUL: Cover critical paths, not vanity metrics
2. GRADUATED: Higher thresholds for critical code
3. ENFORCED: Fail CI when thresholds not met
4. PRACTICAL: Allow exceptions for generated/UI code
5. PROGRESSIVE: Increase thresholds over time
```

### Handling Uncoverable Code

#### Istanbul Ignore Comments
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

#### V8 Ignore Comments
```typescript
/* c8 ignore next */
const debugOnly = () => console.log('debug')

/* c8 ignore start */
// Entire block ignored
/* c8 ignore stop */
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| 100% coverage requirement | 80-95% for critical, 60% for UI |
| Same threshold everywhere | Per-directory thresholds |
| Ignoring branch coverage | Branch coverage catches edge cases |
| No CI enforcement | Fail CI on threshold violation |
| Testing for coverage | Test for behavior, measure coverage |
| Ignoring too much code | Minimize ignore comments |

## Output Requirements

1. Be thorough - review ALL configuration files
2. Be specific - include exact paths and current values
3. Be actionable - provide complete configuration templates
4. Only report gaps - do not list configured items unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-coverage-thresholds.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
