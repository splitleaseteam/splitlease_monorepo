# Reusable Auth State Opportunity Report
**Generated:** 2026-01-29 11:00:58
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: 6
- Tests with redundant login: **~70+ tests**
- Auth setup exists: **No** (no `*.setup.ts` file)
- Storage state configured: **No**
- Estimated time savings: **~150+ seconds per full test run**

## Performance Impact Analysis

### Current State
```
Each test that requires auth performs UI login:
- Login operation: ~3s per test (UI navigation, form fill, submit, wait)
- auth.spec.ts: ~25 tests with login operations
- booking.spec.ts: ~10 tests with login operations
- admin.spec.ts: ~25 tests with login operations
- profile.spec.ts: ~35 tests with login operations
- Total: ~95 tests × 3s = ~285 seconds just for login operations
```

### With Reusable Auth
```
Setup: Login once per role (3s × 3 roles = 9s)
All 95 tests: Skip login, use saved state
Test time: 95 × 2s = 190s (approx)
Total: 9s + 190s = 199s

Savings: 285s - 9s = ~276 seconds (4.6x faster auth handling)
```

## Configuration Gaps

### Playwright Config Check
- [ ] Setup project defined
- [ ] Storage state path configured
- [ ] Dependencies set on setup project
- [ ] Multiple browser projects configured

### Current Config Status

**Root `playwright.config.ts`:**
```typescript
// Found in: playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  // No setup project
  // No storageState configuration
  // No role-based projects
]
```

**E2E `e2e/playwright.config.ts`:**
```typescript
// Found in: e2e/playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', ... },
  { name: 'mobile-safari', ... },
  { name: 'tablet', ... }
  // No setup project
  // No storageState configuration
  // No role-based projects (buyer/seller/admin)
]
```

## Auth Setup Gaps

### Missing Auth Setup File
- [x] `e2e/auth.setup.ts` exists: **NO**
- [ ] Login flow implemented in setup
- [ ] `storageState()` called to save
- [ ] Verification after login

### Current Auth Implementation

The codebase has an auth fixture at `e2e/fixtures/auth.fixture.ts` that provides:
- `guestPage` - Page with guest user logged in
- `hostPage` - Page with host user logged in
- `adminPage` - Page with admin user logged in
- `anonymousPage` - Page with no authentication

**However, these fixtures are NOT being used in the test files.** Instead, tests perform manual login:

```typescript
// auth.fixture.ts provides fixtures but tests don't use them
export const test = base.extend<AuthFixtures>({
  guestPage: async ({ browser }, use) => {
    // Sets localStorage-based auth state
    await setAuthState(page, SEED_USERS.guest);
    // ...
  }
});
```

### Missing Components
| Component | Status | Impact |
|-----------|--------|--------|
| auth.setup.ts | Missing | Cannot use Playwright's native auth persistence |
| storageState call | Missing | State not saved between test files |
| Verification step | Missing | May save invalid state |
| Fixture usage | Unused | Tests manually log in instead of using fixtures |

## Redundant Login Detection

### Tests With Inline Login
| Test File | Login Count | Lines | Time Wasted |
|-----------|-------------|-------|-------------|
| auth.spec.ts | ~25 | 29-35, 50-52, 64-68, 86-92, etc. | ~75s |
| booking.spec.ts | ~10 | 272-282, 316-327, 367-378, etc. | ~30s |
| admin.spec.ts | ~25 | 34-43, 55-64, 76-85, etc. | ~75s |
| profile.spec.ts | ~35 | 33-43, 57-67, 79-89, etc. | ~105s |
| search.spec.ts | 0 | N/A | 0s |
| accessibility.spec.ts | ~5 | 86-87, 168-169, etc. | ~15s |

### Login Patterns Found

**Pattern 1: Direct login in test (most common)**
```typescript
// Found in: auth.spec.ts:29-35, booking.spec.ts:272-282, admin.spec.ts:34-43, etc.
await homePage.loginButton.click();
const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
await loginModal.waitFor({ state: 'visible' });
await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
await page.locator('input[type="password"]').fill('testpassword123');
await page.locator('button[type="submit"]').click();
await page.waitForTimeout(2000);
```

**Pattern 2: Repeated login in every test within describe block**
```typescript
// Found in: admin.spec.ts - Each test in the file repeats login
test('should display thread list for admin', async ({ page }) => {
  await page.goto('/');
  // ... full login flow ...
});

test('should display stats summary', async ({ page }) => {
  await page.goto('/');
  // ... same full login flow repeated ...
});
```

**Pattern 3: Login not using existing fixtures**
```typescript
// e2e/fixtures/auth.fixture.ts provides guestPage, hostPage, adminPage
// but tests don't import or use them:
import { test, expect } from '@playwright/test';  // Uses base test, not extended
// Should be:
// import { test, expect } from '../fixtures/auth.fixture';
```

