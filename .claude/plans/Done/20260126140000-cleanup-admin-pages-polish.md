# Admin Pages Polish Cleanup Plan

**Created**: 2026-01-26
**Classification**: CLEANUP
**Scope**: 6 Admin Pages Polish - Visual Verification, Lint Fixes, CSS Extraction

---

## 1. Executive Summary

### What is being cleaned up and why

This cleanup addresses three categories of technical debt across 6 admin pages:

1. **Visual Verification**: Screenshot comparison between Bubble.io reference designs and React implementations to identify any visual discrepancies
2. **Lint Warnings**: Systematic resolution of ESLint warnings including unused imports, missing hook dependencies, and unescaped entities
3. **CSS Extraction**: Refactoring VerifyUsersPage from 550+ lines of inline JavaScript styles to an external CSS file, matching the pattern used by other admin pages

### Affected Pages

| Page | File Path | CSS Status | Lint Issues |
|------|-----------|------------|-------------|
| VerifyUsersPage | `app/src/islands/pages/VerifyUsersPage.jsx` | **INLINE (550+ lines)** | React import warning |
| ProposalManagePage | `app/src/islands/pages/ProposalManagePage/index.jsx` | External CSS | None in main file |
| ManageVirtualMeetingsPage | `app/src/islands/pages/ManageVirtualMeetingsPage/ManageVirtualMeetingsPage.jsx` | External CSS | None in main file |
| MessageCurationPage | `app/src/islands/pages/MessageCurationPage/MessageCurationPage.jsx` | External CSS | None in main file |
| CoHostRequestsPage | `app/src/islands/pages/CoHostRequestsPage/CoHostRequestsPage.jsx` | External CSS | None in main file |
| InternalEmergencyPage | `app/src/islands/pages/InternalEmergencyPage/InternalEmergencyPage.jsx` | External CSS | React import warning |

### Expected Outcomes

- Consistent CSS architecture across all admin pages (external CSS files)
- Zero ESLint warnings in affected pages
- Visual verification report documenting any discrepancies from Bubble.io reference designs
- Improved code maintainability and reduced cognitive load

---

## 2. Current State Analysis

### 2.1 VerifyUsersPage Analysis

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\VerifyUsersPage.jsx`

**Current Structure**:
- Lines 1-577: React component code (functional components, icons)
- Lines 579-1131: Inline styles object (`const styles = { ... }`)
- Lines 1113-1130: Dynamic stylesheet injection for keyframes and hover effects

**Style Categories Identified** (from inline styles object):
1. Container styles (`container`)
2. Header styles (`header`, `title`, `subtitle`)
3. Main content (`main`)
4. Footer styles (`footer`, `footerText`)
5. User select section (`userSelectContainer`, `sectionTitle`, `userSelectRow`, etc.)
6. Dropdown styles (`dropdownContainer`, `dropdownTrigger`, `dropdownList`, etc.)
7. Verification container (`verificationContainer`, `verificationTitle`, etc.)
8. Image card styles (`imageCardContainer`, `imageCard`, `imageCardOverlay`, etc.)
9. Toggle switch styles (`toggleContainer`, `toggleButton`, `toggleKnob`, etc.)
10. User summary (`userSummary`, `userSummaryItem`, `userSummaryLabel`)
11. State containers (`stateContainer`, `spinner`, `errorContainer`, `emptyContainer`)
12. Instructions section (`instructions`, `instructionsTitle`, `instructionsList`)
13. Modal styles (`modalOverlay`, `modalContent`, `modalHeader`, etc.)
14. Icon styles (`chevronIcon`, `userIcon`, `imagePlaceholderIcon`)

**Dynamic Styles**: Lines 1113-1130 inject a `<style>` element for:
- `@keyframes spin` animation
- Hover effects for `.image-card-with-image`

### 2.2 Other Admin Pages CSS Pattern

All other admin pages follow this consistent pattern:

```
PageComponent/
  index.jsx (or PageComponent.jsx)
  PageComponent.css
  usePageComponentLogic.js
  components/
    SubComponent.jsx
