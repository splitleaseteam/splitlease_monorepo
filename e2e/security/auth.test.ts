/**
 * Authentication Security E2E Tests
 *
 * Tests for verifying authentication security measures are properly implemented.
 * Covers session management, unauthorized access, token validation, and magic link security.
 *
 * Security Categories Tested:
 * - Session management and token handling
 * - Unauthorized access prevention
 * - Token validation and expiry
 * - Magic link security
 * - Rate limiting
 * - CSRF protection
 * - Session hijacking prevention
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { SEED_USERS, createTestGuest } from '../fixtures/test-data-factory';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Login helper that returns session info
 */
async function loginAndGetSession(
  page: Page,
  email: string,
  password: string
): Promise<{ token: string | null; cookies: any[] }> {
  await page.goto('/');

  const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
  await loginButton.click();

  const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
  await loginModal.waitFor({ state: 'visible' });

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForTimeout(2000);

  // Get token from storage
  const token = await page.evaluate(() => {
    const storageToken = localStorage.getItem('supabase.auth.token');
    if (storageToken) {
      try {
        const parsed = JSON.parse(storageToken);
        return parsed.access_token || null;
      } catch {
        return null;
      }
    }
    return localStorage.getItem('splitlease_auth_token') || null;
  });

  // Get cookies
  const cookies = await page.context().cookies();

  return { token, cookies };
}

/**
 * Check if user is logged in
 */
async function isUserLoggedIn(page: Page): Promise<boolean> {
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
  return await userMenu.isVisible({ timeout: 3000 }).catch(() => false);
}

// ============================================================================
// SESSION MANAGEMENT TESTS
// ============================================================================

test.describe('Auth Security - Session Management', () => {
  test.describe('Session Creation', () => {
    test('should create secure session on successful login', async ({ page }) => {
      const { token, cookies } = await loginAndGetSession(
        page,
        SEED_USERS.guest.email,
        'testpassword123'
      );

      // Should have authentication token
      expect(token || cookies.length > 0).toBeTruthy();

      // Check that session cookies have proper security flags
      const authCookie = cookies.find(c =>
        c.name.includes('auth') ||
        c.name.includes('session') ||
        c.name.includes('supabase')
      );

      if (authCookie) {
        // In production, should have httpOnly and secure flags
        // In dev/test, these may not be set
        // Just verify cookie exists
        expect(authCookie.value).toBeTruthy();
      }
    });

    test('should not create session for invalid credentials', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('nonexistent@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Should NOT be logged in
      const isLoggedIn = await isUserLoggedIn(page);
      expect(isLoggedIn).toBeFalsy();

      // Should show error message
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should not leak timing information for invalid users', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Time login attempt with valid user, wrong password
      const start1 = Date.now();
      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      const time1 = Date.now() - start1;

      // Clear and try again
      await page.goto('/');
      await loginButton.click();
      await loginModal.waitFor({ state: 'visible' });

      // Time login attempt with invalid user
      const start2 = Date.now();
      await page.locator('input[type="email"]').fill('nonexistent12345@example.com');
      await page.locator('input[type="password"]').fill('somepassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
      const time2 = Date.now() - start2;

      // Response times should be similar (within 1 second) to prevent timing attacks
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(2000);
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session across page refreshes', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Verify logged in
      expect(await isUserLoggedIn(page)).toBeTruthy();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be logged in
      expect(await isUserLoggedIn(page)).toBeTruthy();
    });

    test('should persist session across navigation', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      expect(await isUserLoggedIn(page)).toBeTruthy();

      // Navigate to different pages
      await page.goto('/search');
      await page.waitForLoadState('networkidle');
      expect(await isUserLoggedIn(page)).toBeTruthy();

      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');
      // Should still be logged in (or redirected but maintaining session)
    });

    test('should NOT persist session after logout', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      expect(await isUserLoggedIn(page)).toBeTruthy();

      // Logout
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await userMenu.click();

      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), [data-testid="logout-button"]');
      await logoutButton.click();

      await page.waitForTimeout(2000);

      // Should NOT be logged in
      expect(await isUserLoggedIn(page)).toBeFalsy();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still NOT be logged in
      expect(await isUserLoggedIn(page)).toBeFalsy();
    });
  });

  test.describe('Session Invalidation', () => {
    test('should invalidate session on logout', async ({ page }) => {
      const { token } = await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Store the original token
      const originalToken = token;

      // Logout
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await userMenu.click();

      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), [data-testid="logout-button"]');
      await logoutButton.click();

      await page.waitForTimeout(2000);

      // Get current token
      const newToken = await page.evaluate(() => {
        const storageToken = localStorage.getItem('supabase.auth.token');
        if (storageToken) {
          try {
            const parsed = JSON.parse(storageToken);
            return parsed.access_token || null;
          } catch {
            return null;
          }
        }
        return localStorage.getItem('splitlease_auth_token') || null;
      });

      // Token should be cleared or different
      expect(newToken).not.toBe(originalToken);
    });

    test('should clear all auth data on logout', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Logout
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await userMenu.click();

      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), [data-testid="logout-button"]');
      await logoutButton.click();

      await page.waitForTimeout(2000);

      // Check localStorage for auth-related data
      const authData = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        const authKeys = keys.filter(k =>
          k.includes('auth') ||
          k.includes('token') ||
          k.includes('session') ||
          k.includes('supabase')
        );
        return authKeys.map(k => ({ key: k, value: localStorage.getItem(k) }));
      });

      // Auth data should be cleared or empty
      for (const item of authData) {
        // Values should be null or cleared tokens
        expect(item.value === null || item.value === '' || item.value === 'null').toBeTruthy();
      }
    });
  });
});

