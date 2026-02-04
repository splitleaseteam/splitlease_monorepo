# Page Object Model Opportunity Report
**Generated:** 2026-01-29T10:31:12Z
**Codebase:** Split Lease

## Executive Summary
- E2E test files found: 1 (primary spec file) + 2 visual validation scripts
- Test files needing POM refactoring: 3
- Duplicate selectors found: 15+ unique selectors with multiple usages
- Pages needing page objects: 4 (ZScheduleTestPage, Admin Pages, Login flows)

## Infrastructure Check

### POM Setup Status
- [ ] `e2e/pages/` directory exists - **MISSING**
- [ ] `BasePage.ts` base class exists - **MISSING**
- [ ] Page object fixtures exist - **MISSING**
- [ ] Component page objects exist - **MISSING**

### Current Page Objects (if any)
| Page Object | File | Used in Tests |
|-------------|------|---------------|
| None | N/A | N/A |

**CRITICAL GAP: No Page Object Model infrastructure exists in this codebase.**

## Critical Gaps (Scattered Selectors)

### Test File: schedule-selector-comparison.spec.ts
- **File:** `tests/schedule-selector-comparison.spec.ts`
- **Lines with Inline Selectors:**
  - Line 99: `page.locator(\`button:has-text("${getScenarioButtonText(scenarioId)}")\`)`
  - Line 139: `page.locator(selector).first()` (with multiple selector strategies)
  - Line 177: `page.locator('.svm-summary')`
  - Line 198: `page.locator('.svm-badge').first()`
  - Line 213: `page.locator('.selection-info, .info-row')`
  - Line 241: `page.locator('.zst-card:has-text("Listing Selector Output")')`
  - Line 271: `page.locator(selector).first()` (error selectors)
  - Line 281: `page.locator('text=Days must be consecutive')`
  - Line 292: `page.locator('.schedule-validation-matrix')`
  - Line 304: `page.locator('.svm-summary')`
  - Line 318: `page.locator('.svm-table tbody tr')`
  - Line 349: `page.locator(selector).first()` (validation selectors)
  - Line 902: `page.locator('.day-button')`
  - Line 909: `page.locator('button[aria-label^="Monday"]')`
  - Line 929: `page.locator('.schedule-validation-matrix')`
  - Line 933: `page.locator('.svm-badge')`
- **Duplicate Selectors:**
  - `.svm-summary` - used 2 times
  - `.svm-badge` - used 2 times
  - `.schedule-validation-matrix` - used 2 times
- **Recommendation:** Create `ZScheduleTestPage` and `ScheduleValidationMatrixComponent` page objects

### Script File: visual-validation-playwright.ts
- **File:** `scripts/visual-validation-playwright.ts`
- **Inline Patterns:**
  - Uses raw URL navigation without page objects
  - No selector abstraction for page elements
  - Hardcoded URL patterns for 12 admin pages
- **Recommendation:** Create `AdminBasePage` and per-admin page objects

### Script File: visual-validation.js
- **File:** `scripts/visual-validation.js`
- **Inline Patterns:**
  - Same issues as TypeScript version
  - No abstraction layer
- **Recommendation:** Consolidate with TypeScript version using POM

## Selector Duplication Map

| Selector | Files Using It | Occurrences |
|----------|----------------|-------------|
| `.svm-summary` | schedule-selector-comparison.spec.ts | 2 |
| `.svm-badge` | schedule-selector-comparison.spec.ts | 2 |
| `.schedule-validation-matrix` | schedule-selector-comparison.spec.ts | 2 |
| `.svm-table tbody tr` | schedule-selector-comparison.spec.ts | 1 |
| `.day-button` | schedule-selector-comparison.spec.ts | 1 |
| `button[aria-label^="Monday"]` | schedule-selector-comparison.spec.ts | 1 |
| `.selection-info, .info-row` | schedule-selector-comparison.spec.ts | 1 |
| `.zst-card:has-text(...)` | schedule-selector-comparison.spec.ts | 1 |
| `text=Days must be consecutive` | schedule-selector-comparison.spec.ts | 1 |

## Pages Needing Page Objects

### 1. Z Schedule Test Page
- **Tests referencing this page:**
  - `schedule-selector-comparison.spec.ts` (lines 97-156, 608-652, 897-936)
- **Common Selectors Found:**
  ```typescript
  // Scenario buttons
  page.locator(`button:has-text("Normal 5-Night")`)
  page.locator(`button:has-text("Wrap-Around")`)
  page.locator(`button:has-text("Full Week")`)

  // Day selection
  page.locator('.day-button')
  page.locator('button[aria-label^="Monday"]')
  page.locator('button[aria-label^="Tuesday"]')
  // etc.

  // Validation matrix
  page.locator('.schedule-validation-matrix')
  page.locator('.svm-summary')
  page.locator('.svm-badge')
  page.locator('.svm-table tbody tr')

  // Info display
  page.locator('.selection-info, .info-row')
  page.locator('.zst-card:has-text("Listing Selector Output")')
  ```
