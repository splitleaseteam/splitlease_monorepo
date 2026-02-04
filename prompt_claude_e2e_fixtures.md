# 🖥️ CLAUDE CODE MISSION: Fix E2E Test Failures

**Agent:** Claude Code  
**Token Budget:** 500,000  
**Phase:** E2E Test Fixtures & Data Seeding

---

## 🎯 OBJECTIVE

**Problem:** 178/344 E2E tests are failing due to:
1. **Auth seeding**: Tests need logged-in users but can't authenticate
2. **Data seeding**: Tests need pre-populated leases, listings, and proposals

**Your mission:** Create robust test fixtures and data seeding infrastructure to get all 344 E2E tests passing.

---

## 📂 CODEBASE LOCATION

**Main Directory:**  
`C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease`

**E2E Directory:** `e2e/`
**Playwright Config:** `e2e/playwright.config.ts`
**Supabase:** `supabase/` (migrations, functions)

---

## 📋 PHASE 1: ANALYZE CURRENT TEST SETUP (100k tokens)

### 1.1 Review Existing E2E Structure
```bash
# Find all E2E test files
find e2e -name "*.test.ts" -o -name "*.spec.ts"

# Check Playwright config
cat e2e/playwright.config.ts

# Check if any fixtures exist
ls e2e/fixtures/ 2>/dev/null || echo "No fixtures directory"
```

### 1.2 Identify Auth Patterns
Look at how auth is handled in the app:
- `app/src/lib/supabase.js` - Supabase client
- `app/src/hooks/useAuth.js` - Auth hook
- `app/src/islands/shared/SignUpLoginModal.jsx` - Login UI

### 1.3 Identify Required Test Data
Review what data the failing tests need:
- Users (guest, host, admin)
- Listings (active, with calendar)
- Leases (active, with stays, with date change requests)
- Proposals (pending, accepted)
- User archetypes (big_spender, high_flex, average)

---

## 📋 PHASE 2: CREATE AUTH FIXTURES (150k tokens)

### 2.1 Create Test Users in Supabase

**File:** `e2e/fixtures/test-users.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for seeding
);

export const TEST_USERS = {
  guest_big_spender: {
    email: 'e2e-guest-bigspender@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null as string | null, // Will be populated
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
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const found = existingUser?.users.find(u => u.email === user.email);
    
    if (found) {
      user.userId = found.id;
      console.log(`User ${key} already exists: ${found.id}`);
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      
      if (error) throw new Error(`Failed to create ${key}: ${error.message}`);
      user.userId = data.user.id;
      console.log(`Created user ${key}: ${data.user.id}`);
    }
  }
  
  return TEST_USERS;
}

export async function deleteTestUsers() {
  for (const [key, user] of Object.entries(TEST_USERS)) {
    if (user.userId) {
      await supabase.auth.admin.deleteUser(user.userId);
      console.log(`Deleted user ${key}`);
    }
  }
}
```

### 2.2 Create Playwright Auth State

**File:** `e2e/fixtures/auth.ts`

```typescript
import { test as base, Page } from '@playwright/test';
import { TEST_USERS, createTestUsers } from './test-users';

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
    // Login as default test user
    await loginAs(page, TEST_USERS.guest_big_spender);
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

async function loginAs(page: Page, user: typeof TEST_USERS.guest_big_spender) {
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="submit-login"]');
  await page.waitForURL(/.*(?!login)/); // Wait for redirect away from login
}

export { expect } from '@playwright/test';
```

### 2.3 Create Auth Setup Script

**File:** `e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';
import { createTestUsers, TEST_USERS } from './fixtures/test-users';
import { seedTestData } from './fixtures/seed-data';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global setup...');
  
  // 1. Create test users
  await createTestUsers();
  
  // 2. Seed test data (listings, leases, etc.)
  await seedTestData();
  
  // 3. Generate auth states for each user
  const browser = await chromium.launch();
  
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login
    await page.goto(config.projects[0].use?.baseURL + '/');
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', user.password);
    await page.click('[data-testid="submit-login"]');
    await page.waitForURL(/.*dashboard|leases|home/);
    
    // Save auth state
    const authFile = path.join(authDir, `${key.replace(/_/g, '-')}.json`);
    await context.storageState({ path: authFile });
    console.log(`✅ Auth state saved: ${authFile}`);
    
    await context.close();
  }
  
  await browser.close();
  console.log('✅ Global setup complete!');
}

export default globalSetup;
```

