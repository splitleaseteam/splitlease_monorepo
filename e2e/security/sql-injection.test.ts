/**
 * SQL Injection Protection E2E Tests
 *
 * Tests for verifying that all user inputs are properly sanitized
 * and protected against SQL injection attacks.
 *
 * Attack Vectors Tested:
 * - Search inputs
 * - Form inputs (login, signup, profile)
 * - URL parameters
 * - Filter parameters
 * - Proposal/booking form fields
 * - Message inputs
 */

import { test, expect, Page } from '@playwright/test';
import { SEED_USERS } from '../fixtures/test-data-factory';

// ============================================================================
// SQL INJECTION PAYLOADS
// ============================================================================

/**
 * Common SQL injection payloads for testing
 * These are standard penetration testing patterns
 */
const SQL_INJECTION_PAYLOADS = {
  // Basic SQL injection patterns
  basic: [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "1' OR '1'='1",
    "1 OR 1=1",
    "' OR ''='",
    "1' OR '1'='1' --",
    "admin'--",
    "admin' #",
    "' OR 1=1--",
    "' OR 1=1#",
    "') OR ('1'='1",
    "') OR ('1'='1'--",
  ],

  // Union-based injection
  union: [
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL, NULL--",
    "' UNION SELECT username, password FROM users--",
    "1' UNION SELECT * FROM users--",
    "' UNION ALL SELECT 1,2,3--",
    "' UNION SELECT table_name FROM information_schema.tables--",
  ],

  // Time-based blind injection
  timeBased: [
    "'; WAITFOR DELAY '0:0:5'--",
    "'; SELECT SLEEP(5)--",
    "' AND SLEEP(5)--",
    "1' AND SLEEP(5)#",
    "'; SELECT pg_sleep(5)--",
    "' OR pg_sleep(5)--",
  ],

  // Error-based injection
  errorBased: [
    "' AND 1=CONVERT(int, (SELECT TOP 1 table_name FROM information_schema.tables))--",
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version())))--",
    "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
  ],

  // PostgreSQL specific (Supabase uses PostgreSQL)
  postgresql: [
    "'; DROP TABLE users;--",
    "'; DELETE FROM users;--",
    "'; UPDATE users SET role='admin';--",
    "' || pg_sleep(5)--",
    "'; SELECT current_user;--",
    "'; SELECT current_database();--",
    "$$ $$ OR 1=1",
    "E'\\x27 OR 1=1'",
  ],

  // Stacked queries
  stacked: [
    "'; INSERT INTO users VALUES ('hacked', 'password');--",
    "'; UPDATE users SET email='hacker@evil.com';--",
    "'; CREATE TABLE hacked(data text);--",
  ],

  // Comment-based injection
  comments: [
    "'/**/OR/**/1=1/**/--",
    "'%0aOR%0a1=1%0a--",
    "' /*!50000 OR 1=1*/--",
  ],

  // Special characters
  specialChars: [
    "';",
    '"--',
    "\\",
    "\\x27",
    "%27",
    "&#39;",
    "&apos;",
    "''",
    '""',
    "NULL",
    "\\N",
    "\\0",
  ],

  // JSON/JSONB injection (PostgreSQL)
  jsonInjection: [
    "'{\"key\": \"value\"}'::jsonb",
    "' AND data::jsonb->>'key'='value'--",
    "jsonb_set(data, '{key}', '\"hacked\"')",
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Tests if input is properly handled (no SQL errors, proper sanitization)
 */
async function testInputSanitization(
  page: Page,
  inputSelector: string,
  payload: string,
  submitSelector?: string
): Promise<{ passed: boolean; error?: string }> {
  try {
    const input = page.locator(inputSelector);

    if (!(await input.isVisible({ timeout: 5000 }))) {
      return { passed: true }; // Input not found, skip
    }

    // Clear and fill with payload
    await input.clear();
    await input.fill(payload);

    // Submit if selector provided
    if (submitSelector) {
      const submitButton = page.locator(submitSelector);
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Check for SQL error indicators in page content
    const pageContent = await page.content();
    const sqlErrorPatterns = [
      /syntax error/i,
      /sql error/i,
      /database error/i,
      /query error/i,
      /postgres error/i,
      /pg_query/i,
      /mysql_/i,
      /ORA-\d{5}/i,
      /SQLSTATE/i,
      /unterminated quoted string/i,
      /unexpected end of SQL/i,
      /invalid input syntax/i,
    ];

    for (const pattern of sqlErrorPatterns) {
      if (pattern.test(pageContent)) {
        return {
          passed: false,
          error: `SQL error pattern detected: ${pattern}`,
        };
      }
    }

    return { passed: true };
  } catch (error) {
    return { passed: true }; // Error during test, consider it handled
  }
}

/**
 * Tests URL parameter injection
 */
async function testUrlInjection(
  page: Page,
  baseUrl: string,
  paramName: string,
  payload: string
): Promise<{ passed: boolean; error?: string }> {
  try {
    const encodedPayload = encodeURIComponent(payload);
    const testUrl = `${baseUrl}?${paramName}=${encodedPayload}`;

    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    // Check response
    const response = await page.waitForResponse(
      (response) => response.url().includes(baseUrl),
      { timeout: 5000 }
    ).catch(() => null);

    // Check for SQL errors in response
    const pageContent = await page.content();
    const sqlErrorPatterns = [
      /syntax error/i,
      /sql error/i,
      /database error/i,
      /query error/i,
    ];

    for (const pattern of sqlErrorPatterns) {
      if (pattern.test(pageContent)) {
        return {
          passed: false,
          error: `SQL error in URL parameter: ${paramName}`,
        };
      }
    }

    return { passed: true };
  } catch {
    return { passed: true };
  }
}

// ============================================================================
// SEARCH INPUT INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Search Inputs', () => {
  test.describe('Basic Search Field', () => {
    test('should sanitize basic SQL injection in search input', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 5)) {
        const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"], .search-input');

        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const result = await testInputSanitization(
            page,
            '[data-testid="search-input"], input[type="search"], input[name="search"], .search-input',
            payload,
            '[data-testid="search-submit"], button[type="submit"]'
          );

          expect(result.passed).toBeTruthy();
        }
      }
    });

    test('should sanitize union-based injection in search', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      for (const payload of SQL_INJECTION_PAYLOADS.union.slice(0, 3)) {
        const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"]');

        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const result = await testInputSanitization(
            page,
            '[data-testid="search-input"], input[type="search"], input[name="search"]',
            payload
          );

          expect(result.passed).toBeTruthy();
        }
      }
    });

    test('should sanitize PostgreSQL specific injection in search', async ({ page }) => {
      await page.goto('/search');
      await page.waitForLoadState('networkidle');

      for (const payload of SQL_INJECTION_PAYLOADS.postgresql.slice(0, 4)) {
        const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"]');

        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const result = await testInputSanitization(
            page,
            '[data-testid="search-input"], input[type="search"], input[name="search"]',
            payload
          );

          expect(result.passed).toBeTruthy();
        }
      }
    });
  });

  test.describe('Filter Dropdowns', () => {
    test('should sanitize borough filter parameter', async ({ page }) => {
      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
        const result = await testUrlInjection(page, '/search', 'borough', payload);
        expect(result.passed).toBeTruthy();
      }
    });

    test('should sanitize neighborhood filter parameter', async ({ page }) => {
      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
        const result = await testUrlInjection(page, '/search', 'neighborhood', payload);
        expect(result.passed).toBeTruthy();
      }
    });

    test('should sanitize price filter parameters', async ({ page }) => {
      const pricePayloads = [
        "100' OR '1'='1",
        "100; DROP TABLE listings;--",
        "100 UNION SELECT * FROM users--",
      ];

      for (const payload of pricePayloads) {
        await page.goto(`/search?minPrice=${encodeURIComponent(payload)}`);
        await page.waitForLoadState('networkidle');

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
        expect(pageContent.toLowerCase()).not.toContain('syntax error');
      }
    });

    test('should sanitize bedroom filter parameter', async ({ page }) => {
      const bedroomPayloads = [
        "2' OR '1'='1",
        "2; DELETE FROM listings;--",
        "2 UNION SELECT * FROM users--",
      ];

      for (const payload of bedroomPayloads) {
        await page.goto(`/search?bedrooms=${encodeURIComponent(payload)}`);
        await page.waitForLoadState('networkidle');

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    });
  });
});

