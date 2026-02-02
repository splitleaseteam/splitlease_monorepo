# Fix: Booked Dates Calculation for Weekly Schedule

**Date**: 2026-02-02
**Status**: New
**Priority**: High

---

## Problem Statement

The `updateBookedDates` function in `leases-admin/index.ts` incorrectly marks ALL dates between reservation start and end as booked, including check-out days and days outside the weekly schedule.

### Example Issue

**Proposal Schedule**: Sunday to Friday (check-in: Sunday, check-out: Friday)
- **Expected**: Sunday, Monday, Tuesday, Wednesday, Thursday are booked (5 nights)
- **Actual**: Sunday through Saturday are ALL marked as booked (6 nights) ❌

**Why This Is Wrong**:
1. Friday is the check-out day - guest leaves at 11:00 AM, so Friday night is NOT occupied
2. Saturday is outside the weekly schedule entirely
3. The calculation ignores `check in day` and `check out day` from the proposal

---

## Current Implementation

**File**: `supabase/functions/leases-admin/index.ts` (lines 1055-1063)

```typescript
// Generate list of booked dates
const bookedDates: string[] = [];
const current = new Date(startDate);
const end = new Date(endDate);

while (current <= end) {
  bookedDates.push(current.toISOString().split('T')[0]);
  current.setDate(current.getDate() + 1);
}
```

**Problems**:
1. ❌ Includes check-out day (last day should NOT be booked)
2. ❌ Ignores weekly schedule (check-in day and check-out day from proposal)
3. ❌ Marks all 7 days of the week instead of respecting the booking pattern

---

## Correct Algorithm

### Step 1: Get Proposal Data

The proposal contains the weekly schedule:
- `check in day`: Day of week for check-in (0=Sunday, 6=Saturday)
- `check out day`: Day of week for check-out (0=Sunday, 6=Saturday)

### Step 2: Calculate Booked Nights

For each date in the reservation period:
1. Get the day of week (0-6)
2. Check if the day falls within the booked range
3. Handle wraparound (e.g., Friday-Sunday schedule means Fri, Sat nights)

### Step 3: Day Range Logic

**Case 1: Check-in day < Check-out day** (e.g., Sunday to Friday)
```typescript
// Sunday (0) to Friday (5)
// Booked nights: Sunday, Monday, Tuesday, Wednesday, Thursday
// Rule: checkInDay <= dayOfWeek < checkOutDay
// Example: 0 <= dayOfWeek < 5
```

**Case 2: Check-in day > Check-out day** (e.g., Friday to Tuesday - wraps around weekend)
```typescript
// Friday (5) to Tuesday (2)
// Booked nights: Friday, Saturday, Sunday, Monday
// Rule: dayOfWeek >= checkInDay OR dayOfWeek < checkOutDay
// Example: dayOfWeek >= 5 OR dayOfWeek < 2
```

**Case 3: Check-in day == Check-out day** (full week, 7 nights)
```typescript
// All 7 days are booked
// Rule: true (all days)
```

---

## Implementation

### Updated Function

```typescript
async function handleUpdateBookedDates(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Get lease with proposal reference
  const { data: lease, error: leaseError } = await _supabase
    .from('bookings_leases')
    .select('_id, "Reservation Period : Start", "Reservation Period : End", Proposal')
    .eq('_id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error('Lease not found');
  }

  const startDate = lease['Reservation Period : Start'];
  const endDate = lease['Reservation Period : End'];
  const proposalId = lease.Proposal;

  if (!startDate || !endDate) {
    throw new Error('Lease does not have valid reservation dates');
  }

  // Get proposal schedule
  let checkInDay = 0; // Default to Sunday
  let checkOutDay = 6; // Default to Saturday (full week)

  if (proposalId) {
    const { data: proposal } = await _supabase
      .from('proposal')
      .select('"check in day", "check out day"')
      .eq('_id', proposalId)
      .single();

    if (proposal) {
      checkInDay = parseInt(proposal['check in day']) || 0;
      checkOutDay = parseInt(proposal['check out day']) || 6;
    }
  }

  // Generate booked dates based on weekly schedule
  const bookedDates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) { // Note: < not <= (don't include end date)
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat

    // Check if this day is within the booked schedule
    let isBooked = false;

    if (checkInDay === checkOutDay) {
      // Full week (7 nights)
      isBooked = true;
    } else if (checkInDay < checkOutDay) {
      // Normal case: e.g., Sun (0) to Fri (5) = Sun,Mon,Tue,Wed,Thu nights
      isBooked = dayOfWeek >= checkInDay && dayOfWeek < checkOutDay;
    } else {
      // Wraparound case: e.g., Fri (5) to Tue (2) = Fri,Sat,Sun,Mon nights
      isBooked = dayOfWeek >= checkInDay || dayOfWeek < checkOutDay;
    }

    if (isBooked) {
      bookedDates.push(current.toISOString().split('T')[0]);
    }

    current.setDate(current.getDate() + 1);
  }

  // Update lease with booked dates
  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'List of Booked Dates': bookedDates,
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId)
    .select()
    .single();

  if (error) {
    console.error('[leases-admin] Update booked dates error:', error);
    throw new Error(`Failed to update booked dates: ${error.message}`);
  }

  return {
    updated: true,
    datesCount: bookedDates.length,
    leaseId,
    schedule: {
      checkInDay,
      checkOutDay,
      pattern: getSchedulePattern(checkInDay, checkOutDay)
    }
  };
}

// Helper function to describe schedule
function getSchedulePattern(checkIn: number, checkOut: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (checkIn === checkOut) return 'Full week (7 nights)';
  return `${days[checkIn]} to ${days[checkOut]} schedule`;
}
```

