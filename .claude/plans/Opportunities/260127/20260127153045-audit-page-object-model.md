# Page Object Model Opportunity Report
**Generated:** 2026-01-27 15:30:45
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: **0**
- Test files needing POM refactoring: **0**
- Duplicate selectors found: **0**
- Pages needing page objects: **N/A** (no E2E tests exist)

## Infrastructure Check

### POM Setup Status
- [ ] `e2e/pages/` directory exists
- [ ] `BasePage.ts` base class exists
- [ ] Page object fixtures exist
- [ ] Component page objects exist

### Current E2E Test Infrastructure
| Component | Status | Notes |
|-----------|--------|-------|
| Playwright config | **NOT FOUND** | No `playwright.config.ts` or `playwright.config.js` |
| E2E directory | **NOT FOUND** | No `e2e/` directory exists |
| Test files (.spec.ts) | **NOT FOUND** | No Playwright spec files in codebase |
| Test files (.spec.js) | **NOT FOUND** | No Playwright spec files in codebase |

### Current Test Infrastructure (Non-E2E)

The codebase has **unit/integration test infrastructure** but **no E2E tests**:

| Test Type | Location | Framework | Description |
|-----------|----------|-----------|-------------|
| Unit Tests | `app/src/logic/calculators/matching/__tests__/` | Vitest | Tests for matching algorithms |
| Edge Function Test Helpers | `supabase/functions/tests/helpers/` | Deno | Assertions and fixtures for Edge Function testing |
| Python Tests | `pythonanywhere/mysite/tests/` | Python | TensorFlow/ML tests |
| Python Tests | `pythonanywhere/mysite3/tests/` | Python | Matching algorithm tests |

## Critical Gap Analysis

### No E2E Tests Exist

**Current State:** The Split Lease codebase has **zero Playwright/Cypress/E2E tests**.

**What Exists:**
1. **Unit tests** for business logic (matching calculators, rules)
2. **Test helpers** for Edge Functions (fixtures, assertions)
3. **Python tests** for ML/backend services

**What's Missing:**
1. No E2E test framework (Playwright, Cypress, etc.)
2. No browser automation tests
3. No user flow tests (login, booking, checkout)
4. No page object infrastructure

### Impact of Missing E2E Tests

Without E2E tests, the following critical user flows are untested in a browser context:

| User Flow | Pages Involved | Risk Level |
|-----------|----------------|------------|
| User Login/Signup | `/login`, `/signup`, auth modals | **HIGH** |
| Listing Search | `/search`, search filters | **HIGH** |
| Listing View | `/view-split-lease/:id` | **HIGH** |
| Booking/Proposal Flow | Multiple pages | **CRITICAL** |
| Host Dashboard | `/listing-dashboard`, `/host-proposals` | **HIGH** |
| Guest Proposals | `/guest-proposals/:userId` | **HIGH** |
| Account Profile | `/account-profile/:userId` | **MEDIUM** |
| Listing Creation | `/self-listing`, `/self-listing-v2` | **HIGH** |

## Recommendations

### Phase 1: E2E Infrastructure Setup (Required First)

Before Page Object Model can be implemented, E2E test infrastructure must be established:

1. **Install Playwright**
   ```bash
   cd app
   bun add -D @playwright/test
   npx playwright install
   ```

2. **Create Playwright Config**
   ```typescript
   // playwright.config.ts
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './e2e',
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
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     ],
     webServer: {
       command: 'bun run dev',
       url: 'http://localhost:8000',
       reuseExistingServer: !process.env.CI,
     },
   });
   ```

3. **Create Directory Structure**
   ```
   app/
   └── e2e/
       ├── fixtures/
       │   └── pages.ts           # Page object fixtures
       ├── pages/
       │   ├── BasePage.ts        # Common functionality
       │   ├── LoginPage.ts
       │   ├── SearchPage.ts
       │   ├── ListingPage.ts
       │   └── CheckoutPage.ts
       ├── components/
       │   ├── DateRangePicker.ts
       │   └── Navbar.ts
       └── tests/
           └── *.spec.ts          # Tests using page objects
   ```

### Phase 2: Page Object Model Implementation

Once E2E infrastructure exists, implement POM with these priorities:

#### Priority 1: Core Pages

| Page | Page Object | Key Selectors to Encapsulate |
|------|-------------|------------------------------|
| Login | `LoginPage.ts` | email input, password input, submit button, error messages |
| Search | `SearchPage.ts` | search input, filters, listing cards, pagination |
| Listing View | `ListingPage.ts` | title, price, book button, calendar, amenities |
| Checkout | `CheckoutPage.ts` | payment form, total, submit button |

#### Priority 2: Host Pages

| Page | Page Object | Key Selectors |
|------|-------------|---------------|
| Listing Dashboard | `ListingDashboardPage.ts` | listings list, edit buttons, status badges |
| Host Proposals | `HostProposalsPage.ts` | proposal cards, accept/reject buttons |
| Self Listing | `SelfListingPage.ts` | form fields, photo upload, submit |

#### Priority 3: Components

| Component | Page Object | Used On |
|-----------|-------------|---------|
| Navbar | `NavbarComponent.ts` | All pages |
| Auth Modal | `AuthModalComponent.ts` | Multiple pages |
| Date Picker | `DatePickerComponent.ts` | Search, Listing, Checkout |
| Listing Card | `ListingCardComponent.ts` | Search, Favorites |

### Suggested Base Page Class

```typescript
// e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common elements
  get navbar() { return this.page.locator('nav'); }
  get loadingSpinner() { return this.page.getByTestId('loading-spinner'); }
  get toastNotification() { return this.page.getByRole('alert'); }

  // Common actions
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoading() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async getToastMessage(): Promise<string> {
    return this.toastNotification.textContent() ?? '';
  }
}
```

### Suggested Login Page Object

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in|log in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.waitForLoading();
  }

  async loginAndWait(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/dashboard|home/);
  }
}
```

### Suggested Page Object Fixtures

```typescript
// e2e/fixtures/pages.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SearchPage } from '../pages/SearchPage';
import { ListingPage } from '../pages/ListingPage';

type Pages = {
  loginPage: LoginPage;
  searchPage: SearchPage;
  listingPage: ListingPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  listingPage: async ({ page }, use) => {
    await use(new ListingPage(page));
  },
});

export { expect } from '@playwright/test';
```

## Test Files with Good Patterns (Reference)

The existing unit test file demonstrates good testing patterns that can be applied to E2E:

**File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`

**Good Patterns:**
- Clear test data setup (`perfectMatchListing`, `perfectMatchProposal`)
- Grouped tests by feature (`describe` blocks)
- Tests for edge cases (null inputs, boundary conditions)
- Readable assertions with meaningful variable names

## Next Steps

1. **Immediate:** Create E2E infrastructure (Playwright setup)
2. **Week 1:** Implement BasePage and LoginPage
3. **Week 2:** Implement SearchPage and ListingPage
4. **Week 3:** Implement remaining page objects
5. **Week 4:** Create E2E tests for critical user flows

## Related Audits

This audit relates to other testing opportunities:
- `audit-reusable-auth-state.md` - Auth state reuse (depends on E2E infrastructure)
- `audit-test-sharding-ci.md` - CI test parallelization (depends on E2E tests existing)
- `audit-accessible-query-patterns.md` - Accessible selectors (applies once E2E tests exist)

---

**Conclusion:** The Split Lease codebase has **zero E2E tests**, making POM refactoring not applicable yet. The primary opportunity is to **establish E2E test infrastructure first**, then implement Page Object Model from the start to avoid accumulating technical debt with scattered selectors.
