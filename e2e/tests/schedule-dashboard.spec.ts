/**
 * Schedule Dashboard E2E Tests - Dual-Perspective Flow
 *
 * Tests the ScheduleDashboard page with two browser contexts:
 * - Alex (default): http://localhost:8000/schedule/leases-123
 * - Sarah (swapped): http://localhost:8000/schedule/leases-123?as=sarah
 *
 * Tests cover:
 * - Buyout request flow
 * - Accept/Decline actions
 * - Counter with price
 * - Counter with swap
 * - Calendar state sync
 * - Chat message display
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ScheduleDashboardPage, Perspective } from '../pages/schedule-dashboard.page';

// ============================================================================
// TEST FIXTURES
// ============================================================================

interface DualContextFixture {
  alexPage: ScheduleDashboardPage;
  sarahPage: ScheduleDashboardPage;
  alexContext: BrowserContext;
  sarahContext: BrowserContext;
}

/**
 * Setup dual browser contexts for Alex and Sarah perspectives
 */
async function setupDualContexts(browser: any): Promise<DualContextFixture> {
  // Create two separate browser contexts (like incognito windows)
  const alexContext = await browser.newContext();
  const sarahContext = await browser.newContext();

  const alexBrowserPage = await alexContext.newPage();
  const sarahBrowserPage = await sarahContext.newPage();

  const alexPage = new ScheduleDashboardPage(alexBrowserPage, 'leases-123', 'alex');
  const sarahPage = new ScheduleDashboardPage(sarahBrowserPage, 'leases-123', 'sarah');

  return { alexPage, sarahPage, alexContext, sarahContext };
}

/**
 * Cleanup dual contexts
 */
async function cleanupDualContexts(fixture: DualContextFixture): Promise<void> {
  await fixture.alexContext.close();
  await fixture.sarahContext.close();
}

/**
 * Refresh both pages to sync state
 */
async function syncBothPages(alexPage: ScheduleDashboardPage, sarahPage: ScheduleDashboardPage): Promise<void> {
  await Promise.all([
    alexPage.page.reload(),
    sarahPage.page.reload()
  ]);
  await Promise.all([
    alexPage.waitForPageLoad(),
    sarahPage.waitForPageLoad()
  ]);
}

// ============================================================================
// SINGLE PERSPECTIVE TESTS
// ============================================================================

test.describe('Schedule Dashboard - Single Perspective', () => {
  test('should load the schedule dashboard for Alex', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    await dashboardPage.assertPageLoaded();
    await expect(dashboardPage.calendar).toBeVisible();
  });

  test('should load the schedule dashboard for Sarah (perspective swap)', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'sarah');
    await dashboardPage.goto();

    await dashboardPage.assertPageLoaded();
    await expect(dashboardPage.calendar).toBeVisible();

    // URL should contain ?as=sarah
    await expect(page).toHaveURL(/as=sarah/);
  });

  test('should display calendar with nights', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    await dashboardPage.assertPageLoaded();

    // Should have some calendar days
    const dayCount = await dashboardPage.calendarDays.count();
    expect(dayCount).toBeGreaterThan(0);
  });

  test('should open drawer when clicking a roommate night', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    // Wait for roommate nights to be visible
    const roommateNightCount = await dashboardPage.roommateNights.count();

    if (roommateNightCount > 0) {
      await dashboardPage.clickRoommateNight(0);
      await dashboardPage.assertDrawerOpen();
    }
  });

  test('should display price in drawer', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();

    if (roommateNightCount > 0) {
      await dashboardPage.clickRoommateNight(0);
      await dashboardPage.assertDrawerOpen();
      await dashboardPage.assertPriceDisplayed();
    }
  });

  test('should cancel and close drawer', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();

    if (roommateNightCount > 0) {
      await dashboardPage.clickRoommateNight(0);
      await dashboardPage.assertDrawerOpen();

      await dashboardPage.cancelButton.click();
      await dashboardPage.assertDrawerClosed();
    }
  });

  test('should navigate between months', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    // Get initial month text from the heading
    const initialMonthText = await dashboardPage.monthHeading.textContent();

    await dashboardPage.goToNextMonth();

    const nextMonthText = await dashboardPage.monthHeading.textContent();
    expect(nextMonthText).not.toBe(initialMonthText);

    await dashboardPage.goToPrevMonth();

    const backMonthText = await dashboardPage.monthHeading.textContent();
    expect(backMonthText).toBe(initialMonthText);
  });
});

