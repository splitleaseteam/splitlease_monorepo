# Implementation Plan: Payment Records Regeneration

**Date**: 2026-02-02
**Status**: New
**Priority**: High

---

## Problem Statement

The `handleRegeneratePaymentRecords` function in `leases-admin/index.ts` is currently a placeholder that returns success without creating any payment records. This causes the UI to show "Payment records regenerated successfully" but no records appear in the database.

## Current State

**File**: `supabase/functions/leases-admin/index.ts` (lines 721-744)

```typescript
async function handleRegeneratePaymentRecords(
  payload: { leaseId: string; type: 'guest' | 'host' | 'all' },
  _supabase: SupabaseClient
) {
  // This is a placeholder - actual implementation would:
  // 1. Get lease details (dates, amounts)
  // 2. Calculate payment schedule based on weekly/monthly schedule
  // 3. Delete existing records of specified type
  // 4. Create new records

  console.log(`[leases-admin] Regenerate payment records requested...`);

  return {
    message: `Payment record regeneration for ${type} initiated`,
    leaseId,
    type,
  };
}
```

## Available Edge Functions

We have two Edge Functions that handle payment record generation:

### 1. `guest-payment-records` Edge Function
- **Path**: `supabase/functions/guest-payment-records/`
- **Action**: `generate`
- **Purpose**: Creates payment records for guest-to-SplitLease payments
- **Payload**: `{ leaseId: string }`

### 2. `host-payment-records` Edge Function
- **Path**: `supabase/functions/host-payment-records/`
- **Action**: `generate`
- **Purpose**: Creates payment records for SplitLease-to-host payouts
- **Payload**: `{ leaseId: string }`

## Implementation Approach

### Step 1: Update Function Signature

Keep the existing signature but implement actual logic:

```typescript
async function handleRegeneratePaymentRecords(
  payload: { leaseId: string; type: 'guest' | 'host' | 'all' },
  _supabase: SupabaseClient
) {
  const { leaseId, type } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  const results = {
    guest: null as any,
    host: null as any,
  };

  // Implementation continues...
}
```

### Step 2: Call Edge Functions Based on Type

#### Option A: Direct Supabase Client Call (RECOMMENDED)

Since we're already inside an Edge Function with a Supabase client, we should call the generation functions directly rather than making HTTP requests to other Edge Functions.

**Import the generation functions**:
```typescript
// At top of file
import { generateGuestPaymentRecords } from '../guest-payment-records/handlers/generate.ts';
import { generateHostPaymentRecords } from '../host-payment-records/handlers/generate.ts';
```

**Call them directly**:
```typescript
try {
  if (type === 'guest' || type === 'all') {
    results.guest = await generateGuestPaymentRecords(leaseId, _supabase);
  }

  if (type === 'host' || type === 'all') {
    results.host = await generateHostPaymentRecords(leaseId, _supabase);
  }

  return {
    success: true,
    leaseId,
    type,
    results,
  };
} catch (error) {
  console.error('[leases-admin] Regenerate payment records error:', error);
  throw new Error(`Failed to regenerate payment records: ${error.message}`);
}
```

#### Option B: HTTP Fetch to Other Edge Functions (ALTERNATIVE)

If direct imports aren't feasible, make HTTP requests:

```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (type === 'guest' || type === 'all') {
  const response = await fetch(`${supabaseUrl}/functions/v1/guest-payment-records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'generate', payload: { leaseId } }),
  });

  if (!response.ok) {
    throw new Error(`Guest payment records generation failed: ${response.statusText}`);
  }

  results.guest = await response.json();
}
```

### Step 3: Handle Errors Gracefully

```typescript
try {
  // Generation logic
} catch (error) {
  console.error('[leases-admin] Regenerate payment records error:', error);

  // Return partial success if one type succeeded
  if (results.guest || results.host) {
    return {
      success: true,
      partial: true,
      leaseId,
      type,
      results,
      error: error.message,
    };
  }

  throw error;
}
```

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `supabase/functions/leases-admin/index.ts` | Implement `handleRegeneratePaymentRecords` | 721-744 |
| `supabase/functions/guest-payment-records/handlers/generate.ts` | Verify exported function signature | All |
| `supabase/functions/host-payment-records/handlers/generate.ts` | Verify exported function signature | All |

## Testing Checklist

### Prerequisites
1. Ensure lease has valid dates (`Reservation Period : Start`, `Reservation Period : End`)
2. Ensure lease has financial data (`Total Rent`, `Total Compensation`)

### Test Cases

#### Test 1: Regenerate All Payment Records
```bash
# Call leases-admin with regeneratePaymentRecords action
POST /functions/v1/leases-admin
{
  "action": "regeneratePaymentRecords",
  "payload": {
    "leaseId": "1770065642307x99880398547353136",
    "type": "all"
  }
}

# Expected:
# - Guest payment records created in paymentrecords table
# - Host payment records created in paymentrecords table
# - Response includes success: true and counts
```

#### Test 2: Regenerate Guest Records Only
```bash
POST /functions/v1/leases-admin
{
  "action": "regeneratePaymentRecords",
  "payload": {
    "leaseId": "1770065642307x99880398547353136",
    "type": "guest"
  }
}

# Expected: Only guest payment records created
```

#### Test 3: Error Handling
```bash
# Test with invalid lease ID
POST /functions/v1/leases-admin
{
  "action": "regeneratePaymentRecords",
  "payload": {
    "leaseId": "invalid",
    "type": "all"
  }
}

# Expected: Error thrown with clear message
```

## Success Criteria

- ✅ Function calls existing Edge Functions correctly
- ✅ Guest payment records are created in `paymentrecords` table
- ✅ Host payment records are created in `paymentrecords` table
- ✅ Records are linked to lease via `Booking - Reservation` FK
- ✅ UI displays created records after refresh
- ✅ Errors are handled gracefully with clear messages

## Deployment Steps

1. Implement changes in `leases-admin/index.ts`
2. Test locally if possible (use `supabase functions serve`)
3. Deploy: `supabase functions deploy leases-admin`
4. Test on dev project with real lease ID
5. Verify records appear in UI

## Rollback Plan

If implementation fails:
1. Revert to placeholder function
2. Redeploy `leases-admin`
3. Document failure reason
4. Investigate Edge Function logs

---

## Alternative: Keep Placeholder and Call from Frontend

If Edge Function imports prove problematic, we could:
1. Keep `handleRegeneratePaymentRecords` as placeholder
2. Update frontend to call `guest-payment-records` and `host-payment-records` directly
3. Remove the "Regenerate ALL" button from UI

**Pros**: Simpler implementation, no Edge Function coupling
**Cons**: More frontend complexity, multiple HTTP requests

---

## Related Files

- `supabase/functions/leases-admin/index.ts`
- `supabase/functions/guest-payment-records/index.ts`
- `supabase/functions/guest-payment-records/handlers/generate.ts`
- `supabase/functions/host-payment-records/index.ts`
- `supabase/functions/host-payment-records/handlers/generate.ts`
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js`

---

**Next Steps**: Review plan and proceed with implementation using recommended Option A (direct function imports).
