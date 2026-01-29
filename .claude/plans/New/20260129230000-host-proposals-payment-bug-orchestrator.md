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
