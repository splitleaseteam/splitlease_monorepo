# app/src - React Application Source - LLM Reference

**SCOPE**: Frontend React application source directory

---

## ARCHITECTURE_OVERVIEW

[PATTERN]: Islands Architecture - Each JSX entry point creates independent React root
[FLOW]: HTML file → JSX entry point → Page component → Business logic hook
[STATE_MANAGEMENT]: useReducer (page hooks), useModalManager (modal state), URL parameters, localStorage
[API_STRATEGY]: Supabase Edge Functions (direct database access)
[ROUTING]: Route registry in routes.config.js
[ENTRY_POINTS]: 83 total (see routes.config.js for full list)

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

[NOTE]: Database stores days as 0-indexed (matching JavaScript). No conversion needed at API boundaries.

---

## LIB_UTILITIES

Shared utilities in `lib/` organized by concern:

**Core API Clients**: `supabase.js`, `auth/index.js` (modular barrel), `secureStorage.js`
**Auth Hook**: `hooks/useAuthenticatedUser.js` — single hook for all protected pages (role gating, redirect, user object)
**Data Access**: `dataLookups.js`, `proposalDataFetcher.js`, `listingDataFetcher.js`, `listingCrudGeoPhotoPricingService.js`
**Constants**: `constants.js` (single source of truth for all config)
**Utilities**: `dayUtils.js`, `mapUtils.js`, `sanitize.js`, `urlParams.js`, `navigation.js`, `photoUpload.js`
**Integrations**: `slackService.js`, `aiService.js`, `hotjar.js`
**Subdirectories**: `constants/`, `proposals/`, `scheduleSelector/`

[DO_NOT_MERGE]: `lib/priceCalculations.js` vs `lib/scheduleSelector/priceCalculations.js` vs `logic/calculators/pricing/` — see REFACTORING_RULES

---

## CRITICAL_PATTERNS

### Day Indexing Convention
[INTERNAL]: JavaScript 0-6 (Sunday=0, Monday=1, ..., Saturday=6)
[DATABASE]: Supabase stores 0-indexed natively (matching JavaScript)
[CONVERSION]: No conversion needed — frontend and database use the same 0-based indexing
[UTILITIES]: lib/dayUtils.js provides validation and name lookup helpers

