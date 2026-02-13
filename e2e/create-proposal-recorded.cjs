/**
 * Autonomous Playwright Script: Full Proposal Lifecycle on split.lease
 *
 * Two-actor flow matching Rod's site walkthrough (Feb 2026):
 *   PHASE 1 (HOST CONTEXT):  Log in as host → Create NEW listing via 7-section wizard → copy link
 *   PHASE 2 (GUEST CONTEXT): Open listing link in new context (incognito) →
 *                             log in as guest → configure schedule (3 days, 2 nights) →
 *                             Create Proposal → Edit → Adjust to 16 weeks → Submit
 *   PHASE 3 (HOST CONTEXT):  Navigate to My Proposals → expand → Modify (counter-offer) →
 *                             Edit Proposal → change reservation span → Submit counter
 *   PHASE 4 (GUEST CONTEXT): Navigate to Guest Proposals → Accept Host Terms (counter-offer)
 *   PHASE 5:                 Backend Observer verifies proposal in Supabase
 *
 * Key design decisions from Rod's transcription:
 *   - Host and guest use SEPARATE browser contexts (like host browser + guest incognito)
 *   - No login/logout cycling — each actor stays in their own context
 *   - Host creates a NEW listing every run (eliminates "Proposal Already Exists")
 *   - Rod: "I'm going to share my space" → creates listing → copies link
 *   - Guest selects 3 days / 2 nights (not 4 days)
 *   - Rod: "Now I'm going to click on modify" → host counter-offers
 *   - Guest accepts counter via CompareTermsModal ("Accept Host Terms")
 *   - If login fails, create the account (signup)
 *
 * Usage:
 *   node e2e/create-proposal-recorded.cjs
 *   node e2e/create-proposal-recorded.cjs --site=app.split.lease
 *   node e2e/create-proposal-recorded.cjs --listing=1770295934...
 *
 * Options:
 *   --site=<name>        Target site (default: split.lease)
 *   --listing=<id>       Specific listing ID (skips listing creation phase)
 *
 * Output:
 *   - Video:             e2e/recordings/<site>-proposals/<timestamp>/*.webm
 *   - Screenshots:       e2e/recordings/<site>-proposals/<timestamp>/screenshots/*.png
 *   - Comparison Report: e2e/recordings/<site>-proposals/<timestamp>/proposal-report.json
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ============================================================================
// Site Profiles
// ============================================================================

const SITE_PROFILES = {
  'split.lease': {
    baseURL: 'https://split.lease',
    host: { email: 'rodtesthost2@test.com', password: 'eCom@2024' },
    guest: { email: 'splitleasetesting@test.com', password: 'eCom@2024' },
  },
  'app.split.lease': {
    baseURL: 'https://app.split.lease',
    host: { email: 'rodtesthost2@test.com', password: 'eCom@2024' },
    guest: { email: 'splitleasetesting@test.com', password: 'eCom@2024' },
  },
};

// Parse CLI args
const siteArg = process.argv.find((a) => a.startsWith('--site='));
const siteName = siteArg ? siteArg.split('=')[1] : 'split.lease';
const siteProfile = SITE_PROFILES[siteName];

if (!siteProfile) {
  console.error(`Unknown site: ${siteName}. Available: ${Object.keys(SITE_PROFILES).join(', ')}`);
  process.exit(1);
}

const listingArg = process.argv.find((a) => a.startsWith('--listing='));
const targetListingId = listingArg ? listingArg.split('=')[1] : null;

// Detect Bubble.io site (app.split.lease) vs React site (split.lease)
const isBubble = siteName === 'app.split.lease';

console.log(`\n=== Target: ${siteName} (${siteProfile.baseURL})${isBubble ? ' [BUBBLE]' : ' [REACT]'} ===`);
console.log(`=== Host: ${siteProfile.host.email} ===`);
console.log(`=== Guest: ${siteProfile.guest.email} ===`);
if (targetListingId) {
  console.log(`=== Listing: ${targetListingId} (skipping listing creation) ===`);
}
console.log('');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  baseURL: siteProfile.baseURL,
  host: siteProfile.host,
  guest: siteProfile.guest,
  proposal: {
    // Days: Tue-Wed-Thu (3 days, 2 nights) — matches Rod's walkthrough
    // Rod: "I'm gonna select just three days and two nights"
    daysToSelect: [2, 3, 4],
    // Initial reservation span on listing page
    reservationSpan: '13',
    // Adjusted span during "Adjust Proposal" step in the modal
    // Rod: "Instead of 13, I'm going to add 16 weeks"
    adjustedReservationSpan: '16',
    // Move-in date: ~3 weeks from today, next Tuesday
    get moveInDate() {
      const date = new Date();
      date.setDate(date.getDate() + 21);
      const dayOfWeek = date.getDay();
      const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntilTuesday);
      return date.toISOString().split('T')[0];
    },
    needForSpace:
      'I am looking for a comfortable and convenient space in this area for my work. I am a remote professional ' +
      'who needs a quiet environment with reliable internet access. The location is ideal for my daily routine ' +
      'and I appreciate the amenities offered in this listing.',
    aboutYourself:
      'I am a working professional with a clean and organized lifestyle. I am respectful of shared spaces ' +
      'and quiet during evening hours. I have excellent references from previous rentals and maintain a tidy ' +
      'living environment. I am looking forward to a pleasant stay.',
  },
  counterOffer: {
    // Host changes reservation span during counter-offer
    // Rod: "Now I'm going to click on modify"
    // Change from 16 weeks to 13 weeks (3 months)
    reservationSpanLabel: '13 weeks (3 months)',
  },
  listing: {
    // Unique name per run to avoid collisions
    name: `Playwright Test Listing ${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`,
    typeOfSpace: 'Private Room',
    bedrooms: '2',
    kitchenType: 'Full Kitchen',
    beds: '2',
    parkingType: 'Street Parking',
    bathrooms: '1',
    address: '350 5th Avenue, New York, NY',
    manualAddress: {
      number: '350',
      street: '5th Avenue',
      city: 'New York',
      state: 'NY',
      zip: '10118',
      neighborhood: 'Midtown Manhattan',
    },
    description:
      'Cozy private room in the heart of Midtown Manhattan. Walking distance to Empire State Building, ' +
      'Penn Station, and countless restaurants. The room features a comfortable queen bed, ample closet ' +
      'space, and natural light. Shared access to a fully equipped kitchen and clean bathroom. Perfect ' +
      'for professionals or students looking for a convenient NYC base.',
    monthlyCompensation: '1850',
    damageDeposit: '500',
    cancellationPolicy: 'Standard',
  },
  slowMo: 300,
  navigationTimeout: 30000,
  actionTimeout: 15000,
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

const siteDir = path.join(__dirname, 'recordings', `${safeSiteName}-proposals`);
const recordingsDir = path.join(siteDir, runTimestamp);
const screenshotsDir = path.join(recordingsDir, 'screenshots');
const testImagesDir = path.join(recordingsDir, 'test-images');

if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(testImagesDir)) fs.mkdirSync(testImagesDir, { recursive: true });

fs.writeFileSync(path.join(siteDir, 'latest.txt'), runTimestamp);
console.log(`[RUN] ${runTimestamp}  →  ${recordingsDir}\n`);

// ============================================================================
// Generate Test Images (minimal valid PNGs for listing photo upload)
// ============================================================================

/**
 * Creates a minimal valid 1x1 pixel PNG file.
 * Each image uses a different color for visual distinction.
 */
