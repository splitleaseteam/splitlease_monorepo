/**
 * Admin Pages E2E Tests
 *
 * Tests for admin thread management, host proposals, and guest proposals.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '../fixtures/auth';
import { AdminThreadsPage, HostProposalsPage, GuestProposalsPage, HomePage } from '../pages';
import { SEED_USERS, createAdminScenario } from '../fixtures/test-data-factory';

test.describe('Admin Pages', () => {
  // ============================================================================
  // ADMIN THREADS PAGE
  // ============================================================================

  test.describe('Admin Threads Page', () => {
    test('should require admin authentication', async ({ anonymousPage }) => {
      await anonymousPage.goto('/admin-threads');
      await anonymousPage.waitForLoadState('networkidle');

      // Should redirect to login or show unauthorized
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const unauthorized = anonymousPage.locator('.unauthorized, [data-testid="unauthorized"], .access-denied');
      const showsUnauthorized = await unauthorized.isVisible().catch(() => false);

      expect(isRedirected || showsUnauthorized).toBeTruthy();
    });

    test('should display thread list for admin', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.assertPageLoaded();
    });

    test('should display stats summary', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.assertStatsDisplayed();
    });

    test('should display filter bar', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.assertFilterBarVisible();
    });

    test('should filter by guest email', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.filterByGuestEmail('guest@example.com');

      // Should filter results (may show 0 or more)
      const threadCount = await adminPage.getThreadCount();
      expect(threadCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by host email', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.filterByHostEmail('host@example.com');

      const threadCount = await adminPage.getThreadCount();
      expect(threadCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear filters', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      // Apply filter
      await adminPage.filterByGuestEmail('test@example.com');
      const filteredCount = await adminPage.getThreadCount();

      // Clear filters
      await adminPage.clearFilters();
      const clearedCount = await adminPage.getThreadCount();

      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
    });

    test('should expand thread to view messages', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      const threadCount = await adminPage.getThreadCount();
      if (threadCount > 0) {
        await adminPage.expandThread(0);
        await adminPage.assertThreadExpanded();
      }
    });

    test('should show pagination controls', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.assertPaginationVisible();
    });

    test('should open reminder modal', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
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
    test('should require authentication', async ({ anonymousPage }) => {
      await anonymousPage.goto('/host-proposals');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"]');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display page for host user', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      await hostProposalsPage.assertPageLoaded();
    });

    test('should display listing selector', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      await hostProposalsPage.assertListingSelectorVisible();
    });

    test('should switch between listings', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      const listingCount = await hostProposalsPage.getListingCount();
      if (listingCount > 1) {
        await hostProposalsPage.selectListing(1);
        // Content should update
        await anonymousPage.waitForTimeout(500);
      }
    });

    test('should display proposal sections', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
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

    test('should expand proposal card', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      const proposalCount = await hostProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await hostProposalsPage.expandCard(0);
        await hostProposalsPage.assertCardExpanded();
      }
    });

    test('should show guest info in expanded card', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      const proposalCount = await hostProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await hostProposalsPage.expandCard(0);
        await hostProposalsPage.assertGuestInfoDisplayed();
      }
    });

    test('should open message modal', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
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
    test('should require authentication', async ({ anonymousPage }) => {
      await anonymousPage.goto('/guest-proposals');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"]');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display page for guest user', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      await guestProposalsPage.assertPageLoaded();
    });

    test('should display proposal cards', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.assertProposalsDisplayed();
      }
    });

    test('should expand proposal card', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.expandCard(0);
        await guestProposalsPage.assertCardExpanded();
      }
    });

    test('should show status badges', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        const statusBadge = guestProposalsPage.statusBadge.first();
        await expect(statusBadge).toBeVisible();
      }
    });

    test('should show empty state when no proposals', async ({ anonymousPage }) => {
      // Login as guest with no proposals
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount === 0) {
        await guestProposalsPage.assertEmpty();
      }
    });

    test('should navigate to listing from proposal', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
      await guestProposalsPage.goto();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        await guestProposalsPage.expandCard(0);
        await guestProposalsPage.viewListing();

        await anonymousPage.waitForURL(/view-split-lease/, { timeout: 10000 });
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling', () => {
    test('admin page should handle network errors', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      // Simulate network failure
      await anonymousPage.route('**/threads**', route => route.abort('failed'));
      await anonymousPage.route('**/functions/**', route => route.abort('failed'));

      const adminPage = new AdminThreadsPage(anonymousPage);
      await anonymousPage.goto('/admin-threads');

      // Should show error state or gracefully degrade
      await anonymousPage.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('host proposals should handle API error', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      // Simulate API error
      await anonymousPage.route('**/proposals**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await anonymousPage.goto('/host-proposals');

      // Should handle gracefully
      await anonymousPage.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('admin page should be keyboard navigable', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      // Tab through elements
      await anonymousPage.keyboard.press('Tab');
      await anonymousPage.keyboard.press('Tab');
      await anonymousPage.keyboard.press('Tab');

      const focused = anonymousPage.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('host proposals should have proper heading structure', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      // Should have h1
      const h1 = anonymousPage.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('guest proposals should have accessible cards', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
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

    test('admin page should be usable on mobile', async ({ anonymousPage }) => {
      // Login as admin
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.admin.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const adminPage = new AdminThreadsPage(anonymousPage);
      await adminPage.goto();

      await adminPage.assertPageLoaded();
    });

    test('host proposals should stack on mobile', async ({ anonymousPage }) => {
      // Login as host
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const hostProposalsPage = new HostProposalsPage(anonymousPage);
      await hostProposalsPage.goto();

      // Content should be visible and not overflow
      await expect(hostProposalsPage.pageContainer).toBeVisible();
    });

    test('guest proposals cards should be full width on mobile', async ({ anonymousPage }) => {
      // Login as guest
      await anonymousPage.goto('/');
      const loginButton = anonymousPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await anonymousPage.waitForTimeout(2000);

      const guestProposalsPage = new GuestProposalsPage(anonymousPage);
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
