# Cursor Agent: Schedule Selector Playwright Comparison Testing

**Date:** 2026-01-28  
**Agent:** Claude Code (in Cursor IDE)  
**Task:** Compare localhost implementation vs Bubble production to identify discrepancies  
**Tool:** Playwright for automated browser testing

---

## 🎯 Your Mission

You need to create **Playwright tests** that compare the Schedule Selector behavior between:

1. **Localhost (New Implementation):** `http://localhost:3000/_internal/z-schedule-test`
2. **Bubble Production (Source of Truth):** `https://app.split.lease/version-test/z-schedule-test`

Your goal is to **identify discrepancies** and **generate structured questions** for the Comet agent to investigate the Bubble IDE.

---

## 📋 Context: What Just Happened

Two agents (OpenCode and Claude Code) just implemented a Triple-Check validation system for schedules:

### What They Built:
- ✅ Golden Schedule Validator (canonical source of truth)
- ✅ Fixed backend nights calculation bug
- ✅ Created verification script
- ✅ Built Triple-Check Matrix UI component
- ✅ Added edge case testing scenarios

### The Business Rule They Implemented:
```javascript
// Nights calculation with full week special case
if (selectedDays.length === 7) {
  nightsCount = 7;  // Full week = 7 nights (full-time rental)
} else {
  nightsCount = Math.max(0, selectedDays.length - 1);  // Partial week
}

// Valid ranges: 2-5 nights OR 7 nights (no 6-night bookings)
```

### The Question:
**Does this match what Bubble is actually doing in production?**

---

## 🧪 Your Task Breakdown

### Task 1: Create Playwright Comparison Test
### Task 2: Run Tests and Document Differences
### Task 3: Generate Questions for Comet (Bubble Investigation)

---

## 📝 TASK 1: Create Playwright Comparison Test

**File:** `tests/schedule-selector-comparison.spec.ts` (NEW)

### Test Structure:

```typescript
import { test, expect } from '@playwright/test';

/**
 * Schedule Selector Comparison: Localhost vs Bubble Production
 * 
 * This test compares the behavior of the schedule selector between:
 * - Localhost: Our new Triple-Check implementation
 * - Bubble: Current production source of truth
 * 
 * Goal: Identify discrepancies and generate questions for Bubble investigation
 */

const LOCALHOST_URL = 'http://localhost:3000/_internal/z-schedule-test';
const BUBBLE_URL = 'https://app.split.lease/version-test/z-schedule-test';

// Test scenarios matching our edge cases
const TEST_SCENARIOS = [
  {
    id: 'normal-5-night',
    name: 'Normal 5-Night Stay (Mon-Sat)',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    expectedNights: 5,
    expectedValid: true
  },
  {
    id: 'wrap-around',
    name: 'Wrap-Around Weekend (Fri-Mon)',
    days: ['Friday', 'Saturday', 'Sunday', 'Monday'],
    expectedNights: 3,
    expectedValid: true
  },
  {
    id: 'full-week',
    name: 'Full Week (7 days)',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    expectedNights: 7,  // CRITICAL: Our implementation says 7, does Bubble agree?
    expectedValid: true
  },
  {
    id: 'gap-selection',
    name: 'Gap Selection (Mon, Wed, Fri)',
    days: ['Monday', 'Wednesday', 'Friday'],
    expectedNights: 2,
    expectedValid: false  // Should be invalid (not contiguous)
  }
];

test.describe('Schedule Selector: Localhost vs Bubble Comparison', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for network operations
    test.setTimeout(60000);
  });

  for (const scenario of TEST_SCENARIOS) {
    test(`Compare: ${scenario.name}`, async ({ browser }) => {
      // Open two pages: localhost and Bubble
      const localhostContext = await browser.newContext();
      const bubbleContext = await browser.newContext();
      
      const localhostPage = await localhostContext.newPage();
      const bubblePage = await bubbleContext.newPage();

      try {
        // Navigate both to their respective URLs
        await Promise.all([
          localhostPage.goto(LOCALHOST_URL, { waitUntil: 'networkidle' }),
          bubblePage.goto(BUBBLE_URL, { waitUntil: 'networkidle' })
        ]);

        // Wait for pages to be fully loaded
        await localhostPage.waitForTimeout(2000);
        await bubblePage.waitForTimeout(2000);

        // ===========================================
        // LOCALHOST: Select days and capture results
        // ===========================================
        
        console.log(`\n📍 LOCALHOST: Testing ${scenario.name}`);
        
        // TODO: Find and click day buttons for each day in scenario.days
        // This depends on your actual DOM structure
        // Example:
        for (const day of scenario.days) {
          const dayButton = localhostPage.locator(`button:has-text("${day}")`).first();
          if (await dayButton.isVisible()) {
            await dayButton.click();
            await localhostPage.waitForTimeout(300);
          }
        }

        // Capture localhost results
        const localhostResults = await captureScheduleResults(localhostPage, 'localhost');
        
        // ===========================================
        // BUBBLE: Select days and capture results
        // ===========================================
        
        console.log(`\n📍 BUBBLE: Testing ${scenario.name}`);
        
        // TODO: Find and click day buttons in Bubble (may have different selectors)
        for (const day of scenario.days) {
          // Bubble might have different class names or data attributes
          const dayButton = bubblePage.locator(`[data-day="${day}"]`).or(bubblePage.locator(`button:has-text("${day}")`)).first();
          if (await dayButton.isVisible()) {
            await dayButton.click();
            await bubblePage.waitForTimeout(300);
          }
        }

        // Capture Bubble results
        const bubbleResults = await captureScheduleResults(bubblePage, 'bubble');

        // ===========================================
        // COMPARE RESULTS
        // ===========================================
        
        console.log(`\n🔍 COMPARISON for ${scenario.name}:`);
        console.log('Localhost:', localhostResults);
        console.log('Bubble:   ', bubbleResults);

        const discrepancies = compareResults(localhostResults, bubbleResults, scenario);
        
        if (discrepancies.length > 0) {
          console.log('\n🚨 DISCREPANCIES FOUND:');
          discrepancies.forEach(d => console.log(`  - ${d}`));
          
          // Log to file for Comet investigation
          await logDiscrepancyForComet(scenario, localhostResults, bubbleResults, discrepancies);
        } else {
          console.log('✅ No discrepancies - Results match!');
        }

        // Take screenshots for visual comparison
        await localhostPage.screenshot({ 
          path: `test-results/localhost-${scenario.id}.png`,
          fullPage: true 
        });
        await bubblePage.screenshot({ 
          path: `test-results/bubble-${scenario.id}.png`,
          fullPage: true 
        });

      } finally {
        await localhostContext.close();
        await bubbleContext.close();
      }
    });
  }
});

/**
 * Capture schedule results from a page
 */
async function captureScheduleResults(page, source: string) {
  const results = {
    source,
    nightsCount: null as number | null,
    isValid: null as boolean | null,
    errorMessage: null as string | null,
    selectedDays: [] as string[],
    validationStatus: null as string | null,
    // Try to capture Triple-Check Matrix data (localhost only)
    tripleCheckMatrix: null as any
  };

  try {
    // Capture nights count
    // Adjust selectors based on your actual DOM
    const nightsText = await page.locator('[data-testid="nights-count"]')
      .or(page.locator('text=/\\d+ nights?/i'))
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    
    if (nightsText) {
      const match = nightsText.match(/(\d+)\s*nights?/i);
      if (match) results.nightsCount = parseInt(match[1]);
    }

    // Capture validation status
    const validationBadge = await page.locator('[class*="validation"]')
      .or(page.locator('[class*="error"]'))
      .or(page.locator('[class*="success"]'))
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    
    if (validationBadge) {
      results.validationStatus = validationBadge.trim();
      results.isValid = validationBadge.toLowerCase().includes('valid') || 
                        validationBadge.toLowerCase().includes('success');
    }

    // Capture error messages
    const errorElement = await page.locator('[class*="error-message"]')
      .or(page.locator('[role="alert"]'))
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    
    if (errorElement) {
      results.errorMessage = errorElement.trim();
    }

    // Capture selected days
    const selectedDayElements = await page.locator('[class*="selected"]')
      .or(page.locator('[aria-selected="true"]'))
      .all();
    
    for (const el of selectedDayElements) {
      const text = await el.textContent();
      if (text) results.selectedDays.push(text.trim());
    }

    // For localhost: Try to capture Triple-Check Matrix
    if (source === 'localhost') {
      const matrixVisible = await page.locator('.schedule-validation-matrix').isVisible().catch(() => false);
      
      if (matrixVisible) {
        const matrixBadge = await page.locator('.svm-badge').textContent().catch(() => null);
        const goldenValid = await page.locator('text=/GOLDEN VALIDATOR/').locator('..').locator('[class*="icon"]').textContent().catch(() => null);
        const backendValid = await page.locator('text=/BACKEND WORKFLOW/').locator('..').locator('[class*="icon"]').textContent().catch(() => null);
        
        results.tripleCheckMatrix = {
          badge: matrixBadge,
          goldenValid: goldenValid?.includes('✅'),
          backendValid: backendValid?.includes('✅')
        };
      }
    }

  } catch (error) {
    console.error(`Error capturing results from ${source}:`, error);
  }

  return results;
}

/**
 * Compare results between localhost and Bubble
 */
function compareResults(localhost, bubble, scenario) {
  const discrepancies = [];

  // Compare nights count
  if (localhost.nightsCount !== bubble.nightsCount) {
    discrepancies.push(
      `Nights Count: Localhost=${localhost.nightsCount}, Bubble=${bubble.nightsCount} (Expected=${scenario.expectedNights})`
    );
  }

  // Check if nights match expected
  if (localhost.nightsCount !== scenario.expectedNights) {
    discrepancies.push(
      `Localhost nights WRONG: Got ${localhost.nightsCount}, Expected ${scenario.expectedNights}`
    );
  }
  
  if (bubble.nightsCount !== scenario.expectedNights) {
    discrepancies.push(
      `Bubble nights WRONG: Got ${bubble.nightsCount}, Expected ${scenario.expectedNights}`
    );
  }

  // Compare validity
  if (localhost.isValid !== bubble.isValid) {
    discrepancies.push(
      `Validity: Localhost=${localhost.isValid}, Bubble=${bubble.isValid}`
    );
  }

  // Compare error messages (if both have errors)
  if (localhost.errorMessage && bubble.errorMessage) {
    if (localhost.errorMessage !== bubble.errorMessage) {
      discrepancies.push(
        `Error Messages Differ: Localhost="${localhost.errorMessage}", Bubble="${bubble.errorMessage}"`
      );
    }
  }

  return discrepancies;
}

/**
 * Log discrepancy information for Comet to investigate
 */
async function logDiscrepancyForComet(scenario, localhost, bubble, discrepancies) {
  const fs = require('fs');
  const path = require('path');
  
  const logDir = path.join(process.cwd(), 'test-results', 'comet-questions');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const questions = generateCometQuestions(scenario, localhost, bubble, discrepancies);
  
  const logFile = path.join(logDir, `${scenario.id}-questions.md`);
  
  const content = `# Bubble Investigation: ${scenario.name}

