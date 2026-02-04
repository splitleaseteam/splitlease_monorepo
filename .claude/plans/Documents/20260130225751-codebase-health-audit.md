# Codebase Health Audit Report

**Generated:** 2026-01-30 22:57:51
**Status:** FAILING (multiple checks have errors)

---

## Summary

| Check | Status | Count |
|-------|--------|-------|
| ESLint | FAIL | 981 warnings |
| TypeScript | FAIL | 1 error |
| Vitest Unit Tests | PASS | 2033 tests passed |
| Knip Dead Code | FAIL | 202 unused files, 122 unresolved imports |
| Deno Lint (Edge Functions) | FAIL | 265 problems |
| Edge Function Sync | FAIL | 4 unregistered functions |

---

## 1. ESLint Check

**Command:** `bun run lint:check`
**Result:** 981 warnings (0 errors)
**Exit Code:** 1

### Warning Categories

| Category | Count | Description |
|----------|-------|-------------|
| `no-unused-vars` | ~800+ | Unused variables, imports, parameters |
| `react-hooks/exhaustive-deps` | ~50+ | Missing hook dependencies |
| `react/no-unescaped-entities` | ~100+ | Unescaped quotes in JSX |
| `eqeqeq` | ~20+ | Using `==` instead of `===` |

### Most Affected Files

| File | Warnings |
|------|----------|
| `src/__tests__/integration/auth-flow.test.js` | 7 |
| `src/islands/modals/CancelProposalModal.stories.jsx` | 17 |
| `src/islands/pages/HostProposalsPage/HostProposalsPage.jsx` | 20+ |
| `src/islands/pages/GuestProposalsPage/GuestProposalsPage.jsx` | 15+ |
| `src/islands/shared/ScheduleSelector/*.jsx` | 30+ |
| `src/islands/shared/ListingCard/*.jsx` | 20+ |

### Sample Errors

```
src/hooks/useAuthenticatedUser.js:20:40
  warning  'requireGuest' is assigned a value but never used

src/hooks/useProposalButtonStates.js:10:61
  warning  React Hook useMemo has a missing dependency: 'params'

src/islands/modals/CompareTermsModal.jsx:192:5
  warning  'isCancelling' is assigned a value but never used
```

---

## 2. TypeScript Check

**Command:** `bun run typecheck`
**Result:** 1 error
**Exit Code:** 2

### Error

```
src/logic/calculators/contracts/calculatePaymentTotals.ts(3,51):
  error TS2307: Cannot find module '../../../lib/api/currency' or its corresponding type declarations.
```

**Fix Required:** Create missing module `src/lib/api/currency.ts` or update the import path.

---

## 3. Vitest Unit Tests

**Command:** `bun run test`
**Result:** ALL PASSING
**Exit Code:** 0

| Metric | Value |
|--------|-------|
| Test Files | 56 passed |
| Tests | 2033 passed |
| Duration | 29.49s |

---

## 4. Knip Dead Code Detection

**Command:** `bun run knip`
**Result:** Multiple issues detected
**Exit Code:** 1

### Summary

| Issue Type | Count |
|------------|-------|
| Unused files | 202 |
| Unlisted dependencies | 3 |
| Unused dependencies | 105 |
| Unlisted devDependencies | 10 |
| Unused devDependencies | 27 |
| Unlisted binaries | 129 |
| Unresolved imports | 122 |
| Unused exports | 200+ |
| Unused types | 50+ |

### Unused Files (Sample - 202 total)

```
src/config/proposalStatusConfig.js
src/hooks/useContractGenerator.js
src/hooks/useDataLookups.js
src/hooks/useProposalButtonStates.js
src/islands/modals/EditProposalModal.jsx
src/islands/modals/ProposalDetailsModal.jsx
src/islands/pages/PreviewSplitLeasePage.tsx
src/islands/pages/ReferralDemoPage.jsx
src/islands/pages/ViewSplitLeasePage.tsx
src/islands/shared/CreateDuplicateListingModal.jsx
src/islands/shared/ListingScheduleSelectorV2.jsx
src/logic/constants/index.js
src/islands/components/contracts/ContractDownload.jsx
src/islands/components/contracts/ContractForm.jsx
src/islands/components/contracts/ContractPreview.jsx
src/islands/pages/CreateDocumentPage/index.js
src/islands/pages/ManageInformationalTextsPage/*.jsx
src/islands/shared/AIRoomRedesign/*.jsx
src/islands/shared/AiSignupMarketReport/*.jsx
... (182 more files)
```

### Unlisted Dependencies

```
@react-oauth/google
jspdf
jspdf-autotable
```

### Unused Dependencies (Sample - 105 total)

```
@eslint/js
@radix-ui/react-alert-dialog
@radix-ui/react-select
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
@radix-ui/react-tooltip
@storybook/addon-a11y
@storybook/addon-essentials
@storybook/addon-interactions
@storybook/addon-onboarding
@storybook/addon-viewport
@storybook/blocks
@storybook/react
@storybook/react-vite
@storybook/test
... (89 more)
```

