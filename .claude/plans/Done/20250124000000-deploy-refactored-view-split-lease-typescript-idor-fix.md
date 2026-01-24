# Implementation Plan: Deploy Refactored ViewSplitLeasePage with TypeScript Conversion and IDOR Security Fix

## Overview
Deploy the refactored ViewSplitLeasePage and PreviewSplitLeasePage components from intelligence loop artifacts (IT20/IT21), convert all files from JavaScript/JSX to TypeScript/TSX, and patch a critical IDOR (Insecure Direct Object Reference) security vulnerability in the proposal Edge Function that allows guestId spoofing.

## Success Criteria
- [ ] Legacy ViewSplitLeasePage backed up to `ViewSplitLeasePage_LEGACY/` directory
- [ ] New TypeScript ViewSplitLeasePage deployed with refactored components and logic hook
- [ ] PreviewSplitLeasePage deployed in TypeScript with preview mode support
- [ ] TypeScript types and config files deployed to proper locations
- [ ] All entry points updated to use new TypeScript files
- [ ] IDOR vulnerability patched in proposal Edge Function (JWT validation enforced)
- [ ] Build process completes without TypeScript errors
- [ ] Manual testing confirms pages render and proposal creation works with auth check

## Context & References

### Relevant Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `app/src/islands/pages/ViewSplitLeasePage.jsx` | Legacy page entry point | Backup, then replace with new TSX |
| `app/src/islands/pages/ViewSplitLeasePage/` | New component directory | Create with TS structure |
| `app/src/islands/pages/PreviewSplitLeasePage.tsx` | Preview mode page | Deploy new file |
| `supabase/functions/proposal/index.ts` | Edge Function router | Add JWT auth to create action |
| `supabase/functions/proposal/actions/create.ts` | Create proposal action | Add guestId validation |
| `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/` | Source JS files | Reference for deployment |
| `TAC/intelligence_loop_handoff/AFTER_CODE_IT21/` | Source TS files | Deploy to app/src |

### Related Documentation
- [miniCLAUDE.md](../Documentation/miniCLAUDE.md) - Project structure and conventions
- [EDGE_FUNCTION_AUDIT_IT21.md](../../../TAC/intelligence_loop_handoff/EDGE_FUNCTION_AUDIT_IT21.md) - IDOR vulnerability details

### Existing Patterns to Follow
- **Hollow Component Pattern**: Page components delegate to logic hooks (useViewSplitLeaseLogic)
- **Four-Layer Logic**: Calculators → Rules → Processors → Workflows
- **TypeScript Co-location**: Types in `types/` subdirectory alongside code
- **Entry Point Registry**: Route imports defined in `app/src/routes.config.js`

## Implementation Steps

### Step 1: Backup Legacy ViewSplitLeasePage
**Files:** `app/src/islands/pages/ViewSplitLeasePage.jsx`, `app/src/islands/pages/ViewSplitLeasePage/`
**Purpose:** Create safety backup before replacing with refactored version
**Details:**
- Rename `app/src/islands/pages/ViewSplitLeasePage.jsx` to `ViewSplitLeasePage_LEGACY.jsx`
- Rename `app/src/islands/pages/ViewSplitLeasePage/` directory to `ViewSplitLeasePage_LEGACY/`
- Verify no other files import from the old location
**Validation:**
- Directory `ViewSplitLeasePage_LEGACY/` exists with all original files
- No `ViewSplitLeasePage.jsx` or `ViewSplitLeasePage/` directory at original location

### Step 2: Deploy TypeScript Types
**Files:** `app/src/islands/pages/types/bookingTypes.ts`
**Purpose:** Deploy shared type definitions for booking system
**Details:**
- Create `app/src/islands/pages/types/` directory
- Copy `AFTER_CODE_IT21/types/bookingTypes.ts` to `app/src/islands/pages/types/bookingTypes.ts`
- Verify no type conflicts with existing types
**Validation:**
- File exists at correct path
- No TypeScript errors related to missing types

### Step 3: Deploy Booking Config
**Files:** `app/src/islands/pages/config/bookingConfig.ts`
**Purpose:** Centralized configuration for booking widget and validation
**Details:**
- Create `app/src/islands/pages/config/` directory
- Copy `AFTER_CODE_IT21/config/bookingConfig.ts` to `app/src/islands/pages/config/bookingConfig.ts`
**Validation:**
- File exists at correct path
- Exports are accessible (MOVE_IN_CONFIG, RESERVATION_SPAN_CONFIG, etc.)

