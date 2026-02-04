# Codebase Health Report

**Generated**: 2026-01-30
**Status**: Multiple issues detected across all check categories

---

## Summary

| Check | Status | Count |
|-------|--------|-------|
| ESLint | FAIL | 981 warnings |
| TypeScript | FAIL | 1 error |
| Vitest Tests | PASS | 2033 tests passed |
| Knip (Dead Code) | FAIL | 202 unused files, 33 unused deps, 267 unused exports |
| Deno Lint | FAIL | 265 problems |
| Edge Function Sync | FAIL | 4 unregistered functions |

---

## 1. ESLint Warnings (981 total)

**Command**: `bun run lint:check`
**Result**: Exit code 1 - Too many warnings (max: 0)

### Categories of Issues

| Category | Count | Severity |
|----------|-------|----------|
| `no-unused-vars` | ~800 | Warning |
| `react-hooks/exhaustive-deps` | ~50 | Warning |
| `react/no-unescaped-entities` | ~80 | Warning |
| `eqeqeq` | ~50 | Warning |

### Top Offending Files

| File | Warnings |
|------|----------|
| `src/__tests__/integration/auth-flow.test.js` | 7 |
| `src/islands/modals/CancelProposalModal.stories.jsx` | 17 |
| `src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | 12 |
| `src/islands/pages/GuestProposalsPage/useGuestProposalsPageLogic.js` | 10 |
| `src/islands/pages/MessagingPage/useMessagingPageLogic.js` | 8 |

### Sample Issues

```
src/hooks/useAuthenticatedUser.js:20:40 - 'requireGuest' is assigned but never used
src/hooks/useProposalButtonStates.js:10:61 - React Hook useMemo has missing dependency: 'params'
src/islands/modals/CompareTermsModal.jsx:192:5 - 'isCancelling' is assigned but never used
src/lib/supabaseUtils.js:11:10 - 'DATABASE' is defined but never used
```

---

## 2. TypeScript Errors (1 total)

**Command**: `bun run typecheck`
**Result**: Exit code 2

### Error Details

```
src/logic/calculators/contracts/calculatePaymentTotals.ts(3,51):
error TS2307: Cannot find module '../../../lib/api/currency' or its corresponding type declarations.
```

**Resolution**: Create the missing module or fix the import path.

---

## 3. Vitest Unit Tests

**Command**: `bun run test`
**Result**: PASS

| Metric | Value |
|--------|-------|
| Test Files | 56 passed |
| Tests | 2033 passed |
| Duration | 34.08s |

All tests passing.

---

## 4. Knip Dead Code Detection

**Command**: `bun run knip`
**Result**: Exit code 1

### Unused Files (202 total)

| Category | Sample Files |
|----------|--------------|
| Config files | `src/config/proposalStatusConfig.js` |
| Hooks | `src/hooks/useContractGenerator.js`, `src/hooks/useDataLookups.js` |
| Modals | `src/islands/modals/EditProposalModal.jsx`, `src/islands/modals/ProposalDetailsModal.jsx` |
| Pages | `src/islands/pages/PreviewSplitLeasePage.tsx`, `src/islands/pages/ReferralDemoPage.jsx` |
| Components | `src/islands/shared/CreateDuplicateListingModal.jsx` |
| AI Features | `src/islands/shared/AIRoomRedesign/*` (12 files) |
| Contracts | `src/islands/pages/contracts/*` (4 files) |
| Legacy | `src/islands/pages/ViewSplitLeasePage_LEGACY/*` |
| Unit Test Pages | `src/islands/pages/ZPricingUnitTestPage/*`, `src/islands/pages/ZSearchUnitTestPage/*` |

### Unused Dependencies (33 total)

| Dependency | Type |
|------------|------|
| `@hookform/resolvers` | dependencies |
| `@stripe/react-stripe-js` | dependencies |
| `@stripe/stripe-js` | dependencies |
| `boring-avatars` | dependencies |
| `framer-motion` | dependencies |
| `react-confetti` | dependencies |
| `react-highlight-words` | dependencies |
| `react-hook-form` | dependencies |
| `react-rewards` | dependencies |
| `zod` | dependencies |
| `@storybook/*` | devDependencies (6 packages) |
| `@vitest/coverage-v8` | devDependencies |
| `autoprefixer` | devDependencies |
| `msw` | devDependencies |
| `playwright` | devDependencies |
| `postcss` | devDependencies |
| `storybook` | devDependencies |
| `tailwindcss` | devDependencies |
| `wrangler` | devDependencies |

### Unused Exports (267 total)

Top categories:
- Page logic hooks (default exports)
- Component exports
- Utility functions
- Processor/Calculator functions

---

## 5. Deno Lint (Edge Functions)

**Command**: `deno lint supabase/functions/`
**Result**: 265 problems in 299 files

### Issue Categories

| Rule | Count | Severity |
|------|-------|----------|
| `no-unversioned-import` | ~80 | Error |
| `no-unused-vars` | ~120 | Error |
| `ban-types` | ~30 | Error |
| `require-await` | ~15 | Error |
| `no-explicit-any` | ~20 | Warning |

### Common Pattern: Unversioned Imports

```typescript
// PROBLEM: Missing version
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// FIX: Add version
import "jsr:@supabase/functions-js@2.0.0/edge-runtime.d.ts";
```

Affected files: Nearly all Edge Function index.ts files (55+)

### Common Pattern: Unused Imports

```typescript
// Many files import but don't use:
- AuthenticationError
- ValidationError
- parseRequest
- sendWelcomeSms
```

### Common Pattern: Ban Types

```typescript
// PROBLEM: Using Function type
const handlers: Readonly<Record<Action, Function>> = {...}

// FIX: Define explicit function shape
type Handler = (req: Request) => Promise<Response>;
const handlers: Readonly<Record<Action, Handler>> = {...}
```

### Files with Most Issues

| File | Issues |
|------|--------|
| `_shared/functional/errorLog.ts` | 4 |
| `ai-gateway/index.ts` | 3 |
| `ai-room-redesign/index.ts` | 2 |
| `virtual-meeting/handlers/admin/*.ts` | 6 |

---

## 6. Edge Function Sync

**Command**: `bun run sync:edge-functions`
**Result**: Exit code 1 - Registry out of sync

### Unregistered Functions (3)

| Function | Status |
|----------|--------|
| `calendar-automation` | Not in config.toml |
| `date-change-reminder-cron` | Not in config.toml |
| `temp-fix-trigger` | Not in config.toml |

### Resolution

Add to `supabase/config.toml`:

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

Or run: `node supabase/scripts/sync-edge-functions.js --fix`

---

## Priority Remediation

### Critical (Blocking Deployment)

1. **TypeScript Error** - Fix missing module import
2. **Edge Function Sync** - Register 4 unregistered functions

### High Priority

3. **ESLint `no-unused-vars`** - Remove ~800 unused variables
4. **Deno Lint `no-unversioned-import`** - Add versions to 80+ imports
5. **Deno Lint `no-unused-vars`** - Remove ~120 unused imports

### Medium Priority

6. **Knip Unused Files** - Audit and remove 202 dead files
7. **Knip Unused Dependencies** - Remove 33 unused packages
8. **React Hooks Dependencies** - Fix ~50 missing dependencies

### Low Priority

9. **Unescaped Entities** - Fix ~80 quote escaping issues
10. **Knip Unused Exports** - Clean up 267 unused exports

---

## Recommended Actions

1. Run `bun run sync:edge-functions --fix` to register Edge Functions
2. Fix TypeScript import error in `calculatePaymentTotals.ts`
3. Create automated lint-fix PR for ESLint issues: `bun run lint:fix`
4. Add version specifier to Supabase edge-runtime imports
5. Audit Knip unused files - many may be legacy code safe to delete
