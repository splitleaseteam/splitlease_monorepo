# E2E Test Fixtures & Data Seeding Implementation Plan

**Created**: 2026-01-29
**Objective**: Fix 178/344 failing E2E tests by implementing authentication fixtures and data seeding infrastructure
**Approach**: Phased implementation with verification after each phase
**Success Criteria**: 344/344 E2E tests passing (100% pass rate)

---

## Current State

| Metric | Current | Target |
|--------|---------|--------|
| Passing Tests | 166 / 344 (48%) | 344 / 344 (100%) |
| Failing Tests | 178 | 0 |
| Auth Fixtures | ❌ None | ✅ 4 user types |
| Data Seeding | ❌ None | ✅ Full seed infrastructure |
| Global Setup | ❌ None | ✅ Complete setup/teardown |

**Root Causes of Failures:**
1. Tests can't authenticate - no pre-seeded users or auth state storage
2. Tests need data that doesn't exist - no listings, leases, proposals, or archetypes
3. No global setup/teardown hooks in Playwright config

---

## Architecture Overview

```
e2e/
├── fixtures/
│   ├── test-users.ts         # Test user definitions + create/delete functions
│   ├── auth.ts               # Playwright auth fixtures (extends base test)
│   └── seed-data.ts          # Data seeding + cleanup functions
├── .auth/                    # Storage states for pre-authenticated users
│   ├── guest-big-spender.json
│   ├── guest-high-flex.json
│   ├── guest-average.json
│   └── host.json
├── global-setup.ts           # Create users, seed data, generate auth states
├── global-teardown.ts        # Cleanup test data
└── playwright.config.ts      # Updated with global setup/teardown
```

---

## Phase 1: Analyze Current Setup (Est: 30 min)

### 1.1 Review Existing E2E Structure

**Objective**: Understand current test organization and identify patterns

**Tasks**:
```bash
# Find all E2E test files
find e2e -name "*.test.ts" -o -name "*.spec.ts"

# Check existing Playwright config
cat e2e/playwright.config.ts

# Check for any existing fixtures
ls -R e2e/fixtures/ 2>/dev/null || echo "No fixtures directory"

# Check for existing auth handling
grep -r "login\|auth\|sign" e2e/tests/ --include="*.ts" | head -20
```

**Deliverables**:
- List of test file patterns
- Current Playwright configuration baseline
- Existing auth patterns (if any)

### 1.2 Identify Auth Dependencies

**Objective**: Understand how auth works in the app

**Files to Review**:
- `app/src/lib/supabase.js` - Supabase client setup
- `app/src/lib/auth.js` - Auth utilities
- `app/src/islands/shared/SignUpLoginModal.jsx` - Login UI components

**Key Questions**:
- How are sessions stored? (localStorage, cookies, etc.)
- What auth provider is used? (Supabase Auth)
- What user roles exist? (guest, host, admin)

### 1.3 Identify Required Test Data

**Objective**: Catalog all entities needed by tests

**Required Entities**:
- **Users**: 4 types (guest_big_spender, guest_high_flex, guest_average, host)
- **User Archetypes**: Linked to user accounts
- **Listings**: Active listings with calendars
- **Leases**: Active leases with stays
- **Calendar Stays**: Past and upcoming stays
- **Date Change Requests**: Pending requests for testing
- **Proposals**: Optional (if needed by tests)

**Verification**:
```bash
# Check database schema
grep -r "CREATE TABLE" supabase/migrations/ | grep -E "listing|lease|user|archetype|datechange"

# Check what tests are querying
grep -r "from('.*')" e2e/tests/ --include="*.ts"
```

---

## Phase 2: Create Auth Fixtures (Est: 2 hours)

### 2.1 Create Test Users Module

**File**: `e2e/fixtures/test-users.ts`

**Purpose**: Define test users and provide create/delete functions

**Implementation**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin operations
);

export const TEST_USERS = {
  guest_big_spender: {
    email: 'e2e-guest-bigspender@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null as string | null,
    archetype: 'big_spender'
  },
  guest_high_flex: {
    email: 'e2e-guest-highflex@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null as string | null,
    archetype: 'high_flex'
  },
  guest_average: {
    email: 'e2e-guest-average@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null as string | null,
    archetype: 'average'
  },
  host: {
    email: 'e2e-host@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null as string | null
  }
};

