import { test, expect, type Page, type Browser, type BrowserContext } from 'playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Schedule Selector Comparison: Localhost vs Bubble Production
 *
 * This test compares the behavior of the schedule selector between:
 * - Localhost: Our new Triple-Check implementation
 * - Bubble: Current production source of truth
 *
 * Goal: Identify discrepancies and generate questions for Bubble IDE investigation
 *
 * @see docs/schedule/DISCOVERY_REPORT.md for Golden Rules
 */

const LOCALHOST_URL = 'http://localhost:3000/_internal/z-schedule-test';
const BUBBLE_URL = 'https://app.split.lease/version-test/z-schedule-test';

// Test scenarios matching edge cases from useZScheduleTestPageLogic.js
const TEST_SCENARIOS = [
  {
    id: 'normal-5-night',
    name: 'Normal 5-Night Stay (Mon-Sat)',
    dayIndices: [1, 2, 3, 4, 5, 6],
    dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    expectedNights: 5,
    expectedValid: true,
    description: 'Standard weekday stay, should be straightforward'
  },
  {
    id: 'wrap-around',
    name: 'Wrap-Around Weekend (Fri-Mon)',
    dayIndices: [5, 6, 0, 1],
    dayNames: ['Friday', 'Saturday', 'Sunday', 'Monday'],
    expectedNights: 3,
    expectedValid: true,
    description: 'Tests wrap-around contiguity (Sat→Sun boundary)'
  },
  {
    id: 'full-week',
    name: 'Full Week (7 days = 7 nights)',
    dayIndices: [0, 1, 2, 3, 4, 5, 6],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    expectedNights: 7,  // CRITICAL: Full week special case - NOT 6!
    expectedValid: true,
    description: 'Full week should be 7 nights (full-time rental special case)'
  },
  {
    id: 'gap-selection',
    name: 'Gap Selection (Mon, Wed, Fri)',
    dayIndices: [1, 3, 5],
    dayNames: ['Monday', 'Wednesday', 'Friday'],
    expectedNights: 2,  // Note: Would be 2 based on length-1, but should be INVALID
    expectedValid: false,
    description: 'Non-contiguous selection should be rejected'
  },
  {
    id: 'below-min',
    name: 'Below Minimum (2 days = 1 night)',
    dayIndices: [1, 2],
    dayNames: ['Monday', 'Tuesday'],
    expectedNights: 1,
    expectedValid: false,
    description: 'Below absolute minimum of 2 nights'
  }
];

interface CapturedResults {
  source: string;
  nightsCount: number | null;
  daysCount: number | null;
  isValid: boolean | null;
  errorMessage: string | null;
  validationStatus: string | null;
  tripleCheckMatrix: {
    badge: string | null;
    goldenValid: boolean | null;
    backendValid: boolean | null;
    allAgree: boolean | null;
    recommendation: string | null;
  } | null;
  rawText: string | null;
}

interface Discrepancy {
  type: string;
  message: string;
  localhost: unknown;
  bubble: unknown;
  expected: unknown;
}

/**
 * Helper: Select days by clicking the Edge Case Scenario buttons (localhost only)
 */
async function loadScenarioOnLocalhost(page: Page, scenarioId: string): Promise<void> {
  // Find and click the scenario button in the sidebar
  const scenarioButton = page.locator(`button:has-text("${getScenarioButtonText(scenarioId)}")`);

  if (await scenarioButton.isVisible({ timeout: 5000 })) {
    await scenarioButton.click();
    await page.waitForTimeout(500); // Wait for state update
  } else {
    console.warn(`Scenario button not found for: ${scenarioId}`);
  }
}

function getScenarioButtonText(scenarioId: string): string {
  const mapping: Record<string, string> = {
    'normal-5-night': 'Normal 5-Night',
    'wrap-around': 'Wrap-Around',
    'full-week': 'Full Week',
    'gap-selection': 'Gap Selection',
    'below-min': 'Below Minimum'
  };
  return mapping[scenarioId] || scenarioId;
}

/**
 * Helper: Select days manually by clicking day buttons
 */
