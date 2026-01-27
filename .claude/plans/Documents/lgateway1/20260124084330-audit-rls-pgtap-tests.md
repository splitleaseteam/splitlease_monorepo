# RLS pgTAP Testing Audit Report
**Generated:** 2026-01-24 08:43:30
**Codebase:** Split Lease

## Executive Summary
- Tables with RLS enabled: 6
- Tables needing pgTAP tests: 6
- Policies without test coverage: 6
- Security risk level: **HIGH** - No RLS tests exist, multi-tenant data exposure possible

## Critical Finding

**The Split Lease codebase has ZERO pgTAP tests for Row-Level Security policies.**

This audit found:
- **6 tables with RLS enabled** in migrations
- **0 pgTAP test files** exist
- **No `supabase/tests/` directory** exists
- **No test helper functions** (set_auth_user, etc.)
- **No CI/CD integration** for running pgTAP tests

## Infrastructure Check

### pgTAP Setup Status
| Requirement | Status | Notes |
|-------------|--------|-------|
| pgTAP extension enabled in database | ❌ Unknown | Not verified |
| Test helper functions exist | ❌ No | No set_auth_user() or similar |
| `supabase/tests/` directory exists | ❌ No | Directory does not exist |
| CI/CD runs `supabase test db` | ❌ No | No test runner configured |

## Critical Gaps (No Tests at All)

### Table: `notification_preferences`
- **Migration:** `supabase/migrations/20251214_create_notification_preferences.sql`
- **RLS Policies Found:**
  - SELECT: `Users can read own notification preferences` using `(true)` - **UNSAFE**
  - INSERT: `Users can insert own notification preferences` with check `(true)` - **UNSAFE**
  - UPDATE: `Users can update own notification preferences` using `(true)` with check `(true)` - **UNSAFE**
  - DELETE: **No policy** - Users cannot delete (may be intentional)
