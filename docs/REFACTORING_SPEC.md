# Split Lease Codebase Refactoring Specification

**Created**: 2026-02-03
**Scope**: Code Cleanliness, Organization, Performance, LLM Iterability
**Priority**: High-impact, low-risk improvements first

---

## Executive Summary

This spec identifies refactoring opportunities across the Split Lease codebase to improve:
1. **Code Cleanliness** - Reduce duplication, standardize patterns, remove dead code
2. **Organization** - Consolidate related code, improve discoverability, standardize naming
3. **Performance** - Optimize hot paths, reduce bundle size, improve caching
4. **LLM Iterability** - Smaller files, clear boundaries, self-documenting code

---

## Part 1: Supabase Edge Functions Refactoring

### 1.1 Consolidate Shared Libraries

**Current State:**
- `lease-documents/lib/` contains 7 utility files
- `_shared/` contains 27+ utility files
- Some functions are duplicated between the two

**Recommended Changes:**

```
supabase/functions/
├── _shared/
│   ├── core/                    # NEW: Core utilities
│   │   ├── types.ts             # Consolidated type definitions
│   │   ├── validators.ts        # Input validation
│   │   ├── formatters.ts        # Data formatting
│   │   └── errors.ts            # Error types & handling
│   │
│   ├── documents/               # NEW: Document generation
│   │   ├── templateRenderer.ts
│   │   ├── calculations.ts
│   │   └── types.ts
│   │
│   ├── integrations/            # NEW: External services
│   │   ├── googleDrive.ts
│   │   ├── slack.ts
│   │   ├── openai.ts
│   │   └── bubble/
│   │       ├── sync.ts
│   │       └── types.ts
│   │
│   ├── storage/                 # NEW: Storage utilities
│   │   ├── supabaseStorage.ts
│   │   └── types.ts
│   │
│   ├── messaging/               # Consolidated messaging
│   │   ├── email.ts
│   │   ├── sms.ts
│   │   ├── notifications.ts
│   │   └── helpers.ts
│   │
│   └── index.ts                 # Barrel exports
```

**LLM Benefit:** Smaller, focused files with clear single responsibilities. An LLM can understand and modify one utility without needing full codebase context.

---

### 1.2 Standardize Handler Pattern

**Current State (Good Example - `generateCreditCardAuth.ts`):**
```typescript
export async function handleGenerateCreditCardAuth(
  payload: unknown,
  _user: UserContext | null,
  supabase: SupabaseClient
): Promise<DocumentResult> {
  // 1. Validate
  // 2. Calculate
  // 3. Prepare data
  // 4. Generate
  // 5. Upload
  // 6. Return result
}
```

**Standardize Across All Handlers:**

```typescript
// Template: Handler Pattern v2
// File: handlers/{action}.ts

import type { HandlerContext, HandlerResult } from '../_shared/core/types.ts';

/**
 * @handler {ActionName}
 * @input {PayloadType} - Brief description
 * @output {ResultType} - Brief description
 * @errors Lists possible error codes
 */
export async function handle{ActionName}(
  ctx: HandlerContext
): Promise<HandlerResult<SpecificResult>> {
  // Step 1: Validate & Parse
  const validated = validate{ActionName}Payload(ctx.payload);
  
  // Step 2: Business Logic
  const result = await process{ActionName}(validated, ctx);
  
  // Step 3: Side Effects (uploads, notifications)
  await performSideEffects(result, ctx);
  
  // Step 4: Return standardized result
  return { success: true, data: result };
}
```

**Migration Priority:**
1. ✅ `lease-documents/handlers/` (already follows pattern)
2. 🔄 `ai-gateway/` (17 files - high complexity)
3. 🔄 `proposal/` (15 files)
4. 🔄 `messages/` (11 files)
5. 🔄 `emergency/` (15 files)

---

### 1.3 Remove or Fix Broken Functions

**Identified Issues:**

| Function | Issue | Recommendation |
|----------|-------|----------------|
| `bubble-proxy/` | Empty directory | DELETE |
| `temp-fix-trigger/` | Temporary fix | REVIEW & DELETE if resolved |