## Multi-Role Gaps

### User Roles Identified
| Role | Auth State File | Setup Test | Status |
|------|-----------------|------------|--------|
| Guest | `playwright/.auth/guest.json` | Missing | **Missing** |
| Host | `playwright/.auth/host.json` | Missing | **Missing** |
| Admin | `playwright/.auth/admin.json` | Missing | **Missing** |
| Anonymous | N/A | N/A | N/A |

### Role-Based Test Projects
| Project Name | Test Pattern | Storage State | Status |
|--------------|--------------|---------------|--------|
| guest-tests | *.guest.spec.ts | guest.json | **Missing** |
| host-tests | *.host.spec.ts | host.json | **Missing** |
| admin-tests | *.admin.spec.ts | admin.json | **Missing** |
| anonymous-tests | *.anon.spec.ts | undefined | **Missing** |

## Storage State Gaps

### Missing Files
- [ ] `playwright/.auth/` directory exists: **NO**
- [ ] `guest.json` auth state: **NO**
- [ ] `host.json` auth state: **NO**
- [ ] `admin.json` auth state: **NO**
- [ ] Auth files in `.gitignore`: **Partial** (playwright-report/ and test-results/ are gitignored but not playwright/.auth/)

## Test File Organization Gaps

### Files Without Role Suffix
| Current Name | Suggested Name | Role |
|--------------|----------------|------|
| auth.spec.ts | auth.anon.spec.ts | Anonymous (tests auth flows) |
| booking.spec.ts | booking.guest.spec.ts + booking.anon.spec.ts | Guest/Anonymous |
| admin.spec.ts | admin.admin.spec.ts | Admin |
| profile.spec.ts | profile.guest.spec.ts + profile.host.spec.ts | Guest/Host |
| search.spec.ts | search.anon.spec.ts | Anonymous |
| accessibility.spec.ts | accessibility.mixed.spec.ts | Mixed roles |

## Environment Variables Gaps

### Missing Test Credentials
| Variable | Status | Purpose |
|----------|--------|---------|
| TEST_GUEST_EMAIL | Missing | Guest login (using hardcoded SEED_USERS) |
| TEST_GUEST_PASSWORD | Missing | Guest login (hardcoded: 'testpassword123') |
| TEST_HOST_EMAIL | Missing | Host login (using hardcoded SEED_USERS) |
| TEST_HOST_PASSWORD | Missing | Host login (hardcoded: 'testpassword123') |
| TEST_ADMIN_EMAIL | Missing | Admin login (using hardcoded SEED_USERS) |
| TEST_ADMIN_PASSWORD | Missing | Admin login (hardcoded: 'testpassword123') |

**Current State:** Credentials are hardcoded in `e2e/fixtures/test-data-factory.ts`:
```typescript
export const SEED_USERS = {
  guest: createTestGuest({
    id: 'test-guest-001',
    email: 'testguest@example.com',
    // password hardcoded in tests as 'testpassword123'
  }),
  // ...
};
```

## CI Integration Gaps

### Missing CI Configuration
- [ ] Auth setup runs once before shards
- [ ] Auth state shared across shards
- [ ] Test credentials in CI secrets
- [ ] Auth artifacts not exposed

## Tests With Good Auth Pattern (Reference)

The codebase has auth fixtures at `e2e/fixtures/auth.fixture.ts` that demonstrate the right approach:

```typescript
// Good pattern exists but is NOT USED
export const test = base.extend<AuthFixtures>({
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await setAuthState(page, SEED_USERS.guest);  // Sets localStorage
    await page.reload();
    await use(page);
    await clearAuthState(page);
    await context.close();
  },
  // ... similar for hostPage, adminPage
});
```

**Problem:** Tests import from `@playwright/test` instead of `../fixtures/auth.fixture`:
```typescript
// Current (wrong):
import { test, expect } from '@playwright/test';

// Should be:
import { test, expect } from '../fixtures/auth.fixture';
```

## Recommended Configuration

### 1. Create Auth Setup File

**File:** `e2e/auth.setup.ts`
```typescript
import { test as setup, expect } from '@playwright/test';
import { SEED_USERS } from './fixtures/test-data-factory';

const AUTH_FILES = {
  guest: 'playwright/.auth/guest.json',
  host: 'playwright/.auth/host.json',
  admin: 'playwright/.auth/admin.json',
};

async function authenticate(
  page: any,
  email: string,
  password: string,
  authFile: string
) {
  await page.goto('/');

  // Click login button
  const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
  await loginButton.click();

  // Wait for modal
  const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
  await loginModal.waitFor({ state: 'visible' });

  // Fill credentials
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for auth to complete
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
  await expect(userMenu).toBeVisible({ timeout: 10000 });

  // Save storage state
  await page.context().storageState({ path: authFile });
}

setup('authenticate as guest', async ({ page }) => {
  await authenticate(
    page,
    SEED_USERS.guest.email,
    'testpassword123',
    AUTH_FILES.guest
  );
});

setup('authenticate as host', async ({ page }) => {
  await authenticate(
    page,
    SEED_USERS.host.email,
    'testpassword123',
    AUTH_FILES.host
  );
});

setup('authenticate as admin', async ({ page }) => {
  await authenticate(
    page,
    SEED_USERS.admin.email,
    'testpassword123',
    AUTH_FILES.admin
  );
});
```

