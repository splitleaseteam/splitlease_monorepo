# Split Lease Codebase Comprehensive Audit Report

**Generated:** 2026-01-28
**Codebase:** Split Lease
**Tech Stack:** React 18 + Vite + Supabase Edge Functions + Cloudflare Pages

---

## Executive Summary

This report consolidates findings from 10 comprehensive audits conducted on the Split Lease codebase. The audits cover code architecture, testing practices, and development patterns.

### Overall Health Score: 5.5/10

| Category | Score | Status |
|----------|-------|--------|
| Code Architecture | 7/10 | Good |
| Test Coverage | 2/10 | Critical |
| Functional Programming | 6.5/10 | Moderate |
| Testing Patterns | 4/10 | Needs Improvement |

### Critical Findings Summary

| Audit | Issues Found | Severity | Priority |
|-------|--------------|----------|----------|
| Test Coverage Thresholds | Low thresholds (30%) | Medium | P1 |
| Test File Colocation | 0.9% coverage, 960+ missing tests | High | P0 |
| Custom Hook Tests | 2/92 hooks tested (2.2%) | High | P0 |
| Form Submission Tests | 0/50+ forms tested | High | P0 |
| Async Loading States | 0 loading state tests | High | P1 |
| Functional Programming | 761 FP violations | Medium | P2 |
| Barrel Files | 32 barrels (low severity) | Low | P3 |
| Orphan Files | 5 files (low severity) | Low | P3 |
| Accessible Query Patterns | Good patterns in place | Low | - |
| MSW Supabase Mocking | Using vi.mock (acceptable) | Low | - |

---

## Audit 1: Barrel Files

**Report:** `20260128070000-barrel-files-audit.md`

### Summary
- **Total barrel files:** 32
- **Highest consumer:** `logic/constants/index.js` (21 consumers)
- **Hub files identified:** `lib/supabase.js` (95), `lib/auth.js` (41), `lib/constants.js` (19)

### Findings
Most barrels are low severity with reasonable consumer counts. The architecture follows good separation of concerns.

### Recommendations
- No immediate action required
- Consider monitoring barrel files with 20+ consumers

---

## Audit 2: Orphan Files

**Report:** `20260128071500-orphan-files-audit.md`

### Summary
- **Orphan files found:** 5
- **Location:** `lib/` directory
- **Files:** dateFormatters.js, hotjar.js, pricingListService.js, safeJson.js, workflowClient.js

### Findings
Most orphans are recent additions or planned utilities. No stale code detected.

### Recommendations
- Review orphan files quarterly
- Low priority for cleanup

---

## Audit 3: Functional Programming

**Report:** `20260128073000-functional-programming-audit.md`

### Summary
- **Files audited:** 1,093
- **Total violations:** 761
- **High priority:** 532
- **Medium priority:** 229
- **FP Score:** 6.5/10

### Violations by Principle

| Principle | Violations | Notes |
|-----------|------------|-------|
| IMMUTABILITY | 395 | Array mutations (push, sort) |
| ERRORS AS VALUES | 216 | Exceptions for validation |
| DECLARATIVE STYLE | 145 | Imperative for loops |
| EFFECTS AT EDGES | 5 | console.log in logic/ |

### Top Priority Fixes
1. Remove 5 console.log statements from `logic/` directory
2. Convert common push-in-loop patterns to spread operator
3. Add ESLint rule to prevent console.* in logic/

---

## Audit 4: Test File Colocation

**Report:** `20260128074500-audit-test-file-colocation.md`

### Summary
- **Source files:** ~975
- **Total test files:** 12
- **Co-located tests:** 7 (0.7%)
- **Centralized tests:** 5 (keep 4, migrate 1)
- **Missing tests:** 960+
- **Coverage:** 0.9%

### Current Test Distribution

