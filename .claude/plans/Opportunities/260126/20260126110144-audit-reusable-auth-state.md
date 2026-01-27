# Reusable Auth State Opportunity Report
**Generated:** 2026-01-26T11:01:44
**Codebase:** Split Lease (splitlease)

## Executive Summary
- E2E test files found: **0**
- Tests with redundant login: **N/A (no E2E tests exist)**
- Auth setup exists: **No**
- Storage state configured: **No**
- Playwright installed: **Yes** (v1.57.0 in root package.json)
- Estimated time savings: **Significant** (when E2E tests are implemented)

## Current State Analysis

### What Exists
| Component | Status | Location |
|-----------|--------|----------|
| Playwright dependency | Installed | `package.json` (root) |
| Playwright MCP skill | Exists | `.claude/skills/playwrightTestGuideLoginInstructions/` |
| Test credentials env vars | Documented | Skill mentions `TESTHOSTEMAILADDRESS`, `TESTGUESTEMAILADDRESS`, `TESTPASSWORD` |
| Auth library | Comprehensive | `app/src/lib/auth.js` |
| Unit test helpers | Exist | `supabase/functions/tests/helpers/` |
| .gitignore for Playwright | Partial | `storage.json`, `.playwright-mcp/`, `videos/` |

### What's Missing
| Component | Status | Impact |
|-----------|--------|--------|
| `playwright.config.ts` | Missing | Cannot configure test runner |
| `e2e/` directory | Missing | No dedicated E2E test folder |
| Auth setup file (`auth.setup.ts`) | Missing | No reusable auth state |
| Storage state directory | Missing | Auth state not persisted |
| E2E test files (`.spec.ts`) | Missing | No E2E tests to run |
| Test runner scripts | Missing | No `npm test:e2e` command |

## Performance Impact Analysis

### Without Reusable Auth (Current Risk)
When E2E tests are added without reusable auth state:
```
Test 1: Login (3s) + Test (2s) = 5s
Test 2: Login (3s) + Test (2s) = 5s
Test 3: Login (3s) + Test (2s) = 5s
...
50 tests × 5s = 250 seconds
```

### With Reusable Auth (Recommended Setup)
```
Setup: Login once (3s)
Test 1: Test (2s)
Test 2: Test (2s)
Test 3: Test (2s)
...
1 login + 50 tests × 2s = 103 seconds (2.4x faster)
```

**Projected savings:** ~60% reduction in E2E test execution time

## Configuration Gaps

### Playwright Config Check
- [ ] Setup project defined
- [ ] Storage state path configured
- [ ] Dependencies set on setup project
- [ ] Multiple browser projects configured
- [ ] Test directory configured

### Current Config Status
```typescript
// playwright.config.ts - FILE DOES NOT EXIST
// No Playwright configuration found in the codebase
```

## Auth Setup Gaps

### Missing Auth Setup File
- [ ] `e2e/auth.setup.ts` exists
- [ ] Login flow implemented
- [ ] `storageState()` called to save
- [ ] Verification after login
- [ ] Multiple user role support

### User Roles Identified (from codebase analysis)
| Role | Environment Variable | Auth State File | Status |
|------|---------------------|-----------------|--------|
| Host | `TESTHOSTEMAILADDRESS` | `playwright/.auth/host.json` | Missing |
| Guest | `TESTGUESTEMAILADDRESS` | `playwright/.auth/guest.json` | Missing |
| Unauthenticated | N/A | N/A | N/A |

### Login Flow Analysis
Based on `app/src/lib/auth.js` and the Playwright skill, the login flow:
1. Navigate to login page
2. Fill email input (`input[type="email"]`)
3. Fill password input (`input[type="password"]`)
4. Submit form (`button[type="submit"]`)
5. Wait for redirect to authenticated state
6. Verify header shows username/profile pic instead of "Sign In"/"Sign Up"

## Storage State Gaps

### Missing Files and Directories
- [ ] `playwright/.auth/` directory exists
- [ ] `host.json` auth state
- [ ] `guest.json` auth state
- [ ] Auth files in `.gitignore`

### Current .gitignore Status
```
# Already in .gitignore:
storage.json              # Generic storage file
.playwright-mcp/          # MCP-specific directory
videos/                   # Video recordings

# MISSING from .gitignore:
playwright/.auth/         # Auth state files should be added
```

## Test Infrastructure Gaps

### Missing Directory Structure
```
e2e/                              # MISSING - E2E test root
├── auth.setup.ts                 # MISSING - Auth setup
├── fixtures/                     # MISSING - Custom fixtures
│   └── auth.ts                   # MISSING - Auth fixtures
├── tests/                        # MISSING - Test files
│   ├── booking.guest.spec.ts     # MISSING
│   ├── listing.host.spec.ts      # MISSING
│   └── public.guest.spec.ts      # MISSING
└── playwright.config.ts          # MISSING - Config
```

### Missing Package.json Scripts
```json
// Currently in app/package.json - NO E2E scripts
{
  "scripts": {
    // MISSING:
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Environment Variables Gaps

### Test Credentials Status
| Variable | Documented In | Set In Environment | Status |
|----------|--------------|-------------------|--------|
| `TESTHOSTEMAILADDRESS` | Playwright skill | Unknown | Needs verification |
| `TESTGUESTEMAILADDRESS` | Playwright skill | Unknown | Needs verification |
| `TESTPASSWORD` | Playwright skill | Unknown | Needs verification |

### Missing CI Environment Variables
| Variable | Purpose | CI Secret Required |
|----------|---------|-------------------|
| `TEST_HOST_EMAIL` | Host test account | Yes |
| `TEST_HOST_PASSWORD` | Host test password | Yes |
| `TEST_GUEST_EMAIL` | Guest test account | Yes |
| `TEST_GUEST_PASSWORD` | Guest test password | Yes |

## Existing Auth Patterns (Reference)

### Login Detection Pattern (from Playwright skill)
```javascript
// Logged Out State indicators:
// - "Sign In" button visible in header
// - "Sign Up" button visible in header

