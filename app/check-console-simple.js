import { chromium } from 'playwright';

const LOCALHOST_URL = 'http://localhost:3001';

async function checkPage(browser, url, pageName) {
  let page;
  const results = {
    pageName,
    url,
    consoleErrors: [],
    consoleWarnings: [],
    screenshot: null,
    verdict: 'PASS'
  };

  try {
    page = await browser.newPage();

    // Listen to console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        results.consoleWarnings.push(msg.text());
      }
    });

    console.log(`\nNavigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => {
      console.log(`Navigation timeout/error (continuing): ${e.message}`);
    });

    // Wait 6 seconds as requested
    await page.waitForTimeout(6000);

    // Take screenshot
    const screenshotName = `screenshot-${pageName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotName });
    results.screenshot = screenshotName;

    // Check for critical errors
    const criticalPatterns = [
      'does not exist',
      '_id',
      'column',
      'validateDOMNesting'
    ];

    const hasCriticalError = results.consoleErrors.some(err =>
      criticalPatterns.some(pattern => err.includes(pattern))
    );

    if (hasCriticalError) {
      results.verdict = 'FAIL';
    }

  } catch (error) {
    results.verdict = 'FAIL';
    results.consoleErrors.push(`Navigation error: ${error.message}`);
  } finally {
    if (page) {
      await page.close();
    }
  }

  return results;
}

async function main() {
  const browser = await chromium.launch();

  try {
    console.log('Starting console error review...\n');

    // Check the two requested pages
    const results = [];

    const homepageResult = await checkPage(browser, LOCALHOST_URL, 'Homepage');
    results.push(homepageResult);

    const messagesResult = await checkPage(browser, `${LOCALHOST_URL}/messages`, 'Messages Page');
    results.push(messagesResult);

    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('CONSOLE ERROR REVIEW RESULTS');
    console.log('='.repeat(80));

    results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. Page: ${result.pageName}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Verdict: ${result.verdict}`);
      console.log(`   Screenshot: ${result.screenshot}`);

      if (result.consoleErrors.length === 0) {
        console.log(`   Console Errors: NONE`);
      } else {
        console.log(`   Console Errors (${result.consoleErrors.length}):`);
        result.consoleErrors.forEach(err => {
          console.log(`     - ${err}`);
        });
      }

      if (result.consoleWarnings.length > 0) {
        console.log(`   Console Warnings (${result.consoleWarnings.length}):`);
        result.consoleWarnings.forEach(warn => {
          console.log(`     - ${warn}`);
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    const passCount = results.filter(r => r.verdict === 'PASS').length;
    const failCount = results.filter(r => r.verdict === 'FAIL').length;
    console.log(`Total Pages: ${results.length}`);
    console.log(`PASS: ${passCount}`);
    console.log(`FAIL: ${failCount}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
