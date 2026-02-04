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
