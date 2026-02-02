/**
 * k6 Load Test: Concurrent Proposal Submissions
 *
 * Tests proposal system performance under concurrent load:
 * - Proposal creation
 * - Proposal listing (guest and host views)
 * - Proposal updates (status changes)
 * - Concurrent submissions to same listing
 *
 * Usage:
 *   k6 run scenarios/proposal-submission.js
 *   k6 run --env BASE_URL=https://splitlease.com scenarios/proposal-submission.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { config, loadProfiles, randomThinkTime } from '../k6.config.js';

// Custom metrics
const proposalCreateSuccessRate = new Rate('proposal_create_success_rate');
const proposalCreateDuration = new Trend('proposal_create_duration', true);
const proposalListDuration = new Trend('proposal_list_duration', true);
const proposalUpdateDuration = new Trend('proposal_update_duration', true);
const concurrentSubmissions = new Counter('concurrent_submissions');
const proposalErrors = new Counter('proposal_errors');
const conflictErrors = new Counter('conflict_errors');

// Test configuration
export const options = {
  ...loadProfiles.load,
  thresholds: {
    ...loadProfiles.load.thresholds,
    'proposal_create_success_rate': ['rate>0.90'],
    'proposal_create_duration': ['p(95)<3000'],
    'proposal_list_duration': ['p(95)<2000'],
    'proposal_update_duration': ['p(95)<2000'],
    'http_req_duration{name:proposal_create}': ['p(95)<3000'],
    'http_req_duration{name:proposal_list}': ['p(95)<2000'],
    'http_req_duration{name:proposal_update}': ['p(95)<2000'],
    'conflict_errors': ['count<10'],
  },
};

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseAnonKey,
};

// Sample listing IDs (should be pre-seeded in test database)
const sampleListings = [
  'test-listing-manhattan',
  'test-listing-brooklyn',
  'test-listing-studio',
  'test-listing-weekend',
  'test-listing-weeknight',
];

// Sample day selections
const daySelections = [
  [1, 2, 3, 4, 5],     // Mon-Fri
  [5, 6, 0],           // Fri-Sun
  [1, 2, 3],           // Mon-Wed
  [3, 4, 5],           // Wed-Fri
  [0, 1, 6],           // Sun, Mon, Sat
];

let authToken = null;

/**
 * Setup function
 */
export function setup() {
  console.log(`Proposal Load Test starting against: ${config.baseUrl}`);

  // Login to get auth token
  const loginPayload = JSON.stringify({
    email: config.testUsers.guest.email,
    password: config.testUsers.guest.password,
  });

  const loginResponse = http.post(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    loginPayload,
    { headers }
  );

  let token = null;
  if (loginResponse.status === 200) {
    try {
      const body = JSON.parse(loginResponse.body);
      token = body.access_token;
      console.log('Successfully authenticated for proposal tests');
    } catch {
      console.log('Failed to parse auth response');
    }
  } else {
    console.log(`Authentication failed: ${loginResponse.status}`);
  }

  return {
    startTime: new Date().toISOString(),
    authToken: token,
  };
}

/**
 * Get random element from array
 */
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate move-in date (2-8 weeks from now)
 */
function generateMoveInDate() {
  const date = new Date();
  const weeksFromNow = Math.floor(Math.random() * 6) + 2;
  date.setDate(date.getDate() + weeksFromNow * 7);
  return date.toISOString().split('T')[0];
}

/**
 * Generate proposal data
 */
function generateProposalData() {
  return {
    listingId: randomElement(sampleListings),
    daysSelected: randomElement(daySelections),
    moveInDate: generateMoveInDate(),
    reservationSpanWeeks: Math.floor(Math.random() * 12) + 4, // 4-16 weeks
    needForSpace: 'Load test proposal - hybrid work arrangement',
    aboutMe: 'Load test user for performance testing',
    specialNeeds: '',
  };
}

/**
 * Test proposal creation
 */
