# Page Object Model Opportunity Report
**Generated:** 2026-01-28 10:32:00
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
| E2E directory | **NOT FOUND** | No `e2e/` or `app/e2e/` directory exists |
| Test files (.spec.ts) | **NOT FOUND** | No Playwright spec files in codebase |
| Test files (.spec.js) | **NOT FOUND** | No Playwright spec files in codebase |
| Page Objects | **NOT FOUND** | No page object classes exist |

### Current Test Infrastructure (Non-E2E)

The codebase has **unit/integration test infrastructure** but **no E2E tests**:

| Test Type | Location | Framework | Files Found |
|-----------|----------|-----------|-------------|
| Unit Tests | `app/src/logic/calculators/matching/__tests__/` | Vitest | `calculateMatchScore.test.js` |
| Edge Function Test Helpers | `supabase/functions/tests/helpers/` | Deno | `assertions.ts`, `fixtures.ts` |
| Python Tests | `pythonanywhere/mysite/tests/` | Python | ML/TensorFlow tests |
| Python Tests | `pythonanywhere/mysite3/tests/` | Python | Matching algorithm tests |

### Existing Unit Test Analysis

**File:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`

This file demonstrates good testing practices that should be carried forward to E2E tests:

**Good Patterns Found:**
- Clear test data setup with descriptive names (`perfectMatchListing`, `perfectMatchProposal`)
- Grouped tests by feature using `describe` blocks
- Tests for edge cases (null inputs, boundary conditions)
- Readable assertions with meaningful variable names
- Tests both happy path and error scenarios

**Code Example (Good Pattern):**
```javascript
const perfectMatchListing = {
  _id: 'listing-perfect',
  boroughName: 'Manhattan',
  'Location - Borough': 'Manhattan',
  'Schedule days available': [0, 1, 2, 3, 4, 5, 6],
  'Minimum Nights': 4
};

