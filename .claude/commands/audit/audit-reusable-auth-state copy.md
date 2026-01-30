---
name: audit-reusable-auth-state
description: Audit the codebase to find E2E tests with redundant login operations that could benefit from reusable Playwright auth state. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Reusable Auth State Audit

You are conducting a comprehensive audit to identify E2E tests that perform redundant login operations and could benefit from reusable Playwright authentication state.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Playwright configuration** - Look for:
   - `playwright.config.ts`
   - Project definitions
   - Storage state settings
   - Setup project configuration

2. **Auth setup files** - Look for:
   - `auth.setup.ts` or similar
   - `global-setup.ts`
   - Login helper functions
   - `storageState()` calls

3. **E2E test files** - Look for:
   - Files ending in `.spec.ts` or `.e2e.ts`
   - Login operations in beforeEach/beforeAll
   - Direct page navigation to `/login`
   - Credential entry in tests

4. **Auth state storage** - Check for:
   - `playwright/.auth/` directory
   - JSON files with stored cookies/localStorage
   - `.gitignore` entry for auth files

5. **Multi-role setup** - Look for:
   - Different user roles (buyer, seller, admin)
   - Separate auth state files per role
   - Role-based test projects

### What to Check for Each Target

For E2E test infrastructure, verify:
- Auth setup project exists
- Storage state is configured per project
- Tests depend on setup project
- No redundant login in individual tests
- Multiple roles are properly separated
- Auth files are gitignored
- API-based auth is used where possible

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-reusable-auth-state.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Reusable Auth State Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- E2E test files found: X
- Tests with redundant login: X
- Auth setup exists: Yes/No
- Storage state configured: Yes/No
- Estimated time savings: X minutes

## Performance Impact Analysis

### Current State
```
Test 1: Login (3s) + Test (2s) = 5s
Test 2: Login (3s) + Test (2s) = 5s
Test 3: Login (3s) + Test (2s) = 5s
...
X tests × 5s = Xs total
```

### With Reusable Auth
```
Setup: Login once (3s)
Test 1: Test (2s)
Test 2: Test (2s)
Test 3: Test (2s)
...
1 login + X tests × 2s = Xs total (Yx faster)
```

## Configuration Gaps

### Playwright Config Check
- [ ] Setup project defined
- [ ] Storage state path configured
- [ ] Dependencies set on setup project
- [ ] Multiple browser projects configured

### Current Config Status
```typescript
// Found in: playwright.config.ts (or missing)
projects: [
  // Setup project: ?
  // Test projects with storageState: ?
]
```

## Auth Setup Gaps

### Missing Auth Setup File
- [ ] `e2e/auth.setup.ts` exists
- [ ] Login flow implemented
- [ ] `storageState()` called to save
- [ ] Verification after login

### Missing Components
| Component | Status | Impact |
|-----------|--------|--------|
| auth.setup.ts | ? | Cannot reuse auth |
| storageState call | ? | State not saved |
| Verification step | ? | May save invalid state |

## Redundant Login Detection

### Tests With Inline Login
| Test File | Login Count | Lines | Time Wasted |
|-----------|-------------|-------|-------------|
| booking.spec.ts | 5 | 12-18, 45-51, ... | ~15s |
| listings.spec.ts | 8 | 10-16, 32-38, ... | ~24s |
| messages.spec.ts | 3 | 8-14, 28-34, ... | ~9s |

### Login Patterns Found
```typescript
// Pattern 1: Direct login in test
await page.goto('/login')
await page.getByLabel('Email').fill(email)
await page.getByLabel('Password').fill(password)
await page.click('button[type="submit"]')

// Pattern 2: Login in beforeEach
beforeEach(async ({ page }) => {
  await loginAsUser(page, 'buyer@example.com')
})

// Pattern 3: Login helper used repeatedly
test('test 1', async ({ page }) => {
  await login(page)
  // ...
})
test('test 2', async ({ page }) => {
  await login(page)
  // ...
})
```

## Multi-Role Gaps

