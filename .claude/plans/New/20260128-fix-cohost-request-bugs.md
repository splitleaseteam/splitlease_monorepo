# Plan: Fix Cohost Request Bugs

**Created**: 2026-01-28
**Priority**: Medium
**Estimated Effort**: 1-2 hours

---

## Background

E2E testing of the cohost request flow revealed 4 bugs. The most critical is a status casing inconsistency that prevents admin action buttons from appearing on new requests.

---

## Bugs to Fix

### Bug #1 & #2: Status Casing Inconsistency (CRITICAL)

**Problem**:
- New cohost requests are saved with `status: "pending"` (lowercase)
- Admin dashboard checks for `status === "Pending"` (capitalized)
- Result: New requests missing "Assign Co-Host" and "Close" buttons
- Admin overview shows TWO categories: "Pending" (14) and "pending" (2)

**Investigation Steps**:
1. Find where cohost requests are created:
   ```bash
   # Search for cohost request creation
   grep -r "cohost" --include="*.js" --include="*.jsx" --include="*.ts" app/src/
   grep -r "pending" --include="*.js" --include="*.jsx" app/src/islands/
   ```

2. Find the Edge Function that handles cohost request creation:
   ```bash
   grep -r "cohost" supabase/functions/
   ```

3. Check the admin dashboard status logic:
   ```bash
   grep -r "Pending" --include="*.jsx" app/src/islands/pages/
   ```

**Fix Options**:
- Option A: Change creation code to use `"Pending"` (capitalized)
- Option B: Update admin dashboard to handle both cases (case-insensitive)
- Option C: Normalize existing data + fix creation code

**Recommended**: Option A + data migration for existing lowercase entries

---

### Bug #3: Subject Shows "No subject"

**Problem**:
- User selects topic "Setting up my listing"
- Topic is saved to Notes field as `"Topics: Setting up my listing"`
- Subject field remains empty, displays "No subject"

**Investigation Steps**:
1. Find the cohost request form component
2. Check what fields are sent on submission
3. Ensure `subject` field is populated from topic selection

**Fix**: Map the selected topic to the `subject` field before saving

---

### Bug #4: Host Overview Banner Not Updating

**Problem**:
- After submitting a cohost request, Host Overview still shows "Ask a Specialist Co-host!" banner
- Should show "Request Pending" or hide the banner

**Investigation Steps**:
1. Find the Host Overview page component
2. Check if it queries for existing cohost requests
3. Add conditional rendering based on pending request status

**Fix**: Query for pending cohost requests and conditionally render banner

---

## Implementation Plan

### Step 1: Fix Status Casing (Bug #1 & #2)

```javascript
// Find and update the status value in creation code
// FROM:
status: "pending"

// TO:
status: "Pending"
```

### Step 2: Data Migration for Existing Records

```sql
-- Fix existing lowercase status values
UPDATE cohost_request
SET status = 'Pending'
WHERE status = 'pending';
```

### Step 3: Fix Subject Field (Bug #3)

```javascript
// In the form submission handler, add:
const requestData = {
  // ... other fields
  subject: selectedTopic, // Add this mapping
  notes: `Topics: ${selectedTopic}\n${additionalNotes}`
};
```

### Step 4: Fix Banner Logic (Bug #4)

```javascript
// In Host Overview, add query for pending requests
const { data: pendingRequests } = await supabase
  .from('cohost_request')
  .select('_id')
  .eq('host_user', userId)
  .eq('status', 'Pending')
  .limit(1);

// Conditionally render banner
{!pendingRequests?.length && <AskSpecialistBanner />}
```

---

## Files Likely Affected

- `app/src/islands/pages/ListingDashboardPage/` - Cohost request modal
- `app/src/islands/pages/HostOverviewPage/` - Banner logic
- `supabase/functions/cohost/` or similar - Edge Function for creation
- `app/src/islands/pages/CoHostRequestsPage/` - Admin dashboard (for reference)

---

## Verification Steps

1. Create a new cohost request
2. Check database - status should be "Pending" (capitalized)
3. Go to admin page - request should show all action buttons
4. Admin overview should show unified "Pending" count
5. Subject field should show the selected topic
6. Host Overview should reflect pending request status

---

## Test Credentials

- Host account: `splitleaserod+hosttest123567@gmail.com` / `eCom2023$`
- Admin page: `/_co-host-requests`
- Test listing ID: `1769623577179x19756690640826124`
