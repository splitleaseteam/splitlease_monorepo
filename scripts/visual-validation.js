const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

const pages = [
  { id: '01-verify-users', bubbleUrl: 'https://app.split.lease/version-test/_verify-users', localUrl: 'http://localhost:8001/_internal/verify-users' },
  { id: '02-proposal-manage', bubbleUrl: 'https://app.split.lease/version-test/_proposal-manage', localUrl: 'http://localhost:8001/_internal/proposal-manage' },
  { id: '03-virtual-meetings', bubbleUrl: 'https://app.split.lease/version-test/_manage-virtual-meetings', localUrl: 'http://localhost:8001/_internal/manage-virtual-meetings' },
  { id: '04-message-curation', bubbleUrl: 'https://app.split.lease/version-test/_message-curation', localUrl: 'http://localhost:8001/_internal/message-curation' },
  { id: '05-co-host-requests', bubbleUrl: 'https://app.split.lease/version-test/_co-host-requests', localUrl: 'http://localhost:8001/_internal/co-host-requests' },
  { id: '06-internal-emergency', bubbleUrl: 'https://app.split.lease/version-test/_internal-emergency', localUrl: 'http://localhost:8001/_internal/emergency' },
  { id: '07-leases-overview', bubbleUrl: 'https://app.split.lease/version-test/_leases-overview', localUrl: 'http://localhost:8001/_internal/leases-overview' },
  { id: '08-admin-threads', bubbleUrl: 'https://app.split.lease/version-test/_quick-threads-manage', localUrl: 'http://localhost:8001/_internal/admin-threads' },
  { id: '09-modify-listings', bubbleUrl: 'https://app.split.lease/version-test/_modify-listings', localUrl: 'http://localhost:8001/_internal/modify-listings' },
  { id: '10-rental-applications', bubbleUrl: 'https://app.split.lease/version-test/_rental-app-manage', localUrl: 'http://localhost:8001/_internal/manage-rental-applications' },
  { id: '11-quick-price', bubbleUrl: 'https://app.split.lease/version-test/_quick-price', localUrl: 'http://localhost:8001/_internal/quick-price' },
  { id: '12-magic-login-links', bubbleUrl: 'https://app.split.lease/version-test/_send-magic-login-links', localUrl: 'http://localhost:8001/_internal/send-magic-login-links' },
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
  const browser = await playwright.chromium.launch();
  
  for (const page of pages) {
    console.log(`Processing ${page.id}...`);
    const pageResult = { id: page.id, bubble: null, local: null, errors: [] };
    
    const context = await browser.createContext();
    const p = await context.newPage();
    
    try {
      // Capture Bubble version
      try {
        await p.goto(page.bubbleUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await p.waitForTimeout(2000);
        const bubbleFile = path.join(screenshotDir, `${page.id}-bubble.png`);
        await p.screenshot({ path: bubbleFile, fullPage: true });
        pageResult.bubble = `${page.id}-bubble.png`;
        console.log(`  ✓ Bubble screenshot saved`);
      } catch (err) {
        pageResult.errors.push(`Bubble capture failed: ${err.message}`);
        console.log(`  ✗ Bubble capture failed: ${err.message}`);
      }
      
      // Capture Local version
      try {
        await p.goto(page.localUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await p.waitForTimeout(2000);
        const localFile = path.join(screenshotDir, `${page.id}-local.png`);
        await p.screenshot({ path: localFile, fullPage: true });
        pageResult.local = `${page.id}-local.png`;
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
  
  await browser.close();
  
  // Save results
  fs.writeFileSync(
    path.join(__dirname, '../docs/Done/validation-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n✓ Validation complete: ${results.successful} successful, ${results.failed} failed`);
  return results;
}

captureScreenshots().catch(console.error);
