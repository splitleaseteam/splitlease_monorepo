# Proposal Creation and Pricing Investigation

**Date**: 2026-02-04
**Issue**: Proposals not persisted + total_price equals host_compensation

---

## Issues Reported

1. **Proposals not persisted** - Guest UI showed "success" creating proposals but database has 0 records for that guest
2. **total_price equals host_compensation** - Existing proposal shows $7,592 for both fields (should be different with ~8% markup)

---

## Code Flow Analysis

### Frontend Flow

**Entry Point**: `BookingWidget.tsx` (line 251-286)
- User clicks "Create Proposal" button
- Calls `onSubmit` which maps to `handleSubmitProposal` in `useViewSplitLeaseLogic.ts`

**Logic Hook**: `useViewSplitLeaseLogic.ts` (lines 456-504)
- Validates `authUserId` from JWT
- Calls `createProposal` from `proposalService.js` with:
  ```javascript
  {
    guestId: authUserId,  // JWT-derived
    listingId: listing._id,
    moveInDate: proposalData.moveInDate,
    daysSelectedObjects: proposalData.daysSelectedObjects,
    reservationSpanWeeks: proposalData.reservationSpan || 13,
    pricing: {
      pricePerNight: proposalData.pricePerNight,
      pricePerFourWeeks: proposalData.pricePerFourWeeks,
      totalPrice: proposalData.totalPrice
    },
    details: { ... }
  }
  ```

**Proposal Service**: `proposalService.js` (lines 104-185)
- Builds payload for Edge Function
- **CRITICAL**: On line 151, `hostCompensation` is set:
  ```javascript
  hostCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks
  ```
- This fallback to `pricePerFourWeeks` (guest price) if `hostFourWeekCompensation` is missing

### Edge Function Flow

**Entry Point**: `supabase/functions/proposal/index.ts`
- Routes `action: 'create'` to `handleCreate` in `actions/create.ts`

**Create Handler**: `actions/create.ts`
- Lines 340-369: Fetches `pricing_list` to get both guest and host rates
- Lines 373-428: Calculates compensation values
  - `hostCompensationPerNight` from `pricing_list.Host Compensation[nights-1]`
  - `guestNightlyPrice` from `pricing_list.Nightly Price[nights-1]`
  - `totalCompensation` = host rate * nights * weeks (accounting for alternating patterns)
  - `fourWeekRent` = guest rate * nights * 4 (includes markup)

**Database Insert**: Lines 553-561
```typescript
"proposal nightly price": input.proposalPrice,
"4 week rent": input.fourWeekRent || compensation.four_week_rent,
"Total Price for Reservation (guest)": input.estimatedBookingTotal,
"Total Compensation (proposal - host)": compensation.total_compensation,
"host compensation": compensation.host_compensation_per_night,
"4 week compensation": input.fourWeekCompensation || compensation.four_week_compensation,
```

---

## Identified Issues

### Issue 1: Missing `hostFourWeekCompensation` in Frontend

**File**: `useViewSplitLeaseLogic.ts` lines 470-475

The pricing object sent to `createProposal` does NOT include `hostFourWeekCompensation`:
```javascript
pricing: {
  pricePerNight: proposalData.pricePerNight,
  pricePerFourWeeks: proposalData.pricePerFourWeeks,
  totalPrice: proposalData.totalPrice
  // MISSING: hostFourWeekCompensation
}
```

**File**: `proposalService.js` line 151

When `hostFourWeekCompensation` is missing, it falls back to guest price:
```javascript
hostCompensation: pricing.hostFourWeekCompensation || pricing.pricePerFourWeeks
```

This means the frontend sends guest prices as host compensation, causing:
- `fourWeekRent` = guest price (correct)
- `fourWeekCompensation` = guest price (WRONG - should be host price)

**However**, the Edge Function recalculates pricing from `pricing_list`, so this frontend issue should be overridden.

### Issue 2: Fallback to Input Values When pricing_list is Missing

**File**: `actions/create.ts` lines 444-450

If `pricing_list` fetch fails or returns null:
```typescript
} else {
  console.error('[proposal:create] Failed to get pricing rates - using input values');
  // Last resort: use input values from frontend (may already be calculated)
  fourWeekRent = input.fourWeekRent || 0;
  fourWeekCompensation = input.fourWeekCompensation || input.fourWeekRent || 0;  // BUG: Falls back to guest price!
  totalCompensation = 0;  // BUG: Sets to 0!
```

