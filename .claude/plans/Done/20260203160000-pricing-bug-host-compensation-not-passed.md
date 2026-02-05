# Bug: Host Compensation Not Passed to Proposal Creation

**Priority**: HIGH
**Category**: Pricing / Data Integrity
**Status**: DOCUMENTED - Awaiting Implementation

---

## Summary

When a guest creates a proposal, the `hostFourWeekCompensation` value is not passed from the frontend to the Edge Function. This causes the proposal to store `total_price == host_compensation`, meaning **no platform fee is being calculated**.

---

## Root Cause

### File 1: [useViewSplitLeaseLogic.ts:471-475](app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts#L471-L475)

```typescript
pricing: {
  pricePerNight: proposalData.pricePerNight,
  pricePerFourWeeks: proposalData.pricePerFourWeeks,
  totalPrice: proposalData.totalPrice
  // ❌ MISSING: hostFourWeekCompensation
}
```

### File 2: [proposalService.js:151,158](app/src/lib/proposalService.js#L151)

```javascript
hostCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks,  // Falls back to guest price!
fourWeekCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks  // Same issue
```

Since `hostFourWeekCompensation` is `undefined`, the fallback `|| pricing.pricePerFourWeeks` is used, making guest and host amounts identical.

---

## Evidence

Database query on existing proposal:
```
_id: 1770159061653x62898825266286032
total_price: $7,592
host_compensation: $7,592
difference: $0 (should be ~$600 platform fee)
```

---

## Expected Behavior

Guest pays: $8,199 (with ~8% markup)
Host receives: $7,592 (without markup)
Platform fee: $607 (7.4%)

---

## Fix Required

### Step 1: Calculate host compensation in the frontend

**Reference: Bubble.io Legacy Calculation Logic**

The original Bubble frontend calculated host compensation as follows:

| Rental Type | Nights Selected | Formula |
|-------------|-----------------|---------|
| Nightly | 2 | `nightly_host_rate_2_nights * 8` (2 nights × 4 weeks) |
| Nightly | 3 | `nightly_host_rate_3_nights * 12` (3 nights × 4 weeks) |
| Nightly | 4 | `nightly_host_rate_4_nights * 16` (4 nights × 4 weeks) |
| Nightly | 5 | `nightly_host_rate_5_nights * 20` (5 nights × 4 weeks) |
| Nightly | 7 | `nightly_host_rate_5_nights * 28` (uses 5-night rate!) |
| Monthly | any | `monthly_host_rate` (flat) |
| Weekly | any | `weekly_host_rate * weeks_in_4_week_period` |

**Pattern**: `host_nightly_rate * nights_selected * 4_weeks`

**Implementation using pricing_list**:

The `pricing_list.Host Compensation` array already contains pre-calculated per-night host rates (indexed 0-6 for 1-7 nights):

```javascript
const nightsSelected = daysSelected.length - 1;  // e.g., Mon-Fri = 4 nights
const index = nightsSelected - 1;  // 0-indexed array
const hostNightlyRate = pricingList.hostCompensation[index];
const hostFourWeekCompensation = hostNightlyRate * nightsSelected * 4;  // 4 weeks
```

**Example (Nightly listing, 4 nights)**:
- `pricingList.hostCompensation[3]` = $146/night
- `hostFourWeekCompensation` = $146 × 4 nights × 4 weeks = **$2,336**

### Step 2: Pass to createProposal

```typescript
pricing: {
  pricePerNight: proposalData.pricePerNight,
  pricePerFourWeeks: proposalData.pricePerFourWeeks,
  hostFourWeekCompensation: proposalData.hostFourWeekCompensation,  // ✅ ADD THIS
  totalPrice: proposalData.totalPrice
}
```

### Step 3: Update proposalService (optional cleanup)

Remove fallback that masks the bug:
```javascript
// Before
hostCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks,

// After - fail explicitly if missing
hostCompensation: pricing.hostFourWeekCompensation,
```

---

## Files to Modify

| File | Change |
|------|--------|
| [useViewSplitLeaseLogic.ts](app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts) | Pass `hostFourWeekCompensation` in pricing object |
| Price calculation logic | Calculate host compensation from `pricing_list.Host Compensation` |
| [proposalService.js](app/src/lib/proposalService.js) | (Optional) Remove unsafe fallback |

---

## Related Files

- `pricing_list` table - Contains `Host Compensation` array with 7 elements (index 0-6 = 1-7 nights)
- `supabase/functions/proposal/actions/create.ts` - Edge Function that processes the proposal
- `app/src/lib/priceCalculations.js` - Price calculation utilities

---

## Test Verification

After fix, verify:
1. Create a new proposal
2. Query database: `SELECT total_price, host_compensation FROM proposals WHERE _id = '{new_proposal_id}'`
3. Confirm: `total_price > host_compensation` by ~8%
