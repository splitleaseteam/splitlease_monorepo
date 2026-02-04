# 🖥️ CLAUDE CODE MISSION: Fix E2E Test Blockers

**Priority:** CRITICAL - 178/344 tests failing  
**Token Budget:** 500,000  
**Estimated Time:** 30-45 minutes

---

## 🚨 CRITICAL BLOCKERS (TESTS WON'T RUN)

### Issue 1: Undefined `page` Variable (9 instances)

Tests reference `page` instead of the fixture parameter. This causes `ReferenceError: page is not defined`.

**File: `e2e/tests/admin.spec.ts`**
| Line | Current Code | Fix |
|------|--------------|-----|
| 23 | `const currentUrl = page.url();` | `const currentUrl = anonymousPage.url();` |
| 253 | `const currentUrl = page.url();` | `const currentUrl = anonymousPage.url();` |
| 446 | `const currentUrl = page.url();` | `const currentUrl = anonymousPage.url();` |
| 575 | `const is404 = page.url().includes('404');` | `const is404 = anonymousPage.url().includes('404');` |
| 630 | `await expect(page.locator('body')).toBeVisible();` | `await expect(anonymousPage.locator('body')).toBeVisible();` |
| 661 | `await expect(page.locator('body')).toBeVisible();` | `await expect(anonymousPage.locator('body')).toBeVisible();` |

**File: `e2e/tests/booking.spec.ts`**
| Line | Current Code | Fix |
|------|--------------|-----|
| 489 | `const profilePage = page.url().includes('account-profile');` | `const profilePage = anonymousPage.url().includes('account-profile');` |
| 575 | `const is404 = page.url().includes('404');` | `const is404 = anonymousPage.url().includes('404');` |

**File: `e2e/tests/profile.spec.ts`**
| Line | Current Code | Fix |
|------|--------------|-----|
| 358 | `const profilePage = new AccountProfilePage(page, SEED_USERS.host.id);` | `const profilePage = new AccountProfilePage(guestBigSpenderPage, SEED_USERS.host.id);` |

---

### Issue 2: Missing Admin Fixture

The `auth.ts` fixture file has fixtures for:
- ✅ `guestBigSpenderPage`
- ✅ `guestHighFlexPage` 
- ✅ `guestAveragePage`
- ✅ `hostPage`
- ✅ `anonymousPage`
- ❌ `adminPage` (MISSING)

Admin tests currently use manual login flows instead of the fixture pattern.

**Fix: Add admin fixture to `e2e/fixtures/auth.ts`**

```typescript
// Add to STORAGE_STATES object (line ~48)
const STORAGE_STATES = {
  guestBigSpender: path.join(AUTH_DIR, 'guest-big-spender.json'),
  guestHighFlex: path.join(AUTH_DIR, 'guest-high-flex.json'),
  guestAverage: path.join(AUTH_DIR, 'guest-average.json'),
  host: path.join(AUTH_DIR, 'host.json'),
  admin: path.join(AUTH_DIR, 'admin.json')  // ADD THIS
};

// Add to AuthFixtures interface (line ~24)
interface AuthFixtures {
  // ... existing ...
  /** Page with Admin user logged in */
  adminPage: Page;
}

// Add fixture implementation (after hostPage, line ~122)
/**
 * Page with Admin user logged in
 * Has admin privileges for thread management
 */
adminPage: async ({ browser }, use) => {
  const context = await browser.newContext({
    storageState: STORAGE_STATES.admin
  });
  const page = await context.newPage();
  await use(page);
  await context.close();
},
```

**Also add admin to `e2e/fixtures/test-data-factory.ts` or `test-users.ts`:**

```typescript
// Add to SEED_USERS
export const SEED_USERS = {
  // ... existing ...
  admin: {
    email: 'e2e-admin@test.splitlease.com',
    password: 'testpassword123',
    id: 'admin-user-id'
  }
};
```

**Update `e2e/global-setup.ts` to create admin auth state.**

---

### Issue 3: Manual Login Flows (40+ tests)

Many tests in `admin.spec.ts` use this repeated pattern:

```typescript
// SLOW: Manual login (20+ seconds per test)
await anonymousPage.goto('/');
const loginButton = anonymousPage.locator('[data-testid="login-button"]...');
await loginButton.click();
const loginModal = anonymousPage.locator('[data-testid="login-modal"]...');
await loginModal.waitFor({ state: 'visible' });
await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
await anonymousPage.locator('input[type="password"]').fill('testpassword123');
await anonymousPage.locator('button[type="submit"]').click();
await anonymousPage.waitForTimeout(2000);
```

**After admin fixture is added, replace with:**

```typescript
// FAST: Pre-authenticated fixture (<1 second)
test('should display thread list for admin', async ({ adminPage }) => {
  const adminThreadsPage = new AdminThreadsPage(adminPage);
  await adminThreadsPage.goto();
  await adminThreadsPage.assertPageLoaded();
});
```

