/**
 * Autonomous Playwright Script: Create a Listing on split.lease
 *
 * This script logs in as a host, fills out the 7-section listing creation form,
 * and submits a real listing on production. The entire session is video-recorded.
 *
 * After submission, the Bubble Backend Observer queries both Supabase and Bubble
 * APIs to compare the submitted form data against what was actually stored.
 *
 * Usage:
 *   node e2e/create-listing-recorded.cjs
 *   node e2e/create-listing-recorded.cjs --site=app.split.lease
 *
 * Output:
 *   - Video: e2e/recordings/<site>/*.webm
 *   - Screenshots: e2e/recordings/<site>/screenshots/*.png
 *   - Comparison Report: e2e/recordings/<site>/comparison-report.json
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ============================================================================
// Configuration
// ============================================================================

// ============================================================================
// Site Profiles (selectable via --site=<name> CLI arg)
// ============================================================================

const SITE_PROFILES = {
  'split.lease': {
    baseURL: 'https://split.lease',
    credentials: {
      email: 'rodtesthost@test.com',
      password: 'eCom@2024',
    },
  },
  'app.split.lease': {
    baseURL: 'https://app.split.lease',
    credentials: {
      email: 'splitleaserod@gmail.com',
      password: 'eCom@2024',
    },
  },
};

// Parse --site arg (default: split.lease)
const siteArg = process.argv.find((a) => a.startsWith('--site='));
const siteName = siteArg ? siteArg.split('=')[1] : 'split.lease';
const siteProfile = SITE_PROFILES[siteName];

if (!siteProfile) {
  console.error(`Unknown site: ${siteName}. Available: ${Object.keys(SITE_PROFILES).join(', ')}`);
  process.exit(1);
}

console.log(`\n=== Target: ${siteName} (${siteProfile.baseURL}) ===\n`);

const CONFIG = {
  baseURL: siteProfile.baseURL,
  credentials: siteProfile.credentials,
  listing: {
    name: 'Playwright Test Listing',
    typeOfSpace: 'Private Room',
    bedrooms: '2',
    kitchenType: 'Full Kitchen',
    beds: '2',
    parkingType: 'Street Parking',
    bathrooms: '1.5',
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
      'Cozy private room in the heart of Midtown Manhattan. Walking distance to Empire State Building, Penn Station, and countless restaurants. The room features a comfortable queen bed, ample closet space, and natural light. Shared access to a fully equipped kitchen and clean bathroom. Perfect for professionals or students looking for a convenient NYC base.',
    monthlyCompensation: '1850',
    damageDeposit: '500',
    cancellationPolicy: 'Standard',
  },
  // Slow down actions so the video is watchable
  slowMo: 300,
  // Timeouts
  navigationTimeout: 30000,
  actionTimeout: 15000,
};

// ============================================================================
// Directory Setup — timestamped run folders for cross-run comparison
//
//   e2e/recordings/
//     split-lease/
//       2026-02-06_14-30-00/        ← one run
//         screenshots/
//         test-images/
//         comparison-report.json
//         *.webm
//       2026-02-06_15-00-00/        ← another run
//       latest -> 2026-02-06_15-00-00  (symlink / copy reference)
//     app-split-lease/
//       ...
// ============================================================================

const safeSiteName = siteName.replace(/\./g, '-');
const runTimestamp = new Date()
  .toISOString()
  .replace(/T/, '_')
  .replace(/:/g, '-')
  .replace(/\.\d+Z$/, ''); // e.g. 2026-02-06_14-30-00

const siteDir = path.join(__dirname, 'recordings', safeSiteName);
const recordingsDir = path.join(siteDir, runTimestamp);
const screenshotsDir = path.join(recordingsDir, 'screenshots');
const testImagesDir = path.join(recordingsDir, 'test-images');

if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(testImagesDir)) fs.mkdirSync(testImagesDir, { recursive: true });

// Write a "latest" pointer file so tooling can find the most recent run
const latestPointerPath = path.join(siteDir, 'latest.txt');
fs.writeFileSync(latestPointerPath, runTimestamp);

console.log(`[RUN] ${runTimestamp}  →  ${recordingsDir}\n`);

// ============================================================================
// Generate Test Images (minimal valid PNGs)
// ============================================================================

/**
 * Creates a minimal valid 1x1 pixel PNG file.
 * Each image uses a different color for visual distinction.
 */
