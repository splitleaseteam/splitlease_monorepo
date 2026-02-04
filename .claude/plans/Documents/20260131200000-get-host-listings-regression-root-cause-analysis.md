# Root Cause Analysis: get_host_listings RPC Regression Pattern

**Created**: 2026-01-31
**Analysis Type**: Regression Investigation
**Priority**: Critical (Recurring Issue)

---

## Executive Summary

The `get_host_listings` RPC function has broken 3 times this week with the same HTTP 400 error caused by `pricing_list` jsonb cast failing on Bubble ID text values. This investigation reveals a **root cause pattern** that explains why the same bug keeps reoccurring.

---

## Timeline of Incidents

| Date | Commit | Action | Result |
|------|--------|--------|--------|
| 2026-01-30 | `c730b2dc2` | Created `get_host_listings` function | Used `RETURNS SETOF listing` which inherits column types from table |
| 2026-01-31 | `08dc5749d` | Debug analysis | Identified `pricing_list::jsonb` cast issue |
| 2026-01-31 | `929e5acce` | Fix applied | Changed to `RETURNS TABLE` with explicit `pricing_list text` |
| 2026-01-31 | MCP applied | `20260131184519_fix_get_host_listings_pricing_list_type` | FIX IS CURRENTLY LIVE IN DEV DB |

---

## Root Cause Identified: Migration File vs MCP Application Mismatch

### The Core Problem

**Two different function definitions exist:**

1. **Local Migration File** (`20260130200000_create_get_host_listings_function.sql`):
   ```sql
   CREATE OR REPLACE FUNCTION get_host_listings(host_user_id TEXT)
   RETURNS SETOF listing  -- <-- PROBLEM: Inherits all column types from listing table
   ```

2. **Database (Applied via MCP)** (`20260131184519_fix_get_host_listings_pricing_list_type`):
   ```sql
   CREATE OR REPLACE FUNCTION public.get_host_listings(host_user_id text)
   RETURNS TABLE(
     ...
     pricing_list text,  -- <-- CORRECT: Explicitly typed as text
     ...
   )
   ```

### Why The Regression Keeps Happening

The fix was applied **directly to the database via MCP** but:

1. The **local migration file was never updated** with the corrected function definition
2. The **fix migration file doesn't exist in the git repo** (only in the database's `supabase_migrations.schema_migrations` table)
3. Any of these actions will **recreate the broken function**:
   - Running `supabase db reset` locally
   - Re-applying migrations to a new branch
   - CI/CD pipeline re-running migrations
   - Another developer pulling and running migrations
   - Creating a new Supabase branch (which starts fresh and applies migrations)

---

## Evidence

### 1. Local Migration File (BROKEN VERSION)
**Path**: `supabase/migrations/20260130200000_create_get_host_listings_function.sql`
```sql
CREATE OR REPLACE FUNCTION get_host_listings(host_user_id TEXT)
RETURNS SETOF listing  -- Inherits pricing_list as the original column type
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listing
  WHERE ...
END;
$$;
```

### 2. Database Migration Table (FIXED VERSION - NOT IN REPO)
**Migration**: `20260131184519_fix_get_host_listings_pricing_list_type`
- Exists in database's `supabase_migrations.schema_migrations`
- Does NOT exist as a file in `supabase/migrations/`

### 3. Current Database State (CORRECT)
The function currently in DEV database uses `RETURNS TABLE` with `pricing_list text` - the fix is applied.

---

## The Regression Pattern

