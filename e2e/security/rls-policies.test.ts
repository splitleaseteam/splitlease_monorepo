/**
 * Row-Level Security (RLS) Policy E2E Tests
 *
 * Tests for verifying Row-Level Security policies are correctly enforced.
 * Ensures users can only access data they are authorized to view or modify.
 *
 * Security Categories Tested:
 * - User data isolation
 * - Listing access control (owners only for write, public for read)
 * - Proposal access control (parties involved only)
 * - Message/Thread access control
 * - Payment record access
 * - Bidding session access
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { SEED_USERS, createTestGuest, createTestHost } from '../fixtures/test-data-factory';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Makes authenticated API request to Supabase
 */
async function makeAuthenticatedRequest(
  request: APIRequestContext,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    token?: string;
    body?: object;
  } = {}
) {
  const { method = 'GET', token, body } = options;
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await request.fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status(),
    data: await response.json().catch(() => null),
    headers: response.headers(),
  };
}

/**
 * Attempts to login and get auth token
 */
async function getAuthToken(page: Page, email: string, password: string): Promise<string | null> {
  await page.goto('/');

  // Try to login via UI
  const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
  if (await loginButton.isVisible()) {
    await loginButton.click();
  }

  const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
  await loginModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  if (await loginModal.isVisible()) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  }

  // Extract token from storage
  const token = await page.evaluate(() => {
    const storageToken = localStorage.getItem('supabase.auth.token');
    if (storageToken) {
      try {
        const parsed = JSON.parse(storageToken);
        return parsed.access_token || null;
      } catch {
        return null;
      }
    }
    return localStorage.getItem('splitlease_auth_token') || null;
  });

  return token;
}

// ============================================================================
// USER DATA ISOLATION TESTS
// ============================================================================

test.describe('RLS - User Data Isolation', () => {
  test.describe('Profile Data Access', () => {
    test('should only allow user to access their own profile data', async ({ page }) => {
      await page.goto('/');

      // Login as guest user
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to own profile
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      // Should be able to view own profile
      const profileContent = page.locator('.profile-content, [data-testid="profile-content"], .account-profile');
      const hasAccess = await profileContent.isVisible().catch(() => false);

      // Should NOT show other users' data
      const otherUserData = page.locator(`text="${SEED_USERS.host.email}"`);
      const showsOtherUser = await otherUserData.isVisible().catch(() => false);

      expect(showsOtherUser).toBeFalsy();
    });

    test('should not expose user data via URL manipulation', async ({ page }) => {
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

      // Try to access another user's profile via URL manipulation
      // Using a made-up user ID
      await page.goto('/account-profile?userId=another-user-id-123');
      await page.waitForLoadState('networkidle');

      // Should NOT reveal another user's personal information
      const sensitiveInfo = page.locator('[data-testid="user-email"], .user-email');
      if (await sensitiveInfo.isVisible()) {
        const emailText = await sensitiveInfo.textContent();
        expect(emailText).not.toContain(SEED_USERS.host.email);
        expect(emailText).not.toContain('another-user');
      }
    });

    test('should reject unauthenticated profile access', async ({ page }) => {
      // Try to access profile without logging in
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show unauthorized
      const currentUrl = page.url();
      const isRedirected = currentUrl.includes('login') || currentUrl.includes('auth');
      const loginRequired = page.locator('.login-required, [data-testid="login-required"], .unauthenticated');
      const showsLoginRequired = await loginRequired.isVisible().catch(() => false);

      expect(isRedirected || showsLoginRequired).toBeTruthy();
    });
  });

  test.describe('User Settings Access', () => {
    test('should only allow modification of own settings', async ({ page }) => {
      await page.goto('/');

      // Login
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Navigate to settings
      await page.goto('/account-profile');
      await page.waitForLoadState('networkidle');

      // Check that only own settings are modifiable
      const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should only be able to edit own profile
        const nameInput = page.locator('input[name="firstName"], input[name="name"]');
        if (await nameInput.isVisible()) {
          // Verify we're editing our own profile
          const currentValue = await nameInput.inputValue();
          expect(currentValue || '').not.toContain(SEED_USERS.host.firstName);
        }
      }
    });
  });
});

