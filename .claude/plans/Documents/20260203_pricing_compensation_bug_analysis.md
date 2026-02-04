# Pricing & Compensation Bug Analysis

**Date**: 2026-02-03
**Issue**: Host and Guest see identical pricing values when they should see different values
**Reported Values**: Both see $181/night and $11,000 total (should be different)

---

## Problem Summary

The Split Lease application has **TWO separate pricing concepts**:
1. **Host Compensation** - What the host earns (lower, after platform fees/discounts)
2. **Guest Price** - What the guest pays (higher, includes platform markup)

**Bug**: Both roles are seeing the **same** pricing values, suggesting either:
- Guest price is being stored in host compensation fields, OR
- Host compensation is being displayed to guests, OR
- The calculation that applies markup/fees is not being executed

---

## Architecture Overview

### Database Fields (Proposal Table)

| Field Name | Purpose | Value Example |
|------------|---------|---------------|
| `"proposal nightly price"` | **Guest-facing** per-night rate (includes markup) | $181 |
| `"Total Price for Reservation (guest)"` | **Guest-facing** total price | $11,000 |
| `"host compensation"` | **Host** per-night rate (from listing tiers) | ~$155 |
| `"Total Compensation (proposal - host)"` | **Host** total compensation | ~$9,400 |
| `"hc nightly price"` | **Guest** per-night rate (counteroffer) | $181 |
| `"hc total price"` | **Guest** total price (counteroffer) | $11,000 |
| `"hc host compensation (per period)"` | **Host** per-period rate (counteroffer) | ~$155 |
| `"hc total host compensation"` | **Host** total compensation (counteroffer) | ~$9,400 |

**HC Prefix** = "Host Counteroffer" fields (used when host modifies proposal)

---

## Key Calculation Files

### 1. Host Compensation Calculation
**File**: `app/src/logic/calculators/pricingList/calculateHostCompensationArray.ts`

```typescript
// Maps listing host rate fields to 7-element array
// Index 0 = 1 night, Index 6 = 7 nights
export function calculateHostCompensationArray({ hostRates }) {
  return [
    normalizeRate(hostRates.rate1Night),
    normalizeRate(hostRates.rate2Nights),
    // ... etc
    normalizeRate(hostRates.rate7Nights)
  ];
}
```

**Purpose**: Extracts HOST compensation rates from listing pricing tiers.

---

### 2. Guest-Facing Price Calculation
**File**: `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js`

```javascript
/**
 * Calculate guest-facing price per night after markup and discounts.
 *
 * Formula:
 * 1. Base price = host rate × nights
 * 2. Full-time discount = base price × 0.13 (only if 7 nights)
 * 3. Price after discounts = base price - discount
 * 4. Site markup = price after discounts × 0.17
 * 5. Total price = base price - discount + markup
 * 6. Price per night = total price / nights
 */
export function calculateGuestFacingPrice({ hostNightlyRate, nightsCount }) {
  const basePrice = hostNightlyRate * nightsCount;

  const fullTimeDiscount = nightsCount === 7
    ? basePrice * 0.13  // 13% discount for full-time (7 nights)
    : 0;

  const priceAfterDiscounts = basePrice - fullTimeDiscount;
  const siteMarkup = priceAfterDiscounts * 0.17;  // 17% site markup
  const totalPrice = basePrice - fullTimeDiscount + siteMarkup;
  const pricePerNight = totalPrice / nightsCount;

  return pricePerNight;
}
```

**Key Constants** (`app/src/logic/constants/pricingConstants.js`):
- `SITE_MARKUP_RATE`: 0.17 (17%)
- `FULL_TIME_DISCOUNT_RATE`: 0.13 (13% for 7 nights)
- `FULL_TIME_NIGHTS_THRESHOLD`: 7

**Example**:
- Host rate: $155/night × 5 nights = $775
- No discount (not 7 nights)
- Site markup: $775 × 0.17 = $131.75
- Total: $775 + $131.75 = $906.75
- Per night: $906.75 / 5 = **$181.35/night** ✅

---

### 3. Proposal Creation (Edge Function)
**File**: `supabase/functions/proposal/actions/create.ts`

