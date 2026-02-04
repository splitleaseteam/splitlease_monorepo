# Agent Work Division: Triple-Check Pricing Verification

## PHASE 1: Discovery (Independent Tasks)

These two prompts can run simultaneously. Each agent identifies files in their domain.

---

### PROMPT FOR OPENCODE (Phase 1)

```
TASK: Identify All Frontend Pricing Calculation Files

Search the `app/src` directory to find every file that performs price calculations or references pricing logic. Create a report listing:

1. Files that import or use `calculatePrice` or `priceCalculations`
2. Files that reference `pricing_list` table or pricingList state
3. Components that display price values to users
4. Files that contain the strings: "markup", "discount", "multiplier", "nightlyPrice"

For each file found, note:
- File path
- What pricing-related logic it contains (brief description)
- Whether it READS prices, CALCULATES prices, or DISPLAYS prices

Output a markdown file: `docs/pricing/frontend-pricing-files.md`

Do NOT modify any files. This is a read-only discovery task.
```

---

### PROMPT FOR CLAUDE CODE (Phase 1)

```
TASK: Identify All Backend Pricing Calculation Files

Search the `supabase/functions` directory to find every file that performs price calculations or references pricing logic. Create a report listing:

1. Files that define pricing formulas or multipliers
2. Files that write to or update `pricing_list` table
3. Edge functions that call pricing-related handlers
4. Files that contain the strings: "markup", "discount", "multiplier", "nightlyPrice", "hostCompensation"

For each file found, note:
- File path
- What pricing-related logic it contains (brief description)
- Whether it GENERATES prices, STORES prices, or SYNCS prices

Additionally, check `app/src/logic/calculators` for any shared calculation modules.

Output a markdown file: `docs/pricing/backend-pricing-files.md`

Do NOT modify any files. This is a read-only discovery task.
```

---

## PHASE 2: Implementation (Divide and Conquer)

After Phase 1 completes, these prompts implement the triple-check system.
Claude does the heavier lifting.

---

### PROMPT FOR OPENCODE (Phase 2 - Smaller Scope)

```
TASK: Create Golden Reference Module

Create a new file `app/src/lib/pricing/goldenReference.js` that contains a pure, spec-based reference implementation of the Bubble pricing formula.

Requirements:
1. Export a function `calculateGoldenMultiplier(config)` that takes:
   - nightsBooked (1-7)
   - siteMarkup (default 0.17)
   - unitMarkup (default 0)
   - weeklyMarkup (default 0)
   - isWeeklyRental (boolean)

2. Implement the EXACT additive formula:
   multiplier = 1 + siteMarkup + unitMarkup - unusedNightsDiscount - fullTimeDiscount
   Where:
   - unusedNightsDiscount = (7 - nightsBooked) * 0.03
   - fullTimeDiscount = 0.13 (only when nightsBooked === 7)
   - Add weeklyMarkup only if isWeeklyRental is true

3. Export a function `calculateGoldenNightlyPrice(hostRate, config)` that:
   - Calls calculateGoldenMultiplier
   - Returns hostRate * multiplier

4. Add comprehensive JSDoc comments explaining this is the "source of truth"

5. Create a simple test at the bottom of the file (can be removed later):
   - console.log tests for 2, 4, 7 nights with $100 base rate

After creating, run: `node app/src/lib/pricing/goldenReference.js`
to verify the module works standalone.
```

---

### PROMPT FOR CLAUDE CODE (Phase 2 - Larger Scope)

```
TASK: Implement Triple-Check Comparison System

You will modify the ZPricingUnitTestPage to compare THREE sources instead of two.

## Files to Modify:

### 1. `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`

Find the `runComparisonChecks` function and modify it to:
- Accept `pricingList` as a parameter
- For each metric, extract the DATABASE value from pricingList:
  - nightlyPrice: `pricingList?.nightlyPrice?.[nightsCount - 1]`
  - multiplier: `pricingList?.markupAndDiscountMultiplier?.[nightsCount - 1]`
- Return a structure with { workflow, formula, database, allMatch, diagnostics }
- Add diagnostic logic:
  - If workflow === formula but !== database → "Backend out of sync"
  - If workflow === database but !== formula → "Formula logic error"
  - If formula === database but !== workflow → "Workflow UI error"
  - If all different → "Multiple sources diverged"

Update `handleRunChecks` to pass `pricingList` to `runComparisonChecks`.

### 2. `app/src/islands/pages/ZPricingUnitTestPage/components/Section11WorkflowCheck.jsx`

Change from 2-column to 3-column comparison:
- Add "Database Value" column header
- Add database value cell for each metric row
- Update match logic: allMatch = (workflow === formula === database) within $0.01 tolerance
- Add a diagnostic row at the bottom showing the mismatch type if applicable
- Update PropTypes to include `database` field per metric

### 3. Update comparison results structure

In `useZPricingUnitTestPageLogic.js`, update `INITIAL_COMPARISON_RESULTS` to include:
```javascript
{
  fourWeekRent: { workflow: 0, formula: 0, database: 0, match: true },
  // etc for each metric
}
```

## Testing:
After changes, the "Run Checks" button should show 3 columns.
If all values match within $0.01, show green checkmark.
If mismatch, show which source is the outlier.
```

---

## Execution Order

1. Run Phase 1 prompts in parallel (discovery)
2. Review discovery reports
3. Run OpenCode Phase 2 first (creates dependency for golden reference)
4. Run Claude Code Phase 2 (larger implementation)
