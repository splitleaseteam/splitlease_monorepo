/**
 * Admin Threads Page Object Model
 *
 * Represents the admin thread management page at /admin-threads
 * Features: Thread list, filtering, message viewing, reminders
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AdminThreadsPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Container
  get pageContainer(): Locator {
    return this.page.locator('.admin-threads, [data-testid="admin-threads-page"]');
  }

  // Admin Header
  get adminHeader(): Locator {
    return this.page.locator('.admin-header, [data-testid="admin-header"]');
  }

  // Stats Summary
  get statsSection(): Locator {
    return this.page.locator('.admin-threads__stats, [data-testid="stats-section"]');
  }

  get totalThreadsStat(): Locator {
    return this.statsSection.locator('.admin-threads__stat').nth(0);
  }

  get withMessagesStat(): Locator {
    return this.statsSection.locator('.admin-threads__stat').nth(1);
  }

  get recentActivityStat(): Locator {
    return this.statsSection.locator('.admin-threads__stat').nth(2);
  }

  // Filter Bar
  get filterBar(): Locator {
    return this.page.locator('.filter-bar, [data-testid="filter-bar"]');
  }

  get guestEmailFilter(): Locator {
    return this.filterBar.locator('input[name="guestEmail"], [data-testid="guest-email-filter"]');
  }

  get hostEmailFilter(): Locator {
    return this.filterBar.locator('input[name="hostEmail"], [data-testid="host-email-filter"]');
  }

  get proposalIdFilter(): Locator {
    return this.filterBar.locator('input[name="proposalId"], [data-testid="proposal-id-filter"]');
  }

  get threadIdFilter(): Locator {
    return this.filterBar.locator('input[name="threadId"], [data-testid="thread-id-filter"]');
  }

  get searchButton(): Locator {
    return this.filterBar.locator('button', { hasText: /search/i });
  }

  get clearFiltersButton(): Locator {
    return this.filterBar.locator('button', { hasText: /clear/i });
  }

  // Loading/Error/Empty States
  get loadingState(): Locator {
    return this.page.locator('.loading-state, [data-testid="loading-state"]');
  }

  get errorState(): Locator {
    return this.page.locator('.error-state, [data-testid="error-state"]');
  }

  get retryButton(): Locator {
    return this.errorState.locator('button', { hasText: /retry/i });
  }

  get emptyState(): Locator {
    return this.page.locator('.empty-state, [data-testid="empty-state"]');
  }

  // Thread List
  get threadList(): Locator {
    return this.page.locator('.thread-list, [data-testid="thread-list"]');
  }

  get threadCards(): Locator {
    return this.page.locator('.thread-card, [data-testid="thread-card"]');
  }

  // Thread Card Elements
  get threadGuestInfo(): Locator {
    return this.threadCards.locator('.guest-info, [data-testid="guest-info"]');
  }

  get threadHostInfo(): Locator {
    return this.threadCards.locator('.host-info, [data-testid="host-info"]');
  }

  get threadMessageCount(): Locator {
    return this.threadCards.locator('.message-count, [data-testid="message-count"]');
  }

  get threadLastActivity(): Locator {
    return this.threadCards.locator('.last-activity, [data-testid="last-activity"]');
  }

  // Thread Actions
  get viewMessagesButton(): Locator {
    return this.threadCards.locator('button', { hasText: /view messages|expand/i });
  }

  get deleteThreadButton(): Locator {
    return this.threadCards.locator('button', { hasText: /delete/i });
  }

  get sendReminderButton(): Locator {
    return this.threadCards.locator('button', { hasText: /reminder/i });
  }

  // Expanded Thread (Message View)
  get expandedThread(): Locator {
    return this.page.locator('.thread-card--expanded, [data-expanded="true"]');
  }

  get messageColumn(): Locator {
    return this.expandedThread.locator('.message-column, [data-testid="message-column"]');
  }

  get messageItems(): Locator {
    return this.messageColumn.locator('.message-item, [data-testid="message-item"]');
  }

  // Pagination
  get pagination(): Locator {
    return this.page.locator('.admin-threads__pagination, [data-testid="pagination"]');
  }

  get previousPageButton(): Locator {
    return this.pagination.locator('button', { hasText: /previous/i });
  }

  get nextPageButton(): Locator {
    return this.pagination.locator('button', { hasText: /next/i });
  }

  get pageInfo(): Locator {
    return this.pagination.locator('.admin-threads__pagination-info, [data-testid="page-info"]');
  }

  // Modals
  get confirmDialog(): Locator {
    return this.page.locator('[data-testid="confirm-dialog"], .confirm-dialog');
  }

  get confirmDialogConfirmButton(): Locator {
    return this.confirmDialog.locator('button', { hasText: /confirm|yes|delete/i });
  }

  get confirmDialogCancelButton(): Locator {
    return this.confirmDialog.locator('button', { hasText: /cancel|no/i });
  }

  get reminderModal(): Locator {
    return this.page.locator('[data-testid="reminder-modal"], .reminder-modal');
  }

  get reminderRecipientSelect(): Locator {
    return this.reminderModal.locator('select, [data-testid="recipient-select"]');
  }

  get reminderMethodSelect(): Locator {
    return this.reminderModal.locator('select[name="method"], [data-testid="method-select"]');
  }

  get reminderMessageInput(): Locator {
    return this.reminderModal.locator('textarea, [data-testid="reminder-message"]');
  }

  get sendReminderModalButton(): Locator {
    return this.reminderModal.locator('button', { hasText: /send/i });
  }

  get closeReminderModalButton(): Locator {
    return this.reminderModal.locator('button', { hasText: /cancel|close/i });
  }

  // Loading Overlay
  get loadingOverlay(): Locator {
    return this.page.locator('.admin-threads__loading-overlay, [data-testid="loading-overlay"]');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    await this.page.goto('/admin-threads');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return '/admin-threads';
  }

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================

  /**
   * Filter by guest email
   */
  async filterByGuestEmail(email: string): Promise<void> {
    await this.guestEmailFilter.fill(email);
    await this.searchButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by host email
   */
  async filterByHostEmail(email: string): Promise<void> {
    await this.hostEmailFilter.fill(email);
    await this.searchButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by proposal ID
   */
  async filterByProposalId(proposalId: string): Promise<void> {
    await this.proposalIdFilter.fill(proposalId);
    await this.searchButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by thread ID
   */
  async filterByThreadId(threadId: string): Promise<void> {
    await this.threadIdFilter.fill(threadId);
    await this.searchButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Apply multiple filters
   */
  async applyFilters(filters: {
    guestEmail?: string;
    hostEmail?: string;
    proposalId?: string;
    threadId?: string;
  }): Promise<void> {
    if (filters.guestEmail) {
      await this.guestEmailFilter.fill(filters.guestEmail);
    }
    if (filters.hostEmail) {
      await this.hostEmailFilter.fill(filters.hostEmail);
    }
    if (filters.proposalId) {
      await this.proposalIdFilter.fill(filters.proposalId);
    }
    if (filters.threadId) {
      await this.threadIdFilter.fill(filters.threadId);
    }
    await this.searchButton.click();
    await this.waitForLoadingComplete();
  }

  // ============================================================================
  // THREAD ACTIONS
  // ============================================================================

  /**
   * Expand a thread to view messages
   */
  async expandThread(index: number = 0): Promise<void> {
    const card = this.threadCards.nth(index);
    const expandBtn = card.locator('button', { hasText: /view messages|expand/i });
    await expandBtn.click();
    await this.expandedThread.waitFor({ state: 'visible' });
  }

  /**
   * Collapse expanded thread
   */
  async collapseThread(): Promise<void> {
    const collapseBtn = this.expandedThread.locator('button', { hasText: /collapse|close/i });
    await collapseBtn.click();
    await this.expandedThread.waitFor({ state: 'hidden' });
  }

  /**
   * Delete a thread
   */
  async deleteThread(index: number = 0): Promise<void> {
    const card = this.threadCards.nth(index);
    const deleteBtn = card.locator('button', { hasText: /delete/i });
    await deleteBtn.click();

    // Confirm deletion
    await this.confirmDialog.waitFor({ state: 'visible' });
    await this.confirmDialogConfirmButton.click();
    await this.confirmDialog.waitFor({ state: 'hidden' });
    await this.waitForLoadingComplete();
  }

  /**
   * Open reminder modal for a thread
   */
  async openReminderModal(index: number = 0): Promise<void> {
    const card = this.threadCards.nth(index);
    const reminderBtn = card.locator('button', { hasText: /reminder/i });
    await reminderBtn.click();
    await this.reminderModal.waitFor({ state: 'visible' });
  }

  /**
   * Send a reminder
   */
  async sendReminder(options: {
    recipient: 'guest' | 'host';
    method: 'email' | 'sms';
    message?: string;
  }): Promise<void> {
    await this.reminderRecipientSelect.selectOption(options.recipient);
    await this.reminderMethodSelect.selectOption(options.method);

    if (options.message) {
      await this.reminderMessageInput.fill(options.message);
    }

    await this.sendReminderModalButton.click();
    await this.reminderModal.waitFor({ state: 'hidden' });
  }

  /**
   * Close reminder modal
   */
  async closeReminderModal(): Promise<void> {
    await this.closeReminderModalButton.click();
    await this.reminderModal.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // PAGINATION ACTIONS
  // ============================================================================

  /**
   * Go to next page
   */
  async nextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Go to previous page
   */
  async previousPage(): Promise<void> {
    await this.previousPageButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const text = await this.pageInfo.textContent();
    const match = text?.match(/Page (\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.adminHeader).toBeVisible();
  }

  /**
   * Assert loading state
   */
  async assertLoading(): Promise<void> {
    await expect(this.loadingState).toBeVisible();
  }

  /**
   * Assert error state
   */
  async assertError(): Promise<void> {
    await expect(this.errorState).toBeVisible();
  }

  /**
   * Assert empty state
   */
  async assertEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Assert stats are displayed
   */
  async assertStatsDisplayed(): Promise<void> {
    await expect(this.statsSection).toBeVisible();
    await expect(this.totalThreadsStat).toBeVisible();
    await expect(this.withMessagesStat).toBeVisible();
    await expect(this.recentActivityStat).toBeVisible();
  }

  /**
   * Assert filter bar is visible
   */
  async assertFilterBarVisible(): Promise<void> {
    await expect(this.filterBar).toBeVisible();
    await expect(this.guestEmailFilter).toBeVisible();
    await expect(this.hostEmailFilter).toBeVisible();
  }

  /**
   * Assert threads are displayed
   */
  async assertThreadsDisplayed(minCount: number = 1): Promise<void> {
    const count = await this.threadCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert thread is expanded
   */
  async assertThreadExpanded(): Promise<void> {
    await expect(this.expandedThread).toBeVisible();
    await expect(this.messageColumn).toBeVisible();
  }

  /**
   * Assert messages are displayed in expanded thread
   */
  async assertMessagesDisplayed(minCount: number = 1): Promise<void> {
    const count = await this.messageItems.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert pagination is visible
   */
  async assertPaginationVisible(): Promise<void> {
    await expect(this.pagination).toBeVisible();
  }

  /**
   * Assert confirm dialog is visible
   */
  async assertConfirmDialogVisible(): Promise<void> {
    await expect(this.confirmDialog).toBeVisible();
  }

  /**
   * Assert reminder modal is visible
   */
  async assertReminderModalVisible(): Promise<void> {
    await expect(this.reminderModal).toBeVisible();
  }

  /**
   * Get thread count
   */
  async getThreadCount(): Promise<number> {
    return this.threadCards.count();
  }

  /**
   * Get total threads stat value
   */
  async getTotalThreadsStat(): Promise<number> {
    const text = await this.totalThreadsStat.locator('.admin-threads__stat-value').textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get message count in expanded thread
   */
  async getMessageCount(): Promise<number> {
    return this.messageItems.count();
  }
}
