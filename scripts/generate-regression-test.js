#!/usr/bin/env node
/**
 * SYSTEM: Generate regression test templates for new bug fixes
 *
 * When fixing a bug, run:
 *   node scripts/generate-regression-test.js "BUG-123" "Description of the bug"
 *
 * This creates a test file that:
 * 1. Documents the original bug
 * 2. Tests the fix
 * 3. Prevents the same bug from recurring
 *
 * Prevents: Regression Clusters #7, #13 (same bugs recurring)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , bugId, description] = process.argv;

if (!bugId || !description) {
  console.log('');
  console.log('Usage: node scripts/generate-regression-test.js "BUG-ID" "Description"');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/generate-regression-test.js "BUG-123" "Check-out day wrong for week wrap-around"');
  console.log('');
  process.exit(1);
}

const testContent = `/**
 * Regression Test: ${bugId}
 *
 * Bug Description:
 * ${description}
 *
 * This test ensures the bug does not recur.
 *
 * Created: ${new Date().toISOString()}
 * Author: ${process.env.USER || process.env.USERNAME || 'Unknown'}
 */

import { describe, it, expect } from 'vitest';

describe('Regression: ${bugId}', () => {
  it('should not exhibit the original bug behavior', () => {
    // TODO: Add test for the specific bug scenario
    //
    // Original bug:
    // ${description}
    //
    // Expected behavior after fix:
    // (Describe what should happen now)
    //
    // Test implementation:
    // 1. Set up the scenario that triggered the bug
    // 2. Execute the code that was fixed
    // 3. Assert that the bug no longer occurs

    expect(true).toBe(true);  // Replace with actual test

    // Example test structure:
    // const input = { /* scenario that triggered bug */ };
    // const result = functionThatWasFixed(input);
    // expect(result).toBe(expectedCorrectValue);
  });

  it('should handle the edge case that caused the bug', () => {
    // TODO: Test the specific edge case
    //
    // Many bugs occur on edge cases like:
    // - Boundary values (0, -1, max)
    // - Null/undefined inputs
    // - Empty arrays/objects
    // - Wrap-around conditions
    //
    // Identify the edge case and test it explicitly.

    expect(true).toBe(true);  // Replace with actual test

    // Example:
    // const edgeCase = { /* edge case input */ };
    // const result = functionThatWasFixed(edgeCase);
    // expect(result).toBe(expectedEdgeCaseResult);
  });

  it('should work correctly for the normal case too', () => {
    // TODO: Test that the fix didn't break normal operation
    //
    // Regression tests should verify:
    // 1. The bug is fixed (test above)
    // 2. Normal cases still work (this test)
    //
    // This prevents "fixing" a bug by breaking other functionality.

    expect(true).toBe(true);  // Replace with actual test

    // Example:
    // const normalInput = { /* typical use case */ };
    // const result = functionThatWasFixed(normalInput);
    // expect(result).toBe(expectedNormalResult);
  });
});
`;

// Generate filename
const safeId = bugId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
const fileName = `${safeId}-${Date.now()}.test.js`;
const filePath = path.join(__dirname, '..', 'app', 'src', '__tests__', 'regression', fileName);

// Ensure directory exists
fs.mkdirSync(path.dirname(filePath), { recursive: true });

// Write test file
fs.writeFileSync(filePath, testContent);

console.log('');
console.log('✅ Created regression test template:');
console.log(`   ${filePath}`);
console.log('');
console.log('📝 Next steps:');
console.log('   1. Open the file and replace TODOs with actual test logic');
console.log('   2. Run the test: bun run test:unit');
console.log('   3. Commit with the bug fix');
console.log('');
console.log('💡 The test should:');
console.log('   - Reproduce the original bug scenario');
console.log('   - Assert the fix works correctly');
console.log('   - Prevent the bug from recurring');
console.log('');
