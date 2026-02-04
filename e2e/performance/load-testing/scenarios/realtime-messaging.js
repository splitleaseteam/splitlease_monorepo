/**
 * k6 Load Test: Real-time Message Handling
 *
 * Tests messaging system performance under load:
 * - Message sending
 * - Message listing
 * - Thread management
 * - Concurrent message operations
 *
 * Note: k6 has limited WebSocket support for Supabase Realtime.
 * This test focuses on HTTP-based messaging operations.
 * For full real-time testing, use dedicated WebSocket tools.
 *
 * Usage:
 *   k6 run scenarios/realtime-messaging.js
 *   k6 run --env BASE_URL=https://splitlease.com scenarios/realtime-messaging.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config, loadProfiles, randomThinkTime } from '../k6.config.js';

// Custom metrics
const messageSendSuccessRate = new Rate('message_send_success_rate');
const messageSendDuration = new Trend('message_send_duration', true);
const messageListDuration = new Trend('message_list_duration', true);
const threadListDuration = new Trend('thread_list_duration', true);
const messageErrors = new Counter('message_errors');
const messagesPerSecond = new Counter('messages_sent');

// Test configuration
export const options = {
  ...loadProfiles.load,
  thresholds: {
    ...loadProfiles.load.thresholds,
    'message_send_success_rate': ['rate>0.95'],
    'message_send_duration': ['p(95)<1000'],
    'message_list_duration': ['p(95)<1500'],
    'thread_list_duration': ['p(95)<2000'],
    'http_req_duration{name:message_send}': ['p(95)<1000'],
    'http_req_duration{name:message_list}': ['p(95)<1500'],
    'http_req_duration{name:thread_list}': ['p(95)<2000'],
  },
};

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseAnonKey,
};

// Sample message templates
const messageTemplates = [
  'Hello, I\'m interested in your listing.',
  'What amenities are included?',
  'Is the move-in date flexible?',
  'Can we schedule a viewing?',
  'Thank you for the information!',
  'I have a few more questions about the space.',
  'What\'s the neighborhood like?',
  'Are utilities included in the price?',
  'Is there parking available?',
  'How long have you been hosting?',
];

/**
 * Setup function
 */
export function setup() {
  console.log(`Messaging Load Test starting against: ${config.baseUrl}`);

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
      console.log('Successfully authenticated for messaging tests');
    } catch {
      console.log('Failed to parse auth response');
    }
  }

  return {
    startTime: new Date().toISOString(),
    authToken: token,
  };
}

/**
 * Get random message content
 */
function randomMessage() {
  return messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
}

/**
 * Test sending a message
 */
function testSendMessage(authToken, threadId) {
  if (!authToken) {
    console.log('No auth token available for sending message');
    return false;
  }

  // Use test thread ID or generate one
  const testThreadId = threadId || 'test-thread-001';
  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'send',
    payload: {
      threadId: testThreadId,
      content: randomMessage(),
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'message_send' },
    }
  );

  const duration = Date.now() - startTime;
  messageSendDuration.add(duration);
  messagesPerSecond.add(1);

  const success = check(response, {
    'message send status is 200 or 201': (r) => [200, 201].includes(r.status),
    'message send returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined || body.message?.id !== undefined;
      } catch {
        return false;
      }
    },
    'message send response time OK': (r) => r.timings.duration < 1000,
  });

  messageSendSuccessRate.add(success);

  if (!success) {
    messageErrors.add(1);
    console.log(`Message send failed: ${response.status} - ${response.body}`);
  }

  return success;
}

/**
 * Test listing messages in a thread
 */
function testListMessages(authToken, threadId) {
  if (!authToken) return false;

  const testThreadId = threadId || 'test-thread-001';
  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'list',
    payload: {
      threadId: testThreadId,
      pagination: {
        page: 1,
        limit: 50,
      },
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'message_list' },
    }
  );

  const duration = Date.now() - startTime;
  messageListDuration.add(duration);

  const success = check(response, {
    'message list status is 200': (r) => r.status === 200,
    'message list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.messages);
      } catch {
        return false;
      }
    },
    'message list response time OK': (r) => r.timings.duration < 1500,
  });

  if (!success) {
    messageErrors.add(1);
  }

  return success;
}

