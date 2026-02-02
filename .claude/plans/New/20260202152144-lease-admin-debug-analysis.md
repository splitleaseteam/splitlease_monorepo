# Lease Admin Debug Analysis

**Lease ID**: `1770064177593x39426295880861104`
**Project**: `qzsmhgyojmwvtjmnrdea` (dev)
**Date**: 2026-02-02

---

## Summary of Issues

| Issue | Root Cause | Fix Location |
|-------|------------|--------------|
| 1. updateBookedDates 500 error | Column name mismatch: Edge Function uses `'Booked Dates'` but table column is `'List of Booked Dates'` | `supabase/functions/leases-admin/index.ts` |
| 2. N/A for guest/host email | Edge Function select uses `"email as text"` alias but adapter expects `email` field | `supabase/functions/leases-admin/index.ts` |
| 3. "Unnamed Listing" | Edge Function only selects `_id, Name` but uses table name `Listing` (uppercase) which doesn't exist; correct table is `listing` (lowercase) | `supabase/functions/leases-admin/index.ts` |
| 4. Check-in/Check-out not set | Lease table doesn't have check-in/check-out day fields; they come from proposal | Need to fetch proposal and extract `check in day` / `check out day` |
| 5. Proposal ID not showing | Edge Function `handleGet` doesn't return proposal object, only sets lease.Proposal | Frontend adapter sets `proposal: row.proposal ? { id: row.proposal._id } : null` but `row.proposal` is undefined |

---

## Detailed Analysis

### Issue 1: updateBookedDates 500 Error

**Root Cause**: Column name mismatch in `handleUpdateBookedDates`.

**Evidence**:
```typescript
// Current code (WRONG) - line 1068-1069
.update({
  'Booked Dates': bookedDates,
  'Modified Date': new Date().toISOString(),
})
```

**Database Schema**:
```
column_name: "List of Booked Dates"
data_type: jsonb
```

**Fix**: Change `'Booked Dates'` to `'List of Booked Dates'`.

---

### Issue 2: N/A for Guest/Host Email

**Root Cause**: The `handleGet` function selects user data with a column alias that doesn't map correctly.

**Current Code** (line 377-378):
```typescript
.select('_id, "Name - Full", "Name - First", "Name - Last", "email as text", "Profile Photo"')
```

The select uses `"email as text"` which creates a field named `email as text` in the result.

**Frontend Adapter** (`adaptUserFromSupabase`):
```javascript
email: user.email || user.Email || null,
```

The adapter looks for `email` or `Email`, but gets `email as text`.

**Database has**:
```
Guest user: { "email as text": "terrencegrey@test.com", "email": "terrencegrey@test.com" }
```

The `user` table has BOTH `email` and `email as text` columns. The Edge Function should select `email` instead.

**Fix**: Change select to `'_id, "Name - Full", "Name - First", "Name - Last", email, "Profile Photo"'`

---

### Issue 3: "Unnamed Listing" Display

**Root Cause**: The Edge Function uses the wrong table name `Listing` (uppercase) instead of `listing` (lowercase).

**Current Code** (line 394-398):
```typescript
const { data } = await _supabase
  .from('Listing')  // WRONG - should be lowercase 'listing'
  .select('_id, Name')
  .eq('_id', lease.Listing)
  .single();
```

**Database**:
- Table is named `listing` (lowercase)
- Column is named `Name`

**Verification**: Query succeeded when using lowercase table name:
```sql
SELECT _id, "Name" FROM listing WHERE _id = '1769120385890x40357546134144976';
-- Result: { "_id": "1769120385890x40357546134144976", "Name": "1 BR Entire Place - Test" }
```

**Fix**: Change `'Listing'` to `'listing'` in the from clause.

---

### Issue 4: Check-in/Check-out Not Set

**Root Cause**: The lease table doesn't store check-in/check-out day fields. These come from the proposal.

**Lease Table Schema** - NO check-in/check-out columns:
```
"Reservation Period : Start" - text (date)
"Reservation Period : End" - text (date)
```

**Proposal Table Schema** - HAS check-in/check-out:
```
"check in day" - text (day index as string: "0" = Sunday)
"check out day" - text (day index as string: "5" = Friday)
"hc check in day" - text (host counteroffer version)
"hc check out day" - text (host counteroffer version)
```

**Current lease data**:
```json
{
  "Proposal": "1769130751870x21602817865937584",
  "Reservation Period : Start": "2026-02-09T00:00:00+00:00",
  "Reservation Period : End": "2026-07-12T00:00:00.000Z"
}
```

**Related proposal data**:
```json
{
  "check in day": "0",
  "check out day": "5",
  "hc check in day": "0",
  "hc check out day": "5"
}
```

**Frontend expects** (`ReservationDatesCard.jsx`):
```jsx
{getDayName(lease.checkInDay)}
{getDayName(lease.checkOutDay)}
```

**Adapter** (`adaptLeaseFromSupabase.js`) - Does NOT extract check-in/check-out:
```javascript
// No checkInDay or checkOutDay mapping exists
```

**Fix**:
1. In `handleGet`, fetch the proposal and include check-in/check-out fields
2. Update `adaptLeaseFromSupabase.js` to handle the new fields

---

### Issue 5: Proposal ID Not Showing

