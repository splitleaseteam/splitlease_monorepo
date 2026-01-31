# Investigation: Proposal Not Appearing in Guest's Frontend List

**Date**: 2026-01-30
**Proposal ID**: `1769130751870x21602817865937584`
**Test User**: `terrencegrey@test.com` (ID: `1767918595624x88062023316464928`)
**Status**: Analysis Complete

---

## Executive Summary

The proposal exists in the Supabase `proposal` table but does not appear in the guest's frontend proposal list because **the proposal ID is not in the user's `"Proposals List"` array field**.

The frontend fetches proposals by first reading the user's `"Proposals List"` array, then querying only those specific IDs. It does NOT query all proposals where `Guest = userId`.

---

## Question 1: How Does GuestProposalsPage.jsx Fetch Proposals?

### Data Flow

```
GuestProposalsPage.jsx
    |
    v
useGuestProposalsPageLogic.js (line 196-224)
    |
    v calls
fetchUserProposalsFromUrl() in userProposalQueries.js (line 650-707)
    |
    +---> Step 1: getUserIdFromSession()
    |           - Gets user ID from localStorage key `__sl_sid__`
    |           - Returns null if not authenticated
    |
    +---> Step 2: fetchUserWithProposalList(userId)
    |           - Queries `user` table for the user record
    |           - Selects `"Proposals List"` field (text[] array)
    |
    +---> Step 3: extractProposalIds(user)
    |           - Extracts proposal IDs from `"Proposals List"` array
    |           - Returns empty array if null/missing
    |
    +---> Step 4: fetchProposalsByIds(proposalIds)
              - Queries `proposal` table using `.in('_id', proposalIds)`
              - Fetches related listings, hosts, virtual meetings
              - Returns enriched proposal objects
```

### Key Finding

The frontend **does NOT** query all proposals where `Guest = userId`.

Instead, it only fetches proposals whose IDs are explicitly listed in the user's `"Proposals List"` array field on the `user` table.

---

## Question 2: What Filters Are Applied to the Proposal Query?

### Database-Level Filters (fetchProposalsByIds, line 89-132)

```javascript
const { data: proposals, error: proposalError } = await supabase
  .from('proposal')
  .select(/* ... 30+ columns */)
  .in('_id', proposalIds)                        // ONLY proposals from user's list
  .or('"Deleted".is.null,"Deleted".eq.false')    // Exclude deleted
  .neq('Status', 'Proposal Cancelled by Guest')  // Exclude guest-cancelled
  .order('Created Date', { ascending: false });
```

### Client-Side Filters (line 140-150)

```javascript
const validProposals = (proposals || []).filter(p => {
  if (!p) return false;
  if (p.Deleted === true || p.Deleted === 'true') return false;
  if (p.Status === 'Proposal Cancelled by Guest') return false;
  return true;
});
```

### V7 UI Categorization (useGuestProposalsPageLogic.js, line 402-440)

Proposals are further categorized into:
- **Suggested for You**: SL-created proposals pending guest confirmation
- **Your Proposals**: All other proposals (guest-submitted, confirmed, etc.)

Non-terminal proposals are sorted first, then by creation date (newest first).

---

## Question 3: Why Are Database Queries Returning 400 Errors?

### Error: `column _message.Associated Thread/Conversation does not exist`

**Root Cause**: The `Associated Thread/Conversation` column was never migrated from Bubble to Supabase.

From `DATABASE_RELATIONS.md`:
> **Missing Thread/Conversation Table**: Multiple tables reference a "Thread/Conversation" entity that doesn't exist in the database:
> - `_message.Associated Thread/Conversation` - *(not migrated)*

### Current Implementation

The code in `userProposalQueries.js` (lines 505-556) has been updated to use:
- `thread` table with `Proposal` column
- `_message` table with `thread_id` column (which does exist)

The 400 errors may be coming from legacy code paths that haven't been updated.

---

## Question 4: Is the Frontend Querying Bubble.io or Supabase?

### Answer: Supabase

The frontend directly queries Supabase for proposal fetching:

```javascript
// userProposalQueries.js
import { supabase } from '../supabase.js';

const { data, error } = await supabase
  .from('user')
  .select(/* ... */)
  .eq('_id', userId)
  .maybeSingle();
```

**No Bubble API calls** are made for fetching the proposal list. The Supabase client is initialized from environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## Root Cause Analysis

### Why the Proposal Doesn't Appear

1. **Proposal exists in database**: Proposal ID `1769130751870x21602817865937584` exists in the `proposal` table with `Guest = 1767918595624x88062023316464928`

2. **Proposal ID NOT in user's list**: The proposal ID was never added to the user's `"Proposals List"` array field

3. **Frontend query limitation**: The frontend only queries proposals from the user's `"Proposals List"`, not all proposals where `Guest = userId`

### Console Evidence

The debug session captured:
```
⚠️ Proposal ID from URL not found in user proposals: 1769130751870x21602817865937584
```

This message comes from `useGuestProposalsPageLogic.js` line 265 when the URL contains a proposal ID that doesn't exist in the fetched proposals array.

---

## Data Integrity Issue

The `"Proposals List"` field on the `user` table is supposed to be the inverse of the `Guest` field on the `proposal` table. When a proposal is created:

1. A new `proposal` record is created with `Guest = userId`
2. The proposal ID should be appended to `user."Proposals List"`

If step 2 fails or is skipped, the proposal becomes "orphaned" - it exists but the user cannot see it.

### Potential Causes of Missing Entry

- Proposal created via direct database insert without updating user record
- Bubble sync queue failed to process the user update
- Race condition during proposal creation
- Manual database manipulation that bypassed the application logic

---

## Recommended Fixes

### Option 1: Add Proposal to User's List (Data Fix)

```sql
-- Add proposal ID to user's Proposals List
UPDATE "user"
SET "Proposals List" = array_append(
  COALESCE("Proposals List", ARRAY[]::text[]),
  '1769130751870x21602817865937584'
)
WHERE _id = '1767918595624x88062023316464928';
```

### Option 2: Change Query Logic (Code Fix)

Modify `fetchUserProposalsFromUrl()` to query proposals by `Guest = userId` instead of relying on `"Proposals List"`:

```javascript
// Instead of:
const proposalIds = extractProposalIds(user);
const proposals = await fetchProposalsByIds(proposalIds);

// Use:
const proposals = await supabase
  .from('proposal')
  .select(/* ... */)
  .eq('Guest', userId)
  .or('"Deleted".is.null,"Deleted".eq.false')
  .neq('Status', 'Proposal Cancelled by Guest');
```

### Option 3: Implement Both-Way Sync (Robust Fix)

Create a database trigger or application logic that ensures:
- When `proposal.Guest` is set, the proposal ID is added to `user."Proposals List"`
- When a proposal is deleted, it's removed from `user."Proposals List"`

---

## Key Files

| File | Path | Purpose |
|------|------|---------|
| Page Component | `app/src/islands/pages/GuestProposalsPage.jsx` | UI rendering |
| Logic Hook | `app/src/islands/pages/proposals/useGuestProposalsPageLogic.js` | Business logic |
| Data Fetcher | `app/src/lib/proposals/userProposalQueries.js` | Database queries |
| URL Parser | `app/src/lib/proposals/urlParser.js` | User ID retrieval |
| Secure Storage | `app/src/lib/secureStorage.js` | Session storage |
| DB Relations | `.claude/Documentation/Database/DATABASE_RELATIONS.md` | Schema docs |

---

## Summary

| Question | Answer |
|----------|--------|
| How are proposals fetched? | Via user's `"Proposals List"` array, not by `Guest = userId` |
| What filters are applied? | Excluded: deleted, guest-cancelled |
| Why 400 errors for `_message`? | Legacy column `Associated Thread/Conversation` not migrated |
| Bubble or Supabase? | Supabase directly |
| Why proposal missing? | Proposal ID not in user's `"Proposals List"` array |

---

**Status**: Analysis Complete - Ready for Data Fix or Code Change Decision
