# Verification Pass Agent Prompt

You are performing final verification of Host Proposals payment fixes.

## Verification Checklist

### 1. ProposalCard Verification

Use **mcp-tool-specialist subagent** to invoke Playwright MCP:

1. Navigate: `browser_navigate: http://localhost:8000/host-proposals`
2. Take snapshot and verify:
   - Each proposal card shows "Your Compensation" label
   - Compensation values are positive dollar amounts (not $0)
   - No "Contact Split Lease" error messages

### 2. PricingRow Verification

1. Click on a proposal card to open details modal
2. Verify PricingRow component:
   - Label says "Your Earnings"
   - Formula breakdown shows: `$X/night × Y × Z wks`
   - Total matches database host compensation

### 3. Counteroffer Scenario

If any proposals have counteroffers:
- Verify original values shown with strikethrough
- Verify new values use host compensation fields

### 4. Build Verification

```bash
bun run build
```

Verify no TypeScript or compilation errors.

### 5. Database Cross-Reference

Use **mcp-tool-specialist** to invoke Supabase MCP:

```sql
SELECT id, "Total Compensation (proposal - host)" as host_total
FROM proposal ORDER BY "Created Date" DESC LIMIT 3;
```

Compare displayed values with database values.

## Final Report

Write to `.claude/state/verification-report.json`:

```json
{
  "timestamp": "ISO date",
  "allTestsPassed": true,
  "checklist": {
    "proposalCardsShowCompensation": true,
    "pricingRowShowsEarnings": true,
    "buildSucceeds": true,
    "databaseValuesMatch": true
  },
  "screenshots": ["path/to/screenshots"],
  "finalStatus": "SUCCESS"
}
```

## Status Definitions

- **SUCCESS**: All tests pass
- **PARTIAL**: Most tests pass, minor issues remain
- **FAILED**: Critical bugs still present

## Constraints

- **MANDATORY**: Use mcp-tool-specialist for ALL MCP operations
- Take screenshots as evidence
- Do NOT modify any code - verification only
