# Phase 2 Database Migration - Agent-Orchestrated Refactoring Plan

**Date**: 2026-01-29
**Status**: PLANNING
**Scope**: Tilde + Emoji column migration with automated testing & debugging
**Dependencies**: Playwright MCP, Agent Orchestration

---

## Executive Summary

This plan orchestrates Phase 2 of the database naming migration using:
- **Agent-based task execution** for systematic code updates
- **Playwright MCP** for end-to-end verification testing
- **Automated rollback** with pre-migration snapshots
- **Test-driven migration** ensuring no regression

---

## Migration Scope Recap

### Tilde Columns (3 columns, 5 files, 8 refs)

| Column | New Name | Tables |
|--------|----------|--------|
| `~Last Message` | `last_message_id` | thread |
| `~Date Last Message` | `last_message_at` | thread |
| `~previous Message` | `previous_message_id` | _message |

### Emoji Columns (12 columns, 35+ files, 200+ refs)

| Column | New Name |
|--------|----------|
| `💰Nightly Host Rate for 2 nights` | `nightly_rate_2_nights` |
| `💰Nightly Host Rate for 3 nights` | `nightly_rate_3_nights` |
| `💰Nightly Host Rate for 4 nights` | `nightly_rate_4_nights` |
| `💰Nightly Host Rate for 5 nights` | `nightly_rate_5_nights` |
| `💰Nightly Host Rate for 7 nights` | `nightly_rate_7_nights` |
| `💰Weekly Host Rate` | `weekly_host_rate` |
| `💰Monthly Host Rate` | `monthly_host_rate` |
| `💰Cleaning Cost / Maintenance Fee` | `cleaning_fee` |
| `💰Damage Deposit` | `damage_deposit` |
| `💰Unit Markup` | `unit_markup` |
| `💰Price Override` | `price_override` |
| `Standarized Minimum Nightly Price (Filter)` | `standardized_min_price` |

---

## Agent Orchestration Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2 MIGRATION PIPELINE                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  STAGE 0: PRE-MIGRATION VALIDATION                                         │
│  ├─ Agent: pre-migration-validator                                         │
│  ├─ Playwright: Capture baseline screenshots + API responses               │
│  └─ Output: baseline-snapshot.json                                         │
│                                                                            │
│  STAGE 1: CODE MIGRATION (No DB changes yet)                               │
│  ├─ Agent 1A: tilde-column-migrator                                        │
│  │   └─ Updates: 5 files with tilde column references                      │
│  ├─ Agent 1B: emoji-column-migrator                                        │
│  │   └─ Updates: 35+ files with emoji column references                    │
│  ├─ Agent 1C: test-fixture-migrator                                        │
│  │   └─ Updates: All test data with new column names                       │
│  └─ Output: code-migration-complete flag                                   │
│                                                                            │
│  STAGE 2: DATABASE MIGRATION                                               │
│  ├─ Agent: database-migrator                                               │
│  ├─ Runs: SQL scripts for column renames                                   │
│  └─ Output: migration-applied flag                                         │
│                                                                            │
│  STAGE 3: VERIFICATION                                                     │
│  ├─ Agent: unit-test-runner                                                │
│  │   └─ Runs: bun run test (all unit tests)                                │
│  ├─ Agent: e2e-test-runner (Playwright MCP)                                │
│  │   └─ Runs: Critical path E2E tests                                      │
│  ├─ Agent: visual-diff-checker (Playwright MCP)                            │
│  │   └─ Compares: Screenshots against baseline                             │
│  └─ Output: verification-report.json                                       │
│                                                                            │
│  STAGE 4: DEBUGGING (On failure)                                           │
│  ├─ Agent: debug-analyst                                                   │
│  │   └─ Analyzes: Failed tests, error logs, stack traces                   │
│  ├─ Agent: fix-proposer                                                    │
│  │   └─ Proposes: Code fixes for identified issues                         │
│  └─ Loop: Back to STAGE 3 until all tests pass                             │
│                                                                            │
│  STAGE 5: ROLLBACK (Emergency)                                             │
│  ├─ Agent: rollback-executor                                               │
│  │   └─ Runs: Rollback SQL scripts                                         │
│  ├─ Git: Reverts code changes                                              │
│  └─ Playwright: Verifies rollback success                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 0: Pre-Migration Validation

