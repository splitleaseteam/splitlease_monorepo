/**
 * Host Proposals Page Object Model
 *
 * Represents the host proposals dashboard at /host-proposals
 * Features: Listing selector, proposal sections, proposal actions
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HostProposalsPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Container
  get pageContainer(): Locator {
    return this.page.locator('.hp7-page, [data-testid="host-proposals-page"]');
  }

  // Page Header
  get pageHeader(): Locator {
    return this.page.locator('.hp7-page-header, [data-testid="page-header"]');
  }

  get pageTitle(): Locator {
    return this.pageHeader.locator('.hp7-page-title, h2');
  }

  // Listing Selector
  get listingSelector(): Locator {
    return this.page.locator('.listing-pill-selector, [data-testid="listing-selector"]');
  }

  get listingPills(): Locator {
    return this.listingSelector.locator('.listing-pill, [data-testid="listing-pill"]');
  }

  get selectedListingPill(): Locator {
    return this.listingSelector.locator('.listing-pill--selected, [data-selected="true"]');
  }

  // Loading/Error/Empty States
  get loadingState(): Locator {
    return this.page.locator('.loading-state, [data-testid="loading-state"]');
  }

  get errorState(): Locator {
    return this.page.locator('.hp7-empty-state[role="alert"], [data-testid="error-state"]');
  }

  get retryButton(): Locator {
    return this.errorState.locator('button', { hasText: /try again/i });
  }

  get emptyState(): Locator {
    return this.page.locator('.hp7-empty-state:not([role="alert"]), [data-testid="empty-state"]');
  }

  // Proposal Sections
  get sectionsContainer(): Locator {
    return this.page.locator('.hp7-sections, [data-testid="sections-container"]');
  }

  get actionNeededSection(): Locator {
    return this.page.locator('[data-section="actionNeeded"], .proposal-section--action-needed');
  }

  get inProgressSection(): Locator {
    return this.page.locator('[data-section="inProgress"], .proposal-section--in-progress');
  }

  get closedSection(): Locator {
    return this.page.locator('[data-section="closed"], .proposal-section--closed');
  }

  // Proposal Cards
  get proposalCards(): Locator {
    return this.page.locator('.collapsible-proposal-card, [data-testid="proposal-card"]');
  }

  get actionNeededCards(): Locator {
    return this.actionNeededSection.locator('.collapsible-proposal-card, [data-testid="proposal-card"]');
  }

  get inProgressCards(): Locator {
    return this.inProgressSection.locator('.collapsible-proposal-card, [data-testid="proposal-card"]');
  }

  get closedCards(): Locator {
    return this.closedSection.locator('.collapsible-proposal-card, [data-testid="proposal-card"]');
  }

  // Expanded Card Elements
  get expandedCard(): Locator {
    return this.page.locator('.collapsible-proposal-card--expanded, [data-expanded="true"]');
  }

  // Guest Info in Card
  get guestAvatar(): Locator {
    return this.expandedCard.locator('.guest-avatar, [data-testid="guest-avatar"]');
  }

  get guestName(): Locator {
    return this.expandedCard.locator('.guest-name, [data-testid="guest-name"]');
  }

  get guestVerifications(): Locator {
    return this.expandedCard.locator('.guest-verifications, [data-testid="guest-verifications"]');
  }

  get aiSummary(): Locator {
    return this.expandedCard.locator('.ai-summary, [data-testid="ai-summary"]');
  }

  // Schedule Display
  get dayPillsRow(): Locator {
    return this.expandedCard.locator('.day-pills-row, [data-testid="day-pills"]');
  }

  get scheduleDetails(): Locator {
    return this.expandedCard.locator('.schedule-details, [data-testid="schedule-details"]');
  }

  // Pricing
  get pricingInfo(): Locator {
    return this.expandedCard.locator('.pricing-info, [data-testid="pricing-info"]');
  }

  // Card Actions
  get viewProfileButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /view profile/i });
  }

  get messageGuestButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /message/i });
  }

  get scheduleMeetingButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /schedule.*meeting/i });
  }

  get acceptButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /accept/i });
  }

  get modifyButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /modify|counter/i });
  }

  get declineButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /decline/i });
  }

  get requestRentalAppButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /rental app/i });
  }

  get remindGuestButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /remind/i });
  }

  get removeButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /remove/i });
  }

  // Modals
  get proposalDetailsModal(): Locator {
    return this.page.locator('[data-testid="proposal-details-modal"], .proposal-details-modal');
  }

  get editingProposalOverlay(): Locator {
    return this.page.locator('.editing-proposal-overlay, [data-testid="editing-proposal"]');
  }

  get hostEditingProposal(): Locator {
    return this.page.locator('.host-editing-proposal, [data-testid="host-editing-proposal"]');
  }

  get virtualMeetingModal(): Locator {
    return this.page.locator('[data-testid="virtual-meeting-modal"], .virtual-meeting-manager');
  }

  get messageModal(): Locator {
    return this.page.locator('[data-testid="message-modal"], .contact-messaging-modal');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    await this.page.goto('/host-proposals');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return '/host-proposals';
  }

  // ============================================================================
  // LISTING SELECTOR ACTIONS
  // ============================================================================

  /**
   * Select a listing by index
   */
  async selectListing(index: number): Promise<void> {
    const pill = this.listingPills.nth(index);
    await pill.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Select a listing by name
   */
  async selectListingByName(name: string | RegExp): Promise<void> {
    const pill = this.listingPills.filter({ hasText: name });
    await pill.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get selected listing name
   */
  async getSelectedListingName(): Promise<string> {
    return (await this.selectedListingPill.textContent()) || '';
  }

  /**
   * Get listing count
   */
  async getListingCount(): Promise<number> {
    return this.listingPills.count();
  }

  /**
   * Get proposal count badge for listing
   */
  async getProposalCountForListing(index: number): Promise<number> {
    const pill = this.listingPills.nth(index);
    const badge = pill.locator('.proposal-count, [data-testid="proposal-count"]');
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  // ============================================================================
  // CARD ACTIONS
  // ============================================================================

  /**
   * Expand a proposal card
   */
  async expandCard(index: number = 0): Promise<void> {
    const card = this.proposalCards.nth(index);
    const isExpanded = await card.getAttribute('class');
    if (!isExpanded?.includes('expanded')) {
      await card.click();
    }
    await this.expandedCard.waitFor({ state: 'visible' });
  }

  /**
   * Collapse expanded card
   */
  async collapseCard(): Promise<void> {
    if (await this.expandedCard.isVisible()) {
      const toggleBtn = this.expandedCard.locator('.toggle-btn, [data-testid="toggle-expand"]');
      await toggleBtn.click();
      await this.expandedCard.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Get proposal card by index
   */
  getProposalCard(index: number): Locator {
    return this.proposalCards.nth(index);
  }

  /**
   * View guest profile
   */
  async viewGuestProfile(): Promise<void> {
    await this.viewProfileButton.click();
    await this.proposalDetailsModal.waitFor({ state: 'visible' });
  }

  /**
   * Close proposal details modal
   */
  async closeProposalDetails(): Promise<void> {
    const closeBtn = this.proposalDetailsModal.locator('button[aria-label*="close"], .close-btn');
    await closeBtn.click();
    await this.proposalDetailsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Open message modal
   */
  async openMessageModal(): Promise<void> {
    await this.messageGuestButton.click();
    await this.messageModal.waitFor({ state: 'visible' });
  }

  /**
   * Send message to guest
   */
  async sendMessage(message: string): Promise<void> {
    await this.openMessageModal();
    const messageInput = this.messageModal.locator('textarea, input[type="text"]');
    await messageInput.fill(message);
    const sendBtn = this.messageModal.locator('button', { hasText: /send/i });
    await sendBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Open virtual meeting modal
   */
  async openVirtualMeetingModal(): Promise<void> {
    await this.scheduleMeetingButton.click();
    await this.virtualMeetingModal.waitFor({ state: 'visible' });
  }

  /**
   * Accept proposal
   */
  async acceptProposal(): Promise<void> {
    await this.acceptButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Open modify/counteroffer modal
   */
  async openModifyModal(): Promise<void> {
    await this.modifyButton.click();
    await this.editingProposalOverlay.waitFor({ state: 'visible' });
  }

  /**
   * Decline proposal
   */
  async declineProposal(reason?: string): Promise<void> {
    await this.declineButton.click();
    // May open a confirmation modal
    await this.page.waitForTimeout(500);

    if (reason) {
      const reasonInput = this.page.locator('textarea[name="reason"], [data-testid="decline-reason"]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill(reason);
      }
    }

    // Confirm decline if modal is shown
    const confirmBtn = this.page.locator('button', { hasText: /confirm|yes|decline/i }).last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Request rental application
   */
  async requestRentalApp(): Promise<void> {
    await this.requestRentalAppButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Remove/delete proposal
   */
  async removeProposal(): Promise<void> {
    await this.removeButton.click();
    // Confirm removal
    const confirmBtn = this.page.locator('button', { hasText: /confirm|yes|remove/i }).last();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await this.page.waitForTimeout(1000);
  }

  // ============================================================================
  // EDITING PROPOSAL ACTIONS
  // ============================================================================

  /**
   * Accept proposal as-is (from editing modal)
   */
  async acceptAsIs(): Promise<void> {
    const acceptBtn = this.hostEditingProposal.locator('button', { hasText: /accept as is/i });
    await acceptBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Submit counteroffer
   */
  async submitCounteroffer(changes: {
    pricePerNight?: number;
    days?: number[];
    moveInDate?: string;
  }): Promise<void> {
    if (changes.pricePerNight) {
      const priceInput = this.hostEditingProposal.locator('input[name="price"], [data-testid="price-input"]');
      await priceInput.clear();
      await priceInput.fill(changes.pricePerNight.toString());
    }

    // Submit counteroffer
    const counterBtn = this.hostEditingProposal.locator('button', { hasText: /send counter|submit/i });
    await counterBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Cancel editing
   */
  async cancelEditing(): Promise<void> {
    const cancelBtn = this.hostEditingProposal.locator('button', { hasText: /cancel|close/i });
    await cancelBtn.click();
    await this.editingProposalOverlay.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.pageHeader).toBeVisible();
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
   * Assert listing selector visible
   */
  async assertListingSelectorVisible(): Promise<void> {
    await expect(this.listingSelector).toBeVisible();
    const pillCount = await this.listingPills.count();
    expect(pillCount).toBeGreaterThan(0);
  }

  /**
   * Assert proposals are displayed
   */
  async assertProposalsDisplayed(minCount: number = 1): Promise<void> {
    const count = await this.proposalCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert section is visible
   */
  async assertSectionVisible(section: 'actionNeeded' | 'inProgress' | 'closed'): Promise<void> {
    switch (section) {
      case 'actionNeeded':
        await expect(this.actionNeededSection).toBeVisible();
        break;
      case 'inProgress':
        await expect(this.inProgressSection).toBeVisible();
        break;
      case 'closed':
        await expect(this.closedSection).toBeVisible();
        break;
    }
  }

  /**
   * Assert card is expanded
   */
  async assertCardExpanded(): Promise<void> {
    await expect(this.expandedCard).toBeVisible();
  }

  /**
   * Assert guest info is displayed
   */
  async assertGuestInfoDisplayed(): Promise<void> {
    await expect(this.guestAvatar).toBeVisible();
    await expect(this.guestName).toBeVisible();
  }

  /**
   * Assert AI summary is displayed
   */
  async assertAISummaryDisplayed(): Promise<void> {
    await expect(this.aiSummary).toBeVisible();
  }

  /**
   * Get proposal count
   */
  async getProposalCount(): Promise<number> {
    return this.proposalCards.count();
  }

  /**
   * Get action needed count
   */
  async getActionNeededCount(): Promise<number> {
    return this.actionNeededCards.count();
  }

  /**
   * Get in progress count
   */
  async getInProgressCount(): Promise<number> {
    return this.inProgressCards.count();
  }

  /**
   * Get closed count
   */
  async getClosedCount(): Promise<number> {
    return this.closedCards.count();
  }
}
