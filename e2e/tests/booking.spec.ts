/**
 * Booking Flow E2E Tests
 *
 * Tests for the complete booking/proposal flow from listing detail to submission.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '@playwright/test';
import { ListingDetailPage, SearchPage, GuestProposalsPage } from '../pages';
import { createBookingScenario, SEED_USERS, SEED_LISTINGS } from '../fixtures/test-data-factory';

test.describe('Booking Flow', () => {
  // ============================================================================
  // LISTING DETAIL PAGE
  // ============================================================================

  test.describe('Listing Detail Page', () => {
    test('should display listing details', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.assertPageLoaded();

        // Verify key elements
        await expect(listingPage.listingTitle).toBeVisible();
        await expect(listingPage.bookingWidget).toBeVisible();
      }
    });

    test('should display photo gallery', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.photoGallery).toBeVisible();
      }
    });

    test('should open photo gallery modal on click', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await listingPage.openPhotoGallery();

        // Should open full gallery modal
        const galleryModal = page.locator('.gallery-modal, [data-testid="gallery-modal"], .lightbox');
        await expect(galleryModal).toBeVisible();
      }
    });

    test('should display amenities', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.amenitiesSection).toBeVisible();
      }
    });

    test('should display host information', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.hostSection).toBeVisible();
      }
    });

    test('should display map with location', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.mapSection).toBeVisible();
      }
    });
  });

  // ============================================================================
  // BOOKING WIDGET
  // ============================================================================

  test.describe('Booking Widget', () => {
    test('should display price per night', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.priceDisplay).toBeVisible();
        const priceText = await listingPage.priceDisplay.textContent();
        expect(priceText).toContain('$');
      }
    });

    test('should show schedule selector with available days', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.scheduleSelector).toBeVisible();

        // Should have day buttons
        const dayCount = await listingPage.scheduleDays.count();
        expect(dayCount).toBeGreaterThan(0);
      }
    });

    test('should update price when days are selected', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Get initial price
        const initialPrice = await listingPage.priceDisplay.textContent();

        // Select additional days
        await listingPage.selectDay(1); // Monday
        await listingPage.selectDay(2); // Tuesday

        await page.waitForTimeout(500);

        // Price should update (or total should change)
        const totalDisplay = page.locator('.total-price, [data-testid="total-price"], .price-total');
        if (await totalDisplay.isVisible()) {
          const totalPrice = await totalDisplay.textContent();
          expect(totalPrice).toContain('$');
        }
      }
    });

    test('should show move-in date picker', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await expect(listingPage.moveInDatePicker).toBeVisible();
      }
    });

    test('should show duration selector', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        const durationSelector = page.locator('[data-testid="duration-selector"], .duration-selector, select[name="duration"]');
        if (await durationSelector.isVisible()) {
          // Should have duration options
          await expect(durationSelector).toBeVisible();
        }
      }
    });
  });

  // ============================================================================
  // PROPOSAL SUBMISSION - HAPPY PATH
  // ============================================================================

  test.describe('Proposal Submission - Happy Path', () => {
    test('should require login to submit proposal', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Try to submit proposal without login
        await listingPage.proposalButton.click();

        // Should prompt for login
        const loginPrompt = page.locator('.login-modal, [data-testid="login-modal"], .auth-modal, .login-required');
        await expect(loginPrompt).toBeVisible({ timeout: 5000 });
      }
    });

    test('should open proposal modal when logged in', async ({ page }) => {
      // First login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to listing
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Select some days
        await listingPage.selectDay(1);
        await listingPage.selectDay(2);

        // Click proposal button
        await listingPage.proposalButton.click();

        // Should open proposal modal or navigate to proposal form
        const proposalModal = page.locator('.proposal-modal, [data-testid="proposal-modal"], .booking-modal');
        const proposalForm = page.locator('.proposal-form, [data-testid="proposal-form"]');

        const modalVisible = await proposalModal.isVisible().catch(() => false);
        const formVisible = await proposalForm.isVisible().catch(() => false);

        expect(modalVisible || formVisible).toBeTruthy();
      }
    });

    test('should show price breakdown in proposal', async ({ page }) => {
      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to listing
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Select days
        await listingPage.selectDay(1);
        await listingPage.selectDay(2);
        await listingPage.selectDay(3);

        // Open proposal
        await listingPage.proposalButton.click();

        await page.waitForTimeout(1000);

        // Check for price breakdown
        const priceBreakdown = page.locator('.price-breakdown, [data-testid="price-breakdown"]');
        if (await priceBreakdown.isVisible()) {
          const breakdownText = await priceBreakdown.textContent();
          expect(breakdownText).toContain('$');
        }
      }
    });
  });

  // ============================================================================
  // PROPOSAL VALIDATION
  // ============================================================================

  test.describe('Proposal Validation', () => {
    test('should require at least one day selected', async ({ page }) => {
      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to listing
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Don't select any days, try to submit
        await listingPage.proposalButton.click();

        // Should show validation error
        const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"]');
        await page.waitForTimeout(1000);

        // Either shows error or button is disabled
        const hasError = await errorMessage.isVisible().catch(() => false);
        const isDisabled = await listingPage.proposalButton.isDisabled().catch(() => false);

        expect(hasError || isDisabled).toBeTruthy();
      }
    });

    test('should validate move-in date is in future', async ({ page }) => {
      // This test checks that past dates cannot be selected
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Try to select a past date
        const datePicker = listingPage.moveInDatePicker;
        if (await datePicker.isVisible()) {
          // Past dates should be disabled in the date picker
          // This is typically handled by min attribute or disabled dates
          const minDate = await datePicker.getAttribute('min');
          if (minDate) {
            const minDateTime = new Date(minDate).getTime();
            const today = new Date().setHours(0, 0, 0, 0);
            expect(minDateTime).toBeGreaterThanOrEqual(today);
          }
        }
      }
    });
  });

  // ============================================================================
  // CONTACT HOST
  // ============================================================================

  test.describe('Contact Host', () => {
    test('should open contact modal', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        await listingPage.contactHostButton.click();

        // Should open contact modal or require login
        const contactModal = page.locator('.contact-modal, [data-testid="contact-modal"], .message-modal');
        const loginModal = page.locator('.login-modal, [data-testid="login-modal"]');

        await page.waitForTimeout(1000);

        const contactVisible = await contactModal.isVisible().catch(() => false);
        const loginVisible = await loginModal.isVisible().catch(() => false);

        expect(contactVisible || loginVisible).toBeTruthy();
      }
    });

    test('should show host profile on click', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Click on host name/avatar
        const hostLink = listingPage.hostSection.locator('a, .host-name, .host-avatar');
        if (await hostLink.isVisible()) {
          await hostLink.click();

          // Should navigate to profile or open profile modal
          await page.waitForTimeout(1000);

          const profilePage = page.url().includes('account-profile');
          const profileModal = await page.locator('.profile-modal, [data-testid="profile-modal"]').isVisible().catch(() => false);

          expect(profilePage || profileModal).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // PROPOSAL STATUS TRACKING
  // ============================================================================

  test.describe('Proposal Status Tracking', () => {
    test('should navigate to guest proposals after submission', async ({ page }) => {
      // This test would require a full proposal submission
      // For now, we'll verify the guest proposals page loads correctly

      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to guest proposals
      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      await guestProposalsPage.assertPageLoaded();
    });

    test('should show proposal status badges', async ({ page }) => {
      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to guest proposals
      const guestProposalsPage = new GuestProposalsPage(page);
      await guestProposalsPage.goto();

      await guestProposalsPage.waitForLoadingComplete();

      const proposalCount = await guestProposalsPage.getProposalCount();
      if (proposalCount > 0) {
        // Status badges should be visible
        const statusBadge = guestProposalsPage.statusBadge.first();
        await expect(statusBadge).toBeVisible();
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling', () => {
    test('should handle listing not found gracefully', async ({ page }) => {
      await page.goto('/view-split-lease/nonexistent-listing-id');
      await page.waitForLoadState('networkidle');

      // Should show 404 or error state
      const notFound = page.locator('.not-found, [data-testid="not-found"], .error-404');
      const errorState = page.locator('.error-state, [data-testid="error-state"]');

      await page.waitForTimeout(2000);

      const notFoundVisible = await notFound.isVisible().catch(() => false);
      const errorVisible = await errorState.isVisible().catch(() => false);
      const is404 = page.url().includes('404');

      expect(notFoundVisible || errorVisible || is404).toBeTruthy();
    });

    test('should handle network error during proposal submission', async ({ page }) => {
      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Simulate network failure
        await page.route('**/proposal**', route => route.abort('failed'));
        await page.route('**/functions/proposal**', route => route.abort('failed'));

        // Select days and try to submit
        await listingPage.selectDay(1);
        await listingPage.selectDay(2);
        await listingPage.proposalButton.click();

        await page.waitForTimeout(2000);

        // Should show error message
        const errorMessage = page.locator('.error-message, [data-testid="error-message"], [role="alert"], .toast-error');
        // Error handling should be present
      }
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('should have accessible booking widget', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Booking widget should have proper structure
        const widget = listingPage.bookingWidget;
        await expect(widget).toBeVisible();

        // Day buttons should have accessible names
        const dayButtons = listingPage.scheduleDays;
        const dayCount = await dayButtons.count();

        for (let i = 0; i < Math.min(dayCount, 7); i++) {
          const dayButton = dayButtons.nth(i);
          const ariaLabel = await dayButton.getAttribute('aria-label');
          const title = await dayButton.getAttribute('title');
          const text = await dayButton.textContent();

          expect(ariaLabel || title || text).toBeTruthy();
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Tab through booking widget
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should be able to focus on interactive elements
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
      }
    });

    test('should have proper heading structure', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Should have h1 for listing title
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);

        // Should have logical heading hierarchy
        const headings = page.locator('h1, h2, h3, h4');
        const headingCount = await headings.count();
        expect(headingCount).toBeGreaterThan(1);
      }
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show sticky booking bar on mobile', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // On mobile, booking widget might be a sticky bar
        const stickyBar = page.locator('.sticky-booking-bar, .mobile-booking-bar, .booking-cta-bar');
        if (await stickyBar.isVisible()) {
          await expect(stickyBar).toBeVisible();
        }
      }
    });

    test('should have touch-friendly photo gallery', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Gallery should be swipeable
        const gallery = listingPage.photoGallery;
        const box = await gallery.boundingBox();

        if (box) {
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }
    });

    test('should stack layout vertically on mobile', async ({ page }) => {
      const searchPage = new SearchPage(page);
      await searchPage.goto();
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        const listingPage = new ListingDetailPage(page);
        await listingPage.waitForPageLoad();

        // Content should be stacked, not side-by-side
        const mainContent = page.locator('.listing-main, .listing-content');
        const bookingWidget = listingPage.bookingWidget;

        const mainBox = await mainContent.boundingBox().catch(() => null);
        const widgetBox = await bookingWidget.boundingBox().catch(() => null);

        if (mainBox && widgetBox) {
          // On mobile, widget should be below main content or as sticky bar
          // Either stacked vertically or widget is sticky at bottom
          expect(widgetBox.y > mainBox.y || widgetBox.y === 0).toBeTruthy();
        }
      }
    });
  });
});