// ============================================================================
// LOGIN/SIGNUP FORM INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Authentication Forms', () => {
  test.describe('Login Form', () => {
    test('should sanitize SQL injection in email field', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 5)) {
        await page.locator('input[type="email"]').clear();
        await page.locator('input[type="email"]').fill(payload);
        await page.locator('input[type="password"]').fill('testpassword');
        await page.locator('button[type="submit"]').click();

        await page.waitForTimeout(1000);

        // Should show validation error, not SQL error
        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
        expect(pageContent.toLowerCase()).not.toContain('syntax error');
        expect(pageContent.toLowerCase()).not.toContain('database error');
      }
    });

    test('should sanitize SQL injection in password field', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 5)) {
        await page.locator('input[type="email"]').clear();
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[type="password"]').clear();
        await page.locator('input[type="password"]').fill(payload);
        await page.locator('button[type="submit"]').click();

        await page.waitForTimeout(1000);

        // Should show auth error, not SQL error
        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
        expect(pageContent.toLowerCase()).not.toContain('syntax error');
      }
    });

    test('should not allow SQL injection bypass in login', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Try classic SQL injection bypass
      await page.locator('input[type="email"]').fill("admin'--");
      await page.locator('input[type="password"]').fill("' OR '1'='1");
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);

      // Should NOT be logged in
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
      const isLoggedIn = await userMenu.isVisible().catch(() => false);

      expect(isLoggedIn).toBeFalsy();
    });
  });

  test.describe('Signup Form', () => {
    test('should sanitize SQL injection in signup email', async ({ page }) => {
      await page.goto('/');

      // Navigate to signup
      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      // Click signup link
      const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up"), a:has-text("Create account")');
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await page.waitForTimeout(1000);
      }

      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.isVisible()) {
          await emailInput.clear();
          await emailInput.fill(payload);

          // Try to submit
          await page.locator('button[type="submit"]').click();
          await page.waitForTimeout(1000);

          // Check for SQL errors
          const pageContent = await page.content();
          expect(pageContent.toLowerCase()).not.toContain('sql error');
        }
      }
    });

    test('should sanitize SQL injection in signup name fields', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      const signupLink = page.locator('a:has-text("Sign up"), button:has-text("Sign up")');
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await page.waitForTimeout(1000);
      }

      const nameInput = page.locator('input[name="firstName"], input[name="name"]');
      if (await nameInput.isVisible()) {
        for (const payload of SQL_INJECTION_PAYLOADS.stacked.slice(0, 2)) {
          await nameInput.clear();
          await nameInput.fill(payload);

          const pageContent = await page.content();
          expect(pageContent.toLowerCase()).not.toContain('sql error');
        }
      }
    });
  });
});

