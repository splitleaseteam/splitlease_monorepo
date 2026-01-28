# Pricing Formula Reconciliation - Work Plan (Updated)

**Created:** 2026-01-27
**Updated:** 2026-01-27 (expanded after file discovery)
**Status:** Ready for Implementation
**Priority:** Critical
**Verified Against:** Bubble Backend (via Comet inspection)

---

## Executive Summary

Our frontend and backend pricing calculations do not match the Bubble source of truth. This causes pricing discrepancies of ~2.2% on certain bookings. The root causes have been identified and confirmed against Bubble's actual workflow expressions.

**Discovery Update:** The pricing logic is more distributed than initially thought. There are TWO parallel implementations (frontend `pricingList/` calculators AND backend `pricingCalculator.ts`) that must stay in sync.

---

## Root Causes (Confirmed)

| Issue | Current Implementation | Correct (Bubble) |
|-------|----------------------|------------------|
| **Multiplier formula** | MULTIPLICATIVE: `(1 + markup) × (1 - discount)` | ADDITIVE: `1 + markup - discount` |
| **Nightly unitMarkup** | Missing (not passed to function) | Included in calculation |
| **Unused nights discount** | PROPORTIONAL: `baseDiscount × (unusedNights / 6)` | LINEAR: `unusedNights × 0.03` |
| **Default discount rate** | 0.05 (5%) | 0.03 (3%) |

---

## Golden Formula (from Bubble)

```
multiplier = 1 + siteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscount

guestPrice = hostCompensation × multiplier
```

**Where:**
- `siteMarkup` = 0.17 (17%)
- `unitMarkup` = listing-specific (from 💰Unit Markup field)
- `unusedNightsDiscount` = `(7 - nightsBooked) × 0.03`
- `fullTimeDiscount` = 0.13 (only for 7-night stays)

**Weekly rental type only:** Add `+ weeklyMarkup` to the formula

---

## Work Packages (7 Tasks)

### TASK 1: Fix Frontend Schedule Selector - Nightly Model
**File:** `app/src/lib/scheduleSelector/priceCalculations.js`
**Estimated Scope:** ~30 lines changed
**Dependencies:** None
**Can Parallelize:** Yes

**Changes Required:**

1. **Line 80** - Add `unitMarkup` parameter to function call:
```javascript
// FROM:
const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered);

// TO:
const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup);
```

2. **Lines 217-255** - Refactor `calculateNightlyPrice` function to use ADDITIVE formula:
```javascript
// FROM (current - WRONG):
function calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered) {
  const nightlyHostRate = getNightlyRateForNights(nightsCount, listing);
  const basePrice = nightlyHostRate * nightsCount;
  const fullTimeDiscount = nightsCount === 7 ? basePrice * config.fullTimeDiscount : 0;
  const priceAfterDiscounts = basePrice - fullTimeDiscount;
  const siteMarkup = priceAfterDiscounts * config.overallSiteMarkup;
  const totalPrice = basePrice - fullTimeDiscount + siteMarkup;
  const pricePerNight = totalPrice / nightsCount;
  // ...
}

// TO (correct - ADDITIVE formula):
function calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup = 0) {
  const nightlyHostRate = getNightlyRateForNights(nightsCount, listing);
  const basePrice = nightlyHostRate * nightsCount;

  // Unused nights discount (LINEAR formula)
  const unusedNights = 7 - nightsCount;
  const unusedNightsDiscount = unusedNights * config.unusedNightsDiscountMultiplier;

  // Full-time discount rate (only for 7 nights)
  const fullTimeDiscountRate = nightsCount === 7 ? config.fullTimeDiscount : 0;

  // ADDITIVE multiplier (matching Bubble exactly)
  const multiplier = 1 + config.overallSiteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscountRate;

  const totalPrice = basePrice * multiplier;
  const pricePerNight = totalPrice / nightsCount;
  // ...
}
```

**Verification:** After fix, 7-night multiplier should be `1.04` (not `1.0179`)

---

### TASK 2: Fix Backend Multiplier Formula
**File:** `supabase/functions/pricing-list/utils/pricingCalculator.ts`
**Estimated Scope:** ~5 lines changed
**Dependencies:** None
**Can Parallelize:** Yes

**Changes Required:**

