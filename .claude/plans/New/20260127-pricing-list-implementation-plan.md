# Pricing List Implementation Plan

**Created**: 2026-01-27
**Status**: In Progress

## Overview

Extend the existing `pricing_list` table in Supabase with missing scalar fields and implement the calculation logic from Bubble's 15-workflow system.

**Document Reference**: BUBBLE PRICING LIST WORKFLOW ARCHITECTURE - Price Calculations Folder Analysis.md

---

## Part 1: Database Schema

### Existing Table Structure

The `pricing_list` table already exists with these fields:

| Column | Type | Status |
|--------|------|--------|
| _id | text (PK) | ✅ Exists |
| listing | text (FK to listing._id) | ✅ Exists |
| Created By | text (FK to user._id) | ✅ Exists |
| Host Compensation | JSONB array | ✅ Exists |
| Markup and Discount Multiplier | JSONB array | ✅ Exists |
| Nightly Price | JSONB array | ✅ Exists |
| Unused Nights | JSONB array | ✅ Exists |
| Unused Nights Discount | JSONB array | ✅ Exists |

### Migration: 20260128_alter_pricing_list_add_scalars.sql

ADD missing scalar fields to the existing table:

```sql
-- Add scalar pricing fields to existing pricing_list table
ALTER TABLE pricing_list
  ADD COLUMN IF NOT EXISTS "Unit Markup" DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Overall Site Markup" DECIMAL(5,4) DEFAULT 0.17,
  ADD COLUMN IF NOT EXISTS "Combined Markup" DECIMAL(5,4) DEFAULT 0.17,
  ADD COLUMN IF NOT EXISTS "Full Time Discount" DECIMAL(5,4) DEFAULT 0.13,
  ADD COLUMN IF NOT EXISTS "Starting Nightly Price" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "Slope" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "Weekly Price Adjust" DECIMAL(10,4);

-- Add metadata fields if missing
ALTER TABLE pricing_list
  ADD COLUMN IF NOT EXISTS "rental type" VARCHAR(20) DEFAULT 'Nightly',
  ADD COLUMN IF NOT EXISTS "Number Selected Nights" JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "Modified Date" TIMESTAMPTZ DEFAULT NOW();

-- Add index for price-based searches
CREATE INDEX IF NOT EXISTS idx_pricing_list_starting_price
  ON pricing_list("Starting Nightly Price");

-- Comment
COMMENT ON TABLE pricing_list IS 'Pre-calculated pricing arrays and scalars for listings (extends Bubble pricing_list)';
```

### Final Schema After Migration

| Column | Type | Source |
|--------|------|--------|
| _id | text (PK) | Existing |
| listing | text (FK) | Existing |
| Created By | text (FK) | Existing |
| Host Compensation | JSONB array | Existing |
| Markup and Discount Multiplier | JSONB array | Existing |
| Nightly Price | JSONB array | Existing |
| Unused Nights | JSONB array | Existing |
| Unused Nights Discount | JSONB array | Existing |
| Unit Markup | DECIMAL | NEW |
| Overall Site Markup | DECIMAL | NEW |
| Combined Markup | DECIMAL | NEW |
| Full Time Discount | DECIMAL | NEW |
| Starting Nightly Price | DECIMAL | NEW |
| Slope | DECIMAL | NEW |
| Weekly Price Adjust | DECIMAL | NEW |
| rental type | VARCHAR | NEW |
| Number Selected Nights | JSONB | NEW |
| Modified Date | TIMESTAMPTZ | NEW |

**Note**: Column names use Bubble-style naming (spaces, title case) for sync compatibility.

---

## Part 2: Four-Layer Logic Implementation

### 2.1 Calculators (app/src/logic/calculators/pricingList/)

| File | Purpose | Input → Output |
|------|---------|----------------|
| calculateHostCompensationArray.js | Host pay per night tier | { hostRates } → number[7] |
| calculateUnusedNightsDiscountArray.js | Discount for empty nights | { selectedNights, baseDiscount } → number[7] |
| calculateCombinedMarkup.js | Unit + Site markup | { unitMarkup, siteMarkup } → number |
| calculateMarkupAndDiscountMultipliersArray.js | Per-night multipliers | { combinedMarkup, discounts } → number[7] |
| calculateNightlyPricesArray.js | Guest-facing prices | { hostCompensation, multipliers } → number[7] |
| calculateLowestNightlyPrice.js | Find min price | { nightlyPrices } → number |
| calculateSlope.js | Price decay rate | { nightlyPrices } → number |
| index.js | Barrel export | — |

