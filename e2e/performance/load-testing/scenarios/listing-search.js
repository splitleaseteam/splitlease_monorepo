/**
 * k6 Load Test: Listing Search Under Load
 *
 * Tests listing search and filter performance:
 * - Basic search queries
 * - Filtered searches (neighborhood, price, days)
 * - Pagination
 * - Search with authentication
 *
 * Usage:
 *   k6 run scenarios/listing-search.js
 *   k6 run --env BASE_URL=https://splitlease.com scenarios/listing-search.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config, loadProfiles, randomThinkTime } from '../k6.config.js';

// Custom metrics
const searchSuccessRate = new Rate('search_success_rate');
const searchDuration = new Trend('search_duration', true);
const filteredSearchDuration = new Trend('filtered_search_duration', true);
const listingDetailDuration = new Trend('listing_detail_duration', true);
const searchResultCount = new Trend('search_result_count');
const searchErrors = new Counter('search_errors');

// Test configuration
export const options = {
  ...loadProfiles.load,
  thresholds: {
    ...loadProfiles.load.thresholds,
    'search_success_rate': ['rate>0.95'],
    'search_duration': ['p(95)<2000'],
    'filtered_search_duration': ['p(95)<2500'],
    'listing_detail_duration': ['p(95)<1500'],
    'http_req_duration{name:search}': ['p(95)<2000'],
    'http_req_duration{name:filtered_search}': ['p(95)<2500'],
    'http_req_duration{name:listing_detail}': ['p(95)<1500'],
  },
};

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'apikey': config.supabaseAnonKey,
};

// Search filter options
const filterOptions = {
  boroughs: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
  priceRanges: ['under-200', '200-350', '350-500', '500-plus'],
  dayPatterns: [
    [1, 2, 3, 4, 5],     // Weekdays
    [5, 6, 0],           // Weekend
    [1, 2, 3],           // Mon-Wed
    [3, 4, 5],           // Wed-Fri
    [0, 1, 2, 3, 4, 5, 6], // Full week
  ],
  weekPatterns: ['every-week', 'one-on-off', 'two-on-off'],
};

/**
 * Setup function
 */
export function setup() {
  console.log(`Load test starting against: ${config.baseUrl}`);

  // Verify service is reachable
  const res = http.get(`${config.baseUrl}/search`);
  check(res, {
    'search page is reachable': (r) => r.status === 200,
  });

  return {
    startTime: new Date().toISOString(),
  };
}

/**
 * Get random element from array
 */
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build search URL with optional filters
 */
function buildSearchUrl(filters = {}) {
  const params = new URLSearchParams();

  if (filters.days) {
    params.set('days-selected', filters.days.join(','));
  }
  if (filters.borough) {
    params.set('borough', filters.borough);
  }
  if (filters.price) {
    params.set('price', filters.price);
  }
  if (filters.weekPattern) {
    params.set('week-pattern', filters.weekPattern);
  }
  if (filters.page) {
    params.set('page', filters.page.toString());
  }

  const queryString = params.toString();
  return `${config.baseUrl}/search${queryString ? `?${queryString}` : ''}`;
}

/**
 * Test basic search (no filters)
 */
function testBasicSearch() {
  const startTime = Date.now();
  const url = buildSearchUrl();

  const response = http.get(url, {
    tags: { name: 'search' },
  });

  const duration = Date.now() - startTime;
  searchDuration.add(duration);

  const success = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response has content': (r) => r.body.length > 0,
    'search response time OK': (r) => r.timings.duration < 2000,
  });

  searchSuccessRate.add(success);

  if (!success) {
    searchErrors.add(1);
    console.log(`Basic search failed: ${response.status}`);
  }

  return success;
}

/**
 * Test filtered search
 */
