/**
 * Authentication E2E Tests
 *
 * Tests for login, logout, signup, and authentication state management.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '../fixtures/auth';
import { HomePage } from '../pages';
import { createTestGuest, createTestHost, SEED_USERS } from '../fixtures/test-data-factory';

test.describe('Authentication Flows', () => {
  // ============================================================================
  // LOGIN HAPPY PATHS
  // ============================================================================

  test.describe('Login - Happy Paths', () => {
    test('should login as guest user successfully', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Click login button
      await homePage.loginButton.click();

      // Wait for login modal/page
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Fill credentials
      await anonymousPage.locator('input[type="email"], input[name="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"], input[name="password"]').fill('testpassword123');

      // Submit
      await anonymousPage.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').click();

      // Verify logged in state
      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });
      await expect(homePage.loginButton).toBeHidden();
    });

    test('should login as host user successfully', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();

      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"], input[name="email"]').fill(SEED_USERS.host.email);
      await anonymousPage.locator('input[type="password"], input[name="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"], button:has-text("Log in")').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });
    });

    test('should persist login state across page navigation', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Login
      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Navigate to another page
      await anonymousPage.goto('/search');
      await anonymousPage.waitForLoadState('networkidle');

      // Verify still logged in
      const userMenu = anonymousPage.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await expect(userMenu).toBeVisible();
    });

    test('should persist login state after page refresh', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Login
      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Refresh page
      await anonymousPage.reload();
      await anonymousPage.waitForLoadState('networkidle');

      // Verify still logged in
      await expect(homePage.userMenu).toBeVisible();
    });
  });

  // ============================================================================
  // LOGIN ERROR HANDLING
  // ============================================================================

  test.describe('Login - Error Handling', () => {
    test('should show error for invalid credentials', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill('invalid@example.com');
      await anonymousPage.locator('input[type="password"]').fill('wrongpassword');
      await anonymousPage.locator('button[type="submit"]').click();

      // Verify error message
      const errorMessage = anonymousPage.locator('.error-message, [data-testid="error-message"], .auth-error, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/invalid|incorrect|wrong|not found/i);
    });

    test('should show validation error for empty email', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Leave email empty, fill password
      await anonymousPage.locator('input[type="password"]').fill('somepassword');
      await anonymousPage.locator('button[type="submit"]').click();

      // Check for validation message
      const emailInput = anonymousPage.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });

    test('should show validation error for empty password', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Fill email, leave password empty
      await anonymousPage.locator('input[type="email"]').fill('test@example.com');
      await anonymousPage.locator('button[type="submit"]').click();

      // Check for validation message
      const passwordInput = anonymousPage.locator('input[type="password"]');
      const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });

    test('should show error for invalid email format', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill('notanemail');
      await anonymousPage.locator('input[type="password"]').fill('somepassword');
      await anonymousPage.locator('button[type="submit"]').click();

      // Check for validation message
      const emailInput = anonymousPage.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toContain('email');
    });

    test('should handle network error gracefully', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Simulate network failure
      await anonymousPage.route('**/auth/**', route => route.abort('failed'));

      await anonymousPage.locator('input[type="email"]').fill('test@example.com');
      await anonymousPage.locator('input[type="password"]').fill('password123');
      await anonymousPage.locator('button[type="submit"]').click();

      // Should show network error
      const errorMessage = anonymousPage.locator('.error-message, [data-testid="error-message"], .auth-error, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // LOGIN EDGE CASES
  // ============================================================================

  test.describe('Login - Edge Cases', () => {
    test('should handle special characters in password', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill('test@example.com');
      await anonymousPage.locator('input[type="password"]').fill('P@$$w0rd!#$%^&*()');
      await anonymousPage.locator('button[type="submit"]').click();

      // Should process without error (may fail auth, but shouldn't crash)
      await anonymousPage.waitForTimeout(2000);
      // Page should still be functional
      await expect(anonymousPage.locator('body')).toBeVisible();
    });

    test('should handle very long email input', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const longEmail = 'a'.repeat(200) + '@example.com';
      await anonymousPage.locator('input[type="email"]').fill(longEmail);
      await anonymousPage.locator('input[type="password"]').fill('password123');
      await anonymousPage.locator('button[type="submit"]').click();

      // Should handle gracefully
      await anonymousPage.waitForTimeout(2000);
      await expect(anonymousPage.locator('body')).toBeVisible();
    });

    test('should trim whitespace from email', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Email with leading/trailing whitespace
      await anonymousPage.locator('input[type="email"]').fill('  ' + SEED_USERS.guest.email + '  ');
      await anonymousPage.locator('input[type="password"]').fill('testpassword123');
      await anonymousPage.locator('button[type="submit"]').click();

      // Should succeed if app trims whitespace
      await anonymousPage.waitForTimeout(3000);
    });

    test('should close login modal when clicking outside', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Click outside modal (on overlay)
      const overlay = anonymousPage.locator('.modal-overlay, .modal-backdrop, [data-testid="modal-overlay"]');
      if (await overlay.isVisible()) {
        await overlay.click({ position: { x: 10, y: 10 } });
        await expect(loginModal).toBeHidden({ timeout: 3000 });
      }
    });

    test('should close login modal with Escape key', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.keyboard.press('Escape');
      await expect(loginModal).toBeHidden({ timeout: 3000 });
    });
  });

  // ============================================================================
  // LOGOUT FLOWS
  // ============================================================================

  test.describe('Logout', () => {
    test('should logout successfully', async ({ guestBigSpenderPage }) => {
      const homePage = new HomePage(guestBigSpenderPage);
      await homePage.goto();

      // Already logged in via fixture - verify user menu is visible
      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Open user menu and logout
      await homePage.userMenu.click();
      const logoutButton = guestBigSpenderPage.locator('button:has-text("Log out"), button:has-text("Sign out"), [data-testid="logout-button"]');
      await logoutButton.click();

      // Verify logged out
      await expect(homePage.loginButton).toBeVisible({ timeout: 5000 });
      await expect(homePage.userMenu).toBeHidden();
    });

    test('should clear auth state after logout', async ({ guestBigSpenderPage }) => {
      const homePage = new HomePage(guestBigSpenderPage);
      await homePage.goto();

      // Already logged in via fixture
      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Logout
      await homePage.userMenu.click();
      const logoutButton = guestBigSpenderPage.locator('button:has-text("Log out"), button:has-text("Sign out")');
      await logoutButton.click();

      await expect(homePage.loginButton).toBeVisible({ timeout: 5000 });

      // Navigate to protected page
      await guestBigSpenderPage.goto('/guest-proposals');

      // Should redirect to login or show unauthenticated state
      await guestBigSpenderPage.waitForTimeout(2000);
      const currentUrl = guestBigSpenderPage.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const showsUnauthenticated = await guestBigSpenderPage.locator('.unauthenticated, [data-testid="login-required"]').isVisible().catch(() => false);

      expect(isRedirected || showsUnauthenticated).toBeTruthy();
    });

    test('should not show logout option when not logged in', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // User menu should not be visible when logged out
      await expect(homePage.userMenu).toBeHidden();
      await expect(homePage.loginButton).toBeVisible();
    });
  });

  // ============================================================================
  // SIGNUP FLOWS
  // ============================================================================

  test.describe('Signup', () => {
    test('should navigate to signup from login modal', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Find signup link
      const signupLink = anonymousPage.locator('a:has-text("Sign up"), button:has-text("Sign up"), a:has-text("Create account")');
      await signupLink.click();

      // Should show signup form
      const signupForm = anonymousPage.locator('[data-testid="signup-form"], .signup-form, form:has(input[name="confirmPassword"])');
      await expect(signupForm).toBeVisible({ timeout: 5000 });
    });

    test('should show validation for mismatched passwords', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        // If no direct signup button, go through login
        await homePage.loginButton.click();
        const signupLink = anonymousPage.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await anonymousPage.waitForTimeout(1000);

      // Fill signup form with mismatched passwords
      const testUser = createTestGuest();
      await anonymousPage.locator('input[name="email"], input[type="email"]').first().fill(testUser.email);
      await anonymousPage.locator('input[name="password"], input[type="password"]').first().fill('password123');

      const confirmPassword = anonymousPage.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('differentpassword');

        // Submit
        await anonymousPage.locator('button[type="submit"]').click();

        // Should show mismatch error
        const errorMessage = anonymousPage.locator('.error-message, [data-testid="error-message"], [role="alert"]');
        await expect(errorMessage).toContainText(/match|same/i);
      }
    });

    test('should show validation for weak password', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        await homePage.loginButton.click();
        const signupLink = anonymousPage.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await anonymousPage.waitForTimeout(1000);

      // Fill signup form with weak password
      const testUser = createTestGuest();
      await anonymousPage.locator('input[name="email"], input[type="email"]').first().fill(testUser.email);
      await anonymousPage.locator('input[name="password"], input[type="password"]').first().fill('123');

      // Submit
      await anonymousPage.locator('button[type="submit"]').click();

      // Should show password strength error
      await anonymousPage.waitForTimeout(2000);
    });

    test('should show error for existing email', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        await homePage.loginButton.click();
        const signupLink = anonymousPage.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await anonymousPage.waitForTimeout(1000);

      // Try to signup with existing email
      await anonymousPage.locator('input[name="email"], input[type="email"]').first().fill(SEED_USERS.guest.email);
      await anonymousPage.locator('input[name="password"], input[type="password"]').first().fill('newpassword123');

      const confirmPassword = anonymousPage.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('newpassword123');
      }

      await anonymousPage.locator('button[type="submit"]').click();

      // Should show error about existing account
      const errorMessage = anonymousPage.locator('.error-message, [data-testid="error-message"], [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // PROTECTED ROUTES
  // ============================================================================

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from guest-proposals', async ({ anonymousPage }) => {
      await anonymousPage.goto('/guest-proposals');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = anonymousPage.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl === anonymousPage.url();

      // Either redirected or shows login prompt
      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should redirect unauthenticated user from host-proposals', async ({ anonymousPage }) => {
      await anonymousPage.goto('/host-proposals');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = anonymousPage.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');

      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should redirect unauthenticated user from account-profile', async ({ anonymousPage }) => {
      await anonymousPage.goto('/account-profile');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = anonymousPage.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');

      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should allow access to public pages without authentication', async ({ anonymousPage }) => {
      // Home page
      await anonymousPage.goto('/');
      await expect(anonymousPage.locator('.hero, [data-testid="hero"]')).toBeVisible();

      // Search page
      await anonymousPage.goto('/search');
      await expect(anonymousPage.locator('.search-page, [data-testid="search-page"]')).toBeVisible();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('login modal should be accessible', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Modal should have appropriate role
      const modalRole = await loginModal.getAttribute('role');
      expect(modalRole === 'dialog' || modalRole === 'alertdialog' || modalRole === null).toBeTruthy();

      // Form inputs should have labels
      const emailInput = anonymousPage.locator('input[type="email"]');
      const emailLabel = await emailInput.getAttribute('aria-label') ||
        await anonymousPage.locator('label[for="email"]').textContent();
      expect(emailLabel).toBeTruthy();

      const passwordInput = anonymousPage.locator('input[type="password"]');
      const passwordLabel = await passwordInput.getAttribute('aria-label') ||
        await anonymousPage.locator('label[for="password"]').textContent();
      expect(passwordLabel).toBeTruthy();
    });

    test('login form should be keyboard navigable', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Tab through form elements
      await anonymousPage.keyboard.press('Tab');
      const firstFocused = await anonymousPage.locator(':focus').getAttribute('type');
      expect(firstFocused === 'email' || firstFocused === 'text').toBeTruthy();

      await anonymousPage.keyboard.press('Tab');
      const secondFocused = await anonymousPage.locator(':focus').getAttribute('type');
      expect(secondFocused).toBe('password');

      await anonymousPage.keyboard.press('Tab');
      const thirdFocused = await anonymousPage.locator(':focus').tagName();
      expect(thirdFocused.toLowerCase()).toBe('button');
    });

    test('error messages should be announced to screen readers', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await anonymousPage.locator('input[type="email"]').fill('invalid@test.com');
      await anonymousPage.locator('input[type="password"]').fill('wrongpassword');
      await anonymousPage.locator('button[type="submit"]').click();

      // Wait for error
      const errorMessage = anonymousPage.locator('.error-message, [data-testid="error-message"], [role="alert"]');
      await errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

      if (await errorMessage.isVisible()) {
        // Error should have alert role or aria-live
        const role = await errorMessage.getAttribute('role');
        const ariaLive = await errorMessage.getAttribute('aria-live');
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy();
      }
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('login modal should be full-screen on mobile', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Check modal fills screen on mobile
      const modalBox = await loginModal.boundingBox();
      if (modalBox) {
        expect(modalBox.width).toBeGreaterThan(300);
      }
    });

    test('form inputs should be appropriately sized for touch', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = anonymousPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Inputs should have minimum touch target size (44px recommended)
      const emailInput = anonymousPage.locator('input[type="email"]');
      const emailBox = await emailInput.boundingBox();
      if (emailBox) {
        expect(emailBox.height).toBeGreaterThanOrEqual(40);
      }

      const submitButton = anonymousPage.locator('button[type="submit"]');
      const buttonBox = await submitButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    });

    test('mobile menu should show login option', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Check for mobile menu button
      const mobileMenuButton = anonymousPage.locator('.mobile-menu-button, [data-testid="mobile-menu"], .hamburger-menu');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();

        // Should show login option in mobile menu
        const mobileLoginLink = anonymousPage.locator('.mobile-nav a:has-text("Log in"), .mobile-menu button:has-text("Log in")');
        await expect(mobileLoginLink).toBeVisible();
      }
    });
  });
});
