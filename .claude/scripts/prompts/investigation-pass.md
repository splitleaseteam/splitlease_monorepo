# Investigation Pass Agent Prompt

You are investigating a payment display bug on the Host Proposals page.

## Bug Context

**Issue**: On the Host Proposals page, payments are sometimes displayed showing guest payment amounts when host compensation should be shown.

**Known Fields**:
- HOST fields: `host compensation`, `Total Compensation (proposal - host)`, `4 week compensation`
- GUEST fields: `proposal nightly price`, `Total Price for Reservation (guest)`, `4 week rent`

## Pricing Style Context (CRITICAL)

Hosts set pricing using **3 lease styles**:

| Style | Host Sets | Should Display As | DB Field |
|-------|-----------|-------------------|----------|
| **Nightly** | Per-night rates for 2-7 nights | `$X/night × Y × Z wks` | `host compensation` |
| **Weekly** | Single weekly rate | `$X/week × Z wks` | `weeklyHostRate` |
| **Monthly** | Single monthly rate | `$X/month × Z mo` | `monthlyHostRate` |

**KEY INSIGHT**:
- `proposal nightly price` = GUEST price (includes 17% markup)
- `host compensation` = HOST compensation (what host actually earns)
- These are DIFFERENT values! Host should NEVER see guest prices.

**Formula**: `guestPrice = hostCompensation × 1.17` (approx)

**Listing fields for host rates**:
```
'💰Nightly Host Rate for 1 night' through '💰Nightly Host Rate for 7 nights'
'rental type' → "Nightly" | "Weekly" | "Monthly"
```

## Your Task

### Step 1: Query Database for Sample Data

Use **mcp-tool-specialist subagent** to invoke Supabase MCP:

```sql
SELECT
  id,
  "proposal nightly price" as guest_nightly,
  "host compensation" as host_nightly,
  "Total Price for Reservation (guest)" as guest_total,
  "Total Compensation (proposal - host)" as host_total
FROM proposal
WHERE "Total Compensation (proposal - host)" IS NOT NULL
ORDER BY "Created Date" DESC
LIMIT 5;
```

### Step 2: Analyze Source Code

Read these files for payment field usage:

1. **PricingRow.jsx** - `app/src/islands/pages/HostProposalsPage/PricingRow.jsx`
   - Look for: Which fields populate `totalEarnings`, `nightlyRate`
   - Flag: Any use of guest fields for "Your Earnings" display

2. **ProposalCard.jsx** - `app/src/islands/pages/HostProposalsPage/ProposalCard.jsx`
   - Look for: Which fields populate "Your Compensation"
   - Flag: Fallbacks to guest fields

### Step 3: Create Bug Catalog

Write to `.claude/state/bug-catalog.json`:

```json
{
  "bugs": [
    {
      "id": 1,
      "file": "path/to/file.jsx",
      "line": 54,
      "code": "const totalEarnings = ... || originalTotalPrice",
      "issue": "Falls back to guest total instead of host compensation",
      "severity": "HIGH",
      "fixStrategy": "Replace fallback with host compensation field"
    }
  ]
}
```

## Constraints

- **MANDATORY**: Use mcp-tool-specialist for ALL Supabase MCP calls
- Do NOT modify any code - investigation only
- Focus specifically on payment/compensation displays