```

**CSS Naming Conventions** (from analysis):
- ProposalManagePage: `.pm-` prefix (e.g., `.pm-container`, `.pm-btn`)
- CoHostRequestsPage: Descriptive class names (e.g., `.cohost-requests-page`, `.request-card`)
- InternalEmergencyPage: BEM-like naming (e.g., `.emergency-card`, `.alert--success`)
- MessageCurationPage: BEM naming (e.g., `.message-curation-page`, `.thread-selector__item`)

### 2.3 Current Lint Warnings (Relevant to Scope)

From running `bun run lint`:

**In VerifyUsersPage.jsx** (lines 579-1131):
- No direct lint warnings in the page file itself
- The unused React import issue is in the entry point file

**InternalEmergencyPage.jsx**:
```
Line 13: import React from 'react';
Warning: 'React' is defined but never used
```

**CoHostRequestsPage** (Entry point):
```
Line 1: import React from 'react';
Warning: 'React' is defined but never used
```

**Related files outside direct scope** (informational only):
- Multiple `react/no-unescaped-entities` warnings in various pages (apostrophes)
- `react-hooks/exhaustive-deps` warnings in hook files

### 2.4 Bubble.io Reference URLs

| Page | Reference URL |
|------|---------------|
| Verify Users | https://app.split.lease/version-test/_verify-users |
| Proposal Management | https://app.split.lease/version-test/_proposal-manage |
| Virtual Meetings | https://app.split.lease/version-test/_manage-virtual-meetings |
| Message Curation | https://app.split.lease/version-test/_message-curation |
| Co-Host Requests | https://app.split.lease/version-test/_co-host-requests |
| Internal Emergency | https://app.split.lease/version-test/_internal-emergency |

---

## 3. Target State Definition

### 3.1 CSS Architecture Target

**VerifyUsersPage Target Structure**:
```
app/src/islands/pages/
  VerifyUsersPage.jsx              (component - no inline styles)
  VerifyUsersPage.css              (NEW - all styles extracted)
  useVerifyUsersPageLogic.js       (unchanged - already exists)
