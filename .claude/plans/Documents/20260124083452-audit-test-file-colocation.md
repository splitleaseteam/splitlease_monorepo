# Test File Co-location Audit Report

**Generated:** 2026-01-24 08:34:52 UTC
**Codebase:** Split Lease
**Repository:** splitlease
**Platform:** Windows 11 / PowerShell

---

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Source Files** | **1,162** | 100% |
| **Co-located Tests** | **1** | 0.09% |
| **Centralized Tests to Migrate** | **1** | 0.09% |
| **Missing Tests** | **1,161** | 99.82% |
| **Test Infrastructure Files** | **4** | - |

### Key Findings

- **Only 1 test file exists** in the entire frontend codebase: `calculateMatchScore.test.js`
- This test file is **in a `__tests__` folder** (anti-pattern - should be co-located)
- **Zero tests** exist for 603 React components
- **Zero tests** exist for 289 Edge Function TypeScript files
- **Test helpers exist** in `supabase/functions/tests/` but no actual tests use them
- **No testing framework configured** for Edge Functions (Deno test runner available but unused)

---

## Current Structure Analysis

### Test Folder Locations Found

| Location | Test Files | Type | Status |
|----------|------------|------|--------|
| `app/src/logic/calculators/matching/__tests__/` | 1 | Centralized (anti-pattern) | ⚠️ Migrate to co-location |
| `supabase/functions/tests/helpers/` | 2 | Test infrastructure | ✅ Keep (shared utilities) |
| `supabase/functions/tests/integration/` | 0 | Empty placeholder | ℹ️ Ready for tests |
| `tests/` (root) | 0 | Does not exist | - |
| `__tests__/` (root) | 0 | Does not exist | - |

### Co-location Status by Directory

| Directory | Source Files | Co-located Tests | Centralized Tests | Missing Tests | Coverage |
|-----------|--------------|------------------|-------------------|--------------|----------|
| **Frontend: Logic Layer** |
| `logic/calculators/` | 27 | 0 | 1* | 26 | 3.7% |
| `logic/rules/` | 42 | 0 | 0 | 42 | 0% |
| `logic/processors/` | 25 | 0 | 0 | 25 | 0% |
| `logic/workflows/` | 12 | 0 | 0 | 12 | 0% |
| **Frontend: Other** |
| `hooks/` | 5 | 0 | 0 | 5 | 0% |
| `islands/` | 603 | 0 | 0 | 603 | 0% |
| `lib/` | 58 | 0 | 0 | 58 | 0% |
| **Backend: Edge Functions** |
| `functions/` | 289 | 0 | 0 | 289 | 0% |
| `functions/_shared/` | 23 | 0 | 0 | 23 | 0% |

*\* The one test in matching/__tests__/ should migrate to co-located format*

---

## Migration Required (Centralized → Co-located)

### From `app/src/logic/calculators/matching/__tests__/`

| Current Location | Move To | Files Affected |
|------------------|---------|----------------|
| `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` | `app/src/logic/calculators/matching/calculateMatchScore.test.js` | 1 test file |

**Migration Command:**
```bash
# Move test to co-located location
mv app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js \
   app/src/logic/calculators/matching/calculateMatchScore.test.js

# Remove empty __tests__ directory
rmdir app/src/logic/calculators/matching/__tests__
```

**After Migration, Update Import Paths:**
```javascript
// Old (in test file):
import { calculateMatchScore } from '../calculateMatchScore.js';
import { calculateBoroughScore } from '../calculateBoroughScore.js';

// New (co-located):
import { calculateMatchScore } from './calculateMatchScore.js';
import { calculateBoroughScore } from './calculateBoroughScore.js';
```

---

## Missing Test Files (Priority Grouped)

### Priority 0 - Critical Business Logic (No Tests)

