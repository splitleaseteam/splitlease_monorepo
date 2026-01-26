/**
 * Visual Validation Automation Script
 * Compares Bubble prototype vs local development for 12 admin pages
 *
 * Usage: node scripts/visual-validation.js
 *
 * Prerequisites:
 * - Local dev server running on http://localhost:8001
 * - Network access to https://app.split.lease
 * - Chrome/Chromium browser available for Playwright
 */

const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

// Page configuration
const PAGES_TO_VALIDATE = [
  {
    name: "Verify Users",
    id: "01-verify-users",
    bubble: "https://app.split.lease/version-test/_verify-users",
    local: "http://localhost:8001/_internal/verify-users"
  },
  {
    name: "Proposal Management",
    id: "02-proposal-management",
    bubble: "https://app.split.lease/version-test/_proposal-manage",
    local: "http://localhost:8001/_internal/proposal-manage"
  },
  {
    name: "Virtual Meetings",
    id: "03-virtual-meetings",
    bubble: "https://app.split.lease/version-test/_manage-virtual-meetings",
    local: "http://localhost:8001/_internal/manage-virtual-meetings"
  },
  {
    name: "Message Curation",
    id: "04-message-curation",
    bubble: "https://app.split.lease/version-test/_message-curation",
    local: "http://localhost:8001/_internal/message-curation"
  },
  {
    name: "Co-Host Requests",
    id: "05-co-host-requests",
    bubble: "https://app.split.lease/version-test/_co-host-requests",
    local: "http://localhost:8001/_internal/co-host-requests"
  },
  {
    name: "Internal Emergency",
    id: "06-internal-emergency",
    bubble: "https://app.split.lease/version-test/_internal-emergency",
    local: "http://localhost:8001/_internal/emergency"
  },
  {
    name: "Leases Overview",
    id: "07-leases-overview",
    bubble: "https://app.split.lease/version-test/_leases-overview",
    local: "http://localhost:8001/_internal/leases-overview"
  },
  {
    name: "Admin Threads",
    id: "08-admin-threads",
    bubble: "https://app.split.lease/version-test/_quick-threads-manage",
    local: "http://localhost:8001/_internal/admin-threads"
  },
  {
    name: "Modify Listings",
    id: "09-modify-listings",
    bubble: "https://app.split.lease/version-test/_modify-listings",
    local: "http://localhost:8001/_internal/modify-listings"
  },
  {
    name: "Rental Applications",
    id: "10-rental-applications",
    bubble: "https://app.split.lease/version-test/_rental-app-manage",
    local: "http://localhost:8001/_internal/manage-rental-applications"
  },
  {
    name: "Quick Price",
    id: "11-quick-price",
    bubble: "https://app.split.lease/version-test/_quick-price",
    local: "http://localhost:8001/_internal/quick-price"
  },
  {
    name: "Magic Login Links",
    id: "12-magic-login-links",
    bubble: "https://app.split.lease/version-test/_send-magic-login-links",
    local: "http://localhost:8001/_internal/send-magic-login-links"
  }
];

const SCREENSHOT_DIR = path.join(__dirname, '../docs/Done/visual-validation-screenshots');
const REPORT_PATH = path.join(__dirname, '../docs/Done/VISUAL_VALIDATION_REPORT.md');

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    console.log(`Created directory: ${SCREENSHOT_DIR}`);
  }
}

// Navigate and capture screenshot
async function navigateAndCapture(page, url, timeoutMs = 10000) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    // Wait for page stabilization
    await page.waitForTimeout(2000);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Take full-page screenshot