| Location | Count | Status |
|----------|-------|--------|
| `hooks/*.test.js` | 2 | Good (co-located) |
| `islands/shared/*.test.jsx` | 4 | Good (co-located) |
| `islands/pages/*.test.jsx` | 1 | Good (co-located) |
| `__tests__/integration/` | 3 | Keep (integration tests) |
| `__tests__/regression/` | 1 | Keep (regression tests) |
| `logic/calculators/matching/__tests__/` | 1 | Migrate |

### Recommendations
1. Migrate `calculateMatchScore.test.js` to co-located position
2. Add tests incrementally starting with P0 files
3. Document test file naming convention

---

## Audit 5: Coverage Thresholds

**Report:** `20260128080000-audit-coverage-thresholds.md`

### Summary
- **Global thresholds:** 30% (low)
- **Per-directory thresholds:** None
- **CI enforcement:** Yes (basic)

### Current Configuration
```javascript
thresholds: {
  statements: 30,
  branches: 25,
  functions: 30,
  lines: 30,
}
```

### Gaps Identified
- No per-directory thresholds for critical paths
- No exclude patterns configured
- No Codecov integration

### Recommendations
1. Add exclude patterns for test/config files
2. Add per-directory thresholds when tests exist
3. Increase global thresholds incrementally

---

## Audit 6: Accessible Query Patterns

**Report:** `20260128081500-audit-accessible-query-patterns.md`

### Summary
- **Tests using accessible queries:** 5/12
- **Tests using brittle selectors:** 4/12
- **Hybrid (uses both):** 3/12

### Findings
The existing tests predominantly use RTL best practices (`getByRole`, `getByText`). Minor improvements possible for CSS class assertions.

### Recommendations
- Add `role="dialog"` to ErrorOverlay component
- Document query pattern preferences

**Status:** Good - No critical issues

---

## Audit 7: MSW Supabase Mocking

**Report:** `20260128083000-audit-msw-supabase-mocking.md`

### Summary
- **MSW installed:** No
- **Current approach:** vi.mock (Vitest manual mocks)
- **Supabase mock coverage:** Partial

### Findings
The codebase uses `vi.mock` for Supabase mocking which is appropriate for the current test coverage level.

### Recommendations
- Create reusable mock factory: `src/test/mocks/supabaseMock.js`
- Consider MSW when adding Playwright E2E tests

**Status:** Acceptable - Current approach is valid

---

## Audit 8: Custom Hook Tests

**Report:** `20260128084500-audit-custom-hook-tests.md`

### Summary
- **Total hooks:** 92
- **Hooks with tests:** 2 (2.2%)
- **Missing tests:** 90

### Hooks by Priority

| Priority | Count | Examples |
|----------|-------|----------|
| P0 | 11 | useAuthenticatedUser, useProposalButtonStates, useScheduleSelector |
| P1 | 12 | useSearchPageLogic, useHostOverviewPageLogic |
| P2 | 10 | useAccountProfilePageLogic, useHostLeasesPageLogic |
| P3 | 15+ | Admin/internal page hooks |

### Recommendations
1. Add tests for `useAuthenticatedUser.js` (auth is critical)
2. Add tests for `useProposalButtonStates.js` (business rules)
3. Add tests for `useScheduleSelectorLogicCore.js` (pricing logic)

**Effort Estimate:** 40-57 hours for P0+P1 hooks

---

## Audit 9: Async Loading States

**Report:** `20260128090000-audit-async-loading-states.md`

### Summary
- **Components with async fetching:** 60+
- **LoadingState components:** 10 (duplicated)
- **Loading state tests:** 1
- **Missing tests:** 59+

### Findings
The codebase has LoadingState components but they are:
1. Duplicated across 9 pages
2. Not tested
3. Potentially missing accessibility features

### Recommendations
1. Consolidate to shared LoadingState component
2. Add loading state tests for SearchPage
3. Ensure proper ARIA attributes

---

## Audit 10: Form Submission Tests

**Report:** `20260128091500-audit-form-submission-tests.md`

### Summary
- **Components with forms:** 50+
- **Form submission tests:** 0
- **High priority forms:** 12
- **Using react-hook-form:** Minimal