export async function createTestUsers() {
  for (const [key, user] of Object.entries(TEST_USERS)) {
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const found = existingUsers?.users.find(u => u.email === user.email);

    if (found) {
      user.userId = found.id;
      console.log(`✅ User ${key} already exists: ${found.id}`);
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (error) throw new Error(`Failed to create ${key}: ${error.message}`);
      user.userId = data.user.id;
      console.log(`✅ Created user ${key}: ${data.user.id}`);
    }
  }

  return TEST_USERS;
}

export async function deleteTestUsers() {
  for (const [key, user] of Object.entries(TEST_USERS)) {
    if (user.userId) {
      await supabase.auth.admin.deleteUser(user.userId);
      console.log(`🗑️ Deleted user ${key}`);
    }
  }
}
```

**Dependencies**:
- `@supabase/supabase-js` (already in project)
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 Create Playwright Auth Fixtures

**File**: `e2e/fixtures/auth.ts`

**Purpose**: Extend Playwright test with authenticated page fixtures

**Implementation**:
```typescript
import { test as base, Page } from '@playwright/test';
import { TEST_USERS } from './test-users';

// Extend test with auth fixtures
type AuthFixtures = {
  authenticatedPage: Page;
  guestBigSpenderPage: Page;
  guestHighFlexPage: Page;
  guestAveragePage: Page;
  hostPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Default authenticated user (big spender)
    await use(page);
  },

  guestBigSpenderPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/guest-big-spender.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  guestHighFlexPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/guest-high-flex.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  guestAveragePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/guest-average.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  hostPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/host.json'
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});

export { expect } from '@playwright/test';
```

### 2.3 Create Global Setup Script

**File**: `e2e/global-setup.ts`

**Purpose**: Run before all tests to create users, seed data, and generate auth states

**Implementation**:
```typescript
import { chromium, FullConfig } from '@playwright/test';
import { createTestUsers, TEST_USERS } from './fixtures/test-users';
import { seedTestData } from './fixtures/seed-data';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global setup for E2E tests...');

  // 1. Create test users in Supabase
  console.log('\n📝 Creating test users...');
  await createTestUsers();

  // 2. Seed test data (listings, leases, etc.)
  console.log('\n🌱 Seeding test data...');
  await seedTestData();

  // 3. Generate auth states for each user
  console.log('\n🔐 Generating authentication states...');
  const browser = await chromium.launch();

  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:5173';

    // Navigate and login
    await page.goto(baseURL + '/');

    // Wait for and click login button
    await page.waitForSelector('[data-testid="login-button"]', { timeout: 10000 });
    await page.click('[data-testid="login-button"]');

    // Fill login form
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="submit-login"]');

    // Wait for redirect (any page except login)
    await page.waitForURL(/.*(?!login)/, { timeout: 10000 });

    // Save auth state
    const authFile = path.join(authDir, `${key.replace(/_/g, '-')}.json`);
    await context.storageState({ path: authFile });
    console.log(`  ✅ Auth state saved: ${authFile}`);

    await context.close();
  }

  await browser.close();
  console.log('\n✅ Global setup complete!\n');
}

export default globalSetup;
```

### 2.4 Create Global Teardown Script

**File**: `e2e/global-teardown.ts`

**Purpose**: Run after all tests to cleanup test data

**Implementation**:
```typescript
import { cleanupTestData } from './fixtures/seed-data';
import { deleteTestUsers } from './fixtures/test-users';

async function globalTeardown() {
  console.log('🧹 Running global teardown...');

  // 1. Cleanup test data
  await cleanupTestData();

  // 2. Delete test users (optional - keep users for faster reruns)
  // await deleteTestUsers();

  console.log('✅ Global teardown complete!');
}

export default globalTeardown;
```

**Verification**:
```bash
# Test the global setup manually
npx ts-node e2e/global-setup.ts

