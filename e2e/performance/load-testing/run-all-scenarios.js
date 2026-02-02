/**
 * k6 Load Test: Complete Application Load Test
 *
 * Combines all scenarios into a comprehensive load test that simulates
 * realistic user behavior across the entire application.
 *
 * Scenarios included:
 * - User authentication flows
 * - Listing search and browsing
 * - Proposal creation and management
 * - Messaging between users
 *
 * Usage:
 *   k6 run run-all-scenarios.js
 *   k6 run --env LOAD_PROFILE=stress run-all-scenarios.js
 *   k6 run --env BASE_URL=https://splitlease.com run-all-scenarios.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { config, loadProfiles, randomThinkTime, thresholds } from './k6.config.js';

// ============================================================================
// METRICS
// ============================================================================

// Overall metrics
const overallSuccessRate = new Rate('overall_success_rate');
const overallErrors = new Counter('overall_errors');

// Authentication metrics
const authSuccessRate = new Rate('auth_success_rate');
const loginDuration = new Trend('login_duration', true);

// Search metrics
const searchSuccessRate = new Rate('search_success_rate');
const searchDuration = new Trend('search_duration', true);

// Proposal metrics
const proposalSuccessRate = new Rate('proposal_success_rate');
const proposalDuration = new Trend('proposal_duration', true);

// Message metrics
const messageSuccessRate = new Rate('message_success_rate');
const messageDuration = new Trend('message_duration', true);

// Concurrent users gauge
const activeUsers = new Gauge('active_users');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Select load profile based on environment variable
const loadProfile = __ENV.LOAD_PROFILE || 'load';
const selectedProfile = loadProfiles[loadProfile] || loadProfiles.load;

export const options = {
  ...selectedProfile,
  thresholds: {
    ...selectedProfile.thresholds,
    'overall_success_rate': ['rate>0.95'],
    'auth_success_rate': ['rate>0.98'],
    'search_success_rate': ['rate>0.95'],
    'proposal_success_rate': ['rate>0.90'],
    'message_success_rate': ['rate>0.95'],
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
    'login_duration': ['p(95)<2000'],
    'search_duration': ['p(95)<2500'],
    'proposal_duration': ['p(95)<3000'],
    'message_duration': ['p(95)<1500'],
  },
};

// Headers
const headers = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseAnonKey,
};

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Split Lease - Comprehensive Load Test');
  console.log(`${'='.repeat(60)}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Supabase URL: ${config.supabaseUrl}`);
  console.log(`Load Profile: ${loadProfile}`);
  console.log(`${'='.repeat(60)}\n`);

  // Verify services are reachable
  const checks = {
    appReachable: false,
    supabaseReachable: false,
  };

  const appRes = http.get(config.baseUrl);
  checks.appReachable = check(appRes, {
    'application is reachable': (r) => r.status === 200,
  });

  // Login to get shared auth token
  const loginPayload = JSON.stringify({
    email: config.testUsers.guest.email,
    password: config.testUsers.guest.password,
  });

  const loginRes = http.post(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    loginPayload,
    { headers }
  );

  let authToken = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.access_token;
      console.log('Setup: Authentication successful');
    } catch {
      console.log('Setup: Failed to parse auth response');
    }
  } else {
    console.log(`Setup: Authentication failed (${loginRes.status})`);
  }

  return {
    startTime: new Date().toISOString(),
    authToken,
    checks,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function login() {
  const startTime = Date.now();

  const payload = JSON.stringify({
    email: config.testUsers.guest.email,
    password: config.testUsers.guest.password,
  });

  const response = http.post(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    payload,
    { headers, tags: { name: 'login' } }
  );

  const duration = Date.now() - startTime;
  loginDuration.add(duration);

  const success = check(response, {
    'login successful': (r) => r.status === 200,
  });

  authSuccessRate.add(success);
  overallSuccessRate.add(success);

  if (!success) {
    overallErrors.add(1);
    return null;
  }

  try {
    return JSON.parse(response.body).access_token;
  } catch {
    return null;
  }
}

function searchListings(filters = {}) {
  const params = new URLSearchParams();
  if (filters.days) params.set('days-selected', filters.days.join(','));
  if (filters.borough) params.set('borough', filters.borough);

  const startTime = Date.now();
  const url = `${config.baseUrl}/search${params.toString() ? '?' + params.toString() : ''}`;

  const response = http.get(url, { tags: { name: 'search' } });

  const duration = Date.now() - startTime;
  searchDuration.add(duration);

  const success = check(response, {
    'search successful': (r) => r.status === 200,
  });

  searchSuccessRate.add(success);
  overallSuccessRate.add(success);

  if (!success) overallErrors.add(1);

  return success;
}

function createProposal(authToken) {
  if (!authToken) return false;

  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'create',
    payload: {
      listingId: 'test-listing-manhattan',
      daysSelected: [1, 2, 3, 4, 5],
      moveInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reservationSpanWeeks: 8,
      needForSpace: 'Load test proposal',
      aboutMe: 'Load test user',
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: { ...headers, 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'proposal_create' },
    }
  );

  const duration = Date.now() - startTime;
  proposalDuration.add(duration);

  const success = check(response, {
    'proposal created': (r) => [200, 201].includes(r.status),
  });

  proposalSuccessRate.add(success);
  overallSuccessRate.add(success);

  if (!success) overallErrors.add(1);

  return success;
}

function sendMessage(authToken) {
  if (!authToken) return false;

  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'send',
    payload: {
      threadId: `test-thread-${__VU}`,
      content: 'Load test message - ' + new Date().toISOString(),
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: { ...headers, 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'message_send' },
    }
  );

  const duration = Date.now() - startTime;
  messageDuration.add(duration);

  const success = check(response, {
    'message sent': (r) => [200, 201].includes(r.status),
  });

  messageSuccessRate.add(success);
  overallSuccessRate.add(success);

  if (!success) overallErrors.add(1);

  return success;
}

function listProposals(authToken) {
  if (!authToken) return false;

  const payload = JSON.stringify({
    action: 'list',
    payload: { role: 'guest' },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: { ...headers, 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'proposal_list' },
    }
  );

  return check(response, {
    'proposals listed': (r) => r.status === 200,
  });
}

function listMessages(authToken) {
  if (!authToken) return false;

  const payload = JSON.stringify({
    action: 'listThreads',
    payload: {},
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: { ...headers, 'Authorization': `Bearer ${authToken}` },
      tags: { name: 'message_list' },
    }
  );

  return check(response, {
    'threads listed': (r) => r.status === 200,
  });
}

// ============================================================================
// MAIN TEST SCENARIOS
// ============================================================================

/**
 * Scenario: New User Journey
 * Simulates a new user signing up and exploring the platform
 */
