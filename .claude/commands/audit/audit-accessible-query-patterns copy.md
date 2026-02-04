---
name: audit-accessible-query-patterns
description: Audit the codebase to find tests with brittle selectors (CSS classes, IDs) that should use accessible queries (getByRole, getByLabelText). Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Accessible Query Patterns Audit

You are conducting a comprehensive audit to identify tests that use brittle CSS/class selectors instead of accessible Testing Library and Playwright query patterns.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL test files to identify:

### Target Patterns to Find (Anti-Patterns)

1. **CSS class selectors** - Look for:
   - `page.locator('.btn-primary')`
   - `page.locator('.listing-card')`
   - `screen.getByClassName()`
   - `container.querySelector('.class')`

2. **ID selectors** - Look for:
   - `page.locator('#submit-button')`
   - `document.getElementById()`
   - `screen.getByTestId()` when role would work

3. **Ambiguous queries** - Look for:
   - `screen.getByRole('button')` without name
   - `page.getByText('Click')` matching multiple elements
   - `screen.getByRole('heading')` without level

4. **XPath selectors** - Look for:
   - `page.locator('//div[@class="..."]')`
   - Any XPath usage in tests

5. **DOM traversal** - Look for:
   - `container.firstChild`
   - `element.parentElement`
   - `.querySelector()` chains

6. **Exact text for dynamic content** - Look for:
   - `screen.getByText('Showing 10 results')` (breaks when count changes)
   - Hardcoded prices, counts, dates in text queries

### What to Check for Each Test File

For each test file, check:
- Are role-based queries (`getByRole`) used for interactive elements?
- Are form inputs queried by label (`getByLabelText`)?
- Are scoped queries used to avoid ambiguity (`within()`)?
- Are accessible names provided in role queries?
- Are test IDs used only as escape hatch?

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-accessible-query-patterns.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Accessible Query Patterns Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- Test files reviewed: X
- Tests with brittle selectors: X
- High-priority refactors: X
- Accessibility improvements needed: X components

## Query Priority Reference

```
1. getByRole        ← BEST: Accessible, stable
2. getByLabelText   ← Forms: Label associations
3. getByPlaceholder ← Inputs without labels
4. getByText        ← Static content
5. getByTestId      ← Escape hatch for complex UI
6. getByClass/CSS   ← AVOID: Breaks on styling changes
```

## Critical Gaps (Brittle Selectors)

### Test File: [filename.test.ts]
- **File:** `path/to/test.ts`
- **Brittle Selectors Found:**
  | Line | Current Selector | Issue |
  |------|------------------|-------|
  | 15 | `page.locator('.btn-primary')` | CSS class |
  | 23 | `screen.getByRole('button')` | No name |
  | 45 | `page.locator('#submit')` | ID selector |
- **Recommended Fixes:**
  ```typescript
  // Line 15: Replace CSS with role
  page.getByRole('button', { name: 'Submit' })

  // Line 23: Add accessible name
  screen.getByRole('button', { name: 'Book now' })

  // Line 45: Replace ID with role
  page.getByRole('button', { name: 'Submit' })
  ```

### Selector Migration Map

| Current Pattern | Count | Replace With |
|-----------------|-------|--------------|
| `.locator('.class')` | X | `getByRole()` |
| `.locator('#id')` | X | `getByRole()` |
| `getByRole()` without name | X | Add `{ name: '...' }` |
| `getByText()` for dynamic content | X | `getByTestId()` |

## Component Accessibility Gaps

### Components Missing Accessible Names
| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| Icon button | Button.tsx | No aria-label | Add `aria-label="Close"` |
| Search input | SearchBar.tsx | No label | Add `aria-label` |

### Components Needing Test ID
| Component | Reason |
|-----------|--------|
| PriceBreakdown | Dynamic content, no semantic role |
| ListingCard | Complex container, use for scoping |

## Ambiguous Query Issues

### Multiple Elements Matched
| Query | File | Elements Matched | Fix |
|-------|------|------------------|-----|
| `getByRole('button')` | checkout.test.ts | 5 buttons | Add specific name |
| `getByText('View')` | listing.test.ts | 3 links | Use role + name |

### Recommended Scoping Pattern
```typescript
// Before: Ambiguous
screen.getByRole('button', { name: 'Book' }) // Multiple cards

// After: Scoped
const listingCard = screen.getByTestId('listing-card-123')
within(listingCard).getByRole('button', { name: 'Book' })
```

## Tests with Good Query Patterns (Reference)

List tests that already use proper accessible queries as examples.

## ESLint Configuration Recommendation

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['testing-library'],
  rules: {
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/prefer-presence-queries': 'error',
    'testing-library/prefer-role-queries': 'warn',
    'testing-library/no-container': 'error',
    'testing-library/no-node-access': 'error',
  }
}
```

```

---

## Reference: Accessible Query Patterns

Use these patterns as reference when identifying what's missing in the codebase:

### Query Priority

1. **getByRole** - BEST: Accessible, stable
2. **getByLabelText** - Forms with label associations
3. **getByPlaceholder** - Inputs without labels
4. **getByText** - Static content
5. **getByTestId** - Escape hatch for complex UI
6. **getByClass/CSS** - AVOID

### Pattern 1: Role-Based Queries

```typescript
// Good: Specific role + accessible name
screen.getByRole('button', { name: 'Book now' })
screen.getByRole('link', { name: 'View all listings' })
screen.getByRole('heading', { name: 'Search Results', level: 2 })

// Good: Partial matching with regex
screen.getByRole('button', { name: /submit/i })

// Good: State-based queries
screen.getByRole('button', { name: 'Submit', disabled: true })
screen.getByRole('checkbox', { name: 'Remember me', checked: true })
```

### Pattern 2: Label Queries for Forms

```typescript
screen.getByLabelText('Email address')
screen.getByLabelText(/password/i)
```

### Pattern 3: Scoped Queries

```typescript
// Testing Library
const listingCard = screen.getByTestId('listing-card')
within(listingCard).getByRole('button', { name: 'Book' })

// Playwright
const listingCard = page.getByTestId('listing-card')
listingCard.getByRole('button', { name: 'Book' })
```

### Pattern 4: Test IDs as Escape Hatch

```typescript
// For dynamic content
screen.getByTestId('listing-price')
screen.getByTestId('result-count')
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| `page.locator('.btn')` | `getByRole('button', { name })` |
| `screen.getByClassName()` | `getByRole()` or `getByTestId()` |
| `getByRole('button')` alone | Add `{ name: '...' }` |
| `.querySelector()` in tests | RTL/Playwright queries |
| XPath in tests | Semantic queries |

## Output Requirements

1. Be thorough - review EVERY test file
2. Be specific - include exact file paths and line numbers for brittle selectors
3. Be actionable - provide exact replacement queries
4. Only report gaps - do not list tests that already use proper queries unless as reference examples
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-accessible-query-patterns.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