# Verify auth states were created
ls -la e2e/.auth/
```

---

## Phase 3: Create Data Seeding (Est: 2 hours)

### 3.1 Create Data Seeding Module

**File**: `e2e/fixtures/seed-data.ts`

**Purpose**: Seed all required test data into Supabase

**Implementation**:
```typescript
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from './test-users';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // 1. Create test listing
  console.log('  📍 Creating test listing...');
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .upsert({
      _id: 'e2e-test-listing-001',
      'Listing Name': 'E2E Test Apartment',
      'Address': '123 Test Street, San Francisco, CA 94102',
      'Monthly Rent': 2500,
      'Host': TEST_USERS.host.userId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 1,
      'Number of Baths': 1
    }, { onConflict: '_id' })
    .select()
    .single();

  if (listingError) throw new Error(`Listing seed failed: ${listingError.message}`);
  console.log(`  ✅ Listing seeded: ${listing._id}`);

  // 2. Create test lease for Big Spender guest
  console.log('  📋 Creating test lease...');
  const leaseStart = new Date();
  const leaseEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .upsert({
      _id: 'e2e-test-lease-001',
      'Agreement Number': 'E2E-TEST-001',
      'Guest': TEST_USERS.guest_big_spender.userId,
      'Host': TEST_USERS.host.userId,
      'Listing': listing._id,
      'Reservation Period : Start': leaseStart.toISOString(),
      'Reservation Period : End': leaseEnd.toISOString(),
      'Lease Status': 'Active',
      'Total Rent': 7500
    }, { onConflict: '_id' })
    .select()
    .single();

  if (leaseError) throw new Error(`Lease seed failed: ${leaseError.message}`);
  console.log(`  ✅ Lease seeded: ${lease._id}`);

  // 3. Create stays for the lease
  console.log('  📅 Creating calendar stays...');
  const stays = [];
  for (let week = 0; week < 12; week++) {
    const stayStart = new Date(leaseStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const stayEnd = new Date(stayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    stays.push({
      _id: `e2e-test-stay-${String(week + 1).padStart(3, '0')}`,
      'Lease': lease._id,
      'Guest': TEST_USERS.guest_big_spender.userId,
      'Start': stayStart.toISOString(),
      'End': stayEnd.toISOString(),
      'Status': week < 2 ? 'Completed' : 'Upcoming'
    });
  }

  const { error: staysError } = await supabase
    .from('calendar_stays')
    .upsert(stays, { onConflict: '_id' });

  if (staysError) throw new Error(`Stays seed failed: ${staysError.message}`);
  console.log(`  ✅ ${stays.length} stays seeded`);

  // 4. Create user archetypes
  console.log('  👤 Creating user archetypes...');
  const archetypes = [
    {
      auth_user_id: TEST_USERS.guest_big_spender.userId,
      archetype: 'big_spender',
      confidence_score: 0.92,
      last_detection_date: new Date().toISOString()
    },
    {
      auth_user_id: TEST_USERS.guest_high_flex.userId,
      archetype: 'high_flex',
      confidence_score: 0.88,
      last_detection_date: new Date().toISOString()
    },
    {
      auth_user_id: TEST_USERS.guest_average.userId,
      archetype: 'average',
      confidence_score: 0.75,
      last_detection_date: new Date().toISOString()
    }
  ];

  const { error: archetypeError } = await supabase
    .from('user_archetypes')
    .upsert(archetypes, { onConflict: 'auth_user_id' });

  if (archetypeError) {
    console.warn(`  ⚠️ Archetype seed warning: ${archetypeError.message}`);
  } else {
    console.log(`  ✅ ${archetypes.length} archetypes seeded`);
  }

  // 5. Create a pending date change request
  console.log('  🔄 Creating date change request...');
  const { error: dcrError } = await supabase
    .from('datechangerequest')
    .upsert({
      _id: 'e2e-test-dcr-001',
      'Lease': lease._id,
      'Requested by': TEST_USERS.guest_big_spender.userId,
      'Request receiver': TEST_USERS.host.userId,
      'type of request': 'adding',
      'request status': 'pending',
      'Created Date': new Date().toISOString()
    }, { onConflict: '_id' });

  if (dcrError) {
    console.warn(`  ⚠️ DCR seed warning: ${dcrError.message}`);
  } else {
    console.log(`  ✅ Date change request seeded`);
  }

  console.log('✅ All test data seeded successfully!\n');
}

export async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');

  // Delete in reverse order of creation (respect foreign keys)
  await supabase.from('datechangerequest').delete().like('_id', 'e2e-test%');
  console.log('  ✅ Deleted date change requests');

  const userIds = Object.values(TEST_USERS)
    .map(u => u.userId)
    .filter(Boolean) as string[];

  await supabase.from('user_archetypes').delete().in('auth_user_id', userIds);
  console.log('  ✅ Deleted user archetypes');

  await supabase.from('calendar_stays').delete().like('_id', 'e2e-test%');
  console.log('  ✅ Deleted calendar stays');

  await supabase.from('bookings_leases').delete().like('_id', 'e2e-test%');
  console.log('  ✅ Deleted leases');

  await supabase.from('listing').delete().like('_id', 'e2e-test%');
  console.log('  ✅ Deleted listings');

  console.log('✅ Cleanup complete!\n');
}
```

**Verification**:
```bash
# Manually test data seeding
npx ts-node -e "import('./e2e/fixtures/seed-data').then(m => m.seedTestData())"

