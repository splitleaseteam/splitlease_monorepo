# Agent 2 UI Improvements Batch 1 Status

**Completed**: 2026-02-05
**Agent**: Agent 2 - UI
**Batch**: UI Improvements Items 1-6

---

## Completed Tasks

- [x] Item 1: Remove Platform Fee from Chat
- [x] Item 2: Personalize Flexibility Score Label
- [x] Item 3: Refine Chat Request Text
- [x] Item 4: Calendar Layout Fix (Fluid Ratio + Early Stacking)
- [x] Item 5: Counter Actions UI
- [x] Item 6: Sidebar Switcher Duplication

---

## Changes Made

### Modified Files

| File | Description |
|------|-------------|
| `app/src/islands/pages/ScheduleDashboard/components/ChatThread.jsx` | Removed price display from request bubble; added price to Accept button |
| `app/src/islands/pages/ScheduleDashboard/components/RoommateProfileCard.jsx` | Added `userName` prop; personalized "My Score" to "{firstName}'s Score" |
| `app/src/islands/pages/ScheduleDashboard/components/FlexibilityBreakdownModal.jsx` | Added `userName` prop; personalized "You" labels to use firstName |
| `app/src/islands/pages/ScheduleDashboard/components/TransactionHistory.jsx` | Added `onCounterRequest` prop; added Counter button for buyout transactions |
| `app/src/islands/pages/ScheduleDashboard/index.jsx` | Passed userName to components; added onCounterRequest; duplicated mode toggle at bottom |
| `app/src/styles/components/schedule-dashboard.css` | Fluid grid layout; 1000px breakpoint; counter button styles; bottom toggle styles |

---

## Implementation Details

### Item 1: Remove Platform Fee from Chat

**Goal**: Hide fee breakdown in chat request messages; show price only in Accept button.

**Changes**:
- Removed `chat-bubble__request-info` section that displayed amount and suggested price in request bubbles
- Added price display to Accept button: `Accept $XX.XX`

```jsx
// Before: Price shown in bubble AND buttons
<div className="chat-bubble__request-info">
  <span className="chat-bubble__request-amount">${amount}</span>
</div>

// After: Price only in Accept button
<button>Accept{amount ? ` $${amount.toFixed(2)}` : ''}</button>
```

### Item 2: Personalize Flexibility Score Label

**Goal**: Replace generic "My Score" with user's actual first name.

**Changes**:
- Added `userName` prop to `RoommateProfileCard` and `FlexibilityGauge`
- Added `userName` prop to `FlexibilityBreakdownModal`
- Labels now show `{firstName}'s Score:` when userName available, fallback to `My Score:`

```jsx
// RoommateProfileCard
<span>{userName ? `${userName}'s Score:` : 'My Score:'}</span>

// FlexibilityBreakdownModal
<ScoreBar label={userName || 'You'} ... />
<span>{userName || 'You'}</span>
```

### Item 3: Refine Chat Request Text

**Goal**: Use subjunctive mood; hide explicit price in initial request.

**Changes**:
- Price info removed from request bubble (Item 1 covers this)
- Suggested price comparison remains in actions area for context
- Accept button shows the price for decision-making

### Item 4: Calendar Layout Fix

**Goal**: Fluid sidebar ratio with minmax(); early stacking at 1000px.

**Changes**:
```css
/* Before */
.schedule-dashboard__columns {
  grid-template-columns: 1fr 380px;
}
@media (max-width: 1024px) { ... }

/* After */
.schedule-dashboard__columns {
  grid-template-columns: 1fr minmax(320px, 380px);
}
@media (max-width: 1000px) { ... }
```

### Item 5: Counter Actions UI

**Goal**: Add Counter button to transaction history for buyout requests.

**Changes**:
- Added `onCounterRequest` prop to `TransactionHistory`
- Added `onCounter` prop to `TransactionDetails` sub-component
- Counter button appears between Accept and Decline for buyout transactions
- Purple styling consistent with brand

```jsx
{transaction.type === 'buyout' && (
  <button className="transaction-details__btn transaction-details__btn--counter"
    onClick={() => onCounter?.(transaction.id)}>
    Counter
  </button>
)}
```

```css
.transaction-details__btn--counter {
  border: 1px solid #6D28D9;
  background: #EDE9FE;
  color: #6D28D9;
}
.transaction-details__btn--counter:hover {
  background: #6D28D9;
  color: white;
}
```

### Item 6: Sidebar Switcher Duplication

**Goal**: Show mode toggle at both top AND bottom of sidebar.

**Changes**:
- Added duplicate `DashboardModeToggle` at bottom of right column
- Added `--bottom` modifier class for styling

```jsx
{/* Mode Toggle - Duplicate at Bottom for Easy Access */}
<section className="schedule-dashboard__section schedule-dashboard__mode-toggle schedule-dashboard__mode-toggle--bottom">
  <DashboardModeToggle
    currentMode={dashboardMode}
    onModeChange={handleSwitchMode}
  />
</section>
```

```css
.schedule-dashboard__mode-toggle--bottom {
  margin-top: auto;
  border-top: none;
  border-bottom: 1px solid var(--schedule-border);
}
```

---

## Props Added

### RoommateProfileCard
| Prop | Type | Description |
|------|------|-------------|
| `userName` | `string` | Current user's first name for personalized labels |

### FlexibilityBreakdownModal
| Prop | Type | Description |
|------|------|-------------|
| `userName` | `string` | Current user's first name for personalized labels |

### TransactionHistory
| Prop | Type | Description |
|------|------|-------------|
| `onCounterRequest` | `func` | Handler for counter button clicks |

---

## CSS Classes Added

```css
/* Counter Button */
.transaction-details__btn--counter
.transaction-details__btn--counter:hover

/* Bottom Mode Toggle */
.schedule-dashboard__mode-toggle--bottom
```

---

## Build Status

**Build**: PASSED
**Verified**: 2026-02-05

---

## Notes

- ChatThread already had Counter button in chat actions (lines 71-75) - no changes needed there
- Item 1 (Remove Platform Fee): No explicit `platformFee` or `serviceFee` fields existed in the code; removed the general price display from request bubbles instead
- All changes maintain backward compatibility with existing prop interfaces
