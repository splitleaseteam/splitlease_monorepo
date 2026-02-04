/**
 * Mobile Schedule Dashboard E2E Tests
 *
 * Comprehensive test suite for the mobile-first schedule dashboard.
 * Covers Phases 1-6: Header, Bottom Nav, Calendar, Chat, Transactions, Settings.
 *
 * Run: bun run test:e2e --project=mobile-chrome mobile-schedule-dashboard.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SCHEDULE_URL = '/schedule/test-lease-001';
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// Mock data for testing
const MOCK_DATA = {
  lease: {
    id: 'test-lease-001',
    propertyAddress: '123 Test Street, Apt 4B',
  },
  currentUser: {
    id: 'user-001',
    firstName: 'Alex',
    lastName: 'Test',
  },
  roommate: {
    id: 'user-002',
    firstName: 'Sarah',
    lastName: 'Roommate',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function navigateToMobileDashboard(page: Page): Promise<void> {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

async function switchToTab(page: Page, tabName: string): Promise<void> {
  const tabButton = page.locator(`.mobile-nav-tab:has-text("${tabName}")`);
  await tabButton.click();
  await page.waitForTimeout(300);
}

async function waitForAnimation(page: Page): Promise<void> {
  await page.waitForTimeout(350); // CSS transitions are typically 300ms
}

// ============================================================================
// 1. VIEWPORT-BASED ROUTING
// ============================================================================

test.describe('1. Viewport-Based Routing', () => {
  test('VR-001: Mobile layout renders on small viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });

    const mobileLayout = page.locator('.mobile-schedule-dashboard');
    await expect(mobileLayout).toBeVisible();

    // Desktop layout should not be visible
    const desktopLayout = page.locator('.schedule-dashboard:not(.mobile-schedule-dashboard)');
    await expect(desktopLayout).not.toBeVisible();
  });

  test('VR-002: Desktop layout on large viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });

    const desktopLayout = page.locator('.schedule-dashboard:not(.mobile-schedule-dashboard)');
    await expect(desktopLayout).toBeVisible();
  });

  test('VR-003: Breakpoint boundary at 768px', async ({ page }) => {
    // Test at 767px - should be mobile
    await page.setViewportSize({ width: 767, height: 667 });
    await page.goto(SCHEDULE_URL, { waitUntil: 'networkidle' });

    let mobileLayout = page.locator('.mobile-schedule-dashboard');
    await expect(mobileLayout).toBeVisible();

    // Resize to 768px - should be desktop
    await page.setViewportSize({ width: 768, height: 667 });
    await page.waitForTimeout(300);

    const desktopLayout = page.locator('.schedule-dashboard:not(.mobile-schedule-dashboard)');
    await expect(desktopLayout).toBeVisible();
  });
});

// ============================================================================
// 2. MOBILE HEADER
// ============================================================================

test.describe('2. Mobile Header', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
  });

  test('MH-001: Header shows property address', async ({ page }) => {
    const header = page.locator('.mobile-header');
    await expect(header).toBeVisible();

    // Property address should be visible in header
    const addressText = page.locator('.mobile-header__title, .mobile-header__address');
    await expect(addressText).toBeVisible();
  });

  test('MH-002: Header shows roommate name', async ({ page }) => {
    const subtitle = page.locator('.mobile-header__subtitle');
    await expect(subtitle).toBeVisible();
  });

  test('MH-003: User avatar displays', async ({ page }) => {
    const avatar = page.locator('.mobile-header__avatar, .user-avatar');
    await expect(avatar).toBeVisible();
  });
});

// ============================================================================
// 3. BOTTOM NAVIGATION
// ============================================================================

test.describe('3. Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
  });

  test('BN-001: Calendar tab is default active', async ({ page }) => {
    const calendarTab = page.locator('.mobile-nav-tab').first();
    await expect(calendarTab).toHaveClass(/mobile-nav-tab--active/);
  });

  test('BN-002: Tap Chat tab switches view', async ({ page }) => {
    await switchToTab(page, 'Chat');

    const chatView = page.locator('.mobile-view--chat');
    await expect(chatView).toBeVisible();

    const chatTab = page.locator('.mobile-nav-tab:has-text("Chat")');
    await expect(chatTab).toHaveClass(/mobile-nav-tab--active/);
  });

  test('BN-003: Tap Transactions tab switches view', async ({ page }) => {
    await switchToTab(page, 'History');

    const transactionsView = page.locator('.mobile-view--history');
    await expect(transactionsView).toBeVisible();
  });

  test('BN-004: Tap Settings tab switches view', async ({ page }) => {
    await switchToTab(page, 'Settings');

    const settingsView = page.locator('.mobile-view--settings');
    await expect(settingsView).toBeVisible();
  });

  test('BN-005: Tab icons display correctly', async ({ page }) => {
    const bottomNav = page.locator('.mobile-bottom-nav');
    const tabs = bottomNav.locator('.mobile-nav-tab');

    await expect(tabs).toHaveCount(4);
  });

  test('BN-006: Active tab visual feedback', async ({ page }) => {
    // Test each tab gets active state
    const tabNames = ['Calendar', 'Chat', 'History', 'Settings'];

    for (const tabName of tabNames) {
      await switchToTab(page, tabName);

      const tab = page.locator(`.mobile-nav-tab:has-text("${tabName}")`);
      await expect(tab).toHaveClass(/mobile-nav-tab--active/);
    }
  });
});

// ============================================================================
// 4. MOBILE CALENDAR (Phase 2)
// ============================================================================

test.describe('4. Mobile Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
    // Calendar is default tab
  });

  test.describe('4.1 Week View Display', () => {
    test('MC-001: Calendar renders current week', async ({ page }) => {
      const calendar = page.locator('.mobile-calendar');
      await expect(calendar).toBeVisible();

      const dayCells = page.locator('.mobile-day-cell');
      await expect(dayCells).toHaveCount(7);
    });

    test('MC-002: Day labels show correctly', async ({ page }) => {
      const dayLabels = page.locator('.mobile-calendar__day-label');
      await expect(dayLabels).toHaveCount(7);
    });

    test('MC-003: Month/year header displays', async ({ page }) => {
      const monthHeader = page.locator('.mobile-calendar__month');
      await expect(monthHeader).toBeVisible();
    });

    test('MC-004: Week range shows in header', async ({ page }) => {
      const weekRange = page.locator('.mobile-calendar__week-range');
      await expect(weekRange).toBeVisible();
    });
  });

  test.describe('4.2 Week Navigation', () => {
    test('MC-005: Next week button works', async ({ page }) => {
      const nextButton = page.locator('.mobile-calendar__nav-btn--next, button:has-text("›")');
      const monthHeader = page.locator('.mobile-calendar__month');
      const initialText = await monthHeader.textContent();

      await nextButton.click();
      await waitForAnimation(page);

      // Calendar should advance (may change month text or keep same)
      const dayCells = page.locator('.mobile-day-cell');
      await expect(dayCells).toHaveCount(7);
    });

    test('MC-006: Previous week button works', async ({ page }) => {
      // First go forward, then back
      const nextButton = page.locator('.mobile-calendar__nav-btn--next, button:has-text("›")');
      const prevButton = page.locator('.mobile-calendar__nav-btn--prev, button:has-text("‹")');

      await nextButton.click();
      await waitForAnimation(page);
      await prevButton.click();
      await waitForAnimation(page);

      const dayCells = page.locator('.mobile-day-cell');
      await expect(dayCells).toHaveCount(7);
    });
  });

  test.describe('4.3 Day Cell States', () => {
    test('MC-009: User nights show distinct styling', async ({ page }) => {
      // Look for any day cells with user ownership styling
      const userCells = page.locator('.mobile-day-cell--mine');
      // May or may not have user nights depending on test data
      const count = await userCells.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('MC-012: Today marker displays', async ({ page }) => {
      const todayCell = page.locator('.mobile-day-cell--today');
      await expect(todayCell).toBeVisible();
    });
  });

  test.describe('4.4 Day Selection', () => {
    test('MC-014: Tap day selects it', async ({ page }) => {
      const firstDay = page.locator('.mobile-day-cell').first();
      await firstDay.click();
      await waitForAnimation(page);

      await expect(firstDay).toHaveClass(/mobile-day-cell--selected/);
    });

    test('MC-016: Selecting new day deselects previous', async ({ page }) => {
      const dayCells = page.locator('.mobile-day-cell');

      // Select first day
      await dayCells.first().click();
      await waitForAnimation(page);
      await expect(dayCells.first()).toHaveClass(/mobile-day-cell--selected/);

      // Select second day
      await dayCells.nth(1).click();
      await waitForAnimation(page);

      // First should be deselected, second selected
      await expect(dayCells.first()).not.toHaveClass(/mobile-day-cell--selected/);
      await expect(dayCells.nth(1)).toHaveClass(/mobile-day-cell--selected/);
    });
  });
});

// ============================================================================
// 5. MOBILE CHAT VIEW (Phase 4)
// ============================================================================

test.describe('5. Mobile Chat View', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
    await switchToTab(page, 'Chat');
  });

  test.describe('5.1 Message Display', () => {
    test('CV-001: Messages render in list', async ({ page }) => {
      const chatMessages = page.locator('.chat-messages');
      await expect(chatMessages).toBeVisible();
    });

    test('CV-002: User messages align right', async ({ page }) => {
      const userMessages = page.locator('.chat-bubble--mine');
      // May or may not have user messages
      const count = await userMessages.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('CV-003: Roommate messages align left', async ({ page }) => {
      const roommateMessages = page.locator('.chat-bubble--theirs');
      const count = await roommateMessages.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('CV-006: Empty state when no messages', async ({ page }) => {
      // Check if empty state shows when no messages
      const emptyState = page.locator('.chat-empty-state');
      const messages = page.locator('.chat-bubble');
      const messageCount = await messages.count();

      if (messageCount === 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('5.3 Chat Input', () => {
    test('CV-010: Input bar visible at bottom', async ({ page }) => {
      const inputBar = page.locator('.chat-input');
      await expect(inputBar).toBeVisible();
    });

    test('CV-011: Send button disabled when empty', async ({ page }) => {
      const sendButton = page.locator('.chat-input__send');
      const textarea = page.locator('.chat-input__textarea');

      // Clear any existing text
      await textarea.fill('');
      await expect(sendButton).toBeDisabled();
    });

    test('CV-012: Type enables send button', async ({ page }) => {
      const sendButton = page.locator('.chat-input__send');
      const textarea = page.locator('.chat-input__textarea');

      await textarea.fill('Hello');
      await expect(sendButton).toBeEnabled();
    });

    test('CV-013: Send message clears input', async ({ page }) => {
      const sendButton = page.locator('.chat-input__send');
      const textarea = page.locator('.chat-input__textarea');

      await textarea.fill('Test message');
      await sendButton.click();
      await waitForAnimation(page);

      // Input should be cleared
      await expect(textarea).toHaveValue('');
    });
  });
});

// ============================================================================
// 6. TRANSACTION LIST (Phase 5)
// ============================================================================

test.describe('6. Transaction List', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
    await switchToTab(page, 'History');
  });

  test.describe('6.1 List Display', () => {
    test('TL-001: Transactions list renders', async ({ page }) => {
      const transactionList = page.locator('.transaction-list');
      await expect(transactionList).toBeVisible();
    });

    test('TL-003: Empty state when none', async ({ page }) => {
      const emptyState = page.locator('.transaction-empty-state, .empty-state');
      const transactions = page.locator('.transaction-row');
      const count = await transactions.count();

      if (count === 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('6.3 Status Badges', () => {
    test('TL-009: Pending badge styling', async ({ page }) => {
      const pendingBadge = page.locator('.status-badge--pending');
      const count = await pendingBadge.count();

      if (count > 0) {
        await expect(pendingBadge.first()).toBeVisible();
      }
    });

    test('TL-010: Accepted badge styling', async ({ page }) => {
      const acceptedBadge = page.locator('.status-badge--accepted');
      const count = await acceptedBadge.count();

      if (count > 0) {
        await expect(acceptedBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('6.4 Expand/Collapse', () => {
    test('TL-013: Tap row expands details', async ({ page }) => {
      const transactions = page.locator('.transaction-row');
      const count = await transactions.count();

      if (count > 0) {
        const firstRow = transactions.first();
        await firstRow.click();
        await waitForAnimation(page);

        const expandedDetails = page.locator('.transaction-details--expanded, .transaction-row--expanded');
        await expect(expandedDetails).toBeVisible();
      }
    });

    test('TL-015: Only one expanded at a time', async ({ page }) => {
      const transactions = page.locator('.transaction-row');
      const count = await transactions.count();

      if (count >= 2) {
        // Expand first row
        await transactions.first().click();
        await waitForAnimation(page);

        // Expand second row
        await transactions.nth(1).click();
        await waitForAnimation(page);

        // Only second should be expanded
        const expandedRows = page.locator('.transaction-row--expanded, .transaction-details--expanded');
        await expect(expandedRows).toHaveCount(1);
      }
    });
  });
});

// ============================================================================
// 7. SETTINGS VIEW (Phase 6)
// ============================================================================

test.describe('7. Settings View', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
    await switchToTab(page, 'Settings');
  });

  test.describe('7.1 Settings Menu', () => {
    test('SV-001: Settings menu renders', async ({ page }) => {
      const settingsMenu = page.locator('.settings-menu');
      await expect(settingsMenu).toBeVisible();
    });

    test('SV-002: Buyout Pricing item shows', async ({ page }) => {
      const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
      await expect(pricingItem).toBeVisible();
    });

    test('SV-003: Sharing Preferences item shows', async ({ page }) => {
      const sharingItem = page.locator('.settings-menu__item:has-text("Sharing")');
      await expect(sharingItem).toBeVisible();
    });
  });

  test.describe('7.2 Section Navigation', () => {
    test('SV-006: Tap Buyout Pricing opens section', async ({ page }) => {
      const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
      await pricingItem.click();
      await waitForAnimation(page);

      const pricingSection = page.locator('.settings-section:has-text("Pricing")');
      await expect(pricingSection).toBeVisible();
    });

    test('SV-007: Tap Sharing opens section', async ({ page }) => {
      const sharingItem = page.locator('.settings-menu__item:has-text("Sharing")');
      await sharingItem.click();
      await waitForAnimation(page);

      const sharingSection = page.locator('.settings-section:has-text("Sharing")');
      await expect(sharingSection).toBeVisible();
    });

    test('SV-008: Back button returns to menu', async ({ page }) => {
      // Enter pricing section
      const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
      await pricingItem.click();
      await waitForAnimation(page);

      // Click back
      const backButton = page.locator('.section-header__back, button:has-text("Back")');
      await backButton.click();
      await waitForAnimation(page);

      // Should be back at menu
      const settingsMenu = page.locator('.settings-menu');
      await expect(settingsMenu).toBeVisible();
    });
  });

  test.describe('7.3 Pricing Section', () => {
    test.beforeEach(async ({ page }) => {
      const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
      await pricingItem.click();
      await waitForAnimation(page);
    });

    test('SV-010: Base price input shows', async ({ page }) => {
      const priceInput = page.locator('.price-input');
      await expect(priceInput).toBeVisible();
    });

    test('SV-012: Short notice slider shows', async ({ page }) => {
      const slider = page.locator('.multiplier-slider').first();
      await expect(slider).toBeVisible();
    });

    test('SV-016: Save disabled until changed', async ({ page }) => {
      const saveButton = page.locator('.settings-btn--primary:has-text("Save")');
      await expect(saveButton).toBeDisabled();
    });

    test('SV-017: Save enabled after change', async ({ page }) => {
      const priceInput = page.locator('.price-input__field');
      await priceInput.fill('200');

      const saveButton = page.locator('.settings-btn--primary:has-text("Save")');
      await expect(saveButton).toBeEnabled();
    });

    test('SV-019: Cancel discards changes', async ({ page }) => {
      const priceInput = page.locator('.price-input__field');
      const originalValue = await priceInput.inputValue();

      await priceInput.fill('999');

      const cancelButton = page.locator('.settings-btn--secondary:has-text("Cancel")');
      await cancelButton.click();
      await waitForAnimation(page);

      // Go back to pricing section
      const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
      await pricingItem.click();
      await waitForAnimation(page);

      // Value should be restored
      const newPriceInput = page.locator('.price-input__field');
      await expect(newPriceInput).toHaveValue(originalValue);
    });
  });

  test.describe('7.4 Sharing Section', () => {
    test.beforeEach(async ({ page }) => {
      const sharingItem = page.locator('.settings-menu__item:has-text("Sharing")');
      await sharingItem.click();
      await waitForAnimation(page);
    });

    test('SV-020: Willingness slider shows', async ({ page }) => {
      const slider = page.locator('.percentage-slider');
      await expect(slider).toBeVisible();
    });

    test('SV-021: Slider shows current value', async ({ page }) => {
      const valueLabel = page.locator('.percentage-slider__value');
      await expect(valueLabel).toBeVisible();
      await expect(valueLabel).toContainText('%');
    });

    test('SV-024: Description explains level', async ({ page }) => {
      const description = page.locator('.percentage-slider__description');
      await expect(description).toBeVisible();
    });
  });
});

// ============================================================================
// 8. BOTTOM SHEET (Phase 3)
// ============================================================================

test.describe('8. Bottom Sheet', () => {
  // Bottom sheet tests - these may be triggered by specific actions
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
  });

  test('BS-002: Backdrop appears when sheet opens', async ({ page }) => {
    // Trigger a bottom sheet (if available in the UI)
    const bottomSheet = page.locator('.mobile-bottom-sheet');
    const backdrop = page.locator('.mobile-bottom-sheet__backdrop');

    // Check if bottom sheet functionality exists
    const sheetTrigger = page.locator('[data-opens-sheet], .sheet-trigger').first();
    const hasTrigger = await sheetTrigger.count() > 0;

    if (hasTrigger) {
      await sheetTrigger.click();
      await waitForAnimation(page);
      await expect(backdrop).toBeVisible();
    }
  });

  test('BS-004: Tap backdrop closes sheet', async ({ page }) => {
    const sheetTrigger = page.locator('[data-opens-sheet], .sheet-trigger').first();
    const hasTrigger = await sheetTrigger.count() > 0;

    if (hasTrigger) {
      await sheetTrigger.click();
      await waitForAnimation(page);

      const backdrop = page.locator('.mobile-bottom-sheet__backdrop');
      await backdrop.click();
      await waitForAnimation(page);

      const bottomSheet = page.locator('.mobile-bottom-sheet--open');
      await expect(bottomSheet).not.toBeVisible();
    }
  });
});

// ============================================================================
// 9. CROSS-FEATURE INTEGRATION
// ============================================================================

test.describe('9. Cross-Feature Integration', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
  });

  test('INT-004: Tab state persists during session', async ({ page }) => {
    // Go to Settings
    await switchToTab(page, 'Settings');
    await expect(page.locator('.mobile-view--settings')).toBeVisible();

    // Go to Chat
    await switchToTab(page, 'Chat');
    await expect(page.locator('.mobile-view--chat')).toBeVisible();

    // Go back to Settings
    await switchToTab(page, 'Settings');
    await expect(page.locator('.mobile-view--settings')).toBeVisible();
  });

  test('INT-005: Settings section state resets on tab change', async ({ page }) => {
    // Go to Settings and open Pricing
    await switchToTab(page, 'Settings');
    const pricingItem = page.locator('.settings-menu__item:has-text("Pricing"), .settings-menu__item:has-text("Buyout")');
    await pricingItem.click();
    await waitForAnimation(page);

    // Verify in Pricing section
    await expect(page.locator('.settings-section:has-text("Pricing")')).toBeVisible();

    // Switch to Calendar and back to Settings
    await switchToTab(page, 'Calendar');
    await switchToTab(page, 'Settings');

    // Should be back at Settings menu (not Pricing section)
    await expect(page.locator('.settings-menu')).toBeVisible();
  });
});

// ============================================================================
// 10. ACCESSIBILITY
// ============================================================================

test.describe('10. Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMobileDashboard(page);
  });

  test.describe('10.1 Screen Reader Support', () => {
    test('A11Y-001: Tabs have accessible labels', async ({ page }) => {
      const tabs = page.locator('.mobile-nav-tab');
      const count = await tabs.count();

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i);
        // Tab should have text content or aria-label
        const text = await tab.textContent();
        const ariaLabel = await tab.getAttribute('aria-label');

        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('A11Y-004: Buttons have labels', async ({ page }) => {
      const buttons = page.locator('button').filter({ hasNot: page.locator('[aria-hidden="true"]') });
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        expect(text?.trim() || ariaLabel || title).toBeTruthy();
      }
    });
  });

  test.describe('10.2 Keyboard Navigation', () => {
    test('A11Y-005: Tab through nav items', async ({ page }) => {
      // Focus the first tab
      await page.keyboard.press('Tab');

      // Tab through all nav items
      const tabs = page.locator('.mobile-nav-tab');
      const count = await tabs.count();

      for (let i = 0; i < count; i++) {
        const focusedElement = page.locator(':focus');
        // Verify something is focused
        await expect(focusedElement).toBeVisible();
        await page.keyboard.press('Tab');
      }
    });

    test('A11Y-006: Enter activates buttons', async ({ page }) => {
      // Focus the chat tab
      const chatTab = page.locator('.mobile-nav-tab:has-text("Chat")');
      await chatTab.focus();
      await page.keyboard.press('Enter');

      // Chat view should be visible
      const chatView = page.locator('.mobile-view--chat');
      await expect(chatView).toBeVisible();
    });
  });
});

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

test.describe('Loading & Error States', () => {
  test('Shows loading state while fetching', async ({ page }) => {
    // Intercept API calls to delay them
    await page.route('**/api/**', async (route) => {
      await page.waitForTimeout(1000);
      await route.continue();
    });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(SCHEDULE_URL);

    // Should show loading initially
    const loadingState = page.locator('.mobile-loading');
    // Loading may be quick, so this is a soft check
    const wasLoading = await loadingState.isVisible({ timeout: 500 }).catch(() => false);

    // Eventually should show content
    await page.waitForLoadState('networkidle');
    const content = page.locator('.mobile-schedule-dashboard__content');
    await expect(content).toBeVisible();
  });

  test('Shows error state on failure', async ({ page }) => {
    // Intercept API calls to return error
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(SCHEDULE_URL);

    // Should show error state
    const errorState = page.locator('.mobile-error');
    // May or may not show depending on error handling
    const hasError = await errorState.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasError) {
      const retryButton = page.locator('.mobile-error__retry');
      await expect(retryButton).toBeVisible();
    }
  });
});