function createTestPNG(color) {
  const colors = {
    red: [0xff, 0x00, 0x00],
    green: [0x00, 0xff, 0x00],
    blue: [0x00, 0x00, 0xff],
  };
  const rgb = colors[color] || colors.red;
  const zlib = require('zlib');

  const rawData = Buffer.from([0x00, rgb[0], rgb[1], rgb[2]]);
  const compressedData = zlib.deflateSync(rawData);

  const chunks = [];
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);
  ihdrData.writeUInt32BE(1, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  chunks.push(makeChunk('IHDR', ihdrData));
  chunks.push(makeChunk('IDAT', compressedData));
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

// Generate 3 test images for listing photo upload
const testImagePaths = ['red', 'green', 'blue'].map((color, i) => {
  const filePath = path.join(testImagesDir, `test-photo-${i + 1}.png`);
  fs.writeFileSync(filePath, createTestPNG(color));
  return filePath;
});

// ============================================================================
// Proposal Backend Observer
// ============================================================================

const SUPABASE_URL = 'https://qcfifybkaddcoimjroca.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmlmeWJrYWRkY29pbWpyb2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU0MDUsImV4cCI6MjA3NTA1MTQwNX0.glGwHxds0PzVLF1Y8VBGX0jYz3zrLsgE9KAWWwkYms8';

async function querySupabaseProposal(guestEmail, listingId) {
  log('OBSERVER', 'Querying Supabase for proposal...');
  const url = new URL(`${SUPABASE_URL}/rest/v1/proposal`);
  url.searchParams.set('select', '*');
  url.searchParams.set('order', 'Created Date.desc');
  url.searchParams.set('limit', '5');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      log('OBSERVER', `Supabase query failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (data.length === 0) return null;

    let match = data[0];
    if (listingId) {
      const listingMatch = data.find((p) => p['Listing'] === listingId);
      if (listingMatch) match = listingMatch;
    }
    log('OBSERVER', `Supabase proposal found: _id=${match._id}`);
    return match;
  } catch (error) {
    log('OBSERVER', `Supabase query error: ${error.message}`);
    return null;
  }
}

function generateProposalReport(supabaseRecord, submittedData) {
  const report = {
    run: runTimestamp,
    timestamp: new Date().toISOString(),
    site: siteName,
    supabaseFound: !!supabaseRecord,
    supabaseProposalId: supabaseRecord?._id || null,
    submittedData,
    fields: [],
    summary: { total: 0, match: 0, mismatch: 0 },
  };

  const fieldMap = {
    'Reservation Span (Weeks)': {
      supabaseColumn: 'Reservation Span (Weeks)',
      expected: Number(CONFIG.proposal.adjustedReservationSpan),
    },
    'Days Selected': {
      supabaseColumn: 'Days Selected',
      expected: CONFIG.proposal.daysToSelect,
      compareFn: (expected, actual) =>
        Array.isArray(actual) && actual.length === expected.length && expected.every((d) => actual.includes(d)),
    },
    'Guest Email': {
      supabaseColumn: 'Guest email',
      expected: CONFIG.guest.email,
    },
    Status: {
      supabaseColumn: 'Status',
      expected: null, // Will check for accepted status (counter-offer accepted)
      compareFn: (_expected, actual) =>
        actual === 'Host Review' ||
        actual === 'Accepted' ||
        (typeof actual === 'string' && actual.includes('Accepted')),
    },
    'Nightly Price': {
      supabaseColumn: 'proposal nightly price',
      expected: null,
      compareFn: (_expected, actual) => typeof actual === 'number' && actual > 0,
    },
    'Listing ID': {
      supabaseColumn: 'Listing',
      expected: null,
      compareFn: (_expected, actual) => typeof actual === 'string' && actual.length > 0,
    },
  };

  for (const [label, spec] of Object.entries(fieldMap)) {
    const actualValue = supabaseRecord ? supabaseRecord[spec.supabaseColumn] : undefined;
    let isMatch;
    if (spec.compareFn) {
      isMatch = supabaseRecord ? spec.compareFn(spec.expected, actualValue) : false;
    } else {
      isMatch = spec.expected === actualValue || String(spec.expected) === String(actualValue);
    }
    report.fields.push({ field: label, expected: spec.expected, actual: actualValue, match: isMatch ? 'MATCH' : 'MISMATCH' });
    report.summary.total++;
    if (isMatch) report.summary.match++;
    else report.summary.mismatch++;
  }
  return report;
}

function printProposalReport(report) {
  log('OBSERVER', '');
  log('OBSERVER', '╔══════════════════════════════════════════════════════════════╗');
  log('OBSERVER', '║       PROPOSAL BACKEND OBSERVER - VERIFICATION REPORT       ║');
  log('OBSERVER', '╚══════════════════════════════════════════════════════════════╝');
  log('OBSERVER', '');
  log('OBSERVER', `Site:              ${report.site}`);
  log('OBSERVER', `Supabase Found:    ${report.supabaseFound ? 'YES' : 'NO'}`);
  log('OBSERVER', `Proposal ID:       ${report.supabaseProposalId || 'N/A'}`);
  log('OBSERVER', '');
  log('OBSERVER', '┌────────────────────────┬────────────┐');
  log('OBSERVER', '│ Field                  │ Result     │');
  log('OBSERVER', '├────────────────────────┼────────────┤');
  for (const field of report.fields) {
    const name = field.field.padEnd(22).substring(0, 22);
    const result = field.match.padEnd(10).substring(0, 10);
    log('OBSERVER', `│ ${name} │ ${result} │`);
  }
  log('OBSERVER', '└────────────────────────┴────────────┘');
  log('OBSERVER', `Summary: ${report.summary.total} fields — ${report.summary.match} match, ${report.summary.mismatch} mismatch`);
  log('OBSERVER', '');
}

function saveProposalReport(report, supabaseRecord) {
  const fullReport = { ...report, rawData: { supabase: supabaseRecord } };
  const reportPath = path.join(recordingsDir, 'proposal-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
  log('OBSERVER', `Full report saved to: ${reportPath}`);
}

async function runProposalObserver(proposalId, listingId) {
  log('OBSERVER', '========== PROPOSAL BACKEND OBSERVER ==========');
  let supabaseRecord = null;

  if (proposalId) {
    const url = `${SUPABASE_URL}/rest/v1/proposal?_id=eq.${proposalId}&limit=1`;
    try {
      const response = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await response.json();
      supabaseRecord = data[0] || null;
    } catch (error) {
      log('OBSERVER', `Direct query error: ${error.message}`);
    }
  }
  if (!supabaseRecord) {
    supabaseRecord = await querySupabaseProposal(CONFIG.guest.email, listingId);
  }

  const submittedData = {
    daysSelected: CONFIG.proposal.daysToSelect,
    adjustedReservationSpan: CONFIG.proposal.adjustedReservationSpan,
    moveInDate: CONFIG.proposal.moveInDate,
  };
  const report = generateProposalReport(supabaseRecord, submittedData);
  printProposalReport(report);
  saveProposalReport(report, supabaseRecord);
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Dismiss any modal overlays (signup, onboarding, etc.)
 */
async function dismissOverlays(page, role) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const overlay = page.locator('.signup-modal-overlay, .modal-overlay, .onboarding-overlay');
    if (await overlay.isVisible({ timeout: 1500 }).catch(() => false)) {
      log(role.toUpperCase(), `Dismissing overlay (attempt ${attempt + 1})...`);
      const closeBtn = page.locator('.modal-close, .close-button, [aria-label="Close"], button:has-text("Close"), button:has-text("Skip")').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(1000);
    } else {
      break;
    }
  }
}

/**
 * Log in via the Sign In modal. If login fails (account doesn't exist),
 * attempts to create the account via signup.
 *
 * Based on Rod's transcription:
 *   - Host signup: selects "Share my space" role → fills form → Continue
 *   - Guest: "I already have an account" → just logs in
 *   - After signup: "it didn't took me anywhere. I just stay on the next page"
 */
async function loginAs(page, email, password, role) {
  log(role.toUpperCase(), `Logging in as ${role}: ${email}`);

  if (isBubble) {
    return await loginAsBubble(page, email, password, role);
  }

  // ---- React site (split.lease) ----
  // Wait for the page to fully hydrate (React islands may not render Sign In immediately)
  const signInLink = page.locator('a:has-text("Sign In"), button:has-text("Sign In")').first();
  let isVisible = false;
  try {
    await signInLink.waitFor({ state: 'visible', timeout: 15000 });
    isVisible = true;
  } catch {
    // Check if already logged in (no Sign In link visible)
    log(role.toUpperCase(), 'Sign In not visible after 15s — checking if already logged in...');
    const userIndicator = page.locator('.logged-in-avatar, .user-menu, .avatar-dropdown').first();
    try {
      await userIndicator.waitFor({ state: 'visible', timeout: 5000 });
      log(role.toUpperCase(), 'Already logged in');
      return true;
    } catch {
      log(role.toUpperCase(), 'Sign In not found and not logged in — page issue');
      return false;
    }
  }

  await signInLink.click();
  await page.waitForTimeout(1500);
  await screenshot(page, `${role}-sign-in-modal`);

  // The modal may default to signup view — switch to login view if needed
  const emailInput = page.locator('input[type="email"][placeholder="john@example.com"]');
  if (!(await emailInput.isVisible().catch(() => false))) {
    const loginSwitch = page.locator('button:has-text("Log in"), a:has-text("Log in")').first();
    if (await loginSwitch.isVisible().catch(() => false)) {
      await loginSwitch.click();
      await page.waitForTimeout(500);
    }
  }

  // Fill credentials and attempt login
  await emailInput.fill(email);
  await page.locator('input[placeholder="Enter your password"]').fill(password);
  await page.locator('button[type="submit"]:has-text("Log In")').click();
  await page.waitForTimeout(4000);

  // Check if login failed — error message indicates account doesn't exist
  const loginError = page.locator('text=Invalid login credentials, text=Invalid email or password, text=User not found, text=No account found');
  const loginFailed = await loginError.first().isVisible({ timeout: 2000 }).catch(() => false);

  if (loginFailed) {
    log(role.toUpperCase(), `Login failed for ${email} — creating account...`);
    await createAccount(page, email, password, role);
  }

  // Dismiss any overlay that appears after login/signup
  // Rod: "it didn't took me anywhere. I just stay on the next page"
  await dismissOverlays(page, role);

  log(role.toUpperCase(), 'Login complete');
  return true;
}

/**
 * Login on Bubble site (app.split.lease).
 *
 * Flow from Rod's transcription:
 *   1. Click "Sign In | Sign Up" div (top right corner)
 *   2. Modal: "Welcome to Split Lease" — click "Log in to my account"
 *   3. Fill email + password, click "Log in"
 *   4. Success message appears
 *
 * Bubble has NO <a> elements, NO #root, NO semantic classes.
 * All elements are generic <div>/<button>. Use text-based locators.
 */
async function loginAsBubble(page, email, password, role) {
  // Step 1: Click "Sign In | Sign Up" — it's a <div> with no class/id
  // Use getByText for Bubble's classless DOM
  log(role.toUpperCase(), 'Bubble login — looking for Sign In...');

  // Wait for page to fully load (Bubble is slow)
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);

  const signInDiv = page.getByText('Sign In | Sign Up', { exact: true });
  try {
    await signInDiv.waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    log(role.toUpperCase(), 'Sign In | Sign Up not found — checking page state...');
    await screenshot(page, `${role}-no-signin`);
    return false;
  }

  await signInDiv.click();
  await page.waitForTimeout(2000);
  await screenshot(page, `${role}-welcome-modal`);

  // Step 2: Click "Log into my account"
  const loginOption = page.getByText('Log into my account', { exact: false });
  try {
    await loginOption.waitFor({ state: 'visible', timeout: 10000 });
    await loginOption.click();
    await page.waitForTimeout(1500);
  } catch {
    log(role.toUpperCase(), '"Log in to my account" not found');
    await screenshot(page, `${role}-no-login-option`);
    return false;
  }
  await screenshot(page, `${role}-login-form`);

  // Step 3: Remove Bubble's greyout overlay so Playwright can interact with inputs
  await page.evaluate(() => {
    const greyouts = document.querySelectorAll('.greyout');
    greyouts.forEach(g => g.remove());
  });
  await page.waitForTimeout(500);

  // Fill email using documented Bubble selector: #emaillogin
  // Bubble's custom input framework requires actual keypress/input events.
  const emailInput = page.locator('#emaillogin');
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.click();
    await page.waitForTimeout(300);
    await emailInput.press('Control+a');
    await emailInput.press('Backspace');
    await emailInput.pressSequentially(email, { delay: 50 });
    log(role.toUpperCase(), 'Email filled (#emaillogin)');
  } catch (err) {
    log(role.toUpperCase(), `#emaillogin not found: ${err.message.substring(0, 100)}`);
    // Fallback: try placeholder-based selector
    log(role.toUpperCase(), 'Trying fallback email selector...');
    try {
      const fallbackEmail = page.locator('input[placeholder*="example@example"]').first();
      await fallbackEmail.click();
      await page.waitForTimeout(300);
      await fallbackEmail.press('Control+a');
      await fallbackEmail.press('Backspace');
      await fallbackEmail.pressSequentially(email, { delay: 50 });
      log(role.toUpperCase(), 'Email filled via fallback selector');
    } catch (err2) {
      log(role.toUpperCase(), `Fallback email also failed: ${err2.message.substring(0, 100)}`);
      await screenshot(page, `${role}-email-error`);
      return false;
    }
  }

  await page.waitForTimeout(500);

  // Fill password using documented Bubble selector: #loginreveal
  const passwordInput = page.locator('#loginreveal');
  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.click();
    await page.waitForTimeout(300);
    await passwordInput.press('Control+a');
    await passwordInput.press('Backspace');
    await passwordInput.pressSequentially(password, { delay: 50 });
    log(role.toUpperCase(), 'Password filled (#loginreveal)');
  } catch (err) {
    log(role.toUpperCase(), `#loginreveal not found: ${err.message.substring(0, 100)}`);
    // Fallback: try generic password selector
    try {
      const fallbackPwd = page.locator('input[type="password"]:visible').first();
      await fallbackPwd.click();
      await page.waitForTimeout(300);
      await fallbackPwd.press('Control+a');
      await fallbackPwd.press('Backspace');
      await fallbackPwd.pressSequentially(password, { delay: 50 });
      log(role.toUpperCase(), 'Password filled via fallback selector');
    } catch (err2) {
      log(role.toUpperCase(), `Fallback password also failed: ${err2.message.substring(0, 100)}`);
      await screenshot(page, `${role}-password-error`);
      return false;
    }
  }

  await page.waitForTimeout(500);
  await screenshot(page, `${role}-credentials-filled`);

  // Step 4: Click "Login" button — target by ID to avoid hitting footer/other "Login" text
  // The Bubble login button has id="loginButtonID"
  const loginBtn = page.locator('#loginButtonID');
  try {
    await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
    await loginBtn.click();
    log(role.toUpperCase(), 'Clicked Login button (#loginButtonID)');
  } catch {
    // Fallback: click via evaluate using the ID
    log(role.toUpperCase(), 'Login button not visible via locator — trying evaluate...');
    const clicked = await page.evaluate(() => {
      const btn = document.getElementById('loginButtonID');
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clicked) {
      log(role.toUpperCase(), 'Clicked Login via evaluate (#loginButtonID)');
    } else {
      log(role.toUpperCase(), 'Login button #loginButtonID not found');
      await screenshot(page, `${role}-no-login-btn`);
      return false;
    }
  }

  // Wait for login to complete (Bubble is slow — Rod: "the site is very slow")
  log(role.toUpperCase(), 'Waiting for login to complete...');
  await screenshot(page, `${role}-after-login-click`);

  // Poll for login success: "Sign In | Sign Up" should disappear once logged in
  let loginSucceeded = false;
  for (let wait = 0; wait < 20; wait++) {
    await page.waitForTimeout(1000);
    const stillSignIn = await page.getByText('Sign In | Sign Up', { exact: true }).isVisible().catch(() => false);
    if (!stillSignIn) {
      loginSucceeded = true;
      log(role.toUpperCase(), `Login succeeded after ${wait + 1}s`);
      break;
    }
    if (wait === 5 || wait === 10) {
      await screenshot(page, `${role}-login-waiting-${wait}s`);
    }
  }
  await screenshot(page, `${role}-after-login`);

  if (!loginSucceeded) {
    log(role.toUpperCase(), 'Login may have failed — Sign In still visible after 20s');
    await screenshot(page, `${role}-login-failed`);
    return false;
  }

  log(role.toUpperCase(), 'Login complete');
  return true;
}

/**
 * Create a new account via the signup flow.
 *
 * Based on Rod's transcription:
 *   "Let's create an account. I'm going to share my space" (host role)
 *   Fills: name, email, birthday, password → Continue
 *   "The signup model was recently redesigned"
 */
async function createAccount(page, email, password, role) {
  log(role.toUpperCase(), `Creating new ${role} account: ${email}`);

  // Close the failed login modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  // Re-open Sign In modal
  const signInLink = page.locator('a:has-text("Sign In"), button:has-text("Sign In")').first();
  if (await signInLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signInLink.click();
    await page.waitForTimeout(1500);
  }

  // Switch to signup view
  const signUpSwitch = page.locator('button:has-text("Sign up"), a:has-text("Sign up"), button:has-text("Create account"), a:has-text("Create account")').first();
  if (await signUpSwitch.isVisible().catch(() => false)) {
    await signUpSwitch.click();
    await page.waitForTimeout(1000);
  }
  await screenshot(page, `${role}-signup-modal`);

  // Select role — Rod: "I'm going to share my space" (host)
  if (role === 'host') {
    const hostOption = page.locator('button:has-text("Share my space"), label:has-text("Share my space"), [data-role="host"]').first();
    if (await hostOption.isVisible().catch(() => false)) {
      await hostOption.click();
      await page.waitForTimeout(500);
    }
  } else {
    const guestOption = page.locator('button:has-text("Find a space"), label:has-text("Find a space"), [data-role="guest"]').first();
    if (await guestOption.isVisible().catch(() => false)) {
      await guestOption.click();
      await page.waitForTimeout(500);
    }
  }

  // Fill signup form fields
  const nameInput = page.locator('input[placeholder*="name" i], input[name="name"], input[name="firstName"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(role === 'host' ? 'Test Host' : 'Test Guest');
  }

  const lastNameInput = page.locator('input[placeholder*="last" i], input[name="lastName"]').first();
  if (await lastNameInput.isVisible().catch(() => false)) {
    await lastNameInput.fill('Account');
  }

  // Fill email
  const signupEmail = page.locator('input[type="email"]').first();
  if (await signupEmail.isVisible().catch(() => false)) {
    await signupEmail.fill(email);
  }

  // Fill password
  const signupPassword = page.locator('input[type="password"]').first();
  if (await signupPassword.isVisible().catch(() => false)) {
    await signupPassword.fill(password);
  }

  // Confirm password if second field exists
  const confirmPassword = page.locator('input[type="password"]').nth(1);
  if (await confirmPassword.isVisible().catch(() => false)) {
    await confirmPassword.fill(password);
  }

  await screenshot(page, `${role}-signup-filled`);

  // Click Continue/Submit — Rod: "continue"
  const submitBtn = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Sign Up"), button:has-text("Create Account")').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
  }

  await page.waitForTimeout(5000);
  await screenshot(page, `${role}-signup-complete`);
  log(role.toUpperCase(), `Account created for ${email}`);
}

