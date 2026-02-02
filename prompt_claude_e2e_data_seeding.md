# 🖥️ CLAUDE CODE MISSION: Resolve Remaining E2E Failures (Data Seeding)

**Priority:** HIGH - ~50 tests still failing  
**Token Budget:** 400,000  
**Focus:** Data Seeding & Assertion Fixes

---

## 🎯 OBJECTIVE

**Current Status:** Critical blockers (undefined page refs) and Auth fixtures are fixed. However, ~50 tests are likely failing because the **test data** they expect (listings, leases, proposals) doesn't exist in the database.

**Your mission:** Implement robust data seeding and test data factories to provide the environment these tests need to pass.

---

## 📂 CODEBASE RECAP

- **Fixtures:** `e2e/fixtures/`
- **Spec Files:** `e2e/tests/`
- **Auth:** `e2e/fixtures/auth.ts` (ADMIN fixture now exists!)
- **Data Factory:** `e2e/fixtures/test-data-factory.ts` (NEEDS WORK)

---

## 📋 PHASE 1: DIAGNOSE REMAINING FAILURES (100k tokens)

### 1.1 Run Tests and Analyze Failures
```bash
# Run all tests and save report
npx playwright test --reporter=list > e2e_failures.log

# Group failures by file
grep "fail" e2e_failures.log
```

### 1.2 Identify Missing Data Patterns
Check failing tests for these common patterns:
- `expect(locator).toBeVisible()` fails because a list is empty.
- `page.goto('/view-split-lease/XYZ')` fails with 404.
- `expect(text).toContain('Big Spender')` fails because archetype detection returned default/null.

---

## 📋 PHASE 2: IMPLEMENT DATA FACTORY (150k tokens)

### 2.1 Update `e2e/fixtures/test-data-factory.ts`
Implement functions to create the specific data structures the tests expect.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// 1. Create Listings with specific IDs used in tests
export async function seedTestListings() {
  const listings = [
    { _id: 'e2e-listing-001', 'Listing Name': 'E2E Test Apt', ... },
    { _id: 'e2e-listing-002', 'Listing Name': 'Pattern 4 Bidding Apt', ... }
  ];
  await supabase.from('listing').upsert(listings);
}

// 2. Create Leases/Stays for Pattern 1 tests
export async function seedTestLeases(guestId: string) {
  // Create lease associated with the test guest
}

// 3. Create Archetypes
export async function seedArchetypes(users: Record<string, string>) {
  // map guestId to 'big_spender', 'high_flex', etc.
}
```

---

## 📋 PHASE 3: INTEGRATE WITH GLOBAL SETUP (100k tokens)

### 3.1 Update `e2e/global-setup.ts`
Ensure the seeding happens BEFORE the tests run.

```typescript
// global-setup.ts
import { seedTestListings, seedTestLeases, seedArchetypes } from './fixtures/test-data-factory';

async function globalSetup() {
  // ... existing auth setup ...
  
  // SEED DATA
  await seedTestListings();
  const users = await getTestUserIds();
  await seedTestLeases(users.guest_big_spender);
  await seedArchetypes(users);
  
  console.log('✅ Global Data Seeding Complete');
}
```

---

## 📋 PHASE 4: FIX REMAINING ASSERTIONS (50k tokens)

Some tests might fail because:
- **Timings**: Need `waitForSelector` instead of `waitForTimeout`.
- **Selectors**: UI changed and `data-testid` is missing.
- **Role Permissions**: A test is using `hostPage` for an action only an `admin` or the `listing owner` can do.

**Action:** Go file-by-file and fix the "final 10%" of edge case failures.

---

## 🎯 SUCCESS CRITERIA

- [ ] **E2E Pass Rate**: >95% (330+/344 passing)
- [ ] **Data Cleanup**: `global-teardown.ts` removes all `e2e-test-%` data
- [ ] **Stability**: Tests pass consistently in parallel (`fullyParallel: true`)

---

## 🚀 START NOW

1. Run the full suite to get the failure log.
2. Focus on `pattern1-5.spec.ts` first - ensure Patterns 1-5 have their data.
3. Then fix `booking.spec.ts` and `admin.spec.ts`.

**Expected result: A green test suite ready for staging!**