**Date:** ${new Date().toISOString()}
**Test Scenario:** ${scenario.id}

## Discrepancies Found

${discrepancies.map(d => `- ${d}`).join('\n')}

## Comparison Data

### Localhost (New Implementation)
\`\`\`json
${JSON.stringify(localhost, null, 2)}
\`\`\`

### Bubble (Production)
\`\`\`json
${JSON.stringify(bubble, null, 2)}
\`\`\`

## Questions for Comet (Bubble IDE Investigation)

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}

---

## How Comet Should Investigate

1. Open Bubble IDE: https://bubble.io/
2. Navigate to the Split Lease app
3. Find the schedule selector component/workflow
4. Look for nights calculation logic
5. Check validation rules
6. Compare with our Golden Rules (see docs/schedule/DISCOVERY_REPORT.md)

## Expected Bubble Workflow Elements to Check

- **Workflow:** "Validate Schedule" or similar
- **Logic:** How nights are calculated from selected days
- **Validation:** Contiguity checks, min/max nights
- **Special Cases:** Full week handling (7 days)
- **Data Storage:** How selection is stored and retrieved

`;

  fs.writeFileSync(logFile, content);
  console.log(`\n📝 Logged questions for Comet: ${logFile}`);
}

/**
 * Generate specific questions for Comet to investigate in Bubble
 */