**Tests to refactor (admin.spec.ts):**
- Lines 31-50: `should display thread list for admin`
- Lines 52-71: `should display stats summary`
- Lines 73-92: `should display filter bar`
- Lines 94-117: `should filter by guest email`
- Lines 119-141: `should filter by host email`
- Lines 143-170: `should clear filters`
- Lines 172-195: `should expand thread to view messages`
- Lines 197-216: `should show pagination controls`
- Lines 218-241: `should open reminder modal`
- ... and 15+ more admin tests
- All host tests (lines 248-434)
- All error handling tests (lines 605-662)
- All accessibility tests (lines 669-745)
- All mobile tests (lines 752-829)

---

## 📋 EXECUTION PLAN

### Step 1: Fix Undefined Page (5 minutes)
```bash
# Fix admin.spec.ts - 6 replacements
sed -i 's/const currentUrl = page\.url()/const currentUrl = anonymousPage.url()/g' e2e/tests/admin.spec.ts
sed -i 's/const is404 = page\.url()/const is404 = anonymousPage.url()/g' e2e/tests/admin.spec.ts
sed -i 's/await expect(page\.locator/await expect(anonymousPage.locator/g' e2e/tests/admin.spec.ts

# Fix booking.spec.ts - 2 replacements
sed -i 's/const profilePage = page\.url()/const profilePage = anonymousPage.url()/g' e2e/tests/booking.spec.ts
sed -i 's/const is404 = page\.url()/const is404 = anonymousPage.url()/g' e2e/tests/booking.spec.ts

# Fix profile.spec.ts - 1 replacement
# Change line 358 from:
# const profilePage = new AccountProfilePage(page, SEED_USERS.host.id);
# to:
# const profilePage = new AccountProfilePage(guestBigSpenderPage, SEED_USERS.host.id);
```

### Step 2: Add Admin Fixture (10 minutes)

1. Edit `e2e/fixtures/auth.ts`:
   - Add `admin` to `STORAGE_STATES`
   - Add `adminPage: Page` to `AuthFixtures` interface
   - Add `adminPage` fixture implementation

2. Edit `e2e/fixtures/test-data-factory.ts`:
   - Add `admin` to `SEED_USERS`

3. Edit `e2e/global-setup.ts`:
   - Add admin user creation
   - Add admin auth state generation

### Step 3: Create Admin Auth State File (5 minutes)

Create `e2e/.auth/admin.json` by running global setup:

```bash
npx playwright test --project=setup
```

### Step 4: Refactor Admin Tests (20 minutes)

Replace manual login flows in `admin.spec.ts`:

**Pattern to find:**
```typescript
test('should ...', async ({ anonymousPage }) => {
  // Login as admin
  await anonymousPage.goto('/');
  const loginButton = anonymousPage.locator(...)
  // ... 10 lines of login code ...
```

**Pattern to replace with:**
```typescript
test('should ...', async ({ adminPage }) => {
  // Already logged in via fixture
```

### Step 5: Verify (5 minutes)

```bash
# Run tests to verify fixes
npx playwright test e2e/tests/admin.spec.ts --reporter=line
npx playwright test e2e/tests/booking.spec.ts --reporter=line
npx playwright test e2e/tests/profile.spec.ts --reporter=line

# Full test run
npx playwright test --reporter=list
```

---

## 🎯 SUCCESS CRITERIA

- [ ] Zero `ReferenceError: page is not defined` errors
- [ ] Admin fixture (`adminPage`) available
- [ ] Admin tests use `adminPage` fixture instead of manual login
- [ ] All 344 tests can START (may still fail on data/assertions)
- [ ] Estimated reduction: 178 → ~50 failures

---

## 📁 FILES TO MODIFY

| File | Changes |
|------|---------|
| `e2e/tests/admin.spec.ts` | Fix 6 `page` refs, refactor 30+ tests to use `adminPage` |
| `e2e/tests/booking.spec.ts` | Fix 2 `page` refs |
| `e2e/tests/profile.spec.ts` | Fix 1 `page` ref |
| `e2e/fixtures/auth.ts` | Add `adminPage` fixture |
| `e2e/fixtures/test-data-factory.ts` | Add admin to `SEED_USERS` |
| `e2e/global-setup.ts` | Add admin auth state generation |

---

## 🚀 START NOW

1. **First**: Fix the 9 undefined `page` references (blocking errors)
2. **Second**: Add admin fixture to `auth.ts`
3. **Third**: Update `global-setup.ts` for admin
4. **Fourth**: Refactor admin tests to use `adminPage` fixture
5. **Finally**: Run tests to verify

**Expected result: Tests can run without reference errors, admin tests much faster**
