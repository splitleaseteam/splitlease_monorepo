# Schedule Selection Implementation Investigation

**Date**: 2026-02-04
**Purpose**: Understand current schedule selection implementation to plan feature for persisting user's last selected schedule

---

## Executive Summary

The Split Lease app **already has** a field for storing user schedule preferences: `"Recent Days Selected"` on the `user` table. This field is:
1. **Written to** when proposals are created (in `proposal/actions/create.ts`)
2. **Read from** by the `AuthAwareSearchScheduleSelector` component on the Search page
3. **Editable** via the Account Profile page

The current implementation already supports persisting the user's last selected schedule. However, there may be gaps in how consistently it's used across all entry points.

---

## 1. Proposal Creation Flow

### Backend Edge Function: `supabase/functions/proposal/actions/create.ts`

**Key Finding**: When a proposal is created, the user's selected days ARE saved to the user table.

**Location**: Lines 616-620
```typescript
const guestUpdates: Record<string, unknown> = {
  "flexibility (last known)": guestFlexibility,
  "Recent Days Selected": input.daysSelected,  // <-- SCHEDULE IS SAVED HERE
  "Modified Date": now,
};
```

**Data Flow**:
1. Guest submits proposal with `daysSelected` array (0-based indices: 0=Sun through 6=Sat)
2. The `input.daysSelected` contains the selected days from the proposal form
3. After creating the proposal record, the edge function updates the user's `"Recent Days Selected"` field
4. This update happens in **Step 2** of the proposal creation (lines 612-657)

**Data Format**: The `daysSelected` is stored as a JSONB array of day indices or day names.

---

## 2. Schedule Selector Components

### Primary Component: `app/src/islands/shared/SearchScheduleSelector.jsx`

**Purpose**: UI component for selecting days of the week with drag support

**Key Features**:
- Supports click and drag selection
- Validates contiguity (days must be consecutive)
- Minimum 2 nights required
- Updates URL parameter `days-selected` in real-time
- Uses 0-based day indexing (0=Sunday through 6=Saturday)

**Initial Selection Logic** (lines 276-302):
```javascript
const getInitialSelectionFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const daysParam = urlParams.get('days-selected');

  if (daysParam) {
    // Parse 0-based indices from URL directly
    const dayIndices = daysParam.split(',').map(d => parseInt(d.trim(), 10));
    const validDays = dayIndices.filter(d => d >= 0 && d <= 6);
    if (validDays.length > 0) {
      return validDays;
    }
  }
  // Default to Monday-Friday (0-based: [1,2,3,4,5])
  return [1, 2, 3, 4, 5];
};
```

**Props**:
- `initialSelection`: Optional array of day indices to pre-select
- `onSelectionChange`: Callback when selection changes
- `updateUrl`: Whether to sync selection with URL (default: true)

---

### Auth-Aware Wrapper: `app/src/islands/shared/AuthAwareSearchScheduleSelector.jsx`

**Purpose**: Wraps `SearchScheduleSelector` with user data auto-load/save functionality

**Key Features**:
- For logged-in users: Loads saved days from DB, saves changes on selection
- For logged-out users: Falls back to URL params or default Mon-Fri
- Debounced save (1000ms default) to avoid excessive DB writes

**Load Logic** (lines 137-212):
```javascript
const loadUserDays = async () => {
  const sessionId = getSessionId();

  // URL parameter takes priority over DB
  const urlParams = new URLSearchParams(window.location.search);
  const daysFromUrl = urlParams.get('days-selected');
  if (daysFromUrl) {
    // Don't set userDays - let SearchScheduleSelector read from URL
    return;
  }

  if (!sessionId) return;  // Not logged in

  // Fetch from database
  const { data } = await supabase
    .from('user')
    .select('"Recent Days Selected"')
    .eq('_id', sessionId)
    .maybeSingle();

  const recentDays = data?.['Recent Days Selected'];
  if (recentDays) {
    const indices = dayNamesToIndices(recentDays);  // Convert names to indices
    setUserDays(indices);
  }
};
```

**Save Logic** (lines 218-249):
```javascript
const saveUserDays = (dayIndices) => {
  if (!userId) return;

  // Debounced save
  setTimeout(async () => {
    const dayNames = indicesToDayNames(dayIndices);
    await supabase
      .from('user')
      .update({ 'Recent Days Selected': dayNames })
      .eq('_id', userId);
  }, debounceMs);
};
```

**Data Format Conversion**:
- **DB Storage**: Day names as strings: `["Monday", "Tuesday", "Wednesday"]`
- **Component Use**: 0-based indices: `[1, 2, 3]` (1=Monday, 2=Tuesday, 3=Wednesday)
- Utility functions: `dayNamesToIndices()` and `indicesToDayNames()` handle conversion

---

## 3. Search Page Implementation

### File: `app/src/islands/pages/SearchPage.jsx`

**Schedule Selector Integration** (lines 543-574):
- `AuthAwareSearchScheduleSelector` is mounted at two points:
  - Desktop: `#schedule-selector-mount-point`
  - Mobile: `#schedule-selector-mount-point-mobile`
- Week pattern is passed as a prop for display purposes

