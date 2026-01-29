# Coverage Thresholds Opportunity Report

**Generated:** 2026-01-28T08:00:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Status |
|--------|--------|
| Coverage config exists | Yes |
| Global thresholds set | Yes (Low: 30%) |
| Per-directory overrides | No |
| CI enforcement | Yes (Basic) |

## Configuration Check

### Coverage Provider Status

- [x] Coverage provider configured (v8)
- [x] Reporters configured (text, json, html, json-summary)
- [x] Reports directory specified (./coverage)
- [ ] Include patterns defined (missing)
- [ ] Exclude patterns defined (missing)

### Current Configuration

```javascript
// Found in: app/vitest.config.js
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'json-summary'],
  reportsDirectory: './coverage',
  thresholds: {
    statements: 30,
    branches: 25,
    functions: 30,
    lines: 30,
  },
},
```

## Global Threshold Gaps

### Current vs Recommended Thresholds

| Metric | Current | Recommended | Gap | Status |
|--------|---------|-------------|-----|--------|
| Statements | 30% | 80% | -50% | LOW |
| Branches | 25% | 75% | -50% | LOW |
| Functions | 30% | 80% | -50% | LOW |
| Lines | 30% | 80% | -50% | LOW |

**Issue Severity: Medium** - Thresholds exist but are set very low, providing minimal protection against coverage regressions.

## Per-Directory Threshold Gaps

### Critical Paths (Should be 95%+)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `src/logic/calculators/**` | Global 30% | 95% | MISSING |
| `src/logic/rules/**` | Global 30% | 95% | MISSING |
| `src/logic/processors/**` | Global 30% | 95% | MISSING |
| `src/lib/auth.js` | Global 30% | 95% | MISSING |
| `src/lib/priceCalculations.js` | Global 30% | 95% | MISSING |

### Core Business Logic (Should be 85%+)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `src/hooks/**` | Global 30% | 85% | MISSING |
| `src/lib/**` | Global 30% | 85% | MISSING |
| `src/logic/workflows/**` | Global 30% | 85% | MISSING |

### UI Components (Can be 60%)

| Path | Current | Recommended | Status |
|------|---------|-------------|--------|
| `src/islands/shared/**` | Global 30% | 60% | MISSING |
| `src/islands/pages/**` | Global 30% | 60% | MISSING |

## Exclude Patterns Check

### Files That Should Be Excluded

| Pattern | Currently Excluded | Status |
|---------|-------------------|--------|
| `src/**/*.test.{js,jsx}` | No | MISSING |
| `src/**/*.spec.{js,jsx}` | No | MISSING |
| `src/**/*.stories.jsx` | No | MISSING |
| `src/**/*.d.ts` | No | MISSING |
| `src/**/index.js` (barrel files) | No | MISSING |
| `src/routes.config.js` | No | MISSING |

## CI Integration Gaps

### GitHub Actions Check

- [x] Coverage runs in CI (`deploy-frontend-prod.yml`)
- [x] Thresholds enforced (via `check-critical-coverage.sh`)
- [ ] Coverage artifacts uploaded
- [ ] Codecov/coverage service configured

### Current CI Configuration

```yaml
# Found in: .github/workflows/deploy-frontend-prod.yml
- name: Run tests with coverage
  run: bun run test:coverage
  working-directory: ./app

- name: Check critical path coverage
  run: bash .github/scripts/check-critical-coverage.sh
  working-directory: ./app
```

### Coverage Enforcement Script

```bash
# Found in: .github/scripts/check-critical-coverage.sh
MIN_COVERAGE=30  # Very low threshold

# Critical paths defined:
# - scheduling
# - pricing
# - auth
```

**Gap:** The script defines critical paths conceptually but the enforcement is at the global 30% level, not per-path.

## Codecov Configuration Gaps

### Missing codecov.yml

- [ ] File exists - **MISSING**
- [ ] Project targets set
- [ ] Patch targets set
- [ ] Per-path flags configured
- [ ] Comment layout configured

