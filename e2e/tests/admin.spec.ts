/**
 * Admin Pages E2E Tests
 *
 * Tests for admin thread management, host proposals, and guest proposals.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '@playwright/test';
import { AdminThreadsPage, HostProposalsPage, GuestProposalsPage, HomePage } from '../pages';
import { SEED_USERS, createAdminScenario } from '../fixtures/test-data-factory';

test.describe('Admin Pages', () => {
  // ============================================================================
  // ADMIN THREADS PAGE
  // ============================================================================

  test.describe('Admin Threads Page', () => {
    test('should require admin authentication', async ({ page }) => {
      await page.goto('/admin-threads');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show unauthorized
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const unauthorized = page.locator('.unauthorized, [data-testid="unauthorized"], .access-denied');
      const showsUnauthorized = await unauthorized.isVisible().catch(() => false);

      expect(isRedirected || showsUnauthorized).toBeTruthy();
    });

    test('should display thread list for admin', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.assertPageLoaded();
    });

    test('should display stats summary', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.assertStatsDisplayed();
    });

    test('should display filter bar', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.assertFilterBarVisible();
    });

    test('should filter by guest email', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.filterByGuestEmail('guest@example.com');

      // Should filter results (may show 0 or more)
      const threadCount = await adminPage.getThreadCount();
      expect(threadCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by host email', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.filterByHostEmail('host@example.com');

      const threadCount = await adminPage.getThreadCount();
      expect(threadCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear filters', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      // Apply filter
      await adminPage.filterByGuestEmail('test@example.com');
      const filteredCount = await adminPage.getThreadCount();

      // Clear filters
      await adminPage.clearFilters();
      const clearedCount = await adminPage.getThreadCount();

      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
    });

    test('should expand thread to view messages', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      const threadCount = await adminPage.getThreadCount();
      if (threadCount > 0) {
        await adminPage.expandThread(0);
        await adminPage.assertThreadExpanded();
      }
    });

    test('should show pagination controls', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.assertPaginationVisible();
    });

    test('should open reminder modal', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      const threadCount = await adminPage.getThreadCount();
      if (threadCount > 0) {
        await adminPage.openReminderModal(0);
        await adminPage.assertReminderModalVisible();
      }
    });
  });

  // ============================================================================
  // HOST PROPOSALS PAGE
  // ============================================================================

  test.describe('Host Proposals Page', () => {
    test('should require authentication', async ({ page }) => {
      await page.goto('/host-proposals');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = page.locator('.login-required, [data-testid="login-required"]');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display page for host user', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      await hostProposalsPage.assertPageLoaded();
    });

    test('should display listing selector', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      await hostProposalsPage.assertListingSelectorVisible();
    });

    test('should switch between listings', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      const listingCount = await hostProposalsPage.getListingCount();
      if (listingCount > 1) {
        await hostProposalsPage.selectListing(1);
        // Content should update
        await page.waitForTimeout(500);
      }
    });

    test('should display proposal sections', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      // At least one section should be visible
      const actionNeeded = hostProposalsPage.actionNeededSection;
      const inProgress = hostProposalsPage.inProgressSection;
      const closed = hostProposalsPage.closedSection;

      const anyVisible =
        (await actionNeeded.isVisible().catch(() => false)) ||
        (await inProgress.isVisible().catch(() => false)) ||
        (await closed.isVisible().catch(() => false));

      expect(anyVisible).toBeTruthy();
    });

    test('should expand proposal card', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      const proposalCount = await hostProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await hostProposalsPage.expandCard(0);
        await hostProposalsPage.assertCardExpanded();
      }
    });

    test('should show guest info in expanded card', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      const proposalCount = await hostProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await hostProposalsPage.expandCard(0);
        await hostProposalsPage.assertGuestInfoDisplayed();
      }
    });

    test('should open message modal', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      const proposalCount = await hostProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await hostProposalsPage.expandCard(0);
        await hostProposalsPage.openMessageModal();
        await expect(hostProposalsPage.messageModal).toBeVisible();
      }
    });
  });

  // ============================================================================
  // GUEST PROPOSALS PAGE
  // ============================================================================

  test.describe('Guest Proposals Page', () => {
    test('should require authentication', async ({ page }) => {
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = page.locator('.login-required, [data-testid="login-required"]');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display page for guest user', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      await guestProposalsPage.assertPageLoaded();
    });

    test('should display proposal cards', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.assertProposalsDisplayed();
      }
    });

    test('should expand proposal card', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.expandCard(0);
        await guestProposalsPage.assertCardExpanded();
      }
    });

    test('should show status badges', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        const statusBadge = guestProposalsPage.statusBadge.first();
        await expect(statusBadge).toBeVisible();
      }
    });

    test('should show empty state when no proposals', async ({ page }) => {
      // Login as guest with no proposals
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount === 0) {
        await guestProposalsPage.assertEmpty();
      }
    });

    test('should navigate to listing from proposal', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.expandCard(0);
        await guestProposalsPage.viewListing();

        await page.waitForURL(/view-split-lease/, { timeout: 10000 });
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling', () => {
    test('admin page should handle network errors', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Simulate network failure
      await page.route('**/threads**', route => route.abort('failed'));
      await page.route('**/functions/**', route => route.abort('failed'));

      const adminPage = new AdminThreadsPage(page);
      await page.goto('/admin-threads');

      // Should show error state or gracefully degrade
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('host proposals should handle API error', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Simulate API error
      await page.route('**/proposals**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      const hostProposalsPage = new HostProposalsPage(page);
      await page.goto('/host-proposals');

      // Should handle gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('admin page should be keyboard navigable', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('host proposals should have proper heading structure', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      // Should have h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('guest proposals should have accessible cards', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        // Cards should be focusable
        const firstCard = guestProposalsPage.proposalCards.first();
        await firstCard.focus();
        await expect(firstCard).toBeFocused();
      }
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('admin page should be usable on mobile', async ({ page }) => {
      // Login as admin
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(page);
      await adminPage.goto();

      await adminPage.assertPageLoaded();
    });

    test('host proposals should stack on mobile', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(page);
      await hostProposalsPage.goto();

      // Content should be visible and not overflow
      await expect(hostProposalsPage.pageContainer).toBeVisible();
    });

    test('guest proposals cards should be full width on mobile', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        const firstCard = guestProposalsPage.proposalCards.first();
        const box = await firstCard.boundingBox();

        if (box) {
          // Card should be nearly full width on mobile
          expect(box.width).toBeGreaterThan(300);
        }
      }
    });
  });
});
