#!/usr/bin/env node
/**
 * Functional Analysis of Admin Pages
 *
 * Analyzes 12 admin page implementations to extract functional capabilities
 * without requiring browser automation. Uses pattern matching for code analysis.
 *
 * Usage: node scripts/analyze-admin-pages-functional.js
 */

const fs = require('fs');
const path = require('path');

const scriptDir = path.dirname(require.main.filename);

const ADMIN_PAGES = [
  {
    name: 'Verify Users',
    path: 'app/src/islands/pages/VerifyUsersPage.jsx',
    hookPath: 'app/src/islands/pages/useVerifyUsersPageLogic.js'
  },
  {
    name: 'Proposal Management',
    path: 'app/src/islands/pages/ProposalManagePage/index.jsx',
    hookPath: 'app/src/islands/pages/ProposalManagePage/useProposalManagePageLogic.js'
  },
  {
    name: 'Virtual Meetings',
    path: 'app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.jsx',
    hookPath: 'app/src/islands/pages/ManageVirtualMeetingsPage/useManageVirtualMeetingsPageLogic.js'
  },
  {
    name: 'Message Curation',
    path: 'app/src/islands/pages/MessageCurationPage/MessageCurationPage.jsx',
    hookPath: 'app/src/islands/pages/MessageCurationPage/useMessageCurationPageLogic.js'
  },
  {
    name: 'Co-Host Requests',
    path: 'app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.jsx',
    hookPath: 'app/src/islands/pages/CoHostRequestsPage/useCoHostRequestsPageLogic.js'
  },
  {
    name: 'Internal Emergency',
    path: 'app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx',
    hookPath: 'app/src/islands/pages/InternalEmergencyPage/useInternalEmergencyPageLogic.js'
  },
  {
    name: 'Leases Overview',
    path: 'app/src/islands/pages/LeasesOverviewPage/LeasesOverviewPage.jsx',
    hookPath: 'app/src/islands/pages/LeasesOverviewPage/useLeasesOverviewPageLogic.js'
  },
  {
    name: 'Admin Threads',
    path: 'app/src/islands/pages/AdminThreadsPage/AdminThreadsPage.jsx',
    hookPath: 'app/src/islands/pages/AdminThreadsPage/useAdminThreadsPageLogic.js'
  },
  {
    name: 'Modify Listings',
    path: 'app/src/islands/pages/ModifyListingsPage/ModifyListingsPage.jsx',
    hookPath: 'app/src/islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js'
  },
  {
    name: 'Rental Applications',
    path: 'app/src/islands/pages/ManageRentalApplicationsPage/ManageRentalApplicationsPage.jsx',
    hookPath: 'app/src/islands/pages/ManageRentalApplicationsPage/useManageRentalApplicationsPageLogic.js'
  },
  {
    name: 'Quick Price',
    path: 'app/src/islands/pages/QuickPricePage/QuickPricePage.jsx',
    hookPath: 'app/src/islands/pages/QuickPricePage/useQuickPricePageLogic.js'
  },
  {
    name: 'Magic Login Links',
    path: 'app/src/islands/pages/SendMagicLoginLinksPage/SendMagicLoginLinksPage.jsx',
    hookPath: 'app/src/islands/pages/SendMagicLoginLinksPage/useSendMagicLoginLinksPageLogic.js'
  }
];

/**
 * Extract functional elements from JSX file
 */
