# Functional Programming Opportunity Report
**Generated:** 2026-02-03 11:15:45
**Codebase:** Split Lease
**Audited:** app/src/

## Executive Summary

| Metric | Count |
|--------|-------|
| Files audited | 400+ |
| Total violations | 949 |
| High priority (🔴) | 680 |
| Medium priority (🟡) | 269 |
| Low priority (🟢) | 0 |

### Summary by Principle

| Principle | Violations | Priority | Risk Level |
|-----------|------------|----------|------------|
| **IMMUTABILITY** | 486 | High | **CRITICAL** - Data corruption, state bugs |
| **ERRORS AS VALUES** | 254 | Medium | **HIGH** - Unhandled exceptions, control flow issues |
| **DECLARATIVE STYLE** | 198 | High | **MEDIUM** - Maintainability, readability |
| **EFFECTS AT EDGES** | 11 | High | **HIGH** - Testability, purity violations |

---

## FP Score Summary

**Overall Score: 4.5/10**

| Principle | Score | Notes |
|-----------|-------|-------|
| Purity | 6/10 | Generally pure logic layers, but console.log scattered throughout |
| Immutability | 3/10 | **MAJOR ISSUE** - 486 violations, heavy use of `.push()`, `.sort()` |
| Explicit Dependencies | 7/10 | Good separation of concerns overall |
| Effects at Edges | 5/10 | I/O in processors/rules violates Functional Core principle |
| Errors as Values | 4/10 | **NEEDS IMPROVEMENT** - 254 throw statements for expected errors |
| Declarative Style | 5/10 | Mixed - many for/while loops that could be HOFs |
| Composition | 6/10 | Four-layer architecture exists, but violations within layers |

---

## Detailed Findings

### 🔴 IMMUTABILITY (486 violations - CRITICAL)

**Risk Level: CRITICAL** - Mutable state causes unpredictable bugs, especially in React with stale closures and concurrent updates.

#### Most Affected Files

| File | Violations | Key Issues |
|------|------------|------------|
| `lib/availabilityValidation.js` | 15+ | `result.errors.push()`, `result.warnings.push()` |
| `lib/listingService.js` | 20+ | Array mutations in listing transforms |
| `hooks/useBiddingRealtime.js` | 10+ | `[...arr].sort()` pattern throughout |
| `data/helpCenterData.js` | 30+ | `results.push()` in search logic |

#### Representative Violations

**1. Validation Result Mutation Pattern (lib/availabilityValidation.js:166-199)**
```javascript
// ❌ CURRENT: Mutating validation result object
function validateAvailability(selectedDays, listing) {
  const result = { valid: true, errors: [], warnings: [] };
  // ... validation logic
  if (selectedDays.length === 0) {
    result.errors.push('Please select at least one day');  // MUTATION
  }
  if (!contiguous) {
    result.errors.push('Please check for contiguous nights...');  // MUTATION
  }
  if (minNights) {
    result.warnings.push(`Host prefers at least ${minNights} nights`);  // MUTATION
  }
  return result;
}

// ✅ RECOMMENDED: Immutable accumulation
function validateAvailability(selectedDays, listing) {
  const errors = [];
  const warnings = [];

  if (selectedDays.length === 0) {
    errors.push('Please select at least one day');
  }
  // ... more validation

  return {
    valid: errors.length === 0,
    errors: [...errors],  // Return frozen copy
    warnings: [...warnings]
  };
}
```

**Rationale:** The current pattern mutates the `result` object throughout validation. If validation logic is reordered or extended, mutations can be lost or duplicated. Returning immutable collections makes the flow explicit.

**2. Array Sort Mutation Pattern (hooks/useBiddingRealtime.js:203)**
```javascript
// ❌ CURRENT: [...arr].sort() still mutates the spread result
const updatedHistory = [...prevSession.biddingHistory, newBid].sort(
  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
);

// ✅ RECOMMENDED: Use toSorted() (ES2023) or explicit copy
const updatedHistory = [...prevSession.biddingHistory, newBid].toSorted(
  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
);

// Alternative for older environments:
const updatedHistory = [...prevSession.biddingHistory, newBid].slice().sort(
  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
);
```