### Forms by Priority

| Priority | Count | Examples |
|----------|-------|----------|
| P0 | 12 | Login, Signup, Create Proposal, Edit Listing |
| P1 | 15 | Contact Host, Virtual Meeting, Profile Update |
| P2 | 20+ | Admin forms, Import modals |

### Recommendations
1. Add login/signup form tests
2. Add proposal creation tests
3. Create form test utilities
4. Standardize on react-hook-form

**Effort Estimate:** 46-66 hours for P0+P1 forms

---

## Consolidated Recommendations

### Immediate Actions (Week 1)

| Action | Audit | Priority |
|--------|-------|----------|
| Add useAuthenticatedUser tests | Custom Hooks | P0 |
| Add login/signup form tests | Form Submission | P0 |
| Add SearchPage loading tests | Async States | P0 |
| Remove console.log from logic/ | FP | P0 |

### Short-term (Week 2-4)

| Action | Audit | Priority |
|--------|-------|----------|
| Add tests for P0 hooks (11 hooks) | Custom Hooks | P0 |
| Add tests for P0 forms (12 forms) | Form Submission | P0 |
| Consolidate LoadingState components | Async States | P1 |
| Migrate 1 centralized test | Colocation | P1 |
| Add per-directory coverage thresholds | Coverage | P1 |

### Medium-term (Month 2-3)

| Action | Audit | Priority |
|--------|-------|----------|
| Add tests for P1 hooks | Custom Hooks | P1 |
| Add tests for P1 forms | Form Submission | P1 |
| Increase coverage to 50% | Coverage | P1 |
| Refactor push-in-loop patterns | FP | P2 |

---

## Test Coverage Roadmap

### Current State
- **Test files:** 17
- **Source files:** ~975
- **Coverage:** ~0.9%

### Target State (6 months)
- **Test files:** 200+
- **Coverage:** 60%+
- **P0 areas:** 80%+ coverage

### Priority Order
1. **Week 1-2:** Auth hooks and forms
2. **Week 3-4:** Proposal and listing hooks
3. **Week 5-6:** Schedule selector logic
4. **Week 7-8:** Search and view page logic
5. **Ongoing:** New features include tests

---

## Effort Summary

| Area | Estimated Hours |
|------|-----------------|
| P0 Custom Hook Tests | 22-33 |
| P0 Form Tests | 24-36 |
| P0 Loading State Tests | 10-15 |
| Infrastructure Setup | 8-12 |
| **Total P0 Effort** | **64-96 hours** |

---

## Report Files

All individual audit reports are located in:
```
.claude/plans/Opportunities/260128/
├── 20260128070000-barrel-files-audit.md
├── 20260128071500-orphan-files-audit.md
├── 20260128073000-functional-programming-audit.md
├── 20260128074500-audit-test-file-colocation.md
├── 20260128080000-audit-coverage-thresholds.md
├── 20260128081500-audit-accessible-query-patterns.md
├── 20260128083000-audit-msw-supabase-mocking.md
├── 20260128084500-audit-custom-hook-tests.md
├── 20260128090000-audit-async-loading-states.md
├── 20260128091500-audit-form-submission-tests.md
└── CONSOLIDATED-AUDIT-REPORT.md (this file)
```

---

## Conclusion

The Split Lease codebase has **solid architecture** (islands pattern, four-layer logic, good separation of concerns) but **critically low test coverage** (0.9%). The primary focus should be:

1. **Test the core business logic** - Auth, proposals, pricing, scheduling
2. **Test user interactions** - Forms, loading states, error handling
3. **Incrementally increase coverage** - Start with P0, then P1

The good news is the existing tests follow best practices, providing a template for new tests. The codebase is well-structured for testing - the main gap is simply writing the tests.

**Recommended Next Step:** Start with `useAuthenticatedUser.test.js` and `SignUpLoginModal.test.jsx` - these cover the most critical user flow (authentication) and provide a foundation for other tests.
