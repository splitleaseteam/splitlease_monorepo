/**
 * Visual Validation Script - Playwright Version
 *
 * Automated capture of full-page screenshots for 12 admin pages
 * comparing Bubble prototype vs local development
 *
 * Usage (with Playwright installed):
 * npx ts-node scripts/visual-validation-playwright.ts
 *
 * Or with Deno:
 * deno run --allow-net --allow-write scripts/visual-validation-playwright.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface PageConfig {
  name: string;
  id: string;
  bubble: string;
  local: string;
}

interface CaptureResult {
  name: string;
  id: string;
  local: {
    url: string;
    status: 'success' | 'error';
    screenshot: string | null;
    error: string | null;
  };
  bubble: {
    url: string;
    status: 'success' | 'error';
    screenshot: string | null;
    error: string | null;
  };
  timestamp: string;
}

const PAGES_TO_VALIDATE: PageConfig[] = [
  {
    name: 'Verify Users',
    id: '01-verify-users',
    bubble: 'https://app.split.lease/version-test/_verify-users',
    local: 'http://localhost:8001/_internal/verify-users',
  },
  {
    name: 'Proposal Management',
    id: '02-proposal-management',
    bubble: 'https://app.split.lease/version-test/_proposal-manage',
    local: 'http://localhost:8001/_internal/proposal-manage',
  },
  {
    name: 'Virtual Meetings',
    id: '03-virtual-meetings',
    bubble: 'https://app.split.lease/version-test/_manage-virtual-meetings',
    local: 'http://localhost:8001/_internal/manage-virtual-meetings',
  },
  {
    name: 'Message Curation',
    id: '04-message-curation',
    bubble: 'https://app.split.lease/version-test/_message-curation',
    local: 'http://localhost:8001/_internal/message-curation',
  },
  {
    name: 'Co-Host Requests',
    id: '05-co-host-requests',
    bubble: 'https://app.split.lease/version-test/_co-host-requests',
    local: 'http://localhost:8001/_internal/co-host-requests',
  },
  {
    name: 'Internal Emergency',
    id: '06-internal-emergency',
    bubble: 'https://app.split.lease/version-test/_internal-emergency',
    local: 'http://localhost:8001/_internal/emergency',
  },
  {
    name: 'Leases Overview',
    id: '07-leases-overview',
    bubble: 'https://app.split.lease/version-test/_leases-overview',
    local: 'http://localhost:8001/_internal/leases-overview',
  },
  {
    name: 'Admin Threads',
    id: '08-admin-threads',
    bubble: 'https://app.split.lease/version-test/_quick-threads-manage',
    local: 'http://localhost:8001/_internal/admin-threads',
  },
  {
    name: 'Modify Listings',
    id: '09-modify-listings',
    bubble: 'https://app.split.lease/version-test/_modify-listings',
    local: 'http://localhost:8001/_internal/modify-listings',
  },
  {
    name: 'Rental Applications',
    id: '10-rental-applications',
    bubble: 'https://app.split.lease/version-test/_rental-app-manage',
    local: 'http://localhost:8001/_internal/manage-rental-applications',
  },
  {
    name: 'Quick Price',
    id: '11-quick-price',
    bubble: 'https://app.split.lease/version-test/_quick-price',
    local: 'http://localhost:8001/_internal/quick-price',
  },
  {
    name: 'Magic Login Links',
    id: '12-magic-login-links',
    bubble: 'https://app.split.lease/version-test/_send-magic-login-links',
    local: 'http://localhost:8001/_internal/send-magic-login-links',
  },
];

const SCREENSHOT_DIR = path.join(__dirname, '../docs/Done/visual-validation-screenshots');

/**
 * Navigate to URL and capture screenshot
 */