```typescript
// Lines 318-333: Calculate HOST compensation
const hostNightlyRate = getNightlyRateForNights(listingData, nightsPerWeek);

const compensation = calculateCompensation(
  rentalType,
  reservationSpan,
  nightsPerWeek,
  listingData["weekly_host_rate"] || 0,
  hostNightlyRate,  // HOST rate from listing tiers
  actualWeeks,
  listingData["monthly_host_rate"] || 0,
  avgDaysPerMonth
);

// Lines 443-449: Store in database
{
  "proposal nightly price": input.proposalPrice,  // GUEST price (from frontend)
  "Total Price for Reservation (guest)": input.estimatedBookingTotal,  // GUEST total
  "Total Compensation (proposal - host)": compensation.total_compensation,  // HOST total
  "host compensation": compensation.host_compensation_per_night,  // HOST per-night
}
```

**Critical**: The edge function receives:
- `input.proposalPrice` = Guest-facing per-night price (calculated by frontend)
- `input.estimatedBookingTotal` = Guest-facing total price (calculated by frontend)

Then calculates **separately**:
- `compensation.host_compensation_per_night` = Host's per-night rate (from listing)
- `compensation.total_compensation` = Host's total compensation

---

### 4. Host Compensation Calculation (Edge Function)
**File**: `supabase/functions/proposal/lib/calculations.ts`

```typescript
/**
 * IMPORTANT: host_compensation in Bubble is the HOST'S per-night rate (from listing's
 * pricing tiers like "💰Nightly Host Rate for X nights"), NOT the guest-facing price.
 * The Total Compensation is then calculated as:
 *   - Nightly: host_nightly_rate * nights_per_week * total_weeks
 */
export function calculateCompensation(
  rentalType,
  reservationSpan,
  nightsPerWeek,
  weeklyRate,
  hostNightlyRate,  // HOST rate, not guest price
  weeks,
  monthlyRate,
  avgDaysPerMonth
) {
  let totalCompensation = 0;
  let hostCompensationPerPeriod = hostNightlyRate;

  switch (rentalType) {
    case "nightly":
      // Total = host_nightly_rate * nights_per_week * total_weeks
      hostCompensationPerPeriod = hostNightlyRate;
      totalCompensation = hostNightlyRate * nightsPerWeek * weeks;
      break;
    // ... other cases
  }

  return {
    total_compensation: totalCompensation,
    host_compensation_per_night: hostCompensationPerPeriod,
  };
}
```

---

## Display Components

### Host View: ProposalCard
**File**: `app/src/islands/pages/HostProposalsPage/ProposalCard.jsx`

```javascript
// Lines 143-147: Get pricing info
// "host compensation" is the per-night HOST rate (from listing pricing tiers)
// "Total Compensation (proposal - host)" is the total = per-night rate * nights * weeks
const hostCompensation = proposal['host compensation'] || 0;
const totalCompensation = proposal['Total Compensation (proposal - host)'] || 0;

// Lines 224-233: Display compensation
<div className="detail-row compensation">
  <span className="compensation-label">Your Compensation</span>
  <span className="compensation-value">
    {totalCompensation > 0 ? (
      <strong>${formatCurrency(totalCompensation)}</strong>
    ) : (
      <span className="compensation-error">Contact Split Lease</span>
    )}
  </span>
</div>
```

---

### Host View: PricingRow (Detailed Breakdown)
**File**: `app/src/islands/pages/HostProposalsPage/PricingRow.jsx`

```javascript
// Lines 36-40: Use '4 week compensation' as source of truth
// The database "Total Compensation (proposal - host)" field can be incorrect
const host4WeekCompensation = proposal['4 week compensation'] || 0;

// Lines 64-68: Calculate total from 4 week periods
const fourWeekPeriods = weeks / 4;
const hostTotalCompensation = Math.round(host4WeekCompensation * fourWeekPeriods * 100) / 100;
const totalEarnings = hostTotalCompensation;

// Derive nightly host rate from 4 week compensation
const hostNightlyRate = nightsPerWeek > 0 ? host4WeekCompensation / (4 * nightsPerWeek) : 0;

// Lines 150-155: Display
<div className="hp7-pricing-total-label">
  {isDeclined ? 'Was Offered' : 'Your Earnings'}
</div>
<div className="hp7-pricing-total">
  {formattedTotal}
</div>
```

**Note**: PricingRow prefers `'4 week compensation'` over `'Total Compensation (proposal - host)'` due to known accuracy issues.

---

### Guest View: ExpandableProposalCard
**File**: `app/src/islands/pages/proposals/ExpandableProposalCard.jsx`