function scenarioNewUser() {
  group('New User Journey', function () {
    // Browse home page
    group('Visit Home', function () {
      const res = http.get(config.baseUrl, { tags: { name: 'home' } });
      check(res, { 'home page loaded': (r) => r.status === 200 });
      sleep(randomThinkTime());
    });

    // Search listings
    group('Search Listings', function () {
      searchListings({ days: [1, 2, 3, 4, 5] });
      sleep(randomThinkTime());
    });

    // View listing detail
    group('View Listing', function () {
      const res = http.get(`${config.baseUrl}/view-split-lease/test-listing-manhattan`, {
        tags: { name: 'listing_detail' },
      });
      check(res, { 'listing detail loaded': (r) => r.status === 200 || r.status === 404 });
      sleep(randomThinkTime());
    });
  });
}

/**
 * Scenario: Returning Guest
 * Simulates a returning user who logs in and manages proposals
 */
function scenarioReturningGuest(authToken) {
  group('Returning Guest', function () {
    // Login
    group('Login', function () {
      const token = authToken || login();
      sleep(randomThinkTime());

      if (token) {
        // Check proposals
        group('Check Proposals', function () {
          listProposals(token);
          sleep(randomThinkTime());
        });

        // Check messages
        group('Check Messages', function () {
          listMessages(token);
          sleep(randomThinkTime());
        });
      }
    });
  });
}

/**
 * Scenario: Active Booker
 * Simulates a user actively searching and creating proposals
 */
function scenarioActiveBooker(authToken) {
  group('Active Booker', function () {
    const token = authToken || login();
    sleep(randomThinkTime());

    if (token) {
      // Search with filters
      group('Filtered Search', function () {
        searchListings({ days: [1, 2, 3], borough: 'Brooklyn' });
        sleep(randomThinkTime());
      });

      // Create proposal
      group('Create Proposal', function () {
        createProposal(token);
        sleep(randomThinkTime());
      });

      // Send message
      group('Send Message', function () {
        sendMessage(token);
        sleep(randomThinkTime());
      });
    }
  });
}

/**
 * Scenario: Heavy Browser
 * Simulates a user who browses many listings
 */
function scenarioHeavyBrowser() {
  group('Heavy Browser', function () {
    const filters = [
      { days: [1, 2, 3, 4, 5], borough: 'Manhattan' },
      { days: [5, 6, 0], borough: 'Brooklyn' },
      { days: [1, 2, 3], borough: 'Queens' },
    ];

    for (const filter of filters) {
      searchListings(filter);
      sleep(randomThinkTime() * 0.5);
    }
  });
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function (data) {
  const authToken = data.authToken;
  activeUsers.add(__VU);

  // Weighted scenario selection (simulates realistic user mix)
  const rand = Math.random();

  if (rand < 0.3) {
    // 30% - New users browsing
    scenarioNewUser();
  } else if (rand < 0.6) {
    // 30% - Returning guests checking status
    scenarioReturningGuest(authToken);
  } else if (rand < 0.8) {
    // 20% - Active bookers creating proposals
    scenarioActiveBooker(authToken);
  } else {
    // 20% - Heavy browsers
    scenarioHeavyBrowser();
  }

  // Think time between iterations
  sleep(randomThinkTime());
}

// ============================================================================
// TEARDOWN
// ============================================================================

export function teardown(data) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Load Test Complete');
  console.log(`${'='.repeat(60)}`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);
}
