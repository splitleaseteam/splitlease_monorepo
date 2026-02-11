# Listing Dashboard Phase 1 Audit (Orient)

Scope audited:
- `app/src/islands/pages/ListingDashboardPage/` (all components, hooks, context, page shell)
- `app/src/styles/components/listing-dashboard.css`

Method:
- Static code audit only (no runtime instrumentation)
- Accessibility and edge-case behavior inferred from render paths and handler logic
- CSS "unused" counts are best-effort static estimates from selector-to-class usage matching in this feature

## 1) Accessibility Score Card

Legend: Pass / Warn / Fail. Severity is per issue: Critical / Major / Minor.

| Component | Rating | Findings (with severity) |
|---|---|---|
| `components/NavigationHeader.jsx` | Warn | Tab UI is built with buttons but lacks tab semantics (`tablist`/`tab`/`aria-selected`), reducing SR context (Major) at `app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx:75`. |
| `components/ActionCardGrid.jsx` | Warn | Cards are keyboard-clickable, but count-based hiding removes discoverability and SR awareness for 0-state actions (Minor) at `app/src/islands/pages/ListingDashboardPage/components/ActionCardGrid.jsx:118`. |
| `components/ActionCard.jsx` | Pass | Native button semantics and clear visible text label. |
| `components/AlertBanner.jsx` | Pass | Banner is a semantic button with readable text and no icon-only controls. |
| `components/SecondaryActions.jsx` | Fail | "Choose a Section" dropdown lacks `aria-expanded`, `aria-controls`, and menu role semantics (Major) at `app/src/islands/pages/ListingDashboardPage/components/SecondaryActions.jsx:99`; keyboard behavior is limited (no Escape/arrow navigation) and outside-close is mouse-only listener (Major) at `app/src/islands/pages/ListingDashboardPage/components/SecondaryActions.jsx:82`. |
| `components/PropertyInfoSection.jsx` | Warn | Mostly semantic, but date formatting can emit unclear output for invalid values (Minor) at `app/src/islands/pages/ListingDashboardPage/components/PropertyInfoSection.jsx:111`. |
| `components/DescriptionSection.jsx` | Warn | Section heading structure is readable, but class mismatch can remove expected visual affordances and hierarchy styling (Major) at `app/src/islands/pages/ListingDashboardPage/components/DescriptionSection.jsx:7` and `app/src/styles/components/listing-dashboard.css:989`. |
| `components/AmenitiesSection.jsx` | Pass | Edit and empty-state actions are keyboard accessible; icon `img` has `alt`. |
| `components/DetailsSection.jsx` | Pass | Static content + semantic action button; no keyboard traps. |
| `components/RulesSection.jsx` | Warn | Functional semantics are acceptable, but missing style hook for icon image class may impair visual consistency and perceived affordance (Minor) at `app/src/islands/pages/ListingDashboardPage/components/RulesSection.jsx:19`. |
| `components/PricingSection.jsx` | Warn | Interaction points are native buttons; no direct SR blockers in this component. Risk inherits from modal opened by edit action. |
| `components/NightlyPricingLegend.jsx` | Pass | Read-only textual values are SR-readable. |
| `components/AvailabilitySection.jsx` | Warn | Calendar cells use `div role="button"` without `aria-pressed`/`aria-selected` state announcement (Major) at `app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:496`; labels for form controls are present but not always explicitly associated with IDs (Minor). |
| `components/PhotosSection.jsx` | Fail | Drag-and-drop reorder is mouse-centric with no keyboard alternative (Major) at `app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx:196`; icon-only action buttons rely on `title` instead of explicit `aria-label` (Major) at `app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx:238`. |
| `components/CancellationPolicySection.jsx` | Warn | Core controls are keyboard accessible; select lacks an explicit visible `<label>` association (Minor) at `app/src/islands/pages/ListingDashboardPage/components/CancellationPolicySection.jsx:83`. |
| `components/PricingEditSection.jsx` | Fail | Full-screen modal lacks explicit dialog semantics (`role="dialog"`, `aria-modal`) and visible focus-management logic in this file (Major) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:63`; confirm modal close relies on pointer backdrop interaction with no Escape handler (Major) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:533`. |
| `components/PricingEditSection/LeaseStyleSelector.jsx` | Warn | Card selection uses `div role="button"` rather than native controls; keyboard support exists but SR pattern is weaker than radio-group semantics (Minor) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/LeaseStyleSelector.jsx:33`. |
| `components/PricingEditSection/NightlyPricingForm.jsx` | Warn | Several inline helper buttons are accessible, but no explicit `type="button"` on non-submit buttons in form-like areas can become fragile (Minor) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/NightlyPricingForm.jsx:26`. |
| `components/PricingEditSection/WeeklyPricingForm.jsx` | Warn | Similar non-explicit button type risk in helper controls (Minor) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/WeeklyPricingForm.jsx:40`. |
| `components/PricingEditSection/MonthlyPricingForm.jsx` | Warn | Similar helper button type risk; otherwise reasonable labels/checkbox text (Minor) at `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/MonthlyPricingForm.jsx:52`. |
| `components/CalendarGrid.jsx` (currently unused) | Warn | Better than inline calendar (month nav buttons include aria-labels), but still uses `div role="button"` cells without selected-state ARIA (Minor) at `app/src/islands/pages/ListingDashboardPage/components/CalendarGrid.jsx:63`. |
| `components/BlockedDateList.jsx` (currently unused) | Pass | Remove buttons include explicit `aria-label` with date context at `app/src/islands/pages/ListingDashboardPage/components/BlockedDateList.jsx:44`. |

Accessibility notes requested:
- "Choose a Section" dropdown: currently not fully accessible (missing expanded/controls/menu semantics + limited keyboard support) at `app/src/islands/pages/ListingDashboardPage/components/SecondaryActions.jsx:99`.
- Photo drag/drop keyboard support: not provided; no keyboard reorder command path in `app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx:196`.
- Focus management for open/close modals: no explicit focus trap/return-focus logic in `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:63`.
- Section structure for SR: most sections do include heading tags (`h2`), but landmark semantics (`section`, `nav`, `aria-labelledby`) are inconsistent.

Color contrast findings (from CSS variables and applied combinations):
- Pass: `--ld-text-primary` `#1c274c` on white ~= 14.54:1.
- Pass: white text on `--ld-accent-purple` `#6b4fbb` ~= 6.07:1.
- Warn: muted text `#6b7280` on light gray `#f3f4f6` ~= 4.39:1 (below 4.5 for normal text), used in past blocked date style at `app/src/styles/components/listing-dashboard.css:1657`.
- Warn: red text `#dc2626` on light red `#fee2e2` ~= 3.95:1 for small text chips at `app/src/styles/components/listing-dashboard.css:1569`.

