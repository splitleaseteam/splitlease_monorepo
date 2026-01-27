# Page Object Model Opportunity Report
**Generated:** 2026-01-26 10:31:12
**Codebase:** Split Lease
**Hostname:** splitlease

## Executive Summary
- E2E test files found: **0**
- Test files needing POM refactoring: **0** (no E2E tests exist)
- Duplicate selectors found: **N/A** (no E2E tests)
- Pages needing page objects: **27** (based on HTML entry points)

### Key Finding: No E2E Test Infrastructure Exists

The Split Lease codebase **does not currently have any End-to-End (E2E) tests implemented**. While Playwright is installed as a dependency (`playwright@1.57.0`), no actual E2E tests, page objects, or Playwright configuration files exist. This represents a significant **greenfield opportunity** to establish E2E testing with the Page Object Model pattern from the ground up.

---

## Infrastructure Check

### POM Setup Status
- [ ] `e2e/` directory exists - **MISSING**
- [ ] `playwright.config.ts` exists - **MISSING**
- [ ] `e2e/pages/` directory exists - **MISSING**
- [ ] `BasePage.ts` base class exists - **MISSING**
- [ ] Page object fixtures exist - **MISSING**
- [ ] Component page objects exist - **MISSING**

### Current Test Infrastructure

| Type | Location | Framework | Status | File Count |
|------|----------|-----------|--------|------------|
| Playwright Dependency | `package.json` | Playwright 1.57.0 | Installed | N/A |
| Playwright Config | N/A | N/A | **Missing** | 0 |
| E2E Tests | N/A | N/A | **Missing** | 0 |
| Unit Tests | `app/src/logic/calculators/matching/__tests__/` | Vitest/Jest | Active | 1 |
| Edge Function Tests | `supabase/functions/tests/` | Deno | Scaffolded | 2 helpers |
| Test Helpers | `supabase/functions/tests/helpers/` | Deno | Active | 2 |

### Existing Test Files

| File | Location | Purpose |
|------|----------|---------|
| `calculateMatchScore.test.js` | `app/src/logic/calculators/matching/__tests__/` | Unit test for match scoring |
| `assertions.ts` | `supabase/functions/tests/helpers/` | Custom Result type assertions |
| `fixtures.ts` | `supabase/functions/tests/helpers/` | Test fixtures for Edge Functions |
| `errors_test.ts` | `supabase/functions/_shared/` | Error handling tests |
| `validation_test.ts` | `supabase/functions/_shared/` | Validation utility tests |

### Git Branches with Test Infrastructure

| Branch | Status | Notes |
|--------|--------|-------|
| `remotes/origin/playwright-tests` | Exists | Contains Playwright skill documentation only, no actual tests |
| `remotes/origin/routing-test` | Exists | Unknown content |
| `remotes/origin/test-lint` | Exists | Unknown content |

---

## Current Page Objects

**None exist.** This is a greenfield opportunity.

---

## Critical Gaps (No Tests to Audit)

Since no E2E tests exist, there are no scattered selectors to report. However, the absence of E2E testing infrastructure is itself a critical gap.

### What's Missing

1. **No `playwright.config.ts`** - Cannot run Playwright tests
2. **No `e2e/` directory** - No test organization structure
3. **No page objects** - When tests are created, they'll need POM from day one
4. **No test fixtures** - No dependency injection for page objects
5. **No auth state handling** - No reusable login state (see Playwright login skill for guidance)

---

## Pages Needing Page Objects

Based on analysis of `app/public/*.html` (27 HTML entry points) and `app/src/islands/pages/`:

### Priority 1: Core User Journeys (Must Have)

| Page | HTML File | React Component | Suggested PO Class |
|------|-----------|-----------------|-------------------|
| Home | `index.html` | `HomePage` | `HomePage.ts` |
| Search | `search.html` | `SearchPage` | `SearchPage.ts` |
| Listing Details | `view-split-lease.html` | `ViewSplitLeasePage` | `ListingPage.ts` |
| Login/Signup | Modal-based | `SignUpLoginModal.jsx` | `AuthModal.ts` |

### Priority 2: Booking Flow (Critical Path)

| Page | HTML File | React Component | Suggested PO Class |
|------|-----------|-----------------|-------------------|
| Guest Proposals | `guest-proposals.html` | `GuestProposalsPage` | `GuestProposalsPage.ts` |
| Host Proposals | `host-proposals.html` | `HostProposalsPage` | `HostProposalsPage.ts` |
| Preview Listing | `preview-split-lease.html` | `PreviewSplitLeasePage` | `PreviewListingPage.ts` |

### Priority 3: Host Features

