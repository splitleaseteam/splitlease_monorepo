/**
 * API Response Time Performance Tests
 *
 * Tests for measuring and validating API response times across critical endpoints.
 * Establishes baseline thresholds and alerts on performance regressions.
 *
 * Usage:
 *   npx playwright test e2e/performance/api-response-times.test.ts
 *
 * Environment Variables:
 *   - BASE_URL: The base URL for the application (default: http://localhost:8000)
 *   - SUPABASE_URL: The Supabase project URL
 *   - SUPABASE_ANON_KEY: The Supabase anonymous key for API calls
 *   - PERFORMANCE_MODE: Set to 'strict' for stricter thresholds in CI
 */

import { test, expect, Page, APIResponse } from '@playwright/test';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Response time thresholds in milliseconds
 * These are P95 thresholds - 95% of requests should complete within these times
 */
const THRESHOLDS = {
  // Listing operations
  LISTING_SEARCH: 2000,         // Search/filter listings
  LISTING_DETAIL: 1500,         // Fetch single listing details
  LISTING_CREATE: 3000,         // Create new listing
  LISTING_UPDATE: 2000,         // Update existing listing

  // Proposal operations
  PROPOSAL_LIST: 2000,          // List proposals (guest or host)
  PROPOSAL_CREATE: 3000,        // Create new proposal
  PROPOSAL_UPDATE: 2000,        // Update proposal status
  PROPOSAL_DETAIL: 1500,        // Fetch single proposal

  // Message operations
  MESSAGE_LIST: 1500,           // List messages in thread
  MESSAGE_SEND: 1000,           // Send a message
  MESSAGE_THREAD_LIST: 2000,    // List all threads

  // Authentication operations
  AUTH_LOGIN: 2000,             // User login
  AUTH_LOGOUT: 500,             // User logout
  AUTH_REFRESH: 1000,           // Token refresh

  // User operations
  USER_PROFILE: 1500,           // Fetch user profile
  USER_UPDATE: 2000,            // Update user profile

  // Search operations
  SEARCH_LISTINGS: 3000,        // Full listing search with filters
  SEARCH_AUTOCOMPLETE: 500,     // Autocomplete suggestions

  // Static assets
  PAGE_LOAD: 5000,              // Full page load time
  ASSET_LOAD: 1000,             // Individual asset load

  // Real-time operations
  REALTIME_CONNECT: 2000,       // WebSocket connection
  REALTIME_MESSAGE: 500,        // Real-time message delivery
};

/**
 * Performance test configuration
 */
const CONFIG = {
  // Number of requests to make for calculating P95
  SAMPLE_SIZE: 10,
  // Percentile to use for threshold comparison
  PERCENTILE: 95,
  // Warmup requests to discard
  WARMUP_REQUESTS: 2,
  // Delay between requests to avoid rate limiting
  REQUEST_DELAY_MS: 100,
};

// ============================================================================
// UTILITIES
// ============================================================================

interface TimingResult {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
}

interface PerformanceMetrics {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  samples: number;
}

/**
 * Calculates performance metrics from timing results
 */
function calculateMetrics(timings: number[]): PerformanceMetrics {
  const sorted = [...timings].sort((a, b) => a - b);
  const n = sorted.length;

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean: timings.reduce((a, b) => a + b, 0) / n,
    median: sorted[Math.floor(n / 2)],
    p95: sorted[Math.floor(n * 0.95)],
    p99: sorted[Math.floor(n * 0.99)],
    samples: n,
  };
}

/**
 * Measures API response time
 */
