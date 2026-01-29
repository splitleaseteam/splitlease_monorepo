/**
 * Home Page Object Model
 *
 * Represents the landing page at /
 * Features: Hero section, value props, schedule selector, featured listings
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Hero Section
  get heroSection(): Locator {
    return this.page.locator('.hero-section, [data-testid="hero-section"]');
  }

  get heroTitle(): Locator {
    return this.page.locator('.hero-title, [data-testid="hero-title"]');
  }

  get heroSubtitle(): Locator {
    return this.page.locator('.hero-subtitle, [data-testid="hero-subtitle"]');
  }

  get exploreRentalsButton(): Locator {
    return this.page.locator('.cta-primary, [data-testid="explore-rentals-btn"]', { hasText: /explore rentals/i });
  }

  get heroStats(): Locator {
    return this.page.locator('.hero-stats, [data-testid="hero-stats"]');
  }

  // Schedule Selector
  get scheduleSelector(): Locator {
    return this.page.locator('#hero-schedule-selector, [data-testid="schedule-selector"]');
  }

  get dayButtons(): Locator {
    return this.scheduleSelector.locator('.day-button, [data-testid="day-button"]');
  }

  // Value Propositions
  get valuePropsSection(): Locator {
    return this.page.locator('.value-props, [data-testid="value-props"]');
  }

  get valueCards(): Locator {
    return this.page.locator('.value-card, [data-testid="value-card"]');
  }

  // Schedule Section (Choose Your Split Schedule)
  get scheduleSection(): Locator {
    return this.page.locator('.schedule-section, [data-testid="schedule-section"]');
  }

  get scheduleTabs(): Locator {
    return this.page.locator('.schedule-section-tab, [data-testid="schedule-tab"]');
  }

  get weeknightsTab(): Locator {
    return this.scheduleTabs.filter({ hasText: /weeknights/i });
  }

  get weekendsTab(): Locator {
    return this.scheduleTabs.filter({ hasText: /weekends/i });
  }

  get weeksOfMonthTab(): Locator {
    return this.scheduleTabs.filter({ hasText: /weeks of the month/i });
  }

  // Featured Listings
  get featuredSection(): Locator {
    return this.page.locator('.featured-spaces, [data-testid="featured-spaces"]');
  }

  get featuredListingCards(): Locator {
    return this.page.locator('.space-card, [data-testid="listing-card"]');
  }

  get browseAllButton(): Locator {
    return this.page.locator('.spaces-cta-button, [data-testid="browse-all-btn"]');
  }

  // Support Section
  get supportSection(): Locator {
    return this.page.locator('.support-section-alt, [data-testid="support-section"]');
  }

  get liveChatLink(): Locator {
    return this.supportSection.locator('a', { hasText: /live chat/i });
  }

  get faqLink(): Locator {
    return this.supportSection.locator('a', { hasText: /faq/i });
  }

  get helpCenterLink(): Locator {
    return this.supportSection.locator('a', { hasText: /help center/i });
  }

  // Market Research Popup/Badge
  get marketResearchPopup(): Locator {
    return this.page.locator('.market-popup-container, [data-testid="market-popup"]');
  }

  get floatingBadge(): Locator {
    return this.page.locator('.floating-badge, [data-testid="floating-badge"]');
  }

  get aiResearchModal(): Locator {
    return this.page.locator('[data-testid="ai-research-modal"], .ai-signup-modal');
  }

  // Floating Avatars
  get floatingAvatars(): Locator {
    return this.page.locator('.floating-avatar');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  getPath(): string {
    return '/';
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Click Explore Rentals button
   */
  async clickExploreRentals(): Promise<void> {
    await this.exploreRentalsButton.click();
    await this.page.waitForURL(/search/);
  }

  /**
   * Select a day in the schedule selector
   */
  async selectDay(dayIndex: number): Promise<void> {
    const dayButton = this.dayButtons.nth(dayIndex);
    await dayButton.click();
  }

  /**
   * Select multiple days (0-based indices: 0=Sun, 1=Mon, etc.)
   */
  async selectDays(dayIndices: number[]): Promise<void> {
    for (const index of dayIndices) {
      await this.selectDay(index);
    }
  }

  /**
   * Click a schedule tab
   */
  async selectScheduleTab(tab: 'weeknights' | 'weekends' | 'weeks'): Promise<void> {
    switch (tab) {
      case 'weeknights':
        await this.weeknightsTab.click();
        break;
      case 'weekends':
        await this.weekendsTab.click();
        break;
      case 'weeks':
        await this.weeksOfMonthTab.click();
        break;
    }
  }

  /**
   * Click on a featured listing
   */
  async clickFeaturedListing(index: number = 0): Promise<void> {
    const card = this.featuredListingCards.nth(index);
    await card.click();
    await this.page.waitForURL(/view-split-lease/);
  }

  /**
   * Click Browse All NYC Spaces button
   */
  async clickBrowseAll(): Promise<void> {
    await this.browseAllButton.click();
    await this.page.waitForURL(/search/);
  }

  /**
   * Open the AI Research modal
   */
  async openAIResearchModal(): Promise<void> {
    // Try popup first, then floating badge
    if (await this.marketResearchPopup.isVisible()) {
      await this.marketResearchPopup.locator('button', { hasText: /request/i }).click();
    } else if (await this.floatingBadge.isVisible()) {
      await this.floatingBadge.click();
    }
    await this.aiResearchModal.waitFor({ state: 'visible' });
  }

  /**
   * Close the market research popup
   */
  async closeMarketResearchPopup(): Promise<void> {
    if (await this.marketResearchPopup.isVisible()) {
      const closeButton = this.marketResearchPopup.locator('.market-popup-close, button', { hasText: /later/i });
      await closeButton.click();
    }
  }

  /**
   * Navigate to support links
   */
  async clickLiveChat(): Promise<void> {
    await this.liveChatLink.click();
  }

  async clickFAQ(): Promise<void> {
    await this.faqLink.click();
  }

  async clickHelpCenter(): Promise<void> {
    await this.helpCenterLink.click();
    await this.page.waitForURL(/help-center/);
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert hero section is visible and has key elements
   */
  async assertHeroVisible(): Promise<void> {
    await expect(this.heroSection).toBeVisible();
    await expect(this.heroTitle).toBeVisible();
    await expect(this.heroSubtitle).toBeVisible();
    await expect(this.exploreRentalsButton).toBeVisible();
  }

  /**
   * Assert value propositions are displayed
   */
  async assertValuePropsVisible(): Promise<void> {
    await expect(this.valuePropsSection).toBeVisible();
    await expect(this.valueCards).toHaveCount(4);
  }

  /**
   * Assert schedule tabs are functional
   */
  async assertScheduleTabsWork(): Promise<void> {
    await expect(this.scheduleSection).toBeVisible();
    await expect(this.scheduleTabs).toHaveCount(3);

    // Verify each tab can be selected
    await this.weeknightsTab.click();
    await expect(this.weeknightsTab).toHaveClass(/active/);

    await this.weekendsTab.click();
    await expect(this.weekendsTab).toHaveClass(/active/);

    await this.weeksOfMonthTab.click();
    await expect(this.weeksOfMonthTab).toHaveClass(/active/);
  }

  /**
   * Assert featured listings are displayed
   */
  async assertFeaturedListingsVisible(): Promise<void> {
    await expect(this.featuredSection).toBeVisible();
    // Should have at least one listing or loading state
    const hasListings = await this.featuredListingCards.count() > 0;
    const isLoading = await this.featuredSection.locator('.loading').count() > 0;
    expect(hasListings || isLoading).toBeTruthy();
  }

  /**
   * Assert stats are displayed
   */
  async assertStatsVisible(): Promise<void> {
    await expect(this.heroStats).toBeVisible();
    // Check for specific stat values
    await expect(this.heroStats).toContainText(/10,000\+/);
    await expect(this.heroStats).toContainText(/\$18K/);
    await expect(this.heroStats).toContainText(/32,000\+/);
  }

  /**
   * Assert floating avatars are visible (desktop only)
   */
  async assertFloatingAvatarsVisible(): Promise<void> {
    if (!(await this.isMobileViewport())) {
      const count = await this.floatingAvatars.count();
      expect(count).toBeGreaterThan(0);
    }
  }

  /**
   * Assert support section is visible
   */
  async assertSupportSectionVisible(): Promise<void> {
    await expect(this.supportSection).toBeVisible();
    await expect(this.liveChatLink).toBeVisible();
    await expect(this.faqLink).toBeVisible();
    await expect(this.helpCenterLink).toBeVisible();
  }

  /**
   * Assert footer is visible
   */
  async assertFooterVisible(): Promise<void> {
    await expect(this.footer).toBeVisible();
  }

  /**
   * Full page assertion (happy path verification)
   */
  async assertPageFullyLoaded(): Promise<void> {
    await this.assertHeroVisible();
    await this.assertValuePropsVisible();
    await this.assertFeaturedListingsVisible();
    await this.assertSupportSectionVisible();
    await this.assertFooterVisible();
  }
}