### Step 4: Deploy Core Logic Hook (TypeScript Conversion)
**Files:** `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts`
**Purpose:** Central business logic hook for both view and preview modes
**Details:**
- Copy `AFTER_CODE_IT20/useViewSplitLeaseLogic.js` to `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts`
- Convert to TypeScript:
  - Add type imports: `import type { Day, ListingObject, PriceBreakdown, ... } from '../../types/bookingTypes';`
  - Type all function parameters and return values
  - Add proper interface for hook options and return type
  - Type the useState calls with generic parameters
  - Add JSDoc comments for complex functions
- Update imports from `.js` to `.ts` where referencing local utilities
**Validation:**
- No TypeScript errors in IDE
- All imports resolve correctly

### Step 5: Deploy Component - PhotoGallery
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/PhotoGallery.tsx`
**Purpose:** Photo gallery with lightbox modal
**Details:**
- Copy `AFTER_CODE_IT20/components/PhotoGallery.jsx` to `components/PhotoGallery.tsx`
- Convert to TypeScript:
  - Add props interface from `bookingTypes.ts`: `PhotoGalleryProps`
  - Type state variables (currentIndex, isModalOpen)
  - Add proper event handler types
**Validation:**
- Component accepts typed props
- No `any` types in component

### Step 6: Deploy Component - BookingWidget
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/BookingWidget.tsx`
**Purpose:** Booking form with schedule, move-in date, pricing
**Details:**
- Copy `AFTER_CODE_IT20/components/BookingWidget.jsx` to `components/BookingWidget.tsx`
- Convert to TypeScript:
  - Add props interface: `BookingWidgetProps`
  - Type all state (selectedDays, moveInDate, etc.)
  - Type event handlers (onChange, onSubmit)
  - Add proper types for informational texts
**Validation:**
- Props match `BookingWidgetProps` interface
- All conditional rendering logic type-safe

### Step 7: Deploy Component - ListingHeader
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/ListingHeader.tsx`
**Purpose:** Listing title, location, favorite button
**Details:**
- Copy `AFTER_CODE_IT20/components/ListingHeader.jsx` to `components/ListingHeader.tsx`
- Convert to TypeScript:
  - Add props interface: `ListingHeaderProps`
  - Type listing object reference
  - Type handler callbacks
**Validation:**
- Component renders with typed props
- Favorite button handler type-safe

### Step 8: Deploy Component - DescriptionSection
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/DescriptionSection.tsx`
**Purpose:** Expandable listing description
**Details:**
- Copy `AFTER_CODE_IT20/components/DescriptionSection.jsx` to `components/DescriptionSection.tsx`
- Convert to TypeScript:
  - Add props interface: `DescriptionSectionProps`
  - Type isExpanded state
  - Type onToggle handler
**Validation:**
- Toggle functionality works
- Truncation logic type-safe

### Step 9: Deploy Component - AmenitiesGrid
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/AmenitiesGrid.tsx`
**Purpose:** Amenity icons and safety features grid
**Details:**
- Copy `AFTER_CODE_IT20/components/AmenitiesGrid.jsx` to `components/AmenitiesGrid.tsx`
- Convert to TypeScript:
  - Add props interface: `AmenitiesGridProps`
  - Type amenities and safetyFeatures arrays
  - Type expand/collapse state
**Validation:**
- Grid renders with typed amenity data
- Collapse logic functional

### Step 10: Deploy Component - MapSection
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/MapSection.tsx`
**Purpose:** Google Maps integration with lazy loading
**Details:**
- Copy `AFTER_CODE_IT20/components/MapSection.jsx` to `components/MapSection.tsx`
- Convert to TypeScript:
  - Add props interface: `MapSectionProps`
  - Type coordinates object
  - Type mapRef as React.RefObject<any>
  - Type handler callbacks
**Validation:**
- Map ref properly typed
- Lazy load trigger type-safe

### Step 11: Deploy Component - HostInfoCard
**Files:** `app/src/islands/pages/ViewSplitLeasePage/components/HostInfoCard.tsx`
**Purpose:** Host profile and contact button
**Details:**
- Copy `AFTER_CODE_IT20/components/HostInfoCard.jsx` to `components/HostInfoCard.tsx`
- Convert to TypeScript:
  - Add props interface: `HostInfoCardProps`
  - Type host object
  - Type contact handler
**Validation:**
- Host data typed correctly
- Contact button functional