async function capturePageScreenshot(
  page: any,
  url: string,
  screenshotPath: string,
  timeoutMs: number = 15000
): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log(`  Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // Wait for page stabilization
    await page.waitForTimeout(2000);

    // Capture full-page screenshot
    console.log(`  Capturing screenshot: ${path.basename(screenshotPath)}`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Main validation workflow
 */
async function runValidation() {
  console.log('='.repeat(80));
  console.log('VISUAL VALIDATION - 12 ADMIN PAGES');
  console.log('='.repeat(80));
  console.log(`Screenshot directory: ${SCREENSHOT_DIR}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log();

  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`Created screenshot directory: ${SCREENSHOT_DIR}\n`);
  }

  const results: CaptureResult[] = [];
  let browser;

  try {
    console.log('Launching browser...');
    browser = await chromium.launch();
    const context = await browser.createContext({
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Process each page
    for (let i = 0; i < PAGES_TO_VALIDATE.length; i++) {
      const pageConfig = PAGES_TO_VALIDATE[i];
      const progressStr = `[${i + 1}/${PAGES_TO_VALIDATE.length}]`;

      console.log(`\n${progressStr} Processing: ${pageConfig.name}`);
      console.log('-'.repeat(60));

      const result: CaptureResult = {
        name: pageConfig.name,
        id: pageConfig.id,
        timestamp: new Date().toISOString(),
        local: {
          url: pageConfig.local,
          status: 'error',
          screenshot: null,
          error: null,
        },
        bubble: {
          url: pageConfig.bubble,
          status: 'error',
          screenshot: null,
          error: null,
        },
      };

      // Capture local version
      console.log('Local version:');
      const localScreenshot = path.join(SCREENSHOT_DIR, `${pageConfig.id}-local.png`);
      const localResult = await capturePageScreenshot(page, pageConfig.local, localScreenshot);
      if (localResult.success) {
        result.local.status = 'success';
        result.local.screenshot = `${pageConfig.id}-local.png`;
        console.log('  ✓ Success');
      } else {
        result.local.error = localResult.error;
        console.log(`  ✗ Failed: ${localResult.error}`);
      }

      // Brief pause between captures
      await page.waitForTimeout(500);

      // Capture Bubble version
      console.log('Bubble version:');
      const bubbleScreenshot = path.join(SCREENSHOT_DIR, `${pageConfig.id}-bubble.png`);
      const bubbleResult = await capturePageScreenshot(page, pageConfig.bubble, bubbleScreenshot);
      if (bubbleResult.success) {
        result.bubble.status = 'success';
        result.bubble.screenshot = `${pageConfig.id}-bubble.png`;
        console.log('  ✓ Success');
      } else {
        result.bubble.error = bubbleResult.error;
        console.log(`  ✗ Failed: ${bubbleResult.error}`);
      }

      results.push(result);
    }

    await context.close();
    await browser.close();

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION COMPLETE');
    console.log('='.repeat(80));

    const successCount = results.filter((r) => r.local.status === 'success' && r.bubble.status === 'success').length;
    console.log(`Successfully captured: ${successCount}/${results.length} page pairs`);

    const failedLocal = results.filter((r) => r.local.status === 'error').length;
    const failedBubble = results.filter((r) => r.bubble.status === 'error').length;

    if (failedLocal > 0) {
      console.log(`Failed local captures: ${failedLocal}`);
    }
    if (failedBubble > 0) {
      console.log(`Failed Bubble captures: ${failedBubble}`);
    }

    // Save results to JSON for reference
    const resultsPath = path.join(SCREENSHOT_DIR, 'validation-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);

    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review screenshots in docs/Done/visual-validation-screenshots/');
    console.log('2. Update docs/Done/VISUAL_VALIDATION_REPORT.md with findings');
    console.log('3. Score visual elements (1-5 scale per element)');
    console.log('4. Calculate overall match percentages');
    console.log('5. Document any issues found and assign priorities');

  } catch (err: any) {
    console.error('\n✗ Fatal error during validation:');
    console.error(err);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

// Run validation if this is the main module
runValidation().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