```

**CSS File Naming Convention**: `VerifyUsersPage.css`
**CSS Class Prefix**: `.verify-users-` (consistent with page name)

### 3.2 CSS Class Name Mapping

| Current Inline Style Key | Target CSS Class |
|-------------------------|------------------|
| `container` | `.verify-users-page` |
| `header` | `.verify-users-header` |
| `title` | `.verify-users-title` |
| `subtitle` | `.verify-users-subtitle` |
| `main` | `.verify-users-main` |
| `footer` | `.verify-users-footer` |
| `footerText` | `.verify-users-footer-text` |
| `userSelectContainer` | `.verify-users-select-container` |
| `sectionTitle` | `.verify-users-section-title` |
| `userSelectRow` | `.verify-users-select-row` |
| `emailInputContainer` | `.verify-users-email-container` |
| `emailInput` | `.verify-users-email-input` |
| `dropdownContainer` | `.verify-users-dropdown-container` |
| `dropdownTrigger` | `.verify-users-dropdown-trigger` |
| `dropdownTriggerActive` | `.verify-users-dropdown-trigger--active` |
| `dropdownTextSelected` | `.verify-users-dropdown-text--selected` |
| `dropdownTextPlaceholder` | `.verify-users-dropdown-text--placeholder` |
| `dropdownList` | `.verify-users-dropdown-list` |
| `dropdownLoading` | `.verify-users-dropdown-loading` |
| `dropdownEmpty` | `.verify-users-dropdown-empty` |
| `dropdownItem` | `.verify-users-dropdown-item` |
| `dropdownItemSelected` | `.verify-users-dropdown-item--selected` |
| `dropdownItemContent` | `.verify-users-dropdown-item-content` |
| `dropdownAvatar` | `.verify-users-dropdown-avatar` |
| `dropdownAvatarPlaceholder` | `.verify-users-dropdown-avatar-placeholder` |
| `dropdownAvatarInitial` | `.verify-users-dropdown-avatar-initial` |
| `dropdownItemName` | `.verify-users-dropdown-item-name` |
| `dropdownItemEmail` | `.verify-users-dropdown-item-email` |
| `verifiedBadge` | `.verify-users-verified-badge` |
| `clearButton` | `.verify-users-clear-button` |
| `verificationContainer` | `.verify-users-verification-container` |
| `verificationTitle` | `.verify-users-verification-title` |
| `verificationContent` | `.verify-users-verification-content` |
| `imageGrid` | `.verify-users-image-grid` |
| `toggleSection` | `.verify-users-toggle-section` |
| `processingText` | `.verify-users-processing-text` |
| `imageCardContainer` | `.verify-users-image-card-container` |
| `imageCardLabel` | `.verify-users-image-card-label` |
| `imageCard` | `.verify-users-image-card` |
| `imageCardWithImage` | `.verify-users-image-card--with-image` |
| `imageCardEmpty` | `.verify-users-image-card--empty` |
| `imageCardImg` | `.verify-users-image-card-img` |
| `imageCardOverlay` | `.verify-users-image-card-overlay` |
| `imageCardOverlayText` | `.verify-users-image-card-overlay-text` |
| `imageCardPlaceholder` | `.verify-users-image-card-placeholder` |
| `imagePlaceholderIcon` | `.verify-users-placeholder-icon` |
| `imageCardPlaceholderText` | `.verify-users-placeholder-text` |
| `toggleContainer` | `.verify-users-toggle-container` |
| `toggleLabel` | `.verify-users-toggle-label` |
| `toggleButton` | `.verify-users-toggle-button` |
| `toggleButtonActive` | `.verify-users-toggle-button--active` |
| `toggleButtonInactive` | `.verify-users-toggle-button--inactive` |
| `toggleButtonDisabled` | `.verify-users-toggle-button--disabled` |
| `toggleKnob` | `.verify-users-toggle-knob` |
| `toggleKnobActive` | `.verify-users-toggle-knob--active` |
| `toggleKnobInactive` | `.verify-users-toggle-knob--inactive` |
| `toggleStatus` | `.verify-users-toggle-status` |
| `toggleStatusVerified` | `.verify-users-toggle-status--verified` |
| `toggleStatusNotVerified` | `.verify-users-toggle-status--not-verified` |
| `userSummary` | `.verify-users-summary` |
| `userSummaryItem` | `.verify-users-summary-item` |
| `userSummaryLabel` | `.verify-users-summary-label` |
| `stateContainer` | `.verify-users-state-container` |
| `spinner` | `.verify-users-spinner` |
| `errorContainer` | `.verify-users-error-container` |
| `emptyContainer` | `.verify-users-empty-container` |
| `userIcon` | `.verify-users-user-icon` |
| `emptyTitle` | `.verify-users-empty-title` |
| `emptyText` | `.verify-users-empty-text` |
| `instructions` | `.verify-users-instructions` |
| `instructionsTitle` | `.verify-users-instructions-title` |
| `instructionsList` | `.verify-users-instructions-list` |
| `modalOverlay` | `.verify-users-modal-overlay` |
| `modalContent` | `.verify-users-modal-content` |
| `modalHeader` | `.verify-users-modal-header` |
| `modalTitle` | `.verify-users-modal-title` |
| `modalActions` | `.verify-users-modal-actions` |
| `modalIconButton` | `.verify-users-modal-icon-button` |
| `modalImageContainer` | `.verify-users-modal-image-container` |
| `modalImage` | `.verify-users-modal-image` |
| `chevronIcon` | `.verify-users-chevron-icon` |

### 3.3 Lint Fix Target

**Zero warnings** in all 6 affected page files:
- Remove unused `React` imports (React 17+ JSX transform doesn't require it)
- No other lint issues identified in the main page component files

### 3.4 Visual Verification Target

- 95%+ visual match to Bubble.io reference designs
- Any discrepancies documented with screenshots and descriptions
- Critical discrepancies flagged for follow-up (optional fix during this cleanup)

---

## 4. File-by-File Action Plan

### 4.1 VerifyUsersPage.jsx (CSS Extraction)

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\VerifyUsersPage.jsx`

