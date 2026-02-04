/**
 * Guest Proposals Page Object Model
 *
 * Represents the guest proposals dashboard at /guest-proposals
 * Features: Proposal cards, virtual meetings, status tracking
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class GuestProposalsPage extends BasePage {
  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Container
  get pageContainer(): Locator {
    return this.page.locator('.proposals-page, [data-testid="proposals-page"]');
  }

  // Loading/Error States
  get loadingState(): Locator {
    return this.page.locator('.loading-state, [data-testid="loading-state"]');
  }

  get errorState(): Locator {
    return this.page.locator('.error-state, [data-testid="error-state"]');
  }

  get retryButton(): Locator {
    return this.errorState.locator('.retry-button, button', { hasText: /try again/i });
  }

  get emptyState(): Locator {
    return this.page.locator('.empty-state, [data-testid="empty-state"]');
  }

  get browseListingsButton(): Locator {
    return this.emptyState.locator('a', { hasText: /browse listings/i });
  }

  // Sections
  get suggestedSection(): Locator {
    return this.page.locator('.proposals-section--suggested, [data-testid="suggested-section"]');
  }

  get userProposalsSection(): Locator {
    return this.page.locator('.proposals-section--user, [data-testid="user-proposals-section"]');
  }

  // Section Headers
  get suggestedSectionHeader(): Locator {
    return this.suggestedSection.locator('.section-header, [data-testid="section-header"]');
  }

  get userProposalsSectionHeader(): Locator {
    return this.userProposalsSection.locator('.section-header, [data-testid="section-header"]');
  }

  // Proposal Cards
  get proposalCards(): Locator {
    return this.page.locator('.expandable-proposal-card, [data-testid="proposal-card"]');
  }

  get suggestedProposalCards(): Locator {
    return this.suggestedSection.locator('.expandable-proposal-card, [data-testid="proposal-card"]');
  }

  get userProposalCards(): Locator {
    return this.userProposalsSection.locator('.expandable-proposal-card, [data-testid="proposal-card"]');
  }

  // Expanded Card Elements
  get expandedCard(): Locator {
    return this.page.locator('.expandable-proposal-card--expanded, [data-expanded="true"]');
  }

  get proposalDetails(): Locator {
    return this.expandedCard.locator('.proposal-details, [data-testid="proposal-details"]');
  }

  get listingInfo(): Locator {
    return this.expandedCard.locator('.listing-info, [data-testid="listing-info"]');
  }

  get scheduleInfo(): Locator {
    return this.expandedCard.locator('.schedule-info, [data-testid="schedule-info"]');
  }

  get priceInfo(): Locator {
    return this.expandedCard.locator('.price-info, [data-testid="price-info"]');
  }

  // Card Actions
  get viewListingButton(): Locator {
    return this.expandedCard.locator('button, a', { hasText: /view listing/i });
  }

  get messageHostButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /message|contact/i });
  }

  get scheduleVMButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /schedule.*meeting|virtual meeting/i });
  }

  get acceptButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /accept/i });
  }

  get declineButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /decline/i });
  }

  get cancelButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /cancel/i });
  }

  get counterofferButton(): Locator {
    return this.expandedCard.locator('button', { hasText: /counter/i });
  }

  // Status Badges
  get statusBadge(): Locator {
    return this.proposalCards.locator('.status-badge, [data-testid="status-badge"]');
  }

  // Virtual Meetings Section
  get virtualMeetingsSection(): Locator {
    return this.page.locator('.virtual-meetings-section, [data-testid="virtual-meetings-section"]');
  }

  get virtualMeetingCards(): Locator {
    return this.virtualMeetingsSection.locator('.meeting-card, [data-testid="meeting-card"]');
  }

  // Modals
  get messageModal(): Locator {
    return this.page.locator('[data-testid="message-modal"], .contact-host-modal');
  }

  get virtualMeetingModal(): Locator {
    return this.page.locator('[data-testid="virtual-meeting-modal"], .virtual-meeting-manager');
  }

  get cancelConfirmModal(): Locator {
    return this.page.locator('[data-testid="cancel-confirm-modal"], .cancel-proposal-modal');
  }

  get counterofferModal(): Locator {
    return this.page.locator('[data-testid="counteroffer-modal"], .counteroffer-modal');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    await this.page.goto('/guest-proposals');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return '/guest-proposals';
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
   * Collapse the expanded card
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
   * Get card status
   */
  async getCardStatus(index: number = 0): Promise<string> {
    const card = this.proposalCards.nth(index);
    const statusBadge = card.locator('.status-badge, [data-testid="status-badge"]');
    return (await statusBadge.textContent()) || '';
  }

  /**
   * View listing from expanded card
   */
  async viewListing(): Promise<void> {
    await this.viewListingButton.click();
    await this.page.waitForURL(/view-split-lease/);
  }

  /**
   * Open message modal
   */
  async openMessageModal(): Promise<void> {
    await this.messageHostButton.click();
    await this.messageModal.waitFor({ state: 'visible' });
  }

  /**
   * Send message to host
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
    await this.scheduleVMButton.click();
    await this.virtualMeetingModal.waitFor({ state: 'visible' });
  }

  /**
   * Accept a proposal (for guest-review status)
   */
  async acceptProposal(): Promise<void> {
    await this.acceptButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Decline a proposal
   */
  async declineProposal(): Promise<void> {
    await this.declineButton.click();
    await this.cancelConfirmModal.waitFor({ state: 'visible' });
  }

  /**
   * Cancel a proposal
   */
  async cancelProposal(reason?: string): Promise<void> {
    await this.cancelButton.click();
    await this.cancelConfirmModal.waitFor({ state: 'visible' });

    if (reason) {
      const reasonInput = this.cancelConfirmModal.locator('textarea');
      await reasonInput.fill(reason);
    }

    const confirmBtn = this.cancelConfirmModal.locator('button', { hasText: /confirm|yes/i });
    await confirmBtn.click();
    await this.cancelConfirmModal.waitFor({ state: 'hidden' });
  }

  /**
   * Open counteroffer modal
   */
  async openCounterModal(): Promise<void> {
    await this.counterofferButton.click();
    await this.counterofferModal.waitFor({ state: 'visible' });
  }

  // ============================================================================
  // VIRTUAL MEETINGS
  // ============================================================================

  /**
   * Click on a virtual meeting card
   */
  async clickVirtualMeeting(index: number = 0): Promise<void> {
    const card = this.virtualMeetingCards.nth(index);
    await card.click();
    await this.virtualMeetingModal.waitFor({ state: 'visible' });
  }

  /**
   * Get virtual meeting count
   */
  async getVirtualMeetingCount(): Promise<number> {
    return this.virtualMeetingCards.count();
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
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
    await expect(this.browseListingsButton).toBeVisible();
  }

  /**
   * Assert proposals are displayed
   */
  async assertProposalsDisplayed(minCount: number = 1): Promise<void> {
    const count = await this.proposalCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert suggested section visible
   */
  async assertSuggestedSectionVisible(): Promise<void> {
    await expect(this.suggestedSection).toBeVisible();
    await expect(this.suggestedSectionHeader).toBeVisible();
  }

  /**
   * Assert user proposals section visible
   */
  async assertUserProposalsSectionVisible(): Promise<void> {
    await expect(this.userProposalsSection).toBeVisible();
    await expect(this.userProposalsSectionHeader).toBeVisible();
  }

  /**
   * Assert card is expanded
   */
  async assertCardExpanded(): Promise<void> {
    await expect(this.expandedCard).toBeVisible();
    await expect(this.proposalDetails).toBeVisible();
  }

  /**
   * Assert proposal has status
   */
  async assertProposalStatus(index: number, expectedStatus: string | RegExp): Promise<void> {
    const card = this.proposalCards.nth(index);
    const statusBadge = card.locator('.status-badge, [data-testid="status-badge"]');
    await expect(statusBadge).toHaveText(expectedStatus);
  }

  /**
   * Assert virtual meetings section visible
   */
  async assertVirtualMeetingsSectionVisible(): Promise<void> {
    await expect(this.virtualMeetingsSection).toBeVisible();
  }

  /**
   * Get proposal count
   */
  async getProposalCount(): Promise<number> {
    return this.proposalCards.count();
  }

  /**
   * Get suggested proposal count
   */
  async getSuggestedProposalCount(): Promise<number> {
    return this.suggestedProposalCards.count();
  }

  /**
   * Get user proposal count
   */
  async getUserProposalCount(): Promise<number> {
    return this.userProposalCards.count();
  }

  /**
   * Assert action buttons are visible based on status
   */
  async assertActionButtonsForStatus(status: string): Promise<void> {
    await this.expandCard(0);

    switch (status) {
      case 'host_review':
        await expect(this.messageHostButton).toBeVisible();
        await expect(this.cancelButton).toBeVisible();
        break;
      case 'guest_review':
        await expect(this.acceptButton).toBeVisible();
        await expect(this.declineButton).toBeVisible();
        break;
      case 'accepted':
        await expect(this.messageHostButton).toBeVisible();
        await expect(this.scheduleVMButton).toBeVisible();
        break;
      case 'declined':
      case 'cancelled':
        // Limited actions for closed proposals
        await expect(this.viewListingButton).toBeVisible();
        break;
    }
  }
}
