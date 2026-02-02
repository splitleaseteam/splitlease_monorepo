# Lease Acceptance Flow Debugging Plan

**Created**: 2026-02-02
**Type**: DEBUG
**Scope**: Counteroffer acceptance flow - payment records, stays, documents generation
**Priority**: CRITICAL

---

## Problem Summary

The lease creation acceptance flow (counteroffer acceptance via `/lease` Edge Function) fails to:
1. Generate payment records (guest and host)
2. Create stay records
3. Generate lease documents
4. Display Guest/Host/Listing names correctly in UI (shows "Unknown")

The lease record IS created, but downstream operations fail silently or throw database errors due to schema mismatches.

---

## Root Cause Analysis

### 1. Payment Records - Schema Mismatch (CONFIRMED)

**Location**:
- `supabase/functions/guest-payment-records/handlers/generate.ts:164`
- `supabase/functions/host-payment-records/handlers/generate.ts:165`

**Issue**: Column name has SPACE in database, code uses UNDERSCORE

```typescript
// CODE (WRONG)
source_calculation: 'supabase-edge-function',

// DATABASE (CORRECT)
"source calculation" (with space)
```

**Impact**: INSERT operations fail with:
```
Error: column "source_calculation" does not exist
```

**Verification**: Database schema documentation shows spaces in column names (Bubble convention):
- From `DATABASE_TABLES_DETAILED.md`: Bubble tables use space-separated columns requiring quoting
- Column name: `"source calculation"` (NOT `source_calculation`)

---

### 2. Document Generation - Wrong Table Name (CONFIRMED)

**Location**: `supabase/functions/leases-admin/index.ts:1148`

**Issue**: Queries non-existent table

```typescript
// CODE (WRONG)
.from('bookings_date_change_requests')

// DATABASE (CORRECT)
.from('datechangerequest')
```

**Impact**: `getDocumentChangeRequests` action fails
- Cascades to document generation failures
- Lease marked as `were documents generated? = false`

**Verification**: From `DATABASE_RELATIONS.md`:
- Correct table name: `datechangerequest`
- No table named `bookings_date_change_requests` exists

---

### 3. Stays Not Created (SUSPECTED CASCADE FAILURE)

**Location**: `supabase/functions/lease/lib/staysGenerator.ts`

**Analysis**:
- Code structure appears correct (lines 1-123 reviewed)
- Uses proper column names: `"Dates - List of dates in this period"`, `"Check In (night)"`, `"Last Night (night)"`
- Likely failing due to:
  1. **Missing date data**: Payment records fail → dates not generated → stays have no date arrays
  2. **Similar schema mismatch**: Need to verify `bookings_stays` table schema

**Requires Investigation**:
- Check if `bookings_stays` table has similar space vs underscore issues
- Verify FK constraints on `Lease`, `listing`, `Guest`, `Host` columns
- Confirm `'Stay Status'` column exists (code uses this at line 100)

---

### 4. UI Display Issues - "Unknown" for Existing Entities

**Symptom**: Guest, Host, Listing display as "Unknown" in Manage Leases & Payment Records admin page

**Location**: `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/IdentitySection/UserIdentityCard.jsx`

**Code Analysis** (lines 40):
```jsx
const fullName = user.fullName || user['Name - Full'] ||
                 `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                 'Unknown';