1. **Line 138** - Change from multiplicative to additive:
```typescript
// FROM (WRONG - multiplicative):
const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);

// TO (CORRECT - additive):
const multiplier = 1 + combinedMarkup - totalDiscount;
```

**Verification:** After fix, 7-night multiplier should be `1.04` (not `1.0179`)

---

### TASK 3: Fix Backend Unused Nights Discount Formula
**File:** `supabase/functions/pricing-list/utils/pricingCalculator.ts`
**Estimated Scope:** ~15 lines changed
**Dependencies:** None
**Can Parallelize:** Yes

**Changes Required:**

1. **Line 21** - Update constant name and value:
```typescript
// FROM:
DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,

// TO:
UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,
```

2. **Lines 98-116** - Change from proportional to linear formula:
```typescript
// FROM (WRONG - proportional):
function calculateUnusedNightsDiscountArray(
  baseDiscount: number = PRICING_CONSTANTS.DEFAULT_UNUSED_NIGHTS_DISCOUNT
): number[] {
  // ...
  const discount = unusedNights > 0
    ? baseDiscount * (unusedNights / (maxNights - 1))  // WRONG
    : 0;
}

// TO (CORRECT - linear):
function calculateUnusedNightsDiscountArray(
  discountMultiplier: number = PRICING_CONSTANTS.UNUSED_NIGHTS_DISCOUNT_MULTIPLIER
): number[] {
  // ...
  const discount = unusedNights * discountMultiplier;  // LINEAR
}
```

**Verification:** Discount array should be `[0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]` for nights 1-7

---

### TASK 4: Fix Frontend Calculator - Multiplier Array
**File:** `app/src/logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js`
**Estimated Scope:** ~5 lines changed
**Dependencies:** None
**Can Parallelize:** Yes

**Changes Required:**

1. **Line 78** - Change from multiplicative to additive:
```javascript
// FROM (WRONG - multiplicative):
const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);

// TO (CORRECT - additive):
const multiplier = 1 + combinedMarkup - totalDiscount;
```

2. **Update JSDoc** (lines 10-13):
```javascript
// FROM:
* @rule Multiplier = (1 + combinedMarkup) × (1 - discount).

// TO:
* @rule Multiplier = 1 + combinedMarkup - discount (ADDITIVE formula).
```

**Verification:** After fix, 7-night multiplier should be `1.04`

---

### TASK 5: Fix Frontend Calculator - Unused Nights Discount Array
**File:** `app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js`
**Estimated Scope:** ~10 lines changed
**Dependencies:** Task 6 (constants update)
**Can Parallelize:** Yes (if Task 6 done first)

**Changes Required:**

1. **Lines 56-58** - Change from proportional to linear:
```javascript
// FROM (WRONG - proportional):
const discount = unusedNights > 0
  ? baseDiscount * (unusedNights / (maxNights - 1))
  : 0;

// TO (CORRECT - linear):
const discount = unusedNights * baseDiscount;
```

2. **Update JSDoc** (lines 13-15):
```javascript
// FROM:
* Formula: discount[n] = baseDiscount × (7 - (n + 1)) / 6

// TO:
* Formula: discount[n] = unusedNights × discountMultiplier (LINEAR)
```

**Verification:** Discount array should be `[0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]` for nights 1-7

---

### TASK 6: Update Pricing Constants
**Files:**
- `app/src/logic/constants/pricingConstants.js`
- `supabase/functions/pricing-list/utils/pricingCalculator.ts` (if not done in Task 3)

**Estimated Scope:** ~4 lines changed total
**Dependencies:** None (should be done FIRST or in parallel)
**Can Parallelize:** Yes

**Changes Required:**

1. **Frontend constants** (`pricingConstants.js` line 33):
```javascript
// FROM:
DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,

// TO:
UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,
```

2. **Backend constants** (`pricingCalculator.ts` line 21) - if not already done in Task 3:
```typescript
// FROM:
DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,

// TO:
UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,
```

**Note:** Also update any import references from `DEFAULT_UNUSED_NIGHTS_DISCOUNT` to `UNUSED_NIGHTS_DISCOUNT_MULTIPLIER`

---