## 2) Performance Hot Spots (Ranked)

1. **Critical - Pricing save call contract mismatch (functional + perf impact)**
   - `ListingDashboardPage` calls `updateListing(listing.id, updates)` but hook signature accepts one argument (`updates`), likely sending malformed payloads and forcing retries/failed saves.
   - Refs: `app/src/islands/pages/ListingDashboardPage/ListingDashboardPage.jsx:198`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:484`.

2. **Major - AvailabilitySection render hot path (545 lines, high recompute volume)**
   - `getCalendarDays()` recomputes every render and multiple list derivations (`blockedDates` filtering/sorting) run frequently as local state changes.
   - Refs: `app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:88`, `app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:230`, `app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:241`.

3. **Major - Context-wide rerender fanout**
   - `ListingDashboardProvider` returns the full logic object as context value; any state update can rerender all consumers even if they use only a subset.
   - Ref: `app/src/islands/pages/ListingDashboardPage/context/ListingDashboardContext.jsx:7`.

4. **Major - Heavy initial fetch orchestration in `useListingData`**
   - Initial load performs listing fetch + lookup table fetch + 4 count queries + cohost query.
   - Lookup table internals are sequential (`await` chain), increasing time-to-interactive.
   - Refs: `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:83`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:39`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:50`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:61`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:74`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:85`.

