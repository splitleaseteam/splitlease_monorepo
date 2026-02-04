# Pricing List as Source of Truth Fix

**Date**: 2026-02-03
**Commit**: fe4c2b654

## Problem Statement

Both guest and host were seeing the same total compensation ($14,700) when they should see different amounts. The guest pays a marked-up price while the host receives the base compensation without markup.

## Root Cause Analysis

### `create.ts` (Proposal Creation) - **WAS BROKEN**

1. Did NOT fetch `pricing_list` from the listing
2. Used `getNightlyRateForNights()` which reads from individual listing fields
3. Called `calculateCompensation()` which had a BUG: set `fourWeekCompensation = fourWeekRent` (same value!)
4. No separation between guest price and host compensation

### `create_counteroffer.ts` - **WAS CORRECT**

1. Fetches `pricing_list` from listing (lines 125-137)
2. Uses `getPricingListRates()` to get both `hostCompensationPerNight` AND `guestNightlyPrice`
3. Correctly calculates separate values:
   - `fourWeekRent = guestNightlyPrice * nightsPerWeek * 4`
   - `fourWeekCompensation = hostCompPerNight * nightsPerWeek * 4`
4. Has fallback to `calculatePricingList()` if pricing_list is missing

## Solution Applied

Modified `create.ts` to follow the same pattern as `create_counteroffer.ts`:

### 1. Updated Imports

```typescript
import {
  calculateMoveOutDate,
  calculateComplementaryNights,
  calculateOrderRanking,
  formatPriceForDisplay,
  fetchAvgDaysPerMonth,
  calculateDurationMonths,
  getPricingListRates,
  roundToTwoDecimals,
} from "../lib/calculations.ts";
import { calculatePricingList } from "../../pricing-list/utils/pricingCalculator.ts";
```

### 2. Updated Listing SELECT

Added `pricing_list`, `unit_markup`, `nightly_rate_1_night`, `nightly_rate_6_nights` to the query.

### 3. New Pricing Calculation Logic

```typescript
// Fetch pricing_list to get both guest and host rates (single source of truth)
let pricingListRates = null;

if (listingForPricing.pricing_list) {
  const { data: pricingList } = await supabase
    .from("pricing_list")
    .select('"Nightly Price", "Host Compensation"')
    .eq("_id", listingForPricing.pricing_list)
    .single();

  if (pricingList) {
    pricingListRates = getPricingListRates(pricingList, nightsPerWeek);
  }
}

// Fallback: calculate pricing_list on-the-fly if not found
if (!pricingListRates) {
  const fallbackPricing = calculatePricingList({ listing: listingForPricing });
  pricingListRates = getPricingListRates(
    {
      "Nightly Price": fallbackPricing.nightlyPrice,
      "Host Compensation": fallbackPricing.hostCompensation,
    },
    nightsPerWeek
  );
}
```

### 4. Correct Compensation Calculations

```typescript
// Calculate 4-week rent (GUEST price with markup)
fourWeekRent = guestNightlyPrice * nightsPerWeek * 4;

// Calculate 4-week compensation (HOST price WITHOUT markup)
fourWeekCompensation =
  rentalType === "monthly"
    ? 0 // Monthly doesn't use 4-week compensation
    : rentalType === "weekly"
      ? hostCompPerPeriod * 4
      : hostCompensationPerNight * nightsPerWeek * 4;

// Calculate total host compensation by rental type
totalCompensation =
  rentalType === "weekly"
    ? hostCompPerPeriod * Math.ceil(actualWeeks)
    : rentalType === "monthly"
      ? hostCompPerPeriod * durationMonths
      : hostCompensationPerNight * nightsPerWeek * actualWeeks;
```

## Key Formulas

| Field | Formula | Notes |
|-------|---------|-------|
| `fourWeekRent` | `guestNightlyPrice * nights * 4` | Guest-facing, includes markup |
| `fourWeekCompensation` | `hostCompPerNight * nights * 4` | Host-facing, no markup |
| `totalCompensation` (nightly) | `hostCompPerNight * nights * weeks` | Host's total payout |
| `totalCompensation` (weekly) | `weeklyHostRate * weeks` | Host's total payout |
| `totalCompensation` (monthly) | `monthlyHostRate * months` | Host's total payout |

## Additional Fix: Weekly Schedule Period (Commit 47eebeda8)

The 4-week calculations also need to account for the "Weeks offered" pattern.

### Added Helper Function

```typescript
// calculations.ts
export function getWeeklySchedulePeriod(weeksOffered: string): number {
  // Returns divisor based on pattern:
  // - "Every week": 1 (4 active weeks per 4 calendar weeks)
  // - "1on1off" or "2on2off": 2 (2 active weeks per 4 calendar weeks)
  // - "1on3off": 4 (1 active week per 4 calendar weeks)
}
```

### Updated Formulas

```typescript
// Formula: (value * 4) / weeklySchedulePeriod
fourWeekRent = (guestNightlyPrice * nightsPerWeek * 4) / weeklySchedulePeriod;
fourWeekCompensation = (hostCompPerNight * nightsPerWeek * 4) / weeklySchedulePeriod;
```

### Example

For a listing with "1 week on 1 week off" pattern:
- Guest stays 2 weeks in every 4-week calendar period
- `weeklySchedulePeriod = 2`
- `fourWeekRent = (100 * 4 * 4) / 2 = $800` (not $1600)

## Files Changed

- [supabase/functions/proposal/actions/create.ts](supabase/functions/proposal/actions/create.ts)
- [supabase/functions/proposal/actions/create_counteroffer.ts](supabase/functions/proposal/actions/create_counteroffer.ts)
- [supabase/functions/proposal/lib/calculations.ts](supabase/functions/proposal/lib/calculations.ts)

## Testing Required

1. Create a new proposal and verify:
   - `4 week rent` shows guest price (with markup)
   - `4 week compensation` shows host price (without markup)
   - `Total Compensation (proposal - host)` < `Total Price for Reservation (guest)`

2. Test all rental types:
   - Nightly: Standard calculation
   - Weekly: Uses weekly_host_rate
   - Monthly: Uses monthly_host_rate

## Deployment Notes

After deploying, remember to manually deploy the Edge Functions:
```bash
supabase functions deploy proposal
```
