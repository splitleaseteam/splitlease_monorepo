# Page Object Model Audit Report
**Generated:** 2026-01-24 10:30:54
**Codebase:** Split Lease (React 18 + Vite Islands Architecture)

## Executive Summary
- E2E test files found: **0**
- Test files needing POM refactoring: **0** (no E2E tests exist)
- Duplicate selectors found: **N/A** (no E2E tests)
- Pages needing page objects: **27** (all pages lack E2E test coverage)

## Critical Finding: No E2E Test Infrastructure

**This codebase does NOT have any E2E testing infrastructure.** The audit searched for:

| Pattern Searched | Results |
|-----------------|---------|
| `*.spec.ts` files | 0 found |
| `*.e2e.ts` files | 0 found |
| `*.test.ts` files | 0 found |
| `playwright.config.*` | Not found |
| `@playwright/test` imports | 0 test files (only found in documentation) |
| `e2e/` directory | Does not exist |
| `tests/` directory with E2E tests | Does not exist |
| `vitest.config.*` | Not found |
| `jest.config.*` | Not found |

## Infrastructure Check

### POM Setup Status
- [ ] `e2e/` directory exists
- [ ] `e2e/pages/` directory exists
- [ ] `BasePage.ts` base class exists
- [ ] Page object fixtures exist
- [ ] Component page objects exist
- [ ] Playwright configuration exists

### Current Test Infrastructure

The only tests in the codebase are **Deno unit tests** for Supabase Edge Functions:

| Test File | Location | Framework |
|-----------|----------|-----------|
| `errors_test.ts` | `supabase/functions/_shared/errors_test.ts` | Deno.test |
| `validation_test.ts` | `supabase/functions/_shared/validation_test.ts` | Deno.test |
| `assertions.ts` | `supabase/functions/tests/helpers/assertions.ts` | Test helper |
| `fixtures.ts` | `supabase/functions/tests/helpers/fixtures.ts` | Test helper |

These are **backend unit tests**, not E2E tests. They test Edge Function utilities in isolation.

## Pages Requiring E2E Test Coverage

The application has **27 HTML entry points** (Islands Architecture) that all lack E2E test coverage:

### Critical User Flows (Priority 1)

| Page | Entry Point | Critical Actions |
|------|-------------|------------------|
| Search | `search.html` | Filter listings, view map, select listing |
| View Listing | `view-split-lease.html` | View details, book, contact host |
| Guest Proposals | `guest-proposals.html` | View proposals, accept/reject, counteroffer |
| Host Proposals | `host-proposals.html` | Review guests, accept/reject proposals |
| Self Listing | `self-listing.html` | Create listing, upload photos, set pricing |
| Listing Dashboard | `listing-dashboard.html` | Manage listing, view analytics |
| Rental Application | `rental-application.html` | Submit application, upload documents |
| Account Profile | `account-profile.html` | Edit profile, verify email, manage settings |

### Authentication Flows (Priority 1)

| Page | Entry Point | Critical Actions |
|------|-------------|------------------|
| Login/Signup | (embedded in pages) | Login, signup, password reset |
| Reset Password | `reset-password.html` | Reset password flow |
| Auth Verify | `auth-verify.html` | Email verification |

### Secondary Pages (Priority 2)

| Page | Entry Point |
|------|-------------|
| Home | `index.html` |
| Host Overview | `host-overview.html` |
| Favorite Listings | `favorite-listings.html` |
| Messages | `messages.html` |
| FAQ | `faq.html` |
| Help Center | `help-center.html` |

### Marketing/Static Pages (Priority 3)

| Page | Entry Point |
|------|-------------|
| About Us | `about-us.html` |
| Careers | `careers.html` |
| Why Split Lease | `why-split-lease.html` |
| List With Us | `list-with-us.html` |
| Policies | `policies.html` |
| Guest Success | `guest-success.html` |
| Host Success | `host-success.html` |

## Recommended Implementation Plan

### Phase 1: Infrastructure Setup

Create the following directory structure:

