/**
 * k6 Load Testing Configuration
 *
 * Shared configuration for all k6 load test scenarios.
 * Provides environment-specific settings and thresholds.
 */

// Environment configuration
export const config = {
  // Base URLs
  baseUrl: __ENV.BASE_URL || 'http://localhost:8000',
  supabaseUrl: __ENV.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseFunctionsUrl: __ENV.SUPABASE_FUNCTIONS_URL || 'https://your-project.supabase.co/functions/v1',

  // Authentication
  supabaseAnonKey: __ENV.SUPABASE_ANON_KEY || '',

  // Test users (should be pre-seeded in the database)
  testUsers: {
    guest: {
      email: __ENV.TEST_GUEST_EMAIL || 'testguest@example.com',
      password: __ENV.TEST_GUEST_PASSWORD || 'testpassword123',
    },
    host: {
      email: __ENV.TEST_HOST_EMAIL || 'testhost@example.com',
      password: __ENV.TEST_HOST_PASSWORD || 'testpassword123',
    },
  },
};

// Performance thresholds (in milliseconds)
export const thresholds = {
  // HTTP request duration thresholds
  http_req_duration: {
    // 95% of requests should be below 2s
    p95: 2000,
    // 99% of requests should be below 5s
    p99: 5000,
    // Maximum acceptable duration
    max: 10000,
  },

  // Specific endpoint thresholds
  endpoints: {
    'listing_search': { p95: 2000, p99: 4000 },
    'listing_detail': { p95: 1500, p99: 3000 },
    'proposal_list': { p95: 2000, p99: 4000 },
    'proposal_create': { p95: 3000, p99: 5000 },
    'message_send': { p95: 1000, p99: 2000 },
    'message_list': { p95: 1500, p99: 3000 },
    'auth_login': { p95: 2000, p99: 4000 },
    'user_profile': { p95: 1500, p99: 3000 },
  },

  // Error rate thresholds
  errors: {
    // Less than 1% of requests should fail
    rate: 0.01,
  },

  // Throughput expectations (requests per second)
  throughput: {
    min: 10, // Minimum expected RPS
    target: 50, // Target RPS for normal load
    peak: 100, // Peak RPS for stress testing
  },
};

// Load test stages
export const loadProfiles = {
  // Smoke test - minimal load to verify system works
  smoke: {
    stages: [
      { duration: '1m', target: 1 }, // 1 user for 1 minute
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: ['p(95)<3000'],
    },
  },

  // Load test - normal expected load
  load: {
    stages: [
      { duration: '2m', target: 10 }, // Ramp up to 10 users
      { duration: '5m', target: 10 }, // Stay at 10 users
      { duration: '2m', target: 20 }, // Ramp up to 20 users
      { duration: '5m', target: 20 }, // Stay at 20 users
      { duration: '2m', target: 0 },  // Ramp down
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<2000'],
    },
  },

  // Stress test - push system to limits
  stress: {
    stages: [
      { duration: '2m', target: 10 },  // Ramp up
      { duration: '5m', target: 50 },  // Normal load
      { duration: '2m', target: 100 }, // Stress load
      { duration: '5m', target: 100 }, // Hold stress
      { duration: '2m', target: 150 }, // Peak load
      { duration: '5m', target: 150 }, // Hold peak
      { duration: '5m', target: 0 },   // Ramp down
    ],
    thresholds: {
      http_req_failed: ['rate<0.10'],
      http_req_duration: ['p(95)<5000'],
    },
  },

  // Spike test - sudden load increase
  spike: {
    stages: [
      { duration: '1m', target: 10 },  // Normal load
      { duration: '10s', target: 100 }, // Spike!
      { duration: '2m', target: 100 }, // Hold spike
      { duration: '10s', target: 10 }, // Scale down
      { duration: '2m', target: 10 },  // Recovery
      { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
      http_req_failed: ['rate<0.15'],
      http_req_duration: ['p(95)<8000'],
    },
  },

  // Soak test - sustained load over time
  soak: {
    stages: [
      { duration: '5m', target: 20 },   // Ramp up
      { duration: '4h', target: 20 },   // Sustained load for 4 hours
      { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: ['p(95)<2500'],
    },
  },
};

// Virtual user behavior patterns
export const userBehavior = {
  // Think time between actions (simulates real user behavior)
  thinkTime: {
    min: 1, // seconds
    max: 5, // seconds
  },

  // Session duration
  sessionDuration: {
    min: 60,  // 1 minute
    max: 300, // 5 minutes
  },

  // Actions per session
  actionsPerSession: {
    min: 3,
    max: 15,
  },
};

// Helper function to generate random think time
export function randomThinkTime() {
  const min = userBehavior.thinkTime.min;
  const max = userBehavior.thinkTime.max;
  return Math.random() * (max - min) + min;
}

// Default export for k6 to use
export default {
  config,
  thresholds,
  loadProfiles,
  userBehavior,
  randomThinkTime,
};