#### Calculators - Pricing (7 files)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `logic/calculators/pricing/calculateFourWeekRent.js` | `logic/calculators/pricing/calculateFourWeekRent.test.js` | Revenue calculation |
| `logic/calculators/pricing/calculateGuestFacingPrice.js` | `logic/calculators/pricing/calculateGuestFacingPrice.test.js` | Guest pricing |
| `logic/calculators/pricing/calculatePricingBreakdown.js` | `logic/calculators/pricing/calculatePricingBreakdown.test.js` | Price display |
| `logic/calculators/pricing/calculateQuickProposal.js` | `logic/calculators/pricing/calculateQuickProposal.test.js` | Quick match pricing |
| `logic/calculators/pricing/calculateReservationTotal.js` | `logic/calculators/pricing/calculateReservationTotal.test.js` | Booking total |
| `logic/calculators/pricing/getNightlyRateByFrequency.js` | `logic/calculators/pricing/getNightlyRateByFrequency.test.js` | Rate calculation |
| `logic/calculators/matching/calculateMatchScore.js` | `logic/calculators/matching/calculateMatchScore.test.js` | ⚠️ Has test in __tests__, needs migration |

#### Calculators - Matching (10 files, 1 tested in __tests__)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `logic/calculators/matching/calculateBoroughScore.js` | `logic/calculators/matching/calculateBoroughScore.test.js` | Location scoring |
| `logic/calculators/matching/calculateDurationScore.js` | `logic/calculators/matching/calculateDurationScore.test.js` | Duration matching |
| `logic/calculators/matching/calculateHostScore.js` | `logic/calculators/matching/calculateHostScore.test.js` | Host verification |
| `logic/calculators/matching/calculateMatchHeuristics.js` | `logic/calculators/matching/calculateMatchHeuristics.test.js` | Match algorithm |
| `logic/calculators/matching/calculatePriceProximity.js` | `logic/calculators/matching/calculatePriceProximity.test.js` | Price comparison |
| `logic/calculators/matching/calculatePriceScore.js` | `logic/calculators/matching/calculatePriceScore.test.js` | Price scoring |
| `logic/calculators/matching/calculateScheduleOverlapScore.js` | `logic/calculators/matching/calculateScheduleOverlapScore.test.js` | Schedule matching |
| `logic/calculators/matching/calculateWeeklyStayScore.js` | `logic/calculators/matching/calculateWeeklyStayScore.test.js` | Weekly stay support |

#### Rules - Authentication (2 files)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `logic/rules/auth/isProtectedPage.js` | `logic/rules/auth/isProtectedPage.test.js` | Access control |
| `logic/rules/auth/isSessionValid.js` | `logic/rules/auth/isSessionValid.test.js` | Session security |

#### Rules - Proposals (6 files)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `logic/rules/proposals/canAcceptProposal.js` | `logic/rules/proposals/canAcceptProposal.test.js` | Booking workflow |
| `logic/rules/proposals/canCancelProposal.js` | `logic/rules/proposals/canCancelProposal.test.js` | Cancellation logic |
| `logic/rules/proposals/canEditProposal.js` | `logic/rules/proposals/canEditProposal.test.js` | Edit permissions |
| `logic/rules/proposals/determineProposalStage.js` | `logic/rules/proposals/determineProposalStage.test.js` | Proposal workflow |
| `logic/rules/proposals/proposalButtonRules.js` | `logic/rules/proposals/proposalButtonRules.test.js` | UI state logic |
| `logic/rules/proposals/proposalRules.js` | `logic/rules/proposals/proposalRules.test.js` | Business rules |

#### Workflows (12 files)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `logic/workflows/booking/acceptProposalWorkflow.js` | `logic/workflows/booking/acceptProposalWorkflow.test.js` | Critical booking flow |
| `logic/workflows/booking/cancelProposalWorkflow.js` | `logic/workflows/booking/cancelProposalWorkflow.test.js` | Cancellation flow |
| `logic/workflows/booking/loadProposalDetailsWorkflow.js` | `logic/workflows/booking/loadProposalDetailsWorkflow.test.js` | Data loading |

