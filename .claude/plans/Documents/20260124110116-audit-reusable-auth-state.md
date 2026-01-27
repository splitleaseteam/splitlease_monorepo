# Reusable Auth State Audit Report
**Generated:** 2026-01-24 11:01:16
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: **0**
- Tests with redundant login: **N/A** (no E2E tests exist)
- Auth setup exists: **No**
- Storage state configured: **No**
- Estimated time savings: **N/A**

### Critical Finding

**This codebase has NO E2E tests.** While Playwright is listed as a devDependency in the root `package.json`, there is no E2E test infrastructure in place:

- No `playwright.config.ts` or `playwright.config.js`
- No `.spec.ts` or `.e2e.ts` files
- No auth setup files (`auth.setup.ts`, `global-setup.ts`)
- No storage state directory (`playwright/.auth/`)
- No E2E test directories (`e2e/`, `tests/`)

### Existing Test Infrastructure

| Category | Status | Files Found |
|----------|--------|-------------|
| Unit Tests (Vitest) | Partial | `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` |
| Edge Function Tests (Deno) | Infrastructure Only | `supabase/functions/tests/helpers/assertions.ts`, `fixtures.ts` |
| E2E Tests (Playwright) | **Missing** | 0 files |

## Performance Impact Analysis

### Current State
```
No E2E tests exist - cannot measure performance impact.
```

### With Reusable Auth (Projected)
```
If E2E tests were implemented:
- Without reusable auth: X tests × ~5s (3s login + 2s test) = slow
- With reusable auth: 1 login (3s) + X tests × 2s = 2-10x faster
```

## Configuration Gaps

### Playwright Config Check
- [ ] Setup project defined - **MISSING**
- [ ] Storage state path configured - **MISSING**
- [ ] Dependencies set on setup project - **MISSING**
- [ ] Multiple browser projects configured - **MISSING**

### Current Config Status
```typescript
// playwright.config.ts - FILE DOES NOT EXIST
```

**Root package.json shows Playwright dependency:**
```json
{
  "devDependencies": {
    "playwright": "^1.57.0"
  }
}
```

## Auth Setup Gaps

### Missing Auth Setup File
- [ ] `e2e/auth.setup.ts` exists - **MISSING**
- [ ] Login flow implemented - **MISSING**
- [ ] `storageState()` called to save - **MISSING**
- [ ] Verification after login - **MISSING**

### Missing Components
| Component | Status | Impact |
|-----------|--------|--------|
| playwright.config.ts | Missing | No E2E test configuration |
| e2e/ directory | Missing | No E2E test organization |
| auth.setup.ts | Missing | Cannot reuse auth |
| storageState call | Missing | State not saved |
| Verification step | Missing | May save invalid state |

## Redundant Login Detection

### Tests With Inline Login
| Test File | Login Count | Lines | Time Wasted |
|-----------|-------------|-------|-------------|
| N/A | 0 | N/A | N/A |

**No E2E test files exist to analyze for redundant login patterns.**

### Login Patterns Found
```typescript
// No E2E test files found in the codebase
```

## Multi-Role Gaps

Based on the codebase analysis, Split Lease has the following user roles that would need separate auth states:

### User Roles Identified
| Role | Auth State File | Setup Test | Status |
|------|-----------------|------------|--------|
| Guest (Renter) | N/A | N/A | Missing |
| Host (Property Owner) | N/A | N/A | Missing |
| Admin | N/A | N/A | Missing |
| Unauthenticated | N/A | N/A | N/A |

### Role-Based Test Projects
| Project Name | Test Pattern | Storage State | Status |
|--------------|--------------|---------------|--------|
| guest-tests | *.guest.spec.ts | guest.json | Missing |
| host-tests | *.host.spec.ts | host.json | Missing |
| admin-tests | *.admin.spec.ts | admin.json | Missing |
| unauthenticated-tests | *.unauth.spec.ts | undefined | Missing |

## Storage State Gaps

### Missing Files
- [ ] `playwright/.auth/` directory exists - **MISSING**
- [ ] `guest.json` auth state - **MISSING**
- [ ] `host.json` auth state - **MISSING**
- [ ] `admin.json` auth state - **MISSING**
- [ ] Auth files in `.gitignore` - **MISSING**

**.gitignore currently includes:**
```bash
# Playwright video recordings
videos/

# Agent Context and Tools directories
.playwright-mcp/
```

**Needs to be added:**
```bash
playwright/.auth/
```

## Test File Organization Gaps

### E2E Directory Structure
```
Recommended structure (MISSING):
e2e/
├── auth.setup.ts           # Auth setup for all roles
├── fixtures/
│   └── auth.ts            # Custom auth fixtures
├── tests/
│   ├── booking.guest.spec.ts
│   ├── listing.host.spec.ts
│   ├── admin.admin.spec.ts
│   └── landing.unauth.spec.ts
└── page-objects/           # Page Object Model classes
    ├── LoginPage.ts
    ├── SearchPage.ts
    └── ListingPage.ts
```

## Environment Variables Gaps

### Missing Test Credentials
| Variable | Status | Purpose |
|----------|--------|---------|
| TEST_GUEST_EMAIL | Missing | Guest login |
| TEST_GUEST_PASSWORD | Missing | Guest login |
| TEST_HOST_EMAIL | Missing | Host login |
| TEST_HOST_PASSWORD | Missing | Host login |
| TEST_ADMIN_EMAIL | Missing | Admin login |
| TEST_ADMIN_PASSWORD | Missing | Admin login |

### Existing Auth Environment Variables
The app already uses Supabase for authentication. Test credentials should be added to:
- `.env.test` (local testing)
- CI/CD secrets (GitHub Actions)

## CI Integration Gaps