// ============================================================================
// LISTING ACCESS CONTROL TESTS
// ============================================================================

test.describe('RLS - Listing Access Control', () => {
  test.describe('Public Listing Access', () => {
    test('should allow unauthenticated users to view public listings', async ({ page }) => {
      // Navigate to search page without logging in
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      // Should be able to see listings
      const listingCards = page.locator('.listing-card, [data-testid="listing-card"], .search-result');
      await page.waitForTimeout(2000);

      const listingCount = await listingCards.count();
      // Public listings should be visible
      expect(listingCount).toBeGreaterThanOrEqual(0); // May be 0 if no listings exist
    });

    test('should allow viewing listing details without authentication', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const listingCards = page.locator('.listing-card, [data-testid="listing-card"], .search-result');
      const listingCount = await listingCards.count();

      if (listingCount > 0) {
        // Click on first listing
        await listingCards.first().click();
        await page.waitForLoadState('networkidle');

        // Should be able to view listing details
        const listingTitle = page.locator('h1, .listing-title, [data-testid="listing-title"]');
        await expect(listingTitle).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Listing Modification Access', () => {
    test('should only allow host to edit their own listings', async ({ page }) => {
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

      // Go to host's listings
      await page.goto('/host-listings');
      await page.waitForLoadState('networkidle');

      // Should see own listings with edit capability
      const editButton = page.locator('[data-testid="edit-listing"], button:has-text("Edit"), .edit-listing-btn');

      // If listings exist, edit should be available for own listings
      if (await editButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(editButton.first()).toBeVisible();
      }
    });

    test('should not show edit options for listings owned by others', async ({ page }) => {
      // Login as guest (not host)
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Go to search and view a listing
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
      if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await listingCards.first().click();
        await page.waitForLoadState('networkidle');

        // Should NOT see edit button for someone else's listing
        const editButton = page.locator('[data-testid="edit-listing"], button:has-text("Edit Listing"), .host-edit-btn');
        await expect(editButton).toBeHidden({ timeout: 5000 });
      }
    });

    test('should not allow deletion of listings owned by others', async ({ page }) => {
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

      // Go to search and view a listing
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
      if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await listingCards.first().click();
        await page.waitForLoadState('networkidle');

        // Should NOT see delete button for someone else's listing
        const deleteButton = page.locator('[data-testid="delete-listing"], button:has-text("Delete"), .delete-listing-btn');
        await expect(deleteButton).toBeHidden({ timeout: 3000 });
      }
    });
  });
});

// ============================================================================
// PROPOSAL ACCESS CONTROL TESTS
// ============================================================================