| Page | HTML File | React Component | Suggested PO Class |
|------|-----------|-----------------|-------------------|
| Self Listing | `self-listing.html` | `SelfListingPage` | `SelfListingPage.ts` |
| Self Listing V2 | `self-listing-v2.html` | `SelfListingPageV2` | `SelfListingPageV2.ts` |
| Listing Dashboard | `listing-dashboard.html` | `ListingDashboardPage` | `ListingDashboardPage.ts` |
| Host Overview | `host-overview.html` | `HostOverviewPage` | `HostOverviewPage.ts` |

### Priority 4: Guest Features

| Page | HTML File | React Component | Suggested PO Class |
|------|-----------|-----------------|-------------------|
| Favorite Listings | `favorite-listings.html` | `FavoriteListingsPage` | `FavoritesPage.ts` |
| Rental Application | `rental-application.html` | `RentalApplicationPage` | `RentalApplicationPage.ts` |
| Account Profile | `account-profile.html` | `AccountProfilePage` | `ProfilePage.ts` |

### Priority 5: Supporting Pages

| Page | HTML File | React Component | Suggested PO Class |
|------|-----------|-----------------|-------------------|
| FAQ | `faq.html` | `FAQPage` | `FAQPage.ts` |
| Help Center | `help-center.html` | `HelpCenterPage` | `HelpCenterPage.ts` |
| Help Category | `help-center-category.html` | `HelpCenterCategoryPage` | `HelpCategoryPage.ts` |
| Policies | `policies.html` | `PoliciesPage` | `PoliciesPage.ts` |
| Reset Password | `reset-password.html` | `ResetPasswordPage` | `ResetPasswordPage.ts` |
| About Us | `about-us.html` | `AboutUsPage` | `AboutUsPage.ts` |
| Careers | `careers.html` | `CareersPage` | `CareersPage.ts` |
| List With Us | `list-with-us.html` | `ListWithUsPage` | `ListWithUsPage.ts` |
| Why Split Lease | `why-split-lease.html` | `WhySplitLeasePage` | `WhySplitLeasePage.ts` |
| 404 | `404.html` | `NotFoundPage` | `NotFoundPage.ts` |

---

## Common Components Needing Page Objects

### 1. Navigation / Header
- **Location:** Present on all pages via shared island
- **Key Elements:**
  - Logo (links to home)
  - Search input (quick search)
  - Sign In / Sign Up buttons (logged out)
  - Username / Profile pic (logged in)
  - "Stay with Us" or "Host with Us" toggle

```typescript
// e2e/components/Navbar.ts
export class Navbar {
  constructor(private page: Page) {}

  readonly container = this.page.getByRole('navigation')
  readonly logo = this.page.getByRole('link', { name: /split lease/i })
  readonly signInButton = this.page.getByRole('button', { name: /sign in/i })
  readonly signUpButton = this.page.getByRole('button', { name: /sign up/i })
  readonly userMenu = this.page.locator('[data-testid="user-menu"]')

  async isLoggedIn(): Promise<boolean> {
    return await this.signInButton.isHidden()
  }
}
```

### 2. SignUpLoginModal
- **File:** `app/src/islands/shared/SignUpLoginModal.jsx`
- **Used in:** Authentication flow from any page
- **Key Elements:**
  - Email input
  - Password input
  - Sign In / Sign Up tabs
  - Submit button
  - Error messages

```typescript
// e2e/components/AuthModal.ts
export class AuthModal {
  constructor(private page: Page) {}

  readonly modal = this.page.getByRole('dialog')
  readonly emailInput = this.modal.getByLabel(/email/i)
  readonly passwordInput = this.modal.getByLabel(/password/i)
  readonly signInTab = this.modal.getByRole('tab', { name: /sign in/i })
  readonly signUpTab = this.modal.getByRole('tab', { name: /sign up/i })
  readonly submitButton = this.modal.getByRole('button', { name: /submit|sign in|sign up/i })

  async login(email: string, password: string) {
    await this.signInTab.click()
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### 3. Date Range Picker
- **Used on:** Search, Listing, Proposal pages
- **Key Elements:**
  - Check-in date input
  - Check-out date input
  - Calendar grid
  - Day selection

```typescript
// e2e/components/DateRangePicker.ts
export class DateRangePicker {
  constructor(private container: Locator) {}

  readonly checkInInput = this.container.getByLabel(/check-?in/i)
  readonly checkOutInput = this.container.getByLabel(/check-?out/i)
  readonly calendar = this.container.locator('[role="application"], [data-testid="calendar"]')

