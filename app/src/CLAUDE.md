# app/src - React Application Source - LLM Reference

**SCOPE**: Frontend React application source directory

---

## ARCHITECTURE_OVERVIEW

[PATTERN]: Islands Architecture - Each JSX entry point creates independent React root
[FLOW]: HTML file → JSX entry point → Page component → Business logic hook
[STATE_MANAGEMENT]: Local state (useState), URL parameters, localStorage
[API_STRATEGY]: Supabase Edge Functions (proxies to Bubble API)
[ROUTING]: Route registry in routes.config.js
[ENTRY_POINTS]: 29 total (see routes.config.js for full list)

---

## ENTRY_POINT_PATTERN

```javascript
// Standard pattern for all entry points
import React from 'react';
import { createRoot } from 'react-dom/client';
import PageComponent from './islands/pages/PageComponent';

const root = createRoot(document.getElementById('root'));
root.render(<PageComponent />);
```

[CRITICAL]: Each entry point creates ONE React root per HTML page
[MOUNT_POINT]: div#root in HTML file
[HYDRATION]: None - full client-side rendering

---

## FOUR_LAYER_LOGIC_ARCHITECTURE

All business logic lives in `logic/` using four layers with strict naming conventions:

| Layer | Directory | Naming | Returns | Dependencies |
|-------|-----------|--------|---------|-------------|
| Calculators | `logic/calculators/` | `calculate*`, `get*` | Numbers, computed values | None (pure functions) |
| Rules | `logic/rules/` | `can*`, `is*`, `has*`, `should*` | Boolean | May call calculators |
| Processors | `logic/processors/` | `adapt*`, `extract*`, `process*`, `format*` | Transformed data | May call calculators |
| Workflows | `logic/workflows/` | `*Workflow` | Complex results, side effects | Calls all other layers |

**Subdirectories** follow domain grouping: `pricing/`, `scheduling/`, `proposals/`, `auth/`, `search/`, `users/`, `external/`, `display/`, `listing/`, `booking/`

[CRITICAL]: `logic/processors/external/` handles day conversion at API boundaries (see CRITICAL_PATTERNS)

---

## LIB_UTILITIES

Shared utilities in `lib/` organized by concern:

**Core API Clients**: `supabase.js`, `bubbleAPI.js`, `auth.js`, `secureStorage.js`
**Data Access**: `dataLookups.js`, `proposalDataFetcher.js`, `listingDataFetcher.js`, `listingService.js`
**Constants**: `constants.js` (single source of truth for all config)
**Utilities**: `dayUtils.js`, `mapUtils.js`, `sanitize.js`, `urlParams.js`, `navigation.js`, `photoUpload.js`
**Integrations**: `slackService.js`, `aiService.js`, `hotjar.js`
**Subdirectories**: `constants/`, `proposals/`, `scheduleSelector/`

[DO_NOT_MERGE]: `lib/priceCalculations.js` vs `lib/scheduleSelector/priceCalculations.js` vs `logic/calculators/pricing/` — see REFACTORING_RULES

---

## CRITICAL_PATTERNS

### Day Indexing Convention
[INTERNAL]: JavaScript 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
[BUBBLE_API]: Bubble 1-7 (Sunday=1, Monday=2, ..., Saturday=7)
[CONVERSION]: ALWAYS use adaptDaysFromBubble/adaptDaysToBubble at boundaries
[LOCATION]: logic/processors/external/

```javascript
import { adaptDaysFromBubble } from 'logic/processors/external/adaptDaysFromBubble.js';
import { adaptDaysToBubble } from 'logic/processors/external/adaptDaysToBubble.js';

// Receiving from Bubble API
const jsDays = adaptDaysFromBubble({ bubbleDays: [2, 3, 4, 5, 6] }); // → [1, 2, 3, 4, 5]

// Sending to Bubble API
const bubbleDays = adaptDaysToBubble({ jsDays: [1, 2, 3, 4, 5] }); // → [2, 3, 4, 5, 6]
```

### Hollow Component Pattern
[DESCRIPTION]: UI component delegates ALL logic to custom hook
[COMPONENT]: Contains only JSX rendering
[HOOK]: Contains all state, effects, handlers

```javascript
// islands/pages/ViewSplitLeasePage.jsx
export default function ViewSplitLeasePage() {
  const logic = useViewSplitLeasePageLogic();
  return <div>{/* Pure JSX using logic.* */}</div>;
}

// islands/pages/useViewSplitLeasePageLogic.js
export function useViewSplitLeasePageLogic() {
  // ALL state, effects, handlers here
  return { /* exported API */ };
}
```

### Secure Storage Pattern
[DESCRIPTION]: Encrypt sensitive data in localStorage
[USED_FOR]: Auth tokens, session IDs

```javascript
import { setSecureItem, getSecureItem, removeSecureItem } from 'lib/secureStorage.js';
setSecureItem('splitlease_auth_token', token);
const token = getSecureItem('splitlease_auth_token');
removeSecureItem('splitlease_auth_token');
```

### API Proxy Pattern
[DESCRIPTION]: All Bubble API calls go through Supabase Edge Functions
[REASON]: Keep API keys server-side
[NEVER]: Call Bubble API directly from frontend

```javascript
import { bubbleAPI } from 'lib/bubbleAPI.js';
const listing = await bubbleAPI.getListing(listingId);
```

---

## REFACTORING_RULES

[CRITICAL]: DO NOT consolidate files without semantic analysis. Structural similarity does NOT mean functional duplication.

