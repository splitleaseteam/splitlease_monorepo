# Functional Programming Opportunity Report

**Generated:** 2026-01-28T07:30:00
**Codebase:** Split Lease
**Tool Used:** fp_audit.py automated scanner

## Executive Summary

- **Files audited:** 1,093 JavaScript/JSX files
- **Total violations:** 761
- **High priority:** 532
- **Medium priority:** 229
- **Low priority:** 0

## Summary by Principle

| Principle | Violations | Priority | Notes |
|-----------|------------|----------|-------|
| IMMUTABILITY | 395 | High | Array mutations (push, sort, splice) |
| ERRORS AS VALUES | 216 | Medium | Exceptions for validation errors |
| DECLARATIVE STYLE | 145 | High | Imperative for/while loops |
| EFFECTS AT EDGES | 5 | High | I/O in core logic (console.log in calculators/rules) |
| PURITY | - | N/A | Not separately detected |
| COMPOSITION | - | N/A | Not separately detected |

## Detailed Findings

### IMMUTABILITY (395 violations)

The majority of violations are array mutations using `.push()` and `.sort()`.

#### High Severity Examples

**`routes.config.js:847`**
```javascript
excludedFromFunctions.push('/guest-proposals', '/guest-proposals/*');
```
**Fix:** `excludedFromFunctions = [...excludedFromFunctions, '/guest-proposals', '/guest-proposals/*'];`

