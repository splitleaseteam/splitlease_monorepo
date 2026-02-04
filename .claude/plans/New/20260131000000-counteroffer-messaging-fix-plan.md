# Counteroffer Messaging Fix Plan

**Created**: 2026-01-31
**Status**: Ready for Implementation
**Priority**: High - Blocks acceptance criteria validation

---

## Executive Summary

During the counteroffer acceptance debug cycle, two critical issues were identified that prevent complete validation of the acceptance criteria:

1. **Supabase MCP Disconnection** - Intermittent connectivity prevents database validation
2. **Thread-Proposal FK Not Set** - Messages can't be created because threads aren't linked to proposals

This plan addresses both issues systematically.

---

## Issue 1: Supabase MCP Disconnection

### Symptoms Observed
- `claude mcp list` shows Supabase as "Connected"
- `ReadMcpResourceTool` returns "Server 'supabase' is not connected"
- Subagents cannot access `mcp__supabase__*` tools
- Connection appears to timeout or drop during long conversations

### Root Cause Analysis

The Supabase MCP uses an HTTP endpoint (`https://mcp.supabase.com/mcp`) that requires OAuth authentication. The connection may:
1. Timeout after extended periods of inactivity
2. Lose authentication state between tool invocations
3. Have stale connection status in the CLI check vs actual availability

### Investigation Steps

```bash
# Step 1: Check MCP configuration
cat ~/.claude/mcp_servers.json

# Step 2: Verify Supabase MCP endpoint
curl -I https://mcp.supabase.com/mcp

# Step 3: Check for authentication tokens
cat ~/.claude/mcp_auth.json 2>/dev/null || echo "No auth file found"

# Step 4: Test MCP reconnection
claude mcp reconnect supabase
```

### Fix Options

#### Option A: Manual Reconnection Protocol (Immediate)
Create a reconnection script that can be invoked when MCP disconnects:

```powershell
# .claude/scripts/reconnect-supabase-mcp.ps1
Write-Host "Reconnecting Supabase MCP..."

# Kill any stale MCP processes
Get-Process -Name "*supabase*mcp*" -ErrorAction SilentlyContinue | Stop-Process -Force

# Trigger re-authentication
claude mcp login supabase

# Verify connection
claude mcp list
```

#### Option B: Use Supabase CLI as Fallback (Recommended)
When MCP is unavailable, use Supabase CLI with REST API:

```typescript
// supabase/functions/_shared/directDbQuery.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function executeDirectQuery(sql: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  return { data, error };
}
```

#### Option C: Local Database for Testing
Run Supabase locally to avoid MCP dependency:

```bash
# Start local Supabase
supabase start

# Run tests against local instance
SUPABASE_URL=http://localhost:54321 bun run test
```

### Recommended Action
Implement **Option B** as primary fix, with **Option A** as fallback. Local testing (Option C) for development.

---

## Issue 2: Thread-Proposal FK Not Set

### Symptoms Observed
- Thread `1769130752074x54961013178307664` exists
- Proposal `1769130751870x21602817865937584` has this thread referenced
- BUT: Thread's `"Proposal"` column is NULL or not matching
- Result: `findThreadByProposal()` returns null, messages not created

### Root Cause Analysis

The thread-proposal relationship is **bidirectional but not consistently maintained**:

```
proposal._id ←→ thread."Proposal"  (FK from thread to proposal)
proposal.??? ←→ thread._id         (No FK from proposal to thread!)
```

**Problem**: When threads are created through different flows, the `"Proposal"` FK may not be set:

1. **ContactHost Flow** - Creates thread with `Listing` but NOT `Proposal`
2. **Proposal Submission Flow** - Should update thread with `Proposal` FK
3. **Direct Thread Creation** - May not set `Proposal` at all

### Investigation Queries

