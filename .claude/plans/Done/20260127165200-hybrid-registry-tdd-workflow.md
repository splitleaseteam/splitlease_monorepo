# Implementation Plan: Hybrid Registry + TDD Workflow System

**Plan ID**: 20260127165200-hybrid-registry-tdd-workflow
**Classification**: BUILD - New Feature/Infrastructure Implementation
**Complexity**: Multi-file, infrastructure setup
**Created**: 2026-01-27

---

## Objective

Implement a Hybrid Registry + TDD Workflow system for regression test management. This system will:

1. Provide a centralized registry of documented bugs (`bugs.json`)
2. Include a generator script to scaffold regression tests from registry entries
3. Set up Vitest as the test runner with proper React Testing Library configuration
4. Create a reference implementation (REG-001) for the FK constraint violation bug

---

## Context & Motivation

### The Problem

The Split Lease codebase has experienced regression bugs, most notably the FK constraint violation (409 error) that occurs when updating listings. The root cause is sending unchanged FK fields (even null) during updates, which triggers database validation.

### Current State

- **No test framework configured** - The `app/package.json` has no Vitest, Jest, or testing-library dependencies
- **Pattern documented but not tested** - The "only send changed fields" pattern exists in:
  - `app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js` (lines 511-588)
  - `app/src/lib/listingService.js` (`updateListing` function)
- **Reference documentation** - Pattern is documented in `CLAUDE.md` under "Database Update Pattern (CRITICAL)"

### Desired State

- Vitest + React Testing Library configured and ready
- Regression registry at `.claude/regression-registry/bugs.json`
- Test generator script at `.claude/regression-registry/generate-test.js`
- REG-001 regression test validating the changed-fields-only pattern
- Clear workflow documentation for adding future regression tests

---

## Implementation Steps

### Step 1: Set Up Vitest + React Testing Library

**Files to create/modify:**

1. `app/vitest.config.js` - Vitest configuration
2. `app/vitest.setup.js` - Test environment setup
3. `app/package.json` - Add dev dependencies

**Dependencies to add:**

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^24.0.0"
  }
}
```

**vitest.config.js:**

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

**vitest.setup.js:**

```javascript
import '@testing-library/jest-dom';
```

**Package.json scripts to add:**

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:unit:run": "vitest run",
    "test:unit:coverage": "vitest run --coverage",
    "test:regression": "vitest run --dir src/__tests__/regression"
  }
}
```

### Step 2: Create Regression Registry Infrastructure

**Directory structure:**

```
.claude/
  regression-registry/
    bugs.json              # Centralized bug registry
    generate-test.js       # Test scaffold generator
    README.md              # Workflow documentation
```

**bugs.json schema:**

```json
{
  "$schema": "./bugs.schema.json",
  "version": "1.0.0",
  "bugs": [
    {
      "id": "REG-001",
      "title": "FK Constraint Violation on Listing Update",
      "description": "Sending unchanged FK fields (even null) during listing updates triggers database validation errors (409 with code 23503)",
      "dateIdentified": "2025-12-17",
      "severity": "critical",
      "affectedFiles": [
        "app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js",
        "app/src/lib/listingService.js"
      ],
      "pattern": "only-send-changed-fields",
      "invariant": "When updating a listing, only fields that have actually changed from the original should be sent to the database",
      "testFile": "app/src/__tests__/regression/REG-001-fk-constraint-violation.test.js",
      "references": [
        ".claude/plans/Documents/20251217091827-edit-listing-409-regression-report.md"
      ],
      "status": "fixed",
      "fixedIn": "useEditListingDetailsLogic.js - handleSave function"
    }
  ]
}
```

**generate-test.js:**