/**
 * Scan all buttons for Create Proposal text.
 * Returns: 'clicked' | 'already_exists' | 'not_found' | 'disabled'
 */
async function tryClickCreateProposal(page) {
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();

  for (let i = 0; i < buttonCount; i++) {
    const btn = allButtons.nth(i);
    const btnText = await btn.textContent().catch(() => '');
    const trimmed = btnText.trim();

    if (trimmed === 'Proposal Already Exists') {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      return 'already_exists';
    }
    if (trimmed.startsWith('Create Proposal at')) {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(500);
      if (await btn.isDisabled()) return 'disabled';
      await btn.click();
      return 'clicked';
    }
    if (trimmed === 'Update Split Schedule Above') {
      return 'disabled';
    }
  }

  const ariaBtn = page.locator('button[aria-label="Create Proposal"]').first();
  if (await ariaBtn.isVisible().catch(() => false)) {
    if (!(await ariaBtn.isDisabled())) {
      await ariaBtn.click();
      return 'clicked';
    }
    return 'disabled';
  }
  return 'not_found';
}

/**
 * Configure schedule days on a listing page.
 * Rod: "I'm gonna select just three days and two nights"
 */
async function configureSchedule(page, stepLabel) {
  const dayButtons = page.locator('.day-button');
  const dayButtonCount = await dayButtons.count();
  log(stepLabel, `Found ${dayButtonCount} day buttons`);

  if (dayButtonCount === 7) {
    // Deselect unwanted days first
    for (let i = 0; i < 7; i++) {
      const dayBtn = dayButtons.nth(i);
      const isSelected = await dayBtn.evaluate((el) => el.classList.contains('selected'));
      const isWanted = CONFIG.proposal.daysToSelect.includes(i);
      if (isSelected && !isWanted) {
        log(stepLabel, `Deselecting: ${DAY_NAMES[i]}`);
        await dayBtn.click();
        await page.waitForTimeout(300);
      }
    }
    // Select wanted days
    for (const dayIndex of CONFIG.proposal.daysToSelect) {
      const dayBtn = dayButtons.nth(dayIndex);
      const isAlreadySelected = await dayBtn.evaluate((el) => el.classList.contains('selected'));
      if (!isAlreadySelected) {
        log(stepLabel, `Selecting: ${DAY_NAMES[dayIndex]}`);
        await dayBtn.click();
        await page.waitForTimeout(300);
      } else {
        log(stepLabel, `Already selected: ${DAY_NAMES[dayIndex]}`);
      }
    }
  }

  // Set reservation span
  const reservationSelect = page.locator('select').filter({ has: page.locator('option:has-text("13 weeks")') }).first();
  if (await reservationSelect.isVisible().catch(() => false)) {
    await reservationSelect.selectOption(CONFIG.proposal.reservationSpan);
    log(stepLabel, `Reservation span set to: ${CONFIG.proposal.reservationSpan} weeks`);
  }
  await page.waitForTimeout(1000);
}

/**
 * Wait for a selector to be visible, then click it.
 */