### Purpose
Capture the current working state as a baseline for comparison after migration.

### Agent: `pre-migration-validator`

**Tasks:**
1. Run full test suite, record results
2. Capture Playwright screenshots of critical pages
3. Record API response shapes for affected endpoints
4. Generate `baseline-snapshot.json`

### Playwright MCP Test Suite

```javascript
// Critical paths to capture baseline
const CRITICAL_PATHS = [
  // Messaging System (tilde columns)
  { path: '/messages', name: 'messages-inbox' },
  { path: '/messages/thread/:id', name: 'message-thread' },

  // Pricing System (emoji columns)
  { path: '/listing/:id', name: 'listing-detail' },
  { path: '/create-proposal', name: 'create-proposal' },
  { path: '/host/overview', name: 'host-overview' },
  { path: '/host/listings', name: 'host-listings' },
  { path: '/search', name: 'search-results' },
  { path: '/quick-price', name: 'quick-price' },
];

// API endpoints to capture response shapes
const CRITICAL_APIS = [
  'POST /functions/v1/messages { action: "getThreads" }',
  'POST /functions/v1/proposal { action: "create" }',
  'POST /functions/v1/listing { action: "get" }',
  'POST /functions/v1/pricing-list { action: "calculate" }',
];
```

### Playwright MCP Commands

```bash
# Capture baseline screenshots
mcp__playwright__browser_navigate({ url: "http://localhost:8000/messages" })
mcp__playwright__browser_take_screenshot({ filename: "baseline/messages-inbox.png" })
mcp__playwright__browser_snapshot({ filename: "baseline/messages-inbox.md" })

# Repeat for each critical path...
```

---

## Stage 1: Code Migration

### Agent 1A: `tilde-column-migrator`

**Scope:** 5 files, 8 references

**Files to Update:**

| File | Changes |
|------|---------|
| `supabase/functions/_shared/messagingHelpers.ts` | `"~Last Message"` → `last_message_id` |
| `supabase/functions/messages/handlers/getThreads.ts` | `"~Last Message"` → `last_message_id` |
| `supabase/functions/messages/handlers/adminSendReminder.ts` | `"~Last Message"` → `last_message_id` (2x) |
| `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js` | `"~Last Message"` → `last_message_id` |
| `supabase/migrations/20260128_database_views.sql` | All tilde column references in views |

**Replacement Pattern:**
```javascript
// Find and replace patterns
const TILDE_REPLACEMENTS = {
  '"~Last Message"': 'last_message_id',
  "['~Last Message']": "['last_message_id']",  // Also update bracket notation
  '"~Date Last Message"': 'last_message_at',
  "['~Date Last Message']": "['last_message_at']",
  '"~previous Message"': 'previous_message_id',
  "['~previous Message']": "['previous_message_id']",
};
```

### Agent 1B: `emoji-column-migrator`

**Scope:** 35+ files, 200+ references

**Priority Order:**

1. **Core Calculators** (must be consistent)
   - `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js`
   - `app/src/logic/calculators/pricing/calculatePricingBreakdown.js`
   - `app/src/logic/processors/pricingList/extractHostRatesFromListing.js`

2. **Shared Components**
   - `app/src/islands/shared/CreateProposalFlowV2.jsx`
   - `app/src/islands/shared/CreateProposalFlowV2Components/DaysSelectionSection.jsx`

3. **Page Logic**
   - `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
   - `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
   - All other page files...

4. **Edge Functions**
   - `supabase/functions/pricing-list/utils/pricingCalculator.ts`
   - All proposal action handlers
   - All listing handlers

5. **Database Objects**
   - `supabase/migrations/20260128_database_views.sql`
   - `supabase/migrations/20260128_materialized_views.sql`