**Action Items:**
1. Verify `lease-documents` coverage for document generation
2. Remove legacy function references before deletion

---

### 1.4 Type Consolidation

**Current State:**
- Types scattered across multiple files
- Duplicate type definitions
- Inconsistent naming (`CreditCardAuthPayload` vs `PayloadCreditCardAuth`)

**Proposed Type Structure:**

```typescript
// _shared/core/types.ts

// ============================================
// BASE TYPES
// ============================================
export interface BasePayload {
  action: string;
  timestamp?: string;
}

export interface BaseResult {
  success: boolean;
  error?: string;
  returned_error: 'yes' | 'no';
}

// ============================================
// CONTEXT TYPES
// ============================================
export interface UserContext {
  id: string;
  email: string;
  role: 'host' | 'guest' | 'admin';
}

export interface HandlerContext {
  payload: unknown;
  user: UserContext | null;
  supabase: SupabaseClient;
  requestId: string;
}

// ============================================
// DOCUMENT TYPES
// ============================================
export interface DocumentResult extends BaseResult {
  filename?: string;
  driveUrl?: string;
  fileId?: string;
  // Legacy snake_case aliases (deprecate after frontend update)
  drive_url?: string;
  file_id?: string;
  web_view_link?: string;
}

// ============================================
// PAYLOAD TYPES (by domain)
// ============================================
export * from './types/documents.ts';
export * from './types/proposals.ts';
export * from './types/messaging.ts';
export * from './types/payments.ts';
```

---

## Part 2: Frontend (`app/src/`) Refactoring

### 2.1 Logic Layer Cleanup

**Current State:**
- `logic/` has 253 files across 9 subdirectories
- Some overlap between `calculators/`, `processors/`, and `workflows/`
- Inconsistent file naming

**Proposed Structure:**

```
app/src/logic/
├── calculators/
│   ├── pricing/
│   │   ├── index.ts              # Barrel export
│   │   ├── fourWeekRent.ts       # Renamed from calculateFourWeekRent.js
│   │   ├── guestFacingPrice.ts
│   │   ├── pricingBreakdown.ts
│   │   └── reservationTotal.ts
│   │
│   └── scheduling/
│       ├── index.ts
│       ├── checkInOutDays.ts
│       ├── nextAvailableCheckIn.ts
│       └── nightsFromDays.ts
│
├── rules/
│   ├── index.ts                  # Single barrel export
│   ├── auth/
│   ├── proposals/
│   ├── pricing/
│   ├── scheduling/
│   ├── search/
│   └── users/
│
├── processors/
│   ├── index.ts
│   ├── external/                 # API boundary conversions
│   │   ├── dayConversion.ts      # Consolidated from 4 files
│   │   └── bubbleAdapter.ts
│   ├── display/
│   └── user/
│
└── workflows/
    ├── index.ts
    ├── auth/
    ├── booking/
    ├── proposals/
    └── scheduling/
```

**Key Changes:**
1. **Remove "calculate" prefix** - It's redundant when in `calculators/` folder
2. **Consolidate day conversion** - 4 files → 1 file with multiple exports
3. **Add barrel exports** - Every directory gets an `index.ts`
4. **Convert to TypeScript** - All new files should be `.ts`

---

### 2.2 Component Organization

**Current State:**
- `islands/` has 1,086 files (very large)
- Mix of `.jsx` and `.js` files
- Some components are too large (500+ lines)

**Recommended File Size Limits:**

| Category | Max Lines | Action if Exceeded |
|----------|-----------|-------------------|
| Component (UI only) | 200 | Extract sub-components |
| Logic Hook | 300 | Extract reusable hooks |
| Utility Module | 150 | Split by concern |
| Type Definition | 100 | Split by domain |

**Components to Split (Examples):**