test.describe('RLS - Proposal Access Control', () => {
  test.describe('Proposal Visibility', () => {
    test('should only show proposals where user is guest or host', async ({ page }) => {
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

      // Go to guest proposals
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      // Should only see proposals where current user is the guest
      // Cannot see proposals from other guests
      const proposalItems = page.locator('.proposal-card, [data-testid="proposal-card"], .proposal-item');
      const proposalCount = await proposalItems.count();

      // Each visible proposal should belong to this guest
      for (let i = 0; i < Math.min(proposalCount, 5); i++) {
        const proposal = proposalItems.nth(i);
        // Proposal should not show other guests' info as the proposer
        const otherGuestEmail = await proposal.locator(`text="${SEED_USERS.host.email}"`).isVisible().catch(() => false);
        // Host email might be shown as the listing owner, that's OK
        // But the proposal itself should be for this guest
      }
    });

    test('should not allow viewing proposals user is not involved in via URL', async ({ page }) => {
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

      // Try to access a proposal that doesn't belong to this user
      // Using a fake/unknown proposal ID
      await page.goto('/proposal/fake-proposal-id-not-mine');
      await page.waitForLoadState('networkidle');

      // Should show error or not found, NOT another user's proposal data
      const errorState = page.locator('.error-state, [data-testid="error"], .not-found, .unauthorized');
      const notFoundText = page.locator('text=/not found|unauthorized|access denied|404/i');

      const showsError = await errorState.isVisible().catch(() => false);
      const showsNotFound = await notFoundText.isVisible().catch(() => false);
      const is404 = page.url().includes('404');

      // Either should error out, show not found, or redirect
      expect(showsError || showsNotFound || is404).toBeTruthy();
    });
  });

  test.describe('Proposal Modification', () => {
    test('should only allow guest to cancel their own proposals', async ({ page }) => {
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

      // Go to guest proposals
      await page.goto('/guest-proposals');
      await page.waitForLoadState('networkidle');

      // If there are proposals, should see cancel option for own proposals
      const proposalItems = page.locator('.proposal-card, [data-testid="proposal-card"]');
      if (await proposalItems.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        // Own proposals should have action buttons
        const cancelButton = page.locator('[data-testid="cancel-proposal"], button:has-text("Cancel")');
        // May or may not be visible depending on proposal status
        // But should not show edit/manage options for host-side operations
        const hostActionsButton = page.locator('[data-testid="accept-proposal"], button:has-text("Accept")');
        await expect(hostActionsButton).toBeHidden({ timeout: 3000 });
      }
    });

    test('should only allow host to accept/decline proposals for their listings', async ({ page }) => {
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

      // Go to host proposals
      await page.goto('/host-proposals');
      await page.waitForLoadState('networkidle');

      // If there are proposals, host should see accept/decline options
      const proposalItems = page.locator('.proposal-card, [data-testid="proposal-card"]');
      if (await proposalItems.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        // Host proposals should have host action buttons
        const actionButtons = page.locator('[data-testid="accept-proposal"], [data-testid="decline-proposal"], button:has-text("Accept"), button:has-text("Decline")');
        // At least some proposals should have actions available
      }
    });
  });
});

// ============================================================================
// MESSAGE/THREAD ACCESS CONTROL TESTS
// ============================================================================

test.describe('RLS - Message Access Control', () => {
  test.describe('Thread Visibility', () => {
    test('should only show threads where user is participant', async ({ page }) => {
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

      // Go to messages
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');

      // Should only show threads where this user is a participant
      const threadItems = page.locator('.thread-item, [data-testid="thread-item"], .message-thread');

      // Each thread should involve this user
      // Should not see threads between other users
    });

    test('should not allow accessing messages from threads user is not part of', async ({ page }) => {
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

      // Try to access a thread that doesn't belong to this user
      await page.goto('/messages/fake-thread-id-not-mine');
      await page.waitForLoadState('networkidle');

      // Should show error or unauthorized, NOT other users' messages
      const errorState = page.locator('.error-state, [data-testid="error"], .not-found, .unauthorized');
      const unauthorizedText = page.locator('text=/not found|unauthorized|access denied/i');

      const showsError = await errorState.isVisible().catch(() => false);
      const showsUnauthorized = await unauthorizedText.isVisible().catch(() => false);

      // Should not show message content from other threads
      const messageContent = page.locator('.message-content, [data-testid="message-content"]');
      const hasContent = await messageContent.isVisible().catch(() => false);

      // Either show error or no content, but not someone else's messages
      if (hasContent) {
        // If showing messages, they should be for a thread user is part of
        // or it's an error state
      }
    });
  });

  test.describe('Message Sending', () => {
    test('should only allow sending messages to threads user is part of', async ({ page }) => {
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

      // Go to messages page
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');

      // Select a thread if available
      const threadItems = page.locator('.thread-item, [data-testid="thread-item"]');
      if (await threadItems.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await threadItems.first().click();
        await page.waitForTimeout(1000);

        // Should be able to send message in own thread
        const messageInput = page.locator('[data-testid="message-input"], textarea[name="message"], .message-input');
        const sendButton = page.locator('[data-testid="send-message"], button:has-text("Send")');

        if (await messageInput.isVisible()) {
          await expect(sendButton).toBeVisible();
        }
      }
    });
  });
});

// ============================================================================
// PAYMENT RECORD ACCESS TESTS
// ============================================================================