  async selectDateRange(startDate: Date, endDate: Date) {
    // Implementation with calendar interaction
  }
}
```

### 4. Listing Card
- **Used on:** Search results, Favorites, Host dashboard
- **Key Elements:**
  - Image
  - Title
  - Price
  - Location
  - View/Book button
  - Favorite toggle

```typescript
// e2e/components/ListingCard.ts
export class ListingCard {
  constructor(private container: Locator) {}

  readonly image = this.container.locator('img').first()
  readonly title = this.container.getByRole('heading')
  readonly price = this.container.locator('[data-testid="price"], .price')
  readonly location = this.container.locator('[data-testid="location"], .location')
  readonly viewButton = this.container.getByRole('link', { name: /view|details/i })
  readonly favoriteButton = this.container.getByRole('button', { name: /favorite/i })
}
```

### 5. Proposal Card / Guest Editing Modal
- **Files:** `GuestEditingProposalModal.css` suggests existing modal
- **Used on:** Guest Proposals, Host Proposals pages
- **Key Elements:**
  - Proposal details
  - Status badge
  - Accept/Reject buttons
  - Edit modal

---

## Recommended File Structure

```
e2e/
├── playwright.config.ts           # Playwright configuration
├── fixtures/
│   ├── index.ts                   # Main fixture exports
│   ├── pages.ts                   # Page object fixtures
│   └── auth.ts                    # Authentication state fixtures
├── pages/
│   ├── BasePage.ts                # Common page functionality
│   ├── HomePage.ts
│   ├── SearchPage.ts
│   ├── ListingPage.ts
│   ├── GuestProposalsPage.ts
│   ├── HostProposalsPage.ts
│   ├── SelfListingPage.ts
│   ├── ListingDashboardPage.ts
│   └── ProfilePage.ts
├── components/
│   ├── Navbar.ts
│   ├── AuthModal.ts
│   ├── DateRangePicker.ts
│   ├── ListingCard.ts
│   ├── ProposalCard.ts
│   └── SearchFilters.ts
├── support/
│   ├── test-data.ts               # Test data factories
│   └── api-helpers.ts             # Direct API calls for setup
└── tests/
    ├── auth/
    │   ├── login.spec.ts
    │   ├── signup.spec.ts
    │   └── logout.spec.ts
    ├── search/
    │   ├── basic-search.spec.ts
    │   └── filters.spec.ts
    ├── booking/
    │   ├── create-proposal.spec.ts
    │   └── manage-proposals.spec.ts
    └── host/
        ├── create-listing.spec.ts
        └── manage-listings.spec.ts
```

---

## Suggested Base Page Implementation

```typescript
// e2e/pages/BasePage.ts
import { type Page, type Locator, expect } from '@playwright/test'
import { Navbar } from '../components/Navbar'

export abstract class BasePage {
  readonly navbar: Navbar

  constructor(protected readonly page: Page) {
    this.navbar = new Navbar(page)
  }

  // Common selectors (Islands Architecture pattern)
  get root() { return this.page.locator('#root') }
  get loadingSpinner() { return this.page.getByTestId('loading-spinner') }
  get toast() { return this.page.locator('[role="alert"]') }
  get errorMessage() { return this.page.locator('[data-testid="error-message"]') }

  // Common actions
  async waitForPageLoad() {
    // Islands Architecture: wait for React to mount
    await this.page.waitForLoadState('networkidle')
    await this.root.waitFor({ state: 'visible' })
  }

  async waitForLoadingComplete() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 })
  }

  async expectToastMessage(message: string | RegExp) {
    await expect(this.toast).toContainText(message)
  }

  async expectNoErrors() {
    await expect(this.errorMessage).toBeHidden()
  }
}
```

---

## Suggested Fixture Implementation

```typescript
// e2e/fixtures/pages.ts
import { test as base } from '@playwright/test'
import { HomePage } from '../pages/HomePage'
import { SearchPage } from '../pages/SearchPage'
import { ListingPage } from '../pages/ListingPage'
import { GuestProposalsPage } from '../pages/GuestProposalsPage'
import { HostProposalsPage } from '../pages/HostProposalsPage'

type Pages = {
  homePage: HomePage
  searchPage: SearchPage
  listingPage: ListingPage
  guestProposalsPage: GuestProposalsPage
  hostProposalsPage: HostProposalsPage
}

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page))
  },
  listingPage: async ({ page }, use) => {
    await use(new ListingPage(page))
  },
  guestProposalsPage: async ({ page }, use) => {
    await use(new GuestProposalsPage(page))
  },
  hostProposalsPage: async ({ page }, use) => {
    await use(new HostProposalsPage(page))
  },
})

