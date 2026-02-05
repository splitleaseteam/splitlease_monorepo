# Task 3: Routing System Validation & CI/CD Integration - Implementation Plan

## Executive Summary

This plan creates a comprehensive validation system for the Split Lease routing architecture to prevent "pages getting lost from redirection dashboard." The solution implements orphaned file detection, missing file detection, devOnly leak prevention, JSX entry point validation, _headers sync validation, and CI/CD integration.

## Current State Analysis

### Identified Issues

1. **4 Orphaned HTML Files** (exist without registry entries):
   - `referral-invite.html` - Has JSX entry point (`referral-invite.jsx`)
   - `logged-in-avatar-demo.html` - Has JSX entry point (`logged-in-avatar-demo.jsx`)
   - `listing-card-demo.html` - No JSX found
   - `listing-card-f.html` - No JSX found

2. **1 devOnly Route** with missing files:
   - `favorite-listings-v2` - Marked `devOnly: true` but files don't exist

3. **Manual `_headers` file** - Can drift from route registry (82 routes currently, may not match)

4. **No CI/CD route validation** - No automated checks before deployment

5. **Basic validation** in `generate-redirects.js` - Only checks duplicates, required fields, and cloudflareInternal consistency

### Existing Patterns

- **Route Registry Pattern**: Single source of truth in `src/routes.config.js`
- **Prebuild Hook**: `bun run generate-routes` runs before every build
- **GitHub Actions**: Already has workflows for Edge Functions deployment
- **Validation Pattern**: Basic validation exists in `generate-redirects.js` (lines 201-234)
- **Error Pattern**: Uses `console.error` + `process.exit(1)` for validation failures

---

## Implementation Plan

### Phase 1: Enhanced Validation Logic

#### File 1: `app/scripts/validate-routes.js` (NEW)

**Purpose**: Comprehensive route validation script that can run standalone or as part of CI/CD.

**Key Features**:
1. **Orphaned HTML file detection**
2. **Missing file detection**
3. **devOnly leak prevention**
4. **JSX entry point validation**
5. **_headers sync validation**
6. **Enhanced error messages** with actionable guidance

---

### Phase 2: Enhanced generate-redirects.js

#### File 2: `app/scripts/generate-redirects.js` (MODIFY)

**Changes**:
1. Import and use the new validation functions
2. Enhance error messages with actionable guidance
3. Add validation for orphaned files before generation
4. Add summary output

---

### Phase 3: CI/CD Integration

#### File 3: `.github/workflows/validate-routes.yml` (NEW)

**Purpose**: GitHub Actions workflow that runs route validation on every PR.

---

### Phase 4: Pre-commit Hook

#### File 4: `.husky/pre-commit` (MODIFY or CREATE)

**Purpose**: Run route validation locally before each commit.

---

### Phase 5: NPM Scripts

#### File 5: `app/package.json` (MODIFY)

**Add these scripts**:

```json
{
  "scripts": {
    "validate-routes": "node scripts/validate-routes.js",
    "validate-routes:strict": "node scripts/validate-routes.js --production --strict",
    "validate-routes:fix": "node scripts/validate-routes.js --generate-headers",
    "check-routes": "bun run validate-routes && bun run generate-routes"
  }
}
```

---

## Implementation Steps

### Step 1: Create validation script
1. Create `app/scripts/validate-routes.js` with the comprehensive validation logic
2. Test locally: `cd app && node scripts/validate-routes.js`
3. Verify orphaned file detection catches the 4 known orphaned files
4. Verify missing file detection catches `favorite-listings-v2`

### Step 2: Enhance generate-redirects.js
1. Replace the existing `validateRoutes()` function with the enhanced version
2. Add better error messages with actionable guidance
3. Test: `cd app && bun run generate-routes`
4. Verify errors are clear and helpful

### Step 3: Update package.json
1. Add the new npm scripts
2. Test each script:
   - `bun run validate-routes`
   - `bun run validate-routes:strict`
   - `bun run check-routes`

### Step 4: Create GitHub Actions workflow
1. Create `.github/workflows/validate-routes.yml`
2. Test by pushing to a feature branch
3. Verify the workflow runs and reports errors correctly
4. Verify PR comments are posted

### Step 5: Set up pre-commit hook
1. Create or modify `.husky/pre-commit`
2. Make it executable: `chmod +x .husky/pre-commit`
3. Test by making a commit
4. Verify the hook runs and blocks commits on validation failure

### Step 6: Handle existing orphaned files
1. For `referral-invite.html` and `referral-invite.jsx`:
   - Add route to `routes.config.js`, OR
   - Delete both files if not needed
2. For `logged-in-avatar-demo.html` and `logged-in-avatar-demo.jsx`:
   - Add route to `routes.config.js`, OR
   - Delete both files if not needed
3. For `listing-card-demo.html` and `listing-card-f.html`:
   - Delete if truly orphaned (no JSX exists)
   - Or create JSX and add routes if they should exist

### Step 7: Generate and sync _headers
1. Run: `bun run validate-routes --generate-headers`
2. Review `_headers.generated`
3. Update `_headers` if needed, or automate replacement

---

## Error Message Format

All validation errors follow this pattern for consistency:

```
❌ [Error Type]
   Description: What went wrong
   File: Which file/route is affected
   🔧 Fix: Actionable next step
   💡 Example: Code example if applicable
```

---

## Success Metrics

1. **Zero orphaned files** in production builds
2. **Zero missing files** for registered routes
3. **Zero devOnly leaks** to production
4. **100% route coverage** in _headers
5. **Automated blocking** of invalid deployments

---

## Critical Files for Implementation

Based on this comprehensive analysis, here are the most critical files for implementing this plan:

- **`app/scripts/validate-routes.js`** - NEW FILE. Core validation logic for orphaned files, missing files, devOnly leaks, JSX validation, and _headers sync.

- **`app/scripts/generate-redirects.js`** - MODIFY. Enhance existing validateRoutes() function with better error messages and integrate with new validation script.

- **`app/src/routes.config.js`** - REFERENCE. Single source of truth for all routes. Must be updated when adding/removing routes.

- **`.github/workflows/validate-routes.yml`** - NEW FILE. CI/CD integration that runs validation on every PR and prevents deployment with route issues.

- **`app/package.json`** - MODIFY. Add new npm scripts for validation.