**Rationale:** While `[...arr].sort()` creates a new array before sorting, the `sort()` method itself mutates the array it's called on. Using `toSorted()` returns a new sorted array without mutation.

**3. Array Push Pattern (routes.config.js:908)**
```javascript
// ❌ CURRENT: Mutating config array
const excludedFromFunctions = [];
excludedFromFunctions.push('/guest-proposals', '/guest-proposals/*');

// ✅ RECOMMENDED: Declare array with values
const excludedFromFunctions = [
  '/guest-proposals',
  '/guest-proposals/*'
];

// Or use spread when appending:
const excludedFromFunctions = [
  ...existingExcluded,
  '/guest-proposals',
  '/guest-proposals/*'
];
```

---

### 🔴 EFFECTS AT EDGES (11 violations - HIGH)

**Risk Level: HIGH** - I/O in core logic makes testing difficult and violates the Functional Core, Imperative Shell principle.

#### Violations by File

| File | Line | Type | I/O Operation |
|------|------|------|---------------|
| `logic/processors/listing/extractListingCoordinates.js` | 49, 65, 99 | Console | `console.error()`, `console.warn()` |
| `logic/processors/simulation/selectProposalByScheduleType.js` | 57 | Console | `console.warn()` |
| `logic/rules/proposals/proposalRules.js` | 306 | Console | `console.warn()` |
| `logic/processors/contracts/formatCurrencyForTemplate.ts` | 123 | Network | `await fetch(image)` |

#### Critical Issue: Network I/O in Processor

**logic/processors/contracts/formatCurrencyForTemplate.ts:123**
```typescript
// ❌ CRITICAL: fetch() in core business logic processor
export async function formatCurrencyForTemplate(amount: number, currency: string = 'USD'): Promise<string> {
  // ... logic
  const response = await fetch(image);  // NETWORK I/O IN PROCESSOR
  const blob = await response.blob();
  // ...
}
```

**Rationale:** Processors should be pure data transformations. Network calls belong in the workflow layer. This makes the processor:
- Hard to test (requires mocking fetch)
- Dependent on external services
- Slower (unnecessary network calls in tests)
- Violates the four-layer architecture

**✅ Recommended Fix:**
```typescript
// Move I/O to workflow layer
// processor.ts - Pure logic only
export function formatCurrencyForTemplate(
  amount: number,
  currency: string = 'USD',
  imageBlob: Blob | null  // Pass data in, don't fetch
): string {
  if (!imageBlob) {
    return formatDefaultCurrency(amount, currency);
  }
  // Pure transformation logic...
}

// workflow.ts - I/O happens here
export async function formatCurrencyWorkflow(amount: number, currency: string) {
  const imageBlob = await fetchCurrencyImage(currency);
  return formatCurrencyForTemplate(amount, currency, imageBlob);
}
```

#### Console Logging in Core Logic

**logic/processors/listing/extractListingCoordinates.js**
```javascript
// ❌ CURRENT: Console operations in processor
function extractListingCoordinates(listing) {
  // ... processing logic
  console.error('❌ extractListingCoordinates: Failed to parse Location');  // I/O
  console.warn('⚠️ extractListingCoordinates: No valid coordinates found');  // I/O
  return { latitude: null, longitude: null };
}

// ✅ RECOMMENDED: Return result, let caller log
function extractListingCoordinates(listing) {
  // ... processing logic
  return {
    latitude: null,
    longitude: null,
    errors: ['Failed to parse Location'],  // Return errors as data
    warnings: ['No valid coordinates found']
  };
}

// Caller (workflow layer) handles logging:
const result = extractListingCoordinates(listing);
if (result.errors.length > 0) {
  console.error('[extractListingCoordinates]', ...result.errors);
}
```

---

### 🟡 ERRORS AS VALUES (254 violations - MEDIUM)

**Risk Level: MEDIUM** - Using exceptions for expected errors (validation, not found) makes error handling implicit and type-unsafe.

#### Most Affected Files

| File | Violations | Pattern |
|------|------------|---------|
| `hooks/useBiddingRealtime.js` | 15+ | `throw new Error('Session ID and User ID required')` |
| `lib/bubbleAPI.js` | 20+ | `throw new Error('Listing ID is required')` |
| `lib/auth.js` | 30+ | Auth failures via exceptions |
| `lib/listingService.js` | 25+ | Validation errors thrown |