function generateCometQuestions(scenario, localhost, bubble, discrepancies) {
  const questions = [];

  // Question about nights calculation
  if (discrepancies.some(d => d.includes('Nights Count'))) {
    questions.push(
      `**Nights Calculation Discrepancy:** Localhost shows ${localhost.nightsCount} nights, Bubble shows ${bubble.nightsCount} nights. ` +
      `In the Bubble IDE, find the workflow or expression that calculates nights from selected days. ` +
      `Does it use \`selectedDays.length - 1\` or \`selectedDays.length\`? ` +
      `Is there a special case for 7 days (full week)?`
    );
  }

  // Question about full week handling
  if (scenario.id === 'full-week') {
    questions.push(
      `**Full Week Logic:** For ${scenario.days.length} selected days, we expect ${scenario.expectedNights} nights (full week special case). ` +
      `Does Bubble have special handling for selecting all 7 days? ` +
      `Look for conditions like "If selected days count = 7" or "If full week" in the validation workflow.`
    );
  }

  // Question about contiguity
  if (scenario.id === 'gap-selection' || scenario.id === 'wrap-around') {
    questions.push(
      `**Contiguity Check:** This scenario tests ${scenario.id === 'gap-selection' ? 'gap detection' : 'wrap-around handling'}. ` +
      `In Bubble, find the contiguity validation logic. ` +
      `Does it handle wrap-around cases (Sat-Sun-Mon)? ` +
      `What error code/message does it return for non-contiguous selections?`
    );
  }

  // Question about validation status
  if (discrepancies.some(d => d.includes('Validity'))) {
    questions.push(
      `**Validation Status Mismatch:** Localhost validation=${localhost.isValid}, Bubble validation=${bubble.isValid}. ` +
      `Check the Bubble workflow's final validation logic. ` +
      `What are the exact conditions that make a schedule valid vs invalid? ` +
      `Are there different error severities (ERROR vs WARNING)?`
    );
  }

  // General investigation question
  questions.push(
    `**General Validation Workflow:** Map out the complete validation workflow in Bubble. ` +
    `List all the rules/checks it performs and in what order. ` +
    `Compare this to our Golden Rules (see docs/schedule/DISCOVERY_REPORT.md).`
  );

  // Data format question
  questions.push(
    `**Data Format:** How does Bubble store selected days? ` +
    `Is it an array of day indices (0-6), day names, or something else? ` +
    `How is this converted for validation?`
  );

  return questions;
}
```

---

## 📝 TASK 2: Run Tests and Document Differences

### Commands to Execute:

```bash
# Make sure both servers are running
# Terminal 1 (localhost):
npm run dev

# Terminal 2 (run tests):
bun run test tests/schedule-selector-comparison.spec.ts