async function selectDaysManually(page: Page, dayNames: string[]): Promise<void> {
  for (const dayName of dayNames) {
    // Try multiple selector strategies
    const selectors = [
      // Using aria-label (most reliable for DayButton)
      `button[aria-label^="${dayName}"]`,
      // Using title attribute
      `button[title="${dayName}"]`,
      // Using text content (single letter)
      `.day-button:has-text("${dayName.charAt(0)}")`,
      // Fallback: any button containing the day text
      `button:has-text("${dayName}")`
    ];

    let clicked = false;
    for (const selector of selectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Check if already selected
        const isSelected = await button.getAttribute('aria-pressed') === 'true';
        if (!isSelected) {
          await button.click();
          await page.waitForTimeout(200);
        }
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      console.warn(`Could not find/click day button: ${dayName}`);
    }
  }
}

/**
 * Helper: Capture schedule results from a page
 */
async function captureScheduleResults(page: Page, source: string): Promise<CapturedResults> {
  const results: CapturedResults = {
    source,
    nightsCount: null,
    daysCount: null,
    isValid: null,
    errorMessage: null,
    validationStatus: null,
    tripleCheckMatrix: null,
    rawText: null
  };

  try {
    // ===== CAPTURE FROM TRIPLE-CHECK VALIDATION MATRIX (PRIMARY SOURCE) =====
    // The scenario buttons populate this matrix directly
    if (source === 'localhost') {
      const matrixSummary = page.locator('.svm-summary');
      const summaryText = await matrixSummary.textContent({ timeout: 3000 }).catch(() => null);

      if (summaryText) {
        results.rawText = summaryText;

        // Pattern: "Nights: 5  Recommendation: APPROVE"
        const nightsMatch = summaryText.match(/Nights:\s*(\d+)/i);
        if (nightsMatch) {
          results.nightsCount = parseInt(nightsMatch[1], 10);
        }

        // Check recommendation for validity
        if (summaryText.includes('APPROVE')) {
          results.isValid = true;
        } else if (summaryText.includes('REJECT')) {
          results.isValid = false;
        }
      }

      // Also check the badge for overall status
      const badge = page.locator('.svm-badge').first();
      const badgeText = await badge.textContent({ timeout: 2000 }).catch(() => null);
      if (badgeText) {
        results.validationStatus = badgeText;
        if (badgeText.includes('Agree')) {
          // All validators agree - use that as validity indicator
          if (results.isValid === null) {
            results.isValid = true;
          }
        }
      }
    }

    // ===== FALLBACK: Look for "X days, Y nights" pattern in selection-info =====
    if (results.nightsCount === null) {
      const selectionInfo = page.locator('.selection-info, .info-row');
      const selectionText = await selectionInfo.textContent({ timeout: 3000 }).catch(() => null);

      if (selectionText) {
        if (!results.rawText) results.rawText = selectionText;

        // Pattern: "6 days, 5 nights"
        const nightsMatch = selectionText.match(/(\d+)\s*nights?/i);
        if (nightsMatch) {
          results.nightsCount = parseInt(nightsMatch[1], 10);
        }

        const daysMatch = selectionText.match(/(\d+)\s*days?/i);
        if (daysMatch) {
          results.daysCount = parseInt(daysMatch[1], 10);
        }

        // Check for "Full-time stay" indicator
        if (selectionText.toLowerCase().includes('full-time')) {
          results.nightsCount = 7;
          results.daysCount = 7;
        }
      }
    }

    // ===== CAPTURE FROM LISTING SELECTOR OUTPUT (secondary source) =====
    if (source === 'localhost' && results.nightsCount === null) {
      // Look at the "Listing Selector Output" card for Selected Days
      const outputCard = page.locator('.zst-card:has-text("Listing Selector Output")');
      const outputText = await outputCard.textContent({ timeout: 2000 }).catch(() => null);

      if (outputText) {
        // Look for "Selected Nights X"
        const nightsMatch = outputText.match(/Selected Nights\s*(\d+)/i);
        if (nightsMatch) {
          results.nightsCount = parseInt(nightsMatch[1], 10);
        }

        // Count selected days from "Selected Days Monday, Tuesday, ..."
        const daysMatch = outputText.match(/Selected Days\s+([\w,\s]+?)(?:Check|$)/i);
        if (daysMatch) {
          const daysList = daysMatch[1].split(',').map(d => d.trim()).filter(d => d);
          results.daysCount = daysList.length;
        }
      }
    }

    // ===== CAPTURE VALIDATION STATUS =====

    // Check for error messages
    const errorSelectors = [
      '.error-message',
      '.info-value.error',
      '[class*="error"]',
      '.svm-warning'
    ];

    for (const selector of errorSelectors) {
      const errorEl = page.locator(selector).first();
      if (await errorEl.isVisible({ timeout: 500 }).catch(() => false)) {
        results.errorMessage = await errorEl.textContent().catch(() => null);
        results.isValid = false;
        break;
      }
    }

    // If no error found, check for success indicators
    if (results.isValid === null) {
      const contiguityText = await page.locator('text=Days must be consecutive').isVisible({ timeout: 500 }).catch(() => false);
      if (contiguityText) {
        results.isValid = false;
        results.errorMessage = 'Days must be consecutive';
      } else {
        results.isValid = results.nightsCount !== null && results.nightsCount >= 2;
      }
    }

    // ===== CAPTURE TRIPLE-CHECK MATRIX DETAILS (localhost only) =====
    if (source === 'localhost') {
      const matrixVisible = await page.locator('.schedule-validation-matrix').isVisible({ timeout: 2000 }).catch(() => false);

      if (matrixVisible) {
        results.tripleCheckMatrix = {
          badge: results.validationStatus || null,
          goldenValid: null,
          backendValid: null,
          allAgree: results.validationStatus?.includes('Agree') || null,
          recommendation: null
        };

        // Get recommendation from summary (if not already captured)
        const summaryText = await page.locator('.svm-summary').textContent().catch(() => null);
        if (summaryText) {
          const recMatch = summaryText.match(/Recommendation:\s*(\w+)/);
          if (recMatch) {
            results.tripleCheckMatrix.recommendation = recMatch[1];

            // Update validity based on recommendation
            if (results.isValid === null) {
              results.isValid = recMatch[1] === 'APPROVE';
            }
          }
        }

        // Get individual validator results from table
        const rows = page.locator('.svm-table tbody tr');
        const rowCount = await rows.count();

        for (let i = 0; i < rowCount; i++) {
          const row = rows.nth(i);
          const sourceCell = await row.locator('.svm-source').textContent().catch(() => '');
          const validCell = await row.locator('.svm-icon').textContent().catch(() => '');

          if (sourceCell?.includes('GOLDEN')) {
            results.tripleCheckMatrix.goldenValid = validCell?.includes('Pass') || false;
          }
          if (sourceCell?.includes('BACKEND')) {
            results.tripleCheckMatrix.backendValid = validCell?.includes('Pass') || false;
          }
        }

        // If validators pass, the schedule is valid
        if (results.tripleCheckMatrix.goldenValid && results.tripleCheckMatrix.backendValid) {
          results.isValid = true;
        }
      }
    }

    // ===== CAPTURE VALIDATION STATUS TEXT =====
    const validationSelectors = [
      '.validation-status',
      '.svm-badge',
      '[class*="valid"]'
    ];

    for (const selector of validationSelectors) {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
        results.validationStatus = await el.textContent().catch(() => null);
        break;
      }
    }

  } catch (error) {
    console.error(`Error capturing results from ${source}:`, error);
  }

  return results;
}

