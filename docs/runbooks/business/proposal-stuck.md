# Proposal Stuck Issues

## Overview

This runbook covers troubleshooting and resolving issues where proposals are stuck in an incorrect state, not advancing through the workflow, or showing inconsistent data between Supabase and Bubble.

## Prerequisites

- Access to Supabase Dashboard
- Access to Bubble Admin
- Access to Edge Function logs
- Understanding of proposal lifecycle

## Proposal Lifecycle

```
DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED/REJECTED
                                          ↓
                              PENDING_PAYMENT → CONFIRMED
                                          ↓
                                      ACTIVE → COMPLETED
```

Valid status transitions:
| From | To |
|------|-----|
| draft | submitted |
| submitted | pending_review |
| pending_review | approved, rejected |
| approved | pending_payment |
| pending_payment | confirmed, cancelled |
| confirmed | active, cancelled |
| active | completed |

## Common Issues

### Issue: Proposal Stuck in "Submitted"

**Symptoms:**
- Proposal shows "submitted" indefinitely
- Host hasn't received notification
- No progress after submission

**Diagnosis:**
```sql
-- Check proposal details
SELECT _id, status, created_at, updated_at, host_id, guest_id, listing_id
FROM proposal
WHERE _id = '<proposal_id>';

-- Check if notification was created
SELECT * FROM notification
WHERE proposal_id = '<proposal_id>'
ORDER BY created_at DESC;

-- Check sync queue
SELECT * FROM sync_queue
WHERE record_id = '<proposal_id>'
ORDER BY created_at DESC;
```

**Resolution:**

1. **If notification missing:**
   - Trigger notification manually:
   ```bash
   curl -X POST https://<project-id>.supabase.co/functions/v1/communications \
     -H "Authorization: Bearer <service-role-key>" \
     -H "Content-Type: application/json" \
     -d '{"action": "notify_host_new_proposal", "payload": {"proposal_id": "<id>"}}'
   ```

2. **If status should advance:**
   ```sql
   UPDATE proposal
   SET status = 'pending_review',
       updated_at = NOW()
   WHERE _id = '<proposal_id>';
   ```

3. **If sync to Bubble failed:**
   - Check sync_queue for errors
   - Retry sync manually

---

### Issue: Proposal Approved but Not Moving to Payment

**Symptoms:**
- Host approved proposal
- Guest can't pay
- Status stuck on "approved"

**Diagnosis:**
```sql
SELECT _id, status, payment_status, total_price
FROM proposal
WHERE _id = '<proposal_id>';
```

**Resolution:**

1. **Verify approval recorded:**
   ```sql
   SELECT * FROM proposal_action
   WHERE proposal_id = '<proposal_id>'
   AND action_type = 'approve'
   ORDER BY created_at DESC;
   ```

2. **If approval recorded but status wrong:**
   ```sql
   UPDATE proposal
   SET status = 'pending_payment',
       updated_at = NOW()
   WHERE _id = '<proposal_id>';
   ```

3. **If pricing not calculated:**
   - Check if total_price is set
   - Recalculate pricing if needed

---

### Issue: Payment Received but Proposal Not Confirmed

**Symptoms:**
- Guest paid successfully
- Proposal still shows "pending_payment"
- See also: [payment-issues.md](payment-issues.md)

**Diagnosis:**
```sql
-- Check payment record
SELECT * FROM payment
WHERE proposal_id = '<proposal_id>';

-- Check proposal status
SELECT _id, status, payment_status
FROM proposal
WHERE _id = '<proposal_id>';
```

**Resolution:**

1. **If payment record exists:**
   ```sql
   UPDATE proposal
   SET status = 'confirmed',
       payment_status = 'paid',
       updated_at = NOW()
   WHERE _id = '<proposal_id>';
   ```

2. **If payment record missing:**
   - Check Stripe for successful payment
   - Create payment record manually
   - Then update proposal

3. **Trigger any missed automations:**
   - Confirmation email to guest
   - Notification to host

---

### Issue: Proposal Shows Different Status in Supabase vs Bubble

**Symptoms:**
- Supabase shows one status
- Bubble shows different status
- Users confused by inconsistency

**Diagnosis:**
```sql
-- Check Supabase status
SELECT _id, status, bubble_id
FROM proposal
WHERE _id = '<proposal_id>';

-- Check sync queue for pending/failed
SELECT * FROM sync_queue
WHERE table_name = 'proposal'
AND record_id = '<proposal_id>'
ORDER BY created_at DESC;
```

**Resolution:**

1. **If sync item failed:**
   - Check error message
   - Fix any data issues
   - Retry sync:
   ```bash
   curl -X POST https://<project-id>.supabase.co/functions/v1/bubble_sync \
     -H "Authorization: Bearer <service-role-key>" \
     -H "Content-Type: application/json" \
     -d '{"action": "sync_single", "payload": {"table": "proposal", "record_id": "<id>"}}'
   ```

2. **If sync item pending:**
   - Trigger queue processing

3. **If no sync item:**
   - May need to manually create sync entry
   - Or update Bubble directly (last resort)

---

### Issue: Proposal Cannot Be Cancelled

**Symptoms:**
- User wants to cancel
- System doesn't allow cancellation
- Error message about status

**Diagnosis:**
```sql
SELECT _id, status, start_date
FROM proposal
WHERE _id = '<proposal_id>';
```

