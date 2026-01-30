/**
 * User Profile E2E Tests
 *
 * Tests for profile viewing, editing, verifications, and account settings.
 * Covers happy paths, error handling, edge cases, and accessibility.
 */

import { test, expect } from '../fixtures/auth';
import { AccountProfilePage, HomePage } from '../pages';
import { SEED_USERS, createTestGuest, createTestHost } from '../fixtures/test-data-factory';

test.describe('User Profile', () => {
  // ============================================================================
  // PROFILE VIEWING
  // ============================================================================

  test.describe('Profile Viewing', () => {
    test('should redirect to login when accessing profile unauthenticated', async ({ anonymousPage }) => {
      await anonymousPage.goto('/account-profile');
      await anonymousPage.waitForLoadState('networkidle');

      // Should either redirect to login or show login prompt
      const currentUrl = anonymousPage.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginPrompt = anonymousPage.locator('.login-required, [data-testid="login-required"], .auth-modal');
      const showsPrompt = await loginPrompt.isVisible().catch(() => false);

      expect(isRedirected || showsPrompt).toBeTruthy();
    });

    test('should display own profile when logged in', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture - navigate to profile
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await profilePage.assertPageLoaded();
      await expect(profilePage.profileSidebar).toBeVisible();
      await expect(profilePage.profileFeed).toBeVisible();
    });

    test('should show editor view for own profile', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Should show edit controls
      await profilePage.assertEditorView();
    });

    test('should display profile sidebar with avatar', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.profileAvatar).toBeVisible();
    });

    test('should display profile strength meter', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.profileStrengthMeter).toBeVisible();
    });
  });

  // ============================================================================
  // PROFILE EDITING
  // ============================================================================

  test.describe('Profile Editing', () => {
    test('should update first name', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Update first name
      const testName = 'TestFirstName' + Date.now();
      await profilePage.updateFirstName(testName);

      // Save changes
      await profilePage.saveProfile();

      // Verify change persisted
      await guestBigSpenderPage.reload();
      await profilePage.waitForPageLoad();

      const firstNameValue = await profilePage.firstNameInput.inputValue();
      expect(firstNameValue).toBe(testName);
    });

    test('should update last name', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      const testName = 'TestLastName' + Date.now();
      await profilePage.updateLastName(testName);

      await profilePage.saveProfile();

      await guestBigSpenderPage.reload();
      await profilePage.waitForPageLoad();

      const lastNameValue = await profilePage.lastNameInput.inputValue();
      expect(lastNameValue).toBe(testName);
    });

    test('should update bio', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      const testBio = 'This is my test bio ' + Date.now();
      await profilePage.updateBio(testBio);

      await profilePage.saveProfile();

      await guestBigSpenderPage.reload();
      await profilePage.waitForPageLoad();

      const bioValue = await profilePage.bioTextarea.inputValue();
      expect(bioValue).toBe(testBio);
    });

    test('should show unsaved changes indicator', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Make a change
      await profilePage.updateFirstName('NewName');

      // Save button should be enabled
      await profilePage.assertHasUnsavedChanges();
    });

    test('should disable save button when no changes', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // No changes made - save should be disabled
      await profilePage.assertNoUnsavedChanges();
    });
  });

  // ============================================================================
  // PHOTO UPLOAD
  // ============================================================================

  test.describe('Photo Upload', () => {
    test('should show avatar upload button', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.avatarUploadBtn).toBeVisible();
    });

    test('should show cover photo upload button', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.coverPhotoUploadBtn).toBeVisible();
    });
  });

  // ============================================================================
  // VERIFICATIONS
  // ============================================================================

  test.describe('Verifications', () => {
    test('should display trust verification card', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.trustVerificationCard).toBeVisible();
    });

    test('should show email verification option', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Either verify button or verified badge should be visible
      const verifyBtn = profilePage.verifyEmailButton;
      const verifiedBadge = guestBigSpenderPage.locator('.verified-email, [data-verified="email"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should show phone verification option', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      const verifyBtn = profilePage.verifyPhoneButton;
      const verifiedBadge = guestBigSpenderPage.locator('.verified-phone, [data-verified="phone"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should show ID verification option', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      const verifyBtn = profilePage.verifyIdButton;
      const verifiedBadge = guestBigSpenderPage.locator('.verified-id, [data-verified="id"]');

      const btnVisible = await verifyBtn.isVisible().catch(() => false);
      const badgeVisible = await verifiedBadge.isVisible().catch(() => false);

      expect(btnVisible || badgeVisible).toBeTruthy();
    });

    test('should open ID verification modal', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
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
    test('should show rental application card for guests', async ({ guestBigSpenderPage }) => {
      // Already logged in as guest via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await profilePage.assertRentalApplicationCardVisible();
    });

    test('should open rental application wizard', async ({ guestBigSpenderPage }) => {
      // Already logged in as guest via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await profilePage.openRentalApplication();
      await expect(profilePage.rentalWizardModal).toBeVisible();
    });

    test('should show schedule preferences card', async ({ guestBigSpenderPage }) => {
      // Already logged in as guest via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.scheduleCard).toBeVisible();
    });
  });

  // ============================================================================
  // HOST-SPECIFIC FEATURES
  // ============================================================================

  test.describe('Host Profile Features', () => {
    test('should show listings card for hosts', async ({ hostPage }) => {
      // Already logged in as host via fixture
      const profilePage = new AccountProfilePage(hostPage);
      await profilePage.gotoOwnProfile();

      await profilePage.assertListingsCardVisible();
    });

    test('should show create listing button for hosts', async ({ hostPage }) => {
      // Already logged in as host via fixture
      const profilePage = new AccountProfilePage(hostPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.createListingButton).toBeVisible();
    });
  });

  // ============================================================================
  // REFERRAL SYSTEM
  // ============================================================================

  test.describe('Referral System', () => {
    test('should display referral banner', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.referralBanner).toBeVisible();
    });

    test('should open referral modal', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await profilePage.openReferralModal();
      await expect(profilePage.referralModal).toBeVisible();
    });
  });

  // ============================================================================
  // ACCOUNT SETTINGS
  // ============================================================================

  test.describe('Account Settings', () => {
    test('should display account settings card', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await expect(profilePage.accountSettingsCard).toBeVisible();
    });

    test('should open notification settings modal', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      await profilePage.openNotificationSettings();
      await expect(profilePage.notificationSettingsModal).toBeVisible();
    });
  });

  // ============================================================================
  // PUBLIC PROFILE VIEW
  // ============================================================================

  test.describe('Public Profile View', () => {
    test('should view other user profile as public', async ({ guestBigSpenderPage }) => {
      // Login
      await guestBigSpenderPage.goto('/');
      const loginButton = guestBigSpenderPage.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = guestBigSpenderPage.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await guestBigSpenderPage.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await guestBigSpenderPage.locator('input[type="password"]').fill('testpassword123');
      await guestBigSpenderPage.locator('button[type="submit"]').click();

      await guestBigSpenderPage.waitForTimeout(2000);

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
    test('should have accessible form inputs', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // First name input should have label
      const firstNameInput = profilePage.firstNameInput;
      const ariaLabel = await firstNameInput.getAttribute('aria-label');
      const id = await firstNameInput.getAttribute('id');
      const labelFor = id ? await guestBigSpenderPage.locator(`label[for="${id}"]`).count() : 0;

      expect(ariaLabel || labelFor > 0).toBeTruthy();
    });

    test('should be keyboard navigable', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Tab through form elements
      await guestBigSpenderPage.keyboard.press('Tab');
      await guestBigSpenderPage.keyboard.press('Tab');
      await guestBigSpenderPage.keyboard.press('Tab');

      const focused = guestBigSpenderPage.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      // Should have h1
      const h1 = guestBigSpenderPage.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBe(1);
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS
  // ============================================================================

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should stack sidebar and content on mobile', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
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

    test('should have touch-friendly buttons', async ({ guestBigSpenderPage }) => {
      // Already logged in via fixture
      const profilePage = new AccountProfilePage(guestBigSpenderPage);
      await profilePage.gotoOwnProfile();

      const saveButton = profilePage.saveButton;
      const box = await saveButton.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });
  });
});