function createTestPNG(color) {
  // Minimal valid PNG structure for a 1x1 pixel RGB image
  // Colors: 'red' = [255,0,0], 'green' = [0,255,0], 'blue' = [0,0,255]
  const colors = {
    red: [0xff, 0x00, 0x00],
    green: [0x00, 0xff, 0x00],
    blue: [0x00, 0x00, 0xff],
  };
  const rgb = colors[color] || colors.red;

  // PNG uses zlib-compressed IDAT chunk. For a 1x1 RGB pixel,
  // the raw data is: filter_byte(0) + R + G + B = 4 bytes
  // We'll use the zlib module to compress it properly
  const zlib = require('zlib');

  // Raw scanline: filter byte (0 = None) + RGB values
  const rawData = Buffer.from([0x00, rgb[0], rgb[1], rgb[2]]);
  const compressedData = zlib.deflateSync(rawData);

  // Build PNG file
  const chunks = [];

  // PNG Signature
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // Helper: create a PNG chunk (length + type + data + CRC)
  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    // CRC32 over type + data
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);

    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  // CRC32 lookup table
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

  // IHDR: width=1, height=1, bitDepth=8, colorType=2 (RGB)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);  // width
  ihdrData.writeUInt32BE(1, 4);  // height
  ihdrData[8] = 8;               // bit depth
  ihdrData[9] = 2;               // color type (RGB)
  ihdrData[10] = 0;              // compression
  ihdrData[11] = 0;              // filter
  ihdrData[12] = 0;              // interlace
  chunks.push(makeChunk('IHDR', ihdrData));

  // IDAT: compressed pixel data
  chunks.push(makeChunk('IDAT', compressedData));

  // IEND: end marker
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

// Generate 3 test images
const testImagePaths = ['red', 'green', 'blue'].map((color, i) => {
  const filePath = path.join(testImagesDir, `test-photo-${i + 1}.png`);
  fs.writeFileSync(filePath, createTestPNG(color));
  return filePath;
});

// ============================================================================
// Bubble Backend Observer - Compares form data vs Supabase vs Bubble
// ============================================================================

const SUPABASE_URL = 'https://qcfifybkaddcoimjroca.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZmlmeWJrYWRkY29pbWpyb2NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzU0MDUsImV4cCI6MjA3NTA1MTQwNX0.glGwHxds0PzVLF1Y8VBGX0jYz3zrLsgE9KAWWwkYms8';
const BUBBLE_API_BASE_URL = 'https://upgradefromstr.bubbleapps.io/api/1.1';
const BUBBLE_API_KEY = '5dbb448f9a6bbb043cb56ac16b8de109';

/**
 * Query Supabase listing table for the most recent listing by host email.
 * Returns the full listing record or null if not found.
 *
 * @param {string} hostEmail - The host's email address
 * @param {string} listingName - The listing name to match
 * @returns {Promise<object|null>}
 */
async function querySupabaseListing(hostEmail, listingName) {
  log('OBSERVER', 'Querying Supabase for listing...');

  // Query by host email and listing name, ordered by most recent
  const url = new URL(`${SUPABASE_URL}/rest/v1/listing`);
  url.searchParams.set('select', '*');
  url.searchParams.set('Host email', `eq.${hostEmail}`);
  url.searchParams.set('Name', `eq.${listingName}`);
  url.searchParams.set('order', 'Created Date.desc');
  url.searchParams.set('limit', '1');

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

    log('OBSERVER', `Supabase listing found: _id=${data[0]._id}`);
    return data[0];
  } catch (error) {
    log('OBSERVER', `Supabase query error: ${error.message}`);
    return null;
  }
}

/**
 * Query the Bubble Data API for a listing by ID.
 * Returns the full Bubble record or null if not found.
 *
 * @param {string} listingId - The listing's _id
 * @returns {Promise<object|null>}
 */
async function queryBubbleListing(listingId) {
  log('OBSERVER', `Querying Bubble for listing: ${listingId}...`);

  const url = `${BUBBLE_API_BASE_URL}/obj/listing/${listingId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        log('OBSERVER', 'Listing not found in Bubble (not yet synced)');
        return null;
      }
      const errorText = await response.text();
      log('OBSERVER', `Bubble query failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    log('OBSERVER', 'Bubble listing found');
    return data.response;
  } catch (error) {
    log('OBSERVER', `Bubble query error: ${error.message}`);
    return null;
  }
}

/**
 * Query Bubble Data API by searching for listings matching the name.
 * Fallback when we don't have the exact listing ID for Bubble.
 *
 * @param {string} listingName - The listing name to search
 * @param {string} hostEmail - The host email for additional filtering
 * @returns {Promise<object|null>}
 */
