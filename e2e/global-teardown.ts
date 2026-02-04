/**
 * Global Teardown for E2E Tests
 *
 * Runs ONCE after all tests in the test suite have completed.
 *
 * Responsibilities:
 * 1. Clean up test data from Supabase
 * 2. Optionally delete test users (disabled by default for faster re-runs)
 *
 * Note: We keep test users between runs for faster iteration.
 * To fully clean up, set DELETE_TEST_USERS=true environment variable.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { cleanupTestData } from './fixtures/seed-data';
import { deleteTestUsers } from './fixtures/test-users';

// ============================================================================
// CONFIGURATION
// ============================================================================

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test
const envPath = path.resolve(__dirname, '..', '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  const rootEnvPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }
}

// ============================================================================
// GLOBAL TEARDOWN
// ============================================================================

async function globalTeardown(): Promise<void> {
  console.log('\n========================================');
  console.log('E2E Test Global Teardown');
  console.log('========================================\n');

  // Skip teardown if env vars not set (prevents errors when tests didn't run setup)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Skipping teardown: Missing environment variables.');
    return;
  }

  // 1. Clean up test data
  console.log('--- Step 1: Clean Up Test Data ---');
  try {
    await cleanupTestData();
  } catch (error) {
    console.error('Error during data cleanup:', error);
    // Don't throw - continue with teardown
  }

  // 2. Optionally delete test users
  // Keep users by default for faster re-runs
  if (process.env.DELETE_TEST_USERS === 'true') {
    console.log('\n--- Step 2: Delete Test Users ---');
    try {
      await deleteTestUsers();
    } catch (error) {
      console.error('Error during user cleanup:', error);
    }
  } else {
    console.log('\n--- Step 2: Keeping Test Users ---');
    console.log('  (Set DELETE_TEST_USERS=true to delete users after tests)');
  }

  console.log('\n========================================');
  console.log('Global Teardown Complete!');
  console.log('========================================\n');
}

export default globalTeardown;
