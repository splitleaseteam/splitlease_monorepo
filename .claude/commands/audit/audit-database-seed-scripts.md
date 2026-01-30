---
name: audit-database-seed-scripts
description: Audit the codebase to find tests that create data inline without proper factories or seed scripts. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Database Seed Scripts Audit

You are conducting a comprehensive audit to identify tests that create data inline without using proper factory patterns or seed scripts. Good seed data is the foundation of reliable integration and E2E tests.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Test files with inline data creation** - Look for:
   - Direct `supabase.from('table').insert()` in test files
   - Hardcoded test data without factory functions
   - `beforeEach` blocks creating data manually
   - Duplicate test data across multiple files

2. **Missing factory functions** - Check if `tests/fixtures/` exists with:
   - User factory (`users.ts`)
   - Listing factory (`listings.ts`)
   - Booking factory (`bookings.ts`)
   - Other entity factories

3. **Missing cleanup utilities** - Check for:
   - `afterEach` cleanup hooks
   - `cleanupUser`, `cleanupTestData` functions
   - Foreign key order cleanup

4. **Tests with hardcoded UUIDs** - Look for:
   - `'11111111-1111-1111-1111-111111111111'` patterns
   - Same UUIDs across multiple files
   - No dynamic ID generation

5. **SQL seed files** - Check `supabase/seed.sql` for:
   - Test data seeding
   - Proper relationships

### What to Check for Each Test File

For each test file, check:
- Does it use factory functions or inline data?
- Are test UUIDs hardcoded or generated?
- Is there proper cleanup after tests?
- Are foreign key relationships respected?
- Is data isolated between tests?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-database-seed-scripts.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Database Seed Scripts Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Test files found: X
- Tests with inline data creation: X
- Missing factory functions: X entities
- Tests without cleanup: X

## Infrastructure Check

### Seed Infrastructure Status
- [ ] `tests/fixtures/` directory exists
- [ ] Factory functions per entity exist
- [ ] `tests/helpers/cleanup.ts` exists
- [ ] `supabase/seed.sql` exists
- [ ] Global test setup exists

### Current Factories (if any)
| Entity | Factory File | Used in Tests |
|--------|--------------|---------------|
| User | tests/fixtures/users.ts | Yes/No |
| Listing | ? | ? |
| Booking | ? | ? |

## Critical Gaps (Inline Data Creation)

### Test File: [filename.test.ts]
- **File:** `path/to/test.ts`
- **Inline Data Found:**
  ```typescript
  // Line X
  await supabase.from('users').insert({ id: 'hardcoded-uuid', ... })
  ```
- **Issues:**
  - Hardcoded UUIDs
  - No factory function used
  - Missing cleanup
- **Recommendation:** Use `seedUser()` factory

### Hardcoded UUID Map

| UUID | Files Using It | Risk |
|------|----------------|------|
| `11111111-...` | test1.ts, test2.ts | Test collision |
| `aaaaaaaa-...` | test3.ts | Shared state |

## Missing Entity Factories

### 1. User Factory
- **Tables Needing Factory:** `auth.users`, `profiles`
- **Tests Creating Users Inline:**
  - `auth.test.ts` (lines 10, 25, 40)
  - `booking.test.ts` (line 15)
- **Recommended Factory:**
  ```typescript
  export async function seedUser(client, overrides = {}) {
    return client.auth.admin.createUser({
      email: `test-${faker.string.uuid()}@test.com`,
      ...overrides
    })
  }
  ```

### 2. [Entity Name]
- **Tables:** ...
- **Tests Creating Inline:** ...

## Cleanup Gaps

### Tests Without Cleanup
| Test File | Creates Data | Has Cleanup |
|-----------|--------------|-------------|
| auth.test.ts | Users | No |
| booking.test.ts | Users, Listings, Bookings | Partial |

### Foreign Key Cleanup Order
For proper cleanup, delete in order:
1. Messages
2. Bookings
3. Listings
4. Users

## Data Isolation Issues

### Tests Sharing State
- `test1.ts` and `test2.ts` both use UUID `seller-123`
- Tests may fail when run in parallel or different order

### Recommended Isolation Pattern
```typescript
beforeEach(async () => {
  testData = await seedMinimal(adminClient)
})

afterEach(async () => {
  await cleanupTestData(adminClient, testData)
})
```

## Tests with Good Seed Patterns (Reference)

List tests that already use proper factories and cleanup.

## Recommended File Structure

```
tests/
├── fixtures/
│   ├── users.ts          # User factory
│   ├── listings.ts       # Listing factory
│   ├── bookings.ts       # Booking factory
│   └── index.ts          # Combined seed runner
├── helpers/
│   ├── db.ts             # Database connection
│   ├── seed.ts           # Seed orchestration
│   └── cleanup.ts        # Cleanup utilities
└── setup.ts              # Global test setup
```

```

---

## Reference: Database Seed Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### Core Principles

1. **REPRODUCIBLE**: Same seed = same state every time
2. **ISOLATED**: Each test can have independent data
3. **REALISTIC**: Data mirrors production patterns
4. **FAST**: Seed quickly, clean up quickly
5. **RELATIONAL**: Proper foreign keys and constraints

### When to Recommend Seed Scripts

- Setting up integration test infrastructure
- Creating E2E test fixtures
- Ensuring consistent test state across CI runs
- Testing complex data relationships

### Pattern 1: Factory Function

```typescript
export function createUserData(overrides = {}) {
  return {
    email: `test-${faker.string.uuid()}@test.com`,
    password: 'TestPassword123!',
    role: 'buyer',
    ...overrides,
  }
}

export async function seedUser(client, overrides = {}) {
  const userData = createUserData(overrides)
  const { data } = await client.auth.admin.createUser(userData)
  return { id: data.user.id, ...userData }
}
```

### Pattern 2: Predefined Test Users

```typescript
export const TEST_USERS = {
  buyer: createUserData({
    email: 'buyer@test.com',
    role: 'buyer',
  }),
  seller: createUserData({
    email: 'seller@test.com',
    role: 'seller',
  }),
}
```

### Pattern 3: Cleanup Utilities

```typescript
export async function cleanupUser(client, userId) {
  // Delete in FK order
  await client.from('bookings').delete().eq('buyer_id', userId)
  await client.from('listings').delete().eq('seller_id', userId)
  await client.auth.admin.deleteUser(userId)
}
```

### Pattern 4: Per-Test Isolation

```typescript
let testData

beforeEach(async () => {
  testData = await seedMinimal(adminClient)
})

afterEach(async () => {
  await cleanupTestData(adminClient, testData)
})
```

### Pattern 5: Combined Seed

```typescript
export async function seedMarketplace(client) {
  const buyer = await seedUser(client, { role: 'buyer' })
  const seller = await seedUser(client, { role: 'seller' })
  const listing = await seedListing(client, seller.id)
  const booking = await seedBooking(client, listing.id, buyer.id, seller.id)

  return { buyer, seller, listing, booking }
}
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Hardcoded UUIDs in tests | Use factory with faker |
| Duplicate data creation | Centralized factories |
| No cleanup after tests | `afterEach` cleanup |
| Tests depending on order | Per-test isolation |
| Giant monolithic seed | Composable factories |
| Real emails in tests | Use `@test.com` pattern |

## Output Requirements

1. Be thorough - review EVERY test file
2. Be specific - include exact file paths and line numbers for inline data creation
3. Be actionable - provide factory templates for missing entities
4. Only report gaps - do not list tests that already use proper factories unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-database-seed-scripts.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
