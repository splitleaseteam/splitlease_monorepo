import { chromium } from 'playwright';

async function checkPage(browser, url) {
  const page = await browser.newPage();

  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Visiting: ${url}`);
    console.log('='.repeat(60));

    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait 5-8 seconds for page to fully load
    await page.waitForTimeout(7000);

    // Take screenshot
    await page.screenshot({ path: `screenshot-${url.split('/').pop() || 'home'}.png` });
    console.log('Screenshot taken');

    // Log all console messages
    console.log('\nConsole Output:');
    console.log('-'.repeat(60));
    if (consoleMessages.length === 0) {
      console.log('(No console messages)');
    } else {
      consoleMessages.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    // Log page errors
    if (errors.length > 0) {
      console.log('\nPage Errors:');
      console.log('-'.repeat(60));
      errors.forEach(err => {
        console.log(err);
      });
    }

    // Check for specific error patterns
    console.log('\nError Pattern Analysis:');
    console.log('-'.repeat(60));

    const allText = consoleMessages.map(m => m.text).join('\n');
    const hasIdError = allText.includes('_id') && (allText.includes('does not exist') || allText.includes('column'));
    const hasValidateDOMNesting = allText.includes('validateDOMNesting');

    console.log(`"_id does not exist" errors: ${hasIdError ? 'FOUND' : 'NONE'}`);
    console.log(`"validateDOMNesting" warnings: ${hasValidateDOMNesting ? 'FOUND' : 'NONE'}`);

    // Detailed search for specific error patterns
    const idErrorMessages = consoleMessages.filter(msg =>
      msg.text.includes('_id') && (msg.text.includes('does not exist') || msg.text.includes('column'))
    );

    const validateDOMMessages = consoleMessages.filter(msg =>
      msg.text.includes('validateDOMNesting')
    );

    if (idErrorMessages.length > 0) {
      console.log('\nDetailed _id errors:');
      idErrorMessages.forEach(msg => console.log(`  [${msg.type}] ${msg.text}`));
    }

    if (validateDOMMessages.length > 0) {
      console.log('\nDetailed validateDOMNesting warnings:');
      validateDOMMessages.forEach(msg => console.log(`  [${msg.type}] ${msg.text}`));
    }

    const verdict = !hasIdError && !hasValidateDOMNesting ? 'PASS' : 'FAIL';
    console.log(`\nVerdict: ${verdict}`);

  } catch (error) {
    console.error(`Error visiting ${url}:`, error);
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    await checkPage(browser, 'http://localhost:3001/');
    await checkPage(browser, 'http://localhost:3001/messages');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
