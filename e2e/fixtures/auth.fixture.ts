/**
 * Authentication Fixtures for E2E Tests
 *
 * Provides authenticated browser contexts for different user types.
 * Handles login state persistence across tests.
 */

import { test as base, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import { SEED_USERS, TestUser } from './test-data-factory';

// ============================================================================
// FIXTURE TYPES
// ============================================================================

interface AuthFixtures {
  /** Page with guest user logged in */
  guestPage: Page;
  /** Page with host user logged in */
  hostPage: Page;
  /** Page with admin user logged in */
  adminPage: Page;
  /** Page with no authentication (anonymous) */
  anonymousPage: Page;
  /** Helper function to login as any user */
  loginAs: (page: Page, user: TestUser) => Promise<void>;
  /** Helper function to logout */
  logout: (page: Page) => Promise<void>;
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Performs login via the SignUpLoginModal
 */
async function performLogin(page: Page, email: string, password: string): Promise<void> {
  // Open the auth modal (usually via header menu)
  const menuButton = page.locator('.hamburger-menu, [aria-label="Toggle menu"]');
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }

  // Click sign in link
  const signInLink = page.locator('text=Sign In').first();
  if (await signInLink.isVisible()) {
    await signInLink.click();
  }

  // Wait for modal to open
  await page.waitForSelector('[data-testid="auth-modal"], .auth-modal, .signup-login-modal');

  // Fill in email
  await page.fill('[data-testid="email-input"], input[type="email"]', email);

  // Fill in password
  await page.fill('[data-testid="password-input"], input[type="password"]', password);

  // Submit the form
  await page.click('[data-testid="login-button"], button[type="submit"]');

  // Wait for login to complete
  await page.waitForTimeout(2000); // Allow time for auth to process
}

/**
 * Performs logout via the logged-in avatar menu
 */
async function performLogout(page: Page): Promise<void> {
  // Click the user avatar/menu
  const avatarButton = page.locator('.logged-in-avatar, [data-testid="user-avatar"]');
  if (await avatarButton.isVisible()) {
    await avatarButton.click();

    // Click logout option
    const logoutButton = page.locator('text=Log Out, text=Logout, [data-testid="logout-button"]');
    await logoutButton.click();

    // Wait for logout to complete
    await page.waitForTimeout(1000);
  }
}

/**
 * Sets up authentication state via localStorage/sessionStorage
 * (Alternative method for faster tests)
 */
async function setAuthState(
  page: Page,
  user: TestUser,
  token: string = 'test-auth-token'
): Promise<void> {
  await page.evaluate(
    ({ userId, userType, userEmail, authToken }) => {
      // Set auth token in secure storage (simplified for testing)
      localStorage.setItem('splitlease_auth_token', authToken);
      localStorage.setItem('splitlease_user_id', userId);
      localStorage.setItem('splitlease_user_type', userType);
      localStorage.setItem('splitlease_user_email', userEmail);

      // Set session storage as well
      sessionStorage.setItem('splitlease_session_active', 'true');
    },
    {
      userId: user.id,
      userType: user.userType,
      userEmail: user.email,
      authToken: token
    }
  );
}

/**
 * Clears authentication state
 */
async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('splitlease_auth_token');
    localStorage.removeItem('splitlease_user_id');
    localStorage.removeItem('splitlease_user_type');
    localStorage.removeItem('splitlease_user_email');
    sessionStorage.removeItem('splitlease_session_active');
  });
}

// ============================================================================
// EXTENDED TEST FIXTURE
// ============================================================================

export const test = base.extend<AuthFixtures>({
  /**
   * Page with guest user logged in
   */
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to home page first
    await page.goto('/');

    // Set auth state for guest user
    await setAuthState(page, SEED_USERS.guest);

    // Reload to apply auth state
    await page.reload();

    await use(page);

    // Cleanup
    await clearAuthState(page);
    await context.close();
  },

  /**
   * Page with host user logged in
   */
  hostPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to home page first
    await page.goto('/');

    // Set auth state for host user
    await setAuthState(page, SEED_USERS.host);

    // Reload to apply auth state
    await page.reload();

    await use(page);

    // Cleanup
    await clearAuthState(page);
    await context.close();
  },

  /**
   * Page with admin user logged in
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to home page first
    await page.goto('/');

    // Set auth state for admin user
    await setAuthState(page, SEED_USERS.admin);

    // Reload to apply auth state
    await page.reload();

    await use(page);

    // Cleanup
    await clearAuthState(page);
    await context.close();
  },

  /**
   * Page with no authentication
   */
  anonymousPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to home page first
    await page.goto('/');

    // Ensure no auth state
    await clearAuthState(page);

    await use(page);

    await context.close();
  },

  /**
   * Helper function to login as any user
   */
  loginAs: async ({}, use) => {
    const loginAs = async (page: Page, user: TestUser) => {
      await setAuthState(page, user);
      await page.reload();
    };

    await use(loginAs);
  },

  /**
   * Helper function to logout
   */
  logout: async ({}, use) => {
    const logout = async (page: Page) => {
      await clearAuthState(page);
      await page.reload();
    };

    await use(logout);
  }
});

export { expect };
export { performLogin, performLogout, setAuthState, clearAuthState };
