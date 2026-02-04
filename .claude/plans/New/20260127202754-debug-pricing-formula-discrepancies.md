# Debug Analysis: Pricing Formula Discrepancies

**Created**: 2026-01-27 20:27:54
**Status**: Analysis Complete - Pending Implementation
**Severity**: Critical
**Affected Area**: Pricing calculations across frontend, backend, and legacy Bubble system

## 1. System Context (From Onboarding)

### 1.1 Architecture Understanding
- **Architecture Pattern**: Islands Architecture with Hollow Components
- **Tech Stack**: React 18 + Vite (frontend), Supabase Edge Functions (Deno/TypeScript), Cloudflare Pages
- **Data Flow**:
  - Frontend `priceCalculations.js` (Schedule Selector) calculates "Workflow Price"
  - Backend `pricingCalculator.ts` (Edge Function) calculates "Backend Price"
  - Test page `useZPricingUnitTestPageLogic.js` calculates "Formula Price"
  - Legacy Bubble (source of truth) uses night multipliers and lookup tables

### 1.2 Domain Context
- **Feature Purpose**: Calculate guest-facing rental prices based on host compensation rates, applying markups and discounts
- **Related Documentation**:
  - `.claude/plans/New/20260127-pricing-list-implementation-plan.md`
  - `docs/Pending/Z_PRICING_UNIT_TEST_REQUIREMENTS.md`
  - `docs/Pending/z-schedule-test Page - Comprehensive Technical Requirements Document.md`
- **Data Model**:
  - `listing` table: Contains host rates (`💰Nightly Host Rate for N nights`, `💰Weekly Host Rate`, `💰Monthly Host Rate`)
  - `pricing_list` table: Pre-calculated pricing arrays (Host Compensation, Nightly Price, Unused Nights Discount)
  - `reference_table.zat_priceconfiguration`: Global pricing config (Site Markup, Full Time Discount, Unused Nights Discount Multiplier)

### 1.3 Relevant Conventions
- **Day Indexing**: JavaScript 0-6 (Sun=0 to Sat=6)
- **Pricing Arrays**: 7 elements, index 0 = 1 night, index 6 = 7 nights
- **Full-time Discount**: 13% applied only to 7-night stays
- **Site Markup**: 17% applied to all prices
- **No Fallback Principle**: Calculations must fail fast with explicit errors, no silent defaults

### 1.4 Entry Points & Dependencies
- **User Entry Point**: `ZPricingUnitTestPage` for testing, `ViewSplitLeasePage` for production
- **Critical Path**: Select days -> Calculate price per night -> Calculate 4-week rent -> Calculate total reservation
- **Dependencies**:
  - `fetchZatPriceConfiguration()` from `lib/listingDataFetcher.js`
  - `PRICING_CONSTANTS` from `logic/constants/pricingConstants.js`
  - Supabase `pricing_list` table

## 2. Problem Statement

Three pricing calculation systems exist with fundamental formula mismatches, leading to massive price discrepancies (reportedly up to $9,840 difference). The systems are:

1. **Frontend Schedule Selector** (`priceCalculations.js`) - Used in production UI
2. **Backend Edge Function** (`pricingCalculator.ts`) - Used for `pricing_list` table population
3. **Legacy Bubble** (undocumented formulas) - Source of truth

Key symptoms:
- "Workflow Price" (from UI) does not match "Formula Price" (test calculations)
- "Backend Price" uses different discount/markup math than frontend
- Night multipliers (2 nights=1.6x, 3 nights=1.4x, 4 nights=1.2x) mentioned in `CLAUDE_PRICING_PROMPT.md` are NOT implemented in any current code

## 3. Reproduction Context
- **Environment**: Development (localhost:8000), ZPricingUnitTestPage
- **Steps to reproduce**:
  1. Navigate to `/z-pricing-unit-test`
  2. Select any listing with nightly pricing
  3. Select 3 nights in the schedule selector
  4. Click "Run Checks"
  5. Observe mismatched values in "Workflow vs Formula Comparison"
- **Expected behavior**: All three columns (Workflow, Formula, Backend) show identical values
- **Actual behavior**: Values differ due to formula discrepancies
- **Error messages**: No errors, just incorrect calculations