**Current State**: 1131 lines with inline styles object (lines 579-1110) and dynamic stylesheet (lines 1113-1130)

**Required Changes**:
1. Add CSS import at top: `import './VerifyUsersPage.css';`
2. Replace all `style={styles.xxx}` references with `className="verify-users-xxx"`
3. Replace computed style spreads with conditional class names using template literals
4. Remove the entire `const styles = { ... }` object (lines 579-1110)
5. Remove the dynamic `<style>` injection code (lines 1113-1130)

**Code Reference - Before**:
```jsx
<div style={styles.container}>
```

**Code Reference - After**:
```jsx
<div className="verify-users-page">
```

**Computed Style Handling - Before**:
```jsx
<div
  onClick={onDropdownToggle}
  style={{
    ...styles.dropdownTrigger,
    ...(isDropdownOpen ? styles.dropdownTriggerActive : {}),
  }}
```

**Computed Style Handling - After**:
```jsx
<div
  onClick={onDropdownToggle}
  className={`verify-users-dropdown-trigger ${isDropdownOpen ? 'verify-users-dropdown-trigger--active' : ''}`}
```

**Dependencies**: None (self-contained change)

**Verification**:
1. Visual comparison with current implementation (before/after screenshots)
2. All styles render identically
3. Hover effects work correctly
4. Spinner animation works correctly

### 4.2 VerifyUsersPage.css (New File)

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\VerifyUsersPage.css`

**Current State**: Does not exist

**Required Changes**: Create new file with all extracted styles

**CSS Structure** (sections):
```css
/**
 * VerifyUsersPage.css
 * Styles for the Verify Users admin tool
 * Naming convention: .verify-users-*
 */

/* ===== PAGE LAYOUT ===== */
/* ===== HEADER ===== */
/* ===== MAIN CONTENT ===== */
/* ===== FOOTER ===== */
/* ===== USER SELECT ===== */
/* ===== DROPDOWN ===== */
/* ===== VERIFICATION CONTAINER ===== */
/* ===== IMAGE CARD ===== */
/* ===== TOGGLE SWITCH ===== */
/* ===== USER SUMMARY ===== */
/* ===== STATE CONTAINERS ===== */
/* ===== INSTRUCTIONS ===== */
/* ===== MODAL ===== */
/* ===== ICONS ===== */
/* ===== ANIMATIONS ===== */
/* ===== RESPONSIVE ===== */
```

**Dependencies**: Must be created before VerifyUsersPage.jsx is modified

**Verification**:
1. CSS file parses without errors
2. All class names match component references

### 4.3 InternalEmergencyPage.jsx (Lint Fix)

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\InternalEmergencyPage\InternalEmergencyPage.jsx`

**Current State**: Line 13 imports React but JSX transform doesn't require it

**Required Changes**:
```diff
- import React from 'react';
```

**Dependencies**: None

**Verification**: `bun run lint` shows no warnings for this file