**Root Cause**: The frontend displays `proposal.id` but the Edge Function doesn't return a `proposal` object with the details.

**Frontend Code** (`LeaseDetailsSection.jsx` line 115):
```jsx
<span className="mlpr-detail-value mlpr-id">{proposal.id || 'N/A'}</span>
```

**Frontend extracts proposal** (line 46):
```javascript
const proposal = lease.proposal || {};
```

**Adapter** (`adaptLeaseFromSupabase.js` line 86):
```javascript
proposal: row.proposal ? { id: row.proposal._id } : null,
```

The adapter expects `row.proposal` (a joined object), but the Edge Function only stores the proposal ID in `lease.Proposal` (a string), not a full proposal object.

**Edge Function `handleGet`** returns:
```javascript
return {
  ...lease,  // lease.Proposal = "1769130751870x21602817865937584" (string)
  guest: guestData,
  host: hostData,
  listing: listingData,
  stays: stays || []
  // NO proposal object is added
};
```

**Fix**:
1. Add proposal fetch in `handleGet`
2. Return it as `proposal: proposalData`
3. Update adapter to also handle `proposalId: row.Proposal || null` as backup

---

## Required Code Changes

### File 1: `supabase/functions/leases-admin/index.ts`

#### Fix 1: updateBookedDates column name (lines 1066-1075)
```typescript
// BEFORE
.update({
  'Booked Dates': bookedDates,
  'Modified Date': new Date().toISOString(),
})

// AFTER
.update({
  'List of Booked Dates': bookedDates,
  'Modified Date': new Date().toISOString(),
})
```

#### Fix 2: clearBookedDates column name (lines 1105-1109)
```typescript
// BEFORE
.update({
  'Booked Dates': [],
  'Booked Dates After Request': [],
  'Modified Date': new Date().toISOString(),
})

// AFTER
.update({
  'List of Booked Dates': [],
  'List of Booked Dates after Requests': [],
  'Modified Date': new Date().toISOString(),
})
```

#### Fix 3: handleGet user select - fix email field (lines 377 and 386)
```typescript
// BEFORE
.select('_id, "Name - Full", "Name - First", "Name - Last", "email as text", "Profile Photo"')

// AFTER
.select('_id, "Name - Full", "Name - First", "Name - Last", email, "Profile Photo"')
```

#### Fix 4: handleGet listing table name (line 395)
```typescript
// BEFORE
.from('Listing')

// AFTER
.from('listing')
```

#### Fix 5: handleGet - add proposal fetch and include check-in/check-out
Add after listing fetch (around line 401):
```typescript
let proposalData = null;
if (lease.Proposal) {
  const { data } = await _supabase
    .from('proposal')
    .select('_id, "check in day", "check out day", "hc check in day", "hc check out day", Status')
    .eq('_id', lease.Proposal)
    .single();
  proposalData = data;
}

// Update return statement to include proposal
return {
  ...lease,
  guest: guestData,
  host: hostData,
  listing: listingData,
  proposal: proposalData,  // ADD THIS
  stays: stays || []
};
```

### File 2: `app/src/logic/processors/leases/adaptLeaseFromSupabase.js`

#### Fix: Add check-in/check-out and proposal handling
```javascript
// Around line 54, add after proposalId:
checkInDay: row.proposal?.['hc check in day'] != null
  ? parseInt(row.proposal['hc check in day'])
  : (row.proposal?.['check in day'] != null ? parseInt(row.proposal['check in day']) : null),
checkOutDay: row.proposal?.['hc check out day'] != null
  ? parseInt(row.proposal['hc check out day'])
  : (row.proposal?.['check out day'] != null ? parseInt(row.proposal['check out day']) : null),

// Update proposal mapping (line 86):
proposal: row.proposal ? {
  id: row.proposal._id,
  status: row.proposal.Status || null,
  checkInDay: row.proposal['hc check in day'] != null
    ? parseInt(row.proposal['hc check in day'])
    : (row.proposal['check in day'] != null ? parseInt(row.proposal['check in day']) : null),
  checkOutDay: row.proposal['hc check out day'] != null
    ? parseInt(row.proposal['hc check out day'])
    : (row.proposal['check out day'] != null ? parseInt(row.proposal['check out day']) : null),
} : null,
```

---

## Files to Modify

1. `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\leases-admin\index.ts`
2. `c:\Users\Split Lease\Documents\Split Lease\app\src\logic\processors\leases\adaptLeaseFromSupabase.js`

---

## Testing Checklist

After implementing fixes:

1. [ ] Test `updateBookedDates` action - should succeed without 500 error
2. [ ] Test `clearBookedDates` action - should succeed
3. [ ] Verify guest email displays correctly (not N/A)
4. [ ] Verify host email displays correctly (not N/A)
5. [ ] Verify listing name displays correctly (not "Unnamed Listing")
6. [ ] Verify check-in day shows correctly (should show "Sunday")
7. [ ] Verify check-out day shows correctly (should show "Friday")
8. [ ] Verify Proposal ID displays correctly

---

## Notes

- The Edge Function uses soft headers pattern (no auth required for internal admin page)
- The `listing` table name is lowercase in Supabase
- Check-in/check-out days use 0-indexed format (0 = Sunday, 6 = Saturday)
- For counteroffers, use `hc_*` fields if present, otherwise fall back to original fields
