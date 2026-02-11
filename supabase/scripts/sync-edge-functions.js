#!/usr/bin/env node
/**
 * SYSTEM ENFORCEMENT: Edge Function Registry Sync
 *
 * This script:
 * 1. Scans supabase/functions/ for all function directories
 * 2. Compares against config.toml
 * 3. FAILS if any function is missing from config
 * 4. Optionally auto-generates missing config entries
 *
 * Run in CI to block deployments with unregistered functions.
 *
 * Usage:
 *   node supabase/scripts/sync-edge-functions.js          # Check only
 *   node supabase/scripts/sync-edge-functions.js --fix    # Auto-add missing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUNCTIONS_DIR = path.join(__dirname, '..', 'functions');
const CONFIG_FILE = path.join(__dirname, '..', 'config.toml');

/**
 * Discover all function directories
 */
function discoverFunctions() {
  if (!fs.existsSync(FUNCTIONS_DIR)) {
    console.error(`❌ Functions directory not found: ${FUNCTIONS_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(FUNCTIONS_DIR, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !entry.name.startsWith('_'))  // Exclude _shared
    .filter(entry => {
      const indexPath = path.join(FUNCTIONS_DIR, entry.name, 'index.ts');
      return fs.existsSync(indexPath);
    })
    .map(entry => entry.name)
    .sort();
}

/**
 * Parse config.toml for registered functions
 */
function getRegisteredFunctions() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`❌ Config file not found: ${CONFIG_FILE}`);
    process.exit(1);
  }

  const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');

  // Simple regex parser for [functions.name] sections
  const functions = Array.from(
    configContent.matchAll(/\[functions\.([^\]]+)\]/g),
    match => match[1]
  ).sort();

  return functions;
}

/**
 * Generate config entry for a function
 */
function generateFunctionConfig(functionName) {
  const functionDir = path.join(FUNCTIONS_DIR, functionName);
  const hasDenoJson = fs.existsSync(path.join(functionDir, 'deno.json'));

  let config = `\n[functions.${functionName}]\n`;
  config += `enabled = true\n`;
  config += `verify_jwt = false  # Review: Should this require authentication?\n`;

  if (hasDenoJson) {
    config += `import_map = "./functions/${functionName}/deno.json"\n`;
  }

  config += `entrypoint = "./functions/${functionName}/index.ts"\n`;

  return config;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Edge Function Registry Sync\n');

  const discovered = discoverFunctions();
  const registered = getRegisteredFunctions();

  console.log(`📦 Discovered ${discovered.length} Edge Functions`);
  console.log(`📝 Registered ${registered.length} in config.toml\n`);

  // Find unregistered functions
  const unregistered = discovered.filter(fn => !registered.includes(fn));

  // Find orphaned registrations (in config but no directory)
  const orphaned = registered.filter(fn => !discovered.includes(fn));

  let hasIssues = false;

  if (unregistered.length > 0) {
    hasIssues = true;
    console.log('❌ SYSTEM BLOCK: Unregistered Edge Functions detected:\n');
    unregistered.forEach(fn => console.log(`   - ${fn}`));
    console.log('\n📝 Add these to supabase/config.toml:\n');

    unregistered.forEach(fn => {
      console.log(generateFunctionConfig(fn));
    });

    // Auto-fix mode
    if (process.argv.includes('--fix')) {
      console.log('🔧 Auto-fix mode enabled. Updating config.toml...\n');

      let configContent = fs.readFileSync(CONFIG_FILE, 'utf8');

      unregistered.forEach(fn => {
        configContent += generateFunctionConfig(fn);
      });

      fs.writeFileSync(CONFIG_FILE, configContent);
      console.log('✅ Config updated. Please review and commit the changes.\n');
      console.log('   Verify each function:');
      unregistered.forEach(fn => {
        console.log(`   - Does ${fn} require authentication? Update verify_jwt`);
      });

      // Exit 0 in fix mode after updating
      process.exit(0);
    } else {
      console.log('\n💡 To auto-fix, run: node supabase/scripts/sync-edge-functions.js --fix\n');
    }
  }

  if (orphaned.length > 0) {
    hasIssues = true;
    console.log('\n⚠️  WARNING: Orphaned registrations (no function directory):\n');
    orphaned.forEach(fn => console.log(`   - ${fn}`));
    console.log('\n   These should be removed from config.toml\n');
  }

  if (!hasIssues) {
    console.log('✅ Edge Function registry is in sync!');
    console.log(`   All ${discovered.length} functions are properly registered.\n`);
    process.exit(0);
  } else {
    // Exit with error if not in fix mode and issues found
    if (!process.argv.includes('--fix')) {
      console.log('❌ Edge Function registry is out of sync. Deployment blocked.\n');
      process.exit(1);
    }
  }
}

main();