# Or use Playwright UI for debugging:
bunx playwright test --ui
```

### Expected Outputs:

1. **Console logs** showing comparison results
2. **Screenshots** in `test-results/` directory
3. **Question files** in `test-results/comet-questions/` directory

### What to Look For:

#### 🔴 Critical Discrepancy: Full Week (7 days)
```
Localhost: 7 nights
Bubble: 6 nights (or 7?)
```

**If different:** This is the most important finding!

#### 🟡 Other Potential Discrepancies:
- Validation status differs
- Error messages are different
- Contiguity logic behaves differently
- Wrap-around cases handled differently

---

## 📝 TASK 3: Generate Structured Comparison Report

**File:** `test-results/BUBBLE_COMPARISON_REPORT.md` (AUTO-GENERATED)

### Create Summary Report:

```typescript
// Add to your test file
test.afterAll(async () => {
  // Generate summary report
  const fs = require('fs');
  const allQuestions = fs.readdirSync('test-results/comet-questions')
    .filter(f => f.endsWith('.md'));
  
  let summaryContent = `# Bubble vs Localhost Comparison Report

**Date:** ${new Date().toISOString()}
**Total Scenarios Tested:** ${TEST_SCENARIOS.length}
**Discrepancies Found:** ${allQuestions.length}

## Summary

`;

  if (allQuestions.length === 0) {
    summaryContent += '✅ **NO DISCREPANCIES FOUND**\n\n';
    summaryContent += 'Localhost implementation matches Bubble production perfectly!\n';
  } else {
    summaryContent += `🚨 **${allQuestions.length} DISCREPANCIES DETECTED**\n\n`;
    summaryContent += '### Scenarios with Discrepancies:\n\n';
    
    allQuestions.forEach((file, i) => {
      const content = fs.readFileSync(\`test-results/comet-questions/\${file}\`, 'utf8');
      summaryContent += \`${i + 1}. \${file.replace('-questions.md', '')}\n\`;
    });
  }

  summaryContent += '\n## Next Steps\n\n';
  summaryContent += '1. Review individual question files in `test-results/comet-questions/`\n';
  summaryContent += '2. Pass questions to Comet agent for Bubble IDE investigation\n';
  summaryContent += '3. Compare Bubble logic with our Golden Rules\n';
  summaryContent += '4. Update implementation if Bubble is correct\n';
  summaryContent += '5. Document any intentional differences\n';

  fs.writeFileSync('test-results/BUBBLE_COMPARISON_REPORT.md', summaryContent);
  console.log('\n📊 Summary report generated: test-results/BUBBLE_COMPARISON_REPORT.md');
});
```

---

## ✅ Success Criteria

- [ ] Playwright test file created
- [ ] Tests run successfully against both localhost and Bubble
- [ ] Screenshots captured for all scenarios
- [ ] Discrepancies identified and logged
- [ ] Questions generated for Comet investigation
- [ ] Summary report created

---

## 🎯 Expected Deliverables

### 1. Test Results Directory Structure:
```
test-results/
├── BUBBLE_COMPARISON_REPORT.md          (Summary)
├── comet-questions/                     (Questions for Bubble investigation)
│   ├── normal-5-night-questions.md
│   ├── wrap-around-questions.md
│   ├── full-week-questions.md
│   └── gap-selection-questions.md
├── localhost-normal-5-night.png         (Screenshots)
├── bubble-normal-5-night.png
├── localhost-full-week.png
└── bubble-full-week.png
```

### 2. Question Format for Comet:
Each question file should be ready to pass to Comet with:
- Clear description of the discrepancy
- Specific workflow/component to investigate
- Expected vs actual behavior
- Links to relevant documentation

---

## 🔍 Debugging Tips

### Issue: Can't find elements on Bubble page
**Solution:** Use Playwright Inspector
```bash
bunx playwright test --debug
```
Hover over elements to get selectors.

### Issue: Bubble requires login
**Solution:** Add authentication step:
```typescript
await bubblePage.goto('https://app.split.lease/version-test/login');
await bubblePage.fill('[name="email"]', 'test@example.com');
await bubblePage.fill('[name="password"]', 'password');
await bubblePage.click('button[type="submit"]');
await bubblePage.waitForURL('**/z-schedule-test');
```

### Issue: Different DOM structure between localhost and Bubble
**Solution:** Use flexible selectors:
```typescript
// Try multiple strategies
const nightsCount = await page.locator('[data-testid="nights"]')
  .or(page.locator('text=/nights/i'))
  .or(page.locator('[class*="night"]'))
  .first();
```

---

## 🚀 Ready to Execute

1. **Start localhost server:** `npm run dev`
2. **Run Playwright tests:** `bun run test`
3. **Review test results** in `test-results/`
4. **Pass questions to Comet** for Bubble IDE investigation
5. **Compare findings** with Golden Rules

Good luck! 🎉