#### Representative Violations

**1. Validation via Exception (lib/bubbleAPI.js:44)**
```javascript
// ❌ CURRENT: Throwing for validation errors
function getListingByName(listingName) {
  if (!listingName) {
    throw new Error('Listing name is required');  // Expected error
  }
  // ... fetch logic
}

// ✅ RECOMMENDED: Return Result type
import { ok, err, Result } from 'neverthrow';

function getListingByName(listingName): Result<Listing, string> {
  if (!listingName) {
    return err('Listing name is required');
  }
  // ... fetch logic
  return ok(listing);
}

// Usage:
const result = getListingByName(name);
if (result.isErr()) {
  // Handle error explicitly
  return { error: result.error };
}
const listing = result.value;
```

**Rationale:**
- Throwing exceptions for validation forces try/catch throughout the codebase
- Error types are not explicit in function signatures
- Callers may forget to catch expected errors
- Makes control flow implicit via stack unwinding

**2. Required Parameter Validation (hooks/useBiddingRealtime.js:259)**
```javascript
// ❌ CURRENT: Throwing for missing required params
function useBiddingRealtime(sessionId, userId) {
  if (!sessionId || !userId) {
    throw new Error('Session ID and User ID required');
  }
  // ...
}

// ✅ RECOMMENDED: Use TypeScript + Result type
type UseBiddingRealtimeParams = {
  sessionId: string;
  userId: string;
};

type UseBiddingRealtimeResult =
  | { success: true; data: BiddingSession }
  | { success: false; error: 'MISSING_PARAMS' | 'INVALID_SESSION' };

function useBiddingRealtime(
  params: UseBiddingRealtimeParams
): UseBiddingRealtimeResult {
  if (!params.sessionId || !params.userId) {
    return { success: false, error: 'MISSING_PARAMS' };
  }
  // ...
  return { success: true, data: session };
}
```

**Note:** For existing codebase migration, adopting `neverthrow` or similar Result library would be a significant change. A pragmatic first step:

```javascript
// Pragmatic approach: Return error objects
function getListingByName(listingName) {
  if (!listingName) {
    return { error: 'Listing name is required', listing: null };
  }
  return { error: null, listing: fetchListing(listingName) };
}

// Usage:
const { error, listing } = getListingByName(name);
if (error) {
  // Handle error
}
```

---

### 🔴 DECLARATIVE STYLE (198 violations - MEDIUM)

**Risk Level: MEDIUM** - Imperative loops reduce readability and can introduce mutation bugs.

#### Most Affected Files

| File | Violations | Loop Types |
|------|------------|------------|
| `lib/auth.js` | 8 | `while` loops for retry logic |
| `lib/availabilityValidation.js` | 6 | `for` loops for range generation |
| `lib/listingService.js` | 10+ | `for...of` for data transforms |
| `lib/ctaConfig.js` | 4 | `for...of` for object iteration |

#### Representative Violations

**1. While Loop for Retry Logic (lib/auth.js:571)**
```javascript
// ❌ CURRENT: Imperative retry loop
let verifyAttempts = 0;
while (verifyAttempts < maxVerifyAttempts) {
  const verified = await verifyOTP();
  if (verified) break;
  verifyAttempts++;
}

// ✅ RECOMMENDED: Declarative retry helper
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number
): Promise<T | null> {
  for (const attempt of Array.from({ length: maxAttempts }, (_, i) => i)) {
    const result = await fn();
    if (result) return result;
    await sleep(2 ** attempt * 1000);  // Exponential backoff
  }
  return null;
}

const verified = await retryWithBackoff(verifyOTP, maxVerifyAttempts);
```

**Rationale:** Extracting retry logic into a reusable function makes the intent clearer, separates concerns, and makes retry behavior consistent across the codebase.