```javascript
import { isValidDaysArray, getDayName, getShortDayName } from 'lib/dayUtils.js';

isValidDaysArray([1, 2, 3, 4, 5]); // → true (Mon-Fri)
getDayName(0); // → 'Sunday'
getShortDayName(3); // → 'Wed'
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

### useReducer Pattern (Page Hooks)
[DESCRIPTION]: Page-level hooks use useReducer with domain-sliced state instead of useState sprawl
[REDUCER_FILE]: Co-located `*Reducer.js` or `*Reducer.ts` next to the hook
[TESTS]: Pure function reducer tests in `__tests__/*Reducer.test.{js,ts}`
[PATTERN]: Reducer exports `initialState` + named reducer function; hook uses `useReducer(reducer, initialState)`

```javascript
// favoriteListingsReducer.js — pure function, trivially testable
export const initialState = { listings: [], isLoading: true, error: null };
export function favoriteListingsReducer(state, action) {
  switch (action.type) {
    case 'INIT_START': return { ...state, isLoading: true, error: null };
    case 'SET_LISTINGS': return { ...state, listings: action.payload };
    default: return state;
  }
}

// useFavoriteListingsPageLogic.js
const [state, dispatch] = useReducer(favoriteListingsReducer, initialState);
dispatch({ type: 'SET_LISTINGS', payload: listings });
```

[ADOPTED_BY]: useViewSplitLeaseLogic, useFavoriteListingsPageLogic, useSearchPageLogic, useMessagingRealtimeChannelsAndCTALogic, useCreateSuggestedProposalLogic, useGuestRelationshipsDashboardLogic, useSelfListingV2Logic, useAccountProfilePageLogic, Header.jsx

### useModalManager Pattern
[DESCRIPTION]: Centralized modal state via `hooks/useModalManager.js` — replaces per-modal useState pairs
[HOOK_FILE]: `hooks/useModalManager.js`
[API]: `open(name, data)`, `close(name)`, `isOpen(name)`, `getData(name)`, `closeAll()`, `toggle(name, data)`
[OPTION]: `allowMultiple: true` to keep multiple modals open simultaneously

```javascript
import { useModalManager } from 'hooks/useModalManager.js';
const modals = useModalManager();
modals.open('photo', { index: 0, photos });
modals.isOpen('photo');        // true
modals.getData('photo').index; // 0
modals.close('photo');
```

[ADOPTED_BY]: useViewSplitLeaseLogic, useFavoriteListingsPageLogic, useSearchPageLogic, useMessagingRealtimeChannelsAndCTALogic, useCreateSuggestedProposalLogic, useSelfListingV2Logic, useAccountProfilePageLogic, Header.jsx, DateChangeRequestManager.jsx

### Secure Storage Pattern
[DESCRIPTION]: Encrypt sensitive data in localStorage
[USED_FOR]: Auth tokens, session IDs

```javascript
import { setSecureItem, getSecureItem, removeSecureItem } from 'lib/secureStorage.js';
setSecureItem('splitlease_auth_token', token);
const token = getSecureItem('splitlease_auth_token');
removeSecureItem('splitlease_auth_token');
```

### Supabase API Pattern
[DESCRIPTION]: All data access goes through Supabase client or Edge Functions
[CLIENT]: Direct Supabase queries for simple reads (listings, lookups)
[EDGE_FUNCTIONS]: For operations requiring server-side logic (auth, proposals, messaging)

```javascript
import { supabase } from 'lib/supabase.js';
const { data } = await supabase.from('listing').select('*').eq('id', listingId);
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
import { checkAuthStatus } from 'lib/auth/index.js';
import Button from 'islands/shared/Button.jsx';
```

---

## KEY_DATA_FLOWS

### Authentication Flow
[ENTRY]: User submits login form
[STEP_1]: lib/auth/index.js → loginUser()
[STEP_2]: Supabase Edge Function auth-user → Supabase Auth
[STEP_3]: JWT token stored via lib/secureStorage.js
[STEP_4]: User type stored (Host/Guest)
[EXIT]: Redirect to dashboard

### Proposal Creation Flow
[ENTRY]: Guest clicks "Book" on listing
[STEP_1]: islands/shared/CreateProposalFlow.jsx modal opens
[STEP_2]: User selects days (uses day conversion)
[STEP_3]: logic/calculators/pricing calculates prices
[STEP_4]: logic/rules/proposals validates proposal
[STEP_5]: logic/workflows/proposals orchestrates submission
[STEP_6]: Supabase Edge Function → database insert
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
1. Add function to lib/supabase.js or relevant data fetcher
2. Use Edge Functions for operations requiring server-side logic
3. Add error handling
4. Use secure storage for auth tokens

### When Working With Days
1. Database and JavaScript both use 0-indexed days (Sun=0 through Sat=6)
2. No conversion needed at API boundaries
3. Use lib/dayUtils.js for validation and name lookups
4. NEVER use 1-based day indexing anywhere

---

## CRITICAL_FILES

### Must Read Before Changes
[FILE]: routes.config.js - Route definitions
[FILE]: lib/constants.js - All configuration
[FILE]: lib/auth/index.js - Authentication system
[FILE]: lib/dayUtils.js - Day indexing utilities

### Don't Modify
[DIR]: routes/ - Auto-generated
[FILE]: Any file in logic/ without understanding four-layer pattern

---

## METRICS

[ENTRY_POINTS]: 83 | [LOGIC_FILES]: 277 | [LIB_FILES]: 75 | [TOTAL_FILES]: 822+
[CALCULATORS]: 81 | [RULES]: 83 | [PROCESSORS]: 52 | [WORKFLOWS]: 30

---

**VERSION**: 8.0
**LAST_UPDATED**: 2026-02-10
