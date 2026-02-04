/**
 * Listing Detail Page Object Model
 *
 * Represents the property detail page at /view-split-lease/:id
 * Features: Photo gallery, booking widget, amenities, map, host info
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ListingDetailPage extends BasePage {
  private listingId: string = '';

  constructor(page: Page, listingId?: string) {
    super(page);
    if (listingId) {
      this.listingId = listingId;
    }
  }

  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Container
  get pageContainer(): Locator {
    return this.page.locator('[class*="pageContainer"], .view-split-lease-page');
  }

  // Photo Gallery
  get photoGallery(): Locator {
    return this.page.locator('[class*="photoGallery"], .photo-gallery, [data-testid="photo-gallery"]');
  }

  get mainPhoto(): Locator {
    return this.photoGallery.locator('img').first();
  }

  get photoThumbnails(): Locator {
    return this.photoGallery.locator('.thumbnail, [data-testid="photo-thumbnail"]');
  }

  get photoModal(): Locator {
    return this.page.locator('[data-testid="photo-modal"], .photo-modal');
  }

  get photoModalCloseBtn(): Locator {
    return this.photoModal.locator('button[aria-label*="close"], .close-btn');
  }

  // Listing Header
  get listingHeader(): Locator {
    return this.page.locator('[class*="listingHeader"], .listing-header, [data-testid="listing-header"]');
  }

  get listingTitle(): Locator {
    return this.listingHeader.locator('h1, .listing-title');
  }

  get listingLocation(): Locator {
    return this.listingHeader.locator('.location, [data-testid="listing-location"]');
  }

  get favoriteButton(): Locator {
    return this.listingHeader.locator('.favorite-button, [data-testid="favorite-button"]');
  }

  get shareButton(): Locator {
    return this.listingHeader.locator('.share-button, [data-testid="share-button"]');
  }

  // Property Details
  get propertyDetails(): Locator {
    return this.page.locator('.property-details, [data-testid="property-details"]');
  }

  get bedroomCount(): Locator {
    return this.propertyDetails.locator('[data-testid="bedrooms"], .bedrooms');
  }

  get bathroomCount(): Locator {
    return this.propertyDetails.locator('[data-testid="bathrooms"], .bathrooms');
  }

  // Description Section
  get descriptionSection(): Locator {
    return this.page.locator('[class*="description"], .description-section, [data-testid="description"]');
  }

  get descriptionText(): Locator {
    return this.descriptionSection.locator('p, .description-text');
  }

  get showMoreButton(): Locator {
    return this.descriptionSection.locator('button', { hasText: /show more|read more/i });
  }

  // Amenities Section
  get amenitiesSection(): Locator {
    return this.page.locator('[class*="amenities"], .amenities-section, [data-testid="amenities"]');
  }

  get amenityItems(): Locator {
    return this.amenitiesSection.locator('.amenity-item, [data-testid="amenity-item"]');
  }

  get showAllAmenitiesButton(): Locator {
    return this.amenitiesSection.locator('button', { hasText: /show all/i });
  }

  // Map Section
  get mapSection(): Locator {
    return this.page.locator('#map-section, [data-testid="map-section"]');
  }

  get mapContainer(): Locator {
    return this.mapSection.locator('.gm-style, [data-testid="google-map"]');
  }

  get loadMapButton(): Locator {
    return this.mapSection.locator('button', { hasText: /load map|show map/i });
  }

  // Host Info Section
  get hostInfoCard(): Locator {
    return this.page.locator('[class*="hostInfo"], .host-info-card, [data-testid="host-info"]');
  }

  get hostAvatar(): Locator {
    return this.hostInfoCard.locator('.host-avatar, img');
  }

  get hostName(): Locator {
    return this.hostInfoCard.locator('.host-name, [data-testid="host-name"]');
  }

  get contactHostButton(): Locator {
    return this.hostInfoCard.locator('button', { hasText: /contact|message/i });
  }

  // Booking Widget (Right Column)
  get bookingWidget(): Locator {
    return this.page.locator('[class*="bookingWidget"], .booking-widget, [data-testid="booking-widget"]');
  }

  get priceDisplay(): Locator {
    return this.bookingWidget.locator('.price-display, [data-testid="price-display"]');
  }

  get scheduleSelector(): Locator {
    return this.bookingWidget.locator('[data-testid="schedule-selector"], .schedule-selector');
  }

  get dayButtons(): Locator {
    return this.scheduleSelector.locator('.day-button, [data-testid="day-button"]');
  }

  get moveInDateInput(): Locator {
    return this.bookingWidget.locator('input[type="date"], [data-testid="move-in-date"]');
  }

  get reservationSpanSelect(): Locator {
    return this.bookingWidget.locator('select[data-testid="reservation-span"], .reservation-span-select');
  }

  get priceBreakdown(): Locator {
    return this.bookingWidget.locator('.price-breakdown, [data-testid="price-breakdown"]');
  }

  get totalPrice(): Locator {
    return this.priceBreakdown.locator('.total-price, [data-testid="total-price"]');
  }

  get submitProposalButton(): Locator {
    return this.bookingWidget.locator('button', { hasText: /submit proposal|book|reserve/i });
  }

  get validationErrors(): Locator {
    return this.bookingWidget.locator('.validation-error, [data-testid="validation-error"]');
  }

  // Modals
  get proposalModal(): Locator {
    return this.page.locator('[data-testid="proposal-modal"], .create-proposal-flow');
  }

  get contactHostModal(): Locator {
    return this.page.locator('[data-testid="contact-host-modal"], .contact-host-modal');
  }

  get authModal(): Locator {
    return this.page.locator('[data-testid="auth-modal"], .signup-login-modal');
  }

  get successModal(): Locator {
    return this.page.locator('[data-testid="success-modal"], .proposal-success-modal');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    if (!this.listingId) {
      throw new Error('Listing ID is required. Use gotoListing(id) instead.');
    }
    await this.gotoListing(this.listingId);
  }

  async gotoListing(listingId: string): Promise<void> {
    this.listingId = listingId;
    await this.page.goto(`/view-split-lease/${listingId}`);
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return `/view-split-lease/${this.listingId}`;
  }

  // ============================================================================
  // PHOTO ACTIONS
  // ============================================================================

  /**
   * Click on main photo to open gallery
   */
  async openPhotoGallery(): Promise<void> {
    await this.mainPhoto.click();
    await this.photoModal.waitFor({ state: 'visible' });
  }

  /**
   * Close photo modal
   */
  async closePhotoGallery(): Promise<void> {
    await this.photoModalCloseBtn.click();
    await this.photoModal.waitFor({ state: 'hidden' });
  }

  /**
   * Navigate to next photo in gallery
   */
  async nextPhoto(): Promise<void> {
    const nextBtn = this.photoModal.locator('button[aria-label*="next"], .next-btn');
    await nextBtn.click();
  }

  /**
   * Navigate to previous photo in gallery
   */
  async previousPhoto(): Promise<void> {
    const prevBtn = this.photoModal.locator('button[aria-label*="prev"], .prev-btn');
    await prevBtn.click();
  }

  // ============================================================================
  // BOOKING ACTIONS
  // ============================================================================

  /**
   * Select a day in the schedule (0-based: 0=Sun, 1=Mon, etc.)
   */
  async selectDay(dayIndex: number): Promise<void> {
    const dayButton = this.dayButtons.nth(dayIndex);
    await dayButton.click();
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
   * Set move-in date
   */
  async setMoveInDate(date: string): Promise<void> {
    await this.moveInDateInput.fill(date);
  }

  /**
   * Set reservation span (weeks)
   */
  async setReservationSpan(weeks: number): Promise<void> {
    await this.reservationSpanSelect.selectOption(weeks.toString());
  }

  /**
   * Click submit proposal button
   */
  async clickSubmitProposal(): Promise<void> {
    await this.submitProposalButton.click();
  }

  /**
   * Complete booking configuration
   */
  async configureBooking(options: {
    days: number[];
    moveInDate: string;
    reservationSpanWeeks?: number;
  }): Promise<void> {
    await this.selectDays(options.days);
    await this.setMoveInDate(options.moveInDate);
    if (options.reservationSpanWeeks) {
      await this.setReservationSpan(options.reservationSpanWeeks);
    }
  }

  // ============================================================================
  // PROPOSAL FLOW ACTIONS
  // ============================================================================

  /**
   * Start the proposal flow
   */
  async startProposalFlow(): Promise<void> {
    await this.clickSubmitProposal();
    // Either proposal modal opens or auth modal (if not logged in)
    await this.page.waitForTimeout(1000);
  }

  /**
   * Fill proposal form (in modal)
   */
  async fillProposalForm(data: {
    needForSpace?: string;
    aboutMe?: string;
    specialNeeds?: string;
  }): Promise<void> {
    if (data.needForSpace) {
      const needInput = this.proposalModal.locator('textarea[name="needForSpace"], [data-testid="need-for-space"]');
      await needInput.fill(data.needForSpace);
    }
    if (data.aboutMe) {
      const aboutInput = this.proposalModal.locator('textarea[name="aboutMe"], [data-testid="about-me"]');
      await aboutInput.fill(data.aboutMe);
    }
    if (data.specialNeeds) {
      const specialInput = this.proposalModal.locator('textarea[name="specialNeeds"], [data-testid="special-needs"]');
      await specialInput.fill(data.specialNeeds);
    }
  }

  /**
   * Submit the proposal (from modal)
   */
  async submitProposal(): Promise<void> {
    const submitBtn = this.proposalModal.locator('button', { hasText: /submit|confirm/i });
    await submitBtn.click();
    // Wait for success modal or error
    await this.page.waitForTimeout(2000);
  }

  /**
   * Close the proposal modal
   */
  async closeProposalModal(): Promise<void> {
    const closeBtn = this.proposalModal.locator('button[aria-label*="close"], .close-btn');
    await closeBtn.click();
    await this.proposalModal.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // HOST CONTACT ACTIONS
  // ============================================================================

  /**
   * Click contact host button
   */
  async clickContactHost(): Promise<void> {
    await this.contactHostButton.click();
    await this.contactHostModal.waitFor({ state: 'visible' });
  }

  /**
   * Send message to host
   */
  async sendMessageToHost(message: string): Promise<void> {
    await this.clickContactHost();
    const messageInput = this.contactHostModal.locator('textarea, input[type="text"]');
    await messageInput.fill(message);
    const sendBtn = this.contactHostModal.locator('button', { hasText: /send/i });
    await sendBtn.click();
  }

  // ============================================================================
  // FAVORITE ACTIONS
  // ============================================================================

  /**
   * Toggle favorite status
   */
  async toggleFavorite(): Promise<void> {
    await this.favoriteButton.click();
  }

  /**
   * Check if listing is favorited
   */
  async isFavorited(): Promise<boolean> {
    const classList = await this.favoriteButton.getAttribute('class');
    return classList?.includes('favorited') || classList?.includes('active') || false;
  }

  // ============================================================================
  // SECTION NAVIGATION
  // ============================================================================

  /**
   * Scroll to description section
   */
  async scrollToDescription(): Promise<void> {
    await this.descriptionSection.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to amenities section
   */
  async scrollToAmenities(): Promise<void> {
    await this.amenitiesSection.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to map section
   */
  async scrollToMap(): Promise<void> {
    await this.mapSection.scrollIntoViewIfNeeded();
  }

  /**
   * Load the map (if lazy loaded)
   */
  async loadMap(): Promise<void> {
    await this.scrollToMap();
    if (await this.loadMapButton.isVisible()) {
      await this.loadMapButton.click();
      await this.mapContainer.waitFor({ state: 'visible' });
    }
  }

  /**
   * Expand description if collapsed
   */
  async expandDescription(): Promise<void> {
    if (await this.showMoreButton.isVisible()) {
      await this.showMoreButton.click();
    }
  }

  /**
   * Show all amenities
   */
  async showAllAmenities(): Promise<void> {
    if (await this.showAllAmenitiesButton.isVisible()) {
      await this.showAllAmenitiesButton.click();
    }
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.listingTitle).toBeVisible();
    await expect(this.bookingWidget).toBeVisible();
  }

  /**
   * Assert listing title
   */
  async assertTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.listingTitle).toHaveText(expectedTitle);
  }

  /**
   * Assert photo gallery is visible
   */
  async assertPhotoGalleryVisible(): Promise<void> {
    await expect(this.photoGallery).toBeVisible();
    await expect(this.mainPhoto).toBeVisible();
  }

  /**
   * Assert booking widget is visible
   */
  async assertBookingWidgetVisible(): Promise<void> {
    await expect(this.bookingWidget).toBeVisible();
    await expect(this.priceDisplay).toBeVisible();
    await expect(this.submitProposalButton).toBeVisible();
  }

  /**
   * Assert price is displayed
   */
  async assertPriceDisplayed(): Promise<void> {
    await expect(this.priceDisplay).toBeVisible();
    await expect(this.priceDisplay).toContainText('$');
  }

  /**
   * Assert amenities are displayed
   */
  async assertAmenitiesDisplayed(minCount: number = 1): Promise<void> {
    await this.scrollToAmenities();
    const count = await this.amenityItems.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Assert host info is displayed
   */
  async assertHostInfoDisplayed(): Promise<void> {
    await expect(this.hostInfoCard).toBeVisible();
    await expect(this.hostName).toBeVisible();
    await expect(this.contactHostButton).toBeVisible();
  }

  /**
   * Assert validation error is shown
   */
  async assertValidationError(): Promise<void> {
    await expect(this.validationErrors).toBeVisible();
  }

  /**
   * Assert no validation errors
   */
  async assertNoValidationErrors(): Promise<void> {
    await expect(this.validationErrors).toBeHidden();
  }

  /**
   * Assert success modal is shown
   */
  async assertSuccessModalVisible(): Promise<void> {
    await expect(this.successModal).toBeVisible();
  }

  /**
   * Assert auth modal is shown (for unauthenticated users)
   */
  async assertAuthModalVisible(): Promise<void> {
    await expect(this.authModal).toBeVisible();
  }

  /**
   * Get the displayed total price
   */
  async getTotalPrice(): Promise<string> {
    const text = await this.totalPrice.textContent();
    return text || '';
  }

  /**
   * Get the count of photos
   */
  async getPhotoCount(): Promise<number> {
    return this.photoThumbnails.count();
  }
}