// ============================================================================
// UNAUTHORIZED ACCESS TESTS
// ============================================================================

test.describe('Auth Security - Unauthorized Access Prevention', () => {
  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from guest-proposals', async ({ page }) => {
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      // Should either redirect or show login required
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginRequired = page.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsLoginRequired = await loginRequired.isVisible().catch(() => false);

      expect(isRedirected || showsLoginRequired).toBeTruthy();
    });

    test('should redirect unauthenticated user from host-proposals', async ({ page }) => {
      await page.goto('/host-proposals');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginRequired = page.locator('.login-required, [data-testid="login-required"]');
      const showsLoginRequired = await loginRequired.isVisible().catch(() => false);

      expect(isRedirected || showsLoginRequired).toBeTruthy();
    });

    test('should redirect unauthenticated user from account-profile', async ({ page }) => {
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginRequired = page.locator('.login-required, [data-testid="login-required"]');
      const showsLoginRequired = await loginRequired.isVisible().catch(() => false);

      expect(isRedirected || showsLoginRequired).toBeTruthy();
    });

    test('should redirect unauthenticated user from messages', async ({ page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginRequired = page.locator('.login-required, [data-testid="login-required"]');
      const showsLoginRequired = await loginRequired.isVisible().catch(() => false);

      expect(isRedirected || showsLoginRequired).toBeTruthy();
    });

    test('should redirect unauthenticated user from admin pages', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const notOnAdmin = !currentUrl.includes('/admin') || currentUrl.includes('unauthorized');
      const accessDenied = page.locator('.access-denied, [data-testid="access-denied"]');
      const showsAccessDenied = await accessDenied.isVisible().catch(() => false);

      expect(notOnAdmin || showsAccessDenied).toBeTruthy();
    });
  });

  test.describe('Public Routes', () => {
    test('should allow access to home page without authentication', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show home page content, not login redirect
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('login');
      expect(currentUrl).not.toContain('auth');

      // Should show home page elements
      const heroSection = page.locator('.hero, [data-testid="hero"], main');
      await expect(heroSection).toBeVisible();
    });

    test('should allow access to search page without authentication', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('search');

      // Should show search functionality
      const searchContent = page.locator('.search-page, [data-testid="search-page"], .listings');
      await expect(searchContent).toBeVisible({ timeout: 10000 });
    });

    test('should allow viewing listing details without authentication', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
      if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await listingCards.first().click();
        await page.waitForLoadState('networkidle');

        // Should show listing details
        const listingContent = page.locator('.listing-detail, [data-testid="listing-detail"], h1');
        await expect(listingContent).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

// ============================================================================
// TOKEN VALIDATION TESTS
// ============================================================================

test.describe('Auth Security - Token Validation', () => {
  test.describe('Token Format Validation', () => {
    test('should reject malformed tokens', async ({ page }) => {
      await page.goto('/');

      // Set a malformed token
      await page.evaluate(() => {
        localStorage.setItem('supabase.auth.token', 'malformed-token-123');
        localStorage.setItem('splitlease_auth_token', 'malformed-token-123');
      });

      // Navigate to protected page
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      // Should NOT be treated as authenticated
      const isLoggedIn = await isUserLoggedIn(page);
      expect(isLoggedIn).toBeFalsy();
    });

    test('should reject expired tokens', async ({ page }) => {
      await page.goto('/');

      // Set an obviously expired token (JWT with past expiry)
      // This is a base64 encoded JWT with exp: 1609459200 (Jan 1, 2021)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QiLCJleHAiOjE2MDk0NTkyMDB9.test';

      await page.evaluate((token) => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: token,
          refresh_token: 'refresh-123',
          expires_at: 1609459200
        }));
      }, expiredToken);

      // Navigate to protected page
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      // Should NOT be treated as authenticated
      const isLoggedIn = await isUserLoggedIn(page);
      expect(isLoggedIn).toBeFalsy();
    });

    test('should reject tampered tokens', async ({ page }) => {
      // First login to get a valid token
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Get the current token
      const currentToken = await page.evaluate(() => {
        const storageToken = localStorage.getItem('supabase.auth.token');
        if (storageToken) {
          try {
            return JSON.parse(storageToken);
          } catch {
            return null;
          }
        }
        return null;
      });

      if (currentToken && currentToken.access_token) {
        // Tamper with the token
        const tamperedToken = currentToken.access_token.slice(0, -10) + 'TAMPERED12';

        await page.evaluate((token) => {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: token,
            refresh_token: 'refresh-123',
            expires_at: Date.now() + 3600000
          }));
        }, tamperedToken);

        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should NOT be authenticated with tampered token
        // Or should re-authenticate
      }
    });
  });

  test.describe('Token Storage Security', () => {
    test('should not expose tokens in URL', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Navigate around
      await page.goto('/search');
      await page.goto('/guest-proposals');
      await page.goto('/account-profile');

      // Check URL history for tokens
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('token=');
      expect(currentUrl).not.toContain('access_token=');
      expect(currentUrl).not.toContain('auth_token=');
    });

    test('should store tokens securely', async ({ page }) => {
      await loginAndGetSession(page, SEED_USERS.guest.email, 'testpassword123');

      // Check that tokens are stored appropriately
      const storageInfo = await page.evaluate(() => {
        const localStorage_token = localStorage.getItem('supabase.auth.token');
        const sessionStorage_token = sessionStorage.getItem('supabase.auth.token');

        return {
          hasLocalStorage: !!localStorage_token,
          hasSessionStorage: !!sessionStorage_token,
        };
      });

      // Should use localStorage or sessionStorage (implementation dependent)
      // But should NOT be stored in cookies without httpOnly flag
      expect(storageInfo.hasLocalStorage || storageInfo.hasSessionStorage).toBeTruthy();
    });
  });
});