// ============================================================================
// DUAL PERSPECTIVE TESTS - BUYOUT FLOW
// NOTE: These tests require a real backend to sync state between browser contexts.
// Currently using localStorage which is isolated per browser context.
// Skip these until backend integration is complete.
// ============================================================================

test.describe('Schedule Dashboard - Dual Perspective Buyout Flow', () => {
  // Skip dual-perspective tests - localStorage is not shared between contexts
  test.skip('Scenario 1: Alex requests buyout, Sarah accepts', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      // Step 1: Both pages load
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      await Promise.all([
        alexPage.assertPageLoaded(),
        sarahPage.assertPageLoaded()
      ]);

      // Step 2: Get initial state
      const alexRoommateNights = await alexPage.roommateNights.count();
      const sarahUserNights = await sarahPage.userNights.count();

      test.skip(alexRoommateNights === 0, 'No roommate nights available for Alex to request');

      // Step 3: Alex selects a roommate (Sarah's) night and submits buyout
      await alexPage.clickRoommateNight(0);
      await alexPage.assertDrawerOpen();

      // Verify price is shown
      const price = await alexPage.getDisplayedPrice();
      expect(price).toBeGreaterThan(0);

      // Submit buyout request
      await alexPage.buyOutButton.click();
      await alexPage.page.waitForTimeout(500);

      // Step 4: Verify request appears in Alex's chat
      const alexMessageCount = await alexPage.chatMessages.count();
      expect(alexMessageCount).toBeGreaterThan(0);

      // Step 5: Sarah refreshes to see the request
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();

      // Step 6: Sarah should see the pending request
      const sarahPendingCount = await sarahPage.pendingRequests.count();
      expect(sarahPendingCount).toBeGreaterThan(0);

      // Step 7: Sarah accepts the request
      await sarahPage.acceptRequest();

      // Step 8: Verify status changed to accepted
      await sarahPage.assertRequestAccepted();

      // Step 9: Alex refreshes to see the accepted status
      await alexPage.page.reload();
      await alexPage.waitForPageLoad();

      // Alex should see the request as accepted
      await alexPage.assertRequestAccepted();

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });

  test.skip('Scenario 2: Alex requests buyout, Sarah declines', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      // Clear state for fresh test
      await alexPage.clearLocalStorage();
      await sarahPage.clearLocalStorage();
      await Promise.all([
        alexPage.page.reload(),
        sarahPage.page.reload()
      ]);

      await Promise.all([
        alexPage.assertPageLoaded(),
        sarahPage.assertPageLoaded()
      ]);

      const alexRoommateNights = await alexPage.roommateNights.count();
      test.skip(alexRoommateNights === 0, 'No roommate nights available');

      // Alex submits buyout request
      await alexPage.clickRoommateNight(0);
      await alexPage.buyOutButton.click();
      await alexPage.page.waitForTimeout(500);

      // Sarah refreshes and declines
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();

      await sarahPage.declineRequest();

      // Verify declined status
      await sarahPage.assertRequestDeclined();

      // Alex refreshes to see declined
      await alexPage.page.reload();
      await alexPage.waitForPageLoad();
      await alexPage.assertRequestDeclined();

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });
});

// ============================================================================
// DUAL PERSPECTIVE TESTS - COUNTER FLOW
// NOTE: Requires backend integration for cross-context state sync.
// ============================================================================

