# Split Lease Codebase State Report

**Generated**: 2026-01-30
**Analysis Type**: Comprehensive Multi-Agent Deep Dive
**Scope**: Full codebase (`app/` + `supabase/` + cross-cutting)

---

## Executive Summary

| Domain | Health | Critical Issues | Recommendations |
|--------|--------|-----------------|-----------------|
| **Frontend (app/)** | MODERATE | 202 unused files, hollow component violations | Major cleanup needed |
| **Backend (supabase/)** | GOOD | Admin auth bypass, no input sanitization | Security fixes required |
| **Cross-Cutting** | MODERATE | Hardcoded prod URLs, 85 stale plans | Maintenance debt |

**Overall Assessment**: The codebase has solid architectural foundations but suffers from accumulated technical debt, particularly dead code and stale plans. Security gaps in Edge Functions require immediate attention.

---

## Part 1: Frontend Analysis (app/)

### Architecture Scorecard

| Area | Rating | Key Finding |
|------|--------|-------------|
| Islands Architecture | GOOD | Correctly implemented with independent React roots |
| Component Structure | MODERATE | Inconsistent subdirectory patterns |
| Route Configuration | EXCELLENT | Single source of truth in `routes.config.js` (70+ routes) |
| State Management | GOOD | Appropriate mix of useState, URL params, Zustand |
| Four-Layer Logic | GOOD | Well-structured calculators/rules/processors/workflows |
| Hollow Components | INCONSISTENT | SearchPage compliant, HomePage violates (14+ useState) |

### Critical Issues

#### 1. Dead Code Epidemic (CRITICAL)
**202 unused files detected** consuming bundle size and cognitive overhead.

| Module | Files | Status |
|--------|-------|--------|
| `src/islands/shared/AIRoomRedesign/` | 9 | UNUSED |
| `src/islands/shared/AISuggestions/` | 7 | UNUSED |
| `src/islands/shared/DateChangeRequestManager/` | 11 | UNUSED |
| `src/islands/pages/ViewSplitLeasePage_LEGACY/` | ? | LEGACY |

#### 2. Unused Dependencies (HIGH)
**9 unused production dependencies** in `package.json`:
- `@hookform/resolvers`
- `@react-google-maps/api`
- `react-datepicker`
- `react-dropzone`
- `react-hook-form`
- `zod`
- (+ 3 others)

**Estimated bundle bloat**: ~500KB

#### 3. Hollow Component Violations (HIGH)
`HomePage.jsx` (840 lines) has:
- 14+ useState hooks at lines 184, 355-360, 691-697
- Embedded business logic that should be in `useHomePageLogic.js`

### Test Coverage Gaps

| Logic Layer | Files | Tested | Coverage |
|-------------|-------|--------|----------|
| calculators | 15 | 5 | 33% |
| rules | 22 | 8 | 36% |
| processors | 14 | 3 | 21% |
| workflows | 12 | 2 | 17% |

**Critical untested workflows**:
- `cancelProposalWorkflow.js`
- `virtualMeetingWorkflow.js`

---

## Part 2: Backend Analysis (supabase/)

### Architecture Scorecard

| Area | Rating | Key Finding |
|------|--------|-------------|
| Edge Function Architecture | A | Consistent action-based routing |
| FP Patterns | A | Immutable Result type, pure functions |
| Error Handling | A- | Custom error classes, Slack reporting |
| Database Design | A- | Extensive indexing, RLS enabled |
| Security | B | Gaps in auth validation and input sanitization |
| Integration | A | Well-implemented queue-based sync |

### Critical Security Issues

#### 1. Admin Actions Without Authentication (HIGH)
**Location**: `messages/index.ts:85-92`

```typescript
// These admin functions are in PUBLIC_ACTIONS - NO AUTH REQUIRED
- admin_get_all_threads
- admin_delete_thread
- admin_send_reminder
```

**Risk**: Any unauthenticated caller can perform admin operations.

#### 2. No Input Sanitization (HIGH)
**Location**: `proposal/actions/create.ts:408-413`

User-provided text fields stored directly without sanitization:
- `aboutMe`
- `needForSpace`
- `comment`

**Risk**: XSS or injection vectors.

#### 3. Token Presence Without Validation (MEDIUM)
**Location**: `send-email/index.ts`, `send-sms/index.ts`

Token existence is checked but not validated against auth service.

### Database Strengths

- Comprehensive indexing for query performance
- RLS enabled on key tables
- Idempotent migrations
- Queue-based Bubble sync with atomic operations

---

## Part 3: Cross-Cutting Analysis

### Critical Issues

#### 1. Hardcoded Production URLs (HIGH)
**Location**: `app/src/islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx`

