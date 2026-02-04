# Schedule Persistence Across App

**Created**: 2026-02-04
**Updated**: 2026-02-04
**Status**: New
**Classification**: BUILD
**Approach**: Option A - Consolidate into single component

---

## Objective

Ensure the user's last selected schedule persists across the entire app. When a user selects days (either via proposal creation, search page, home page, or profile), that schedule should:
1. Be saved to the user table (`"Recent Days Selected"` field)
2. Be loaded as the default whenever the user lands on any page with a schedule selector
3. Serve as the new starting point if the user changes their selection

---

## Current State

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `SearchScheduleSelector` | Pure UI - click/drag, validation, URL sync | `app/src/islands/shared/SearchScheduleSelector.jsx` |
| `AuthAwareSearchScheduleSelector` | Wrapper adding DB persistence | `app/src/islands/shared/AuthAwareSearchScheduleSelector.jsx` |

### Usage Across App

| Page | Component | Has Persistence |
|------|-----------|-----------------|
| SearchPage | `AuthAwareSearchScheduleSelector` | ✅ Yes |
| HomePage | `SearchScheduleSelector` | ❌ No |
| WhySplitLeasePage | `SearchScheduleSelector` | ❌ No |
| AccountProfilePage | Form state (not component) | ✅ Yes (via form save) |

### Problem

- Only SearchPage persists schedule preferences
- HomePage and WhySplitLeasePage don't load/save user's schedule
- Two components create confusion about which to use

---

## Implementation Plan

### Phase 1: Add Persistence to Base Component

**File**: `app/src/islands/shared/SearchScheduleSelector.jsx`

Add an `enablePersistence` prop that:
- Defaults to `false` (backward compatible - existing usages unchanged)
- When `true` + user logged in:
  - Loads saved days from `user."Recent Days Selected"` on mount
  - Saves changes to DB with debounce (1000ms)
- When `true` + user logged out:
  - Falls back to URL params or default Mon-Fri

**Changes:**
1. Import `getSessionId` from auth and `supabase` client
2. Add `enablePersistence` prop (default: `false`)
3. Add state for `userId` and `isLoadingFromDB`
4. Add `useEffect` to load from DB when `enablePersistence=true`
5. Add debounced save function
6. Hook into selection change to trigger save
7. Show loading state while fetching from DB

**Code to merge from AuthAwareSearchScheduleSelector:**
- Day name ↔ index conversion utilities (lines 10-101)
- DB load logic (lines 137-212)
- DB save logic (lines 218-250)

### Phase 2: Update HomePage

**File**: `app/src/islands/pages/HomePage.jsx`

**Change:**
```jsx
// Before
<SearchScheduleSelector
  selectedDays={selectedDays}
  onDaysChange={setSelectedDays}
  isMobile={isMobile}
/>

// After
<SearchScheduleSelector
  enablePersistence={true}
  onSelectionChange={(days) => setSelectedDays(days.map(d => d.index))}
  isMobile={isMobile}
/>
```

### Phase 3: Update WhySplitLeasePage

**File**: `app/src/islands/pages/WhySplitLeasePage.jsx`

**Change:**
```jsx
// Add enablePersistence={true} to the component
<SearchScheduleSelector
  enablePersistence={true}
  ...otherProps
/>
```

### Phase 4: Update SearchPage

**File**: `app/src/islands/pages/SearchPage.jsx`

**Change:**
```jsx
// Before
import AuthAwareSearchScheduleSelector from '../shared/AuthAwareSearchScheduleSelector.jsx';
...
<AuthAwareSearchScheduleSelector ... />

// After
import SearchScheduleSelector from '../shared/SearchScheduleSelector.jsx';
...
<SearchScheduleSelector enablePersistence={true} ... />
```

### Phase 5: Deprecate AuthAwareSearchScheduleSelector

**File**: `app/src/islands/shared/AuthAwareSearchScheduleSelector.jsx`

1. Add deprecation comment at top of file
2. Update to simply pass through to base component with `enablePersistence={true}`
3. Keep for backward compatibility, but mark as deprecated

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/src/islands/shared/SearchScheduleSelector.jsx` | Add persistence logic with opt-in prop |
| `app/src/islands/pages/HomePage.jsx` | Add `enablePersistence={true}` |
| `app/src/islands/pages/WhySplitLeasePage.jsx` | Add `enablePersistence={true}` |
| `app/src/islands/pages/SearchPage.jsx` | Switch from wrapper to base component |
| `app/src/islands/shared/AuthAwareSearchScheduleSelector.jsx` | Deprecate, simplify to pass-through |

---

## Testing Checklist

### Manual Testing

- [ ] **SearchPage**: Still works exactly as before (no regression)
- [ ] **HomePage logged-in**: Loads saved schedule, saves changes
- [ ] **HomePage logged-out**: Uses URL params or default Mon-Fri
- [ ] **WhySplitLeasePage**: Loads and saves schedule
- [ ] **Create proposal**: Schedule saves to user table
- [ ] **Return to any page**: Saved schedule appears in selector

### Edge Cases

- [ ] First-time user with no saved schedule
- [ ] User with empty array saved in DB
- [ ] Transition from logged-out to logged-in on same page

---

## Rollback Plan

Since `enablePersistence` defaults to `false`, removing the prop from any page instantly reverts to previous behavior.

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Schedule selector | `app/src/islands/shared/SearchScheduleSelector.jsx` |
| Auth helper | `app/src/lib/auth.js` |
| Supabase client | `app/src/lib/supabase.js` |
| Proposal creation (saves schedule) | `supabase/functions/proposal/actions/create.ts` |