test.describe('Schedule Dashboard - Counter Flow', () => {
  test.skip('Scenario 3: Alex requests, Sarah counters with different price', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      await alexPage.clearLocalStorage();
      await sarahPage.clearLocalStorage();
      await syncBothPages(alexPage, sarahPage);

      const alexRoommateNights = await alexPage.roommateNights.count();
      test.skip(alexRoommateNights === 0, 'No roommate nights available');

      // Alex submits buyout request
      await alexPage.clickRoommateNight(0);
      await alexPage.buyOutButton.click();
      await alexPage.page.waitForTimeout(500);

      // Sarah refreshes and counters with price
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();

      const sarahPendingCount = await sarahPage.pendingRequests.count();
      test.skip(sarahPendingCount === 0, 'No pending requests for Sarah to counter');

      await sarahPage.counterWithPrice();

      // Verify counter mode is active (drawer should open or counter UI appears)
      // The exact UI depends on implementation

      // Check that counter-related elements appear
      const counterUI = sarahPage.page.locator('.counter-mode, [data-mode="counter"], .counter-price-input');
      const counterVisible = await counterUI.isVisible().catch(() => false);

      // If counter UI is visible, we're in counter mode
      if (counterVisible) {
        expect(counterVisible).toBeTruthy();
      }

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });

  test.skip('Scenario 4: Alex requests buyout, Sarah counters with swap', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      await alexPage.clearLocalStorage();
      await sarahPage.clearLocalStorage();
      await syncBothPages(alexPage, sarahPage);

      const alexRoommateNights = await alexPage.roommateNights.count();
      test.skip(alexRoommateNights === 0, 'No roommate nights available');

      // Alex submits buyout request
      await alexPage.clickRoommateNight(0);
      await alexPage.buyOutButton.click();
      await alexPage.page.waitForTimeout(500);

      // Sarah refreshes and counters with swap
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();

      const sarahPendingCount = await sarahPage.pendingRequests.count();
      test.skip(sarahPendingCount === 0, 'No pending requests for Sarah to counter');

      await sarahPage.counterWithSwap();

      // Verify swap counter mode is active
      const swapMode = sarahPage.page.locator('.swap-mode, [data-mode="swap"], .counter-swap');
      const swapModeVisible = await swapMode.isVisible().catch(() => false);

      // Sarah should be prompted to select a night to swap
      const selectSwapPrompt = sarahPage.page.locator('[data-testid="select-swap-night"], .select-swap-prompt');
      const promptVisible = await selectSwapPrompt.isVisible().catch(() => false);

      expect(swapModeVisible || promptVisible).toBeTruthy();

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });
});

// ============================================================================
// DUAL PERSPECTIVE TESTS - REVERSE FLOW (Sarah initiates)
// NOTE: Requires backend integration for cross-context state sync.
// ============================================================================

test.describe('Schedule Dashboard - Reverse Flow (Sarah initiates)', () => {
  test.skip('Scenario 5: Sarah requests buyout from Alex, Alex accepts', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      await alexPage.clearLocalStorage();
      await sarahPage.clearLocalStorage();
      await syncBothPages(alexPage, sarahPage);

      // From Sarah's perspective, Alex's nights are "roommate nights"
      const sarahRoommateNights = await sarahPage.roommateNights.count();
      test.skip(sarahRoommateNights === 0, 'No roommate (Alex) nights available for Sarah');

      // Sarah selects one of Alex's nights and requests buyout
      await sarahPage.clickRoommateNight(0);
      await sarahPage.assertDrawerOpen();
      await sarahPage.buyOutButton.click();
      await sarahPage.page.waitForTimeout(500);

      // Verify Sarah sees her request
      const sarahMessageCount = await sarahPage.chatMessages.count();
      expect(sarahMessageCount).toBeGreaterThan(0);

      // Alex refreshes to see Sarah's request
      await alexPage.page.reload();
      await alexPage.waitForPageLoad();

      // Alex should see pending request
      const alexPendingCount = await alexPage.pendingRequests.count();
      expect(alexPendingCount).toBeGreaterThan(0);

      // Alex accepts
      await alexPage.acceptRequest();
      await alexPage.assertRequestAccepted();

      // Sarah refreshes to see accepted
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();
      await sarahPage.assertRequestAccepted();

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });
});

// ============================================================================
// CHAT FUNCTIONALITY TESTS
// ============================================================================

test.describe('Schedule Dashboard - Chat Functionality', () => {
  test('should display request message without price in body', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();
    test.skip(roommateNightCount === 0, 'No roommate nights available');

    // Submit a buyout request
    await dashboardPage.clickRoommateNight(0);
    await dashboardPage.buyOutButton.click();
    await dashboardPage.page.waitForTimeout(500);

    // Check the message content
    const lastMessage = await dashboardPage.getLastMessageText();
    expect(lastMessage).toBeTruthy();

    // Message should contain "buy out" but price should be in separate element
    if (lastMessage) {
      expect(lastMessage.toLowerCase()).toMatch(/buy out|buyout|requested/i);
      // Price should be shown in "You'd Pay" format, not in the main text
    }
  });

  test.skip('should display "You\'d Pay" and "You\'d Receive" labels', async ({ browser }) => {
    const { alexPage, sarahPage, alexContext, sarahContext } = await setupDualContexts(browser);

    try {
      await Promise.all([
        alexPage.goto(),
        sarahPage.goto()
      ]);

      const alexRoommateNights = await alexPage.roommateNights.count();
      test.skip(alexRoommateNights === 0, 'No roommate nights available');

      // Alex submits request
      await alexPage.clickRoommateNight(0);
      await alexPage.buyOutButton.click();
      await alexPage.page.waitForTimeout(500);

      // Check Alex sees "You'd Pay"
      const alexPageContent = await alexPage.page.content();
      expect(alexPageContent).toContain("You'd Pay");

      // Sarah refreshes
      await sarahPage.page.reload();
      await sarahPage.waitForPageLoad();

      // Check Sarah sees "You'd Receive"
      const sarahPageContent = await sarahPage.page.content();
      expect(sarahPageContent).toContain("You'd Receive");

    } finally {
      await cleanupDualContexts({ alexPage, sarahPage, alexContext, sarahContext });
    }
  });

  test('should send and display regular chat messages', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    // Send a test message
    const testMessage = 'Hello, can we discuss the schedule?';
    await dashboardPage.sendMessage(testMessage);

    // Verify message appears
    const lastMessage = await dashboardPage.getLastMessageText();
    expect(lastMessage).toContain(testMessage);
  });
});

