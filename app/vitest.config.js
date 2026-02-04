import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

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

    // JSON reporter for CI verification
    reporters: ['default', 'json'],
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
