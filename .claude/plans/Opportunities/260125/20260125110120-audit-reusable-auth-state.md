# Reusable Auth State Opportunity Report
**Generated:** 2026-01-25 11:01:20
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: **0**
- Tests with redundant login: **N/A** (no E2E tests exist)
- Auth setup exists: **No**
- Storage state configured: **No**
- Estimated time savings: **N/A** (opportunity for greenfield implementation)

### Critical Finding

**This codebase has NO E2E tests.** While Playwright is listed as a devDependency in the root `package.json` (v1.57.0), there is no E2E test infrastructure in place:

- No `playwright.config.ts` or `playwright.config.js`
- No `.spec.ts` or `.e2e.ts` files
- No auth setup files (`auth.setup.ts`, `global-setup.ts`)
- No storage state directory (`playwright/.auth/`)
- No E2E test directories (`e2e/`, `tests/`)

### Status Since Previous Audit (2026-01-24)

No changes have been made to add E2E test infrastructure since the previous audit conducted on 2026-01-24. The findings remain the same.

## Performance Impact Analysis

### Current State
```
No E2E tests exist - cannot measure performance impact.
```

### With Reusable Auth (Projected)
```
If E2E tests were implemented:
WITHOUT reusable auth:
  Test 1: Login (3s) + Test (2s) = 5s
  Test 2: Login (3s) + Test (2s) = 5s
  ...
  50 tests × 5s = 250 seconds

WITH reusable auth:
  Setup: Login once per role (3s × 3 roles = 9s)
  Test 1: Test (2s)
  Test 2: Test (2s)
  ...
  9s setup + 50 tests × 2s = 109 seconds (2.3x faster)
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

// Root package.json shows Playwright dependency:
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

Based on the codebase analysis (auth system in `app/src/lib/auth.js`), Split Lease has the following user roles that would need separate auth states:

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

### Current .gitignore Status
```bash
# Currently includes Playwright-related:
videos/
.playwright-mcp/

# MISSING - needs to be added:
playwright/.auth/
```

## Test File Organization Gaps

### Existing Test Infrastructure
| Category | Status | Files Found |
|----------|--------|-------------|
| Unit Tests | Partial | `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` |
| Edge Function Tests (Deno) | Infrastructure Only | `supabase/functions/tests/helpers/assertions.ts`, `fixtures.ts` |
| E2E Tests (Playwright) | **Missing** | 0 files |

### Recommended E2E Directory Structure
```
e2e/
├── auth.setup.ts           # Auth setup for all roles
├── fixtures/
│   └── auth.ts             # Custom auth fixtures
├── tests/
│   ├── search.guest.spec.ts
│   ├── booking.guest.spec.ts
│   ├── listing-dashboard.host.spec.ts
│   ├── proposals.host.spec.ts
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
| TEST_GUEST_EMAIL | Missing | Guest (renter) login |
| TEST_GUEST_PASSWORD | Missing | Guest login |
| TEST_HOST_EMAIL | Missing | Host (property owner) login |
| TEST_HOST_PASSWORD | Missing | Host login |
| TEST_ADMIN_EMAIL | Missing | Admin login |
| TEST_ADMIN_PASSWORD | Missing | Admin login |

### Existing Auth Environment Variables
The app uses Supabase for authentication with these variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Test credentials should be added to:
- `.env.test` (local testing)
- CI/CD secrets (GitHub Actions)

## CI Integration Gaps

### Missing CI Configuration
- [ ] Auth setup runs once before shards - **MISSING**
- [ ] Auth state shared across shards - **MISSING**
- [ ] Test credentials in CI secrets - **MISSING**
- [ ] Auth artifacts not exposed - **MISSING**

### Current CI Configuration
The repository has `.github/workflows/claude.yml` but no E2E test workflow.

## Tests With Good Auth Pattern (Reference)

**No E2E tests exist to serve as reference examples.**

The Edge Function test helpers (`supabase/functions/tests/helpers/`) show good patterns for unit testing but do not include E2E auth patterns.

## Recommended Configuration

### Auth Setup File
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

  // Wait for successful auth redirect (Split Lease redirects to search or dashboard)
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

### Playwright Config
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

    // Guest (renter) tests
    {
      name: 'guest-tests',
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/guest.json',
      },
      dependencies: ['setup'],
    },

    // Host (property owner) tests
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
      name: 'unauthenticated-tests',
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

### Auth Fixtures for Mixed Roles
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

### Supabase API Auth (Faster)
```typescript
// e2e/auth.setup.ts - API-based auth (faster than UI)
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
    // Supabase stores auth in localStorage with project-specific key
    const key = Object.keys(localStorage).find(k => k.includes('auth-token'));
    if (key) {
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, data.session);

  await page.reload();
  await page.waitForURL('/search');

  await page.context().storageState({ path: 'playwright/.auth/guest.json' });
});
```

### Environment Variables
```bash
# .env.test
TEST_GUEST_EMAIL=guest@splitlease-test.com
TEST_GUEST_PASSWORD=TestPassword123!
TEST_HOST_EMAIL=host@splitlease-test.com
TEST_HOST_PASSWORD=TestPassword123!
TEST_ADMIN_EMAIL=admin@splitlease-test.com
TEST_ADMIN_PASSWORD=TestPassword123!
```

### .gitignore Addition
```bash
# Add to .gitignore
playwright/.auth/
```

### CI Configuration
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          TEST_GUEST_EMAIL: ${{ secrets.TEST_GUEST_EMAIL }}
          TEST_GUEST_PASSWORD: ${{ secrets.TEST_GUEST_PASSWORD }}
          TEST_HOST_EMAIL: ${{ secrets.TEST_HOST_EMAIL }}
          TEST_HOST_PASSWORD: ${{ secrets.TEST_HOST_PASSWORD }}
          TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Anti-Patterns to Avoid

| Flag This | Recommend Instead |
|-----------|-------------------|
| Login in every test | Use reusable auth state |
| Hardcoded credentials | Use environment variables |
| Committing auth files | Add to .gitignore |
| Single user for all tests | Separate states per role |
| UI login when API works | Use API auth (faster) |
| No session refresh | Handle token expiration |

## Conclusion

**The Split Lease codebase has no E2E tests, making this audit effectively a gap analysis.** The reusable auth state pattern cannot be applied because there are no tests to optimize.

This represents a significant **greenfield opportunity** to implement E2E testing with best practices from the start, avoiding the technical debt of redundant login operations.

### Recommended Next Steps

1. **Priority 1**: Set up basic Playwright infrastructure
   - Create `playwright.config.ts`
   - Create `e2e/` directory structure
   - Add test scripts to `package.json`
   - Add `playwright/.auth/` to `.gitignore`

2. **Priority 2**: Implement reusable auth from the start
   - Create `auth.setup.ts` with role-based authentication
   - Configure storage state per user role (guest, host, admin)
   - Add auth fixtures for multi-role tests
   - Use API-based auth for faster setup

3. **Priority 3**: Create initial E2E tests
   - Start with critical user flows (search, booking, listing management)
   - Use role-based test file naming (`.guest.spec.ts`, `.host.spec.ts`)
   - Test both authenticated and unauthenticated scenarios

4. **Priority 4**: CI/CD Integration
   - Add E2E tests to GitHub Actions workflow
   - Store test credentials as secrets
   - Configure test sharding for parallel execution

By implementing reusable auth from the beginning, the codebase will avoid accumulating technical debt in the form of redundant login operations across test files.

---

**Audit completed by:** Claude Code
**Next review recommended:** After E2E test infrastructure is implemented