```javascript
// Lines 582-603: Get pricing (guest-facing)
const originalNightlyPrice = proposal['proposal nightly price'] || 0;
const originalTotalPrice = proposal['Total Price for Reservation (guest)'] || 0;

const hcNightlyPrice = proposal['hc nightly price'];  // Counteroffer pricing
const hcTotalPrice = proposal['hc total price'];

const nightlyPrice = isCounteroffer && hcNightlyPrice != null ? hcNightlyPrice : originalNightlyPrice;
const totalPrice = isCounteroffer && hcTotalPrice != null ? hcTotalPrice : originalTotalPrice;

// Lines 1008-1035: Display pricing
<div className="epc-pricing-breakdown">
  <div className="epc-pricing-row">
    <span>Per night</span>
    {nightlyPriceChanged && (
      <span className="epc-strikethrough">{formatPrice(originalNightlyPrice)}</span>
    )}
    <span className={nightlyPriceChanged ? 'epc-changed-value' : ''}>
      {formatPrice(nightlyPrice)}
    </span>
  </div>

  <div className="epc-pricing-total-row">
    {totalPriceChanged && (
      <span className="epc-pricing-original">{formatPrice(originalTotalPrice)}</span>
    )}
    <div className="epc-pricing-total">
      {formatPrice(totalPrice)}
    </div>
  </div>
</div>
```

---

## Root Cause Hypothesis

Based on the reported values ($181/night, $11,000 total appearing for both roles), there are **three possible bugs**:

### Hypothesis 1: Frontend Not Calculating Guest Price
**Location**: Proposal creation flow
**Issue**: The frontend is sending `hostNightlyRate` for BOTH `proposalPrice` AND internal compensation calculations, bypassing `calculateGuestFacingPrice()`.

**Evidence**:
- $181/night is plausible as a host rate for a mid-tier listing
- If `calculateGuestFacingPrice()` was applied, we'd see ~$211/night ($181 × 1.17)

**Check**: Inspect the proposal creation payload sent from frontend to edge function. Does it include properly calculated `proposalPrice` with markup applied?

---

### Hypothesis 2: Database Fields Swapped During Save
**Location**: `supabase/functions/proposal/actions/create.ts` (lines 443-449)
**Issue**: The edge function is storing `input.proposalPrice` in BOTH `"proposal nightly price"` (correct) AND `"host compensation"` (wrong), OR vice versa.

**Evidence**:
- Both roles seeing identical values suggests database-level mixing
- The edge function has complex field mapping with multiple naming conventions

**Check**: Add logging to the edge function before INSERT to verify:
```typescript
console.log('[proposal:create] Pricing values before save:', {
  guestNightlyPrice: input.proposalPrice,
  guestTotalPrice: input.estimatedBookingTotal,
  hostCompPerNight: compensation.host_compensation_per_night,
  hostTotalComp: compensation.total_compensation
});
```

---

### Hypothesis 3: Display Logic Using Wrong Fields
**Location**: Display components reading wrong database fields
**Issue**:
- Host components are reading `"proposal nightly price"` instead of `"host compensation"`
- Guest components are reading `"host compensation"` instead of `"proposal nightly price"`

**Evidence**:
- Display code appears correct based on review
- ProposalCard.jsx uses `proposal['host compensation']` (correct)
- ExpandableProposalCard.jsx uses `proposal['proposal nightly price']` (correct)

**Likelihood**: Low - display logic appears properly separated

---

## Diagnostic Steps

### Step 1: Frontend Payload Inspection
**Action**: Add logging in the proposal creation form submission handler

**File**: `app/src/islands/pages/CreateProposalPage.jsx` (or similar)

```javascript
console.log('[CreateProposal] Sending payload:', {
  proposalPrice: payload.proposalPrice,
  estimatedBookingTotal: payload.estimatedBookingTotal,
  hostNightlyRate: listing.nightly_rate_X_nights,  // Should NOT be sent
  nightsSelected: payload.nightsSelected
});
```

**Expected**:
- `proposalPrice` should be ~17% higher than listing's host rate
- `estimatedBookingTotal` should reflect full reservation with markup

**If Bug Present**:
- `proposalPrice` = raw host rate (no markup applied)
- Both prices are identical to listing host rates

---

### Step 2: Edge Function Database Insert Verification
**Action**: Add logging in `supabase/functions/proposal/actions/create.ts` before INSERT

