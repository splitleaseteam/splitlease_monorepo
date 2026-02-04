# E2E Test Bug Investigation Summary

**Investigation Date**: 2026-02-02
**Session ID**: e2e-proposal-counteroffer-20260202
**Total Bugs Found**: 2
**Test Step Failed**: 3.7 (Host accepts proposal)

---

## Investigation Overview

Debug Analyst Agent investigated two bugs discovered during E2E testing of the proposal workflow. Both bugs were identified when the test attempted to have a host accept a guest proposal.

**Test Context**:
- Proposal ID: `1770050561455x12931805482580172`
- Listing: Spacious Brooklyn Loft - Test Listing B
- Status: Stuck at "awaiting-rental-application"
- Messages Created: 0 (expected 2+)

---

## Bugs Identified

### BUG-001: Proposal Workflow Requires Rental Application Before Host Acceptance

**Category**: Workflow Blocker
**Priority**: HIGH
**Blocking**: YES

**Summary**: The proposal workflow enforces that guests MUST submit a rental application before the host can review and accept the proposal. This creates a bottleneck where proposals remain stuck in "Awaiting Rental Application" status.

**Root Cause**:
- Status transition rules in `supabase/functions/proposal/lib/status.ts` do not allow direct transition from "Awaiting Rental Application" to "Accepted" status
- Rental application submission handler automatically transitions proposals to "Host Review" status (line 309 in `rental-application/handlers/submit.ts`)
- Host acceptance workflow expects proposals to be in "Host Review" or later status

**Impact**:
- Test failure (0 messages created, expected 2+)
- Proposal stuck in workflow
- Poor UX (guests forced to complete lengthy application before knowing if host is interested)

**Recommended Fix**: Update status transition rules to allow host acceptance directly from "Awaiting Rental Application" status. This is a simple one-line change that preserves flexibility while removing the bottleneck.

**Full Report**: `.claude/plans/New/20260202100000-BUG-001-proposal-workflow-rental-app-requirement.md`

---

### BUG-002: 'supabase is not defined' Error in Proposal Update Edge Function

**Category**: Edge Function Error
**Priority**: MEDIUM
**Blocking**: NO (only affects admin operations)

**Summary**: When attempting to update a proposal status from the internal admin page, a 500 error occurs with the message "supabase is not defined". This is a reference error in the `checkIsAdmin` helper function.

**Root Cause**:
- Line 437 in `supabase/functions/proposal/actions/update.ts` references `supabase` (global) instead of `_supabase` (parameter)
- Function parameter is `_supabase` (with underscore), but function body uses `supabase` (without underscore)
- The underscore prefix conventionally indicates an unused parameter, but in this case the function DOES need the parameter

**Code Bug**:
```typescript
async function checkIsAdmin(
  _supabase: SupabaseClient,  // Parameter defined with underscore
  userId: string
): Promise<boolean> {
  const { data } = await supabase  // ❌ BUG: References undefined 'supabase'
    .from("user")
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
```

**Impact**:
- Admin status updates fail with 500 error
- E2E test attempted admin update as cleanup/workaround
- Regular guest/host proposal workflows unaffected

**Recommended Fix**: Change line 437 from `supabase` to `_supabase`. This is a simple one-character fix (add underscore).

**Full Report**: `.claude/plans/New/20260202100100-BUG-002-supabase-not-defined-proposal-manage.md`

---

## Key Findings

### 1. Status Transition Architecture

The proposal workflow uses a strict state machine with explicit allowed transitions defined in `supabase/functions/proposal/lib/status.ts`. This provides safety but can create bottlenecks if the transitions are too restrictive.

**Current Transition Graph (Simplified)**:
```
Awaiting Rental Application
  → Host Review (only via rental app submission)
  → Cancelled

Host Review
  → Accepted
  → Counteroffer
  → Rejected
```

**Recommended Transition Graph**:
```
Awaiting Rental Application
  → Host Review (via rental app submission)
  → Accepted (via host acceptance)  ← ADD THIS
  → Counteroffer (via host counter)  ← ADD THIS
  → Rejected (via host rejection)     ← ADD THIS
  → Cancelled
```

### 2. Rental Application Handler Behavior

The rental application submission handler (`rental-application/handlers/submit.ts`) automatically:
1. Creates rental application record
2. Links it to user
3. **Batch updates ALL user's proposals** to "Host Review" status
4. Updates proposals table with rental application reference

This is aggressive but logical - once a guest has a rental application on file, all their proposals can proceed to host review. However, it assumes that rental application is REQUIRED before host review, which may not be the desired business logic.

