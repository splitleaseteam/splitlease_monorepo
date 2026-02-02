/**
 * E2E Test Fixtures - Barrel Export
 *
 * Exports all fixtures for easy importing in test files.
 */

// Auth fixtures - provides pre-authenticated pages
export { test, expect, waitForAuth, clearAuth } from './auth';

// Test users - user definitions and management
export {
  TEST_USERS,
  createTestUsers,
  deleteTestUsers,
  getTestUser,
  getTestUserId,
  getSupabaseAdmin
} from './test-users';
export type { TestUser, TestUsersMap } from './test-users';

// Seed data - test data creation and cleanup
export { seedTestData, cleanupTestData, TEST_IDS } from './seed-data';

// Test data factory - generates test data with faker
export * from './test-data-factory';