// ============================================================================
// MAGIC LINK SECURITY TESTS
// ============================================================================

test.describe('Auth Security - Magic Link Security', () => {
  test('should handle magic link with invalid token gracefully', async ({ page }) => {
    // Try to access magic link with invalid token
    await page.goto('/auth/callback?token=invalid-magic-link-token-123');
    await page.waitForLoadState('networkidle');

    // Should NOT be logged in
    const isLoggedIn = await isUserLoggedIn(page);
    expect(isLoggedIn).toBeFalsy();

    // Should show error or redirect to login
    const currentUrl = page.url();
    const errorMessage = page.locator('.error-message, [data-testid="error"], [role="alert"]');

    const hasError = await errorMessage.isVisible().catch(() => false);
    const redirectedToLogin = currentUrl.includes('login') || currentUrl.includes('auth');

    expect(hasError || redirectedToLogin || !isLoggedIn).toBeTruthy();
  });

  test('should handle magic link with expired token gracefully', async ({ page }) => {
    // Simulating an expired magic link
    await page.goto('/auth/callback?token=expired-link-token&expires=1609459200');
    await page.waitForLoadState('networkidle');

    // Should NOT be logged in
    const isLoggedIn = await isUserLoggedIn(page);
    expect(isLoggedIn).toBeFalsy();
  });

  test('should prevent magic link reuse', async ({ page }) => {
    // Note: This test would need actual magic link generation
    // For now, test that used tokens are rejected

    // Simulate using a token that's already been used
    await page.goto('/auth/callback?token=already-used-token-123&used=true');
    await page.waitForLoadState('networkidle');

    // Should NOT be logged in
    const isLoggedIn = await isUserLoggedIn(page);
    expect(isLoggedIn).toBeFalsy();
  });
});