function testFilteredSearch() {
  const filters = {};

  // Randomly apply 1-3 filters
  const numFilters = Math.floor(Math.random() * 3) + 1;

  if (numFilters >= 1) {
    filters.days = randomElement(filterOptions.dayPatterns);
  }
  if (numFilters >= 2) {
    filters.borough = randomElement(filterOptions.boroughs);
  }
  if (numFilters >= 3) {
    filters.price = randomElement(filterOptions.priceRanges);
  }

  const startTime = Date.now();
  const url = buildSearchUrl(filters);

  const response = http.get(url, {
    tags: { name: 'filtered_search' },
  });

  const duration = Date.now() - startTime;
  filteredSearchDuration.add(duration);

  const success = check(response, {
    'filtered search status is 200': (r) => r.status === 200,
    'filtered search has content': (r) => r.body.length > 0,
    'filtered search response time OK': (r) => r.timings.duration < 2500,
  });

  searchSuccessRate.add(success);

  if (!success) {
    searchErrors.add(1);
    console.log(`Filtered search failed: ${response.status}, filters: ${JSON.stringify(filters)}`);
  }

  return success;
}

/**
 * Test search with pagination
 */
function testPaginatedSearch() {
  const pages = [1, 2, 3, 4, 5];
  let allSuccess = true;

  for (const page of pages) {
    const url = buildSearchUrl({ page });

    const response = http.get(url, {
      tags: { name: 'paginated_search' },
    });

    const success = check(response, {
      [`page ${page} status is 200`]: (r) => r.status === 200,
      [`page ${page} response time OK`]: (r) => r.timings.duration < 2000,
    });

    if (!success) {
      allSuccess = false;
      searchErrors.add(1);
    }

    sleep(0.5); // Short delay between pages
  }

  return allSuccess;
}

/**
 * Test listing detail page
 * Simulates clicking on a search result
 */
function testListingDetail(listingId) {
  // Use a sample listing ID or fetch from search results
  const id = listingId || 'sample-listing-id';
  const startTime = Date.now();

  const response = http.get(`${config.baseUrl}/view-split-lease/${id}`, {
    tags: { name: 'listing_detail' },
  });

  const duration = Date.now() - startTime;
  listingDetailDuration.add(duration);

  const success = check(response, {
    'listing detail status is 200 or 404': (r) => [200, 404].includes(r.status),
    'listing detail response time OK': (r) => r.timings.duration < 1500,
  });

  if (!success && response.status !== 404) {
    searchErrors.add(1);
    console.log(`Listing detail failed: ${response.status}`);
  }

  return success;
}

/**
 * Test search API directly (Edge Function)
 */
function testSearchApi() {
  const payload = JSON.stringify({
    action: 'list',
    payload: {
      filters: {
        borough: randomElement(filterOptions.boroughs),
        daysAvailable: randomElement(filterOptions.dayPatterns),
      },
      pagination: {
        page: 1,
        limit: 20,
      },
    },
  });

  const response = http.post(
    `${config.supabaseFunctionsUrl}/listing`,
    payload,
    {
      headers,
      tags: { name: 'search_api' },
    }
  );

  const success = check(response, {
    'search API status is 200': (r) => r.status === 200,
    'search API returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || body.listings !== undefined;
      } catch {
        return false;
      }
    },
    'search API response time OK': (r) => r.timings.duration < 2000,
  });

  if (success) {
    try {
      const body = JSON.parse(response.body);
      const count = body.data?.length || body.listings?.length || 0;
      searchResultCount.add(count);
    } catch {
      // Ignore parsing errors
    }
  }

  return success;
}

/**
 * Main test function
 */
export default function () {
  // Scenario: User browsing listings
  group('Listing Search Flow', function () {
    // Step 1: Initial search (no filters)
    group('Basic Search', function () {
      testBasicSearch();
      sleep(randomThinkTime());
    });

    // Step 2: Apply filters
    group('Filtered Search', function () {
      testFilteredSearch();
      sleep(randomThinkTime());
    });

    // Step 3: Click on a listing
    group('View Listing', function () {
      testListingDetail();
      sleep(randomThinkTime());
    });

    // Step 4: Go back and apply different filters
    group('Change Filters', function () {
      testFilteredSearch();
      sleep(randomThinkTime());
    });
  });

  // Random chance of testing pagination (20% of iterations)
  if (Math.random() < 0.2) {
    group('Pagination Test', function () {
      testPaginatedSearch();
      sleep(randomThinkTime());
    });
  }

  // Random chance of testing direct API (30% of iterations)
  if (Math.random() < 0.3) {
    group('Direct API Test', function () {
      testSearchApi();
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
  console.log(`\nListing Search Load Test completed.`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
}
