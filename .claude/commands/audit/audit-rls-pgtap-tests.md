---
name: audit-rls-pgtap-tests
description: Audit the codebase to find Supabase tables with Row-Level Security (RLS) policies that lack pgTAP tests. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# RLS pgTAP Testing Audit

You are conducting a comprehensive audit to identify Supabase tables with Row-Level Security (RLS) policies that do not have proper pgTAP test coverage. RLS is the security foundation for multi-tenant applications—broken RLS means users can see or modify other users' data.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Tables with RLS policies** - Look in migrations for:
   - `alter table ... enable row level security`
   - `create policy ... on ...`
   - `using (auth.uid() = user_id)`
   - Tables with `user_id`, `seller_id`, `buyer_id`, `owner_id` columns

2. **Multi-tenant tables** - Look for tables storing:
   - Listings (seller-scoped)
   - Bookings (buyer-scoped)
   - Messages (sender/recipient scoped)
   - Profiles (user-scoped)
   - Reviews (author-scoped)
   - Any table with foreign key to `auth.users`

3. **RLS policies by operation** - Look for policies for:
   - SELECT policies
   - INSERT policies
   - UPDATE policies
   - DELETE policies

4. **Role-based policies** - Look for:
   - Admin bypass policies
   - Service role policies
   - Role checks in policies (`app_metadata->>'role'`)

5. **Existing pgTAP tests** - Check `supabase/tests/` for:
   - `rls_*.sql` files
   - Test files using `select plan()`
   - Tests setting JWT claims

### What to Check for Each Table

For each table with RLS:
- Does a pgTAP test file exist for this table?
- Are all CRUD operations tested (SELECT, INSERT, UPDATE, DELETE)?
- Are cross-tenant access attempts tested?
- Are role-based access paths tested (admin, user)?
- Are edge cases tested (null values, empty results)?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-rls-pgtap-tests.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# RLS pgTAP Testing Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Tables with RLS enabled: X
- Tables needing pgTAP tests: X
- Policies without test coverage: X
- Security risk level: High/Medium/Low

## Infrastructure Check

### pgTAP Setup Status
- [ ] pgTAP extension enabled in database
- [ ] Test helper functions exist (`set_auth_user`, etc.)
- [ ] `supabase/tests/` directory exists
- [ ] CI/CD runs `supabase test db`

## Critical Gaps (No Tests at All)

### Table: [table_name]
- **Migration:** `supabase/migrations/XXXXXXXX_create_table.sql`
- **RLS Policies Found:**
  - SELECT: `policy_name` using `(auth.uid() = user_id)`
  - INSERT: `policy_name` with check `(auth.uid() = user_id)`
  - UPDATE: [missing or exists]
  - DELETE: [missing or exists]
- **User Scope Column:** `user_id` / `seller_id` / etc.
- **Why Testing Critical:** [e.g., Contains sensitive user data]
- **Required Tests:**
  - [ ] User can SELECT own records only
  - [ ] User cannot SELECT other users' records
  - [ ] User can INSERT with own user_id only
  - [ ] User cannot INSERT for other users
  - [ ] User can UPDATE own records only
  - [ ] User can DELETE own records only

## Partial Coverage Gaps

### Table: [table_name]
- **Test File:** `supabase/tests/rls_tablename.sql`
- **Tested Operations:** SELECT, INSERT
- **Missing Tests:**
  - [ ] UPDATE policy test
  - [ ] DELETE policy test
  - [ ] Admin bypass test
  - [ ] Cross-tenant access attempt test

## Policy-Specific Gaps

### Policy: [policy_name] on [table_name]
- **Operation:** SELECT/INSERT/UPDATE/DELETE
- **Policy Definition:**
  ```sql
  using (auth.uid() = user_id)
  ```
- **Missing Test Scenarios:**
  - [ ] Authorized access
  - [ ] Unauthorized access attempt
  - [ ] Edge case: null user_id

## Role-Based Access Gaps

### Admin Access Policies
| Table | Admin Policy Exists | Admin Test Exists |
|-------|---------------------|-------------------|
| listings | Yes | No |
| bookings | Yes | No |

### Service Role Access
| Table | Service Role Bypass | Tested |
|-------|---------------------|--------|
| listings | Yes | No |

## Tables with Good Coverage (Reference)

List tables that already have comprehensive pgTAP tests as examples.

## Recommended Test Templates

