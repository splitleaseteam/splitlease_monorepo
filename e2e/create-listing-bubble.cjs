/**
 * Autonomous Playwright Script: Full Listing + Proposal Flow on app.split.lease (Bubble)
 *
 * Phase 1: Host creates listing (login → wizard → submit)
 * Phase 2: Guest creates proposal on that listing
 * Phase 3: Host counters the proposal (edits terms)
 * Phase 4: Guest accepts host's counter-terms
 *
 * Selectors sourced from Playwright codegen recording (2026-02-09).
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

// ============================================================================
// Site Profiles
// ============================================================================

const SITE_PROFILES = {
  'app.split.lease': {
    baseURL: 'https://app.split.lease',
    host: {
      email: 'rodtesthost2@test.com',
      password: 'eCom@2024',
    },
    guest: {
      email: 'splitleasetesting@test.com',
      password: 'eCom@2024',
    },
  },
  'split.lease': {
    baseURL: 'https://split.lease',
    host: {
      email: 'rodtesthost@test.com',
      password: 'eCom@2024',
    },
    guest: {
      email: 'splitleasetesting@test.com',
      password: 'eCom@2024',
    },
  },
};

// Parse --site arg (default: app.split.lease)
const siteArg = process.argv.find((a) => a.startsWith('--site='));
const siteName = siteArg ? siteArg.split('=')[1] : 'app.split.lease';
const siteProfile = SITE_PROFILES[siteName];

// Parse --skip-to=phase2 --listing-url=<url> to skip Phase 1
const skipToArg = process.argv.find((a) => a.startsWith('--skip-to='));
const skipToPhase = skipToArg ? skipToArg.split('=')[1].toLowerCase() : null;
const listingURLArg = process.argv.find((a) => a.startsWith('--listing-url='));
const listingURLFromCLI = listingURLArg ? listingURLArg.split('=').slice(1).join('=') : null;

if (skipToPhase && !['phase2', 'phase3', 'phase4'].includes(skipToPhase)) {
  console.error(`Unknown --skip-to value: ${skipToPhase}. Use: phase2, phase3, phase4`);
  process.exit(1);
}
if (skipToPhase && !listingURLFromCLI) {
  console.error('--skip-to requires --listing-url=<url> to know which listing to use');
  process.exit(1);
}

if (!siteProfile) {
  console.error(`Unknown site: ${siteName}. Available: ${Object.keys(SITE_PROFILES).join(', ')}`);
  process.exit(1);
}

console.log(`\n=== Target: ${siteName} (${siteProfile.baseURL}) ===\n`);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  baseURL: siteProfile.baseURL,
  credentials: siteProfile.host, // backward compat — host is the initial user
  host: siteProfile.host,
  guest: siteProfile.guest,
  listing: {
    title: 'PW Test ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(5),
    typeOfSpaceLabel: 'Private Room',
    bedroomsLabel: 'Studio',
    kitchenLabel: 'Full Kitchen',
    parkingLabel: 'Street Parking',
    bathroomsLabel: '2',
    address: '234 W 42nd St, New York',
    leaseStyle: 'Nights-of-the-week',
  },
  proposal: {
    daysSelected: '1, 2, 3, 4, 5, 6, 7', // all days (Mon-Sun)
    initialDuration: '6 weeks',
    counterDuration: '"10_weeks"', // Bubble internal value — host changes to 10 weeks
    counterDurationLabel: '10 weeks',
  },
  slowMo: 300,
  navigationTimeout: 60000,
  actionTimeout: 30000,
};

// Bubble internal option values — captured from Playwright codegen
const BUBBLE_VALUES = {
  address: {
    typeOfSpace: '"1348695171700984260__LOOKUP__1569530159044x216130979074711000"',
    bedrooms: '"studio"',
    kitchen: '"full_kitchen"',
    parking: '"1348695171700984260__LOOKUP__1642428637379x970678957586007000"',
    bathrooms: '2',
  },
  rules: {
    cancellationPolicy: '"1348695171700984260__LOOKUP__1665431440883x653177548350901500"',
    numberOfGuests: '1',
    secureStorage: '"1348695171700984260__LOOKUP__1606866759190x694414586166435100"',
  },
  proposal: {
    duration16Weeks: '"16_weeks"',
    duration10Weeks: '"10_weeks"',
  },
};

// ============================================================================
// Directory Setup
// ============================================================================

const safeSiteName = siteName.replace(/\./g, '-');
const runTimestamp = new Date()
  .toISOString()
  .replace(/T/, '_')
  .replace(/:/g, '-')
  .replace(/\.\d+Z$/, '');

const siteDir = path.join(__dirname, 'recordings', safeSiteName);
const recordingsDir = path.join(siteDir, runTimestamp);
const screenshotsDir = path.join(recordingsDir, 'screenshots');
const testImagesDir = path.join(recordingsDir, 'test-images');

if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(testImagesDir)) fs.mkdirSync(testImagesDir, { recursive: true });

const latestPointerPath = path.join(siteDir, 'latest.txt');
fs.writeFileSync(latestPointerPath, runTimestamp);

// Price log — captures prices at each phase for the price tracker
const priceLog = [];
const priceLogPath = path.join(recordingsDir, 'price-log.json');
// Signal file for Agent 2 (parallel price tracker) — written after listing creation
const signalFilePath = path.join(recordingsDir, 'listing-signal.json');

function logPrice(phase, label, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    phase,
    label,
    ...data,
  };
  priceLog.push(entry);
  fs.writeFileSync(priceLogPath, JSON.stringify(priceLog, null, 2));
  log('PRICE', `[${phase}] ${label}: ${JSON.stringify(data)}`);
}

// Helper to scrape dollar amounts from visible text on the page
async function scrapePrices(page, selectors) {
  const prices = {};
  for (const [key, fn] of Object.entries(selectors)) {
    try {
      prices[key] = await fn(page);
    } catch (e) {
      prices[key] = null;
    }
  }
  return prices;
}

console.log(`[RUN] ${runTimestamp}  →  ${recordingsDir}\n`);

// ============================================================================
// Backend Observer - Verifies listing in Supabase
// ============================================================================

const SUPABASE_URL = 'https://qcfifybkaddcoimjroca.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmlmeWJrYWRkY29pbWpyb2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU0MDUsImV4cCI6MjA3NTA1MTQwNX0.glGwHxds0PzVLF1Y8VBGX0jYz3zrLsgE9KAWWwkYms8';

async function querySupabaseListing(hostEmail, listingName) {
  log('OBSERVER', 'Querying Supabase for listing...');
  const url = new URL(`${SUPABASE_URL}/rest/v1/listing`);
  url.searchParams.set('select', '*');
  url.searchParams.set('order', 'id.desc');
  url.searchParams.set('limit', '10');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('OBSERVER', `Supabase query failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      log('OBSERVER', 'No listing found in Supabase');
      return null;
    }

    const record = data.find(r =>
      (r.name === listingName || r.Name === listingName) &&
      (r.host_email === hostEmail || r['Host email'] === hostEmail)
    );

    if (record) {
      log('OBSERVER', `Supabase listing found: id=${record.id}`);
      return record;
    }

    log('OBSERVER', 'Listing not found in recent records');
    return data[0];
  } catch (error) {
    log('OBSERVER', `Supabase query error: ${error.message}`);
    return null;
  }
}

function generateVerificationReport(supabaseRecord) {
  const expectedMap = {
    'Listing Name': { supabaseColumn: 'Name', expected: CONFIG.listing.title },
    'Type of Space': { supabaseColumn: 'Features - Type of Space', expected: CONFIG.listing.typeOfSpaceLabel, isForeignKey: true },
    'Bedrooms': { supabaseColumn: 'Features - Qty Bedrooms', expected: CONFIG.listing.bedroomsLabel },
    'Kitchen Type': { supabaseColumn: 'Kitchen Type', expected: CONFIG.listing.kitchenLabel },
    'Parking Type': { supabaseColumn: 'Features - Parking type', expected: CONFIG.listing.parkingLabel, isForeignKey: true },
    'Bathrooms': { supabaseColumn: 'Features - Qty Bathrooms', expected: Number(CONFIG.listing.bathroomsLabel) },
    'Rental Type': { supabaseColumn: 'rental type', expected: 'Nightly' },
    'Status': { supabaseColumn: 'Active', expected: false },
  };

  const report = {
    run: runTimestamp,
    timestamp: new Date().toISOString(),
    site: siteName,
    supabaseFound: !!supabaseRecord,
    supabaseListingId: supabaseRecord?.id || null,
    fields: [],
    summary: { total: 0, match: 0, mismatch: 0 },
  };

  for (const [label, spec] of Object.entries(expectedMap)) {
    const supabaseValue = supabaseRecord
      ? (supabaseRecord[spec.supabaseColumn] || supabaseRecord[spec.supabaseColumn.toLowerCase()] || supabaseRecord[spec.supabaseColumn.replace(/ /g, '_').toLowerCase()])
      : undefined;
    let isMatch;
    if (spec.isForeignKey) {
      isMatch = supabaseValue != null && supabaseValue !== '';
    } else {
      isMatch = compareValues(spec.expected, supabaseValue);
    }

    report.fields.push({
      field: label,
      expected: spec.expected,
      actual: supabaseValue,
      result: isMatch ? 'MATCH' : 'MISMATCH',
      isForeignKey: spec.isForeignKey || false,
    });
    report.summary.total++;
    if (isMatch) report.summary.match++;
    else report.summary.mismatch++;
  }

  return report;
}

function compareValues(expected, actual) {
  if (expected === actual) return true;
  if (expected == null && actual == null) return true;
  if (expected == null || actual == null) return false;
  if (typeof expected === 'number' && typeof actual === 'string') return expected === Number(actual);
  if (typeof expected === 'string' && typeof actual === 'number') return Number(expected) === actual;
  if (typeof expected === 'string' && typeof actual === 'string') return expected.trim() === actual.trim();
  return JSON.stringify(expected) === JSON.stringify(actual);
}

function printVerificationReport(report) {
  log('OBSERVER', '');
  log('OBSERVER', '======================================================');
  log('OBSERVER', '        BACKEND OBSERVER - VERIFICATION REPORT         ');
  log('OBSERVER', '======================================================');
  log('OBSERVER', '');
  log('OBSERVER', `Site:              ${report.site}`);
  log('OBSERVER', `Timestamp:         ${report.timestamp}`);
  log('OBSERVER', `Supabase Found:    ${report.supabaseFound ? 'YES' : 'NO'}`);
  log('OBSERVER', `Supabase ID:       ${report.supabaseListingId || 'N/A'}`);
  log('OBSERVER', '');

  for (const field of report.fields) {
    const icon = field.result === 'MATCH' ? '[OK]' : '[!!]';
    const fk = field.isForeignKey ? ' (FK)' : '';
    log('OBSERVER', `  ${icon} ${field.field}${fk}: expected="${field.expected}" actual="${field.actual}"`);
  }

  log('OBSERVER', '');
  log('OBSERVER', `Summary: ${report.summary.total} fields - ${report.summary.match} match, ${report.summary.mismatch} mismatch`);
  log('OBSERVER', '');
}

async function runBackendObserver() {
  log('OBSERVER', '========== BACKEND OBSERVER ==========');

  const supabaseRecord = await querySupabaseListing(
    CONFIG.host.email,
    CONFIG.listing.title
  );

  const report = generateVerificationReport(supabaseRecord);
  printVerificationReport(report);

  const fullReport = { ...report, rawData: { supabase: supabaseRecord } };
  const reportPath = path.join(recordingsDir, 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
  log('OBSERVER', `Full report saved to: ${reportPath}`);

  return report;
}

// ============================================================================
// Helper Functions
// ============================================================================

function log(step, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${step}] ${message}`);
}

async function screenshot(page, name) {
  const filepath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  log('SCREENSHOT', `Saved: ${name}.png`);
}

/**
 * Login as a specific user. Assumes we're on the homepage (signed out).
 * Uses exact codegen selectors from the Bubble auth modal.
 */