async function measureApiCall(
  page: Page,
  url: string,
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
  } = {}
): Promise<TimingResult> {
  const startTime = Date.now();

  const response = await page.request.fetch(url, {
    method: options.method || 'GET',
    data: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const duration = Date.now() - startTime;

  return {
    url,
    method: options.method || 'GET',
    status: response.status(),
    duration,
    timestamp: new Date(),
  };
}

/**
 * Runs multiple measurements and returns metrics
 */
async function runMeasurements(
  page: Page,
  url: string,
  options: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
    sampleSize?: number;
    warmupRequests?: number;
  } = {}
): Promise<{ metrics: PerformanceMetrics; results: TimingResult[] }> {
  const sampleSize = options.sampleSize || CONFIG.SAMPLE_SIZE;
  const warmupRequests = options.warmupRequests || CONFIG.WARMUP_REQUESTS;
  const results: TimingResult[] = [];

  // Warmup requests (discarded)
  for (let i = 0; i < warmupRequests; i++) {
    await measureApiCall(page, url, options);
    await page.waitForTimeout(CONFIG.REQUEST_DELAY_MS);
  }

  // Measured requests
  for (let i = 0; i < sampleSize; i++) {
    const result = await measureApiCall(page, url, options);
    results.push(result);
    await page.waitForTimeout(CONFIG.REQUEST_DELAY_MS);
  }

  const timings = results.map((r) => r.duration);
  const metrics = calculateMetrics(timings);

  return { metrics, results };
}

/**
 * Measures page navigation time
 */
async function measurePageLoad(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}

/**
 * Collects all network requests during an action
 */
async function collectNetworkTimings(
  page: Page,
  action: () => Promise<void>
): Promise<TimingResult[]> {
  const results: TimingResult[] = [];

  page.on('requestfinished', async (request) => {
    const timing = request.timing();
    if (timing.responseEnd > 0) {
      results.push({
        url: request.url(),
        method: request.method(),
        status: (await request.response())?.status() || 0,
        duration: timing.responseEnd,
        timestamp: new Date(),
      });
    }
  });

  await action();

  return results;
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('API Response Times - Listing Operations', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('listing search response time should be within threshold', async ({ page }) => {
    // Navigate to search page and measure API calls
    const timings = await collectNetworkTimings(page, async () => {
      await page.goto(`${baseUrl}/search`);
      await page.waitForLoadState('networkidle');
    });

    // Find listing-related API calls
    const listingCalls = timings.filter(
      (t) => t.url.includes('/listing') || t.url.includes('/search')
    );

    if (listingCalls.length > 0) {
      const metrics = calculateMetrics(listingCalls.map((t) => t.duration));

      console.log(`Listing Search Performance:
        - Min: ${metrics.min}ms
        - Max: ${metrics.max}ms
        - Mean: ${metrics.mean.toFixed(2)}ms
        - Median: ${metrics.median}ms
        - P95: ${metrics.p95}ms
        - Samples: ${metrics.samples}`);

      expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.LISTING_SEARCH);
    }
  });

  test('listing detail page response time should be within threshold', async ({ page }) => {
    // First get a listing ID from search
    await page.goto(`${baseUrl}/search`);
    await page.waitForLoadState('networkidle');

    // Wait for listings to load
    const listingCard = page.locator('[data-listing-id], .listing-card').first();
    const hasListings = await listingCard.isVisible().catch(() => false);

    if (hasListings) {
      const durations: number[] = [];

      // Measure multiple listing detail loads
      for (let i = 0; i < 3; i++) {
        await page.goto(`${baseUrl}/search`);
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();
        await listingCard.click();
        await page.waitForURL(/view-split-lease/);
        await page.waitForLoadState('networkidle');
        durations.push(Date.now() - startTime);
      }

      const metrics = calculateMetrics(durations);

      console.log(`Listing Detail Performance:
        - Min: ${metrics.min}ms
        - Max: ${metrics.max}ms
        - Mean: ${metrics.mean.toFixed(2)}ms
        - P95: ${metrics.p95}ms`);

      expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.LISTING_DETAIL);
    }
  });

  test('listing search with filters response time should be within threshold', async ({ page }) => {
    const durations: number[] = [];

    for (let i = 0; i < CONFIG.SAMPLE_SIZE; i++) {
      const startTime = Date.now();

      // Navigate with different filter combinations
      const filters = ['days-selected=1,2,3', 'borough=Manhattan', 'price=under-200'];
      const filterParam = filters[i % filters.length];

      await page.goto(`${baseUrl}/search?${filterParam}`);
      await page.waitForLoadState('networkidle');

      durations.push(Date.now() - startTime);
      await page.waitForTimeout(CONFIG.REQUEST_DELAY_MS);
    }

    const metrics = calculateMetrics(durations);

    console.log(`Filtered Search Performance:
      - Min: ${metrics.min}ms
      - Max: ${metrics.max}ms
      - Mean: ${metrics.mean.toFixed(2)}ms
      - P95: ${metrics.p95}ms`);

    expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.SEARCH_LISTINGS);
  });
});

test.describe('API Response Times - Proposal Operations', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('proposal list response time should be within threshold', async ({ page }) => {
    // Login first
    await page.goto(`${baseUrl}/`);

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    if (await loginButton.isVisible()) {
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('testguest@example.com');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);
    }

    // Measure proposal list page load
    const durations: number[] = [];

    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await page.goto(`${baseUrl}/guest-proposals`);
      await page.waitForLoadState('networkidle');
      durations.push(Date.now() - startTime);
      await page.waitForTimeout(CONFIG.REQUEST_DELAY_MS);
    }

    const metrics = calculateMetrics(durations);

    console.log(`Proposal List Performance:
      - Min: ${metrics.min}ms
      - Max: ${metrics.max}ms
      - Mean: ${metrics.mean.toFixed(2)}ms
      - P95: ${metrics.p95}ms`);

    expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.PROPOSAL_LIST);
  });
});