```sql
-- Query 1: Check if thread has Proposal FK set
SELECT
  _id,
  "Proposal",
  "Listing",
  host_user_id,
  guest_user_id,
  "Created Date"
FROM thread
WHERE _id = '1769130752074x54961013178307664';

-- Query 2: Find all threads missing Proposal FK but linked to proposals
SELECT
  t._id as thread_id,
  t."Proposal" as thread_proposal_fk,
  t."Listing",
  p._id as proposal_id,
  p."Status"
FROM thread t
JOIN proposal p ON (
  t.host_user_id = p."Host User"
  AND t.guest_user_id = p."Guest"
  AND t."Listing" = p."Listing"
)
WHERE t."Proposal" IS NULL
AND p."Status" != 'Proposal Cancelled by Guest';

-- Query 3: Check how many threads are orphaned
SELECT
  COUNT(*) as total_threads,
  COUNT("Proposal") as threads_with_proposal_fk,
  COUNT(*) - COUNT("Proposal") as threads_missing_proposal_fk
FROM thread;
```

### Fix Implementation

#### Step 1: Data Fix - Backfill Missing FKs

```sql
-- Backfill thread.Proposal for threads that should be linked
UPDATE thread t
SET "Proposal" = p._id, "Modified Date" = NOW()
FROM proposal p
WHERE t.host_user_id = p."Host User"
  AND t.guest_user_id = p."Guest"
  AND t."Listing" = p."Listing"
  AND t."Proposal" IS NULL
  AND p."Status" != 'Proposal Cancelled by Guest'
  AND p."Deleted" IS NOT TRUE;
```

#### Step 2: Code Fix - Ensure FK is Set on Proposal Creation

**File**: `supabase/functions/proposal/actions/create.ts`

```typescript
// After creating proposal, update the thread's Proposal FK
const { threadId } = await findOrCreateProposalThread(supabase, {
  proposalId: newProposal._id,
  hostUserId,
  guestUserId,
  listingId,
  listingName
});

// Ensure thread has Proposal FK set (redundant but safe)
await supabase
  .from('thread')
  .update({
    "Proposal": newProposal._id,
    "Modified Date": new Date().toISOString()
  })
  .eq('_id', threadId);
```

#### Step 3: Code Fix - Fallback in accept_counteroffer.ts

Update the message creation to try multiple lookup strategies:

```typescript
// supabase/functions/proposal/actions/accept_counteroffer.ts

// Strategy 1: Look up thread by Proposal FK
let threadId: string | null = null;

const { data: threadByProposal } = await supabase
  .from('thread')
  .select('_id')
  .eq('Proposal', proposalId)
  .limit(1)
  .maybeSingle();

threadId = threadByProposal?._id;

// Strategy 2: Fallback - find thread by host+guest+listing match
if (!threadId) {
  console.log('[accept_counteroffer] No thread found by Proposal FK, trying host+guest+listing match');

  const { data: threadByMatch } = await supabase
    .from('thread')
    .select('_id')
    .eq('host_user_id', proposal['Host User'])
    .eq('guest_user_id', proposal.Guest)
    .eq('Listing', proposal.Listing)
    .limit(1)
    .maybeSingle();

  threadId = threadByMatch?._id;

  // If found, update the Proposal FK for future lookups
  if (threadId) {
    await supabase
      .from('thread')
      .update({ "Proposal": proposalId })
      .eq('_id', threadId);
    console.log('[accept_counteroffer] Updated thread Proposal FK:', threadId);
  }
}

// Strategy 3: Last resort - create new thread
if (!threadId) {
  console.warn('[accept_counteroffer] No existing thread found, creating new one');
  threadId = await createProposalThread(supabase, {
    proposalId,
    hostUserId: proposal['Host User'],
    guestUserId: proposal.Guest,
    listingId: proposal.Listing,
    listingName: proposal._listing?.Name || 'Proposal Thread'
  });
}
```

#### Step 4: Database Trigger (Long-term Fix)