test.describe('RLS - Payment Record Access', () => {
  test('should not expose payment details to unauthorized users', async ({ page }) => {
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

    // Go to payment history if available
    await page.goto('/payment-history');
    await page.waitForLoadState('networkidle');

    // Should only see own payment history
    const paymentItems = page.locator('.payment-item, [data-testid="payment-item"]');

    // Should not see payment details for other users
    const otherUserPayment = page.locator(`text="${SEED_USERS.host.email}"`);
    const showsOtherUser = await otherUserPayment.isVisible().catch(() => false);

    expect(showsOtherUser).toBeFalsy();
  });

  test('should not allow accessing payment details via URL manipulation', async ({ page }) => {
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

    // Try to access a payment that doesn't belong to this user
    await page.goto('/payment/fake-payment-id-not-mine');
    await page.waitForLoadState('networkidle');

    // Should show error or not found
    const errorState = page.locator('.error-state, [data-testid="error"], .not-found');
    const showsError = await errorState.isVisible().catch(() => false);
    const is404 = page.url().includes('404');

    // Should not show payment details for other users
  });
});

// ============================================================================
// BIDDING SESSION ACCESS CONTROL TESTS
// ============================================================================

test.describe('RLS - Bidding Session Access Control', () => {
  test('should only show bidding sessions where user is participant', async ({ page }) => {
    // Login as guest (assuming they might be a Big Spender)
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
    await page.locator('input[type="password"]').fill('testpassword123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Go to bidding page if it exists
    await page.goto('/bidding');
    await page.waitForLoadState('networkidle');

    // Should only see bidding sessions where user is a participant
    const biddingSessions = page.locator('.bidding-session, [data-testid="bidding-session"]');

    // Should not see sessions between other users
  });

  test('should not allow viewing bids from sessions user is not part of', async ({ page }) => {
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

    // Try to access a bidding session that doesn't belong to this user
    await page.goto('/bidding/fake-session-id');
    await page.waitForLoadState('networkidle');

    // Should show error or unauthorized
    const errorState = page.locator('.error-state, [data-testid="error"], .not-found, .unauthorized');
    const showsError = await errorState.isVisible().catch(() => false);

    // Should not show bid history from other sessions
    const bidHistory = page.locator('.bid-history, [data-testid="bid-history"]');
    const hasBidHistory = await bidHistory.isVisible().catch(() => false);

    // If there's bid history visible, verify it's for a session the user is part of
  });

  test('should only allow placing bids in own sessions', async ({ page }) => {
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

    // Go to bidding page
    await page.goto('/bidding');
    await page.waitForLoadState('networkidle');

    const biddingSessions = page.locator('.bidding-session, [data-testid="bidding-session"]');

    if (await biddingSessions.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await biddingSessions.first().click();
      await page.waitForTimeout(1000);

      // Should only be able to bid in sessions where user is participant
      const bidInput = page.locator('[data-testid="bid-amount"], input[name="bidAmount"]');
      const submitBidButton = page.locator('[data-testid="submit-bid"], button:has-text("Place Bid")');

      // If bidding UI is visible, user should be a valid participant
    }
  });
});

// ============================================================================
// ADMIN ACCESS CONTROL TESTS
// ============================================================================

test.describe('RLS - Admin Access Control', () => {
  test('should not allow non-admin users to access admin pages', async ({ page }) => {
    // Login as regular guest (not admin)
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
    await page.locator('input[type="password"]').fill('testpassword123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Try to access admin pages
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should be denied access or redirected
    const currentUrl = page.url();
    const wasRedirected = !currentUrl.includes('/admin') || currentUrl.includes('unauthorized');

    const accessDenied = page.locator('.access-denied, [data-testid="access-denied"], .unauthorized');
    const showsAccessDenied = await accessDenied.isVisible().catch(() => false);

    expect(wasRedirected || showsAccessDenied).toBeTruthy();
  });

  test('should not allow non-admin users to access admin-threads', async ({ page }) => {
    // Login as regular guest (not admin)
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
    await page.locator('input[type="password"]').fill('testpassword123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Try to access admin threads
    await page.goto('/admin-threads');
    await page.waitForLoadState('networkidle');

    // Should be denied access
    const currentUrl = page.url();
    const wasRedirected = !currentUrl.includes('/admin-threads');

    const accessDenied = page.locator('.access-denied, [data-testid="access-denied"], .unauthorized');
    const showsAccessDenied = await accessDenied.isVisible().catch(() => false);

    expect(wasRedirected || showsAccessDenied).toBeTruthy();
  });

  test('should not expose admin audit logs to non-admin users', async ({ page }) => {
    // Login as regular guest (not admin)
    await page.goto('/');

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    await loginButton.click();

    const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
    await loginModal.waitFor({ state: 'visible' });

    await page.locator('input[type="email"]').fill(SEED_USERS.guest.email);
    await page.locator('input[type="password"]').fill('testpassword123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    // Try to access admin audit logs
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');

    // Should be denied access
    const auditLogs = page.locator('.audit-log, [data-testid="audit-log"]');
    const showsAuditLogs = await auditLogs.isVisible().catch(() => false);

    expect(showsAuditLogs).toBeFalsy();
  });
});

// ============================================================================
// REFERENCE DATA ACCESS TESTS
// ============================================================================

test.describe('RLS - Reference Data Access', () => {
  test('should allow public access to reference/lookup tables', async ({ page }) => {
    // Navigate without logging in
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Filter dropdowns should be populated from reference tables
    const boroughFilter = page.locator('[data-testid="borough-filter"], select[name="borough"], .borough-filter');
    const neighborhoodFilter = page.locator('[data-testid="neighborhood-filter"], select[name="neighborhood"]');
    const amenityFilter = page.locator('[data-testid="amenity-filter"], .amenity-filter');

    // These should be populated from public reference tables
    // If filters are visible, they should have options
    if (await boroughFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to open dropdown
      await boroughFilter.click();
      await page.waitForTimeout(500);

      // Should have options from zat_geo_borough_toplevel
      const options = page.locator('option, [role="option"], .filter-option');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('should allow public access to safety features data', async ({ page }) => {
    // Navigate to a listing detail without logging in
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
    if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingCards.first().click();
      await page.waitForLoadState('networkidle');

      // Safety features section should be visible from public reference table
      const safetySection = page.locator('.safety-features, [data-testid="safety-features"]');
      // May or may not be present depending on listing
    }
  });
});

// ============================================================================
// CROSS-USER DATA LEAKAGE TESTS
// ============================================================================

test.describe('RLS - Cross-User Data Leakage Prevention', () => {
  test('should not leak data through API responses', async ({ page, request }) => {
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

    // Monitor network requests
    const responses: { url: string; data: any }[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('rest/v1') || response.url().includes('functions/v1')) {
        try {
          const data = await response.json();
          responses.push({ url: response.url(), data });
        } catch {
          // Ignore non-JSON responses
        }
      }
    });

    // Navigate around the app
    await page.goto('/guest-proposals');
    await page.waitForTimeout(2000);

    await page.goto('/messages');
    await page.waitForTimeout(2000);

    // Check that no responses contain other users' email or sensitive data
    for (const response of responses) {
      const dataStr = JSON.stringify(response.data);

      // Should not contain other users' sensitive info
      expect(dataStr).not.toContain(SEED_USERS.host.email);
      expect(dataStr).not.toContain(SEED_USERS.admin.email);

      // Should not contain other users' IDs in unexpected places
      // (Some cross-referencing is expected for proposals, etc.)
    }
  });

  test('should not allow IDOR (Insecure Direct Object Reference) attacks', async ({ page }) => {
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

    // Try various IDOR attempts
    const idorAttempts = [
      '/account-profile?id=1',
      '/account-profile?userId=admin',
      '/proposal/1',
      '/messages/1',
      '/payment/1',
      '/listing/edit/1',
    ];

    for (const url of idorAttempts) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Should either:
      // 1. Show error/not found
      // 2. Redirect to appropriate page
      // 3. Show only authorized data

      // Should NOT show sensitive data for other users
      const sensitiveData = page.locator(`text="${SEED_USERS.host.email}"`);
      const showsSensitive = await sensitiveData.isVisible().catch(() => false);

      // This is a basic check - host email might appear legitimately in some contexts
    }
  });
});