**Pattern to follow**: app/src/logic/calculators/pricing/calculateGuestFacingPrice.js

### 2.2 Rules (app/src/logic/rules/pricingList/)

| File | Purpose |
|------|---------|
| isPricingListValid.js | All arrays have 7 elements |
| canCalculatePricing.js | Required listing fields present |
| shouldRecalculatePricing.js | Detect stale pricing |
| index.js | Barrel export |

### 2.3 Processors (app/src/logic/processors/pricingList/)

| File | Purpose |
|------|---------|
| adaptPricingListFromSupabase.js | DB row → frontend model |
| adaptPricingListForSupabase.js | Frontend → DB format |
| extractHostRatesFromListing.js | Pull 💰 fields from listing |
| formatPricingListForDisplay.js | Format for UI |
| index.js | Barrel export |

### 2.4 Workflows (app/src/logic/workflows/pricingList/)

| File | Purpose |
|------|---------|
| savePricingWorkflow.js | Main orchestrator (replaces CORE-save_pricing_robert) |
| initializePricingListWorkflow.js | Create empty structure for new listing |
| recalculatePricingListWorkflow.js | Force full recalculation |
| index.js | Barrel export |

---

## Part 3: Constants Update

**File**: app/src/logic/constants/pricingConstants.js

Add new constants:

```javascript
export const PRICING_CONSTANTS = {
  // Existing
  FULL_TIME_DISCOUNT_RATE: 0.13,
  SITE_MARKUP_RATE: 0.17,
  FULL_TIME_NIGHTS_THRESHOLD: 7,
  MIN_NIGHTS: 2,
  MAX_NIGHTS: 7,
  BILLING_CYCLE_WEEKS: 4,

  // New for pricing_list
  PRICING_LIST_ARRAY_LENGTH: 7,
  DEFAULT_UNIT_MARKUP: 0,
  DEFAULT_UNUSED_NIGHTS_DISCOUNT: 0.05,
};
```

---

## Part 4: Edge Function

**Structure**: supabase/functions/pricing-list/

```
pricing-list/
├── index.ts           # Action router
├── handlers/
│   ├── create.ts      # Create pricing_list for listing
│   ├── get.ts         # Get by listing_id
│   ├── update.ts      # Update inputs + recalculate
│   └── recalculate.ts # Force full recalculation
└── utils/
    └── pricingCalculator.ts  # Server-side calculation logic
```

**Actions**: create, get, update, recalculate

**Pattern to follow**: supabase/functions/listing/index.ts

### Bubble Sync Integration

Use existing queue pattern from `_shared/queueSync.ts`:

```typescript
await enqueueBubbleSync(supabase, {
  correlationId: `pricing_list:${pricingListId}`,
  items: [{
    sequence: 1,
    table: 'pricing_list',
    recordId: pricingListId,
    operation: 'INSERT',
    payload: filterBubbleIncompatibleFields(pricingListData)
  }]
});
triggerQueueProcessing();
```

---

## Part 5: Frontend Integration

### 5.1 SelfListingPage Integration

**File**: app/src/islands/pages/SelfListingPage/sections/Section4Pricing.tsx

After pricing save, call Edge Function to create/update pricing_list:

```javascript
const handlePricingSave = async (pricingData) => {
  // 1. Save to listing (existing)
  await updateListing(listingId, pricingData);

  // 2. Create/update pricing_list (new)
  await fetch('/functions/v1/pricing-list', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      payload: { listing_id: listingId }
    })
  });
};
```

### 5.2 ViewSplitLeasePage Integration

**File**: app/src/islands/pages/ViewSplitLeasePage/

Fetch pricing_list alongside listing for instant price display:

```javascript
const { pricingList } = await fetchPricingList(listingId);
// Use pricingList.nightly_price[nightsSelected - 1] for display
```

---

## Part 6: Implementation Phases

### Phase 1: Database (Day 1)
- [ ] Create migration 20260128_alter_pricing_list_add_scalars.sql
- [ ] Run on dev database (adds scalar columns to existing table)
- [ ] Verify existing data is preserved
- [ ] Test new indexes

