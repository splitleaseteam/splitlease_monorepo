# Deleted Tables Migration Audit - Comprehensive Investigation Prompt

**Generated**: 2026-01-30
**Budget**: 15,000,000 tokens
**Context**: `host_account_data` and `guest_account_data` tables were deleted, causing field access mismatches

---

## Executive Summary

The Split Lease codebase has a critical schema drift issue. The `host_account_data` and `guest_account_data` tables were deleted, but code patterns throughout the frontend and Edge Functions still reference these deleted structures or expect fields that no longer exist.

**Example Issue Found**:
```javascript
// ContactHostMessaging.jsx line 500 - WORKAROUND for deleted table
const hostUserId = listing['Host / Landlord'] || listing.host?.userId;
//                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                    This doesn't exist anymore
```

The `listing` table has `"Host / Landlord"` (which stores `account_host._id`), NOT `host.userId`.

---

## Phase 1: Database Schema Truth Discovery

### 1.1 Query the Actual Database Schema

Use Supabase MCP to query the current database structure:

```sql
-- Get all tables
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if host_account_data or guest_account_data exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%account_data%';

-- Get listing table columns (to see actual host reference field)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'listing'
ORDER BY ordinal_position;

-- Check account_host table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'account_host'
ORDER BY ordinal_position;
```

### 1.2 Document Current Host/Guest Reference Pattern

Based on `DATABASE_TABLES_DETAILED.md`:
- `listing."Host / Landlord"` → FK to `account_host._id` (NOT `host_account_data`)
- `account_host.User` → FK to `user._id`

**Critical Finding**: To get the actual `user._id` (Supabase Auth ID) from a listing:
```sql
SELECT ah."User" as user_id
FROM listing l
JOIN account_host ah ON ah._id = l."Host / Landlord"
WHERE l._id = $1;
```

---

## Phase 2: Code Pattern Audit - Frontend

### 2.1 Search for Phantom `host?.userId` Patterns

Search for ALL occurrences of these patterns in `app/src/`:

**Grep Patterns**:
```bash
# Direct host object access
listing\.host\?\.userId
listing\.host\?\.id
listing\.host\?\.name
listing\.host\?\.email
listing\.host\?\.image

# Guest object access
listing\.guest\?\.userId
listing\.guest\?\.id

# Nested destructuring
const.*host.*=.*listing
const.*{.*host.*}.*=.*listing

# Dynamic access patterns
listing\[.*host.*\]
listing\?\.host
```

**Expected Findings**:
- Components expecting `listing.host.userId` but should use `listing["Host / Landlord"]`
- Code attempting to destructure `const { host } = listing` which yields undefined
- Avatar/name display code using `listing.host.name` vs `listing["host name"]`

### 2.2 Search for Direct Field Name Access

```bash
# Should exist (correct)
"Host / Landlord"
"host name"
"Host email"

# Should NOT exist (wrong)
\.host\.userId
\.guest\.userId
```

### 2.3 Audit ContactHostMessaging Component

**File**: `app/src/islands/shared/ContactHostMessaging.jsx`

**Current Workaround** (line 500):
```javascript
const hostUserId = listing['Host / Landlord'] || listing.host?.userId;
```

**Investigation Required**:
1. Does `listing['Host / Landlord']` actually contain the `account_host._id` or the `user._id`?
2. If it's `account_host._id`, we need to JOIN to get the actual user ID for messaging
3. Search for all places that have similar workarounds

**Action**: Trace the data flow from listing → account_host → user to confirm the correct field access pattern.

---

## Phase 3: Code Pattern Audit - Edge Functions

### 3.1 Search Supabase Edge Functions

```bash
# In supabase/functions/
# Search for host/guest user ID resolution patterns

# Patterns to find:
host_user_id
guest_user_id
hostUserId
guestUserId
"Host / Landlord"
account_host
host_account_data  # DELETED - find any remaining references
guest_account_data # DELETED - find any remaining references
```

### 3.2 Audit Messaging Functions