**Replacement Pattern:**
```javascript
const EMOJI_REPLACEMENTS = {
  // Nightly rates
  '"💰Nightly Host Rate for 2 nights"': 'nightly_rate_2_nights',
  '"💰Nightly Host Rate for 3 nights"': 'nightly_rate_3_nights',
  '"💰Nightly Host Rate for 4 nights"': 'nightly_rate_4_nights',
  '"💰Nightly Host Rate for 5 nights"': 'nightly_rate_5_nights',
  '"💰Nightly Host Rate for 7 nights"': 'nightly_rate_7_nights',

  // Period rates
  '"💰Weekly Host Rate"': 'weekly_host_rate',
  '"💰Monthly Host Rate"': 'monthly_host_rate',

  // Fees
  '"💰Cleaning Cost / Maintenance Fee"': 'cleaning_fee',
  '"💰Damage Deposit"': 'damage_deposit',
  '"💰Unit Markup"': 'unit_markup',
  '"💰Price Override"': 'price_override',

  // Filter
  '"Standarized Minimum Nightly Price (Filter)"': 'standardized_min_price',
};
```

### Agent 1C: `test-fixture-migrator`

**Scope:** 15+ test files

**Files to Update:**

| Test File | Approximate Changes |
|-----------|---------------------|
| `calculatePriceScore.test.js` | 60+ test fixture updates |
| `calculateMatchScore.test.js` | 8+ test fixture updates |
| `getNightlyRateByFrequency.test.js` | 25+ test fixture updates |
| `calculatePricingBreakdown.test.js` | Multiple fixtures |
| Other test files | Various |

**Pattern:** Same as 1B but applied to test data objects

---

## Stage 2: Database Migration

### Agent: `database-migrator`

**Pre-conditions:**
- [ ] All code changes from Stage 1 complete
- [ ] All tests passing with OLD column names (verify no regressions)
- [ ] Database backup created

**SQL Scripts to Execute (in order):**

```sql
-- Script 2: Tilde Columns
BEGIN;
ALTER TABLE thread RENAME COLUMN "~Last Message" TO last_message_id;
ALTER TABLE thread RENAME COLUMN "~Date Last Message" TO last_message_at;
ALTER TABLE _message RENAME COLUMN "~previous Message" TO previous_message_id;
COMMIT;

-- Script 3: Emoji Columns
BEGIN;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 2 nights" TO nightly_rate_2_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 3 nights" TO nightly_rate_3_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 4 nights" TO nightly_rate_4_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 5 nights" TO nightly_rate_5_nights;
ALTER TABLE listing RENAME COLUMN "💰Nightly Host Rate for 7 nights" TO nightly_rate_7_nights;
ALTER TABLE listing RENAME COLUMN "💰Weekly Host Rate" TO weekly_host_rate;
ALTER TABLE listing RENAME COLUMN "💰Monthly Host Rate" TO monthly_host_rate;
ALTER TABLE listing RENAME COLUMN "💰Cleaning Cost / Maintenance Fee" TO cleaning_fee;
ALTER TABLE listing RENAME COLUMN "💰Damage Deposit" TO damage_deposit;
ALTER TABLE listing RENAME COLUMN "💰Unit Markup" TO unit_markup;
ALTER TABLE listing RENAME COLUMN "💰Price Override" TO price_override;
ALTER TABLE listing RENAME COLUMN "Standarized Minimum Nightly Price (Filter)" TO standardized_min_price;
COMMIT;
```

**Execution via MCP:**
```
mcp__supabase__execute_sql({ project_id: "dev", query: "..." })
```

---

## Stage 3: Verification

### Agent: `unit-test-runner`

**Command:**
```bash
cd app && bun run test
```

**Success Criteria:**
- All tests pass
- No new test failures
- Coverage maintained

### Agent: `e2e-test-runner` (Playwright MCP)

**Test Scenarios:**

#### Messaging System (Tilde Columns)

```javascript
// Test 1: Message inbox loads with correct last message preview
test('messaging-inbox-loads', async () => {
  await mcp__playwright__browser_navigate({ url: '/messages' });
  await mcp__playwright__browser_snapshot({});
  // Verify thread list shows last_message_id content
  // Compare against baseline
});

// Test 2: Thread view shows message history
test('thread-view-messages', async () => {
  await mcp__playwright__browser_navigate({ url: '/messages/thread/test-id' });
  await mcp__playwright__browser_snapshot({});
  // Verify messages display correctly
});
```

