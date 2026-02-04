/**
 * E2E Test: Proposal Creation Flow with Pricing Validation
 *
 * Tests the complete proposal creation flow for Weekly, Nightly, and Monthly listings
 * Captures all pricing data shown to the guest
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const GUEST_EMAIL = 'splitleasefrederick+frederickros@gmail.com';
const GUEST_PASSWORD = 'eCom2023$';

// Listings to test
const LISTINGS = {
  weekly: {
    id: '1770159292555x84785333838911712',
    name: 'Weekly Listing'
  },
  nightly: {
    id: '1770159059956x68069167691952992',
    name: 'Nightly Listing'
  },
  monthly: {
    id: '1770159488384x35093957137090224',
    name: 'Monthly Listing'
  }
};

// Results storage
interface PricingData {
  listingId: string;
  listingType: string;
  viewPagePricing: {
    pricePerNight?: string;
    pricePerWeek?: string;
    pricePerMonth?: string;
    anyPriceShown?: string;
  };
  proposalFormPricing: {
    guestPricePerNight?: string;
    guest4WeekRent?: string;
    guestTotal?: string;
    fees?: string[];
    allTextContent?: string;
  };
  proposalSubmission: {
    success: boolean;
    proposalId?: string;
    error?: string;
  };
  screenshots: string[];
}

const results: PricingData[] = [];

async function login(page: Page): Promise<boolean> {
  console.log('Starting login process...');

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Wait for login form
  await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
  await emailInput.fill(GUEST_EMAIL);

  // Fill password
  const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
  await passwordInput.fill(GUEST_PASSWORD);

  // Click login button
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Log In")').first();
  await loginButton.click();

  // Wait for redirect or dashboard
  await page.waitForTimeout(3000);

  // Check if login was successful
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login') || currentUrl.includes('/dashboard') || currentUrl.includes('/search');

  console.log(`Login result: ${isLoggedIn ? 'SUCCESS' : 'FAILED'}, current URL: ${currentUrl}`);

  return isLoggedIn;
}

async function captureListingPricing(page: Page, listingId: string, listingType: string): Promise<PricingData> {
  const data: PricingData = {
    listingId,
    listingType,
    viewPagePricing: {},
    proposalFormPricing: {},
    proposalSubmission: { success: false },
    screenshots: []
  };

  console.log(`\n=== Testing ${listingType} listing: ${listingId} ===\n`);

  // Navigate to listing page
  const listingUrl = `${BASE_URL}/view-split-lease/${listingId}`;
  console.log(`Navigating to: ${listingUrl}`);
  await page.goto(listingUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Screenshot the listing view
  const viewScreenshot = `listing-view-${listingType}-${Date.now()}.png`;
  await page.screenshot({ path: `e2e/test-results/${viewScreenshot}`, fullPage: true });
  data.screenshots.push(viewScreenshot);
  console.log(`Captured listing view screenshot: ${viewScreenshot}`);

  // Capture pricing from the listing page
  const pageContent = await page.textContent('body');

  // Look for price patterns
  const pricePatterns = {
    perNight: /\$[\d,]+(?:\.\d{2})?\s*(?:\/?\s*night|per\s*night)/gi,
    perWeek: /\$[\d,]+(?:\.\d{2})?\s*(?:\/?\s*week|per\s*week)/gi,
    perMonth: /\$[\d,]+(?:\.\d{2})?\s*(?:\/?\s*month|per\s*month)/gi,
    general: /\$[\d,]+(?:\.\d{2})?/g
  };

  const nightlyMatches = pageContent?.match(pricePatterns.perNight);
  const weeklyMatches = pageContent?.match(pricePatterns.perWeek);
  const monthlyMatches = pageContent?.match(pricePatterns.perMonth);

  if (nightlyMatches) data.viewPagePricing.pricePerNight = nightlyMatches.join(', ');
  if (weeklyMatches) data.viewPagePricing.pricePerWeek = weeklyMatches.join(', ');
  if (monthlyMatches) data.viewPagePricing.pricePerMonth = monthlyMatches.join(', ');

  // Capture any price shown
  const allPrices = pageContent?.match(pricePatterns.general);
  if (allPrices && allPrices.length > 0) {
    data.viewPagePricing.anyPriceShown = [...new Set(allPrices)].slice(0, 10).join(', ');
  }

  console.log('View page pricing captured:', data.viewPagePricing);

  // Find and click the proposal button
  const proposalButton = page.locator('button:has-text("Start Proposal"), button:has-text("Propose"), button:has-text("Book"), a:has-text("Start Proposal"), [data-testid="start-proposal"]').first();

  try {
    await proposalButton.waitFor({ timeout: 5000 });
    console.log('Found proposal button, clicking...');
    await proposalButton.click();
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Could not find standard proposal button, looking for alternatives...');
    // Try scrolling and looking for any action button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const anyButton = page.locator('button, a').filter({ hasText: /proposal|book|request|inquire/i }).first();
    try {
      await anyButton.click();
      await page.waitForTimeout(2000);
    } catch (e2) {
      console.log('No proposal button found on page');
    }
  }

  // Check if we're now on a proposal form
  await page.waitForTimeout(2000);
  const proposalScreenshot = `proposal-form-${listingType}-${Date.now()}.png`;
  await page.screenshot({ path: `e2e/test-results/${proposalScreenshot}`, fullPage: true });
  data.screenshots.push(proposalScreenshot);
  console.log(`Captured proposal form screenshot: ${proposalScreenshot}`);

  // Capture pricing from proposal form
  const formContent = await page.textContent('body');

  // Look for specific pricing fields in the proposal form
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
            console.log(`Found pricing element (${selector}): ${text}`);
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }

  // Look for 4-week rent
  const fourWeekMatch = formContent?.match(/4[\s-]*week[\s\w]*:?\s*\$[\d,]+(?:\.\d{2})?/gi);
  if (fourWeekMatch) {
    data.proposalFormPricing.guest4WeekRent = fourWeekMatch.join(', ');
  }

  // Look for total
  const totalMatch = formContent?.match(/total[\s\w]*:?\s*\$[\d,]+(?:\.\d{2})?/gi);
  if (totalMatch) {
    data.proposalFormPricing.guestTotal = totalMatch.join(', ');
  }

  // Look for guest price per night
  const guestNightMatch = formContent?.match(/(?:guest\s*)?price[\s\w]*(?:per)?\s*night[\s\w]*:?\s*\$[\d,]+(?:\.\d{2})?/gi);
  if (guestNightMatch) {
    data.proposalFormPricing.guestPricePerNight = guestNightMatch.join(', ');
  }

  // Capture all price-related text
  const allPriceText = formContent?.match(/\$[\d,]+(?:\.\d{2})?[^$]*/g);
  if (allPriceText) {
    data.proposalFormPricing.allTextContent = allPriceText.slice(0, 15).join(' | ');
  }

  console.log('Proposal form pricing captured:', data.proposalFormPricing);

  // Try to fill in proposal form
  try {
    // About me field
    const aboutMeInput = page.locator('textarea[name*="about"], textarea[placeholder*="about"], textarea[id*="about"], textarea').first();
    await aboutMeInput.fill('Test user looking for a space. This is an automated test proposal.');

    // Need for space field
    const needInput = page.locator('textarea[name*="need"], textarea[placeholder*="need"], textarea[id*="need"], input[name*="need"]').first();
    try {
      await needInput.fill('Testing the proposal creation flow.');
    } catch (e) {
      // May not exist
    }

    // Look for any required date pickers and fill them
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    for (let i = 0; i < dateCount; i++) {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (7 + i * 7) * 24 * 60 * 60 * 1000);
      await dateInputs.nth(i).fill(futureDate.toISOString().split('T')[0]);
    }

    console.log('Filled in proposal form fields');

    // Screenshot after filling
    const filledScreenshot = `proposal-filled-${listingType}-${Date.now()}.png`;
    await page.screenshot({ path: `e2e/test-results/${filledScreenshot}`, fullPage: true });
    data.screenshots.push(filledScreenshot);

    // Submit the proposal
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Send"), button:has-text("Create")').first();
    await submitButton.click();

    console.log('Clicked submit button');
    await page.waitForTimeout(5000);

    // Screenshot after submission
    const confirmScreenshot = `proposal-confirm-${listingType}-${Date.now()}.png`;
    await page.screenshot({ path: `e2e/test-results/${confirmScreenshot}`, fullPage: true });
    data.screenshots.push(confirmScreenshot);

    // Check for success indicators
    const pageAfterSubmit = await page.textContent('body');
    const successIndicators = ['success', 'submitted', 'thank you', 'confirmation', 'created', 'sent'];
    const hasSuccess = successIndicators.some(ind => pageAfterSubmit?.toLowerCase().includes(ind));

    if (hasSuccess) {
      data.proposalSubmission.success = true;
      // Try to find proposal ID
      const idMatch = pageAfterSubmit?.match(/(?:proposal|id|ref)[\s#:]*([a-zA-Z0-9-_]+)/i);
      if (idMatch) {
        data.proposalSubmission.proposalId = idMatch[1];
      }
    } else {
      // Check for error messages
      const errorMatch = pageAfterSubmit?.match(/error|failed|invalid|required/gi);
      if (errorMatch) {
        data.proposalSubmission.error = errorMatch.slice(0, 5).join(', ');
      }
    }

    console.log('Submission result:', data.proposalSubmission);

  } catch (e) {
    console.log(`Error during form submission: ${e}`);
    data.proposalSubmission.error = String(e);
  }

  return data;
}