### User Roles Identified
| Role | Auth State File | Setup Test | Status |
|------|-----------------|------------|--------|
| Buyer | ? | ? | Missing |
| Seller | ? | ? | Missing |
| Admin | ? | ? | Missing |
| Guest | N/A | N/A | N/A |

### Role-Based Test Projects
| Project Name | Test Pattern | Storage State | Status |
|--------------|--------------|---------------|--------|
| buyer-tests | *.buyer.spec.ts | buyer.json | Missing |
| seller-tests | *.seller.spec.ts | seller.json | Missing |
| admin-tests | *.admin.spec.ts | admin.json | Missing |
| guest-tests | *.guest.spec.ts | undefined | Missing |

## Storage State Gaps

### Missing Files
- [ ] `playwright/.auth/` directory exists
- [ ] `buyer.json` auth state
- [ ] `seller.json` auth state
- [ ] `admin.json` auth state
- [ ] Auth files in `.gitignore`

## Test File Organization Gaps

### Files Without Role Suffix
| Current Name | Suggested Name | Role |
|--------------|----------------|------|
| booking.spec.ts | booking.buyer.spec.ts | Buyer |
| listing-management.spec.ts | listing-management.seller.spec.ts | Seller |
| user-admin.spec.ts | user-admin.admin.spec.ts | Admin |

## Environment Variables Gaps

### Missing Test Credentials
| Variable | Status | Purpose |
|----------|--------|---------|
| TEST_BUYER_EMAIL | ? | Buyer login |
| TEST_BUYER_PASSWORD | ? | Buyer login |
| TEST_SELLER_EMAIL | ? | Seller login |
| TEST_SELLER_PASSWORD | ? | Seller login |
| TEST_ADMIN_EMAIL | ? | Admin login |
| TEST_ADMIN_PASSWORD | ? | Admin login |

## CI Integration Gaps

### Missing CI Configuration
- [ ] Auth setup runs once before shards
- [ ] Auth state shared across shards
- [ ] Test credentials in CI secrets
- [ ] Auth artifacts not exposed

## Tests With Good Auth Pattern (Reference)

List any tests that already use reusable auth state as examples.

## Recommended Configuration

### Auth Setup File
```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test'

const AUTH_FILES = {
  buyer: 'playwright/.auth/buyer.json',
  seller: 'playwright/.auth/seller.json',
  admin: 'playwright/.auth/admin.json',
}

async function authenticate(
  page: any,
  email: string,
  password: string,
  authFile: string
) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/dashboard')
  await page.context().storageState({ path: authFile })
}

setup('authenticate as buyer', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_BUYER_EMAIL!,
    process.env.TEST_BUYER_PASSWORD!,
    AUTH_FILES.buyer
  )
})

setup('authenticate as seller', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_SELLER_EMAIL!,
    process.env.TEST_SELLER_PASSWORD!,
    AUTH_FILES.seller
  )
})

setup('authenticate as admin', async ({ page }) => {
  await authenticate(
    page,
    process.env.TEST_ADMIN_EMAIL!,
    process.env.TEST_ADMIN_PASSWORD!,
    AUTH_FILES.admin
  )
})
```

### Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',

  projects: [
    // Setup project - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Buyer tests
    {
      name: 'buyer-tests',
      testMatch: /.*\.buyer\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/buyer.json',
      },
      dependencies: ['setup'],
    },

    // Seller tests
    {
      name: 'seller-tests',
      testMatch: /.*\.seller\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/seller.json',
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
      testMatch: /.*\.guest\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined,
      },
    },
  ],
})
```

### Auth Fixtures for Mixed Roles
```typescript
// e2e/fixtures/auth.ts
import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  buyerPage: Page
  sellerPage: Page
  adminPage: Page
}

