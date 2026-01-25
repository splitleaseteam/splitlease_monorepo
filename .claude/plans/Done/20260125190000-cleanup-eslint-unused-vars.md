# ESLint Unused Variables Cleanup Plan

**Created**: 2026-01-25 19:00:00
**Type**: CLEANUP
**Priority**: HIGH
**Estimated Effort**: 8-12 hours

---

## Executive Summary

The codebase has **2,198 ESLint warnings** that need to be addressed. The vast majority (1,872) are `no-unused-vars` warnings, many of which are **false positives** caused by ESLint not recognizing JSX component usage. This plan outlines a systematic approach to resolve all warnings through a combination of ESLint configuration fixes, automated fixes, and targeted manual cleanup.

### Warning Breakdown

| Rule | Count | Action Required |
|------|-------|-----------------|
| `no-unused-vars` | 1,872 | Configuration fix + manual cleanup |
| `react/no-unescaped-entities` | 189 | Manual fixes (escape apostrophes) |
| `react-hooks/exhaustive-deps` | 125 | Manual review + fixes |
| `prefer-const` | 9 | Auto-fixable with `--fix` |
| `no-duplicate-imports` | 3 | Manual consolidation |
| **Total** | **2,198** | |

### Expected Outcomes

1. Zero ESLint warnings on `bun run lint`
2. Cleaner imports across all files
3. Better code maintainability
4. Proper JSX awareness in linting

---

## Current State Analysis

### Root Cause: JSX Component False Positives

The ESLint configuration has `'react/jsx-uses-react': 'off'` and `'react/react-in-jsx-scope': 'off'` which are correct for React 17+ JSX transform, but the `eslint-plugin-react` is not properly configured to mark JSX component usage. This causes ESLint to report components used in JSX as "unused imports."

**Example False Positive:**
```javascript
// src/guest-proposals.jsx
import React from 'react';                    // "unused" - but used in React.StrictMode
import GuestProposalsPage from '...';         // "unused" - but used in JSX <GuestProposalsPage />
import { ToastProvider } from '...';          // "unused" - but used in JSX <ToastProvider>
import { ErrorBoundary } from '...';          // "unused" - but used in JSX <ErrorBoundary>

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <GuestProposalsPage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

### File Distribution

| Category | Files | Warnings | Description |
|----------|-------|----------|-------------|
| Entry Points (`src/*.jsx`) | 66 | 208 | React apps mounting page components |
| Islands Components | 401 | 1,953 | React UI components |
| Lib Files | 12 | 28 | Utility modules |
| Logic Files | 5 | 6 | Business logic |
| Other Files | 2 | 3 | Hooks, etc. |
| **Total** | **486** | **2,198** | |

### Warning Categories (no-unused-vars only)

| Category | Count | Likely Action |
|----------|-------|---------------|
| `React` imports | 172 | Configure JSX awareness OR remove (React 17+ doesn't need it) |
| `ErrorBoundary` | 47 | False positive - used in JSX |
| `Header` component | 46 | False positive - used in JSX |
| `Footer` component | 43 | False positive - used in JSX |
| Lucide icons | 111 | Mix of false positives and truly unused |
| Other components | 511 | Mix of false positives and truly unused |
| Hooks (`use*`) | 14 | Review each - may be intentionally imported for type hints |
| Error handling (`e`, `err`) | 49 | Prefix with `_` (catch clause convention) |
| Other variables | 879 | Manual review required |

---

## Target State Definition

### Success Criteria

1. `bun run lint` returns 0 warnings
2. `bun run lint:check` passes in CI
3. No legitimate code functionality is broken
4. Import statements are clean and minimal

### Target ESLint Configuration

The ESLint config needs to properly recognize JSX component usage:

```javascript
// eslint.config.js - Target configuration
export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { /* ... */ },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    settings: {
      react: {
        version: '18.2',
      },
    },
    rules: {
      // Enable JSX uses vars detection
      'react/jsx-uses-vars': 'error',    // <-- ADD THIS

      // Keep these off for React 17+
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',

      // Allow underscore-prefixed unused vars
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',  // <-- ADD THIS for catch clauses
      }],

      // ... rest of config
    },
  },
];
```

---

## Execution Strategy

### Phase 1: ESLint Configuration Fix (15 minutes)

**Goal**: Fix false positives by enabling `react/jsx-uses-vars` rule

**File to modify**: `c:\Users\Split Lease\Documents\Split Lease - Team\app\eslint.config.js`

**Changes**:
1. Add `'react/jsx-uses-vars': 'error'` to rules
2. Add `caughtErrorsIgnorePattern: '^_'` to `no-unused-vars` options

**Expected Impact**: Eliminate ~500-800 false positive warnings

**Verification**: Run `bun run lint` and compare warning count

### Phase 2: Remove Unnecessary React Imports (30 minutes)

**Goal**: Remove `import React from 'react'` where not needed

With React 17+ JSX transform, explicit React import is only needed when:
- Using `React.StrictMode`
- Using `React.Component` (class components)
- Using `React.createElement` directly
- Using `React.Fragment` shorthand `<>`

**Files requiring React import** (keep):
- Entry points using `<React.StrictMode>` - 66 files
- Class components using `React.Component` - check `ErrorBoundary.jsx`

**Files NOT requiring React import** (remove):
- Functional components using only JSX
- Hooks files

**Automation Approach**:
```bash
# Find files that import React but don't use React.* anywhere
grep -l "import React" src/**/*.jsx | while read f; do
  if ! grep -q "React\." "$f"; then
    # This file can have React import removed
    echo "$f"
  fi