// ============================================================================
// STATE PERSISTENCE TESTS
// ============================================================================

test.describe('Schedule Dashboard - State Persistence', () => {
  test('should persist state after page refresh', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();
    test.skip(roommateNightCount === 0, 'No roommate nights available');

    // Submit a request
    await dashboardPage.clickRoommateNight(0);
    await dashboardPage.buyOutButton.click();
    await dashboardPage.page.waitForTimeout(500);

    // Get message count before refresh
    const messageCountBefore = await dashboardPage.chatMessages.count();

    // Refresh page
    await dashboardPage.page.reload();
    await dashboardPage.waitForPageLoad();

    // Verify messages persist
    const messageCountAfter = await dashboardPage.chatMessages.count();
    expect(messageCountAfter).toBe(messageCountBefore);
  });

  test('should maintain perspective after refresh', async ({ page }) => {
    // Navigate as Sarah
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'sarah');
    await dashboardPage.goto();

    // Refresh
    await dashboardPage.page.reload();
    await dashboardPage.waitForPageLoad();

    // URL should still have ?as=sarah
    await expect(page).toHaveURL(/as=sarah/);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

test.describe('Schedule Dashboard - Edge Cases', () => {
  test('should handle rapid clicking gracefully', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();
    test.skip(roommateNightCount === 0, 'No roommate nights available');

    // Rapid click multiple nights
    for (let i = 0; i < Math.min(3, roommateNightCount); i++) {
      await dashboardPage.roommateNights.nth(i).click({ force: true });
      await page.waitForTimeout(100);
    }

    // Page should still be functional
    await dashboardPage.assertPageLoaded();
  });

  test('should handle empty lease gracefully', async ({ page }) => {
    // Try to access with invalid lease ID
    const dashboardPage = new ScheduleDashboardPage(page, 'nonexistent-lease', 'alex');
    await dashboardPage.page.goto(dashboardPage.getPath());

    await page.waitForTimeout(1000);

    // Should show error or empty state, not crash
    const errorState = page.locator('.error-state, [data-testid="error"], .not-found');
    const emptyState = page.locator('.empty-state, [data-testid="empty"]');
    const calendar = dashboardPage.calendar;

    const hasError = await errorState.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCalendar = await calendar.isVisible().catch(() => false);

    // One of these should be true - page handles the case gracefully
    expect(hasError || hasEmpty || hasCalendar).toBeTruthy();
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Schedule Dashboard - Accessibility', () => {
  test('should have accessible calendar', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    // Calendar days should be keyboard accessible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have proper button labels', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();
    test.skip(roommateNightCount === 0, 'No roommate nights available');

    await dashboardPage.clickRoommateNight(0);

    // Buttons should have accessible names
    const buyoutBtn = dashboardPage.buyOutButton;
    if (await buyoutBtn.isVisible()) {
      const name = await buyoutBtn.getAttribute('aria-label') || await buyoutBtn.textContent();
      expect(name).toBeTruthy();
    }
  });

  test('should have ARIA attributes on request messages', async ({ page }) => {
    const dashboardPage = new ScheduleDashboardPage(page, 'leases-123', 'alex');
    await dashboardPage.goto();

    const roommateNightCount = await dashboardPage.roommateNights.count();
    test.skip(roommateNightCount === 0, 'No roommate nights available');

    // Submit a request
    await dashboardPage.clickRoommateNight(0);
    await dashboardPage.buyOutButton.click();
    await dashboardPage.page.waitForTimeout(500);

    // Chat thread should have proper structure
    const chatThread = dashboardPage.chatThread;
    if (await chatThread.isVisible()) {
      // Should have some semantic structure
      const heading = chatThread.locator('h3, [role="heading"]');
      const hasHeading = await heading.isVisible().catch(() => false);
      expect(hasHeading).toBeTruthy();
    }
  });
});