```
Before: ViewSplitLeasePage.jsx (800+ lines)
After:
├── ViewSplitLeasePage/
│   ├── index.jsx                 # Main component (entry)
│   ├── ViewSplitLeasePage.jsx    # UI component (<200 lines)
│   ├── useViewSplitLeaseLogic.ts # Main logic hook
│   ├── components/               # Sub-components
│   │   ├── ListingHeader.jsx
│   │   ├── PricingCard.jsx
│   │   ├── AvailabilityCalendar.jsx
│   │   └── HostInfo.jsx
│   └── hooks/                    # Feature-specific hooks
│       ├── usePricingCalculation.ts
│       └── useAvailabilityCheck.ts
```

---

### 2.3 Remove Duplicate/Dead Code

**Tools to Use:**
```bash
# Already configured in knip.json
bun run knip
```

**Known Duplicates to Address:**

| File 1 | File 2 | Action |
|--------|--------|--------|
| `lib/constants/proposalStages.js` | `logic/constants/proposalStages.js` | Keep only `logic/` version |
| `lib/constants/proposalStatuses.js` | `logic/constants/proposalStatuses.js` | Keep only `logic/` version |
| `lib/priceCalculations.js` | `logic/calculators/pricing/*` | Migrate to `logic/`, delete `lib/` version |

---

## Part 3: LLM Iterability Improvements

### 3.1 Self-Documenting File Headers

**Add to Every File:**

```typescript
/**
 * @file calculations.ts
 * @module lease-documents/lib
 * @description Payment calculation utilities for lease document generation
 * 
 * @dependencies
 * - None (pure functions)
 * 
 * @exports
 * - calculatePayments: Computes first, second, and last payment totals
 * 
 * @example
 * const payments = calculatePayments({
 *   fourWeekRent: 1200,
 *   maintenanceFee: 50,
 *   damageDeposit: 500,
 *   splitleaseCredit: 100,
 *   lastPaymentRent: 300
 * });
 */
```

**LLM Benefit:** An LLM can understand a file's purpose, dependencies, and usage without reading the implementation.

---

### 3.2 Explicit Import/Export Boundaries

**Current Issue:** Deep imports make dependency tracking difficult

```typescript
// ❌ Bad - Deep import
import { formatCurrencyRaw } from '../../../lib/formatters.ts';

// ✅ Good - Barrel import
import { formatCurrencyRaw } from '@shared/formatters';
```

**Add Import Aliases (`deno.json` for Edge Functions):**

```json
{
  "imports": {
    "@shared/": "./_shared/",
    "@shared/core": "./_shared/core/index.ts",
    "@shared/documents": "./_shared/documents/index.ts",
    "@shared/integrations": "./_shared/integrations/index.ts"
  }
}
```

**Add Import Aliases (`tsconfig.json` for Frontend):**

```json
{
  "compilerOptions": {
    "paths": {
      "@logic/*": ["./src/logic/*"],
      "@lib/*": ["./src/lib/*"],
      "@islands/*": ["./src/islands/*"],
      "@shared/*": ["./src/_shared/*"]
    }
  }
}
```

---

### 3.3 CLAUDE.md Hygiene

**Current State:**
- 71 CLAUDE.md files across codebase
- Some are outdated (reference 2025-12-11)
- Inconsistent formatting

**Recommended Structure for Each CLAUDE.md:**

```markdown
# {Directory Name} - LLM Reference

**Last Updated**: {ISO Date}
**Scope**: {One-line description}

## Quick Stats
- Total Files: X
- Key Patterns: Pattern1, Pattern2

## File Index
| File | Purpose | Lines |
|------|---------|-------|
| file1.ts | Description | 120 |

## Key Patterns
### Pattern Name
Description with code example

## Do's and Don'ts
- DO: ...
- DON'T: ...

## Related Documentation
- Link to parent CLAUDE.md
- Link to sibling CLAUDE.md files
```

---

### 3.4 Function Complexity Limits

**Enforce with ESLint:**

```javascript
// eslint.config.js additions
{
  rules: {
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-depth': ['warn', 3],
    'complexity': ['warn', 10],
    'max-params': ['warn', 4]
  }
}
```

**LLM Benefit:** Smaller functions fit entirely in context windows and are easier to reason about.