/**
 * Helper: Compare results between localhost and Bubble
 */
function compareResults(
  localhost: CapturedResults,
  bubble: CapturedResults,
  scenario: typeof TEST_SCENARIOS[0]
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Compare nights count between sources
  if (localhost.nightsCount !== null && bubble.nightsCount !== null) {
    if (localhost.nightsCount !== bubble.nightsCount) {
      discrepancies.push({
        type: 'NIGHTS_MISMATCH',
        message: `Nights Count differs: Localhost=${localhost.nightsCount}, Bubble=${bubble.nightsCount}`,
        localhost: localhost.nightsCount,
        bubble: bubble.nightsCount,
        expected: scenario.expectedNights
      });
    }
  }

  // Check if localhost matches expected
  if (localhost.nightsCount !== null && localhost.nightsCount !== scenario.expectedNights) {
    discrepancies.push({
      type: 'LOCALHOST_WRONG',
      message: `Localhost nights WRONG: Got ${localhost.nightsCount}, Expected ${scenario.expectedNights}`,
      localhost: localhost.nightsCount,
      bubble: bubble.nightsCount,
      expected: scenario.expectedNights
    });
  }

  // Check if Bubble matches expected
  if (bubble.nightsCount !== null && bubble.nightsCount !== scenario.expectedNights) {
    discrepancies.push({
      type: 'BUBBLE_WRONG',
      message: `Bubble nights WRONG: Got ${bubble.nightsCount}, Expected ${scenario.expectedNights}`,
      localhost: localhost.nightsCount,
      bubble: bubble.nightsCount,
      expected: scenario.expectedNights
    });
  }

  // Compare validity
  if (localhost.isValid !== null && bubble.isValid !== null) {
    if (localhost.isValid !== bubble.isValid) {
      discrepancies.push({
        type: 'VALIDITY_MISMATCH',
        message: `Validity differs: Localhost=${localhost.isValid}, Bubble=${bubble.isValid}`,
        localhost: localhost.isValid,
        bubble: bubble.isValid,
        expected: scenario.expectedValid
      });
    }
  }

  // Check if validity matches expected
  if (localhost.isValid !== null && localhost.isValid !== scenario.expectedValid) {
    discrepancies.push({
      type: 'LOCALHOST_VALIDITY_WRONG',
      message: `Localhost validity WRONG: Got ${localhost.isValid}, Expected ${scenario.expectedValid}`,
      localhost: localhost.isValid,
      bubble: bubble.isValid,
      expected: scenario.expectedValid
    });
  }

  return discrepancies;
}