Create a trigger to automatically maintain the FK relationship:

```sql
-- Migration: 20260131_thread_proposal_fk_trigger.sql

CREATE OR REPLACE FUNCTION sync_thread_proposal_fk()
RETURNS TRIGGER AS $$
BEGIN
  -- When a proposal is created/updated with a Listing
  -- Find matching thread and update its Proposal FK
  IF NEW."Listing" IS NOT NULL THEN
    UPDATE thread
    SET "Proposal" = NEW._id, "Modified Date" = NOW()
    WHERE host_user_id = NEW."Host User"
      AND guest_user_id = NEW."Guest"
      AND "Listing" = NEW."Listing"
      AND ("Proposal" IS NULL OR "Proposal" = NEW._id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_thread_proposal_fk
AFTER INSERT OR UPDATE ON proposal
FOR EACH ROW
EXECUTE FUNCTION sync_thread_proposal_fk();
```

---

## Implementation Order

### Phase 1: Immediate Fixes (Today)

1. **Run backfill query** to fix existing orphaned threads
2. **Update accept_counteroffer.ts** with fallback lookup strategies
3. **Deploy proposal function**: `supabase functions deploy proposal --project-ref qzsmhgyojmwvtjmnrdea --no-verify-jwt`
4. **Test and validate** all 4 acceptance criteria

### Phase 2: Code Hardening (This Week)

5. **Update proposal creation flow** to always set thread Proposal FK
6. **Add validation** in findOrCreateProposalThread to ensure FK is set
7. **Create reconnection script** for Supabase MCP

### Phase 3: Long-term Stability (Next Sprint)

8. **Create database trigger** for automatic FK sync
9. **Add monitoring** for orphaned threads
10. **Document** the thread-proposal relationship in DATABASE_RELATIONS.md

---

## Validation Queries

After implementing fixes, run these to confirm success:

```sql
-- Confirm target thread now has Proposal FK
SELECT _id, "Proposal" FROM thread WHERE _id = '1769130752074x54961013178307664';

-- Confirm messages were created
SELECT _id, "Message Body", "Created Date"
FROM _message
WHERE thread_id = '1769130752074x54961013178307664'
ORDER BY "Created Date" DESC;

-- Confirm no orphaned threads remain
SELECT COUNT(*) as orphaned_threads
FROM thread t
WHERE t."Proposal" IS NULL
AND EXISTS (
  SELECT 1 FROM proposal p
  WHERE t.host_user_id = p."Host User"
    AND t.guest_user_id = p."Guest"
    AND t."Listing" = p."Listing"
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/proposal/actions/accept_counteroffer.ts` | Add fallback thread lookup strategies |
| `supabase/functions/proposal/actions/create.ts` | Ensure thread Proposal FK is set |
| `supabase/functions/_shared/messagingHelpers.ts` | Update findOrCreateProposalThread to validate FK |
| `supabase/migrations/20260131_thread_proposal_fk_trigger.sql` | New - Auto-sync trigger |
| `.claude/scripts/reconnect-supabase-mcp.ps1` | New - MCP reconnection script |

---

## Success Criteria

All 4 acceptance criteria must pass:

| Criterion | Validation |
|-----------|------------|
| 1. Message Generation | 2 messages exist in `_message` table after acceptance |
| 2. Lease Record Creation | Lease exists with correct `proposal_id` |
| 3. Lease Date Accuracy | `move_in_date` and `move_out_date` match reservation |
| 4. Agreement Number | `agreement_number` is not null and follows `SL-XXX` format |

---

## References

- Original debug prompt: `.claude/plans/New/20260130-counteroffer-e2e-autonomous-debug-prompt.md`
- Messaging helpers: `supabase/functions/_shared/messagingHelpers.ts`
- Thread table schema: See `DATABASE_RELATIONS.md`
- Proposal visibility fix: Committed in this session (query by Guest field)
