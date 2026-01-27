#!/usr/bin/env node
/**
 * Functional Comparison Audit Script
 *
 * Compares functional elements (buttons, forms, navigation, tables, etc.)
 * across 12 admin page pairs (Bubble vs Local versions)
 *
 * Usage: node scripts/functional-comparison-audit.js
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration: 12 page pairs
const PAGE_PAIRS = [
  {
    name: 'Verify Users',
    bubble: 'https://app.split.lease/version-test/_verify-users',
    local: 'http://localhost:8001/_internal/verify-users'
  },
  {
    name: 'Proposal Management',
    bubble: 'https://app.split.lease/version-test/_proposal-manage',
    local: 'http://localhost:8001/_internal/proposal-manage'
  },
  {
    name: 'Virtual Meetings',
    bubble: 'https://app.split.lease/version-test/_manage-virtual-meetings',
    local: 'http://localhost:8001/_internal/manage-virtual-meetings'
  },
  {
    name: 'Message Curation',
    bubble: 'https://app.split.lease/version-test/_message-curation',
    local: 'http://localhost:8001/_internal/message-curation'
  },
  {
    name: 'Co-Host Requests',
    bubble: 'https://app.split.lease/version-test/_co-host-requests',
    local: 'http://localhost:8001/_internal/co-host-requests'
  },
  {
    name: 'Internal Emergency',
    bubble: 'https://app.split.lease/version-test/_internal-emergency',
    local: 'http://localhost:8001/_internal/emergency'
  },
  {
    name: 'Leases Overview',
    bubble: 'https://app.split.lease/version-test/_leases-overview',
    local: 'http://localhost:8001/_internal/leases-overview'
  },
  {
    name: 'Admin Threads',
    bubble: 'https://app.split.lease/version-test/_quick-threads-manage',
    local: 'http://localhost:8001/_internal/admin-threads'
  },
  {
    name: 'Modify Listings',
    bubble: 'https://app.split.lease/version-test/_modify-listings',
    local: 'http://localhost:8001/_internal/modify-listings'
  },
  {
    name: 'Rental Applications',
    bubble: 'https://app.split.lease/version-test/_rental-app-manage',
    local: 'http://localhost:8001/_internal/manage-rental-applications'
  },
  {
    name: 'Quick Price',
    bubble: 'https://app.split.lease/version-test/_quick-price',
    local: 'http://localhost:8001/_internal/quick-price'
  },
  {
    name: 'Magic Login Links',
    bubble: 'https://app.split.lease/version-test/_send-magic-login-links',
    local: 'http://localhost:8001/_internal/send-magic-login-links'
  }
];

/**
 * Extract functional elements from accessibility snapshot
 */