## 4. Investigation Summary

### 4.1 Files Examined

| File | Purpose | Relevance |
|------|---------|-----------|
| `app/src/lib/scheduleSelector/priceCalculations.js` | Frontend price calculation | PRIMARY - Contains production formulas |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | Backend price calculation | PRIMARY - Contains backend formulas |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js` | Test page logic | HIGH - Compares calculations |
| `app/src/logic/constants/pricingConstants.js` | Pricing constants | HIGH - Defines rates |
| `app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js` | Frontend unused nights | HIGH - Different formula than backend |
| `app/src/logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js` | Frontend multipliers | HIGH - Applies markup and discount |
| `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` | Guest-facing price | MEDIUM - Simpler formula, no unit markup |
| `app/src/lib/listingDataFetcher.js` | ZAT config fetcher | MEDIUM - Provides global config |
| `CLAUDE_PRICING_PROMPT.md` | Problem description | HIGH - Documents expected Bubble behavior |

### 4.2 Execution Flow Trace

#### Frontend (priceCalculations.js) - Monthly Rental
```
1. monthlyAvgNightly = monthlyHostRate / avgDaysPerMonth (31)
2. averageWeeklyPrice = monthlyAvgNightly * 7
3. nightlyHostRate = averageWeeklyPrice / nightsCount
4. unusedNightsDiscountValue = unusedNights * 0.03  <- LINEAR FORMULA
5. multiplier = siteMarkup + unitMarkup - unusedNightsDiscount + 1
6. totalWeeklyPrice = nightlyHostRate * nightsCount * multiplier
7. pricePerNight = totalWeeklyPrice / nightsCount
```

**Key Formula**: `multiplier = 1 + markup - discount` (ADDITIVE)

#### Frontend (priceCalculations.js) - Nightly Rental
```
1. nightlyHostRate = getNightlyRateForNights(nightsCount)  <- FROM LOOKUP
2. basePrice = nightlyHostRate * nightsCount
3. fullTimeDiscount = (nights === 7) ? basePrice * 0.13 : 0
4. priceAfterDiscounts = basePrice - fullTimeDiscount
5. siteMarkup = priceAfterDiscounts * 0.17
6. totalPrice = basePrice - fullTimeDiscount + siteMarkup
7. pricePerNight = totalPrice / nightsCount
```

**Key Observation**: Nightly model does NOT apply unit markup.

#### Backend (pricingCalculator.ts)
```
1. hostCompensation[n] = listing host rate for (n+1) nights
2. unusedNightsDiscount[n] = baseDiscount * (unusedNights / 6)  <- PROPORTIONAL FORMULA
3. combinedMarkup = unitMarkup + siteMarkup (capped at 1)
4. totalDiscount = unusedNightsDiscount[n] + fullTimeDiscount (if n=6)
5. multiplier = (1 + combinedMarkup) * (1 - totalDiscount)  <- MULTIPLICATIVE
6. nightlyPrice = hostCompensation * multiplier
```

**Key Formula**: `multiplier = (1 + markup) * (1 - discount)` (MULTIPLICATIVE)

### 4.3 Git History Analysis

Recent commits affecting pricing (since 2025-01-01):
```
37d44982 changes done on SL12
f05da7e3 fix: normalize weekly schedule display and pricing
0c2db24d feat(pricing): Add 1-night base rate database column support
fada1066 feat: Implement comprehensive price calculation system with ZAT config
e6ec4e8b feat: Add shared ListingScheduleSelector React island component
```

No commits reference "night multipliers" or "1.6x/1.4x/1.2x" which are mentioned in `CLAUDE_PRICING_PROMPT.md`.

## 5. Hypotheses

### Hypothesis 1: Missing Night Multipliers (Likelihood: 95%)

**Theory**: The legacy Bubble system applies night multipliers (2 nights=1.6x, 3 nights=1.4x, 4 nights=1.2x) that are completely absent from all current code.

**Supporting Evidence**:
- `CLAUDE_PRICING_PROMPT.md` explicitly states: "Missing Night Multipliers: The legacy Bubble system applied multipliers"
- No file in the codebase contains "1.6", "1.4x", "1.2x" night multiplier logic
- The `getNightlyRateForNights()` function simply looks up host rates without adjustment

**Contradicting Evidence**:
- None found. This appears to be a genuine missing feature.

**Verification Steps**:
1. Request Bubble backend workflow documentation for "night price multiplier"
2. Test with Bubble directly: input 2 nights, verify if output is 1.6x the expected base

**Potential Fix**:
```javascript
const NIGHT_MULTIPLIERS = { 2: 1.6, 3: 1.4, 4: 1.2, 5: 1.0, 6: 1.0, 7: 1.0 };
const adjustedRate = baseRate * NIGHT_MULTIPLIERS[nightsCount];
```

**Convention Check**: This would require a lookup table or constants in `pricingConstants.js`

---

### Hypothesis 2: Unused Nights Discount Formula Mismatch (Likelihood: 90%)

**Theory**: Frontend uses LINEAR formula while backend uses PROPORTIONAL lookup-based formula.

**Supporting Evidence**:

| System | Formula | Example (3 nights, 4 unused) |
|--------|---------|------------------------------|
| Frontend (`priceCalculations.js`) | `unusedNights * 0.03` | 4 * 0.03 = 0.12 (12%) |
| Backend (`pricingCalculator.ts`) | `baseDiscount * (unusedNights / 6)` | 0.05 * (4/6) = 0.033 (3.3%) |

- `CLAUDE_PRICING_PROMPT.md` mentions: "Legacy/ZAT: Uses a Lookup Table (1 night = 0.05, 2 nights = 0.07, etc.)"
- Frontend uses `unusedNightsDiscountMultiplier: 0.03` from ZAT config
- Backend uses `DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05`

**Contradicting Evidence**:
- The ZAT config should be the single source of truth, but it's not used consistently

**Verification Steps**:
1. Query `reference_table.zat_priceconfiguration` for "Unused Nights Discount Multiplier"
2. Document the lookup table values from Bubble's "ZAT-Price Settings"

**Potential Fix**: Both systems should use the same base discount from ZAT config:
```javascript
// Both systems should compute:
const unusedNightsDiscount = config.unusedNightsDiscountMultiplier * (unusedNights / 6);
```

**Convention Check**: Constants should come from `pricingConstants.js` or ZAT config fetch

---

### Hypothesis 3: Markup/Discount Application Order Mismatch (Likelihood: 85%)

**Theory**: Frontend uses additive formula, backend uses multiplicative formula.

**Supporting Evidence**:

| System | Formula |
|--------|---------|
| Frontend | `multiplier = 1 + markup - discount` |
| Backend | `multiplier = (1 + markup) * (1 - discount)` |

Example with 17% markup and 10% discount:
- Frontend: `1 + 0.17 - 0.10 = 1.07` (7% increase)
- Backend: `(1 + 0.17) * (1 - 0.10) = 1.053` (5.3% increase)

**Contradicting Evidence**:
- Z-Pricing-Unit-Test documentation mentions "Markups Multiplier" which suggests multiplicative approach

**Verification Steps**:
1. Test both formulas with known Bubble output values
2. Check Bubble workflow for "Markup and Discounts" calculation

**Potential Fix**: Standardize on multiplicative formula (backend approach):
```javascript
const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);
```

**Convention Check**: The multiplicative approach is mathematically correct for compounding percentages

---

### Hypothesis 4: Unit Markup Bug in Nightly Model (Likelihood: 75%)

**Theory**: The Nightly rental model in `priceCalculations.js` does NOT apply `unitMarkup`, while Monthly and Weekly models do.

**Supporting Evidence**:
- Line 80 in `priceCalculations.js`: `calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered)` - no `unitMarkup` parameter
- Line 66-67: Monthly and Weekly call signatures include `unitMarkup`
- `CLAUDE_PRICING_PROMPT.md` states: "Unit Markup Bug: The Nightly model in priceCalculations.js appears to ignore unitMarkup"

**Contradicting Evidence**:
- Nightly model applies `config.overallSiteMarkup` (17%), so some markup exists

**Verification Steps**:
1. Compare Nightly model with Monthly/Weekly to confirm unitMarkup absence
2. Test listing with non-zero `💰Unit Markup` value

**Potential Fix**: Pass `unitMarkup` to `calculateNightlyPrice()` and include it in calculations

**Convention Check**: All rental types should apply unit markup consistently

---

### Hypothesis 5: ZAT Config Source Inconsistency (Likelihood: 60%)

**Theory**: Frontend defaults to hardcoded values when ZAT config fetch fails, potentially causing divergence.

**Supporting Evidence**:
- `listingDataFetcher.js` line 563-572 returns hardcoded defaults on error
- `useZPricingUnitTestPageLogic.js` line 192-198 also uses fallback defaults
- Defaults may not match production ZAT values

**Contradicting Evidence**:
- ZAT config is cached after first fetch, so it should work in most cases

**Verification Steps**:
1. Verify ZAT config fetch succeeds in all environments
2. Compare default values with actual `zat_priceconfiguration` table values

**Potential Fix**: Fail loudly if ZAT config cannot be fetched (No Fallback principle)

**Convention Check**: Violates "No Fallback" principle - should surface real error

## 6. Recommended Action Plan

### Priority 1 (Try First): Implement Night Multipliers

**Rationale**: This is explicitly stated as missing and likely the largest source of discrepancy.

**Implementation Details**:

1. **Add constant** to `app/src/logic/constants/pricingConstants.js`:
```javascript
NIGHT_MULTIPLIERS: {
  1: 1.0,  // No data for 1 night, assume 1.0
  2: 1.6,
  3: 1.4,
  4: 1.2,
  5: 1.0,
  6: 1.0,
  7: 1.0,
},
```

2. **Update** `calculateNightlyPrice()` in `priceCalculations.js`:
```javascript
function calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered) {
  const nightlyHostRate = getNightlyRateForNights(nightsCount, listing);
  const nightMultiplier = PRICING_CONSTANTS.NIGHT_MULTIPLIERS[nightsCount] || 1.0;
  const adjustedRate = nightlyHostRate * nightMultiplier;
  // ... rest of calculation using adjustedRate
}
```

3. **Update** backend `pricingCalculator.ts` with same multipliers

**Verification**: Run ZPricingUnitTestPage with 2, 3, 4 nights - compare against Bubble output

---

### Priority 2 (If Priority 1 Fails): Unify Discount Formulas

**Implementation Details**:

1. **Document** the exact lookup table from Bubble's "ZAT-Price Settings"

2. **Create** `calculateUnusedNightsDiscount()` calculator that matches Bubble:
```javascript
// If Bubble uses lookup table:
const UNUSED_NIGHTS_DISCOUNT_TABLE = {
  0: 0,      // 7 nights booked
  1: 0.05,   // 6 nights booked
  2: 0.07,   // 5 nights booked
  3: 0.09,   // 4 nights booked
  4: 0.11,   // 3 nights booked
  5: 0.13,   // 2 nights booked
  6: 0.15,   // 1 night booked
};
```

3. **Replace** both frontend linear formula and backend proportional formula with lookup

---

### Priority 3 (Deeper Investigation): Request Bubble Workflow Export

**Rationale**: Without documented Bubble formulas, we're reverse-engineering.

**Implementation Details**:

1. Request export of these Bubble backend workflows:
   - `core-save_pricing_robert` (main pricing save)
   - Price Calculations folder (15 workflows)
   - `run_price_list` workflow

2. Document each formula step-by-step

3. Create golden reference test suite with known inputs/outputs

## 7. Prevention Recommendations

### 7.1 Create Comparison Script

Design: `scripts/debug_pricing_formulas.js`

```javascript
/**
 * Debug Pricing Formulas - Compare all three systems
 *
 * Usage: bun run scripts/debug_pricing_formulas.js --listing=LISTING_ID --nights=3
 */

