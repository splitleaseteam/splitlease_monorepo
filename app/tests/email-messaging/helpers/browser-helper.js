/**
 * Browser Helper for Email/Messaging Testing
 *
 * Utility class for browser automation via Playwright MCP.
 * Wraps common Playwright operations for testing workflows.
 *
 * Usage:
 *   const browser = new BrowserHelper(playwrightMcp);
 *   await browser.navigateTo('http://localhost:8000/login');
 *   await browser.fillForm({ email: 'test@example.com', password: 'xxx' });
 *   await browser.clickButton('Sign In');
 */

class BrowserHelper {
  /**
   * @param {Object} playwrightMcp - Playwright MCP client instance
   */
  constructor(playwrightMcp) {
    this.playwright = playwrightMcp;
    this.baseUrl = 'http://localhost:8000';
  }

  /**
   * Navigate to a URL
   *
   * @param {string} path - Path or full URL
   * @returns {Promise<void>}
   */
  async navigateTo(path) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    await this.playwright.call('mcp__playwright__browser_navigate', { url });
    console.log(`🌐 Navigated to: ${url}`);
  }

  /**
   * Fill a form field by name or label
   *
   * @param {string} field - Field name, label, or selector
   * @param {string} value - Value to enter
   * @returns {Promise<void>}
   */
  async fillField(field, value) {
    // Get current page snapshot to find the field
    const snapshot = await this.playwright.call('mcp__playwright__browser_snapshot');

    // Try to find the field by name, label, or placeholder
    const ref = this._findFieldRef(snapshot, field);

    if (!ref) {
      throw new Error(`Field not found: ${field}`);
    }

    await this.playwright.call('mcp__playwright__browser_type', {
      ref,
      text: value,
    });

    console.log(`⌨️  Filled ${field}: ${value}`);
  }

  /**
   * Fill multiple form fields at once
   *
   * @param {Object} fields - Object with field names and values
   * @returns {Promise<void>}
   */
  async fillForm(fields) {
    for (const [field, value] of Object.entries(fields)) {
      await this.fillField(field, value);
      await this._sleep(100); // Small delay between fields
    }
  }

  /**
   * Click a button or link
   *
   * @param {string} buttonText - Button text or label
   * @returns {Promise<void>}
   */
  async clickButton(buttonText) {
    const snapshot = await this.playwright.call('mcp__playwright__browser_snapshot');
    const ref = this._findButtonRef(snapshot, buttonText);

    if (!ref) {
      throw new Error(`Button not found: ${buttonText}`);
    }

    await this.playwright.call('mcp__playwright__browser_click', {
      ref,
      element: buttonText,
    });

    console.log(`🖱️  Clicked: ${buttonText}`);
  }

  /**
   * Click an element by selector
   *
   * @param {string} selector - CSS selector
   * @param {string} description - Element description for logging
   * @returns {Promise<void>}
   */
  async clickSelector(selector, description) {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.click('${selector}');
      }`,
    });
    console.log(`🖱️  Clicked: ${description}`);
  }

  /**
   * Wait for an element to appear
   *
   * @param {string} selector - CSS selector
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<boolean>}
   */
  async waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await this.playwright.call('mcp__playwright__browser_run_code', {
        code: `async (page) => {
          return await page.locator('${selector}').count();
        }`,
      });

      if (result > 0) {
        console.log(`✅ Element found: ${selector}`);
        return true;
      }

      await this._sleep(500);
    }

    console.log(`❌ Element not found: ${selector}`);
    return false;
  }

  /**
   * Wait for text to appear on page
   *
   * @param {string} text - Text to wait for
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<boolean>}
   */
  async waitForText(text, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const snapshot = await this.playwright.call('mcp__playwright__browser_snapshot');

      if (snapshot.includes(text)) {
        console.log(`✅ Text found: ${text}`);
        return true;
      }

      await this._sleep(500);
    }

    console.log(`❌ Text not found: ${text}`);
    return false;
  }

  /**
   * Check if element is visible
   *
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>}
   */
  async isVisible(selector) {
    const result = await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        const element = await page.locator('${selector}').first();
        return await element.isVisible();
      }`,
    });

    return result === true;
  }

  /**
   * Get element text content
   *
   * @param {string} selector - CSS selector
   * @returns {Promise<string>}
   */
  async getText(selector) {
    const text = await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        return await page.locator('${selector}').first().textContent();
      }`,
    });

    return text?.trim() || '';
  }

  /**
   * Get input field value
   *
   * @param {string} selector - CSS selector
   * @returns {Promise<string>}
   */
  async getValue(selector) {
    const value = await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        return await page.locator('${selector}').first().inputValue();
      }`,
    });

    return value?.trim() || '';
  }

  /**
   * Take a screenshot for debugging
   *
   * @param {string} filename - Screenshot filename
   * @returns {Promise<void>}
   */
  async screenshot(filename) {
    await this.playwright.call('mcp__playwright__browser_take_screenshot', {
      filename,
      type: 'png',
    });
    console.log(`📸 Screenshot saved: ${filename}`);
  }

  /**
   * Get current page URL
   *
   * @returns {Promise<string>}
   */
  async getUrl() {
    const url = await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        return page.url();
      }`,
    });

    return url;
  }

  /**
   * Reload the current page
   *
   * @returns {Promise<void>}
   */
  async reload() {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.reload();
      }`,
    });
    console.log(`🔄 Page reloaded`);
  }

  /**
   * Clear a form field
   *
   * @param {string} field - Field name or selector
   * @returns {Promise<void>}
   */
  async clearField(field) {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.fill('${field}', '');
      }`,
    });
    console.log(`🗑️  Cleared field: ${field}`);
  }

  /**
   * Select option from dropdown
   *
   * @param {string} selector - CSS selector
   * @param {string} value - Option value to select
   * @returns {Promise<void>}
   */
  async selectOption(selector, value) {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.selectOption('${selector}', '${value}');
      }`,
    });
    console.log(`📋 Selected ${value} from ${selector}`);
  }

  /**
   * Check a checkbox
   *
   * @param {string} selector - CSS selector
   * @returns {Promise<void>}
   */
  async check(selector) {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.check('${selector}');
      }`,
    });
    console.log(`☑️  Checked: ${selector}`);
  }

  /**
   * Uncheck a checkbox
   *
   * @param {string} selector - CSS selector
   * @returns {Promise<void>}
   */
  async uncheck(selector) {
    await this.playwright.call('mcp__playwright__browser_run_code', {
      code: `async (page) => {
        await page.uncheck('${selector}');
      }`,
    });
    console.log(`⬜ Unchecked: ${selector}`);
  }

  /**
   * Close the browser
   *
   * @returns {Promise<void>}
   */
  async close() {
    await this.playwright.call('mcp__playwright__browser_close');
    console.log(`🔚 Browser closed`);
  }

  /**
   * Find field reference in snapshot
   *
   * @private
   * @param {string} snapshot - Page snapshot
   * @param {string} field - Field name or label
   * @returns {string|null}
   */
  _findFieldRef(snapshot, field) {
    // This is a simplified version
    // In real implementation, parse the snapshot XML/JSON
    // For now, return null to indicate manual implementation needed
    console.log(`⚠️  _findFieldRef needs manual implementation for field: ${field}`);
    return null;
  }

  /**
   * Find button reference in snapshot
   *
   * @private
   * @param {string} snapshot - Page snapshot
   * @param {string} buttonText - Button text
   * @returns {string|null}
   */
  _findButtonRef(snapshot, buttonText) {
    console.log(`⚠️  _findButtonRef needs manual implementation for button: ${buttonText}`);
    return null;
  }

  /**
   * Sleep helper
   *
   * @private
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BrowserHelper;