async function loginAs(page, email, password, label) {
  log(label, `Logging in as ${email}...`);

  await page.getByText('Sign In | Sign Up').click();
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Log into my account' }).click();
  await page.waitForTimeout(1500);

  await page.getByRole('textbox', { name: 'example@example.com*' }).click();
  await page.getByRole('textbox', { name: 'example@example.com*' }).fill(email);
  await page.getByRole('textbox', { name: 'Password *' }).click();
  await page.getByRole('textbox', { name: 'Password *' }).fill(password);

  await page.getByRole('button', { name: 'Login' }).click();
  log(label, 'Waiting for login to complete (15s)...');
  await page.waitForTimeout(15000);
}

/**
 * Sign out the current user. Handles overlay dismissal.
 * After sign-out, user lands on the homepage.
 */
async function signOut(page, label) {
  log(label, 'Signing out...');

  // Dismiss any blocking modals first (suggestions, confirmations, etc.)
  for (const dismissText of ['Ignore', 'Close', 'Cancel', 'No Thanks']) {
    try {
      const btn = page.getByRole('button', { name: dismissText });
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        await page.waitForTimeout(1000);
        log(label, `Dismissed modal via "${dismissText}"`);
      }
    } catch (e) { /* not found — continue */ }
  }

  // Dismiss any greyout overlays
  try {
    const greyout = page.locator('.greyout').first();
    if (await greyout.isVisible({ timeout: 1000 })) {
      await greyout.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) { /* no overlay */ }

  // Try to open avatar dropdown and click Sign Out
  let signedOut = false;

  // Strategy 1: Avatar dropdown → Sign Out
  try {
    await page.locator('.bubble-element.Image.cmaRhaT > img').click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    await page.getByText('Sign Out').click({ timeout: 5000 });
    signedOut = true;
  } catch (e) {
    log(label, 'Avatar dropdown failed — trying fallback...');
  }

  // Strategy 2: Navigate to homepage first, then avatar → Sign Out
  if (!signedOut) {
    try {
      await page.goto(CONFIG.baseURL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      await page.locator('.bubble-element.Image.cmaRhaT > img').click({ timeout: 10000 });
      await page.waitForTimeout(1500);
      await page.getByText('Sign Out').click({ timeout: 5000 });
      signedOut = true;
    } catch (e) {
      log(label, 'Homepage sign-out also failed — trying direct text click...');
    }
  }

  // Strategy 3: Just find "Sign Out" text anywhere on page
  if (!signedOut) {
    await page.getByText('Sign Out').click();
  }

  log(label, 'Waiting for sign-out to complete (10s)...');
  await page.waitForTimeout(10000);
}

/**
 * Extract the listing view URL from the manage listing page.
 * Uses clipboard interception via Copy Listing Link button.
 * Falls back to searching for view-split-lease links in the page.
 */
async function extractListingURL(page, label) {
  log(label, 'Extracting listing URL...');

  // Strategy 1: Intercept clipboard write and click "Copy Listing Link"
  await page.evaluate(() => {
    window.__clipboardText = '';
    const original = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = async (text) => {
      window.__clipboardText = text;
      return original(text);
    };
  });

  try {
    await page.getByText('Copy Listing Link').click();
    await page.waitForTimeout(2000);
    const clipboardURL = await page.evaluate(() => window.__clipboardText);
    if (clipboardURL && clipboardURL.includes('view-split-lease')) {
      log(label, `Got listing URL from clipboard: ${clipboardURL}`);
      return clipboardURL;
    }
  } catch (e) {
    log(label, 'Copy Listing Link click failed, trying fallback...');
  }

  // Strategy 2: Find a link with view-split-lease in the page
  try {
    const href = await page.locator('a[href*="view-split-lease"]').first().getAttribute('href');
    if (href) {
      const fullURL = href.startsWith('http') ? href : `${CONFIG.baseURL}${href}`;
      log(label, `Got listing URL from page link: ${fullURL}`);
      return fullURL;
    }
  } catch (e) {
    log(label, 'No view-split-lease link found in page');
  }

  // Strategy 3: Extract from current URL if it contains a listing identifier
  const currentURL = page.url();
  log(label, `Current URL: ${currentURL}`);

  // Try to find the listing ID in the URL path
  const idMatch = currentURL.match(/(\d{10,}x\d{10,})/);
  if (idMatch) {
    const listingURL = `${CONFIG.baseURL}/view-split-lease/${idMatch[1]}`;
    log(label, `Constructed listing URL from page URL: ${listingURL}`);
    return listingURL;
  }

  log(label, 'WARNING: Could not extract listing URL — proposal flow may fail');
  return null;
}

// ============================================================================
// PNG Test Image Generation
// ============================================================================

function generateTestImages(count) {
  const colors = [
    [255, 0, 0],   // red
    [0, 128, 0],   // green
    [0, 0, 255],   // blue
  ];
  const paths = [];

  for (let i = 0; i < count; i++) {
    const filePath = path.join(testImagesDir, `test-image-${i + 1}.png`);
    const [r, g, b] = colors[i % colors.length];
    const width = 10;
    const height = 10;

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;  ihdrData[9] = 2;
    ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
    const ihdr = createPNGChunk('IHDR', ihdrData);

    const rawRow = Buffer.alloc(1 + width * 3);
    rawRow[0] = 0;
    for (let x = 0; x < width; x++) {
      rawRow[1 + x * 3] = r;
      rawRow[2 + x * 3] = g;
      rawRow[3 + x * 3] = b;
    }
    const rawData = Buffer.concat(Array(height).fill(rawRow));
    const compressed = zlib.deflateSync(rawData);
    const idat = createPNGChunk('IDAT', compressed);
    const iend = createPNGChunk('IEND', Buffer.alloc(0));

    fs.writeFileSync(filePath, Buffer.concat([signature, ihdr, idat, iend]));
    paths.push(filePath);
    log('INIT', `Generated test image: ${filePath}`);
  }
  return paths;
}

function createPNGChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return ~crc;
}

