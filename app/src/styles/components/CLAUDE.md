# Component Styles - LLM Reference

**PARENT**: app/src/styles/
**SCOPE**: 31 component CSS files -- see `ls styles/components/` for inventory.

---

## NAMING_CONVENTIONS

- **File names**: kebab-case matching component or feature name (e.g., `guest-proposals.css` for GuestProposalsPage)
- **Class names**: kebab-case, component-prefixed (e.g., `.listing-card`, `.modal-overlay`)
- **Modifiers**: State classes like `.active`, `.selected`, `.disabled`, `.error`, `.hidden`

---

## USAGE_PATTERN

### Import in Components
```jsx
// Option 1: Import directly in component file
import './Header.css'

// Option 2: Imported via main.css (for shared components)
// Most component styles are imported in src/styles/main.css
```

### CSS Scoping
```css
/* Prefix classes with component name to avoid conflicts */
.listing-card { /* base styles */ }
.listing-card__image { /* child element */ }
.listing-card__title { /* child element */ }
.listing-card--featured { /* modifier */ }
.listing-card.selected { /* state */ }
```

---

## CSS_VARIABLES_USAGE

```css
.my-component {
  /* Colors */
  background: var(--primary-purple);
  color: var(--text-dark);
  border: 1px solid var(--border-color);

  /* Spacing */
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  gap: var(--gap-md);

  /* Typography */
  font-family: var(--font-inter);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);

  /* Border & Shadow */
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-md);

  /* Transitions */
  transition: all var(--transition-base) var(--easing-ease-in-out);
}
```

---

## CRITICAL_PATTERNS

- **Fixed header**: `position: fixed; top: 0; z-index: 9999`
- **Header clearance**: Pages add `padding-top` (~80-100px) to account for fixed header
- **Modal overlay**: Always `z-index: 10000` to appear above header
- **Toast position**: Fixed top-right, z-index above content
- **Mobile menu**: Transforms off-screen, slides in on toggle

### Modal Z-Index Structure

Base modal styles live in `modal.css`. Modal-specific files extend it:
- `ai-import-assistant-modal.css`
- `create-listing-modal.css`
- `import-listing-modal.css`
- Contact Host and AI Signup modals are inline in `main.css`

All modals use `z-index: 10000` (var(--z-modal)) for overlay.

---

## RESPONSIVE_BREAKPOINTS

Desktop-first in some components, mobile-first in others:

```css
@media (max-width: 768px) {
  .component { /* Tablet/Mobile adjustments */ }
}

@media (max-width: 480px) {
  .component { /* Small mobile adjustments */ }
}
```

Common adjustments: grid columns reduce (4 -> 2 -> 1), reduced spacing, hamburger nav, full-width modals on mobile.