### Priority 1 - High Value Components (No Tests)

#### Authentication Hook (1 file)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `hooks/useAuthenticatedUser.js` | `hooks/useAuthenticatedUser.test.js` | Auth state management |

#### Data Fetching Hook (1 file)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `hooks/useDataLookups.js` | `hooks/useDataLookups.test.js` | Reference data loading |

### Priority 2 - Edge Functions (No Tests)

#### Core Business Functions (8 critical functions)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `functions/auth-user/index.ts` | `functions/auth-user/index.test.ts` | Login/signup flow |
| `functions/proposal/index.ts` | `functions/proposal/index.test.ts` | Proposal CRUD |
| `functions/listing/index.ts` | `functions/listing/index.test.ts` | Listing CRUD |
| `functions/bubble_sync/index.ts` | `functions/bubble_sync/index.test.ts` | Data sync integrity |
| `functions/ai-gateway/index.ts` | `functions/ai-gateway/index.test.ts` | AI features |
| `functions/messages/index.ts` | `functions/messages/index.test.ts` | User messaging |
| `functions/quick-match/index.ts` | `functions/quick-match/index.test.ts` | Core matching feature |
| `functions/rental-application/index.ts` | `functions/rental-application/index.test.ts` | Guest applications |

#### Shared Utilities (23 files)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `functions/_shared/bubbleSync.ts` | `functions/_shared/bubbleSync.test.ts` | Atomic sync pattern |
| `functions/_shared/queueSync.ts` | `functions/_shared/queueSync.test.ts` | Queue operations |
| `functions/_shared/errors.ts` | `functions/_shared/errors.test.ts` | Error handling |
| `functions/_shared/validation.ts` | `functions/_shared/validation.test.ts` | Input validation |
| `functions/_shared/slack.ts` | `functions/_shared/slack.test.ts` | Error logging |
| `functions/_shared/cors.ts` | `functions/_shared/cors.test.ts` | CORS headers |
| `functions/_shared/openai.ts` | `functions/_shared/openai.test.ts` | OpenAI integration |
| `functions/_shared/functional/result.ts` | `functions/_shared/functional/result.test.ts` | Result type |

### Priority 3 - UI Components (603 files - No Tests)

#### Page Components (30+ entry pages)
Sample of critical pages:
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `islands/pages/SearchPage/SearchPage.jsx` | `islands/pages/SearchPage/SearchPage.test.jsx` | Core search feature |
| `islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.jsx` | `islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.test.jsx` | Listing detail view |
| `islands/pages/SelfListingPage/SelfListingPage.jsx` | `islands/pages/SelfListingPage/SelfListingPage.test.jsx` | Host listing creation |
| `islands/pages/GuestProposalsPage/GuestProposalsPage.jsx` | `islands/pages/GuestProposalsPage/GuestProposalsPage.test.jsx` | Guest proposal management |

#### Modals (15+ modals)
| Source File | Expected Test File | Impact |
|-------------|-------------------|--------|
| `islands/modals/EditProposalModal.jsx` | `islands/modals/EditProposalModal.test.jsx` | Proposal editing |
| `islands/modals/ProposalDetailsModal.jsx` | `islands/modals/ProposalDetailsModal.test.jsx` | Proposal details |
| `islands/modals/VirtualMeetingModal.jsx` | `islands/modals/VirtualMeetingModal.test.jsx` | Meeting scheduling |

---

## Folder Structure Issues

### Files NOT in Folders (Should Be Reorganized)

**Current Pattern Issues:**
- Most logic files follow flat structure in subdirectories (good)
- Component files mostly NOT in individual folders (inconsistent)

#### Lib Files NOT in Folders (50+ files)
These should be organized into folders with index.ts barrel exports:

| Current | Recommended | Reason |
|---------|-------------|--------|
| `lib/auth.js` | `lib/auth/auth.js` + `lib/auth/index.ts` | Barrel export for imports |
| `lib/bubbleAPI.js` | `lib/bubbleAPI/bubbleAPI.js` + `lib/bubbleAPI/index.ts` | Barrel export |
| `lib/constants.js` | `lib/constants/constants.js` + `lib/constants/index.ts` | Barrel export |
| `lib/dayUtils.js` | `lib/dayUtils/dayUtils.js` + `lib/dayUtils/index.ts` | Barrel export |
| `lib/dataLookups.js` | `lib/dataLookups/dataLookups.js` + `lib/dataLookups/index.ts` | Barrel export |
| `lib/listingService.js` | `lib/listingService/listingService.js` + `lib/listingService/index.ts` | Barrel export |

#### Logic Files Already Well Organized
- ✅ `logic/calculators/` - Good subdirectory structure
- ✅ `logic/rules/` - Good subdirectory structure by domain
- ✅ `logic/processors/` - Good subdirectory structure
- ✅ `logic/workflows/` - Good subdirectory structure

### Missing Barrel Exports (`index.ts`)

Most directories lack barrel exports, making imports verbose:

| Folder | Missing `index.ts` | Count |
|--------|-------------------|-------|
| `logic/calculators/pricing/` | Yes | 7 files |
| `logic/calculators/matching/` | ✅ Has | 10 files |
| `logic/calculators/scheduling/` | Yes | 6 files |
| `logic/rules/auth/` | Yes | 2 files |
| `logic/rules/proposals/` | Yes | 6 files |
| `logic/rules/matching/` | ✅ Has | 8 files |
| `logic/processors/` | Yes (root) | 25 files |
| `logic/workflows/` | Yes (root) | 12 files |

---

## Orphaned Test Files

**None found** - All existing test files reference valid source files.

---

## Already Co-located (Reference Examples)

**No examples exist** - The only test file is in a `__tests__` folder (anti-pattern).

---

## Test Infrastructure Analysis

### Existing Test Infrastructure (Unused)