### Step 12: Deploy Main Page - ViewSplitLeasePage
**Files:** `app/src/islands/pages/ViewSplitLeasePage.tsx`
**Purpose:** Guest-facing listing detail page (main entry point)
**Details:**
- Copy `AFTER_CODE_IT20/ViewSplitLeasePage.jsx` to `app/src/islands/pages/ViewSplitLeasePage.tsx`
- Convert to TypeScript:
  - Remove existing ViewSplitLeasePage.tsx if present in subdirectory
  - Update all imports to point to new `.ts` and `.tsx` files
  - Add proper type for hook return value
  - Type all handler functions
  - Update component imports to use barrel exports if needed
- Ensure entry point matches route registry
**Validation:**
- File is at correct path (not in subdirectory)
- All imports resolve to TypeScript files
- No duplicate component definitions

### Step 13: Deploy Preview Page - PreviewSplitLeasePage
**Files:** `app/src/islands/pages/PreviewSplitLeasePage.tsx`
**Purpose:** Host preview mode for listing
**Details:**
- Copy `AFTER_CODE_IT21/PreviewSplitLeasePage.tsx` to `app/src/islands/pages/PreviewSplitLeasePage.tsx`
- Update imports to use deployed TypeScript files:
  - `import { useViewSplitLeaseLogic } from './ViewSplitLeasePage/useViewSplitLeaseLogic';`
  - Update component imports to `./ViewSplitLeasePage/components/*`
- Create `PreviewSplitLeasePage.module.css` if referenced
**Validation:**
- File exists at correct path
- Imports resolve to deployed files
- Preview banner displays correctly

### Step 14: Update Route Registry
**Files:** `app/src/routes.config.js`
**Purpose:** Register PreviewSplitLeasePage in route system
**Details:**
- Add entry for PreviewSplitLeasePage if not present:
  ```javascript
  {
    input: 'preview-split-lease',
    file: 'PreviewSplitLeasePage.tsx'
  }
  ```
- Run `bun run generate-routes` to regenerate `_routes.json` and `_redirects`
**Validation:**
- Route entry added to config
- `_routes.json` includes preview-split-lease entry
- `_redirects` includes preview route redirect

### Step 15: Patch IDOR Vulnerability - Enable JWT Authentication
**Files:** `supabase/functions/proposal/index.ts`
**Purpose:** Require authentication for proposal creation (Fix 1 from audit)
**Details:**
- Locate the `case 'create':` block (around line 69-76)
- Replace the current code:
  ```typescript
  // BEFORE:
  // Authentication check - create is public for now
  result = await handleCreate(payload, null, supabase);
  ```