// ============================================================================
// Main Script
// ============================================================================

(async () => {
  log('INIT', 'Launching browser with video recording...');

  const testImagePaths = generateTestImages(3);

  const browser = await chromium.launch({
    headless: false,
    slowMo: CONFIG.slowMo,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });

  // Grant clipboard permissions for extracting listing URL
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.actionTimeout);
  page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

  // Track the listing URL for the proposal flow
  let listingViewURL = listingURLFromCLI || null;

  try {
    // ====================================================================
    //  PHASE 1: HOST CREATES LISTING
    // ====================================================================
    if (skipToPhase) {
      log('PHASE 1', `========== SKIPPED (--skip-to=${skipToPhase}) ==========`);
      log('PHASE 1', `Using listing URL: ${listingViewURL}`);
      // Navigate to homepage so loginAs can find the Sign In button
      await page.goto(CONFIG.baseURL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
    } else {
    log('PHASE 1', '========== HOST CREATES LISTING ==========');

    // ========================================================================
    // STEP 1: Navigate to homepage
    // ========================================================================
    log('STEP 1', 'Navigating to homepage...');
    await page.goto(CONFIG.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await screenshot(page, '01-homepage');

    // ========================================================================
    // STEP 2: Host login
    // ========================================================================
    log('STEP 2', 'Host logging in...');
    await loginAs(page, CONFIG.host.email, CONFIG.host.password, 'STEP 2');
    await screenshot(page, '02-host-logged-in');

    // ========================================================================
    // STEP 3: Navigate to Host Dashboard
    // ========================================================================
    log('STEP 3', 'Opening avatar dropdown...');
    await page.locator('.bubble-element.Image.cmaRhaT > img').click();
    await page.waitForTimeout(1500);

    log('STEP 3', 'Clicking Listings & Proposals...');
    await page.getByText('Listings & Proposals').click();
    log('STEP 3', 'Waiting for dashboard to load (30s)...');
    await page.waitForTimeout(30000);
    await screenshot(page, '03-host-dashboard');

    // ========================================================================
    // STEP 4: Create New Listing modal
    // ========================================================================
    log('STEP 4', 'Clicking + Create New Listing...');
    await page.getByRole('button', { name: '+ Create New Listing' }).click();
    await page.waitForTimeout(3000);

    log('STEP 4', 'Filling listing title...');
    await page.locator('#idid').getByRole('textbox').click();
    await page.locator('#idid').getByRole('textbox').fill(CONFIG.listing.title);
    await page.waitForTimeout(500);

    log('STEP 4', 'Clicking Create New...');
    await page.getByRole('button', { name: 'Create New', exact: true }).click();
    log('STEP 4', 'Waiting for wizard to load (60s)...');
    await page.waitForTimeout(60000);
    await screenshot(page, '04-wizard-loaded');

    // ========================================================================
    // STEP 5: Section 1 - Address (Space Snapshot)
    // ========================================================================
    log('STEP 5', 'Filling Address section...');

    await page.getByRole('combobox').first().selectOption(BUBBLE_VALUES.address.typeOfSpace);
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(1).selectOption(BUBBLE_VALUES.address.bedrooms);
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(2).selectOption(BUBBLE_VALUES.address.kitchen);
    await page.waitForTimeout(500);
    // Index 3 = Beds (using default)
    await page.getByRole('combobox').nth(4).selectOption(BUBBLE_VALUES.address.parking);
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(5).selectOption(BUBBLE_VALUES.address.bathrooms);
    await page.waitForTimeout(500);

    log('STEP 5', 'Filling address with autocomplete...');
    await page.getByRole('textbox', { name: 'Main St.' }).click();
    await page.getByRole('textbox', { name: 'Main St.' }).fill(CONFIG.listing.address);
    await page.waitForTimeout(5000);

    try {
      const pacItem = page.locator('.pac-container .pac-item').first();
      await pacItem.waitFor({ state: 'visible', timeout: 8000 });
      await pacItem.click();
      log('STEP 5', 'Clicked autocomplete suggestion');
    } catch (e) {
      log('STEP 5', 'No autocomplete — pressing Enter');
      await page.getByRole('textbox', { name: 'Main St.' }).press('Enter');
    }
    await page.waitForTimeout(3000);
    await screenshot(page, '05-address-filled');

    log('STEP 5', 'Clicking Next...');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 6: Section 2 - Features
    // ========================================================================
    log('STEP 6', 'Filling Features section...');
    await page.getByText('load common').first().click();
    await page.waitForTimeout(2000);
    try {
      await page.getByText('load common', { exact: true }).click();
      await page.waitForTimeout(2000);
    } catch (e) { /* already loaded */ }

    await page.getByText('load template').first().click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(3000);

    log('STEP 6', 'Clicking Next...');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 7: Section 3 - Lease Styles
    // ========================================================================
    log('STEP 7', 'Selecting Nights-of-the-week...');
    await page.getByText('Nights-of-the-week').click();
    await page.waitForTimeout(2000);

    log('STEP 7', 'Clicking Next...');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 8: Section 4 - Pricing (defaults)
    // ========================================================================
    log('STEP 8', 'Pricing — using defaults...');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 9: Section 5 - Rules
    // ========================================================================
    log('STEP 9', 'Filling Rules section...');
    await page.getByRole('combobox').first().selectOption(BUBBLE_VALUES.rules.cancellationPolicy);
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(2).selectOption(BUBBLE_VALUES.rules.numberOfGuests);
    await page.waitForTimeout(500);
    await page.getByRole('combobox').nth(5).selectOption(BUBBLE_VALUES.rules.secureStorage);
    await page.waitForTimeout(500);

    log('STEP 9', 'Clicking Next...');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 10: Section 6 - Photos
    // ========================================================================
    log('STEP 10', 'Uploading photos...');
    await page.getByRole('button', { name: 'Upload Photos' }).click();
    await page.waitForTimeout(3000);

    const fileInput = page.locator('input[type="file"]').first();
    try {
      await fileInput.setInputFiles(testImagePaths);
    } catch (e) {
      await page.locator('.dz-default').click();
      await page.waitForTimeout(1000);
      await fileInput.setInputFiles(testImagePaths);
    }
    await page.waitForTimeout(5000);

    await page.getByRole('button', { name: 'Submit Images' }).click();
    await page.waitForTimeout(15000);

    // ========================================================================
    // STEP 11: Submit Listing
    // ========================================================================
    log('STEP 11', 'Submitting listing...');
    await page.getByRole('button', { name: 'Submit Listing' }).click();
    await page.waitForTimeout(10000);
    await screenshot(page, '06-listing-submitted');

    // ========================================================================
    // STEP 12: Manage Listing + Extract URL
    // ========================================================================
    log('STEP 12', 'Clicking Manage listing...');
    try {
      await page.getByRole('button', { name: 'Manage listing' }).click();
      await page.waitForTimeout(10000);
    } catch (e) {
      log('STEP 12', 'Manage listing button not found — continuing');
    }

    // Close the "Title and Description Suggestions" modal via the empty button
    // (reference script line 47: #EditListingDetails has an empty-text close button)
    log('STEP 12', 'Closing suggestions modal...');
    try {
      await page.locator('#EditListingDetails').getByRole('button').filter({ hasText: /^$/ }).click();
      log('STEP 12', 'Closed modal via #EditListingDetails button');
      await page.waitForTimeout(2000);
    } catch (e) {
      log('STEP 12', 'EditListingDetails button not found — continuing');
    }

    await screenshot(page, '07-manage-listing');

    // Extract listing URL via Copy Listing Link (reference line 48)
    log('STEP 12', 'Clicking Copy Listing Link...');
    try {
      await page.getByText('Copy Listing Link').click();
      await page.waitForTimeout(2000);
      // Read from clipboard
      const clipboardURL = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
      if (clipboardURL && clipboardURL.includes('view-split-lease')) {
        listingViewURL = clipboardURL;
        log('STEP 12', `Got listing URL from clipboard: ${listingViewURL}`);
      }
    } catch (e) {
      log('STEP 12', 'Copy Listing Link failed');
    }

    // Fallback: extract from page URL
    if (!listingViewURL) {
      const currentURL = page.url();
      const idMatch = currentURL.match(/(\d{10,}x\d{10,})/);
      if (idMatch) {
        listingViewURL = `${CONFIG.baseURL}/view-split-lease/${idMatch[1]}`;
        log('STEP 12', `Constructed listing URL from page URL: ${listingViewURL}`);
      }
    }
    log('STEP 12', `Listing URL: ${listingViewURL || 'NOT FOUND'}`);

    // Write signal file for Agent 2 (parallel price tracker)
    if (listingViewURL) {
      const listingId = listingViewURL.split('/').pop().split('?')[0];
      const signal = {
        listingId,
        listingURL: listingViewURL,
        listingTitle: CONFIG.listing.title,
        runDir: recordingsDir,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(signalFilePath, JSON.stringify(signal, null, 2));
      log('STEP 12', `Signal file written for price tracker: ${signalFilePath}`);
    }

    // ========================================================================
    // STEP 13: Host signs out (reference lines 49-50)
    // ========================================================================
    log('STEP 13', 'Signing out host...');
    await page.locator('.bubble-element.Image.cmaRhaT > img').click();
    await page.waitForTimeout(1500);
    await page.getByText('Sign Out').click();
    await page.waitForTimeout(10000);
    await screenshot(page, '08-host-signed-out');

    log('PHASE 1', '========== LISTING CREATION COMPLETE ==========');
    } // end of Phase 1 (else branch of skipToPhase check)

    // ====================================================================
    //  PHASE 2: GUEST CREATES PROPOSAL
    // ====================================================================
    log('PHASE 2', '========== GUEST CREATES PROPOSAL ==========');

    if (!listingViewURL) {
      log('PHASE 2', 'SKIPPING — no listing URL was captured');
    } else {
      // ======================================================================
      // STEP 14: Guest signs in (reference lines 52-61)
      // ======================================================================
      await loginAs(page, CONFIG.guest.email, CONFIG.guest.password, 'STEP 14');
      await screenshot(page, '09-guest-logged-in');

      // ======================================================================
      // STEP 15: Guest navigates to listing and creates proposal
      // (reference lines 62-66)
      // ======================================================================
      log('STEP 15', 'Navigating to listing page...');
      const listingPageURL = `${listingViewURL}?days-selected=${encodeURIComponent(CONFIG.proposal.daysSelected)}&duration=${encodeURIComponent(CONFIG.proposal.initialDuration)}`;
      await page.goto(listingPageURL, { waitUntil: 'domcontentloaded' });
      log('STEP 15', 'Waiting for listing page to load (30s)...');
      await page.waitForTimeout(30000);
      await screenshot(page, '10-listing-page');

      // PRICE CAPTURE: Listing page prices
      const listingPrices = await scrapePrices(page, {
        nightlyRate: async (p) => {
          const el = p.locator('text=/\\$[\\d,.]+\\s*\\/\\s*night/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
        fourWeekRent: async (p) => {
          const el = p.locator('text=/4-Week Rent.*\\$[\\d,.]+/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
      });
      logPrice('LISTING', 'Listing page prices', listingPrices);

      // Change duration to 16 weeks (reference line 64)
      log('STEP 15', 'Setting duration to 16 weeks...');
      try {
        await page.getByRole('combobox').selectOption(BUBBLE_VALUES.proposal.duration16Weeks);
        await page.waitForTimeout(2000);
      } catch (e) {
        log('STEP 15', 'Duration combobox not found — using URL default');
      }

      // Create proposal — price is dynamic (reference line 65)
      // force:true needed because Bubble animates the button ("not stable")
      log('STEP 15', 'Clicking Create Proposal...');
      await page.getByRole('button', { name: /Create Proposal/ }).click({ force: true });
      await page.waitForTimeout(5000);
      await screenshot(page, '11-proposal-created');

      // PRICE CAPTURE: Proposal modal prices
      const proposalPrices = await scrapePrices(page, {
        pricePerNight: async (p) => {
          const el = p.locator('text=/Price per night.*\\$[\\d,.]+/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
        totalReservation: async (p) => {
          const el = p.locator('text=/Total price for reservation.*\\$[\\d,.]+/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
        firstFourWeeks: async (p) => {
          const el = p.locator('text=/Price for the 1st 4 weeks.*\\$[\\d,.]+/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
      });
      logPrice('PROPOSAL', 'Proposal creation prices', proposalPrices);

      // Submit proposal (reference line 66)
      log('STEP 15', 'Clicking Submit Proposal...');
      await page.getByRole('button', { name: 'Submit Proposal' }).click();
      await page.waitForTimeout(10000);
      await screenshot(page, '12-proposal-submitted');

      // ======================================================================
      // STEP 16: Guest signs out (reference lines 67-71)
      // After proposal submit, page may be scrolled and overlays may be present.
      // Reference: click notification icons → dismiss greyout → avatar → Sign Out
      // ======================================================================
      log('STEP 16', 'Signing out guest...');
      // Scroll to top so avatar is in viewport
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
      // Dismiss notification icons if present (reference lines 67-68)
      try {
        const notifIcon = page.locator('.bubble-element.Icon.cvaAaIi12');
        if (await notifIcon.first().isVisible({ timeout: 3000 })) {
          await notifIcon.first().click();
          await page.waitForTimeout(500);
          // Click again if still visible (reference clicks twice)
          if (await notifIcon.first().isVisible({ timeout: 1000 })) {
            await notifIcon.first().click();
            await page.waitForTimeout(500);
          }
        }
      } catch (e) { /* no notification icon */ }
      // Dismiss greyout overlay if present (reference line 69)
      try {
        const greyout = page.locator('.greyout').first();
        if (await greyout.isVisible({ timeout: 3000 })) {
          await greyout.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) { /* no overlay */ }
      // Avatar → Sign Out (reference lines 70-71)
      // Avatar may be outside viewport after proposal submit — use JS click to bypass
      await page.locator('.bubble-element.Image.cmaRhaT > img').evaluate((el) => el.click());
      await page.waitForTimeout(1500);
      await page.getByText('Sign Out').click();
      await page.waitForTimeout(10000);
      await screenshot(page, '13-guest-signed-out');

      log('PHASE 2', '========== PROPOSAL CREATION COMPLETE ==========');

      // ==================================================================
      //  PHASE 3: HOST COUNTERS PROPOSAL
      // ==================================================================
      log('PHASE 3', '========== HOST COUNTERS PROPOSAL ==========');

      // ======================================================================
      // STEP 17: Host signs in (reference lines 74-83)
      // ======================================================================
      await loginAs(page, CONFIG.host.email, CONFIG.host.password, 'STEP 17');
      await screenshot(page, '14-host-logged-in-again');

      // ======================================================================
      // STEP 18: Host navigates to proposals (reference lines 84-87)
      // ======================================================================
      log('STEP 18', 'Opening avatar dropdown...');
      await page.locator('.bubble-element.Image.cmaRhaT > img').click();
      await page.waitForTimeout(1500);

      log('STEP 18', 'Clicking Listings & Proposals...');
      await page.getByText('Listings & Proposals').click();
      log('STEP 18', 'Waiting for dashboard (30s)...');
      await page.waitForTimeout(30000);
      await screenshot(page, '15-host-dashboard-proposals');

      // Click notification icon to open messages/notifications dropdown
      log('STEP 18', 'Clicking notification icon...');
      await page.locator('#letter-hover > img').click();
      await page.waitForTimeout(3000);

      // Click the notification related to our listing (codegen: dynamic text with listing title)
      // Match on "Related to: <listing title>" — the title is known from Phase 1
      const listingTitle = CONFIG.listing.title;
      log('STEP 18', `Looking for notification about "${listingTitle}"...`);
      await page.getByText(new RegExp(`Related to: ${listingTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)).first().click();
      await page.waitForTimeout(3000);

      // Click "View this proposal" button in the notification detail
      log('STEP 18', 'Clicking View this proposal...');
      await page.getByRole('button', { name: 'View this proposal' }).click();
      await page.waitForTimeout(15000);
      await screenshot(page, '16-proposal-page');

      // ======================================================================
      // STEP 19: Host reviews and modifies proposal (codegen lines 15-21)
      // ======================================================================
      log('STEP 19', 'Clicking Review / Modify...');
      await page.getByRole('button', { name: 'Review / Modify' }).click();
      await page.waitForTimeout(10000);
      await screenshot(page, '17-proposal-review');

      log('STEP 19', 'Clicking Edit Proposal Terms...');
      await page.getByText('Edit Proposal Terms (Nights,').click();
      await page.waitForTimeout(5000);

      log('STEP 19', 'Changing duration to 10 weeks...');
      await page.getByRole('combobox').nth(1).selectOption(BUBBLE_VALUES.proposal.duration10Weeks);
      await page.waitForTimeout(2000);
      await screenshot(page, '18-terms-edited');

      log('STEP 19', 'Clicking Update Proposal...');
      await page.getByRole('button', { name: 'Update Proposal' }).click();
      await page.waitForTimeout(3000);

      log('STEP 19', 'Confirming — Yes, Proceed...');
      await page.getByRole('button', { name: 'Yes, Proceed' }).click();
      await page.waitForTimeout(10000);
      await screenshot(page, '19-proposal-countered');

      // PRICE CAPTURE: Counter-offer prices (from the proposal summary modal)
      const counterPrices = await scrapePrices(page, {
        compensationPerNight: async (p) => {
          const el = p.locator('text=/Compensation per Night.*\\$[\\d,.]+/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
        duration: async (p) => {
          const el = p.locator('text=/Duration/i').first();
          const row = el.locator('..');
          return (await row.textContent({ timeout: 5000 })).trim();
        },
        total: async (p) => {
          const el = p.locator('text=/\\$[\\d,.]+\\s+Total/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
      });
      logPrice('COUNTER', 'Host counter-offer prices', counterPrices);

      // ======================================================================
      // STEP 20: Host signs out (reference lines 93-94)
      // After counter, a greyout overlay appears — click it, then Sign Out
      // ======================================================================
      log('STEP 20', 'Signing out host...');
      // After counter, a proposal summary modal appears — close it first
      try {
        // Try closing via X button on the modal
        const closeBtn = page.locator('button:has-text("×"), [class*="close"], .bubble-element.close-icon').first();
        if (await closeBtn.isVisible({ timeout: 3000 })) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) { /* no close button */ }
      // Dismiss greyout overlay if still present
      try {
        const greyout = page.locator('.greyout').first();
        if (await greyout.isVisible({ timeout: 3000 })) {
          await greyout.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) { /* no overlay */ }
      // Use JS click on avatar to bypass any remaining overlays
      await page.locator('.bubble-element.Image.cmaRhaT > img').evaluate((el) => el.click());
      await page.waitForTimeout(1500);
      await page.getByText('Sign Out').click();
      await page.waitForTimeout(10000);
      await screenshot(page, '20-host-signed-out-again');

      log('PHASE 3', '========== HOST COUNTER COMPLETE ==========');

      // ==================================================================
      //  PHASE 4: GUEST ACCEPTS HOST TERMS
      // ==================================================================
      log('PHASE 4', '========== GUEST ACCEPTS HOST TERMS ==========');

      // ======================================================================
      // STEP 21: Guest signs in (reference lines 95-107)
      // ======================================================================
      await loginAs(page, CONFIG.guest.email, CONFIG.guest.password, 'STEP 21');
      await screenshot(page, '21-guest-logged-in-again');

      // ======================================================================
      // STEP 22: Guest navigates to proposals and accepts
      // Reference line 108: click host name text, then "My Proposals"
      // The host's display name on Bubble is "Test" for rodtesthost2 account
      // ======================================================================
      log('STEP 22', 'Looking for host name or proposals link...');
      try {
        // Try clicking host name "Test" (reference used "Rod" — depends on account)
        await page.getByText('Test', { exact: true }).first().click();
        await page.waitForTimeout(3000);
      } catch (e) {
        log('STEP 22', '"Test" text not found — trying avatar...');
        await page.locator('.bubble-element.Image.cmaRhaT > img').click();
        await page.waitForTimeout(1500);
      }

      log('STEP 22', 'Clicking My Proposals...');
      await page.getByText('My Proposals').click();
      await page.waitForTimeout(15000);
      await screenshot(page, '22-guest-proposals');

      // PRICE CAPTURE: Guest view before acceptance
      const acceptancePrices = await scrapePrices(page, {
        nightlyRate: async (p) => {
          const el = p.locator('text=/\\$[\\d,.]+\\s*\\/\\s*night/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
        duration: async (p) => {
          const el = p.locator('text=/Duration/i').first();
          const row = el.locator('..');
          return (await row.textContent({ timeout: 5000 })).trim();
        },
        total: async (p) => {
          const el = p.locator('text=/\\$[\\d,.]+\\s+in total/i').first();
          return (await el.textContent({ timeout: 5000 })).trim();
        },
      });
      logPrice('ACCEPTANCE', 'Guest acceptance prices', acceptancePrices);

      // Accept host terms (reference lines 110-111)
      log('STEP 22', 'Clicking Accept Host Terms...');
      await page.getByRole('button', { name: 'Accept Host Terms' }).click();
      await page.waitForTimeout(3000);

      log('STEP 22', 'Confirming — Yes, Proceed...');
      await page.getByRole('button', { name: 'Yes, Proceed' }).click();
      await page.waitForTimeout(10000);
      await screenshot(page, '23-terms-accepted');

      log('PHASE 4', '========== GUEST ACCEPTANCE COMPLETE ==========');
    }

    // ====================================================================
    //  FINAL: Backend Verification
    // ====================================================================
    log('FINAL', 'Running Backend Observer...');
    await runBackendObserver();

    log('DONE', '==============================================');
    log('DONE', '  FULL FLOW COMPLETED SUCCESSFULLY');
    log('DONE', '==============================================');
    log('DONE', `Listing: "${CONFIG.listing.title}"`);
    log('DONE', `Listing URL: ${listingViewURL || 'N/A'}`);
    log('DONE', `Screenshots: ${screenshotsDir}`);
    log('DONE', `Video: ${recordingsDir}`);
    log('DONE', `Price Log: ${priceLogPath} (${priceLog.length} entries)`);

  } catch (error) {
    log('ERROR', `Script failed: ${error.message}`);
    await screenshot(page, 'ERROR-final-state').catch(() => {});
    console.error(error);
  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();
    if (videoPath) log('VIDEO', `Recording saved: ${videoPath}`);
  }
})();