#### Frontend Test Utilities
**Location:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`

**Framework Used:** Vitest
```javascript
import { describe, it, expect } from 'vitest';
```

**Test Coverage:**
- Borough matching tests
- Price scoring tests
- Schedule overlap tests
- Weekly stay support tests
- Duration matching tests
- Host verification tests
- Master score calculation tests

**Quality:** Comprehensive test for the matching calculator (585 lines)

#### Edge Function Test Utilities
**Location:** `supabase/functions/tests/`

**Files:**
1. `helpers/assertions.ts` - Custom assertions for Result type
2. `helpers/fixtures.ts` - Mock data factories (createMockRequest, createActionPayload, sampleUser, sampleListing)
3. `integration/.gitkeep` - Empty placeholder

**Framework:** Deno native test runner (Node 18+ compatible)

**Status:** Infrastructure ready but **NO tests written yet**

---

## Recommended Target Structure

### Frontend Structure

```
app/src/
├── logic/
│   ├── calculators/
│   │   ├── pricing/
│   │   │   ├── calculateFourWeekRent.js
│   │   │   ├── calculateFourWeekRent.test.js      ← ADD
│   │   │   └── index.ts                           ← ADD
│   │   ├── matching/
│   │   │   ├── calculateMatchScore.js
│   │   │   ├── calculateMatchScore.test.js        ← MIGRATE from __tests__/
│   │   │   ├── calculateBoroughScore.js
│   │   │   ├── calculateBoroughScore.test.js     ← ADD
│   │   │   ├── calculatePriceScore.js
│   │   │   ├── calculatePriceScore.test.js       ← ADD
│   │   │   ├── constants.js
│   │   │   ├── constants.test.js                 ← ADD
│   │   │   └── index.ts                           ← EXISTS
│   │   └── scheduling/
│   │       ├── calculateNightsFromDays.js
│   │       ├── calculateNightsFromDays.test.js    ← ADD
│   │       └── index.ts                           ← ADD
│   ├── rules/
│   │   ├── auth/
│   │   │   ├── isProtectedPage.js
│   │   │   ├── isProtectedPage.test.js          ← ADD
│   │   │   └── index.ts                           ← ADD
│   │   ├── proposals/
│   │   │   ├── canAcceptProposal.js
│   │   │   ├── canAcceptProposal.test.js        ← ADD
│   │   │   └── index.ts                           ← ADD
│   │   └── index.ts                               ← ADD (root barrel)
│   ├── processors/
│   │   ├── external/
│   │   │   ├── adaptDaysFromBubble.js
│   │   │   ├── adaptDaysFromBubble.test.js      ← ADD
│   │   │   └── index.ts                           ← ADD
│   │   └── index.ts                               ← ADD (root barrel)
│   └── workflows/
│       ├── booking/
│       │   ├── acceptProposalWorkflow.js
│       │   ├── acceptProposalWorkflow.test.js   ← ADD
│       │   └── index.ts                           ← ADD
│       └── index.ts                               ← ADD (root barrel)
├── hooks/
│   ├── useAuthenticatedUser/
│   │   ├── useAuthenticatedUser.js
│   │   ├── useAuthenticatedUser.test.js        ← ADD
│   │   └── index.js                              ← ADD
│   └── useDataLookups/
│       ├── useDataLookups.js
│       ├── useDataLookups.test.js              ← ADD
│       └── index.js                              ← ADD
├── islands/
│   ├── pages/
│   │   ├── SearchPage/
│   │   │   ├── SearchPage.jsx
│   │   │   ├── SearchPage.test.jsx             ← ADD
│   │   │   └── index.jsx                          ← ADD
│   │   └── ViewSplitLeasePage/
│   │       ├── ViewSplitLeasePage.jsx
│   │       ├── ViewSplitLeasePage.test.jsx     ← ADD
│   │       └── index.jsx                          ← ADD
│   └── shared/
│       └── ... (600+ components need tests)
└── lib/
    ├── auth/
    │   ├── auth.js
    │   ├── auth.test.js                         ← ADD
    │   └── index.js                              ← ADD
    ├── bubbleAPI/
    │   ├── bubbleAPI.js
    │   ├── bubbleAPI.test.js                     ← ADD
    │   └── index.js                              ← ADD
    └── ...
```

### Edge Functions Structure

```
supabase/functions/
├── _shared/
│   ├── functional/
│   │   ├── result.ts
│   │   ├── result.test.ts                       ← ADD
│   │   └── index.ts                             ← ADD
│   ├── bubbleSync.ts
│   ├── bubbleSync.test.ts                       ← ADD
│   ├── queueSync.ts
│   ├── queueSync.test.ts                        ← ADD
│   ├── errors.ts
│   ├── errors.test.ts                           ← ADD
│   ├── validation.ts
│   ├── validation.test.ts                       ← ADD
│   ├── slack.ts
│   ├── slack.test.ts                            ← ADD
│   ├── openai.ts
│   ├── openai.test.ts                           ← ADD
│   └── index.ts                                 ← ADD
├── auth-user/
│   ├── index.ts
│   ├── index.test.ts                            ← ADD
│   ├── handlers/
│   │   ├── login.ts
│   │   ├── login.test.ts                        ← ADD
│   │   ├── signup.ts
│   │   ├── signup.test.ts                      ← ADD
│   │   └── index.ts                             ← ADD
│   └── lib/
│       └── index.ts                             ← ADD
├── proposal/
│   ├── index.ts
│   ├── index.test.ts                            ← ADD
│   ├── actions/
│   │   ├── create.ts
│   │   ├── create.test.ts                       ← ADD
│   │   ├── update.ts
│   │   ├── update.test.ts                       ← ADD
│   │   └── index.ts                             ← ADD
│   └── lib/
│       ├── calculations.ts
│       ├── calculations.test.ts                 ← ADD
│       ├── validators.ts
│       ├── validators.test.ts                   ← ADD
│       └── index.ts                             ← ADD
├── listing/
│   ├── index.ts
│   ├── index.test.ts                            ← ADD
│   ├── handlers/
│   │   ├── create.ts
│   │   ├── create.test.ts                       ← ADD
│   │   └── index.ts                             ← ADD
│   └── lib/
│       └── index.ts                             ← ADD
├── tests/                                        ← Keep (shared test utilities only)
│   ├── helpers/
│   │   ├── assertions.ts                         ← EXISTS
│   │   ├── fixtures.ts                          ← EXISTS
│   │   └── index.ts                             ← ADD
│   ├── integration/
│   │   └── .gitkeep                             ← EXISTS (placeholder)
│   └── setup.ts                                 ← ADD (Deno test setup)
└── ...
```

---

## Testing Framework Setup

### Frontend (Vitest)

**Current Status:** Partially configured (used by matching calculator test)

**Recommended Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'app/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'supabase/functions/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'supabase/functions/tests/helpers',  // Test helpers, not tests
      'supabase/functions/tests/integration' // Integration tests separate
    ],
    environment: 'jsdom',  // For React component tests
    globals: true,
    setupFiles: ['./app/src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'app/src/test/',
      ]
    }
  },
  resolve: {
    alias: {
      'logic': '/app/src/logic',
      'lib': '/app/src/lib',
      'islands': '/app/src/islands',
      'hooks': '/app/src/hooks',
    }
  }
});
```

