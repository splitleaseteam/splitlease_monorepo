/**
 * Interactive Bubble Checkbox Debug Script
 *
 * Opens the Bubble listing wizard at Section 2 (Features), then PAUSES
 * so the user can manually click "load common" while the script monitors:
 * - Network requests
 * - DOM mutations (checkbox state changes)
 * - Console messages
 *
 * After the user interacts, take screenshots and log what changed.
 *
 * Usage: node e2e/bubble-checkbox-debug.cjs
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CONFIG = {
  baseURL: 'https://app.split.lease',
  host: { email: 'rodtesthost2@test.com', password: 'eCom@2024' },
  listing: {
    name: `Debug Listing ${new Date().toISOString().substring(0, 16)}`,
    typeOfSpace: 'Private Room',
    bedrooms: '1',
    kitchen: 'Shared',
    beds: '1',
    parking: 'No',
    bathrooms: '1',
    address: '350 5th Ave, New York, NY',
  },
};

const outputDir = path.join(__dirname, 'recordings', 'bubble-debug', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(outputDir, { recursive: true });

function log(tag, msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

async function screenshot(page, name) {
  const filePath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  log('SCREENSHOT', `Saved: ${name}.png`);
}

(async () => {
  log('INIT', 'Launching browser (headed mode)...');
  log('INIT', `Output: ${outputDir}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);

  // Anti-detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // ── LOGIN ──
    log('LOGIN', 'Navigating to app.split.lease...');
    await page.goto(CONFIG.baseURL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    log('LOGIN', 'Clicking Sign In...');
    const signIn = page.getByText('Sign In | Sign Up', { exact: true });
    await signIn.waitFor({ state: 'visible', timeout: 20000 });
    await signIn.click();
    await page.waitForTimeout(2000);

    const loginOption = page.getByText('Log into my account', { exact: false });
    await loginOption.waitFor({ state: 'visible', timeout: 10000 });
    await loginOption.click();
    await page.waitForTimeout(1500);

    // Remove greyout
    await page.evaluate(() => document.querySelectorAll('.greyout').forEach(g => g.remove()));
    await page.waitForTimeout(500);

    // Fill credentials
    const emailInput = page.locator('input[placeholder="example@example.com*"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.click();
    await emailInput.press('Control+a');
    await emailInput.press('Backspace');
    await emailInput.pressSequentially(CONFIG.host.email, { delay: 50 });

    const passwordInput = page.locator('input[type="password"]:visible').first();
    await passwordInput.click();
    await passwordInput.press('Control+a');
    await passwordInput.press('Backspace');
    await passwordInput.pressSequentially(CONFIG.host.password, { delay: 50 });

    const loginBtn = page.locator('#loginButtonID');
    await loginBtn.click();
    await page.waitForTimeout(3000);
    log('LOGIN', 'Login complete');

    // ── NAVIGATE TO WIZARD ──
    log('NAV', 'Going to listing wizard...');
    await page.goto(`${CONFIG.baseURL}/create-listing`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    await screenshot(page, '01-wizard-loaded');

    // ── SECTION 1: Fill minimal required fields ──
    log('SECTION1', 'Filling Section 1 (Space Snapshot)...');

    // Listing Name
    const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="title"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.click();
      await nameInput.pressSequentially(CONFIG.listing.name, { delay: 30 });
      log('SECTION1', 'Name filled');
    }

    // Dropdowns via evaluate
    const dropdownResult = await page.evaluate((cfg) => {
      const selects = Array.from(document.querySelectorAll('select'));
      const visible = selects.filter(s => s.offsetParent !== null);
      const results = [];

      const mappings = [
        { label: 'Type of Space', value: cfg.typeOfSpace },
        { label: 'Bedrooms', value: cfg.bedrooms },
        { label: 'Kitchen', value: cfg.kitchen },
        { label: 'Beds', value: cfg.beds },
        { label: 'Parking', value: cfg.parking },
        { label: 'Bathrooms', value: cfg.bathrooms },
      ];

      for (let i = 0; i < Math.min(mappings.length, visible.length); i++) {
        const sel = visible[i];
        const target = mappings[i];
        const options = Array.from(sel.options);
        const match = options.find(o =>
          !o.value.includes('PLACEHOLDER') && o.value !== '' &&
          (o.text.trim() === target.value || o.value === target.value ||
           o.text.trim().includes(target.value))
        );
        if (match) {
          sel.value = match.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          results.push({ label: target.label, status: 'OK', value: match.text.trim() });
        } else {
          // Pick first non-placeholder option
          const fallback = options.find(o => !o.value.includes('PLACEHOLDER') && o.value !== '' && o.text.trim());
          if (fallback) {
            sel.value = fallback.value;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            results.push({ label: target.label, status: 'FALLBACK', value: fallback.text.trim() });
          } else {
            results.push({ label: target.label, status: 'FAILED' });
          }
        }
      }
      return results;
    }, CONFIG.listing);
    log('SECTION1', `Dropdowns: ${JSON.stringify(dropdownResult)}`);

    // Address
    const addressInput = page.locator('input[placeholder*="Address"], input[placeholder*="address"]').first();
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.click();
      await addressInput.pressSequentially(CONFIG.listing.address, { delay: 30 });
      await page.waitForTimeout(3000);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Click Next to go to Section 2
    log('SECTION1', 'Clicking Next...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(b => b.textContent.trim() === 'Next' && b.offsetParent !== null);
      if (nextBtn) nextBtn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '02-section2-features');

    // ── SECTION 2: PAUSE FOR MANUAL INTERACTION ──
    log('SECTION2', '');
    log('SECTION2', '╔══════════════════════════════════════════════════════════════╗');
    log('SECTION2', '║  MANUAL INTERACTION MODE — PLEASE INTERACT WITH THE BROWSER ║');
    log('SECTION2', '╠══════════════════════════════════════════════════════════════╣');
    log('SECTION2', '║                                                              ║');
    log('SECTION2', '║  1. Click "load common" next to "Amenities inside Unit*"    ║');
    log('SECTION2', '║  2. Wait for checkboxes to fill in                          ║');
    log('SECTION2', '║  3. The script will detect the changes automatically        ║');
    log('SECTION2', '║                                                              ║');
    log('SECTION2', '║  You have 120 seconds. The script monitors for changes.     ║');
    log('SECTION2', '║                                                              ║');
    log('SECTION2', '╚══════════════════════════════════════════════════════════════╝');
    log('SECTION2', '');

    // Set up monitoring BEFORE the user interacts
    // 1. Network request logging
    const networkLog = [];
    page.on('request', (req) => {
      if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
        networkLog.push({
          time: Date.now(),
          method: req.method(),
          url: req.url().substring(0, 150),
          postData: req.postData()?.substring(0, 200) || null,
        });
      }
    });

    page.on('response', (res) => {
      if (res.request().resourceType() === 'xhr' || res.request().resourceType() === 'fetch') {
        networkLog.push({
          time: Date.now(),
          type: 'response',
          status: res.status(),
          url: res.url().substring(0, 150),
        });
      }
    });

    // 2. Console message logging
    const consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push({ time: Date.now(), type: msg.type(), text: msg.text().substring(0, 200) });
    });

    // 3. Set up MutationObserver inside the page to track checkbox changes
    await page.evaluate(() => {
      window.__checkboxChanges = [];
      window.__domMutations = [];

      // Watch all checkbox inputs for property changes
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          window.__domMutations.push({
            type: m.type,
            target: m.target.tagName + '.' + (m.target.className || '').substring(0, 30),
            attribute: m.attributeName,
            addedNodes: m.addedNodes.length,
            removedNodes: m.removedNodes.length,
          });
        }
      });

      // Observe the entire amenity section
      const amenitySection = document.querySelector('.ionic-IonicCheckbox')?.closest('[id]') || document.body;
      observer.observe(amenitySection, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['class', 'style', 'checked', 'data-checked'],
      });

      // Also intercept change/click events on checkboxes
      document.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          window.__checkboxChanges.push({
            time: Date.now(), event: 'change',
            checked: e.target.checked, trusted: e.isTrusted,
            target: e.target.className.substring(0, 40),
          });
        }
      }, true);

      document.addEventListener('click', (e) => {
        const cb = e.target.closest('.ionic-IonicCheckbox') || (e.target.type === 'checkbox' ? e.target : null);
        if (cb) {
          window.__checkboxChanges.push({
            time: Date.now(), event: 'click',
            trusted: e.isTrusted, target: e.target.tagName + '.' + (e.target.className || '').substring(0, 30),
          });
        }
      }, true);
    });

    // 4. Poll for checkbox changes every 2 seconds
    let lastCheckedCount = 0;
    const startTime = Date.now();
    const TIMEOUT = 120000; // 120 seconds

    while (Date.now() - startTime < TIMEOUT) {
      await page.waitForTimeout(2000);

      const currentState = await page.evaluate(() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        const visible = checkboxes.filter(cb => cb.offsetParent !== null);
        const checked = visible.filter(cb => cb.checked).length;
        return {
          checked,
          total: visible.length,
          changes: window.__checkboxChanges || [],
          mutations: (window.__domMutations || []).length,
          url: window.location.href,
        };
      }).catch(() => ({ checked: 0, total: 0, changes: [], mutations: 0, url: 'error' }));

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (currentState.checked !== lastCheckedCount) {
        log('MONITOR', `*** CHANGE DETECTED at ${elapsed}s! Checked: ${lastCheckedCount} → ${currentState.checked} (of ${currentState.total})`);
        log('MONITOR', `Checkbox changes: ${JSON.stringify(currentState.changes)}`);
        log('MONITOR', `DOM mutations: ${currentState.mutations}`);
        log('MONITOR', `Network requests since start: ${networkLog.length}`);

        await screenshot(page, `03-change-detected-${elapsed}s`);

        // Log the network requests that happened
        const recentNet = networkLog.filter(n => n.time > startTime);
        log('MONITOR', `Network log (${recentNet.length} requests):`);
        for (const req of recentNet.slice(-20)) {
          log('NETWORK', `  ${req.method || 'RESP'} ${req.status || ''} ${req.url}`);
          if (req.postData) log('NETWORK', `    POST: ${req.postData}`);
        }

        lastCheckedCount = currentState.checked;

        // If we have checked amenities, take a final screenshot and dump all data
        if (currentState.checked > 0) {
          log('SUCCESS', `${currentState.checked} amenities checked!`);
          await page.waitForTimeout(2000);
          await screenshot(page, '04-amenities-checked');

          // Dump full mutation log
          const fullMutations = await page.evaluate(() => window.__domMutations || []);
          log('MUTATIONS', `Total mutations: ${fullMutations.length}`);
          for (const m of fullMutations.slice(-30)) {
            log('MUTATION', `  ${m.type} on ${m.target} attr=${m.attribute} +${m.addedNodes}/-${m.removedNodes}`);
          }

          // Dump full checkbox change log
          const fullChanges = await page.evaluate(() => window.__checkboxChanges || []);
          log('CHANGES', `Total checkbox events: ${fullChanges.length}`);
          for (const c of fullChanges) {
            log('CHANGE', `  ${c.event} trusted=${c.trusted} checked=${c.checked} target=${c.target}`);
          }

          break;
        }
      } else {
        // Periodic status (every 10s)
        if (elapsed % 10 === 0) {
          log('WAITING', `${elapsed}s elapsed — checked: ${currentState.checked}/${currentState.total} | mutations: ${currentState.mutations} | net: ${networkLog.length} | url: ${currentState.url.substring(0, 50)}`);
        }
      }
    }

    // Final state capture
    log('FINAL', 'Capturing final state...');
    await screenshot(page, '05-final-state');

    // Dump all collected data
    const finalData = {
      networkLog: networkLog.slice(-50),
      consoleLogs: consoleLogs.slice(-50),
      checkboxChanges: await page.evaluate(() => window.__checkboxChanges || []).catch(() => []),
      domMutations: await page.evaluate(() => window.__domMutations || []).catch(() => []),
    };

    fs.writeFileSync(
      path.join(outputDir, 'interaction-log.json'),
      JSON.stringify(finalData, null, 2)
    );
    log('FINAL', `Full interaction log saved to: ${path.join(outputDir, 'interaction-log.json')}`);

    // Keep browser open for 30 more seconds for inspection
    log('FINAL', 'Browser stays open for 30 more seconds...');
    await page.waitForTimeout(30000);

  } catch (e) {
    log('ERROR', e.message);
    await screenshot(page, 'ERROR').catch(() => {});
  } finally {
    await context.close();
    await browser.close();
    log('DONE', 'Browser closed');
  }
})();