### Missing CI Configuration
- [ ] Auth setup runs once before shards - **MISSING**
- [ ] Auth state shared across shards - **MISSING**
- [ ] Test credentials in CI secrets - **MISSING**
- [ ] Auth artifacts not exposed - **MISSING**

### Current CI Configuration
```yaml
# .github/workflows/claude.yml exists but has no E2E test steps
```

## Tests With Good Auth Pattern (Reference)

**No E2E tests exist to serve as reference examples.**

## Recommended Implementation Plan

### Phase 1: E2E Infrastructure Setup

1. **Create Playwright Config**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Guest tests
    {
      name: 'guest-tests',
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/guest.json',
      },
      dependencies: ['setup'],
    },

    // Host tests
    {
      name: 'host-tests',
      testMatch: /.*\.host\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/host.json',
      },
      dependencies: ['setup'],
    },

    // Admin tests
    {
      name: 'admin-tests',
      testMatch: /.*\.admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Unauthenticated tests
    {
      name: 'guest-tests',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined,
      },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: './app',
  },
});
```

2. **Create Auth Setup File**
```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

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
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for successful auth redirect
  await page.waitForURL(/\/(search|listing-dashboard|admin)/);

  // Save auth state
  await page.context().storageState({ path: authFile });
}

setup('authenticate as guest', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_GUEST_EMAIL!,
    process.env.TEST_GUEST_PASSWORD!,
    AUTH_FILES.guest
  );
});

setup('authenticate as host', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_HOST_EMAIL!,
    process.env.TEST_HOST_PASSWORD!,
    AUTH_FILES.host
  );
});

setup('authenticate as admin', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_ADMIN_EMAIL!,
    process.env.TEST_ADMIN_PASSWORD!,
    AUTH_FILES.admin
  );
});
```

3. **Create Auth Fixtures**
```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  guestPage: Page;
  hostPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
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

4. **Update .gitignore**
```bash
# Add to .gitignore
playwright/.auth/
```

5. **Create Environment File**
```bash
# .env.test
TEST_GUEST_EMAIL=guest@splitlease-test.com
TEST_GUEST_PASSWORD=TestPassword123!
TEST_HOST_EMAIL=host@splitlease-test.com
TEST_HOST_PASSWORD=TestPassword123!
TEST_ADMIN_EMAIL=admin@splitlease-test.com
TEST_ADMIN_PASSWORD=TestPassword123!
```

6. **Add package.json Scripts**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Phase 2: Sample E2E Tests

**Guest Test Example:**
```typescript
// e2e/tests/search.guest.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search Page - Guest', () => {
  test('can search for listings', async ({ page }) => {
    await page.goto('/search');

    // Search is already authenticated via storageState
    await page.getByPlaceholder('Search by neighborhood').fill('East Village');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByTestId('listing-card')).toHaveCount.greaterThan(0);
  });

  test('can view listing details', async ({ page }) => {
    await page.goto('/search');
    await page.getByTestId('listing-card').first().click();

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /book|express interest/i })).toBeVisible();
  });
});
```

**Host Test Example:**
```typescript
// e2e/tests/listing-dashboard.host.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Listing Dashboard - Host', () => {
  test('can view own listings', async ({ page }) => {
    await page.goto('/listing-dashboard');

    // Host is already authenticated via storageState
    await expect(page.getByRole('heading', { name: /my listings/i })).toBeVisible();
  });

  test('can edit listing', async ({ page }) => {
    await page.goto('/listing-dashboard');
    await page.getByRole('button', { name: 'Edit' }).first().click();

    await expect(page.getByRole('heading', { name: /edit listing/i })).toBeVisible();
  });
});
```

### Supabase API Auth (Faster Alternative)
```typescript
// e2e/auth.setup.ts - API-based auth
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

setup('authenticate with Supabase API', async ({ page }) => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_GUEST_EMAIL!,
    password: process.env.TEST_GUEST_PASSWORD!,
  });

  if (error) throw error;

  // Navigate and inject auth state
  await page.goto('/');

  await page.evaluate((session) => {
    localStorage.setItem(
      `sb-${process.env.VITE_SUPABASE_PROJECT_REF}-auth-token`,
      JSON.stringify(session)
    );
  }, data.session);

  await page.reload();
  await page.waitForURL('/search');

  await page.context().storageState({ path: 'playwright/.auth/guest.json' });
});
```

## Anti-Patterns to Avoid

| Anti-Pattern | Better Approach |
|--------------|-----------------|
| Login in every test | Use reusable auth state |
| Hardcoded credentials | Use environment variables |
| Committing auth files | Add to .gitignore |
| Single user for all tests | Separate states per role |
| UI login when API works | Use API auth (faster) |
| No session refresh | Handle token expiration |

## Conclusion

**The Split Lease codebase has no E2E tests, making this audit effectively a gap analysis.** The reusable auth state pattern cannot be applied because there are no tests to optimize.

### Recommended Next Steps

1. **Priority 1**: Set up basic Playwright infrastructure
   - Create `playwright.config.ts`
   - Create `e2e/` directory structure
   - Add test scripts to `package.json`

2. **Priority 2**: Implement reusable auth from the start
   - Create `auth.setup.ts` with role-based authentication
   - Configure storage state per user role
   - Add auth fixtures for multi-role tests

3. **Priority 3**: Create initial E2E tests
   - Start with critical user flows (search, booking, listing management)
   - Use Page Object Model for maintainability
   - Test both authenticated and unauthenticated scenarios

4. **Priority 4**: CI/CD Integration
   - Add E2E tests to GitHub Actions workflow
   - Store test credentials as secrets
   - Configure test sharding for parallel execution

By implementing reusable auth from the beginning, the codebase will avoid accumulating technical debt in the form of redundant login operations across test files.
