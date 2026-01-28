# Implementation Plan: Narrative UI for Mobile Proposals

**Created:** 2026-01-27
**Scope:** Mobile-only (≤640px), body section only, non-breaking change
**Risk Level:** Low — CSS-scoped, no logic changes, desktop unaffected

---

## Goal

Replace the structured card body (InfoGrid, DayPillsRow, PricingRow, etc.) with a **narrative paragraph display** on mobile devices. The collapsed header remains unchanged. Desktop and tablet continue using the current V7 design.

---

## Critical Constraints (DO NOT VIOLATE)

1. **NO changes to `useHostProposalsPageLogic.js`** — Zero business logic modifications
2. **NO changes to data fetching or normalization** — Use existing proposal fields
3. **Desktop unchanged** — All changes gated behind `@media (max-width: 640px)`
4. **Header unchanged** — Only the expanded body content changes
5. **Functional parity** — Actions (Accept/Modify/Decline) must remain accessible
6. **Accessibility maintained** — WCAG AA compliance preserved

---

## Design Reference

Based on mockup: `host-proposals-mockup-v3-narrative.html`

**Narrative Body Structure (mobile expanded):**
```
┌─────────────────────────────────────────────┐
│ NARRATIVE SECTION                           │
│                                             │
│ This proposal is for a 12-week stay, from   │
│ January 15 through April 9, 2026.           │
│                                             │
│ The schedule is Monday through Friday each  │
│ week — checking in Monday and out Friday.   │
│ That's 4 nights per week, with weekends     │
│ free.                                       │
│                                             │
│ At $165/night, this works out to $660 per   │
│ week — totaling $7,920 over the 12 weeks.   │
├─────────────────────────────────────────────┤
│ GUEST CONTEXT (compact)                     │
│ [Avatar] Emma is a management consultant    │
│          from Boston — ID verified, with    │
│          3 positive reviews.                │
│          View full profile →                │
├─────────────────────────────────────────────┤
│ ACTION ROW                                  │
│ $7,920 total    [Accept] [Modify] [Decline] │
└─────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Narrative Generator Utility

**File:** `app/src/islands/pages/HostProposalsPage/utils/generateNarrativeText.js`

Pure function that takes a proposal and returns narrative strings:

```javascript
/**
 * Generates narrative text for mobile proposal display
 * @param {Object} proposal - Normalized proposal object
 * @returns {Object} - { duration, schedule, pricing, guestContext }
 */
export function generateNarrativeText(proposal) {
  // Duration paragraph
  // Schedule paragraph
  // Pricing paragraph
  // Guest context sentence
}
```

**Data fields used:**
- `duration_weeks` — "12-week stay"
- `start_date`, `end_date` — "January 15 through April 9, 2026"
- `nights_selected` or `days_selected` — "Monday through Friday"
- `nights_per_week` — "4 nights per week"
- `nightly_rate` — "$165/night"
- `host_compensation` or `total_price` — "$7,920"
- `guest.full_name`, `guest.bio` — "Emma is a management consultant from Boston"
- `guest.id_verified`, `guest.work_verified` — "ID and work verified"
- `guest.review_count` — "with 3 positive reviews"

**Edge cases to handle:**
- Missing `guest.bio` → omit profession part
- Zero reviews → omit review text
- `days_selected` is full week (7 days) → "every day"
- `days_selected` is weekends only → "weekends only"
- Single week → "1-week stay" (not "1-weeks")

---

### Step 2: Create NarrativeProposalBody Component

**File:** `app/src/islands/pages/HostProposalsPage/NarrativeProposalBody.jsx`

**Props:**
```javascript
{
  proposal,        // Normalized proposal object
  onAccept,        // Accept handler from parent
  onModify,        // Modify handler from parent
  onDecline,       // Decline handler from parent
  onViewProfile,   // Optional: navigate to guest profile
}
```

**Structure:**
```jsx
<div className="hp7-narrative-body">
  {/* Narrative paragraphs */}
  <div className="hp7-narrative-content">
    <p className="hp7-narrative-paragraph">{durationText}</p>
    <p className="hp7-narrative-paragraph">{scheduleText}</p>
    <p className="hp7-narrative-paragraph">{pricingText}</p>
  </div>

  {/* Guest context - compact */}
  <div className="hp7-narrative-guest">
    <img src={guest.avatar} className="hp7-narrative-avatar" alt="" />
    <p className="hp7-narrative-guest-text">
      {guestContextText}
      <a href="#" onClick={onViewProfile}>View full profile</a>
    </p>
  </div>

  {/* Action row - reuse existing ActionButtonsRow or inline */}
  <div className="hp7-narrative-actions">
    <span className="hp7-narrative-total">${total}</span>
    <div className="hp7-narrative-buttons">
      <button onClick={onAccept}>Accept</button>
      <button onClick={onModify}>Modify</button>
      <button onClick={onDecline}>Decline</button>
    </div>
  </div>