### Phase 2: Calculators (Day 2)
- [ ] Create app/src/logic/calculators/pricingList/ directory
- [ ] Implement 7 calculator files
- [ ] Create validators in app/src/logic/validators/pricingListValidators.js
- [ ] Add unit tests

### Phase 3: Rules + Processors (Day 3)
- [ ] Create rules directory with 3 files
- [ ] Create processors directory with 4 files
- [ ] Add unit tests

### Phase 4: Workflows (Day 4)
- [ ] Implement savePricingWorkflow.js (main orchestrator)
- [ ] Implement supporting workflows
- [ ] Add integration tests

### Phase 5: Edge Function (Day 5)
- [ ] Create supabase/functions/pricing-list/ structure
- [ ] Implement handlers
- [ ] Add to config.toml
- [ ] Test locally with supabase functions serve

### Phase 6: Frontend Integration (Day 6)
- [ ] Update SelfListingPage pricing save
- [ ] Update ViewSplitLeasePage to use pricing_list
- [ ] Test full flow

### Phase 7: Backfill + Cleanup (Day 7)
- [ ] Create backfill script for existing listings
- [ ] Run in batches
- [ ] Verify data integrity

---

## Part 7: Key Formulas (from Bubble)

**Host Compensation (per night)**
```
hostCompensation[n] = hostRates[n]  // Direct from listing
```

**Discount Multiplier (per night)**
```
discountMultiplier[n] = 1 - (baseDiscount[n] + unusedNightsDiscount[n])
```

**Nightly Price (guest-facing)**
```
nightlyPrice[n] = hostCompensation[n] * (1 + combinedMarkup) * discountMultiplier[n]
```

**Starting Nightly Price**
```
startingNightlyPrice = Math.min(...nightlyPrice)
```

**Slope (price decay)**
```
slope = (nightlyPrice[0] - nightlyPrice[6]) / 6
```

---

## Part 8: Verification Plan

### Unit Tests
- Each calculator returns expected output for known inputs
- Each calculator throws on invalid input
- Each rule returns boolean correctly
- Each processor transforms data correctly

### Integration Tests
- Full workflow: listing save → pricing_list creation
- Edge Function: all 4 actions work correctly
- Bubble sync: queue items created correctly

### Manual Testing
- Create new listing with pricing → verify pricing_list created
- Edit listing pricing → verify pricing_list updated
- View listing → verify guest prices display correctly
- Check Bubble sync → verify data synced

### Validation Queries

```sql
-- All pricing_lists have 7-element arrays (using existing column names)
SELECT _id FROM pricing_list
WHERE jsonb_array_length("Host Compensation") != 7
   OR jsonb_array_length("Nightly Price") != 7;

-- All active listings have pricing_list
SELECT l._id FROM listing l
LEFT JOIN pricing_list p ON l._id = p.listing
WHERE p._id IS NULL AND l."rental type" = 'Nightly';

-- Verify new scalar columns are populated after backfill
SELECT _id, "Starting Nightly Price", "Combined Markup"
FROM pricing_list
WHERE "Starting Nightly Price" IS NULL;
```

---

## Critical Files Reference

| Purpose | File Path |
|---------|-----------|
| Calculator pattern | app/src/logic/calculators/pricing/calculateGuestFacingPrice.js |
| Constants | app/src/logic/constants/pricingConstants.js |
| Queue sync | supabase/functions/_shared/queueSync.ts |
| Edge Function pattern | supabase/functions/listing/index.ts |
| Listing submit handler | supabase/functions/listing/handlers/submit.ts |
| Pricing edit UI | app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/ |

---

## Decision Summary

| Question | Decision | Rationale |
|----------|----------|-----------|
| New table vs extend existing? | Extend existing pricing_list | Table already exists with array fields, just add missing scalars |
| Existing listings without pricing_list? | Lazy init + backfill | Graceful fallback, bulk migration script |
| Client-side vs server-side calculation? | Server-side | Single source of truth, automatic sync |
| Integration with getNightlyRateByFrequency? | Parallel usage | Existing calculator for host rates, pricing_list for guest prices |
| Column naming convention? | Bubble-style | Use spaces/title case for sync compatibility (e.g., Starting Nightly Price) |