- **Suggested Page Object:**
  ```typescript
  class ZScheduleTestPage extends BasePage {
    // Navigation
    readonly url = '/_internal/z-schedule-test'

    // Scenario buttons
    readonly normalFiveNightButton: Locator
    readonly wrapAroundButton: Locator
    readonly fullWeekButton: Locator
    readonly gapSelectionButton: Locator
    readonly belowMinButton: Locator

    // Day buttons
    readonly dayButtons: Locator
    getDayButton(dayName: string): Locator

    // Validation matrix
    readonly validationMatrix: Locator
    readonly matrixSummary: Locator
    readonly matrixBadge: Locator
    readonly matrixRows: Locator

    // Info display
    readonly selectionInfo: Locator
    readonly listingSelectorOutputCard: Locator

    // Actions
    async loadScenario(scenarioId: string): Promise<void>
    async selectDays(dayNames: string[]): Promise<void>
    async getValidationResults(): Promise<ValidationResults>
  }
  ```

### 2. Admin Pages (12 total)
- **Tests referencing these pages:**
  - `scripts/visual-validation-playwright.ts` (lines 43-116)
  - `scripts/visual-validation.js` (lines 5-18)
- **Pages:**
  1. Verify Users (`/_internal/verify-users`)
  2. Proposal Management (`/_internal/proposal-manage`)
  3. Virtual Meetings (`/_internal/manage-virtual-meetings`)
  4. Message Curation (`/_internal/message-curation`)
  5. Co-Host Requests (`/_internal/co-host-requests`)
  6. Internal Emergency (`/_internal/emergency`)
  7. Leases Overview (`/_internal/leases-overview`)
  8. Admin Threads (`/_internal/admin-threads`)
  9. Modify Listings (`/_internal/modify-listings`)
  10. Rental Applications (`/_internal/manage-rental-applications`)
  11. Quick Price (`/_internal/quick-price`)
  12. Magic Login Links (`/_internal/send-magic-login-links`)
- **Suggested Base Page Object:**
  ```typescript
  abstract class AdminBasePage extends BasePage {
    readonly adminNavigation: Locator
    readonly pageTitle: Locator
    readonly loadingSpinner: Locator

    abstract readonly url: string

    async goto(): Promise<void> {
      await this.page.goto(this.url)
      await this.waitForPageLoad()
    }
  }
  ```

### 3. Bubble Production Pages (External)
- **Tests referencing these pages:**
  - `schedule-selector-comparison.spec.ts` (lines 697-793)
- **URLs:** `https://app.split.lease/version-test/*`
- **Selectors Found:**
  ```typescript
  // Login detection
  page.locator('input[type="password"], [class*="login"]')

  // Day buttons (assumed same structure)
  // Would need investigation of actual Bubble DOM
  ```
- **Recommendation:** Create `BubblePage` base for external site interaction

## Common Actions to Abstract

### Login Flow (Bubble)
- **Found in:** `schedule-selector-comparison.spec.ts` (lines 700-726)
- **Current Pattern:**
  ```typescript
  const isLoginPage = await bubblePage.locator('input[type="password"], [class*="login"]')
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  ```
- **Recommendation:** Create `BubbleLoginPage.loginIfRequired(credentials)`

### Day Selection
- **Found in:** `schedule-selector-comparison.spec.ts` (lines 123-156)
- **Current Pattern:**
  ```typescript
  async function selectDaysManually(page: Page, dayNames: string[]): Promise<void> {
    for (const dayName of dayNames) {
      const selectors = [
        `button[aria-label^="${dayName}"]`,
        `button[title="${dayName}"]`,
        `.day-button:has-text("${dayName.charAt(0)}")`,
        `button:has-text("${dayName}")`
      ];
      // ... iteration logic
    }
  }
  ```
- **Recommendation:** `schedulePage.selectDays(['Monday', 'Tuesday', 'Wednesday'])`

### Validation Result Capture
- **Found in:** `schedule-selector-comparison.spec.ts` (lines 161-360)
- **Current Pattern:** 170+ lines of inline selector logic
- **Recommendation:** `schedulePage.getValidationResults()` returning typed `ValidationResults`

### Screenshot Capture
- **Found in:** Both visual-validation scripts
- **Current Pattern:**
  ```typescript
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    type: 'png',
  });
  ```
- **Recommendation:** `basePage.captureFullPageScreenshot(name)` with automatic naming

## Component Page Objects Needed

### 1. Schedule Validation Matrix
- **Used on pages:** ZScheduleTestPage
- **Selectors:**
  ```typescript
  '.schedule-validation-matrix'  // Container
  '.svm-summary'                 // Summary section
  '.svm-badge'                   // Status badge
  '.svm-table tbody tr'          // Result rows
  '.svm-source'                  // Source column
  '.svm-icon'                    // Pass/fail icon
  '.svm-warning'                 // Warning messages
  ```