- With authenticated version:
  ```typescript
  // AFTER:
  // SECURITY: Require authentication for proposal creation
  const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[proposal:create] Authenticated user: ${user.id}`);
  result = await handleCreate(payload, user, supabase);
  ```
- Ensure `authenticateFromHeaders` is imported from `_shared/auth.ts`
**Validation:**
- Unauthenticated requests return 401
- Authenticated requests pass user object to handler

### Step 16: Patch IDOR Vulnerability - Validate guestId
**Files:** `supabase/functions/proposal/actions/create.ts`
**Purpose:** Enforce guestId matches authenticated JWT user (Fix 2 from audit)
**Details:**
- Locate the validation section after `validateCreateProposalInput(input)` (around line 77)
- Insert security validation BEFORE the duplicate check:
  ```typescript
  // ================================================
  // SECURITY: Validate guestId matches authenticated user
  // ================================================

  if (!user) {
    throw new ValidationError('Authentication required for proposal creation');
  }

  // CRITICAL: Verify payload guestId matches authenticated user
  if (input.guestId !== user.id) {
    console.error(`[SECURITY] ALERT: guestId mismatch detected`, {
      authenticatedUserId: user.id?.substring(0, 8) + '...',
      payloadGuestId: input.guestId?.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      listingId: input.listingId
    });

    throw new ValidationError(
      'Authentication mismatch detected. This incident has been logged.'
    );
  }

  console.log(`[proposal:create] Validated guestId matches authenticated user`);
  ```
- Update function signature to ensure user is required (not nullable)
**Validation:**
- Mismatched guestId throws ValidationError
- Error logged with masked user IDs for audit trail
- Matching guestId allows proposal creation

### Step 17: Verify Edge Function Imports
**Files:** `supabase/functions/proposal/index.ts`, `supabase/functions/proposal/actions/create.ts`
**Purpose:** Ensure all necessary imports are present for security patch
**Details:**
- In `index.ts`: Verify `authenticateFromHeaders` is imported
- In `create.ts`: Verify `ValidationError` is imported from `../../_shared/errors.ts`
- Check that UserContext type is imported from `../lib/types.ts`
**Validation:**
- No TypeScript errors in Edge Function files
- All imports resolve correctly

### Step 18: Cleanup and Import Verification
**Files:** All deployed TypeScript files
**Purpose:** Ensure clean import graph with no circular dependencies
**Details:**
- Check all imports in ViewSplitLeasePage components
- Update relative import paths as needed
- Verify no `.js` extensions remain (should be `.ts` or `.tsx`)
- Remove unused imports
- Ensure shared components (Header, Footer) import correctly
**Validation:**
- Build completes without import errors
- No circular dependency warnings
- All type definitions resolve

### Step 19: Build Verification
**Files:** `app/` directory
**Purpose:** Ensure TypeScript compilation succeeds
**Details:**
- Run `bun run build` from app/ directory
- Check for TypeScript compilation errors
- Verify all files are included in output
- Check console for type errors
**Validation:**
- Build completes successfully
- No TypeScript errors in output
- Dist folder contains all page bundles

### Step 20: Manual Testing - View Page
**Files:** Deployed ViewSplitLeasePage
**Purpose:** Verify guest-facing page works correctly
**Details:**
- Start dev server: `bun run dev`
- Navigate to a listing page
- Verify:
  - Page loads without errors
  - Photo gallery opens and closes
  - Booking widget accepts schedule selection
  - Pricing calculates correctly
  - Move-in date picker works
  - Description expands/collapses
  - Amenities grid renders
  - Map loads (when scrolled into view)
  - Host card displays
**Validation:**
- All UI elements render
- No console errors
- Interactive features work

### Step 21: Manual Testing - Preview Page
**Files:** Deployed PreviewSplitLeasePage
**Purpose:** Verify host preview mode works correctly
**Details:**
- Navigate to preview page with `?id=<listing_id>` parameter
- Verify:
  - Preview banner displays
  - Exit preview button works
  - Edit button overlays appear on sections
  - Booking widget is disabled
  - All sections render same as view mode
**Validation:**
- Preview mode activates correctly
- All sections visible
- Edit buttons clickable (logging to console)

### Step 22: Security Testing - IDOR Fix
**Files:** proposal Edge Function
**Purpose:** Verify guestId validation prevents IDOR attacks
**Details:**
- Test 1: Valid proposal creation
  - Send request with matching guestId and JWT user.id
  - Expected: Proposal created successfully
- Test 2: Mismatched guestId (attack scenario)
  - Send authenticated request with different guestId in payload
  - Expected: 400/403 error with "Authentication mismatch"
- Test 3: Unauthenticated request
  - Send request without Authorization header
  - Expected: 401 error with "Authentication required"
- Check Edge Function logs for security alerts
**Validation:**
- Valid requests succeed
- Invalid requests are blocked
- Security alerts logged for mismatch attempts

## Edge Cases & Error Handling

### TypeScript Conversion Issues
- **Case**: Missing type definitions for shared utilities
  - **Handle**: Add `// @ts-ignore` temporarily, create issue to add types
- **Case**: Circular type dependencies
  - **Handle**: Use `type` imports instead of `value` imports: `import type { ... }`

### Edge Function Authentication
- **Case**: `authenticateFromHeaders` function missing or fails
  - **Handle**: Always return 401, log error details, fail closed (no fallback)
- **Case**: JWT expired but still valid signature
  - **Handle**: Supabase client handles token refresh, let it propagate errors

### Import Path Resolution
- **Case**: Relative imports break after file moves
  - **Handle**: Use absolute imports from `app/src/` root where possible
- **Case**: Shared components not found
  - **Handle**: Verify path to `shared/` directory, update imports

### Component State Typing
- **Case**: Complex state objects difficult to type
  - **Handle**: Create interface definitions in types file, reuse across components

## Testing Considerations

### Unit Tests Needed (Future)
- `useViewSplitLeaseLogic` hook with mock data
- Individual component rendering with props
- Price calculation functions
- Validation functions

### Integration Tests Needed (Future)
- Full page load with listing data
- Proposal submission flow
- Auth state transitions

### E2E Tests Needed (Future)
- Guest booking flow from search to proposal
- Host preview mode navigation
- Authenticated vs unauthenticated access

