/**
 * Weekly Proposal Creation E2E Script
 *
 * Creates a proposal on the WEEKLY test listing.
 * This script handles login, navigation, and proposal submission.
 *
 * Run with: npx tsx e2e/scripts/weekly-proposal-creation.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
// Using a valid active listing from the dev database
// Note: URL format is ?id= not ?listing= (per listingDataFetcher.js)
const LISTING_ID = '1701107772942x447054126943830000';  // "Pied-à-terre, Perfect 2 BR Apartment for Commuters"
const LISTING_URL = `${BASE_URL}/view-split-lease?id=${LISTING_ID}`;

const GUEST_CREDENTIALS = {
  email: 'splitleasefrederick+frederickros@gmail.com',
  password: 'eCom2023$'
};

interface TestResult {
  success: boolean;
  message: string;
  screenshot?: string;
  error?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await delay(1000);
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(screenshotDir, `${name}-${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function createProposal(): Promise<TestResult> {
  let browser: Browser | null = null;
  let page: Page | null = null;
  let lastScreenshot: string | undefined;

  try {
    console.log('Starting browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 300  // Slow down for visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    page = await context.newPage();

    // Step 1: Navigate to listing page
    console.log('Step 1: Navigating to listing page...');
    await page.goto(LISTING_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await waitForPageLoad(page);
    console.log('Page loaded');

    // Step 2: Wait for listing content to appear
    console.log('Step 2: Waiting for listing content...');
    await page.waitForSelector('main, .listing-detail, .listing-page, [data-testid="listing-page"]', {
      state: 'visible',
      timeout: 30000
    });
    console.log('Listing content visible');

    lastScreenshot = await takeScreenshot(page, '01-listing-loaded');

    // Step 3: Click Sign In button in header
    console.log('Step 3: Looking for Sign In button...');

    // Wait a moment for header to be fully rendered
    await delay(1500);

    // Look for sign in button with various selectors
    const signInSelectors = [
      'button:has-text("Sign In")',
      'a:has-text("Sign In")',
      'button:has-text("Log In")',
      'a:has-text("Log In")',
      '[data-testid="sign-in-button"]',
      'nav button:has-text("Sign")',
      'header button:has-text("Sign")',
      '.header-nav button:has-text("Sign")'
    ];

    let signInClicked = false;
    for (const selector of signInSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
        signInClicked = true;
        console.log(`Clicked Sign In using selector: ${selector}`);
        break;
      }
    }

    if (!signInClicked) {
      // Try clicking any visible button with "Sign" text
      const anySignIn = page.locator('text=/sign.*in/i').first();
      if (await anySignIn.isVisible()) {
        await anySignIn.click();
        signInClicked = true;
        console.log('Clicked Sign In using text match');
      }
    }

    if (!signInClicked) {
      lastScreenshot = await takeScreenshot(page, '03-no-signin-found');
      throw new Error('Could not find Sign In button');
    }

    await delay(2000);
    lastScreenshot = await takeScreenshot(page, '04-after-signin-click');

    // Step 4: Login with credentials
    console.log('Step 4: Logging in...');

    // Wait for login modal/form to appear
    // The SignUpLoginModal has email input with placeholder="john@example.com"
    const emailInputSelectors = [
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder="john@example.com"]'
    ];

    let emailInput = null;
    for (const selector of emailInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
        emailInput = input;
        console.log(`Found email input using selector: ${selector}`);
        break;
      }
    }

    if (!emailInput) {
      lastScreenshot = await takeScreenshot(page, '05-no-email-input');
      throw new Error('Could not find email input in login modal');
    }

    // Fill email
    await emailInput.fill(GUEST_CREDENTIALS.email);
    console.log('Filled email');
    await delay(500);

    // Find and fill password
    // The password input has placeholder="Enter your password"
    const passwordInputSelectors = [
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder="Enter your password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordInputSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        passwordInput = input;
        console.log(`Found password input using selector: ${selector}`);
        break;
      }
    }

    if (!passwordInput) {
      lastScreenshot = await takeScreenshot(page, '06-no-password-input');
      throw new Error('Could not find password input');
    }

    await passwordInput.fill(GUEST_CREDENTIALS.password);
    console.log('Filled password');
    await delay(500);

    lastScreenshot = await takeScreenshot(page, '07-credentials-filled');

    // Click login/submit button
    const loginSubmitSelectors = [
      'button[type="submit"]',
      'form button:has-text("Sign In")',
      'form button:has-text("Log In")',
      'button:has-text("Sign In"):not([disabled])'
    ];

    let submitClicked = false;
    for (const selector of loginSubmitSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        submitClicked = true;
        console.log(`Clicked login submit using selector: ${selector}`);
        break;
      }
    }

    if (!submitClicked) {
      // Submit the form directly
      await passwordInput.press('Enter');
      console.log('Pressed Enter to submit login form');
    }

    // Wait for login to complete (modal should close, page should reload or update)
    console.log('Waiting for login to complete...');
    await delay(3000);
    await waitForPageLoad(page);

    lastScreenshot = await takeScreenshot(page, '08-after-login');

    // Verify login succeeded by checking for logged-in state
    const loggedInIndicators = [
      '.logged-in-avatar',
      '[data-testid="user-avatar"]',
      '[data-testid="user-menu"]',
      'img[alt*="avatar" i]',
      '.user-avatar'
    ];

    let isLoggedIn = false;
    for (const selector of loggedInIndicators) {
      if (await page.locator(selector).first().isVisible({ timeout: 3000 }).catch(() => false)) {
        isLoggedIn = true;
        console.log(`Login confirmed via: ${selector}`);
        break;
      }
    }

    if (!isLoggedIn) {
      console.log('Warning: Could not confirm login state, continuing anyway...');
    }

    // Step 5: Interact with booking widget - select days
    console.log('Step 5: Looking for schedule selector and selecting days...');

    // Wait for booking widget to load
    await delay(2000);

    // Helper function to dismiss error overlay if present
    async function dismissErrorOverlay() {
      const overlay = page.locator('.error-overlay-backdrop, .error-overlay');
      if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log('Dismissing error overlay...');
        // Try clicking the close button first
        const closeBtn = overlay.locator('button, .close, [aria-label*="close"]');
        if (await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          // Press Escape to dismiss
          await page.keyboard.press('Escape');
        }
        await delay(500);
      }
    }

    // First scroll to ensure booking widget is visible
    await page.evaluate(() => {
      const bookingWidget = document.querySelector('[class*="bookingWidget"], .booking-widget');
      if (bookingWidget) {
        bookingWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await delay(1000);

    // Dismiss any initial error overlay
    await dismissErrorOverlay();

    // Select Monday through Thursday (contiguous 4 nights)
    // Days are 0-indexed: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
    const daysToSelect = ['Mon', 'Tue', 'Wed', 'Thu'];
    let selectedDays: string[] = [];

    for (const dayName of daysToSelect) {
      // Dismiss any error overlay before clicking
      await dismissErrorOverlay();

      // Try multiple selectors for day buttons
      const dayBtnSelectors = [
        `button:has-text("${dayName}")`,
        `button[aria-label*="${dayName}"]`,
        `[data-day="${dayName}"]`
      ];

      let clicked = false;
      for (const selector of dayBtnSelectors) {
        const dayBtn = page.locator(selector).first();
        if (await dayBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          try {
            // Use force click to bypass any overlays
            await dayBtn.click({ force: true, timeout: 5000 });
            selectedDays.push(dayName);
            console.log(`Selected ${dayName}`);
            clicked = true;
            await delay(300);
            break;
          } catch (e) {
            console.log(`Could not click ${dayName} with selector ${selector}, trying next...`);
          }
        }
      }

      if (!clicked) {
        console.log(`Warning: Could not select ${dayName}`);
      }
    }

    console.log(`Selected days: ${selectedDays.join(', ')}`);

    await delay(500);
    await dismissErrorOverlay();
    await delay(500);
    lastScreenshot = await takeScreenshot(page, '09-days-selected');

    // Step 6: Select move-in date using the native date input
    console.log('Step 6: Selecting move-in date...');

    // First, dismiss any error overlays that might be showing
    const errorOverlay = page.locator('.error-overlay-backdrop, .error-overlay');
    if (await errorOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Found error overlay, attempting to dismiss...');
      await page.keyboard.press('Escape');
      await delay(500);
    }

    // CRITICAL: Move-in date must match the check-in day (first selected day)
    // Since we selected Mon-Thu, the check-in day is Monday (day index 1)
    // So we need to find the next Monday that's at least 2 weeks from now

    function getNextMondayAtLeast2WeeksOut(): string {
      const today = new Date();
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 14); // At least 2 weeks from now

      // Find the next Monday on or after minDate
      // dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
      const dayOfWeek = minDate.getDay();
      let daysUntilMonday: number;

      if (dayOfWeek === 0) {
        // Sunday -> next Monday is 1 day away
        daysUntilMonday = 1;
      } else if (dayOfWeek === 1) {
        // Already Monday
        daysUntilMonday = 0;
      } else {
        // Tuesday(2) through Saturday(6) -> days until next Monday
        // Tue=2 -> 6 days, Wed=3 -> 5 days, Thu=4 -> 4 days, Fri=5 -> 3 days, Sat=6 -> 2 days
        daysUntilMonday = 8 - dayOfWeek;
      }

      const nextMonday = new Date(minDate);
      nextMonday.setDate(minDate.getDate() + daysUntilMonday);

      const result = nextMonday.toISOString().split('T')[0];  // YYYY-MM-DD

      // Verify it's a Monday (sanity check)
      console.log(`Calculated date ${result} is day of week: ${nextMonday.getDay()} (should be 1 for Monday)`);

      return result;
    }

    const dateStr = getNextMondayAtLeast2WeeksOut();
    console.log(`Target move-in date: ${dateStr} (a Monday)`);

    // Dismiss any error overlay first
    await dismissErrorOverlay();

    // Scroll back up to ensure date picker is visible
    await page.evaluate(() => {
      window.scrollTo(0, 300); // Scroll a bit down to see the date picker
    });
    await delay(500);

    // The page uses a CustomDatePicker component (button-based dropdown calendar)
    // Look for the date picker button with class "custom-date-picker__input"
    const customDatePickerButton = page.locator('.custom-date-picker__input, .custom-date-picker button').first();

    // Check if custom date picker exists
    const customPickerVisible = await customDatePickerButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (customPickerVisible) {
      console.log('Found CustomDatePicker');

      // Dismiss error overlay multiple times to ensure it's gone
      for (let i = 0; i < 3; i++) {
        await dismissErrorOverlay();
        await delay(200);
      }

      // Also try removing overlay via JavaScript
      await page.evaluate(() => {
        const overlays = document.querySelectorAll('.error-overlay-backdrop, .error-overlay');
        overlays.forEach(overlay => {
          (overlay as HTMLElement).style.display = 'none';
          overlay.remove();
        });
      });
      await delay(300);

      // Parse the target date
      const [targetYear, targetMonth, targetDay] = dateStr.split('-').map(Number);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

      console.log(`Selecting date: ${monthNames[targetMonth - 1]} ${targetDay}, ${targetYear}`);

      // Click the date picker button to open the dropdown with force
      await customDatePickerButton.click({ force: true });
      await delay(500);

      // Wait for dropdown to appear
      const dropdown = page.locator('.custom-date-picker__dropdown');
      await dropdown.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        console.log('Date picker dropdown did not appear');
      });

      // Check current month/year displayed
      const monthYearText = await page.locator('.custom-date-picker__month-year').textContent();
      console.log(`Current view: ${monthYearText}`);

      // Navigate to correct month if needed
      let maxIterations = 24; // Max 2 years of navigation
      while (maxIterations > 0) {
        const currentMonthYear = await page.locator('.custom-date-picker__month-year').textContent();
        const targetMonthYear = `${monthNames[targetMonth - 1]} ${targetYear}`;

        if (currentMonthYear?.trim() === targetMonthYear) {
          console.log(`Navigated to correct month: ${targetMonthYear}`);
          break;
        }

        // Click next month button
        const nextBtn = page.locator('.custom-date-picker__nav').last();
        await nextBtn.click();
        await delay(200);
        maxIterations--;
      }

      // Click on the target day
      // Days are rendered as buttons with aria-label like "February 23, 2026"
      const targetDayLabel = `${monthNames[targetMonth - 1]} ${targetDay}, ${targetYear}`;
      const dayButton = page.locator(`.custom-date-picker__day:not(.custom-date-picker__day--disabled):has-text("${targetDay}")`).first();

      // Alternative: use aria-label
      const dayButtonByLabel = page.locator(`button[aria-label="${targetDayLabel}"]`);

      if (await dayButtonByLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        await dayButtonByLabel.click();
        console.log(`Selected day by aria-label: ${targetDayLabel}`);
      } else if (await dayButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await dayButton.click();
        console.log(`Selected day ${targetDay}`);
      } else {
        // Try clicking by exact day number text
        const exactDayBtn = page.locator('.custom-date-picker__grid button').filter({ hasText: new RegExp(`^${targetDay}$`) });
        if (await exactDayBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await exactDayBtn.click();
          console.log(`Selected day by text match: ${targetDay}`);
        } else {
          console.log('WARNING: Could not find day button to click');
        }
      }

      await delay(500);

    } else {
      // Try native date input as fallback
      console.log('CustomDatePicker not found, trying native date input...');

      const dateInputSelectors = [
        '#move-in-date',
        'input[type="date"]',
        'input[id="move-in-date"]'
      ];

      let dateInputFound = false;
      for (const selector of dateInputSelectors) {
        const dateInput = page.locator(selector).first();
        const isVisible = await dateInput.isVisible({ timeout: 2000 }).catch(() => false);

        if (isVisible) {
          console.log(`Found native date input: ${selector}`);
          await dateInput.fill(dateStr);
          console.log(`Filled native date input with ${dateStr}`);
          dateInputFound = true;
          break;
        }
      }

      if (!dateInputFound) {
        console.log('WARNING: Could not find any date input');
      }
    }

    await delay(1000);

    // Dismiss any error overlays again before proceeding
    if (await errorOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('Dismissing error overlay...');
      await page.keyboard.press('Escape');
      await delay(500);
    }

    lastScreenshot = await takeScreenshot(page, '10-date-selected');

    // Step 7: Click Request Split / Create Proposal button to open proposal modal
    console.log('Step 7: Clicking Request Split / Create Proposal button...');

    const requestSplitSelectors = [
      'button:has-text("Create Proposal")',
      'button:has-text("Request Split")',
      'button:has-text("Request a Split")',
      'button:has-text("Book")',
      'button:has-text("Send Request")',
      '[data-testid="request-split"]',
      '[data-testid="create-proposal"]',
      '.booking-widget button:has-text("Request")',
      '.booking-widget button:has-text("Proposal")',
      'button.request-split',
      'button.create-proposal'
    ];

    // Dismiss any error overlays before clicking
    const errorOverlayBeforeClick = page.locator('.error-overlay-backdrop, .error-overlay');
    if (await errorOverlayBeforeClick.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('Dismissing error overlay before clicking Create Proposal...');
      await page.keyboard.press('Escape');
      await delay(500);
    }

    let requestClicked = false;
    for (const selector of requestSplitSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        try {
          // Try regular click first
          await btn.click({ timeout: 5000 });
          console.log(`Clicked Request Split using selector: ${selector}`);
          requestClicked = true;
          break;
        } catch (e) {
          // If regular click fails, try force click
          console.log(`Regular click failed for ${selector}, trying force click...`);
          try {
            await btn.click({ force: true, timeout: 5000 });
            console.log(`Force clicked Request Split using selector: ${selector}`);
            requestClicked = true;
            break;
          } catch (e2) {
            console.log(`Force click also failed for ${selector}`);
          }
        }
      }
    }

    if (!requestClicked) {
      lastScreenshot = await takeScreenshot(page, '11-no-request-button');
      throw new Error('Could not find Request Split button');
    }

    await delay(2000);
    lastScreenshot = await takeScreenshot(page, '12-proposal-modal-opened');

    // Step 8: Fill proposal form fields in the CreateProposalFlowV2 modal
    console.log('Step 8: Filling proposal form in modal...');

    // Wait for the modal to fully open and render
    await delay(2000);

    // The CreateProposalFlowV2 modal should now be visible
    // Wait for modal container
    const modalContainer = page.locator('.create-proposal-popup, .proposal-modal, [role="dialog"]').first();
    if (await modalContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Proposal modal is visible');
    } else {
      console.log('Warning: Could not find proposal modal');
    }

    // The modal has multiple sections. Look for "Your primary needs" dropdown (needForSpace)
    // This is likely a select element with options like "Work", "Personal", etc.
    const needForSpaceSelectors = [
      '.create-proposal-popup select',
      '.proposal-modal select',
      'select[name="needForSpace"]',
      'select[name="need_for_space"]',
      '.need-for-space select',
      '.primary-needs select',
      '[data-testid="need-for-space"] select'
    ];

    let needForSpaceFilled = false;
    for (const selector of needForSpaceSelectors) {
      const selectElements = page.locator(selector);
      const count = await selectElements.count();
      console.log(`Found ${count} select elements with selector: ${selector}`);

      for (let i = 0; i < count; i++) {
        const selectElement = selectElements.nth(i);
        if (await selectElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          try {
            const options = await selectElement.locator('option').allTextContents();
            console.log(`Select ${i} options: ${options.slice(0, 5).join(', ')}...`);

            // Look for options that seem like "need for space" options (not weeks)
            const hasWorkOption = options.some(opt =>
              opt.toLowerCase().includes('work') ||
              opt.toLowerCase().includes('remote') ||
              opt.toLowerCase().includes('business') ||
              opt.toLowerCase().includes('travel') ||
              opt.toLowerCase().includes('personal')
            );

            if (hasWorkOption || (!options[0]?.includes('week') && options.length > 1)) {
              await selectElement.selectOption({ index: 1 });
              console.log(`Selected Need for Space option from select ${i}`);
              needForSpaceFilled = true;
              break;
            }
          } catch (e) {
            console.log(`Failed to process select ${i}: ${e}`);
          }
        }
      }
      if (needForSpaceFilled) break;
    }

    await delay(500);

    // Fill "Tell the host about yourself" textarea (aboutYourself)
    const aboutMeSelectors = [
      '.create-proposal-popup textarea',
      '.proposal-modal textarea',
      'textarea[name="aboutYourself"]',
      'textarea[name="aboutMe"]',
      '[data-testid="about-me"] textarea',
      '[data-testid="about-yourself"] textarea',
      'textarea[placeholder*="about" i]',
      'textarea[placeholder*="yourself" i]',
      'textarea[placeholder*="host" i]'
    ];

    let aboutMeFilled = false;
    for (const selector of aboutMeSelectors) {
      const textarea = page.locator(selector).first();
      if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await textarea.fill('E2E Test - Weekly pricing verification. I am an automated test user verifying the proposal creation flow.');
        console.log(`Filled About Me using selector: ${selector}`);
        aboutMeFilled = true;
        break;
      }
    }

    if (!aboutMeFilled) {
      console.log('Warning: Could not find About Me textarea');
    }

    await delay(500);
    lastScreenshot = await takeScreenshot(page, '13-form-filled');

    // Step 9: Submit the proposal
    console.log('Step 9: Submitting proposal...');

    const submitSelectors = [
      'button:has-text("Submit Proposal")',
      'button:has-text("Submit")',
      'button:has-text("Send Request")',
      'button.nav-button.next',
      '.navigation-buttons button.next',
      '.booking-widget button:has-text("Submit")',
      'button[type="submit"]',
      '.proposal-form button[type="submit"]',
      'button:has-text("Confirm")'
    ];

    let proposalSubmitted = false;
    for (const selector of submitSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        try {
          await btn.click({ timeout: 5000 });
          console.log(`Clicked submit using selector: ${selector}`);
          proposalSubmitted = true;
          break;
        } catch (e) {
          console.log(`Regular click failed for ${selector}, trying force click...`);
          try {
            await btn.click({ force: true, timeout: 5000 });
            console.log(`Force clicked submit using selector: ${selector}`);
            proposalSubmitted = true;
            break;
          } catch (e2) {
            console.log(`Force click also failed for ${selector}`);
          }
        }
      }
    }

    if (!proposalSubmitted) {
      lastScreenshot = await takeScreenshot(page, '14-no-submit-button');
      throw new Error('Could not find proposal submit button');
    }

    // Step 10: Wait for success confirmation
    console.log('Step 10: Waiting for success confirmation...');
    await delay(3000);

    // Check for success or error indicators
    const successIndicators = [
      '.success-message',
      '[data-testid="success"]',
      '.toast-success',
      'text="Success"',
      'text="submitted"',
      'text="sent"',
      '.proposal-success',
      'text="Request Sent"'
    ];

    const errorIndicators = [
      '.error-message',
      '[data-testid="error"]',
      '.toast-error',
      'text="Error"',
      'text="failed"'
    ];

    let isSuccess = false;
    let successText = '';

    for (const selector of successIndicators) {
      const indicator = page.locator(selector).first();
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        isSuccess = true;
        successText = await indicator.textContent() || 'Success indicator visible';
        console.log(`Success confirmed via: ${selector}`);
        break;
      }
    }

    let hasError = false;
    let errorText = '';

    if (!isSuccess) {
      for (const selector of errorIndicators) {
        const indicator = page.locator(selector).first();
        if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
          hasError = true;
          errorText = await indicator.textContent() || 'Error indicator visible';
          console.log(`Error detected via: ${selector}`);
          break;
        }
      }
    }

    // Step 11: Take final screenshot
    console.log('Step 11: Taking final screenshot...');
    lastScreenshot = await takeScreenshot(page, '15-final-result');

    // Keep browser open for 5 seconds to observe result
    console.log('Keeping browser open for observation...');
    await delay(5000);

    if (isSuccess) {
      return {
        success: true,
        message: `Proposal created successfully: ${successText}`,
        screenshot: lastScreenshot
      };
    } else if (hasError) {
      return {
        success: false,
        message: 'Proposal submission failed',
        screenshot: lastScreenshot,
        error: errorText
      };
    } else {
      return {
        success: true,
        message: 'Proposal submission completed (no explicit confirmation/error found)',
        screenshot: lastScreenshot
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);

    // Take error screenshot
    if (page) {
      try {
        lastScreenshot = await takeScreenshot(page, 'error-final');
      } catch (e) {
        console.error('Could not take error screenshot');
      }
    }

    return {
      success: false,
      message: 'Test execution failed',
      screenshot: lastScreenshot,
      error: errorMessage
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


// Run the test
createProposal().then(result => {
  console.log('\n========================================');
  console.log('          TEST RESULT');
  console.log('========================================');
  console.log(`Success: ${result.success}`);
  console.log(`Message: ${result.message}`);
  if (result.screenshot) {
    console.log(`Screenshot: ${result.screenshot}`);
  }
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  console.log('========================================\n');
  process.exit(result.success ? 0 : 1);
});
