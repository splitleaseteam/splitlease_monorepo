/**
 * E2E Guest Pricing Test Script
 *
 * This script:
 * 1. Logs out any existing session
 * 2. Logs in as the guest user via auth modal
 * 3. Visits each listing and captures all pricing data
 * 4. Takes screenshots at each step
 * 5. Generates a detailed report
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const BASE_URL = 'http://localhost:3000';
const GUEST_EMAIL = 'splitleasefrederick+frederickros@gmail.com';
const GUEST_PASSWORD = 'eCom2023$';
const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e-screenshots', 'guest-pricing');

// Listings to examine
const LISTINGS = [
  { id: '1770159292555x84785333838911712', type: 'weekly' },
  { id: '1770159059956x68069167691952992', type: 'nightly' },
  { id: '1770159488384x35093957137090224', type: 'monthly' }
];

interface PricingData {
  listingId: string;
  listingType: string;
  timestamp: string;
  url: string;
  screenshots: string[];
  pricing: {
    nightlyRate?: string;
    weeklyRate?: string;
    fourWeekRent?: string;
    monthlyRate?: string;
    estimatedTotal?: string;
    serviceFee?: string;
    totalWithFees?: string;
    compensation?: string;
    rawPricingText: string;
  };
  proposalFlowPricing?: {
    screenshots: string[];
    pricingText: string;
  };
  error?: string;
}

interface TestReport {
  testType: 'guest-pricing';
  executedAt: string;
  guestEmail: string;
  baseUrl: string;
  loginSuccess: boolean;
  listings: PricingData[];
  summary: {
    totalListings: number;
    successfulCaptures: number;
    failedCaptures: number;
    observations: string[];
  };
}

async function ensureScreenshotDir(): Promise<void> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`Screenshot saved: ${filename}`);
  return filepath;
}

async function takeFullPageScreenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name}_fullpage.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Full page screenshot saved: ${filename}`);
  return filepath;
}

async function logout(page: Page): Promise<boolean> {
  console.log('Attempting to logout...');
  try {
    // Clear localStorage/sessionStorage to ensure we're logged out
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1000);
    console.log('Cleared local storage and reloaded');
    return true;
  } catch (error) {
    console.log('Logout attempt completed');
    return true;
  }
}

async function login(page: Page): Promise<boolean> {
  console.log(`Logging in as guest: ${GUEST_EMAIL}`);

  try {
    // Navigate to homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '01_homepage_before_login');

    // Look for hamburger menu or sign-in link
    const menuSelectors = [
      '.hamburger-menu',
      '[aria-label="Toggle menu"]',
      '.menu-toggle',
      '.header-menu-button',
      'button[class*="hamburger"]',
      'button[class*="menu"]'
    ];

    let menuClicked = false;
    for (const selector of menuSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.locator(selector).click();
          await page.waitForTimeout(500);
          menuClicked = true;
          console.log(`Clicked menu: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    await takeScreenshot(page, '02_menu_opened');

    // Look for Sign In link in the menu
    const signInSelectors = [
      'text=Sign In',
      'text=Log In',
      'text=Login',
      'a:has-text("Sign In")',
      'button:has-text("Sign In")',
      '[data-testid="sign-in-link"]',
      '.sign-in-link'
    ];

    let signInClicked = false;
    for (const selector of signInSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await page.waitForTimeout(1000);
          signInClicked = true;
          console.log(`Clicked sign in: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    await takeScreenshot(page, '03_signin_modal');

    // Wait for auth modal to appear
    const modalSelectors = [
      '.signup-login-modal',
      '[data-testid="auth-modal"]',
      '.auth-modal',
      '.modal-content',
      'form[class*="auth"]',
      'div[class*="modal"]'
    ];

    let modalVisible = false;
    for (const selector of modalSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 3000 })) {
          modalVisible = true;
          console.log(`Modal found: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!modalVisible) {
      console.log('Modal not visible, checking for direct form');
    }

    // Fill in email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      '[data-testid="email-input"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];

    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.fill(GUEST_EMAIL);
          emailFilled = true;
          console.log(`Filled email: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!emailFilled) {
      console.error('Could not find email input');
      await takeScreenshot(page, '03_error_no_email_field');
      return false;
    }

    // Fill in password
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '[data-testid="password-input"]'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.fill(GUEST_PASSWORD);
          passwordFilled = true;
          console.log(`Filled password: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!passwordFilled) {
      console.error('Could not find password input');
      await takeScreenshot(page, '03_error_no_password_field');
      return false;
    }

    await takeScreenshot(page, '04_credentials_filled');

    // Submit the form
    const submitSelectors = [
      'button[type="submit"]',
      '[data-testid="login-button"]',
      'button:has-text("Sign In")',
      'button:has-text("Log In")',
      'button:has-text("Login")',
      'input[type="submit"]'
    ];

    for (const selector of submitSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          console.log(`Clicked submit: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    // Wait for login to complete
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '05_after_login');

    // Check if login was successful by looking for user-related elements or absence of login modal
    const successIndicators = [
      '.logged-in-avatar',
      '[data-testid="user-avatar"]',
      '.user-avatar',
      '.avatar-dropdown',
      'text=Dashboard',
      'text=My Proposals',
      'text=Guest Proposals'
    ];

    for (const selector of successIndicators) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 3000 })) {
          console.log('Login successful - found user indicator');
          return true;
        }
      } catch {
        // Try next selector
      }
    }

    // Check if modal is gone (login succeeded)
    const modalGone = await page.locator('.signup-login-modal').isHidden({ timeout: 2000 }).catch(() => true);
    if (modalGone) {
      console.log('Login appears successful - modal closed');
      return true;
    }

    console.log('Login status unclear, continuing anyway');
    return true;

  } catch (error) {
    console.error('Login error:', error);
    await takeScreenshot(page, '05_login_error');
    return false;
  }
}

async function extractPricingFromPage(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const pricingTexts: string[] = [];

    // Look for common pricing elements
    const priceSelectors = [
      '.price-display',
      '.pricing-section',
      '.booking-widget',
      '.price-breakdown',
      '[data-testid*="price"]',
      '[class*="price"]',
      '[class*="rate"]',
      '[class*="fee"]',
      '[class*="total"]',
      '[class*="compensation"]',
      '.summary-item',
      '.cost-breakdown',
      '.booking-summary',
      '.rent-breakdown'
    ];

    for (const selector of priceSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.includes('$')) {
          pricingTexts.push(text);
        }
      });
    }

    // Also capture any text with dollar signs
    const allElements = document.querySelectorAll('span, p, div, h1, h2, h3, h4, h5, h6, td, th, li');
    allElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.includes('$') && text.length < 200) {
        // Avoid duplicates
        if (!pricingTexts.some(t => t.includes(text) || text.includes(t))) {
          pricingTexts.push(text);
        }
      }
    });

    return pricingTexts.join('\n---\n');
  });
}

async function extractSpecificPricing(page: Page): Promise<{
  nightlyRate?: string;
  weeklyRate?: string;
  fourWeekRent?: string;
  monthlyRate?: string;
  estimatedTotal?: string;
  serviceFee?: string;
  totalWithFees?: string;
  compensation?: string;
}> {
  return await page.evaluate(() => {
    const pricing: any = {};

    // Helper to find text containing pattern and extract price
    const findPriceWith = (patterns: string[]): string | undefined => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && regex.test(text) && text.length < 200) {
            const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
            if (match) return match[0];
          }
        }
      }
      return undefined;
    };

    pricing.nightlyRate = findPriceWith(['per night', 'nightly', '/night', 'night rate']);
    pricing.weeklyRate = findPriceWith(['per week', 'weekly', '/week', 'week rate']);
    pricing.fourWeekRent = findPriceWith(['4-week', 'four week', '4 week', 'four-week']);
    pricing.monthlyRate = findPriceWith(['per month', 'monthly', '/month', 'month rate']);
    pricing.estimatedTotal = findPriceWith(['estimated total', 'total cost', 'grand total', 'total:']);
    pricing.serviceFee = findPriceWith(['service fee', 'booking fee', 'platform fee']);
    pricing.totalWithFees = findPriceWith(['total with fees', 'final total']);
    pricing.compensation = findPriceWith(['compensation', 'host receives', 'you receive', 'earnings', 'host gets']);

    return pricing;
  });
}

async function captureListingPricing(page: Page, listingId: string, listingType: string): Promise<PricingData> {
  const pricingData: PricingData = {
    listingId,
    listingType,
    timestamp: new Date().toISOString(),
    url: `${BASE_URL}/view-split-lease/${listingId}`,
    screenshots: [],
    pricing: {
      rawPricingText: ''
    }
  };

  console.log(`\n=== Capturing pricing for ${listingType} listing: ${listingId} ===`);

  try {
    // Navigate to listing
    await page.goto(pricingData.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    const initialScreenshot = await takeFullPageScreenshot(page, `listing_${listingType}_initial`);
    pricingData.screenshots.push(initialScreenshot);

    // Scroll down to capture all pricing elements
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    const scrolledScreenshot = await takeScreenshot(page, `listing_${listingType}_pricing_area`);
    pricingData.screenshots.push(scrolledScreenshot);

    // Extract all pricing text
    pricingData.pricing.rawPricingText = await extractPricingFromPage(page);

    // Extract specific pricing values
    const specificPricing = await extractSpecificPricing(page);
    pricingData.pricing = { ...pricingData.pricing, ...specificPricing };

    console.log(`Raw pricing text found:\n${pricingData.pricing.rawPricingText}`);

    // Look for "Start Proposal" or similar buttons
    const proposalButtonSelectors = [
      'button:has-text("Start Proposal")',
      'button:has-text("Book Now")',
      'button:has-text("Reserve")',
      'button:has-text("Submit Proposal")',
      'button:has-text("Make Offer")',
      'button:has-text("Request to Book")',
      '[data-testid="submit-proposal"]',
      '.booking-widget button',
      '.cta-button'
    ];

    for (const selector of proposalButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`Found proposal button: ${selector}`);

          // Take screenshot before clicking
          const beforeClickScreenshot = await takeScreenshot(page, `listing_${listingType}_before_proposal_click`);
          pricingData.screenshots.push(beforeClickScreenshot);

          // Click the button
          await button.click();
          await page.waitForTimeout(2000);

          // Take screenshot of proposal flow
          const proposalFlowScreenshot = await takeFullPageScreenshot(page, `listing_${listingType}_proposal_flow`);
          pricingData.screenshots.push(proposalFlowScreenshot);

          // Extract pricing from proposal flow
          const proposalPricing = await extractPricingFromPage(page);
          pricingData.proposalFlowPricing = {
            screenshots: [proposalFlowScreenshot],
            pricingText: proposalPricing
          };

          console.log(`Proposal flow pricing:\n${proposalPricing}`);

          // Close modal if visible
          const closeButtonSelectors = [
            'button[aria-label*="close"]',
            '.modal-close',
            '.close-button',
            'button:has-text("Close")',
            'button:has-text("Cancel")',
            '[data-testid="close-modal"]',
            '.modal-backdrop'
          ];

          for (const closeSelector of closeButtonSelectors) {
            try {
              const closeButton = page.locator(closeSelector).first();
              if (await closeButton.isVisible({ timeout: 1000 })) {
                await closeButton.click();
                await page.waitForTimeout(500);
                break;
              }
            } catch {
              // Try next close selector
            }
          }

          // Also try pressing Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

          break;
        }
      } catch {
        // Try next button selector
      }
    }

    // Final screenshot
    const finalScreenshot = await takeFullPageScreenshot(page, `listing_${listingType}_final`);
    pricingData.screenshots.push(finalScreenshot);

  } catch (error) {
    console.error(`Error capturing ${listingType} listing:`, error);
    pricingData.error = error instanceof Error ? error.message : String(error);

    // Take error screenshot
    const errorScreenshot = await takeScreenshot(page, `listing_${listingType}_error`);
    pricingData.screenshots.push(errorScreenshot);
  }

  return pricingData;
}

async function runTest(): Promise<TestReport> {
  console.log('Starting Guest Pricing E2E Test');
  console.log('================================\n');

  await ensureScreenshotDir();

  const report: TestReport = {
    testType: 'guest-pricing',
    executedAt: new Date().toISOString(),
    guestEmail: GUEST_EMAIL,
    baseUrl: BASE_URL,
    loginSuccess: false,
    listings: [],
    summary: {
      totalListings: LISTINGS.length,
      successfulCaptures: 0,
      failedCaptures: 0,
      observations: []
    }
  };

  const browser: Browser = await chromium.launch({
    headless: false, // Run with UI for debugging
    slowMo: 100 // Slow down for visibility
  });

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page: Page = await context.newPage();

  try {
    // Navigate to home page first
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await takeScreenshot(page, '00_initial_home');

    // Logout if logged in
    await logout(page);
    await takeScreenshot(page, '00_after_logout');

    // Login as guest
    report.loginSuccess = await login(page);

    if (report.loginSuccess) {
      // Capture pricing for each listing
      for (const listing of LISTINGS) {
        const pricingData = await captureListingPricing(page, listing.id, listing.type);
        report.listings.push(pricingData);

        if (!pricingData.error) {
          report.summary.successfulCaptures++;
        } else {
          report.summary.failedCaptures++;
        }
      }
    } else {
      report.summary.observations.push('Login failed - could not capture guest pricing');
    }

    // Analyze results
    for (const listing of report.listings) {
      const pricingText = listing.pricing.rawPricingText.toLowerCase();

      if (pricingText.includes('service fee') || pricingText.includes('booking fee')) {
        report.summary.observations.push(`${listing.listingType}: Service fee visible to guest`);
      }

      if (pricingText.includes('compensation') || pricingText.includes('host receives')) {
        report.summary.observations.push(`${listing.listingType}: WARNING - Compensation shown to guest (should only be for host)`);
      }

      if (listing.pricing.estimatedTotal) {
        report.summary.observations.push(`${listing.listingType}: Estimated total shown: ${listing.pricing.estimatedTotal}`);
      }

      if (listing.pricing.serviceFee) {
        report.summary.observations.push(`${listing.listingType}: Service fee: ${listing.pricing.serviceFee}`);
      }
    }

  } catch (error) {
    console.error('Test error:', error);
    report.summary.observations.push(`Test error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser.close();
  }

  // Save report
  const reportPath = path.join(process.cwd(), 'e2e-guest-pricing-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Login Success: ${report.loginSuccess}`);
  console.log(`Listings Processed: ${report.summary.totalListings}`);
  console.log(`Successful Captures: ${report.summary.successfulCaptures}`);
  console.log(`Failed Captures: ${report.summary.failedCaptures}`);
  console.log('\nObservations:');
  report.summary.observations.forEach(obs => console.log(`  - ${obs}`));

  return report;
}

// Run the test
runTest().then(report => {
  console.log('\nTest completed.');
  process.exit(report.summary.failedCaptures > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