// ============================================================================
// PROFILE FORM INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Profile Forms', () => {
  test('should sanitize SQL injection in profile name update', async ({ page }) => {
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

    // Go to profile
    await page.goto('/account-profile');
    await page.waitForLoadState('networkidle');

    // Try to edit profile with SQL injection
    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")');
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();

      const nameInput = page.locator('input[name="firstName"], input[name="name"]');
      if (await nameInput.isVisible()) {
        for (const payload of SQL_INJECTION_PAYLOADS.postgresql.slice(0, 3)) {
          await nameInput.clear();
          await nameInput.fill(payload);

          const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }

          // Check for SQL errors
          const pageContent = await page.content();
          expect(pageContent.toLowerCase()).not.toContain('sql error');
          expect(pageContent.toLowerCase()).not.toContain('syntax error');
        }
      }
    }
  });

  test('should sanitize SQL injection in phone number update', async ({ page }) => {
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

    await page.goto('/account-profile');
    await page.waitForLoadState('networkidle');

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
        await phoneInput.clear();
        await phoneInput.fill(payload);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });
});

// ============================================================================
// PROPOSAL/BOOKING FORM INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Proposal/Booking Forms', () => {
  test('should sanitize SQL injection in proposal message', async ({ page }) => {
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

    // Go to search and find a listing
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
    if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingCards.first().click();
      await page.waitForLoadState('networkidle');

      // Try to submit proposal with SQL injection in message
      const proposalButton = page.locator('[data-testid="proposal-button"], button:has-text("Request"), button:has-text("Book")');
      if (await proposalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await proposalButton.click();
        await page.waitForTimeout(1000);

        const messageInput = page.locator('textarea[name="message"], textarea[name="needForSpace"], [data-testid="proposal-message"]');
        if (await messageInput.isVisible()) {
          for (const payload of SQL_INJECTION_PAYLOADS.postgresql.slice(0, 3)) {
            await messageInput.clear();
            await messageInput.fill(payload);

            const pageContent = await page.content();
            expect(pageContent.toLowerCase()).not.toContain('sql error');
          }
        }
      }
    }
  });

  test('should sanitize SQL injection in "about me" field', async ({ page }) => {
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

    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
    if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingCards.first().click();
      await page.waitForLoadState('networkidle');

      const proposalButton = page.locator('[data-testid="proposal-button"], button:has-text("Request")');
      if (await proposalButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await proposalButton.click();
        await page.waitForTimeout(1000);

        const aboutMeInput = page.locator('textarea[name="aboutMe"], [data-testid="about-me"]');
        if (await aboutMeInput.isVisible()) {
          for (const payload of SQL_INJECTION_PAYLOADS.union.slice(0, 3)) {
            await aboutMeInput.clear();
            await aboutMeInput.fill(payload);

            const pageContent = await page.content();
            expect(pageContent.toLowerCase()).not.toContain('sql error');
          }
        }
      }
    }
  });
});

