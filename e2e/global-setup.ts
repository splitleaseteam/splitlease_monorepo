/**
 * Global Setup for E2E Tests
 *
 * Runs ONCE before all tests in the test suite.
 *
 * Responsibilities:
 * 1. Load environment variables from .env.test
 * 2. Create test users in Supabase Auth
 * 3. Seed test data (listings, leases, archetypes, etc.)
 * 4. Generate authenticated storage states for each user type
 *
 * Storage states are saved to e2e/.auth/ and used by test fixtures
 * to create pre-authenticated browser contexts.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createTestUsers, TEST_USERS } from './fixtures/test-users';
import { seedTestData } from './fixtures/seed-data';

// ============================================================================
// CONFIGURATION
// ============================================================================

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test
const envPath = path.resolve(__dirname, '..', '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
} else {
  // Try loading from .env in project root
  const rootEnvPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
    console.log(`Loaded environment from: ${rootEnvPath}`);
  } else {
    console.warn('No .env.test or .env file found. Using existing environment variables.');
  }
}

// ============================================================================
// STORAGE STATE GENERATION
// ============================================================================

/**
 * Generate storage state for a user by logging in via the UI
 *
 * @param baseURL - Base URL of the application
 * @param email - User email
 * @param password - User password
 * @param outputPath - Path to save storage state JSON
 */
async function generateStorageState(
  baseURL: string,
  email: string,
  password: string,
  outputPath: string
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to home page
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });

    // Look for sign in button in header or menu
    const menuButton = page.locator('.hamburger-menu, [aria-label="Toggle menu"], [data-testid="mobile-menu-toggle"]');
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    // Click sign in link - use more flexible selectors
    const signInLink = page.locator('text=Sign In').first();
    if (await signInLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInLink.click();
    }

    // Wait for auth modal - include inline styled modals
    await page.waitForSelector(
      '[role="dialog"], .modal, [style*="position: fixed"], [data-testid="auth-modal"], .auth-modal, .signup-login-modal, [class*="SignUpLogin"]',
      { timeout: 10000 }
    );

    // Fill email
    const emailInput = page.locator(
      '[data-testid="email-input"], input[type="email"], input[name="email"]'
    ).first();
    await emailInput.fill(email);

    // Fill password
    const passwordInput = page.locator(
      '[data-testid="password-input"], input[type="password"], input[name="password"]'
    ).first();
    await passwordInput.fill(password);

    // Submit login
    const submitButton = page.locator(
      '[data-testid="login-button"], [data-testid="submit-login"], button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Log In")'
    ).first();
    await submitButton.click();

    // Wait for successful login (redirect away from modal or page change)
    await page.waitForTimeout(3000);

    // Check if we're logged in by looking for user avatar or logged-in elements
    const isLoggedIn = await page.locator(
      '.logged-in-avatar, [data-testid="user-avatar"], [data-testid="user-menu"]'
    ).isVisible({ timeout: 5000 }).catch(() => false);

    if (!isLoggedIn) {
      // Check localStorage for auth token as fallback
      const hasToken = await page.evaluate(() => {
        return !!(
          localStorage.getItem('splitlease_auth_token') ||
          localStorage.getItem('supabase.auth.token') ||
          Object.keys(localStorage).some(key => key.includes('supabase') && key.includes('auth'))
        );
      });

      if (!hasToken) {
        console.warn(`  [WARN] Could not verify login for ${email}, but continuing...`);
      }
    }

    // Save storage state
    await context.storageState({ path: outputPath });
    console.log(`  [OK] Storage state saved: ${outputPath}`);

  } catch (error) {
    console.error(`  [ERROR] Failed to generate storage state for ${email}:`, error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

// ============================================================================
// GLOBAL SETUP
// ============================================================================

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n========================================');
  console.log('E2E Test Global Setup');
  console.log('========================================\n');

  // Verify required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing required environment variables.\n' +
      'Please create a .env.test file with:\n' +
      '  SUPABASE_URL=https://your-project.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n' +
      '  E2E_BASE_URL=http://localhost:8000'
    );
  }

  const baseURL = process.env.E2E_BASE_URL || config.projects[0]?.use?.baseURL || 'http://localhost:8000';
  console.log(`Base URL: ${baseURL}`);

  // 1. Create test users in Supabase Auth
  console.log('\n--- Step 1: Create Test Users ---');
  await createTestUsers();

  // 2. Seed test data
  console.log('\n--- Step 2: Seed Test Data ---');
  await seedTestData();

  // 3. Create auth directory
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`\nCreated auth directory: ${authDir}`);
  }

  // 4. Generate storage states for each user
  console.log('\n--- Step 3: Generate Auth Storage States ---');

  const userKeyToFileName: Record<string, string> = {
    guest_big_spender: 'guest-big-spender.json',
    guest_high_flex: 'guest-high-flex.json',
    guest_average: 'guest-average.json',
    host: 'host.json',
    admin: 'admin.json'
  };

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const fileName = userKeyToFileName[key];
    if (!fileName) continue;

    const outputPath = path.join(authDir, fileName);
    console.log(`  Generating storage state for ${key}...`);

    try {
      await generateStorageState(baseURL, user.email, user.password, outputPath);
    } catch (error) {
      console.error(`  [ERROR] Failed to generate auth state for ${key}:`, error);
      // Create an empty storage state file so tests can at least run
      fs.writeFileSync(outputPath, JSON.stringify({ cookies: [], origins: [] }));
      console.log(`  [FALLBACK] Created empty storage state for ${key}`);
    }
  }

  console.log('\n========================================');
  console.log('Global Setup Complete!');
  console.log('========================================\n');
}

export default globalSetup;