- **User Scope Column:** `user_id` (TEXT, not UUID - references Bubble user._id)
- **Why Testing Critical:** Contains user PII and communication preferences
- **SECURITY CONCERN:** Policies use `(true)` which allows ALL authenticated users to read/write ANY row - filtering is done in application layer, not database. This is a **critical security vulnerability**.
- **Required Tests:**
  - [ ] User can SELECT own preferences only
  - [ ] User cannot SELECT other users' preferences
  - [ ] User can INSERT with own user_id only
  - [ ] User cannot INSERT for other users
  - [ ] User can UPDATE own preferences only
  - [ ] User cannot UPDATE other users' preferences
  - [ ] Verify policy actually enforces user_id filtering (currently doesn't!)

### Table: `heygen_deepfake`
- **Migration:** `supabase/migrations/20260121180000_create_heygen_deepfake_table.sql`
- **RLS Policies Found:**
  - SELECT: `Users can view own deepfakes` using `(created_by = auth.uid() OR house_manual_id IN (SELECT id FROM housemanual WHERE Host = auth.uid()::text))`
  - ALL (service_role): `Service role full access` using `(true)` with check `(true)`
  - INSERT: **No policy** - Only service role can insert
  - UPDATE: **No policy** - Only service role can update
  - DELETE: **No policy** - Only service role can delete
- **User Scope Column:** `created_by` (UUID, references auth.users)
- **Why Testing Critical:** Contains AI-generated video content, needs host-only access control
- **Complex Policy:** Includes OR condition with subquery to housemanual table
- **Required Tests:**
  - [ ] Creator can view own deepfakes
  - [ ] Host of associated house manual can view deepfakes
  - [ ] User cannot view deepfakes from other hosts' manuals
  - [ ] Unauthenticated users cannot access
  - [ ] Service role can perform all operations

### Table: `sync_queue`
- **Migration:** `supabase/migrations/20251205_create_sync_queue_tables.sql`
- **RLS Policies Found:**
  - **No policies** - RLS enabled with no policies = service role only access
- **User Scope Column:** None (internal system table)
- **Why Testing Critical:** Internal sync queue, should never be accessible to application users
- **Required Tests:**
  - [ ] Authenticated users cannot SELECT
  - [ ] Authenticated users cannot INSERT
  - [ ] Authenticated users cannot UPDATE
  - [ ] Authenticated users cannot DELETE
  - [ ] Service role can perform all operations

### Table: `sync_config`
- **Migration:** `supabase/migrations/20251205_create_sync_queue_tables.sql`
- **RLS Policies Found:**
  - **No policies** - RLS enabled with no policies = service role only access
- **User Scope Column:** None (configuration table)
- **Why Testing Critical:** Contains workflow configuration, should never be accessible to application users
- **Required Tests:**
  - [ ] Authenticated users cannot SELECT
  - [ ] Authenticated users cannot INSERT
  - [ ] Authenticated users cannot UPDATE
  - [ ] Authenticated users cannot DELETE
  - [ ] Service role can perform all operations

### Table: `workflow_executions`
- **Migration:** `supabase/migrations/20251213_create_workflow_executions.sql`
- **RLS Policies Found:**
  - **No policies** - RLS enabled with no policies = service role only access
- **User Scope Column:** None (audit table)
- **Why Testing Critical:** Contains workflow execution history and error details
- **Required Tests:**
  - [ ] Authenticated users cannot SELECT
  - [ ] Authenticated users cannot INSERT
  - [ ] Authenticated users cannot UPDATE
  - [ ] Authenticated users cannot DELETE
  - [ ] Service role can perform all operations

### Table: `workflow_definitions`
- **Migration:** `supabase/migrations/20251213_create_workflow_definitions.sql`
- **RLS Policies Found:**
  - **No policies** - RLS enabled with no policies = service role only access
- **User Scope Column:** None (configuration table)
- **Why Testing Critical:** Contains workflow step definitions and business logic
- **Required Tests:**
  - [ ] Authenticated users cannot SELECT
  - [ ] Authenticated users cannot INSERT
  - [ ] Authenticated users cannot UPDATE
  - [ ] Authenticated users cannot DELETE
  - [ ] Service role can perform all operations

### Table: `reference_table.cancellation_reasons`
- **Migration:** `supabase/migrations/20260106_create_cancellation_reasons_table.sql`
- **RLS Policies Found:**
  - SELECT: `Allow read access for all users` using `(true)`
  - INSERT: **No policy** - Users cannot insert
  - UPDATE: **No policy** - Users cannot update
  - DELETE: **No policy** - Users cannot delete
- **User Scope Column:** None (reference data table)
- **Why Testing Critical:** Read-only reference data, should not be modifiable
- **Required Tests:**
  - [ ] Anonymous users can SELECT
  - [ ] Authenticated users can SELECT
  - [ ] Users cannot INSERT
  - [ ] Users cannot UPDATE
  - [ ] Users cannot DELETE

## Tables Without RLS (Potentially Vulnerable)

Based on database schema documentation, the following Bubble-synced tables **do NOT have RLS enabled** and are directly accessible:

| Table | Row Count | Has Sensitive Data | RLS Status |
|-------|-----------|-------------------|------------|
| `user` | 876 | Yes (PII) | **Disabled** |
| `account_guest` | 652 | Yes | **Disabled** |
| `account_host` | 847 | Yes | **Disabled** |
| `listing` | 265 | Yes (host data) | **Disabled** |
| `listing_photo` | 4,604 | No | **Enabled** (but no tests) |
| `proposal` | 687 | Yes (booking data) | **Disabled** |
| `bookings_leases` | 156 | Yes (financial) | **Disabled** |
| `bookings_stays` | 17,601 | Yes (financial) | **Disabled** |
| `mainreview` | 32 | Yes | **Disabled** |
| `_message` | 6,244 | Yes (private messages) | **Disabled** |

**SECURITY RISK:** Any authenticated Supabase user can potentially query ALL data in these tables via PostgREST API unless Edge Functions enforce filtering.

## Policy-Specific Gaps

### Policy: `Users can read own notification preferences` (CRITICAL VULNERABILITY)
- **Operation:** SELECT
- **Table:** notification_preferences
- **Policy Definition:** `USING (true)`
- **Issue:** Policy allows reading ALL rows from all users
- **Current Implementation:**
  ```sql
  CREATE POLICY "Users can read own notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (true);  -- ⚠️ ALLOWS ALL USERS TO SEE ALL PREFERENCES
  ```
- **Missing Test Scenarios:**
  - [ ] Authenticated user A cannot see user B's preferences
  - [ ] User can only see rows where user_id matches their Bubble user ID
  - [ ] Edge case: null user_id rows

### Policy: `Users can update own notification preferences` (CRITICAL VULNERABILITY)
- **Operation:** UPDATE
- **Table:** notification_preferences
- **Policy Definition:** `USING (true) WITH CHECK (true)`
- **Issue:** Policy allows updating ALL rows from all users
- **Missing Test Scenarios:**
  - [ ] User can only update their own preferences
  - [ ] User cannot modify another user's preferences
  - [ ] User cannot change user_id field to another user's ID

## Role-Based Access Gaps

### Service Role Access
| Table | Service Role Policy Exists | Service Role Test Exists |
|-------|--------------------------|--------------------------|
| sync_queue | Yes (implicit via no policies) | No |
| sync_config | Yes (implicit via no policies) | No |
| workflow_executions | Yes (implicit via no policies) | No |
| workflow_definitions | Yes (implicit via no policies) | No |
| heygen_deepfake | Yes (explicit policy) | No |

### Admin Access Policies
| Table | Admin Policy Exists | Admin Test Exists |
|-------|-------------------|-------------------|
| notification_preferences | No | N/A |
| heygen_deepfake | No | N/A |

**NOTE:** No admin bypass policies exist in the system. Admin access appears to be handled via service role only.

## Security Checklist

| Table | SELECT | INSERT | UPDATE | DELETE | RLS Enabled | Test Coverage |
|-------|--------|--------|--------|--------|-------------|---------------|
| notification_preferences | ⚠️ Unsafe | ⚠️ Unsafe | ⚠️ Unsafe | N/A | Yes | **None** |
| heygen_deepfake | ✅ OK | N/A (service only) | N/A (service only) | N/A (service only) | Yes | **None** |
| sync_queue | ❌ No access | ❌ No access | ❌ No access | ❌ No access | Yes | **None** |
| sync_config | ❌ No access | ❌ No access | ❌ No access | ❌ No access | Yes | **None** |
| workflow_executions | ❌ No access | ❌ No access | ❌ No access | ❌ No access | Yes | **None** |
| workflow_definitions | ❌ No access | ❌ No access | ❌ No access | ❌ No access | Yes | **None** |
| cancellation_reasons | ✅ Read-only | ❌ No access | ❌ No access | ❌ No access | Yes | **None** |
| user | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| account_guest | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| account_host | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| listing | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| proposal | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| bookings_leases | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |
| bookings_stays | ❌ Open | ❌ Open | ❌ Open | ❌ Open | **No** | **None** |

**LEGEND:**
- ✅ = Properly configured
- ⚠️ = Security concern (policy allows too much access)
- ❌ = Missing RLS entirely
- N/A = Intentionally no access
- **None** = No pgTAP test coverage

## Recommended Test Templates

### Test Setup File (Required)

Create `supabase/tests/setup.sql`:
```sql
-- Helper function to set authenticated user context
CREATE OR REPLACE FUNCTION set_auth_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  SET LOCAL role authenticated;
  SET LOCAL request.jwt.claim.sub = user_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to set service role context
CREATE OR REPLACE FUNCTION set_service_role()
RETURNS VOID AS $$
BEGIN
  SET LOCAL role service_role;
END;
$$ LANGUAGE plpgsql;

-- Helper to create test users
CREATE OR REPLACE FUNCTION create_test_user(email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
BEGIN
  user_id := 'test-' || substring(md5(random()::text), 1, 20);

  INSERT INTO auth.users (id, email)
  VALUES (user_id::uuid, email);

  RETURN user_id;
END;
$$ LANGUAGE plpgsql;
```

### Test Template: notification_preferences (FIX REQUIRED)

**CRITICAL:** This test will FAIL until the policy is fixed.

```sql
-- supabase/tests/rls_notification_preferences.sql
begin;
select plan(6);

-- Create test users
set local role postgres;
select create_auth_user('user-a@test.com') as user_a \gset
select create_auth_user('user-b@test.com') as user_b \gset

-- Insert test preferences
insert into notification_preferences (user_id, message_forwarding_sms)
values
  ('user-a', true),
  ('user-b', false);

-- Test 1: User can see own preferences
set local role authenticated;
set local request.jwt.claim.sub = :'user_a';

select is(
  (select count(*)::int from notification_preferences where user_id = :'user_a'),
  1,
  'User sees own preferences'
);

-- Test 2: User CANNOT see other users' preferences (THIS WILL FAIL WITH CURRENT POLICY)
select is(
  (select count(*)::int from notification_preferences where user_id = :'user_b'),
  0,
  'User cannot see other users preferences'
);

-- Test 3: User can update own preferences
update notification_preferences
set message_forwarding_email = true
where user_id = :'user_a';

select is(
  (select message_forwarding_email from notification_preferences where user_id = :'user_a'),
  true,
  'User updated own preferences'
);

-- Test 4: User CANNOT update other users' preferences (THIS WILL FAIL WITH CURRENT POLICY)
update notification_preferences
set message_forwarding_email = false
where user_id = :'user_b';

select is(
  (select message_forwarding_email from notification_preferences where user_id = :'user_b'),
  false,
  'Other users preferences unchanged'
);

-- Test 5: User can insert own preferences
insert into notification_preferences (user_id, promotional_email)
values ('user-a', true);

select lives_ok(
  'insert into notification_preferences (user_id) values (''user-a'')',
  'User can insert own preferences'
);

-- Test 6: User CANNOT insert for other users
select throws_ok(
  'insert into notification_preferences (user_id) values (''other-user'')',
  '42501',  -- Permission denied
  'Cannot insert for another user'
);

select * from finish();
rollback;
```

### Test Template: heygen_deepfake

```sql
-- supabase/tests/rls_heygen_deepfake.sql
begin;
select plan(7);

-- Setup: Create test users and house manual
set local role postgres;
select create_auth_user('creator@test.com') as creator_id \gset
select create_auth_user('host@test.com') as host_id \gset

-- Create a house manual with a specific host
insert into housemanual (id, Host, "Created By")
values ('manual-1', 'host', :'host_id');

-- Insert test deepfakes
insert into heygen_deepfake (id, created_by, house_manual_id, status)
values
  ('deepfake-1', :'creator_id'::uuid, 'manual-1', 'completed'),
  ('deepfake-2', :'host_id'::uuid, 'manual-1', 'pending');

-- Test 1: Creator can view own deepfakes
set local role authenticated;
set local request.jwt.claim.sub = :'creator_id';

select is(
  (select count(*)::int from heygen_deepfake where id = 'deepfake-1'),
  1,
  'Creator sees own deepfake'
);

-- Test 2: Creator CANNOT see other creators' deepfakes
select is(
  (select count(*)::int from heygen_deepfake where created_by = :'host_id'::uuid and id = 'deepfake-2'),
  0,
  'Creator cannot see other creators deepfakes'
);

-- Test 3: Host of house manual can see all deepfakes for that manual
set local request.jwt.claim.sub = :'host_id';

select is(
  (select count(*)::int from heygen_deepfake where house_manual_id = 'manual-1'),
  2,
  'Host sees all deepfakes for their manual'
);

-- Test 4: Authenticated user cannot INSERT
select throws_ok(
  'insert into heygen_deepfake (script) values (''test'')',
  '42501',
  'Authenticated user cannot insert'
);

-- Test 5: Authenticated user cannot UPDATE
select throws_ok(
  'update heygen_deepfake set status = ''completed'' where id = ''deepfake-1''',
  '42501',
  'Authenticated user cannot update'
);

-- Test 6: Authenticated user cannot DELETE
select throws_ok(
  'delete from heygen_deepfake where id = ''deepfake-1''',
  '42501',
  'Authenticated user cannot delete'
);

-- Test 7: Service role can do everything
set local role service_role;

select lives_ok(
  'insert into heygen_deepfake (script) values (''service script'')',
  'Service role can insert'
);

select is(
  (select count(*)::int from heygen_deepfake where script = 'service script'),
  1,
  'Service role insert succeeded'
);

select * from finish();
rollback;
```

### Test Template: sync_queue (Service Role Only)

```sql
-- supabase/tests/rls_sync_queue.sql
begin;
select plan(5);

-- Setup: Create test user
set local role postgres;
select create_auth_user('user@test.com') as user_id \gset

-- Insert test queue item
insert into sync_queue (table_name, record_id, operation)
values ('listing', 'list-123', 'INSERT');

-- Test 1: Authenticated user cannot SELECT
set local role authenticated;
set local request.jwt.claim.sub = :'user_id';

select is(
  (select count(*)::int from sync_queue),
  0,
  'Authenticated user cannot see sync_queue'
);

-- Test 2: Authenticated user cannot INSERT
select throws_ok(
  'insert into sync_queue (table_name, record_id, operation) values (''proposal'', ''prop-123'', ''UPDATE'')',
  '42501',
  'Cannot insert to sync_queue'
);

-- Test 3: Authenticated user cannot UPDATE
select throws_ok(
  'update sync_queue set status = ''completed''',
  '42501',
  'Cannot update sync_queue'
);

-- Test 4: Authenticated user cannot DELETE
select throws_ok(
  'delete from sync_queue',
  '42501',
  'Cannot delete from sync_queue'
);

-- Test 5: Service role can perform all operations
set local role service_role;

select is(
  (select count(*)::int from sync_queue),
  1,
  'Service role can see sync_queue'
);

select lives_ok(
  'update sync_queue set status = ''completed''',
  'Service role can update'
);

select * from finish();
rollback;
```

### Test Template: cancellation_reasons (Read-Only Reference Data)

```sql
-- supabase/tests/rls_cancellation_reasons.sql
begin;
select plan(6);

-- Test 1: Anonymous users can read (anon role)
set local role anon;

select is(
  (select count(*)::int from reference_table.cancellation_reasons),
  12,  -- Based on seed data
  'Anonymous users can read cancellation reasons'
);

-- Test 2: Authenticated users can read
set local role authenticated;
set local request.jwt.claim.sub = 'test-user';

select is(
  (select count(*)::int from reference_table.cancellation_reasons),
  12,
  'Authenticated users can read cancellation reasons'
);

-- Test 3: Users cannot INSERT
select throws_ok(
  'insert into reference_table.cancellation_reasons (user_type, reason) values (''guest'', ''Custom reason'')',
  '42501',
  'Cannot insert to reference table'
);

-- Test 4: Users cannot UPDATE
select throws_ok(
  'update reference_table.cancellation_reasons set is_active = false',
  '42501',
  'Cannot update reference table'
);

-- Test 5: Users cannot DELETE
select throws_ok(
  'delete from reference_table.cancellation_reasons',
  '42501',
  'Cannot delete from reference table'
);

-- Test 6: Service role can modify
set local role service_role;

select lives_ok(
  'insert into reference_table.cancellation_reasons (user_type, reason) values (''guest'', ''Test reason'')',
  'Service role can insert'
);

select * from finish();
rollback;
```

## Required Policy Fixes

### notification_preferences Policy Fix (CRITICAL)

**Current (Vulnerable):**
```sql
CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (true);  -- ⚠️ Allows reading ALL rows
```

**Recommended Fix:**
```sql
CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (
    -- Allow reading if user_id matches JWT sub (Supabase auth user)
    user_id = auth.uid()::text
    OR
    -- TODO: Need to map Supabase auth.uid() to Bubble user._id
    -- This requires a join to users table or a mapping table
    false  -- Placeholder until mapping is implemented
  );
```

**NOTE:** The current implementation has a fundamental architectural issue:
- `notification_preferences.user_id` is a TEXT field referencing `user._id` (Bubble format)
- `auth.uid()` returns a UUID from `auth.users` table
- There's no direct way to compare these without a mapping table

**Recommended Architecture Fix:**
1. Add `supabase_user_id` UUID column to `notification_preferences`
2. Update policies to use `supabase_user_id = auth.uid()`
3. Keep `user_id` for Bubble compatibility

## Implementation Priority

### Priority 1: CRITICAL (Fix Immediately)
1. **Fix notification_preferences RLS policies** - Current policies expose all user data
2. **Create pgTAP test infrastructure** - Directory, setup files, CI integration
3. **Write tests for notification_preferences** - Verify the fix

### Priority 2: HIGH (This Sprint)
1. **Write tests for heygen_deepfake** - Complex policy with OR conditions
2. **Write tests for sync_queue** - Verify service-role-only access
3. **Write tests for sync_config** - Verify service-role-only access

### Priority 3: MEDIUM (Next Sprint)
1. **Write tests for workflow_executions** - Audit trail protection
2. **Write tests for workflow_definitions** - Business logic protection
3. **Write tests for cancellation_reasons** - Read-only verification

### Priority 4: CONSIDER (Future)
1. **Enable RLS on Bubble-synced tables** - user, account_guest, account_host, listing, proposal, bookings_*
2. **Write comprehensive RLS tests** for all user-facing tables
3. **Add admin bypass policies** where needed

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test-rls.yml`:
```yaml
name: Test RLS Policies

on:
  push:
    paths:
      - 'supabase/migrations/**/*.sql'
      - 'supabase/tests/**/*.sql'
  pull_request:
    paths:
      - 'supabase/migrations/**/*.sql'
      - 'supabase/tests/**/*.sql'

jobs:
  test-rls:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: supabase start

      - name: Run pgTAP tests
        run: supabase test db --verbose

      - name: Stop Supabase
        run: supabase stop
```

## Testing Commands

```bash
# Run all RLS tests
supabase test db

# Run specific test file
supabase test db --file supabase/tests/rls_notification_preferences.sql

# Run with verbose output
supabase test db --verbose

# Run specific test plan (if using pg_prove)
pg_prove -U postgres -d postgres -f supabase/tests/rls_*.sql
```

## Summary

**Security Risk Assessment: HIGH**

The Split Lease codebase has no pgTAP tests for Row-Level Security, and several critical issues:

1. **Critical Vulnerability:** `notification_preferences` RLS policies use `(true)` allowing any authenticated user to read/write ALL user preferences

2. **No Test Infrastructure:** No `supabase/tests/` directory, no helper functions, no CI integration

3. **RLS Not Enabled:** Most Bubble-synced tables (user, listing, proposal, bookings_*) have RLS disabled, exposing all data to authenticated users

4. **Architectural Mismatch:** Bubble user IDs (TEXT) don't align with Supabase auth.uid() (UUID), making RLS implementation complex

**Immediate Actions Required:**
1. Create `supabase/tests/` directory and test infrastructure
2. Fix `notification_preferences` RLS policies
3. Write pgTAP tests for all RLS-protected tables
4. Enable RLS on user-facing tables
5. Set up CI/CD to run pgTAP tests on every migration change