```
e2e/
├── playwright.config.ts      # Playwright configuration
├── fixtures/
│   └── pages.ts              # Page object fixtures
├── pages/
│   ├── BasePage.ts           # Common functionality
│   ├── SearchPage.ts
│   ├── ListingPage.ts
│   ├── GuestProposalsPage.ts
│   ├── HostProposalsPage.ts
│   ├── SelfListingPage.ts
│   ├── AccountProfilePage.ts
│   └── RentalApplicationPage.ts
├── components/
│   ├── Header.ts             # Shared header component
│   ├── Footer.ts             # Shared footer component
│   ├── DateRangePicker.ts    # Reused across pages
│   ├── ScheduleSelector.ts   # Complex schedule UI
│   └── ProposalCard.ts       # Proposal display component
└── tests/
    ├── search.spec.ts
    ├── booking-flow.spec.ts
    ├── proposal-flow.spec.ts
    ├── auth.spec.ts
    └── listing-management.spec.ts
```

### Phase 2: Base Page Object

```typescript
// e2e/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  // Common elements present on all pages
  readonly header: Locator;
  readonly footer: Locator;
  readonly loadingSpinner: Locator;
  readonly toastNotification: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.footer = page.locator('footer');
    this.loadingSpinner = page.getByTestId('loading-spinner');
    this.toastNotification = page.locator('.toast');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForNoSpinner() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }
}
```

### Phase 3: Priority Page Objects

#### SearchPage

```typescript
// e2e/pages/SearchPage.ts
export class SearchPage extends BasePage {
  readonly neighborhoodFilter: Locator;
  readonly priceRangeFilter: Locator;
  readonly dateRangePicker: DateRangePicker;
  readonly listingCards: Locator;
  readonly mapContainer: Locator;
  readonly searchResults: Locator;

  constructor(page: Page) {
    super(page);
    this.neighborhoodFilter = page.getByLabel(/neighborhood/i);
    this.priceRangeFilter = page.getByTestId('price-filter');
    this.dateRangePicker = new DateRangePicker(page);
    this.listingCards = page.locator('[data-testid="listing-card"]');
    this.mapContainer = page.locator('#map-container');
    this.searchResults = page.getByTestId('search-results');
  }

  async goto() {
    await this.page.goto('/search');
    await this.waitForPageLoad();
  }

  async selectNeighborhood(name: string) {
    await this.neighborhoodFilter.click();
    await this.page.getByRole('option', { name }).click();
  }

  async getListingCount(): Promise<number> {
    return await this.listingCards.count();
  }
}
```

#### ListingPage (View Split Lease)

```typescript
// e2e/pages/ListingPage.ts
export class ListingPage extends BasePage {
  readonly title: Locator;
  readonly price: Locator;
  readonly bookButton: Locator;
  readonly contactHostButton: Locator;
  readonly photoGallery: Locator;
  readonly amenitiesList: Locator;
  readonly scheduleDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { level: 1 });
    this.price = page.getByTestId('listing-price');
    this.bookButton = page.getByRole('button', { name: /book/i });
    this.contactHostButton = page.getByRole('button', { name: /contact/i });
    this.photoGallery = page.getByTestId('photo-gallery');
    this.amenitiesList = page.getByTestId('amenities-list');
    this.scheduleDisplay = page.getByTestId('schedule-display');
  }

  async goto(listingId: string) {
    await this.page.goto(`/view-split-lease/${listingId}`);
    await this.waitForPageLoad();
  }

  async clickBook() {
    await this.bookButton.click();
    await this.page.waitForURL(/\/guest-proposals/);
  }
}
```

### Phase 4: Common Components

#### DateRangePicker Component