async function takeScreenshot(page, filename) {
  try {
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return { success: true, path: filepath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Main validation workflow
async function runValidation() {
  console.log('Starting visual validation process...');
  ensureDirectories();

  let browser;
  const results = [];

  try {
    browser = await playwright.chromium.launch();
    const context = await browser.createContext();
    const page = await context.newPage();

    // Set viewport to standard size
    await page.setViewportSize({ width: 1920, height: 1080 });

    for (const pageConfig of PAGES_TO_VALIDATE) {
      console.log(`\nProcessing: ${pageConfig.name}`);

      const result = {
        name: pageConfig.name,
        id: pageConfig.id,
        local: { url: pageConfig.local, status: 'pending', screenshot: null, error: null },
        bubble: { url: pageConfig.bubble, status: 'pending', screenshot: null, error: null }
      };

      // Capture local version
      console.log(`  -> Capturing local version...`);
      const localNav = await navigateAndCapture(page, pageConfig.local);
      if (localNav.success) {
        const screenshot = await takeScreenshot(page, `${pageConfig.id}-local.png`);
        result.local.status = screenshot.success ? 'success' : 'screenshot_error';
        result.local.screenshot = screenshot.success ? `${pageConfig.id}-local.png` : null;
        result.local.error = screenshot.error;
      } else {
        result.local.status = 'navigation_error';
        result.local.error = localNav.error;
      }

      // Capture Bubble version
      console.log(`  -> Capturing Bubble version...`);
      const bubbleNav = await navigateAndCapture(page, pageConfig.bubble);
      if (bubbleNav.success) {
        const screenshot = await takeScreenshot(page, `${pageConfig.id}-bubble.png`);
        result.bubble.status = screenshot.success ? 'success' : 'screenshot_error';
        result.bubble.screenshot = screenshot.success ? `${pageConfig.id}-bubble.png` : null;
        result.bubble.error = screenshot.error;
      } else {
        result.bubble.status = 'navigation_error';
        result.bubble.error = bubbleNav.error;
      }

      results.push(result);
      console.log(`  -> Local: ${result.local.status} | Bubble: ${result.bubble.status}`);
    }

    await context.close();
    await browser.close();

    // Generate report
    generateReport(results);
    console.log(`\nValidation complete. Report saved to: ${REPORT_PATH}`);

  } catch (err) {
    console.error('Fatal error during validation:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Generate markdown report
function generateReport(results) {
  const timestamp = new Date().toISOString();

  let report = `# VISUAL VALIDATION REPORT

**Generated**: ${timestamp}
**Status**: Manual review required

## Summary

- **Total Pages**: ${results.length}
- **Successful Captures**: ${results.filter(r => r.local.status === 'success' && r.bubble.status === 'success').length}
- **Issues Found**: ${results.filter(r => r.local.status !== 'success' || r.bubble.status !== 'success').length}

---

## Comparison Results

| # | Page | Local | Bubble | Match % | Notes |
|---|------|-------|--------|---------|-------|
`;

  results.forEach((result, idx) => {
    const localStatus = result.local.status === 'success' ? '✓' : '✗';
    const bubbleStatus = result.bubble.status === 'success' ? '✓' : '✗';
    report += `| ${idx + 1} | ${result.name} | ${localStatus} | ${bubbleStatus} | TBD | Manual review |
`;
  });

  report += `

---

## Detailed Findings

`;

  results.forEach(result => {
    report += `

### ${result.name}

**URLs**:
- Local: [\`${result.local.url}\`](${result.local.url})
- Bubble: [\`${result.bubble.url}\`](${result.bubble.url})

**Capture Status**:
- Local: ${result.local.status}${result.local.error ? ` (${result.local.error})` : ''}
- Bubble: ${result.bubble.status}${result.bubble.error ? ` (${result.bubble.error})` : ''}

**Screenshots**:
${result.local.screenshot ? `- Local: ![Local Version](./visual-validation-screenshots/${result.local.screenshot})` : '- Local: Failed to capture'}
${result.bubble.screenshot ? `- Bubble: ![Bubble Version](./visual-validation-screenshots/${result.bubble.screenshot})` : '- Bubble: Failed to capture'}

**Visual Comparison Checklist**:

| Element | Local | Bubble | Match | Notes |
|---------|-------|--------|-------|-------|
| Header/Navigation | [ ] | [ ] | [ ] | |
| Layout & Spacing | [ ] | [ ] | [ ] | |
| Colors & Branding | [ ] | [ ] | [ ] | |
| Typography | [ ] | [ ] | [ ] | |
| Components | [ ] | [ ] | [ ] | |
| Responsive Design | [ ] | [ ] | [ ] | |

**Issues Found**:
- [ ] No issues
- [ ] Minor styling differences
- [ ] Significant layout differences
- [ ] Missing components
- [ ] Other: _____________

**Recommended Actions**:
1. Review screenshots side-by-side
2. Document any discrepancies above
3. Assign priority (High/Medium/Low)
4. Create tickets for fixes if needed

---
`;
  });

  report += `

## Next Steps

1. **Manual Review**: Open each pair of screenshots and compare carefully
2. **Document Issues**: Update the "Issues Found" section with specific discrepancies
3. **Assign Priorities**: Mark each issue as High/Medium/Low severity
4. **Create Tickets**: For any issues marked High priority
5. **Final Approval**: Verify 95%+ visual match before deployment

## Validation Criteria

- **95%+ Match**: Page approved, ready for production
- **90-94% Match**: Minor fixes needed, document and remediate
- **<90% Match**: Significant rework required, escalate to design team

---

**Report last updated**: ${timestamp}
`;

  fs.writeFileSync(REPORT_PATH, report);
}

// Run if executed directly
if (require.main === module) {
  runValidation().catch(console.error);
}

module.exports = { runValidation, PAGES_TO_VALIDATE };
