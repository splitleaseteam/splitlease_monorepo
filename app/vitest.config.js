import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import SummaryReporter from './summary-reporter.js';
import HtmlReporter from './html-reporter.js';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    onConsoleLog() { return false; },

    // SYSTEM ENFORCEMENT: Fail on coverage threshold violations
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      // Start with achievable thresholds, increase over time
      thresholds: {
        statements: 30,
        branches: 25,
        functions: 30,
        lines: 30,
      },
    },

    // SYSTEM ENFORCEMENT: Empty test suites FAIL
    passWithNoTests: false,  // CRITICAL: Prevents fake passing tests

    // Summary-only console output + JSON for CI verification
    reporters: [new SummaryReporter(), new HtmlReporter(), 'json'],
    outputFile: {
      json: '.vitest-results.json',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