```
┌────────────────────────────────────────────────────────────────────┐
│                    REGRESSION CYCLE                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Bug reported → pricing_list::jsonb fails                       │
│              ↓                                                     │
│  2. Fix applied via MCP (database only)                            │
│              ↓                                                     │
│  3. Bug is fixed (temporarily)                                     │
│              ↓                                                     │
│  4. Some action re-runs migrations:                                │
│     - supabase db reset                                            │
│     - New branch creation                                          │
│     - CI/CD pipeline                                               │
│     - Developer onboarding                                         │
│              ↓                                                     │
│  5. Old migration file recreates BROKEN function                   │
│              ↓                                                     │
│  6. Bug returns → GOTO 1                                           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Why `RETURNS SETOF listing` is Problematic

When a function uses `RETURNS SETOF listing`:
- PostgreSQL returns **all columns** with their **original table column types**
- The `pricing_list` column in the `listing` table might be `text` but the cast happens during type coercion
- When the function body uses `SELECT *`, any jsonb fields get cast implicitly

When `RETURNS TABLE(...)` is used:
- **Explicit column types** are defined in the function signature
- PostgreSQL will cast columns to match the declared types
- Setting `pricing_list text` ensures no jsonb coercion occurs

---

## Recommended Fix

### Option A: Update the Original Migration File (RECOMMENDED)

**Replace the contents of** `supabase/migrations/20260130200000_create_get_host_listings_function.sql`:

```sql
-- ============================================================================
-- Migration: Create get_host_listings RPC Function
-- Generated: 2026-01-30
-- Updated: 2026-01-31 - Changed from RETURNS SETOF to RETURNS TABLE
--                       to explicitly type pricing_list as text
-- Purpose: Provide an RPC function to fetch listings for a host user
-- Issue: pricing_list contains Bubble IDs (text), not JSON data
-- ============================================================================

-- Drop existing function if it exists (to support re-running migration)
DROP FUNCTION IF EXISTS get_host_listings(TEXT);

-- ============================================================================
-- FUNCTION: get_host_listings
-- Returns all listings where the user is either the Host User or Created By
-- Uses RETURNS TABLE to explicitly control column types
-- ============================================================================

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
  pricing_list text,  -- CRITICAL: Must be text, not jsonb (contains Bubble IDs)
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
    l.pricing_list,  -- Returns as text, no cast needed
    'listing'::TEXT as source,
    l."Features - Qty Bedrooms"::NUMERIC as bedrooms,
    l."Features - Qty Bathrooms"::NUMERIC as bathrooms,
    l."Location - Hood" as hood
  FROM listing l
  WHERE (l."Host User" = host_user_id OR l."Created By" = host_user_id)
    AND l."Deleted" = false;
END;
$function$;

-- Add helpful comment for documentation
COMMENT ON FUNCTION get_host_listings IS
'Returns all listings for a host user. Finds listings where "Host User" = host_user_id OR "Created By" = host_user_id. Excludes deleted listings. Uses RETURNS TABLE with explicit types to prevent pricing_list jsonb cast errors.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO service_role;
```

### Option B: Create a Permanent Fix Migration File

Create `supabase/migrations/20260131184519_fix_get_host_listings_pricing_list_type.sql` in the git repo to match what's in the database.

---

## Process Improvement Recommendations

### 1. Never Apply MCP-Only Fixes
When fixing database functions via MCP:
1. **Always** create/update the corresponding migration file in the repo
2. **Commit** the migration file change
3. This ensures the fix persists across all environments

### 2. Migration File Audit
For any function that uses `RETURNS SETOF <table>`:
- Review if any columns contain non-JSON text that might be cast
- Consider switching to `RETURNS TABLE(...)` with explicit types

### 3. Add CI Check
Consider adding a check that:
- Compares function definitions in database vs migration files
- Alerts when they drift apart

---

## Files Involved

| File | Status | Action Needed |
|------|--------|---------------|
| `supabase/migrations/20260130200000_create_get_host_listings_function.sql` | OUTDATED | Update with RETURNS TABLE version |
| `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js` | OK | Consumes the RPC |
| `supabase/functions/lease/handlers/getHostLeases.ts` | OK | Consumes the RPC |

---

## Verification Steps

After updating the migration file:

1. Run `supabase db reset` locally
2. Verify the function works:
   ```sql
   SELECT * FROM get_host_listings('any_valid_user_id') LIMIT 1;
   ```
3. Test the Host Proposals page loads correctly
4. Commit the migration file update

---

## Conclusion

The root cause is a **migration file/database drift** where the fix was applied directly to the database but the local migration file still contains the broken version. This will continue to regress until the migration file in the git repository is updated with the corrected function definition.

**Immediate action**: Update `20260130200000_create_get_host_listings_function.sql` with the `RETURNS TABLE` version that explicitly types `pricing_list` as `text`.
