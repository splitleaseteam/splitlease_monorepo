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
- `host compensation` - Per-night host rate
- `Total Compensation (proposal - host)` - Total earnings
- `hc nightly price` - Counteroffer rate
- `hc total price` - Counteroffer total

### Guest Payment Fields (DO NOT USE for host displays)
- `proposal nightly price` - Guest's proposed rate
- `Total Price for Reservation (guest)` - What guest pays

## Constraints

- **MANDATORY**: Use mcp-tool-specialist for ALL MCP operations
- Max 8 iterations per fix
- Commit after each successful fix
