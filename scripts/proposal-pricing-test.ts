/**
 * Standalone E2E Test: Proposal Creation Flow with Pricing Validation
 *
 * Run with: npx tsx scripts/proposal-pricing-test.ts
 */

import { chromium, Page, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const GUEST_EMAIL = 'splitleasefrederick+frederickros@gmail.com';
const GUEST_PASSWORD = 'eCom2023$';

// Listings to test
const LISTINGS = [
  { id: '1770159292555x84785333838911712', type: 'weekly', name: 'Weekly Listing' },
  { id: '1770159059956x68069167691952992', type: 'nightly', name: 'Nightly Listing' },
  { id: '1770159488384x35093957137090224', type: 'monthly', name: 'Monthly Listing' }
];

interface PricingResult {
  listingId: string;
  listingType: string;
  viewPageData: {
    allPricesFound: string[];
    pricingText: string;
    pageTitle?: string;
  };
  proposalFormData: {
    allPricesFound: string[];
    pricingBreakdownText: string;
    guest4WeekRent?: string;
    guestTotal?: string;
    fees?: string[];
  };
  submissionResult: {
    success: boolean;
    message: string;
    proposalId?: string;
  };
  screenshots: string[];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureResultsDir() {
  const resultsDir = path.join(process.cwd(), 'e2e', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

async function login(page: Page): Promise<boolean> {
  console.log('\n=== STEP 1: LOGIN ===');

  // Go to homepage first
  console.log(`Navigating to ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await delay(3000);

  // Take screenshot of homepage
  await page.screenshot({ path: 'e2e/test-results/01-homepage.png', fullPage: true });

  // Look for Login button in header
  console.log('Looking for login button...');

  try {
    // Try to find and click login button
    const loginButtonSelectors = [
      'button:has-text("Log In")',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("Log In")',
      'a:has-text("Login")',
      '[data-testid="login-button"]',
      '.login-btn',
      'header button:has-text("Log")'
    ];

    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          loginButton = btn;
          console.log(`Found login button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!loginButton) {
      console.log('No login button found, checking if already logged in...');
      // Check if already logged in by looking for avatar or dashboard link
      const isLoggedIn = await page.locator('[data-testid="user-avatar"], .user-avatar, .logged-in-avatar').isVisible({ timeout: 2000 }).catch(() => false);
      if (isLoggedIn) {
        console.log('Already logged in!');
        return true;
      }

      // Try clicking on any element that might open login modal
      const headerElements = await page.locator('header button, header a').all();
      console.log(`Found ${headerElements.length} header buttons/links`);
      for (const el of headerElements) {
        const text = await el.textContent().catch(() => '');
        console.log(`Header element text: "${text}"`);
      }

      return false;
    }

    await loginButton.click();
    console.log('Clicked login button');
    await delay(2000);

    // Screenshot after clicking login
    await page.screenshot({ path: 'e2e/test-results/02-login-modal.png', fullPage: true });

    // Wait for login modal/form to appear
    console.log('Waiting for login form...');

    // Look for "Login" view in the modal - might need to click "Login" tab first
    const loginTabSelectors = [
      'button:has-text("Login")',
      'button:has-text("Log In")',
      'a:has-text("Login")',
      '[role="tab"]:has-text("Login")'
    ];

    for (const selector of loginTabSelectors) {
      try {
        const tab = page.locator(selector).first();
        if (await tab.isVisible({ timeout: 1000 })) {
          await tab.click();
          console.log(`Clicked login tab: ${selector}`);
          await delay(500);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    // Fill email
    console.log(`Filling email: ${GUEST_EMAIL}`);
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email"]',
      '#email'
    ];

    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const emailInput = page.locator(selector).first();
        if (await emailInput.isVisible({ timeout: 1000 })) {
          await emailInput.fill(GUEST_EMAIL);
          console.log(`Filled email with selector: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!emailFilled) {
      console.log('Could not fill email');
      return false;
    }

    // Fill password
    console.log('Filling password');
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password'
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const passwordInput = page.locator(selector).first();
        if (await passwordInput.isVisible({ timeout: 1000 })) {
          await passwordInput.fill(GUEST_PASSWORD);
          console.log(`Filled password with selector: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!passwordFilled) {
      console.log('Could not fill password');
      return false;
    }

    await page.screenshot({ path: 'e2e/test-results/03-login-filled.png', fullPage: true });

    // Click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Log In")',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'form button'
    ];

    for (const selector of submitSelectors) {
      try {
        const submitBtn = page.locator(selector).first();
        if (await submitBtn.isVisible({ timeout: 1000 })) {
          await submitBtn.click();
          console.log(`Clicked submit: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    await delay(5000);

    await page.screenshot({ path: 'e2e/test-results/04-after-login.png', fullPage: true });

    // Check if login was successful by looking for user avatar or checking URL
    const isLoggedIn = await page.locator('[data-testid="user-avatar"], .user-avatar, .logged-in-avatar, [class*="avatar"]').first().isVisible({ timeout: 3000 }).catch(() => false);

    if (isLoggedIn) {
      console.log('Login SUCCESS - avatar visible');
      return true;
    }

    // Check for error messages
    const errorText = await page.textContent('body') || '';
    if (errorText.toLowerCase().includes('invalid') || errorText.toLowerCase().includes('error')) {
      console.log('Login FAILED - error detected');
      return false;
    }

    // Check if modal closed (might indicate success)
    const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').first().isVisible({ timeout: 1000 }).catch(() => false);
    if (!modalVisible) {
      console.log('Login might have succeeded - modal closed');
      return true;
    }

    console.log('Login status unclear');
    return false;

  } catch (error) {
    console.log(`Login error: ${error}`);
    await page.screenshot({ path: 'e2e/test-results/login-error.png', fullPage: true });
    return false;
  }
}

async function testListing(page: Page, listing: typeof LISTINGS[0]): Promise<PricingResult> {
  const result: PricingResult = {
    listingId: listing.id,
    listingType: listing.type,
    viewPageData: { allPricesFound: [], pricingText: '' },
    proposalFormData: { allPricesFound: [], pricingBreakdownText: '' },
    submissionResult: { success: false, message: '' },
    screenshots: []
  };

  console.log(`\n=== TESTING ${listing.type.toUpperCase()} LISTING ===`);
  console.log(`ID: ${listing.id}`);

  // Navigate to listing
  const listingUrl = `${BASE_URL}/view-split-lease/${listing.id}`;
  console.log(`Navigating to: ${listingUrl}`);

  try {
    await page.goto(listingUrl, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log(`Navigation timeout, continuing anyway: ${e}`);
  }
  await delay(4000);

  // Screenshot listing view
  const viewScreenshot = `e2e/test-results/listing-view-${listing.type}.png`;
  await page.screenshot({ path: viewScreenshot, fullPage: true });
  result.screenshots.push(viewScreenshot);
  console.log(`Screenshot saved: ${viewScreenshot}`);

  // Get page title
  result.viewPageData.pageTitle = await page.title();
  console.log(`Page title: ${result.viewPageData.pageTitle}`);

  // Extract all pricing information from the page
  const bodyText = await page.textContent('body') || '';

  // Find all dollar amounts
  const priceMatches = bodyText.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  result.viewPageData.allPricesFound = [...new Set(priceMatches)];
  console.log(`Prices found on listing page: ${result.viewPageData.allPricesFound.join(', ')}`);

  // Look for pricing context
  const pricingPatterns = [
    /(\$[\d,]+(?:\.\d{2})?)\s*(?:\/|per)\s*(night|week|month)/gi,
    /(price|rate|cost|rent)[\s:]*(\$[\d,]+(?:\.\d{2})?)/gi,
    /(\$[\d,]+(?:\.\d{2})?)[^$]*(?:night|week|month)/gi
  ];

  for (const pattern of pricingPatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      result.viewPageData.pricingText += matches.join(' | ') + ' | ';
    }
  }
  console.log(`Pricing context: ${result.viewPageData.pricingText || 'None found'}`);

  // Find and click the proposal button
  console.log('Looking for proposal/booking button...');

  const buttonSelectors = [
    'button:has-text("Start Proposal")',
    'button:has-text("Book")',
    'button:has-text("Propose")',
    'button:has-text("Request")',
    'button:has-text("Contact")',
    'a:has-text("Start Proposal")',
    '[data-testid="start-proposal"]',
    '[data-testid="proposal-button"]',
    '[data-testid="book-button"]'
  ];

  let buttonFound = false;
  for (const selector of buttonSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        console.log(`Found button with selector: ${selector}`);
        const buttonText = await button.textContent();
        console.log(`Button text: "${buttonText}"`);
        await button.click();
        buttonFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!buttonFound) {
    console.log('No proposal button found, trying to scroll and find it...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await delay(1000);

    // Log all visible buttons for debugging
    const allButtons = await page.locator('button').all();
    console.log(`Total visible buttons: ${allButtons.length}`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const btnText = await allButtons[i].textContent().catch(() => '');
      console.log(`  Button ${i}: "${btnText?.substring(0, 50)}"`);
    }

    // Try again after scroll
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          buttonFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
  }

  await delay(3000);

  // Screenshot proposal form
  const formScreenshot = `e2e/test-results/proposal-form-${listing.type}.png`;
  await page.screenshot({ path: formScreenshot, fullPage: true });
  result.screenshots.push(formScreenshot);
  console.log(`Screenshot saved: ${formScreenshot}`);

  // Extract pricing from proposal form
  const formText = await page.textContent('body') || '';
  const formPrices = formText.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
  result.proposalFormData.allPricesFound = [...new Set(formPrices)];
  console.log(`Prices on proposal form: ${result.proposalFormData.allPricesFound.join(', ')}`);

  // Look for specific pricing elements in the proposal form
  const pricingSelectors = [
    '[data-testid*="price"]',
    '[class*="price"]',
    '[class*="cost"]',
    '[class*="total"]',
    '[class*="rent"]',
    '[class*="fee"]',
    '.pricing',
    '.breakdown'
  ];

  for (const selector of pricingSelectors) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await elements.nth(i).textContent();
          if (text && text.includes('$')) {
            result.proposalFormData.pricingBreakdownText += text.trim() + ' | ';
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // Look for 4-week rent
  const fourWeekMatch = formText.match(/4[\s-]*week[^$]*(\$[\d,]+(?:\.\d{2})?)/i);
  if (fourWeekMatch) {
    result.proposalFormData.guest4WeekRent = fourWeekMatch[1];
    console.log(`Found 4-week rent: ${fourWeekMatch[1]}`);
  }

  // Look for total
  const totalMatch = formText.match(/total[^$]*(\$[\d,]+(?:\.\d{2})?)/i);
  if (totalMatch) {
    result.proposalFormData.guestTotal = totalMatch[1];
    console.log(`Found total: ${totalMatch[1]}`);
  }

  // Try to fill proposal form
  console.log('Attempting to fill proposal form...');

  try {
    // Look for text areas (about me, need for space)
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textareas`);

    for (let i = 0; i < textareas.length; i++) {
      try {
        const isVisible = await textareas[i].isVisible({ timeout: 500 });
        if (isVisible) {
          await textareas[i].fill(`Test proposal content ${i + 1}. Automated E2E test for ${listing.type} listing.`);
          console.log(`Filled textarea ${i + 1}`);
        }
      } catch (e) {
        console.log(`Could not fill textarea ${i + 1}`);
      }
    }

    // Look for date inputs
    const dateInputs = await page.locator('input[type="date"]').all();
    console.log(`Found ${dateInputs.length} date inputs`);

    const today = new Date();
    for (let i = 0; i < dateInputs.length; i++) {
      const futureDate = new Date(today.getTime() + (7 + i * 7) * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];
      try {
        const isVisible = await dateInputs[i].isVisible({ timeout: 500 });
        if (isVisible) {
          await dateInputs[i].fill(dateStr);
          console.log(`Filled date input ${i + 1} with ${dateStr}`);
        }
      } catch (e) {
        console.log(`Could not fill date input ${i + 1}`);
      }
    }

    await delay(2000);

    // Screenshot after filling
    const filledScreenshot = `e2e/test-results/proposal-filled-${listing.type}.png`;
    await page.screenshot({ path: filledScreenshot, fullPage: true });
    result.screenshots.push(filledScreenshot);

    // Look for continue/next/submit buttons
    const actionSelectors = [
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'button:has-text("Submit")',
      'button:has-text("Send")',
      'button:has-text("Create")',
      'button[type="submit"]'
    ];

    for (const selector of actionSelectors) {
      try {
        const submitBtn = page.locator(selector).first();
        if (await submitBtn.isVisible({ timeout: 1000 })) {
          const btnText = await submitBtn.textContent();
          console.log(`Found action button: "${btnText}" (${selector})`);
          await submitBtn.click();
          await delay(2000);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    await delay(3000);

    // Screenshot after submission attempt
    const confirmScreenshot = `e2e/test-results/proposal-after-action-${listing.type}.png`;
    await page.screenshot({ path: confirmScreenshot, fullPage: true });
    result.screenshots.push(confirmScreenshot);

    // Check for success
    const afterActionText = await page.textContent('body') || '';
    const successKeywords = ['success', 'submitted', 'thank', 'confirmation', 'created', 'sent', 'received'];
    const errorKeywords = ['error', 'failed', 'invalid', 'required', 'missing'];

    const hasSuccess = successKeywords.some(kw => afterActionText.toLowerCase().includes(kw));
    const hasError = errorKeywords.some(kw => afterActionText.toLowerCase().includes(kw));

    if (hasSuccess && !hasError) {
      result.submissionResult.success = true;
      result.submissionResult.message = 'Proposal action completed successfully';

      // Try to extract proposal ID
      const idMatch = afterActionText.match(/(?:proposal|id|ref|#)[\s:]*([a-zA-Z0-9-_]{10,})/i);
      if (idMatch) {
        result.submissionResult.proposalId = idMatch[1];
      }
    } else if (hasError) {
      result.submissionResult.message = 'Form validation errors detected';
    } else {
      result.submissionResult.message = 'Action status unclear - check screenshots';
    }

    console.log(`Action result: ${result.submissionResult.message}`);

  } catch (error) {
    result.submissionResult.message = `Error: ${error}`;
    console.log(`Form interaction error: ${error}`);
  }

  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('PROPOSAL CREATION E2E TEST - PRICING VALIDATION');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Guest: ${GUEST_EMAIL}`);
  console.log(`Listings to test: ${LISTINGS.length}`);
  console.log('='.repeat(60));

  // Create results directory
  await ensureResultsDir();

  // Launch browser
  console.log('\nLaunching browser...');
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const results: PricingResult[] = [];

  try {
    // Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      console.log('\nLOGIN FAILED - Attempting to continue anyway (some tests may fail)');
    }

    // Test each listing
    for (const listing of LISTINGS) {
      const result = await testListing(page, listing);
      results.push(result);

      // Brief pause between listings
      await delay(2000);
    }

    // Print final report
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST REPORT');
    console.log('='.repeat(60));

    for (const result of results) {
      console.log(`\n--- ${result.listingType.toUpperCase()} LISTING ---`);
      console.log(`ID: ${result.listingId}`);
      console.log(`Page Title: ${result.viewPageData.pageTitle || 'N/A'}`);
      console.log(`\nView Page Prices: ${result.viewPageData.allPricesFound.join(', ') || 'None found'}`);
      console.log(`Pricing Context: ${result.viewPageData.pricingText || 'None'}`);
      console.log(`\nProposal Form Prices: ${result.proposalFormData.allPricesFound.join(', ') || 'None found'}`);
      console.log(`Pricing Breakdown: ${result.proposalFormData.pricingBreakdownText || 'None'}`);
      console.log(`4-Week Rent: ${result.proposalFormData.guest4WeekRent || 'Not found'}`);
      console.log(`Total: ${result.proposalFormData.guestTotal || 'Not found'}`);
      console.log(`\nAction Result: ${result.submissionResult.success ? 'SUCCESS' : 'INCOMPLETE'}`);
      console.log(`Message: ${result.submissionResult.message}`);
      if (result.submissionResult.proposalId) {
        console.log(`Proposal ID: ${result.submissionResult.proposalId}`);
      }
      console.log(`Screenshots: ${result.screenshots.length} captured`);
    }

    // Write JSON report
    const reportPath = 'e2e/test-results/pricing-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);

  } catch (error) {
    console.error(`Fatal error: ${error}`);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

main().catch(console.error);