test.describe('API Response Times - Message Operations', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('message thread list response time should be within threshold', async ({ page }) => {
    // Login first
    await page.goto(`${baseUrl}/`);

    const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
    if (await loginButton.isVisible()) {
      await loginButton.click();

      const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
      await loginModal.waitFor({ state: 'visible' });

      await page.locator('input[type="email"]').fill('testguest@example.com');
      await page.locator('input[type="password"]').fill('testpassword123');
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(2000);
    }

    // Navigate to a page with messages and capture message-related API calls
    const timings = await collectNetworkTimings(page, async () => {
      await page.goto(`${baseUrl}/guest-proposals`);
      await page.waitForLoadState('networkidle');
    });

    const messageCalls = timings.filter(
      (t) => t.url.includes('/messages') || t.url.includes('/thread')
    );

    if (messageCalls.length > 0) {
      const metrics = calculateMetrics(messageCalls.map((t) => t.duration));

      console.log(`Message Thread List Performance:
        - Min: ${metrics.min}ms
        - Max: ${metrics.max}ms
        - Mean: ${metrics.mean.toFixed(2)}ms
        - P95: ${metrics.p95}ms`);

      expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.MESSAGE_THREAD_LIST);
    }
  });
});

test.describe('API Response Times - Page Load Performance', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  const pagesToTest = [
    { name: 'Home Page', path: '/' },
    { name: 'Search Page', path: '/search' },
    { name: 'About Page', path: '/about' },
  ];

  for (const pageConfig of pagesToTest) {
    test(`${pageConfig.name} load time should be within threshold`, async ({ page }) => {
      const durations: number[] = [];

      // Warmup
      await page.goto(`${baseUrl}${pageConfig.path}`);
      await page.waitForLoadState('networkidle');

      // Measured runs
      for (let i = 0; i < 5; i++) {
        const duration = await measurePageLoad(page, `${baseUrl}${pageConfig.path}`);
        durations.push(duration);
        await page.waitForTimeout(CONFIG.REQUEST_DELAY_MS);
      }

      const metrics = calculateMetrics(durations);

      console.log(`${pageConfig.name} Load Performance:
        - Min: ${metrics.min}ms
        - Max: ${metrics.max}ms
        - Mean: ${metrics.mean.toFixed(2)}ms
        - P95: ${metrics.p95}ms`);

      expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.PAGE_LOAD);
    });
  }
});

test.describe('API Response Times - Authentication', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('login response time should be within threshold', async ({ page }) => {
    const durations: number[] = [];

    for (let i = 0; i < 3; i++) {
      await page.goto(`${baseUrl}/`);

      const loginButton = page.locator('[data-testid="login-button"], .login-button, button:has-text("Log in")');
      if (await loginButton.isVisible()) {
        await loginButton.click();

        const loginModal = page.locator('[data-testid="login-modal"], .login-modal, .auth-modal');
        await loginModal.waitFor({ state: 'visible' });

        await page.locator('input[type="email"]').fill('testguest@example.com');
        await page.locator('input[type="password"]').fill('testpassword123');

        const startTime = Date.now();
        await page.locator('button[type="submit"]').click();

        // Wait for login to complete
        await page.waitForTimeout(2000);
        durations.push(Date.now() - startTime);

        // Logout for next iteration
        const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .user-avatar');
        if (await userMenu.isVisible()) {
          await userMenu.click();
          const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Sign out")');
          if (await logoutButton.isVisible()) {
            await logoutButton.click();
          }
        }
      }
    }

    if (durations.length > 0) {
      const metrics = calculateMetrics(durations);

      console.log(`Login Performance:
        - Min: ${metrics.min}ms
        - Max: ${metrics.max}ms
        - Mean: ${metrics.mean.toFixed(2)}ms
        - P95: ${metrics.p95}ms`);

      expect(metrics.p95).toBeLessThanOrEqual(THRESHOLDS.AUTH_LOGIN);
    }
  });
});