/**
 * Test listing all threads
 */
function testListThreads(authToken) {
  if (!authToken) return false;

  const startTime = Date.now();

  const payload = JSON.stringify({
    action: 'listThreads',
    payload: {
      pagination: {
        page: 1,
        limit: 20,
      },
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'thread_list' },
    }
  );

  const duration = Date.now() - startTime;
  threadListDuration.add(duration);

  const success = check(response, {
    'thread list status is 200': (r) => r.status === 200,
    'thread list returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || body.threads !== undefined;
      } catch {
        return false;
      }
    },
    'thread list response time OK': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    messageErrors.add(1);
  }

  return success;
}

/**
 * Test marking messages as read
 */
function testMarkAsRead(authToken, threadId) {
  if (!authToken) return false;

  const testThreadId = threadId || 'test-thread-001';

  const payload = JSON.stringify({
    action: 'markRead',
    payload: {
      threadId: testThreadId,
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'message_mark_read' },
    }
  );

  return check(response, {
    'mark read status is 200': (r) => r.status === 200,
    'mark read response time OK': (r) => r.timings.duration < 500,
  });
}

/**
 * Test getting unread count
 */
function testGetUnreadCount(authToken) {
  if (!authToken) return false;

  const payload = JSON.stringify({
    action: 'unreadCount',
    payload: {},
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/messages`,
    payload,
    {
      headers: {
        ...headers,
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'unread_count' },
    }
  );

  return check(response, {
    'unread count status is 200': (r) => r.status === 200,
    'unread count returns number': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.count === 'number' || typeof body.unread === 'number';
      } catch {
        return false;
      }
    },
    'unread count response time OK': (r) => r.timings.duration < 500,
  });
}

/**
 * Simulate a conversation (multiple messages back and forth)
 */
function simulateConversation(authToken, threadId) {
  const messageCount = Math.floor(Math.random() * 5) + 2; // 2-6 messages

  for (let i = 0; i < messageCount; i++) {
    testSendMessage(authToken, threadId);
    sleep(0.5 + Math.random()); // Variable delay between messages
  }
}

/**
 * Main test function
 */
export default function (data) {
  const authToken = data.authToken;
  const testThreadId = `test-thread-${__VU}`; // Unique thread per VU

  // Scenario: User messaging flow
  group('Messaging Flow', function () {
    // Step 1: List threads
    group('List Threads', function () {
      testListThreads(authToken);
      sleep(randomThinkTime());
    });

    // Step 2: Open a thread and list messages
    group('Open Thread', function () {
      testListMessages(authToken, testThreadId);
      sleep(randomThinkTime());
    });

    // Step 3: Send a message
    group('Send Message', function () {
      testSendMessage(authToken, testThreadId);
      sleep(randomThinkTime());
    });

    // Step 4: Mark as read
    group('Mark Read', function () {
      testMarkAsRead(authToken, testThreadId);
      sleep(randomThinkTime());
    });

    // Step 5: Check unread count
    group('Check Unread', function () {
      testGetUnreadCount(authToken);
      sleep(randomThinkTime());
    });
  });

  // Random chance of simulating full conversation (20% of iterations)
  if (Math.random() < 0.2) {
    group('Conversation Simulation', function () {
      simulateConversation(authToken, testThreadId);
      sleep(randomThinkTime());
    });
  }

  // Random chance of rapid message burst (10% of iterations)
  // Simulates user typing multiple quick messages
  if (Math.random() < 0.1) {
    group('Message Burst', function () {
      for (let i = 0; i < 3; i++) {
        testSendMessage(authToken, testThreadId);
        sleep(0.2); // Very short delay between messages
      }
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
  console.log(`\nMessaging Load Test completed.`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}