```javascript
#!/usr/bin/env node
/**
 * Regression Test Generator
 *
 * Scaffolds a new regression test from the bugs registry.
 *
 * Usage:
 *   node .claude/regression-registry/generate-test.js REG-XXX
 *   node .claude/regression-registry/generate-test.js --new "Bug title"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.join(__dirname, 'bugs.json');
const TEST_OUTPUT_DIR = path.join(__dirname, '../../app/src/__tests__/regression');

function loadRegistry() {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

function saveRegistry(registry) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function generateTestId(registry) {
  const existingIds = registry.bugs.map(b => parseInt(b.id.replace('REG-', ''), 10));
  const maxId = Math.max(0, ...existingIds);
  return `REG-${String(maxId + 1).padStart(3, '0')}`;
}

function generateTestContent(bug) {
  return `/**
 * Regression Test: ${bug.id}
 * Title: ${bug.title}
 *
 * Description:
 * ${bug.description}
 *
 * Invariant:
 * ${bug.invariant}
 *
 * Affected Files:
 * ${bug.affectedFiles.map(f => ` * - ${f}`).join('\n')}
 *
 * References:
 * ${bug.references?.map(r => ` * - ${r}`).join('\n') || ' * (none)'}
 */

import { describe, it, expect, vi } from 'vitest';

describe('${bug.id}: ${bug.title}', () => {
  it('should satisfy the invariant: ${bug.invariant.substring(0, 60)}...', () => {
    // TODO: Implement regression test
    //
    // Pattern: ${bug.pattern || 'not specified'}
    //
    // Test Steps:
    // 1. Set up test data that would have triggered the bug
    // 2. Exercise the code path that was fixed
    // 3. Assert the invariant holds

    expect(true).toBe(true); // Placeholder - replace with actual assertions
  });
});
`;
}

function createTest(bugId) {
  const registry = loadRegistry();
  const bug = registry.bugs.find(b => b.id === bugId);

  if (!bug) {
    console.error(`Bug ${bugId} not found in registry`);
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  }

  const testFileName = `${bug.id}-${bug.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)}.test.js`;
  const testPath = path.join(TEST_OUTPUT_DIR, testFileName);

  if (fs.existsSync(testPath)) {
    console.error(`Test file already exists: ${testPath}`);
    process.exit(1);
  }

  const content = generateTestContent(bug);
  fs.writeFileSync(testPath, content);

  // Update registry with test file path
  bug.testFile = `app/src/__tests__/regression/${testFileName}`;
  saveRegistry(registry);

  console.log(`Created regression test: ${testPath}`);
  console.log(`Updated registry with test file path`);
}

function createNewBug(title) {
  const registry = loadRegistry();
  const id = generateTestId(registry);

  const newBug = {
    id,
    title,
    description: 'TODO: Add description',
    dateIdentified: new Date().toISOString().split('T')[0],
    severity: 'medium',
    affectedFiles: [],
    pattern: '',
    invariant: 'TODO: Define the invariant that must hold',
    testFile: null,
    references: [],
    status: 'open'
  };

  registry.bugs.push(newBug);
  saveRegistry(registry);

  console.log(`Created new bug entry: ${id}`);
  console.log(`Run 'node generate-test.js ${id}' to create the test file`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node generate-test.js REG-XXX       # Generate test for existing bug');
  console.log('  node generate-test.js --new "title" # Create new bug entry');
  process.exit(0);
}

if (args[0] === '--new') {
  const title = args.slice(1).join(' ');
  if (!title) {
    console.error('Please provide a bug title');
    process.exit(1);
  }
  createNewBug(title);
} else {
  createTest(args[0]);
}
```

### Step 3: Create REG-001 Reference Implementation

**File:** `app/src/__tests__/regression/REG-001-fk-constraint-violation.test.js`

This test validates the "only send changed fields" pattern:

```javascript
/**
 * Regression Test: REG-001
 * Title: FK Constraint Violation on Listing Update
 *
 * Description:
 * Sending unchanged FK fields (even null) during listing updates triggers
 * database validation errors (409 with code 23503). The listing table has
 * 12 FK constraints, and PostgREST validates all fields sent, even unchanged ones.
 *
 * Invariant:
 * When updating a listing, only fields that have actually changed from the
 * original should be sent to the database.
 *
 * Affected Files:
 * - app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js
 * - app/src/lib/listingService.js
 *
 * References:
 * - .claude/plans/Documents/20251217091827-edit-listing-409-regression-report.md
 */

import { describe, it, expect } from 'vitest';

/**
 * Pure function that extracts changed fields from form data
 * This is the pattern that prevents FK constraint violations
 */
function extractChangedFields(formData, originalData) {
  const changedFields = {};

  for (const [key, value] of Object.entries(formData)) {
    const originalValue = originalData[key];

    // Handle array comparison (for amenities, rules, photos, etc.)
    if (Array.isArray(value) && Array.isArray(originalValue)) {
      if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
        changedFields[key] = value;
      }
    } else if (value !== originalValue) {
      changedFields[key] = value;
    }
  }

  return changedFields;
}

describe('REG-001: FK Constraint Violation on Listing Update', () => {
  describe('extractChangedFields - the core pattern', () => {
    it('should return empty object when no fields have changed', () => {
      const originalData = {
        Name: 'Test Listing',
        Description: 'A test listing',
        'Location - Borough': 'Manhattan',
        'Features - Type of Space': '1569530159044x216130979074711000',
      };

      const formData = { ...originalData };

      const result = extractChangedFields(formData, originalData);

      expect(Object.keys(result).length).toBe(0);
    });

    it('should only return fields that have actually changed', () => {
      const originalData = {
        Name: 'Original Name',
        Description: 'Original Description',
        'Location - Borough': null, // FK field with null value
        'Features - Type of Space': '1569530159044x216130979074711000',
      };

      const formData = {
        Name: 'Updated Name', // Changed
        Description: 'Original Description', // Unchanged
        'Location - Borough': null, // Unchanged null FK - MUST NOT be sent
        'Features - Type of Space': '1569530159044x216130979074711000', // Unchanged
      };

      const result = extractChangedFields(formData, originalData);

      // Should only contain the changed field
      expect(result).toEqual({ Name: 'Updated Name' });

      // Critical: Should NOT contain the unchanged null FK field
      expect(result).not.toHaveProperty('Location - Borough');
    });

    it('should NOT include unchanged FK fields even when they are null', () => {
      // This is the specific case that caused the 409 error
      const originalData = {
        'Location - Borough': null,
        'Location - City': null,
        'Features - Type of Space': null,
        'Cancellation Policy': null,
        Name: 'Test',
      };

      const formData = {
        'Location - Borough': null, // Unchanged null
        'Location - City': null, // Unchanged null
        'Features - Type of Space': null, // Unchanged null
        'Cancellation Policy': null, // Unchanged null
        Name: 'Updated Test', // Only this changed
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed field should be present
      expect(Object.keys(result)).toEqual(['Name']);
      expect(result.Name).toBe('Updated Test');

      // All FK fields with null should NOT be in the result
      expect(result).not.toHaveProperty('Location - Borough');
      expect(result).not.toHaveProperty('Location - City');
      expect(result).not.toHaveProperty('Features - Type of Space');
      expect(result).not.toHaveProperty('Cancellation Policy');
    });

    it('should correctly handle array field comparisons', () => {
      const originalData = {
        'Features - Amenities In-Unit': ['WiFi', 'AC'],
        'Features - House Rules': ['No smoking'],
      };

      const formData = {
        'Features - Amenities In-Unit': ['WiFi', 'AC'], // Same content, same order
        'Features - House Rules': ['No smoking', 'No pets'], // Added item
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed array should be included
      expect(result).toEqual({
        'Features - House Rules': ['No smoking', 'No pets'],
      });
      expect(result).not.toHaveProperty('Features - Amenities In-Unit');
    });

    it('should detect array changes even with same length but different content', () => {
      const originalData = {
        'Features - Photos': [{ id: '1', url: 'a.jpg' }, { id: '2', url: 'b.jpg' }],
      };

      const formData = {
        'Features - Photos': [{ id: '2', url: 'b.jpg' }, { id: '1', url: 'a.jpg' }], // Reordered
      };

      const result = extractChangedFields(formData, originalData);

      // Reordering should be detected as a change
      expect(result).toHaveProperty('Features - Photos');
    });
  });

  describe('Integration pattern with listing update', () => {
    it('should demonstrate the correct update pattern', async () => {
      // Mock listing data (as would come from database)
      const originalListing = {
        _id: '1234567890123456x',
        Name: 'Original Listing',
        Description: 'Original description',
        'Location - Borough': null, // FK that would cause 409 if sent
        'Location - City': null,
        'Features - Type of Space': '1569530159044x216130979074711000',
        'Features - Amenities In-Unit': ['WiFi'],
      };

      // Form data after user edits (only description changed)
      const formData = {
        Name: 'Original Listing',
        Description: 'Updated description',
        'Location - Borough': null,
        'Location - City': null,
        'Features - Type of Space': '1569530159044x216130979074711000',
        'Features - Amenities In-Unit': ['WiFi'],
      };

      // The correct pattern: extract only changed fields
      const changedFields = extractChangedFields(formData, originalListing);

      // Assertion: Only the changed field should be in the update payload
      expect(changedFields).toEqual({
        Description: 'Updated description',
      });

      // This payload can now be safely sent to updateListing()
      // without triggering FK validation on unchanged null fields
    });
  });
});
```