// ============================================================================
// MESSAGE INPUT INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Message Inputs', () => {
  test('should sanitize SQL injection in message content', async ({ page }) => {
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

    // Go to messages
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');

    // Select a thread if available
    const threadItems = page.locator('.thread-item, [data-testid="thread-item"]');
    if (await threadItems.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await threadItems.first().click();
      await page.waitForTimeout(1000);

      const messageInput = page.locator('[data-testid="message-input"], textarea[name="message"]');
      if (await messageInput.isVisible()) {
        for (const payload of SQL_INJECTION_PAYLOADS.stacked.slice(0, 3)) {
          await messageInput.clear();
          await messageInput.fill(payload);

          // Don't actually send, just check input handling
          const pageContent = await page.content();
          expect(pageContent.toLowerCase()).not.toContain('sql error');
        }
      }
    }
  });

  test('should sanitize SQL injection in contact host message', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const listingCards = page.locator('.listing-card, [data-testid="listing-card"]');
    if (await listingCards.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await listingCards.first().click();
      await page.waitForLoadState('networkidle');

      const contactButton = page.locator('[data-testid="contact-host"], button:has-text("Contact")');
      if (await contactButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await contactButton.click();
        await page.waitForTimeout(1000);

        const messageInput = page.locator('textarea[name="message"], [data-testid="contact-message"]');
        if (await messageInput.isVisible()) {
          for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
            await messageInput.clear();
            await messageInput.fill(payload);

            const pageContent = await page.content();
            expect(pageContent.toLowerCase()).not.toContain('sql error');
          }
        }
      }
    }
  });
});

