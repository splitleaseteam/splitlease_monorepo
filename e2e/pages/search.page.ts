/**
 * Search Page Object Model
 *
 * Represents the search/listings page at /search
 * Features: Listing grid, filters, map view, schedule selector
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Structure
  get searchPage(): Locator {
    return this.page.locator('.search-page, [data-testid="search-page"]');
  }

  get listingsColumn(): Locator {
    return this.page.locator('.listings-column, [data-testid="listings-column"]');
  }

  get mapColumn(): Locator {
    return this.page.locator('.map-column, [data-testid="map-column"]');
  }

  // Schedule Selector
  get scheduleSelector(): Locator {
    return this.page.locator('#schedule-selector-mount-point, [data-testid="schedule-selector"]');
  }

  get mobileScheduleSelector(): Locator {
    return this.page.locator('#schedule-selector-mount-point-mobile, .mobile-schedule-selector');
  }

  get dayButtons(): Locator {
    return this.scheduleSelector.locator('.day-button, [data-testid="day-button"]');
  }

  // Filters
  get filterToggleButton(): Locator {
    return this.page.locator('.filter-toggle-btn-new, [data-testid="filter-toggle"]');
  }

  get filterPopup(): Locator {
    return this.page.locator('.filter-popup, [data-testid="filter-popup"]');
  }

  get filterBadge(): Locator {
    return this.filterToggleButton.locator('.filter-badge');
  }

  // Borough Filter
  get boroughSelect(): Locator {
    return this.filterPopup.locator('[data-testid="borough-filter"], .borough-filter');
  }

  // Neighborhood Filter
  get neighborhoodFilter(): Locator {
    return this.filterPopup.locator('[data-testid="neighborhood-filter"], .neighborhood-filter');
  }

  get neighborhoodSearchInput(): Locator {
    return this.filterPopup.locator('input[id*="neighborhoodSearch"]');
  }

  // Week Pattern Filter
  get weekPatternSelect(): Locator {
    return this.filterPopup.locator('select').filter({ hasText: /every week/i }).first();
  }

  // Price Filter
  get priceSelect(): Locator {
    return this.filterPopup.locator('select').filter({ hasText: /all prices/i }).first();
  }

  // Sort
  get sortSelect(): Locator {
    return this.page.locator('.sort-select, [data-testid="sort-select"]');
  }

  // Filter Tags
  get filterTagsRow(): Locator {
    return this.page.locator('.filter-tags-row, [data-testid="filter-tags"]');
  }

  get filterTags(): Locator {
    return this.filterTagsRow.locator('.filter-tag');
  }

  get clearAllFiltersButton(): Locator {
    return this.filterPopup.locator('button', { hasText: /clear all/i });
  }

  get applyFiltersButton(): Locator {
    return this.filterPopup.locator('button', { hasText: /apply/i });
  }

  // Results Header
  get resultsHeader(): Locator {
    return this.page.locator('.results-header, [data-testid="results-header"]');
  }

  get resultsCount(): Locator {
    return this.page.locator('.results-count, [data-testid="results-count"]');
  }

  // Listings
  get listingsContainer(): Locator {
    return this.page.locator('.listings-container, [data-testid="listings-container"]');
  }

  get listingCards(): Locator {
    return this.page.locator('[data-listing-id], .listing-card, .property-card');
  }

  get loadMoreSentinel(): Locator {
    return this.page.locator('.lazy-load-sentinel');
  }

  // Empty/Error States
  get emptyState(): Locator {
    return this.page.locator('.no-results-notice, [data-testid="empty-state"]');
  }

  get errorState(): Locator {
    return this.page.locator('.error-message, [data-testid="error-state"]');
  }

  get loadingState(): Locator {
    return this.page.locator('.loading-skeleton, [data-testid="loading-state"]');
  }

  // Map
  get googleMap(): Locator {
    return this.mapColumn.locator('.gm-style, [data-testid="google-map"]');
  }

  get mapMarkers(): Locator {
    return this.mapColumn.locator('.map-marker, [data-testid="map-marker"]');
  }

  // Mobile Elements
  get mobileFilterBar(): Locator {
    return this.page.locator('.mobile-filter-bar, [data-testid="mobile-filter-bar"]');
  }

  get mobileMapFab(): Locator {
    return this.page.locator('.mobile-map-fab, [data-testid="mobile-map-button"]');
  }

  get mobileFilterSheet(): Locator {
    return this.page.locator('.mobile-filter-sheet, [data-testid="mobile-filter-sheet"]');
  }

  get mobileMapModal(): Locator {
    return this.page.locator('.mobile-map-modal, [data-testid="mobile-map-modal"]');
  }

  // Check-in/Check-out Display
  get checkInCheckOutBlock(): Locator {
    return this.page.locator('.checkin-block, [data-testid="checkin-block"]');
  }

  // Auth Modal
  get authModal(): Locator {
    return this.page.locator('[data-testid="auth-modal"], .signup-login-modal');
  }

  // Contact Host Modal
  get contactHostModal(): Locator {
    return this.page.locator('[data-testid="contact-host-modal"], .contact-host-modal');
  }

  // Create Proposal Modal
  get createProposalModal(): Locator {
    return this.page.locator('[data-testid="create-proposal-modal"], .create-proposal-flow');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    await this.page.goto('/search');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  async gotoWithDays(days: number[]): Promise<void> {
    const daysParam = days.join(',');
    await this.page.goto(`/search?days-selected=${daysParam}`);
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  async gotoWithFilters(filters: {
    days?: number[];
    borough?: string;
    priceRange?: string;
  }): Promise<void> {
    const params = new URLSearchParams();
    if (filters.days) {
      params.set('days-selected', filters.days.join(','));
    }
    if (filters.borough) {
      params.set('borough', filters.borough);
    }
    const queryString = params.toString();
    await this.page.goto(`/search${queryString ? `?${queryString}` : ''}`);
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return '/search';
  }

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================

  /**
   * Open the filter popup
   */
  async openFilters(): Promise<void> {
    await this.filterToggleButton.click();
    await this.filterPopup.waitFor({ state: 'visible' });
  }

  /**
   * Close the filter popup
   */
  async closeFilters(): Promise<void> {
    // Click apply or close button
    const closeButton = this.filterPopup.locator('button', { hasText: /cancel|close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await this.applyFiltersButton.click();
    }
    await this.filterPopup.waitFor({ state: 'hidden' });
  }

  /**
   * Apply filters
   */
  async applyFilters(): Promise<void> {
    await this.applyFiltersButton.click();
    await this.filterPopup.waitFor({ state: 'hidden' });
    await this.waitForLoadingComplete();
  }

  /**
   * Clear all filters
   */
  async clearAllFilters(): Promise<void> {
    if (await this.filterPopup.isHidden()) {
      await this.openFilters();
    }
    await this.clearAllFiltersButton.click();
    await this.applyFilters();
  }

  /**
   * Select borough(s)
   */
  async selectBorough(borough: string): Promise<void> {
    if (await this.filterPopup.isHidden()) {
      await this.openFilters();
    }
    // Find and click the borough checkbox/option
    const boroughOption = this.boroughSelect.locator(`text=${borough}`);
    await boroughOption.click();
  }

  /**
   * Set price range
   */
  async setPriceRange(range: 'all' | 'under-200' | '200-350' | '350-500' | '500-plus'): Promise<void> {
    if (await this.filterPopup.isHidden()) {
      await this.openFilters();
    }
    await this.priceSelect.selectOption(range);
  }

  /**
   * Set week pattern
   */
  async setWeekPattern(pattern: 'every-week' | 'one-on-off' | 'two-on-off' | 'one-three-off'): Promise<void> {
    if (await this.filterPopup.isHidden()) {
      await this.openFilters();
    }
    await this.weekPatternSelect.selectOption(pattern);
  }

  /**
   * Search for neighborhood
   */
  async searchNeighborhood(query: string): Promise<void> {
    if (await this.filterPopup.isHidden()) {
      await this.openFilters();
    }
    await this.neighborhoodSearchInput.fill(query);
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Set sort option
   */
  async setSortBy(option: 'recommended' | 'price-low' | 'most-viewed' | 'recent'): Promise<void> {
    await this.sortSelect.selectOption(option);
    await this.waitForLoadingComplete();
  }

  /**
   * Remove a filter tag
   */
  async removeFilterTag(index: number = 0): Promise<void> {
    const tag = this.filterTags.nth(index);
    const removeButton = tag.locator('.filter-tag-remove');
    await removeButton.click();
    await this.waitForLoadingComplete();
  }

  // ============================================================================
  // SCHEDULE SELECTOR ACTIONS
  // ============================================================================

  /**
   * Select a day (0-based index: 0=Sun, 1=Mon, etc.)
   */
  async selectDay(dayIndex: number): Promise<void> {
    const dayButton = this.dayButtons.nth(dayIndex);
    await dayButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Select multiple days
   */
  async selectDays(dayIndices: number[]): Promise<void> {
    for (const index of dayIndices) {
      await this.selectDay(index);
    }
  }

  /**
   * Deselect a day
   */
  async deselectDay(dayIndex: number): Promise<void> {
    const dayButton = this.dayButtons.nth(dayIndex);
    const isSelected = await dayButton.getAttribute('class');
    if (isSelected?.includes('selected') || isSelected?.includes('active')) {
      await dayButton.click();
      await this.waitForLoadingComplete();
    }
  }

  // ============================================================================
  // LISTING ACTIONS
  // ============================================================================

  /**
   * Click on a listing card
   */
  async clickListing(index: number = 0): Promise<void> {
    const card = this.listingCards.nth(index);
    await card.click();
    await this.page.waitForURL(/view-split-lease/);
  }

  /**
   * Get listing card by ID
   */
  getListingCard(listingId: string): Locator {
    return this.page.locator(`[data-listing-id="${listingId}"]`);
  }

  /**
   * Click favorite button on listing
   */
  async toggleFavorite(index: number = 0): Promise<void> {
    const card = this.listingCards.nth(index);
    const favoriteBtn = card.locator('.favorite-button, [data-testid="favorite-button"]');
    await favoriteBtn.click();
  }

  /**
   * Click message button on listing
   */
  async clickMessageButton(index: number = 0): Promise<void> {
    const card = this.listingCards.nth(index);
    const messageBtn = card.locator('button', { hasText: /message/i });
    await messageBtn.click();
    await this.contactHostModal.waitFor({ state: 'visible' });
  }

  /**
   * Click create proposal button on listing
   */
  async clickCreateProposal(index: number = 0): Promise<void> {
    const card = this.listingCards.nth(index);
    const proposalBtn = card.locator('button', { hasText: /create proposal|book/i });
    await proposalBtn.click();
  }

  /**
   * Load more listings (scroll to sentinel)
   */
  async loadMoreListings(): Promise<void> {
    if (await this.loadMoreSentinel.isVisible()) {
      await this.loadMoreSentinel.scrollIntoViewIfNeeded();
      await this.waitForLoadingComplete();
    }
  }

  // ============================================================================
  // MAP ACTIONS
  // ============================================================================

  /**
   * Open mobile map view
   */
  async openMobileMap(): Promise<void> {
    if (await this.isMobileViewport()) {
      await this.mobileMapFab.click();
      await this.mobileMapModal.waitFor({ state: 'visible' });
    }
  }

  /**
   * Close mobile map view
   */
  async closeMobileMap(): Promise<void> {
    if (await this.mobileMapModal.isVisible()) {
      const closeBtn = this.mobileMapModal.locator('.mobile-map-close-btn');
      await closeBtn.click();
      await this.mobileMapModal.waitFor({ state: 'hidden' });
    }
  }

  // ============================================================================
  // MOBILE FILTER ACTIONS
  // ============================================================================

  /**
   * Open mobile filter sheet
   */
  async openMobileFilters(): Promise<void> {
    if (await this.isMobileViewport()) {
      const filterBtn = this.mobileFilterBar.locator('button').first();
      await filterBtn.click();
      await this.mobileFilterSheet.waitFor({ state: 'visible' });
    }
  }

  /**
   * Close mobile filter sheet
   */
  async closeMobileFilters(): Promise<void> {
    if (await this.mobileFilterSheet.isVisible()) {
      const closeBtn = this.mobileFilterSheet.locator('.mobile-filter-close');
      await closeBtn.click();
      await this.mobileFilterSheet.waitFor({ state: 'hidden' });
    }
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.searchPage).toBeVisible();
    await expect(this.listingsColumn).toBeVisible();
  }

  /**
   * Assert listings are displayed
   */
  async assertListingsDisplayed(minCount: number = 1): Promise<void> {
    await this.waitForLoadingComplete();
    const count = await this.listingCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert no listings (empty state)
   */
  async assertEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert error state
   */
  async assertErrorState(): Promise<void> {
    await expect(this.errorState).toBeVisible();
  }

  /**
   * Assert results count displayed
   */
  async assertResultsCount(expectedCount: number): Promise<void> {
    await expect(this.resultsCount).toContainText(`${expectedCount}`);
  }

  /**
   * Assert filter is active
   */
  async assertFilterActive(filterName: string): Promise<void> {
    await expect(this.filterTags).toContainText(filterName);
  }

  /**
   * Assert map is visible (desktop)
   */
  async assertMapVisible(): Promise<void> {
    if (!(await this.isMobileViewport())) {
      await expect(this.mapColumn).toBeVisible();
      await expect(this.googleMap).toBeVisible();
    }
  }

  /**
   * Assert check-in/check-out days displayed
   */
  async assertCheckInOutDisplayed(): Promise<void> {
    await expect(this.checkInCheckOutBlock).toBeVisible();
    await expect(this.checkInCheckOutBlock).toContainText(/check-in/i);
    await expect(this.checkInCheckOutBlock).toContainText(/check-out/i);
  }

  /**
   * Get the count of listings displayed
   */
  async getListingCount(): Promise<number> {
    return this.listingCards.count();
  }

  /**
   * Assert schedule selector has days selected
   */
  async assertDaysSelected(dayIndices: number[]): Promise<void> {
    for (const index of dayIndices) {
      const dayButton = this.dayButtons.nth(index);
      await expect(dayButton).toHaveClass(/selected|active/);
    }
  }
}