function analyzePage(filePath) {
  const fullPath = path.join(scriptDir, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return {
      exists: false,
      error: 'File not found'
    };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Extract functional elements using regex patterns
  const elements = {
    buttons: [],
    formInputs: [],
    dropdowns: [],
    tables: [],
    modals: [],
    searchFields: [],
    filters: [],
    textareas: [],
    checkboxes: [],
    toggles: [],
    links: [],
    actions: []
  };

  // Extract button elements
  const buttonMatches = content.match(/onClick|className=".*btn|<button|role="button"/gi) || [];
  elements.buttons = [...new Set(buttonMatches)].length;

  // Extract form inputs
  const inputMatches = content.match(/<input|type="text"|type="email"|placeholder=/gi) || [];
  elements.formInputs = [...new Set(inputMatches)].length;

  // Extract dropdowns/selects
  const selectMatches = content.match(/<select|className=".*dropdown|className=".*select|aria-label="dropdown"/gi) || [];
  elements.dropdowns = [...new Set(selectMatches)].length;

  // Extract tables
  const tableMatches = content.match(/<table|role="table"|<tbody|<tr>/gi) || [];
  elements.tables = [...new Set(tableMatches)].length;

  // Extract modals
  const modalMatches = content.match(/Modal|Dialog|role="dialog"|isOpen/gi) || [];
  elements.modals = [...new Set(modalMatches)].length;

  // Extract search fields
  const searchMatches = content.match(/search|Search|filter|Filter/gi) || [];
  elements.searchFields = [...new Set(searchMatches)].length;

  // Extract textareas
  const textareaMatches = content.match(/<textarea/gi) || [];
  elements.textareas = [...new Set(textareaMatches)].length;

  // Extract checkboxes
  const checkboxMatches = content.match(/type="checkbox"|role="checkbox"/gi) || [];
  elements.checkboxes = [...new Set(checkboxMatches)].length;

  // Extract toggles/switches
  const toggleMatches = content.match(/Toggle|Switch|role="switch"/gi) || [];
  elements.toggles = [...new Set(toggleMatches)].length;

  // Extract links
  const linkMatches = content.match(/href=|<a |Link>/gi) || [];
  elements.links = [...new Set(linkMatches)].length;

  // Extract action handlers (on*)
  const actionMatches = content.match(/on[A-Z][a-zA-Z]*=/g) || [];
  elements.actions = [...new Set(actionMatches)];

  return {
    exists: true,
    elements,
    fileSize: content.length,
    lineCount: content.split('\n').length
  };
}

/**
 * Generate functional comparison report
 */
function generateReport() {
  const results = [];

  console.log('Analyzing admin pages...\n');

  for (const page of ADMIN_PAGES) {
    const analysis = analyzePage(page.path);

    results.push({
      name: page.name,
      ...analysis
    });

    if (analysis.exists) {
      console.log(`✓ ${page.name}: ${analysis.elements.buttons} buttons, ${analysis.elements.formInputs} inputs, ${analysis.elements.dropdowns} dropdowns`);
    } else {
      console.log(`✗ ${page.name}: ${analysis.error}`);
    }
  }

  // Generate markdown report
  const docsDir = path.join(scriptDir, '..', 'docs', 'Done');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const reportPath = path.join(docsDir, 'FUNCTIONAL_COMPARISON_REPORT.md');

  let markdown = `# Functional Comparison Audit Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Total Pages Analyzed**: ${results.length}
**Successful Analyses**: ${results.filter(r => r.exists).length}

## Executive Summary

This report analyzes FUNCTIONAL elements (buttons, forms, tables, modals, etc.) across 12 admin pages by examining the source code implementations. This provides an accurate baseline for all interactive capabilities without requiring browser automation.

### Functional Capabilities Summary

| Page | Buttons | Inputs | Dropdowns | Tables | Modals | Status |
|------|---------|--------|-----------|--------|--------|--------|
`;

  // Add per-page summary
  for (const result of results) {
    if (result.exists) {
      const { buttons, formInputs, dropdowns, tables, modals } = result.elements;
      markdown += `| ${result.name} | ${buttons} | ${formInputs} | ${dropdowns} | ${tables} | ${modals} | ✓ |\\n`;
    } else {
      markdown += `| ${result.name} | N/A | N/A | N/A | N/A | N/A | ✗ |\\n`;
    }
  }

  markdown += `\\n---\\n\\n## Detailed Analysis\\n\\n`;

  // Detailed breakdown
  for (const result of results) {
    if (!result.exists) {
      markdown += `### ${result.name}\\n\\n`;
      markdown += `⚠ **Status**: File not found at expected location\\n`;
      markdown += `**Error**: ${result.error}\\n\\n`;
      continue;
    }

    const { name, elements, lineCount } = result;

    markdown += `### ${result.name}\\n\\n`;
    markdown += `- **Lines of Code**: ${lineCount}\\n`;
    markdown += `- **Total Interactive Elements**: ${Object.values(elements).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)}\\n\\n`;

    markdown += `#### Functional Elements\\n\\n`;
    markdown += `| Element Type | Count |\\n`;
    markdown += `|---|---|\\n`;

    for (const [key, value] of Object.entries(elements)) {
      if (typeof value === 'number') {
        markdown += `| ${key.replace(/([A-Z])/g, ' $1').trim()} | ${value} |\\n`;
      }
    }

    if (Array.isArray(elements.actions) && elements.actions.length > 0) {
      markdown += `\\n**Action Handlers Found**: ${elements.actions.slice(0, 10).join(', ')}\\n`;
      if (elements.actions.length > 10) {
        markdown += `...and ${elements.actions.length - 10} more\\n`;
      }
    }

    markdown += '\\n';
  }

  // Analysis notes
  markdown += `\\n## Analysis Methodology\\n\\n`;
  markdown += `This analysis examines source code for:
- \`<button>\` and \`onClick\` patterns (interactive buttons)
- \`<input>\` elements (form fields)
- \`<select>\` and dropdown patterns (dropdown selectors)
- \`<table>\` and table patterns (data tables)
- Modal/Dialog patterns (overlay components)
- Search/filter patterns (filtering capabilities)
- Action handlers (\`on*\` event handlers)

## Next Steps

1. **Visual validation**: Cross-check with actual Bubble application for UI/UX differences
2. **User testing**: Verify all functional elements are working as expected
3. **Accessibility check**: Ensure all interactive elements are accessible
4. **Performance validation**: Check page load times and response speeds

`;

  // Write report
  fs.writeFileSync(reportPath, markdown);
  console.log(`\\n✓ Report generated: ${reportPath}`);
}

// Run the analysis
generateReport();

module.exports = { analyzePage, generateReport };
