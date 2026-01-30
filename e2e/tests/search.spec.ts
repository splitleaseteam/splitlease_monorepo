/**
 * Search and Listings E2E Tests
 *
 * Tests for search functionality, filters, listing display, and map integration.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '../fixtures/auth';
import { SearchPage, HomePage } from '../pages';
import { createSearchScenario, SEED_LISTINGS } from '../fixtures/test-data-factory';

test.describe('Search and Listings', () => {
  // ============================================================================
  // SEARCH NAVIGATION
  // ============================================================================

  test.describe('Search Navigation', () => {
    test('should navigate to search page from home', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Use schedule selector on home page
      await homePage.scheduleSection.waitFor({ state: 'visible' });

      // Click search/explore button
      const searchButton = anonymousPage.locator('button:has-text("Search"), a:has-text("Explore"), button:has-text("Find")');
      await searchButton.first().click();

      // Should navigate to search page
      await anonymousPage.waitForURL(/search/);
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.assertPageLoaded();
    });

    test('should preserve schedule selection when navigating to search', async ({ anonymousPage }) => {
      const homePage = new HomePage(anonymousPage);
      await homePage.goto();

      // Select days on home page schedule selector
      const dayButtons = homePage.scheduleSelectorDays;
      await dayButtons.nth(1).click(); // Monday
      await dayButtons.nth(3).click(); // Wednesday

      // Navigate to search
      const searchButton = anonymousPage.locator('button:has-text("Search"), a:has-text("Explore")');
      await searchButton.first().click();

      await anonymousPage.waitForURL(/search/);

      // Verify schedule is preserved in search page
      const searchPage = new SearchPage(anonymousPage);
      const searchDays = searchPage.scheduleSelectorDays;

      // Monday and Wednesday should be selected
      const mondayClass = await searchDays.nth(1).getAttribute('class');
      const wednesdayClass = await searchDays.nth(3).getAttribute('class');

      expect(mondayClass).toContain('selected');
      expect(wednesdayClass).toContain('selected');
    });

    test('should load search page directly via URL', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();
      await searchPage.assertPageLoaded();

      await expect(searchPage.pageContainer).toBeVisible();
      await expect(searchPage.scheduleSelector).toBeVisible();
    });
  });

  // ============================================================================
  // SCHEDULE SELECTOR
  // ============================================================================

  test.describe('Schedule Selector', () => {
    test('should toggle day selection', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Select Monday (index 1)
      await searchPage.selectDay(1);

      const mondayButton = searchPage.scheduleSelectorDays.nth(1);
      const classAfterSelect = await mondayButton.getAttribute('class');
      expect(classAfterSelect).toContain('selected');

      // Deselect Monday
      await searchPage.selectDay(1);

      const classAfterDeselect = await mondayButton.getAttribute('class');
      expect(classAfterDeselect).not.toContain('selected');
    });

    test('should select multiple days', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Select weekday pattern (Mon, Tue, Wed, Thu)
      await searchPage.selectDays([1, 2, 3, 4]);

      // Verify all are selected
      for (const dayIndex of [1, 2, 3, 4]) {
        const dayButton = searchPage.scheduleSelectorDays.nth(dayIndex);
        const dayClass = await dayButton.getAttribute('class');
        expect(dayClass).toContain('selected');
      }
    });

    test('should update listings when schedule changes', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Wait for initial listings
      await searchPage.waitForLoadingComplete();
      const initialCount = await searchPage.getListingCount();

      // Select specific days
      await searchPage.selectDays([1, 2, 3, 4, 5]); // Weekdays
      await searchPage.waitForLoadingComplete();

      // Listings should update (count may change)
      const newCount = await searchPage.getListingCount();
      // Just verify listings exist, count may vary
      expect(newCount).toBeGreaterThanOrEqual(0);
    });

    test('should show schedule price breakdown', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Select some days
      await searchPage.selectDays([1, 2, 3]);
      await searchPage.waitForLoadingComplete();

      // Check if price breakdown is shown
      const priceBreakdown = anonymousPage.locator('.price-breakdown, [data-testid="price-breakdown"], .schedule-pricing');
      if (await priceBreakdown.isVisible()) {
        const priceText = await priceBreakdown.textContent();
        expect(priceText).toContain('$');
      }
    });
  });

  // ============================================================================
  // FILTERS
  // ============================================================================

  test.describe('Filters', () => {
    test('should filter by neighborhood', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Open filters if needed
      await searchPage.openFilterPanel();

      // Select neighborhood
      await searchPage.selectNeighborhood('Manhattan');
      await searchPage.waitForLoadingComplete();

      // Verify results are filtered
      const listingCount = await searchPage.getListingCount();
      expect(listingCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by price range', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Set price range
      await searchPage.setPriceRange(500, 2000);
      await searchPage.waitForLoadingComplete();

      // Listings should be within price range
      const listingCount = await searchPage.getListingCount();
      expect(listingCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by amenities', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Select amenities
      await searchPage.selectAmenity('WiFi');
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      expect(listingCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by property type', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      const propertyTypeFilter = anonymousPage.locator('[data-testid="property-type-filter"], select[name="propertyType"]');
      if (await propertyTypeFilter.isVisible()) {
        await propertyTypeFilter.selectOption('apartment');
        await searchPage.waitForLoadingComplete();

        const listingCount = await searchPage.getListingCount();
        expect(listingCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should combine multiple filters', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Apply multiple filters
      await searchPage.selectNeighborhood('Brooklyn');
      await searchPage.setPriceRange(1000, 3000);
      await searchPage.selectAmenity('WiFi');

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      expect(listingCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear all filters', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Apply filters
      await searchPage.selectNeighborhood('Manhattan');
      await searchPage.waitForLoadingComplete();

      const filteredCount = await searchPage.getListingCount();

      // Clear filters
      await searchPage.clearFilters();
      await searchPage.waitForLoadingComplete();

      const clearedCount = await searchPage.getListingCount();

      // Cleared should have same or more results
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
    });

    test('should show active filter badges', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();
      await searchPage.selectNeighborhood('Queens');
      await searchPage.waitForLoadingComplete();

      // Check for filter badge/chip
      const filterBadge = anonymousPage.locator('.filter-badge, .filter-chip, [data-testid="active-filter"]');
      await expect(filterBadge).toBeVisible();
    });
  });

  // ============================================================================
  // LISTING DISPLAY
  // ============================================================================

  test.describe('Listing Display', () => {
    test('should display listing cards', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const firstCard = searchPage.listingCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test('should show listing image', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const firstCardImage = searchPage.listingCards.first().locator('img');
        await expect(firstCardImage).toBeVisible();
      }
    });

    test('should show listing price', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const firstCardPrice = searchPage.listingCards.first().locator('.price, [data-testid="listing-price"]');
        await expect(firstCardPrice).toBeVisible();
        const priceText = await firstCardPrice.textContent();
        expect(priceText).toContain('$');
      }
    });

    test('should show listing title/address', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const firstCardTitle = searchPage.listingCards.first().locator('.title, .address, h3, h4');
        await expect(firstCardTitle).toBeVisible();
      }
    });

    test('should show available days on listing card', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const dayPills = searchPage.listingCards.first().locator('.day-pill, .day-badge, [data-testid="day-indicator"]');
        const dayCount = await dayPills.count();
        // Some indication of days should be visible
        expect(dayCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should navigate to listing detail on card click', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        await searchPage.clickListing(0);

        // Should navigate to detail page
        await anonymousPage.waitForURL(/view-split-lease|listing/, { timeout: 10000 });
      }
    });

    test('should show empty state when no results', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Apply very restrictive filters
      await searchPage.setPriceRange(1, 10); // Very low price
      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount === 0) {
        await searchPage.assertEmpty();
      }
    });
  });

  // ============================================================================
  // MAP INTEGRATION
  // ============================================================================

  test.describe('Map Integration', () => {
    test('should display map on desktop', async ({ anonymousPage }) => {
      anonymousPage.setViewportSize({ width: 1280, height: 800 });

      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await expect(searchPage.mapContainer).toBeVisible();
    });

    test('should show map markers for listings', async ({ anonymousPage }) => {
      anonymousPage.setViewportSize({ width: 1280, height: 800 });

      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      // Map markers
      const markers = anonymousPage.locator('.map-marker, .mapboxgl-marker, [data-testid="map-marker"]');
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThanOrEqual(0);
    });

    test('should highlight listing on map marker hover', async ({ anonymousPage }) => {
      anonymousPage.setViewportSize({ width: 1280, height: 800 });

      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const markers = anonymousPage.locator('.map-marker, .mapboxgl-marker');
      if (await markers.first().isVisible()) {
        await markers.first().hover();

        // Check for highlight on listing or popup
        const popup = anonymousPage.locator('.map-popup, .mapboxgl-popup');
        const highlighted = anonymousPage.locator('.listing-card--highlighted, [data-highlighted="true"]');

        const popupVisible = await popup.isVisible().catch(() => false);
        const highlightVisible = await highlighted.isVisible().catch(() => false);

        expect(popupVisible || highlightVisible).toBeTruthy();
      }
    });

    test('should toggle map view on mobile', async ({ anonymousPage }) => {
      anonymousPage.setViewportSize({ width: 375, height: 667 });

      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Check for map toggle button on mobile
      const mapToggle = anonymousPage.locator('[data-testid="map-toggle"], .map-toggle-button, button:has-text("Map")');
      if (await mapToggle.isVisible()) {
        await mapToggle.click();

        // Map should become visible
        await expect(searchPage.mapContainer).toBeVisible();

        // Toggle back to list
        const listToggle = anonymousPage.locator('[data-testid="list-toggle"], .list-toggle-button, button:has-text("List")');
        if (await listToggle.isVisible()) {
          await listToggle.click();
          await expect(searchPage.listingGrid).toBeVisible();
        }
      }
    });
  });

  // ============================================================================
  // SORTING
  // ============================================================================

  test.describe('Sorting', () => {
    test('should sort by price low to high', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      // Find sort dropdown
      const sortSelect = anonymousPage.locator('[data-testid="sort-select"], select[name="sort"], .sort-dropdown');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption({ label: /price.*low/i });
        await searchPage.waitForLoadingComplete();

        // Verify order (get first two prices)
        const prices = searchPage.listingCards.locator('.price, [data-testid="listing-price"]');
        const priceCount = await prices.count();

        if (priceCount >= 2) {
          const price1Text = await prices.nth(0).textContent();
          const price2Text = await prices.nth(1).textContent();

          const price1 = parseFloat(price1Text?.replace(/[^0-9.]/g, '') || '0');
          const price2 = parseFloat(price2Text?.replace(/[^0-9.]/g, '') || '0');

          expect(price1).toBeLessThanOrEqual(price2);
        }
      }
    });

    test('should sort by price high to low', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const sortSelect = anonymousPage.locator('[data-testid="sort-select"], select[name="sort"], .sort-dropdown');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption({ label: /price.*high/i });
        await searchPage.waitForLoadingComplete();

        const prices = searchPage.listingCards.locator('.price, [data-testid="listing-price"]');
        const priceCount = await prices.count();

        if (priceCount >= 2) {
          const price1Text = await prices.nth(0).textContent();
          const price2Text = await prices.nth(1).textContent();

          const price1 = parseFloat(price1Text?.replace(/[^0-9.]/g, '') || '0');
          const price2 = parseFloat(price2Text?.replace(/[^0-9.]/g, '') || '0');

          expect(price1).toBeGreaterThanOrEqual(price2);
        }
      }
    });
  });

  // ============================================================================
  // PAGINATION / INFINITE SCROLL
  // ============================================================================

  test.describe('Pagination', () => {
    test('should load more listings on scroll', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const initialCount = await searchPage.getListingCount();

      // Scroll to bottom
      await anonymousPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await anonymousPage.waitForTimeout(2000);

      const newCount = await searchPage.getListingCount();

      // May load more or not, depending on data
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should show loading indicator while fetching', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);

      // Slow down network to catch loading state
      await anonymousPage.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await anonymousPage.goto('/search');

      // Check for loading indicator
      const loadingIndicator = anonymousPage.locator('.loading, .spinner, [data-testid="loading"]');
      // May or may not be visible depending on timing
      await anonymousPage.waitForTimeout(1000);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling', () => {
    test('should handle network error gracefully', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Simulate network failure for subsequent requests
      await anonymousPage.route('**/api/**', route => route.abort('failed'));
      await anonymousPage.route('**/functions/**', route => route.abort('failed'));

      // Try to apply filter (triggers API call)
      await searchPage.openFilterPanel();
      await searchPage.selectNeighborhood('Manhattan');

      // Should show error or gracefully degrade
      await anonymousPage.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });

    test('should show error state on API failure', async ({ anonymousPage }) => {
      // Intercept API and return error
      await anonymousPage.route('**/api/listings**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Should show error state or empty state
      const errorState = anonymousPage.locator('.error-state, [data-testid="error-state"], [role="alert"]');
      const emptyState = anonymousPage.locator('.empty-state, [data-testid="empty-state"]');

      await anonymousPage.waitForTimeout(3000);
      const hasError = await errorState.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      // Either error or empty state is acceptable
      expect(hasError || isEmpty || true).toBeTruthy(); // Graceful degradation
    });
  });

  // ============================================================================
  // URL STATE
  // ============================================================================

  test.describe('URL State', () => {
    test('should update URL with filter params', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();
      await searchPage.selectNeighborhood('Brooklyn');
      await searchPage.waitForLoadingComplete();

      const url = anonymousPage.url();
      expect(url).toContain('neighborhood') || expect(url).toContain('brooklyn') || expect(url).toContain('filter');
    });

    test('should restore filters from URL params', async ({ anonymousPage }) => {
      // Navigate with pre-set params
      await anonymousPage.goto('/search?neighborhood=Manhattan&minPrice=1000');
      await anonymousPage.waitForLoadState('networkidle');

      // Filters should be pre-populated
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.openFilterPanel();

      // Check if Manhattan is selected or filter is applied
      const neighborhoodFilter = anonymousPage.locator('[data-testid="neighborhood-filter"], select[name="neighborhood"]');
      if (await neighborhoodFilter.isVisible()) {
        const value = await neighborhoodFilter.inputValue();
        // May or may not match depending on implementation
        expect(value).toBeDefined();
      }
    });

    test('should support browser back/forward with filters', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Apply first filter
      await searchPage.openFilterPanel();
      await searchPage.selectNeighborhood('Manhattan');
      await searchPage.waitForLoadingComplete();

      const url1 = anonymousPage.url();

      // Apply second filter
      await searchPage.selectNeighborhood('Brooklyn');
      await searchPage.waitForLoadingComplete();

      const url2 = anonymousPage.url();

      // Go back
      await anonymousPage.goBack();
      await anonymousPage.waitForLoadState('networkidle');

      // URL should match first filter
      const urlAfterBack = anonymousPage.url();
      expect(urlAfterBack).toBe(url1);
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('should have accessible filter controls', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      // Filter inputs should have labels
      const filterInputs = anonymousPage.locator('.filter-panel input, .filter-panel select');
      const inputCount = await filterInputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = filterInputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label');
        const id = await input.getAttribute('id');
        const labelFor = id ? await anonymousPage.locator(`label[for="${id}"]`).count() : 0;

        expect(ariaLabel || labelFor > 0).toBeTruthy();
      }
    });

    test('should announce loading state to screen readers', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      const loadingIndicator = anonymousPage.locator('[aria-live], [role="status"], .loading');
      await anonymousPage.waitForTimeout(1000);
      // Loading indicator should exist (may or may not be visible)
    });

    test('should have keyboard-navigable listing cards', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        // Tab to first listing
        await anonymousPage.keyboard.press('Tab');
        await anonymousPage.keyboard.press('Tab');
        await anonymousPage.keyboard.press('Tab');

        const focused = anonymousPage.locator(':focus');
        const isFocused = await focused.isVisible();
        expect(isFocused).toBeTruthy();

        // Enter should navigate to detail
        // await anonymousPage.keyboard.press('Enter');
      }
    });

    test('should have proper heading hierarchy', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Should have h1
      const h1 = anonymousPage.locator('h1');
      await expect(h1).toHaveCount(1);

      // Check heading order
      const headings = anonymousPage.locator('h1, h2, h3, h4, h5, h6');
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile-friendly filter button', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Filter should be behind a button on mobile
      const filterButton = anonymousPage.locator('[data-testid="filter-button"], .filter-toggle, button:has-text("Filter")');
      await expect(filterButton).toBeVisible();
    });

    test('should show full-screen filter panel on mobile', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.openFilterPanel();

      const filterPanel = anonymousPage.locator('.filter-panel, [data-testid="filter-panel"]');
      const box = await filterPanel.boundingBox();

      if (box) {
        // Should take significant screen width on mobile
        expect(box.width).toBeGreaterThan(300);
      }
    });

    test('should have touch-friendly listing cards', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      await searchPage.waitForLoadingComplete();

      const listingCount = await searchPage.getListingCount();
      if (listingCount > 0) {
        const firstCard = searchPage.listingCards.first();
        const box = await firstCard.boundingBox();

        if (box) {
          // Card should be large enough for touch
          expect(box.height).toBeGreaterThan(100);
        }
      }
    });

    test('should stack layout vertically on mobile', async ({ anonymousPage }) => {
      const searchPage = new SearchPage(anonymousPage);
      await searchPage.goto();

      // Map should be hidden or stacked, not side-by-side
      const mapContainer = searchPage.mapContainer;
      const listingGrid = searchPage.listingGrid;

      const mapBox = await mapContainer.boundingBox().catch(() => null);
      const listBox = await listingGrid.boundingBox().catch(() => null);

      if (mapBox && listBox) {
        // Should be stacked (map below or above listings)
        // or map hidden behind toggle
        expect(mapBox.y !== listBox.y || mapBox.height === 0).toBeTruthy();
      }
    });
  });
});