**Files to investigate**:
- `supabase/functions/messages/handlers/sendMessage.ts`
- `supabase/functions/_shared/messagingHelpers.ts`
- `supabase/functions/message-curation/index.ts`

**Check for**:
1. How do they resolve host user ID from listing ID?
2. Are they using JOINs through `account_host` table?
3. Any hardcoded assumptions about `host_account_data`?

### 3.3 Audit Proposal-Related Functions

**Files**:
- `supabase/functions/proposal/actions/create.ts`
- `supabase/functions/proposal/actions/create_mockup.ts`
- `supabase/functions/proposal/actions/create_suggested.ts`

**Check for**:
1. How is `proposal.Host - Account` populated?
2. Does it reference `account_host._id` or `user._id`?
3. Guest ID resolution patterns

---

## Phase 4: Data Flow Tracing

### 4.1 Listing → Host User Resolution Flow

**Trace the complete path**:

```
listing._id
    ↓
listing."Host / Landlord" (account_host._id)
    ↓
account_host.User (user._id) ← THIS is what's needed for auth/messaging
    ↓
user.email, user."Name - Full", user."Profile Photo"
```

**Investigation Points**:
1. Does any code skip the `account_host` JOIN step?
2. Are there places expecting `listing."Host / Landlord"` to be a `user._id` directly?
3. Does `ContactHostMessaging.jsx` need the actual `user._id` or just the `account_host._id`?

### 4.2 Guest User Resolution Flow

```
proposal.Guest (user._id) ← Direct reference in proposal table
proposal."Host - Account" (account_host._id)
```

**Investigation Points**:
1. Is there a `guest_account_data` reference pattern?
2. Does `proposal.Guest` contain `user._id` or `account_guest._id`?
3. Any code expecting `proposal.guest.userId` pattern?

---

## Phase 5: Foreign Key and Migration Audit

### 5.1 Check for Orphaned FK References

```sql
-- Find listings with invalid host references
SELECT l._id, l."Host / Landlord"
FROM listing l
LEFT JOIN account_host ah ON ah._id = l."Host / Landlord"
WHERE l."Host / Landlord" IS NOT NULL
  AND ah._id IS NULL;

-- Find proposals with invalid host account references
SELECT p._id, p."Host - Account"
FROM proposal p
LEFT JOIN account_host ah ON ah._id = p."Host - Account"
WHERE p."Host - Account" IS NOT NULL
  AND ah._id IS NULL;
```

### 5.2 Review Migration History

Search for migrations that deleted the tables:
```bash
# Find migrations mentioning account_data
supabase/migrations/*account_data*.sql
```

**Questions**:
1. When were these tables deleted?
2. Was there a data migration to move references?
3. Was the codebase updated to match?

---

## Phase 6: Comprehensive File-by-File Audit

### 6.1 High-Risk Files to Audit

