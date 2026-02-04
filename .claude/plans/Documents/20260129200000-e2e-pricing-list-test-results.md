# E2E Test Report: Pricing List Structure Creation - FINAL RESULTS

**Test Date**: 2026-01-29
**Test Duration**: ~45 minutes
**Test Status**: **CRITICAL ISSUES FOUND**
**Environment**: splitlease-backend-dev (`qzsmhgyojmwvtjmnrdea`)

---

## Executive Summary

The E2E test of pricing list structure creation revealed a **critical gap** in the listing creation workflow: **pricing_list records are NOT being generated** for any rental type (Nightly, Weekly, or Monthly). All 3 test listings were created successfully, but none have associated pricing_list records.

### Test Listings Created

| Rental Type | Listing ID | Host Rate | pricing_list FK | Status |
|-------------|------------|-----------|-----------------|--------|
| **Nightly** | `1769715979908x80446666023968080` | $100-$73/night | **NULL** | FAIL |
| **Weekly** | `1769716553352x28756256607002628` | $500/week | **NULL** | FAIL |
| **Monthly** | `1769717119709x40526944045311896` | $2000/month | **NULL** | FAIL |

---

## Phase-by-Phase Results

### Phase 1: Environment Verification - PASS

| Check | Result | Notes |
|-------|--------|-------|
| Dev server running | PASS | localhost:3000 |
| Supabase MCP connected | PASS | splitlease-backend-dev |
| Pricing constants found | PASS | Hardcoded in `pricingConstants.js` |
| Baseline pricing_list count | 528 | All legacy Bubble data |

**Key Finding**: No `zat_config` table exists. Pricing configuration is hardcoded in frontend:
- `SITE_MARKUP_RATE`: 0.17
- `FULL_TIME_DISCOUNT_RATE`: 0.13
- `UNUSED_NIGHTS_DISCOUNT_MULTIPLIER`: 0.03

### Phase 2: Nightly Listing Creation - PASS

- **Listing ID**: `1769715979908x80446666023968080`
- **Pricing Configured**:
  - Night 1: $100, Night 2: $95, Night 3: $90, Night 4: $85
  - Night 5: $81, Night 6: $77, Night 7: $73
- **Damage Deposit**: $500
- **Status**: Successfully activated

### Phase 3: Nightly Pricing Validation - FAIL

| Validation | Expected | Actual |
|------------|----------|--------|
| pricing_list FK populated | Valid ID | `NULL` |
| pricing_list record exists | Yes | **NO** |
| Host Compensation array | [null, 100, 95, 90, 85, 81, 77, 73] | N/A |
| Nightly Price array | [null, 117, 111, 105, 99, 95, 90, 85] | N/A |

### Phase 4: Weekly Listing Creation - PASS

- **Listing ID**: `1769716553352x28756256607002628`
- **Weekly Host Rate**: $500/week
- **Damage Deposit**: $500
- **Status**: Successfully activated

### Phase 5: Weekly Pricing Validation - FAIL

| Validation | Expected | Actual |
|------------|----------|--------|
| pricing_list FK populated | Valid ID | `NULL` |
| pricing_list record exists | Yes | **NO** |
| Host Compensation | $71.43/night (500/7) | N/A |
| Nightly Price | $83.57/night | N/A |

### Phase 6: Monthly Listing Creation - PASS

- **Listing ID**: `1769717119709x40526944045311896`
- **Monthly Host Rate**: $2000/month
- **Damage Deposit**: $500
- **Status**: Successfully activated

### Phase 7: Monthly Pricing Validation - FAIL

| Validation | Expected | Actual |
|------------|----------|--------|
| pricing_list FK populated | Valid ID | `NULL` |
| pricing_list record exists | Yes | **NO** |
| Host Compensation | $66.67/night (2000/30) | N/A |
| Nightly Price | $78.00/night | N/A |

### Phase 8: Unit Test Page Cross-Validation - BLOCKED

**Status**: Unit test page failed to load

**Error**: `column listing.Host Comp Style does not exist`

**Location**: `useZPricingUnitTestPageLogic.js` line 216

