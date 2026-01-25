# Accessible Query Patterns Audit Report
**Generated:** 2026-01-24 08:33:05
**Codebase:** Split Lease

## Executive Summary
- Test files reviewed: 1
- Tests with brittle selectors: 0
- High-priority refactors: 0
- Accessibility improvements needed: N/A (no UI tests exist)

## Critical Finding

**The Split Lease codebase has NO React Testing Library or Playwright tests.**

This audit found:
- **1 unit test file** (`calculateMatchScore.test.js`) for pure business logic
- **0 React component tests** using Testing Library
- **0 E2E tests** using Playwright
- **No test infrastructure** (vitest.config.ts, test setup files, mocks)

The one existing test (`calculateMatchScore.test.js`) tests pure JavaScript functions and does NOT use DOM queries, so it does not apply to this audit.

## Query Priority Reference

```
1. getByRole        ← BEST: Accessible, stable
2. getByLabelText   ← Forms: Label associations
3. getByPlaceholder ← Inputs without labels
4. getByText        ← Static content
5. getByTestId      ← Escape hatch for complex UI
6. getByClass/CSS   ← AVOID: Breaks on styling changes
```

## Current Testing State

### Only Test File: `calculateMatchScore.test.js`
**File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
**Type:** Unit test for pure business logic
**DOM Queries:** None
**Status:** ✅ GOOD - This is a well-written unit test that doesn't need accessible queries

This test file:
- Tests pure calculator functions (math, boolean predicates)
- Uses Vitest's `describe`, `it`, `expect` assertions
- Does NOT render React components
- Does NOT query the DOM
- Does NOT need Testing Library queries

**Sample from the test:**
```javascript
describe('calculateBoroughScore', () => {
  it('returns 25 for exact borough match', () => {
    const score = calculateBoroughScore({
      candidateListing: { boroughName: 'Manhattan' },
      proposal: { listing: { boroughName: 'Manhattan' } }
    });
    expect(score).toBe(MATCH_WEIGHTS.BOROUGH);
  });
});
```

## Testing Infrastructure Gap

### What's Missing
| Component | Status |
|-----------|--------|
| Vitest config | ❌ Not created |
| React Testing Library setup | ❌ Not installed |
| Test setup files | ❌ Not created |
| Mock infrastructure | ❌ Not created |
| Component tests | ❌ None exist |
| E2E tests | ❌ None exist |

### Existing Plan (Not Implemented)
A comprehensive testing infrastructure plan exists at:
`.claude/plans/New/20260120-vitest-testing-infrastructure-plan.md`

**This plan includes:**
- Vitest + React Testing Library setup
- Mock infrastructure (Supabase, Google Maps, Framer Motion, Auth)
- Test utilities and helpers
- Testing strategy for the Four-Layer Logic Architecture
- Coverage thresholds per layer
- Implementation roadmap

**Status:** Created 2026-01-20, but NOT yet executed.

## Tests with Good Query Patterns (Reference)

Since no UI tests exist, there are no examples of good accessible query patterns in the codebase. However, the vitest-testing-infrastructure-plan.md document includes proper patterns to follow when tests are created.

## Selector Migration Map

| Current Pattern | Count | Replace With |
|-----------------|-------|--------------|
| N/A - No UI tests | 0 | N/A |

## Component Accessibility Gaps

### Components Missing Accessible Names
Cannot assess - no UI tests exist to verify accessibility attributes.

### Components Needing Test ID
Cannot assess - no UI tests exist to identify which components need test IDs.

## Ambiguous Query Issues

No ambiguous queries exist because there are no DOM-based tests.

## Recommended Next Steps

### 1. Implement Testing Infrastructure (Pre-requisite)
**Priority:** CRITICAL

Before writing any UI tests, implement the testing infrastructure plan:

```bash
# From app/ directory
bun add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Create the following files (all detailed in vitest-testing-infrastructure-plan.md):
- `app/vitest.config.ts`
- `app/src/test/setup.ts`
- `app/src/test/test-utils.tsx`
- `app/src/test/helpers.ts`
- `app/src/test/vitest.d.ts`
- `app/src/test/mocks/supabase.ts`
- `app/src/test/mocks/googleMaps.ts`
- `app/src/test/mocks/framerMotion.ts`
- `app/src/test/mocks/auth.ts`

### 2. Follow Accessible Query Patterns from Day 1

When implementing UI tests, use the Testing Library query priority:

```typescript
// ✅ GOOD - Role-based queries
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('link', { name: 'View all listings' })
screen.getByRole('heading', { name: 'Search Results', level: 2 })

// ✅ GOOD - Label queries for forms
screen.getByLabelText('Email address')
screen.getByLabelText(/password/i)

// ✅ GOOD - Scoped queries for ambiguity
const listingCard = screen.getByTestId('listing-card-123')
within(listingCard).getByRole('button', { name: 'Book' })

// ❌ AVOID - CSS class selectors
page.locator('.btn-primary')
container.querySelector('.listing-card')

// ❌ AVOID - ID selectors
page.locator('#submit-button')
document.getElementById('submit-btn')

// ❌ AVOID - Unspecific role queries
screen.getByRole('button') // Multiple buttons match
```

### 3. ESLint Configuration for Testing Library

Add to `app/eslint.config.js`:

```javascript
import pluginTestingLibrary from 'eslint-plugin-testing-library'

export default [
  // ... existing config
  {
    plugins: {
      'testing-library': pluginTestingLibrary,
    },
    rules: {
      'testing-library/prefer-screen-queries': 'error',
      'testing-library/no-container': 'error',
      'testing-library/no-node-access': 'error',
      'testing-library/prefer-role-queries': 'warn',
    },
  },
]
```

## Testing Strategy by Layer

Based on the Four-Layer Logic Architecture:

### Layer 1: Calculators (Highest Priority)
**Location:** `src/logic/calculators/`
**Status:** Only `calculateMatchScore` has tests
**Recommendation:** Write unit tests for all 14 calculator files
**No DOM queries needed** - these are pure functions

### Layer 2: Rules (High Priority)
**Location:** `src/logic/rules/`
**Status:** No tests exist
**Recommendation:** Write unit tests for all 24 rule files
**No DOM queries needed** - these are boolean predicates

### Layer 3: Processors (Medium Priority)
**Location:** `src/logic/processors/`
**Status:** No tests exist
**Recommendation:** Write unit tests for data transformation functions
**No DOM queries needed** - these transform data

### Layer 4: Workflows (Medium-Low Priority)
**Location:** `src/logic/workflows/`
**Status:** No tests exist
**Recommendation:** Write unit tests for orchestration functions
**May need mocking** but no DOM queries

### UI Components (Future - When Infrastructure Exists)
**Location:** `src/islands/`
**Status:** No tests exist
**Recommendation:** Use accessible queries when writing tests
**Use React Testing Library** with proper query patterns

## Summary

The Split Lease codebase has a **minimal testing footprint** with only one unit test file for business logic. This audit finds **NO instances of brittle query patterns** because there are **NO UI tests** that use DOM queries.

### Key Takeaway

This is actually an **opportunity** - since the codebase is starting from zero with UI testing, following accessible query patterns from the beginning will prevent technical debt around brittle selectors.

### Recommended Action Order

1. **First:** Implement the testing infrastructure plan (`vitest-testing-infrastructure-plan.md`)
2. **Second:** Write unit tests for business logic (calculators, rules, processors, workflows)
3. **Third:** When adding component tests, use accessible query patterns from day one
4. **Fourth:** Add ESLint rules to enforce Testing Library best practices

## Post-Audit Actions

After creating the audit document:

1. ~~Commit and push the audit report to the repository~~ - No commit needed, this is a read-only audit
2. Send webhook notification to TINYTASKAGENT endpoint

---

**Note:** This audit cannot identify brittle selectors in existing tests because no UI tests exist. The vitest-testing-infrastructure-plan.md document should be the guide for implementing tests with proper accessible query patterns from the start.