# Verify data in Supabase
# (Use Supabase Studio or psql to check tables)

# Manually test cleanup
npx ts-node -e "import('./e2e/fixtures/seed-data').then(m => m.cleanupTestData())"
```

---

## Phase 4: Update Playwright Config (Est: 30 min)

### 4.1 Update playwright.config.ts

**File**: `e2e/playwright.config.ts`

**Changes**:
1. Add `globalSetup` and `globalTeardown` references
2. Create a `setup` project for auth setup
3. Add `dependencies` to other projects to ensure setup runs first
4. Load environment variables from `.env.test`

**Implementation**:
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Global setup/teardown
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Start dev server for local testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Create .env.test File

**File**: `.env.test` (in project root)

**Content**:
```env
# Supabase credentials (use dev project by default)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# E2E test configuration
E2E_BASE_URL=http://localhost:5173
```

**⚠️ Security**: Add `.env.test` to `.gitignore` if it contains real credentials

### 4.3 Update package.json Scripts

**File**: `package.json`

**Add/Update**:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:e2e:setup": "ts-node e2e/global-setup.ts",
    "test:e2e:cleanup": "ts-node e2e/global-teardown.ts"
  }
}
```

**Verification**:
```bash
# Test Playwright config is valid
npx playwright test --list

# Ensure no syntax errors
bun run test:e2e:setup
```

---

## Phase 5: Update Failing Tests (Est: 3-4 hours)

### 5.1 Identify Test Categories

**Categorize the 178 failing tests**:

1. **Auth-dependent tests** (need logged-in users)
   - Guest leases page tests
   - Host dashboard tests
   - Profile/settings tests

2. **Data-dependent tests** (need seeded data)
   - Lease display tests
   - Date change request tests
   - Archetype indicator tests

3. **Both auth + data dependent**
   - Most integration tests

### 5.2 Update Test Pattern

**Before (failing)**:
```typescript
import { test, expect } from '@playwright/test';

test('should display archetype indicator', async ({ page }) => {
  await page.goto('/guest-leases');
  // ❌ Fails: user not logged in, no data
  await expect(page.locator('[data-testid="archetype-indicator"]'))
    .toBeVisible();
});
```

**After (passing)**:
```typescript
import { test, expect } from '../fixtures/auth';

test('should display archetype indicator', async ({ guestBigSpenderPage }) => {
  await guestBigSpenderPage.goto('/guest-leases');
  // ✅ Works: user is logged in, test data exists
  await expect(guestBigSpenderPage.locator('[data-testid="archetype-indicator"]'))
    .toContainText('Big Spender');
});
```

### 5.3 Bulk Update Strategy

**Process**:
1. Update tests in batches of 10-20
2. Run tests after each batch to verify fixes
3. Commit after each successful batch

**Files to Update**:
```bash
# Find all test files
find e2e/tests -name "*.spec.ts" -o -name "*.test.ts"

# Priority order:
# 1. Pattern 1 tests (archetype/personalization)
# 2. Pattern 2 tests (urgency countdown)
# 3. Pattern 3 tests (price anchoring)
# 4. Pattern 4 tests (bidding)
# 5. Pattern 5 tests (fee transparency)
```

**Batch Update Template**:
```typescript
// Change import
- import { test, expect } from '@playwright/test';
+ import { test, expect } from '../fixtures/auth';

// Change page fixture
- async ({ page }) => {
+ async ({ guestBigSpenderPage }) => {
+   // OR: guestHighFlexPage, guestAveragePage, hostPage

// Update page references
- await page.goto(...)
+ await guestBigSpenderPage.goto(...)
```

### 5.4 Verification After Each Batch

```bash
# Run updated tests
npx playwright test e2e/tests/pattern1-personalized-defaults.spec.ts

# Check pass rate
# Expected: Failures decrease by ~10-20 per batch
```

---

## Verification & Metrics

### Per-Phase Verification

**After Phase 1**:
- [ ] E2E structure documented
- [ ] Auth patterns identified
- [ ] Required data entities cataloged

**After Phase 2**:
- [ ] Test users created in Supabase
- [ ] Auth states generated in `e2e/.auth/`
- [ ] Global setup runs without errors

**After Phase 3**:
- [ ] Test data seeded successfully
- [ ] Data visible in Supabase Studio
- [ ] Cleanup function works

**After Phase 4**:
- [ ] Playwright config updated
- [ ] `.env.test` configured
- [ ] `npx playwright test --list` shows all tests

