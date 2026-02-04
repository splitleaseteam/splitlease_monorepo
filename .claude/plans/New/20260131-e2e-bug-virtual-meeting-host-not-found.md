# BUG REPORT: Virtual Meeting Request Fails - Host User Not Found

**Bug ID**: BUG-001
**Category**: Data Integrity + Error Handling
**Severity**: HIGH
**Discovered**: 2026-01-31 | E2E Test Iteration 1

---

## Summary

Virtual meeting requests fail when attempting to schedule a meeting for a listing whose host user does not exist in the database. The edge function returns a 500 error with message "Host user not found: {hostId}".

---

## Reproduction Steps

1. Sign up as a new guest
2. Browse listings and select listing ID `1751994688546x488170037532950500`
3. Create a proposal for this listing (succeeds)
4. Click "Schedule Meeting" button
5. Select 3 time slots
6. Click "Submit Request"
7. **Error**: "Host user not found: 1751994439357x308315314802680260"

---

## Error Details

**Error Message**: `Host user not found: 1751994439357x308315314802680260`

**Edge Function**: `/functions/v1/virtual-meeting` (action: `create-virtual-meeting`)

**Console Logs**:
```
[VM Service] Error response body: {success: false, error: Host user not found: 1751994439357x308315314802680260}
API Error (create-virtual-meeting): Error: Host user not found: 1751994439357x308315314802680260
```

**HTTP Status**: 500 (Internal Server Error)

---

## Root Cause Analysis

### Primary Issue: Data Integrity Violation

The listing table contains a record with:
- `listing_id`: `1751994688546x488170037532950500`
- `host_user_id`: `1751994439357x308315314802680260` (orphaned FK - user does not exist)

This is an orphaned foreign key reference. The host user was likely deleted or the listing was imported from legacy data (Bubble.io) without proper user mapping.

### Secondary Issue: Poor Error Handling

The virtual-meeting edge function does not gracefully handle the case when a host user is missing. Instead of:
- Returning a user-friendly error message
- Suggesting alternative actions (e.g., "Contact support")
- Preventing the request from being submitted in the UI

It returns a raw error that exposes internal data (host user IDs).

---

## Impact

**User Impact**: Guests cannot request virtual meetings for listings with orphaned host references. This blocks a critical part of the booking flow.

**Data Scope**: Unknown how many other listings have orphaned host_user_id values.

---

## Proposed Fixes

### Fix 1: Data Cleanup (IMMEDIATE)

**Option A**: Update the listing to reference a valid test host
```sql
-- Find valid test host user
SELECT id, email FROM user WHERE email LIKE '%testhost%' OR email LIKE '%host%' LIMIT 1;

-- Update listing to reference valid host
UPDATE listing
SET host_user_id = '{valid_host_id}'
WHERE id = '1751994688546x488170037532950500';
```

**Option B**: Delete the orphaned listing (if test data)
```sql
DELETE FROM listing WHERE id = '1751994688546x488170037532950500';
```

### Fix 2: Improve Edge Function Error Handling

**File**: `supabase/functions/virtual-meeting/index.ts`

**Change**: Add validation before attempting virtual meeting creation
```typescript
// Validate host exists before creating virtual meeting
const { data: hostUser, error: hostError } = await supabaseClient
  .from('user')
  .select('id, email')
  .eq('id', hostUserId)
  .single();

if (hostError || !hostUser) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Unable to schedule meeting. The host account is unavailable. Please contact support.',
      userFriendly: true
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Fix 3: Prevent at Proposal Creation

**File**: `app/src/islands/pages/ProposalPage.jsx` (or edge function)

**Change**: Validate host exists before allowing proposal submission
```javascript
// In proposal edge function
const { data: hostUser } = await supabaseClient
  .from('user')
  .select('id')
  .eq('id', listing.host_user_id)
  .single();

if (!hostUser) {
  throw new Error('This listing is currently unavailable. Please choose another listing.');
}
```

### Fix 4: Database Query to Find All Orphaned Listings

```sql
-- Find all listings with orphaned host_user_id
SELECT l.id, l.host_user_id, l.listing_name
FROM listing l
LEFT JOIN user u ON l.host_user_id = u.id
WHERE u.id IS NULL;
```

---

## Recommended Action (Auto-Fix Mode)

**Phase 1: Data Fix (Immediate)**
1. Query for valid test host user
2. Update listing `1751994688546x488170037532950500` to reference valid host
3. Verify update successful

**Phase 2: Code Improvement (Next Iteration)**
1. Update virtual-meeting edge function with better error handling
2. Add host validation to proposal edge function
3. Commit changes

**Phase 3: Verification**
1. Re-run E2E test Step 5 (Request Virtual Meeting)
2. Verify virtual meeting request succeeds
3. Verify confirmation message created

---

## Test Evidence

**Screenshots**:
- `virtual-meeting-error.png` - Error modal
- `message-thread-confirmation.png` - Split Bot message (messaging validation passed)

**Test Account**:
- Email: test-guest-1738321847@example.com
- Password: TestPass123!

---

## Related Files

- `supabase/functions/virtual-meeting/index.ts` - Edge function handling virtual meeting requests
- `app/src/islands/pages/GuestDashboard.jsx` - Schedule Meeting button
- Database: `listing` table, `user` table