```typescript
// After line 449 (before the INSERT)
console.log('[proposal:create] Database values:', {
  guest_nightly: proposalData["proposal nightly price"],
  guest_total: proposalData["Total Price for Reservation (guest)"],
  host_per_night: proposalData["host compensation"],
  host_total: proposalData["Total Compensation (proposal - host)"]
});
```

**Expected**:
- Guest values > Host values (due to 17% markup)
- Different values for each field

**If Bug Present**:
- All four values are identical
- Values match the host rate from listing, not guest-facing price

---

### Step 3: Database Query Verification
**Action**: Query an existing proposal directly from Supabase

```sql
SELECT
  _id,
  "proposal nightly price" as guest_nightly,
  "Total Price for Reservation (guest)" as guest_total,
  "host compensation" as host_per_night,
  "Total Compensation (proposal - host)" as host_total,
  "4 week compensation" as host_4wk_comp
FROM proposal
WHERE _id = '<reported-proposal-id>'
LIMIT 1;
```

**Expected**:
- `guest_nightly` > `host_per_night` (17% difference)
- `guest_total` > `host_total` (17% difference)

**If Bug Present**:
- All values are identical
- Values match the reported $181/$11,000

---

### Step 4: Pricing Function Unit Test
**Action**: Verify `calculateGuestFacingPrice()` is working correctly

```javascript
import { calculateGuestFacingPrice } from './calculateGuestFacingPrice.js';

const result = calculateGuestFacingPrice({
  hostNightlyRate: 155,
  nightsCount: 5
});

console.log('Result:', result);
// Expected: ~181 per night after markup
// ($155 * 5 = $775, + 17% markup = $906.75, / 5 = $181.35)
```

**If Bug Present**: Function returns the raw host rate without markup

---

## Recommended Fix Locations

### If Bug is in Frontend (Hypothesis 1)
**File**: Proposal creation form (likely `app/src/islands/pages/CreateProposalPage.jsx` or similar)

**Fix**: Ensure `calculateGuestFacingPrice()` is called before sending payload:

```javascript
import { calculateGuestFacingPrice } from '../logic/calculators/pricing/calculateGuestFacingPrice.js';

// Before sending to edge function
const guestNightlyPrice = calculateGuestFacingPrice({
  hostNightlyRate: listing.nightly_rate_X_nights,
  nightsCount: nightsSelected.length
});

const guestTotalPrice = guestNightlyPrice * nightsSelected.length * weeks;

const payload = {
  proposalPrice: guestNightlyPrice,  // Guest-facing price with markup
  estimatedBookingTotal: guestTotalPrice,
  // ... other fields
};
```

---

### If Bug is in Edge Function (Hypothesis 2)
**File**: `supabase/functions/proposal/actions/create.ts` (lines 443-449)

**Fix**: Verify field assignments are correct:

```typescript
const proposalData = {
  // GUEST-FACING PRICES (includes 17% markup)
  "proposal nightly price": input.proposalPrice,  // Guest price
  "Total Price for Reservation (guest)": input.estimatedBookingTotal,  // Guest total

  // HOST COMPENSATION (from listing tiers, no markup)
  "Total Compensation (proposal - host)": compensation.total_compensation,  // Host total
  "host compensation": compensation.host_compensation_per_night,  // Host per-night
};
```

**Add Validation**:
```typescript
// After calculating compensation
if (Math.abs(input.proposalPrice - compensation.host_compensation_per_night) < 5) {
  console.error('[proposal:create] WARNING: Guest price too close to host compensation', {
    guestPrice: input.proposalPrice,
    hostComp: compensation.host_compensation_per_night,
    expectedDifference: '~17%'
  });
}
```

---

## Test Cases

### Test Case 1: Verify Guest Price Calculation
```javascript
// Host rate: $155/night
// Nights: 5
// Expected guest price: $181/night

const guestPrice = calculateGuestFacingPrice({
  hostNightlyRate: 155,
  nightsCount: 5
});

assert(guestPrice > 155, 'Guest price should be higher than host rate');
assert(guestPrice === 181, 'Guest price should be $181/night');
```

---