import { calculatePrice } from '../app/src/lib/scheduleSelector/priceCalculations.js';
import { calculatePricingList } from '../supabase/functions/pricing-list/utils/pricingCalculator.ts';

const TEST_CASES = [
  { nights: 2, weeklyRate: 1000, monthlyRate: 3500, expectedMultiplier: 1.6 },
  { nights: 3, weeklyRate: 1000, monthlyRate: 3500, expectedMultiplier: 1.4 },
  { nights: 4, weeklyRate: 1000, monthlyRate: 3500, expectedMultiplier: 1.2 },
  { nights: 7, weeklyRate: 1000, monthlyRate: 3500, expectedMultiplier: 1.0 },
];

function runComparison(testCase) {
  console.log(`\n=== ${testCase.nights} NIGHTS ===`);

  // Frontend calculation
  const frontendResult = calculatePrice(/* ... */);
  console.log('Frontend pricePerNight:', frontendResult.pricePerNight);

  // Backend calculation
  const backendResult = calculatePricingList(/* ... */);
  console.log('Backend nightlyPrice:', backendResult.nightlyPrice[testCase.nights - 1]);

  // Compare
  const diff = Math.abs(frontendResult.pricePerNight - backendResult.nightlyPrice[testCase.nights - 1]);
  console.log('DIFFERENCE:', diff, diff > 1 ? 'MISMATCH!' : 'OK');
}