```

**Root Cause**: Query does NOT expand FK references

**Suspected Issue**:
- Lease record has correct FK values: `Guest`, `Host`, `Listing` columns populated
- Admin page query does NOT join/expand these FKs
- Component receives string ID instead of user object
- `user.fullName` is undefined → falls back to 'Unknown'

**Fix Location**: Admin page query in `supabase/functions/leases-admin` action `get`
- Need to verify if query includes `.select('Guest(*), Host(*), Listing(*)')` expansion
- May need to fetch related entities separately

---

## Database Schema Reference

### paymentrecords Table

**Columns** (from `DATABASE_TABLES_DETAILED.md`):
```
_id (text, PK)
"Booking - Reservation" (text, FK → bookings_leases._id)
"Created By" (text, FK → user._id)
"Payment #" (integer)
"Scheduled Date" (timestamptz)
Rent (numeric)
"Maintenance Fee" (numeric)
"Total Paid by Guest" (numeric)
"Total Paid to Host" (numeric)
"Payment to Host?" (boolean)
"Payment from guest?" (boolean)
"source calculation" (text) ← NOTE: SPACE, not underscore
"Created Date" (timestamptz)
"Modified Date" (timestamptz)
"Damage Deposit" (numeric)
```

### datechangerequest Table

**Correct table name**: `datechangerequest` (NOT `bookings_date_change_requests`)

**Columns** (from `DATABASE_RELATIONS.md`):
```
_id (text, PK)
Lease (text, FK → bookings_leases._id)
"Requested by" (text, FK → user._id)
"Created Date" (timestamptz)
... (additional columns)
```

### bookings_stays Table

**Columns** (need verification from schema):
```
_id (text, PK)
Lease (text, FK → bookings_leases._id)
listing (text, FK → listing._id)
Guest (text, FK → user._id)
Host (text, FK → user._id)
"Week Number" (integer)
"Dates - List of dates in this period" (jsonb)
"Check In (night)" (text)
"Last Night (night)" (text)
"Stay Status" (text)
"Created Date" (timestamptz)
"Modified Date" (timestamptz)
```

**Requires Verification**:
- Confirm exact column names (spaces vs underscores)
- Verify FK constraint behavior (nullable vs required)

---

## Acceptance Flow Execution Path

### Phase 6: Payment Records Generation

**File**: `supabase/functions/lease/handlers/create.ts:289-314`

**Flow**:
```
1. Build PaymentPayload from proposal data
2. Call triggerGuestPaymentRecords(paymentPayload)
   → POST to /functions/v1/guest-payment-records
   → guest-payment-records/handlers/generate.ts:handleGenerate
   → INSERT to paymentrecords table (FAILS at line 164)
3. Call triggerHostPaymentRecords(paymentPayload)
   → POST to /functions/v1/host-payment-records
   → host-payment-records/handlers/generate.ts:handleGenerate
   → INSERT to paymentrecords table (FAILS at line 165)
```

**Current Behavior**: Both INSERT operations fail silently (wrapped in try/catch?)
**Expected**: Payment records created, lease updated with FK arrays

---

### Phase 6B: Date Generation

**File**: `supabase/functions/lease/handlers/create.ts:320-459`

**Flow**:
```
1. Extract check-in/out days from proposal (HC if counteroffer)
2. Normalize full-week proposals
3. Call generateLeaseDates() → dateGenerator.ts
4. Update proposal with generated dates
5. Update lease with dates and week count
6. Error handling: notify ops if totalNights === 0
```

**Current Behavior**: Likely succeeds (no schema mismatch identified)
**Data Quality**: Check if dates array is actually populated

---

### Phase 7: Stays Creation

**File**: `supabase/functions/lease/handlers/create.ts:465-493`

**Flow**:
```
1. Call generateStays(supabase, leaseId, guestId, hostId, listingId, dateResult)
   → lease/lib/staysGenerator.ts:generateStays
2. For each check-in date:
   a. Generate bubble ID via RPC
   b. Build stay record with dates
   c. INSERT to bookings_stays table
3. Update lease with stay ID array
```

**Current Behavior**: Likely fails due to:
- Empty dateResult from Phase 6B
- Schema mismatch in bookings_stays columns
- FK constraint violations

**Requires Investigation**: Log output from staysGenerator to confirm failure point

---

### Phase 8: Document Generation

**File**: `supabase/functions/lease/handlers/create.ts:499-570`

**Flow**:
```
1. Build document payload via buildDocumentPayload()
2. Call /functions/v1/lease-documents (Edge Function)
   → action: generate_all
