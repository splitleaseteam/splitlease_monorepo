/**
 * Test Users Module for E2E Tests
 *
 * Creates and manages test users in Supabase Auth.
 * Uses the service role key for admin operations.
 *
 * User Types:
 * - guest_big_spender: Guest with 'big_spender' archetype
 * - guest_high_flex: Guest with 'high_flex' archetype
 * - guest_average: Guest with 'average' archetype
 * - host: Host user for listing management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface TestUser {
  email: string;
  password: string;
  userId: string | null;
  archetype?: string;
  userType: 'guest' | 'host' | 'admin';
  firstName: string;
  lastName: string;
}

export interface TestUsersMap {
  guest_big_spender: TestUser;
  guest_high_flex: TestUser;
  guest_average: TestUser;
  host: TestUser;
  admin: TestUser;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Pre-defined test users with realistic data
 * Email format: e2e-{type}@test.splitlease.com
 */
export const TEST_USERS: TestUsersMap = {
  guest_big_spender: {
    email: 'e2e-guest-bigspender@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null,
    archetype: 'big_spender',
    userType: 'guest',
    firstName: 'BigSpender',
    lastName: 'TestGuest'
  },
  guest_high_flex: {
    email: 'e2e-guest-highflex@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null,
    archetype: 'high_flex',
    userType: 'guest',
    firstName: 'HighFlex',
    lastName: 'TestGuest'
  },
  guest_average: {
    email: 'e2e-guest-average@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null,
    archetype: 'average',
    userType: 'guest',
    firstName: 'Average',
    lastName: 'TestGuest'
  },
  host: {
    email: 'e2e-host@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null,
    userType: 'host',
    firstName: 'Test',
    lastName: 'Host'
  },
  admin: {
    email: 'e2e-admin@test.splitlease.com',
    password: 'TestPassword123!',
    userId: null,
    userType: 'admin',
    firstName: 'Test',
    lastName: 'Admin'
  }
};

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get or create the Supabase admin client
 * Uses service role key for admin operations
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
      'Please create a .env.test file with these values.'
    );
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdmin;
}

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Create all test users in Supabase Auth
 * Skips users that already exist
 */
export async function createTestUsers(): Promise<TestUsersMap> {
  const supabase = getSupabaseAdmin();
  console.log('Creating test users in Supabase Auth...');

  for (const [key, user] of Object.entries(TEST_USERS) as [keyof TestUsersMap, TestUser][]) {
    try {
      // Check if user already exists by email
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error(`  Error listing users: ${listError.message}`);
        throw listError;
      }

      const foundUser = existingUsers?.users?.find(u => u.email === user.email);

      if (foundUser) {
        // User exists, store their ID
        TEST_USERS[key].userId = foundUser.id;
        console.log(`  [SKIP] User ${key} already exists: ${foundUser.id}`);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
            user_type: user.userType === 'admin' ? 'Admin' : user.userType === 'host' ? 'Host' : 'Guest'
          }
        });

        if (createError) {
          console.error(`  [ERROR] Failed to create ${key}: ${createError.message}`);
          throw createError;
        }

        TEST_USERS[key].userId = newUser.user.id;
        console.log(`  [CREATE] User ${key} created: ${newUser.user.id}`);
      }
    } catch (error) {
      console.error(`  [ERROR] Failed to process ${key}:`, error);
      throw error;
    }
  }

  console.log('All test users ready!');
  return TEST_USERS;
}

/**
 * Delete all test users from Supabase Auth
 * Called during teardown to clean up
 */
export async function deleteTestUsers(): Promise<void> {
  const supabase = getSupabaseAdmin();
  console.log('Deleting test users from Supabase Auth...');

  for (const [key, user] of Object.entries(TEST_USERS) as [keyof TestUsersMap, TestUser][]) {
    if (user.userId) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.userId);

        if (error) {
          console.error(`  [ERROR] Failed to delete ${key}: ${error.message}`);
        } else {
          console.log(`  [DELETE] User ${key} deleted: ${user.userId}`);
          TEST_USERS[key].userId = null;
        }
      } catch (error) {
        console.error(`  [ERROR] Failed to delete ${key}:`, error);
      }
    }
  }

  console.log('Test users cleanup complete!');
}

/**
 * Get a test user by key
 */
export function getTestUser(key: keyof TestUsersMap): TestUser {
  return TEST_USERS[key];
}

/**
 * Get user ID by key (throws if user not created yet)
 */
export function getTestUserId(key: keyof TestUsersMap): string {
  const userId = TEST_USERS[key].userId;
  if (!userId) {
    throw new Error(`User ${key} has not been created yet. Run createTestUsers() first.`);
  }
  return userId;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TEST_USERS,
  createTestUsers,
  deleteTestUsers,
  getTestUser,
  getTestUserId,
  getSupabaseAdmin
};