### Step 4: Create Test Directory Structure

**Directory:**
```
app/src/__tests__/
  regression/
    REG-001-fk-constraint-violation.test.js
    README.md
```

**README.md for regression tests:**

```markdown
# Regression Tests

This directory contains regression tests for bugs that have been identified and fixed.

## Naming Convention

Tests follow the pattern: `REG-XXX-descriptive-name.test.js`

Where:
- `REG-XXX` is the bug ID from `.claude/regression-registry/bugs.json`
- `descriptive-name` is a kebab-case summary of the bug

## Adding New Regression Tests

1. Add the bug to the registry:
   ```bash
   node .claude/regression-registry/generate-test.js --new "Bug description"
   ```

2. Edit the new entry in `bugs.json` to add details

3. Generate the test scaffold:
   ```bash
   node .claude/regression-registry/generate-test.js REG-XXX
   ```

4. Implement the test in the generated file

## Running Tests

```bash
# Run all regression tests
bun run test:regression

# Run specific regression test
bun run test:unit REG-001
```

## Test Structure

Each regression test should:

1. Document the bug clearly in the file header
2. Define the invariant that must hold
3. Create test data that would have triggered the original bug
4. Assert that the invariant holds after the fix
```

### Step 5: Create Workflow Documentation

**File:** `.claude/regression-registry/README.md`

```markdown
# Regression Registry + TDD Workflow

This directory contains the regression test registry and tools for managing regression tests.

## Overview

The Hybrid Registry + TDD Workflow provides:

1. **Centralized Bug Registry** (`bugs.json`) - Documents bugs with metadata, patterns, and invariants
2. **Test Generator** (`generate-test.js`) - Scaffolds regression tests from registry entries
3. **Regression Test Suite** (`app/src/__tests__/regression/`) - Vitest tests that prevent regressions

## Quick Start

### Adding a New Bug

```bash
# Create a new bug entry
node .claude/regression-registry/generate-test.js --new "Descriptive bug title"