**6 instances** where missing `VITE_SUPABASE_URL` falls back to production:
- Lines: 224-225, 308-309, 398-399, 517, 660, 782

**Risk**: Development traffic hitting production database.

#### 2. Stale Plans Backlog (HIGH)
**85 pending plans** in `.claude/plans/New/` including:
- Code refactors
- Bug investigations
- Feature implementations
- Migrations

### Consistency Issues

| Pattern | Status | Issue |
|---------|--------|-------|
| Day indexing (0=Sunday) | CONSISTENT | None |
| API action naming | INCONSISTENT | snake_case vs camelCase vs kebab-case |
| Error response format | INCONSISTENT | No standardized format |
| TypeScript types | FRAGMENTED | No shared definitions frontend/backend |

### Documentation Gaps

| Document | Reality | Gap |
|----------|---------|-----|
| supabase/CLAUDE.md | Documents 9 Edge Functions | 53 actually exist |
| Port configuration | Docs say 8000 | Scripts use 3000 |
| Feature flags | 3 declared in vite-env.d.ts | Not in .env files |

---

## Consolidated Recommendations

### Priority 0 (IMMEDIATE - Security)

| # | Action | Location | Impact |
|---|--------|----------|--------|
| 1 | Add authentication to admin actions | `messages/index.ts:85-92` | Prevents unauthorized admin access |
| 2 | Implement input sanitization | `proposal/actions/create.ts` | Prevents XSS/injection |
| 3 | Remove hardcoded production URLs | `AiSignupMarketReport.jsx` | Prevents data exposure |

### Priority 1 (HIGH - Technical Debt)

| # | Action | Impact |
|---|--------|--------|
| 4 | Delete 202 unused files | ~500KB bundle reduction, cleaner codebase |
| 5 | Remove 9 unused dependencies | Faster installs, smaller bundle |
| 6 | Refactor HomePage.jsx to hollow pattern | Maintainability, testability |
| 7 | Validate tokens properly in send-email/send-sms | Security posture |

### Priority 2 (MEDIUM - Maintenance)

| # | Action | Impact |
|---|--------|--------|
| 8 | Triage 85 plans in `.claude/plans/New/` | Reduced visibility debt |
| 9 | Update supabase/CLAUDE.md for 53 Edge Functions | Developer onboarding |
| 10 | Standardize API action naming to snake_case | Consistency |
| 11 | Add tests for critical workflows | Coverage from 17% → 50%+ |
| 12 | Create `dev:quick` script without lint/knip | Faster iteration |

### Priority 3 (LOW - Nice to Have)

| # | Action | Impact |
|---|--------|--------|
| 13 | Enable TypeScript strict mode | Type safety |
| 14 | Consolidate duplicate files | DRY compliance |
| 15 | Review 3 animation libraries for redundancy | Bundle size |
| 16 | Add pre-commit hooks | Code quality gates |

---

## Recommended Implementation Sequence

```
Week 1: Security Hardening
├─ P0.1: Fix admin auth bypass in messages/
├─ P0.2: Add input sanitization to proposal/
└─ P0.3: Remove hardcoded production URLs

Week 2: Dead Code Purge
├─ P1.4: Run knip --fix to remove unused files
├─ P1.5: Remove unused dependencies from package.json
└─ Run full test suite to validate

Week 3: Architecture Compliance
├─ P1.6: Refactor HomePage.jsx → useHomePageLogic.js
├─ P2.11: Add tests for cancelProposalWorkflow, virtualMeetingWorkflow
└─ P1.7: Proper token validation in send-email/send-sms

Week 4: Documentation & Maintenance
├─ P2.8: Triage .claude/plans/New/ (archive or execute)
├─ P2.9: Update supabase/CLAUDE.md
└─ P2.10: Standardize API action naming
```

---

## Appendix: Detailed Analysis Files

Full analysis documents with line-by-line findings:

1. `20260130-app-directory-exhaustive-analysis.md` - Frontend deep dive
2. `20260130_supabase_directory_analysis.md` - Backend deep dive
3. `20260130-cross-cutting-codebase-analysis.md` - Integration analysis

All files located in: `.claude/plans/Documents/`

---

## Metrics Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Unused files | 202 | 0 | -202 |
| Unused dependencies | 9 | 0 | -9 |
| Test coverage (workflows) | 17% | 80% | +63% |
| Plans backlog | 85 | <10 | -75 |
| Security issues (HIGH) | 3 | 0 | -3 |
| Documentation accuracy | ~20% | 100% | +80% |

---

*Report generated by 3-agent parallel analysis covering 53 Edge Functions, 70+ routes, and ~500 source files.*
