# Pattern 5 (Fee Transparency) — Implementation Plan

## Goal
Implement the Fee Transparency pattern across Split Lease by integrating `PriceDisplay.jsx`, `FeeExplainer.jsx`, and `PaymentStep.jsx` with new `useFeeCalculation` and `useFeeVisibility` hooks, meeting WCAG 2.1 AA, mobile responsiveness, micro-animations, robust Storybook coverage (50+ scenarios), E2E tests, and updated documentation in `FRONTEND_GUIDE.md`.

## Context & Constraints
- Scope spans multiple files in `app/` plus tests and documentation.
- Follow islands architecture and hollow component patterns.
- Reuse pricing logic in `app/src/logic/calculators/pricing/` where possible.
- When adding informational `?` triggers, ensure the label text is clickable too.
- Use `framer-motion` for micro-animations (already in dependencies).

## Plan
1. **Baseline audit**: locate existing `PriceDisplay.jsx`, related fee UI, and any fee-calculation helpers; map current usage in proposal flows (e.g., `CreateProposalFlowV2` and proposal review/checkout steps).
2. **Hook design**: define `useFeeCalculation` and `useFeeVisibility` responsibilities, inputs, and outputs; align with pricing calculators and business rules (pure logic in `logic/` plus thin UI hooks in islands/shared).
3. **Implement hooks**: add the hooks in `app/src/islands/shared/` or appropriate hooks folder; wire to pricing calculators and configuration constants; include unit tests if a hooks test pattern exists.
4. **Integrate `PriceDisplay.jsx`**: update or build the component to consume the hooks, expose variants for listing cards, proposal review, and payment summaries; ensure semantic markup, readable labels, and keyboard support.
5. **Add `FeeExplainer.jsx`**: implement a disclosure/tooltip/accordion pattern with accessible focus management and clickable label + icon trigger; ensure content is driven by hook-provided data.
6. **Add `PaymentStep.jsx`**: integrate into the proposal/payment flow with fee transparency content, connect to `useFeeCalculation`/`useFeeVisibility`, and ensure it follows the hollow component pattern.
7. **Styling & responsiveness**: add/adjust component styles in `app/src/styles/components/` and mobile overrides in `app/src/styles/components/mobile.css` (or page CSS) to achieve responsive layout and consistent spacing/typography.
8. **Micro-animations**: add subtle transitions for expanding fee breakdowns, step focus, and totals updates with `framer-motion`; ensure reduced-motion respects user preferences.
9. **Accessibility checks**: verify WCAG 2.1 AA compliance (color contrast, focus indicators, ARIA labeling, keyboard navigation); update components where needed.
10. **Storybook coverage**: create 50+ story scenarios across components (default, compact, long-stay, short-stay, discounts, taxes/fees hidden, fee-free listing, loading/error/empty states, mobile layout variants, reduced-motion variants); verify controls and docs.
11. **E2E tests**: add end-to-end tests for fee transparency flows (toggle visibility, fee calculations, totals update) using the existing E2E framework; include mobile viewport coverage.
12. **Documentation**: update `FRONTEND_GUIDE.md` with usage examples, prop/API docs, hook usage, and accessibility notes for the Fee Transparency pattern.
13. **Validation**: run relevant lint/test commands and Storybook/E2E checks as appropriate; capture any regressions or blockers.

## Deliverables
- Updated components/hooks in `app/src/islands/shared/` (and any page integration points).
- Styling updates in `app/src/styles/components/` and mobile overrides.
- 50+ Storybook stories for the fee transparency components.
- E2E tests covering fee transparency behavior.
- Documentation updates in `FRONTEND_GUIDE.md`.