### 4.4 co-host-requests.jsx Entry Point (Lint Fix)

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\co-host-requests.jsx`

**Current State**: Line 1 imports React but JSX transform doesn't require it

**Required Changes**:
```diff
- import React from 'react';
- import { createRoot } from 'react-dom/client';
+ import { createRoot } from 'react-dom/client';
```

**Dependencies**: None

**Verification**: `bun run lint` shows no warnings for this file

### 4.5 guest-simulation.jsx Entry Point (Lint Fix)

**File**: `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\guest-simulation.jsx`

**Current State**: Line 1 imports React but JSX transform doesn't require it

**Required Changes**:
```diff
- import React from 'react';
- import { createRoot } from 'react-dom/client';
+ import { createRoot } from 'react-dom/client';
```

**Dependencies**: None

**Verification**: `bun run lint` shows no warnings for this file

---

## 5. Execution Order

### Phase 1: Visual Verification (Informational)

**Priority**: HIGH (should be done first to establish baseline)
**Estimated Duration**: 30-45 minutes

1. Use Playwright MCP to navigate to each Bubble.io reference URL
2. Take full-page screenshots of each reference design
3. Navigate to corresponding React implementation (localhost or deployed)
4. Take full-page screenshots of each React implementation
5. Compare and document discrepancies
6. Create visual verification report

**Safe Stopping Point**: Yes - this phase is informational only

### Phase 2: Lint Fixes

**Priority**: HIGH (quick wins, low risk)
**Estimated Duration**: 10-15 minutes

1. Remove unused React import from `InternalEmergencyPage.jsx`
2. Remove unused React import from `co-host-requests.jsx`
3. Remove unused React import from `guest-simulation.jsx`
4. Run `bun run lint` to verify fixes

**Safe Stopping Point**: Yes - each file can be fixed independently

### Phase 3: CSS Extraction (VerifyUsersPage)

**Priority**: MEDIUM (larger change, but well-defined)
**Estimated Duration**: 60-90 minutes

1. Create `VerifyUsersPage.css` with all styles converted from inline JavaScript
2. Test CSS file loads correctly in isolation
3. Update `VerifyUsersPage.jsx` to use CSS classes instead of inline styles
4. Remove inline styles object and dynamic stylesheet code
5. Visual verification of the refactored page

**Safe Stopping Point**: No - must complete both CSS file creation and JSX update together

---

## 6. Risk Assessment

### 6.1 Potential Breaking Changes

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Remove unused React imports | LOW | JSX transform handles React automatically since React 17 |
| CSS extraction from VerifyUsersPage | MEDIUM | Thorough visual testing, keep exact CSS values |
| Visual verification | NONE | Informational only, no code changes |

### 6.2 Edge Cases to Watch

1. **Dynamic styles**: Some inline styles use computed values (e.g., `isDropdownOpen ? styles.active : {}`). These must be converted to conditional class names.

2. **Inline style overrides**: The chevron icon rotation uses inline transform:
   ```jsx
   transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
   ```
   This should be converted to conditional CSS classes.

3. **Dynamic stylesheet injection**: The current code creates a `<style>` element at runtime. The CSS file will contain these rules statically, which is cleaner.

4. **Color values**: Must preserve exact hex values to maintain visual consistency:
   - `#52ABEC` (Split Lease blue)
   - `#22c55e` (success green)
   - `#dc2626` (error red)
   - `#6b7280` (muted gray)

### 6.3 Rollback Considerations

- Git commit after each phase allows easy rollback
- CSS extraction is the highest-risk change; if issues arise, the inline styles can be restored from git history
- All changes are additive (new CSS file) and subtractive (remove inline styles) - no complex logic changes

---

## 7. Verification Checklist

### Pre-Execution

- [ ] Confirm development server runs without errors
- [ ] Take baseline screenshots of VerifyUsersPage for comparison
- [ ] Verify Bubble.io reference URLs are accessible

### Phase 1: Visual Verification

- [ ] Screenshot all 6 Bubble.io reference pages
- [ ] Screenshot all 6 React implementation pages
- [ ] Document discrepancies in visual verification report
- [ ] Flag any critical visual issues

### Phase 2: Lint Fixes

- [ ] Remove React import from InternalEmergencyPage.jsx
- [ ] Remove React import from co-host-requests.jsx
- [ ] Remove React import from guest-simulation.jsx
- [ ] Run `bun run lint` - verify no warnings in modified files

### Phase 3: CSS Extraction