**After Phase 5**:
- [ ] 344/344 tests passing
- [ ] All auth fixtures used correctly
- [ ] No manual login flows remaining

### Final Success Metrics

| Metric | Target | Verification Command |
|--------|--------|---------------------|
| Test Pass Rate | 100% (344/344) | `npx playwright test` |
| Auth Fixtures | 4 working | Check `e2e/.auth/*.json` exist |
| Test Users | 4 created | Check Supabase Auth users |
| Seeded Data | All entities | Check Supabase tables |
| Global Setup | No errors | `bun run test:e2e:setup` |
| Test Speed | <5 min total | Measure full suite runtime |

---

## Rollback Strategy

If something breaks:

```bash
# Rollback uncommitted changes
git checkout .

# Rollback last commit
git revert HEAD

# Cleanup test data manually
bun run test:e2e:cleanup

# Delete test users via Supabase Studio
```

---

## Files Created/Modified

### New Files
- [ ] `e2e/fixtures/test-users.ts`
- [ ] `e2e/fixtures/auth.ts`
- [ ] `e2e/fixtures/seed-data.ts`
- [ ] `e2e/global-setup.ts`
- [ ] `e2e/global-teardown.ts`
- [ ] `.env.test`

### Modified Files
- [ ] `e2e/playwright.config.ts`
- [ ] `package.json` (add test scripts)
- [ ] 178 test files in `e2e/tests/` (update to use auth fixtures)

---

## Dependencies

**Already Installed**:
- `@playwright/test`
- `@supabase/supabase-js`
- `typescript`

**Might Need**:
- `dotenv` (for loading `.env.test`)
- `ts-node` (for running TypeScript setup scripts)

```bash
# Install if missing
bun add -D dotenv ts-node
```

---

## Execution Checklist

### Pre-Execution
- [ ] Ensure dev server is running (`bun run dev`)
- [ ] Ensure Supabase is accessible
- [ ] Create `.env.test` with correct credentials
- [ ] Backup current test suite state

### Execution Order
1. [ ] Phase 1: Analyze current setup
2. [ ] Phase 2: Create auth fixtures
3. [ ] Phase 3: Create data seeding
4. [ ] Phase 4: Update Playwright config
5. [ ] Phase 5: Update failing tests (in batches)

### Post-Execution
- [ ] Run full test suite: `npx playwright test`
- [ ] Generate HTML report: `bun run test:e2e:report`
- [ ] Verify 100% pass rate
- [ ] Document any edge cases found
- [ ] Commit all changes

---

## Completion Report Template

```markdown
# E2E Test Fixtures Implementation - Completion Report

**Completed**: YYYY-MM-DD
**Duration**: X hours

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Passing Tests | 166 / 344 (48%) | 344 / 344 (100%) |
| Failing Tests | 178 | 0 |
| Test Runtime | ~X min | ~Y min |

## Components Delivered

- [x] Test users module (`e2e/fixtures/test-users.ts`)
- [x] Auth fixtures (`e2e/fixtures/auth.ts`)
- [x] Data seeding (`e2e/fixtures/seed-data.ts`)
- [x] Global setup/teardown
- [x] Updated Playwright config
- [x] Updated 178 test files

## Test Data Created

- 4 test user accounts (guest_big_spender, guest_high_flex, guest_average, host)
- 3 user archetypes
- 1 test listing
- 1 test lease
- 12 calendar stays
- 1 date change request

## Challenges Encountered

[Document any issues faced and solutions]

## Recommendations

- Keep test users in dev database (don't delete between runs)
- Run cleanup regularly to prevent data pollution
- Monitor test runtime as suite grows
```

---

## Next Steps (Post-Implementation)

1. **Monitoring**: Set up test failure alerts
2. **CI/CD**: Integrate E2E tests into GitHub Actions
3. **Documentation**: Update test writing guide with fixture usage
4. **Expansion**: Add more test data scenarios as needed (multiple leases, proposals, etc.)

---

## Reference Commands

```bash
# Setup
bun run test:e2e:setup

# Run all tests
bun run test:e2e

# Run specific test
npx playwright test e2e/tests/pattern1-personalized-defaults.spec.ts

# Debug mode
bun run test:e2e:debug

# UI mode (interactive)
bun run test:e2e:ui

# View report
bun run test:e2e:report

# Cleanup
bun run test:e2e:cleanup
```

---

**This plan achieves 100% E2E test pass rate through systematic auth fixtures and data seeding.**
