/**
 * Base Page Object
 *
 * Abstract base class for all Page Object Models.
 * Provides common functionality and patterns.
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:8000';
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /**
   * Navigate to this page's URL
   */
  abstract goto(): Promise<void>;

  /**
   * Get the page URL path
   */
  abstract getPath(): string;

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to a specific URL
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  // ============================================================================
  // COMMON ELEMENTS
  // ============================================================================

  /**
   * Get the header component
   */
  get header(): Locator {
    return this.page.locator('header, .header, [data-testid="header"]');
  }

  /**
   * Get the footer component
   */
  get footer(): Locator {
    return this.page.locator('footer, .footer, [data-testid="footer"]');
  }

  /**
   * Get the main content area
   */
  get mainContent(): Locator {
    return this.page.locator('main, .main-content, [role="main"]');
  }

  /**
   * Get loading spinner/indicator
   */
  get loadingIndicator(): Locator {
    return this.page.locator('.spinner, .loading, [data-testid="loading"], [aria-busy="true"]');
  }

  /**
   * Get toast notifications
   */
  get toast(): Locator {
    return this.page.locator('.toast, [data-testid="toast"], [role="alert"]');
  }

  /**
   * Get error messages
   */
  get errorMessage(): Locator {
    return this.page.locator('.error-message, .error-state, [data-testid="error"]');
  }

  // ============================================================================
  // COMMON ACTIONS
  // ============================================================================

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for any loading indicators to disappear
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      // Ignore if no loading indicator found
    });
  }

  /**
   * Scroll to element
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if element exists
   */
  async elementExists(locator: Locator): Promise<boolean> {
    const count = await locator.count();
    return count > 0;
  }

  /**
   * Get text content of element
   */
  async getTextContent(locator: Locator): Promise<string | null> {
    return locator.textContent();
  }

  /**
   * Click element with retry
   */
  async clickWithRetry(locator: Locator, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await locator.click({ timeout: 5000 });
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Fill input with clear
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page title
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Assert URL contains
   */
  async assertUrlContains(text: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(text));
  }

  /**
   * Assert element visible
   */
  async assertElementVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert element hidden
   */
  async assertElementHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Assert element has text
   */
  async assertElementText(locator: Locator, expectedText: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(expectedText);
  }

  /**
   * Assert element count
   */
  async assertElementCount(locator: Locator, count: number): Promise<void> {
    await expect(locator).toHaveCount(count);
  }

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  /**
   * Check for accessibility violations using axe-core
   * Note: Requires @axe-core/playwright package
   */
  async checkAccessibility(): Promise<void> {
    // This is a placeholder - implement with axe-core
    // const accessibilityScanResults = await new AxeBuilder({ page: this.page }).analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);
  }

  /**
   * Assert element has accessible name
   */
  async assertAccessibleName(locator: Locator, name: string | RegExp): Promise<void> {
    await expect(locator).toHaveAccessibleName(name);
  }

  /**
   * Assert element has role
   */
  async assertRole(locator: Locator, role: string): Promise<void> {
    await expect(locator).toHaveRole(role as any);
  }

  // ============================================================================
  // MOBILE HELPERS
  // ============================================================================

  /**
   * Check if viewport is mobile
   */
  async isMobileViewport(): Promise<boolean> {
    const viewportSize = this.page.viewportSize();
    return viewportSize ? viewportSize.width < 768 : false;
  }

  /**
   * Get viewport width
   */
  async getViewportWidth(): Promise<number> {
    const viewportSize = this.page.viewportSize();
    return viewportSize?.width || 0;
  }

  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }
}