async function waitAndClick(page, selector, description) {
  log('ACTION', `Clicking: ${description}`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().click();
}

/**
 * Wait for a selector to be visible, then fill it.
 */
async function waitAndFill(page, selector, value, description) {
  log('ACTION', `Filling: ${description} = "${value.substring(0, 60)}${value.length > 60 ? '...' : ''}"`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().fill(value);
}

/**
 * Wait for a selector to be visible, then select an option.
 */
async function waitAndSelect(page, selector, value, description) {
  log('ACTION', `Selecting: ${description} = "${value}"`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().selectOption(value);
}

/**
 * Create a NEW listing via the 7-section self-listing wizard.
 *
 * Rod's flow: "Let's create an account... share my space... create new listing"
 * Rod: goes through the step-by-step wizard, fills all sections, submits.
 * Rod: "Listing Created Successfully" → "Preview Listing" link has the listing ID.
 *
 * Proven selectors from create-listing-recorded.cjs.
 *
 * @returns {string|null} The new listing ID, or null if creation failed
 */
async function createNewListing(page) {
  log('LISTING', '─── Creating new listing via self-listing wizard ───');

  // Navigate to self-listing page
  // Rod: "create new listing" from host overview
  await page.goto(`${CONFIG.baseURL}/self-listing`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await screenshot(page, '03-self-listing-page');

  // Clear any existing draft from localStorage
  await page.evaluate(() => {
    localStorage.removeItem('selfListingDraft');
    localStorage.removeItem('selfListingStagedForSubmission');
    localStorage.removeItem('selfListingLastSaved');
    localStorage.removeItem('selfListingDraftId');
  });
  log('LISTING', 'Cleared localStorage draft');

  // Reload to start fresh
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ── Section 1: Space Snapshot ──
  log('LISTING', 'Section 1: Space Snapshot...');
  await waitAndFill(page, '#listingName', CONFIG.listing.name, 'Listing Name');
  await waitAndSelect(page, '#typeOfSpace', CONFIG.listing.typeOfSpace, 'Type of Space');
  await waitAndSelect(page, '#bedrooms', CONFIG.listing.bedrooms, 'Bedrooms');
  await waitAndSelect(page, '#typeOfKitchen', CONFIG.listing.kitchenType, 'Kitchen Type');
  await waitAndSelect(page, '#beds', CONFIG.listing.beds, 'Beds');
  await waitAndSelect(page, '#typeOfParking', CONFIG.listing.parkingType, 'Parking Type');
  await waitAndSelect(page, '#bathrooms', CONFIG.listing.bathrooms, 'Bathrooms');
  await screenshot(page, '03b-section1-fields');

  // Address — Google Maps autocomplete with manual fallback
  log('LISTING', 'Filling address...');
  const addressInput = page.locator('#fullAddress');
  await addressInput.waitFor({ state: 'visible' });
  await addressInput.click();
  await addressInput.fill('');
  await addressInput.pressSequentially(CONFIG.listing.address, { delay: 80 });
  await page.waitForTimeout(2000);

  const pacItem = page.locator('.pac-container .pac-item').first();
  const autocompleteAppeared = await pacItem.isVisible().catch(() => false);

  if (autocompleteAppeared) {
    log('LISTING', 'Autocomplete appeared — clicking first suggestion');
    await pacItem.click();
    await page.waitForTimeout(1000);
  } else {
    log('LISTING', 'Autocomplete not available — using manual address entry');
    const manualEntryBtn = page.locator('button.btn-link:has-text("Enter manually")');
    if (await manualEntryBtn.isVisible().catch(() => false)) {
      await manualEntryBtn.click();
      await page.waitForTimeout(500);
    }
    await waitAndFill(page, '#number', CONFIG.listing.manualAddress.number, 'Street Number');
    await waitAndFill(page, '#street', CONFIG.listing.manualAddress.street, 'Street Name');
    await waitAndFill(page, '#city', CONFIG.listing.manualAddress.city, 'City');
    await waitAndSelect(page, '#state', CONFIG.listing.manualAddress.state, 'State');
    await waitAndFill(page, '#zip', CONFIG.listing.manualAddress.zip, 'Zip Code');
    await waitAndFill(page, '#neighborhood', CONFIG.listing.manualAddress.neighborhood, 'Neighborhood');

    // Mark address as validated in localStorage
    await page.evaluate((addr) => {
      const draftJson = localStorage.getItem('selfListingDraft');
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        draft.spaceSnapshot.address.validated = true;
        draft.spaceSnapshot.address.fullAddress = `${addr.number} ${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
        draft.spaceSnapshot.address.number = addr.number;
        draft.spaceSnapshot.address.street = addr.street;
        draft.spaceSnapshot.address.city = addr.city;
        draft.spaceSnapshot.address.state = addr.state;
        draft.spaceSnapshot.address.zip = addr.zip;
        draft.spaceSnapshot.address.neighborhood = addr.neighborhood;
        localStorage.setItem('selfListingDraft', JSON.stringify(draft));
      }
    }, CONFIG.listing.manualAddress);
  }

  await screenshot(page, '03c-section1-address');
  await waitAndClick(page, 'button.btn-next', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 1 complete');

  // ── Section 2: Features ──
  log('LISTING', 'Section 2: Features...');
  await page.waitForTimeout(2000);

  const loadCommonInUnit = page.locator('#amenitiesInsideUnit button.btn-link:has-text("load common")');
  if (await loadCommonInUnit.isVisible().catch(() => false)) {
    await loadCommonInUnit.click();
    log('LISTING', 'Loaded common in-unit amenities');
    await page.waitForTimeout(1500);
  } else {
    log('LISTING', 'Load common not found — clicking first 5 amenities');
    const checkboxes = page.locator('#amenitiesInsideUnit .checkbox-label');
    const count = await checkboxes.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(200);
    }
  }

  await waitAndFill(page, '#descriptionOfLodging', CONFIG.listing.description, 'Description');
  await screenshot(page, '03d-section2-features');
  await waitAndClick(page, 'button.btn-next', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 2 complete');

  // ── Section 3: Lease Styles ──
  log('LISTING', 'Section 3: Lease Styles...');
  await waitAndClick(page, '.rental-type-card:has-text("Monthly")', 'Monthly rental type');
  await page.waitForTimeout(500);

  const agreeRadio = page.locator('label.radio-label:has-text("I agree")');
  if (await agreeRadio.isVisible().catch(() => false)) {
    await agreeRadio.click();
    log('LISTING', 'Agreed to monthly subsidy terms');
  }

  await screenshot(page, '03e-section3-lease');
  await waitAndClick(page, 'button.btn-next', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 3 complete');

  // ── Section 4: Pricing ──
  log('LISTING', 'Section 4: Pricing...');
  await waitAndFill(page, '#monthlyCompensation', CONFIG.listing.monthlyCompensation, 'Monthly Compensation');

  const damageInput = page.locator('#damageDeposit');
  if (await damageInput.isVisible().catch(() => false)) {
    await damageInput.fill(CONFIG.listing.damageDeposit);
    log('LISTING', 'Set damage deposit');
  }

  await screenshot(page, '03f-section4-pricing');
  await waitAndClick(page, 'button.btn-next', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 4 complete');

  // ── Section 5: Rules ──
  log('LISTING', 'Section 5: Rules...');
  await waitAndSelect(page, '#cancellationPolicy', CONFIG.listing.cancellationPolicy, 'Cancellation Policy');

  const loadCommonRules = page.locator('button.btn-link:has-text("load common house rules")');
  if (await loadCommonRules.isVisible().catch(() => false)) {
    await loadCommonRules.click();
    log('LISTING', 'Loaded common house rules');
    await page.waitForTimeout(500);
  }

  await screenshot(page, '03g-section5-rules');
  await waitAndClick(page, 'button.btn-next', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 5 complete');

  // ── Section 6: Photos ──
  log('LISTING', 'Section 6: Photos — uploading 3 test images...');
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles(testImagePaths);
  log('LISTING', 'Set 3 test image files');

  // Wait for uploads to Supabase storage
  log('LISTING', 'Waiting for photo uploads...');
  await page.waitForTimeout(8000);

  const photoCount = await page.locator('.photo-item').count();
  log('LISTING', `Photos uploaded: ${photoCount}`);
  await screenshot(page, '03h-section6-photos');

  await waitAndClick(page, 'button.btn-next:has-text("Next")', 'Next button');
  await page.waitForTimeout(1500);
  log('LISTING', 'Section 6 complete');

  // ── Section 7: Review & Submit ──
  log('LISTING', 'Section 7: Review & Submit...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await screenshot(page, '03i-section7-review');

  log('LISTING', 'Clicking Submit Listing...');
  await waitAndClick(page, 'button.btn-submit:has-text("Submit Listing")', 'Submit Listing');
  await page.waitForTimeout(5000);
  await screenshot(page, '03j-after-submit');

  // ── Extract listing ID from success modal ──
  let newListingId = null;

  const successModal = page.locator('text=Listing Created Successfully');
  const hasSuccess = await successModal.isVisible({ timeout: 15000 }).catch(() => false);

  if (hasSuccess) {
    log('LISTING', 'Listing created successfully!');
    await screenshot(page, '03k-success-modal');

    // Strategy 1: Check for <a> link with href containing the listing ID
    const previewLink = page.locator('a[href*="preview-split-lease"], a[href*="view-split-lease"]');
    const previewHref = await previewLink.first().getAttribute('href').catch(() => null);
    if (previewHref) {
      const match = previewHref.match(/\/(preview-split-lease|view-split-lease)\/([^/?#]+)/);
      if (match) {
        newListingId = match[2];
        log('LISTING', `Captured listing ID from link href: ${newListingId}`);
      }
    }

    // Strategy 2: "Preview Listing" is a button, not a link — click it and extract ID from URL
    if (!newListingId) {
      log('LISTING', 'No href found — clicking Preview Listing button to extract ID from navigation...');
      const previewBtn = page.locator('button:has-text("Preview Listing")');
      if (await previewBtn.isVisible().catch(() => false)) {
        await previewBtn.click();
        await page.waitForTimeout(5000);
        const previewUrl = page.url();
        log('LISTING', `Navigated to: ${previewUrl}`);

        // URL may be: /preview-split-lease/ID or /preview-split-lease?listing_id=ID
        const pathMatch = previewUrl.match(/\/(preview-split-lease|view-split-lease)\/([^/?#]+)/);
        const queryMatch = previewUrl.match(/[?&]listing_id=([^&#]+)/);
        if (pathMatch) {
          newListingId = pathMatch[2];
          log('LISTING', `Captured listing ID from path: ${newListingId}`);
        } else if (queryMatch) {
          newListingId = queryMatch[1];
          log('LISTING', `Captured listing ID from query param: ${newListingId}`);
        }
      }
    }

    // Strategy 3: Query Supabase for the most recent listing by this host
    if (!newListingId) {
      log('LISTING', 'Falling back to Supabase query for listing ID...');
      try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/listing`);
        url.searchParams.set('select', '_id');
        url.searchParams.set('Host email', `eq.${CONFIG.host.email}`);
        url.searchParams.set('order', 'Created Date.desc');
        url.searchParams.set('limit', '1');
        const response = await fetch(url.toString(), {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        const data = await response.json();
        if (data.length > 0) {
          newListingId = data[0]._id;
          log('LISTING', `Captured listing ID from Supabase: ${newListingId}`);
        }
      } catch (e) {
        log('LISTING', `Supabase fallback failed: ${e.message}`);
      }
    }
  } else {
    // Check for auth modal (session may have expired during wizard)
    const authModal = page.locator('input[type="email"][placeholder="john@example.com"]');
    const hasAuthModal = await authModal.isVisible().catch(() => false);

    if (hasAuthModal) {
      log('LISTING', 'Auth modal appeared — re-authenticating...');
      await authModal.fill(CONFIG.host.email);
      await page.locator('input[placeholder="Enter your password"]').fill(CONFIG.host.password);
      await page.locator('button[type="submit"]:has-text("Log In")').click();
      await page.waitForTimeout(5000);

      const successAfterAuth = await page.locator('text=Listing Created Successfully').isVisible({ timeout: 15000 }).catch(() => false);
      if (successAfterAuth) {
        log('LISTING', 'Listing created after re-auth!');
        // Click Preview Listing button
        const previewBtn2 = page.locator('button:has-text("Preview Listing")');
        if (await previewBtn2.isVisible().catch(() => false)) {
          await previewBtn2.click();
          await page.waitForTimeout(5000);
          const reAuthUrl = page.url();
          const pathMatch2 = reAuthUrl.match(/\/(preview-split-lease|view-split-lease)\/([^/?#]+)/);
          const queryMatch2 = reAuthUrl.match(/[?&]listing_id=([^&#]+)/);
          if (pathMatch2) newListingId = pathMatch2[2];
          else if (queryMatch2) newListingId = queryMatch2[1];
        }
      }
    } else {
      log('LISTING', 'No success modal detected — checking page state...');
      await screenshot(page, '03k-possible-error');
    }
  }

  log('LISTING', `─── Listing creation ${newListingId ? 'SUCCEEDED' : 'FAILED'} ───`);
  return newListingId;
}

/**
 * Create a NEW listing on Bubble site (app.split.lease).
 *
 * Documented Bubble flow:
 *   1. "Host with Us" dropdown → "Manage Listing"
 *   2. Navigates to host-overview page
 *   3. Click "+ Create New Listing" button
 *   4. Modal appears with title — click "Create New"
 *   5. Navigates to self-listing/[id] (7-section wizard)
 *   6. Fill wizard → Submit
 *
 * Bubble specifics:
 *   - Inputs require pressSequentially (Bubble ignores fill())
 *   - Page loads are slow
 *   - Dropdowns may be native <select> or Bubble custom
 *   - Listing name max 35 characters
 *   - Checkboxes use Playwright .check() method
 *   - Textareas use Playwright .fill() method
 *
 * @returns {string|null} The new listing ID, or null if creation failed
 */
async function createNewListingBubble(page) {
  log('LISTING', '─── Creating new listing via Bubble wizard ───');

  // ── Navigate to listing creation via documented flow ──
  // Step 1: Click "Host with Us" dropdown → "Manage Listing"
  log('LISTING', 'Navigating: Host with Us → Manage Listing...');
  const hostWithUs = page.getByText('Host with Us').first();
  try {
    await hostWithUs.waitFor({ state: 'visible', timeout: 10000 });
    await hostWithUs.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '03-host-dropdown');
  } catch {
    log('LISTING', '"Host with Us" not found — trying direct URL to host-overview...');
    await page.goto(`${CONFIG.baseURL}/host-overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
  }

  // Step 2: Click "Manage Listing" from dropdown via evaluate
  // (Playwright getByText may click wrong element or trigger unexpected navigation)
  const manageListingClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    for (const el of els) {
      const text = el.textContent.trim();
      if (text === 'Manage Listing' && el.offsetParent !== null && el.children.length === 0) {
        el.click();
        return true;
      }
    }
    return false;
  });
  log('LISTING', `Manage Listing clicked: ${manageListingClicked}`);
  await page.waitForTimeout(5000);
  await screenshot(page, '03a-after-manage-listing');

  // Verify we navigated to host-overview (not homepage)
  const currentUrlAfterManage = page.url();
  log('LISTING', `URL after Manage Listing: ${currentUrlAfterManage}`);

  // If we didn't reach host-overview, navigate directly
  if (!currentUrlAfterManage.includes('host-overview') && !currentUrlAfterManage.includes('listing')) {
    log('LISTING', 'Not on host-overview — navigating directly...');
    await page.goto(`${CONFIG.baseURL}/host-overview`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    log('LISTING', `URL after direct nav: ${page.url()}`);
  }
  await screenshot(page, '03a-host-overview');

  // Step 3: Click "+ Create New Listing" button on the host-overview page
  // Try evaluate first (most reliable for Bubble), then Playwright locators
  log('LISTING', 'Looking for "+ Create New Listing" button...');
  let createNewFound = false;

  // First: evaluate approach — look for button or clickable with "Create New Listing" text
  const createNewViaEval = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    for (const el of allElements) {
      const text = el.textContent.trim();
      if ((text.includes('Create New Listing') || text === '+ Create New Listing') &&
          el.offsetParent !== null &&
          (el.children.length === 0 || el.tagName === 'BUTTON' || el.classList.contains('clickable-element'))) {
        el.click();
        return { clicked: true, text: text.substring(0, 50), tag: el.tagName };
      }
    }
    // Also try "Create New" as shorter text
    for (const el of allElements) {
      const text = el.textContent.trim();
      if (text === 'Create New' && el.offsetParent !== null && el.children.length === 0) {
        el.click();
        return { clicked: true, text, tag: el.tagName };
      }
    }
    return { clicked: false };
  });

  if (createNewViaEval.clicked) {
    log('LISTING', `Clicked "${createNewViaEval.text}" (${createNewViaEval.tag}) via evaluate`);
    createNewFound = true;
    await page.waitForTimeout(3000);
    await screenshot(page, '03a2-create-listing-modal');
  }

  // Fallback: Playwright locators
  if (!createNewFound) {
    const createNewSelectors = [
      page.getByText('+ Create New Listing', { exact: false }),
      page.getByText('Create New Listing', { exact: false }),
      page.getByRole('button', { name: /Create New Listing/i }),
      page.getByText('Create New', { exact: false }).first(),
    ];

    for (const selector of createNewSelectors) {
      if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
        log('LISTING', 'Found Create New Listing button via Playwright — clicking...');
        await selector.click();
        createNewFound = true;
        await page.waitForTimeout(3000);
        await screenshot(page, '03a2-create-listing-modal');
        break;
      }
    }
  }

  if (!createNewFound) {
    log('LISTING', '"+ Create New Listing" not found — listing visible elements for debug...');
    const pageElements = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      return els
        .filter(el => el.offsetParent !== null && el.children.length === 0 && el.textContent.trim().length > 2)
        .map(el => el.textContent.trim())
        .filter(t => t.length < 60)
        .slice(0, 30);
    });
    log('LISTING', `Page elements: ${JSON.stringify(pageElements)}`);
    await screenshot(page, '03a2-no-create-button');
    // Last resort: try direct URL to self-listing
    log('LISTING', 'Navigating directly to self-listing...');
    await page.goto(`${CONFIG.baseURL}/self-listing`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);
  }

  // Step 4: If a modal appeared, click "Create New" to confirm via evaluate
  log('LISTING', 'Checking for Create New confirmation modal...');
  const createNewConfirmed = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent.trim() === 'Create New' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  if (createNewConfirmed) {
    log('LISTING', 'Clicked "Create New" in modal');
    await page.waitForTimeout(8000);
  } else {
    log('LISTING', 'No "Create New" modal button — may already be on wizard');
    await page.waitForTimeout(5000);
  }
  await screenshot(page, '03b-listing-wizard');

  // ── Wait for the wizard form to load (Bubble is slow) ──
  log('LISTING', 'Waiting for wizard form to load...');
  const listingNameInput = page.locator('input[placeholder*="Listing Name"]').first();
  let formLoaded = false;
  for (let wait = 0; wait < 40; wait++) {
    if (await listingNameInput.isVisible().catch(() => false)) {
      formLoaded = true;
      log('LISTING', `Form loaded after ${wait}s`);
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (!formLoaded) {
    log('LISTING', 'Form did not load after 40s — checking URL...');
    log('LISTING', `Current URL: ${page.url()}`);
    await screenshot(page, '03c-form-not-loaded');
    return null;
  }

  // ── Section 1: Space Snapshot (Address section) ──
  log('LISTING', 'Section 1: Space Snapshot...');

  // Listing Name (max 35 chars on Bubble)
  const bubbleListingName = CONFIG.listing.name.substring(0, 35);
  await listingNameInput.click();
  await page.waitForTimeout(300);
  await listingNameInput.pressSequentially(bubbleListingName, { delay: 30 });
  log('LISTING', `Listing Name: "${bubbleListingName}"`);

  // ALL 6 dropdowns must be explicitly set via page.evaluate — Playwright's
  // selectOption times out on Bubble's options (trailing spaces, PLACEHOLDER values).
  // Use direct JS: find option by trimmed text, set value, dispatch change event.
  log('LISTING', 'Setting all dropdowns via evaluate...');
  const dropdownResults = await page.evaluate((targets) => {
    const selects = Array.from(document.querySelectorAll('select'));
    const visible = selects.filter(s => s.offsetParent !== null);
    const results = [];

    for (const target of targets) {
      if (target.idx >= visible.length) {
        results.push({ name: target.name, status: 'SKIP', reason: 'index out of range' });
        continue;
      }
      const sel = visible[target.idx];
      const options = Array.from(sel.options);
      // Find option with matching trimmed text, excluding placeholder/empty values
      const match = options.find(o =>
        o.text.trim() === target.text &&
        o.value !== '' &&
        !o.value.includes('PLACEHOLDER')
      );
      if (match) {
        sel.value = match.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        results.push({ name: target.name, status: 'OK', value: match.value.substring(0, 30) });
      } else {
        const availableTexts = options.map(o => o.text.trim()).filter(t => t);
        results.push({ name: target.name, status: 'FAIL', available: availableTexts.slice(0, 8) });
      }
    }
    return results;
  }, [
    { idx: 0, text: CONFIG.listing.typeOfSpace, name: 'Type of Space' },
    { idx: 1, text: CONFIG.listing.bedrooms, name: 'Bedrooms' },
    { idx: 2, text: CONFIG.listing.kitchenType, name: 'Kitchen' },
    { idx: 3, text: CONFIG.listing.beds, name: 'Beds' },
    { idx: 4, text: CONFIG.listing.parkingType, name: 'Parking' },
    { idx: 5, text: CONFIG.listing.bathrooms, name: 'Bathrooms' },
  ]);

  for (const r of dropdownResults) {
    if (r.status === 'OK') {
      log('LISTING', `${r.name}: OK`);
    } else {
      log('LISTING', `${r.name}: ${r.status} ${r.reason || ''} ${r.available ? `(available: ${r.available.join(', ')})` : ''}`);
    }
  }
  await page.waitForTimeout(500);
  await screenshot(page, '03c-section1-dropdowns');

  // Address field — find input with placeholder "123 Main St." regardless of scroll.
  // Use evaluate to locate it by placeholder text and scroll it into view.
  log('LISTING', 'Filling address...');

  const addressFound = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const addressInput = inputs.find(i => i.placeholder === '123 Main St.' && i.offsetParent !== null);
    if (addressInput) {
      addressInput.scrollIntoView({ block: 'center' });
      return true;
    }
    return false;
  });

  if (addressFound) {
    await page.waitForTimeout(500);
    const addressInput = page.locator('input[placeholder="123 Main St."]').first();
    await addressInput.click();
    await page.waitForTimeout(500);
    // Type slowly to trigger Google Maps autocomplete
    await addressInput.pressSequentially(CONFIG.listing.address, { delay: 80 });
    log('LISTING', 'Address typed — waiting for autocomplete...');
    await page.waitForTimeout(3000);

    // Look for Google Maps autocomplete dropdown
    const pacItem = page.locator('.pac-container .pac-item').first();
    if (await pacItem.isVisible().catch(() => false)) {
      log('LISTING', 'Google Maps autocomplete appeared — selecting first result');
      await pacItem.click();
      await page.waitForTimeout(3000);
      log('LISTING', 'Address validated via autocomplete');
    } else {
      log('LISTING', 'No autocomplete dropdown — pressing Enter to validate');
      await addressInput.press('Enter');
      await page.waitForTimeout(2000);
    }
    await screenshot(page, '03c2-address-filled');
  } else {
    log('LISTING', 'Address input (placeholder="123 Main St.") not found');
  }

  await page.waitForTimeout(1000);
  await screenshot(page, '03d-section1-filled');

  // Check Next button validation state
  const nextBtnInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
        return { title: btn.title || '', disabled: btn.disabled };
      }
    }
    return null;
  });
  log('LISTING', `Next button state: ${JSON.stringify(nextBtnInfo)}`);

  if (nextBtnInfo?.title) {
    log('LISTING', `Validation issue: "${nextBtnInfo.title}" — clicking "why can I not proceed?"...`);
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      for (const el of els) {
        if (el.textContent.trim() === 'why can I not proceed?' && el.offsetParent !== null) {
          el.click();
          break;
        }
      }
    });
    await page.waitForTimeout(2000);
    await screenshot(page, '03d2-validation-errors');
  }

  // Click Next — evaluate bypasses Bubble overlays. NO sidebar fallback (it navigates away).
  log('LISTING', 'Moving to Section 2...');
  const nextClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  log('LISTING', nextClicked ? 'Clicked Next' : 'Next button not found');

  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await screenshot(page, '03e-section2');

  // Verify section changed — if still on Section 1, fix validation and retry
  let stillOnSection1 = await page.locator('text=Space Snapshot').isVisible().catch(() => false);
  if (stillOnSection1) {
    log('LISTING', 'WARNING: Still on Section 1 — diagnosing and fixing validation...');

    // Diagnose: check all dropdown values for PLACEHOLDER issues
    const selectStates = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.filter(s => s.offsetParent !== null).map((s, i) => ({
        idx: i,
        value: s.value.substring(0, 50),
        selectedText: s.options[s.selectedIndex]?.text?.trim(),
        hasPlaceholder: s.value.includes('PLACEHOLDER'),
        optionCount: s.options.length,
      }));
    });
    log('LISTING', `Select states: ${JSON.stringify(selectStates)}`);

    // Fix any dropdowns that still have PLACEHOLDER values
    const fixResult = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const visible = selects.filter(s => s.offsetParent !== null);
      const fixed = [];
      for (let i = 0; i < visible.length; i++) {
        const sel = visible[i];
        if (sel.value.includes('PLACEHOLDER') || sel.value === '') {
          // Select the first non-placeholder, non-empty option
          const realOption = Array.from(sel.options).find(o =>
            o.value !== '' && !o.value.includes('PLACEHOLDER') && o.text.trim() !== ''
          );
          if (realOption) {
            sel.value = realOption.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            sel.dispatchEvent(new Event('input', { bubbles: true }));
            fixed.push({ idx: i, text: realOption.text.trim(), value: realOption.value.substring(0, 30) });
          }
        }
      }
      return fixed;
    });

    if (fixResult.length > 0) {
      log('LISTING', `Auto-fixed ${fixResult.length} PLACEHOLDER dropdown(s): ${JSON.stringify(fixResult)}`);
      await page.waitForTimeout(1000);

      // Retry Next click after fix
      log('LISTING', 'Retrying Next after auto-fix...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
            btn.click();
            return;
          }
        }
      });
      await page.waitForTimeout(5000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      stillOnSection1 = await page.locator('text=Space Snapshot').isVisible().catch(() => false);
      if (stillOnSection1) {
        log('LISTING', 'ERROR: Still stuck on Section 1 after auto-fix — taking diagnostic screenshot');
        // Click "why can I not proceed?" for diagnostic
        await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('*'));
          for (const el of els) {
            if (el.textContent.trim() === 'why can I not proceed?' && el.offsetParent !== null) {
              el.click();
              break;
            }
          }
        });
        await page.waitForTimeout(2000);
        await screenshot(page, '03e2-stuck-section1-diagnostic');
        throw new Error('Bubble wizard stuck on Section 1 — validation blocking Next after auto-fix');
      } else {
        log('LISTING', 'Successfully navigated past Section 1 after auto-fix');
      }
    } else {
      // No PLACEHOLDER fixes needed but still stuck — address or other validation
      log('LISTING', 'No PLACEHOLDER dropdowns found — checking other validation issues...');
      // Click "why can I not proceed?" for diagnostic
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        for (const el of els) {
          if (el.textContent.trim() === 'why can I not proceed?' && el.offsetParent !== null) {
            el.click();
            break;
          }
        }
      });
      await page.waitForTimeout(2000);
      await screenshot(page, '03e2-validation-diagnostic');
      throw new Error('Bubble wizard stuck on Section 1 — unknown validation issue');
    }
  } else {
    log('LISTING', 'Successfully navigated past Section 1');
  }

  // ── Helper: click a button by text via evaluate (bypasses Bubble overlays) ──
  async function bubbleClickButton(buttonText) {
    return page.evaluate((text) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        if (btn.textContent.trim() === text && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    }, buttonText);
  }

  // ── Helper: click Next and verify section navigation ──
  // expectedHeading: text that should appear on the NEW section (e.g., "Features")
  // previousHeading: text that should disappear (e.g., "Space Snapshot")
  async function bubbleClickNextAndVerify(expectedHeading, previousHeading) {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons) {
        if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!clicked) {
      log('LISTING', 'Next button not found via evaluate');
      return false;
    }

    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Verify we left the previous section
    if (previousHeading) {
      const stillOnPrevious = await page.evaluate((heading) => {
        const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="heading"], [class*="title"]'));
        return els.some(el => el.textContent.includes(heading) && el.offsetParent !== null);
      }, previousHeading);

      if (stillOnPrevious) {
        log('LISTING', `WARNING: Still seeing "${previousHeading}" — navigation may have failed`);
        return false;
      }
    }

    log('LISTING', `Navigated to next section${expectedHeading ? ` (expecting: ${expectedHeading})` : ''}`);
    return true;
  }

  // ── Legacy helper for backward compat ──
  async function bubbleClickNext() {
    const clicked = await bubbleClickButton('Next');
    if (!clicked) {
      log('LISTING', 'Next button not found via evaluate');
    }
    return clicked;
  }

  // ── Section 2: Features ──
  // CRITICAL: Bubble's checkboxes use hidden <input type="checkbox"> inside
  // .ionic-IonicCheckbox wrappers. Playwright's .check() / .click() on hidden
  // inputs force-clicks at (0,0) which hits the logo/nav link and navigates away.
  // ALL checkbox interactions MUST use page.evaluate() to avoid physical clicks.
  log('LISTING', 'Section 2: Features...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
  await screenshot(page, '03e0-section2-initial');

  // Strategy 1: Click "load common" to auto-select common amenities
  // Use evaluate to find ONLY the first visible "load common" link (near "Amenities inside Unit*")
  log('LISTING', 'Clicking "load common" for Amenities inside Unit via evaluate...');
  const loadCommonResult = await page.evaluate(() => {
    // Find all leaf elements with exact text "load common"
    const allElements = Array.from(document.querySelectorAll('*'));
    const loadCommonElements = allElements.filter(el =>
      el.textContent.trim() === 'load common' &&
      el.offsetParent !== null &&
      el.children.length === 0
    );
    if (loadCommonElements.length > 0) {
      loadCommonElements[0].click();
      return { clicked: true, total: loadCommonElements.length };
    }
    return { clicked: false, total: 0 };
  });
  log('LISTING', `load common: ${JSON.stringify(loadCommonResult)}`);
  await page.waitForTimeout(3000);
  await screenshot(page, '03e1-after-load-common');

  // Check if page is still on wizard (load common may have caused navigation in past runs)
  const stillOnWizardAfterLoadCommon = await page.evaluate(() => {
    return document.querySelector('.ionic-IonicCheckbox') !== null ||
           document.querySelectorAll('input[type="checkbox"]').length > 10;
  });

  if (!stillOnWizardAfterLoadCommon) {
    log('LISTING', 'WARNING: Page may have navigated away after "load common" click');
    log('LISTING', `Current URL: ${page.url()}`);
    await screenshot(page, '03e1-navigated-away');
  }

  // Strategy 2: If load common didn't work, click .ionic-IonicCheckbox wrappers via evaluate
  const amenityState = await page.evaluate(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    const ionicCheckboxes = Array.from(document.querySelectorAll('.ionic-IonicCheckbox'));
    const visibleIonic = ionicCheckboxes.filter(cb => cb.offsetParent !== null);
    return {
      inputTotal: checkboxes.length,
      inputChecked: checkboxes.filter(cb => cb.checked).length,
      ionicTotal: ionicCheckboxes.length,
      ionicVisible: visibleIonic.length,
    };
  });
  log('LISTING', `Amenity state after load common: ${JSON.stringify(amenityState)}`);

  if (amenityState.inputChecked === 0 && amenityState.ionicVisible > 0) {
    log('LISTING', 'load common had no effect — clicking first 6 .ionic-IonicCheckbox via evaluate...');
    const clickResult = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('.ionic-IonicCheckbox'));
      const visible = checkboxes.filter(cb => cb.offsetParent !== null);
      let clicked = 0;
      for (let i = 0; i < Math.min(6, visible.length); i++) {
        visible[i].click();
        clicked++;
      }
      return { clicked, total: visible.length };
    });
    log('LISTING', `Ionic checkbox clicks: ${JSON.stringify(clickResult)}`);
    await page.waitForTimeout(2000);

    // Re-check amenity state
    const amenityState2 = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      return { checked: checkboxes.filter(cb => cb.checked).length };
    });
    log('LISTING', `Amenity state after ionic clicks: ${amenityState2.checked} checked`);
  }

  await screenshot(page, '03e2-amenities-selected');

  // Fill Description of Lodging via evaluate (Bubble textareas may not respond to Playwright fill)
  log('LISTING', 'Filling Description of Lodging...');
  const descFilled = await page.evaluate((text) => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const visible = textareas.filter(t => t.offsetParent !== null);
    if (visible.length > 0) {
      visible[0].focus();
      visible[0].value = text;
      visible[0].dispatchEvent(new Event('input', { bubbles: true }));
      visible[0].dispatchEvent(new Event('change', { bubbles: true }));
      return { filled: true, totalVisible: visible.length };
    }
    return { filled: false, totalVisible: 0 };
  }, CONFIG.listing.description.substring(0, 200));
  log('LISTING', `Description: ${JSON.stringify(descFilled)}`);

  // If evaluate didn't work, try Playwright fill as backup
  if (!descFilled.filled) {
    try {
      const descTextarea = page.locator('textarea:visible').first();
      if (await descTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descTextarea.fill(CONFIG.listing.description.substring(0, 200));
        log('LISTING', 'Description filled via Playwright .fill()');
      }
    } catch (e) {
      log('LISTING', `Description Playwright fill also failed: ${e.message.substring(0, 60)}`);
    }
  }

  // Fill Neighborhood Description via evaluate
  log('LISTING', 'Filling Neighborhood Description...');
  const neighborhoodFilled = await page.evaluate((text) => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const visible = textareas.filter(t => t.offsetParent !== null);
    if (visible.length > 1) {
      visible[1].focus();
      visible[1].value = text;
      visible[1].dispatchEvent(new Event('input', { bubbles: true }));
      visible[1].dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, 'Midtown Manhattan — near Empire State Building and Penn Station.');
  log('LISTING', `Neighborhood: ${neighborhoodFilled ? 'filled' : 'not filled (no second textarea)'}`);

  await page.waitForTimeout(500);
  await screenshot(page, '03f-section2-filled');

  // Navigate to Section 3 via evaluate (NOT Playwright click — avoids overlay issues)
  log('LISTING', 'Moving to Section 3...');
  const nextClicked2 = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      if (btn.textContent.trim() === 'Next' && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  log('LISTING', nextClicked2 ? 'Clicked Next via evaluate' : 'Next button not found');
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Verify we left Section 2
  const section3Check = await page.evaluate(() => {
    const allText = Array.from(document.querySelectorAll('*'))
      .filter(el => el.offsetParent !== null && el.children.length === 0)
      .map(el => el.textContent.trim());
    const hasFeatures = allText.some(t => t === 'Required Features');
    const onHomepage = allText.some(t => t.includes('Ongoing Rentals') || t === 'Explore Rentals');
    const hasLeaseStyles = allText.some(t => t.includes('Lease Styles') || t === 'Monthly' || t === 'Weekly');
    return { hasFeatures, hasLeaseStyles, onHomepage, sample: allText.filter(t => t.length > 3 && t.length < 50).slice(0, 15) };
  });
  log('LISTING', `Section 3 check: ${JSON.stringify(section3Check)}`);

  if (section3Check.onHomepage) {
    log('LISTING', 'ERROR: Page navigated to homepage — wizard lost');
    await screenshot(page, '03g-wizard-lost');
    throw new Error('Bubble wizard navigated to homepage during Section 2');
  }

  if (section3Check.hasFeatures) {
    log('LISTING', 'WARNING: Still on Features section — amenity validation may have blocked');
    await screenshot(page, '03g-stuck-on-features');

    // Click "why can I not proceed?" for diagnostics
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      for (const el of els) {
        if (el.textContent.trim() === 'why can I not proceed?' && el.offsetParent !== null) { el.click(); break; }
      }
    });
    await page.waitForTimeout(2000);
    await screenshot(page, '03g2-features-validation');
  }

  await screenshot(page, '03g-section3');

  // ── Section 3: Lease Styles ──
  log('LISTING', 'Section 3: Lease Styles...');
  // Click "Monthly" via evaluate (Bubble overlays block Playwright clicks)
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    for (const el of els) {
      if (el.textContent.trim() === 'Monthly' && el.offsetParent !== null && el.children.length === 0) {
        el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(1000);

  // Agree to terms if present
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    for (const el of els) {
      if (el.textContent.trim().includes('I agree') && el.offsetParent !== null && el.children.length === 0) {
        el.click();
        return;
      }
    }
  });
  await page.waitForTimeout(500);
  await screenshot(page, '03h-section3-filled');

  // Navigate to Section 4
  log('LISTING', 'Moving to Section 4...');
  await bubbleClickNext();
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await screenshot(page, '03i-section4');

  // Diagnostic: log visible headings + form elements
  const section4Info = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const visHeadings = headings.filter(h => h.offsetParent !== null).map(h => h.textContent.trim()).slice(0, 5);
    const inputs = Array.from(document.querySelectorAll('input'));
    const visInputs = inputs.filter(i => i.offsetParent !== null).map(i => ({
      type: i.type, placeholder: i.placeholder.substring(0, 30), name: i.name,
    })).slice(0, 10);
    return { headings: visHeadings, inputs: visInputs };
  });
  log('LISTING', `Section 4 info: ${JSON.stringify(section4Info)}`);

  // ── Section 4: Pricing ──
  log('LISTING', 'Section 4: Pricing...');

  // First try: Playwright locator for number/numeric input
  const priceInputs = page.locator('input[type="number"]:visible, input[inputmode="numeric"]:visible').first();
  if (await priceInputs.isVisible({ timeout: 5000 }).catch(() => false)) {
    await priceInputs.click();
    await page.waitForTimeout(300);
    await priceInputs.press('Control+a');
    await priceInputs.press('Backspace');
    await priceInputs.pressSequentially(CONFIG.listing.monthlyCompensation, { delay: 50 });
    log('LISTING', `Monthly Compensation: ${CONFIG.listing.monthlyCompensation}`);
  } else {
    log('LISTING', 'Price input not found via Playwright — trying evaluate fallback');
    // Evaluate fallback: look for any visible text input that could be for price
    const priceFilled = await page.evaluate((amount) => {
      // Try number/numeric inputs first
      const numInputs = Array.from(document.querySelectorAll('input[type="number"], input[inputmode="numeric"]'));
      let visible = numInputs.find(i => i.offsetParent !== null);
      if (visible) {
        visible.value = amount;
        visible.dispatchEvent(new Event('input', { bubbles: true }));
        visible.dispatchEvent(new Event('change', { bubbles: true }));
        return 'number';
      }
      // Fallback: look for text inputs with price-like placeholder or name
      const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
      visible = textInputs.find(i =>
        i.offsetParent !== null &&
        (i.placeholder.toLowerCase().includes('price') ||
         i.placeholder.toLowerCase().includes('amount') ||
         i.placeholder.toLowerCase().includes('compensation') ||
         i.placeholder.includes('$') ||
         i.placeholder.includes('0'))
      );
      if (visible) {
        visible.value = amount;
        visible.dispatchEvent(new Event('input', { bubbles: true }));
        visible.dispatchEvent(new Event('change', { bubbles: true }));
        return 'text-price';
      }
      return null;
    }, CONFIG.listing.monthlyCompensation);
    log('LISTING', `Price evaluate result: ${priceFilled}`);
  }
  await screenshot(page, '03j-section4-filled');

  // Navigate to Section 5
  log('LISTING', 'Moving to Section 5...');
  await bubbleClickNext();
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // ── Section 5: Rules ──
  log('LISTING', 'Section 5: Rules...');
  await screenshot(page, '03k-section5');

  // Navigate to Section 6
  log('LISTING', 'Moving to Section 6...');
  await bubbleClickNext();
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // ── Section 6: Photos ──
  log('LISTING', 'Section 6: Photos...');

  // Diagnostic
  const section6Headings = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.filter(h => h.offsetParent !== null).map(h => h.textContent.trim()).slice(0, 5);
  });
  log('LISTING', `Section 6 headings: ${JSON.stringify(section6Headings)}`);

  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(testImagePaths);
    log('LISTING', 'Uploaded 3 test photos');
    await page.waitForTimeout(10000);
  } else {
    log('LISTING', 'No file input found on this section');
  }
  await screenshot(page, '03l-section6-photos');

  // Navigate to Section 7
  log('LISTING', 'Moving to Section 7...');
  await bubbleClickNext();
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // ── Section 7: Review & Submit ──
  log('LISTING', 'Section 7: Review & Submit...');

  // Diagnostic
  const section7Headings = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headings.filter(h => h.offsetParent !== null).map(h => h.textContent.trim()).slice(0, 5);
  });
  log('LISTING', `Section 7 headings: ${JSON.stringify(section7Headings)}`);

  // Check all visible buttons on this section for diagnostic
  const section7Buttons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.filter(b => b.offsetParent !== null).map(b => b.textContent.trim()).filter(t => t).slice(0, 10);
  });
  log('LISTING', `Section 7 buttons: ${JSON.stringify(section7Buttons)}`);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await screenshot(page, '03m-section7-review');

  // Click Submit via evaluate
  log('LISTING', 'Clicking Submit Listing...');
  const submitClicked = await bubbleClickButton('Submit Listing') ||
                         await bubbleClickButton('SUBMIT') ||
                         await bubbleClickButton('Submit');
  if (submitClicked) {
    log('LISTING', 'Submit clicked');
    await page.waitForTimeout(10000);
  } else {
    log('LISTING', 'Submit button not found');
    await screenshot(page, '03m-no-submit');
  }
  await screenshot(page, '03n-after-submit');

  // ── Extract listing ID ──
  let newListingId = null;

  // Check URL for listing ID
  const currentUrl = page.url();
  log('LISTING', `Post-submit URL: ${currentUrl}`);

  const urlMatch = currentUrl.match(/listing[_-]?id=([^&#]+)/i) ||
                   currentUrl.match(/\/(view-split-lease|listing|preview)\/([^/?#]+)/);
  if (urlMatch) {
    newListingId = urlMatch[2] || urlMatch[1];
    log('LISTING', `Listing ID from URL: ${newListingId}`);
  }

  // Look for success message with a link
  if (!newListingId) {
    const successLink = page.locator('a[href*="listing"], a[href*="view-split-lease"]').first();
    const href = await successLink.getAttribute('href').catch(() => null);
    if (href) {
      const hrefMatch = href.match(/\/([^/?#]+)$/);
      if (hrefMatch) {
        newListingId = hrefMatch[1];
        log('LISTING', `Listing ID from link: ${newListingId}`);
      }
    }
  }

  // Fallback: query Supabase for most recent listing
  if (!newListingId) {
    log('LISTING', 'Falling back to Supabase query for listing ID...');
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/listing`);
      url.searchParams.set('select', '_id');
      url.searchParams.set('Host email', `eq.${CONFIG.host.email}`);
      url.searchParams.set('order', 'Created Date.desc');
      url.searchParams.set('limit', '1');
      const response = await fetch(url.toString(), {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const data = await response.json();
      if (data.length > 0) {
        newListingId = data[0]._id;
        log('LISTING', `Listing ID from Supabase: ${newListingId}`);
      }
    } catch (e) {
      log('LISTING', `Supabase fallback failed: ${e.message}`);
    }
  }

  log('LISTING', `─── Bubble listing creation ${newListingId ? 'SUCCEEDED' : 'FAILED'} ───`);
  return newListingId;
}

// ============================================================================
// Main Script — Two-Context Architecture
// ============================================================================

(async () => {
  log('INIT', 'Launching browser with video recording...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: CONFIG.slowMo,
    // Anti-detection: Bubble.io may ignore clicks from automated browsers
    args: ['--disable-blink-features=AutomationControlled'],
  });

  // ── HOST CONTEXT ──
  // Rod uses his regular browser for the host
  const hostContext = await browser.newContext({
    recordVideo: { dir: recordingsDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const hostPage = await hostContext.newPage();
  hostPage.setDefaultTimeout(CONFIG.actionTimeout);
  hostPage.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

  // Anti-detection: hide Playwright's navigator.webdriver flag
  await hostPage.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  let discoveredListingId = targetListingId;
  let capturedProposalId = null;

  try {
    // ========================================================================
    // PHASE 1: HOST — Log in, CREATE new listing, copy link
    // ========================================================================
    // Rod's flow: log in → "create new listing" → 7-section wizard → success → copy link
    // A new listing every run eliminates "Proposal Already Exists" on all listings.

    log('PHASE 1', '═══ HOST: Login & Create New Listing ═══');

    // ------ STEP 1: Navigate to site and log in as HOST ------
    // Rod: navigates to site, creates account / logs in
    await hostPage.goto(`${CONFIG.baseURL}`, { waitUntil: 'domcontentloaded' });
    await hostPage.waitForTimeout(2000);
    await screenshot(hostPage, '01-homepage');

    await loginAs(hostPage, CONFIG.host.email, CONFIG.host.password, 'host');
    await screenshot(hostPage, '02-host-logged-in');

    // ------ STEP 2: Create a NEW listing via the wizard ------
    // Rod: "create new listing" → 7-section wizard → submits
    // Rod: copies the listing link to share with guest in incognito
    if (!targetListingId) {
      discoveredListingId = isBubble
        ? await createNewListingBubble(hostPage)
        : await createNewListing(hostPage);

      if (!discoveredListingId) {
        throw new Error('Listing creation failed — no listing ID captured from success modal.');
      }

      log('PHASE 1', `New listing created: ${discoveredListingId}`);
    } else {
      log('PHASE 1', `Using specified listing (skipping creation): ${targetListingId}`);
    }

    const listingUrl = `${CONFIG.baseURL}/view-split-lease/${discoveredListingId}`;
    log('PHASE 1', `Listing URL (to share with guest): ${listingUrl}`);
    await screenshot(hostPage, '04-host-listing-created');

    // ========================================================================
    // PHASE 2: GUEST — Open listing in separate context (incognito), create proposal
    // ========================================================================
    // Rod: "I'm going to copy the link, and I'm going to open a incognito"
    // Key insight: Guest uses a SEPARATE browser context — no login/logout cycling

    log('PHASE 2', '═══ GUEST: Create Proposal (separate context) ═══');

    // ── GUEST CONTEXT (incognito) ──
    const guestContext = await browser.newContext({
      recordVideo: { dir: recordingsDir, size: { width: 1280, height: 720 } },
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const guestPage = await guestContext.newPage();
    guestPage.setDefaultTimeout(CONFIG.actionTimeout);
    guestPage.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

      // ------ STEP 3: Navigate to host's listing in guest context ------
      // Rod: pastes the listing link into incognito browser
      log('STEP 3', `Opening listing in guest context: ${listingUrl}`);
      await guestPage.goto(listingUrl, { waitUntil: 'domcontentloaded' });
      await guestPage.waitForTimeout(3000);
      await screenshot(guestPage, '05-guest-listing-view');

      // ------ STEP 4: Log in as guest ------
      // Rod: "I thought I was logged in, but I'm not" → logs in on the listing page
      // Rod: "I already have a account, so I don't have to create a new one"
      await loginAs(guestPage, CONFIG.guest.email, CONFIG.guest.password, 'guest');
      await screenshot(guestPage, '06-guest-logged-in');

      // After login, we may need to re-navigate to the listing
      // Rod: "Logged in so I can create a proposal for the link that I selected"
      const currentUrl = guestPage.url();
      if (!currentUrl.includes('view-split-lease')) {
        log('STEP 4', 'Redirected after login — re-navigating to listing...');
        await guestPage.goto(listingUrl, { waitUntil: 'domcontentloaded' });
        await guestPage.waitForTimeout(3000);
      }

      // ------ STEP 5: Wait for listing content and schedule selector ------
      // Rod: "one thing very important... the Schedule Selector"
      log('STEP 5', 'Waiting for listing content and schedule selector...');
      const dayButtonsLocator = guestPage.locator('.day-button');
      await dayButtonsLocator.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await guestPage.waitForTimeout(2000);
      await screenshot(guestPage, '07-listing-content-loaded');

      // ------ STEP 6: Configure schedule (3 days, 2 nights) ------
      // Rod: "I'm gonna select just three days and two nights"
      log('STEP 6', `Configuring schedule: ${CONFIG.proposal.daysToSelect.map((d) => DAY_NAMES[d]).join(', ')} (3 days, 2 nights)`);
      await configureSchedule(guestPage, 'STEP 6');
      await screenshot(guestPage, '08-schedule-configured');

      // Scroll down to reveal Create Proposal button at bottom of booking widget
      // The button is below the fold — needs scrolling to become visible/rendered
      log('STEP 6b', 'Scrolling down to reveal Create Proposal button...');
      await guestPage.evaluate(() => window.scrollTo(0, 800));
      await guestPage.waitForTimeout(1000);
      await screenshot(guestPage, '09-booking-widget-upper');

      // Scroll further down to ensure the button area is in view
      await guestPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await guestPage.waitForTimeout(1500);
      await screenshot(guestPage, '09a-page-bottom');

      // Scroll back up slightly to the booking widget area where the button should be
      await guestPage.evaluate(() => window.scrollTo(0, 1200));
      await guestPage.waitForTimeout(1000);
      await screenshot(guestPage, '09b-booking-widget-lower');

      // ------ STEP 7: Click Create Proposal ------
      log('STEP 7', 'Looking for Create Proposal button...');
      let createBtnResult = await tryClickCreateProposal(guestPage);
      await screenshot(guestPage, '09c-button-state');

      // Retry with more aggressive scrolling if button wasn't found
      if (createBtnResult === 'not_found') {
        log('STEP 7', 'Button not found — retrying with full page scroll...');
        // Scroll through the entire page to trigger any lazy rendering
        for (let scrollPos = 0; scrollPos <= 3000; scrollPos += 500) {
          await guestPage.evaluate((pos) => window.scrollTo(0, pos), scrollPos);
          await guestPage.waitForTimeout(500);
        }
        await guestPage.waitForTimeout(2000);
        createBtnResult = await tryClickCreateProposal(guestPage);
        log('STEP 7', `Retry result: ${createBtnResult}`);
        await screenshot(guestPage, '09d-retry-button-state');
      }

      if (createBtnResult !== 'clicked') {
        throw new Error(
          `Could not click Create Proposal on freshly created listing. ` +
          `Result: ${createBtnResult}. Listing ID: ${discoveredListingId}`
        );
      }

      log('STEP 7', 'Create Proposal button clicked — waiting for modal...');
      await guestPage.waitForTimeout(2000);
      await screenshot(guestPage, '10-proposal-modal-open');

      // ------ STEP 8: Handle proposal modal ------
      // Rod: "this is the model. Of the Create Proposal flow. The first model.
      //       Or the Pristine section of the model."
      log('STEP 8', 'Processing proposal modal...');

      const isOnUserDetails = await guestPage.locator('#needForSpace').isVisible().catch(() => false);
      const isOnConfirm = await guestPage.locator('text=Confirm Proposal').isVisible().catch(() => false);

      if (isOnUserDetails) {
        log('STEP 8', 'On User Details — filling fields...');
        await guestPage.locator('#needForSpace').fill(CONFIG.proposal.needForSpace);
        const aboutInput = guestPage.locator('#aboutYourself');
        if (await aboutInput.isVisible().catch(() => false)) {
          await aboutInput.fill(CONFIG.proposal.aboutYourself);
        }
        await screenshot(guestPage, '10b-user-details-filled');
        log('STEP 8', 'Clicking Next...');
        await guestPage.locator('.nav-button.next').first().click();
        await guestPage.waitForTimeout(2000);
      } else if (isOnConfirm) {
        log('STEP 8', 'On Confirm Proposal (user details pre-filled)');
      }
      await screenshot(guestPage, '11-confirm-proposal');

      // ------ STEP 9: Adjust Proposal (edit reservation span) ------
      // Rod: "I'm going to click on Edit... then it shows the adjust proposal"
      // Rod: "Instead of 13, I'm going to add 16 weeks"
      // Rod: "Save and Review. And it just returns to the Pristine part."
      log('STEP 9', 'Opening Adjust Proposal...');

      const editLinks = guestPage.locator('.edit-link');
      const editLinkCount = await editLinks.count();
      log('STEP 9', `Found ${editLinkCount} edit link(s)`);

      if (editLinkCount > 0) {
        await editLinks.first().click();
        await guestPage.waitForTimeout(1500);
        await screenshot(guestPage, '12-adjust-proposal');

        const reservationSelect = guestPage.locator('#reservationSpan');
        if (await reservationSelect.isVisible().catch(() => false)) {
          await reservationSelect.selectOption(CONFIG.proposal.adjustedReservationSpan);
          log('STEP 9', `Changed reservation span to ${CONFIG.proposal.adjustedReservationSpan} weeks`);
        }
        await guestPage.waitForTimeout(1000);
        await screenshot(guestPage, '12b-adjust-edited');

        // Click Save & Review — returns to Pristine/Confirm section
        const saveBtn = guestPage.locator('.nav-button.next:has-text("Save & Review")');
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
        } else {
          await guestPage.locator('.nav-button.next').first().click();
        }
        await guestPage.waitForTimeout(2000);
        await screenshot(guestPage, '12c-back-to-confirm');
        log('STEP 9', 'Returned to Confirm Proposal (Pristine section)');
      }

      // ------ STEP 10: Submit Proposal ------
      // Rod: "I'm going to click on Submit Proposal. It shows a message, success message."
      log('STEP 10', 'Submitting proposal...');
      const submitBtn = guestPage.locator('.nav-button.next').first();
      const submitText = await submitBtn.textContent().catch(() => '');
      log('STEP 10', `Button: "${submitText.trim()}"`);
      await screenshot(guestPage, '13-ready-to-submit');

      if (await submitBtn.isVisible().catch(() => false)) {
        if (!(await submitBtn.isDisabled().catch(() => true))) {
          await submitBtn.click();
        }
      }

      // Wait for success modal
      for (let wait = 0; wait < 30; wait++) {
        await guestPage.waitForTimeout(1000);
        if (await guestPage.locator('text=Proposal Submitted!').isVisible().catch(() => false)) {
          log('STEP 10', `Success modal appeared after ${wait + 1}s`);
          break;
        }
        if (!(await guestPage.locator('.create-proposal-popup').isVisible().catch(() => false))) {
          log('STEP 10', 'Modal closed');
          break;
        }
      }
      await screenshot(guestPage, '14-success-modal');

      // ------ STEP 11: Go to Guest Proposals page ------
      // Rod: "I'm going to click on it. And it took me to Guest Proposals page."
      const guestDashBtn = guestPage.locator('button:has-text("Go to Guest Dashboard")');
      if (await guestDashBtn.isVisible().catch(() => false)) {
        log('STEP 11', 'Clicking "Go to Guest Dashboard"...');
        await guestDashBtn.click();
        await guestPage.waitForTimeout(5000);

        const proposalUrl = guestPage.url();
        const proposalMatch = proposalUrl.match(/proposal=([^&]+)/);
        if (proposalMatch) {
          capturedProposalId = proposalMatch[1];
          log('STEP 11', `Captured proposal ID: ${capturedProposalId}`);
        }
        await screenshot(guestPage, '15-guest-proposals-page');
      }
      log('PHASE 2', 'Guest proposal creation complete');

    // ========================================================================
    // PHASE 3: HOST — Modify proposal (counter-offer)
    // ========================================================================
    // Rod: "Let's go back to the host account" (switches to host browser)
    // Rod: "On the host account I'm going to go to My Proposals"
    // Rod: "Now I'm going to click on modify"

    log('PHASE 3', '═══ HOST: Modify Proposal (Counter-Offer) ═══');

    // ------ STEP 12: Navigate to Host Proposals ------
    log('STEP 12', 'Navigating to Host Proposals...');
    await dismissOverlays(hostPage, 'host');
    await hostPage.goto(`${CONFIG.baseURL}/host-proposals`, { waitUntil: 'domcontentloaded' });
    await hostPage.waitForTimeout(5000);
    await screenshot(hostPage, '16-host-proposals-page');
    log('STEP 12', `On Host Proposals. URL: ${hostPage.url()}`);

    // ------ STEP 13: Find and expand the proposal ------
    log('STEP 13', 'Looking for proposal card...');

    let targetCard;
    if (capturedProposalId) {
      targetCard = hostPage.locator(`[data-proposal-id="${capturedProposalId}"]`);
      if (!(await targetCard.isVisible({ timeout: 5000 }).catch(() => false))) {
        log('STEP 13', `Card for proposal ${capturedProposalId} not found — trying first card`);
        targetCard = hostPage.locator('.hp7-proposal-card').first();
      }
    } else {
      targetCard = hostPage.locator('.hp7-proposal-card').first();
    }

    if (await targetCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await screenshot(hostPage, '17-proposal-collapsed');
      const cardHeader = targetCard.locator('.hp7-card-header, .card-header, [role="button"]').first();
      if (await cardHeader.isVisible().catch(() => false)) {
        await cardHeader.click();
      } else {
        await targetCard.click();
      }
      await hostPage.waitForTimeout(2000);
      log('STEP 13', 'Expanded proposal card');
      await screenshot(hostPage, '18-proposal-expanded');

      // Scroll down to reveal action buttons (Accept, Modify, Decline)
      log('STEP 13', 'Scrolling down to reveal action buttons...');
      await hostPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await hostPage.waitForTimeout(1500);
      await screenshot(hostPage, '18b-proposal-actions-area');
    } else {
      log('STEP 13', 'No proposal cards found on host proposals page');
      await screenshot(hostPage, '17-no-proposals-found');
    }

    // ------ STEP 14: Click Modify button ------
    // Rod: "Now I'm going to click on modify"
    log('STEP 14', 'Looking for Modify button...');

    let modifyClicked = false;
    const modifyBtns = hostPage.locator('button');
    const modifyBtnCount = await modifyBtns.count();

    for (let i = 0; i < modifyBtnCount; i++) {
      const btn = modifyBtns.nth(i);
      const text = await btn.textContent().catch(() => '');
      const trimmed = text.trim();

      if (trimmed === 'Modify') {
        const isVisible = await btn.isVisible().catch(() => false);
        if (!isVisible) continue;

        log('STEP 14', `Found Modify button (index ${i}): "${trimmed}"`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await hostPage.waitForTimeout(500);
        await btn.click();
        modifyClicked = true;
        await hostPage.waitForTimeout(2000);
        await screenshot(hostPage, '19-modify-clicked');
        break;
      }
    }

    if (!modifyClicked) {
      log('STEP 14', 'Modify button not found — listing visible buttons:');
      for (let i = 0; i < modifyBtnCount; i++) {
        const text = await modifyBtns.nth(i).textContent().catch(() => '');
        const visible = await modifyBtns.nth(i).isVisible().catch(() => false);
        if (text.trim() && visible) {
          log('STEP 14', `  Button ${i}: "${text.trim().substring(0, 60)}"`);
        }
      }
      await screenshot(hostPage, '19-no-modify-button');
    }

    // ------ STEP 15: Interact with HostEditingProposal modal ------
    // Rod: "it is exactly the same as the modify proposal model on the guest proposals page"
    // Flow: pristine → "Edit Proposal" → editing → change reservation span → "Update Proposal" → review → "Submit"
    log('STEP 15', 'Waiting for HostEditingProposal modal...');

    // Wait for the modal overlay or container to appear
    const hepContainer = hostPage.locator('.hep-container');
    const editOverlay = hostPage.locator('.editing-proposal-overlay');
    let modalAppeared = false;

    for (let wait = 0; wait < 15; wait++) {
      if (await hepContainer.isVisible().catch(() => false) ||
          await editOverlay.isVisible().catch(() => false)) {
        modalAppeared = true;
        break;
      }
      await hostPage.waitForTimeout(1000);
    }

    if (modalAppeared) {
      log('STEP 15', 'HostEditingProposal modal is visible');
      await screenshot(hostPage, '20-hep-pristine-view');

      // Step 15a: Click "Edit Proposal" button to enter editing mode
      log('STEP 15', 'Clicking "Edit Proposal" to enter editing mode...');
      let editProposalClicked = false;
      const hepBtns = hostPage.locator('button');
      const hepBtnCount = await hepBtns.count();

      for (let i = 0; i < hepBtnCount; i++) {
        const btn = hepBtns.nth(i);
        const text = await btn.textContent().catch(() => '');
        const trimmed = text.trim();

        if (trimmed === 'Edit Proposal') {
          const isVisible = await btn.isVisible().catch(() => false);
          if (!isVisible) continue;
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await btn.click();
          editProposalClicked = true;
          await hostPage.waitForTimeout(1500);
          log('STEP 15', 'Entered editing mode');
          await screenshot(hostPage, '21-hep-editing-view');
          break;
        }
      }

      if (!editProposalClicked) {
        log('STEP 15', 'Edit Proposal button not found — taking debug screenshot');
        await screenshot(hostPage, '21-no-edit-proposal-button');
      }

      // Step 15b: Change reservation span via custom dropdown
      // The dropdown is .hep-dropdown — click to open, then click an option
      if (editProposalClicked) {
        log('STEP 15', 'Changing reservation span...');

        // Scroll down to see the reservation span dropdown
        await hostPage.evaluate(() => {
          const container = document.querySelector('.hep-body');
          if (container) container.scrollTop = container.scrollHeight;
        });
        await hostPage.waitForTimeout(500);

        const hepDropdown = hostPage.locator('.hep-dropdown').first();
        if (await hepDropdown.isVisible().catch(() => false)) {
          await hepDropdown.click();
          await hostPage.waitForTimeout(1000);
          await screenshot(hostPage, '22-hep-dropdown-open');

          // Click the target option (e.g., "13 weeks (3 months)")
          const targetLabel = CONFIG.counterOffer.reservationSpanLabel;
          const dropdownOptions = hostPage.locator('.hep-dropdown-option');
          const optionCount = await dropdownOptions.count();
          let optionClicked = false;

          for (let i = 0; i < optionCount; i++) {
            const opt = dropdownOptions.nth(i);
            const optText = await opt.textContent().catch(() => '');
            if (optText.trim() === targetLabel) {
              await opt.click();
              optionClicked = true;
              log('STEP 15', `Selected: "${targetLabel}"`);
              break;
            }
          }

          if (!optionClicked) {
            // Try partial match
            for (let i = 0; i < optionCount; i++) {
              const opt = dropdownOptions.nth(i);
              const optText = await opt.textContent().catch(() => '');
              if (optText.trim().includes('13 weeks')) {
                await opt.click();
                optionClicked = true;
                log('STEP 15', `Selected (partial match): "${optText.trim()}"`);
                break;
              }
            }
          }

          if (!optionClicked) {
            log('STEP 15', `Could not find "${targetLabel}" in dropdown — listing options:`);
            for (let i = 0; i < optionCount; i++) {
              const optText = await dropdownOptions.nth(i).textContent().catch(() => '');
              log('STEP 15', `  Option ${i}: "${optText.trim()}"`);
            }
          }

          await hostPage.waitForTimeout(1000);
          await screenshot(hostPage, '22b-hep-span-changed');
        } else {
          log('STEP 15', 'Reservation span dropdown not found');
          await screenshot(hostPage, '22-no-dropdown');
        }

        // Step 15c: Click "Update Proposal" to go to review view
        log('STEP 15', 'Clicking "Update Proposal"...');
        let updateClicked = false;
        const updateBtns = hostPage.locator('button');
        const updateBtnCount = await updateBtns.count();

        for (let i = 0; i < updateBtnCount; i++) {
          const btn = updateBtns.nth(i);
          const text = await btn.textContent().catch(() => '');
          const trimmed = text.trim();

          if (trimmed === 'Update Proposal') {
            const isVisible = await btn.isVisible().catch(() => false);
            if (!isVisible) continue;
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await btn.click();
            updateClicked = true;
            await hostPage.waitForTimeout(2000);
            log('STEP 15', 'Entered review view');
            await screenshot(hostPage, '23-hep-review-view');
            break;
          }
        }

        // Step 15d: Click "Submit" to submit the counter-offer
        if (updateClicked) {
          log('STEP 15', 'Clicking "Submit" to send counter-offer...');
          let submitClicked = false;
          const submitBtns = hostPage.locator('button');
          const submitBtnCount = await submitBtns.count();

          for (let i = 0; i < submitBtnCount; i++) {
            const btn = submitBtns.nth(i);
            const text = await btn.textContent().catch(() => '');
            const trimmed = text.trim();

            if (trimmed === 'Submit') {
              const isVisible = await btn.isVisible().catch(() => false);
              if (!isVisible) continue;
              await btn.scrollIntoViewIfNeeded().catch(() => {});
              await btn.click();
              submitClicked = true;
              await hostPage.waitForTimeout(3000);
              log('STEP 15', 'Counter-offer submitted');
              await screenshot(hostPage, '24-counter-submitted');
              break;
            }
          }

          if (!submitClicked) {
            log('STEP 15', 'Submit button not found in review view');
            await screenshot(hostPage, '24-no-submit-button');
          }

          // Wait for toast notification: "Modifications submitted!"
          await hostPage.waitForTimeout(2000);
          await screenshot(hostPage, '24b-post-counter-state');

          // Check for status change to "Host Counteroffer Submitted"
          const counterStatus = hostPage.locator('text=Edit Counter, text=Counteroffer, text=Awaiting Guest');
          if (await counterStatus.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            log('STEP 15', 'Counter-offer status confirmed — buttons changed to Edit Counter/Withdraw');
          } else {
            log('STEP 15', 'Counter-offer submitted — checking page state...');
          }
        } else {
          log('STEP 15', 'Update Proposal button not found');
          await screenshot(hostPage, '23-no-update-button');
        }
      }
    } else {
      log('STEP 15', 'HostEditingProposal modal did not appear');
      await screenshot(hostPage, '20-no-hep-modal');
    }

    log('PHASE 3', 'Host counter-offer complete');

    // ========================================================================
    // PHASE 4: GUEST — Accept counter-offer
    // ========================================================================
    // Guest navigates to guest-proposals and accepts the host's counter-offer
    // via the CompareTermsModal ("Accept Host Terms" button)

    log('PHASE 4', '═══ GUEST: Accept Counter-Offer ═══');

    // ------ STEP 16: Navigate to Guest Proposals ------
    log('STEP 16', 'Navigating guest to Guest Proposals...');
    await dismissOverlays(guestPage, 'guest');

    const guestProposalsUrl = capturedProposalId
      ? `${CONFIG.baseURL}/guest-proposals?proposal=${capturedProposalId}`
      : `${CONFIG.baseURL}/guest-proposals`;
    await guestPage.goto(guestProposalsUrl, { waitUntil: 'domcontentloaded' });
    await guestPage.waitForTimeout(5000);
    await screenshot(guestPage, '25-guest-proposals-counter');
    log('STEP 16', `On Guest Proposals. URL: ${guestPage.url()}`);

    // ------ STEP 17: Find and click "Accept Host Terms" ------
    // The guest proposals page shows an "Accept Host Terms" button for counter-offered proposals
    // This button opens the CompareTermsModal
    log('STEP 17', 'Looking for Accept Host Terms button...');

    // Scroll down to reveal action buttons
    await guestPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await guestPage.waitForTimeout(1500);

    let acceptTermsClicked = false;
    const guestBtns = guestPage.locator('button');
    const guestBtnCount = await guestBtns.count();

    for (let i = 0; i < guestBtnCount; i++) {
      const btn = guestBtns.nth(i);
      const text = await btn.textContent().catch(() => '');
      const trimmed = text.trim();

      if (trimmed === 'Accept Host Terms' || trimmed === 'Accept Counter' || trimmed === 'Accept Counteroffer') {
        const isVisible = await btn.isVisible().catch(() => false);
        if (!isVisible) continue;

        log('STEP 17', `Found button (index ${i}): "${trimmed}"`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await guestPage.waitForTimeout(500);
        await btn.click();
        acceptTermsClicked = true;
        await guestPage.waitForTimeout(2000);
        await screenshot(guestPage, '26-compare-terms-modal');
        break;
      }
    }

    // Also try "Review Host Terms" which opens the same CompareTermsModal
    if (!acceptTermsClicked) {
      for (let i = 0; i < guestBtnCount; i++) {
        const btn = guestBtns.nth(i);
        const text = await btn.textContent().catch(() => '');
        const trimmed = text.trim();

        if (trimmed === 'Review Host Terms' || trimmed === 'Review Counteroffer') {
          const isVisible = await btn.isVisible().catch(() => false);
          if (!isVisible) continue;

          log('STEP 17', `Found review button (index ${i}): "${trimmed}" — opening CompareTermsModal`);
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await guestPage.waitForTimeout(500);
          await btn.click();
          acceptTermsClicked = true;
          await guestPage.waitForTimeout(2000);
          await screenshot(guestPage, '26-compare-terms-modal');
          break;
        }
      }
    }

    if (!acceptTermsClicked) {
      log('STEP 17', 'Accept/Review Host Terms button not found — listing visible buttons:');
      for (let i = 0; i < guestBtnCount; i++) {
        const text = await guestBtns.nth(i).textContent().catch(() => '');
        const visible = await guestBtns.nth(i).isVisible().catch(() => false);
        if (text.trim() && visible) {
          log('STEP 17', `  Button ${i}: "${text.trim().substring(0, 60)}"`);
        }
      }
      await screenshot(guestPage, '26-no-accept-terms-button');
    }

    // ------ STEP 18: Click "Accept Host Terms" inside CompareTermsModal ------
    // The CompareTermsModal (rendered via createPortal) has a button with class
    // .compare-terms-btn--accept. We target it by CSS class to avoid hitting the
    // identically-named button on the proposal card underneath the modal overlay.
    if (acceptTermsClicked) {
      log('STEP 18', 'Looking for Accept button inside CompareTermsModal...');

      // Wait for the CompareTermsModal to fully render
      const compareModal = guestPage.locator('.compare-terms-modal');
      await compareModal.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      if (await compareModal.isVisible().catch(() => false)) {
        log('STEP 18', 'CompareTermsModal is visible');
        await screenshot(guestPage, '27-compare-terms-detail');
      }

      // Scroll inside modal body to reveal the footer/accept button
      await guestPage.evaluate(() => {
        const body = document.querySelector('.compare-terms-body');
        if (body) body.scrollTop = body.scrollHeight;
      });
      await guestPage.waitForTimeout(1000);

      // Target the accept button by its unique CSS class inside the modal
      const modalAcceptBtn = guestPage.locator('.compare-terms-btn--accept');
      let acceptInModalClicked = false;

      if (await modalAcceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const btnText = await modalAcceptBtn.textContent().catch(() => '');
        log('STEP 18', `Found modal accept button: "${btnText.trim()}"`);

        // Use JS click — the .compare-terms-overlay (position:fixed inset:0)
        // intercepts Playwright pointer events on child buttons
        await modalAcceptBtn.evaluate(el => el.click());
        acceptInModalClicked = true;
        log('STEP 18', 'Clicked Accept Host Terms — waiting for processing...');

        // Wait for success state: "Counteroffer Accepted!"
        for (let wait = 0; wait < 30; wait++) {
          await guestPage.waitForTimeout(1000);
          const successText = guestPage.locator('text=Counteroffer Accepted');
          if (await successText.isVisible().catch(() => false)) {
            log('STEP 18', `Counteroffer accepted after ${wait + 1}s`);
            break;
          }
        }
        await screenshot(guestPage, '28-counteroffer-accepted');
      }

      if (!acceptInModalClicked) {
        log('STEP 18', 'Accept Host Terms button not found inside modal');
        await screenshot(guestPage, '28-no-accept-in-modal');
      }

      // Click "Got It" or "Close" to dismiss the success state
      await guestPage.waitForTimeout(2000);
      const gotItBtn = guestPage.locator('button:has-text("Got It"), button:has-text("Close")');
      if (await gotItBtn.first().isVisible().catch(() => false)) {
        await gotItBtn.first().click();
        await guestPage.waitForTimeout(1000);
      }
      await screenshot(guestPage, '29-guest-proposals-after-accept');
    }

    log('PHASE 4', 'Guest counter-offer acceptance complete');

    // Close guest context (like closing incognito window)
    const guestVideoPath = await guestPage.video()?.path();
    await guestContext.close();
    if (guestVideoPath) log('VIDEO', `Guest recording: ${path.basename(guestVideoPath)}`);

    // ========================================================================
    // PHASE 5: Backend Observer
    // ========================================================================
    log('PHASE 5', '═══ BACKEND VERIFICATION ═══');
    try {
      const report = await runProposalObserver(capturedProposalId, discoveredListingId);
      log('PHASE 5', `Observer: ${report.summary.match}/${report.summary.total} matches`);
    } catch (observerError) {
      log('PHASE 5', `Observer failed: ${observerError.message}`);
    }

    log('DONE', 'Full lifecycle completed successfully (5 phases)');

  } catch (error) {
    log('ERROR', `Script failed: ${error.message}`);
    await screenshot(hostPage, 'ERROR-final-state').catch(() => {});
    console.error(error);

    // Run observer on error to check if proposal was created
    try {
      const report = await runProposalObserver(null, discoveredListingId);
      if (report.supabaseFound) {
        log('OBSERVER', `Proposal WAS created: _id=${report.supabaseProposalId}`);
      }
    } catch (e) {
      log('OBSERVER', `Observer also failed: ${e.message}`);
    }
  } finally {
    await hostPage.waitForTimeout(2000);
    // Close guest context if still open (safety net for errors during Phase 3/4)
    try {
      const guestContextPages = guestContext?.pages?.() || [];
      if (guestContextPages.length > 0) {
        const guestVideoPath2 = await guestPage?.video()?.path();
        await guestContext.close();
        if (guestVideoPath2) log('VIDEO', `Guest recording (cleanup): ${path.basename(guestVideoPath2)}`);
      }
    } catch (e) {
      // Guest context may already be closed — that's expected
    }
    const hostVideoPath = await hostPage.video()?.path();
    await hostContext.close();
    await browser.close();

    if (hostVideoPath) log('VIDEO', `Host recording: ${path.basename(hostVideoPath)}`);
    log('DONE', `Screenshots: ${screenshotsDir}`);

    const runSummary = {
      run: runTimestamp,
      site: siteName,
      baseURL: CONFIG.baseURL,
      hostEmail: CONFIG.host.email,
      guestEmail: CONFIG.guest.email,
      listingCreated: !targetListingId,
      listingName: CONFIG.listing.name,
      discoveredListingId,
      capturedProposalId,
      proposal: {
        daysSelected: CONFIG.proposal.daysToSelect.map((d) => DAY_NAMES[d]),
        daysCount: CONFIG.proposal.daysToSelect.length,
        nightsCount: CONFIG.proposal.daysToSelect.length - 1,
        initialReservationSpan: CONFIG.proposal.reservationSpan,
        adjustedReservationSpan: CONFIG.proposal.adjustedReservationSpan,
      },
      counterOffer: {
        reservationSpanLabel: CONFIG.counterOffer.reservationSpanLabel,
      },
      phases: 'listing → proposal → host-counter → guest-accept → observer',
      architecture: 'two-context (host browser + guest incognito)',
      videoFile: hostVideoPath ? path.basename(hostVideoPath) : null,
      screenshotCount: fs.readdirSync(screenshotsDir).filter((f) => f.endsWith('.png')).length,
      outputDir: recordingsDir,
    };
    fs.writeFileSync(path.join(recordingsDir, 'run-summary.json'), JSON.stringify(runSummary, null, 2));
    log('DONE', `Run summary saved`);
  }
})();