The unit test page references a non-existent column `"Host Comp Style"` in its query, preventing any validation through the UI.

---

## Root Cause Analysis

### Primary Issue: pricing_list Generation Not Triggered

The listing creation flow does NOT automatically generate a pricing_list record. Investigation reveals:

1. **No automatic trigger**: The listing creation edge function (`listing/handlers/create.ts` and `submit.ts`) does not call the pricing_list creation logic
2. **Missing workflow step**: There's no post-creation hook to generate pricing_list
3. **Manual invocation required**: The pricing_list edge function must be explicitly called with `action: 'create'`

### Secondary Issue: Unit Test Page Schema Mismatch

The internal pricing unit test page has a broken query referencing `"Host Comp Style"` which doesn't exist in the current schema.

### Data Observation: No Recent pricing_list Records

- **Total pricing_list records**: 528
- **Most recent record date**: 2025-09-16
- **Records created in 2026**: 0

This indicates the pricing_list generation workflow has been broken since at least September 2025.

---

## Impact Assessment

### Affected Functionality

| Feature | Impact | Severity |
|---------|--------|----------|
| Search page pricing display | May show incorrect/no prices | HIGH |
| Proposal pricing calculations | May fail or use wrong values | CRITICAL |
| Host compensation calculations | Cannot compute payouts | CRITICAL |
| Guest-facing nightly rates | Missing or inaccurate | HIGH |

### Business Impact

- New listings cannot have accurate pricing displayed
- Hosts may see incorrect compensation estimates
- Guests may see wrong prices or no prices at all
- Booking flow may fail due to missing pricing data

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Fix pricing_list auto-generation**: Modify listing creation workflow to automatically generate pricing_list record after listing is created/activated

2. **Backfill missing pricing_lists**: Create a migration script to generate pricing_list records for all listings with `pricing_list = NULL`

### Short-term Actions (Priority 2)

3. **Fix Unit Test Page**: Remove or update the `"Host Comp Style"` column reference in `useZPricingUnitTestPageLogic.js`

4. **Add validation**: Prevent listings from being activated without a valid pricing_list

### Long-term Actions (Priority 3)

5. **Move pricing config to database**: Create `zat_config` table to allow runtime configuration of markup rates

6. **Add monitoring**: Set up alerts for listings created without pricing_list records

---

## Files to Investigate/Modify

### Listing Creation Flow
- [supabase/functions/listing/handlers/create.ts](supabase/functions/listing/handlers/create.ts)
- [supabase/functions/listing/handlers/submit.ts](supabase/functions/listing/handlers/submit.ts)
- [app/src/islands/pages/SelfListingPage/](app/src/islands/pages/SelfListingPage/)

### Pricing List Generation
- [supabase/functions/pricing-list/](supabase/functions/pricing-list/)
- [app/src/logic/calculators/pricingList/](app/src/logic/calculators/pricingList/)
- [app/src/logic/processors/pricingList/](app/src/logic/processors/pricingList/)

### Unit Test Page Fix
- [app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js](app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js) - Line 216

### Pricing Constants
- [app/src/logic/constants/pricingConstants.js](app/src/logic/constants/pricingConstants.js)

---

## Test Artifacts

### Screenshots Captured
- `weekly-listing-success.png` - Weekly listing creation success
- `weekly-listing-preview.png` - Weekly listing preview page

### Test Account Created
- Email: `host.e2e.nightly.20260129111501@splitlease.com`
- User ID: `1769706984665x70643073659308776`

---

## Conclusion

**Test Verdict**: **FAIL - CRITICAL ISSUES**

The E2E test conclusively demonstrates that:

1. **Listing creation works** - All 3 rental types can be created successfully
2. **pricing_list generation is broken** - No pricing_list records are created for any rental type
3. **This is a regression** - All 528 existing pricing_list records are legacy Bubble data from pre-September 2025
4. **Unit test page needs repair** - Schema mismatch prevents UI validation

**Immediate action required** to restore pricing_list generation in the listing creation workflow.

---

*Report generated: 2026-01-29 20:00:00 UTC*
*Test Orchestrator: Claude Code E2E Testing*
*Target Environment: splitlease-backend-dev*