</div>
```

---

### Step 3: Add CSS for Narrative Body

**File:** `app/src/islands/pages/HostProposalsPage/host-proposals-v7.css`

Add at END of file, inside a mobile media query:

```css
/* ============================================
   MOBILE NARRATIVE VIEW (≤640px only)
   ============================================ */
@media (max-width: 640px) {

  /* Hide structured body sections on mobile when narrative is active */
  .hp7-proposal-card.narrative-mode .hp7-info-grid,
  .hp7-proposal-card.narrative-mode .hp7-day-pills,
  .hp7-proposal-card.narrative-mode .hp7-pricing-row,
  .hp7-proposal-card.narrative-mode .hp7-guest-info-card,
  .hp7-proposal-card.narrative-mode .hp7-progress-tracker,
  .hp7-proposal-card.narrative-mode .hp7-ai-summary {
    display: none;
  }

  /* Narrative content container */
  .hp7-narrative-body {
    display: block;
  }

  .hp7-narrative-content {
    padding: 16px;
    border-bottom: 1px solid var(--border-light);
  }

  .hp7-narrative-paragraph {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .hp7-narrative-paragraph:last-child {
    margin-bottom: 0;
  }

  .hp7-narrative-paragraph strong {
    color: var(--color-text);
  }

  .hp7-narrative-paragraph .highlight-purple {
    color: var(--purple-dark);
  }

  .hp7-narrative-paragraph .highlight-money {
    color: var(--green-text);
  }

  /* Guest context row */
  .hp7-narrative-guest {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg);
    border-bottom: 1px solid var(--border-light);
  }

  .hp7-narrative-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .hp7-narrative-guest-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  /* Action row */
  .hp7-narrative-actions {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    background: var(--bg);
  }

  .hp7-narrative-total {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--green-text);
    text-align: center;
  }

  .hp7-narrative-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .hp7-narrative-buttons button {
    width: 100%;
    min-height: 48px; /* Touch target */
  }
}

/* Hide narrative body on desktop/tablet */
@media (min-width: 641px) {
  .hp7-narrative-body {
    display: none;
  }
}
```

---

### Step 4: Modify ProposalCardBody.jsx (Conditional Render)

**File:** `app/src/islands/pages/HostProposalsPage/ProposalCardBody.jsx`

**Current:** Renders InfoGrid, DayPillsRow, PricingRow, ActionButtonsRow, etc.

**Change:** Add conditional render for narrative on mobile:

```jsx
import { NarrativeProposalBody } from './NarrativeProposalBody';
import { useIsMobile } from '../../../hooks/useIsMobile'; // Or inline check

