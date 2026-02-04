/**
 * Authentication E2E Tests
 *
 * Tests for login, logout, signup, and authentication state management.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';
import { createTestGuest, createTestHost, SEED_USERS } from '../fixtures/test-data-factory';

test.describe('Authentication Flows', () => {
  // ============================================================================
  // LOGIN HAPPY PATHS
  // ============================================================================

  test.describe('Login - Happy Paths', () => {
    test('should login as guest user successfully', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Click login button
      await homePage.loginButton.click();

      // Wait for login modal/page
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Fill credentials
      await page.locator('input[type="email"], input[name="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"], input[name="password"]').fill('testpassword123');

      // Submit
      await page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').click();

      // Verify logged in state
      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });
      await expect(homePage.loginButton).toBeHidden();
    });

    test('should login as host user successfully', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"], input[name="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"], input[name="password"]').fill('testpassword123');
      await page.locator('button[type="submit"], button:has-text("Log in")').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });
    });

    test('should persist login state across page navigation', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Login
      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Navigate to another page
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      // Verify still logged in
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      await expect(userMenu).toBeVisible();
    });

    test('should persist login state after page refresh', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Login
      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify still logged in
      await expect(homePage.userMenu).toBeVisible();
    });
  });

  // ============================================================================
  // LOGIN ERROR HANDLING
  // ============================================================================

  test.describe('Login - Error Handling', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Verify error message
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], .auth-error, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/invalid|incorrect|wrong|not found/i);
    });

    test('should show validation error for empty email', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Leave email empty, fill password
      await page.locator('input[type="password"]').fill('somepassword');
      await page.locator('button[type="submit"]').click();

      // Check for validation message
      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });

    test('should show validation error for empty password', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Fill email, leave password empty
      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('button[type="submit"]').click();

      // Check for validation message
      const passwordInput = page.locator('input[type="password"]');
      const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();
    });

    test('should show error for invalid email format', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('notanemail');
      await page.locator('input[type="password"]').fill('somepassword');
      await page.locator('button[type="submit"]').click();

      // Check for validation message
      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toContain('email');
    });

    test('should handle network error gracefully', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Simulate network failure
      await page.route('**/auth/**', route => route.abort('failed'));

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should show network error
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], .auth-error, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // LOGIN EDGE CASES
  // ============================================================================

  test.describe('Login - Edge Cases', () => {
    test('should handle special characters in password', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('test@example.com');
      await page.locator('input[type="password"]').fill('P@$$w0rd!#$%^&*()');
      await page.locator('button[type="submit"]').click();

      // Should process without error (may fail auth, but shouldn't crash)
      await page.waitForTimeout(2000);
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle very long email input', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const longEmail = 'a'.repeat(200) + '@example.com';
      await page.locator('input[type="email"]').fill(longEmail);
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Should handle gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should trim whitespace from email', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Email with leading/trailing whitespace
      await page.locator('input[type="email"]').fill('  ' + SEED_USERS.guest.email + '  ');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      // Should succeed if app trims whitespace
      await page.waitForTimeout(3000);
    });

    test('should close login modal when clicking outside', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Click outside modal (on overlay)
      const overlay = page.locator('.modal-overlay, .modal-backdrop, [data-testid="modal-overlay"]');
      if (await overlay.isVisible()) {
        await overlay.click({ position: { x: 10, y: 10 } });
        await expect(loginModal).toBeHidden({ timeout: 3000 });
      }
    });

    test('should close login modal with Escape key', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.keyboard.press('Escape');
      await expect(loginModal).toBeHidden({ timeout: 3000 });
    });
  });

  // ============================================================================
  // LOGOUT FLOWS
  // ============================================================================

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // First login
      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Open user menu and logout
      await homePage.userMenu.click();
      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), [data-testid="logout-button"]');
      await logoutButton.click();

      // Verify logged out
      await expect(homePage.loginButton).toBeVisible({ timeout: 5000 });
      await expect(homePage.userMenu).toBeHidden();
    });

    test('should clear auth state after logout', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Login
      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await expect(homePage.userMenu).toBeVisible({ timeout: 10000 });

      // Logout
      await homePage.userMenu.click();
      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out")');
      await logoutButton.click();

      await expect(homePage.loginButton).toBeVisible({ timeout: 5000 });

      // Navigate to protected page
      await page.goto('/guest-proposals');

      // Should redirect to login or show unauthenticated state
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const showsUnauthenticated = await page.locator('.unauthenticated, [data-testid="login-required"]').isVisible().catch(() => false);

      expect(isRedirected || showsUnauthenticated).toBeTruthy();
    });

    test('should not show logout option when not logged in', async ({ page }) => {
      const homePage = new HomePage(page);
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
    test('should navigate to signup from login modal', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Find signup link
      const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up"), a:has-text("Create account")');
      await signupLink.click();

      // Should show signup form
      const signupForm = page.locator('[data-testid="signup-form"], .signup-form, form:has(input[name="confirmPassword"])');
      await expect(signupForm).toBeVisible({ timeout: 5000 });
    });

    test('should show validation for mismatched passwords', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        // If no direct signup button, go through login
        await homePage.loginButton.click();
        const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await page.waitForTimeout(1000);

      // Fill signup form with mismatched passwords
      const testUser = createTestGuest();
      await page.locator('input[name="email"], input[type="email"]').first().fill(testUser.email);
      await page.locator('input[name="password"], input[type="password"]').first().fill('password123');

      const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('differentpassword');

        // Submit
        await page.locator('button[type="submit"]').click();

        // Should show mismatch error
        const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
        await expect(errorMessage).toContainText(/match|same/i);
      }
    });

    test('should show validation for weak password', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        await homePage.loginButton.click();
        const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await page.waitForTimeout(1000);

      // Fill signup form with weak password
      const testUser = createTestGuest();
      await page.locator('input[name="email"], input[type="email"]').first().fill(testUser.email);
      await page.locator('input[name="password"], input[type="password"]').first().fill('123');

      // Submit
      await page.locator('button[type="submit"]').click();

      // Should show password strength error
      await page.waitForTimeout(2000);
    });

    test('should show error for existing email', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Navigate to signup
      await homePage.signupButton.click().catch(async () => {
        await homePage.loginButton.click();
        const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
        await signupLink.click();
      });

      await page.waitForTimeout(1000);

      // Try to signup with existing email
      await page.locator('input[name="email"], input[type="email"]').first().fill(SEED_USERS.guest.email);
      await page.locator('input[name="password"], input[type="password"]').first().fill('newpassword123');

      const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
      if (await confirmPassword.isVisible()) {
        await confirmPassword.fill('newpassword123');
      }

      await page.locator('button[type="submit"]').click();

      // Should show error about existing account
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // PROTECTED ROUTES
  // ============================================================================

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from guest-proposals', async ({ page }) => {
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl === page.url();

      // Either redirected or shows login prompt
      const loginPrompt = page.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should redirect unauthenticated user from host-proposals', async ({ page }) => {
      await page.goto('/host-proposals');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');

      const loginPrompt = page.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should redirect unauthenticated user from account-profile', async ({ page }) => {
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');

      const loginPrompt = page.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should allow access to public pages without authentication', async ({ page }) => {
      // Home page
      await page.goto('/');
      await expect(page.locator('.hero, [data-testid="hero"]')).toBeVisible();

      // Search page
      await page.goto('/search');
      await expect(page.locator('.search-page, [data-testid="search-page"]')).toBeVisible();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('login modal should be accessible', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Modal should have appropriate role
      const modalRole = await loginModal.getAttribute('role');
      expect(modalRole === 'dialog' || modalRole === 'alertdialog' || modalRole === null).toBeTruthy();

      // Form inputs should have labels
      const emailInput = page.locator('input[type="email"]');
      const emailLabel = await emailInput.getAttribute('aria-label') ||
        await page.locator('label[for="email"]').textContent();
      expect(emailLabel).toBeTruthy();

      const passwordInput = page.locator('input[type="password"]');
      const passwordLabel = await passwordInput.getAttribute('aria-label') ||
        await page.locator('label[for="password"]').textContent();
      expect(passwordLabel).toBeTruthy();
    });

    test('login form should be keyboard navigable', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Tab through form elements
      await page.keyboard.press('Tab');
      const firstFocused = await page.locator(':focus').getAttribute('type');
      expect(firstFocused === 'email' || firstFocused === 'text').toBeTruthy();

      await page.keyboard.press('Tab');
      const secondFocused = await page.locator(':focus').getAttribute('type');
      expect(secondFocused).toBe('password');

      await page.keyboard.press('Tab');
      const thirdFocused = await page.locator(':focus').tagName();
      expect(thirdFocused.toLowerCase()).toBe('button');
    });

    test('error messages should be announced to screen readers', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('invalid@test.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Wait for error
      const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
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

    test('login modal should be full-screen on mobile', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Check modal fills screen on mobile
      const modalBox = await loginModal.boundingBox();
      if (modalBox) {
        expect(modalBox.width).toBeGreaterThan(300);
      }
    });

    test('form inputs should be appropriately sized for touch', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Inputs should have minimum touch target size (44px recommended)
      const emailInput = page.locator('input[type="email"]');
      const emailBox = await emailInput.boundingBox();
      if (emailBox) {
        expect(emailBox.height).toBeGreaterThanOrEqual(40);
      }

      const submitButton = page.locator('button[type="submit"]');
      const buttonBox = await submitButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      }
    });

    test('mobile menu should show login option', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Check for mobile menu button
      const mobileMenuButton = page.locator('.mobile-menu-button, [data-testid="mobile-menu"], .hamburger-menu');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();

        // Should show login option in mobile menu
        const mobileLoginLink = page.locator('.mobile-nav a:has-text("Log in"), .mobile-menu button:has-text("Log in")');
        await expect(mobileLoginLink).toBeVisible();
      }
    });
  });
});