function testProposalCreate(authToken) {
  if (!authToken) {
    console.log('No auth token available for proposal creation');
    return null;
  }

  const proposalData = generateProposalData();
  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'create',
    payload: proposalData,
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'proposal_create' },
    }
  );

  const duration = Date.now() - startTime;
  proposalCreateDuration.add(duration);
  concurrentSubmissions.add(1);

  const success = check(response, {
    'proposal create status is 200 or 201': (r) => [200, 201].includes(r.status),
    'proposal create returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined || body.proposal?.id !== undefined;
      } catch {
        return false;
      }
    },
    'proposal create response time OK': (r) => r.timings.duration < 3000,
  });

  proposalCreateSuccessRate.add(success);

  if (!success) {
    proposalErrors.add(1);

    // Check for conflict errors (concurrent submission to same listing)
    if (response.status === 409) {
      conflictErrors.add(1);
      console.log('Conflict detected - concurrent submission');
    } else {
      console.log(`Proposal create failed: ${response.status} - ${response.body}`);
    }
    return null;
  }

  // Return proposal ID for follow-up tests
  try {
    const body = JSON.parse(response.body);
    return body.id || body.proposal?.id;
  } catch {
    return null;
  }
}

/**
 * Test listing proposals (guest view)
 */
function testListGuestProposals(authToken) {
  if (!authToken) return false;

  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'list',
    payload: {
      role: 'guest',
      pagination: {
        page: 1,
        limit: 20,
      },
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'proposal_list' },
    }
  );

  const duration = Date.now() - startTime;
  proposalListDuration.add(duration);

  const success = check(response, {
    'guest proposal list status is 200': (r) => r.status === 200,
    'guest proposal list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.proposals);
      } catch {
        return false;
      }
    },
    'guest proposal list response time OK': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    proposalErrors.add(1);
  }

  return success;
}

/**
 * Test listing proposals (host view)
 */
function testListHostProposals(authToken) {
  if (!authToken) return false;

  const payload = JSON.stringify({
    action: 'list',
    payload: {
      role: 'host',
      pagination: {
        page: 1,
        limit: 20,
      },
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'proposal_list_host' },
    }
  );

  return check(response, {
    'host proposal list status is 200': (r) => r.status === 200,
    'host proposal list response time OK': (r) => r.timings.duration < 2000,
  });
}

/**
 * Test fetching single proposal
 */
function testGetProposal(authToken, proposalId) {
  if (!authToken || !proposalId) return false;

  const payload = JSON.stringify({
    action: 'read',
    payload: {
      id: proposalId,
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'proposal_detail' },
    }
  );

  return check(response, {
    'get proposal status is 200': (r) => r.status === 200,
    'get proposal returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined || body.proposal !== undefined;
      } catch {
        return false;
      }
    },
    'get proposal response time OK': (r) => r.timings.duration < 1500,
  });
}

/**
 * Test updating proposal status
 */
function testUpdateProposalStatus(authToken, proposalId) {
  if (!authToken || !proposalId) return false;

  const startTime = Date.now();
  const newStatus = 'cancelled'; // Safe status for load testing

  const payload = JSON.stringify({
    action: 'update',
    payload: {
      id: proposalId,
      status: newStatus,
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/proposal`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'proposal_update' },
    }
  );

  const duration = Date.now() - startTime;
  proposalUpdateDuration.add(duration);

  const success = check(response, {
    'proposal update status is 200': (r) => r.status === 200,
    'proposal update response time OK': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    proposalErrors.add(1);
    console.log(`Proposal update failed: ${response.status}`);
  }

  return success;
}

/**
 * Main test function
 */
export default function (data) {
  const authToken = data.authToken;

  // Scenario: Guest proposal flow
  group('Guest Proposal Flow', function () {
    // Step 1: List existing proposals
    group('List Proposals', function () {
      testListGuestProposals(authToken);
      sleep(randomThinkTime());
    });

    // Step 2: Create new proposal
    group('Create Proposal', function () {
      const proposalId = testProposalCreate(authToken);
      sleep(randomThinkTime());

      // Step 3: View created proposal
      if (proposalId) {
        group('View Proposal', function () {
          testGetProposal(authToken, proposalId);
          sleep(randomThinkTime());
        });

        // Step 4: Cancel proposal (cleanup)
        group('Cancel Proposal', function () {
          testUpdateProposalStatus(authToken, proposalId);
          sleep(randomThinkTime());
        });
      }
    });
  });

  // Random chance of simulating host view (30% of iterations)
  if (Math.random() < 0.3) {
    group('Host Proposal View', function () {
      testListHostProposals(authToken);
      sleep(randomThinkTime());
    });
  }

  // Think time between iterations
  sleep(randomThinkTime());
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log(`\nProposal Load Test completed.`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}
