# OpenCode Prompt: Implement AdminHeader Component

---

## Context

You are implementing a unified navigation header for 24 internal admin pages. A complete specification has been prepared at `docs/Done/ADMINHEADER_IMPLEMENTATION_SPEC.md` (23,500 words).

**Your mission**: Build the AdminHeader component exactly as specified. The spec is implementation-ready - all decisions have been made, all code snippets are provided.

---

## Instructions

### Phase 1: Read the Specification (15 min)

Read `docs/Done/ADMINHEADER_IMPLEMENTATION_SPEC.md` in full, paying special attention to:

1. **Navigation Configuration** (Section 2) - All 24 pages pre-defined
2. **Visual Specifications** (Section 3) - Exact Bubble dimensions/colors
3. **Component Architecture** (Section 1) - File structure and decisions
4. **Implementation Checklist** (Section 10) - Your roadmap

### Phase 2: Desktop Header Implementation (4 hours)

Build the desktop-only version first. Follow the checklist in Section 10, Phases 1-3:

**Files to create**:
```
app/src/islands/shared/AdminHeader/
├── AdminHeader.jsx              # Main component
├── AdminHeader.css              # All styles
├── components/
│   ├── DesktopHeader.jsx       # Desktop layout
│   ├── NavDropdown.jsx         # Dropdown menu
│   ├── NavLink.jsx             # Single link
│   └── UserSection.jsx         # User info
└── config/
    └── navigationConfig.js      # Copy from spec Section 2
```

**Build order**:
1. Copy `navigationConfig.js` from Section 2 (lines 20-200 in spec)
2. Create `DesktopHeader.jsx` with logo + nav dropdowns
3. Create `NavDropdown.jsx` with CSS hover behavior
4. Create `NavLink.jsx` with icon + text
5. Create `UserSection.jsx` with logged in/out states
6. Create `AdminHeader.css` with exact Bubble specs (Section 3)

**Critical requirements**:
- Use exact dimensions from spec (1440×60px header, 449px dropdown, etc.)
- Use exact colors (#0205D3 header, #FFFFFF text, etc.)
- Use CSS `:hover` for dropdowns (no React state)
- Import lucide-react icons from navigationConfig
- Fetch user data from `lib/auth.js` → `validateTokenAndFetchUser()`

### Phase 3: Integration & Testing (1 hour)

**Test the desktop header**:

1. Add to one internal page (e.g., `AdminThreadsPage`)
   ```jsx
   import AdminHeader from 'islands/shared/AdminHeader/AdminHeader';

   export default function AdminThreadsPage() {
     return (
       <div>
         <AdminHeader />
         {/* existing page content */}
       </div>
     );
   }
   ```

2. Verify in browser (http://localhost:8000/_internal/admin-threads):
   - Header appears with correct blue background
   - Logo displays
   - Two dropdowns: "Corporate Pages" (18 items), "Unit Tests" (6 items)
   - Dropdowns open on hover
   - All 24 links work
   - User section shows correctly (test both logged in/out)

3. Visual comparison:
   - Open Bubble screenshot from spec
   - Compare side-by-side
   - Fix any differences in dimensions/colors

### Phase 4: Mobile Header (Optional - 3 hours)

**Only proceed if desktop works perfectly.**

Follow checklist Phase 4-5 from spec to add:
- `MobileHeader.jsx` with hamburger menu
- `MobileMenu.jsx` with slide-out drawer
- `MobileDropdown.jsx` with accordion behavior
- Media queries at 992px breakpoint

### Phase 5: Accessibility (1 hour)

Add ARIA attributes per spec Section 9:
- `aria-haspopup`, `aria-expanded` on dropdowns
- `role="menu"`, `role="menuitem"` on dropdown items
- `aria-current="page"` on active links
- Keyboard navigation (Tab, Enter, Escape)

Test with keyboard only - all links must be accessible.

### Phase 6: Rollout to All Pages (1 hour)

Once AdminHeader works on one page, add to all 24 internal pages:

```bash
# Files to modify (add AdminHeader import + component):
app/src/islands/pages/AdminThreadsPage/components/AdminHeader.jsx  # Replace this
app/src/islands/pages/*/index.jsx  # 23 other internal pages
```

---

## Success Criteria

✅ Desktop header displays on all internal pages
✅ All 24 pages accessible via dropdowns
✅ Dropdowns open/close on hover
✅ Current page highlighted in dropdown
✅ User section shows correct state (logged in/out)
✅ Visual match to Bubble screenshot
✅ No console errors
✅ Keyboard navigation works
✅ (Optional) Mobile header works at <992px

---

## Important Notes

### Adherence to Spec
- **Do not deviate** from the spec without good reason
- All visual specs (colors, dimensions) are exact from Bubble
- All 24 pages are pre-defined in navigationConfig - use as-is

### Code Quality
- Follow project's Hollow Component Pattern (no logic in components)
- Use existing auth system (`lib/auth.js`)
- Use existing icon library (lucide-react)
- Match existing code style in `app/src/islands/shared/`

### What NOT to Do
- ❌ Don't add features not in spec (e.g., search, notifications)
- ❌ Don't change page organization (Corporate/Unit Tests split is deliberate)
- ❌ Don't skip accessibility (required)
- ❌ Don't implement mobile first (desktop is priority)

### If You Get Stuck
- Re-read the relevant section in the spec
- Check code snippets in Section 11
- Verify you're using exact CSS values from Section 3
- Test in Bubble URL to compare behavior

---

## Time Estimate

- **Desktop only**: 6-7 hours
- **Desktop + Mobile**: 10-12 hours
- **Full implementation + testing**: 12-15 hours

---

## Deliverables

When complete:

1. **Working AdminHeader** on all 24 internal pages
2. **Git commit** with message: `feat: add unified AdminHeader navigation to internal pages`
3. **Screenshot** of header on one page (for verification)
4. **Brief summary** (2-3 sentences) of any deviations from spec

---

## Begin Implementation

Start with Phase 1 (read spec), then Phase 2 (desktop header). Do NOT start coding until you've read the full spec.

**First step**: Read `docs/Done/ADMINHEADER_IMPLEMENTATION_SPEC.md` now.
