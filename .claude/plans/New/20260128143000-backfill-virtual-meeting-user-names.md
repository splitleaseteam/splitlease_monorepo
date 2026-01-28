# Plan: Backfill Virtual Meeting User Names

## Context

The Virtual Meetings internal page (`/_manage-virtual-meetings`) was displaying "Unknown" for guest and host names due to:
1. **Code bug** (FIXED): Edge Function queried wrong table name and column names
2. **Data gap** (THIS PLAN): 203 older records have empty flat fields (`guest name`, `host name`) but valid user references

## Problem

203 virtual meeting records have:
- Valid `guest` and/or `host` user IDs pointing to existing users in the `user` table
- Empty/NULL `guest name`, `host name`, `guest email`, `host email` flat fields
- These records were created before the denormalization pattern was implemented

## Solution

Run bulk UPDATE queries to backfill the flat fields from the `user` table.

## SQL Migration Scripts

### 1. Backfill Guest Names and Emails

```sql
UPDATE virtualmeetingschedulesandlinks v
SET
  "guest name" = TRIM(COALESCE(ug."Name - First", '') || ' ' || COALESCE(ug."Name - Last", '')),
  "guest email" = ug.email
FROM "user" ug
WHERE v.guest = ug._id
  AND (v."guest name" IS NULL OR TRIM(v."guest name") = '')
  AND ug."Name - First" IS NOT NULL;
```

### 2. Backfill Host Names and Emails

```sql
UPDATE virtualmeetingschedulesandlinks v
SET
  "host name" = TRIM(COALESCE(uh."Name - First", '') || ' ' || COALESCE(uh."Name - Last", '')),
  "host email" = uh.email
FROM "user" uh
WHERE v.host = uh._id
  AND (v."host name" IS NULL OR TRIM(v."host name") = '')
  AND uh."Name - First" IS NOT NULL;
```

## Verification Query

After running the updates, verify with:

```sql
SELECT COUNT(*) as remaining_unknown
FROM virtualmeetingschedulesandlinks v
LEFT JOIN "user" ug ON v.guest = ug._id
LEFT JOIN "user" uh ON v.host = uh._id
WHERE ((v."guest name" IS NULL OR TRIM(v."guest name") = '') AND ug."Name - First" IS NOT NULL)
   OR ((v."host name" IS NULL OR TRIM(v."host name") = '') AND uh."Name - First" IS NOT NULL);
```

Expected result: `remaining_unknown = 0`

## Expected Outcome

- **203 records** will be updated with user names from the `user` table
- **~5 truly orphaned records** will remain "Unknown" (no user data exists anywhere)
- All other meetings will display real guest/host names

## Files Changed (Code Fix - Already Applied)

| File | Change |
|------|--------|
| [fetchNewRequests.ts](supabase/functions/virtual-meeting/handlers/admin/fetchNewRequests.ts) | Fixed table name `users` → `user`, fixed column names |
| [filterMeetings.js](app/src/logic/processors/meetings/filterMeetings.js) | Added fallback to flat fields (`guest name`, `host name`) |

## Execution Instructions

1. **Target**: DEV project (`splitlease-backend-dev`) first, then LIVE after verification
2. **Method**: Run via Supabase MCP `execute_sql` action
3. **Rollback**: Not needed - updates are additive (filling empty fields, not overwriting existing data)

## Status

- [x] Code fix implemented and verified
- [ ] Bulk data migration pending user approval
