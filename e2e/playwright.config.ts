/**
 * Playwright E2E Test Configuration
 *
 * Split Lease E2E Testing Framework
 * Covers all page components with comprehensive test scenarios
 */

import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:8000';

export default defineConfig({
  testDir: './tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Global test configuration
  use: {
    baseURL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',

    // Default timeout for actions
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Base URL for relative navigation
    bypassCSP: true
  },

  // Global timeout
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000
  },

  // Projects for different browsers and viewports
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    // Mobile Chrome (Android)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      }
    },

    // Mobile Safari (iOS)
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 }
      }
    },

    // Tablet
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 }
      }
    }
  ],

  // Local dev server configuration
  webServer: {
    command: 'cd ../app && bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Output directory for test artifacts
  outputDir: 'test-results'
});
