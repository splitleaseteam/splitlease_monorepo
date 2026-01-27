const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const pages = [
  { id: '01-verify-users', bubbleUrl: 'https://app.split.lease/version-test/_verify-users', localUrl: 'http://localhost:8001/_internal/verify-users', name: 'Verify Users' },
  { id: '02-proposal-manage', bubbleUrl: 'https://app.split.lease/version-test/_proposal-manage', localUrl: 'http://localhost:8001/_internal/proposal-manage', name: 'Proposal Management' },
  { id: '03-virtual-meetings', bubbleUrl: 'https://app.split.lease/version-test/_manage-virtual-meetings', localUrl: 'http://localhost:8001/_internal/manage-virtual-meetings', name: 'Virtual Meetings' },
  { id: '04-message-curation', bubbleUrl: 'https://app.split.lease/version-test/_message-curation', localUrl: 'http://localhost:8001/_internal/message-curation', name: 'Message Curation' },
  { id: '05-co-host-requests', bubbleUrl: 'https://app.split.lease/version-test/_co-host-requests', localUrl: 'http://localhost:8001/_internal/co-host-requests', name: 'Co-Host Requests' },
  { id: '06-internal-emergency', bubbleUrl: 'https://app.split.lease/version-test/_internal-emergency', localUrl: 'http://localhost:8001/_internal/emergency', name: 'Internal Emergency' },
  { id: '07-leases-overview', bubbleUrl: 'https://app.split.lease/version-test/_leases-overview', localUrl: 'http://localhost:8001/_internal/leases-overview', name: 'Leases Overview' },
  { id: '08-admin-threads', bubbleUrl: 'https://app.split.lease/version-test/_quick-threads-manage', localUrl: 'http://localhost:8001/_internal/admin-threads', name: 'Admin Threads' },
  { id: '09-modify-listings', bubbleUrl: 'https://app.split.lease/version-test/_modify-listings', localUrl: 'http://localhost:8001/_internal/modify-listings', name: 'Modify Listings' },
  { id: '10-rental-applications', bubbleUrl: 'https://app.split.lease/version-test/_rental-app-manage', localUrl: 'http://localhost:8001/_internal/manage-rental-applications', name: 'Rental Applications' },
  { id: '11-quick-price', bubbleUrl: 'https://app.split.lease/version-test/_quick-price', localUrl: 'http://localhost:8001/_internal/quick-price', name: 'Quick Price' },
  { id: '12-magic-login-links', bubbleUrl: 'https://app.split.lease/version-test/_send-magic-login-links', localUrl: 'http://localhost:8001/_internal/send-magic-login-links', name: 'Magic Login Links' },
];

const screenshotDir = path.join(__dirname, '../docs/Done/visual-validation-screenshots');
const results = {
  timestamp: new Date().toISOString(),
  totalPages: pages.length,
  successful: 0,
  failed: 0,
  pages: []
};

async function captureScreenshots() {
  const browser = await chromium.launch();

  try {
    for (const pageConfig of pages) {
      console.log(`\nProcessing ${pageConfig.id} - ${pageConfig.name}...`);
      const pageResult = {
        id: pageConfig.id,
        name: pageConfig.name,
        bubble: null,
        local: null,
        errors: []
      };

      const context = await browser.newContext();
      const p = await context.newPage();

      try {
        // Capture Bubble version
        try {
          console.log(`  → Navigating to Bubble: ${pageConfig.bubbleUrl}`);
          await p.goto(pageConfig.bubbleUrl, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
          await p.waitForTimeout(3000);
          const bubbleFile = path.join(screenshotDir, `${pageConfig.id}-bubble.png`);
          await p.screenshot({ path: bubbleFile, fullPage: true });
          pageResult.bubble = `${pageConfig.id}-bubble.png`;
          console.log(`  ✓ Bubble screenshot saved`);
        } catch (err) {
          pageResult.errors.push(`Bubble capture failed: ${err.message}`);
          console.log(`  ✗ Bubble capture failed: ${err.message}`);
        }

        // Capture Local version
        try {
          console.log(`  → Navigating to Local: ${pageConfig.localUrl}`);
          await p.goto(pageConfig.localUrl, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
          await p.waitForTimeout(3000);
          const localFile = path.join(screenshotDir, `${pageConfig.id}-local.png`);
          await p.screenshot({ path: localFile, fullPage: true });
          pageResult.local = `${pageConfig.id}-local.png`;
          console.log(`  ✓ Local screenshot saved`);
        } catch (err) {
          pageResult.errors.push(`Local capture failed: ${err.message}`);
          console.log(`  ✗ Local capture failed: ${err.message}`);
        }

        if (pageResult.bubble && pageResult.local) {
          results.successful++;
        } else {
          results.failed++;
        }
      } finally {
        await context.close();
      }

      results.pages.push(pageResult);
    }
  } finally {
    await browser.close();
  }

  // Save results
  fs.writeFileSync(
    path.join(__dirname, '../docs/Done/validation-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Validation complete: ${results.successful}/${results.totalPages} pages successful`);
  console.log(`✗ Failed: ${results.failed} pages`);
  console.log(`${'='.repeat(60)}`);

  return results;
}

captureScreenshots().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