test.describe('API Response Times - Network Analysis', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('should analyze all network requests on search page', async ({ page }) => {
    const allRequests: TimingResult[] = [];

    // Collect all network requests
    page.on('requestfinished', async (request) => {
      const response = await request.response();
      if (response) {
        const timing = request.timing();
        allRequests.push({
          url: request.url(),
          method: request.method(),
          status: response.status(),
          duration: timing.responseEnd > 0 ? timing.responseEnd : 0,
          timestamp: new Date(),
        });
      }
    });

    await page.goto(`${baseUrl}/search`);
    await page.waitForLoadState('networkidle');

    // Group requests by type
    const apiRequests = allRequests.filter(
      (r) => r.url.includes('/functions/') || r.url.includes('/rest/')
    );
    const staticRequests = allRequests.filter(
      (r) => r.url.match(/\.(js|css|png|jpg|svg|woff)/)
    );

    console.log(`\nNetwork Analysis Summary:
      Total Requests: ${allRequests.length}
      API Requests: ${apiRequests.length}
      Static Assets: ${staticRequests.length}`);

    if (apiRequests.length > 0) {
      const apiMetrics = calculateMetrics(
        apiRequests.filter((r) => r.duration > 0).map((r) => r.duration)
      );
      console.log(`\nAPI Request Metrics:
        - Min: ${apiMetrics.min}ms
        - Max: ${apiMetrics.max}ms
        - Mean: ${apiMetrics.mean.toFixed(2)}ms
        - P95: ${apiMetrics.p95}ms`);
    }

    if (staticRequests.length > 0) {
      const staticMetrics = calculateMetrics(
        staticRequests.filter((r) => r.duration > 0).map((r) => r.duration)
      );
      console.log(`\nStatic Asset Metrics:
        - Min: ${staticMetrics.min}ms
        - Max: ${staticMetrics.max}ms
        - Mean: ${staticMetrics.mean.toFixed(2)}ms
        - P95: ${staticMetrics.p95}ms`);
    }

    // Log slow requests (> 1000ms)
    const slowRequests = allRequests.filter((r) => r.duration > 1000);
    if (slowRequests.length > 0) {
      console.log(`\nSlow Requests (> 1000ms):`);
      slowRequests.forEach((r) => {
        console.log(`  - ${r.method} ${r.url.substring(0, 100)}... (${r.duration}ms)`);
      });
    }
  });

  test('should generate performance report', async ({ page }) => {
    const report: Record<string, PerformanceMetrics> = {};

    // Test each critical page
    const pages = [
      { name: 'Home', path: '/' },
      { name: 'Search', path: '/search' },
    ];

    for (const pageConfig of pages) {
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const duration = await measurePageLoad(page, `${baseUrl}${pageConfig.path}`);
        durations.push(duration);
      }

      report[pageConfig.name] = calculateMetrics(durations);
    }

    console.log('\n=== PERFORMANCE REPORT ===\n');
    console.log('Page Load Times (ms):');
    console.log('| Page | Min | Max | Mean | Median | P95 | P99 |');
    console.log('|------|-----|-----|------|--------|-----|-----|');

    for (const [name, metrics] of Object.entries(report)) {
      console.log(
        `| ${name} | ${metrics.min} | ${metrics.max} | ${metrics.mean.toFixed(0)} | ${metrics.median} | ${metrics.p95} | ${metrics.p99} |`
      );
    }

    // All pages should load within threshold
    for (const [name, metrics] of Object.entries(report)) {
      expect(
        metrics.p95,
        `${name} P95 load time exceeded threshold`
      ).toBeLessThanOrEqual(THRESHOLDS.PAGE_LOAD);
    }
  });
});

test.describe('API Response Times - Regression Detection', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

  test('should detect performance regressions on critical paths', async ({ page }) => {
    const criticalPaths = [
      {
        name: 'Search Page Initial Load',
        path: '/search',
        threshold: THRESHOLDS.PAGE_LOAD,
      },
      {
        name: 'Home Page Initial Load',
        path: '/',
        threshold: THRESHOLDS.PAGE_LOAD,
      },
    ];

    const regressions: string[] = [];

    for (const criticalPath of criticalPaths) {
      const durations: number[] = [];

      // Warmup
      await page.goto(`${baseUrl}${criticalPath.path}`);

      // Measure
      for (let i = 0; i < 5; i++) {
        const duration = await measurePageLoad(page, `${baseUrl}${criticalPath.path}`);
        durations.push(duration);
      }

      const metrics = calculateMetrics(durations);

      if (metrics.p95 > criticalPath.threshold) {
        regressions.push(
          `${criticalPath.name}: P95 (${metrics.p95}ms) exceeds threshold (${criticalPath.threshold}ms)`
        );
      }

      console.log(`${criticalPath.name}: P95=${metrics.p95}ms (threshold: ${criticalPath.threshold}ms)`);
    }

    if (regressions.length > 0) {
      console.log('\n=== PERFORMANCE REGRESSIONS DETECTED ===');
      regressions.forEach((r) => console.log(`  - ${r}`));
    }

    expect(
      regressions.length,
      `Performance regressions detected:\n${regressions.join('\n')}`
    ).toBe(0);
  });
});