**Frontend Components**:
- [ ] `app/src/islands/shared/ContactHostMessaging.jsx` (known workaround)
- [ ] `app/src/islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx`
- [ ] `app/src/islands/pages/SearchPage.jsx`
- [ ] `app/src/islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx`
- [ ] `app/src/islands/shared/ListingCard/PropertyCard.jsx`
- [ ] `app/src/islands/pages/HostOverviewPage/useHostOverviewPageLogic.js`
- [ ] `app/src/islands/pages/HostLeasesPage/useHostLeasesPageLogic.js`
- [ ] `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
- [ ] `app/src/islands/pages/MessagingPage/useMessagingPageLogic.js`
- [ ] `app/src/islands/shared/Header/useHostMenuData.js`
- [ ] `app/src/islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js`
- [ ] `app/src/islands/shared/LoggedInAvatar/useLoggedInAvatarData.js`

**Edge Functions**:
- [ ] `supabase/functions/messages/handlers/sendMessage.ts`
- [ ] `supabase/functions/messages/handlers/createProposalThread.ts`
- [ ] `supabase/functions/messages/handlers/getThreads.ts`
- [ ] `supabase/functions/messages/handlers/getMessages.ts`
- [ ] `supabase/functions/messages/handlers/adminDeleteThread.ts`
- [ ] `supabase/functions/_shared/messagingHelpers.ts`
- [ ] `supabase/functions/_shared/vmMessagingHelpers.ts`
- [ ] `supabase/functions/proposal/actions/create.ts`
- [ ] `supabase/functions/proposal/actions/create_suggested.ts`
- [ ] `supabase/functions/proposal/actions/create_mockup.ts`
- [ ] `supabase/functions/proposal/actions/update.ts`
- [ ] `supabase/functions/lease/handlers/getHostLeases.ts`
- [ ] `supabase/functions/lease/handlers/getGuestLeases.ts`
- [ ] `supabase/functions/cohost-request/handlers/create.ts`
- [ ] `supabase/functions/co-host-requests/index.ts`
- [ ] `supabase/functions/virtual-meeting/handlers/create.ts`
- [ ] `supabase/functions/virtual-meeting/handlers/accept.ts`
- [ ] `supabase/functions/auth-user/handlers/signup.ts`
- [ ] `supabase/functions/auth-user/handlers/validate.ts`

### 6.2 Audit Checklist for Each File

For each file above, verify:

1. **Host ID Resolution**:
   - [ ] How does it get the host user ID?
   - [ ] Does it use `listing.host?.userId` (WRONG)?
   - [ ] Does it use `listing["Host / Landlord"]` (correct)?
   - [ ] Does it JOIN through `account_host` if needed?

2. **Guest ID Resolution**:
   - [ ] How does it get the guest user ID?
   - [ ] Does it use `proposal.guest?.userId` (WRONG)?
   - [ ] Does it use `proposal.Guest` (correct)?

3. **Field Name Usage**:
   - [ ] Are quoted column names used where needed? (`"Host / Landlord"`)
   - [ ] Are unquoted names used correctly? (`account_host._id`)

4. **Type Safety**:
   - [ ] Do TypeScript interfaces match the actual database schema?
   - [ ] Are there `any` types masking the issue?

5. **Error Handling**:
   - [ ] What happens when host/guest ID is null?
   - [ ] Are there meaningful error messages?

---

## Phase 7: API and Data Fetching Audit

### 7.1 Audit API Data Transformation

Search for files that transform or adapt listing data:

```bash
# Pattern: adapt, transform, format, normalize
app/src/logic/processors/*list*.js
app/src/logic/processors/*proposal*.js
app/src/lib/api/*.js
```

**Check**:
1. Do data adapters create synthetic `host` objects?
2. Is `listing.host?.userId` being added during data transformation?
3. Where does `listing.host.name` come from? (should be `listing["host name"]`)

### 7.2 Audit Supabase Queries

```bash
# Search for Supabase queries that fetch listings/presentations
supabase
  .from('listing')
  .select(`
```

**Check**:
1. Are JOINs to `account_host` included when needed?
2. Is `host` data being nested into listing objects?
3. Are column names quoted properly?

---

## Phase 8: Test and Mock Data Audit

### 8.1 Find Mock Data Files

```bash
app/src/**/__mocks__/**/*.{js,ts,jsx,tsx}
app/src/**/*.mock.{js,ts,jsx,tsx}
app/src/**/*.fixture.{js,ts,jsx,tsx}
```

**Check**:
1. Do mock listings have `host.userId` fields?
2. Do they match the current schema?
3. Are test data patterns reinforcing wrong patterns?

### 8.2 Find Test Files Using Listing Data

```bash
app/src/**/*.{test,spec}.{js,ts,jsx,tsx}
```

**Check**:
1. Do tests expect `listing.host.userId`?
2. Do tests use `"Host / Landlord"` correctly?

---

## Phase 9: Documentation Audit

### 9.1 Check for Outdated Documentation

Search documentation for outdated patterns:

```bash
.claude/Documentation/**/*.md
docs/**/*.md
README*.md
```

**Grep for**:
- `host.userId`
- `guest.userId`
- `host_account_data`
- `guest_account_data`
- Any schema diagrams showing these deleted tables

### 9.2 Update Documentation if Needed

After audit, ensure docs reflect:
1. Correct field access patterns
2. Current table structure
3. Proper JOIN patterns for user resolution

---

## Phase 10: Generate Comprehensive Report

### 10.1 Output Format

Create a report at: `.claude/plans/Documents/20260130170000-deleted-tables-audit-report.md`

**Report Structure**:

```markdown
# Deleted Tables Migration Audit Report