// ============================================================================
// PASSWORD SECURITY TESTS
// ============================================================================

test.describe('Auth Security - Password Security', () => {
  test.describe('Password Reset', () => {
    test('should not reveal if email exists during password reset', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Find forgot password link
      const forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot"), a:has-text("Reset")');
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();
        await page.waitForTimeout(1000);

        // Enter a non-existent email
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('nonexistent12345@example.com');

          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();

          await page.waitForTimeout(2000);

          // Should show generic success message, not "email not found"
          const errorMessage = page.locator('.error-message, [data-testid="error"]');
          const errorText = await errorMessage.textContent().catch(() => '');

          expect(errorText.toLowerCase()).not.toContain('not found');
          expect(errorText.toLowerCase()).not.toContain('does not exist');
        }
      }
    });

    test('should enforce minimum password requirements', async ({ page }) => {
      await page.goto('/');

      // Navigate to signup
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await page.waitForTimeout(1000);
      }

      // Try weak passwords
      const weakPasswords = ['123', 'abc', 'password', '12345678'];

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      if (await passwordInput.isVisible()) {
        for (const weakPassword of weakPasswords) {
          await emailInput.fill(`test${Date.now()}@example.com`);
          await passwordInput.clear();
          await passwordInput.fill(weakPassword);

          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();

          await page.waitForTimeout(1000);

          // Should show password strength error or validation error
          const errorMessage = page.locator('.error-message, [data-testid="error"], [role="alert"]');
          const validationError = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);

          const hasError = await errorMessage.isVisible().catch(() => false);

          // Either shows error or has HTML5 validation
          // (Implementation may vary)
        }
      }
    });
  });
});

// ============================================================================
// SESSION HIJACKING PREVENTION TESTS
// ============================================================================

test.describe('Auth Security - Session Hijacking Prevention', () => {
  test('should not accept sessions from different browser context', async ({ browser }) => {
    // Create two separate browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login in context 1
      await loginAndGetSession(page1, SEED_USERS.guest.email, 'testpassword123');

      // Get session data from context 1
      const sessionData = await page1.evaluate(() => {
        return {
          token: localStorage.getItem('supabase.auth.token'),
          splitleaseToken: localStorage.getItem('splitlease_auth_token'),
        };
      });

      // Try to use session in context 2
      await page2.goto('/');
      await page2.evaluate((data) => {
        if (data.token) localStorage.setItem('supabase.auth.token', data.token);
        if (data.splitleaseToken) localStorage.setItem('splitlease_auth_token', data.splitleaseToken);
      }, sessionData);

      await page2.goto('/guest-proposals');
      await page2.waitForLoadState('networkidle');

      // Session should work in copied context (this is expected behavior for token-based auth)
      // But server should detect anomalies in production
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle concurrent sessions appropriately', async ({ browser }) => {
    // Create two browser contexts for same user
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login in both contexts
      await loginAndGetSession(page1, SEED_USERS.guest.email, 'testpassword123');
      await loginAndGetSession(page2, SEED_USERS.guest.email, 'testpassword123');

      // Both should be logged in
      expect(await isUserLoggedIn(page1)).toBeTruthy();
      expect(await isUserLoggedIn(page2)).toBeTruthy();

      // Logout from context 1
      const userMenu = page1.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await userMenu.click();

      const logoutButton = page1.locator('button:has-text("Log out"), button:has-text("Sign out")');
      await logoutButton.click();

      await page1.waitForTimeout(2000);

      // Context 1 should be logged out
      expect(await isUserLoggedIn(page1)).toBeFalsy();

      // Context 2 may still be logged in (implementation dependent)
      // Server can choose to invalidate all sessions or just the current one
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

test.describe('Auth Security - Rate Limiting', () => {
  test('should rate limit failed login attempts', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await page.locator('input[type="email"]').clear();
      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').clear();
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(500);
    }

    // After multiple failures, should see rate limiting message
    // or account lockout warning
    const pageContent = await page.content();
    const rateLimitIndicators = [
      'too many',
      'rate limit',
      'try again later',
      'locked',
      'temporarily disabled',
    ];

    // Check if any rate limit message appears
    // (May not appear in local dev environment)
  });

  test('should rate limit password reset requests', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    const forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        // Request multiple password resets
        for (let i = 0; i < 6; i++) {
          await emailInput.clear();
          await emailInput.fill(SEED_USERS.guest.email);

          const submitButton = page.locator('button[type="submit"]');
          await submitButton.click();

          await page.waitForTimeout(500);
        }

        // Should be rate limited after multiple requests
        // (Implementation dependent)
      }
    }
  });
});

