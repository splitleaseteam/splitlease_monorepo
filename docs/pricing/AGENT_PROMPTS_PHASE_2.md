# Phase 2: Implementation Prompts

Based on the discovery reports and the 7-task work plan, here are the implementation prompts for OpenCode and Claude Code.

---

## PROMPT FOR OPENCODE (Phase 2)

**Scope:** Tasks 4, 5, 6 (Frontend Calculators and Constants)
**Estimated Impact:** ~20 lines across 3 files

```
TASK: Fix Frontend Pricing Calculator Modules

You will update three files in `app/src/logic/` to use the correct ADDITIVE pricing formula.

== FILE 1: app/src/logic/constants/pricingConstants.js ==

Find the constant `DEFAULT_UNUSED_NIGHTS_DISCOUNT` (currently 0.05).
Change the name and value:

FROM:
  DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,

TO:
  UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,


== FILE 2: app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js ==

1. Update the import/parameter to use the new constant name.

2. Change the formula from PROPORTIONAL to LINEAR:

FROM (around line 56-58):
  const discount = unusedNights > 0
    ? baseDiscount * (unusedNights / (maxNights - 1))
    : 0;

TO:
  const discount = unusedNights * baseDiscount;

3. Update the JSDoc at the top of the file to reflect the new formula:
   Formula: discount[n] = unusedNights * discountMultiplier (LINEAR)


== FILE 3: app/src/logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js ==

1. Change the multiplier formula from MULTIPLICATIVE to ADDITIVE:

FROM (around line 78):
  const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);

TO:
  const multiplier = 1 + combinedMarkup - totalDiscount;

2. Update the JSDoc at the top of the file:
   FROM: Multiplier = (1 + combinedMarkup) * (1 - discount)
   TO:   Multiplier = 1 + combinedMarkup - discount (ADDITIVE)


== VERIFICATION ==

After making changes, verify the discount array produces:
  [0.18, 0.15, 0.12, 0.09, 0.06, 0.03, 0] for nights 1-7

And the 7-night multiplier (with 17% markup, 0 unit markup) should be:
  1 + 0.17 - 0 - 0.13 = 1.04

Do NOT modify any other files.
```

---

## PROMPT FOR CLAUDE CODE (Phase 2)

**Scope:** Tasks 1, 2, 3, 7 (Core Logic, Backend, Verification)
**Estimated Impact:** ~100 lines across 3 files

```
TASK: Fix Core Pricing Logic and Create Verification Script

You will update the main pricing calculation files and create a verification script.

== FILE 1: app/src/lib/scheduleSelector/priceCalculations.js ==

This is the legacy frontend calculation used by ListingScheduleSelector.

1. Find the function call to calculateNightlyPrice (around line 80).
   Add unitMarkup as the last parameter:

   FROM:
     const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered);

   TO:
     const result = calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup);

2. Find the calculateNightlyPrice function definition (around line 217).
   Rewrite it to use the ADDITIVE formula:

   function calculateNightlyPrice(nightsCount, listing, reservationSpan, config, weeksOffered, unitMarkup = 0) {
     const nightlyHostRate = getNightlyRateForNights(nightsCount, listing);
     if (!nightlyHostRate) return { pricePerNight: 0, fourWeekRent: 0, reservationTotal: 0 };

     const basePrice = nightlyHostRate * nightsCount;

     // Unused nights discount (LINEAR)
     const unusedNights = 7 - nightsCount;
     const unusedNightsDiscount = unusedNights * (config.unusedNightsDiscountMultiplier || 0.03);

     // Full-time discount (only for 7 nights)
     const fullTimeDiscountRate = nightsCount === 7 ? (config.fullTimeDiscount || 0.13) : 0;

     // ADDITIVE multiplier
     const multiplier = 1 + config.overallSiteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscountRate;

     const totalPrice = basePrice * multiplier;
     const pricePerNight = totalPrice / nightsCount;

     // Keep remaining logic for fourWeekRent and reservationTotal unchanged
     ...
   }


== FILE 2: supabase/functions/pricing-list/utils/pricingCalculator.ts ==

1. Update the constant (around line 21):
   FROM: DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,
   TO:   UNUSED_NIGHTS_DISCOUNT_MULTIPLIER: 0.03,

2. Update calculateUnusedNightsDiscountArray (around line 98-116):
   Change from proportional to LINEAR:
   FROM: const discount = baseDiscount * (unusedNights / (maxNights - 1))
   TO:   const discount = unusedNights * discountMultiplier;

3. Update calculateMarkupAndDiscountMultipliersArray (around line 138):
   Change from multiplicative to ADDITIVE:
   FROM: const multiplier = (1 + combinedMarkup) * (1 - totalDiscount);
   TO:   const multiplier = 1 + combinedMarkup - totalDiscount;


== FILE 3: scripts/verify-pricing-formulas.js (NEW FILE) ==

Create a verification script that tests the Golden Formula:

import { calculatePrice } from '../app/src/lib/scheduleSelector/priceCalculations.js';

const config = {
  overallSiteMarkup: 0.17,
  fullTimeDiscount: 0.13,
  unusedNightsDiscountMultiplier: 0.03,
};

const listing = {
  rentalType: 'Nightly',
  weeksOffered: 'Every week',
  unitMarkup: 5,
  nightlyHostRateFor2Nights: 100,
  nightlyHostRateFor3Nights: 100,
  nightlyHostRateFor4Nights: 100,
  nightlyHostRateFor5Nights: 100,
  nightlyHostRateFor7Nights: 100,
};

const testCases = [7, 5, 4, 3, 2];

for (const nights of testCases) {
  const selectedNights = Array(nights).fill({});
  const result = calculatePrice(selectedNights, listing, 13, config);
  
  const unusedNights = 7 - nights;
  const unusedDiscount = unusedNights * 0.03;
  const fullTimeDiscount = nights === 7 ? 0.13 : 0;
  const expectedMultiplier = 1 + 0.17 + 0.05 - unusedDiscount - fullTimeDiscount;
  
  const actualMultiplier = result.pricePerNight / 100;
  const match = Math.abs(actualMultiplier - expectedMultiplier) < 0.001;
  
  console.log(`${nights} nights: ${match ? 'PASS' : 'FAIL'} (Expected ${expectedMultiplier.toFixed(4)}, Got ${actualMultiplier.toFixed(4)})`);
}


== VERIFICATION ==

Run: node scripts/verify-pricing-formulas.js

Expected output:
  7 nights: PASS (Expected 1.0400, Got 1.0400)
  5 nights: PASS (Expected 1.1600, Got 1.1600)
  4 nights: PASS (Expected 1.1300, Got 1.1300)
  3 nights: PASS (Expected 1.1000, Got 1.1000)
  2 nights: PASS (Expected 1.0700, Got 1.0700)

All tests must pass before the task is complete.
```

---

## Execution Order

1. **Run OpenCode prompt first** (clears the constants and calculators)
2. **Run Claude Code prompt second** (fixes core logic and verifies everything)