- [ ] Create VerifyUsersPage.css with complete styles
- [ ] Update VerifyUsersPage.jsx with class names
- [ ] Remove inline styles object
- [ ] Remove dynamic stylesheet injection
- [ ] Visual comparison matches baseline screenshots
- [ ] All interactive states work (hover, active, disabled)
- [ ] Spinner animation functions correctly
- [ ] Responsive behavior unchanged
- [ ] Run `bun run lint` - verify no new warnings

### Post-Execution

- [ ] Run `bun run build` - verify production build succeeds
- [ ] Final visual review of VerifyUsersPage
- [ ] Git commit with descriptive message

---

## 8. Reference Appendix

### 8.1 All File Paths

**Files to Modify**:
1. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\VerifyUsersPage.jsx`
2. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\InternalEmergencyPage\InternalEmergencyPage.jsx`
3. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\co-host-requests.jsx`
4. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\guest-simulation.jsx`

**Files to Create**:
1. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\VerifyUsersPage.css`

**Reference Files** (patterns to follow):
1. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\ProposalManagePage\ProposalManagePage.css`
2. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\CoHostRequestsPage\CoHostRequestsPage.css`
3. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\MessageCurationPage\MessageCurationPage.css`
4. `C:\Users\igor\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease\app\src\islands\pages\InternalEmergencyPage\InternalEmergencyPage.css`

### 8.2 Bubble.io Reference URLs

1. Verify Users: `https://app.split.lease/version-test/_verify-users`
2. Proposal Management: `https://app.split.lease/version-test/_proposal-manage`
3. Virtual Meetings: `https://app.split.lease/version-test/_manage-virtual-meetings`
4. Message Curation: `https://app.split.lease/version-test/_message-curation`
5. Co-Host Requests: `https://app.split.lease/version-test/_co-host-requests`
6. Internal Emergency: `https://app.split.lease/version-test/_internal-emergency`

### 8.3 Key CSS Values (VerifyUsersPage)

**Colors**:
- Background: `#f3f4f6`
- Card background: `white`
- Primary blue: `#52ABEC`
- Success green: `#22c55e`, `#16a34a`, `#059669`
- Error red: `#dc2626`
- Border gray: `#e5e7eb`, `#d1d5db`
- Text dark: `#111827`, `#1f2937`, `#374151`
- Text muted: `#6b7280`, `#9ca3af`
- Verification border: `#4D4D4D`

**Spacing**:
- Container padding: `2rem`
- Card padding: `1.5rem`
- Gap between sections: `1rem`, `1.5rem`

**Border Radius**:
- Cards: `20px`, `0.5rem`
- Buttons: `0.5rem`
- Badges: `9999px`

**Typography**:
- Page title: `1.5rem`, `700`
- Section title: `1.25rem`, `600`
- Body text: `0.875rem`
- Small text: `0.75rem`

### 8.4 CSS Conversion Example

**Before (JavaScript inline style)**:
```javascript
verificationContainer: {
  border: '2px solid #4D4D4D',
  borderRadius: '20px',
  backgroundColor: 'white',
  padding: '1.5rem',
  marginBottom: '2rem',
},
```

**After (CSS)**:
```css
.verify-users-verification-container {
  border: 2px solid #4D4D4D;
  border-radius: 20px;
  background-color: white;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
```

---

## 9. Definition of Done

This cleanup is complete when:

1. **Visual Verification Report** is created documenting comparison between Bubble.io and React implementations
2. **Zero lint warnings** in the 6 affected admin page files
3. **VerifyUsersPage.css** exists and contains all styles from the inline styles object
4. **VerifyUsersPage.jsx** uses CSS classes exclusively (no inline styles object)
5. **Visual appearance** of VerifyUsersPage is identical before and after CSS extraction
6. **Production build** (`bun run build`) succeeds without errors
7. **Git commit** created with descriptive message

---

**Plan Version**: 1.0
**Author**: cleanup-planner subagent
**Ready for Execution**: Yes
