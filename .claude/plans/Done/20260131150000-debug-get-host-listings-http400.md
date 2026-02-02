# Debug Plan: get_host_listings RPC Returns HTTP 400

**Created**: 2026-01-31
**Status**: Ready for Implementation
**Priority**: High (Regression - Blocks Host Proposals Page)

---

## Problem Summary

The Host Proposals page fails to display any proposals because the `get_host_listings` RPC function returns an HTTP 400 error.

## Root Cause Analysis

### The Issue

The `get_host_listings` PostgreSQL function attempts to cast the `pricing_list` column to `jsonb`:

```sql
l.pricing_list::jsonb
```

However, the `pricing_list` column:
- **Column Type**: `text`
- **Actual Data**: Contains Bubble IDs (e.g., `1751994828436x233606607759453630`)
- **Expected by function**: Valid JSON that can be cast to `jsonb`

### Why This Causes HTTP 400

When PostgREST attempts to execute the RPC call, PostgreSQL throws:
```
ERROR: 22P02: invalid input syntax for type json
DETAIL: Token "1751994828436x233606607759453630" is invalid.
```

This database error is returned as an HTTP 400 Bad Request to the frontend.

### Evidence

1. **Database logs show the error**:
   ```
   ERROR: invalid input syntax for type json
   ```

2. **Sample data from `listing.pricing_list`**:
   | _id | pricing_list |
   |-----|--------------|
   | 1751994688546x... | 1751994828436x233606607759453630 |
   | 1732009127592x... | 1745953875784x380492659068183400 |

3. **Affected environments**: Both DEV and LIVE have the same issue

---

## Solution

### Option A: Fix the RPC Function (Recommended)

Modify the `get_host_listings` function to return `pricing_list` as `TEXT` instead of casting to `jsonb`.

**SQL Migration**:

```sql
CREATE OR REPLACE FUNCTION public.get_host_listings(host_user_id text)
RETURNS TABLE(
  id text,
  _id text,
  "Name" text,
  "Created By" text,
  "Host User" text,
  "Complete" boolean,
  "Location - Borough" text,
  "Location - City" text,
  "Location - State" text,
  "Location - Address" jsonb,
  "Features - Photos" jsonb,
  rental_type text,
  min_nightly numeric,
  rate_2_nights numeric,
  rate_3_nights numeric,
  rate_4_nights numeric,
  rate_5_nights numeric,
  rate_7_nights numeric,
  weekly_rate numeric,
  monthly_rate numeric,
  cleaning_fee numeric,
  damage_deposit numeric,
  pricing_list text,  -- Changed from jsonb to text
  source text,
  bedrooms numeric,
  bathrooms numeric,
  hood text
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    l._id::TEXT as id,
    l._id,
    l."Name",
    l."Created By",
    l."Host User",
    l."Complete",
    l."Location - Borough",
    l."Location - City",
    l."Location - State",
    l."Location - Address",
    l."Features - Photos",
    l."rental type" as rental_type,
    l."Standarized Minimum Nightly Price (Filter)"::NUMERIC as min_nightly,
    l."💰Nightly Host Rate for 2 nights"::NUMERIC as rate_2_nights,
    l."💰Nightly Host Rate for 3 nights"::NUMERIC as rate_3_nights,
    l."💰Nightly Host Rate for 4 nights"::NUMERIC as rate_4_nights,
    l."💰Nightly Host Rate for 5 nights"::NUMERIC as rate_5_nights,
    l."💰Nightly Host Rate for 7 nights"::NUMERIC as rate_7_nights,
    l."💰Weekly Host Rate"::NUMERIC as weekly_rate,
    l."💰Monthly Host Rate"::NUMERIC as monthly_rate,
    l."💰Cleaning Cost / Maintenance Fee"::NUMERIC as cleaning_fee,
    l."💰Damage Deposit"::NUMERIC as damage_deposit,
    l.pricing_list,  -- No cast, return as text
    'listing'::TEXT as source,
    l."Features - Qty Bedrooms"::NUMERIC as bedrooms,
    l."Features - Qty Bathrooms"::NUMERIC as bathrooms,
    l."Location - Hood" as hood
  FROM listing l
  WHERE (l."Host User" = host_user_id OR l."Created By" = host_user_id)
    AND l."Deleted" = false;
END;
$function$;
```

### Option B: Remove pricing_list from Function

If `pricing_list` is not needed by the Host Proposals page, remove it entirely from the function return.

---

## Implementation Steps

1. **Apply migration to DEV database** (`qzsmhgyojmwvtjmnrdea`)
2. **Test the fix** by calling the RPC function
3. **Verify Host Proposals page loads** correctly
4. **Apply migration to LIVE database** (`qcfifybkaddcoimjroca`)
5. **Verify LIVE environment**

---

## Verification

After applying the fix, test with:

```sql
-- Test the function
SELECT * FROM get_host_listings('any_valid_user_id') LIMIT 1;
```

Expected: Returns listing data without error

---

## Files Involved

| File | Purpose |
|------|---------|
| `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | Frontend logic making the RPC call (lines 469-470) |
| Supabase RPC: `get_host_listings` | Database function that needs fixing |

---

## Risk Assessment

- **Low Risk**: The fix only changes the return type of one column
- **No Breaking Changes**: Frontend likely doesn't use `pricing_list` from this RPC
- **Rollback**: Can revert the function if issues arise

---

## Notes

- The `pricing_list` column appears to store a Bubble ID reference to a separate pricing object, not actual JSON pricing data
- This is a regression caused by the function definition not matching the actual column data type
- Both DEV and LIVE environments are affected and need the same fix