export function ProposalCardBody({ proposal, handlers, ...props }) {
  const isMobile = useIsMobile(640); // Check window width ≤ 640px

  if (isMobile) {
    return (
      <NarrativeProposalBody
        proposal={proposal}
        onAccept={() => handlers.onAccept(proposal)}
        onModify={() => handlers.onModify(proposal)}
        onDecline={() => handlers.onDecline(proposal)}
      />
    );
  }

  // Existing desktop/tablet body
  return (
    <div className="hp7-card-body-content">
      {/* Existing: StatusBanner, AISummaryCard, GuestInfoCard, InfoGrid, etc. */}
    </div>
  );
}
```

**Alternative (CSS-only, no JS change):**
Render BOTH components, use CSS to show/hide based on breakpoint:

```jsx
return (
  <div className="hp7-card-body-content">
    {/* Mobile narrative */}
    <NarrativeProposalBody proposal={proposal} handlers={handlers} />

    {/* Desktop/tablet structured */}
    <div className="hp7-structured-body">
      {/* Existing components */}
    </div>
  </div>
);
```

CSS handles visibility:
```css
@media (max-width: 640px) {
  .hp7-structured-body { display: none; }
  .hp7-narrative-body { display: block; }
}
@media (min-width: 641px) {
  .hp7-structured-body { display: block; }
  .hp7-narrative-body { display: none; }
}
```

**Recommendation:** CSS-only approach is safer (no JS breakpoint logic, no hydration mismatch risk).

---

### Step 5: Update CollapsibleProposalCard (Add Class)

**File:** `app/src/islands/pages/HostProposalsPage/CollapsibleProposalCard.jsx`

Add `narrative-mode` class when expanded (for CSS targeting):

```jsx
<article
  className={`hp7-proposal-card ${isExpanded ? 'expanded narrative-mode' : ''}`}
>
```

This allows CSS to conditionally hide structured sections when narrative is shown.

---

## Files Changed Summary

| File | Change Type | Risk |
|------|-------------|------|
| `utils/generateNarrativeText.js` | **NEW FILE** | None |
| `NarrativeProposalBody.jsx` | **NEW FILE** | None |
| `host-proposals-v7.css` | Add ~80 lines at end | Low |
| `ProposalCardBody.jsx` | Add conditional render | Low |
| `CollapsibleProposalCard.jsx` | Add CSS class | Very Low |

---

## Files NOT Changed (Critical)

- `useHostProposalsPageLogic.js` — No logic changes
- `index.jsx` — No state changes (expansion logic unchanged)
- `ProposalCardHeader.jsx` — Header unchanged
- All data fetching — Uses existing fields
- Desktop rendering — Completely unaffected

---

## Testing Checklist

### Mobile (≤640px)
- [ ] Collapsed card header looks identical to current
- [ ] Expanded card shows narrative paragraphs
- [ ] Guest context displays with avatar and profile link
- [ ] Accept/Modify/Decline buttons work
- [ ] Total earnings displayed prominently
- [ ] Touch targets ≥48px

### Desktop/Tablet (>640px)
- [ ] Card header unchanged
- [ ] Expanded body shows all existing sections (InfoGrid, DayPills, etc.)
- [ ] No visual changes whatsoever
- [ ] All actions work

### Edge Cases
- [ ] Proposal with no guest bio
- [ ] Proposal with 0 reviews
- [ ] Full-week schedule (7 days)
- [ ] Weekend-only schedule
- [ ] Single week duration
- [ ] Very long guest bio (truncation?)

### Accessibility
- [ ] Narrative text readable by screen reader
- [ ] Actions keyboard accessible
- [ ] Color contrast maintained
- [ ] Focus states visible

---

## Rollback Plan

If issues arise:
1. Remove `narrative-mode` class from `CollapsibleProposalCard.jsx`
2. Remove NarrativeProposalBody import/render from `ProposalCardBody.jsx`
3. CSS changes are harmless without the class/component

No database changes, no API changes, no state changes = easy rollback.

---

## Open Questions for User

1. **Should guest's personal message (comment/need_for_space) appear in narrative?**
   - Current mockup doesn't include it, but it could add personality

2. **Should the "View full profile" link go to a modal or a separate page?**
   - Need to know existing profile viewing behavior

3. **Should the AI Summary section be included in narrative mode?**
   - Currently hidden in mockup, but could be valuable context

4. **Any preference on animation for expand/collapse in narrative mode?**
   - Current: max-height transition
   - Could add fade-in for paragraphs
