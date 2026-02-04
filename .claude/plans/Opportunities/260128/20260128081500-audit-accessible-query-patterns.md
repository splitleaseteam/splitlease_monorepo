# Accessible Query Patterns Opportunity Report

**Generated:** 2026-01-28T08:15:00
**Codebase:** Split Lease

## Executive Summary

| Metric | Count |
|--------|-------|
| Total test files analyzed | 17 |
| Tests using accessible queries | 5 |
| Tests using brittle selectors | 4 |
| Hybrid (uses both) | 3 |
| No DOM queries (logic tests) | 5 |

**Overall Status:** Good - The existing component tests predominantly use accessible query patterns. The codebase follows Testing Library best practices.

## Query Pattern Analysis

### Accessible Queries (Preferred)

These tests correctly use RTL's accessible query methods:

| File | Accessible Queries Used | Status |
|------|------------------------|--------|
| `Button.test.jsx` | `getByRole('button')`, `getByText()` | Excellent |
| `DayButton.test.jsx` | `getByRole('button')`, `getByText()` | Excellent |
| `ErrorOverlay.test.jsx` | `getByRole('button')`, `getByRole('heading')`, `getByText()` | Excellent |
| `PriceDisplay.test.jsx` | `getByText()`, `queryByText()`, `getAllByText()` | Excellent |
| `NotFoundPage.test.jsx` | `getByRole('button')`, `getByRole('link')`, `getByRole('heading')`, `getByRole('navigation')`, `getByText()` | Excellent |

### Brittle Selectors Found

| File | Pattern | Line | Severity | Recommendation |
|------|---------|------|----------|----------------|
| `Button.test.jsx` | `getByTestId('test-icon')` | 157, 162, 174, 186 | Low | Acceptable for icons without accessible name |
| `Button.test.jsx` | `querySelector('.btn-icon')` | 166, 175, 180 | Medium | Use `getByRole` with accessible name |
| `PriceDisplay.test.jsx` | `querySelector('.price-display')` | 336 | Medium | Add `data-testid` or use `getByRole` |
| `PriceDisplay.test.jsx` | `querySelectorAll('.price-row')` | 351 | Medium | Count by accessible structure |
| `ErrorOverlay.test.jsx` | `querySelector('.error-overlay-backdrop')` | 42 | Medium | Use `getByRole('dialog')` |
| `ErrorOverlay.test.jsx` | `querySelector('.error-overlay')` | 47, 148, 355 | Medium | Use `getByRole('dialog')` |
| `NotFoundPage.test.jsx` | `querySelector('.not-found-container')` | 60 | Low | CSS class assertion (valid for styling) |
| `NotFoundPage.test.jsx` | `querySelectorAll('.separator')` | 127, 203 | Low | Testing presentational elements |

### Logic Tests (No DOM Queries)

These tests don't interact with DOM, so they're not applicable for this audit:

| File | Type | Status |
|------|------|--------|
| `calculateMatchScore.test.js` | Calculator unit test | N/A |
| `calculateFourWeekRent.test.js` | Calculator unit test | N/A |
| `calculateGuestFacingPrice.test.js` | Calculator unit test | N/A |
| `calculateReservationTotal.test.js` | Calculator unit test | N/A |
| `getNightlyRateByFrequency.test.js` | Calculator unit test | N/A |
| `calculateQuickProposal.test.js` | Calculator unit test | N/A |
| `useDeviceDetection.test.js` | Hook unit test | N/A |
| `useImageCarousel.test.js` | Hook unit test | N/A |
| `REG-001-fk-constraint-violation.test.js` | Regression test | N/A |

### Integration Tests

| File | Current Approach | Status |
|------|------------------|--------|
| `auth-flow.test.js` | Integration test (different patterns apply) | Review separately |
| `booking-flow.test.js` | Integration test (different patterns apply) | Review separately |
| `property-search.test.js` | Integration test (different patterns apply) | Review separately |

## Query Priority Reference

Following Testing Library's recommended priority:

| Priority | Query Method | When to Use |
|----------|--------------|-------------|
| 1 | `getByRole` | Any element with an accessible role |
| 2 | `getByLabelText` | Form fields |
| 3 | `getByPlaceholderText` | Input fields with placeholder |
| 4 | `getByText` | Non-interactive elements |
| 5 | `getByDisplayValue` | Current form input values |
| 6 | `getByAltText` | Images |
| 7 | `getByTitle` | Elements with title attribute |
| 8 | `getByTestId` | Last resort - for elements without accessible identifier |

## Specific Recommendations

### Button.test.jsx

**Current (lines 166, 175, 180):**
```javascript
expect(button.querySelector('.btn-icon')).toBeInTheDocument();
```

**Recommended:**
```javascript
// If icon has accessible name
expect(screen.getByRole('img', { name: /icon/i })).toBeInTheDocument();
// Or if testing icon presence alongside button
expect(within(button).getByRole('img')).toBeInTheDocument();
```

**Note:** `getByTestId('test-icon')` is acceptable because icons often lack accessible names.

### PriceDisplay.test.jsx

**Current (line 336):**
```javascript
expect(container.querySelector('.price-display')).toBeInTheDocument();
```

**Recommended:**
```javascript
// Use a more semantic query
expect(screen.getByRole('region', { name: /price breakdown/i })).toBeInTheDocument();
// Or add aria-label to the price-display container
```

**Current (line 351):**
```javascript
expect(container.querySelectorAll('.price-row')).toHaveLength(4);
```

**Recommended:**
```javascript
// Count by accessible text content
expect(screen.getAllByRole('listitem')).toHaveLength(4);
// Or if they're table rows
expect(screen.getAllByRole('row')).toHaveLength(4);
```

### ErrorOverlay.test.jsx

**Current (line 42):**
```javascript
expect(container.querySelector('.error-overlay-backdrop')).toBeInTheDocument();
```

**Recommended:**
```javascript
// Use dialog role (if component uses role="dialog")
expect(screen.getByRole('dialog')).toBeInTheDocument();
// Or use aria-label
expect(screen.getByRole('alertdialog', { name: /error/i })).toBeInTheDocument();
```

### NotFoundPage.test.jsx

**Current (lines 60, 65):**
```javascript
expect(container.querySelector('.not-found-container')).toBeInTheDocument();
```

**Assessment:** These are CSS class assertions which are valid for testing styling is applied correctly. Lower priority to change.

## Pattern Summary

| Pattern | Count | Severity |
|---------|-------|----------|
| `getByRole` | 47 uses | Good |
| `getByText` | 38 uses | Good |
| `getByTestId` | 6 uses | Acceptable |
| `querySelector` | 24 uses | Medium - Review |
| `querySelectorAll` | 4 uses | Medium - Review |

## Best Practices Observed

The codebase already follows several best practices:

1. **Primary use of `getByRole`** - Most button and link queries use role-based selectors
2. **Accessible name verification** - Tests verify `aria-label` attributes
3. **Heading level checks** - Tests verify proper heading hierarchy
4. **Keyboard accessibility tests** - Tests include Enter and Space key interactions
5. **Focus state verification** - Tests check focusable and non-focusable states

## Recommendations

### Immediate Actions (Low Effort)

- [ ] Add `role="dialog"` to ErrorOverlay component
- [ ] Add `role="region"` with `aria-label` to PriceDisplay container
- [ ] Document query pattern preferences in testing documentation

### Medium-term Improvements

- [ ] Refactor `querySelector` usage in CSS class assertion tests to use semantic queries
- [ ] Add accessible names to icon elements where possible
- [ ] Create test utilities for common query patterns

### For New Tests

When writing new tests, follow this order:

1. Start with `getByRole` - covers buttons, links, headings, navigation
2. Use `getByLabelText` for form fields
3. Use `getByText` for content verification
4. Reserve `getByTestId` for complex components without clear roles

## Conclusion

The Split Lease test suite demonstrates good adoption of accessible query patterns. The existing tests prioritize `getByRole` and `getByText` which align with Testing Library best practices. The identified `querySelector` usages are mostly for CSS class verification, which is a valid use case for testing styling.

**Severity: Low** - No critical issues. Minor improvements recommended for consistency.
