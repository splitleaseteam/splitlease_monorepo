# Host Proposals Payment Bug - Self-Healing Orchestrator

**Created**: 2026-01-29
**Scheduled**: 11:00 PM EST
**Max Runtime**: 4 hours
**Status**: Pending execution

---

## Bug Summary

**Issue**: On the Host Proposals page, payments are sometimes displayed calculated FOR the host when they should show the host's COMPENSATION (earnings).

**Root Cause Identified**:
In `PricingRow.jsx:54`, the fallback chain for `totalEarnings` includes `originalTotalPrice` which is the GUEST payment (`Total Price for Reservation (guest)`), not the HOST compensation.

```javascript
// BUGGY CODE (line 54):
const totalEarnings = (isCounteroffer && hcTotalPrice != null)
  ? hcTotalPrice
  : (proposal?.total_price || proposal?.host_earnings || proposal?.total_amount || originalTotalPrice);
  //                                                                              ^^^^^^^^^^^^^^^^
  //                                   This is GUEST total, not HOST compensation!
```

**Correct Field**: Should use `Total Compensation (proposal - host)` for host earnings.

---

## Pricing Style Context (CRITICAL)

Hosts set their pricing using one of **3 lease styles**:

| Lease Style | How Host Sets Rates | What Host Sees | Stored In |
|-------------|---------------------|----------------|-----------|
| **Nightly** | Per-night rates for 2-7 nights | `$X/night × Y nights × Z weeks` | `💰Nightly Host Rate for N nights` (7 fields) |
| **Weekly** | Single weekly rate | `$X/week × Z weeks` | `weeklyHostRate` |
| **Monthly** | Single monthly rate | `$X/month × Z months` | `monthlyHostRate` |

### Host Compensation Fields (Database)

```
listing table:
├── 'rental type'                        → "Nightly" | "Weekly" | "Monthly"
├── '💰Nightly Host Rate for 1 night'    → Host's per-night rate for 1 night
├── '💰Nightly Host Rate for 2 nights'   → Host's per-night rate for 2 nights
├── ... (through 7 nights)
├── 'weeklyHostRate'                     → For weekly style
└── 'monthlyHostRate'                    → For monthly style

proposal table:
├── 'host compensation'                  → Per-night HOST rate (from listing tiers)
├── 'Total Compensation (proposal - host)' → Total earnings = rate × frequency × weeks
├── '4 week compensation'                → 4-week baseline for host
├── 'hc nightly price'                   → Counteroffer host rate
└── 'hc total price'                     → Counteroffer total

pricing_list table:
├── hostCompensation[7]                  → Array of 7 host rates by night count
├── nightlyPrice[7]                      → Array of 7 GUEST prices (host × multipliers)
└── markupAndDiscountMultiplier[7]       → Array of multipliers
```

### Price Formula

```
guestPrice = hostCompensation × (1 + siteMarkup + unitMarkup - unusedNightsDiscount)
           ≈ hostCompensation × 1.17 (typical)
```

**IMPORTANT**: Host sees `hostCompensation`, Guest sees `nightlyPrice`. These are DIFFERENT values!

### Display Rules by Lease Style

| Lease Style | PricingRow Should Show | ProposalCard Should Show |
|-------------|------------------------|--------------------------|
| **Nightly** | `$X/night × Y nights × Z weeks = $TOTAL` | "Your Compensation: $TOTAL" |
| **Weekly** | `$X/week × Z weeks = $TOTAL` | "Your Compensation: $TOTAL" |
| **Monthly** | `$X/month × Z months = $TOTAL` | "Your Compensation: $TOTAL" |

Where:
- `$X` = `host compensation` (from proposal, NOT `proposal nightly price`)
- `$TOTAL` = `Total Compensation (proposal - host)` (from proposal, NOT `Total Price for Reservation (guest)`)

---

## Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SELF-HEALING DEBUG ORCHESTRATOR                      │
│                      Max Runtime: 4 hours                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │   PASS 1    │───▶│   PASS 2    │───▶│   PASS 3    │───▶│  PASS 4  │ │
│  │ INVESTIGATE │    │    PLAN     │    │  IMPLEMENT  │    │  VERIFY  │ │
│  │  (30 min)   │    │  (30 min)   │    │  (2 hours)  │    │ (1 hour) │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│        │                  │                  │                  │      │
│        ▼                  ▼                  ▼                  ▼      │
│   Bug Catalog        Fix Plan          Code Changes        E2E Tests  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      FEEDBACK LOOP                                │  │
│  │   Playwright MCP ←──── Test Results ────→ Supabase MCP (logs)    │  │
│  │         │                                        │                │  │
│  │         └─────────────── Retry if failed ────────┘                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pass Details

### Pass 1: Investigation (30 min)
- Query database for sample proposal payment data
- Analyze PricingRow.jsx and ProposalCard.jsx
- Create bug catalog in `.claude/state/bug-catalog.json`

### Pass 2: Planning (30 min)
- Read bug catalog
- Create fix plan for each bug
- Write to `.claude/state/fix-plan.json`

### Pass 3: Implementation (2 hours)
- Apply code changes from fix plan
- Verify with Playwright MCP after each fix
- Debug with Supabase MCP logs if tests fail
- Iterate until all fixes verified

### Pass 4: Verification (1 hour)
- Full E2E test suite via Playwright
- Cross-reference with database values
- Run production build
- Generate final report

---

## Known Bug Locations

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `PricingRow.jsx` | 54 | `totalEarnings` falls back to guest total | HIGH |
| `PricingRow.jsx` | 29 | `originalNightlyRate` uses guest price | MEDIUM |

---

## Files to Modify

- [PricingRow.jsx](app/src/islands/pages/HostProposalsPage/PricingRow.jsx) - PRIMARY FIX TARGET
- [ProposalCard.jsx](app/src/islands/pages/HostProposalsPage/ProposalCard.jsx) - Verify compensation display

---

## Scheduling

**Windows Task Scheduler**:
```powershell
.\schedule-orchestrator.ps1 -ScheduledTime "23:00" -ScheduledDate "01/29/2026"
```

**Manual Test**:
```bash
node .claude/scripts/orchestrator-runner.js
```

---

## Success Criteria

1. All proposal cards show correct host compensation
2. PricingRow displays "Your Earnings" with host values
3. E2E tests pass with 100% accuracy
4. No regression in counteroffer scenarios
5. Build succeeds without errors

---

## Post-Run Analysis Report

After the orchestrator completes (success or failure), a comprehensive session report is automatically generated at:

```
.claude/plans/Documents/YYYYMMDDHHMMSS-orchestrator-session-report.md
```

### Report Contents

| Section | Description |
|---------|-------------|
| **Executive Summary** | Start/end times, duration, final status, iterations |
| **Pass Execution Summary** | Which passes started/completed |
| **Bugs Identified** | Table from bug-catalog.json |
| **Fixes Planned** | Table from fix-plan.json |
| **Implementation Results** | Raw JSON of fix attempts |
| **Verification Results** | E2E test results, screenshots |
| **Recommendations** | Next steps based on outcome |
| **Raw Log Excerpt** | Last 50 lines of execution log |

### State Files (for manual debugging)

| File | Contents |
|------|----------|
| `.claude/state/orchestrator-state.json` | Resumable session state |
| `.claude/state/bug-catalog.json` | Identified bugs with severity |
| `.claude/state/fix-plan.json` | Planned code changes |
| `.claude/state/implementation-results.json` | Fix attempt outcomes |
| `.claude/state/verification-report.json` | Final E2E test results |
| `.claude/logs/orchestrator-run.log` | Full timestamped log |