**Resolution:**

1. **Check if cancellation is allowed:**
   - Some statuses can't be cancelled (completed, already cancelled)
   - Check cancellation policy dates

2. **Force cancellation if appropriate:**
   ```sql
   UPDATE proposal
   SET status = 'cancelled',
       cancelled_at = NOW(),
       cancellation_reason = 'Admin cancelled - <reason>',
       updated_at = NOW()
   WHERE _id = '<proposal_id>';
   ```

3. **Handle refund if payment was made:**
   - See [payment-issues.md](payment-issues.md)

---

### Issue: Proposal Dates Conflict

**Symptoms:**
- User can't submit proposal
- "Dates unavailable" error
- But dates appear available on listing

**Diagnosis:**
```sql
-- Check existing proposals for this listing
SELECT _id, status, start_date, end_date
FROM proposal
WHERE listing_id = '<listing_id>'
AND status NOT IN ('cancelled', 'rejected', 'draft')
ORDER BY start_date;

-- Check listing availability
SELECT available_days
FROM listing
WHERE _id = '<listing_id>';
```

**Resolution:**

1. **If conflicting proposal exists:**
   - Dates are legitimately unavailable
   - User needs different dates

2. **If no conflict but error persists:**
   - Check availability calculation logic
   - May be a bug in date overlap detection
   - Temporarily disable check if urgent

3. **If stale data:**
   - Refresh listing availability cache
   - Recalculate available dates

---

### Issue: Proposal Missing Required Data

**Symptoms:**
- Proposal created but incomplete
- Missing guest info, dates, or pricing

**Diagnosis:**
```sql
SELECT
    _id,
    guest_id,
    listing_id,
    start_date,
    end_date,
    total_price,
    created_at
FROM proposal
WHERE _id = '<proposal_id>';
```

**Resolution:**

1. **If recently created:**
   - Check for partial creation failure
   - May need to complete creation

2. **If data should exist:**
   ```sql
   UPDATE proposal
   SET start_date = '<date>',
       end_date = '<date>',
       total_price = <amount>,
       updated_at = NOW()
   WHERE _id = '<proposal_id>';
   ```

3. **Validate data integrity:**
   - Ensure all foreign keys are valid
   - Check guest and listing exist

---

### Issue: Proposal Thread/Messages Missing

**Symptoms:**
- Proposal exists but no message thread
- Users can't communicate about proposal

**Diagnosis:**
```sql
-- Check for thread
SELECT * FROM thread
WHERE proposal_id = '<proposal_id>';

-- Check for messages
SELECT * FROM message
WHERE thread_id IN (
    SELECT _id FROM thread WHERE proposal_id = '<proposal_id>'
);
```

**Resolution:**

1. **Create thread if missing:**
   ```bash
   curl -X POST https://<project-id>.supabase.co/functions/v1/messages \
     -H "Authorization: Bearer <service-role-key>" \
     -H "Content-Type: application/json" \
     -d '{"action": "create_proposal_thread", "payload": {"proposal_id": "<id>"}}'
   ```

2. **Or create manually:**
   ```sql
   INSERT INTO thread (_id, proposal_id, host_id, guest_id, listing_id, created_at)
   SELECT
       gen_random_uuid(),
       _id,
       host_id,
       guest_id,
       listing_id,
       NOW()
   FROM proposal
   WHERE _id = '<proposal_id>';
   ```

---

## Bulk Operations

### Find All Stuck Proposals

```sql
-- Proposals stuck in transient states for too long
SELECT _id, status, created_at, updated_at
FROM proposal
WHERE status IN ('submitted', 'pending_review', 'pending_payment')
AND updated_at < NOW() - INTERVAL '7 days'
ORDER BY updated_at;
```

### Mass Status Update (Use Carefully)

```sql
-- Only do this after careful review!
UPDATE proposal
SET status = 'cancelled',
    cancellation_reason = 'Bulk cleanup - stale proposal',
    updated_at = NOW()
WHERE status = 'pending_payment'
AND updated_at < NOW() - INTERVAL '30 days';
```

## Verification

After resolving any proposal issue:

1. **Check proposal state:**
```sql
SELECT * FROM proposal WHERE _id = '<proposal_id>';
```

2. **Check related records:**
```sql
-- Thread exists
SELECT * FROM thread WHERE proposal_id = '<proposal_id>';

-- Payment if applicable
SELECT * FROM payment WHERE proposal_id = '<proposal_id>';

-- Actions recorded
SELECT * FROM proposal_action WHERE proposal_id = '<proposal_id>';
```

3. **Verify sync status:**
```sql
SELECT * FROM sync_queue WHERE record_id = '<proposal_id>';
```

4. **User confirms resolution:**
   - Can view proposal correctly
   - Can take expected actions

## Escalation

| Issue | Escalate To |
|-------|-------------|
| System-wide proposal issues | Engineering Lead |
| Payment-related stuck | See payment-issues.md |
| Data corruption | Database Admin |
| Urgent user escalation | Engineering Lead + Customer Support |

## Related Runbooks

- [payment-issues.md](payment-issues.md) - Payment problems
- [new-user-issues.md](new-user-issues.md) - User account issues
- [../incidents/outage-bubble-sync.md](../incidents/outage-bubble-sync.md) - Sync issues
- [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md) - Function issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
