# Reusable Auth State Opportunity Report
**Generated:** 2026-01-28T11:01:47
**Codebase:** Split Lease (splitlease)
**Hostname:** thin5

## Executive Summary
- E2E test files found: **0**
- Tests with redundant login: **N/A (no E2E tests exist)**
- Auth setup exists: **No**
- Storage state configured: **No**
- Playwright installed: **Yes** (v1.58.0 in root, v1.51.0 in app/)
- Estimated time savings: **Significant** (when E2E tests are implemented)

## Performance Impact Analysis

### Current State
```
No E2E tests currently exist.
When tests are added without reusable auth:
Test 1: Login (3s) + Test (2s) = 5s
Test 2: Login (3s) + Test (2s) = 5s
Test 3: Login (3s) + Test (2s) = 5s
...
50 tests × 5s = 250 seconds
```

### With Reusable Auth
```
Setup: Login once (3s)
Test 1: Test (2s)
Test 2: Test (2s)
Test 3: Test (2s)
...
1 login + 50 tests × 2s = 103 seconds (2.4x faster)
```

## Current State Analysis

### What Exists
| Component | Status | Location |
|-----------|--------|----------|
| Playwright dependency | Installed (v1.58.0 root, v1.51.0 app) | `package.json` |
| @playwright/test | **Not installed** | - |
| Playwright MCP server | Configured | `.mcp.json` |
| Playwright MCP skill | Comprehensive | `.claude/skills/playwrightTestGuideLoginInstructions/SKILL.md` |
| Test credentials env vars | Documented | `TESTHOSTEMAILADDRESS`, `TESTGUESTEMAILADDRESS`, `TESTPASSWORD` |
| Auth library | Comprehensive | `app/src/lib/auth.js` |
| Unit test framework | Vitest configured | `app/package.json` |
| Unit test file | 1 file exists | `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js` |
| Regression tests | 1 file exists | `app/src/__tests__/regression/REG-001-fk-constraint-violation.test.js` |
| Visual validation script | Playwright-based | `scripts/visual-validation-playwright.ts` |
| Edge function test helpers | Exist | `supabase/functions/tests/helpers/` |
| Workflow automation plan | Drafted | `.claude/plans/New/20260128-workflow-automation-plan.md` |

### What's Missing
| Component | Status | Impact |
|-----------|--------|--------|
| `playwright.config.ts` | **Missing** | Cannot configure E2E test runner |
| `@playwright/test` package | **Not installed** | Cannot use Playwright Test API |
| `e2e/` directory | **Missing** | No dedicated E2E test folder |
| Auth setup file (`auth.setup.ts`) | **Missing** | No reusable auth state |
| Storage state directory (`playwright/.auth/`) | **Missing** | Auth state not persisted |
| E2E test files (`.spec.ts`) | **Missing** | No E2E tests to run |
| E2E test runner scripts | **Missing** | No `test:e2e` npm command |
| `.gitignore` entry for auth files | **Missing** | Auth state could be committed |

## Configuration Gaps

### Playwright Config Check
- [ ] Setup project defined
- [ ] Storage state path configured
- [ ] Dependencies set on setup project
- [ ] Multiple browser projects configured
- [ ] Test directory configured
- [ ] Web server configuration

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
- [ ] Multiple user role support (Host/Guest)

### Missing Components
| Component | Status | Impact |
|-----------|--------|--------|
| auth.setup.ts | Missing | Cannot reuse auth |
| storageState call | Missing | State not saved |
| Verification step | Missing | May save invalid state |

## Redundant Login Detection

### Tests With Inline Login
| Test File | Login Count | Lines | Time Wasted |
|-----------|-------------|-------|-------------|
| N/A | 0 | - | 0s |

**Note:** No E2E test files exist. This is a greenfield opportunity to implement reusable auth state correctly from day one.

### Visual Validation Script Analysis
The existing `scripts/visual-validation-playwright.ts` script:
- Uses `playwright` package directly (not `@playwright/test`)
- Captures screenshots of 12 admin pages
- **No authentication handling** - pages accessed directly
- Not a test suite, just a visual validation tool
- Does not use reusable auth state pattern

## Multi-Role Gaps

### User Roles Identified (from Playwright MCP skill)
| Role | Environment Variable | Auth State File | Status |
|------|---------------------|-----------------|--------|
| Host | `TESTHOSTEMAILADDRESS` | `playwright/.auth/host.json` | **Missing** |
| Guest | `TESTGUESTEMAILADDRESS` | `playwright/.auth/guest.json` | **Missing** |
| Unauthenticated | N/A | N/A | N/A |

