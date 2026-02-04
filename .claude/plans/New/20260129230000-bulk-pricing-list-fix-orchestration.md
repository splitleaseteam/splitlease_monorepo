# Bulk Pricing List Fix - Orchestrated Execution Plan

**Created:** 2026-01-29 23:00:00
**Priority:** HIGH
**Estimated Token Budget:** 15,000,000 tokens
**Estimated Runtime:** 2-4 hours

---

## Executive Summary

This plan addresses the critical issue where **81 active listings (25.2% of 322 total)** are missing `pricing_list` records. The bulk fix will:

1. Generate `pricing_list` records for all listings missing them
2. Link each listing to its new `pricing_list` via the FK
3. Validate all generated data
4. Generate a comprehensive report

---

## Current Database State

| Metric | Value |
|--------|-------|
| Total Active Listings | 322 |
| Listings WITH pricing_list | 241 (74.8%) |
| Listings WITHOUT pricing_list | 81 (25.2%) |
| Total pricing_list records | 532 |

### Breakdown of 81 Listings Missing pricing_list

| Rental Type | Count | Has Rate Data | Can Process |
|-------------|-------|---------------|-------------|
| Nightly | 40 | 38 (95%) | Yes |
| NULL/Unspecified | 27 | ~20 (74%) | Conditional |
| Monthly | 7 | 7 (100%) | Yes |
| Weekly | 7 | 6 (86%) | Yes |
| **Total** | **81** | **~71** | **~71** |

**Note:** ~10 listings may lack sufficient rate data and will be flagged for manual review.

---

## Pre-Execution Checklist

Before running the bulk fix, verify:

- [ ] Edge Function `pricing-list` is deployed and working (verified 2026-01-29)
- [ ] `generate_bubble_id` RPC function exists and returns valid IDs
- [ ] Database has adequate connection pool capacity for batch operations
- [ ] No active deployments or maintenance windows scheduled
- [ ] Backup or snapshot of `listing` and `pricing_list` tables (optional but recommended)

---

## Phase 1: Discovery & Validation (Token Budget: 500,000)

### Step 1.1: Fetch All Listings Needing Fix

```sql
SELECT
  _id,
  "Name",
  "rental type",
  "Host User",
  "💰Nightly Host Rate for 1 night",
  "💰Nightly Host Rate for 2 nights",
  "💰Nightly Host Rate for 3 nights",
  "💰Nightly Host Rate for 4 nights",
  "💰Nightly Host Rate for 5 nights",
  "💰Nightly Host Rate for 6 nights",
  "💰Nightly Host Rate for 7 nights",
  "💰Weekly Host Rate",
  "💰Monthly Host Rate",
  "💰Unit Markup"
FROM listing
WHERE "Deleted" = false
  AND pricing_list IS NULL
ORDER BY "rental type" NULLS LAST, "Modified Date" DESC;
```

### Step 1.2: Categorize Listings

Classify each listing into one of three categories:

1. **PROCESSABLE** - Has rental type AND at least one host rate
2. **INCOMPLETE** - Has rental type but missing ALL host rates
3. **INVALID** - Missing rental type entirely

### Step 1.3: Generate Processing Manifest

Create a JSON manifest with all listings to process:

```json
{
  "generated_at": "2026-01-29T23:00:00Z",
  "total_listings": 81,
  "processable": [
    { "listing_id": "...", "rental_type": "Nightly", "has_rates": true },
    ...
  ],
  "incomplete": [
    { "listing_id": "...", "reason": "No host rates found" },
    ...
  ],
  "invalid": [
    { "listing_id": "...", "reason": "No rental type" },
    ...
  ]
}
```

---

## Phase 2: Batch Processing (Token Budget: 12,000,000)

### Strategy: Sequential Batch Processing with Error Recovery

Process listings in batches of **10** with a **2-second delay** between batches to avoid overwhelming the Edge Function and database.

### Step 2.1: Process Each Listing

For each PROCESSABLE listing:

```bash
curl -X POST "https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/pricing-list" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "listing_id": "<LISTING_ID>",
      "user_id": "<HOST_USER_ID>"
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "pricing_list_id": "1769725614657x85571517706797296",
    "listing_id": "<LISTING_ID>",
    "starting_nightly_price": 75.92,
    "message": "Pricing list created successfully"
  }
}
```

### Step 2.2: Error Handling Strategy

| Error Type | Action |
|------------|--------|
| 404 - Listing not found | Log and skip (likely deleted) |
| 400 - Missing host rates | Add to INCOMPLETE list |
| 500 - Server error | Retry up to 3 times with exponential backoff |
| Timeout | Retry once, then add to RETRY_LATER list |
| Already has pricing_list | Skip (race condition resolved) |

### Step 2.3: Progress Tracking

Maintain a live progress tracker:

```json
{
  "started_at": "2026-01-29T23:05:00Z",
  "current_batch": 5,
  "total_batches": 9,
  "processed": 45,
  "successful": 43,
  "failed": 2,
  "skipped": 0,
  "estimated_completion": "2026-01-29T23:25:00Z"
}
```

---

## Phase 3: Validation (Token Budget: 1,500,000)

### Step 3.1: Verify FK Linkage

```sql
SELECT
  l._id as listing_id,
  l."Name" as listing_name,
  l.pricing_list as pricing_list_fk,
  p._id as pricing_list_id,
  p."Starting Nightly Price",
  CASE
    WHEN l.pricing_list = p._id THEN 'LINKED'
    WHEN l.pricing_list IS NULL THEN 'MISSING_FK'
    ELSE 'ORPHANED'
  END as status
FROM listing l
LEFT JOIN pricing_list p ON l.pricing_list = p._id
WHERE l."Deleted" = false
  AND l._id IN (<PROCESSED_LISTING_IDS>);
```

### Step 3.2: Validate Pricing Arrays

For each newly created pricing_list, verify:

- [ ] `Nightly Price` array has 7 elements (indices 0-6)
- [ ] `Host Compensation` array has 7 elements
- [ ] `Unused Nights Discount` array has 7 elements
- [ ] `Markup and Discount Multiplier` array has 7 elements
- [ ] `Starting Nightly Price` is > 0
- [ ] `Combined Markup` equals Site Markup (0.17) + Unit Markup

### Step 3.3: Cross-Check Calculations

For a sample of 10 listings, manually verify:

```javascript
// Expected calculation
const expectedStartingPrice = hostCompensation[6] * (1 + siteMarkup + unitMarkup - fullTimeDiscount);
const tolerance = 0.01;
const isValid = Math.abs(pricingList.startingNightlyPrice - expectedStartingPrice) < tolerance;
```

---

## Phase 4: Reporting (Token Budget: 500,000)

### Step 4.1: Generate Summary Report

```markdown
# Bulk Pricing List Fix - Execution Report

## Execution Summary
- **Started:** 2026-01-29 23:05:00
- **Completed:** 2026-01-29 23:45:00
- **Duration:** 40 minutes
- **Token Usage:** ~8,500,000

## Results

| Category | Count | Percentage |
|----------|-------|------------|
| Successfully Processed | 71 | 87.7% |
| Skipped (No Rate Data) | 8 | 9.9% |
| Failed (Errors) | 2 | 2.5% |
| **Total** | **81** | **100%** |

## Post-Fix Database State

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Listings with pricing_list | 241 | 312 | +71 |
| Coverage | 74.8% | 96.9% | +22.1% |

## Items Requiring Manual Attention

1. Listing `1234...` - No rental type set
2. Listing `5678...` - Missing all host rates
...
```

### Step 4.2: Generate Slack Notification

```bash
python send_slack.py "Bulk pricing_list fix complete: 71/81 listings processed. Coverage: 74.8% → 96.9%. 10 listings need manual review." --type success
```

---

## Phase 5: Cleanup & Manual Review (Token Budget: 500,000)

### Step 5.1: Handle INCOMPLETE Listings

For listings missing rate data, generate a report:

```markdown
## Listings Missing Rate Data

| Listing ID | Name | Rental Type | Missing Fields |
|------------|------|-------------|----------------|
| 1234... | NYC Studio | Nightly | All nightly rates |
| 5678... | Brooklyn 1BR | Weekly | Weekly host rate |
```

**Recommended Action:** Contact hosts to complete pricing setup.

### Step 5.2: Handle INVALID Listings

For listings with NULL rental type:

```sql
-- Identify potential rental type based on available rates
SELECT
  _id,
  "Name",
  CASE
    WHEN "💰Nightly Host Rate for 2 nights" IS NOT NULL THEN 'Likely Nightly'
    WHEN "💰Weekly Host Rate" IS NOT NULL THEN 'Likely Weekly'
    WHEN "💰Monthly Host Rate" IS NOT NULL THEN 'Likely Monthly'
    ELSE 'Cannot determine'
  END as suggested_rental_type
FROM listing
WHERE "Deleted" = false
  AND "rental type" IS NULL
  AND pricing_list IS NULL;
```

---

## Execution Script

### Full Orchestration Prompt (15M Token Budget)

