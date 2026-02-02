/**
 * k6 Load Test: User Registration and Login Flows
 *
 * Tests authentication system performance under load:
 * - User registration
 * - User login
 * - Session management
 * - Token refresh
 *
 * Usage:
 *   k6 run scenarios/user-registration-login.js
 *   k6 run --env BASE_URL=https://splitlease.com scenarios/user-registration-login.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config, loadProfiles, randomThinkTime } from '../k6.config.js';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const loginDuration = new Trend('login_duration', true);
const registrationDuration = new Trend('registration_duration', true);
const tokenRefreshDuration = new Trend('token_refresh_duration', true);
const authErrors = new Counter('auth_errors');

// Test configuration
export const options = {
  ...loadProfiles.load,
  thresholds: {
    ...loadProfiles.load.thresholds,
    'login_success_rate': ['rate>0.95'],
    'login_duration': ['p(95)<2000'],
    'http_req_duration{name:login}': ['p(95)<2000'],
    'http_req_duration{name:registration}': ['p(95)<3000'],
  },
};

// Headers
const headers = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseAnonKey,
};

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Load test starting against: ${config.baseUrl}`);
  console.log(`Supabase URL: ${config.supabaseUrl}`);

  // Verify the service is reachable
  const res = http.get(config.baseUrl);
  check(res, {
    'service is reachable': (r) => r.status === 200,
  });

  return {
    startTime: new Date().toISOString(),
  };
}

/**
 * Generate unique test user data
 */
function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return {
    email: `loadtest_${timestamp}_${random}@test.splitlease.com`,
    password: 'LoadTest123!',
    firstName: 'Load',
    lastName: 'Tester',
  };
}

/**
 * Test user login flow
 */
function testLogin() {
  const startTime = Date.now();

  const payload = JSON.stringify({
    email: config.testUsers.guest.email,
    password: config.testUsers.guest.password,
  });

  const response = http.post(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    payload,
    {
      headers,
      tags: { name: 'login' },
    }
  );

  const duration = Date.now() - startTime;
  loginDuration.add(duration);

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
    'login response time OK': (r) => r.timings.duration < 2000,
  });

  loginSuccessRate.add(success);

  if (!success) {
    authErrors.add(1);
    console.log(`Login failed: ${response.status} - ${response.body}`);
  }

  // Return session data for subsequent requests
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      return {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        userId: body.user?.id,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Test user registration flow
 * Note: In production tests, ensure cleanup of test users
 */
function testRegistration() {
  const user = generateTestUser();
  const startTime = Date.now();

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
    data: {
      first_name: user.firstName,
      last_name: user.lastName,
    },
  });

  const response = http.post(
    `${config.supabaseUrl}/auth/v1/signup`,
    payload,
    {
      headers,
      tags: { name: 'registration' },
    }
  );

  const duration = Date.now() - startTime;
  registrationDuration.add(duration);

  const success = check(response, {
    'registration status is 200 or 201': (r) => [200, 201].includes(r.status),
    'registration returns user': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.user !== undefined || body.id !== undefined;
      } catch {
        return false;
      }
    },
    'registration response time OK': (r) => r.timings.duration < 3000,
  });

  if (!success) {
    authErrors.add(1);
    console.log(`Registration failed: ${response.status} - ${response.body}`);
  }

  return success;
}

/**
 * Test token refresh flow
 */
function testTokenRefresh(refreshToken) {
  if (!refreshToken) return false;

  const startTime = Date.now();

  const payload = JSON.stringify({
    refresh_token: refreshToken,
  });

  const response = http.post(
    `${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    payload,
    {
      headers,
      tags: { name: 'token_refresh' },
    }
  );

  const duration = Date.now() - startTime;
  tokenRefreshDuration.add(duration);

  const success = check(response, {
    'token refresh status is 200': (r) => r.status === 200,
    'token refresh returns new access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
    'token refresh response time OK': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    authErrors.add(1);
  }

  return success;
}

/**
 * Test fetching user profile
 */
function testGetUserProfile(accessToken) {
  if (!accessToken) return false;

  const response = http.get(
    `${config.supabaseUrl}/auth/v1/user`,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { name: 'get_user_profile' },
    }
  );

  return check(response, {
    'get profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.email !== undefined;
      } catch {
        return false;
      }
    },
    'profile response time OK': (r) => r.timings.duration < 1500,
  });
}

/**
 * Main test function - executed for each virtual user
 */
export default function () {
  // Scenario: Complete authentication flow
  group('User Authentication Flow', function () {
    // Step 1: Login
    group('Login', function () {
      const session = testLogin();
      sleep(randomThinkTime());

      if (session) {
        // Step 2: Get user profile
        group('Get Profile', function () {
          testGetUserProfile(session.accessToken);
          sleep(randomThinkTime());
        });

        // Step 3: Refresh token
        group('Token Refresh', function () {
          testTokenRefresh(session.refreshToken);
          sleep(randomThinkTime());
        });
      }
    });
  });

  // Random chance of testing registration (10% of iterations)
  // Note: This creates test users that should be cleaned up
  if (Math.random() < 0.1) {
    group('User Registration Flow', function () {
      testRegistration();
      sleep(randomThinkTime());
    });
  }

  // Think time between iterations
  sleep(randomThinkTime());
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log(`\nLoad test completed.`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}