TEST_CASES.forEach(runComparison);
```

### 7.2 Add Unit Tests

File: `app/src/logic/calculators/pricing/__tests__/pricingFormulaConsistency.test.js`

```javascript
describe('Pricing Formula Consistency', () => {
  const testCases = [
    { nights: 3, hostRate: 100, expectedPrice: 140 }, // 100 * 1.4
    // ... more cases from Bubble golden output
  ];

  it.each(testCases)('calculates $nights nights correctly', ({ nights, hostRate, expectedPrice }) => {
    const result = calculateGuestFacingPrice({ hostNightlyRate: hostRate, nightsCount: nights });
    expect(result).toBeCloseTo(expectedPrice, 2);
  });
});
```

### 7.3 Centralize Pricing Constants

All pricing values should be in ONE place: `app/src/logic/constants/pricingConstants.js`

No hardcoded values in:
- `priceCalculations.js`
- `pricingCalculator.ts`
- `useZPricingUnitTestPageLogic.js`

## 8. Related Files Reference

### Primary Files (Require Modification)

| File | Line Numbers | Issue |
|------|--------------|-------|
| `app/src/lib/scheduleSelector/priceCalculations.js` | 217-255 | Missing night multipliers, wrong discount formula, missing unit markup in nightly |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | 98-116 | Different discount formula than frontend |
| `app/src/logic/constants/pricingConstants.js` | 1-41 | Missing `NIGHT_MULTIPLIERS` constant |

### Secondary Files (May Need Updates)

| File | Purpose |
|------|---------|
| `app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js` | Align with Bubble lookup table |
| `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` | Add night multipliers |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js` | Update test comparison logic |
| `app/src/lib/listingDataFetcher.js` | Line 563-572 - Remove fallback defaults |