/**
 * Helper: Generate Comet questions based on discrepancies
 */
function generateCometQuestions(
  scenario: typeof TEST_SCENARIOS[0],
  localhost: CapturedResults,
  bubble: CapturedResults,
  discrepancies: Discrepancy[]
): string[] {
  const questions: string[] = [];

  // Question about nights calculation
  if (discrepancies.some(d => d.type.includes('NIGHTS'))) {
    questions.push(
      `**Nights Calculation Discrepancy:** Localhost shows ${localhost.nightsCount} nights, ` +
      `Bubble shows ${bubble.nightsCount} nights. ` +
      `In the Bubble IDE, find the workflow or expression that calculates nights from selected days. ` +
      `Does it use \`selectedDays.length - 1\` or \`selectedDays.length\`? ` +
      `Is there a special case for 7 days (full week)?`
    );
  }

  // Question about full week handling
  if (scenario.id === 'full-week') {
    questions.push(
      `**Full Week Logic:** For ${scenario.dayNames.length} selected days, we expect ${scenario.expectedNights} nights (full week special case). ` +
      `Does Bubble have special handling for selecting all 7 days? ` +
      `Look for conditions like "If selected days count = 7" or "If full week" in the validation workflow.`
    );
  }

  // Question about contiguity
  if (scenario.id === 'gap-selection' || scenario.id === 'wrap-around') {
    questions.push(
      `**Contiguity Check:** This scenario tests ${scenario.id === 'gap-selection' ? 'gap detection' : 'wrap-around handling'}. ` +
      `In Bubble, find the contiguity validation logic. ` +
      `Does it handle wrap-around cases (Sat→Sun boundary)? ` +
      `What error code/message does it return for non-contiguous selections?`
    );
  }

  // Question about validation status
  if (discrepancies.some(d => d.type.includes('VALIDITY'))) {
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

/**
 * Helper: Log discrepancy for Comet investigation
 */
async function logDiscrepancyForComet(
  scenario: typeof TEST_SCENARIOS[0],
  localhost: CapturedResults,
  bubble: CapturedResults,
  discrepancies: Discrepancy[]
): Promise<void> {
  const logDir = path.join(process.cwd(), 'test-results', 'comet-questions');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const questions = generateCometQuestions(scenario, localhost, bubble, discrepancies);
  const logFile = path.join(logDir, `${scenario.id}-questions.md`);

  const content = `# Bubble Investigation: ${scenario.name}

**Date:** ${new Date().toISOString()}
**Test Scenario:** ${scenario.id}
**Description:** ${scenario.description}

## Expected Results
- **Days Selected:** ${scenario.dayNames.join(', ')}
- **Expected Nights:** ${scenario.expectedNights}
- **Expected Valid:** ${scenario.expectedValid}

## Discrepancies Found

${discrepancies.map(d => `- **${d.type}:** ${d.message}`).join('\n')}

## Captured Data

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

## Cross-Reference

- **Golden Validator:** app/src/lib/scheduleSelector/goldenScheduleValidator.js
- **Backend Workflow:** app/src/logic/workflows/scheduling/validateScheduleWorkflow.js
- **Multi-Check System:** app/src/lib/scheduleSelector/multiCheckScheduleValidator.js
`;

  fs.writeFileSync(logFile, content);
  console.log(`\n📝 Logged questions for Comet: ${logFile}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Schedule Selector: Localhost vs Bubble Comparison', () => {

  // Store results for summary report
  const allResults: {
    scenario: string;
    localhost: CapturedResults;
    bubble: CapturedResults;
    discrepancies: Discrepancy[];
  }[] = [];

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for network operations
    test.setTimeout(90000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCALHOST-ONLY TESTS (quick validation)
  // ─────────────────────────────────────────────────────────────────────────────

  test.describe('Localhost Triple-Check Validation', () => {

    for (const scenario of TEST_SCENARIOS) {
      test(`Localhost: ${scenario.name}`, async ({ page }) => {
        console.log(`\n🧪 Testing: ${scenario.name}`);

        // Navigate to localhost test page
        await page.goto(LOCALHOST_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Load the scenario using the Edge Case button
        await loadScenarioOnLocalhost(page, scenario.id);
        await page.waitForTimeout(1000);

        // Capture results
        const results = await captureScheduleResults(page, 'localhost');

        console.log(`📊 Results for ${scenario.name}:`);
        console.log(`   Nights: ${results.nightsCount} (expected: ${scenario.expectedNights})`);
        console.log(`   Valid: ${results.isValid} (expected: ${scenario.expectedValid})`);
        console.log(`   Triple-Check: ${results.tripleCheckMatrix?.badge || 'N/A'}`);

        // Take screenshot
        await page.screenshot({
          path: `test-results/localhost-${scenario.id}.png`,
          fullPage: true
        });

        // Assertions
        if (scenario.expectedValid) {
          // For valid scenarios, check nights count
          if (results.nightsCount !== null) {
            expect(results.nightsCount).toBe(scenario.expectedNights);
          }
        }

        // Check Triple-Check Matrix agreement
        if (results.tripleCheckMatrix) {
          console.log(`   Golden Valid: ${results.tripleCheckMatrix.goldenValid}`);
          console.log(`   Backend Valid: ${results.tripleCheckMatrix.backendValid}`);

          if (!results.tripleCheckMatrix.allAgree) {
            console.warn(`   ⚠️ DISCREPANCY: Validators disagree!`);
          }
        }
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FULL COMPARISON TESTS (localhost vs Bubble)
  // ─────────────────────────────────────────────────────────────────────────────

  test.describe('Full Comparison: Localhost vs Bubble', () => {

    for (const scenario of TEST_SCENARIOS) {
      test(`Compare: ${scenario.name}`, async ({ browser }) => {
        console.log(`\n🔄 COMPARISON: ${scenario.name}`);
        console.log(`   Days: ${scenario.dayNames.join(', ')}`);
        console.log(`   Expected Nights: ${scenario.expectedNights}`);

        // Create separate browser contexts for localhost and Bubble
        const localhostContext = await browser.newContext();
        const bubbleContext = await browser.newContext();

        const localhostPage = await localhostContext.newPage();
        const bubblePage = await bubbleContext.newPage();

        try {
          // ═══════════════════════════════════════════════════════════════════
          // LOCALHOST
          // ═══════════════════════════════════════════════════════════════════
          console.log(`\n📍 LOCALHOST: Testing ${scenario.name}`);

          await localhostPage.goto(LOCALHOST_URL, { waitUntil: 'networkidle', timeout: 30000 });
          await localhostPage.waitForTimeout(2000);

          // Load scenario
          await loadScenarioOnLocalhost(localhostPage, scenario.id);
          await localhostPage.waitForTimeout(1000);

          // Capture results
          const localhostResults = await captureScheduleResults(localhostPage, 'localhost');
          console.log(`   Localhost Nights: ${localhostResults.nightsCount}`);

          // ═══════════════════════════════════════════════════════════════════
          // BUBBLE
          // ═══════════════════════════════════════════════════════════════════
          console.log(`\n📍 BUBBLE: Testing ${scenario.name}`);

          // Try to access Bubble - may require authentication
          try {
            await bubblePage.goto(BUBBLE_URL, { waitUntil: 'networkidle', timeout: 45000 });
            await bubblePage.waitForTimeout(3000);

            // Check if we hit a login page
            const isLoginPage = await bubblePage.locator('input[type="password"], [class*="login"]')
              .isVisible({ timeout: 2000 })
              .catch(() => false);

            if (isLoginPage) {
              console.log('   ⚠️ Bubble requires authentication - skipping Bubble comparison');
              // Create placeholder results
              const bubbleResults: CapturedResults = {
                source: 'bubble',
                nightsCount: null,
                daysCount: null,
                isValid: null,
                errorMessage: 'Authentication required',
                validationStatus: null,
                tripleCheckMatrix: null,
                rawText: null
              };

              // Still save results for reporting
              allResults.push({
                scenario: scenario.id,
                localhost: localhostResults,
                bubble: bubbleResults,
                discrepancies: [{ type: 'AUTH_REQUIRED', message: 'Bubble requires authentication', localhost: null, bubble: null, expected: null }]
              });

            } else {
              // Bubble is accessible - select days manually
              await selectDaysManually(bubblePage, scenario.dayNames);
              await bubblePage.waitForTimeout(1000);

              // Capture Bubble results
              const bubbleResults = await captureScheduleResults(bubblePage, 'bubble');
              console.log(`   Bubble Nights: ${bubbleResults.nightsCount}`);

              // ═════════════════════════════════════════════════════════════════
              // COMPARE
              // ═════════════════════════════════════════════════════════════════
              console.log(`\n🔍 COMPARISON for ${scenario.name}:`);

              const discrepancies = compareResults(localhostResults, bubbleResults, scenario);

              if (discrepancies.length > 0) {
                console.log(`\n🚨 DISCREPANCIES FOUND (${discrepancies.length}):`);
                discrepancies.forEach(d => console.log(`   - ${d.message}`));

                // Log for Comet investigation
                await logDiscrepancyForComet(scenario, localhostResults, bubbleResults, discrepancies);
              } else {
                console.log('   ✅ No discrepancies - Results match!');
              }

              // Save results
              allResults.push({
                scenario: scenario.id,
                localhost: localhostResults,
                bubble: bubbleResults,
                discrepancies
              });
            }

          } catch (bubbleError) {
            console.log(`   ⚠️ Could not access Bubble: ${bubbleError}`);

            const bubbleResults: CapturedResults = {
              source: 'bubble',
              nightsCount: null,
              daysCount: null,
              isValid: null,
              errorMessage: `Access error: ${bubbleError}`,
              validationStatus: null,
              tripleCheckMatrix: null,
              rawText: null
            };

            allResults.push({
              scenario: scenario.id,
              localhost: localhostResults,
              bubble: bubbleResults,
              discrepancies: [{ type: 'ACCESS_ERROR', message: `Could not access Bubble: ${bubbleError}`, localhost: null, bubble: null, expected: null }]
            });
          }

          // Take screenshots
          await localhostPage.screenshot({
            path: `test-results/compare-localhost-${scenario.id}.png`,
            fullPage: true
          });

          await bubblePage.screenshot({
            path: `test-results/compare-bubble-${scenario.id}.png`,
            fullPage: true
          }).catch(() => console.log('   Could not capture Bubble screenshot'));

        } finally {
          await localhostContext.close();
          await bubbleContext.close();
        }
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // GENERATE SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────

  test.afterAll(async () => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                     GENERATING SUMMARY REPORT');
    console.log('═══════════════════════════════════════════════════════════════');

    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const scenariosWithDiscrepancies = allResults.filter(r => r.discrepancies.length > 0);

    let summaryContent = `# Bubble vs Localhost Comparison Report

**Generated:** ${new Date().toISOString()}
**Total Scenarios Tested:** ${TEST_SCENARIOS.length}
**Scenarios with Discrepancies:** ${scenariosWithDiscrepancies.length}

## Summary

`;

    if (scenariosWithDiscrepancies.length === 0) {
      summaryContent += '✅ **NO DISCREPANCIES FOUND**\n\n';
      summaryContent += 'Localhost implementation matches Bubble production perfectly!\n';
    } else {
      summaryContent += `🚨 **${scenariosWithDiscrepancies.length} SCENARIOS WITH DISCREPANCIES**\n\n`;
      summaryContent += '### Scenarios with Issues:\n\n';

      for (const result of scenariosWithDiscrepancies) {
        const scenario = TEST_SCENARIOS.find(s => s.id === result.scenario);
        summaryContent += `#### ${result.scenario}: ${scenario?.name || 'Unknown'}\n\n`;
        summaryContent += `- **Localhost Nights:** ${result.localhost.nightsCount}\n`;
        summaryContent += `- **Bubble Nights:** ${result.bubble.nightsCount}\n`;
        summaryContent += `- **Expected Nights:** ${scenario?.expectedNights}\n`;
        summaryContent += '\nDiscrepancies:\n';
        result.discrepancies.forEach(d => {
          summaryContent += `- ${d.message}\n`;
        });
        summaryContent += '\n';
      }
    }

    summaryContent += `
## All Test Results

| Scenario | Localhost Nights | Bubble Nights | Expected | Match |
|----------|-----------------|---------------|----------|-------|
`;

    for (const result of allResults) {
      const scenario = TEST_SCENARIOS.find(s => s.id === result.scenario);
      const match = result.discrepancies.length === 0 ? '✅' : '❌';
      summaryContent += `| ${result.scenario} | ${result.localhost.nightsCount ?? 'N/A'} | ${result.bubble.nightsCount ?? 'N/A'} | ${scenario?.expectedNights} | ${match} |\n`;
    }

    summaryContent += `
## Next Steps

1. Review individual question files in \`test-results/comet-questions/\`
2. Pass questions to Comet agent for Bubble IDE investigation
3. Compare Bubble logic with our Golden Rules
4. Update implementation if Bubble is correct
5. Document any intentional differences

## Key Files to Reference

- **Golden Validator:** \`app/src/lib/scheduleSelector/goldenScheduleValidator.js\`
- **Backend Workflow:** \`app/src/logic/workflows/scheduling/validateScheduleWorkflow.js\`
- **Multi-Check System:** \`app/src/lib/scheduleSelector/multiCheckScheduleValidator.js\`
- **Discovery Report:** \`docs/schedule/DISCOVERY_REPORT.md\`

---

*Generated by Schedule Selector Comparison Tests*
`;

    const reportPath = path.join(reportDir, 'BUBBLE_COMPARISON_REPORT.md');
    fs.writeFileSync(reportPath, summaryContent);
    console.log(`\n📊 Summary report generated: ${reportPath}`);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE UTILITY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Utility: Manual Day Selection', () => {

  test('Can select individual days on localhost', async ({ page }) => {
    await page.goto(LOCALHOST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find all day buttons
    const dayButtons = page.locator('.day-button');
    const count = await dayButtons.count();

    console.log(`Found ${count} day buttons`);
    expect(count).toBe(7);

    // Try clicking Monday
    const mondayButton = page.locator('button[aria-label^="Monday"]');
    await expect(mondayButton).toBeVisible();

    await mondayButton.click();
    await page.waitForTimeout(300);

    // Verify selection
    const isSelected = await mondayButton.getAttribute('aria-pressed');
    expect(isSelected).toBe('true');
  });

  test('Triple-Check Matrix is visible after selection', async ({ page }) => {
    await page.goto(LOCALHOST_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Load a scenario
    await loadScenarioOnLocalhost(page, 'normal-5-night');
    await page.waitForTimeout(1000);

    // Check for Triple-Check Matrix
    const matrix = page.locator('.schedule-validation-matrix');
    await expect(matrix).toBeVisible({ timeout: 5000 });

    // Check for badge
    const badge = page.locator('.svm-badge');
    await expect(badge).toBeVisible();
  });

});