---

## Part 4: Performance Optimizations

### 4.1 Edge Function Cold Start Reduction

**Current Issue:** Large imports increase cold start time

**Recommendations:**

1. **Lazy Loading for Optional Features:**
```typescript
// Instead of top-level import
import { uploadToGoogleDrive } from './googleDrive.ts';

// Use dynamic import when needed
const { uploadToGoogleDrive } = await import('./googleDrive.ts');
```

2. **Tree-Shakeable Exports:**
```typescript
// ❌ Bad - Imports entire module
export * from './utils.ts';

// ✅ Good - Named exports only
export { formatCurrency, formatDate } from './formatters.ts';
export { validateEmail, validatePhone } from './validators.ts';
```

---

### 4.2 Frontend Bundle Optimization

**Current State:**
- 1,086 files in `islands/`
- Large dependency tree

**Recommendations:**

1. **Route-based Code Splitting:**
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-ui': ['framer-motion', 'styled-components'],
        'vendor-maps': ['@react-google-maps/api'],
        'vendor-forms': ['react-hook-form', 'zod']
      }
    }
  }
}
```

2. **Lazy Load Heavy Components:**
```jsx
const GoogleMap = React.lazy(() => import('./islands/shared/GoogleMap'));
const DatePicker = React.lazy(() => import('./islands/shared/DatePicker'));
```

---

## Part 5: Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
- [ ] Delete `bubble-proxy/` empty directory
- [ ] Remove duplicate constant files
- [ ] Add ESLint complexity rules

### Phase 2: Type Consolidation (3-5 days)
- [ ] Create `_shared/core/types.ts`
- [ ] Migrate Edge Function types
- [ ] Add import aliases to `deno.json`
- [ ] Update all imports

### Phase 3: Handler Standardization (1 week)
- [ ] Create handler template
- [ ] Refactor `lease-documents/` handlers
- [ ] Apply to remaining Edge Functions

### Phase 4: Frontend Logic Cleanup (1-2 weeks)
- [ ] Consolidate day conversion files
- [ ] Add TypeScript to logic layer
- [ ] Create barrel exports
- [ ] Update import paths

### Phase 5: Component Splitting (2-3 weeks)
- [ ] Identify components >200 lines
- [ ] Split into sub-components
- [ ] Add folder structure per large component

### Phase 6: Documentation Refresh (ongoing)
- [ ] Update all CLAUDE.md files
- [ ] Add file headers
- [ ] Generate automated metrics

---

## Appendix: Files to Review

### Largest Files (by line count)
Review for splitting opportunities:

| File | Est. Lines | Priority |
|------|-----------|----------|
| `routes.config.js` | 700+ | Medium |
| `ViewSplitLeasePage.jsx` | 500+ | High |
| `CreateProposalFlowV2.jsx` | 400+ | High |
| `notificationSender.ts` | 500+ | Medium |
| `vmMessagingHelpers.ts` | 600+ | Medium |

### Test Coverage Gaps
Files with no corresponding `*_test.ts`:

| Directory | Files Without Tests |
|-----------|-------------------|
| `lease-documents/handlers/` | All 5 handlers |
| `lease-documents/lib/` | 5 of 7 files |
| `ai-gateway/` | Most files |

---

## Appendix: Naming Conventions

### Edge Functions
```
functions/
  {domain}/              # kebab-case domain
    index.ts             # Entry point
    handlers/            # Request handlers
      {action}.ts        # camelCase action
    lib/                 # Local utilities
      {utility}.ts       # camelCase utility
```

### Frontend
```
src/
  logic/
    calculators/
      {domain}/
        {calculation}.ts    # camelCase, no "calculate" prefix
    rules/
      {domain}/
        {predicate}.ts      # camelCase, starts with is/can/has/should
    processors/
      {domain}/
        {transform}.ts      # camelCase, starts with adapt/extract/process/format
    workflows/
      {domain}/
        {operation}.ts      # camelCase, ends with Workflow
```

---

**Document Version**: 1.0
**Author**: Generated by Gemini for Split Lease Team