---

## 📋 PHASE 3: CREATE DATA SEEDING (150k tokens)

### 3.1 Seed Test Data

**File:** `e2e/fixtures/seed-data.ts`

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
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .upsert({
      _id: 'e2e-test-listing-001',
      'Listing Name': 'E2E Test Apartment',
      'Address': '123 Test Street, San Francisco, CA',
      'Monthly Rent': 2500,
      'Host': TEST_USERS.host.userId,
      'Active?': true,
      'Featured?': false
    }, { onConflict: '_id' })
    .select()
    .single();
  
  if (listingError) throw new Error(`Listing seed failed: ${listingError.message}`);
  console.log('✅ Listing seeded:', listing._id);
  
  // 2. Create test lease for Big Spender guest
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
  console.log('✅ Lease seeded:', lease._id);
  
  // 3. Create stays for the lease
  const stays = [];
  for (let week = 0; week < 12; week++) {
    const stayStart = new Date(leaseStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const stayEnd = new Date(stayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    stays.push({
      _id: `e2e-test-stay-${week + 1}`,
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
  console.log('✅ Stays seeded:', stays.length);
  
  // 4. Create user archetypes
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
  
  if (archetypeError) console.warn('Archetype seed warning:', archetypeError.message);
  else console.log('✅ Archetypes seeded');
  
  // 5. Create a pending date change request
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
  
  if (dcrError) console.warn('DCR seed warning:', dcrError.message);
  else console.log('✅ Date change request seeded');
  
  console.log('✅ All test data seeded!');
}

export async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  // Delete in reverse order of creation (respect foreign keys)
  await supabase.from('datechangerequest').delete().like('_id', 'e2e-test%');
  await supabase.from('user_archetypes').delete().in('auth_user_id', 
    Object.values(TEST_USERS).map(u => u.userId).filter(Boolean)
  );
  await supabase.from('calendar_stays').delete().like('_id', 'e2e-test%');
  await supabase.from('bookings_leases').delete().like('_id', 'e2e-test%');
  await supabase.from('listing').delete().like('_id', 'e2e-test%');
  
  console.log('✅ Cleanup complete!');
}
```

---

## 📋 PHASE 4: UPDATE PLAYWRIGHT CONFIG (50k tokens)

### 4.1 Update playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Global setup/teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup project (runs first)
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
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

---

## 📋 PHASE 5: UPDATE FAILING TESTS (50k tokens)

### 5.1 Update tests to use fixtures

**Before (failing):**
```typescript
test('should display archetype indicator', async ({ page }) => {
  await page.goto('/guest-leases');
  // Fails: user not logged in, no data
});
```

**After (passing):**
```typescript
import { test, expect } from '../fixtures/auth';

test('should display archetype indicator', async ({ guestBigSpenderPage }) => {
  await guestBigSpenderPage.goto('/guest-leases');
  // Works: user is logged in, test data exists
  await expect(guestBigSpenderPage.locator('[data-testid="archetype-indicator"]'))
    .toContainText('Big Spender');
});
```

---

## 🔑 SUCCESS METRICS

- **E2E Tests**: 344/344 passing (100%)
- **Auth Fixtures**: All 4 user types working
- **Data Seeding**: All required entities created
- **Cleanup**: No test data pollution

---

## 📊 DELIVERABLES

1. `e2e/fixtures/test-users.ts` - Test user definitions
2. `e2e/fixtures/auth.ts` - Playwright auth fixtures
3. `e2e/fixtures/seed-data.ts` - Data seeding functions
4. `e2e/global-setup.ts` - Global setup script
5. `e2e/global-teardown.ts` - Cleanup script
6. Updated `e2e/playwright.config.ts`
7. Updated test files using new fixtures

---

## 🚀 GET STARTED

```bash
# 1. Create .env.test with required variables
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
E2E_BASE_URL=http://localhost:5173

# 2. Run global setup to seed data
npx ts-node e2e/global-setup.ts

# 3. Run tests
npx playwright test

# 4. View results
npx playwright show-report
```

**Your work will get us to 100% E2E test pass rate!**
