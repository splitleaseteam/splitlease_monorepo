// E2E Test Script for Login and Proposal Creation
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'e2e-screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function saveScreenshot(page, name) {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

async function runTest() {
  const results = {
    loginSuccess: false,
    proposalSuccess: false,
    pricingValues: {},
    screenshots: [],
    errors: []
  };

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to homepage
    console.log('Step 1: Navigating to homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.screenshots.push(await saveScreenshot(page, '01-homepage'));

    // Step 2: Find and click Sign In button
    console.log('Step 2: Looking for Sign In button...');
    const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();

    if (await signInButton.isVisible()) {
      console.log('Found Sign In button, clicking...');
      await signInButton.click();
      await page.waitForTimeout(1500);
    }

    results.screenshots.push(await saveScreenshot(page, '02-magic-link-modal'));

    // Step 3: Click "Back to login" to get password-based login
    console.log('Step 3: Clicking Back to login for password auth...');
    const backToLogin = await page.locator('text=Back to login').first();
    if (await backToLogin.isVisible()) {
      await backToLogin.click();
      await page.waitForTimeout(1000);
    }

    results.screenshots.push(await saveScreenshot(page, '03-password-login-modal'));

    // Step 4: Fill credentials
    console.log('Step 4: Filling login credentials...');
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('splitleasefrederick+frederickros@gmail.com');
      console.log('Filled email');
      await page.waitForTimeout(300);
    }

    if (await passwordInput.isVisible()) {
      await passwordInput.fill('eCom2023$');
      console.log('Filled password');
      await page.waitForTimeout(300);
    }

    results.screenshots.push(await saveScreenshot(page, '04-credentials-filled'));

    // Step 5: Submit login
    console.log('Step 5: Submitting login...');
    const loginButton = await page.locator('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first();

    if (await loginButton.isVisible()) {
      await loginButton.click();
      console.log('Clicked login button');
    } else {
      await passwordInput.press('Enter');
      console.log('Pressed Enter to submit');
    }

    await page.waitForTimeout(4000);
    results.screenshots.push(await saveScreenshot(page, '05-after-login'));

    // Check if logged in by looking for Sign In button disappearing or user menu appearing
    const signInStillVisible = await page.locator('header >> text=Sign In').isVisible().catch(() => false);
    const accountMenuVisible = await page.locator('text=Account, text=Dashboard, [aria-label*="user"], [aria-label*="account"]').first().isVisible().catch(() => false);

    if (!signInStillVisible || accountMenuVisible) {
      console.log('Login appears successful (Sign In button hidden or account menu visible)');
      results.loginSuccess = true;
    } else {
      console.log('Login verification uncertain');
      // Check for error messages
      const errorText = await page.locator('.error, [role="alert"], text=/error|invalid/i').textContent().catch(() => null);
      if (errorText) {
        results.errors.push(`Login error: ${errorText}`);
      }
    }

    // Step 6: Navigate to listing page
    console.log('Step 6: Navigating to listing page...');
    await page.goto('http://localhost:3000/view-split-lease/1770159292555x84785333838911712', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    results.screenshots.push(await saveScreenshot(page, '06-listing-page'));

    // Capture listing price
    const listingPrice = await page.locator('text=/\\$\\d+.*night/').first().textContent().catch(() => null);
    if (listingPrice) {
      results.pricingValues.listingPrice = listingPrice;
      console.log(`Listing price: ${listingPrice}`);
    }

    // Step 7: Look for Create Proposal button and click
    console.log('Step 7: Looking for Create Proposal button...');

    // Scroll down to find the button if needed
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    const proposalButton = await page.locator('button:has-text("Create Proposal"), button:has-text("Start Proposal"), text=Create Proposal').first();

    if (await proposalButton.isVisible().catch(() => false)) {
      console.log('Found proposal button, clicking...');
      await proposalButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Try scrolling back up and looking again
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const proposalBtn2 = await page.locator('button:has-text("Create"), a:has-text("Create")').first();
      if (await proposalBtn2.isVisible().catch(() => false)) {
        await proposalBtn2.click();
        await page.waitForTimeout(2000);
      }
    }

    results.screenshots.push(await saveScreenshot(page, '07-proposal-modal'));

    // Step 8: Fill proposal form with correct field mappings
    console.log('Step 8: Filling proposal form...');

    // "Why do you want this space?" - first textarea
    const whySpaceField = await page.locator('textarea').first();
    if (await whySpaceField.isVisible()) {
      await whySpaceField.fill("Testing the proposal creation flow - need space for remote work");
      console.log('Filled "Why do you want this space?" field');
    }

    // "Tell us about yourself" - second textarea
    const aboutField = await page.locator('textarea').nth(1);
    if (await aboutField.isVisible().catch(() => false)) {
      await aboutField.fill("I'm a test user verifying pricing calculations. Professional remote worker looking for flexible accommodation.");
      console.log('Filled "Tell us about yourself" field');
    }

    await page.waitForTimeout(1000);
    results.screenshots.push(await saveScreenshot(page, '08-proposal-form-filled'));

    // Step 9: Capture any pricing information visible in the modal
    console.log('Step 9: Capturing pricing information from modal...');

    // Get all text containing dollar amounts
    const modalText = await page.locator('.modal, [role="dialog"], [class*="modal"]').textContent().catch(() => '');
    const priceMatches = modalText.match(/\$[\d,]+(\.\d{2})?/g);
    if (priceMatches) {
      results.pricingValues.modalPrices = priceMatches;
      console.log(`Found prices in modal: ${priceMatches.join(', ')}`);
    }

    // Step 10: Click Review Proposal button
    console.log('Step 10: Clicking Review Proposal...');
    const reviewButton = await page.locator('button:has-text("Review Proposal"), button:has-text("Review")').first();

    if (await reviewButton.isVisible().catch(() => false)) {
      await reviewButton.click();
      console.log('Clicked Review Proposal');
      await page.waitForTimeout(3000);
      results.screenshots.push(await saveScreenshot(page, '09-after-review-click'));

      // Look for pricing summary on review screen
      const pageContent = await page.content();

      // Try to find pricing elements
      const guestPrice = await page.locator('text=/Guest.*Price|Total.*Guest/i').textContent().catch(() => null);
      const hostComp = await page.locator('text=/Host.*Compensation|Host.*receives/i').textContent().catch(() => null);
      const weeklyRent = await page.locator('text=/4.*week|weekly.*rent|rent.*week/i').textContent().catch(() => null);

      if (guestPrice) results.pricingValues.guestPrice = guestPrice;
      if (hostComp) results.pricingValues.hostCompensation = hostComp;
      if (weeklyRent) results.pricingValues.weeklyRent = weeklyRent;

      // Look for all dollar amounts on the review page
      const reviewPrices = await page.locator('text=/\\$[\\d,]+/').allTextContents().catch(() => []);
      if (reviewPrices.length > 0) {
        results.pricingValues.reviewPagePrices = reviewPrices;
        console.log(`Review page prices: ${reviewPrices.join(', ')}`);
      }

      // Step 11: Look for final Submit button
      console.log('Step 11: Looking for final Submit button...');
      const submitButton = await page.locator('button:has-text("Submit"), button:has-text("Send"), button:has-text("Confirm")').first();

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        console.log('Clicked Submit button');
        await page.waitForTimeout(3000);
        results.screenshots.push(await saveScreenshot(page, '10-after-submit'));

        // Check for success message
        const successVisible = await page.locator('text=/success|submitted|sent|thank you/i').isVisible().catch(() => false);
        if (successVisible) {
          console.log('Proposal submitted successfully!');
          results.proposalSuccess = true;
        }
      } else {
        console.log('No submit button found on review page');
        results.errors.push('No submit button found after Review Proposal');
      }
    } else {
      console.log('Could not find Review Proposal button');
      results.errors.push('Could not find Review Proposal button');
    }

  } catch (error) {
    console.error('Test error:', error.message);
    results.errors.push(error.message);
    await saveScreenshot(page, 'error-state');
  } finally {
    // Final screenshot
    results.screenshots.push(await saveScreenshot(page, '99-final-state'));

    console.log('\n========== TEST RESULTS ==========');
    console.log(JSON.stringify(results, null, 2));
    console.log('==================================\n');

    await browser.close();
  }

  return results;
}

runTest().then(results => {
  console.log('Test completed.');
  process.exit(results.loginSuccess && results.proposalSuccess ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
