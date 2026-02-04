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