3. Check if all 4 documents generated successfully
4. Update lease: "were documents generated?" = true/false
```

**Dependency**: Requires valid payment records and stays
**Current Behavior**: Fails due to missing payment records

---

### Admin Page Query (UI Display Issue)

**File**: `supabase/functions/leases-admin/index.ts` (action: `get`)

**Suspected Query**:
```typescript
// CURRENT (WRONG)
const { data: lease } = await supabase
  .from('bookings_leases')
  .select('*')
  .eq('_id', leaseId)
  .single();

// Returns: { Guest: "1234...", Host: "5678...", Listing: "9101..." }
// Component receives string IDs, not user objects
```

**Required Query**:
```typescript
// CORRECT - Expand FK references
const { data: lease } = await supabase
  .from('bookings_leases')
  .select(`
    *,
    Guest:Guest(*),
    Host:Host(*),
    Listing:Listing(*)
  `)
  .eq('_id', leaseId)
  .single();

// Returns: { Guest: { _id, "Name - Full", email }, Host: {...}, Listing: {...} }
```

**Note**: Supabase PostgREST uses `FK:FK(*)` syntax for embedded resources

---

## Fix Implementation Plan

### Fix 1: Payment Records Column Name

**Priority**: CRITICAL (blocks everything else)

**File**: `supabase/functions/guest-payment-records/handlers/generate.ts`
**Line**: 164

**Change**:
```typescript
// BEFORE
source_calculation: 'supabase-edge-function',

// AFTER
'source calculation': 'supabase-edge-function',
```

**File**: `supabase/functions/host-payment-records/handlers/generate.ts`
**Line**: 165

**Change**: Same as above

**Testing**:
```bash
# Trigger lease creation via Supabase client
POST /functions/v1/lease
{
  "action": "create",
  "payload": {
    "proposalId": "...",
    "isCounteroffer": true,
    "fourWeekRent": 2000,
    "fourWeekCompensation": 1800
  }
}

# Verify payment records created
SELECT * FROM paymentrecords WHERE "Booking - Reservation" = '<leaseId>';
```

---

### Fix 2: Document Change Requests Table Name

**Priority**: HIGH (blocks document generation)

**File**: `supabase/functions/leases-admin/index.ts`
**Line**: 1148

**Change**:
```typescript
// BEFORE
.from('bookings_date_change_requests')

// AFTER
.from('datechangerequest')
```

**Testing**:
```bash
# Call getDocumentChangeRequests action
POST /functions/v1/leases-admin
{
  "action": "getDocumentChangeRequests",
  "payload": { "leaseId": "..." }
}

# Should return date change requests without error
```

---

### Fix 3: Stays Generation (Conditional)

**Priority**: MEDIUM (depends on Fix 1 success)

**Investigation Steps**:
1. Deploy Fix 1 (payment records)
2. Trigger lease creation
3. Check logs for staysGenerator errors
4. If schema mismatch found, apply same pattern as Fix 1

**Suspected columns to verify**:
- `'Stay Status'` vs `"Stay Status"`
- `'Week Number'` vs `"Week Number"`
- Date-related columns

**Testing**:
```bash
# After lease creation, verify stays created
SELECT * FROM bookings_stays WHERE "Lease" = '<leaseId>';

# Should return N stay records (N = number of check-in dates)
```

---

### Fix 4: Admin Page FK Expansion

**Priority**: MEDIUM (UI issue, not critical flow)

**File**: Need to locate exact query location in `supabase/functions/leases-admin/index.ts`

**Investigation**: Search for action `get` handler

**Expected Change**:
```typescript
// Expand Guest, Host, Listing FKs
const { data: lease } = await supabase
  .from('bookings_leases')
  .select(`
    *,
    guestData:Guest!inner(
      _id,
      "Name - Full",
      "Name - First",
      "Name - Last",
      "email as text",
      "Profile Photo"
    ),
    hostData:Host!inner(
      _id,
      "Name - Full",
      "Name - First",
      "Name - Last",
      "email as text",
      "Profile Photo"
    ),
    listingData:Listing!inner(
      _id,
      Name
    )
  `)
  .eq('_id', leaseId)
  .single();
