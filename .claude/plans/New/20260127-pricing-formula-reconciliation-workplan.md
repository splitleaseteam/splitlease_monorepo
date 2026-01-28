# Pricing Formula Reconciliation - Work Plan

**Created:** 2026-01-27
**Status:** Ready for Implementation
**Priority:** Critical
**Verified Against:** Bubble Backend (via Comet inspection)

---

## Executive Summary

Our frontend and backend pricing calculations do not match the Bubble source of truth. This causes pricing discrepancies of ~2.2% on certain bookings. The root causes have been identified and confirmed against Bubble's actual workflow expressions.

---

## Root Causes (Confirmed)

| Issue | Current Implementation | Correct (Bubble) |
|-------|----------------------|------------------|
| **Multiplier formula** | MULTIPLICATIVE: `(1 + markup) × (1 - discount)` | ADDITIVE: `1 + markup - discount` |
| **Nightly unitMarkup** | Missing (not passed to function) | Included in calculation |
| **Unused nights discount** | PROPORTIONAL: `baseDiscount × (unusedNights / 6)` | LINEAR: `unusedNights × 0.03` |

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

## Work Packages

### TASK 1: Fix Frontend Nightly Model
**File:** `app/src/lib/scheduleSelector/priceCalculations.js`
**Estimated Scope:** ~30 lines changed
**Dependencies:** None

**Changes Required:**

1. **Line 80** - Add `unitMarkup` parameter to function call:
```javascript
// FROM:
const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered);

// TO:
const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup);
```

2. **Lines 217-255** - Refactor `calculateNightlyPrice` function:
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
**Dependencies:** None (can run in parallel with Task 1)

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
**Estimated Scope:** ~10 lines changed
**Dependencies:** None (can run in parallel with Tasks 1 & 2)

**Changes Required:**

1. **Lines 98-116** - Change from proportional to linear formula:
```typescript
// FROM (WRONG - proportional):
function calculateUnusedNightsDiscountArray(
  baseDiscount: number = PRICING_CONSTANTS.DEFAULT_UNUSED_NIGHTS_DISCOUNT
): number[] {
  const maxNights = PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH;
  const discountArray: number[] = [];

  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1;
    const unusedNights = maxNights - nightsBooked;

    const discount = unusedNights > 0
      ? baseDiscount * (unusedNights / (maxNights - 1))  // WRONG
      : 0;

    discountArray.push(roundToFourDecimals(discount));
  }
  return discountArray;
}

// TO (CORRECT - linear):
function calculateUnusedNightsDiscountArray(
  discountMultiplier: number = 0.03  // ZAT config value
): number[] {
  const maxNights = PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH;
  const discountArray: number[] = [];

  for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
    const nightsBooked = nightIndex + 1;
    const unusedNights = maxNights - nightsBooked;

    // LINEAR formula: unusedNights × multiplier
    const discount = unusedNights * discountMultiplier;

    discountArray.push(roundToFourDecimals(discount));
  }
  return discountArray;
}
```

2. **Update constant** (line 21):
```typescript
// FROM:
DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,

// TO:
UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,
```

**Verification:** Discount array should be `[0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0]` for nights 1-7

---

### TASK 4: Create Verification Test Script
**File:** `scripts/verify-pricing-formulas.js` (new file)
**Estimated Scope:** ~100 lines
**Dependencies:** Tasks 1-3 must be complete

**Purpose:** Verify all three systems produce identical results

**Test Cases:**
```javascript
const TEST_CASES = [
  { nights: 2, hostRate: 350, expected: { multiplier: 1.17, price: 409.50 } },
  { nights: 3, hostRate: 320.83, expected: { multiplier: 1.17, price: 375.37 } },
  { nights: 4, hostRate: 295.31, expected: { multiplier: 1.17, price: 345.51 } },
  { nights: 7, hostRate: 280, expected: { multiplier: 1.04, price: 291.20 } },
];
```

---

### TASK 5: Update ZPricingUnitTestPage (Optional)
**File:** `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`
**Estimated Scope:** Review and verify
**Dependencies:** Tasks 1-3

**Purpose:** Ensure the test page reflects the corrected formulas and shows matching values across Workflow/Formula/Backend columns.

---

## Parallel Execution Plan

```
┌─────────────────────────────────────────────────────────┐
│                   PARALLEL PHASE                        │
├──────────────┬──────────────┬──────────────────────────┤
│   TASK 1     │   TASK 2     │         TASK 3           │
│   Frontend   │   Backend    │    Backend Unused        │
│   Nightly    │   Multiplier │    Nights Discount       │
│   ~30 lines  │   ~5 lines   │    ~10 lines             │
└──────────────┴──────────────┴──────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  SEQUENTIAL PHASE                       │
├─────────────────────────────────────────────────────────┤
│   TASK 4: Verification Script (depends on 1-3)         │
│   TASK 5: Update Test Page (depends on 1-3)            │
└─────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

1. **7-night multiplier** = `1.04` (all systems)
2. **Unused nights discount for 4 nights** = `0.09` (3 unused × 0.03)
3. **ZPricingUnitTestPage** shows matching values (within $0.01 rounding)
4. **No regression** in Monthly/Weekly calculations (they already use additive)

---

## Files Modified

| File | Task | Lines Changed |
|------|------|---------------|
| `app/src/lib/scheduleSelector/priceCalculations.js` | 1 | ~30 |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | 2, 3 | ~15 |
| `scripts/verify-pricing-formulas.js` | 4 | ~100 (new) |

---

## Reference Documents

- **Debug Analysis:** `.claude/plans/New/20260127202754-debug-pricing-formula-discrepancies.md`
- **Bubble PDF Screenshot:** `C:\Users\Split Lease\Downloads\current-pricing-page.pdf`
- **Comet Verification:** Confirmed via Bubble editor inspection (2026-01-27)
