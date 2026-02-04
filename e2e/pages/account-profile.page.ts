/**
 * Account Profile Page Object Model
 *
 * Represents the user profile page at /account-profile/:userId
 * Features: Profile editing, verifications, listings (hosts), rental application (guests)
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AccountProfilePage extends BasePage {
  private userId: string = '';

  constructor(page: Page, userId?: string) {
    super(page);
    if (userId) {
      this.userId = userId;
    }
  }

  // ============================================================================
  // LOCATORS
  // ============================================================================

  // Page Container
  get pageContainer(): Locator {
    return this.page.locator('.account-profile-page, [data-testid="account-profile-page"]');
  }

  // Sidebar
  get profileSidebar(): Locator {
    return this.page.locator('.profile-sidebar, [data-testid="profile-sidebar"]');
  }

  get coverPhoto(): Locator {
    return this.profileSidebar.locator('.cover-photo, [data-testid="cover-photo"]');
  }

  get profileAvatar(): Locator {
    return this.profileSidebar.locator('.profile-avatar, [data-testid="profile-avatar"]');
  }

  get userName(): Locator {
    return this.profileSidebar.locator('.user-name, [data-testid="user-name"]');
  }

  get jobTitle(): Locator {
    return this.profileSidebar.locator('.job-title, [data-testid="job-title"]');
  }

  get profileStrengthMeter(): Locator {
    return this.profileSidebar.locator('.profile-strength-meter, [data-testid="profile-strength"]');
  }

  get verificationBadges(): Locator {
    return this.profileSidebar.locator('.verification-badge, [data-testid="verification-badge"]');
  }

  // Photo Upload Buttons
  get coverPhotoUploadBtn(): Locator {
    return this.profileSidebar.locator('[data-testid="cover-photo-upload"], .cover-photo-upload');
  }

  get avatarUploadBtn(): Locator {
    return this.profileSidebar.locator('[data-testid="avatar-upload"], .avatar-upload');
  }

  // Main Content Area
  get profileFeed(): Locator {
    return this.page.locator('.account-profile-feed, [data-testid="profile-feed"]');
  }

  // Referral Banner
  get referralBanner(): Locator {
    return this.page.locator('.referral-banner, [data-testid="referral-banner"]');
  }

  get inviteFriendsButton(): Locator {
    return this.referralBanner.locator('button', { hasText: /invite/i });
  }

  // Basic Info Card
  get basicInfoCard(): Locator {
    return this.page.locator('.basic-info-card, [data-testid="basic-info-card"]');
  }

  get firstNameInput(): Locator {
    return this.basicInfoCard.locator('input[name="firstName"], [data-testid="first-name-input"]');
  }

  get lastNameInput(): Locator {
    return this.basicInfoCard.locator('input[name="lastName"], [data-testid="last-name-input"]');
  }

  get emailDisplay(): Locator {
    return this.basicInfoCard.locator('[data-testid="email-display"], .email-display');
  }

  get phoneInput(): Locator {
    return this.basicInfoCard.locator('input[name="phone"], [data-testid="phone-input"]');
  }

  get editPhoneButton(): Locator {
    return this.basicInfoCard.locator('button', { hasText: /edit phone/i });
  }

  // About Card
  get aboutCard(): Locator {
    return this.page.locator('.about-card, [data-testid="about-card"]');
  }

  get bioTextarea(): Locator {
    return this.aboutCard.locator('textarea, [data-testid="bio-textarea"]');
  }

  // Schedule Card (Guest)
  get scheduleCard(): Locator {
    return this.page.locator('.schedule-card, [data-testid="schedule-card"]');
  }

  get scheduleDayButtons(): Locator {
    return this.scheduleCard.locator('.day-button, [data-testid="day-button"]');
  }

  // Requirements Card (Guest)
  get requirementsCard(): Locator {
    return this.page.locator('.requirements-card, [data-testid="requirements-card"]');
  }

  // Listings Card (Host)
  get listingsCard(): Locator {
    return this.page.locator('.listings-card, [data-testid="listings-card"]');
  }

  get listingItems(): Locator {
    return this.listingsCard.locator('.listing-item, [data-testid="listing-item"]');
  }

  get createListingButton(): Locator {
    return this.listingsCard.locator('button', { hasText: /create listing|add listing/i });
  }

  // Verification Cards
  get trustVerificationCard(): Locator {
    return this.page.locator('.trust-verification-card, [data-testid="trust-verification-card"]');
  }

  get verifyEmailButton(): Locator {
    return this.trustVerificationCard.locator('button', { hasText: /verify email/i });
  }

  get verifyPhoneButton(): Locator {
    return this.trustVerificationCard.locator('button', { hasText: /verify phone/i });
  }

  get verifyIdButton(): Locator {
    return this.trustVerificationCard.locator('button', { hasText: /verify.*id/i });
  }

  get connectLinkedInButton(): Locator {
    return this.trustVerificationCard.locator('button', { hasText: /linkedin/i });
  }

  // Rental Application Card (Guest)
  get rentalApplicationCard(): Locator {
    return this.page.locator('.rental-application-card, [data-testid="rental-application-card"]');
  }

  get startApplicationButton(): Locator {
    return this.rentalApplicationCard.locator('button', { hasText: /start|continue|complete/i });
  }

  get applicationProgress(): Locator {
    return this.rentalApplicationCard.locator('.application-progress, [data-testid="application-progress"]');
  }

  // Account Settings Card
  get accountSettingsCard(): Locator {
    return this.page.locator('.account-settings-card, [data-testid="account-settings-card"]');
  }

  get notificationSettingsButton(): Locator {
    return this.accountSettingsCard.locator('button', { hasText: /notification/i });
  }

  get changePasswordButton(): Locator {
    return this.accountSettingsCard.locator('button', { hasText: /change password/i });
  }

  // Fixed Save Bar
  get saveBar(): Locator {
    return this.page.locator('.fixed-save-bar, [data-testid="save-bar"]');
  }

  get saveButton(): Locator {
    return this.saveBar.locator('button', { hasText: /save/i });
  }

  get previewButton(): Locator {
    return this.saveBar.locator('button', { hasText: /preview/i });
  }

  // Modals
  get notificationSettingsModal(): Locator {
    return this.page.locator('[data-testid="notification-settings-modal"], .notification-settings-modal');
  }

  get phoneEditModal(): Locator {
    return this.page.locator('[data-testid="phone-edit-modal"], .phone-edit-modal');
  }

  get referralModal(): Locator {
    return this.page.locator('[data-testid="referral-modal"], .referral-modal');
  }

  get rentalWizardModal(): Locator {
    return this.page.locator('[data-testid="rental-wizard-modal"], .rental-application-wizard');
  }

  get identityVerificationModal(): Locator {
    return this.page.locator('[data-testid="identity-verification-modal"], .identity-verification');
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  async goto(): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID is required. Use gotoProfile(id) instead.');
    }
    await this.gotoProfile(this.userId);
  }

  async gotoProfile(userId: string): Promise<void> {
    this.userId = userId;
    await this.page.goto(`/account-profile/${userId}`);
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  async gotoOwnProfile(): Promise<void> {
    await this.page.goto('/account-profile');
    await this.waitForPageLoad();
    await this.waitForLoadingComplete();
  }

  getPath(): string {
    return `/account-profile/${this.userId}`;
  }

  // ============================================================================
  // BASIC INFO ACTIONS
  // ============================================================================

  /**
   * Update first name
   */
  async updateFirstName(name: string): Promise<void> {
    await this.firstNameInput.clear();
    await this.firstNameInput.fill(name);
  }

  /**
   * Update last name
   */
  async updateLastName(name: string): Promise<void> {
    await this.lastNameInput.clear();
    await this.lastNameInput.fill(name);
  }

  /**
   * Update bio
   */
  async updateBio(bio: string): Promise<void> {
    await this.bioTextarea.clear();
    await this.bioTextarea.fill(bio);
  }

  /**
   * Open phone edit modal
   */
  async openPhoneEdit(): Promise<void> {
    await this.editPhoneButton.click();
    await this.phoneEditModal.waitFor({ state: 'visible' });
  }

  /**
   * Update phone number
   */
  async updatePhone(phone: string): Promise<void> {
    await this.openPhoneEdit();
    const phoneInput = this.phoneEditModal.locator('input');
    await phoneInput.clear();
    await phoneInput.fill(phone);
    const saveBtn = this.phoneEditModal.locator('button', { hasText: /save/i });
    await saveBtn.click();
    await this.phoneEditModal.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // PHOTO UPLOAD ACTIONS
  // ============================================================================

  /**
   * Upload cover photo
   */
  async uploadCoverPhoto(filePath: string): Promise<void> {
    const fileInput = this.coverPhotoUploadBtn.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(2000); // Wait for upload
  }

  /**
   * Upload avatar photo
   */
  async uploadAvatar(filePath: string): Promise<void> {
    const fileInput = this.avatarUploadBtn.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(2000); // Wait for upload
  }

  // ============================================================================
  // SCHEDULE ACTIONS (Guest)
  // ============================================================================

  /**
   * Select preferred days (0-based: 0=Sun, 1=Mon, etc.)
   */
  async selectPreferredDays(dayIndices: number[]): Promise<void> {
    for (const index of dayIndices) {
      const dayButton = this.scheduleDayButtons.nth(index);
      await dayButton.click();
    }
  }

  // ============================================================================
  // VERIFICATION ACTIONS
  // ============================================================================

  /**
   * Click verify email button
   */
  async clickVerifyEmail(): Promise<void> {
    await this.verifyEmailButton.click();
  }

  /**
   * Click verify phone button
   */
  async clickVerifyPhone(): Promise<void> {
    await this.verifyPhoneButton.click();
  }

  /**
   * Click verify ID button
   */
  async clickVerifyId(): Promise<void> {
    await this.verifyIdButton.click();
    await this.identityVerificationModal.waitFor({ state: 'visible' });
  }

  /**
   * Click connect LinkedIn button
   */
  async clickConnectLinkedIn(): Promise<void> {
    await this.connectLinkedInButton.click();
  }

  // ============================================================================
  // RENTAL APPLICATION ACTIONS (Guest)
  // ============================================================================

  /**
   * Open rental application wizard
   */
  async openRentalApplication(): Promise<void> {
    await this.startApplicationButton.click();
    await this.rentalWizardModal.waitFor({ state: 'visible' });
  }

  /**
   * Close rental application wizard
   */
  async closeRentalApplication(): Promise<void> {
    const closeBtn = this.rentalWizardModal.locator('button[aria-label*="close"], .close-btn');
    await closeBtn.click();
    await this.rentalWizardModal.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // LISTINGS ACTIONS (Host)
  // ============================================================================

  /**
   * Click on a listing
   */
  async clickListing(index: number = 0): Promise<void> {
    const listing = this.listingItems.nth(index);
    await listing.click();
  }

  /**
   * Click create listing button
   */
  async clickCreateListing(): Promise<void> {
    await this.createListingButton.click();
  }

  // ============================================================================
  // SETTINGS ACTIONS
  // ============================================================================

  /**
   * Open notification settings
   */
  async openNotificationSettings(): Promise<void> {
    await this.notificationSettingsButton.click();
    await this.notificationSettingsModal.waitFor({ state: 'visible' });
  }

  /**
   * Close notification settings modal
   */
  async closeNotificationSettings(): Promise<void> {
    const closeBtn = this.notificationSettingsModal.locator('button[aria-label*="close"], .close-btn');
    await closeBtn.click();
    await this.notificationSettingsModal.waitFor({ state: 'hidden' });
  }

  /**
   * Click change password button
   */
  async clickChangePassword(): Promise<void> {
    await this.changePasswordButton.click();
  }

  // ============================================================================
  // REFERRAL ACTIONS
  // ============================================================================

  /**
   * Open referral modal
   */
  async openReferralModal(): Promise<void> {
    await this.inviteFriendsButton.click();
    await this.referralModal.waitFor({ state: 'visible' });
  }

  /**
   * Close referral modal
   */
  async closeReferralModal(): Promise<void> {
    const closeBtn = this.referralModal.locator('button[aria-label*="close"], .close-btn');
    await closeBtn.click();
    await this.referralModal.waitFor({ state: 'hidden' });
  }

  // ============================================================================
  // SAVE ACTIONS
  // ============================================================================

  /**
   * Save profile changes
   */
  async saveProfile(): Promise<void> {
    await this.saveButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Preview profile
   */
  async previewProfile(): Promise<void> {
    await this.previewButton.click();
  }

  /**
   * Check if save button is enabled
   */
  async isSaveEnabled(): Promise<boolean> {
    return this.saveButton.isEnabled();
  }

  // ============================================================================
  // ASSERTIONS
  // ============================================================================

  /**
   * Assert page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.profileSidebar).toBeVisible();
    await expect(this.profileFeed).toBeVisible();
  }

  /**
   * Assert is editor view (own profile)
   */
  async assertEditorView(): Promise<void> {
    await expect(this.saveBar).toBeVisible();
    await expect(this.firstNameInput).toBeVisible();
  }

  /**
   * Assert is public view (viewing someone else)
   */
  async assertPublicView(): Promise<void> {
    await expect(this.saveBar).toBeHidden();
    // Should not have editable inputs
    await expect(this.firstNameInput).toBeHidden();
  }

  /**
   * Assert user name is displayed
   */
  async assertUserName(expectedName: string | RegExp): Promise<void> {
    await expect(this.userName).toHaveText(expectedName);
  }

  /**
   * Assert profile photo is displayed
   */
  async assertProfilePhotoVisible(): Promise<void> {
    await expect(this.profileAvatar).toBeVisible();
    const imgSrc = await this.profileAvatar.locator('img').getAttribute('src');
    expect(imgSrc).toBeTruthy();
  }

  /**
   * Assert verification badge is shown
   */
  async assertVerificationBadge(type: 'email' | 'phone' | 'id' | 'linkedin'): Promise<void> {
    const badge = this.verificationBadges.filter({ hasText: new RegExp(type, 'i') });
    await expect(badge).toBeVisible();
  }

  /**
   * Assert profile strength percentage
   */
  async assertProfileStrength(minPercentage: number): Promise<void> {
    const strengthText = await this.profileStrengthMeter.textContent();
    const match = strengthText?.match(/(\d+)%/);
    const percentage = match ? parseInt(match[1], 10) : 0;
    expect(percentage).toBeGreaterThanOrEqual(minPercentage);
  }

  /**
   * Assert listings card is visible (host only)
   */
  async assertListingsCardVisible(): Promise<void> {
    await expect(this.listingsCard).toBeVisible();
  }

  /**
   * Assert rental application card is visible (guest only)
   */
  async assertRentalApplicationCardVisible(): Promise<void> {
    await expect(this.rentalApplicationCard).toBeVisible();
  }

  /**
   * Assert save bar has unsaved changes
   */
  async assertHasUnsavedChanges(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  /**
   * Assert save bar shows no changes
   */
  async assertNoUnsavedChanges(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  /**
   * Get the displayed email
   */
  async getDisplayedEmail(): Promise<string> {
    const text = await this.emailDisplay.textContent();
    return text || '';
  }

  /**
   * Get listing count (host)
   */
  async getListingCount(): Promise<number> {
    return this.listingItems.count();
  }
}