**Selection Change Handling**:
```javascript
const selectorProps = {
  onSelectionChange: (days) => {
    const nightsCount = countSelectedNights(days);
    setSelectedNightsCount(nightsCount);
  },
  weekPattern: weekPattern
};
```

**URL State Management** (lines 341-349):
```javascript
const [selectedDaysForDisplay, setSelectedDaysForDisplay] = useState(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const daysParam = urlParams.get('days-selected');
  if (daysParam) {
    return daysParam.split(',').map(d => parseInt(d.trim(), 10))
      .filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }
  return [1, 2, 3, 4, 5]; // Default: Mon-Fri
});
```

---

## 4. Home Page (Index Page) Implementation

### File: `app/src/islands/pages/HomePage.jsx`

**Schedule Selector Integration** (lines 736-764):
- Uses base `SearchScheduleSelector` (NOT `AuthAwareSearchScheduleSelector`)
- Mounted at `#hero-schedule-selector` in the Hero section

**Explore Rentals Button** (lines 771-784):
```javascript
const handleExploreRentals = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const daysParam = urlParams.get('days-selected');

  if (daysParam) {
    window.location.href = `/search?days-selected=${daysParam}`;
  } else {
    window.location.href = '/search';
  }
};
```

**Gap Identified**: The Home Page does NOT use `AuthAwareSearchScheduleSelector`, so:
- Logged-in users don't see their saved schedule on the home page
- Changes on home page are passed via URL but not saved to DB

---

## 5. User Table Schema

### Field: `"Recent Days Selected"`

**Data Type**: JSONB array (text[])

**Format**: Array of day name strings
```json
["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
```

**Write Locations**:
1. `proposal/actions/create.ts` (line 618) - When proposal is created
2. `proposal/actions/create_suggested.ts` (line 784) - When suggested proposal is created
3. `AuthAwareSearchScheduleSelector.jsx` (line 237) - Real-time save on selection change
4. `AccountProfilePage` - When user updates profile

**Read Locations**:
1. `AuthAwareSearchScheduleSelector.jsx` (line 166) - Load on mount
2. `AccountProfilePage/useAccountProfilePageLogic.js` (line 594) - Profile form
3. `AccountProfilePage/components/PublicView.jsx` (line 46) - Public profile display

---

## 6. Key File Paths and Line Numbers

| Component | File Path | Key Lines |
|-----------|-----------|-----------|
| Proposal Create (saves schedule) | `supabase/functions/proposal/actions/create.ts` | 616-620 |
| SearchScheduleSelector | `app/src/islands/shared/SearchScheduleSelector.jsx` | 276-302, 327-336 |
| AuthAwareSearchScheduleSelector | `app/src/islands/shared/AuthAwareSearchScheduleSelector.jsx` | 137-212, 218-249 |
| Search Page | `app/src/islands/pages/SearchPage.jsx` | 341-349, 543-574 |
| Home Page | `app/src/islands/pages/HomePage.jsx` | 736-764, 771-784 |
| Account Profile Logic | `app/src/islands/pages/AccountProfilePage/useAccountProfilePageLogic.js` | 594, 1149, 1248 |

---

## 7. Current Behavior Summary

### Logged-In Users:
1. **Search Page**: Loads `"Recent Days Selected"` from user table, displays in selector, saves changes in real-time (debounced)
2. **Home Page**: Does NOT load from DB, uses URL param or default Mon-Fri
3. **Proposal Creation**: Saves selected days to user table after proposal submit
4. **Account Profile**: Can view and edit saved schedule

### Logged-Out Users:
1. **Search Page**: Uses URL parameter or default Mon-Fri
2. **Home Page**: Uses URL parameter or default Mon-Fri
3. **Proposal Creation**: N/A (must be logged in)

---

## 8. Potential Improvements/Gaps

1. **Home Page**: Should use `AuthAwareSearchScheduleSelector` to show logged-in user's saved schedule

2. **Consistency**: The `AuthAwareSearchScheduleSelector` stores days as **names** (strings), but the proposal creation stores them as **indices** (numbers). This could cause data inconsistency.

3. **URL Priority**: Currently URL params override DB values. This is intentional for navigation (e.g., from WhySplitLeasePage), but could be confusing if user expects their saved schedule to appear.

4. **Real-time Sync**: The `AuthAwareSearchScheduleSelector` saves on every selection change (debounced). Consider if this is the desired UX vs. only saving when navigating away or submitting.

---

## 9. Recommendations for Feature Implementation

If the goal is to ensure user's last selected schedule persists:

1. **Replace** `SearchScheduleSelector` with `AuthAwareSearchScheduleSelector` on HomePage
2. **Standardize** data format (use indices consistently, convert at boundaries)
3. **Consider** URL param behavior - should saved preference take priority or URL?
4. **Add** visual indicator when schedule is loaded from saved preferences

---

## References

- `c:\Users\Split Lease\Documents\Split Lease\supabase\functions\proposal\actions\create.ts`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\shared\SearchScheduleSelector.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\shared\AuthAwareSearchScheduleSelector.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\SearchPage.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\HomePage.jsx`
- `c:\Users\Split Lease\Documents\Split Lease\app\src\islands\pages\AccountProfilePage\useAccountProfilePageLogic.js`