### Test Case 2: Verify Full-Time Discount (7 nights)
```javascript
// Host rate: $155/night
// Nights: 7
// Expected: 13% discount on base, then 17% markup

const guestPrice7Nights = calculateGuestFacingPrice({
  hostNightlyRate: 155,
  nightsCount: 7
});

// Base: $155 * 7 = $1,085
// Discount: $1,085 * 0.13 = $141.05
// After discount: $943.95
// Markup: $943.95 * 0.17 = $160.47
// Total: $943.95 + $160.47 = $1,104.42
// Per night: $1,104.42 / 7 = $157.77

assert(guestPrice7Nights < 181, 'Full-time rate should be lower due to discount');
assert(Math.abs(guestPrice7Nights - 157.77) < 0.5, 'Should match expected calculation');
```

---

### Test Case 3: End-to-End Proposal Creation
```javascript
// Create a proposal and verify both pricing values are stored correctly
const proposalPayload = {
  listingId: 'test-listing-123',
  guestId: 'test-guest-456',
  nightsSelected: [1, 2, 3, 4, 5],  // Mon-Fri (5 nights)
  reservationSpanWeeks: 13,
  proposalPrice: 181,  // Guest-facing (with markup)
  estimatedBookingTotal: 11765,  // 181 * 5 * 13
};

const response = await createProposal(proposalPayload);
const proposal = await getProposal(response.proposalId);

// Verify database values
assert(proposal['proposal nightly price'] === 181, 'Guest nightly price');
assert(proposal['Total Price for Reservation (guest)'] === 11765, 'Guest total');
assert(proposal['host compensation'] === 155, 'Host per-night compensation');
assert(proposal['Total Compensation (proposal - host)'] === 10075, 'Host total compensation');

// Verify difference is ~17%
const markup = (181 - 155) / 155;
assert(Math.abs(markup - 0.17) < 0.01, 'Markup should be ~17%');
```

---

## Next Steps

1. **Immediate**: Add logging to Step 1 & Step 2 to identify where values diverge
2. **Database Check**: Run Step 3 SQL query on the reported proposal
3. **Unit Test**: Verify Step 4 pricing function works in isolation
4. **Fix & Verify**: Apply fix based on root cause, then run Test Cases 1-3
5. **Regression Check**: Test with different night counts (2-7) and weeks (1-52)

---

## Related Files Reference

### Pricing Calculators
- `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` - Guest price with markup
- `app/src/logic/calculators/pricingList/calculateHostCompensationArray.ts` - Host rates from listing
- `app/src/logic/calculators/pricing/calculatePricingBreakdown.js` - Full breakdown (legacy)
- `app/src/logic/calculators/pricing/calculateFeeBreakdown.js` - Fee calculations (1.5% split model)

### Edge Functions
- `supabase/functions/proposal/index.ts` - Main entry point
- `supabase/functions/proposal/actions/create.ts` - Proposal creation logic
- `supabase/functions/proposal/actions/update.ts` - Proposal updates (HC fields)
- `supabase/functions/proposal/lib/calculations.ts` - Compensation calculations

### Display Components (Host)
- `app/src/islands/pages/HostProposalsPage/ProposalCard.jsx` - Card view (shows `totalCompensation`)
- `app/src/islands/pages/HostProposalsPage/PricingRow.jsx` - Detailed breakdown (uses `'4 week compensation'`)
- `app/src/islands/pages/HostProposalsPage/ProposalDetailsModal.jsx` - Full details modal

### Display Components (Guest)
- `app/src/islands/pages/proposals/ExpandableProposalCard.jsx` - Accordion view (shows `'proposal nightly price'`)
- `app/src/islands/modals/GuestEditingProposalModal.jsx` - Edit modal
- `app/src/islands/shared/QuickMatch/ProposalCard.jsx` - Quick match view

### Constants
- `app/src/logic/constants/pricingConstants.js` - SITE_MARKUP_RATE (0.17), FULL_TIME_DISCOUNT_RATE (0.13)

---

## Summary

The bug likely originates from **Hypothesis 1** (frontend not calculating guest price with markup) or **Hypothesis 2** (edge function storing values incorrectly). The display logic appears correct and properly separated by role.

**Key diagnostic**: Check if `calculateGuestFacingPrice()` is being called in the proposal creation flow. If not, the frontend is sending raw host rates to the edge function, which would explain identical values for both roles.

**Expected behavior**:
- Host sees: $155/night, $10,075 total (from listing tiers)
- Guest sees: $181/night, $11,765 total (includes 17% markup)

**Current reported behavior**:
- Both see: $181/night, $11,000 total (same values)

This suggests the guest-facing price ($181) is being stored in BOTH the guest AND host fields, indicating the markup calculation is happening but the values are being stored in the wrong database columns.
