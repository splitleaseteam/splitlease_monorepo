import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALHOST_URL = 'http://localhost:3001';

// Store results
const results = {
  pages: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    criticalIssues: []
  }
};

// Capture console messages and errors
function setupConsoleListeners(page) {
  const consoleMessages = {
    errors: [],
    warnings: [],
    logs: []
  };

  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      consoleMessages.errors.push(text);
    } else if (type === 'warning') {
      consoleMessages.warnings.push(text);
    } else if (type === 'log') {
      consoleMessages.logs.push(text);
    }
  });

  page.on('response', response => {
    if (response.status() >= 500) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  return { consoleMessages, networkErrors };
}

// Check if error is critical
function isCriticalError(errorText) {
  const criticalPatterns = [
    /_id/,
    /column.*does not exist/i,
    /undefined is not an object/i,
    /Cannot read properties of undefined/i,
    /Cannot read property/i
  ];

  return criticalPatterns.some(pattern => pattern.test(errorText));
}

async function reviewPage(browser, url, pageLabel, clickListingSelector = null) {
  let page;
  const pageResult = {
    url,
    label: pageLabel,
    consoleErrors: [],
    networkErrors: [],
    observations: '',
    verdict: 'PASS'
  };

  try {
    page = await browser.newPage();

    // Set up listeners before navigation
    const { consoleMessages, networkErrors } = setupConsoleListeners(page);

    console.log(`\nNavigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
      // Continue even if navigation times out
    });

    // Wait for content to render
    await page.waitForTimeout(3000);

    // Check if page has content
    const bodyContent = await page.evaluate(() => document.body.innerHTML.length);
    const hasContent = bodyContent > 100;

    // Collect results
    const criticalErrors = consoleMessages.errors.filter(isCriticalError);
    const supabaseErrors = networkErrors.filter(err => err.url.includes('supabase'));

    pageResult.consoleErrors = consoleMessages.errors.length > 0 ? consoleMessages.errors : 'None';
    pageResult.networkErrors = networkErrors.length > 0 ? networkErrors : 'None';
    pageResult.observations = `Page loaded: ${hasContent ? 'Yes, has content' : 'No content or blank'}. Console errors: ${consoleMessages.errors.length}, Warnings: ${consoleMessages.warnings.length}`;

    // Determine verdict
    if (criticalErrors.length > 0 || supabaseErrors.length > 0) {
      pageResult.verdict = 'FAIL';
      results.summary.criticalIssues.push({
        page: pageLabel,
        issues: [...criticalErrors, ...supabaseErrors.map(e => `${e.status} from ${e.url}`)]
      });
    } else if (!hasContent) {
      pageResult.verdict = 'WARN';
    }

    // Take screenshot
    const screenshotName = `screenshot-${pageLabel.toLowerCase().replace(/\s+/g, '-')}.png`;
    const screenshotPath = path.join(__dirname, screenshotName);
    await page.screenshot({ path: screenshotPath });
    pageResult.screenshot = screenshotPath;

    // Handle clicking on listing for detail page
    if (clickListingSelector) {
      console.log(`Attempting to click on listing...`);
      await page.click(clickListingSelector).catch(() => console.log('Could not click selector, trying alternatives'));

      // Try alternative selectors if first one fails
      if (!clickListingSelector.includes(',')) {
        await page.click('[data-testid="listing-card"]').catch(() => null);
      }

      await page.waitForTimeout(3000);

      const detailConsole = setupConsoleListeners(page);
      const detailContent = await page.evaluate(() => document.body.innerHTML.length);

      pageResult.consoleErrors = detailConsole.consoleMessages.errors.length > 0
        ? detailConsole.consoleMessages.errors
        : 'None';
      pageResult.networkErrors = detailConsole.networkErrors.length > 0
        ? detailConsole.networkErrors
        : 'None';
      pageResult.observations = `Clicked listing. Page loaded: ${detailContent > 100 ? 'Yes' : 'No'}`;
    }

  } catch (error) {
    pageResult.verdict = 'FAIL';
    pageResult.consoleErrors = [error.message];
    results.summary.criticalIssues.push({
      page: pageLabel,
      issues: [error.message]
    });
  } finally {
    if (page) {
      await page.close();
    }
  }

  results.pages.push(pageResult);
  results.summary.total++;
  if (pageResult.verdict === 'PASS') {
    results.summary.passed++;
  } else if (pageResult.verdict === 'FAIL') {
    results.summary.failed++;
  }

  return pageResult;
}

async function main() {
  const browser = await chromium.launch();

  try {
    console.log('Starting browser console review...\n');

    // 1. Search/Map page
    const searchPageResult = await reviewPage(browser, LOCALHOST_URL, 'Search/Map Page');

    // 2. Listing detail page (click first listing if search page loaded)
    let listingDetailResult;
    if (searchPageResult.verdict !== 'FAIL') {
      listingDetailResult = await reviewPage(
        browser,
        LOCALHOST_URL,
        'Listing Detail Page',
        '[data-testid="listing-card"], .listing-card, a[href*="/listing"]'
      );
    } else {
      // Try direct URL if search failed
      listingDetailResult = await reviewPage(browser, `${LOCALHOST_URL}/listing/1`, 'Listing Detail Page');
    }

    // 3. Login page
    await reviewPage(browser, `${LOCALHOST_URL}/login`, 'Login Page');

    // 4. Dashboard
    await reviewPage(browser, `${LOCALHOST_URL}/dashboard`, 'Dashboard');

    // 5. Proposals page
    await reviewPage(browser, `${LOCALHOST_URL}/proposals`, 'Proposals Page');

    // 6. Messages page
    await reviewPage(browser, `${LOCALHOST_URL}/messages`, 'Messages Page');

    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('BROWSER CONSOLE REVIEW RESULTS');
    console.log('='.repeat(80));

    results.pages.forEach((pageResult, idx) => {
      console.log(`\n${idx + 1}. ${pageResult.label}`);
      console.log(`   URL: ${pageResult.url}`);
      console.log(`   Console Errors: ${Array.isArray(pageResult.consoleErrors) ? pageResult.consoleErrors.join(' | ') : pageResult.consoleErrors}`);
      console.log(`   Network Errors: ${Array.isArray(pageResult.networkErrors) ? pageResult.networkErrors.map(e => `${e.status} ${e.url}`).join(' | ') : pageResult.networkErrors}`);
      console.log(`   Observations: ${pageResult.observations}`);
      console.log(`   Verdict: ${pageResult.verdict}`);
      console.log(`   Screenshot: ${pageResult.screenshot}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Pages Reviewed: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);

    if (results.summary.criticalIssues.length > 0) {
      console.log('\nCRITICAL ISSUES FOUND:');
      results.summary.criticalIssues.forEach(issue => {
        console.log(`  ${issue.page}:`);
        issue.issues.forEach(i => console.log(`    - ${i}`));
      });
    } else {
      console.log('\nNo critical issues found.');
    }

    // Save results to file
    fs.writeFileSync(
      path.join(__dirname, 'console-review-results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\nResults saved to console-review-results.json');

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