export { expect } from '@playwright/test'
```

---

## Authentication Considerations

Based on the existing `playwrightTestGuideLoginInstructions` skill:

### Test Credentials (from environment variables)
- Host Email: `process.env.TESTHOSTEMAILADDRESS`
- Guest Email: `process.env.TESTGUESTEMAILADDRESS`
- Password: `process.env.TESTPASSWORD`

### Login State Detection
- **Logged Out:** "Sign In" and "Sign Up" buttons visible
- **Logged In:** Username and profile picture visible
- **Host Account:** "Host with Us" navigation option visible
- **Guest Account:** "Stay with Us" navigation option visible

### Reusable Auth State (Recommended)
```typescript
// e2e/fixtures/auth.ts
import { test as base, type BrowserContext } from '@playwright/test'

export const test = base.extend<{
  authenticatedContext: BrowserContext
}>({
  authenticatedContext: async ({ browser }, use) => {
    // Load saved auth state
    const context = await browser.newContext({
      storageState: '.auth/guest.json'
    })
    await use(context)
    await context.close()
  }
})
```

---

## Test Files with Good POM Usage (Reference)

**None exist yet.** The following existing patterns can serve as reference:

1. **Unit test pattern:** `app/src/logic/calculators/matching/__tests__/calculateMatchScore.test.js`
2. **Assertion helpers:** `supabase/functions/tests/helpers/assertions.ts`
3. **Fixture pattern:** `supabase/functions/tests/helpers/fixtures.ts`

---

## Benefits of Implementing POM Now

| Benefit | Without POM | With POM |
|---------|-------------|----------|
| Selector changes | Update every test file | Update one page object |
| Test readability | `page.locator('.btn-xyz')` | `listingPage.bookButton` |
| Code reuse | Copy-paste selectors | Import page objects |
| Onboarding | Learn all selectors | Learn page object API |
| Maintenance | O(n) where n = test files | O(1) per UI change |
| Islands Architecture | Manual root waiting | Built into BasePage |

---

## Recommended Implementation Phases

### Phase 1: Infrastructure Setup (Estimated: 1-2 days)
1. Create `playwright.config.ts` with:
   - Base URL configuration
   - Test directory pointing to `e2e/tests/`
   - Screenshot/video on failure
   - Retry configuration
2. Set up `e2e/` directory structure
3. Implement `BasePage.ts` with Islands Architecture support
4. Create fixture file with page object DI
5. Set up auth state persistence

### Phase 2: Core Page Objects (Estimated: 2-3 days)
1. `HomePage.ts` - Landing page
2. `SearchPage.ts` - Search and results
3. `ListingPage.ts` - Listing details
4. `AuthModal.ts` - Login/signup modal

### Phase 3: Component Page Objects (Estimated: 1-2 days)
1. `Navbar.ts` - Navigation
2. `DateRangePicker.ts` - Date selection
3. `ListingCard.ts` - Result cards
4. `SearchFilters.ts` - Filter controls

### Phase 4: First E2E Tests (Estimated: 2-3 days)
1. `auth.spec.ts` - Login/logout flows
2. `search.spec.ts` - Search functionality
3. `smoke.spec.ts` - Critical path validation

---

## Action Items

| Priority | Action | Estimated Effort |
|----------|--------|------------------|
| P0 | Create `playwright.config.ts` | 30 min |
| P0 | Create `e2e/` directory structure | 15 min |
| P0 | Implement `BasePage.ts` | 1 hour |
| P1 | Create page fixtures | 1 hour |
| P1 | Implement `HomePage.ts` | 2 hours |
| P1 | Implement `SearchPage.ts` | 2 hours |
| P1 | Implement `AuthModal.ts` | 1 hour |
| P2 | Write first smoke test | 2 hours |
| P2 | Set up CI integration | 2 hours |

---

## References

- **Playwright POM Documentation:** https://playwright.dev/docs/pom
- **Existing Playwright Skill:** `.claude/skills/playwrightTestGuideLoginInstructions/SKILL.md`
- **E2E Test Runner Command:** `.claude/commands/commands/test_e2e.md`
- **Previous Audit (260125):** `.claude/plans/Opportunities/260125/20260125103130-audit-page-object-model.md`
- **Edge Function Test Helpers:** `supabase/functions/tests/helpers/`

---

## Conclusion

The Split Lease codebase has **zero E2E tests** despite having Playwright installed. This is a greenfield opportunity to establish proper testing infrastructure with the Page Object Model pattern from the start. Given the 27 page entry points and complex user flows (search, booking, proposals), E2E testing should be a priority to prevent UI regressions.

**Recommendation:** Begin with Phase 1 infrastructure setup, then incrementally add page objects and tests following the priority order above. Start with the critical booking flow (Search -> Listing -> Proposal) as this represents the core business value.
