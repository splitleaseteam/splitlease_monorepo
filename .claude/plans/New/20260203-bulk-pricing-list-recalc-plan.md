# Bulk Pricing-List Recalculation Plan (Dev + Prod)

**Scheduled Execution**: 2026-02-03 @ 18:00 EST (23:00 UTC)
**Status**: SCHEDULED

---

## Schedule Reminder

| Time (EST) | Action |
|------------|--------|
| 17:45 | Pre-flight checks (env vars, Edge Function health) |
| 18:00 | Execute DEV backup + recalc |
| ~18:30 | DEV verification (gate for PROD) |
| ~18:35 | Execute PROD backup + recalc |
| ~19:00 | PROD verification + final report |

**Slack notification required after completion.**

---

## Script Refactoring Analysis

### Current State: [pricing-list-bulk-recalc.mjs](scripts/pricing-list-bulk-recalc.mjs)

| Aspect | Current | Assessment |
|--------|---------|------------|
| Lines of code | 124 | Acceptable |
| Dependencies | 2 (fs, path) | Minimal, good |
| Error handling | Retry with backoff | Solid |
| Logging | File + console | Good |
| Configuration | Env vars | Standard |

### Refactoring Recommendations

#### 1. **Add Statistics Tracking** (Priority: HIGH)
The script logs OK/FAIL but doesn't summarize. Add counters:

```javascript
const stats = { total: 0, success: 0, failed: 0, retried: 0 };

// In callPricingList success path:
stats.success++;

// In callPricingList final failure:
stats.failed++;

// At end of run():
log(`SUMMARY total=${stats.total} success=${stats.success} failed=${stats.failed} retried=${stats.retried}`);
```

#### 2. **Collect Failed IDs** (Priority: HIGH)
For post-mortem analysis, track which listings failed:

```javascript
const failedIds = [];

// In callPricingList final failure:
failedIds.push(listingId);

// At end:
if (failedIds.length > 0) {
  fs.writeFileSync(`${LOG_FILE}.failed.json`, JSON.stringify(failedIds, null, 2));
}
```

#### 3. **Add Dry-Run Mode** (Priority: MEDIUM)
For pre-flight validation without mutations:

```javascript
const DRY_RUN = process.env.DRY_RUN === 'true';

// In callPricingList:
if (DRY_RUN) {
  log(`DRY_RUN ${listingId}`);
  return;
}
```

#### 4. **Add Progress Indicator** (Priority: MEDIUM)
For long-running jobs, show progress percentage:

```javascript
// In worker loop:
const progress = ((index / ids.length) * 100).toFixed(1);
log(`[${progress}%] OK ${listingId}`);
```

#### 5. **Race Condition in Worker Index** (Priority: LOW)
Current pattern `ids[index++]` is not atomic. For this use case (single-threaded JS), it's safe, but could be cleaner:

```javascript
// Alternative: queue-based
const queue = [...ids];
const workers = Array.from({ length: Number(CONCURRENCY) }).map(async () => {
  while (queue.length > 0) {
    const listingId = queue.shift();
    // ...
  }
});
```

#### 6. **Add JSON Report Output** (Priority: MEDIUM)
For LLM consumption, emit structured report:

```javascript
const report = {
  project: SUPABASE_URL,
  execution_time: new Date().toISOString(),
  duration_seconds: Math.round((Date.now() - startTime) / 1000),
  total: stats.total,
  success: stats.success,
  failed: stats.failed,
  failed_ids: failedIds
};

fs.writeFileSync(`${LOG_FILE}.report.json`, JSON.stringify(report, null, 2));
```

### Deferred (Not Recommended Now)

| Suggestion | Why Defer |
|------------|-----------|
| TypeScript conversion | Working script, low ROI for one-time job |
| CLI argument parsing (yargs) | Env vars sufficient for this use case |
| Unit tests | One-time script, manual verification adequate |

---

## Goal
Recalculate pricing lists for **all listings** in:
- **DEV**: `qzsmhgyojmwvtjmnrdea`
- **PROD**: `qcfifybkaddcoimjroca`

Use the existing **pricing-list Edge Function** to regenerate pricing_list arrays and scalars consistently.

## Required Context Files
- `.claude/plans/Done/20260131105535-bulk-pricing-list-fix.md`
- `.claude/plans/New/20260202143500-pricing-list-discrepancy-analysis.md`
- `.claude/Documentation/Backend(EDGE - Functions)/QUICK_REFERENCE.md`

## Preconditions
- Confirm `pricing-list` Edge Function is deployed in both projects.
- Collect Service Role keys for **DEV** and **PROD** (store in local `.env` only).
- Use `mcp-tool-specialist` for all Supabase MCP operations.

## Overview of Execution
1. Snapshot current data (rollback safety).
2. Export listing IDs.
3. Run bulk recalculation in **DEV** with logging + rate limits.
4. Verify in **DEV**.
5. Run bulk recalculation in **PROD** with logging + rate limits.
6. Verify in **PROD**.
7. Cleanup and archive logs.

