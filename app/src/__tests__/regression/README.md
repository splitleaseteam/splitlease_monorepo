# Regression Tests

This directory contains regression tests for bugs that have been identified and fixed.

## Naming Convention

Tests follow the pattern: `REG-XXX-descriptive-name.test.js`

Where:
- `REG-XXX` is a sequential bug identifier
- `descriptive-name` is a kebab-case summary of the bug

## Adding New Regression Tests

1. Create a new test file following the naming pattern above
2. Document the bug clearly in the file header
3. Implement the test

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