```

**Testing**:
```bash
# Verify admin page displays names correctly
# Navigate to Manage Leases & Payment Records page
# Select lease
# Check Identity Section shows "John Doe" not "Unknown"
```

---

## Verification Checklist

After deploying all fixes:

- [ ] **Payment Records Created**
  - [ ] Guest payment records inserted successfully
  - [ ] Host payment records inserted successfully
  - [ ] Lease updated with payment record FK arrays
  - [ ] `'source calculation'` column populated correctly

- [ ] **Stays Created**
  - [ ] Stay records inserted for each check-in date
  - [ ] Lease updated with stay FK array
  - [ ] Date arrays populated correctly

- [ ] **Documents Generated**
  - [ ] All 4 document types created
  - [ ] Lease marked `were documents generated? = true`
  - [ ] No errors in lease-documents Edge Function logs

- [ ] **UI Display Fixed**
  - [ ] Guest name displays correctly (not "Unknown")
  - [ ] Host name displays correctly (not "Unknown")
  - [ ] Listing name displays correctly (not "Unknown")

- [ ] **Edge Function Logs Clean**
  - [ ] No database errors in guest-payment-records logs
  - [ ] No database errors in host-payment-records logs
  - [ ] No table name errors in leases-admin logs
  - [ ] No FK constraint errors in lease logs

---

## Deployment Order

1. **Phase 1**: Fix payment records column names
   - Deploy `guest-payment-records` Edge Function
   - Deploy `host-payment-records` Edge Function
   - Test lease creation (verify payment records created)

2. **Phase 2**: Fix document change requests table name
   - Deploy `leases-admin` Edge Function
   - Test getDocumentChangeRequests action

3. **Phase 3**: Investigate and fix stays generation (if needed)
   - Check stays creation logs after Phase 1
   - Apply fixes if schema mismatches found
   - Deploy `lease` Edge Function

4. **Phase 4**: Fix admin page FK expansion
   - Deploy `leases-admin` Edge Function
   - Test UI display in Manage Leases & Payment Records page

---

## Rollback Plan

If any deployment breaks existing functionality:

1. **Revert Edge Function**: Use Supabase dashboard to revert to previous version
2. **Check database state**: Verify no partial records created
3. **Clean up test data**: Delete any test lease records created during debugging
4. **Review logs**: Identify unexpected errors before re-attempting fix

---

## Related Files

### Edge Functions
- `supabase/functions/guest-payment-records/handlers/generate.ts`
- `supabase/functions/host-payment-records/handlers/generate.ts`
- `supabase/functions/lease/handlers/create.ts`
- `supabase/functions/lease/lib/staysGenerator.ts`
- `supabase/functions/lease/lib/dateGenerator.ts`
- `supabase/functions/leases-admin/index.ts`

### Database Schema Documentation
- `.claude/Documentation/Database/DATABASE_TABLES_DETAILED.md`
- `.claude/Documentation/Database/DATABASE_RELATIONS.md`
- `.claude/Documentation/Database/REFERENCE_TABLES_FK_FIELDS.md`

### Frontend Components
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/IdentitySection/UserIdentityCard.jsx`
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/LeaseDetailsSection/LeaseDetailsSection.jsx`

---

## Success Criteria

The acceptance flow is fully operational when:
1. All payment records generate without database errors
2. All stay records created with correct date arrays
3. All 4 lease documents generated successfully
4. Admin page displays Guest/Host/Listing names correctly
5. Zero database errors in Edge Function logs
6. Lease status progresses to "Drafting" stage

---

**Plan Status**: READY FOR EXECUTION
**Estimated Time**: 2-3 hours (fixes + testing + verification)
**Risk Level**: LOW (schema corrections, no logic changes)
