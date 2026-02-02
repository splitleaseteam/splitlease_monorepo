# Bulk Pricing List Fix - Execution Prompt

**Token Budget:** 15,000,000 tokens
**Expected Runtime:** 2-4 hours
**Created:** 2026-01-29

---

## COPY THIS ENTIRE PROMPT TO START THE ORCHESTRATED FIX

---

```
You are executing a BULK PRICING LIST FIX operation. This is a critical database operation that will generate pricing_list records for ~81 listings that are missing them.

## CRITICAL RULES

1. **DO NOT STOP** until all listings are processed or you hit token/time limits
2. **TRACK PROGRESS** - Output status every 10 listings
3. **LOG ALL ERRORS** - Never silently skip failures
4. **USE MCP TOOLS** via mcp-tool-specialist subagent for ALL database operations
5. **VALIDATE RESULTS** after processing completes
6. **HARD STOP** after 2 hours maximum runtime - save progress and generate partial report

## TOKEN BUDGET: 15,000,000
## MAX RUNTIME: 2 HOURS

Pace yourself. This is a long operation.

---

## PHASE 1: DISCOVERY (10% of budget)

### Step 1.1: Get All Listings Needing Fix

Using mcp-tool-specialist with Supabase MCP, execute:

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
ORDER BY "rental type" NULLS LAST, _id;
```

### Step 1.2: Categorize Results

For each listing returned, classify as:

- **PROCESSABLE**: Has `rental type` AND at least one host rate value > 0
- **INCOMPLETE**: Has `rental type` but ALL host rates are NULL or 0
- **INVALID**: `rental type` is NULL

Create three lists:
1. `processable_listings` - Array of listing IDs to process
2. `incomplete_listings` - Array of {id, reason} for manual review
3. `invalid_listings` - Array of {id, reason} for manual review

Output the counts:
```
DISCOVERY COMPLETE:
- Processable: X listings
- Incomplete: Y listings (missing rate data)
- Invalid: Z listings (no rental type)
- Total: X+Y+Z listings
```

---

## PHASE 2: BATCH PROCESSING (70% of budget)

### Processing Rules

- **Batch Size:** 10 listings
- **Delay Between Batches:** 2 seconds (use setTimeout or pause)
- **Max Retries Per Listing:** 3 with exponential backoff

### Step 2.1: Process Each Batch

For each listing in `processable_listings`, call the Edge Function:

```bash
curl -X POST "https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/pricing-list" \
  -H "Content-Type: application/json" \
  -d '{"action": "create", "payload": {"listing_id": "<LISTING_ID>"}}'
```

### Step 2.2: Handle Response

**On Success (HTTP 200 with success:true):**
```json
{
  "success": true,
  "data": {
    "pricing_list_id": "...",
    "listing_id": "...",
    "starting_nightly_price": 75.92
  }
}
```
- Add to `successful_listings` array
- Log: "✅ [X/TOTAL] Created pricing_list for <LISTING_ID>: $<PRICE>"

**On Error:**
- HTTP 404: Log "❌ Listing not found (may be deleted): <ID>" - Add to skipped
- HTTP 400: Log "❌ Invalid data for <ID>: <ERROR>" - Add to failed
- HTTP 500: Retry up to 3 times, then add to failed
- Timeout: Retry once, then add to failed

### Step 2.3: Progress Updates

After every 10 listings (1 batch), output:
```
PROGRESS: [BATCH X/Y]
- Processed: A/B listings
- Successful: C
- Failed: D
- Skipped: E
- ETA: ~Z minutes remaining
```

### Step 2.4: Retry Failed Listings

After all batches complete, retry any failed listings (max 3 attempts each):
```
RETRY PHASE: Attempting X failed listings...
```

---

## PHASE 3: VALIDATION (15% of budget)

### Step 3.1: Count Check

Using mcp-tool-specialist, execute:

```sql
SELECT
  COUNT(*) as total_with_pricing_list,
  COUNT(CASE WHEN p."Created Date" > '2026-01-29' THEN 1 END) as created_today
FROM listing l
JOIN pricing_list p ON l.pricing_list = p._id
WHERE l."Deleted" = false;
```

### Step 3.2: Validate Sample

For the first 10 successfully processed listings, verify:

```sql
SELECT
  l._id as listing_id,
  l."Name",
  l.pricing_list,
  p."Starting Nightly Price",
  p."Nightly Price",
  p."Host Compensation",
  CASE
    WHEN p."Nightly Price" IS NOT NULL
     AND jsonb_array_length(p."Nightly Price") = 7
    THEN 'VALID'
    ELSE 'INVALID'
  END as array_status
FROM listing l
JOIN pricing_list p ON l.pricing_list = p._id
WHERE l._id IN (<FIRST_10_PROCESSED_IDS>);
```

### Step 3.3: Output Validation Summary

```
VALIDATION RESULTS:
- Listings now with pricing_list: X (was Y before)
- Coverage: Z% (was W% before)
- Array validation: A/10 samples valid
- All pricing values > 0: Yes/No
```

---

## PHASE 4: REPORTING (5% of budget)

### Step 4.1: Generate Final Report

Create a file at `.claude/plans/Documents/20260130HHMMSS-bulk-pricing-list-fix-report.md` with:

```markdown
# Bulk Pricing List Fix - Execution Report

**Executed:** [TIMESTAMP]
**Duration:** [X minutes]
**Token Usage:** ~[Y tokens]

## Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Listings with pricing_list | 241 | [NEW] | +[DIFF] |
| Total pricing_list records | 532 | [NEW] | +[DIFF] |
| Coverage | 74.8% | [NEW]% | +[DIFF]% |

## Processing Results

| Status | Count | Percentage |
|--------|-------|------------|
| Successful | [X] | [Y]% |
| Failed | [X] | [Y]% |
| Skipped | [X] | [Y]% |
| **Total Attempted** | [TOTAL] | 100% |

## Failed Listings (Require Manual Review)

| Listing ID | Name | Error |
|------------|------|-------|
| ... | ... | ... |

## Incomplete Listings (Missing Rate Data)

| Listing ID | Name | Missing Fields |
|------------|------|----------------|
| ... | ... | ... |

## Invalid Listings (No Rental Type)

| Listing ID | Name | Suggested Action |
|------------|------|------------------|
| ... | ... | Set rental type manually |

## Validation Results

- Sample validation: [X]/10 passed
- All arrays have 7 elements: [Yes/No]
- All starting prices > 0: [Yes/No]

## Recommendations

1. [Any issues found]
2. [Next steps]
```

### Step 4.2: Send Slack Notification

```bash
python "c:/Users/Split Lease/My Drive/!Agent Context and Tools/SL3/Split Lease/.claude/skills/slack-webhook/scripts/send_slack.py" \
  "[BULK FIX] Pricing list fix complete: X/Y listings processed. Coverage: A% → B%. Z items need manual review." \
  --type success
```

---

## ERROR RECOVERY

If you encounter a catastrophic error:

1. **DO NOT PANIC** - The operation is idempotent (safe to re-run)
2. Log the current state (which listings were processed)
3. Output what was accomplished before the error
4. Provide instructions for resuming

Resume command:
```
Continue the bulk pricing list fix. Already processed: [LIST OF IDS]
Skip these and continue with the remaining listings.
```

---

## COMPLETION CHECKLIST

Before declaring DONE, verify:

- [ ] All processable listings have been attempted
- [ ] Failed listings have been retried
- [ ] Validation queries show increased coverage
- [ ] Final report has been generated
- [ ] Slack notification sent (if webhook available)

---

## OUTPUT FORMAT

At the very end, output this summary:

```
═══════════════════════════════════════════════════
BULK PRICING LIST FIX - COMPLETE
═══════════════════════════════════════════════════

Started:    [TIMESTAMP]
Completed:  [TIMESTAMP]
Duration:   [X hours Y minutes]

RESULTS:
✅ Successful:    X listings
❌ Failed:        Y listings
⏭️ Skipped:       Z listings
📊 New Coverage:  A% (was B%)

Report saved to: .claude/plans/Documents/[FILENAME].md

Items needing manual review: [COUNT]
═══════════════════════════════════════════════════
```

---

BEGIN EXECUTION NOW. Start with Phase 1: Discovery.
```

---

## HOW TO RUN THIS PROMPT

1. Open a new Claude Code session
2. Copy the entire prompt above (from the triple backticks to the end)
3. Paste and send
4. Monitor progress every 30 minutes
5. Check the final report when complete

---

## EXPECTED OUTCOME

| Metric | Before | Expected After |
|--------|--------|----------------|
| Listings with pricing_list | 241 | ~312 |
| Coverage | 74.8% | ~97% |
| Processing success rate | - | ~87% |
| Items for manual review | - | ~10 |