### Role-Based Test Projects
| Project Name | Test Pattern | Storage State | Status |
|--------------|--------------|---------------|--------|
| host-tests | *.host.spec.ts | host.json | **Missing** |
| guest-tests | *.guest.spec.ts | guest.json | **Missing** |
| public-tests | *.public.spec.ts | undefined | **Missing** |

### Login State Detection (from Playwright skill)
**Logged Out State Indicators:**
- "Sign In" button visible in header
- "Sign Up" button visible in header

**Logged In State Indicators:**
- Username visible in header (clickable)
- Profile picture/avatar visible
- "Sign In"/"Sign Up" buttons NOT visible

**User Type Detection:**
- "Stay with Us" in navigation = **Guest** account
- "Host with Us" in navigation = **Host** account

## Storage State Gaps

### Missing Files
- [ ] `playwright/.auth/` directory exists
- [ ] `host.json` auth state
- [ ] `guest.json` auth state
- [ ] Auth files in `.gitignore`

### Current .gitignore Status
```bash
# Already in .gitignore:
.playwright-mcp/          # MCP-specific directory
ZEP - tests/              # Deprecated test folder
test-data/                # Test data
videos/                   # Playwright video recordings
screenshots/              # Screenshots

# MISSING from .gitignore:
playwright/.auth/         # Auth state files should be added
playwright-report/        # Test reports
test-results/             # Test artifacts
```

## Test File Organization Gaps

### Missing Directory Structure
```
e2e/                              # MISSING
├── auth.setup.ts                 # MISSING
├── fixtures/                     # MISSING
│   └── auth.ts                   # MISSING
├── tests/                        # MISSING
│   ├── booking.guest.spec.ts     # MISSING
│   ├── listing.host.spec.ts      # MISSING
│   └── search.public.spec.ts     # MISSING
└── pages/                        # MISSING - Page objects
    ├── BasePage.ts
    ├── LoginPage.ts
    ├── SearchPage.ts
    └── ListingPage.ts
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
| `TESTHOSTEMAILADDRESS` | Host test account | Yes |
| `TESTGUESTEMAILADDRESS` | Guest test account | Yes |
| `TESTPASSWORD` | Test password | Yes |

## CI Integration Gaps

### Missing CI Configuration
- [ ] Auth setup runs once before shards
- [ ] Auth state shared across shards
- [ ] Test credentials in CI secrets
- [ ] Auth artifacts not exposed

### Current GitHub Workflows
Existing workflows in `.github/workflows/`:
- `claude-code-review.yml` - Code review automation
- `claude.yml` - Claude automation
- `deploy-edge-functions-dev.yml` - Edge function deployment
- `deploy-edge-functions-prod.yml` - Edge function deployment
- `deploy-frontend-dev.yml` - Frontend deployment
- `deploy-frontend-prod.yml` - Frontend deployment
- `deploy-pythonanywhere.yml` - PythonAnywhere deployment

**Missing:** E2E test workflow with Playwright

## Package.json Scripts Gaps

### Current Scripts (root package.json)
```json
{
  "scripts": {
    "test": "cd app && bun run test"  // Unit tests only
  }
}
```

### Current Scripts (app/package.json)
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:unit": "vitest",
    "test:unit:run": "vitest run",
    "test:unit:coverage": "vitest run --coverage",
    "test:regression": "vitest run src/__tests__/regression"
  }
}
```

### Missing E2E Scripts
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

## Tests With Good Auth Pattern (Reference)

No E2E tests exist that demonstrate good auth patterns. The workflow automation plan (`.claude/plans/New/20260128-workflow-automation-plan.md`) provides comprehensive recommended configurations.

## Recommended Configuration

### 1. Install @playwright/test Package
```bash
bun add -D @playwright/test
```

### 2. Playwright Configuration
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
    baseURL: 'http://localhost:8000',
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
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 3. Auth Setup File
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
  expectedNav: string
) {
  await page.goto('/signup-login')

  const signInButton = page.getByRole('button', { name: /sign in/i }).first()
  if (await signInButton.isVisible()) {
    await signInButton.click()
  }

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()

  await expect(page.getByText(/sign in/i)).not.toBeVisible({ timeout: 10000 })
  await expect(page.getByText(expectedNav)).toBeVisible({ timeout: 10000 })

  await page.context().storageState({ path: authFile })
}

setup('authenticate as host', async ({ page }) => {
  await authenticate(
    page,
    process.env.TESTHOSTEMAILADDRESS!,
    process.env.TESTPASSWORD!,
    AUTH_FILES.host,
    'Host with Us'
  )
})