### 3. Host Acceptance Workflow

The host acceptance workflow (`hostAcceptProposalWorkflow.js`) is well-designed and likely works correctly once the proposal reaches the right status. The issue is that proposals never reach the status where the host can trigger this workflow.

### 4. Parameter Naming Conventions

The use of `_` prefix for parameters is common in TypeScript to indicate intentionally unused parameters. However, this can lead to confusion when:
- A parameter is initially unused (prefixed with `_`)
- Later, the function is refactored to use the parameter
- Developer forgets to remove the `_` prefix or mistakenly references the unprefixed name

**Example of correct usage**:
```typescript
function checkIsHost(
  _supabase: SupabaseClient,  // Intentionally unused - simple equality check
  hostUserId: string,
  userId: string
): Promise<boolean> {
  return hostUserId === userId;  // No database access needed
}
```

**Example of incorrect usage**:
```typescript
async function checkIsAdmin(
  _supabase: SupabaseClient,  // Should be used, not prefixed
  userId: string
): Promise<boolean> {
  const { data } = await supabase  // ❌ BUG: Wrong variable name
    .from("user")
    .select(`"Toggle - Is Admin"`)
    .eq("_id", userId)
    .single();

  return data?.["Toggle - Is Admin"] === true;
}
```

---

## Recommendations

### Immediate Actions (Priority 1)

1. **Fix BUG-002** (Easy, fast deployment):
   - Change line 437 in `update.ts` from `supabase` to `_supabase`
   - Deploy proposal edge function
   - Test admin status updates
   - Estimated time: 5 minutes

2. **Fix BUG-001** (Requires testing, affects workflow):
   - Update status transition rules in `status.ts`
   - Verify host acceptance workflow handles missing rental application
   - Deploy proposal edge function
   - Run E2E test to verify fix
   - Estimated time: 30-60 minutes

### Medium-Term Actions (Priority 2)

3. **Add unit tests** for authorization helper functions:
   - Test `checkIsAdmin` with admin and non-admin users
   - Test `checkIsHost` with various scenarios
   - Prevent similar bugs in future

4. **Review status transition rules** for flexibility:
   - Audit all statuses and their allowed transitions
   - Identify other potential bottlenecks
   - Document the intended workflow paths

5. **Add ESLint rule** to catch unused parameters:
   - Configure `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: "^_"`
   - This allows `_` prefix for intentionally unused parameters
   - But still catches reference errors like `supabase` when only `_supabase` exists

### Long-Term Actions (Priority 3)

6. **Consider rental application workflow redesign**:
   - Should rental application be REQUIRED or OPTIONAL?
   - When should guests be prompted to submit rental application?
   - Can hosts request rental application at any stage?
   - Add "Request Rental Application" button for hosts?

7. **Add E2E test coverage** for various workflow paths:
   - Guest submits proposal WITH rental application (current happy path)
   - Guest submits proposal WITHOUT rental application (current failing path)
   - Host accepts proposal at various stages
   - Host rejects proposal at various stages
   - Guest cancels proposal at various stages

---

## Files Modified (Once Fixes Implemented)

### BUG-002 Fix
- `supabase/functions/proposal/actions/update.ts` (line 437)

### BUG-001 Fix
- `supabase/functions/proposal/lib/status.ts` (lines 22-27, 30-35)

### Deployment Commands
```bash
# Deploy proposal edge function with both fixes
supabase functions deploy proposal

# Verify deployment
supabase functions logs proposal

# Re-run E2E test
cd test-session
# [run E2E test command here]
```

---

## Conclusion

Both bugs have clear root causes and straightforward fixes:

1. **BUG-002** is a simple typo/naming error (one character change)
2. **BUG-001** is a workflow design issue (add 3 allowed status transitions)

The bugs are independent and can be fixed in any order, but fixing both together in a single deployment makes sense since they both affect the same Edge Function (`proposal`).

**Estimated Total Fix Time**: 1 hour (including testing and deployment)
**Confidence Level**: HIGH (root causes identified, fixes are simple and well-understood)

---

## Detailed Bug Reports

- **BUG-001**: `.claude/plans/New/20260202100000-BUG-001-proposal-workflow-rental-app-requirement.md`
- **BUG-002**: `.claude/plans/New/20260202100100-BUG-002-supabase-not-defined-proposal-manage.md`

---

**Investigation Completed**: 2026-02-02
**Agent**: Debug Analyst (E2E Testing Orchestrator)
**Next Steps**: Review bug reports, prioritize fixes, implement and deploy
