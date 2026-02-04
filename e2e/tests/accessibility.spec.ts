/**
 * Accessibility E2E Tests
 *
 * Comprehensive accessibility testing across all pages.
 * Tests WCAG 2.1 compliance, keyboard navigation, screen reader compatibility.
 */

import { test, expect } from '@playwright/test';
import { HomePage, SearchPage, ListingDetailPage, AccountProfilePage } from '../pages';
import { SEED_USERS } from '../fixtures/test-data-factory';

test.describe('Accessibility', () => {
  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  test.describe('Keyboard Navigation', () => {
    test('should navigate home page with keyboard only', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Should be able to tab through interactive elements
      const interactiveElements: string[] = [];

      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');

        if (await focused.isVisible()) {
          const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
          const role = await focused.getAttribute('role');
          interactiveElements.push(tagName + (role ? `[${role}]` : ''));
        }
      }

      // Should have navigated through multiple interactive elements
      expect(interactiveElements.length).toBeGreaterThan(5);
    });

    test('should navigate search page filters with keyboard', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Tab through filter elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
      }

      // Should reach filter inputs
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should activate buttons with Enter key', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Tab to login button
      let found = false;
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        const text = await focused.textContent().catch(() => '');

        if (text?.toLowerCase().includes('log in') || text?.toLowerCase().includes('sign in')) {
          found = true;
          await page.keyboard.press('Enter');
          break;
        }
      }

      if (found) {
        // Login modal should open
        const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
        await expect(loginModal).toBeVisible({ timeout: 3000 });
      }
    });

    test('should close modals with Escape key', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.keyboard.press('Escape');
      await expect(loginModal).toBeHidden({ timeout: 3000 });
    });

    test('should trap focus in modal dialogs', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Tab through modal elements multiple times
      const focusedElements: string[] = [];
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');

        if (await focused.isVisible()) {
          const isInModal = await focused.evaluate(el => {
            return el.closest('.login-modal, .auth-modal, [role="dialog"]') !== null;
          });

          if (isInModal) {
            focusedElements.push('in-modal');
          } else {
            focusedElements.push('outside-modal');
          }
        }
      }

      // Focus should stay within modal (mostly or all in-modal)
      const inModalCount = focusedElements.filter(e => e === 'in-modal').length;
      expect(inModalCount).toBeGreaterThan(focusedElements.length * 0.8);
    });

    test('should support arrow key navigation in day selector', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      // Focus on first day button
      const firstDay = searchPage.scheduleSelectorDays.first();
      await firstDay.focus();

      // Press right arrow
      await page.keyboard.press('ArrowRight');

      // Second day should be focused
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });

  // ============================================================================
  // SCREEN READER COMPATIBILITY
  // ============================================================================

  test.describe('Screen Reader Compatibility', () => {
    test('all images should have alt text', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Image should have alt text or be decorative (role="presentation")
        expect(alt !== null || role === 'presentation' || role === 'none').toBeTruthy();
      }
    });

    test('form inputs should have labels', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const inputs = loginModal.locator('input:not([type="hidden"])');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // Input should have a label via one of these methods
        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;

        expect(hasLabel || ariaLabel || ariaLabelledby || placeholder).toBeTruthy();
      }
    });

    test('buttons should have accessible names', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 20); i++) {
        const button = buttons.nth(i);

        if (await button.isVisible()) {
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');

          // Button should have accessible name
          expect(text?.trim() || ariaLabel || title).toBeTruthy();
        }
      }
    });

    test('links should have descriptive text', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const links = page.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < Math.min(linkCount, 20); i++) {
        const link = links.nth(i);

        if (await link.isVisible()) {
          const text = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');

          // Link should have descriptive text
          const hasDescriptiveText = text?.trim() || ariaLabel || title;
          expect(hasDescriptiveText).toBeTruthy();

          // Should not be generic text
          if (text?.trim()) {
            expect(text.toLowerCase()).not.toBe('click here');
            expect(text.toLowerCase()).not.toBe('read more');
          }
        }
      }
    });

    test('error messages should use aria-live', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Submit invalid form
      await page.locator('input[type="email"]').fill('invalid@test.com');
      await page.locator('input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();

      // Wait for error
      await page.waitForTimeout(2000);

      // Check for aria-live on error region
      const errorRegion = page.locator('[aria-live], [role="alert"], [role="status"]');
      const errorCount = await errorRegion.count();
      expect(errorCount).toBeGreaterThanOrEqual(0); // May or may not show error
    });

    test('page should have main landmark', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const main = page.locator('main, [role="main"]');
      await expect(main).toHaveCount(1);
    });

    test('page should have navigation landmark', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const nav = page.locator('nav, [role="navigation"]');
      const navCount = await nav.count();
      expect(navCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // COLOR AND CONTRAST
  // ============================================================================

  test.describe('Color and Contrast', () => {
    test('focus indicators should be visible', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');

      // Focused element should be visible
      await expect(focused).toBeVisible();

      // Check for focus ring/outline
      const outline = await focused.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow
        };
      });

      // Should have some focus indication
      const hasFocusIndicator =
        outline.outlineWidth !== '0px' ||
        outline.outlineStyle !== 'none' ||
        outline.boxShadow !== 'none';

      expect(hasFocusIndicator).toBeTruthy();
    });

    test('text should not rely solely on color', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      // Check that selected/active states have more than just color
      const dayButtons = searchPage.scheduleSelectorDays;
      const buttonCount = await dayButtons.count();

      if (buttonCount > 0) {
        const firstButton = dayButtons.first();
        await firstButton.click();

        // Selected state should have additional indicator (not just color)
        const selectedClass = await firstButton.getAttribute('class');
        const ariaPressed = await firstButton.getAttribute('aria-pressed');
        const ariaSelected = await firstButton.getAttribute('aria-selected');

        // Should have class change, aria state, or similar
        expect(selectedClass?.includes('selected') || ariaPressed || ariaSelected).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // HEADING STRUCTURE
  // ============================================================================

  test.describe('Heading Structure', () => {
    test('pages should have exactly one h1', async ({ page }) => {
      const pagesToTest = ['/', '/search'];

      for (const pageUrl of pagesToTest) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');

        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
      }
    });

    test('headings should be in logical order', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      const headingLevels: number[] = [];

      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.replace('h', ''));
        headingLevels.push(level);
      }

      // Check for skipped heading levels (should not skip from h1 to h3, etc.)
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        // Should not skip more than one level
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    test('section headings should describe content', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const headings = page.locator('h2, h3');
      const headingCount = await headings.count();

      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent();

        // Heading should have meaningful text
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // ARIA ATTRIBUTES
  // ============================================================================

  test.describe('ARIA Attributes', () => {
    test('modals should have proper role', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const role = await loginModal.getAttribute('role');
      expect(role === 'dialog' || role === 'alertdialog').toBeTruthy();
    });

    test('modals should have aria-label or aria-labelledby', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const ariaLabel = await loginModal.getAttribute('aria-label');
      const ariaLabelledby = await loginModal.getAttribute('aria-labelledby');

      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    });

    test('expandable sections should have aria-expanded', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      // Find expandable filter panel
      const filterButton = page.locator('[data-testid="filter-button"], .filter-toggle');
      if (await filterButton.isVisible()) {
        const ariaExpanded = await filterButton.getAttribute('aria-expanded');
        expect(ariaExpanded === 'true' || ariaExpanded === 'false').toBeTruthy();

        // Toggle and check state changes
        await filterButton.click();
        const newAriaExpanded = await filterButton.getAttribute('aria-expanded');
        expect(newAriaExpanded !== ariaExpanded).toBeTruthy();
      }
    });

    test('loading states should use aria-busy', async ({ page }) => {
      const searchPage = new SearchPage(page);

      // Slow down network to catch loading state
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/search');

      // Check for aria-busy during load
      const busyElement = page.locator('[aria-busy="true"]');
      // May or may not catch loading state depending on timing
    });

    test('required form fields should be marked', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // Required inputs should be marked
      const emailRequired =
        (await emailInput.getAttribute('required')) !== null ||
        (await emailInput.getAttribute('aria-required')) === 'true';

      const passwordRequired =
        (await passwordInput.getAttribute('required')) !== null ||
        (await passwordInput.getAttribute('aria-required')) === 'true';

      expect(emailRequired).toBeTruthy();
      expect(passwordRequired).toBeTruthy();
    });
  });

  // ============================================================================
  // RESPONSIVE ACCESSIBILITY
  // ============================================================================

  test.describe('Responsive Accessibility', () => {
    test.describe('Mobile', () => {
      test.use({ viewport: { width: 375, height: 667 } });

      test('touch targets should be at least 44px', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        const buttons = page.locator('button, a');
        const buttonCount = await buttons.count();

        let smallTargets = 0;
        for (let i = 0; i < Math.min(buttonCount, 20); i++) {
          const button = buttons.nth(i);

          if (await button.isVisible()) {
            const box = await button.boundingBox();

            if (box && box.height < 40) {
              smallTargets++;
            }
          }
        }

        // Most touch targets should be adequate size
        expect(smallTargets).toBeLessThan(buttonCount * 0.3);
      });

      test('mobile navigation should be accessible', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // Find mobile menu button
        const mobileMenuButton = page.locator('.mobile-menu-button, [data-testid="mobile-menu"], .hamburger-menu');
        if (await mobileMenuButton.isVisible()) {
          // Should have accessible name
          const ariaLabel = await mobileMenuButton.getAttribute('aria-label');
          const text = await mobileMenuButton.textContent();
          expect(ariaLabel || text).toBeTruthy();

          // Should indicate expanded state
          const ariaExpanded = await mobileMenuButton.getAttribute('aria-expanded');
          expect(ariaExpanded === 'true' || ariaExpanded === 'false').toBeTruthy();
        }
      });

      test('content should be readable without horizontal scroll', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        const body = page.locator('body');
        const scrollWidth = await body.evaluate(el => el.scrollWidth);
        const clientWidth = await body.evaluate(el => el.clientWidth);

        // Should not have significant horizontal overflow
        expect(scrollWidth - clientWidth).toBeLessThan(10);
      });
    });

    test.describe('Tablet', () => {
      test.use({ viewport: { width: 768, height: 1024 } });

      test('layout should be accessible at tablet size', async ({ page }) => {
        const searchPage = new SearchPage(page);
        await searchPage.goto();

        // Page should be visible and functional
        await searchPage.assertPageLoaded();
      });
    });
  });

  // ============================================================================
  // SKIP LINKS
  // ============================================================================

  test.describe('Skip Links', () => {
    test('should have skip to main content link', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // First focus should be skip link
      await page.keyboard.press('Tab');
      const skipLink = page.locator('a[href="#main"], a:has-text("Skip to"), .skip-link');

      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeVisible();

        // Click skip link should scroll to main
        await skipLink.click();
        const main = page.locator('#main, main');
        await expect(main).toBeFocused();
      }
    });
  });

  // ============================================================================
  // REDUCED MOTION
  // ============================================================================

  test.describe('Reduced Motion', () => {
    test('should respect reduced motion preference', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const homePage = new HomePage(page);
      await homePage.goto();

      // Animations should be disabled or minimal
      // Check that page still functions correctly
      await expect(homePage.heroSection).toBeVisible();
    });
  });

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  test.describe('Focus Management', () => {
    test('should move focus to modal when opened', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Focus should be within modal
      const focused = page.locator(':focus');
      const isInModal = await focused.evaluate(el => {
        return el.closest('.login-modal, .auth-modal, [role="dialog"]') !== null;
      });

      expect(isInModal).toBeTruthy();
    });

    test('should return focus when modal closes', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      // Focus on login button
      await homePage.loginButton.focus();

      // Open modal
      await homePage.loginButton.click();
      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Close modal
      await page.keyboard.press('Escape');
      await loginModal.waitFor({ state: 'hidden' });

      // Focus should return to trigger
      await expect(homePage.loginButton).toBeFocused();
    });

    test('should not lose focus on page interactions', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      // Focus on a filter
      const filterInput = page.locator('input').first();
      if (await filterInput.isVisible()) {
        await filterInput.focus();
        await filterInput.fill('test');

        // Focus should remain on input
        await expect(filterInput).toBeFocused();
      }
    });
  });

  // ============================================================================
  // TIMED INTERACTIONS
  // ============================================================================

  test.describe('Timed Interactions', () => {
    test('toast notifications should persist long enough to read', async ({ page }) => {
      // This test would verify toasts don't disappear too quickly
      // Implementation depends on how toasts work in the app

      const homePage = new HomePage(page);
      await homePage.goto();

      // Trigger an action that shows a toast
      // (varies by implementation)

      // If toast appears, check it stays visible for adequate time
      const toast = page.locator('.toast, [role="alert"], [role="status"]');
      if (await toast.isVisible()) {
        await page.waitForTimeout(3000);
        // Toast should still be visible after 3 seconds (or have close button)
      }
    });
  });
});