async function searchBubbleListing(listingName, hostEmail) {
  log('OBSERVER', `Searching Bubble for listing by name: "${listingName}"...`);

  const url = new URL(`${BUBBLE_API_BASE_URL}/obj/listing`);
  // Bubble search constraint: Name equals listingName
  const constraints = JSON.stringify([
    { key: 'Name', constraint_type: 'equals', value: listingName },
  ]);
  url.searchParams.set('constraints', constraints);
  url.searchParams.set('sort_field', 'Created Date');
  url.searchParams.set('descending', 'true');
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('OBSERVER', `Bubble search failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    if (!data.response?.results?.length) {
      log('OBSERVER', 'No matching listing found in Bubble');
      return null;
    }

    const listing = data.response.results[0];
    log('OBSERVER', `Bubble listing found via search: _id=${listing._id}`);
    return listing;
  } catch (error) {
    log('OBSERVER', `Bubble search error: ${error.message}`);
    return null;
  }
}

/**
 * Build the expected data map from the CONFIG listing values.
 * Maps form field names to the Supabase column names and expected values.
 *
 * @returns {object} - Map of { fieldLabel: { supabaseColumn, bubbleField, expectedValue } }
 */
function buildExpectedDataMap() {
  return {
    'Listing Name': {
      supabaseColumn: 'Name',
      bubbleField: 'Name',
      expected: CONFIG.listing.name,
    },
    'Type of Space': {
      supabaseColumn: 'Features - Type of Space',
      bubbleField: 'Features - Type of Space',
      expected: CONFIG.listing.typeOfSpace,
      // FK: actual DB value will be an ID, not the display name
      isForeignKey: true,
    },
    'Bedrooms': {
      supabaseColumn: 'Features - Qty Bedrooms',
      bubbleField: 'Features - Qty Bedrooms',
      expected: Number(CONFIG.listing.bedrooms),
    },
    'Kitchen Type': {
      supabaseColumn: 'Kitchen Type',
      bubbleField: 'Kitchen Type',
      expected: CONFIG.listing.kitchenType,
    },
    'Beds': {
      supabaseColumn: 'Features - Qty Beds',
      bubbleField: 'Features - Qty Beds',
      expected: Number(CONFIG.listing.beds),
    },
    'Parking Type': {
      supabaseColumn: 'Features - Parking type',
      bubbleField: 'Features - Parking type',
      expected: CONFIG.listing.parkingType,
      isForeignKey: true,
    },
    'Bathrooms': {
      supabaseColumn: 'Features - Qty Bathrooms',
      bubbleField: 'Features - Qty Bathrooms',
      expected: Number(CONFIG.listing.bathrooms),
    },
    'Description': {
      supabaseColumn: 'Description',
      bubbleField: 'Description of Lodging',
      expected: CONFIG.listing.description,
    },
    'Rental Type': {
      supabaseColumn: 'rental type',
      bubbleField: 'rental type',
      expected: 'Monthly',
    },
    'Monthly Compensation': {
      supabaseColumn: 'monthly_host_rate',
      bubbleField: 'monthly_host_rate',
      expected: Number(CONFIG.listing.monthlyCompensation),
    },
    'Damage Deposit': {
      supabaseColumn: 'damage_deposit',
      bubbleField: 'damage_deposit',
      expected: Number(CONFIG.listing.damageDeposit),
    },
    'Cancellation Policy': {
      supabaseColumn: 'Cancellation Policy',
      bubbleField: 'Cancellation Policy',
      expected: CONFIG.listing.cancellationPolicy,
      isForeignKey: true,
    },
    'Status': {
      supabaseColumn: 'Active',
      bubbleField: 'Active',
      expected: false,
    },
  };
}

/**
 * Compare expected form data against Supabase record and Bubble record.
 * Produces a structured comparison report.
 *
 * @param {object} supabaseRecord - The listing from Supabase (or null)
 * @param {object|null} bubbleRecord - The listing from Bubble (or null)
 * @returns {object} - Comparison report
 */
function generateComparisonReport(supabaseRecord, bubbleRecord) {
  const expectedMap = buildExpectedDataMap();
  const report = {
    run: runTimestamp,
    timestamp: new Date().toISOString(),
    site: siteName,
    supabaseFound: !!supabaseRecord,
    bubbleFound: !!bubbleRecord,
    supabaseListingId: supabaseRecord?._id || null,
    bubbleListingId: bubbleRecord?._id || null,
    fields: [],
    summary: { total: 0, supabaseMatch: 0, supabaseMismatch: 0, bubbleMatch: 0, bubbleMismatch: 0, bubbleNotFound: 0 },
  };

  for (const [label, spec] of Object.entries(expectedMap)) {
    const supabaseValue = supabaseRecord ? supabaseRecord[spec.supabaseColumn] : undefined;
    const bubbleValue = bubbleRecord ? bubbleRecord[spec.bubbleField] : undefined;

    // For FK fields, we can't directly compare display names to IDs
    // Just check if the Supabase value is non-null (was set)
    let supabaseMatch;
    if (spec.isForeignKey) {
      supabaseMatch = supabaseValue != null && supabaseValue !== '';
    } else {
      supabaseMatch = compareValues(spec.expected, supabaseValue);
    }

    let bubbleMatch;
    if (!bubbleRecord) {
      bubbleMatch = null; // Can't compare
    } else if (spec.isForeignKey) {
      bubbleMatch = bubbleValue != null && bubbleValue !== '';
    } else {
      bubbleMatch = compareValues(spec.expected, bubbleValue);
    }

    const fieldResult = {
      field: label,
      expected: spec.expected,
      supabase: supabaseValue,
      bubble: bubbleValue,
      supabaseMatch: supabaseMatch ? 'MATCH' : 'MISMATCH',
      bubbleMatch: bubbleMatch === null ? 'NOT_FOUND' : bubbleMatch ? 'MATCH' : 'MISMATCH',
      isForeignKey: spec.isForeignKey || false,
    };

    report.fields.push(fieldResult);
    report.summary.total++;
    if (supabaseMatch) report.summary.supabaseMatch++;
    else report.summary.supabaseMismatch++;
    if (bubbleMatch === null) report.summary.bubbleNotFound++;
    else if (bubbleMatch) report.summary.bubbleMatch++;
    else report.summary.bubbleMismatch++;
  }

  return report;
}

/**
 * Compare two values with type coercion for numbers/strings.
 *
 * @param {*} expected
 * @param {*} actual
 * @returns {boolean}
 */
function compareValues(expected, actual) {
  if (expected === actual) return true;
  if (expected == null && actual == null) return true;
  if (expected == null || actual == null) return false;

  // Number comparison with string coercion
  if (typeof expected === 'number' && typeof actual === 'string') {
    return expected === Number(actual);
  }
  if (typeof expected === 'string' && typeof actual === 'number') {
    return Number(expected) === actual;
  }

  // String comparison (trim whitespace)
  if (typeof expected === 'string' && typeof actual === 'string') {
    return expected.trim() === actual.trim();
  }

  return JSON.stringify(expected) === JSON.stringify(actual);
}

/**
 * Print the comparison report to console in a readable format.
 *
 * @param {object} report
 */
function printComparisonReport(report) {
  log('OBSERVER', '');
  log('OBSERVER', '╔══════════════════════════════════════════════════════════════╗');
  log('OBSERVER', '║          BUBBLE BACKEND OBSERVER - COMPARISON REPORT        ║');
  log('OBSERVER', '╚══════════════════════════════════════════════════════════════╝');
  log('OBSERVER', '');
  log('OBSERVER', `Site:              ${report.site}`);
  log('OBSERVER', `Timestamp:         ${report.timestamp}`);
  log('OBSERVER', `Supabase Found:    ${report.supabaseFound ? 'YES' : 'NO'}`);
  log('OBSERVER', `Supabase ID:       ${report.supabaseListingId || 'N/A'}`);
  log('OBSERVER', `Bubble Found:      ${report.bubbleFound ? 'YES' : 'NO'}`);
  log('OBSERVER', `Bubble ID:         ${report.bubbleListingId || 'N/A'}`);
  log('OBSERVER', '');
  log('OBSERVER', '┌────────────────────────┬────────────┬────────────┬──────────┐');
  log('OBSERVER', '│ Field                  │ Supabase   │ Bubble     │ FK?      │');
  log('OBSERVER', '├────────────────────────┼────────────┼────────────┼──────────┤');

  for (const field of report.fields) {
    const name = field.field.padEnd(22).substring(0, 22);
    const sb = field.supabaseMatch.padEnd(10).substring(0, 10);
    const bb = field.bubbleMatch.padEnd(10).substring(0, 10);
    const fk = field.isForeignKey ? 'YES' : '';
    log('OBSERVER', `│ ${name} │ ${sb} │ ${bb} │ ${fk.padEnd(8)} │`);
  }

  log('OBSERVER', '└────────────────────────┴────────────┴────────────┴──────────┘');
  log('OBSERVER', '');
  log('OBSERVER', `Summary: ${report.summary.total} fields checked`);
  log('OBSERVER', `  Supabase: ${report.summary.supabaseMatch} match, ${report.summary.supabaseMismatch} mismatch`);
  log('OBSERVER', `  Bubble:   ${report.summary.bubbleMatch} match, ${report.summary.bubbleMismatch} mismatch, ${report.summary.bubbleNotFound} not found`);
  log('OBSERVER', '');
}

/**
 * Save the full comparison report (with raw records) to a JSON file.
 *
 * @param {object} report - Comparison report
 * @param {object|null} supabaseRecord - Raw Supabase record
 * @param {object|null} bubbleRecord - Raw Bubble record
 */
function saveComparisonReport(report, supabaseRecord, bubbleRecord) {
  const fullReport = {
    ...report,
    rawData: {
      supabase: supabaseRecord,
      bubble: bubbleRecord,
    },
  };

  const reportPath = path.join(recordingsDir, 'comparison-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
  log('OBSERVER', `Full report saved to: ${reportPath}`);
}

/**
 * Run the complete Bubble Backend Observer flow.
 * Queries Supabase, queries Bubble, compares, and reports.
 *
 * @param {string|null} listingId - Listing ID if known (from success modal)
 * @returns {Promise<object>} - Comparison report
 */
async function runBubbleObserver(listingId) {
  log('OBSERVER', '========== BUBBLE BACKEND OBSERVER ==========');

  // Step 1: Query Supabase
  let supabaseRecord;
  if (listingId) {
    // Direct query by ID
    log('OBSERVER', `Querying Supabase by listing ID: ${listingId}`);
    const url = `${SUPABASE_URL}/rest/v1/listing?_id=eq.${listingId}&limit=1`;
    try {
      const response = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      const data = await response.json();
      supabaseRecord = data[0] || null;
    } catch (error) {
      log('OBSERVER', `Supabase direct query error: ${error.message}`);
    }
  }

  // Fallback: search by host email and listing name
  if (!supabaseRecord) {
    supabaseRecord = await querySupabaseListing(
      CONFIG.credentials.email,
      CONFIG.listing.name
    );
  }

  if (supabaseRecord) {
    log('OBSERVER', `Supabase record found: _id=${supabaseRecord._id}, Name="${supabaseRecord.Name}"`);
  } else {
    log('OBSERVER', 'No Supabase record found - listing may not have been created');
  }

  // Step 2: Query Bubble (try direct ID first, then search)
  let bubbleRecord = null;
  const searchId = listingId || supabaseRecord?._id;

  if (searchId) {
    bubbleRecord = await queryBubbleListing(searchId);
  }

  // If not found by ID, search by name
  if (!bubbleRecord) {
    // Wait briefly for async sync to complete
    log('OBSERVER', 'Waiting 5 seconds for Bubble sync queue...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    bubbleRecord = await searchBubbleListing(CONFIG.listing.name, CONFIG.credentials.email);
  }

  // Step 3: Generate comparison report
  const report = generateComparisonReport(supabaseRecord, bubbleRecord);

  // Step 4: Print and save
  printComparisonReport(report);
  saveComparisonReport(report, supabaseRecord, bubbleRecord);

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

async function waitAndClick(page, selector, description) {
  log('ACTION', `Clicking: ${description}`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().click();
}

async function waitAndFill(page, selector, value, description) {
  log('ACTION', `Filling: ${description} = "${value}"`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().fill(value);
}

async function waitAndSelect(page, selector, value, description) {
  log('ACTION', `Selecting: ${description} = "${value}"`);
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: CONFIG.actionTimeout });
  await page.locator(selector).first().selectOption(value);
}

// ============================================================================
// Main Script
// ============================================================================

(async () => {
  log('INIT', 'Launching browser with video recording...');

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

  const page = await context.newPage();
  page.setDefaultTimeout(CONFIG.actionTimeout);
  page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

  try {
    // ========================================================================
    // STEP 1: Navigate directly to /self-listing (login happens here)
    // ========================================================================
    // Navigate directly to the self-listing page first - this ensures the
    // auth session is established in the same page context that submits.
    // Islands Architecture = full page loads, so logging in on homepage
    // then navigating to /self-listing loses the session.
    log('STEP 1', 'Navigating to /self-listing...');
    await page.goto(`${CONFIG.baseURL}/self-listing`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-self-listing-initial');
    log('STEP 1', 'Self-listing page loaded');

    // ========================================================================
    // STEP 2: Log in as host (from the /self-listing page header)
    // ========================================================================
    log('STEP 2', 'Logging in...');

    // Click "Sign In" in the header
    await waitAndClick(page, 'a:has-text("Sign In")', 'Sign In link in header');
    await page.waitForTimeout(1000);
    await screenshot(page, '02-auth-modal-open');

    // The modal might open to an initial view - look for login form or switch to it
    const emailInputVisible = await page.locator('input[type="email"][placeholder="john@example.com"]').isVisible().catch(() => false);

    if (!emailInputVisible) {
      // May need to click a "Log in" or similar button to switch to login view
      log('STEP 2', 'Login form not visible, looking for navigation to login view...');
      const loginLink = page.locator('button:has-text("Log in"), a:has-text("Log in"), button:has-text("Sign in")');
      if (await loginLink.first().isVisible().catch(() => false)) {
        await loginLink.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Fill email
    await waitAndFill(
      page,
      'input[type="email"][placeholder="john@example.com"]',
      CONFIG.credentials.email,
      'Email input'
    );

    // Fill password
    await waitAndFill(
      page,
      'input[placeholder="Enter your password"]',
      CONFIG.credentials.password,
      'Password input'
    );

    await screenshot(page, '03-credentials-filled');

    // Click "Log In" button
    await waitAndClick(page, 'button[type="submit"]:has-text("Log In")', 'Log In button');

    // Wait for login to complete - header should update
    log('STEP 2', 'Waiting for login to complete...');
    await page.waitForTimeout(3000);
    await screenshot(page, '04-logged-in');
    log('STEP 2', 'Login complete');

    // ========================================================================
    // STEP 3: Clear draft and reload (already on /self-listing)
    // ========================================================================
    log('STEP 3', 'Clearing draft and reloading...');

    // Clear any existing draft from localStorage
    await page.evaluate(() => {
      localStorage.removeItem('selfListingDraft');
      localStorage.removeItem('selfListingStagedForSubmission');
      localStorage.removeItem('selfListingLastSaved');
      localStorage.removeItem('selfListingDraftId');
    });
    log('STEP 3', 'Cleared localStorage draft');

    // Reload to start fresh after clearing draft
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '05-self-listing-page');
    log('STEP 3', 'Self-listing page ready');

    // ========================================================================
    // STEP 4: Section 1 - Space Snapshot
    // ========================================================================
    log('STEP 4', 'Filling Section 1: Space Snapshot...');

    // Listing Name
    await waitAndFill(page, '#listingName', CONFIG.listing.name, 'Listing Name');

    // Type of Space
    await waitAndSelect(page, '#typeOfSpace', CONFIG.listing.typeOfSpace, 'Type of Space');

    // Bedrooms
    await waitAndSelect(page, '#bedrooms', CONFIG.listing.bedrooms, 'Bedrooms');

    // Type of Kitchen
    await waitAndSelect(page, '#typeOfKitchen', CONFIG.listing.kitchenType, 'Kitchen Type');

    // Beds
    await waitAndSelect(page, '#beds', CONFIG.listing.beds, 'Beds');

    // Type of Parking
    await waitAndSelect(page, '#typeOfParking', CONFIG.listing.parkingType, 'Parking Type');

    // Bathrooms
    await waitAndSelect(page, '#bathrooms', CONFIG.listing.bathrooms, 'Bathrooms');

    await screenshot(page, '06-section1-fields-filled');

    // Address - Type into Google Maps autocomplete
    log('STEP 4', 'Filling address via Google Maps autocomplete...');
    const addressInput = page.locator('#fullAddress');
    await addressInput.waitFor({ state: 'visible' });
    await addressInput.click();
    await addressInput.fill('');

    // Type slowly to trigger autocomplete suggestions
    await addressInput.pressSequentially(CONFIG.listing.address, { delay: 80 });
    log('STEP 4', 'Typed address, waiting for autocomplete suggestions...');

    // Wait for Google Maps autocomplete dropdown
    await page.waitForTimeout(2000);

    // Try to click the first autocomplete suggestion
    const pacItem = page.locator('.pac-container .pac-item').first();
    const autocompleteAppeared = await pacItem.isVisible().catch(() => false);

    if (autocompleteAppeared) {
      log('STEP 4', 'Autocomplete dropdown appeared, clicking first suggestion...');
      await pacItem.click();
      await page.waitForTimeout(1000);
    } else {
      // Fallback: Use manual address entry
      log('STEP 4', 'Autocomplete not available, using manual address entry...');

      // Click "Can't find your address? Enter manually"
      const manualEntryBtn = page.locator('button.btn-link:has-text("Enter manually")');
      if (await manualEntryBtn.isVisible().catch(() => false)) {
        await manualEntryBtn.click();
        await page.waitForTimeout(500);
      }

      // Fill manual address fields
      await waitAndFill(page, '#number', CONFIG.listing.manualAddress.number, 'Street Number');
      await waitAndFill(page, '#street', CONFIG.listing.manualAddress.street, 'Street Name');
      await waitAndFill(page, '#city', CONFIG.listing.manualAddress.city, 'City');
      await waitAndSelect(page, '#state', CONFIG.listing.manualAddress.state, 'State');
      await waitAndFill(page, '#zip', CONFIG.listing.manualAddress.zip, 'Zip Code');
      await waitAndFill(page, '#neighborhood', CONFIG.listing.manualAddress.neighborhood, 'Neighborhood');

      // Set address as validated via localStorage manipulation
      // (manual entry alone does not set validated=true, which the parent requires)
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

    await screenshot(page, '07-section1-address-filled');

    // Click Next
    log('STEP 4', 'Clicking Next...');
    await waitAndClick(page, 'button.btn-next', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '08-section2-loaded');
    log('STEP 4', 'Section 1 complete');

    // ========================================================================
    // STEP 5: Section 2 - Features
    // ========================================================================
    log('STEP 5', 'Filling Section 2: Features...');

    // Wait for amenities to load from database
    await page.waitForTimeout(2000);

    // Click "load common" for in-unit amenities
    const loadCommonInUnit = page.locator('#amenitiesInsideUnit button.btn-link:has-text("load common")');
    if (await loadCommonInUnit.isVisible().catch(() => false)) {
      await loadCommonInUnit.click();
      log('STEP 5', 'Loaded common in-unit amenities');
      await page.waitForTimeout(1500);
    } else {
      // Manually click some amenity checkboxes if "load common" is not found
      log('STEP 5', 'Load common button not found, clicking individual amenities...');
      const checkboxes = page.locator('#amenitiesInsideUnit .checkbox-label');
      const count = await checkboxes.count();
      // Click first 5 amenities
      for (let i = 0; i < Math.min(5, count); i++) {
        await checkboxes.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    // Fill description
    await waitAndFill(
      page,
      '#descriptionOfLodging',
      CONFIG.listing.description,
      'Description of Lodging'
    );

    await screenshot(page, '09-section2-filled');

    // Click Next
    await waitAndClick(page, 'button.btn-next', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '10-section3-loaded');
    log('STEP 5', 'Section 2 complete');

    // ========================================================================
    // STEP 6: Section 3 - Lease Styles
    // ========================================================================
    log('STEP 6', 'Filling Section 3: Lease Styles...');

    // Click "Monthly" card
    await waitAndClick(
      page,
      '.rental-type-card:has-text("Monthly")',
      'Monthly rental type card'
    );
    await page.waitForTimeout(500);

    // Agree to subsidy terms - click "I agree to the monthly subsidy terms"
    const agreeRadio = page.locator('label.radio-label:has-text("I agree")');
    if (await agreeRadio.isVisible().catch(() => false)) {
      await agreeRadio.click();
      log('STEP 6', 'Agreed to monthly subsidy terms');
    }

    await screenshot(page, '11-section3-filled');

    // Click Next
    await waitAndClick(page, 'button.btn-next', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '12-section4-loaded');
    log('STEP 6', 'Section 3 complete');

    // ========================================================================
    // STEP 7: Section 4 - Pricing
    // ========================================================================
    log('STEP 7', 'Filling Section 4: Pricing...');

    // Monthly Compensation
    await waitAndFill(
      page,
      '#monthlyCompensation',
      CONFIG.listing.monthlyCompensation,
      'Monthly Compensation'
    );

    // Damage Deposit - should default to 500, clear and set it explicitly
    const damageInput = page.locator('#damageDeposit');
    if (await damageInput.isVisible().catch(() => false)) {
      await damageInput.fill(CONFIG.listing.damageDeposit);
      log('STEP 7', 'Set damage deposit');
    }

    await screenshot(page, '13-section4-filled');

    // Click Next
    await waitAndClick(page, 'button.btn-next', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '14-section5-loaded');
    log('STEP 7', 'Section 4 complete');

    // ========================================================================
    // STEP 8: Section 5 - Rules
    // ========================================================================
    log('STEP 8', 'Filling Section 5: Rules...');

    // Cancellation Policy
    await waitAndSelect(
      page,
      '#cancellationPolicy',
      CONFIG.listing.cancellationPolicy,
      'Cancellation Policy'
    );

    // Load common house rules
    const loadCommonRules = page.locator('button.btn-link:has-text("load common house rules")');
    if (await loadCommonRules.isVisible().catch(() => false)) {
      await loadCommonRules.click();
      log('STEP 8', 'Loaded common house rules');
      await page.waitForTimeout(500);
    }

    await screenshot(page, '15-section5-filled');

    // Click Next
    await waitAndClick(page, 'button.btn-next', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '16-section6-loaded');
    log('STEP 8', 'Section 5 complete');

    // ========================================================================
    // STEP 9: Section 6 - Photos (Upload 3 test images)
    // ========================================================================
    log('STEP 9', 'Section 6: Photos - Uploading 3 test images...');

    // Upload test images via the hidden file input
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(testImagePaths);
    log('STEP 9', 'Set 3 test image files on file input');

    // Wait for uploads to complete (uploads to Supabase storage)
    log('STEP 9', 'Waiting for photo uploads to complete...');
    await page.waitForTimeout(8000);

    // Verify photos appeared
    const photoCount = await page.locator('.photo-item').count();
    log('STEP 9', `Photos uploaded: ${photoCount}`);
    await screenshot(page, '17-section6-photos-uploaded');

    // Click Next (not Skip - we have photos now)
    await waitAndClick(page, 'button.btn-next:has-text("Next")', 'Next button');
    await page.waitForTimeout(1500);
    await screenshot(page, '18-section7-loaded');
    log('STEP 9', 'Section 6 complete');

    // ========================================================================
    // STEP 10: Section 7 - Review & Submit
    // ========================================================================
    log('STEP 10', 'Section 7: Review & Submit...');

    // Scroll down to see the full review page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, '18-section7-review');

    // Click Submit Listing
    log('STEP 10', 'Clicking Submit Listing...');
    await waitAndClick(page, 'button.btn-submit:has-text("Submit Listing")', 'Submit Listing button');

    // Wait for submission to complete
    log('STEP 10', 'Waiting for submission...');
    await page.waitForTimeout(5000);
    await screenshot(page, '19-after-submit');

    // Track the listing ID for the observer
    let capturedListingId = null;

    // Check for success modal
    const successModal = page.locator('text=Listing Created Successfully');
    const hasSuccess = await successModal.isVisible({ timeout: 15000 }).catch(() => false);

    if (hasSuccess) {
      log('STEP 10', 'Listing created successfully!');
      await screenshot(page, '20-success-modal');

      // Try to extract listing ID from the success modal
      // The "Preview Listing" link contains the listing ID in its href
      const previewLink = page.locator('a[href*="preview-split-lease"], a[href*="view-split-lease"]');
      const previewHref = await previewLink.first().getAttribute('href').catch(() => null);
      if (previewHref) {
        // Extract ID from URL like /preview-split-lease/1234567890123x456
        const match = previewHref.match(/\/(preview-split-lease|view-split-lease)\/([^/?#]+)/);
        if (match) {
          capturedListingId = match[2];
          log('STEP 10', `Captured listing ID from success modal: ${capturedListingId}`);
        }
      }
    } else {
      // Check for auth modal (if login session expired)
      const authModal = page.locator('input[type="email"][placeholder="john@example.com"]');
      const hasAuthModal = await authModal.isVisible().catch(() => false);

      if (hasAuthModal) {
        log('STEP 10', 'Auth modal appeared - re-authenticating...');
        await authModal.fill(CONFIG.credentials.email);
        await page.locator('input[placeholder="Enter your password"]').fill(CONFIG.credentials.password);
        await page.locator('button[type="submit"]:has-text("Log In")').click();
        await page.waitForTimeout(5000);
        await screenshot(page, '20-re-auth-submit');

        // Check for success again
        const successAfterAuth = await page.locator('text=Listing Created Successfully').isVisible({ timeout: 15000 }).catch(() => false);
        if (successAfterAuth) {
          log('STEP 10', 'Listing created successfully after re-auth!');
          await screenshot(page, '21-success-after-reauth');

          // Try to extract listing ID
          const previewLink2 = page.locator('a[href*="preview-split-lease"], a[href*="view-split-lease"]');
          const href2 = await previewLink2.first().getAttribute('href').catch(() => null);
          if (href2) {
            const match2 = href2.match(/\/(preview-split-lease|view-split-lease)\/([^/?#]+)/);
            if (match2) capturedListingId = match2[2];
          }
        }
      } else {
        // Check for error alerts
        log('STEP 10', 'No success modal detected - checking for errors...');
        await screenshot(page, '20-possible-error');
      }
    }

    // ========================================================================
    // STEP 11: Bubble Backend Observer
    // ========================================================================
    // Run observer regardless of submission outcome
    // It will check Supabase for any listing matching the host email + name
    log('STEP 11', 'Running Bubble Backend Observer...');
    try {
      const report = await runBubbleObserver(capturedListingId);
      log('STEP 11', `Observer complete: ${report.summary.supabaseMatch}/${report.summary.total} Supabase matches`);
      if (report.bubbleFound) {
        log('STEP 11', `Bubble: ${report.summary.bubbleMatch}/${report.summary.total} matches`);
      } else {
        log('STEP 11', 'Bubble: listing not found (sync may be disabled or pending)');
      }
    } catch (observerError) {
      log('STEP 11', `Observer failed: ${observerError.message}`);
    }

    log('DONE', 'Script completed');
  } catch (error) {
    log('ERROR', `Script failed: ${error.message}`);
    await screenshot(page, 'ERROR-final-state').catch(() => {});
    console.error(error);

    // Still run the observer on error — listing may have been created in
    // Supabase even if the Playwright flow hit an auth or UI issue
    log('OBSERVER', 'Running observer after error (checking if listing was created)...');
    try {
      const report = await runBubbleObserver(null);
      if (report.supabaseFound) {
        log('OBSERVER', `Listing WAS created in Supabase despite error: _id=${report.supabaseListingId}`);
        log('OBSERVER', `Supabase matches: ${report.summary.supabaseMatch}/${report.summary.total}`);
      } else {
        log('OBSERVER', 'No listing found in Supabase (not created)');
      }
    } catch (obsErr) {
      log('OBSERVER', `Observer also failed: ${obsErr.message}`);
    }
  } finally {
    // Close context to finalize video
    await page.waitForTimeout(2000);
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      log('VIDEO', `Recording saved: ${videoPath}`);
    }
    log('DONE', `Screenshots saved to: ${screenshotsDir}`);

    // Write a run-summary.json for quick cross-run comparison
    const runSummary = {
      run: runTimestamp,
      site: siteName,
      baseURL: CONFIG.baseURL,
      credentials: { email: CONFIG.credentials.email },
      listing: CONFIG.listing,
      videoFile: videoPath ? path.basename(videoPath) : null,
      screenshotCount: fs.readdirSync(screenshotsDir).filter((f) => f.endsWith('.png')).length,
      outputDir: recordingsDir,
    };
    const summaryPath = path.join(recordingsDir, 'run-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(runSummary, null, 2));
    log('DONE', `Run summary: ${summaryPath}`);
  }
})();