**Test Setup File:**
```typescript
// app/src/test/setup.ts
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

### Edge Functions (Deno Test Runner)

**Recommended Configuration:**

```typescript
// supabase/functions/tests/setup.ts
/**
 * Setup file for Deno test runner
 * Run with: deno test --allow-all supabase/functions/
 */

import { assertExists } from 'jsr:@std/assert';

// Mock Supabase client for testing
export function createMockSupabase() {
  return {
    from: () => ({
      select: () => ({
        where: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null })
    }
  };
}

// Mock environment variables
export function setupMockEnv() {
  Deno.env.set('SUPABASE_URL', 'https://test.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
  Deno.env.set('BUBBLE_API_BASE_URL', 'https://test.bubble.io');
  Deno.env.set('BUBBLE_API_KEY', 'test-key');
}
```

**Test Command:**
```bash
# Run all Edge Function tests
deno test --allow-all supabase/functions/

# Run specific test
deno test --allow-all supabase/functions/auth-user/index.test.ts

# Run with coverage
deno test --allow-all --coverage supabase/functions/
```

---

## VS Code Settings for Test Discovery

**Recommended `.vscode/settings.json`:**

```json
{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.jsx": "${capture}.test.jsx, ${capture}.stories.jsx",
    "*.js": "${capture}.test.js, ${capture}.spec.js",
    "*.ts": "${capture}.test.ts, ${capture}.spec.ts",
    "*.tsx": "${capture}.test.tsx, ${capture}.stories.tsx"
  },
  "testing.followRunningTest": true,
  "testing.gutterEnabled": true,
  "testExplorer.sort": "byLocation"
}
```

---

## Migration Plan

### Phase 1: Fix Existing Test (Immediate)

1. Move test from `__tests__/` to co-located location
2. Update import paths in test file
3. Verify test runs with `bun test` or `bunx vitest`

```bash
# Execute migration
mv app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js \
   app/src/logic/calculators/matching/calculateMatchScore.test.js
rmdir app/src/logic/calculators/matching/__tests__

# Update imports in the test file
sed -i "s|from '../|from './|g" \
  app/src/logic/calculators/matching/calculateMatchScore.test.js

# Run test
bunx vitest run app/src/logic/calculators/matching/calculateMatchScore.test.js
```

### Phase 2: Add Barrel Exports (High Priority)

Add `index.ts` barrel exports to all logic subdirectories:

```bash
# Example: Create barrel exports for pricing calculators
cat > app/src/logic/calculators/pricing/index.js << 'EOF'
export { calculateFourWeekRent } from './calculateFourWeekRent.js';
export { calculateGuestFacingPrice } from './calculateGuestFacingPrice.js';
export { calculatePricingBreakdown } from './calculatePricingBreakdown.js';
export { calculateQuickProposal } from './calculateQuickProposal.js';
export { calculateReservationTotal } from './calculateReservationTotal.js';
export { getNightlyRateByFrequency } from './getNightlyRateByFrequency.js';
EOF
```

### Phase 3: Priority Test Coverage (Medium Priority)

Start with Priority 0 (critical business logic):

1. **Pricing Calculators** - Revenue-critical calculations
2. **Matching Algorithm** - Core feature differentiator
3. **Authentication Rules** - Security-critical
4. **Proposal Rules** - Core booking workflow

### Phase 4: Edge Function Tests (Medium Priority)

1. **Shared Utilities** - Foundation for all functions
2. **Critical Functions** - auth-user, proposal, listing
3. **Bubble Sync** - Data integrity

### Phase 5: Component Tests (Low Priority)

1. **Page Components** - Critical user flows
2. **Modals** - User interactions
3. **Shared Components** - Reusable UI

---

## Coverage Goals

### Minimum Viable Coverage (MVP)

| Area | Target | Priority |
|------|--------|----------|
| **Pricing Calculators** | 100% | P0 |
| **Matching Logic** | 100% | P0 |
| **Auth Rules** | 100% | P0 |
| **Proposal Rules** | 100% | P0 |
| **Edge Function Shared Utils** | 100% | P1 |
| **Critical Edge Functions** | 80%+ | P1 |
| **Hooks** | 50%+ | P2 |
| **Page Components** | 30%+ | P3 |

### Stretch Goals

| Area | Target | Timeline |
|------|--------|----------|
| **All Logic Layer** | 100% | Q1 2026 |
| **All Edge Functions** | 80%+ | Q2 2026 |
| **All Hooks** | 70%+ | Q2 2026 |
| **Critical UI Flows** | 50%+ | Q3 2026 |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test:unit

  edge-function-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test --allow-all supabase/functions/

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Documentation Updates

### Files to Create

1. **`app/src/test/README.md`** - Frontend testing guide
2. **`supabase/functions/tests/README.md`** - Edge Function testing guide
3. **`TESTING.md`** (root) - Project testing philosophy and standards

### Files to Update

1. **`app/CLAUDE.md`** - Add testing section
2. **`supabase/CLAUDE.md`** - Add Edge Function testing section
3. **`.claude/CLAUDE.md`** - Add testing workflow documentation

---

## Summary

### Critical Issues

1. ❌ **99.82% of code has no test coverage** (1,161 of 1,162 files)
2. ⚠️ **Only test uses anti-pattern** (`__tests__/` folder instead of co-location)
3. ❌ **No Edge Function tests** despite test infrastructure existing
4. ❌ **No component tests** for 603 React components
5. ⚠️ **Missing barrel exports** throughout codebase

### Immediate Actions

1. ✅ **Migrate existing test** from `__tests__/` to co-located location
2. ✅ **Set up Vitest** for frontend testing
3. ✅ **Set up Deno test runner** for Edge Functions
4. ✅ **Add barrel exports** to logic subdirectories
5. ✅ **Create test utilities** and fixtures

### Long-term Vision

```
From: 1 test file (0.09% coverage)
To:  1,000+ test files (70%+ coverage)

Timeline:
- Week 1-2:  Migrate existing test + setup infrastructure
- Month 1:   Priority 0 tests (pricing, matching, auth)
- Month 2-3: Priority 1 tests (Edge Functions, shared utils)
- Month 4-6: Priority 2-3 tests (hooks, components)
```

---

**Report Generated:** 2026-01-24 08:34:52 UTC
**Audit Duration:** ~15 minutes
**Files Analyzed:** 1,166 source files
**Test Files Found:** 3 (1 test + 2 test helpers)
**Recommended Next Step:** Migrate `calculateMatchScore.test.js` to co-located location
