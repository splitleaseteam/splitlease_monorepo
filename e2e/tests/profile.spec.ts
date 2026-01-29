/**
 * User Profile E2E Tests
 *
 * Tests for profile viewing, editing, verifications, and account settings.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '@playwright/test';
import { AccountProfilePage, HomePage } from '../pages';
import { SEED_USERS, createTestGuest, createTestHost } from '../fixtures/test-data-factory';

test.describe('User Profile', () => {
  // ============================================================================
  // PROFILE VIEWING
  // ============================================================================

  test.describe('Profile Viewing', () => {
    test('should redirect to login when accessing profile unauthenticated', async ({ page }) => {
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      // Should either redirect to login or show login prompt
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = page.locator('.login-required, [data-testid="login-required"], .auth-modal');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display own profile when logged in', async ({ page }) => {
      // Login first
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to profile
      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.assertPageLoaded();
      await expect(profilePage.profileSidebar).toBeVisible();
      await expect(profilePage.profileFeed).toBeVisible();
    });

    test('should show editor view for own profile', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Should show edit controls
      await profilePage.assertEditorView();
    });

    test('should display profile sidebar with avatar', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.profileAvatar).toBeVisible();
    });

    test('should display profile strength meter', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.profileStrengthMeter).toBeVisible();
    });
  });

  // ============================================================================
  // PROFILE EDITING
  // ============================================================================

  test.describe('Profile Editing', () => {
    test('should update first name', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Update first name
      const testName = 'TestFirstName' + Date.now();
      await profilePage.updateFirstName(testName);

      // Save changes
      await profilePage.saveProfile();

      // Verify change persisted
      await page.reload();
      await profilePage.waitForPageLoad();

      const firstNameValue = await profilePage.firstNameInput.inputValue();
      expect(firstNameValue).toBe(testName);
    });

    test('should update last name', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const testName = 'TestLastName' + Date.now();
      await profilePage.updateLastName(testName);

      await profilePage.saveProfile();

      await page.reload();
      await profilePage.waitForPageLoad();

      const lastNameValue = await profilePage.lastNameInput.inputValue();
      expect(lastNameValue).toBe(testName);
    });

    test('should update bio', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const testBio = 'This is my test bio ' + Date.now();
      await profilePage.updateBio(testBio);

      await profilePage.saveProfile();

      await page.reload();
      await profilePage.waitForPageLoad();

      const bioValue = await profilePage.bioTextarea.inputValue();
      expect(bioValue).toBe(testBio);
    });

    test('should show unsaved changes indicator', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Make a change
      await profilePage.updateFirstName('NewName');

      // Save button should be enabled
      await profilePage.assertHasUnsavedChanges();
    });

    test('should disable save button when no changes', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // No changes made - save should be disabled
      await profilePage.assertNoUnsavedChanges();
    });
  });

  // ============================================================================
  // PHOTO UPLOAD
  // ============================================================================

  test.describe('Photo Upload', () => {
    test('should show avatar upload button', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.avatarUploadBtn).toBeVisible();
    });

    test('should show cover photo upload button', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.coverPhotoUploadBtn).toBeVisible();
    });
  });

  // ============================================================================
  // VERIFICATIONS
  // ============================================================================

  test.describe('Verifications', () => {
    test('should display trust verification card', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.trustVerificationCard).toBeVisible();
    });

    test('should show email verification option', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Either verify button or verified badge should be visible
      const verifyBtn = profilePage.verifyEmailButton;
      const verifiedBadge = page.locator('.verified-email, [data-verified="email"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should show phone verification option', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const verifyBtn = profilePage.verifyPhoneButton;
      const verifiedBadge = page.locator('.verified-phone, [data-verified="phone"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should show ID verification option', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const verifyBtn = profilePage.verifyIdButton;
      const verifiedBadge = page.locator('.verified-id, [data-verified="id"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should open ID verification modal', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      if (await profilePage.verifyIdButton.isVisible()) {
        await profilePage.clickVerifyId();
        await expect(profilePage.identityVerificationModal).toBeVisible();
      }
    });
  });

  // ============================================================================
  // GUEST-SPECIFIC FEATURES
  // ============================================================================

  test.describe('Guest Profile Features', () => {
    test('should show rental application card for guests', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.assertRentalApplicationCardVisible();
    });

    test('should open rental application wizard', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.openRentalApplication();
      await expect(profilePage.rentalWizardModal).toBeVisible();
    });

    test('should show schedule preferences card', async ({ page }) => {
      // Login as guest
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.scheduleCard).toBeVisible();
    });
  });

  // ============================================================================
  // HOST-SPECIFIC FEATURES
  // ============================================================================

  test.describe('Host Profile Features', () => {
    test('should show listings card for hosts', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.assertListingsCardVisible();
    });

    test('should show create listing button for hosts', async ({ page }) => {
      // Login as host
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.host.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.createListingButton).toBeVisible();
    });
  });

  // ============================================================================
  // REFERRAL SYSTEM
  // ============================================================================

  test.describe('Referral System', () => {
    test('should display referral banner', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.referralBanner).toBeVisible();
    });

    test('should open referral modal', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.openReferralModal();
      await expect(profilePage.referralModal).toBeVisible();
    });
  });

  // ============================================================================
  // ACCOUNT SETTINGS
  // ============================================================================

  test.describe('Account Settings', () => {
    test('should display account settings card', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.accountSettingsCard).toBeVisible();
    });

    test('should open notification settings modal', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      await profilePage.openNotificationSettings();
      await expect(profilePage.notificationSettingsModal).toBeVisible();
    });
  });

  // ============================================================================
  // PUBLIC PROFILE VIEW
  // ============================================================================

  test.describe('Public Profile View', () => {
    test('should view other user profile as public', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to another user's profile
      const profilePage = new AccountProfilePage(page, SEED_USERS.host.id);
      await profilePage.goto();

      // Should show public view (no edit controls)
      await profilePage.assertPublicView();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  test.describe('Accessibility', () => {
    test('should have accessible form inputs', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // First name input should have label
      const firstNameInput = profilePage.firstNameInput;
      const ariaLabel = await firstNameInput.getAttribute('aria-label');
      const id = await firstNameInput.getAttribute('id');
      const labelFor = id ? await page.locator(`label[for="${id}"]`).count() : 0;

      expect(ariaLabel || labelFor > 0).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      // Should have h1
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBe(1);
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should stack sidebar and content on mobile', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const sidebar = profilePage.profileSidebar;
      const feed = profilePage.profileFeed;

      const sidebarBox = await sidebar.boundingBox();
      const feedBox = await feed.boundingBox();

      if (sidebarBox && feedBox) {
        // On mobile, feed should be below sidebar
        expect(feedBox.y).toBeGreaterThan(sidebarBox.y);
      }
    });

    test('should have touch-friendly buttons', async ({ page }) => {
      // Login
      await page.goto('/');
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      const profilePage = new AccountProfilePage(page);
      await profilePage.gotoOwnProfile();

      const saveButton = profilePage.saveButton;
      const box = await saveButton.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });
  });
});