### TASK 7: Create Verification Test Script
**File:** `scripts/verify-pricing-formulas.js` (new file)
**Estimated Scope:** ~100 lines
**Dependencies:** Tasks 1-6 must be complete
**Can Parallelize:** No (sequential after all fixes)

**Purpose:** Verify all systems produce identical results

**Test Cases:**
```javascript
const TEST_CASES = [
  // nights, hostRate, unusedDiscount, expectedMultiplier, expectedGuestPrice
  { nights: 2, hostRate: 350, unusedDiscount: 0.15, multiplier: 1.02, price: 357.00 },
  { nights: 3, hostRate: 320.83, unusedDiscount: 0.12, multiplier: 1.05, price: 336.87 },
  { nights: 4, hostRate: 295.31, unusedDiscount: 0.09, multiplier: 1.08, price: 318.93 },
  { nights: 5, hostRate: 280, unusedDiscount: 0.06, multiplier: 1.11, price: 310.80 },
  { nights: 6, hostRate: 150.39, unusedDiscount: 0.03, multiplier: 1.14, price: 171.44 },
  { nights: 7, hostRate: 280, unusedDiscount: 0, multiplier: 1.04, price: 291.20 },
];
```

---

## Parallel Execution Plan

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           PARALLEL PHASE (All Independent)                          │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────────────┤
│  TASK 1  │  TASK 2  │  TASK 3  │  TASK 4  │  TASK 5  │          TASK 6              │
│ Frontend │ Backend  │ Backend  │ Frontend │ Frontend │         Constants            │
│ Schedule │ Multiplr │ Discount │ Multiplr │ Discount │   (do first or parallel)     │
│ Selector │ Formula  │ Formula  │ Calc     │ Calc     │                              │
│ ~30 lines│ ~5 lines │ ~15 lines│ ~5 lines │ ~10 lines│         ~4 lines             │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SEQUENTIAL PHASE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│   TASK 7: Verification Script (depends on 1-6)                                      │
│   - Run all test cases                                                               │
│   - Verify frontend matches backend matches Bubble                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Files Modified Summary

| File | Task(s) | Lines Changed |
|------|---------|---------------|
| `app/src/lib/scheduleSelector/priceCalculations.js` | 1 | ~30 |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | 2, 3 | ~20 |
| `app/src/logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js` | 4 | ~5 |
| `app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js` | 5 | ~10 |
| `app/src/logic/constants/pricingConstants.js` | 6 | ~2 |
| `scripts/verify-pricing-formulas.js` | 7 | ~100 (new) |

**Total:** ~170 lines across 6 files

---

## Acceptance Criteria

1. **7-night multiplier** = `1.04` (all systems)
2. **Unused nights discount array** = `[0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]`
3. **Nightly model includes unitMarkup** in calculation
4. **ZPricingUnitTestPage** shows matching values (within $0.01 rounding)
5. **No regression** in Monthly/Weekly calculations (they already use additive-style)

---

## Agent Assignment Recommendations

### Option A: 4 Agents (Maximum Parallelism)
| Agent | Tasks | Focus Area |
|-------|-------|------------|
| Agent A | Task 1 | Frontend schedule selector |
| Agent B | Tasks 2 + 3 | Backend Edge Function |
| Agent C | Tasks 4 + 5 + 6 | Frontend calculators + constants |
| Agent D | Task 7 | Verification (after A, B, C complete) |

### Option B: 3 Agents
| Agent | Tasks | Focus Area |
|-------|-------|------------|
| Agent A | Tasks 1, 4, 5, 6 | All frontend changes |
| Agent B | Tasks 2, 3 | All backend changes |
| Agent C | Task 7 | Verification (after A + B complete) |

### Option C: 2 Agents
| Agent | Tasks | Focus Area |
|-------|-------|------------|
| Agent A | Tasks 1-6 | All implementation (can still parallelize internally) |
| Agent B | Task 7 | Verification |

---

## Reference Documents

- **Debug Analysis:** `.claude/plans/New/20260127202754-debug-pricing-formula-discrepancies.md`
- **Discovery Report:** `docs/pricing/backend-pricing-files.md`
- **Bubble PDF Screenshot:** `C:\Users\Split Lease\Downloads\current-pricing-page.pdf`
- **Comet Verification:** Confirmed via Bubble editor inspection (2026-01-27)