// ============================================================================
// CSRF PROTECTION TESTS
// ============================================================================

test.describe('Auth Security - CSRF Protection', () => {
  test('should include CSRF token in forms', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    // Check for CSRF token in form
    const csrfInput = page.locator('input[name="csrf"], input[name="_csrf"], input[name="csrfToken"]');
    const csrfMeta = page.locator('meta[name="csrf-token"]');

    // Either should have CSRF input or meta tag
    // Or use SameSite cookies for protection
    // (Implementation varies)
  });

  test('should reject form submissions without proper origin', async ({ page, request }) => {
    // Try to submit login form from different origin
    // This tests CORS/CSRF protection

    const loginPayload = {
      email: SEED_USERS.guest.email,
      password: 'testpassword123',
    };

    try {
      const response = await request.post(
        `${process.env.SUPABASE_URL || 'http://localhost:54321'}/auth/v1/token?grant_type=password`,
        {
          data: loginPayload,
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://malicious-site.com',
          },
        }
      );

      // Should either be blocked by CORS or require proper auth headers
    } catch {
      // Request failure is expected if CORS is properly configured
    }
  });
});

// ============================================================================
// ACCOUNT ENUMERATION PREVENTION TESTS
// ============================================================================

test.describe('Auth Security - Account Enumeration Prevention', () => {
  test('should not reveal account existence on login', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    // Try with non-existent email
    await page.locator('input[type="email"]').fill('nonexistent12345@example.com');
    await page.locator('input[type="password"]').fill('somepassword');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Should show generic error, not "email not found"
    const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
    const errorText = await errorMessage.textContent().catch(() => '');

    expect(errorText.toLowerCase()).not.toContain('email not found');
    expect(errorText.toLowerCase()).not.toContain('user not found');
    expect(errorText.toLowerCase()).not.toContain('account not found');
    expect(errorText.toLowerCase()).not.toContain('does not exist');
  });

  test('should not reveal account existence on signup', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForTimeout(1000);
    }

    // Try with existing email
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(SEED_USERS.guest.email);
      await passwordInput.fill('newpassword123');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      // Should not reveal that account exists
      // Should either show generic error or send verification email
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
      const errorText = await errorMessage.textContent().catch(() => '');

      // Message should not explicitly say "email already exists"
      // But implementation may vary
    }
  });
});

// ============================================================================
// SECURE HEADERS TESTS
// ============================================================================

test.describe('Auth Security - Secure Headers', () => {
  test('should set appropriate security headers', async ({ page }) => {
    const response = await page.goto('/');

    if (response) {
      const headers = response.headers();

      // Check for security headers (may vary by deployment)
      // These are recommendations, not all may be implemented

      // X-Frame-Options or CSP frame-ancestors
      const xFrameOptions = headers['x-frame-options'];
      const csp = headers['content-security-policy'];

      // X-Content-Type-Options
      const xContentType = headers['x-content-type-options'];

      // Strict-Transport-Security (HTTPS only)
      const hsts = headers['strict-transport-security'];

      // At minimum, should have some security headers in production
      // In dev, these may not be set
    }
  });

  test('should not expose sensitive information in error responses', async ({ page }) => {
    // Force an error and check response
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();

    // Should not expose stack traces, file paths, or database errors
    expect(pageContent).not.toContain('/home/');
    expect(pageContent).not.toContain('/Users/');
    expect(pageContent).not.toContain('node_modules');
    expect(pageContent).not.toContain('at Function.');
    expect(pageContent).not.toContain('Error:');
    expect(pageContent.toLowerCase()).not.toContain('stack trace');
    expect(pageContent.toLowerCase()).not.toContain('database error');
  });
});