**This is a potential root cause** - if the listing has no `pricing_list`, the fallback logic:
1. Sets `totalCompensation = 0`
2. Falls back `fourWeekCompensation` to `fourWeekRent` (guest price)

### Issue 3: Proposals Not Persisting

**Potential Causes**:

1. **Authentication failure** - `authenticateFromHeaders` returns null
   - Line 319 has a bug: `console.error('[proposal:auth] Exception:', (err as Error).message)` - `err` is undefined (should be `_err`)

2. **Duplicate proposal check blocking** - Lines 117-153
   - If an "active" proposal exists, creation is blocked
   - Check excludes cancelled/rejected but not other statuses

3. **Insert error not surfaced** - Lines 601-608
   - Insert error is logged but the function throws, returning error to frontend
   - Frontend error handling in `proposalService.js` looks correct

4. **Success shown but request failed** - Frontend might be showing optimistic UI

---

## Relevant Database Fields

**Proposal Table Fields for Pricing**:
- `"proposal nightly price"` - Guest-facing nightly rate
- `"4 week rent"` - Guest 4-week total (with markup)
- `"Total Price for Reservation (guest)"` - Estimated booking total for guest
- `"Total Compensation (proposal - host)"` - Total host payout
- `"host compensation"` - Host's per-night rate (without markup)
- `"4 week compensation"` - Host's 4-week payout (without markup)

---

## Recommended Investigation Steps

### For Issue 1 (total_price = host_compensation):

1. **Check if listing has `pricing_list`**:
   ```sql
   SELECT _id, pricing_list FROM listing WHERE _id = '<listing_id>';
   ```

2. **If pricing_list exists, check its values**:
   ```sql
   SELECT _id, "Nightly Price", "Host Compensation"
   FROM pricing_list WHERE _id = '<pricing_list_id>';
   ```

3. **Check the proposal's stored values**:
   ```sql
   SELECT
     _id,
     "proposal nightly price",
     "4 week rent",
     "Total Price for Reservation (guest)",
     "Total Compensation (proposal - host)",
     "host compensation",
     "4 week compensation"
   FROM proposal WHERE _id = '<proposal_id>';
   ```

### For Issue 2 (Proposals not persisting):

1. **Check Edge Function logs** for authentication or insert errors

2. **Verify the guest user exists**:
   ```sql
   SELECT _id, email FROM "user" WHERE _id = '<guest_id>';
   ```

3. **Check for duplicate proposal blocking**:
   ```sql
   SELECT _id, "Status" FROM proposal
   WHERE "Guest" = '<guest_id>' AND "Listing" = '<listing_id>';
   ```

4. **Check browser network tab** for the actual API response

---

## Key Files Reference

| Component | File Path |
|-----------|-----------|
| Edge Function Entry | `supabase/functions/proposal/index.ts` |
| Create Action | `supabase/functions/proposal/actions/create.ts` |
| Calculations | `supabase/functions/proposal/lib/calculations.ts` |
| Frontend Service | `app/src/lib/proposalService.js` |
| View Logic Hook | `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts` |
| Booking Widget | `app/src/islands/pages/ViewSplitLeasePage/components/BookingWidget.tsx` |
| Frontend Pricing | `app/src/lib/priceCalculations.js` |
| Fee Breakdown | `app/src/logic/calculators/pricing/calculateFeeBreakdown.js` |

---

## Code Bug Found

**File**: `supabase/functions/proposal/index.ts` line 317-319

```typescript
} catch (_err) {
  console.error('[proposal:auth] Exception:', (err as Error).message);  // BUG: Should be _err
  return null;
}
```

The catch block names the error `_err` but logs `err`, which is undefined. This causes a reference error that would mask the actual authentication error.

---

## Summary

**Most Likely Causes**:

1. **total_price = host_compensation**: The listing may not have a `pricing_list` record, causing the Edge Function to fall back to input values which don't distinguish guest vs host rates

2. **Proposals not persisting**: Likely an authentication issue (possibly related to the `_err` vs `err` bug) or the duplicate proposal check is blocking creation