setup('authenticate as guest', async ({ page }) => {
  await authenticate(
    page,
    process.env.TESTGUESTEMAILADDRESS!,
    process.env.TESTPASSWORD!,
    AUTH_FILES.guest,
    'Stay with Us'
  )
})
```

### 4. Auth Fixtures for Multi-Role Tests
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

### 5. API-Based Auth (Faster Alternative)
```typescript
// e2e/auth.setup.ts - API-based auth via auth-user Edge Function
import { test as setup } from '@playwright/test'

setup('authenticate via API as host', async ({ page }) => {
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({
      action: 'login',
      payload: {
        email: process.env.TESTHOSTEMAILADDRESS!,
        password: process.env.TESTPASSWORD!,
      }
    })
  })

  const data = await response.json()
  if (!data.success) throw new Error(`Login failed: ${data.message}`)

  await page.goto('/')
  await page.evaluate((sessionData) => {
    localStorage.setItem('sl_auth_state', JSON.stringify({
      isLoggedIn: true,
      userId: sessionData.user_id
    }))
    localStorage.setItem('sl_session_id', sessionData.user_id)
  }, data.data)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.context().storageState({ path: 'playwright/.auth/host.json' })
})
```

### 6. .gitignore Additions
```bash
# Add to .gitignore:
playwright/.auth/
playwright-report/
test-results/
```

### 7. CI Configuration
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - run: bun install
      - run: npx playwright install --with-deps

      - name: Run E2E tests
        run: bun run test:e2e
        env:
          TESTHOSTEMAILADDRESS: ${{ secrets.TESTHOSTEMAILADDRESS }}
          TESTGUESTEMAILADDRESS: ${{ secrets.TESTGUESTEMAILADDRESS }}
          TESTPASSWORD: ${{ secrets.TESTPASSWORD }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
```

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Install `@playwright/test` package | Low | High |
| P0 | Create `playwright.config.ts` | Low | High |
| P1 | Create `e2e/` directory structure | Low | High |
| P1 | Create `auth.setup.ts` | Medium | High |
| P2 | Update `.gitignore` | Low | Medium |
| P2 | Add npm scripts to package.json | Low | Medium |
| P3 | Create auth fixtures | Medium | Medium |
| P3 | Document test credentials setup | Low | Medium |
| P4 | Configure CI integration | Medium | High |

## Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Login in every test | Use reusable auth state |
| Hardcoded credentials | Use environment variables |
| Committing auth files | Add to .gitignore |
| Single user for all tests | Separate states per role |
| UI login when API works | Use API auth (faster) |
| No session verification | Verify login completed |

## Related Documentation

### Existing Resources
- **Playwright MCP Skill:** `.claude/skills/playwrightTestGuideLoginInstructions/SKILL.md` - Comprehensive login instructions
- **Workflow Automation Plan:** `.claude/plans/New/20260128-workflow-automation-plan.md` - Full testing infrastructure plan
- **Auth Library:** `app/src/lib/auth.js` - Core auth system (2,000+ lines)
- **Auth Edge Functions:** `supabase/functions/auth-user/` - Login/signup/password reset handlers

### Previous Audit Reports
- `260127/20260127110143-audit-reusable-auth-state.md` - Similar findings from January 27

## Summary

The Split Lease codebase has Playwright installed but **no E2E test infrastructure implemented**. This is a **greenfield opportunity** to implement reusable auth state correctly from the start.

**Key findings:**
1. Playwright v1.58.0 installed in root, v1.51.0 in app (but `@playwright/test` is **not installed**)
2. Comprehensive Playwright MCP skill exists with login state detection and user type identification
3. Auth library (`app/src/lib/auth.js`) is comprehensive with Edge Function support
4. Test credential environment variables are documented (`TESTHOSTEMAILADDRESS`, `TESTGUESTEMAILADDRESS`, `TESTPASSWORD`)
5. No `playwright.config.ts`, no E2E tests, no auth setup files exist
6. Unit tests use Vitest with good coverage for calculators
7. Visual validation script uses Playwright but not the test runner
8. Workflow automation plan drafted with comprehensive E2E infrastructure recommendations

**Recommendation:** When implementing E2E tests, set up reusable auth state from day one. This will:
- Save 60%+ execution time as tests scale
- Reduce flakiness from repeated login operations
- Establish a pattern for multi-role testing (Host/Guest)
- Enable faster CI feedback loops
- Leverage the existing Playwright MCP skill documentation

---
*This report identifies opportunities for improvement. No changes were made to the codebase.*