## Executive Summary
- Number of files audited: X
- Critical issues found: X
- Files with workarounds: X
- Files needing refactoring: X

## Database Schema Truth
- Current host reference path
- Current guest reference path
- JOIN requirements

## Findings by Category

### Critical Issues (Breaking)
- File: path
  - Issue: description
  - Line: X
  - Fix: recommendation

### Medium Issues (Workarounds)
- File: path
  - Issue: has workaround like `||`
  - Line: X
  - Fix: proper implementation

### Low Issues (Type Safety)
- File: path
  - Issue: type mismatches
  - Fix: update interfaces

### Clean (No Issues)
- List of files verified correct

## Recommended Refactoring Plan

### Priority 1: Fix Breaking Issues
1. ...

### Priority 2: Remove Workarounds
1. ...

### Priority 3: Type Safety
1. ...

## Test Coverage Gaps
- ...

## Documentation Updates Needed
- ...
```

---

## Investigation Commands Reference

### Frontend Pattern Search
```bash
# Host object patterns
grep -r "listing\.host\?\.userId" app/src/
grep -r "listing\.host\?\.id" app/src/
grep -r "listing\.host\?\.name" app/src/
grep -r "listing\.host\?\.email" app/src/
grep -r "const.*host.*listing" app/src/

# Guest object patterns
grep -r "listing\.guest\?\.userId" app/src/
grep -r "proposal\.guest\?\.userId" app/src/

# Correct patterns
grep -r '"Host / Landlord"' app/src/
grep -r '"host name"' app/src/
```

### Edge Function Pattern Search
```bash
# In supabase/functions/
grep -r "host_account_data" supabase/functions/
grep -r "guest_account_data" supabase/functions/
grep -r "hostUserId" supabase/functions/
grep -r "guestUserId" supabase/functions/
grep -r '"Host / Landlord"' supabase/functions/
```

### Database Queries (via MCP)
```sql
-- All tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Listing columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'listing';

-- Account host structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'account_host';
```

---

## Expected Deliverables

1. **Database Schema Truth Document**: Confirming actual field names and relationships
2. **Issue Inventory**: Categorized list of all problematic code patterns
3. **Fix Prioritization**: Ranked list of issues by severity
4. **Refactoring Plan**: Step-by-step guide to fix all issues
5. **Test Plan**: How to verify fixes work correctly
6. **Documentation Updates**: Schema and pattern documentation updates

---

## Token Budget Allocation

| Phase | Estimated Tokens |
|-------|-----------------|
| Phase 1: Schema Discovery | 1,000,000 |
| Phase 2: Frontend Audit | 3,000,000 |
| Phase 3: Edge Functions Audit | 3,000,000 |
| Phase 4: Data Flow Tracing | 2,000,000 |
| Phase 5: FK/Migration Audit | 1,000,000 |
| Phase 6: File-by-File Audit | 2,000,000 |
| Phase 7: API Audit | 1,000,000 |
| Phase 8: Test Audit | 500,000 |
| Phase 9: Documentation Audit | 500,000 |
| Phase 10: Report Generation | 1,000,000 |
| **Total** | **15,000,000** |

---

## Critical Success Factors

1. **Exhaustive Coverage**: Every file touching host/guest/user references must be audited
2. **Truth-Based Findings**: All findings must reference actual database schema, not assumptions
3. **Actionable Output**: Report must provide specific line numbers and fix recommendations
4. **No Assumptions**: When in doubt, query the actual database via MCP
5. **Pattern Recognition**: Identify systemic issues, not just individual bugs

---

*This prompt is designed for a comprehensive audit session with a 15M token budget. Begin with Phase 1 to establish database truth, then proceed systematically through all phases.*
