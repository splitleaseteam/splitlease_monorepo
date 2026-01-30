---
name: audit-page-object-model
description: Audit the codebase to find E2E tests with scattered selectors that would benefit from Page Object Model pattern. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Page Object Model Audit

You are conducting a comprehensive audit to identify E2E tests that have scattered selectors and would benefit from implementing the Page Object Model (POM) pattern for better maintainability.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **E2E test files** - Look for:
   - `*.spec.ts` files in `e2e/` or `tests/` directories
   - Files importing `@playwright/test`
   - Test files with `test.describe()` blocks

2. **Scattered selectors in tests** - Look for:
   - `page.locator('.class-name')` directly in tests
   - `page.getByRole()`, `page.getByTestId()` repeated across files
   - Same selector used in multiple test files
   - CSS/XPath selectors in test files

3. **Missing page objects** - Check if `e2e/pages/` exists with:
   - `BasePage.ts`
   - Page-specific classes (LoginPage, SearchPage, etc.)
   - Component page objects

4. **Existing page objects** - If they exist, check:
   - Are all pages covered?
   - Are common components extracted?
   - Do tests actually use them?

5. **Multi-step flows without abstraction** - Look for:
   - Login sequences repeated in multiple tests
   - Checkout flows with inline selectors
   - Search/filter operations duplicated

### What to Check for Each Test File

For each E2E test file, check:
- Does it import from page object classes?
- Are selectors defined inline or from page objects?
- Are common actions (login, navigation) abstracted?
- Would UI changes require updates in multiple files?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-page-object-model.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Page Object Model Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- E2E test files found: X
- Test files needing POM refactoring: X
- Duplicate selectors found: X
- Pages needing page objects: X

## Infrastructure Check

### POM Setup Status
- [ ] `e2e/pages/` directory exists
- [ ] `BasePage.ts` base class exists
- [ ] Page object fixtures exist
- [ ] Component page objects exist

### Current Page Objects (if any)
| Page Object | File | Used in Tests |
|-------------|------|---------------|
| LoginPage | e2e/pages/LoginPage.ts | Yes/No |
| ... | ... | ... |

## Critical Gaps (Scattered Selectors)

### Test File: [filename.spec.ts]
- **File:** `e2e/tests/filename.spec.ts`
- **Lines with Inline Selectors:**
  - Line X: `page.locator('.btn-primary')`
  - Line Y: `page.getByTestId('submit-form')`
  - Line Z: `page.getByRole('button', { name: /book/i })`
- **Duplicate Selectors:** Same selector used X times
- **Recommendation:** Create [PageName]Page object

### Selector Duplication Map

| Selector | Files Using It | Occurrences |
|----------|----------------|-------------|
| `page.locator('.btn-primary')` | test1.spec.ts, test2.spec.ts | 5 |
| `page.getByTestId('listing-card')` | search.spec.ts, home.spec.ts | 8 |

## Pages Needing Page Objects

### 1. Listing Page
- **Tests referencing this page:**
  - `booking-flow.spec.ts` (lines 10-45)
  - `listing-details.spec.ts` (lines 5-80)
- **Common Selectors Found:**
  ```typescript
  page.getByRole('heading', { level: 1 })  // title
  page.getByTestId('listing-price')        // price
  page.getByRole('button', { name: /book/i }) // book button
  ```
- **Suggested Page Object:**
  ```typescript
  class ListingPage extends BasePage {
    readonly title = page.getByRole('heading', { level: 1 })
    readonly price = page.getByTestId('listing-price')
    readonly bookButton = page.getByRole('button', { name: /book/i })
  }
  ```

### 2. [Page Name]
- **Tests referencing this page:** ...
- **Common Selectors Found:** ...

## Common Actions to Abstract

### Login Flow
- **Found in:** auth.spec.ts, booking.spec.ts, profile.spec.ts
- **Current Pattern:**
  ```typescript
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('test@test.com')
  await page.getByLabel(/password/i).fill('password')
  await page.getByRole('button', { name: /sign in/i }).click()
  ```
- **Recommendation:** `loginPage.loginAndWait(email, password)`

### [Action Name]
- **Found in:** ...
- **Recommendation:** ...

## Component Page Objects Needed

### 1. Date Range Picker
- **Used on pages:** Listing, Search, Booking
- **Selectors:**
  ```typescript
  page.getByLabel(/check-in/i)
  page.getByLabel(/check-out/i)
  page.getByRole('application', { name: /calendar/i })
  ```

### 2. [Component Name]
- **Used on pages:** ...

## Test Files with Good POM Usage (Reference)

List test files that already properly use page objects as examples.

## Recommended File Structure

```
e2e/
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

```

---

## Reference: Page Object Model Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### When to Recommend POM

- Setting up new E2E test architecture
- Refactoring brittle tests with scattered selectors
- Testing complex multi-step flows
- Reducing test maintenance when UI changes

### Core POM Benefit

```
WITHOUT POM:
test1.spec.ts: page.locator('.btn-primary').click()
test2.spec.ts: page.locator('.btn-primary').click()
→ UI changes = Update 50+ files

WITH POM:
ListingPage.ts: bookButton = getByRole('button', ...)
test1.spec.ts: listingPage.clickBook()
→ UI changes = Update 1 file
```

### Pattern 1: Base Page Class

```typescript
export abstract class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get navbar() { return this.page.getByRole('navigation') }
  get loadingSpinner() { return this.page.getByTestId('loading-spinner') }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }
}
```

### Pattern 2: Page-Specific Class

```typescript
export class ListingPage extends BasePage {
  readonly title: Locator
  readonly bookButton: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole('heading', { level: 1 })
    this.bookButton = page.getByRole('button', { name: /book/i })
  }

  async goto(listingId: string) {
    await this.page.goto(`/listings/${listingId}`)
  }

  async clickBook() {
    await this.bookButton.click()
    await this.page.waitForURL(/\/checkout/)
  }
}
```

### Pattern 3: Component Page Object

```typescript
export class DateRangePicker {
  readonly container: Locator

  constructor(page: Page) {
    this.container = page.locator('[data-testid="date-picker"]')
  }

  async selectRange(start: Date, end: Date) {
    // Encapsulated date selection logic
  }
}
```

### Pattern 4: Page Object Fixture

```typescript
export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  listingPage: async ({ page }, use) => {
    await use(new ListingPage(page))
  },
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `page.locator('.btn')` in test files | Define in page object |
| Same selector in multiple files | Single source in page object |
| Login code repeated in tests | `loginPage.login()` method |
| Inline wait logic | `page.waitForPageLoad()` method |
| Giant page objects | Split into component POs |

## Output Requirements

1. Be thorough - review EVERY E2E test file
2. Be specific - include exact file paths and line numbers for scattered selectors
3. Be actionable - provide code templates for recommended page objects
4. Only report gaps - do not list tests that already use POM properly unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-page-object-model.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
