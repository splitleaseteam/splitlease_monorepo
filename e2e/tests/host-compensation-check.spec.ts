/**
 * Host Compensation Check E2E Test
 *
 * Tests the host's view of proposal compensation values.
 * This script logs in as a host and captures compensation details for proposals from frederick ros.
 */

import { test, expect } from '@playwright/test';

// Host credentials for testing
const HOST_CREDENTIALS = {
  email: 'splitleaserod+rodjohn@gmail.com',
  password: 'eCom2023$'
};

test.describe('Host Compensation Verification', () => {
  test.setTimeout(120000); // 2 minute timeout for this test

  test('capture compensation values for proposals from frederick ros', async ({ page }) => {
    console.log('='.repeat(80));
    console.log('HOST COMPENSATION E2E TEST');
    console.log('='.repeat(80));

    // Step 1: Navigate to the homepage
    console.log('\n[STEP 1] Navigating to homepage...');
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'e2e/screenshots/01-homepage.png',
      fullPage: true
    });
    console.log('Screenshot saved: 01-homepage.png');

    // Step 2: Check if logged in as guest, logout if so
    console.log('\n[STEP 2] Checking current login state...');

    // Look for user menu or avatar that indicates logged in state
    const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar, .header-avatar');
    const isLoggedIn = await userMenu.isVisible().catch(() => false);

    if (isLoggedIn) {
      console.log('Currently logged in, logging out first...');
      await userMenu.click();
      await page.waitForTimeout(500);

      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out"), a:has-text("Log out"), [data-testid="logout-button"]');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForLoadState('networkidle');
        console.log('Logged out successfully');
      }
    } else {
      console.log('Not currently logged in');
    }

    // Step 3: Login as host
    console.log('\n[STEP 3] Logging in as host...');

    // Setup network monitoring for auth requests
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('login')) {
        console.log(`>> AUTH Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`<< AUTH Response: ${response.status()} ${response.url()}`);
      }
    });

    // Find and click Sign In button (in the header)
    const signInButton = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), [href*="login"], [href*="signin"]');
    await signInButton.first().click();

    // Wait for login modal to appear (look for "Welcome back!" text)
    await page.waitForSelector('text=Welcome back!', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Fill credentials - target input by placeholder text which is visible in the screenshot
    const emailInput = page.locator('input[placeholder="john@example.com"]');
    const passwordInput = page.locator('input[placeholder="Enter your password"]');

    console.log('Filling email...');
    await emailInput.fill(HOST_CREDENTIALS.email);
    console.log('Filling password...');
    await passwordInput.fill(HOST_CREDENTIALS.password);

    // Verify values were filled
    const filledEmail = await emailInput.inputValue();
    const filledPassword = await passwordInput.inputValue();
    console.log(`Email filled: ${filledEmail}`);
    console.log(`Password filled: ${filledPassword ? '***' : 'EMPTY'}`);

    // Take screenshot of login form (viewport only, not full page)
    await page.screenshot({
      path: 'test-results/02-login-form.png',
      fullPage: false
    });
    console.log('Screenshot saved: test-results/02-login-form.png');

    // Wait a moment before clicking submit
    await page.waitForTimeout(500);

    // Submit login - find the submit button within the modal context
    // Looking at the UI, there should be a purple "Log in" button
    console.log('Looking for Log in button...');

    // Try multiple selectors for the login button
    let submitButton = page.locator('button:has-text("Log in"):not(:has-text("without"))');
    let buttonCount = await submitButton.count();
    console.log(`Found ${buttonCount} "Log in" buttons (excluding "without password")`);

    if (buttonCount === 0) {
      // Try another selector
      submitButton = page.locator('form button[type="submit"]');
      buttonCount = await submitButton.count();
      console.log(`Found ${buttonCount} form submit buttons`);
    }

    if (buttonCount === 0) {
      // Try by visual appearance
      submitButton = page.locator('button').filter({ hasText: /^Log in$/i });
      buttonCount = await submitButton.count();
      console.log(`Found ${buttonCount} buttons with exact "Log in" text`);
    }

    // Print all buttons visible on page for debugging
    const allButtons = page.locator('button');
    const allButtonCount = await allButtons.count();
    console.log(`Total buttons on page: ${allButtonCount}`);
    for (let i = 0; i < Math.min(allButtonCount, 10); i++) {
      const btnText = await allButtons.nth(i).innerText().catch(() => 'N/A');
      console.log(`  Button ${i}: "${btnText}"`);
    }

    // Listen for any error messages that might appear
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error: ${msg.text()}`);
      }
    });

    // Use Promise.all to wait for navigation AND click
    console.log('Clicking Log in button and waiting for navigation...');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('supabase') || resp.url().includes('auth'), { timeout: 10000 }).catch(e => console.log('No auth response detected')),
      submitButton.first().click()
    ]);

    // Wait for login to complete - modal should close
    console.log('Waiting for login modal to close...');
    await page.waitForSelector('text=Welcome back!', { state: 'hidden', timeout: 15000 }).catch(() => {
      console.log('Modal may still be visible or already closed');
    });

    // Wait longer for auth state to propagate
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    // Check if login succeeded by looking for user-related UI changes
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // Check header for logged-in state (Sign In button should be replaced)
    const signInButtonAfterLogin = page.locator('a:has-text("Sign In"), button:has-text("Sign In")');
    const stillShowingSignIn = await signInButtonAfterLogin.first().isVisible().catch(() => false);
    console.log(`Still showing Sign In button: ${stillShowingSignIn}`);

    if (stillShowingSignIn) {
      console.log('WARNING: Login may have failed - Sign In button still visible');
      // Take debug screenshot
      await page.screenshot({
        path: 'e2e/screenshots/02b-login-may-have-failed.png',
        fullPage: true
      });
    } else {
      console.log(`Login appears successful for: ${HOST_CREDENTIALS.email}`);
    }

    // Take screenshot after login
    await page.screenshot({
      path: 'e2e/screenshots/03-after-login.png',
      fullPage: true
    });
    console.log('Screenshot saved: 03-after-login.png');

    // Step 4: Navigate to host proposals
    console.log('\n[STEP 4] Navigating to host proposals page...');
    await page.goto('http://localhost:3000/host-proposals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of proposals list
    await page.screenshot({
      path: 'e2e/screenshots/04-host-proposals-list.png',
      fullPage: true
    });
    console.log('Screenshot saved: 04-host-proposals-list.png');

    // Step 5: Explore all listing tabs and find ALL proposals
    console.log('\n[STEP 5] Exploring all listing tabs...');

    // First, let's capture the full page text to understand the structure
    const pageText = await page.locator('body').innerText();
    console.log('\n--- HOST PROPOSALS PAGE TEXT ---');
    console.log(pageText);
    console.log('--- END PAGE TEXT ---\n');

    // Find all listing tabs (they appear as buttons/tabs with listing names)
    const listingTabs = page.locator('button:has-text("NIGHTLY"), button:has-text("WEEKLY"), button:has-text("MONTHLY"), [class*="ListingTab"], [class*="listing-tab"]');
    const tabCount = await listingTabs.count();
    console.log(`Found ${tabCount} listing tabs`);

    const compensationData: Array<{
      listingName: string;
      guestName: string;
      totalAmount: string;
      schedule: string;
      duration: string;
      status: string;
      allMoneyValues: string[];
      rawDetailText: string;
    }> = [];

    // Click each tab and capture proposals
    for (let tabIndex = 0; tabIndex < tabCount; tabIndex++) {
      const tab = listingTabs.nth(tabIndex);
      const tabText = await tab.innerText().catch(() => '');
      console.log(`\n=== Clicking tab ${tabIndex + 1}: "${tabText}" ===`);

      await tab.click();
      await page.waitForTimeout(1500);

      // Take screenshot of this tab's proposals
      await page.screenshot({
        path: `test-results/05-tab-${tabIndex + 1}-${tabText.replace(/[^a-zA-Z]/g, '_').substring(0, 20)}.png`,
        fullPage: false
      });

      // Find all proposal cards/rows within this tab
      // Looking at the screenshot, proposals appear as cards with guest names
      const proposalCards = page.locator('[class*="proposal"], [class*="Proposal"], [data-testid*="proposal"]');
      let cardCount = await proposalCards.count();

      // Also try to find by guest name pattern (name + badges like "New", "Verified")
      const guestCards = page.locator('div:has(> div:has-text("Verified")), div:has(> span:has-text("New"))');
      const guestCardCount = await guestCards.count();

      console.log(`Found ${cardCount} proposal cards, ${guestCardCount} guest cards`);

      // Get the current page content for this tab
      const tabContent = await page.locator('main, [class*="content"], body').first().innerText();

      // Search for any monetary values
      const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
      const moneyValues = tabContent.match(moneyPattern) || [];
      console.log(`Money values in this tab: ${moneyValues.join(', ')}`);

      // Look for guest names and their proposal info
      // Pattern: Name followed by schedule info
      const lines = tabContent.split('\n').filter(line => line.trim());
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Look for lines that might contain guest names (followed by New/Verified badges or schedule info)
        if (line.includes('$') && line.includes('total')) {
          console.log(`  Found proposal line: ${lines[i - 1] || ''} | ${line}`);
        }
      }
    }

    // Step 6: Click into each visible proposal to get detailed compensation
    console.log('\n[STEP 6] Clicking into proposals to get detailed compensation...');

    // First, let's click on the NIGHTLY tab which has 1 proposal
    const nightlyTab = page.locator('button:has-text("NIGHTLY"), [class*="tab"]:has-text("NIGHTLY")').first();
    await nightlyTab.click();
    await page.waitForTimeout(1000);

    // Find clickable proposal elements - they seem to be the guest cards
    // From the screenshot: "Leo Di Caprio | New | Verified | Mon-Fri | 13 weeks | $7,592 total"
    const proposalItems = page.locator('[class*="Proposal"], [class*="proposal"], div:has(span:has-text("Verified"))').filter({
      has: page.locator(':has-text("$")')
    });

    let itemCount = await proposalItems.count();
    console.log(`Found ${itemCount} proposal items with $ amounts`);

    // If no items found with that selector, try a broader approach
    if (itemCount === 0) {
      // Click on any element that contains a guest name pattern
      const clickableAreas = page.locator('div').filter({
        hasText: /\$[\d,]+.*total/
      });
      itemCount = await clickableAreas.count();
      console.log(`Found ${itemCount} clickable areas with total amounts`);
    }

    // Click on each proposal to view details
    for (let i = 0; i < Math.min(itemCount, 10); i++) {
      console.log(`\n--- Opening proposal ${i + 1} ---`);

      // Re-query the elements since page may have changed
      const items = page.locator('div').filter({
        hasText: /\$[\d,]+.*total/
      });

      if (i >= await items.count()) break;

      const item = items.nth(i);
      const itemText = await item.innerText().catch(() => '');
      console.log(`Proposal preview: ${itemText.substring(0, 200)}`);

      // Click to open details
      await item.click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // Take screenshot of detail view
      await page.screenshot({
        path: `test-results/06-proposal-detail-${i + 1}.png`,
        fullPage: true
      });
      console.log(`Screenshot saved: 06-proposal-detail-${i + 1}.png`);

      // Capture all text from detail view
      const detailText = await page.locator('body').innerText();
      console.log('\n--- PROPOSAL DETAIL TEXT ---');
      console.log(detailText);
      console.log('--- END DETAIL ---\n');

      // Extract monetary values
      const moneyPattern = /\$[\d,]+(?:\.\d{2})?/g;
      const moneyMatches = detailText.match(moneyPattern) || [];
      console.log('All monetary values:', moneyMatches);

      // Look for compensation-specific lines
      const compLines = detailText.split('\n').filter(line =>
        line.toLowerCase().includes('compensation') ||
        line.toLowerCase().includes('payout') ||
        line.toLowerCase().includes('earn') ||
        line.toLowerCase().includes('host') ||
        line.toLowerCase().includes('fee') ||
        line.toLowerCase().includes('total')
      );
      console.log('Compensation-related lines:', compLines);

      // Store the data
      compensationData.push({
        listingName: itemText.split('\n')[0] || 'Unknown',
        guestName: 'From proposal',
        totalAmount: moneyMatches[0] || 'N/A',
        schedule: '',
        duration: '',
        status: '',
        allMoneyValues: moneyMatches,
        rawDetailText: detailText
      });

      // Go back to proposals list
      await page.goBack();
      await page.waitForTimeout(1500);
      await page.waitForLoadState('networkidle');
    }

    // Step 7: Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('HOST COMPENSATION REPORT');
    console.log('='.repeat(80));

    console.log(`\nTotal proposals analyzed: ${compensationData.length}`);

    for (let i = 0; i < compensationData.length; i++) {
      const data = compensationData[i];
      console.log(`\n--- Proposal ${i + 1} ---`);
      console.log(`Listing: ${data.listingName || 'N/A'}`);
      console.log(`Guest: ${data.guestName}`);
      console.log(`Total Compensation: ${data.totalCompensation || 'See raw text'}`);
      console.log(`Per-Night Rate: ${data.perNightRate || 'See raw text'}`);
      console.log(`Platform Fees: ${data.platformFees || 'See raw text'}`);
    }

    // Final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/06-final-state.png',
      fullPage: true
    });
    console.log('\nScreenshot saved: 06-final-state.png');

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE - Check screenshots in e2e/screenshots/');
    console.log('='.repeat(80));
  });
});