---

## Step 1: Snapshot for Rollback (MCP)

Use `mcp-tool-specialist` to run these SQL statements per project.

### DEV Snapshot SQL
```sql
-- 1) Backup listing -> pricing_list mapping
create table if not exists pricing_list_listing_backup_20260203 as
select _id as listing_id, pricing_list
from listing;

-- 2) Backup pricing_list rows referenced by listings
create table if not exists pricing_list_backup_20260203 as
select pl.*
from pricing_list pl
join listing l on l.pricing_list = pl._id;
```

### PROD Snapshot SQL
```sql
-- 1) Backup listing -> pricing_list mapping
create table if not exists pricing_list_listing_backup_20260203 as
select _id as listing_id, pricing_list
from listing;

-- 2) Backup pricing_list rows referenced by listings
create table if not exists pricing_list_backup_20260203 as
select pl.*
from pricing_list pl
join listing l on l.pricing_list = pl._id;
```

**Abort if either backup table creation fails.**

---

## Step 2: Export Listing IDs (MCP)

Use `mcp-tool-specialist` to run:

```sql
select _id
from listing
order by _id;
```

Save results into local CSV files:
- `scripts/data/dev-listing-ids.csv`
- `scripts/data/prod-listing-ids.csv`

---

## Step 3: Local Bulk Script (Node)

Create a local script that reads listing IDs and calls the Edge Function:

**File**: `scripts/pricing-list-bulk-recalc.mjs`

```javascript
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  LISTING_IDS_CSV,
  LOG_FILE = `./scripts/logs/pricing-list-bulk-${Date.now()}.log`,
  RATE_DELAY_MS = '150',
  MAX_RETRIES = '5',
  CONCURRENCY = '3'
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LISTING_IDS_CSV) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or LISTING_IDS_CSV');
}

const ids = fs
  .readFileSync(path.resolve(LISTING_IDS_CSV), 'utf-8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const log = (message) => {
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.appendFileSync(LOG_FILE, `${line}\n`);
  console.log(line);
};

const callPricingList = async (listingId, attempt = 1) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: 'create',
        payload: { listing_id: listingId }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    if (!data?.success) {
      throw new Error(`Function error: ${JSON.stringify(data)}`);
    }

    log(`OK ${listingId}`);
  } catch (error) {
    if (attempt < Number(MAX_RETRIES)) {
      const backoff = 250 * Math.pow(2, attempt);
      log(`RETRY ${listingId} attempt=${attempt} backoff=${backoff}ms error=${error.message}`);
      await sleep(backoff);
      return callPricingList(listingId, attempt + 1);
    }
    log(`FAIL ${listingId} error=${error.message}`);
  }
};

const run = async () => {
  log(`START total=${ids.length} concurrency=${CONCURRENCY} rateDelayMs=${RATE_DELAY_MS}`);

  let index = 0;
  const workers = Array.from({ length: Number(CONCURRENCY) }).map(async () => {
    while (index < ids.length) {
      const listingId = ids[index++];
      await callPricingList(listingId);
      await sleep(Number(RATE_DELAY_MS));
    }
  });

  await Promise.all(workers);
  log('DONE');
};

run().catch((error) => {
  log(`FATAL ${error.message}`);
  process.exit(1);
});
```

**Notes**:
- Uses `action: 'create'` to force recalculation through the pricing-list Edge Function.
- Concurrency and delay prevent rate spikes.
- Retries with exponential backoff for transient failures.
- Logs all outcomes to a file.

---

## Step 4: Run in DEV

### Environment Setup
```bash
# Example (PowerShell or bash)
export SUPABASE_URL="https://qzsmhgyojmwvtjmnrdea.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<DEV_SERVICE_ROLE_KEY>"
export LISTING_IDS_CSV="./scripts/data/dev-listing-ids.csv"
export LOG_FILE="./scripts/logs/pricing-list-bulk-dev-$(date +%s).log"
export RATE_DELAY_MS=150
export MAX_RETRIES=5
export CONCURRENCY=3
```

### Execute
```bash
node ./scripts/pricing-list-bulk-recalc.mjs
```

### Abort Criteria (DEV)
- More than **5%** failures after retries.
- Repeated `HTTP 429` for >5 minutes.
- Any `HTTP 401/403` (auth misconfiguration).

---

## Step 5: Verify in DEV (MCP)

Run via `mcp-tool-specialist`:

```sql
-- 1) All listings should have pricing_list
select count(*) as missing
from listing
where pricing_list is null;

-- 2) No empty pricing arrays
select count(*) as empty_host_comp
from pricing_list
where "Host Compensation" is null
   or jsonb_array_length("Host Compensation") = 0;

select count(*) as empty_nightly_price
from pricing_list
where "Nightly Price" is null
   or jsonb_array_length("Nightly Price") = 0;

-- 3) Sample Weekly
select l._id, l."rental type", l."💰Weekly Host Rate", pl."Host Compensation", pl."Starting Nightly Price"
from listing l
join pricing_list pl on l.pricing_list = pl._id
where l."rental type" = 'Weekly'
limit 5;

-- 4) Sample Monthly
select l._id, l."rental type", l."💰Monthly Host Rate", pl."Host Compensation", pl."Starting Nightly Price"
from listing l
join pricing_list pl on l.pricing_list = pl._id
where l."rental type" = 'Monthly'
limit 5;
```

