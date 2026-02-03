/**
 * Schedule Dashboard Page Object
 *
 * Page Object Model for the ScheduleDashboard (split lease scheduling) page.
 * Supports dual-perspective testing via ?as=sarah query parameter.
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type Perspective = 'alex' | 'sarah';

export class ScheduleDashboardPage extends BasePage {
  readonly leaseId: string;
  readonly perspective: Perspective;

  constructor(page: Page, leaseId: string = 'leases-123', perspective: Perspective = 'alex') {
    super(page);
    this.leaseId = leaseId;
    this.perspective = perspective;
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  getPath(): string {
    const basePath = `/schedule/${this.leaseId}`;
    return this.perspective === 'sarah' ? `${basePath}?as=sarah` : basePath;
  }

  async goto(): Promise<void> {
    await this.page.goto(this.getPath());
    await this.waitForPageLoad();
  }

  async switchPerspective(perspective: Perspective): Promise<ScheduleDashboardPage> {
    const newPage = new ScheduleDashboardPage(this.page, this.leaseId, perspective);
    await newPage.goto();
    return newPage;
  }

  // ============================================================================
  // CALENDAR ELEMENTS
  // ============================================================================

  get calendar(): Locator {
    // There are two grids (two months), use first()
    return this.page.locator('[role="grid"]').first();
  }

  get calendarDays(): Locator {
    // Calendar day buttons are inside grid rows
    return this.page.locator('grid button, [role="grid"] button');
  }

  get userNights(): Locator {
    // User nights have "Your night" in aria-label
    return this.page.locator('button[aria-label*="Your night"]');
  }

  get roommateNights(): Locator {
    // Roommate nights are "Available to buy out" and NOT disabled
    return this.page.locator('button[aria-label*="Available to buy out"]:not([disabled])');
  }

  get pendingNights(): Locator {
    // Pending nights have "Pending request" in aria-label
    return this.page.locator('button[aria-label*="Pending request"]');
  }

  get selectedNight(): Locator {
    return this.page.locator('button[aria-pressed="true"], button[aria-selected="true"]');
  }

  get monthHeading(): Locator {
    // Month heading is an h3 with format "February 2026"
    return this.page.locator('h3').filter({ hasText: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/ }).first();
  }

  get monthNavigator(): Locator {
    // The container with prev/next buttons
    return this.page.locator('button:has-text("Previous month")').locator('..');
  }

  get prevMonthButton(): Locator {
    return this.page.locator('button:has-text("Previous month"), button[aria-label="Previous month"]');
  }

  get nextMonthButton(): Locator {
    return this.page.locator('button:has-text("Next month"), button[aria-label="Next month"]');
  }

  // ============================================================================
  // BUY OUT DRAWER ELEMENTS
  // ============================================================================

  get buyOutDrawer(): Locator {
    // The drawer is expanded when button shows "Buying Out" and tablist is visible
    return this.page.locator('button[aria-expanded="true"]:has-text("Buying Out"), button[aria-expanded="true"]:has-text("Create a Request")').locator('..').locator('>> [role="tablist"]').locator('..');
  }

  get buyOutDrawerToggle(): Locator {
    // The button that expands/collapses the drawer
    return this.page.locator('button:has-text("Buying Out"), button:has-text("Create a Request")');
  }

  get buyOutButton(): Locator {
    // "Send Offer" button in the drawer
    return this.page.locator('button:has-text("Send Offer")');
  }

  get shareButton(): Locator {
    return this.page.locator('button:has-text("Send Offer")');
  }

  get swapButton(): Locator {
    return this.page.locator('button:has-text("Send Offer"), button:has-text("Offer Swap")');
  }

  get requestTypeSelector(): Locator {
    // The tablist with Buyout/Swap/Share tabs
    return this.page.locator('[role="tablist"]').first();
  }

  get buyoutOption(): Locator {
    return this.page.locator('[role="tab"]:has-text("Buyout")');
  }

  get shareOption(): Locator {
    return this.page.locator('[role="tab"]:has-text("Share")');
  }

  get swapOption(): Locator {
    return this.page.locator('[role="tab"]:has-text("Swap")');
  }

  get priceDisplay(): Locator {
    // The spinbutton showing the price
    return this.page.locator('[role="spinbutton"], input[type="number"]');
  }

  get cancelButton(): Locator {
    return this.page.locator('button:has-text("✕"), button:has-text("Cancel")');
  }

  // ============================================================================
  // CHAT THREAD ELEMENTS
  // ============================================================================

  get chatThread(): Locator {
    return this.page.locator('.chat-thread, [data-testid="chat-thread"]');
  }

  get chatMessages(): Locator {
    return this.page.locator('.chat-bubble, [data-testid="chat-message"]');
  }

  get chatInput(): Locator {
    return this.page.locator('.chat-thread__input, [data-testid="chat-input"], textarea[placeholder*="message"]');
  }

  get chatSendButton(): Locator {
    return this.page.locator('.chat-thread__send-btn, [data-testid="send-message"], button:has-text("Send")');
  }

  get requestMessages(): Locator {
    return this.page.locator('.chat-bubble--request, [data-type="request"]');
  }

  get pendingRequests(): Locator {
    return this.page.locator('.chat-bubble--request:not(.chat-bubble__status--accepted):not(.chat-bubble__status--declined)');
  }

  // ============================================================================
  // REQUEST ACTION BUTTONS
  // ============================================================================

  get acceptButton(): Locator {
    return this.page.locator('.chat-bubble__action-btn--accept, button:has-text("Accept")');
  }

  get declineButton(): Locator {
    return this.page.locator('.chat-bubble__action-btn--decline, button:has-text("Decline")');
  }

  get counterButton(): Locator {
    return this.page.locator('.counter-menu__trigger, button:has-text("Counter")');
  }

  get counterPriceOption(): Locator {
    return this.page.locator('.counter-menu__item:has-text("Counter with Price"), button:has-text("Counter with Price")');
  }

  get counterSwapOption(): Locator {
    return this.page.locator('.counter-menu__item:has-text("Swap Instead"), button:has-text("Swap Instead")');
  }

  // ============================================================================
  // TRANSACTION HISTORY ELEMENTS
  // ============================================================================

  get transactionHistory(): Locator {
    return this.page.locator('.transaction-history, [data-testid="transaction-history"]');
  }

  get transactionItems(): Locator {
    return this.page.locator('.transaction-item, [data-testid="transaction-item"]');
  }

  get transactionDetails(): Locator {
    return this.page.locator('.transaction-details, [data-testid="transaction-details"]');
  }

  // ============================================================================
  // STATUS INDICATORS
  // ============================================================================

  get acceptedStatus(): Locator {
    return this.page.locator('.chat-bubble__status--accepted, [data-status="accepted"]');
  }

  get declinedStatus(): Locator {
    return this.page.locator('.chat-bubble__status--declined, [data-status="declined"]');
  }

  get pendingStatus(): Locator {
    return this.page.locator('[data-status="pending"]');
  }

  // ============================================================================
  // CALENDAR ACTIONS
  // ============================================================================

  /**
   * Click on a specific day in the calendar
   * @param dayNumber - Day of month (1-31)
   */
  async clickDay(dayNumber: number): Promise<void> {
    const dayCell = this.page.locator(`.calendar-day:has-text("${dayNumber}"), .day-cell:has-text("${dayNumber}")`).first();
    await dayCell.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on a roommate's night to initiate a request
   * @param index - Index of roommate night (0-based)
   */
  async clickRoommateNight(index: number = 0): Promise<void> {
    await this.roommateNights.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on user's own night (for swap offers)
   * @param index - Index of user night (0-based)
   */
  async clickUserNight(index: number = 0): Promise<void> {
    await this.userNights.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to next month
   */
  async goToNextMonth(): Promise<void> {
    await this.nextMonthButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to previous month
   */
  async goToPrevMonth(): Promise<void> {
    await this.prevMonthButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================================================
  // REQUEST ACTIONS
  // ============================================================================

  /**
   * Select a roommate night and submit a buyout request
   */
  async submitBuyoutRequest(nightIndex: number = 0): Promise<void> {
    await this.clickRoommateNight(nightIndex);
    await this.waitForElement(this.buyOutDrawer);

    // Select buyout if not already selected
    if (await this.buyoutOption.isVisible()) {
      await this.buyoutOption.click();
    }

    await this.buyOutButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select a roommate night and submit a share request
   */
  async submitShareRequest(nightIndex: number = 0): Promise<void> {
    await this.clickRoommateNight(nightIndex);
    await this.waitForElement(this.buyOutDrawer);

    if (await this.shareOption.isVisible()) {
      await this.shareOption.click();
    }

    await this.shareButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Accept the most recent pending request
   */
  async acceptRequest(): Promise<void> {
    const acceptBtn = this.acceptButton.first();
    await acceptBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Decline the most recent pending request
   */
  async declineRequest(): Promise<void> {
    const declineBtn = this.declineButton.first();
    await declineBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Open counter menu and select counter with price
   */
  async counterWithPrice(): Promise<void> {
    await this.counterButton.first().click();
    await this.page.waitForTimeout(200);
    await this.counterPriceOption.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Open counter menu and select counter with swap
   */
  async counterWithSwap(): Promise<void> {
    await this.counterButton.first().click();
    await this.page.waitForTimeout(200);
    await this.counterSwapOption.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================================================
  // CHAT ACTIONS
  // ============================================================================

  /**
   * Send a chat message
   */
  async sendMessage(message: string): Promise<void> {
    await this.chatInput.fill(message);
    await this.chatSendButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the text of the most recent message
   */
  async getLastMessageText(): Promise<string | null> {
    const lastMessage = this.chatMessages.last();
    return lastMessage.textContent();
  }

  /**
   * Get count of request messages
   */
  async getRequestMessageCount(): Promise<number> {
    return this.requestMessages.count();
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.calendar).toBeVisible();
  }

  /**
   * Assert a request was created (message appears in chat)
   */
  async assertRequestCreated(requestType: 'buyout' | 'share' | 'swap'): Promise<void> {
    const requestText = requestType === 'buyout'
      ? /buy out|buyout/i
      : requestType === 'share'
        ? /share/i
        : /swap/i;

    const lastMessage = this.chatMessages.last();
    await expect(lastMessage).toContainText(requestText);
  }

  /**
   * Assert request status changed
   */
  async assertRequestAccepted(): Promise<void> {
    await expect(this.acceptedStatus.first()).toBeVisible();
  }

  /**
   * Assert request was declined
   */
  async assertRequestDeclined(): Promise<void> {
    await expect(this.declinedStatus.first()).toBeVisible();
  }

  /**
   * Assert night ownership changed (after accepted request)
   * @param expectedCount - Expected count of user nights
   */
  async assertUserNightCount(expectedCount: number): Promise<void> {
    await expect(this.userNights).toHaveCount(expectedCount);
  }

  /**
   * Assert roommate night count
   */
  async assertRoommateNightCount(expectedCount: number): Promise<void> {
    await expect(this.roommateNights).toHaveCount(expectedCount);
  }

  /**
   * Assert drawer is open
   */
  async assertDrawerOpen(): Promise<void> {
    // Drawer is open when the tablist with Buyout/Swap/Share is visible
    await expect(this.requestTypeSelector).toBeVisible();
  }

  /**
   * Assert drawer is closed
   */
  async assertDrawerClosed(): Promise<void> {
    // Drawer is closed when "Select a Night" heading is visible
    const selectNightPrompt = this.page.locator('h3:has-text("Select a Night")');
    await expect(selectNightPrompt).toBeVisible();
  }

  /**
   * Assert price is displayed
   */
  async assertPriceDisplayed(): Promise<void> {
    await expect(this.priceDisplay).toBeVisible();
    const priceValue = await this.priceDisplay.inputValue();
    expect(parseFloat(priceValue)).toBeGreaterThan(0);
  }

  /**
   * Get displayed price value
   */
  async getDisplayedPrice(): Promise<number | null> {
    const priceValue = await this.priceDisplay.inputValue();
    if (!priceValue) return null;
    return parseFloat(priceValue);
  }

  // ============================================================================
  // LOCAL STORAGE HELPERS
  // ============================================================================

  /**
   * Clear local storage to reset state
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Get schedule state from local storage
   */
  async getScheduleState(): Promise<unknown> {
    return this.page.evaluate(() => {
      const state = localStorage.getItem('scheduleState');
      return state ? JSON.parse(state) : null;
    });
  }
}
