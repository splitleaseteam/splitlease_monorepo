/**
 * Agent 2: Bubble Price Tracker
 *
 * Runs in parallel with the E2E journey script (create-listing-bubble.cjs).
 * Watches for a listing signal file, then polls the listing/proposal pages
 * to capture price data at each stage of the lifecycle.
 *
 * Usage:
 *   node bubble-price-tracker.cjs [--site=app.split.lease]
 *
 * The tracker watches for a signal file written by Agent 1 after listing creation,
 * then periodically scrapes price data from the Bubble site.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ============================================================================
// Site Profiles (must match create-listing-bubble.cjs)
// ============================================================================

const SITE_PROFILES = {
  'app.split.lease': {
    baseURL: 'https://app.split.lease',
    guest: {
      email: 'splitleasetesting@test.com',
      password: 'eCom@2024',
    },
  },
  'split.lease': {
    baseURL: 'https://split.lease',
    guest: {
      email: 'splitleasetesting@test.com',
      password: 'eCom@2024',
    },
  },
};

// Parse --site arg
const siteArg = process.argv.find((a) => a.startsWith('--site='));
const siteName = siteArg ? siteArg.split('=')[1] : 'app.split.lease';
const siteProfile = SITE_PROFILES[siteName];

if (!siteProfile) {
  console.error(`Unknown site: ${siteName}`);
  process.exit(1);
}

const safeSiteName = siteName.replace(/\./g, '-');
const siteDir = path.join(__dirname, 'recordings', safeSiteName);

// ============================================================================
// Logging
// ============================================================================

function log(tag, message) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: true });
  console.log(`[${time}] [${tag}] ${message}`);
}

// ============================================================================
// Wait for signal file from Agent 1
// ============================================================================

async function waitForSignal(timeoutMs = 600000) {
  log('TRACKER', `Watching for listing signal in ${siteDir}...`);
  log('TRACKER', `Timeout: ${timeoutMs / 1000}s`);

  const startTime = Date.now();
  const pollIntervalMs = 3000;

  while (Date.now() - startTime < timeoutMs) {
    // Check latest.txt for the current run directory
    const latestPath = path.join(siteDir, 'latest.txt');
    if (fs.existsSync(latestPath)) {
      const runTimestamp = fs.readFileSync(latestPath, 'utf8').trim();
      const signalPath = path.join(siteDir, runTimestamp, 'listing-signal.json');

      if (fs.existsSync(signalPath)) {
        const signal = JSON.parse(fs.readFileSync(signalPath, 'utf8'));
        log('TRACKER', `Signal found: listing ${signal.listingId}`);
        log('TRACKER', `Listing URL: ${signal.listingURL}`);
        return { ...signal, runDir: path.join(siteDir, runTimestamp) };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Timeout waiting for listing signal from Agent 1');
}

// ============================================================================
// Price scraping helpers
// ============================================================================

async function scrapeListingPagePrices(page) {
  const prices = {};

  try {
    const nightlyEl = page.locator('text=/\\$[\\d,.]+\\s*\\/\\s*night/i').first();
    prices.nightlyRate = (await nightlyEl.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.nightlyRate = null; }

  try {
    const fourWeekEl = page.locator('text=/4-Week Rent.*\\$[\\d,.]+/i').first();
    prices.fourWeekRent = (await fourWeekEl.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.fourWeekRent = null; }

  try {
    const totalEl = page.locator('text=/Reservation.*\\$[\\d,.]+/i').first();
    prices.estimatedTotal = (await totalEl.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.estimatedTotal = null; }

  return prices;
}

async function scrapeProposalPrices(page) {
  const prices = {};

  try {
    const nightlyEl = page.locator('text=/\\$[\\d,.]+\\s*\\/\\s*night/i').first();
    prices.nightlyRate = (await nightlyEl.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.nightlyRate = null; }

  try {
    const durationEl = page.locator('text=/Duration/i').first();
    const row = durationEl.locator('..');
    prices.duration = (await row.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.duration = null; }

  try {
    const totalEl = page.locator('text=/\\$[\\d,.]+.*total/i').first();
    prices.total = (await totalEl.textContent({ timeout: 5000 })).trim();
  } catch (e) { prices.total = null; }

  return prices;
}

// ============================================================================
// Main tracker loop
// ============================================================================

(async () => {
  log('TRACKER', `========== BUBBLE PRICE TRACKER ==========`);
  log('TRACKER', `Site: ${siteName} (${siteProfile.baseURL})`);

  // Wait for Agent 1 to create the listing and write the signal file
  const signal = await waitForSignal();

  const trackerLog = [];
  const trackerLogPath = path.join(signal.runDir, 'bubble-price-tracker-log.json');

  function addEntry(phase, label, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      phase,
      label,
      ...data,
    };
    trackerLog.push(entry);
    fs.writeFileSync(trackerLogPath, JSON.stringify(trackerLog, null, 2));
    log('PRICE', `[${phase}] ${label}: ${JSON.stringify(data)}`);
  }

  // Launch a headless browser for price scraping (no video needed)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ====================================================================
    // PHASE 1: Scrape initial listing prices
    // ====================================================================
    log('PHASE 1', 'Scraping listing page prices...');
    const listingURL = signal.listingURL.split('?')[0];
    await page.goto(`${listingURL}?days-selected=1,%202,%203,%204,%205,%206,%207&duration=6%20weeks`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(15000);

    const initialPrices = await scrapeListingPagePrices(page);
    addEntry('LISTING_INITIAL', 'Initial listing page prices (no login)', initialPrices);

    // ====================================================================
    // PHASE 2: Log in as guest and scrape listing prices (authenticated)
    // ====================================================================
    log('PHASE 2', 'Logging in as guest to check prices...');
    await page.goto(siteProfile.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    // Login
    try {
      await page.getByText('Sign In | Sign Up').click({ timeout: 5000 });
    } catch (e) {
      await page.getByText('Sign In').first().click({ timeout: 5000 });
    }
    await page.getByRole('button', { name: 'Log into my account' }).click();
    await page.getByRole('textbox', { name: 'example@example.com*' }).fill(siteProfile.guest.email);
    await page.getByRole('textbox', { name: 'Password *' }).fill(siteProfile.guest.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(15000);

    // Navigate to listing as authenticated guest
    log('PHASE 2', 'Navigating to listing page as guest...');
    await page.goto(`${listingURL}?days-selected=1,%202,%203,%204,%205,%206,%207&duration=16%20weeks`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(15000);

    const guestListingPrices = await scrapeListingPagePrices(page);
    addEntry('LISTING_GUEST', 'Listing prices as guest (16 weeks)', guestListingPrices);

    // ====================================================================
    // PHASE 3: Poll for proposal/counter changes
    // ====================================================================
    log('PHASE 3', 'Polling for proposal price changes...');

    // Poll the guest's proposals page for price updates
    const pollIntervalMs = 15000;
    const maxPolls = 30; // 30 * 15s = ~7.5 minutes max
    let lastPriceSnapshot = '';

    for (let i = 0; i < maxPolls; i++) {
      try {
        // Check if Agent 1's price log has new entries
        const agent1PriceLogPath = path.join(signal.runDir, 'price-log.json');
        if (fs.existsSync(agent1PriceLogPath)) {
          const agent1Log = JSON.parse(fs.readFileSync(agent1PriceLogPath, 'utf8'));
          const currentSnapshot = JSON.stringify(agent1Log);

          if (currentSnapshot !== lastPriceSnapshot) {
            lastPriceSnapshot = currentSnapshot;
            // Mirror Agent 1's price entries
            for (const entry of agent1Log) {
              const alreadyLogged = trackerLog.some(
                (e) => e.phase === `AGENT1_${entry.phase}` && e.label === entry.label
              );
              if (!alreadyLogged) {
                addEntry(`AGENT1_${entry.phase}`, entry.label, {
                  source: 'agent1',
                  ...entry,
                });
              }
            }
          }

          // If Agent 1 has logged the acceptance, we're done
          const hasAcceptance = agent1Log.some((e) => e.phase === 'ACCEPTANCE');
          if (hasAcceptance) {
            log('PHASE 3', 'Acceptance detected — stopping price tracker');
            break;
          }
        }
      } catch (e) {
        // File may be mid-write, ignore
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      log('PHASE 3', `Poll ${i + 1}/${maxPolls}...`);
    }

    // ====================================================================
    // FINAL: Generate clean price summary
    // ====================================================================
    log('FINAL', '========== PRICE TRACKING COMPLETE ==========');

    const summaryPath = path.join(signal.runDir, 'price-summary.txt');
    const summaryLines = [
      '=== BUBBLE PRICE TRACKER — SUMMARY ===',
      `Site: ${siteName}`,
      `Listing: ${signal.listingTitle}`,
      `Listing ID: ${signal.listingId}`,
      `Timestamp: ${new Date().toISOString()}`,
      '',
    ];

    for (const entry of trackerLog) {
      summaryLines.push(`[${entry.phase}] ${entry.label}`);
      for (const [key, value] of Object.entries(entry)) {
        if (!['timestamp', 'phase', 'label', 'source'].includes(key) && value !== null) {
          summaryLines.push(`  ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
        }
      }
      summaryLines.push('');
    }

    fs.writeFileSync(summaryPath, summaryLines.join('\n'));
    log('FINAL', `Price summary: ${summaryPath}`);
    log('FINAL', `Full tracker log: ${trackerLogPath} (${trackerLog.length} entries)`);

  } catch (error) {
    log('ERROR', `Tracker failed: ${error.message}`);
    console.error(error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