### Reference Files (Do Not Modify)

| File | Purpose |
|------|---------|
| `CLAUDE_PRICING_PROMPT.md` | Problem definition |
| `docs/Pending/Z_PRICING_UNIT_TEST_REQUIREMENTS.md` | Bubble page requirements |
| `docs/Pending/z-schedule-test Page - Comprehensive Technical Requirements Document.md` | Detailed formula notes |
| `.claude/plans/New/20260127-pricing-list-implementation-plan.md` | Existing implementation plan |

---

## Next Steps for Implementation

1. **Request Bubble export** of pricing workflows to establish "Golden Formula"
2. **Create comparison script** (`scripts/debug_pricing_formulas.js`) with known test cases
3. **Implement night multipliers** in `pricingConstants.js` and both calculation files
4. **Unify discount formula** to match Bubble lookup table
5. **Run ZPricingUnitTestPage** to verify all three systems produce identical output
6. **Add regression tests** to prevent future divergence

---

**Top Hypothesis Summary**: Missing night multipliers (2=1.6x, 3=1.4x, 4=1.2x) account for the largest price discrepancies. The secondary issue is inconsistent unused nights discount formulas (linear vs proportional vs lookup).

**Recommended First Step**: Implement `NIGHT_MULTIPLIERS` constant and verify against Bubble output for 2, 3, and 4 night bookings.