export const test = base.extend<AuthFixtures>({
  buyerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/buyer.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  sellerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/seller.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
```

### Using Fixtures for Multi-Role Tests
```typescript
// e2e/tests/messaging.spec.ts
import { test, expect } from '../fixtures/auth'

test('buyer and seller can exchange messages', async ({ buyerPage, sellerPage }) => {
  // Buyer sends message
  await buyerPage.goto('/messages/conversation-123')
  await buyerPage.getByRole('textbox').fill('Is this available?')
  await buyerPage.getByRole('button', { name: 'Send' }).click()

  // Seller receives and responds
  await sellerPage.goto('/messages/conversation-123')
  await expect(sellerPage.getByText('Is this available?')).toBeVisible()

  await sellerPage.getByRole('textbox').fill('Yes, it is!')
  await sellerPage.getByRole('button', { name: 'Send' }).click()

  // Buyer sees response
  await buyerPage.reload()
  await expect(buyerPage.getByText('Yes, it is!')).toBeVisible()
})
```

### Supabase API Auth (Faster)
```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

setup('authenticate with Supabase', async ({ page }) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_BUYER_EMAIL!,
    password: process.env.TEST_BUYER_PASSWORD!,
  })

  if (error) throw error

  await page.goto('/')

  await page.evaluate((session) => {
    localStorage.setItem(
      'sb-<project-ref>-auth-token',
      JSON.stringify(session)
    )
  }, data.session)

  await page.reload()
  await page.waitForURL('/dashboard')

  await page.context().storageState({ path: 'playwright/.auth/buyer.json' })
})
```

### Environment Variables
```bash
# .env.test
TEST_BUYER_EMAIL=buyer@splitlease-test.com
TEST_BUYER_PASSWORD=TestPassword123!
TEST_SELLER_EMAIL=seller@splitlease-test.com
TEST_SELLER_PASSWORD=TestPassword123!
TEST_ADMIN_EMAIL=admin@splitlease-test.com
TEST_ADMIN_PASSWORD=TestPassword123!
```

### .gitignore Addition
```bash
# .gitignore
playwright/.auth/
```

### CI Configuration
```yaml
# .github/workflows/e2e.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          TEST_BUYER_EMAIL: ${{ secrets.TEST_BUYER_EMAIL }}
          TEST_BUYER_PASSWORD: ${{ secrets.TEST_BUYER_PASSWORD }}
          TEST_SELLER_EMAIL: ${{ secrets.TEST_SELLER_EMAIL }}
          TEST_SELLER_PASSWORD: ${{ secrets.TEST_SELLER_PASSWORD }}
```

```

---

## Reference: Reusable Auth State Patterns

### Performance Impact

```
WITHOUT reusable auth:
Test 1: Login (3s) + Test (2s) = 5s
Test 2: Login (3s) + Test (2s) = 5s
Test 3: Login (3s) + Test (2s) = 5s
...
50 tests × 5s = 250 seconds

WITH reusable auth:
Setup: Login once (3s)
Test 1: Test (2s)
Test 2: Test (2s)
Test 3: Test (2s)
...
1 login + 50 tests × 2s = 103 seconds (2.4x faster)
```

### Dynamic Role Override

```typescript
// Use buyer by default
test.use({ storageState: 'playwright/.auth/buyer.json' })

test('buyer can view listing', async ({ page }) => {
  await page.goto('/listings/123')
  await expect(page.getByRole('button', { name: 'Book' })).toBeVisible()
})

// Override for specific test
test.describe('seller view', () => {
  test.use({ storageState: 'playwright/.auth/seller.json' })

  test('seller sees edit button', async ({ page }) => {
    await page.goto('/listings/my-listing')
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
  })
})

// No auth for this test
test.describe('guest view', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('guest sees login prompt', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Login in every test | Use reusable auth state |
| Hardcoded credentials | Use environment variables |
| Committing auth files | Add to .gitignore |
| Single user for all tests | Separate states per role |
| UI login when API works | Use API auth (faster) |
| No session refresh | Handle token expiration |

## Output Requirements

1. Be thorough - review EVERY E2E test file
2. Be specific - include exact file paths and line numbers
3. Be actionable - provide complete configuration templates
4. Only report gaps - do not list optimized tests unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-reusable-auth-state.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