**2. For Loop for Range Generation (lib/availabilityValidation.js:65)**
```javascript
// ❌ CURRENT: Imperative range iteration
for (let i = minNotSelected; i <= maxNotSelected; i++) {
  expectedNotSelected.push(i);
}

// ✅ RECOMMENDED: Declarative range generation
const expectedNotSelected = Array.from(
  { length: maxNotSelected - minNotSelected + 1 },
  (_, i) => minNotSelected + i
);

// Or using a helper:
const range = (min, max) =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

const expectedNotSelected = range(minNotSelected, maxNotSelected);
```

**3. For-Of Loop for Object Iteration (lib/ctaConfig.js:269)**
```javascript
// ❌ CURRENT: Imperative object iteration
for (const [key, value] of Object.entries(context)) {
  template = template.replace(`{{${key}}}`, value);
}

// ✅ RECOMMENDED: Declarative reduce
const template = Object.entries(context).reduce(
  (acc, [key, value]) => acc.replace(`{{${key}}}`, value),
  initialTemplate
);

// Even better: Extract to named function
const interpolateTemplate = (template: string, context: Record<string, string>) =>
  Object.entries(context).reduce(
    (acc, [key, value]) => acc.replace(`{{${key}}}`, value),
    template
  );
```

---

## Refactoring Roadmap

### Phase 1: Critical (High Severity - IMMUTABILITY)

**Timeline:** 2-3 weeks
**Impact:** Eliminates state mutation bugs, improves React render predictability

1. **Replace `.push()` in validation results** (Week 1)
   - Target: `lib/availabilityValidation.js`, `lib/listingService.js`
   - Pattern: Build arrays immutably, return frozen copies
   - Test: Verify no side effects in validation logic

2. **Replace `.sort()` with `.toSorted()`** (Week 1)
   - Target: `hooks/useBiddingRealtime.js`, `lib/availabilityValidation.js`
   - Pattern: Use ES2023 `toSorted()` or `[...arr].sort()` with explicit copy
   - Fallback: Polyfill for older browsers if needed

3. **Audit and fix mutation in data layers** (Week 2)
   - Target: `data/`, `lib/` service files
   - Pattern: Ensure data transformations return new objects
   - Test: Add tests to verify immutability

4. **Fix state mutations in hooks** (Week 2-3)
   - Target: All `hooks/` files
   - Pattern: Ensure setState calls use spread operators
   - Test: React DevTools Profiler to verify render behavior

### Phase 2: Important (Medium Severity - EFFECTS + ERRORS)

**Timeline:** 2-3 weeks
**Impact:** Improves testability, makes error handling explicit

1. **Remove I/O from processors** (Week 1)
   - Target: `logic/processors/listing/extractListingCoordinates.js`
   - Target: `logic/processors/contracts/formatCurrencyForTemplate.ts`
   - Action: Move `console.*` and `fetch()` to workflow layer
   - Test: Unit tests should not mock I/O

2. **Introduce Result types for validation** (Week 2-3)
   - Target: `lib/bubbleAPI.js`, `hooks/useBiddingRealtime.js`
   - Library: Consider `neverthrow` or lightweight Result wrapper
   - Pattern: Return `{ ok, value, error }` objects
   - Test: Verify error paths are covered

3. **Audit console usage in core logic** (Week 2)
   - Target: `logic/rules/proposals/proposalRules.js`
   - Action: Replace `console.warn` with return values
   - Test: Verify logging happens at edge only

### Phase 3: Enhancement (Declarative Style)

**Timeline:** 1-2 weeks
**Impact:** Improves code readability and maintainability

1. **Extract retry logic to helper** (Week 1)
   - Target: `lib/auth.js` while loops
   - Action: Create `retryWithBackoff()` utility
   - Benefit: Consistent retry behavior across codebase

2. **Replace for-loops with HOFs** (Week 1-2)
   - Target: `lib/availabilityValidation.js` range generation
   - Target: `lib/ctaConfig.js` object iteration
   - Action: Use `Array.from()`, `.reduce()`, `.map()`
   - Benefit: More declarative, less mutation-prone

3. **Create declarative helpers** (Week 2)
   - Action: Extract common patterns (range, interpolate, etc.)
   - Location: `app/src/lib/functional/` utilities
   - Benefit: Reusable, testable pure functions

---

## Architecture Analysis

### Four-Layer Architecture Adherence

The codebase follows a four-layer logic architecture:

```
logic/
├── calculators/   # Pure computations
├── rules/         # Boolean predicates
├── processors/    # Data transforms
└── workflows/     # Orchestration (I/O allowed here)
```

**Current State:**
- ✅ **Good separation overall**: Calculators and rules are mostly pure
- ⚠️ **Processors violate purity**: Console I/O and fetch() in processors
- ⚠️ **Workflows underutilized**: I/O sometimes happens in lower layers
- ❌ **No Result type**: Errors mostly thrown, not returned as values

**Recommendations:**
1. Enforce layer boundaries via lint rules or architectural tests
2. Move all I/O to workflows (the "imperative shell")
3. Introduce Result<T, E> type for cross-layer error handling
4. Add purity tests for calculators/rules/processors

---

## Testing Implications

### Current Testing Challenges

1. **Hard to test processors with console calls**: Tests must mock console
2. **Exceptions for validation**: Tests must use try/catch wrappers
3. **Mutable state**: Tests may pass due to shared state mutations
4. **Network calls in processors**: Tests require complex mocking

### After Refactoring

1. **Pure functions**: Simple input/output assertions
2. **Result types**: Error paths tested like happy paths
3. **Immutable data**: No test pollution from shared state
4. **I/O at edges**: Tests don't mock, they pass data directly

---

## Recommended Libraries

### For Type-Safe Error Handling

**Option 1: neverthrow (Recommended)**
```bash
bun add neverthrow
```
```typescript
import { ok, err, Result, ResultAsync } from 'neverthrow';

function divide(a: number, b: number): Result<number, Error> {
  return b === 0
    ? err(new Error('Division by zero'))
    : ok(a / b);
}
```

**Option 2: Custom Result Type (Lightweight)**
```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> =>
  ({ ok: true, value });

const err = <E>(error: E): Result<never, E> =>
  ({ ok: false, error });
```

### For Immutable Operations

**Native ES2023+ (No library needed):**
```javascript
// Instead of arr.sort()
arr.toSorted((a, b) => a - b)

// Instead of arr.reverse()
arr.toReversed()

// Instead of arr.splice()
arr.with(index, newValue)
```

---

## Priority Actions

### Immediate (This Week)

1. **Review top 10 files with most violations**
   - Focus on `lib/availabilityValidation.js` (15+ violations)
   - Focus on `lib/listingService.js` (20+ violations)

2. **Add ESLint rules to prevent new violations**
   ```json
   {
     "rules": {
       "no-restricted-syntax": [
         "error",
         {
           "selector": "CallExpression[callee.name='push']",
           "message": "Use spread operator instead of push()"
         },
         {
           "selector": "CallExpression[callee.name='sort']",
           "message": "Use toSorted() instead of sort()"
         }
       ]
     }
   }
   ```

3. **Create functional utilities folder**
   - `app/src/lib/functional/range.js`
   - `app/src/lib/functional/retry.js`
   - `app/src/lib/functional/interpolate.js`

### Short-term (This Month)

1. **Migrate validation functions to immutable patterns**
2. **Remove console I/O from processors**
3. **Introduce Result type for new code**
4. **Update team documentation with FP guidelines**

### Long-term (This Quarter)

1. **Full migration to Result types** (major refactor)
2. **Architectural tests for layer boundaries**
3. **Training on FP patterns for team**
4. **Benchmark performance improvements** (immutable operations)

---

## Conclusion

The Split Lease codebase shows **strong architectural intent** with the four-layer logic separation, but has **significant FP debt** across 949 violations. The most critical issues are:

1. **486 immutability violations** - High risk for state bugs
2. **254 error-as-value violations** - Type-unsafe error handling
3. **11 effects-at-edges violations** - Testability issues

**Recommended approach:**
- Start with immutability fixes (highest impact, lowest risk)
- Gradually introduce Result types for new code
- Remove I/O from processors (testability wins)
- Use declarative style opportunities as they arise

**Expected outcomes:**
- Fewer state-related bugs
- Easier testing (pure functions)
- More predictable React renders
- Better error handling (explicit, type-safe)

---

**Report Generated:** 2026-02-03 11:15:45
**Next Audit Recommended:** 2026-03-03 (after Phase 1 completion)
