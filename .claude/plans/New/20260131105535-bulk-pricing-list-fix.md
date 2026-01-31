# Bulk Pricing List Fix Plan

**Date:** 2026-01-31
**Status:** Ready for Implementation

---

## Overview

Recalculate all pricing lists across both Supabase projects to apply the corrected host compensation formula for Weekly and Monthly rental types.

### Formula Fix Applied

**Corrected in `pricingCalculator.ts`:**
- **Weekly:** `weeklyRate / numberOfNights` (each position gets decreasing per-night rate)
- **Monthly:** `(monthlyRate / 30.4) * 7 / numberOfNights`
- **Nightly:** Direct from individual rate columns

---

## Scope Analysis

### Issue Categories

The bulk fix addresses THREE categories of pricing issues:

| Category | Description | DEV | LIVE |
|----------|-------------|-----|------|
| **A. Missing pricing_list** | Listings with no pricing_list FK | 0 | 32 |
| **B. Empty Host Compensation** | pricing_list exists but array is null/empty | 91 | 6 |
| **C. Empty Nightly Price** | pricing_list exists but array is null/empty | 96 | 11 |
| **D. Wrong formula** | Weekly/Monthly using old incorrect formula | 111 | 103 |

### Summary by Project

| Project | Environment | Total Listings | Missing pricing_list | Empty Arrays | Weekly/Monthly |
|---------|-------------|----------------|---------------------|--------------|----------------|
| `qzsmhgyojmwvtjmnrdea` | DEV | 326 | 0 | ~96 | 111 |
| `qcfifybkaddcoimjroca` | LIVE | 318 | 32 | ~11 | 103 |

**Total listings to process:** 644 (both projects)

### Why Recalculate ALL Listings

Even if a listing already has a pricing_list with populated arrays, we recalculate to:
1. Apply the CORRECTED formula for Weekly/Monthly rental types
2. Fix any pricing_list records that have null/empty arrays
3. Ensure consistency across all listings

---

## Implementation Approach

### Option A: Edge Function Batch Script (Recommended)

Create a temporary Edge Function or script that:
1. Fetches all listing IDs from a project
2. Calls the `pricing-list` Edge Function with `action: 'create'` for each listing
3. Logs success/failure for each listing
4. Runs with rate limiting (100ms delay between calls)

### Option B: Direct Database Update via SQL

Use the `mcp-tool-specialist` to run SQL that:
1. Identifies all listings needing updates
2. For each listing, calls an RPC function that triggers pricing recalculation

**Chosen Approach:** Option A (Edge Function approach maintains consistency with existing code)

---

## Implementation Steps

### Step 1: Deploy Updated Edge Function

```bash
supabase functions deploy pricing-list
```

Ensure the corrected `pricingCalculator.ts` is deployed before bulk processing.

### Step 2: Create Bulk Processing Script

Create `supabase/functions/pricing-list-bulk/index.ts`:

```typescript
/**
 * Bulk Pricing List Processor
 *
 * Recalculates pricing lists for all listings in the database.
 * Run with: POST /functions/v1/pricing-list-bulk
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { calculatePricingList } from '../pricing-list/utils/pricingCalculator.ts';

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse request body for options
    const { dry_run = false, limit = 1000, offset = 0 } = await req.json().catch(() => ({}));

    console.log(`[bulk] Starting bulk pricing list update (dry_run: ${dry_run}, limit: ${limit}, offset: ${offset})`);

    // Fetch all listings with required pricing columns
    const { data: listings, error: fetchError } = await supabase
      .from('listing')
      .select(`
        _id,
        "💰Nightly Host Rate for 1 night",
        "💰Nightly Host Rate for 2 nights",
        "💰Nightly Host Rate for 3 nights",
        "💰Nightly Host Rate for 4 nights",
        "💰Nightly Host Rate for 5 nights",
        "💰Nightly Host Rate for 6 nights",
        "💰Nightly Host Rate for 7 nights",
        "💰Weekly Host Rate",
        "💰Monthly Host Rate",
        "💰Unit Markup",
        "rental type",
        "Host User",
        pricing_list
      `)
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch listings: ${fetchError.message}`);
    }

    console.log(`[bulk] Found ${listings?.length || 0} listings to process`);

    const results = {
      total: listings?.length || 0,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each listing
    for (const listing of listings || []) {
      try {
        const pricingData = calculatePricingList({
          listing,
          unitMarkup: listing['💰Unit Markup'] || 0,
        });

        // Skip if no valid pricing data
        if (pricingData.startingNightlyPrice === null) {
          console.log(`[bulk] Skipping ${listing._id} - no valid host rates`);
          results.skipped++;
          continue;
        }

        if (dry_run) {
          console.log(`[bulk] DRY RUN: Would update ${listing._id} with starting price: ${pricingData.startingNightlyPrice}`);
          results.processed++;
          continue;
        }

        // Generate new ID if needed
        let pricingListId = listing.pricing_list;
        let isNew = false;

        if (!pricingListId) {
          const { data: newId } = await supabase.rpc('generate_bubble_id');
          pricingListId = newId;
          isNew = true;
        }

        const now = new Date().toISOString();
        const pricingListRecord = {
          _id: pricingListId,
          'Created By': listing['Host User'],
          'Host Compensation': pricingData.hostCompensation,
          'Markup and Discount Multiplier': pricingData.markupAndDiscountMultiplier,
          'Nightly Price': pricingData.nightlyPrice,
          'Unused Nights Discount': pricingData.unusedNightsDiscount,
          'Unit Markup': pricingData.unitMarkup,
          'Combined Markup': pricingData.combinedMarkup,
          'Full Time Discount': pricingData.fullTimeDiscount,
          'Starting Nightly Price': pricingData.startingNightlyPrice,
          'Modified Date': now,
          ...(isNew && { 'Created Date': now }),
        };

        // Upsert pricing_list
        const { error: upsertError } = await supabase
          .from('pricing_list')
          .upsert(pricingListRecord, { onConflict: '_id' });

        if (upsertError) {
          throw new Error(`Upsert failed: ${upsertError.message}`);
        }

        // Update listing FK if new
        if (isNew) {
          await supabase
            .from('listing')
            .update({ pricing_list: pricingListId })
            .eq('_id', listing._id);
          results.created++;
        } else {
          results.updated++;
        }

        results.processed++;
        console.log(`[bulk] ✓ ${listing._id} (${listing['rental type'] || 'null'}) -> $${pricingData.startingNightlyPrice}`);

        // Rate limiting: 50ms delay between operations
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (err) {
        const errorMsg = `${listing._id}: ${err.message}`;
        console.error(`[bulk] ✗ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[bulk] Complete:`, results);

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[bulk] Fatal error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Step 3: Deploy Bulk Function

```bash
supabase functions deploy pricing-list-bulk
```

### Step 4: Execute Bulk Fix

**DEV Project First (Test):**
```bash
# Dry run first
curl -X POST "https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/pricing-list-bulk" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'

# Actual run
curl -X POST "https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/pricing-list-bulk" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}'
```

**LIVE Project (After DEV Verification):**
```bash
# Dry run first
curl -X POST "https://qcfifybkaddcoimjroca.supabase.co/functions/v1/pricing-list-bulk" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'

# Actual run
curl -X POST "https://qcfifybkaddcoimjroca.supabase.co/functions/v1/pricing-list-bulk" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}'
```

### Step 5: Verification

After each project, verify with SQL:

```sql
-- Count listings with pricing_list
SELECT
  COUNT(*) as total,
  COUNT(pricing_list) as has_pricing,
  COUNT(*) - COUNT(pricing_list) as missing
FROM listing;

-- Verify Weekly listings have correct host compensation pattern
SELECT
  l._id,
  l."rental type",
  l."💰Weekly Host Rate",
  pl."Host Compensation",
  pl."Starting Nightly Price"
FROM listing l
JOIN pricing_list pl ON l.pricing_list = pl._id
WHERE l."rental type" = 'Weekly'
LIMIT 5;

-- Verify Monthly listings have correct pattern
SELECT
  l._id,
  l."rental type",
  l."💰Monthly Host Rate",
  pl."Host Compensation",
  pl."Starting Nightly Price"
FROM listing l
JOIN pricing_list pl ON l.pricing_list = pl._id
WHERE l."rental type" = 'Monthly'
LIMIT 5;
```

---

## Execution Order

1. ✅ Deploy updated `pricing-list` Edge Function (already has correct formula)
2. Create `pricing-list-bulk` Edge Function
3. Deploy to DEV project
4. Run dry_run on DEV
5. Run actual fix on DEV
6. Verify DEV results
7. Deploy to LIVE project
8. Run dry_run on LIVE
9. Run actual fix on LIVE
10. Verify LIVE results
11. Delete `pricing-list-bulk` function (cleanup)

---

## Rollback Plan

If issues occur:
1. Pricing lists are append-only (no data loss)
2. Old pricing_list records remain but are orphaned
3. Can restore by running the bulk fix again with corrected code

---

## Files Referenced

- [pricingCalculator.ts](supabase/functions/pricing-list/utils/pricingCalculator.ts) - Updated formula
- [create.ts](supabase/functions/pricing-list/handlers/create.ts) - Fetches Weekly/Monthly rates
- [recalculate.ts](supabase/functions/pricing-list/handlers/recalculate.ts) - Reuses create handler

---

## Expected Results

| Project | Before | After |
|---------|--------|-------|
| DEV | 326 listings (91-96 with empty arrays, 111 with old formula) | 326 listings with populated arrays + NEW formula |
| LIVE | 286 with (6-11 empty arrays), 32 missing | 318 listings with populated arrays + NEW formula |

### Post-Fix Verification Queries

```sql
-- Verify NO pricing_lists have empty Host Compensation
SELECT COUNT(*) as still_empty
FROM pricing_list
WHERE "Host Compensation" IS NULL
   OR jsonb_array_length("Host Compensation") = 0;
-- Expected: 0

-- Verify NO pricing_lists have empty Nightly Price
SELECT COUNT(*) as still_empty
FROM pricing_list
WHERE "Nightly Price" IS NULL
   OR jsonb_array_length("Nightly Price") = 0;
-- Expected: 0

-- Verify ALL listings have a pricing_list FK
SELECT COUNT(*) as missing
FROM listing
WHERE pricing_list IS NULL;
-- Expected: 0
```