function extractFunctionalElements(snapshot) {
  if (!snapshot) return { buttons: [], forms: [], tables: [], links: [], interactive: [] };

  const lines = snapshot.split('\n');
  const elements = {
    buttons: [],
    forms: [],
    tables: [],
    links: [],
    interactive: [],
    raw: snapshot
  };

  // Parse snapshot for different element types
  for (const line of lines) {
    const trimmed = line.trim();

    // Buttons
    if (trimmed.match(/^<button|role="button"|\.click\(\)/)) {
      elements.buttons.push(trimmed);
    }

    // Form elements
    if (trimmed.match(/^<input|^<select|^<textarea|<label/)) {
      elements.forms.push(trimmed);
    }

    // Tables
    if (trimmed.match(/^<table|^<tbody|role="table"/)) {
      elements.tables.push(trimmed);
    }

    // Links
    if (trimmed.match(/^<a |href="/)) {
      elements.links.push(trimmed);
    }

    // Interactive elements (modals, dialogs, etc.)
    if (trimmed.match(/role="dialog"|role="tab"|role="modal"|role="menu"/)) {
      elements.interactive.push(trimmed);
    }
  }

  return elements;
}

/**
 * Compare functional elements between two versions
 */
function compareFunctionalElements(bubble, local) {
  const comparison = {
    buttons: {
      inBoth: [],
      bubbleOnly: [],
      localOnly: []
    },
    forms: {
      inBoth: [],
      bubbleOnly: [],
      localOnly: []
    },
    tables: {
      inBoth: [],
      bubbleOnly: [],
      localOnly: []
    },
    links: {
      inBoth: [],
      bubbleOnly: [],
      localOnly: []
    },
    interactive: {
      inBoth: [],
      bubbleOnly: [],
      localOnly: []
    }
  };

  // Simple comparison: check counts for now
  // In a real scenario, you'd parse and compare actual element text/attributes
  for (const category of Object.keys(comparison)) {
    const bubbleCount = bubble[category]?.length || 0;
    const localCount = local[category]?.length || 0;

    comparison[category].inBoth = Math.min(bubbleCount, localCount);
    comparison[category].bubbleOnly = Math.max(0, bubbleCount - localCount);
    comparison[category].localOnly = Math.max(0, localCount - bubbleCount);
  }

  return comparison;
}

/**
 * Capture accessibility snapshot and extract functional elements
 */
async function capturePageSnapshot(page, url, label) {
  try {
    console.log(`[${label}] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    console.log(`[${label}] Capturing snapshot...`);
    const snapshot = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });

    return extractFunctionalElements(snapshot);
  } catch (error) {
    console.error(`[${label}] Error: ${error.message}`);
    return null;
  }
}

/**
 * Main audit function
 */
async function runAudit() {
  const results = [];
  let browser;

  try {
    console.log('Starting Functional Comparison Audit...\n');

    browser = await chromium.launch();
    const context = await browser.createContext();
    const page = await context.newPage();

    // Set viewport to standard size
    await page.setViewportSize({ width: 1920, height: 1080 });

    for (const pair of PAGE_PAIRS) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Auditing: ${pair.name}`);
      console.log(`${'='.repeat(60)}\n`);

      // Capture Bubble version
      const bubbleElements = await capturePageSnapshot(page, pair.bubble, 'BUBBLE');

      // Capture Local version
      const localElements = await capturePageSnapshot(page, pair.local, 'LOCAL');

      if (!bubbleElements || !localElements) {
        console.log(`⚠ Skipping ${pair.name} - could not capture both versions\n`);
        results.push({
          name: pair.name,
          status: 'ERROR',
          error: 'Failed to capture one or both versions'
        });
        continue;
      }

      // Compare
      const comparison = compareFunctionalElements(bubbleElements, localElements);

      // Calculate parity
      const calculateParity = () => {
        let totalItems = 0;
        let matchingItems = 0;

        for (const category of Object.keys(comparison)) {
          const inBoth = comparison[category].inBoth;
          const bubbleOnly = comparison[category].bubbleOnly;
          const localOnly = comparison[category].localOnly;

          const categoryTotal = inBoth + bubbleOnly + localOnly;
          totalItems += categoryTotal;
          matchingItems += inBoth;
        }

        return totalItems > 0 ? Math.round((matchingItems / totalItems) * 100) : 0;
      };

      const parity = calculateParity();

      results.push({
        name: pair.name,
        status: 'SUCCESS',
        parity,
        comparison,
        urls: pair
      });

      console.log(`✓ ${pair.name}`);
      console.log(`  Functional Parity: ${parity}%\n`);

      // Show detailed differences
      if (comparison.buttons.bubbleOnly > 0 || comparison.buttons.localOnly > 0) {
        console.log(`  Buttons: ${comparison.buttons.inBoth} in both, ${comparison.buttons.bubbleOnly} Bubble-only, ${comparison.buttons.localOnly} Local-only`);
      }
      if (comparison.forms.bubbleOnly > 0 || comparison.forms.localOnly > 0) {
        console.log(`  Forms: ${comparison.forms.inBoth} in both, ${comparison.forms.bubbleOnly} Bubble-only, ${comparison.forms.localOnly} Local-only`);
      }
      if (comparison.tables.bubbleOnly > 0 || comparison.tables.localOnly > 0) {
        console.log(`  Tables: ${comparison.tables.inBoth} in both, ${comparison.tables.bubbleOnly} Bubble-only, ${comparison.tables.localOnly} Local-only`);
      }
      if (comparison.interactive.bubbleOnly > 0 || comparison.interactive.localOnly > 0) {
        console.log(`  Interactive: ${comparison.interactive.inBoth} in both, ${comparison.interactive.bubbleOnly} Bubble-only, ${comparison.interactive.localOnly} Local-only`);
      }

      // Delay between pages
      await page.waitForTimeout(1000);
    }

    // Close browser
    await context.close();
    await browser.close();

    // Generate report
    generateReport(results);

  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

/**
 * Generate markdown report
 */
function generateReport(results) {
  const docsDir = path.join(__dirname, '..', 'docs', 'Done');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const reportPath = path.join(docsDir, 'FUNCTIONAL_COMPARISON_REPORT.md');

  // Calculate summary stats
  const successResults = results.filter(r => r.status === 'SUCCESS');
  const avgParity = successResults.length > 0
    ? Math.round(successResults.reduce((sum, r) => sum + r.parity, 0) / successResults.length)
    : 0;

  let markdown = `# Functional Comparison Audit Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Total Pages Audited**: ${results.length}
**Successful Comparisons**: ${successResults.length}
**Average Functional Parity**: ${avgParity}%

## Executive Summary

This report compares FUNCTIONAL elements only (not visual appearance) across 12 admin page pairs to identify missing or different capabilities between Bubble and Local versions.

### Parity Summary

| Page | Functional Parity | Status |
|------|-------------------|--------|
`;

  // Add per-page summary
  for (const result of results) {
    if (result.status === 'SUCCESS') {
      const parityBar = '█'.repeat(Math.floor(result.parity / 5)) + '░'.repeat(20 - Math.floor(result.parity / 5));
      markdown += `| ${result.name} | ${result.parity}% \`${parityBar}\` | ✓ Complete |\n`;
    } else {
      markdown += `| ${result.name} | N/A | ⚠ ${result.error} |\n`;
    }
  }

  markdown += `\n---\n\n## Page-by-Page Analysis\n\n`;

  // Detailed breakdown
  for (const result of results) {
    if (result.status !== 'SUCCESS') {
      continue;
    }

    const { name, parity, comparison, urls } = result;

    markdown += `### ${name}\n\n`;
    markdown += `- **Functional Parity**: ${parity}%\n`;
    markdown += `- **Bubble**: ${urls.bubble}\n`;
    markdown += `- **Local**: ${urls.local}\n\n`;

    markdown += `#### Functional Elements Comparison\n\n`;
    markdown += `| Element Type | In Both | Bubble Only | Local Only |\n`;
    markdown += `|---|---|---|---|\n`;

    for (const [category, data] of Object.entries(comparison)) {
      markdown += `| ${category.charAt(0).toUpperCase() + category.slice(1)} | ${data.inBoth} | ${data.bubbleOnly} | ${data.localOnly} |\n`;
    }

    markdown += '\n';

    // Flag differences
    const hasDifferences = Object.values(comparison).some(
      cat => cat.bubbleOnly > 0 || cat.localOnly > 0
    );

    if (hasDifferences) {
      markdown += `**Differences Found**:\n`;
      for (const [category, data] of Object.entries(comparison)) {
        if (data.bubbleOnly > 0) {
          markdown += `- ⚠ ${data.bubbleOnly} ${category} ONLY in Bubble (missing in Local)\n`;
        }
        if (data.localOnly > 0) {
          markdown += `- ℹ ${data.localOnly} ${category} ONLY in Local (extra/different)\n`;
        }
      }
    } else {
      markdown += `**Status**: ✓ Functional parity achieved for this page\n`;
    }

    markdown += '\n---\n\n';
  }

  // Missing functionality summary
  markdown += `## Missing Functionality (HIGH Priority)\n\n`;
  markdown += `Critical features present in Bubble but missing in Local:\n\n`;

  let hasHighPriority = false;
  for (const result of results) {
    if (result.status !== 'SUCCESS') continue;

    const { name, comparison } = result;
    const totalMissing = Object.values(comparison).reduce((sum, cat) => sum + cat.bubbleOnly, 0);

    if (totalMissing > 0) {
      hasHighPriority = true;
      markdown += `- **${name}**: ${totalMissing} missing functional element(s)\n`;
    }
  }

  if (!hasHighPriority) {
    markdown += `None detected. All pages have functional parity.\n`;
  }

  // Extra functionality summary
  markdown += `\n## Extra Functionality (Lower Priority)\n\n`;
  markdown += `Features present in Local but not in Bubble (may be improvements):\n\n`;

  let hasExtra = false;
  for (const result of results) {
    if (result.status !== 'SUCCESS') continue;

    const { name, comparison } = result;
    const totalExtra = Object.values(comparison).reduce((sum, cat) => sum + cat.localOnly, 0);

    if (totalExtra > 0) {
      hasExtra = true;
      markdown += `- **${name}**: ${totalExtra} extra functional element(s)\n`;
    }
  }

  if (!hasExtra) {
    markdown += `None detected. Local versions match Bubble feature set.\n`;
  }

  // Action items
  markdown += `\n## Action Items\n\n`;
  markdown += `### For Achieving 100% Functional Parity\n\n`;

  const missingPages = results.filter(r => r.status === 'SUCCESS' && r.parity < 100);
  if (missingPages.length > 0) {
    markdown += `Prioritize these pages:\n\n`;
    for (const page of missingPages.sort((a, b) => a.parity - b.parity)) {
      markdown += `1. **${page.name}** (${page.parity}% parity)\n`;
    }
  }

  markdown += `\n### Next Steps\n\n`;
  markdown += `1. Review pages with <100% parity in order of priority\n`;
  markdown += `2. Identify missing buttons, form fields, or interactive elements\n`;
  markdown += `3. Implement missing functionality in Local version\n`;
  markdown += `4. Re-run audit to verify improvements\n`;

  // Write report
  fs.writeFileSync(reportPath, markdown);
  console.log(`\n✓ Report generated: ${reportPath}`);
}

// Run the audit
runAudit().catch(console.error);