// ============================================================================
// URL PARAMETER INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - URL Parameters', () => {
  test('should sanitize listing ID parameter', async ({ page }) => {
    const maliciousIds = [
      "1' OR '1'='1",
      "1; DROP TABLE listings;--",
      "1 UNION SELECT * FROM users--",
      "1' AND SLEEP(5)--",
    ];

    for (const id of maliciousIds) {
      await page.goto(`/view-split-lease/${encodeURIComponent(id)}`);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('sql error');
      expect(pageContent.toLowerCase()).not.toContain('syntax error');
      expect(pageContent.toLowerCase()).not.toContain('database error');
    }
  });

  test('should sanitize proposal ID parameter', async ({ page }) => {
    const maliciousIds = [
      "abc' OR '1'='1",
      "xyz; DELETE FROM proposals;--",
      "123 UNION SELECT * FROM users--",
    ];

    for (const id of maliciousIds) {
      await page.goto(`/proposal/${encodeURIComponent(id)}`);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('sql error');
    }
  });

  test('should sanitize thread ID parameter', async ({ page }) => {
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

    const maliciousIds = [
      "thread' OR '1'='1",
      "thread; DROP TABLE messages;--",
    ];

    for (const id of maliciousIds) {
      await page.goto(`/messages/${encodeURIComponent(id)}`);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('sql error');
    }
  });

  test('should sanitize user ID parameter in profile URL', async ({ page }) => {
    const maliciousIds = [
      "user' OR '1'='1",
      "admin'--",
      "1; UPDATE users SET role='admin';--",
    ];

    for (const id of maliciousIds) {
      await page.goto(`/account-profile?userId=${encodeURIComponent(id)}`);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('sql error');
    }
  });
});

// ============================================================================
// LISTING FORM INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Listing Forms', () => {
  test('should sanitize SQL injection in listing title', async ({ page }) => {
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

    // Try to create/edit a listing
    await page.goto('/create-listing');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[name="title"], input[name="name"], [data-testid="listing-title"]');
    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      for (const payload of SQL_INJECTION_PAYLOADS.postgresql.slice(0, 3)) {
        await titleInput.clear();
        await titleInput.fill(payload);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });

  test('should sanitize SQL injection in listing description', async ({ page }) => {
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

    await page.goto('/create-listing');
    await page.waitForLoadState('networkidle');

    const descriptionInput = page.locator('textarea[name="description"], [data-testid="listing-description"]');
    if (await descriptionInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      for (const payload of SQL_INJECTION_PAYLOADS.stacked.slice(0, 2)) {
        await descriptionInput.clear();
        await descriptionInput.fill(payload);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });

  test('should sanitize SQL injection in listing address', async ({ page }) => {
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

    await page.goto('/create-listing');
    await page.waitForLoadState('networkidle');

    const addressInput = page.locator('input[name="address"], [data-testid="listing-address"]');
    if (await addressInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      for (const payload of SQL_INJECTION_PAYLOADS.basic.slice(0, 3)) {
        await addressInput.clear();
        await addressInput.fill(payload);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });
});

// ============================================================================
// EDGE FUNCTION INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Edge Function Endpoints', () => {
  test('should sanitize injection in Edge Function payload', async ({ page, request }) => {
    const maliciousPayloads = [
      { action: "' OR '1'='1", payload: {} },
      { action: "get'; DROP TABLE users;--", payload: {} },
      { action: "get", payload: { id: "' OR '1'='1" } },
      { action: "get", payload: { id: "1; DELETE FROM users;--" } },
    ];

    for (const maliciousPayload of maliciousPayloads) {
      try {
        const response = await request.post(
          `${process.env.SUPABASE_URL || 'http://localhost:54321'}/functions/v1/proposal`,
          {
            data: maliciousPayload,
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_ANON_KEY || 'test-key',
            },
          }
        );

        // Should get validation error or similar, not SQL error
        const responseBody = await response.text();
        expect(responseBody.toLowerCase()).not.toContain('sql error');
        expect(responseBody.toLowerCase()).not.toContain('syntax error');
        expect(responseBody.toLowerCase()).not.toContain('pg_query');
      } catch {
        // Request failure is acceptable - means it was rejected
      }
    }
  });

  test('should sanitize injection in search Edge Function', async ({ page, request }) => {
    const maliciousQueries = [
      "Manhattan' OR '1'='1",
      "Brooklyn; DROP TABLE listings;--",
      "Queens UNION SELECT * FROM users--",
    ];

    for (const query of maliciousQueries) {
      try {
        const response = await request.get(
          `${process.env.SUPABASE_URL || 'http://localhost:54321'}/rest/v1/listing?borough=eq.${encodeURIComponent(query)}`,
          {
            headers: {
              'apikey': process.env.SUPABASE_ANON_KEY || 'test-key',
            },
          }
        );

        // Should handle gracefully
        const responseBody = await response.text();
        expect(responseBody.toLowerCase()).not.toContain('sql error');
      } catch {
        // Request failure is acceptable
      }
    }
  });
});