describe('Borough Matching', () => {
  it('returns true for exact match', () => {
    expect(isBoroughMatch({ candidateBorough: 'Manhattan', proposalBorough: 'Manhattan' })).toBe(true);
  });
});
```

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

| User Flow | Pages Involved | Risk Level | Complexity |
|-----------|----------------|------------|------------|
| User Login/Signup | `/login`, `/signup`, auth modals | **HIGH** | Medium |
| Listing Search | `/search`, search filters | **HIGH** | High |
| Listing View | `/view-split-lease/:id` | **HIGH** | Medium |
| Booking/Proposal Flow | Multiple pages (10+ components) | **CRITICAL** | Very High |
| Host Dashboard | `/listing-dashboard`, `/host-proposals` | **HIGH** | High |
| Guest Proposals | `/guest-proposals/:userId` | **HIGH** | High |
| Account Profile | `/account-profile/:userId` | **MEDIUM** | Medium |
| Listing Creation | `/self-listing`, `/self-listing-v2` | **HIGH** | Very High |
| Messaging | `/messages` | **HIGH** | High |
| Admin Pages | `/_admin/*`, `/z-*` | **MEDIUM** | Medium |

### Pages Inventory (Would Need Page Objects)

Based on `app/public/*.html` and `app/src/islands/pages/`:

| Page Category | Count | Examples |
|---------------|-------|----------|
| Public Pages | 8 | home, about-us, faq, careers, policies |
| Auth Pages | 2 | login, signup |
| Guest Pages | 6 | guest-proposals, favorite-listings, rental-application |
| Host Pages | 8 | listing-dashboard, host-proposals, self-listing |
| Shared Pages | 5 | messages, account-profile, view-split-lease |
| Admin Pages | 15+ | z-* test pages, admin-threads |

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
   // app/playwright.config.ts
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
       { name: 'mobile', use: { ...devices['iPhone 13'] } },
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
       │   ├── Navbar.ts
       │   └── AuthModal.ts
       └── tests/
           ├── auth.spec.ts
           ├── search.spec.ts
           └── booking.spec.ts
   ```

### Phase 2: Page Object Model Implementation

Once E2E infrastructure exists, implement POM with these priorities:

#### Priority 1: Core Pages (Week 1)

| Page | Page Object | Key Selectors to Encapsulate |
|------|-------------|------------------------------|
| Login | `LoginPage.ts` | email input, password input, submit button, error messages, social login buttons |
| Search | `SearchPage.ts` | search input, filters (borough, price, dates), listing cards, pagination, map toggle |
| Listing View | `ListingPage.ts` | title, price, book button, calendar, amenities, host info, photo gallery |
| Checkout | `CheckoutPage.ts` | payment form, total breakdown, submit button, terms checkbox |

#### Priority 2: Host Pages (Week 2)

| Page | Page Object | Key Selectors |
|------|-------------|---------------|
| Listing Dashboard | `ListingDashboardPage.ts` | listings list, edit buttons, status badges, photo upload |
| Host Proposals | `HostProposalsPage.ts` | proposal cards, accept/reject buttons, counteroffer modal |
| Self Listing | `SelfListingPage.ts` | multi-step form, photo upload, amenity checkboxes, submit |

#### Priority 3: Guest Pages (Week 3)

| Page | Page Object | Key Selectors |
|------|-------------|---------------|
| Guest Proposals | `GuestProposalsPage.ts` | proposal list, status badges, view details button |
| Rental Application | `RentalApplicationPage.ts` | multi-step form, document upload, verification fields |
| Favorites | `FavoritesPage.ts` | listing cards, remove button, view listing link |

#### Priority 4: Components (Week 4)

| Component | Page Object | Used On |
|-----------|-------------|---------|
| Navbar | `NavbarComponent.ts` | All pages |
| Auth Modal | `AuthModalComponent.ts` | Multiple pages (login/signup modal) |
| Date Picker | `DatePickerComponent.ts` | Search, Listing, Checkout, Host Proposals |
| Listing Card | `ListingCardComponent.ts` | Search, Favorites, Dashboard |
| Photo Upload | `PhotoUploadComponent.ts` | Self Listing, Edit Listing |
| Schedule Picker | `SchedulePickerComponent.ts` | Proposals, Booking |

### Suggested Base Page Class

```typescript
// e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common elements (aligned with Split Lease UI)
  get navbar() { return this.page.locator('nav'); }
  get loadingSpinner() { return this.page.getByTestId('loading-spinner'); }
  get toastNotification() { return this.page.getByRole('alert'); }
  get loginButton() { return this.page.getByRole('button', { name: /sign in|log in/i }); }
  get userMenu() { return this.page.getByTestId('user-menu'); }

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

  async isLoggedIn(): Promise<boolean> {
    return this.userMenu.isVisible();
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
  readonly googleLoginButton: Locator;
  readonly linkedInLoginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in|log in/i });
    this.errorMessage = page.getByRole('alert');
    this.googleLoginButton = page.getByRole('button', { name: /google/i });
    this.linkedInLoginButton = page.getByRole('button', { name: /linkedin/i });
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
    await this.page.waitForURL(/dashboard|home|search/);
  }

  async getErrorText(): Promise<string> {
    return this.errorMessage.textContent() ?? '';
  }
}
```

### Suggested Search Page Object

```typescript
// e2e/pages/SearchPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SearchPage extends BasePage {
  readonly searchInput: Locator;
  readonly boroughFilter: Locator;
  readonly priceMinInput: Locator;
  readonly priceMaxInput: Locator;
  readonly listingCards: Locator;
  readonly mapToggle: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search|location/i);
    this.boroughFilter = page.getByTestId('borough-filter');
    this.priceMinInput = page.getByLabel(/min.*price/i);
    this.priceMaxInput = page.getByLabel(/max.*price/i);
    this.listingCards = page.locator('[data-testid="listing-card"]');
    this.mapToggle = page.getByRole('button', { name: /map/i });
    this.noResultsMessage = page.getByText(/no listings found/i);
  }

  async goto() {
    await this.page.goto('/search');
    await this.waitForPageLoad();
  }

  async searchByLocation(location: string) {
    await this.searchInput.fill(location);
    await this.searchInput.press('Enter');
    await this.waitForLoading();
  }

  async filterByBorough(borough: string) {
    await this.boroughFilter.selectOption(borough);
    await this.waitForLoading();
  }

  async getListingCount(): Promise<number> {
    return this.listingCards.count();
  }

  async clickListing(index: number) {
    await this.listingCards.nth(index).click();
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
import { GuestProposalsPage } from '../pages/GuestProposalsPage';

type Pages = {
  loginPage: LoginPage;
  searchPage: SearchPage;
  listingPage: ListingPage;
  guestProposalsPage: GuestProposalsPage;
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
  guestProposalsPage: async ({ page }, use) => {
    await use(new GuestProposalsPage(page));
  },
});

export { expect } from '@playwright/test';
```

### Example Test Using Page Objects

```typescript
// e2e/tests/search.spec.ts
import { test, expect } from '../fixtures/pages';

test.describe('Search Page', () => {
  test('should filter listings by borough', async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.filterByBorough('Manhattan');

    const count = await searchPage.getListingCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to listing details', async ({ searchPage, listingPage }) => {
    await searchPage.goto();
    await searchPage.clickListing(0);

    await expect(listingPage.title).toBeVisible();
    await expect(listingPage.bookButton).toBeVisible();
  });
});
```

## Test Data Strategy

Align with existing test data patterns from `supabase/functions/tests/helpers/fixtures.ts`:

```typescript
// e2e/fixtures/testData.ts
export const testUser = {
  email: 'e2e-test@splitlease.com',
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

export const testHost = {
  email: 'e2e-host@splitlease.com',
  password: 'TestPassword123!',
  name: 'E2E Test Host',
};

export const testListing = {
  id: 'e2e-test-listing',
  title: 'E2E Test Listing',
  borough: 'Manhattan',
  neighborhood: 'East Village',
};
```

## Next Steps

1. **Immediate:** Create E2E infrastructure (Playwright setup)
2. **Week 1:** Implement BasePage, LoginPage, and basic auth tests
3. **Week 2:** Implement SearchPage, ListingPage, and search flow tests
4. **Week 3:** Implement HostProposalsPage, GuestProposalsPage, and proposal flow tests
5. **Week 4:** Implement remaining page objects and component POs
6. **Ongoing:** Add E2E tests as new features are developed

## Related Audits

This audit relates to other testing opportunities:
- `audit-reusable-auth-state.md` - Auth state reuse (depends on E2E infrastructure)
- `audit-test-sharding-ci.md` - CI test parallelization (depends on E2E tests existing)
- `audit-accessible-query-patterns.md` - Accessible selectors (applies once E2E tests exist)
- `audit-vitest-rtl-setup.md` - Unit test infrastructure (already partially implemented)

## Changelog from Previous Audits

| Date | Finding | Status |
|------|---------|--------|
| 2026-01-27 | No E2E tests exist | **UNCHANGED** |
| 2026-01-26 | No E2E tests exist | **UNCHANGED** |
| 2026-01-25 | No E2E tests exist | **UNCHANGED** |
| 2026-01-24 | No E2E tests exist | **UNCHANGED** |

---

**Conclusion:** The Split Lease codebase has **zero E2E tests**, making POM refactoring not applicable yet. The primary opportunity is to **establish E2E test infrastructure first**, then implement Page Object Model from the start to avoid accumulating technical debt with scattered selectors. The existing unit test patterns in `calculateMatchScore.test.js` demonstrate good testing discipline that should be carried forward to E2E tests.
