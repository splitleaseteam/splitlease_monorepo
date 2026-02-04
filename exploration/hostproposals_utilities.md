# HostProposalsPage Utilities Exploration

## Scope
- Files scanned: `app/src/islands/pages/HostProposalsPage/*.js`, `app/src/islands/pages/HostProposalsPage/*.jsx`

## Task 1: formatCurrency

### Local implementation
- Path: `app/src/islands/pages/HostProposalsPage/formatters.js`
- Signature: `formatCurrency(amount)`
- Behavior:
  - Returns `0.00` for null/NaN inputs.
  - Always renders exactly two decimals (cents).
  - No currency symbol (returns a plain number string, e.g., `"123.45"`).

### Canonical implementation
- Path: `app/src/lib/formatters.js`
- Signature: `formatCurrency(amount, { showCents = false, locale = 'en-US' } = {})`
- Behavior:
  - Uses `Intl.NumberFormat` with `style: 'currency'` and `currency: 'USD'`.
  - Defaults to no cents (`showCents: false`).
  - Includes currency symbol (e.g., `"$123"` or `"$123.45"`).

### Delta summary
- Local version always shows cents and omits `$`.
- Canonical version defaults to no cents and includes `$` with locale/currency style.

### Usage locations (HostProposalsPage)
- `app/src/islands/pages/HostProposalsPage/NarrativeProposalBody.jsx`
- `app/src/islands/pages/HostProposalsPage/ProposalCard.jsx`
- `app/src/islands/pages/HostProposalsPage/ProposalDetailsModal.jsx`

## Task 2: console.log count
- Total `console.log` occurrences under HostProposalsPage: 34
- Primary file: `app/src/islands/pages/HostProposalsPage/useHostProposalsPageLogic.js`
- Additional occurrence: `app/src/islands/pages/HostProposalsPage/index.jsx`

## Task 3: Other utilities

### formatDate / formatDateTime references
- `app/src/islands/pages/HostProposalsPage/formatters.js`
  - `formatDate`, `formatDateTime`, `formatFullDate`, `formatTime`, `formatDateRange`
- `app/src/islands/pages/HostProposalsPage/InfoGrid.jsx`
  - Local `formatDate` helper (component-scoped)
- `app/src/islands/pages/HostProposalsPage/ProposalCard.jsx`
- `app/src/islands/pages/HostProposalsPage/ProposalDetailsModal.jsx`