test.describe('Proposal Creation Flow - Pricing Validation', () => {
  test.setTimeout(180000); // 3 minutes timeout

  test('Complete proposal flow for all listing types', async ({ page }) => {
    // Ensure test-results directory exists
    await page.context().browser()?.newContext();

    // Step 1: Login
    const loginSuccess = await login(page);
    expect(loginSuccess).toBeTruthy();

    // Step 2: Test each listing type
    for (const [type, listing] of Object.entries(LISTINGS)) {
      const data = await captureListingPricing(page, listing.id, type);
      results.push(data);
    }

    // Step 3: Output results
    console.log('\n\n========================================');
    console.log('PROPOSAL CREATION TEST RESULTS');
    console.log('========================================\n');

    for (const result of results) {
      console.log(`\n--- ${result.listingType.toUpperCase()} LISTING ---`);
      console.log(`Listing ID: ${result.listingId}`);
      console.log('\nView Page Pricing:');
      console.log(JSON.stringify(result.viewPagePricing, null, 2));
      console.log('\nProposal Form Pricing:');
      console.log(JSON.stringify(result.proposalFormPricing, null, 2));
      console.log('\nSubmission Result:');
      console.log(JSON.stringify(result.proposalSubmission, null, 2));
      console.log(`Screenshots: ${result.screenshots.join(', ')}`);
    }

    console.log('\n\n========================================');
    console.log('FULL RESULTS JSON');
    console.log('========================================\n');
    console.log(JSON.stringify(results, null, 2));
  });
});