#### Pricing System (Emoji Columns)

```javascript
// Test 3: Listing detail shows correct pricing
test('listing-detail-pricing', async () => {
  await mcp__playwright__browser_navigate({ url: '/listing/test-id' });
  await mcp__playwright__browser_snapshot({});
  // Verify nightly_rate_4_nights displays
  // Verify cleaning_fee displays
  // Verify damage_deposit displays
});

// Test 4: Proposal creation calculates prices correctly
test('proposal-pricing-calculation', async () => {
  await mcp__playwright__browser_navigate({ url: '/create-proposal' });
  // Fill in proposal form
  await mcp__playwright__browser_fill_form({
    fields: [
      { name: 'nights', type: 'textbox', ref: '...', value: '4' },
      { name: 'weeks', type: 'textbox', ref: '...', value: '2' },
    ]
  });
  await mcp__playwright__browser_snapshot({});
  // Verify calculated total matches expected
});

// Test 5: Host overview shows pricing summaries
test('host-overview-pricing', async () => {
  await mcp__playwright__browser_navigate({ url: '/host/overview' });
  await mcp__playwright__browser_snapshot({});
  // Verify monthly_host_rate displays
  // Verify weekly_host_rate displays
});

// Test 6: Search results show pricing correctly
test('search-results-pricing', async () => {
  await mcp__playwright__browser_navigate({ url: '/search?borough=manhattan' });
  await mcp__playwright__browser_snapshot({});
  // Verify listing cards show pricing
});
```

### Agent: `visual-diff-checker` (Playwright MCP)

**Compare screenshots:**
```javascript
// For each critical path, compare new screenshot to baseline
const paths = ['messages-inbox', 'listing-detail', 'create-proposal', ...];
for (const path of paths) {
  const baseline = `baseline/${path}.png`;
  const current = `current/${path}.png`;
  // Visual diff comparison
  // Flag significant differences
}
```

---

## Stage 4: Debugging (On Failure)

### Agent: `debug-analyst`

**Trigger:** Any Stage 3 test fails

**Analysis Steps:**
1. Parse test failure output
2. Identify affected file and line
3. Check if column name mismatch
4. Check if missing import/reference
5. Trace data flow from DB → Edge Function → Frontend

**Output:**
```json
{
  "failure_type": "column_name_mismatch",
  "file": "app/src/logic/calculators/pricing/getNightlyRateByFrequency.js",
  "line": 48,
  "expected": "nightly_rate_4_nights",
  "found": "💰Nightly Host Rate for 4 nights",
  "fix_suggestion": "Update line 48 to use new column name"
}
```

### Agent: `fix-proposer`

**Input:** Debug analysis output
**Output:** Specific code edits

**Example Fix:**
```javascript
// File: getNightlyRateByFrequency.js
// Line 48
// OLD: listing['💰Nightly Host Rate for 4 nights']
// NEW: listing['nightly_rate_4_nights']
```

### Retry Loop

```
STAGE 3 FAILS → debug-analyst → fix-proposer → apply fix → STAGE 3 RETRY
                     ↑                                           │
                     └───────────────────────────────────────────┘
                            (max 5 iterations before escalating)
```

---

## Stage 5: Rollback (Emergency)

### Trigger Conditions
- Stage 3 fails after 5 debug iterations
- Critical production issue detected
- Manual abort requested

### Agent: `rollback-executor`

**SQL Rollback:**
```sql
-- Rollback tilde columns
BEGIN;
ALTER TABLE thread RENAME COLUMN last_message_id TO "~Last Message";
ALTER TABLE thread RENAME COLUMN last_message_at TO "~Date Last Message";
ALTER TABLE _message RENAME COLUMN previous_message_id TO "~previous Message";
COMMIT;

-- Rollback emoji columns
BEGIN;
ALTER TABLE listing RENAME COLUMN nightly_rate_2_nights TO "💰Nightly Host Rate for 2 nights";
-- ... etc
COMMIT;
```