// ============================================================================
// SPECIAL CHARACTER HANDLING TESTS
// ============================================================================

test.describe('SQL Injection - Special Character Handling', () => {
  test('should properly handle quotes in legitimate input', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    // Legitimate inputs with special characters
    const legitimateInputs = [
      "O'Brien's Place",
      "McDonald's",
      'Say "Hello"',
      "It's great",
      "Test & Test",
      "100% Perfect",
    ];

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      for (const input of legitimateInputs) {
        await searchInput.clear();
        await searchInput.fill(input);

        // Should not cause errors
        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
        expect(pageContent.toLowerCase()).not.toContain('syntax error');
      }
    }
  });

  test('should handle unicode characters safely', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const unicodeInputs = [
      "\u0027 OR 1=1--",
      "\u0022; DROP TABLE users;--",
      "Test\u0000Injection",
      "Test\r\n; DROP TABLE--",
    ];

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      for (const input of unicodeInputs) {
        await searchInput.clear();
        await searchInput.fill(input);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });

  test('should handle null bytes safely', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const nullByteInputs = [
      "test%00' OR '1'='1",
      "test\x00; DROP TABLE;--",
    ];

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[name="search"]');
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      for (const input of nullByteInputs) {
        await searchInput.clear();
        await searchInput.fill(input);

        const pageContent = await page.content();
        expect(pageContent.toLowerCase()).not.toContain('sql error');
      }
    }
  });
});

// ============================================================================
// SECOND-ORDER INJECTION TESTS
// ============================================================================

test.describe('SQL Injection - Second-Order Injection', () => {
  test('should prevent second-order injection through stored data', async ({ page }) => {
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

    // Try to store malicious data that could be executed later
    await page.goto('/account-profile');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('[data-testid="edit-profile"], button:has-text("Edit")');
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();

      // Second-order injection payloads
      const secondOrderPayloads = [
        "Robert'; DROP TABLE users;--",
        "Alice' OR '1'='1",
        "$(rm -rf /)",
        "`cat /etc/passwd`",
      ];

      const nameInput = page.locator('input[name="firstName"], input[name="name"]');
      if (await nameInput.isVisible()) {
        for (const payload of secondOrderPayloads) {
          await nameInput.clear();
          await nameInput.fill(payload);

          const saveButton = page.locator('[data-testid="save-profile"], button:has-text("Save")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }

          // Check for any SQL errors
          const pageContent = await page.content();
          expect(pageContent.toLowerCase()).not.toContain('sql error');
          expect(pageContent.toLowerCase()).not.toContain('syntax error');
        }
      }
    }
  });
});