```
## ORCHESTRATED BULK PRICING LIST FIX

You are executing a bulk fix operation to generate pricing_list records for all listings that are missing them. Follow this plan EXACTLY and do not deviate.

### CONSTRAINTS
- Token Budget: 15,000,000 tokens
- Max Runtime: 4 hours
- Batch Size: 10 listings per batch
- Delay Between Batches: 2 seconds
- Max Retries Per Listing: 3

### PHASE 1: DISCOVERY

Using the Supabase MCP, execute this query to get all listings needing pricing_list:

```sql
SELECT
  _id,
  "Name",
  "rental type",
  "Host User",
  "💰Nightly Host Rate for 1 night",
  "💰Nightly Host Rate for 2 nights",
  "💰Nightly Host Rate for 3 nights",
  "💰Nightly Host Rate for 4 nights",
  "💰Nightly Host Rate for 5 nights",
  "💰Nightly Host Rate for 6 nights",
  "💰Nightly Host Rate for 7 nights",
  "💰Weekly Host Rate",
  "💰Monthly Host Rate",
  "💰Unit Markup"
FROM listing
WHERE "Deleted" = false
  AND pricing_list IS NULL
ORDER BY "rental type" NULLS LAST;
```

Store the results and categorize each listing:
- PROCESSABLE: Has rental_type AND at least one host rate
- INCOMPLETE: Has rental_type but NO host rates
- INVALID: Missing rental_type

### PHASE 2: BATCH PROCESSING

For each PROCESSABLE listing, call the pricing-list Edge Function:

```bash
curl -X POST "https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/pricing-list" \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "payload": {"listing_id": "<ID>"}}'
```

Track results in this format:
- SUCCESS: pricing_list created, FK updated
- FAILED: Error message and listing ID
- SKIPPED: Reason (no rates, deleted, etc.)

Process in batches of 10 with 2-second delays.

### PHASE 3: VALIDATION

After all batches complete, verify the fix worked:

```sql
SELECT COUNT(*) as fixed_count
FROM listing
WHERE "Deleted" = false
  AND pricing_list IS NOT NULL
  AND pricing_list IN (
    SELECT _id FROM pricing_list
    WHERE "Created Date" > '2026-01-29'
  );
```

For each processed listing, verify the pricing_list has:
- Non-null Nightly Price array
- Non-null Host Compensation array
- Starting Nightly Price > 0

### PHASE 4: REPORTING

Generate a final report with:
1. Total listings processed
2. Success/failure counts
3. Pre/post coverage percentages
4. List of items needing manual review
5. Any errors encountered

Save the report to: .claude/plans/Documents/20260130-bulk-pricing-list-fix-report.md

### PHASE 5: NOTIFICATION

Send a Slack notification with the summary.

### ERROR HANDLING

If you encounter errors:
1. Log the listing ID and error message
2. Continue to next listing (don't stop the batch)
3. Retry failed listings at the end (up to 3 times)
4. Add permanently failed listings to the manual review list

### PROGRESS UPDATES

Every 20 listings, output a progress update:
"Progress: X/81 listings processed (Y successful, Z failed)"

### COMPLETION CRITERIA

The task is COMPLETE when:
1. All 81 listings have been attempted
2. Validation queries confirm the fix
3. Final report is generated
4. Slack notification is sent

DO NOT STOP EARLY. Process ALL listings even if some fail.
```

---

## Rollback Plan (If Needed)

In case of catastrophic failure:

### Step 1: Identify Affected Records

```sql
-- Find pricing_list records created during the bulk fix
SELECT _id
FROM pricing_list
WHERE "Created Date" > '2026-01-29T23:00:00Z';
```

### Step 2: Unlink Listings

```sql
-- Remove FK references to newly created pricing_lists
UPDATE listing
SET pricing_list = NULL
WHERE pricing_list IN (
  SELECT _id FROM pricing_list
  WHERE "Created Date" > '2026-01-29T23:00:00Z'
);
```

### Step 3: Delete Orphaned Records (Optional)

```sql
-- Delete newly created pricing_list records
DELETE FROM pricing_list
WHERE "Created Date" > '2026-01-29T23:00:00Z';
```

---

## Files Referenced

| File | Purpose |
|------|---------|
| `supabase/functions/pricing-list/handlers/create.ts` | Edge Function that creates pricing_list |
| `supabase/functions/pricing-list/utils/pricingCalculator.ts` | Pricing calculation logic |
| `app/src/lib/listingService.js` | Frontend listing service (for context) |
| `app/src/islands/pages/ZPricingUnitTestPage/` | Unit test page for validation |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Listings with pricing_list | ≥ 310 (96%+) |
| Processing success rate | ≥ 85% |
| Validation pass rate | 100% |
| Zero data corruption | Required |

---

## Execution Schedule

**Recommended:** Run overnight (low traffic period)

- **Start Time:** 2026-01-30 02:00:00 UTC
- **Expected Duration:** 2-4 hours
- **Monitoring:** Check progress every 30 minutes

---

## Post-Execution Tasks

1. [ ] Verify Unit Test Page displays pricing data correctly
2. [ ] Spot-check 5 random listings on frontend
3. [ ] Monitor Edge Function logs for errors
4. [ ] Update documentation if any issues found
5. [ ] Close this plan as DONE

---

**Plan Status:** READY FOR EXECUTION