```typescript
// e2e/components/DateRangePicker.ts
export class DateRangePicker {
  readonly page: Page;
  readonly container: Locator;
  readonly checkInInput: Locator;
  readonly checkOutInput: Locator;
  readonly calendar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="date-picker"]');
    this.checkInInput = page.getByLabel(/check-in|start date/i);
    this.checkOutInput = page.getByLabel(/check-out|end date/i);
    this.calendar = page.getByRole('application', { name: /calendar/i });
  }

  async selectRange(startDate: string, endDate: string) {
    await this.checkInInput.click();
    await this.selectDate(startDate);
    await this.selectDate(endDate);
  }

  private async selectDate(date: string) {
    await this.page.getByRole('gridcell', { name: date }).click();
  }
}
```

### Phase 5: Page Object Fixtures

```typescript
// e2e/fixtures/pages.ts
import { test as base } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { ListingPage } from '../pages/ListingPage';
import { GuestProposalsPage } from '../pages/GuestProposalsPage';
import { AccountProfilePage } from '../pages/AccountProfilePage';

type Pages = {
  searchPage: SearchPage;
  listingPage: ListingPage;
  guestProposalsPage: GuestProposalsPage;
  accountProfilePage: AccountProfilePage;
};

export const test = base.extend<Pages>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  listingPage: async ({ page }, use) => {
    await use(new ListingPage(page));
  },
  guestProposalsPage: async ({ page }, use) => {
    await use(new GuestProposalsPage(page));
  },
  accountProfilePage: async ({ page }, use) => {
    await use(new AccountProfilePage(page));
  },
});

export { expect } from '@playwright/test';
```

## Example Test Using Page Objects

```typescript
// e2e/tests/search.spec.ts
import { test, expect } from '../fixtures/pages';

test.describe('Search Page', () => {
  test('should filter listings by neighborhood', async ({ searchPage }) => {
    await searchPage.goto();

    const initialCount = await searchPage.getListingCount();
    expect(initialCount).toBeGreaterThan(0);

    await searchPage.selectNeighborhood('East Village');

    // All visible listings should be in East Village
    const filteredListings = searchPage.listingCards;
    await expect(filteredListings.first()).toContainText('East Village');
  });

  test('should navigate to listing details', async ({ searchPage, listingPage }) => {
    await searchPage.goto();

    await searchPage.listingCards.first().click();

    await expect(listingPage.title).toBeVisible();
    await expect(listingPage.bookButton).toBeVisible();
  });
});
```

## Test Data-TestId Attributes Needed

To support POM effectively, add these `data-testid` attributes to components:

| Component | Suggested TestId |
|-----------|------------------|
| Search results container | `search-results` |
| Listing card | `listing-card` |
| Price display | `listing-price` |
| Loading spinner | `loading-spinner` |
| Photo gallery | `photo-gallery` |
| Amenities list | `amenities-list` |
| Schedule display | `schedule-display` |
| Date picker | `date-picker` |
| Proposal card | `proposal-card` |
| Filter controls | `filter-*` |

## Priority Recommendations

### Immediate Actions

1. **Install Playwright**: `bun add -D @playwright/test`
2. **Create `e2e/` directory structure** as outlined above
3. **Add `data-testid` attributes** to critical components
4. **Start with SearchPage and ListingPage** - highest user traffic

### Short-term (1-2 weeks)

1. Complete page objects for all Priority 1 pages
2. Add authentication helper for protected pages
3. Create reusable auth state for faster tests
4. Implement component page objects (DateRangePicker, ScheduleSelector)

### Medium-term (1 month)

1. Full E2E coverage for critical booking flow
2. Visual regression testing with Playwright screenshots
3. CI integration with test sharding
4. Accessibility testing integration

## Related Audit Reports

- `audit-vitest-rtl-setup.md` - Frontend unit testing infrastructure
- `audit-reusable-auth-state.md` - Auth state for E2E tests
- `audit-test-sharding-ci.md` - CI parallel execution
- `audit-async-loading-states.md` - Loading state testing patterns

---

**Conclusion:** This codebase has **zero E2E test infrastructure**. The Page Object Model pattern cannot be evaluated because there are no E2E tests to refactor. The priority should be establishing Playwright E2E testing infrastructure from scratch, following the POM pattern from the start to avoid future refactoring.