**`lib/availabilityValidation.js:31`**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```
**Note:** This is actually CORRECT - using spread before sort. Scanner flagged `.sort()` presence but the pattern is correct.

**Common Pattern - Building arrays with push:**
Many files build arrays in loops using `push()`:
- `lib/photoUpload.js` - Building byte arrays
- `lib/listingService.js` - Building day arrays
- `logic/calculators/payments/*.js` - Building payment schedules

### DECLARATIVE STYLE (145 violations)

Most violations are imperative `for` loops that could use `map/filter/reduce`.

#### Categories of For Loops Found

| Category | Count | Notes |
|----------|-------|-------|
| `for (let i = 0; ...)` index loops | ~50 | Often needed for index-based logic |
| `for (const item of array)` | ~60 | Could become `.forEach()` or `.map()` |
| `while` retry loops | ~15 | Auth retry logic, polling |
| `for...in` object iteration | ~20 | Could use `Object.entries().forEach()` |

#### Examples That Should Be Refactored

**`lib/listingService.js:791`**
```javascript
for (const day of dayOrder) {
  // build day map
}
```
**Better:** `const dayMap = dayOrder.reduce((acc, day) => ({ ...acc, [day]: value }), {});`

**`logic/rules/pricingList/canCalculatePricing.js:47`**
```javascript
for (const field of rateFields) {
  if (!listing[field]) return false;
}
```
**Better:** `return rateFields.every(field => listing[field]);`

#### Examples That Should Keep For Loops

Some `for` loops are appropriate and shouldn't be changed:
- Binary data processing (`lib/photoUpload.js`) - Performance critical
- Index-based gap detection (`lib/availabilityValidation.js`) - Needs i, i-1 access
- Auth retry loops (`lib/auth.js`) - While loops with async/await

### EFFECTS AT EDGES (5 violations)

These are the most critical violations - I/O operations in pure business logic.

| File | Line | Issue |
|------|------|-------|
| `logic/rules/proposals/proposalRules.js` | 306 | `console.warn` for cache miss |
| `logic/processors/listing/extractListingCoordinates.js` | 49 | `console.error` for parse failure |
| `logic/processors/listing/extractListingCoordinates.js` | 65 | `console.error` for address parse failure |
| (2 more in similar files) | - | Console logging in processors |

**Fix Pattern:**
```javascript
// BEFORE (impure)
function extractCoordinates(listing) {
  if (!listing.location) {
    console.error('No location'); // I/O in pure function!
    return null;
  }
}

// AFTER (pure)
function extractCoordinates(listing) {
  if (!listing.location) {
    return { success: false, error: 'No location', value: null };
  }
  return { success: true, error: null, value: coordinates };
}
```

### ERRORS AS VALUES (216 violations)

These are `throw new Error()` statements used for validation errors.

#### High Frequency Files

| File | Violations | Pattern |
|------|------------|---------|
| `lib/bubbleAPI.js` | 15+ | Validation throws |
| `lib/auth.js` | 20+ | Auth validation throws |
| `lib/listingService.js` | 15+ | Input validation throws |
| Various page logic hooks | 100+ | User input validation |

**Example:**
```javascript
// Current - Exception for flow control
if (!email) throw new Error('Email is required');

// Better - Return result type
if (!email) return { success: false, error: 'Email is required' };
```

**Note:** This is a stylistic choice. The codebase consistently uses exceptions for validation which is acceptable in JavaScript, though Result types would be more FP-pure.

## Refactoring Roadmap

### Phase 1: Critical (High Severity)

Priority fixes that improve code quality:

1. **Remove console.log from logic/ directory** (5 files)
   - `logic/rules/proposals/proposalRules.js`
   - `logic/processors/listing/extractListingCoordinates.js`
   - Return error objects instead of logging

2. **Convert common push-in-loop patterns** (Top 10 files)
   - `lib/listingService.js` - Day array building
   - `logic/calculators/payments/*.js` - Payment schedule building

### Phase 2: Important (Medium Severity)

1. **Convert simple for-of loops to array methods**
   - Files in `logic/rules/` directory
   - Use `.every()`, `.some()`, `.find()` where appropriate

2. **Review throw patterns in validation**
   - Consider Result type pattern for core validation functions
   - Keep throws in API boundary code

### Phase 3: Enhancement (Low Severity)

1. **Document intentional imperative loops**
   - Add comments explaining why `for` loops are kept
   - Performance-critical sections
   - Index-dependent algorithms

## FP Score Summary

**Overall Score: 6.5/10**

| Principle | Score | Notes |
|-----------|-------|-------|
| Purity | 7/10 | Good separation in logic/ directory |
| Immutability | 5/10 | Many array mutations with push |
| Explicit Dependencies | 8/10 | Good use of parameters |
| Effects at Edges | 6/10 | Some I/O leaking into core |
| Errors as Values | 5/10 | Exceptions used consistently but not FP-idiomatic |
| Declarative Style | 6/10 | Mix of imperative and declarative |
| Composition | 7/10 | Good function composition in workflows |

## Positive Patterns Observed

The codebase does follow several FP principles well:

1. **Four-Layer Architecture** - Clear separation of concerns
   - Calculators = pure functions
   - Rules = boolean predicates
   - Processors = data transforms
   - Workflows = orchestration with I/O

2. **Spread Operator Usage** - Many files correctly use:
   - `[...array].sort()` instead of `array.sort()`
   - `{...object, newField: value}` for updates

3. **Named Parameters** - Good use of destructured objects for clarity

4. **Single Responsibility** - Most functions in logic/ are focused

## Recommendations

### Immediate Actions
- [ ] Remove 5 console.log statements from logic/ directory
- [ ] Add ESLint rule to prevent console.* in logic/ directory
- [ ] Document intentional exceptions to FP patterns

### Tooling
- [ ] Consider `eslint-plugin-fp` for enforcing immutability
- [ ] Add pre-commit hook to run FP audit on changed files
- [ ] Configure IDE to highlight mutating array methods

### Training
- [ ] Share FP patterns guide with team
- [ ] Document preferred array transformation patterns
- [ ] Create code review checklist for FP compliance

## Files Changed by This Audit

No files were changed - this is an analysis-only audit.

## Appendix: Full Violation List

The complete list of 761 violations is available in:
`fp_audit_report.md` (354KB)

Clean up after review:
```bash
rm fp_audit_report.md
```
