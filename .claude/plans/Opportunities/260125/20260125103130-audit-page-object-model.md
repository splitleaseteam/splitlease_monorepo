# Page Object Model Opportunity Report
**Generated:** 2026-01-25 10:31:30
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: **0**
- Test files needing POM refactoring: **0** (no E2E tests exist)
- Duplicate selectors found: **N/A** (no E2E tests)
- Pages needing page objects: **N/A** (no E2E infrastructure)

### Key Finding: No E2E Test Infrastructure Exists

The Split Lease codebase **does not currently have any End-to-End (E2E) tests**. This represents a significant **greenfield opportunity** to establish E2E testing with the Page Object Model pattern from the ground up.

---

## Infrastructure Check

### Current Test Setup Status

| Component | Status | Location |
|-----------|--------|----------|
| Playwright dependency | **Installed** | `package.json` (v1.57.0) |
| Playwright config | **Missing** | No `playwright.config.ts` |
| E2E test directory | **Missing** | No `e2e/` or `tests/` folder |
| Page Objects directory | **Missing** | No `e2e/pages/` |
| E2E test fixtures | **Missing** | No Playwright fixtures |

### Existing Test Infrastructure

| Type | Location | Framework | Status |
|------|----------|-----------|--------|
| Unit Tests | `app/src/logic/calculators/matching/__tests__/` | Vitest | Active (1 file) |
| Edge Function Tests | `supabase/functions/tests/` | Deno | Scaffolded (empty) |
| Test Helpers | `supabase/functions/tests/helpers/` | Deno | Active (2 files) |

### POM Setup Status (All Missing)
- [ ] `e2e/` directory exists
- [ ] `playwright.config.ts` exists
- [ ] `e2e/pages/` directory exists
- [ ] `BasePage.ts` base class exists
- [ ] Page object fixtures exist
- [ ] Component page objects exist

---

## Current Page Objects

**None exist.** This is a greenfield opportunity.

---

## Opportunity: Establishing E2E Testing with POM

### Why This Matters

Split Lease is a rental marketplace with complex user flows including:
- User authentication (login, signup, magic link)
- Listing search and filtering
- Proposal creation and management
- Booking flows
- Host dashboards
- Guest management

Without E2E tests, UI regressions can go undetected until production.

### Recommended File Structure

```
e2e/
├── playwright.config.ts           # Playwright configuration
├── fixtures/
│   └── pages.ts                   # Page object fixtures
├── pages/
│   ├── BasePage.ts                # Common functionality
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── SearchPage.ts
│   ├── ListingPage.ts
│   ├── ProposalPage.ts
│   ├── CheckoutPage.ts
│   └── DashboardPage.ts
├── components/
│   ├── Navbar.ts
│   ├── DateRangePicker.ts
│   ├── SearchFilters.ts
│   └── ProposalCard.ts
└── tests/
    ├── auth.spec.ts
    ├── search.spec.ts
    ├── booking-flow.spec.ts
    └── dashboard.spec.ts
```

---

## Pages Needing Page Objects

Based on analysis of `app/public/*.html` and `app/src/islands/pages/`, these pages should have corresponding page objects:

### Priority 1: Core User Journeys

| Page | HTML File | React Island | Suggested PO |
|------|-----------|--------------|--------------|
| Home | `index.html` | `HomePage.jsx` | `HomePage.ts` |
| Login | `login.html` | `LoginPage.jsx` | `LoginPage.ts` |
| Search | `search.html` | `SearchPage.jsx` | `SearchPage.ts` |
| Listing Details | `listing.html` | `ListingPage.jsx` | `ListingPage.ts` |

### Priority 2: Booking Flow

| Page | HTML File | React Island | Suggested PO |
|------|-----------|--------------|--------------|
| Proposal | `proposal.html` | `ProposalPage.jsx` | `ProposalPage.ts` |
| Checkout | `checkout.html` | `CheckoutPage.jsx` | `CheckoutPage.ts` |
| Confirmation | `confirmation.html` | `ConfirmationPage.jsx` | `ConfirmationPage.ts` |

### Priority 3: Host/Guest Dashboards

| Page | HTML File | React Island | Suggested PO |
|------|-----------|--------------|--------------|
| Host Dashboard | `host-dashboard.html` | `HostDashboardPage.jsx` | `HostDashboardPage.ts` |
| Listing Dashboard | `listing-dashboard.html` | `ListingDashboardPage/` | `ListingDashboardPage.ts` |
| Guest Dashboard | `guest-dashboard.html` | Various | `GuestDashboardPage.ts` |

---

## Common Components Needing Page Objects

### 1. Navigation Bar
- **Used on pages:** All pages
- **Suggested selectors:**
  ```typescript
  class Navbar {
    readonly container = page.getByRole('navigation')
    readonly logo = page.getByRole('link', { name: /split lease/i })
    readonly loginButton = page.getByRole('link', { name: /login/i })
    readonly signupButton = page.getByRole('link', { name: /sign up/i })
  }
  ```

### 2. Search Filters
- **Used on pages:** Search, possibly Home
- **Suggested selectors:**
  ```typescript
  class SearchFilters {
    readonly boroughSelect = page.getByLabel(/borough/i)
    readonly priceMinInput = page.getByLabel(/min price/i)
    readonly priceMaxInput = page.getByLabel(/max price/i)
    readonly dateRangePicker = new DateRangePicker(page)
  }
  ```