### Basic SELECT Policy Test
```sql
begin;
select plan(2);

set local role postgres;
insert into auth.users (id, email) values
  ('user-aaa', 'a@test.com'),
  ('user-bbb', 'b@test.com');

insert into [table_name] (id, user_id) values
  ('record-1', 'user-aaa'),
  ('record-2', 'user-bbb');

set local role authenticated;
set local request.jwt.claim.sub = 'user-aaa';

select is(
  (select count(*)::int from [table_name]),
  1,
  'User sees only own records'
);

select is(
  (select count(*)::int from [table_name] where id = 'record-2'),
  0,
  'User cannot see other user records'
);

select * from finish();
rollback;
```

### INSERT Policy Test
```sql
select lives_ok(
  $$insert into [table_name] (user_id, ...) values ('user-aaa', ...)$$,
  'User can create own record'
);

select throws_ok(
  $$insert into [table_name] (user_id, ...) values ('user-bbb', ...)$$,
  '42501',
  'User cannot create record for other user'
);
```

### UPDATE Policy Test
```sql
select is(
  (select count(*)::int from (
    update [table_name] set ... where id = 'other-user-record' returning id
  ) as updated),
  0,
  'Cannot update other user record'
);
```

## Security Checklist

| Table | SELECT | INSERT | UPDATE | DELETE | Admin | Cross-Tenant |
|-------|--------|--------|--------|--------|-------|--------------|
| listings | ? | ? | ? | ? | ? | ? |
| bookings | ? | ? | ? | ? | ? | ? |
| messages | ? | ? | ? | ? | ? | ? |

```

---

## Reference: RLS pgTAP Testing Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### When to Recommend RLS Testing

- Creating new tables with user-scoped data
- Modifying existing RLS policies
- Adding new roles or permission levels
- Security audits before deployment
- Debugging data visibility issues

### Core pgTAP Test Structure

```sql
begin;
select plan(N);  -- N = number of assertions

-- 1. Set up test context (simulate authenticated user)
set local role authenticated;
set local request.jwt.claim.sub = 'user-uuid-here';

-- 2. Run assertions
select is(...);
select results_eq(...);

-- 3. Finish and rollback
select * from finish();
rollback;
```

### Pattern 1: Testing SELECT Policy

```sql
-- User sees only own records
select is(
  (select count(*)::int from listings),
  2,
  'Seller sees exactly 2 listings'
);

-- User cannot see other user's records
select is(
  (select count(*)::int from listings where id = 'other-user-listing'),
  0,
  'Seller cannot see other seller listing'
);
```

### Pattern 2: Testing INSERT Policy

```sql
-- Can create own
select lives_ok(
  $$insert into listings (title, seller_id) values ('My Room', 'user-aaa')$$,
  'User can create own listing'
);

-- Cannot create for others
select throws_ok(
  $$insert into listings (title, seller_id) values ('Fake', 'other-user')$$,
  '42501',
  'Cannot create listing for another user'
);
```

### Pattern 3: Testing UPDATE Policy

```sql
-- Can update own
select lives_ok(
  $$update listings set price = 150 where id = 'my-listing'$$,
  'Seller can update own listing'
);

-- Cannot update others (RLS silently filters)
select is(
  (select count(*)::int from (
    update listings set price = 999 where id = 'other-listing' returning id
  ) as updated),
  0,
  'Cannot update other seller listing'
);
```

### Pattern 4: Testing DELETE Policy

```sql
-- Can delete own
select is(
  (select count(*)::int from (
    delete from listings where id = 'my-listing' returning id
  ) as deleted),
  1,
  'Seller can delete own listing'
);

-- Cannot delete others
select is(
  (select count(*)::int from (
    delete from listings where id = 'other-listing' returning id
  ) as deleted),
  0,
  'Cannot delete other seller listing'
);
```

### Pattern 5: Testing Admin Bypass

```sql
set local request.jwt.claim.sub = 'admin-user';
set local request.jwt.claims = '{"app_metadata": {"role": "admin"}}';

select is(
  (select count(*)::int from listings),
  10,  -- All listings
  'Admin sees all listings'
);
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Testing without `rollback` | Always end with `rollback` |
| Only testing SELECT policies | Test all CRUD operations |
| Testing only happy path | Test unauthorized access explicitly |
| No cross-tenant tests | Test user A cannot access user B's data |
| Missing admin tests | Test admin bypass policies |

## Output Requirements

1. Be thorough - review EVERY migration file and test file
2. Be specific - include exact file paths and policy names
3. Be actionable - provide SQL templates for missing tests
4. Only report gaps - do not list tables that already have proper pgTAP coverage unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-rls-pgtap-tests.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