### Files That Look Similar But Are NOT Duplicates

#### Pricing (3 separate contexts — DO NOT MERGE)
[FILE]: lib/priceCalculations.js
[CONTEXT]: Host compensation calculations (host nightly rate, host 4-week compensation, price display messages)
[FILE]: lib/scheduleSelector/priceCalculations.js
[CONTEXT]: Schedule selector pricing engine (monthly/weekly/nightly with period calculations)
[FILE]: logic/calculators/pricing/
[CONTEXT]: Reservation totals, fee breakdowns, guest-facing prices, quick proposals
[WHY_DIFFERENT]: Different input shapes, different variable names, different consumers, different user roles

#### Schedule Selectors (3+ separate features — DO NOT MERGE)
[FILE]: ListingScheduleSelector — hosts configuring available days for a listing
[FILE]: HostScheduleSelector — hosts editing proposal schedules with auto-fill/auto-complete
[FILE]: SearchScheduleSelector — guests filtering search results with drag-to-select and URL persistence
[WHY_DIFFERENT]: Different user roles, different interaction models, different data flows

### Before Consolidating Any Code
1. Read variable names — do the inputs/outputs describe the same concept?
2. Check consumers — are the same pages/hooks using both files?
3. Compare function signatures — do they take the same parameters?
4. Ask "who uses this?" — different user roles (host vs guest) often mean different features
5. When in doubt, DON'T merge — keep separate and extract only truly shared primitives

### What IS Safe to Consolidate
- Auth check patterns (identical 3-step pattern) — same flow everywhere
- Loading/error/empty state UI components — pure presentation
- Formatting utilities (currency, dates, display names) — stateless transforms
- CSS base classes (visual patterns, not behavior)
- Modal overlay mechanics (backdrop, escape key, scroll lock)
- Generic hooks (useAsyncOperation, useSupabaseQuery, useMediaQuery)

---

## IMPORT_ALIASES

[ALIAS]: logic/* → app/src/logic/*
[ALIAS]: lib/* → app/src/lib/*
[ALIAS]: islands/* → app/src/islands/*
[ALIAS]: styles/* → app/src/styles/*

```javascript
import { calculateFourWeekRent } from 'logic/calculators/pricing/calculateFourWeekRent.js';
import { checkAuthStatus } from 'lib/auth.js';
import Button from 'islands/shared/Button.jsx';
```

---

## KEY_DATA_FLOWS

### Authentication Flow
[ENTRY]: User submits login form
[STEP_1]: lib/auth.js → loginUser()
[STEP_2]: Supabase Edge Function auth-user
[STEP_3]: Bubble API validates credentials
[STEP_4]: Token stored via lib/secureStorage.js
[STEP_5]: User type stored (Host/Guest)
[EXIT]: Redirect to dashboard

### Proposal Creation Flow
[ENTRY]: Guest clicks "Book" on listing
[STEP_1]: islands/shared/CreateProposalFlowV2.jsx modal opens
[STEP_2]: User selects days (uses day conversion)
[STEP_3]: logic/calculators/pricing calculates prices
[STEP_4]: logic/rules/proposals validates proposal
[STEP_5]: logic/workflows/proposals orchestrates submission
[STEP_6]: Supabase Edge Function → Bubble API
[EXIT]: Redirect to guest-proposals page

### Listing Search Flow
[ENTRY]: User visits /search
[STEP_1]: islands/pages/SearchPage.jsx renders
[STEP_2]: User sets filters (days, price, location)
[STEP_3]: lib/dataLookups.js fetches listings from Supabase
[STEP_4]: logic/rules/search validates filters
[STEP_5]: islands/shared/GoogleMap.jsx displays results
[EXIT]: User clicks listing → /view-split-lease/:id

---

## USAGE_NOTES

### When Adding New Page
1. Create HTML file in app/public/
2. Create JSX entry point in app/src/
3. Create page component in app/src/islands/pages/
4. Create logic hook in app/src/islands/pages/use*PageLogic.js
5. Add route to routes.config.js
6. Run: bun run generate-routes

### When Adding Business Logic
1. Determine layer: calculator, rule, processor, or workflow
2. Create file in appropriate logic/* subdirectory
3. Follow naming convention for layer
4. Write pure function with single responsibility
5. Export from layer's index.js

### When Adding API Call
1. Add function to lib/bubbleAPI.js or lib/supabase.js
2. Use Edge Function proxy for Bubble API
3. Add error handling
4. Use secure storage for tokens

### When Converting Days
1. Identify system boundary (Bubble API ↔ Internal)
2. Use adaptDaysFromBubble when receiving from Bubble
3. Use adaptDaysToBubble when sending to Bubble
4. NEVER mix 0-based and 1-based in same function

---

## CRITICAL_FILES

### Must Read Before Changes
[FILE]: routes.config.js - Route definitions
[FILE]: lib/constants.js - All configuration
[FILE]: lib/auth.js - Authentication system
[FILE]: logic/processors/external/adaptDays*.js - Day conversion

### Don't Modify
[DIR]: routes/ - Auto-generated
[FILE]: Any file in logic/ without understanding four-layer pattern

---

## METRICS

[ENTRY_POINTS]: 29 | [LOGIC_FILES]: 57 | [LIB_FILES]: 24 | [TOTAL_FILES]: 150+
[CALCULATORS]: 9 | [RULES]: 22 | [PROCESSORS]: 14 | [WORKFLOWS]: 12

---

**VERSION**: 7.0
**LAST_UPDATED**: 2026-02-10