**Git Rollback:**
```bash
git checkout . -- app/src/
git checkout . -- supabase/functions/
```

**Verification:**
```javascript
// Re-run baseline comparison to confirm rollback
await mcp__playwright__browser_navigate({ url: '/messages' });
// Should match baseline-snapshot.json
```

---

## Execution Commands

### Run Full Pipeline

```bash
# Stage 0: Capture baseline
claude --skill pre-migration-validator

# Stage 1: Code migration (DRY RUN - no DB changes)
claude --skill tilde-column-migrator --dry-run
claude --skill emoji-column-migrator --dry-run
claude --skill test-fixture-migrator --dry-run

# Review changes, then apply
claude --skill tilde-column-migrator --apply
claude --skill emoji-column-migrator --apply
claude --skill test-fixture-migrator --apply

# Stage 2: Database migration
claude --skill database-migrator --target dev

# Stage 3: Verification
claude --skill unit-test-runner
claude --skill e2e-test-runner
claude --skill visual-diff-checker

# Stage 4: Auto-debug if needed
claude --skill debug-pipeline --auto-fix

# Stage 5: Rollback if critical
claude --skill rollback-executor
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Messaging system breaks | Stage 0 baseline captures exact behavior |
| Pricing calculations wrong | Comprehensive unit tests + E2E verification |
| Missed reference | Agent 1B scans ALL files, not just known ones |
| Test data outdated | Agent 1C updates all test fixtures |
| DB migration fails | Transactional scripts with ROLLBACK |
| Production impact | Full dev verification before prod deployment |

---

## Success Criteria

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Visual diff shows no regressions
- [ ] Messaging system works: threads, last message preview, admin reminders
- [ ] Pricing system works: listing display, proposal creation, host overview
- [ ] No 500 errors in Edge Functions
- [ ] No console errors in frontend

---

## Timeline Estimate

| Stage | Duration | Notes |
|-------|----------|-------|
| Stage 0 | 1 hour | Baseline capture |
| Stage 1 | 4-6 hours | Code migration |
| Stage 2 | 30 min | Database migration |
| Stage 3 | 2-3 hours | Verification |
| Stage 4 | Variable | Debug loop if needed |
| **Total** | **8-12 hours** | Optimistic path |

---

## Appendix: File Checklist

### Tilde Column Files (5)
- [ ] `supabase/functions/_shared/messagingHelpers.ts`
- [ ] `supabase/functions/messages/handlers/getThreads.ts`
- [ ] `supabase/functions/messages/handlers/adminSendReminder.ts`
- [ ] `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- [ ] `supabase/migrations/20260128_database_views.sql`

### Emoji Column Files (35+)
- [ ] `app/src/logic/calculators/pricing/getNightlyRateByFrequency.js`
- [ ] `app/src/logic/calculators/pricing/calculatePricingBreakdown.js`
- [ ] `app/src/logic/processors/pricingList/extractHostRatesFromListing.js`
- [ ] `app/src/logic/processors/matching/adaptCandidateListing.js`
- [ ] `app/src/islands/shared/CreateProposalFlowV2.jsx`
- [ ] `app/src/islands/shared/CreateProposalFlowV2Components/DaysSelectionSection.jsx`
- [ ] `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
- [ ] `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js`
- [ ] `supabase/functions/pricing-list/utils/pricingCalculator.ts`
- [ ] ... (remaining 26 files listed in impact analysis)

### Test Files (15+)
- [ ] `app/src/logic/calculators/matching/__tests__/calculatePriceScore.test.js`
- [ ] `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
- [ ] `app/src/logic/calculators/pricing/__tests__/getNightlyRateByFrequency.test.js`
- [ ] `app/src/logic/calculators/pricing/__tests__/calculatePricingBreakdown.test.js`
- [ ] ... (remaining test files)

---

**Plan Status**: READY FOR APPROVAL
**Next Step**: User approval to begin Stage 0 (baseline capture)
