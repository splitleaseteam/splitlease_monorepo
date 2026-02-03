# Guest Leases Page - Hybrid Charles/Paula Design Implementation

**Design Source:** `hybrid-charles-paula.html`
**Scope:** Guest Leases page redesign (Header/Footer untouched)
**Complexity:** High - Multiple components, new design tokens, new sections

---

## Design Overview

The hybrid design combines:
- **Charles Eames (Top Elements):** Clean minimal hero, celebration banner, status summary
- **Paula Scher (Card Body):** Detailed sections with icons, progressive disclosure, tables

### New Elements to Add
1. **Hero Section** - Big date display with greeting and countdown
2. **Celebration Banner** - Contextual notifications (next stay, etc.)
3. **Status Summary** - Quick badges (payments current, documents signed)
4. **Redesigned Cards** - Paula-style with sectioned body

---

## Phase 1: CSS Foundation (Simplification)

### 1.1 Create Design Tokens File
**File:** `app/src/styles/design-tokens.css`

Extract all CSS variables from design file into a shared tokens file:
- Primary/secondary colors
- Text colors
- Background colors
- Border colors
- Spacing scale
- Typography scale
- Border radius
- Shadows
- Transitions

### 1.2 Simplify Existing CSS

**Files to update:**
- `app/src/styles/components/guest-leases.css` → Page layout + hero + status summary
- `app/src/islands/pages/guest-leases/LeaseCard.css` → Paula-style cards
- `app/src/islands/pages/guest-leases/StaysTable.css` → Table format
- `app/src/islands/pages/guest-leases/PaymentRecordsTable.css` → Progressive disclosure
- `app/src/islands/pages/guest-leases/DateChangeRequestsTable.css` → Card-style layout

**Approach:**
1. Replace hardcoded values with CSS variables
2. Remove duplicate button styles (consolidate to guest-leases.css)
3. Match design file class naming conventions

---

## Phase 2: Page Layout Components

### 2.1 Add Hero Section Component
**File:** `app/src/islands/pages/guest-leases/HeroSection.jsx` (NEW)

```jsx
// Props: user, nextStay, leases
// Displays:
// - Greeting with host name (time-of-day aware)
// - Big date for next stay
// - Countdown text
// - "View stay details" action link
```

**CSS:** Add `.hero`, `.hero-greeting`, `.hero-date`, `.hero-context`, `.hero-action` to guest-leases.css

### 2.2 Add Celebration Banner Component
**File:** `app/src/islands/pages/guest-leases/CelebrationBanner.jsx` (NEW)

```jsx
// Props: message, title, onDismiss
// Shows contextual alerts like "Your stay begins tomorrow!"
// Dismissible with X button
```

**CSS:** Add `.celebration-banner`, `.celebration-icon`, `.celebration-content`, etc.

### 2.3 Add Status Summary Component
**File:** `app/src/islands/pages/guest-leases/StatusSummary.jsx` (NEW)

```jsx
// Props: leases, paymentStatus
// Shows badge-style items:
// - "Payments current" (green if all paid)
// - "Documents signed" (green if all signed)
```

**CSS:** Add `.status-summary`, `.status-item`, `.status-item--success`

---

## Phase 3: LeaseCard Redesign

### 3.1 Update Card Header
**Current:** Simple header with image, title, status
**New:** Add hover effects, property thumbnail with border highlight

**Changes to LeaseCard.jsx:**
- Update header structure for card-left/card-right layout
- Add expand/collapse icon animation
- Add status badge with border

### 3.2 Update Card Body Sections
**Current:** Simple sections with titles
**New:** Paula-style sections with icons, better spacing

**Section changes:**
1. **Host Contact** - Add avatar, phone/email links with icons
2. **Agreement** - Add agreement number, signed status, document buttons
3. **Payments** - Progressive disclosure (summary → expandable table)
4. **Stays** - Table format with actions
5. **Date Change Requests** - Card-style with grid layout
6. **Action Footer** - Message Host + Request Date Change buttons

### 3.3 LeaseCard.css Updates
- Replace `.lease-card__*` with design token values
- Add `.card-section`, `.section-title`, `.section-icon`
- Add `.host-card`, `.host-avatar`, `.contact-links`
- Add `.card-actions` footer styling

---

## Phase 4: Sub-component Redesign

### 4.1 StaysTable.jsx
**Current:** Row-based card layout
**New:** Actual table with columns (Check-in, Check-out, Duration, Actions)

**Changes:**
- Convert to `<table>` structure
- Add column headers
- Add "View all X stays" link
- Update button styles

### 4.2 PaymentRecordsTable.jsx
**Current:** Table/card hybrid
**New:** Progressive disclosure with summary bar