### Manual Testing Checklist
- [ ] View page loads on desktop and mobile
- [ ] All images load in gallery
- [ ] Schedule selection updates pricing
- [ ] Form validation shows appropriate errors
- [ ] Preview mode activates with ?id= parameter
- [ ] Proposal creation requires auth
- [ ] Mismatched guestId is rejected

## Rollback Strategy

### If TypeScript Build Fails
1. Revert to `ViewSplitLeasePage_LEGACY/` directory
2. Rename `ViewSplitLeasePage.jsx` back from `_LEGACY` version
3. Remove TypeScript files from `types/` and `config/`
4. Test that legacy version still works

### If IDOR Patch Breaks Proposal Creation
1. Revert `supabase/functions/proposal/index.ts` to previous version
2. Revert `supabase/functions/proposal/actions/create.ts` to previous version
3. Redeploy Edge Functions: `supabase functions deploy proposal`
4. Investigate why auth validation failed

### If Preview Page Doesn't Work
1. Preview page is new functionality, no rollback needed
2. Keep ViewSplitLeasePage deployed
3. Log preview-specific issues for later fix

## Dependencies & Blockers

### Prerequisites
- TypeScript must be configured in app/ (verify in `vite.config.js` and `tsconfig.json`)
- Supabase Edge Functions must support ES modules and TypeScript
- `authenticateFromHeaders` function must exist in `_shared/auth.ts`

### Potential Blockers
- **Missing `authenticateFromHeaders`**: If authentication helper doesn't exist, need to implement it first
- **Type conflicts**: Existing types may conflict with new `bookingTypes.ts`
- **Import path differences**: Artifact structure may not match app/ structure exactly

### External Dependencies
- Supabase Edge Runtime version compatibility
- Vite TypeScript plugin configuration
- React types version

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TypeScript compilation errors | Medium | High | Comprehensive type checking, incremental conversion |
| Import path mismatches | Medium | Medium | Systematic import verification, testing |
| IDOR patch breaks legitimate proposals | Low | High | Thorough testing with valid and invalid guestIds |
| Performance regression from TypeScript | Low | Low | TypeScript compiles to same JavaScript |
| Missing type definitions | Medium | Medium | Create types as needed, use `any` sparingly |
| Edge Function authentication missing | Low | High | Verify `authenticateFromHeaders` exists before patching |
| Preview page routing issues | Low | Medium | Test route registry, verify _redirects generation |
| Legacy data incompatible with new components | Low | Medium | Test with real listings, handle null/undefined gracefully |

## Files Referenced

### Source Files (Artifacts)
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/useViewSplitLeaseLogic.js`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/ViewSplitLeasePage.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/PhotoGallery.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/BookingWidget.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/ListingHeader.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/DescriptionSection.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/AmenitiesGrid.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/MapSection.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/components/HostInfoCard.jsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/config/bookingConfig.js`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT20/types/bookingTypes.js`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT21/PreviewSplitLeasePage.tsx`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT21/types/bookingTypes.ts`
- `TAC/intelligence_loop_handoff/AFTER_CODE_IT21/config/bookingConfig.ts`
- `TAC/intelligence_loop_handoff/EDGE_FUNCTION_AUDIT_IT21.md`

### Target Files (Codebase)
- `app/src/islands/pages/ViewSplitLeasePage.jsx` (legacy)
- `app/src/islands/pages/ViewSplitLeasePage/` (legacy directory)
- `app/src/islands/pages/ViewSplitLeasePage.tsx` (new)
- `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts` (new)
- `app/src/islands/pages/ViewSplitLeasePage/components/` (new directory)
- `app/src/islands/pages/PreviewSplitLeasePage.tsx` (new)
- `app/src/islands/pages/types/bookingTypes.ts` (new)
- `app/src/islands/pages/config/bookingConfig.ts` (new)
- `app/src/routes.config.js` (update)
- `supabase/functions/proposal/index.ts` (patch)
- `supabase/functions/proposal/actions/create.ts` (patch)

### Supporting Files
- `app/vite.config.js` (verify TS config)
- `app/tsconfig.json` (verify TS compiler options)
- `supabase/functions/_shared/auth.ts` (verify authenticateFromHeaders)
- `supabase/functions/_shared/errors.ts` (verify ValidationError)

---

**Plan Created**: 2025-01-24
**Estimated Completion Time**: 3-4 hours
**Priority**: HIGH (Security vulnerability)
**Complexity**: MEDIUM (TypeScript conversion + security patch)