done
```

### Phase 3: Fix Error Handling Variables (20 minutes)

**Goal**: Prefix unused catch clause variables with underscore

**Pattern**: Change `catch (e)` to `catch (_e)` or `catch (_error)`

**Files affected**: 49 instances across multiple files

**Example**:
```javascript
// Before
try { ... } catch (e) { /* don't use e */ }

// After
try { ... } catch (_e) { /* intentionally unused */ }
```

**Common variables to fix**:
- `e` (21 instances)
- `parseErr` (9 instances)
- `err` (estimated 10 instances)
- `error` (estimated 5 instances)

### Phase 4: Remove Truly Unused Imports (2-3 hours)

**Goal**: Remove imports that are genuinely not used anywhere in the file

**Approach**: After Phase 1 configuration fix, remaining `no-unused-vars` warnings indicate truly unused imports.

**Categories to address**:

#### 4.1 Unused Lucide Icons (111 instances)

Files import icons that are never rendered. Either:
- Remove the import if truly unused
- The icon is used dynamically (keep as is, but verify)

**Top unused icons**:
| Icon | Count | Action |
|------|-------|--------|
| `CheckIcon` | 17 | Remove if unused |
| `CloseIcon` | 16 | Remove if unused |
| `SpinnerIcon` | 11 | Remove if unused |
| `Check` | 9 | Remove if unused |
| `X` | 9 | Remove if unused |
| `Calendar` | 8 | Remove if unused |
| `FileText` | 8 | Remove if unused |

#### 4.2 Unused Component Imports (511 instances)

Components imported but not rendered. Common patterns:

| Component | Count | Likely Reason |
|-----------|-------|---------------|
| `LoadingState` | 22 | Component exists for future use |
| `ErrorState` | 16 | Component exists for future use |
| `EmptyState` | 13 | Component exists for future use |
| `ProfileCard` | 15 | Feature incomplete |
| `Toast` | 12 | May be used dynamically |

#### 4.3 Unused Hook Imports (14 instances)

Hooks imported but not called. Need individual review.

**Files with unused hooks** (from `rc/hooks/`):
- `useAuthenticatedUser.js`: `requireGuest`, `requireHost` unused

### Phase 5: Fix Other Warning Types (1-2 hours)

#### 5.1 react/no-unescaped-entities (189 warnings)

**Problem**: Unescaped apostrophes in JSX text

**Example**:
```jsx
// Before
<p>Don't worry about it</p>