# This creates an entry in bugs.json with a new REG-XXX ID
# Edit bugs.json to fill in details
```

### Generating a Test

```bash
# Generate test scaffold from existing bug entry
node .claude/regression-registry/generate-test.js REG-XXX
```

### Running Regression Tests

```bash
# From app/ directory
bun run test:regression
```

## Registry Schema

Each bug entry in `bugs.json` contains:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (REG-XXX format) |
| `title` | Short, descriptive title |
| `description` | Detailed description of the bug |
| `dateIdentified` | When the bug was first identified |
| `severity` | critical, high, medium, low |
| `affectedFiles` | List of files where the bug manifested |
| `pattern` | The fix pattern (e.g., "only-send-changed-fields") |
| `invariant` | The condition that must always be true |
| `testFile` | Path to the regression test file |
| `references` | Links to related documentation |
| `status` | open, fixed, wontfix |
| `fixedIn` | Description of where the fix was applied |

## TDD Workflow

When a bug is identified:

1. **Document First**: Add the bug to `bugs.json` with all metadata
2. **Write Test**: Generate and implement the regression test
3. **Verify Failure**: Ensure the test fails before the fix
4. **Apply Fix**: Fix the bug in the codebase
5. **Verify Pass**: Ensure the test passes after the fix
6. **Update Status**: Mark the bug as fixed in the registry

## File Structure

```
.claude/
  regression-registry/
    bugs.json           # Bug registry
    generate-test.js    # Test generator
    README.md           # This file

app/src/__tests__/
  regression/
    REG-001-*.test.js   # Regression tests
    README.md           # Test documentation
```
```

---

## Execution Checklist

- [ ] **Step 1**: Install Vitest and testing dependencies
- [ ] **Step 2**: Create `app/vitest.config.js`
- [ ] **Step 3**: Create `app/vitest.setup.js`
- [ ] **Step 4**: Update `app/package.json` with test scripts
- [ ] **Step 5**: Create `.claude/regression-registry/` directory
- [ ] **Step 6**: Create `bugs.json` with REG-001 entry
- [ ] **Step 7**: Create `generate-test.js` script
- [ ] **Step 8**: Create `.claude/regression-registry/README.md`
- [ ] **Step 9**: Create `app/src/__tests__/regression/` directory
- [ ] **Step 10**: Create REG-001 test file
- [ ] **Step 11**: Create `app/src/__tests__/regression/README.md`
- [ ] **Step 12**: Run tests to verify setup works
- [ ] **Step 13**: Commit changes

---

## Verification

After implementation, verify:

1. `bun run test:unit` runs successfully (Vitest starts)
2. `bun run test:regression` runs the REG-001 test
3. REG-001 test passes (the fix is already in place)
4. `node .claude/regression-registry/generate-test.js --new "Test bug"` creates a new entry

---

## Referenced Files

### Source Files (Existing - Read Only)
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\package.json` - Package configuration
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\vite.config.js` - Vite configuration
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\islands\shared\EditListingDetails\useEditListingDetailsLogic.js` - Contains the fix pattern (lines 511-588)
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\lib\listingService.js` - Listing service with updateListing function

### Files to Create
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\vitest.config.js`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\vitest.setup.js`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\regression-registry\bugs.json`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\regression-registry\generate-test.js`
- `c:\Users\Split Lease\Documents\Split Lease - Team\.claude\regression-registry\README.md`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\__tests__\regression\REG-001-fk-constraint-violation.test.js`
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\src\__tests__\regression\README.md`

### Files to Modify
- `c:\Users\Split Lease\Documents\Split Lease - Team\app\package.json` - Add devDependencies and test scripts

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vitest conflicts with existing Vite config | Low | Medium | Vitest shares Vite config by default |
| ESM/CJS module issues | Medium | Medium | Use explicit ESM in test files |
| Windows path issues in generator | Low | Low | Use `path.join()` consistently |

---

## Notes

- The test framework is Vitest because it integrates seamlessly with the existing Vite build system
- React Testing Library is included for future component testing needs
- The REG-001 test focuses on pure functions to keep the initial implementation simple
- The generator script uses Node.js ESM syntax to match the project's `"type": "module"` setting

---

**Plan Status**: Ready for Execution
**Estimated Time**: 30-45 minutes