// Logged In State indicators:
// - Username visible in header
// - Profile picture/avatar visible
// - "Sign In"/"Sign Up" buttons NOT visible

// User Type Detection:
// - "Stay with Us" in navigation = Guest account
// - "Host with Us" in navigation = Host account
```

### Auth API (from auth.js)
```javascript
// Login via Edge Function
await loginUser(email, password);

// Logout
await logoutUser();

// Check auth status
await checkAuthStatus();

// OAuth flows available:
// - LinkedIn OAuth
// - Google OAuth
```

## Recommended Implementation

### 1. Create Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

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
    // Auth setup - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
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

    // Unauthenticated tests
    {
      name: 'public-tests',
      testMatch: /.*\.public\.spec\.ts/,
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
  },
})
```

### 2. Create Auth Setup File
```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

const AUTH_FILES = {
  host: 'playwright/.auth/host.json',
  guest: 'playwright/.auth/guest.json',
}

async function authenticate(
  page: any,
  email: string,
  password: string,
  authFile: string,
  expectedNav: string // 'Host with Us' or 'Stay with Us'
) {
  // Navigate to login
  await page.goto('/signup-login')

  // Fill credentials
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for authenticated state
  await expect(page.getByText(/sign in/i)).not.toBeVisible()
  await expect(page.getByText(expectedNav)).toBeVisible()

  // Save state
  await page.context().storageState({ path: authFile })
}

setup('authenticate as host', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_HOST_EMAIL!,
    process.env.TEST_HOST_PASSWORD!,
    AUTH_FILES.host,
    'Host with Us'
  )
})

setup('authenticate as guest', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_GUEST_EMAIL!,
    process.env.TEST_GUEST_PASSWORD!,
    AUTH_FILES.guest,
    'Stay with Us'
  )
})
```

### 3. Create Auth Fixtures for Multi-Role Tests
```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  hostPage: Page
  guestPage: Page
}

export const test = base.extend<AuthFixtures>({
  hostPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/host.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/guest.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
```

### 4. Update .gitignore
```bash
# Add to .gitignore:
playwright/.auth/
playwright-report/
test-results/
```

### 5. Add Package.json Scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 6. Supabase API Auth (Faster Alternative)
```typescript
// e2e/auth.setup.ts - API-based auth (faster)
import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

setup('authenticate with Supabase API', async ({ page }) => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )

  // API-based login (no UI interaction needed)
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      action: 'login',
      payload: {
        email: process.env.TEST_HOST_EMAIL!,
        password: process.env.TEST_HOST_PASSWORD!,
      }
    })
  })

  const data = await response.json()

  if (!data.success) throw new Error('Login failed')

  // Navigate to app and inject session
  await page.goto('/')

  // Set localStorage with session data
  await page.evaluate((sessionData) => {
    localStorage.setItem('sl_auth_state', JSON.stringify({ isLoggedIn: true, userId: sessionData.user_id }))
    localStorage.setItem('sl_auth_token', sessionData.access_token)
    localStorage.setItem('sl_session_id', sessionData.user_id)
  }, data.data)

  await page.reload()

  // Save state
  await page.context().storageState({ path: 'playwright/.auth/host.json' })
})
```

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Create `playwright.config.ts` | Low | High |
| 2 | Create `e2e/` directory structure | Low | High |
| 3 | Create `auth.setup.ts` | Medium | High |
| 4 | Update `.gitignore` | Low | Medium |
| 5 | Add npm scripts | Low | Medium |
| 6 | Create auth fixtures | Medium | Medium |
| 7 | Document test credentials | Low | Medium |
| 8 | Configure CI integration | Medium | High |

## Anti-Patterns to Avoid

| Anti-Pattern | Risk | Recommendation |
|--------------|------|----------------|
| Login in every test | 60%+ slower tests | Use reusable auth state |
| Hardcoded credentials | Security risk | Use environment variables |
| Committing auth files | Security risk | Add to .gitignore |
| Single user for all tests | Data conflicts | Separate states per role |
| UI login when API works | Slower, flakier | Use API auth when possible |
| No session verification | Flaky auth state | Verify login completed |

## Summary

The Split Lease codebase has Playwright installed but **no E2E test infrastructure implemented**. This is a **greenfield opportunity** to implement reusable auth state correctly from the start.

**Key findings:**
1. Playwright v1.57.0 is installed as a dev dependency
2. A Playwright MCP skill exists with login instructions
3. Auth library (`app/src/lib/auth.js`) is comprehensive with Edge Function support
4. Test credential environment variables are documented but need verification
5. No `playwright.config.ts`, no E2E tests, no auth setup files exist

**Recommendation:** When implementing E2E tests, set up reusable auth state from day one. This will:
- Save 60%+ execution time as tests scale
- Reduce flakiness from repeated login operations
- Establish a pattern for multi-role testing (Host/Guest)
- Enable faster CI feedback loops

---
*This report identifies opportunities for improvement. No changes were made to the codebase.*