- **Suggested Component:**
  ```typescript
  class ScheduleValidationMatrix {
    readonly container: Locator
    readonly summary: Locator
    readonly badge: Locator
    readonly rows: Locator

    constructor(page: Page) {
      this.container = page.locator('.schedule-validation-matrix')
      this.summary = this.container.locator('.svm-summary')
      this.badge = this.container.locator('.svm-badge')
      this.rows = this.container.locator('.svm-table tbody tr')
    }

    async getNightsCount(): Promise<number | null>
    async getRecommendation(): Promise<'APPROVE' | 'REJECT' | null>
    async getAllValidatorResults(): Promise<ValidatorResult[]>
    async doValidatorsAgree(): Promise<boolean>
  }
  ```

### 2. Day Button Group
- **Used on pages:** ZScheduleTestPage, potentially listing pages
- **Selectors:**
  ```typescript
  '.day-button'
  'button[aria-label^="Monday"]'  // Pattern for each day
  'button[aria-pressed="true"]'   // Selected state
  ```
- **Suggested Component:**
  ```typescript
  class DayButtonGroup {
    readonly container: Locator
    readonly buttons: Locator

    constructor(page: Page) {
      this.container = page.locator('.day-selector, .schedule-selector')
      this.buttons = this.container.locator('.day-button')
    }

    getDay(name: string): Locator
    async selectDay(name: string): Promise<void>
    async deselectDay(name: string): Promise<void>
    async getSelectedDays(): Promise<string[]>
    async selectMultipleDays(names: string[]): Promise<void>
  }
  ```

### 3. Error Message Display
- **Used on pages:** Multiple (validation, forms)
- **Selectors:**
  ```typescript
  '.error-message'
  '.info-value.error'
  '[class*="error"]'
  'text=Days must be consecutive'
  ```
- **Suggested Component:**
  ```typescript
  class ErrorDisplay {
    readonly page: Page

    async getVisibleError(): Promise<string | null>
    async hasError(): Promise<boolean>
    async waitForError(expectedText?: string): Promise<void>
  }
  ```

## Test Files with Good POM Usage (Reference)

**None found.** This codebase does not currently have any tests implementing the Page Object Model pattern.

## Recommended File Structure

```
e2e/
├── fixtures/
│   └── pages.ts                    # Page object fixtures for Playwright
├── pages/
│   ├── BasePage.ts                 # Common functionality (navigation, waits)
│   ├── admin/
│   │   ├── AdminBasePage.ts        # Shared admin page functionality
│   │   ├── VerifyUsersPage.ts
│   │   ├── ProposalManagementPage.ts
│   │   ├── VirtualMeetingsPage.ts
│   │   ├── MessageCurationPage.ts
│   │   ├── CoHostRequestsPage.ts
│   │   ├── InternalEmergencyPage.ts
│   │   ├── LeasesOverviewPage.ts
│   │   ├── AdminThreadsPage.ts
│   │   ├── ModifyListingsPage.ts
│   │   ├── RentalApplicationsPage.ts
│   │   ├── QuickPricePage.ts
│   │   └── MagicLoginLinksPage.ts
│   ├── ZScheduleTestPage.ts        # Schedule testing page
│   └── external/
│       └── BubblePage.ts           # External Bubble.io interactions
├── components/
│   ├── ScheduleValidationMatrix.ts # Validation matrix component
│   ├── DayButtonGroup.ts           # Day selection component
│   └── ErrorDisplay.ts             # Error message component
└── tests/
    ├── schedule-selector.spec.ts   # Refactored to use page objects
    └── admin/
        └── visual-validation.spec.ts # Consolidated visual tests
```

## Migration Priority

| Priority | File | Effort | Impact |
|----------|------|--------|--------|
| **HIGH** | schedule-selector-comparison.spec.ts | Medium | Test has 15+ inline selectors, frequent changes likely |
| **MEDIUM** | visual-validation-playwright.ts | Low | Simple screenshot capture, less selector complexity |
| **LOW** | visual-validation.js | Low | Duplicate of TS version, consider removal |

## Implementation Roadmap

### Phase 1: Foundation (Estimated: 2-4 hours)
1. Create `e2e/` directory structure
2. Implement `BasePage.ts` with common utilities
3. Set up Playwright fixtures in `fixtures/pages.ts`

### Phase 2: Component Objects (Estimated: 2-3 hours)
1. Create `ScheduleValidationMatrix.ts`
2. Create `DayButtonGroup.ts`
3. Create `ErrorDisplay.ts`

### Phase 3: Page Objects (Estimated: 4-6 hours)
1. Create `ZScheduleTestPage.ts`
2. Refactor `schedule-selector-comparison.spec.ts` to use page objects
3. Create `AdminBasePage.ts` and individual admin page objects

### Phase 4: Cleanup (Estimated: 1-2 hours)
1. Remove duplicate visual-validation.js
2. Consolidate visual validation into proper spec file
3. Update playwright.config.ts if needed

## Benefits of Implementation

| Without POM | With POM |
|-------------|----------|
| UI change = update 15+ locations | UI change = update 1 page object |
| Selectors scattered across 900+ lines | Selectors centralized in ~10 files |
| No type safety for element interactions | Full TypeScript type safety |
| Test logic mixed with DOM navigation | Clean separation of concerns |
| Difficult to onboard new developers | Self-documenting page structure |

---

*Generated by Page Object Model Audit • Split Lease Codebase*