**Changes:**
- Add collapsible summary showing count + next payment
- Table expands on click
- Add receipt download buttons with icons

### 4.3 DateChangeRequestsTable.jsx
**Current:** Card list
**New:** Grid-based cards with left border accent

**Changes:**
- Add `.dct-card.pending` with left border
- Grid layout for request details
- Better action button placement

---

## Phase 5: GuestLeasesPage.jsx Integration

### 5.1 Update Page Structure
```jsx
<main>
  <CelebrationBanner ... />        {/* NEW */}
  <HeroSection ... />              {/* NEW */}
  <StatusSummary ... />            {/* NEW */}

  <section>
    <h2 className="section-header">Active Leases</h2>
    <div className="lease-list">
      {leases.map(lease => <LeaseCard ... />)}
    </div>
  </section>

  {/* Optional: Past Leases Section */}
  <section className="past-leases-section">
    ...
  </section>
</main>
```

### 5.2 Update useGuestLeasesPageLogic.js
Add computed values for:
- `nextStay` - Next upcoming stay across all leases
- `paymentStatus` - Are all payments current?
- `documentsStatus` - Are all documents signed?
- `celebrationMessage` - Dynamic banner message

---

## Implementation Order

| Step | Task | Files | Est. Lines |
|------|------|-------|------------|
| 1 | Create design tokens file | `design-tokens.css` | +150 |
| 2 | Update guest-leases.css with page layout | `guest-leases.css` | +200, -50 |
| 3 | Create HeroSection component | `HeroSection.jsx` | +80 |
| 4 | Create CelebrationBanner component | `CelebrationBanner.jsx` | +50 |
| 5 | Create StatusSummary component | `StatusSummary.jsx` | +40 |
| 6 | Redesign LeaseCard header/body | `LeaseCard.jsx`, `LeaseCard.css` | +150, -80 |
| 7 | Redesign StaysTable | `StaysTable.jsx`, `StaysTable.css` | +60, -40 |
| 8 | Redesign PaymentRecordsTable | `PaymentRecordsTable.jsx`, `PaymentRecordsTable.css` | +80, -30 |
| 9 | Redesign DateChangeRequestsTable | `DateChangeRequestsTable.jsx`, `DateChangeRequestsTable.css` | +40, -20 |
| 10 | Update GuestLeasesPage.jsx | `GuestLeasesPage.jsx` | +30, -10 |
| 11 | Update useGuestLeasesPageLogic.js | `useGuestLeasesPageLogic.js` | +50 |

---

## Files Summary

### New Files (4)
- `app/src/styles/design-tokens.css`
- `app/src/islands/pages/guest-leases/HeroSection.jsx`
- `app/src/islands/pages/guest-leases/CelebrationBanner.jsx`
- `app/src/islands/pages/guest-leases/StatusSummary.jsx`

### Modified Files (9)
- `app/src/styles/components/guest-leases.css`
- `app/src/islands/pages/GuestLeasesPage.jsx`
- `app/src/islands/pages/guest-leases/useGuestLeasesPageLogic.js`
- `app/src/islands/pages/guest-leases/LeaseCard.jsx`
- `app/src/islands/pages/guest-leases/LeaseCard.css`
- `app/src/islands/pages/guest-leases/StaysTable.jsx`
- `app/src/islands/pages/guest-leases/StaysTable.css`
- `app/src/islands/pages/guest-leases/PaymentRecordsTable.jsx`
- `app/src/islands/pages/guest-leases/PaymentRecordsTable.css`
- `app/src/islands/pages/guest-leases/DateChangeRequestsTable.jsx`
- `app/src/islands/pages/guest-leases/DateChangeRequestsTable.css`

### Untouched (per requirement)
- Header component
- Footer component

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Large CSS refactor may break other pages | Design tokens isolated to guest-leases scope first |
| Mock data may not have all required fields | Update mock data structure in dev mode |
| Progressive disclosure UX complexity | Keep existing behavior as fallback |

---

## Recommended Execution Strategy

**Option A: Incremental (Safer)**
1. Phase 1 first (CSS foundation)
2. Test with dev mode
3. Phase 2-3 (page layout + cards)
4. Test again
5. Phase 4-5 (sub-components + integration)

**Option B: Full Implementation**
1. All phases in sequence
2. Single large test at end

**Recommendation:** Option A - allows visual validation at each step

---

## Questions Before Execution

1. Should the design tokens be global (shared) or scoped to guest-leases?
2. Keep FlexibilityScore component as-is or include in redesign?
3. Past Leases section - implement now or defer?
4. Celebration banner - what conditions trigger it? (hardcode for now?)