5. **Major - AI import workflow is long and sequential**
   - Many awaited steps run one-after-another (amenities, neighborhood, rules, safety, description, title) with repeated writes.
   - Ref: `app/src/islands/pages/ListingDashboardPage/hooks/useAIImportAssistant.js:127` onward.

6. **Minor - Drag-over rerender churn in photos**
   - `onDragOver` updates state per hover transition and can churn during drag sessions.
   - Ref: `app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx:108`.

7. **Minor - Unused components/hooks still add maintenance overhead**
   - `CalendarGrid.jsx`, `BlockedDateList.jsx`, and `PricingEditSection/usePricingLogic.js` duplicate patterns not used by main render path.

## 3) Edge Case Matrix

| Component / Flow | Edge Case | Current Behavior | Severity |
|---|---|---|---|
| `hooks/useListingData.js` transform | 6-night pricing source | 6-night and 6x weekly compensation are derived from 5-night rate (`nightly_rate_for_5_night_stay`) instead of 6-night column | Critical (`app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:292`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:302`) |
| `ListingDashboardPage.jsx` + `useListingData.js` | Pricing inline save path | Save call passes wrong args shape; updates likely fail or map incorrectly | Critical (`app/src/islands/pages/ListingDashboardPage/ListingDashboardPage.jsx:198`, `app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:484`) |
| `useListingDashboardPageLogic.js` | Availability field mapping | Potentially invalid DB column names (`NEW Date...`, leading space in `' First Available'`) can fail saves | Major (`app/src/islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js:321`) |
| `components/PropertyInfoSection.jsx` | Partial/null listing location shape | Direct access like `listing.location.address` can throw if backend payload shape deviates | Major (`app/src/islands/pages/ListingDashboardPage/components/PropertyInfoSection.jsx:145`) |
| `components/PropertyInfoSection.jsx` | Invalid date value | `formatDate()` has no guard; can render `Invalid Date` | Minor (`app/src/islands/pages/ListingDashboardPage/components/PropertyInfoSection.jsx:111`) |
| `components/NavigationHeader.jsx` | `counts` are zero | Proposals/meetings/leases tabs hidden entirely; feature entry points disappear | Minor (`app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx:149`) |
| `components/ActionCardGrid.jsx` | `counts` are zero | Cards hidden entirely, reducing discoverability of these destinations | Minor (`app/src/islands/pages/ListingDashboardPage/components/ActionCardGrid.jsx:118`) |
| `useListingDashboardPageLogic.js` cancellation save | API failure during policy save | Errors are logged but no consistent user-facing feedback in catch | Major (`app/src/islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js:169`) |
| `useListingDashboardPageLogic.js` blocked date save | API failure during blocked date save | Errors are logged only; UI may look saved while persistence failed | Major (`app/src/islands/pages/ListingDashboardPage/useListingDashboardPageLogic.js:373`) |
| `components/AvailabilitySection.jsx` | Listing data refresh after local mount | Local `blockedDates` is initialized once and not resynced on later listing refreshes | Minor (`app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:68`) |
| `components/PhotosSection.jsx` | Empty photo list | Graceful empty state with CTA to add first photo | Pass (`app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx:275`) |
| `ListingDashboardPage.jsx` | Missing listing / fetch errors | Dedicated loading/error/not-found views are present | Pass (`app/src/islands/pages/ListingDashboardPage/ListingDashboardPage.jsx:69`) |

## 4) Duplicate Code Inventory

### Inline SVG icons duplicated across files

- Total inline icon component declarations found: **41** (unique names: 33)
- Duplicate icon names: **7**

Repeated examples:
- `FileTextIcon`: `app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx:43`, `app/src/islands/pages/ListingDashboardPage/components/ActionCardGrid.jsx:39`
- `CalendarIcon`: `app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx:63`, `app/src/islands/pages/ListingDashboardPage/components/ActionCardGrid.jsx:59`
- `FileCheckIcon`: `app/src/islands/pages/ListingDashboardPage/components/NavigationHeader.jsx:82`, `app/src/islands/pages/ListingDashboardPage/components/ActionCardGrid.jsx:78`
- `ChevronLeftIcon` and calendar rendering patterns duplicated between `AvailabilitySection` and unused `CalendarGrid`.

### Repeated logic/patterns

- Calendar + blocked-date rendering logic appears twice:
  - inline in `app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:357`
  - extracted in unused `app/src/islands/pages/ListingDashboardPage/components/CalendarGrid.jsx:25` and `app/src/islands/pages/ListingDashboardPage/components/BlockedDateList.jsx:20`
- Pricing logic duplicated by an unused hook:
  - live logic in `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx`
  - overlapping unused logic in `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:8`
- Weekly pattern constants duplicated:
  - `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:34`
  - `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/WeeklyPricingForm.jsx:3`

## 5) CSS Health Check (`listing-dashboard.css`)

### Key metrics (static audit)

- File size: **3,394 lines**
- Unique class selectors detected: **287**
- Likely unmatched selectors in this feature: **73** (~25.4%, best-effort static estimate)
- Selectors repeated in multiple blocks/media queries: **47** (some valid overrides, but raises maintenance complexity)

### High-impact issues

1. **Major - Undefined CSS variables referenced**
   - `var(--ld-border)` used but not defined in this file at `app/src/styles/components/listing-dashboard.css:938`.
   - `var(--ld-accent)` used but not defined in this file at `app/src/styles/components/listing-dashboard.css:1844`.

2. **Major - Class mismatch causes style miss**
   - JSX uses `listing-dashboard-descriptions` while CSS defines `listing-dashboard-description`.
   - Refs: `app/src/islands/pages/ListingDashboardPage/components/DescriptionSection.jsx:7`, `app/src/styles/components/listing-dashboard.css:989`.

3. **Major - Specificity/override smell (`!important`)**
   - `!important` used to force muted text color at `app/src/styles/components/listing-dashboard.css:1545`, indicating conflict pressure.

4. **Major - Responsive consistency risk**
   - Availability calendar minimum width forced at tablet+ (`min-width: 400px`) can stress narrower layouts at `app/src/styles/components/listing-dashboard.css:1668`.

5. **Minor - Spacing rhythm inconsistencies across section shells**
   - Divergent spacing rules between shared section shell and individual section blocks produce uneven gutters and visual rhythm.
   - Refs: `app/src/styles/components/listing-dashboard.css:521`, `app/src/styles/components/listing-dashboard.css:709`, `app/src/styles/components/listing-dashboard.css:882`.

### Representative likely-unused selectors

- Legacy nav/back + alert controls:
  - `app/src/styles/components/listing-dashboard.css:78` (`.listing-dashboard-nav__back`)
  - `app/src/styles/components/listing-dashboard.css:286` (`.listing-dashboard-alert__toggle`)
- Legacy pricing/rental card blocks not used by current pricing editor markup:
  - `app/src/styles/components/listing-dashboard.css:2689` (`.pricing-edit-save-bottom`)
  - `app/src/styles/components/listing-dashboard.css:2729` (`.pricing-edit-rental-card`)
- Legacy modal classes not used by current dashboard component tree:
  - `app/src/styles/components/listing-dashboard.css:2517` (`.modal-overlay`)

Note: some selectors can appear unused statically but are generated dynamically (for example nightly swatch modifiers in legend).

## Priority Risks For Phase 2 Enhancements

1. Fix save-path contract mismatches first (pricing and availability mappings) before adding deeper interactions.
2. Resolve accessibility blockers in dropdown, modal semantics/focus, and photo keyboard reordering.
3. Reduce render pressure in `AvailabilitySection` and context fanout to keep new interactive features responsive.