## NPM Scripts Check

### Current Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `test` | Run tests | EXISTS |
| `test:watch` | Watch mode | EXISTS |
| `test:coverage` | Run with coverage | EXISTS |
| `test:ui` | Vitest UI | EXISTS |

### Missing Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `test:coverage:check` | Strict threshold check | MISSING |

## Current Coverage Levels

Based on the test file colocation audit, the codebase has:

- **Total test files:** 12
- **Source files:** ~975
- **Estimated coverage:** 0.9%

The 30% threshold is not currently being challenged because actual coverage is so low.

## Recommended Configuration

### Updated Vitest Config

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',

      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
        'src/**/*.stories.jsx',
        'src/**/index.js',
        'src/routes.config.js',
        'src/**/*.d.ts',
      ],

      thresholds: {
        // Global baseline (increase over time)
        statements: 30,
        branches: 25,
        functions: 30,
        lines: 30,

        // === CRITICAL PATH (95%+) - Add when tests exist ===
        // 'src/logic/calculators/**/*.js': {
        //   statements: 95,
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        // },
        // 'src/logic/rules/**/*.js': {
        //   statements: 95,
        //   branches: 95,
        //   functions: 95,
        //   lines: 95,
        // },

        // === CORE BUSINESS (85%+) - Add when tests exist ===
        // 'src/hooks/**/*.js': {
        //   statements: 85,
        //   branches: 80,
        //   functions: 85,
        //   lines: 85,
        // },

        // === REDUCED COVERAGE (60%) ===
        // 'src/islands/pages/**/*.jsx': {
        //   statements: 60,
        //   branches: 50,
        //   functions: 60,
        //   lines: 60,
        // },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Recommended Codecov Config

```yaml
# codecov.yml (create at project root)
coverage:
  precision: 2
  round: down
  range: "30...100"

  status:
    project:
      default:
        target: 30%  # Current baseline
        threshold: 2%
    patch:
      default:
        target: 80%  # New code should be well-tested
        threshold: 5%

  flags:
    critical:
      paths:
        - src/logic/calculators/
        - src/logic/rules/
        - src/lib/auth.js
      target: 95%

    core:
      paths:
        - src/hooks/
        - src/lib/
      target: 85%

    ui:
      paths:
        - src/islands/
      target: 60%

comment:
  layout: "reach,diff,flags,files"
  behavior: default
  require_changes: true
```

## Summary

| Finding | Severity | Action |
|---------|----------|--------|
| Global thresholds very low (30%) | Medium | Increase incrementally as tests added |
| No per-directory thresholds | Medium | Add for critical paths when tests exist |
| No exclude patterns | Low | Add to avoid counting test/config files |
| No Codecov integration | Low | Add for PR coverage reporting |
| CI enforcement basic | Low | Enhance script for per-path checking |

## Recommendations

### Immediate Actions

- [ ] Add exclude patterns to vitest.config.js
- [ ] Add lcov reporter for CI integration
- [ ] Document coverage expectations in CONTRIBUTING.md

### Short-term (as tests are added)

- [ ] Add per-directory thresholds for critical paths
- [ ] Increase global thresholds to 50% once more tests exist
- [ ] Set up Codecov integration for PR feedback

### Long-term Goals

- [ ] Achieve 80% global coverage
- [ ] 95%+ coverage on `logic/calculators/` and `logic/rules/`
- [ ] 85%+ coverage on hooks and lib utilities
- [ ] Automated coverage trend reporting

## Coverage Threshold Progression Plan

Given the current 0.9% coverage, a gradual approach is recommended:

| Phase | Timeline | Global Target | Critical Path Target |
|-------|----------|---------------|---------------------|
| Current | Now | 30% | N/A |
| Phase 1 | Month 1-2 | 40% | 70% (calculators) |
| Phase 2 | Month 3-4 | 50% | 80% (calculators, rules) |
| Phase 3 | Month 5-6 | 60% | 90% (all critical) |
| Target | Month 6+ | 80% | 95% (all critical) |

