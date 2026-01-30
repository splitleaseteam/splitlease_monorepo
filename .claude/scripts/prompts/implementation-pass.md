# Implementation Pass Agent Prompt

You are implementing fixes for the Host Proposals payment bugs.

## Context

You have a fix plan from the planning pass. Your job is to:
1. Apply the code changes
2. Verify with Playwright MCP
3. Debug using Supabase MCP logs if tests fail

## Fix Plan Location

Read the fix plan from: `.claude/state/fix-plan.json`

## Implementation Workflow

### For Each Fix:

#### Step 1: Apply Code Changes

Use the Edit tool to modify the specified file. Example:

**Before** (PricingRow.jsx line 54):
```javascript
const totalEarnings = (isCounteroffer && hcTotalPrice != null)
  ? hcTotalPrice
  : (proposal?.total_price || originalTotalPrice);
```

**After**:
```javascript
const hostTotalCompensation = proposal?.['Total Compensation (proposal - host)'] ||
  proposal?.total_compensation || 0;

const totalEarnings = (isCounteroffer && hcTotalPrice != null)
  ? hcTotalPrice
  : hostTotalCompensation;
```

#### Step 2: Start Dev Server

```bash
bun run dev
```

#### Step 3: Playwright Verification

Use **mcp-tool-specialist subagent** to invoke Playwright MCP:

1. Navigate: `browser_navigate: http://localhost:8000/host-proposals`
2. Wait for load: `browser_wait_for: text="Your Compensation"`
3. Take snapshot: `browser_snapshot`
4. Verify payment displays show valid dollar amounts
5. Take screenshot: `browser_take_screenshot: filename="fix-verification.png"`

#### Step 4: If Test Fails - Debug

Use **mcp-tool-specialist** to invoke Supabase MCP `get_logs` to check for API errors.

## Key Fields Reference

### Host Payment Fields (USE THESE)
| Field | What It Is | When to Use |
|-------|-----------|-------------|
| `host compensation` | Per-night HOST rate (from listing tiers) | Display nightly rate |
| `Total Compensation (proposal - host)` | Total HOST earnings | Display total earnings |
| `4 week compensation` | 4-week baseline for host | Display 4-week summary |
| `hc nightly price` | Counteroffer host rate | When counteroffer exists |
| `hc total price` | Counteroffer total | When counteroffer exists |

### Guest Payment Fields (NEVER USE for host displays)
| Field | What It Is | Why NOT to Use |
|-------|-----------|----------------|
| `proposal nightly price` | Guest's price (includes 17% markup) | Host doesn't earn this |
| `Total Price for Reservation (guest)` | What guest pays | Host doesn't receive this |
| `4 week rent` | Guest's 4-week cost | Not host compensation |

### Pricing Style Display Rules

Hosts set prices in different styles. Display must match:

| Listing's `rental type` | PricingRow Formula | Example |
|-------------------------|-------------------|---------|
| **Nightly** | `$X/night × Y nights × Z weeks` | `$150/night × 3 × 12 wks = $5,400` |
| **Weekly** | `$X/week × Z weeks` | `$450/week × 12 wks = $5,400` |
| **Monthly** | `$X/month × Z months` | `$1,800/month × 3 mo = $5,400` |

**CRITICAL**: The `$X` value must come from HOST compensation fields, NOT guest pricing fields!

### Price Relationship

```
Guest Price = Host Compensation × ~1.17
            = Host Compensation + Platform Markup

Example:
  Host sets:    $150/night (host compensation)
  Guest sees:   $175/night (proposal nightly price) ← includes 17% markup
  Host earns:   $150/night ← THIS is what host should see!
```

## Constraints

- **MANDATORY**: Use mcp-tool-specialist for ALL MCP operations
- Max 8 iterations per fix
- Commit after each successful fix