---

## Test Cases

### Test 1: Sunday to Friday (Current Issue)
**Input**:
- Start: 2026-02-08 (Sunday)
- End: 2026-07-12 (Sunday)
- Check-in day: 0 (Sunday)
- Check-out day: 5 (Friday)

**Expected Output**:
- Booked nights: Every Sunday, Monday, Tuesday, Wednesday, Thursday between start and end
- **NOT** booked: Fridays, Saturdays
- Fridays are check-out days (guest leaves in morning)
- Saturdays are outside the schedule

**Dates should include**:
- Feb 8 (Sun) ✅
- Feb 9 (Mon) ✅
- Feb 10 (Tue) ✅
- Feb 11 (Wed) ✅
- Feb 12 (Thu) ✅
- Feb 13 (Fri) ❌ (check-out day)
- Feb 14 (Sat) ❌ (outside schedule)

### Test 2: Friday to Tuesday (Wraparound)
**Input**:
- Check-in day: 5 (Friday)
- Check-out day: 2 (Tuesday)

**Expected Output**:
- Booked nights: Friday, Saturday, Sunday, Monday
- **NOT** booked: Tuesday (check-out), Wednesday, Thursday

### Test 3: Full Week
**Input**:
- Check-in day: 0 (Sunday)
- Check-out day: 0 (Sunday) - same day means full week

**Expected Output**:
- All 7 days booked (Sunday through Saturday)

### Test 4: Weekend Only
**Input**:
- Check-in day: 5 (Friday)
- Check-out day: 1 (Monday)

**Expected Output**:
- Booked nights: Friday, Saturday, Sunday
- **NOT** booked: Monday through Thursday

---

## Verification Steps

1. **Clear existing booked dates**:
   ```sql
   UPDATE bookings_leases
   SET "List of Booked Dates" = NULL
   WHERE _id = '1770061417593x39426295880861104';
   ```

2. **Deploy updated function**:
   ```bash
   supabase functions deploy leases-admin
   ```

3. **Regenerate booked dates**:
   - Click "Create List of Booked Dates" button in UI
   - Or call Edge Function directly:
   ```json
   {
     "action": "updateBookedDates",
     "payload": { "leaseId": "1770061417593x39426295880861104" }
   }
   ```

4. **Verify calendar display**:
   - Check that only Sun-Thu are marked as booked
   - Verify Friday and Saturday are NOT marked
   - Confirm the pattern repeats correctly for all weeks

---

## Edge Cases to Consider

### 1. Partial First Week
If reservation starts mid-week (e.g., starts on Wednesday but schedule is Sun-Fri):
- Only include Wednesday, Thursday for the first week
- Don't retroactively mark Sunday, Monday, Tuesday

### 2. Partial Last Week
If reservation ends mid-week:
- Only include booked days up to the end date
- The `while (current < end)` condition handles this

### 3. Move-In vs Reservation Start
- Use `Reservation Period : Start` (move-in date)
- This is the actual start of the lease period

### 4. Check-Out Day Edge Case
Current implementation uses `< checkOutDay` which correctly excludes the check-out day.

For Sunday (0) to Friday (5):
- Day 0 (Sun): 0 >= 0 && 0 < 5 ✅ Booked
- Day 4 (Thu): 4 >= 0 && 4 < 5 ✅ Booked
- Day 5 (Fri): 5 >= 0 && 5 < 5 ❌ NOT Booked (check-out)
- Day 6 (Sat): 6 >= 0 && 6 < 5 ❌ NOT Booked (outside)

---

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `supabase/functions/leases-admin/index.ts` | Implement weekly schedule logic in `handleUpdateBookedDates` | 1027-1082 |

---

## Success Criteria

- ✅ Saturday is NOT marked as booked for Sunday-Friday schedule
- ✅ Check-out days are NOT marked as booked
- ✅ Only nights within the weekly schedule are marked
- ✅ Wraparound schedules work correctly (e.g., Fri-Tue)
- ✅ Full week schedules work correctly
- ✅ Calendar display shows correct purple highlighting

---

## Related Files

- `supabase/functions/leases-admin/index.ts` - Contains `handleUpdateBookedDates`
- `app/src/islands/pages/ManageLeasesPaymentRecordsPage/CalendarSection.jsx` - Displays booked dates

---

**Next Steps**: Implement the corrected algorithm and test with the Sunday-Friday schedule lease.
