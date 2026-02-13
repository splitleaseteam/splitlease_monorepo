/**
 * Comet Browser Test — Launch Perplexity's Comet browser via Playwright
 *
 * Opens app.split.lease in Comet Browser (Chromium-based) so the user
 * can interact with the page using Comet's built-in AI assistant.
 *
 * Usage: node e2e/comet-bubble-test.cjs
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const COMET_PATH = String.raw`C:\Users\Split Lease\AppData\Local\Perplexity\Comet\Application\comet.exe`;
const BASE_URL = 'https://app.split.lease';

const CONFIG = {
  host: { email: 'rodtesthost2@test.com', password: 'eCom@2024' },
};

const outputDir = path.join(__dirname, 'recordings', 'comet-test', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(outputDir, { recursive: true });

function log(tag, msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

(async () => {
  log('INIT', `Launching Comet Browser from: ${COMET_PATH}`);
  log('INIT', `Output: ${outputDir}`);

  // Verify Comet executable exists
  if (!fs.existsSync(COMET_PATH)) {
    log('ERROR', `Comet Browser not found at: ${COMET_PATH}`);
    process.exit(1);
  }

  // Launch Comet Browser via Playwright's Chromium connector
  const browser = await chromium.launch({
    headless: false,
    executablePath: COMET_PATH,
    slowMo: 200,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
  });

  const context = await browser.newContext({
    viewport: null, // Use full window size
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  // Anti-detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // Wait for Comet to fully initialize (it opens its own start page first)
    log('INIT', 'Waiting for Comet Browser to initialize...');
    await page.waitForTimeout(8000);
    log('INIT', `Initial page: ${page.url()}`);

    // Navigate to app.split.lease with retry
    log('NAV', `Opening ${BASE_URL}...`);
    try {
      await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 30000 });
    } catch (e) {
      log('NAV', `First attempt: ${e.message.substring(0, 60)} — retrying...`);
      await page.waitForTimeout(3000);
      await page.goto(BASE_URL, { waitUntil: 'commit', timeout: 30000 });
    }
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(5000);
    log('NAV', `Page loaded: ${page.url()}`);

    // Log in as host
    log('LOGIN', 'Starting login flow...');

    // Click "Sign In | Sign Up"
    const signIn = page.getByText('Sign In | Sign Up', { exact: true });
    await signIn.waitFor({ state: 'visible', timeout: 20000 });
    await signIn.click();
    await page.waitForTimeout(2000);

    // Click "Log into my account"
    const loginOption = page.getByText('Log into my account', { exact: false });
    await loginOption.waitFor({ state: 'visible', timeout: 10000 });
    await loginOption.click();
    await page.waitForTimeout(1500);

    // Remove greyout
    await page.evaluate(() => document.querySelectorAll('.greyout').forEach(g => g.remove()));
    await page.waitForTimeout(500);

    // Fill credentials using documented selectors
    const emailInput = page.locator('#emaillogin');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.click();
    await emailInput.press('Control+a');
    await emailInput.press('Backspace');
    await emailInput.pressSequentially(CONFIG.host.email, { delay: 50 });

    const passwordInput = page.locator('#loginreveal');
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.click();
    await passwordInput.press('Control+a');
    await passwordInput.press('Backspace');
    await passwordInput.pressSequentially(CONFIG.host.password, { delay: 50 });

    // Click Login
    await page.locator('#loginButtonID').click();
    log('LOGIN', 'Clicked Login — waiting for completion...');
    await page.waitForTimeout(5000);

    // Verify login
    const stillSignIn = await page.getByText('Sign In | Sign Up', { exact: true }).isVisible().catch(() => false);
    if (!stillSignIn) {
      log('LOGIN', 'Login successful');
    } else {
      log('LOGIN', 'Login may have failed — Sign In still visible');
    }

    // Navigate to host-overview
    log('NAV', 'Navigating to host-overview...');
    await page.goto(`${BASE_URL}/host-overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    log('NAV', `On host-overview: ${page.url()}`);

    // ── PAUSE: Let user interact with Comet's AI assistant ──
    log('READY', '');
    log('READY', '╔══════════════════════════════════════════════════════════════╗');
    log('READY', '║    COMET BROWSER IS READY — USE THE AI ASSISTANT NOW        ║');
    log('READY', '╠══════════════════════════════════════════════════════════════╣');
    log('READY', '║                                                              ║');
    log('READY', '║  The browser is logged in and on host-overview.             ║');
    log('READY', '║  Use Comet\'s AI assistant to:                               ║');
    log('READY', '║  1. Click "+ Create New Listing"                            ║');
    log('READY', '║  2. Fill the listing wizard                                 ║');
    log('READY', '║  3. Check amenity checkboxes                                ║');
    log('READY', '║                                                              ║');
    log('READY', '║  The browser will stay open for 10 minutes.                 ║');
    log('READY', '║  Press Ctrl+C to close early.                               ║');
    log('READY', '║                                                              ║');
    log('READY', '╚══════════════════════════════════════════════════════════════╝');
    log('READY', '');

    // Keep browser open for 10 minutes
    await page.waitForTimeout(600000);

  } catch (e) {
    log('ERROR', e.message);
  } finally {
    await context.close();
    await browser.close();
    log('DONE', 'Comet Browser closed');
  }
})();