**Abort if any count in checks (1) or (2) is non-zero.**

---

## Step 6: Run in PROD

### Environment Setup
```bash
export SUPABASE_URL="https://qcfifybkaddcoimjroca.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<PROD_SERVICE_ROLE_KEY>"
export LISTING_IDS_CSV="./scripts/data/prod-listing-ids.csv"
export LOG_FILE="./scripts/logs/pricing-list-bulk-prod-$(date +%s).log"
export RATE_DELAY_MS=150
export MAX_RETRIES=5
export CONCURRENCY=3
```

### Execute
```bash
node ./scripts/pricing-list-bulk-recalc.mjs
```

### Abort Criteria (PROD)
- Any `HTTP 401/403` (auth misconfiguration).
- >**2%** failures after retries.
- Sustained `HTTP 429` for >5 minutes.

---

## Step 7: Verify in PROD (MCP)

Use same SQL verification as DEV.

---

## Rollback Plan

If verification fails or unexpected pricing shifts are reported:

1. Restore listing → pricing_list mapping:
```sql
update listing l
set pricing_list = b.pricing_list
from pricing_list_listing_backup_20260203 b
where l._id = b.listing_id;
```

2. Restore pricing_list rows:
```sql
-- Restore rows from backup table
insert into pricing_list
select * from pricing_list_backup_20260203
on conflict (_id) do update set
  "Host Compensation" = excluded."Host Compensation",
  "Nightly Price" = excluded."Nightly Price",
  "Starting Nightly Price" = excluded."Starting Nightly Price",
  "Markup and Discount Multiplier" = excluded."Markup and Discount Multiplier",
  "Unused Nights Discount" = excluded."Unused Nights Discount",
  "Unit Markup" = excluded."Unit Markup",
  "Combined Markup" = excluded."Combined Markup",
  "Full Time Discount" = excluded."Full Time Discount",
  "Modified Date" = excluded."Modified Date";
```

3. Re-run verification queries to confirm rollback.

---

## Logging + Audit Trail
- Store logs under `scripts/logs/` with timestamps.
- Keep CSVs of listing IDs in `scripts/data/`.
- Save MCP query outputs in `scripts/logs/` (manual copy/paste) for audit.

---

## Abort Criteria (Global)
- Snapshot tables missing or incomplete.
- Persistent `HTTP 429` or `HTTP 5xx` after retries.
- Any verification query returns non-zero for missing or empty arrays.
- Any unexpected changes detected in sample Weekly/Monthly checks.

---

## Cleanup (Optional)
- Remove local CSVs and logs after sign-off.
- Drop backup tables after 7 days:

```sql
drop table if exists pricing_list_listing_backup_20260203;
drop table if exists pricing_list_backup_20260203;
```

---

## Pre-Flight Checklist (17:45 EST)

Execute these checks before 18:00 EST:

- [ ] Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set for DEV
- [ ] Test Edge Function with single listing: `curl -X POST ...`
- [ ] Confirm script exists: `ls scripts/pricing-list-bulk-recalc.mjs`
- [ ] Confirm log directory writable: `mkdir -p scripts/logs && touch scripts/logs/test.log`
- [ ] Review current listing count in DEV (estimate runtime)

---

## Execution Commands (Copy-Paste Ready)

### DEV (18:00 EST)
```powershell
$env:SUPABASE_URL="https://qzsmhgyojmwvtjmnrdea.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<DEV_KEY>"
$env:LOG_FILE="./scripts/logs/pricing-list-bulk-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$env:RATE_DELAY_MS="150"
$env:MAX_RETRIES="5"
$env:CONCURRENCY="3"

node ./scripts/pricing-list-bulk-recalc.mjs
```

### PROD (After DEV Passes)
```powershell
$env:SUPABASE_URL="https://qcfifybkaddcoimjroca.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<PROD_KEY>"
$env:LOG_FILE="./scripts/logs/pricing-list-bulk-prod-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$env:RATE_DELAY_MS="150"
$env:MAX_RETRIES="5"
$env:CONCURRENCY="3"

node ./scripts/pricing-list-bulk-recalc.mjs
```

---

## Files Concerned

| File | Role |
|------|------|
| [scripts/pricing-list-bulk-recalc.mjs](scripts/pricing-list-bulk-recalc.mjs) | Execution script |
| [supabase/functions/pricing-list/index.ts](supabase/functions/pricing-list/index.ts) | Edge Function being called |
| Database: `listing` | Source of listing IDs |
| Database: `pricing_list` | Target of recalculation |
| Database: `pricing_list_listing_backup_20260203` | Backup table (created) |
| Database: `pricing_list_backup_20260203` | Backup table (created) |
