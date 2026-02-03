# Pricing List Calculation Discrepancy Analysis

**Date**: 2026-02-02
**Listing ID**: 1768751636743x50807637646626856
**Rental Type**: Monthly
**Schedule**: "Every week" with 3 days / 2 nights selected
**Reservation Span**: 19 weeks

---

## Problem Summary

The Pricing List values are consistently HIGHER than both Workflow and Formula calculations:

| Metric | Workflow | Formula | Pricing List | Delta |
|--------|----------|---------|--------------|-------|
| 4-Week Rent | $1543 | $1543 | $1879 | +$336 (+21.8%) |
| Initial Payment | $2993 | $2993 | $3029 | +$36 (+1.2%) |
| Nightly Price | $230.32 | $230.32 | $234.87 | +$4.55 (+2.0%) |
| Total Reservation | $8752 | $8752 | $8925 | +$173 (+2.0%) |

---

## Root Cause Analysis

### ROOT CAUSE: The Pricing List retrieves pre-computed `nightlyPrice` from the database array, which was calculated with different parameters than the real-time formula.

### Issue 1: Pre-computed vs Real-time Calculation Mismatch

**Pricing List Calculation Flow:**
```
1. Edge Function (pricing-list/utils/pricingCalculator.ts) computes arrays at creation time
2. Arrays stored in pricing_list table (nightlyPrice, hostCompensation, etc.)
3. Frontend retrieves stored array: pricingList.nightlyPrice[nightsCount - 1]
4. Uses this pre-computed value for 4-week rent, total, etc.
```

**Formula Calculation Flow:**
```
1. Frontend calls calculatePrice() in real-time
2. Uses current zatConfig and listing parameters
3. Computes nightly price dynamically
4. Derives 4-week rent, total, etc. from computed price
```

### Issue 2: `avgDaysPerMonth` Constant Mismatch (CONFIRMED)

**Pricing List Edge Function** (`supabase/functions/pricing-list/utils/pricingCalculator.ts` line 88):
```typescript
const AVG_DAYS_PER_MONTH = 30.4;  // Hardcoded
```

**Formula** (`app/src/lib/scheduleSelector/priceCalculations.js` lines 46-52):
```javascript
const config = zatConfig || {
  // ...
  avgDaysPerMonth: 31  // Default fallback
};
```

**Impact Calculation:**
- For Monthly rental: `hostCompensation = (monthlyRate / avgDaysPerMonth) * 7 / nights`
- With 30.4: Higher host compensation (dividing by smaller number)
- With 31: Lower host compensation (dividing by larger number)
- Difference: `(1/30.4 - 1/31) / (1/31) = 1.97%` higher with 30.4

This ~2% difference matches the observed Nightly Price discrepancy ($234.87 vs $230.32 = +2.0%).

### Issue 3: Stale Pricing List Data

The pricing list array is computed ONCE when created via the Edge Function. If the listing's host rates, unit markup, or other parameters change after creation, the pricing list becomes stale.

The Pricing List may have been computed with:
- Different `unitMarkup` value
- Different host rates
- Before listing data was updated

---

## Code Path Analysis

### Pricing List Calculation (Edge Function)

**File**: `supabase/functions/pricing-list/utils/pricingCalculator.ts`

```typescript
// Line 100-139: calculateHostCompensationArray()
// For Monthly: (monthlyRate / 30.4) * 7 / numberOfNights

// Line 172-178: calculateCombinedMarkup()
const combined = unitMarkup + siteMarkup;  // e.g., 0 + 0.17 = 0.17

// Line 180-199: calculateMarkupAndDiscountMultipliersArray()
// multiplier = 1 + combinedMarkup - unusedNightsDiscount
// For 2 nights: multiplier = 1 + 0.17 - 0.15 = 1.02

// Line 202-227: calculateNightlyPricesArray()
// nightlyPrice[i] = hostCompensation[i] * multiplier[i]
```

### Formula Calculation (Frontend)

**File**: `app/src/lib/scheduleSelector/priceCalculations.js`

```javascript
// Line 117-172: calculateMonthlyPrice()
const monthlyAvgNightly = monthlyHostRate / config.avgDaysPerMonth;  // Uses zatConfig
const averageWeeklyPrice = monthlyAvgNightly * 7;
const nightlyHostRate = averageWeeklyPrice / nightsCount;
const multiplier = config.overallSiteMarkup + unitMarkup - unusedNightsDiscountValue + 1;
const totalWeeklyPrice = nightlyHostRate * nightsCount * multiplier;
const pricePerNight = totalWeeklyPrice / nightsCount;
```

### Frontend Pricing List Lookup

**File**: `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`

```javascript
// Line 1066-1100: calculatePricingListValues()
const index = nightsCount - 1;
const nightlyPrice = pricingList.nightlyPrice?.[index] || 0;  // RETRIEVES PRE-COMPUTED VALUE
const fourWeekRent = (nightlyPrice * nightsCount * 4) / weeklySchedulePeriod;
```

---

## Proposed Fix

### Option A: Synchronize Constants (Recommended - Low Risk)

Ensure `avgDaysPerMonth` is consistent across all calculation paths:

1. **Update priceCalculations.js default to 30.4:**
```javascript
// app/src/lib/scheduleSelector/priceCalculations.js line 51
avgDaysPerMonth: 30.4  // Changed from 31
```

2. **Ensure zatConfig is always fetched from database:**
   - The test page already uses zatConfig from database
   - Verify all callers of calculatePrice() pass zatConfig

### Option B: Recalculate Pricing List in Real-time (Higher Risk)

Instead of using stored arrays, calculate nightly prices on-demand:

```javascript
// In calculatePricingListValues()
// DON'T use: const nightlyPrice = pricingList.nightlyPrice?.[index] || 0;
// DO: Recalculate using pricingList.hostCompensation and multipliers
```

This would make Pricing List match Formula but defeats the purpose of pre-computing.

### Option C: Regenerate Stale Pricing Lists

Add a migration or background job to regenerate pricing_list records that are stale (created before a certain date or with mismatched parameters).

---

## Verification Approach

After implementing fix:

1. **Unit Test**: Create test cases comparing Formula vs Pricing List for:
   - Monthly rental with 2 nights
   - Weekly rental with various nights
   - Nightly rental with various nights

2. **Integration Test**:
   - Fetch listing 1768751636743x50807637646626856
   - Run "Update Pricing List" to regenerate
   - Compare all 4 metrics (should match within $1 tolerance)

3. **Regression Check**:
   - Verify existing pricing displays aren't affected
   - Check listing cards still show correct "Starting at $X/night"

---

## Files Involved

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/lib/scheduleSelector/priceCalculations.js` | Real-time price calculation | Update avgDaysPerMonth default to 30.4 |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | Pricing list generation | No change (source of truth for 30.4) |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js` | Test page logic | No change needed |
| `app/src/logic/constants/pricingConstants.js` | Pricing constants | Add AVG_DAYS_PER_MONTH = 30.4 |

---

## Recommendation

**Implement Option A** - Synchronize the `avgDaysPerMonth` constant to 30.4 across all calculation paths. This is the lowest-risk fix that addresses the root cause.

Additionally, for the specific listing in question, regenerate its pricing_list using the "Update Pricing List" workflow to ensure the stored arrays are current.
