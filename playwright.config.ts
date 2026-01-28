import { defineConfig, devices } from 'playwright/test';

/**
 * Playwright Configuration for Split Lease
 *
 * This configuration is designed for E2E testing, specifically for comparing
 * the Schedule Selector behavior between localhost and Bubble production.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60000,

  // Maximum time expect() assertions can wait
  expect: {
    timeout: 10000
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests (useful for flaky network tests)
  retries: process.env.CI ? 2 : 1,

  // Number of parallel workers
  workers: process.env.CI ? 1 : 2,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation (localhost by default)
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add Firefox and Safari if needed for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',

  // Local dev server configuration
  webServer: {
    command: 'cd app && bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