### 2. Update Playwright Config

**File:** `e2e/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:8000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    bypassCSP: true
  },
  timeout: 60000,
  expect: { timeout: 10000 },

  projects: [
    // Setup project - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Guest tests (chromium)
    {
      name: 'guest-chromium',
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/guest.json',
      },
      dependencies: ['setup'],
    },

    // Host tests (chromium)
    {
      name: 'host-chromium',
      testMatch: /.*\.host\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/host.json',
      },
      dependencies: ['setup'],
    },

    // Admin tests (chromium)
    {
      name: 'admin-chromium',
      testMatch: /.*\.admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Anonymous tests (no auth)
    {
      name: 'anon-chromium',
      testMatch: /.*\.anon\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined,
      },
    },

    // Cross-browser for critical flows
    {
      name: 'guest-firefox',
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/guest.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'guest-webkit',
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/guest.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'cd ../app && bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  outputDir: 'test-results'
});
```

### 3. Create Auth Directory

```bash
mkdir -p e2e/playwright/.auth
```

### 4. Update .gitignore

Add to `.gitignore`:
```bash
# Playwright auth state (contains session tokens)
playwright/.auth/
e2e/playwright/.auth/
```

### 5. Refactor Test Files

**Example refactor for admin.spec.ts:**

Before (current):
```typescript
// admin.spec.ts - each test logs in manually
import { test, expect } from '@playwright/test';

test('should display thread list for admin', async ({ page }) => {
  await page.goto('/');
  const loginButton = page.locator('[data-testid="login-button"]');
  await loginButton.click();
  // ... full login flow ...
});
```

After (recommended):
```typescript
// admin.admin.spec.ts - uses stored auth state
import { test, expect } from '@playwright/test';
import { AdminThreadsPage } from '../pages';

// Test file uses 'admin-chromium' project with pre-authenticated state
test('should display thread list for admin', async ({ page }) => {
  // No login needed - already authenticated via storageState
  const adminPage = new AdminThreadsPage(page);
  await adminPage.goto();
  await adminPage.assertPageLoaded();
});
```

### 6. Multi-Role Test Fixtures

For tests needing multiple roles simultaneously:

**File:** `e2e/fixtures/multi-role.fixture.ts`
```typescript
import { test as base, Page } from '@playwright/test';

type MultiRoleFixtures = {
  guestPage: Page;
  hostPage: Page;
  adminPage: Page;
};

export const test = base.extend<MultiRoleFixtures>({
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/guest.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  hostPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/host.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
```

## Priority Actions

### High Priority
1. **Create `e2e/auth.setup.ts`** - Single source of truth for authentication
2. **Update `e2e/playwright.config.ts`** - Add setup project and role-based projects
3. **Create `e2e/playwright/.auth/` directory** - Store auth state files
4. **Add auth directory to `.gitignore`** - Prevent committing session tokens

### Medium Priority
5. **Rename test files with role suffixes** - e.g., `admin.admin.spec.ts`
6. **Remove inline login code from tests** - Tests should assume authenticated state
7. **Move credentials to environment variables** - Remove hardcoded passwords

### Low Priority
8. **Add multi-role fixtures** - For tests requiring buyer-seller interactions
9. **Implement API-based auth** - Faster than UI login (use Supabase auth directly)
10. **Configure CI for auth state sharing** - Optimize parallel test execution

## Summary

The Split Lease E2E test suite has **~70+ tests** performing redundant UI-based login operations, wasting approximately **150+ seconds per test run**. The codebase already has auth fixtures (`e2e/fixtures/auth.fixture.ts`) that implement localStorage-based auth, but these are **not being used** by any test files.

The recommended approach is to implement Playwright's native storage state feature:
1. Create a setup project that authenticates once per role
2. Save the storage state (cookies/localStorage) to JSON files
3. Configure test projects to load the appropriate storage state
4. Remove all inline login code from tests

This will result in:
- **~4-5x faster auth handling** (one login per role vs. one login per test)
- **More reliable tests** (less UI interaction = fewer flaky tests)
- **Cleaner test code** (tests focus on functionality, not authentication)
- **Better separation of concerns** (auth logic in one place)