### 3. Date Range Picker
- **Used on pages:** Search, Listing, Proposal, Booking
- **Suggested selectors:**
  ```typescript
  class DateRangePicker {
    readonly container = page.locator('[data-testid="date-picker"]')
    readonly checkInInput = page.getByLabel(/check-in/i)
    readonly checkOutInput = page.getByLabel(/check-out/i)

    async selectRange(start: Date, end: Date) {
      // Encapsulated calendar interaction logic
    }
  }
  ```

### 4. Listing Card
- **Used on pages:** Search, Host Dashboard
- **Suggested selectors:**
  ```typescript
  class ListingCard {
    constructor(private container: Locator) {}

    readonly title = this.container.getByRole('heading')
    readonly price = this.container.locator('[data-testid="price"]')
    readonly viewButton = this.container.getByRole('link', { name: /view/i })
  }
  ```

---

## Suggested Base Page Implementation

```typescript
// e2e/pages/BasePage.ts
import { type Page, type Locator } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // Common selectors
  get navbar() { return new Navbar(this.page) }
  get loadingSpinner() { return this.page.getByTestId('loading-spinner') }
  get toast() { return this.page.locator('[role="alert"]') }

  // Common actions
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoadingComplete() {
    await this.loadingSpinner.waitFor({ state: 'hidden' })
  }

  async expectToastMessage(message: string | RegExp) {
    await expect(this.toast).toContainText(message)
  }
}
```

---

## Suggested Fixture Implementation

```typescript
// e2e/fixtures/pages.ts
import { test as base } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { SearchPage } from '../pages/SearchPage'
import { ListingPage } from '../pages/ListingPage'
import { HomePage } from '../pages/HomePage'

type Pages = {
  homePage: HomePage
  loginPage: LoginPage
  searchPage: SearchPage
  listingPage: ListingPage
}

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page))
  },
  listingPage: async ({ page }, use) => {
    await use(new ListingPage(page))
  },
})

export { expect } from '@playwright/test'
```

---

## Common Actions to Abstract

### Login Flow
- **Would be used in:** Most authenticated test scenarios
- **Suggested implementation:**
  ```typescript
  // e2e/pages/LoginPage.ts
  class LoginPage extends BasePage {
    readonly emailInput = this.page.getByLabel(/email/i)
    readonly passwordInput = this.page.getByLabel(/password/i)
    readonly submitButton = this.page.getByRole('button', { name: /sign in|log in/i })

    async goto() {
      await this.page.goto('/login')
    }

    async login(email: string, password: string) {
      await this.emailInput.fill(email)
      await this.passwordInput.fill(password)
      await this.submitButton.click()
      await this.page.waitForURL(/dashboard|home/)
    }
  }
  ```

### Search Flow
- **Would be used in:** Search tests, booking flow tests
- **Suggested implementation:**
  ```typescript
  // e2e/pages/SearchPage.ts
  class SearchPage extends BasePage {
    readonly searchInput = this.page.getByPlaceholder(/search/i)
    readonly resultsContainer = this.page.locator('[data-testid="search-results"]')

    async goto() {
      await this.page.goto('/search')
    }

    async searchByNeighborhood(neighborhood: string) {
      await this.searchInput.fill(neighborhood)
      await this.page.keyboard.press('Enter')
      await this.waitForLoadingComplete()
    }

    async getListingCards() {
      return this.resultsContainer.locator('[data-testid="listing-card"]')
    }
  }
  ```

---

## Recommended Implementation Phases

### Phase 1: Infrastructure Setup (1-2 days)
1. Create `playwright.config.ts` with proper base URL and test directory
2. Set up `e2e/` directory structure
3. Implement `BasePage.ts` with common selectors and actions
4. Create fixture file with page object dependency injection

### Phase 2: Core Page Objects (3-5 days)
1. `HomePage.ts` - Landing page interactions
2. `LoginPage.ts` - Authentication flow
3. `SearchPage.ts` - Search and filter functionality
4. `ListingPage.ts` - Listing detail interactions

### Phase 3: Component Page Objects (2-3 days)
1. `Navbar.ts` - Navigation component
2. `DateRangePicker.ts` - Date selection component
3. `SearchFilters.ts` - Filter controls
4. `ListingCard.ts` - Card component for lists

### Phase 4: First E2E Tests (3-5 days)
1. `auth.spec.ts` - Login/logout/signup flows
2. `search.spec.ts` - Search and filter tests
3. `booking-flow.spec.ts` - Complete booking journey

---

## Benefits of Implementing POM Now

| Benefit | Without POM | With POM |
|---------|-------------|----------|
| Selector changes | Update every test file | Update one page object |
| Test readability | `page.locator('.btn-xyz')` | `listingPage.bookButton` |
| Code reuse | Copy-paste selectors | Import page objects |
| Onboarding | Learn all selectors | Learn page object API |
| Maintenance | O(n) where n = test files | O(1) per UI change |

---

## Action Items

1. **Create Playwright configuration** - Set up `playwright.config.ts` with project-specific settings
2. **Establish page object directory structure** - Create `e2e/pages/` and `e2e/components/`
3. **Implement BasePage class** - Common functionality for all page objects
4. **Create fixtures** - Dependency injection for page objects
5. **Write first test with POM** - Validate the pattern works before scaling

---

## References

- **Playwright POM Documentation:** https://playwright.dev/docs/pom
- **Existing test helper pattern:** `supabase/functions/tests/helpers/` (can adapt for E2E)
- **Previous audit:** `.claude/plans/Documents/260124103054-audit-page-object-model.md`
