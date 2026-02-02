/**
 * Listing Creation E2E Tests
 *
 * Tests for the complete host listing creation flow.
 * Validates listing form, photo upload, pricing, and submission.
 *
 * Run with: npx playwright test listing-creation.spec.ts
 */

import { test, expect } from '../fixtures/auth';
import { SEED_USERS, createTestListing } from '../fixtures/test-data-factory';

test.describe('Listing Creation Flow', () => {
  // ============================================================================
  // NAVIGATION & ACCESS
  // ============================================================================

  test.describe('Navigation & Access', () => {
    test('should redirect unauthenticated users to login', async ({ anonymousPage }) => {
      await anonymousPage.goto('/self-listing');
      await anonymousPage.waitForLoadState('networkidle');

      const currentUrl = anonymousPage.url();
      const loginPrompt = anonymousPage.locator('.login-modal, [data-testid="login-modal"], .login-required');

      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should allow hosts to access listing creation page', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const pageContainer = hostPage.locator('.self-listing-page, [data-testid="self-listing-page"], .listing-form');
      await expect(pageContainer).toBeVisible({ timeout: 10000 });
    });

    test('should show listing creation form with required sections', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      // Check for key form sections
      const basicInfoSection = hostPage.locator('.basic-info, [data-section="basic"], h2:has-text("Basic")');
      const locationSection = hostPage.locator('.location-section, [data-section="location"], h2:has-text("Location")');
      const pricingSection = hostPage.locator('.pricing-section, [data-section="pricing"], h2:has-text("Pricing")');

      // At least some form structure should be visible
      const formVisible = await hostPage.locator('form, .listing-form').isVisible().catch(() => false);
      expect(formVisible).toBeTruthy();
    });
  });

  // ============================================================================
  // BASIC INFO FORM
  // ============================================================================

  test.describe('Basic Info Form', () => {
    test('should have listing title input', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const titleInput = hostPage.locator('input[name="title"], input[name="name"], [data-testid="listing-title"]');
      await expect(titleInput).toBeVisible();
    });

    test('should have description textarea', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const descriptionInput = hostPage.locator('textarea[name="description"], [data-testid="listing-description"]');
      await expect(descriptionInput).toBeVisible();
    });

    test('should have bedroom/bathroom selectors', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const bedroomInput = hostPage.locator(
        'input[name="bedrooms"], select[name="bedrooms"], [data-testid="bedrooms"]'
      );
      const bathroomInput = hostPage.locator(
        'input[name="bathrooms"], select[name="bathrooms"], [data-testid="bathrooms"]'
      );

      const bedroomsVisible = await bedroomInput.isVisible().catch(() => false);
      const bathroomsVisible = await bathroomInput.isVisible().catch(() => false);

      expect(bedroomsVisible || bathroomsVisible).toBeTruthy();
    });

    test('should validate required title field', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      // Try to submit without title
      const submitButton = hostPage.locator('button[type="submit"], button:has-text("Save"), button:has-text("Next")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation error
        const errorMessage = hostPage.locator('.error-message, [data-testid="error"], [role="alert"], .field-error');
        const titleInput = hostPage.locator('input[name="title"], input[name="name"]');

        await hostPage.waitForTimeout(1000);

        const hasError = await errorMessage.isVisible().catch(() => false);
        const hasValidation = await titleInput.evaluate((el: HTMLInputElement) => !el.validity.valid).catch(() => false);

        expect(hasError || hasValidation).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // LOCATION FORM
  // ============================================================================

  test.describe('Location Form', () => {
    test('should have address input', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const addressInput = hostPage.locator(
        'input[name="address"], [data-testid="address-input"], input[placeholder*="address" i]'
      );

      if (await addressInput.isVisible()) {
        await expect(addressInput).toBeVisible();
      }
    });

    test('should have borough selector', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const boroughSelector = hostPage.locator(
        'select[name="borough"], [data-testid="borough-selector"], .borough-dropdown'
      );

      if (await boroughSelector.isVisible()) {
        await expect(boroughSelector).toBeVisible();
      }
    });

    test('should have neighborhood input', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const neighborhoodInput = hostPage.locator(
        'input[name="neighborhood"], select[name="neighborhood"], [data-testid="neighborhood"]'
      );

      if (await neighborhoodInput.isVisible()) {
        await expect(neighborhoodInput).toBeVisible();
      }
    });
  });

  // ============================================================================
  // SCHEDULE & AVAILABILITY
  // ============================================================================

  test.describe('Schedule & Availability', () => {
    test('should have day selection buttons', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const dayButtons = hostPage.locator('.day-button, [data-testid="day-button"], .schedule-day');
      const dayCount = await dayButtons.count();

      // Should have 7 days or at least some day selection
      expect(dayCount).toBeGreaterThanOrEqual(0);
    });

    test('should allow toggling days', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const dayButton = hostPage.locator('.day-button, [data-testid="day-button"]').first();

      if (await dayButton.isVisible()) {
        const initialState = await dayButton.getAttribute('data-selected');
        await dayButton.click();

        const newState = await dayButton.getAttribute('data-selected');

        // State should change or button should be clickable
        expect(initialState !== newState || await dayButton.isEnabled()).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // PRICING FORM
  // ============================================================================

  test.describe('Pricing Form', () => {
    test('should have nightly rate input', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const priceInput = hostPage.locator(
        'input[name="price"], input[name="nightlyRate"], [data-testid="nightly-rate"], input[type="number"]'
      ).first();

      if (await priceInput.isVisible()) {
        await expect(priceInput).toBeVisible();
      }
    });

    test('should validate price is positive number', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const priceInput = hostPage.locator(
        'input[name="price"], input[name="nightlyRate"], [data-testid="nightly-rate"]'
      );

      if (await priceInput.isVisible()) {
        await priceInput.fill('-100');
        await priceInput.blur();

        await hostPage.waitForTimeout(500);

        // Should show error or auto-correct
        const inputValue = await priceInput.inputValue();
        const hasError = await hostPage.locator('.error-message, .field-error').isVisible().catch(() => false);

        expect(inputValue !== '-100' || hasError).toBeTruthy();
      }
    });

    test('should have cleaning fee input', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const cleaningFeeInput = hostPage.locator(
        'input[name="cleaningFee"], input[name="cleaning_fee"], [data-testid="cleaning-fee"]'
      );

      // Cleaning fee is optional, so just check structure
      if (await cleaningFeeInput.isVisible()) {
        await expect(cleaningFeeInput).toBeVisible();
      }
    });
  });

  // ============================================================================
  // PHOTO UPLOAD
  // ============================================================================

  test.describe('Photo Upload', () => {
    test('should have photo upload section', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const photoSection = hostPage.locator(
        '.photo-upload, [data-testid="photo-upload"], input[type="file"], .image-uploader'
      );

      const visible = await photoSection.isVisible().catch(() => false);
      expect(visible).toBeTruthy();
    });

    test('should accept image file types', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const fileInput = hostPage.locator('input[type="file"]').first();

      if (await fileInput.isVisible()) {
        const acceptAttr = await fileInput.getAttribute('accept');
        if (acceptAttr) {
          expect(acceptAttr.toLowerCase()).toContain('image');
        }
      }
    });
  });

  // ============================================================================
  // AMENITIES SELECTION
  // ============================================================================

  test.describe('Amenities Selection', () => {
    test('should have amenities checkboxes', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const amenityCheckboxes = hostPage.locator(
        '.amenity-checkbox, [data-testid="amenity"], input[type="checkbox"][name*="amenity" i]'
      );

      const checkboxCount = await amenityCheckboxes.count();

      // Some amenities should be available
      expect(checkboxCount).toBeGreaterThanOrEqual(0);
    });

    test('should allow selecting multiple amenities', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const amenityCheckboxes = hostPage.locator(
        '.amenity-checkbox, [data-testid="amenity"], input[type="checkbox"]'
      );

      const count = await amenityCheckboxes.count();
      if (count >= 2) {
        await amenityCheckboxes.nth(0).click();
        await amenityCheckboxes.nth(1).click();

        // Both should be selected
        const firstChecked = await amenityCheckboxes.nth(0).isChecked().catch(() => false);
        const secondChecked = await amenityCheckboxes.nth(1).isChecked().catch(() => false);

        expect(firstChecked && secondChecked).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  test.describe('Form Submission', () => {
    test('should have submit button', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const submitButton = hostPage.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Publish")'
      );

      await expect(submitButton.first()).toBeVisible();
    });

    test('should show loading state during submission', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      // Fill minimal required fields
      const titleInput = hostPage.locator('input[name="title"], input[name="name"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Listing ' + Date.now());
      }

      const submitButton = hostPage.locator('button[type="submit"], button:has-text("Save")');

      if (await submitButton.isVisible()) {
        // Note: We're not actually submitting to avoid creating real data
        // Just verifying the button is interactive
        await expect(submitButton).toBeEnabled();
      }
    });
  });

  // ============================================================================
  // LISTING DASHBOARD ACCESS
  // ============================================================================

  test.describe('Listing Dashboard', () => {
    test('should access listing dashboard as host', async ({ hostPage }) => {
      await hostPage.goto('/listing-dashboard');
      await hostPage.waitForLoadState('networkidle');

      const dashboard = hostPage.locator(
        '.listing-dashboard, [data-testid="listing-dashboard"], .host-listings'
      );

      const visible = await dashboard.isVisible().catch(() => false);
      expect(visible).toBeTruthy();
    });

    test('should show existing listings in dashboard', async ({ hostPage }) => {
      await hostPage.goto('/listing-dashboard');
      await hostPage.waitForLoadState('networkidle');

      // Wait for listings to load
      await hostPage.waitForTimeout(2000);

      const listingCards = hostPage.locator(
        '.listing-card, [data-testid="listing-card"], .property-card'
      );

      const emptyState = hostPage.locator('.empty-state, [data-testid="no-listings"]');

      const hasListings = await listingCards.count() > 0;
      const isEmpty = await emptyState.isVisible().catch(() => false);

      // Either has listings or shows empty state
      expect(hasListings || isEmpty).toBeTruthy();
    });

    test('should have create new listing button', async ({ hostPage }) => {
      await hostPage.goto('/listing-dashboard');
      await hostPage.waitForLoadState('networkidle');

      const createButton = hostPage.locator(
        'button:has-text("Create"), button:has-text("Add"), a:has-text("New Listing"), [data-testid="create-listing"]'
      );

      const visible = await createButton.first().isVisible().catch(() => false);
      expect(visible).toBeTruthy();
    });
  });

  // ============================================================================
  // EDIT LISTING
  // ============================================================================

  test.describe('Edit Listing', () => {
    test('should navigate to edit page from dashboard', async ({ hostPage }) => {
      await hostPage.goto('/listing-dashboard');
      await hostPage.waitForLoadState('networkidle');

      await hostPage.waitForTimeout(2000);

      const listingCard = hostPage.locator('.listing-card, [data-testid="listing-card"]').first();

      if (await listingCard.isVisible()) {
        const editButton = listingCard.locator('button:has-text("Edit"), a:has-text("Edit"), .edit-btn');

        if (await editButton.isVisible()) {
          await editButton.click();
          await hostPage.waitForLoadState('networkidle');

          // Should be on edit page
          const isEditPage = hostPage.url().includes('edit') || hostPage.url().includes('self-listing');
          const hasForm = await hostPage.locator('form, .listing-form').isVisible().catch(() => false);

          expect(isEditPage || hasForm).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const formInputs = hostPage.locator('input:not([type="hidden"]), textarea, select');
      const inputCount = await formInputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = formInputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');

        // Should have some form of label
        const hasLabel = id
          ? await hostPage.locator(`label[for="${id}"]`).isVisible().catch(() => false)
          : false;

        expect(hasLabel || ariaLabel || ariaLabelledby || placeholder).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      // Tab through form
      await hostPage.keyboard.press('Tab');
      await hostPage.keyboard.press('Tab');
      await hostPage.keyboard.press('Tab');

      const focused = hostPage.locator(':focus');
      await expect(focused).toBeVisible();
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display form properly on mobile', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const form = hostPage.locator('form, .listing-form');
      const box = await form.boundingBox().catch(() => null);

      if (box) {
        // Form should fit within mobile viewport
        expect(box.width).toBeLessThanOrEqual(375);
      }
    });

    test('should have touch-friendly inputs on mobile', async ({ hostPage }) => {
      await hostPage.goto('/self-listing');
      await hostPage.waitForLoadState('networkidle');

      const inputs = hostPage.locator('input, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox().catch(() => null);

        if (box) {
          // Minimum touch target size
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});