// After
<p>Don&apos;t worry about it</p>
// OR use curly braces
<p>{"Don't worry about it"}</p>
```

**Files with most occurrences**:
- `src/islands/pages/WhySplitLeasePage.jsx` (multiple)
- `src/islands/pages/CareersPage.jsx` (multiple)
- `src/islands/pages/AboutUsPage.jsx` (multiple)
- `src/islands/modals/GuestEditingProposalModal.jsx`

#### 5.2 react-hooks/exhaustive-deps (125 warnings)

**Problem**: Missing dependencies in useEffect/useCallback/useMemo

**Approach**: Review each warning individually:
1. If dependency is intentionally omitted, add eslint-disable comment
2. If dependency should be included, add it
3. If hook logic needs restructuring, refactor

**High-impact files** (multiple warnings):
- `src/hooks/useProposalButtonStates.js`
- `src/islands/modals/FullscreenProposalMapModal.jsx`
- `src/islands/modals/ProposalDetailsModal.jsx`

#### 5.3 prefer-const (9 warnings) - AUTO-FIXABLE

**Command**: `bun run lint:fix` will fix these automatically

**Files**:
- `src/islands/pages/InternalEmergencyPage/components/CommunicationPanel.jsx` (3)

#### 5.4 no-duplicate-imports (3 warnings)

**Problem**: Same module imported multiple times

**Files**:
- `src/islands/pages/ListWithUsPage.jsx` - duplicate `../shared/Toast.jsx`
- `src/islands/shared/Footer.jsx` - duplicate `./Toast.jsx`
- `src/lib/auth/login.js` - duplicate `./tokenValidation.js`

**Fix**: Consolidate imports into single import statement

---

## File-by-File Action Plan

### High-Priority Files (>20 warnings)

| File | Warnings | Primary Issue |
|------|----------|---------------|
| `src/islands/shared/SignUpLoginModal.jsx` | 43 | Many unused icon/component imports |
| `src/islands/pages/ReferralDemoPage.jsx` | 38 | Unused imports |
| `src/islands/pages/WhySplitLeasePage.jsx` | 34 | Unescaped entities + unused imports |
| `src/islands/pages/ListingDashboardPage/ListingDashboardPage.jsx` | 32 | Unused component imports |
| `src/islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx` | 31 | Legacy code - unused imports |
| `src/islands/pages/CareersPage.jsx` | 28 | Unescaped entities + unused imports |
| `src/islands/pages/SearchPage.jsx` | 28 | Unused component imports |

### Entry Point Files (66 files, 208 warnings)

**Pattern**: All have `React`, `ErrorBoundary`, `ToastProvider`, and page component marked as unused

**Fix**: Phase 1 ESLint config will resolve most. Remaining React imports can stay (used in `React.StrictMode`).

**Sample files**:
- `src/404.jsx` - 3 warnings (React, NotFoundPage, ErrorBoundary)
- `src/guest-proposals.jsx` - 4 warnings (React, GuestProposalsPage, ToastProvider, ErrorBoundary)
- `src/main.jsx` - 3 warnings (React, HomePage, ErrorBoundary)

### Islands Components (401 files, 1,953 warnings)

After Phase 1 config fix, remaining warnings need individual review. Priority order:

1. **Modals** (`src/islands/modals/`) - 10 files, 42 warnings
2. **Pages** (`src/islands/pages/`) - 35 files, 361 warnings
3. **Shared** (`src/islands/shared/`) - 14 files, 116 warnings
4. **Page subdirectories** - various files with nested components

---

## Verification Checklist

### After Each Phase

- [ ] Run `bun run lint` and record warning count
- [ ] Run `bun run build` to ensure no build errors
- [ ] Run `bun run dev` and spot-check affected pages
- [ ] Commit changes with descriptive message

### Final Verification

- [ ] `bun run lint` returns 0 warnings
- [ ] `bun run lint:check` (CI mode) passes
- [ ] `bun run build` succeeds
- [ ] All pages load without console errors
- [ ] No visual regressions on key pages:
  - [ ] Homepage
  - [ ] Search page
  - [ ] View listing page
  - [ ] Guest proposals page
  - [ ] Host proposals page

---

## Risk Assessment

### Low Risk
- Phase 1 (ESLint config) - No code changes, only linter behavior
- Phase 3 (catch variable prefixing) - No runtime impact
- Phase 5.3 (prefer-const) - Auto-fixable, no behavior change

### Medium Risk
- Phase 2 (React import removal) - Safe with React 17+, but verify
- Phase 5.4 (duplicate imports) - Safe refactoring

### Higher Risk (Requires Care)
- Phase 4 (removing unused imports) - Could remove intentionally kept imports
- Phase 5.1 (unescaped entities) - String content changes
- Phase 5.2 (exhaustive-deps) - Could introduce bugs if dependencies added incorrectly

### Mitigation
- Commit after each phase
- Run full test suite after Phase 4 and Phase 5
- Review changes carefully before committing
- Keep changes reversible

---

## Execution Order

1. **Phase 1**: ESLint Configuration Fix
   - Modify `eslint.config.js`
   - Verify warning reduction
   - Commit: "fix(eslint): enable jsx-uses-vars for JSX component detection"

2. **Phase 5.3**: Auto-fix prefer-const
   - Run `bun run lint:fix`
   - Commit: "fix(lint): apply prefer-const auto-fixes"

3. **Phase 5.4**: Fix duplicate imports
   - Manual consolidation (3 files)
   - Commit: "fix(lint): consolidate duplicate imports"

4. **Phase 3**: Fix error handling variables
   - Prefix unused catch variables with `_`
   - Commit: "fix(lint): prefix unused catch variables with underscore"

5. **Phase 2**: Remove unnecessary React imports
   - Remove from functional components that don't use React.*
   - Commit: "chore(cleanup): remove unnecessary React imports"

6. **Phase 4**: Remove truly unused imports
   - Multiple commits by file group
   - Commit: "chore(cleanup): remove unused [component/icon/hook] imports"

7. **Phase 5.1**: Fix unescaped entities
   - Escape apostrophes in JSX text
   - Commit: "fix(lint): escape apostrophes in JSX text"

8. **Phase 5.2**: Fix exhaustive-deps
   - Individual review and fixes
   - Commit: "fix(lint): address exhaustive-deps warnings"

---

## Reference Appendix

### All Entry Point Files (66 files)

```
src/404.jsx
src/_email-sms-unit.jsx
src/_internal-test.jsx
src/about-us.jsx
src/account-profile.jsx
src/admin-threads.jsx
src/ai-tools.jsx
src/auth-verify.jsx
src/careers.jsx
src/co-host-requests.jsx
src/create-document.jsx
src/create-suggested-proposal.jsx
src/experience-responses.jsx
src/faq.jsx
src/favorite-listings.jsx
src/guest-proposals.jsx
src/guest-relationships.jsx
src/guest-simulation.jsx
src/guest-success.jsx
src/help-center-category.jsx
src/help-center.jsx
src/host-guarantee.jsx
src/host-overview.jsx
src/host-proposals.jsx
src/host-success.jsx
src/house-manual.jsx
src/internal-emergency.jsx
src/leases-overview.jsx
src/list-with-us-v2.jsx
src/list-with-us.jsx
src/listing-dashboard.jsx
src/listings-overview.jsx
src/logged-in-avatar-demo.jsx
src/main.jsx
src/manage-informational-texts.jsx
src/manage-rental-applications.jsx
src/manage-virtual-meetings.jsx
src/message-curation.jsx
src/messages.jsx
src/modify-listings.jsx
src/policies.jsx
src/preview-split-lease.jsx
src/proposal-manage.jsx
src/quick-match.jsx
src/quick-price.jsx
src/referral-demo.jsx
src/referral-invite.jsx
src/referral.jsx
src/rental-application.jsx
src/report-emergency.jsx
src/reset-password.jsx
src/search.jsx
src/self-listing-v2.jsx
src/self-listing.jsx
src/send-magic-login-links.jsx
src/signup-trial-host.jsx
src/simulation-admin.jsx
src/simulation-guest-mobile.jsx
src/simulation-guestside-demo.jsx
src/simulation-host-mobile.jsx
src/simulation-hostside-demo.jsx
src/usability-data-management.jsx
src/verify-users.jsx
src/view-split-lease.jsx
src/visit-manual.jsx
src/why-split-lease.jsx
```

### Top 30 Unused Variable Names

| Variable | Count |
|----------|-------|
| React | 172 |
| ErrorBoundary | 47 |
| Header | 46 |
| Footer | 43 |
| ToastProvider | 23 |
| LoadingState | 22 |
| e | 21 |
| CheckIcon | 17 |
| CloseIcon | 16 |
| ErrorState | 16 |
| ProfileCard | 15 |
| EmptyState | 13 |
| Toast | 12 |
| SpinnerIcon | 11 |
| Check | 9 |
| X | 9 |
| parseErr | 9 |
| Calendar | 8 |
| FileText | 8 |
| CheckCircle | 8 |
| data | 8 |
| ChevronRight | 7 |
| IconComponent | 7 |
| UserIcon | 7 |
| InformationalText | 7 |
| FavoriteButton | 7 |
| XIcon | 7 |
| Icon | 6 |
| Mail | 6 |
| Trash2 | 6 |

### Key Configuration Files

- ESLint Config: `c:\Users\Split Lease\Documents\Split Lease - Team\app\eslint.config.js`
- Package.json: `c:\Users\Split Lease\Documents\Split Lease - Team\app\package.json`
- Vite Config: `c:\Users\Split Lease\Documents\Split Lease - Team\app\vite.config.js`

### Analysis Data Files (Temporary)

- `c:\Users\Split Lease\Documents\Split Lease - Team\eslint-output.json` - Raw ESLint JSON output
- `c:\Users\Split Lease\Documents\Split Lease - Team\eslint-analysis.json` - Processed analysis data
- `c:\Users\Split Lease\Documents\Split Lease - Team\eslint-plan-data.json` - Plan-specific data
- `c:\Users\Split Lease\Documents\Split Lease - Team\analyze-eslint.js` - Analysis script

---

## Definition of Done

1. `bun run lint` outputs: "No warnings found"
2. `bun run lint:check` exits with code 0
3. `bun run build` succeeds without errors
4. All temporary analysis files cleaned up
5. Plan moved to `.claude/plans/Done/`

---

**Plan Version**: 1.0
**Last Updated**: 2026-01-25
