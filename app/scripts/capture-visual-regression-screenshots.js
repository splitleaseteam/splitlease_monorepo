/**
 * Visual Regression Screenshot Capture Script
 * Captures full-page screenshots of 21 public pages from localhost:8000
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../../.claude/screenshots/20260128-visual-regression/local');
const BASE_URL = 'http://localhost:8000';

const pages = [
  { url: '/', filename: '01-homepage.png' },
  { url: '/why-split-lease', filename: '02-why-split-lease.png' },
  { url: '/list-with-us', filename: '03-list-with-us.png' },
  { url: '/list-with-us-v2', filename: '04-list-with-us-v2.png' },
  { url: '/about-us', filename: '05-about-us.png' },
  { url: '/careers', filename: '06-careers.png' },
  { url: '/host-guarantee', filename: '07-host-guarantee.png' },
  { url: '/policies', filename: '08-policies.png' },
  { url: '/faq', filename: '09-faq.png' },
  { url: '/referral', filename: '10-referral.png' },
  { url: '/guest-success', filename: '11-guest-success.png' },
  { url: '/host-success', filename: '12-host-success.png' },
  { url: '/help-center', filename: '13-help-center.png' },
  { url: '/qr-code-landing', filename: '14-qr-code-landing.png' },
  { url: '/search', filename: '15-search.png' },
  { url: '/quick-match', filename: '16-quick-match.png' },
  { url: '/reset-password', filename: '17-reset-password.png' },
  { url: '/auth/verify', filename: '18-auth-verify.png' },
  { url: '/visit-manual', filename: '19-visit-manual.png' },
  { url: '/report-emergency', filename: '20-report-emergency.png' },
  { url: '/this-page-does-not-exist-404-test', filename: '21-404.png' },
];

async function captureScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log(`Starting screenshot capture to: ${SCREENSHOT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total pages: ${pages.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const results = {
    success: [],
    failed: []
  };

  for (const pageInfo of pages) {
    const fullUrl = `${BASE_URL}${pageInfo.url}`;
    const screenshotPath = path.join(SCREENSHOT_DIR, pageInfo.filename);

    console.log(`Capturing: ${pageInfo.filename}`);
    console.log(`  URL: ${fullUrl}`);

    try {
      const page = await context.newPage();

      // Navigate and wait for load
      await page.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Additional wait for any animations/lazy loading
      await page.waitForTimeout(2000);

      // Take full-page screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });

      await page.close();

      console.log(`  SUCCESS: ${screenshotPath}\n`);
      results.success.push({
        filename: pageInfo.filename,
        url: fullUrl,
        path: screenshotPath
      });

    } catch (error) {
      console.error(`  FAILED: ${error.message}\n`);
      results.failed.push({
        filename: pageInfo.filename,
        url: fullUrl,
        error: error.message
      });
    }
  }

  await context.close();
  await browser.close();

  // Print summary
  console.log('\n========== SUMMARY ==========');
  console.log(`Total: ${pages.length}`);
  console.log(`Success: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.success.length > 0) {
    console.log('\nSuccessful captures:');
    results.success.forEach(s => console.log(`  - ${s.filename}`));
  }

  if (results.failed.length > 0) {
    console.log('\nFailed captures:');
    results.failed.forEach(f => console.log(`  - ${f.filename}: ${f.error}`));
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);

  return results;
}

captureScreenshots()
  .then(results => {
    process.exit(results.failed.length > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