### Unresolved Imports (Sample - 122 total)

```
@/hooks/useEscapeKey           → src/islands/pages/SelfListingPage/*.jsx (6 files)
@/hooks/useVirtualScroll       → src/islands/pages/SelfListingPage/*.jsx (4 files)
@/hooks/useDeviceSize          → src/islands/components/SearchBar.jsx (3 files)
@/hooks/useListingsOverview    → src/islands/pages/ListingsOverviewPage/*.jsx
@/hooks/useMessageCuration     → src/islands/pages/MessageCurationPage/*.jsx
@/hooks/useProposalManagement  → src/islands/pages/ProposalManagePage/*.jsx
... (116 more)
```

### Configuration Hints

```
1. Add entry and/or refine project files (202 unused files)
2. Remove @rollup/rollup-linux-x64-gnu from ignoreDependencies
3. Remove lightningcss-linux-x64-gnu from ignoreDependencies
4. Remove redundant entry pattern: vite.config.js
5. Remove redundant entry pattern: eslint.config.js
6. Remove redundant entry pattern: postcss.config.js
7. Remove redundant entry pattern: tailwind.config.js
```

---

## 5. Deno Lint (Edge Functions)

**Command:** `deno lint supabase/functions/`
**Result:** 265 problems in 299 files
**Exit Code:** 1

### Error Categories

| Rule | Count | Description |
|------|-------|-------------|
| `no-unused-vars` | ~150 | Unused imports, variables, parameters |
| `no-unversioned-import` | ~40 | Missing version in JSR imports |
| `ban-types` | ~30 | Using `Function` type (no type safety) |
| `require-await` | ~25 | Async functions without await |
| `no-explicit-any` | ~10 | Using `any` type |
| `prefer-const` | ~5 | Using `let` when `const` is possible |

### Most Affected Files

| File | Problems |
|------|----------|
| `supabase/functions/_shared/functional/errorLog.ts` | 5 |
| `supabase/functions/messages/index.ts` | 4 |
| `supabase/functions/identity-verification/index.ts` | 3 |
| `supabase/functions/proposal/handlers/*.ts` | 20+ |
| `supabase/functions/listing/handlers/*.ts` | 15+ |
| `supabase/functions/virtual-meeting/handlers/*.ts` | 10+ |

### Sample Errors

```typescript
// no-unversioned-import - 40+ occurrences
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Fix: import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";

// ban-types - 30+ occurrences
const handlers: Readonly<Record<Action, Function>> = { ... };
// Fix: Define explicit function type

// require-await - 25+ occurrences
async function executeHandler(...) { ... }  // No await inside
// Fix: Remove async or add await

// no-unused-vars - 150+ occurrences
import { AuthenticationError, ValidationError } from "../_shared/errors.ts";
// AuthenticationError is never used
```

---

## 6. Edge Function Sync Check

**Command:** `bun run sync:edge-functions`
**Result:** 3 unregistered functions
**Exit Code:** 1

### Unregistered Functions

| Function | Status |
|----------|--------|
| `calendar-automation` | Missing from config.toml |
| `date-change-reminder-cron` | Missing from config.toml |
| `temp-fix-trigger` | Missing from config.toml |

### Stats

- **Discovered:** 55 Edge Functions
- **Registered:** 51 in config.toml
- **Missing:** 3 functions

### Fix

Run: `bun run sync:edge-functions:fix`

Or manually add to `supabase/config.toml`:

```toml
[functions.calendar-automation]
enabled = true
verify_jwt = false
import_map = "./functions/calendar-automation/deno.json"
entrypoint = "./functions/calendar-automation/index.ts"

[functions.date-change-reminder-cron]
enabled = true
verify_jwt = false
import_map = "./functions/date-change-reminder-cron/deno.json"
entrypoint = "./functions/date-change-reminder-cron/index.ts"

[functions.temp-fix-trigger]
enabled = true
verify_jwt = false
entrypoint = "./functions/temp-fix-trigger/index.ts"
```

---

## Priority Fixes

### Critical (Blocks Build/Deploy)

1. **TypeScript Error** - Missing module `src/lib/api/currency.ts`
2. **Edge Function Sync** - 4 unregistered functions

### High Priority

1. **ESLint Warnings** - 981 warnings (zero tolerance in CI)
2. **Deno Lint Errors** - 265 problems in Edge Functions

### Medium Priority

1. **Knip Dead Code** - 202 unused files, 122 unresolved imports
2. **Unused Dependencies** - 105 packages can be removed

### Low Priority

1. **Configuration Hints** - Knip config optimization
2. **Code Cleanup** - Unused exports and types

---

## Recommended Actions

1. **Immediate:** Fix TypeScript error in `calculatePaymentTotals.ts`
2. **Immediate:** Run `bun run sync:edge-functions:fix`
3. **Short-term:** Fix ESLint warnings with `bun run lint:fix`
4. **Short-term:** Address Deno lint errors in Edge Functions
5. **Medium-term:** Remove 202 unused files identified by Knip
6. **Medium-term:** Clean up 105 unused dependencies
