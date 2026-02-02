# Column Quoting Issues in Edge Functions

**Created**: 2026-01-29
**Status**: Partially Fixed
**Priority**: Medium (can cause silent query failures)

---

## Root Cause

PostgreSQL lowercases unquoted identifiers. Columns created with capital letters (e.g., `"Proposal"`, `"Lease"`) must be queried with quotes:

```typescript
// ❌ WRONG - PostgreSQL sees 'proposal' (lowercase)
.eq('Proposal', value)

// ✅ CORRECT - PostgreSQL sees "Proposal" (matches column)
.eq('"Proposal"', value)
```

---

## Fixed (Committed)

| File | Line | Issue | Commit |
|------|------|-------|--------|
| `messages/handlers/sendSplitBotMessage.ts` | 125 | `.eq('Proposal', ...)` | `6e9eca085` |

---

## Remaining Issues (Linter Reverted)

The following issues were identified but the linter reverted the fixes. These should be addressed when the linter configuration is updated to allow double-quoted column names.

### High Priority (Active Features)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `date-change-request/handlers/getThrottleStatus.ts` | 124 | `.eq('Requested by', userId)` | `.eq('"Requested by"', userId)` |
| `date-change-request/handlers/getThrottleStatus.ts` | 125 | `.eq('Lease', leaseId)` | `.eq('"Lease"', leaseId)` |
| `date-change-request/handlers/getThrottleStatus.ts` | 177 | `.eq('Requested by', userId)` | `.eq('"Requested by"', userId)` |
| `date-change-request/handlers/get.ts` | 53 | `.eq('Lease', input.leaseId)` | `.eq('"Lease"', input.leaseId)` |
| `date-change-request/handlers/create.ts` | 64 | `.eq('Requested by', ...)` | `.eq('"Requested by"', ...)` |
| `date-change-request/handlers/create.ts` | 65 | `.eq('Lease', ...)` | `.eq('"Lease"', ...)` |
| `leases-admin/index.ts` | 372, 478, 971, 1158 | `.eq('Lease', leaseId)` | `.eq('"Lease"', leaseId)` |
| `lease/handlers/getGuestLeases.ts` | 109 | `.eq('Guest', guestUserId)` | `.eq('"Guest"', guestUserId)` |
| `listing/handlers/submit.ts` | 394 | `.eq('Host User', userId)` | `.eq('"Host User"', userId)` |
| `proposal/actions/get_prefill_data.ts` | 40 | `.eq('Guest', payload.guestId)` | `.eq('"Guest"', payload.guestId)` |
| `rental-application/handlers/submit.ts` | 294 | `.eq('Guest', bubbleUserId)` | `.eq('"Guest"', bubbleUserId)` |

### Medium Priority (Admin/Search Features)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `pricing-admin/index.ts` | 279 | `.eq('Location - Borough', ...)` | `.eq('"Location - Borough"', ...)` |
| `pricing-admin/index.ts` | 282 | `.ilike('Location - Hood', ...)` | `.ilike('"Location - Hood"', ...)` |
| `pricing-admin/index.ts` | 288 | `.eq('Active', true)` | `.eq('"Active"', true)` |
| `quick-match/actions/search_candidates.ts` | 164 | `.eq('Active', true)` | `.eq('"Active"', true)` |
| `quick-match/actions/search_candidates.ts` | 174 | `.eq('Location - Borough', ...)` | `.eq('"Location - Borough"', ...)` |
| `co-host-requests/index.ts` | 370 | `.eq('Status - Co-Host Request', ...)` | `.eq('"Status - Co-Host Request"', ...)` |
| `informational-texts/index.ts` | 300, 374 | `.eq('Information Tag-Title', ...)` | `.eq('"Information Tag-Title"', ...)` |

### Low Priority (Admin Data Deletion)

| File | Line | Current | Should Be |
|------|------|---------|-----------|
| `usability-data-admin/actions/deleteGuestData.ts` | 32 | `.eq('Guest', guestId)` | `.eq('"Guest"', guestId)` |
| `usability-data-admin/actions/deleteHostData.ts` | 32 | `.eq('Host', hostId)` | `.eq('"Host"', hostId)` |
| `usability-data-admin/actions/deleteHostListings.ts` | 28, 70 | `.eq('Host', hostId)` | `.eq('"Host"', hostId)` |
| `usability-data-admin/actions/deleteHostListings.ts` | 55 | `.in('Listing', listingIds)` | `.in('"Listing"', listingIds)` |
| `usability-data-admin/actions/deleteProposal.ts` | 37 | `.eq('Unique ID', proposalId)` | `.eq('"Unique ID"', proposalId)` |
| `usability-data-admin/actions/fetchListing.ts` | 36 | `.eq('Unique ID', listingId)` | `.eq('"Unique ID"', listingId)` |

---

## Correctly Quoted (Reference)

These files already use correct quoting:

| File | Example |
|------|---------|
| `_shared/messagingHelpers.ts` | `.eq('"Proposal"', proposalId)`, `.eq('"Listing"', listingId)` |
| `_shared/negotiationSummaryHelpers.ts` | `.eq('"Guest"', guestId)` |
| `proposal/actions/create.ts` | `.eq('"Guest"', input.guestId)` |
| `proposal/actions/create_suggested.ts` | `.eq('"Guest"', input.guestId)` |
| `ai-parse-profile/index.ts` | `.eq('"Active"', true)` |

---

## Recommended Fix

1. **Update ESLint/Deno lint config** to allow double-quoted column names in Supabase queries
2. **Batch fix all files** using a script after linter config update
3. **Add a custom lint rule** to enforce quoted column names for mixed-case columns

---

## Related Files

- [sendSplitBotMessage.ts](supabase/functions/messages/handlers/sendSplitBotMessage.ts)
- [messagingHelpers.ts](supabase/functions/_shared/messagingHelpers.ts) - Reference for correct pattern
