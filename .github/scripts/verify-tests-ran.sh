#!/bin/bash
# SYSTEM ENFORCEMENT: Verify tests actually executed and produced results
# This script FAILS if no test output exists or if tests were skipped
# Prevents: Regression Clusters #7, #8, #13, #14

set -e

TEST_OUTPUT_FILE="${1:-.vitest-results.json}"
MIN_TESTS_REQUIRED=5  # Minimum tests that must pass for CI to succeed

echo "🔍 Verifying test execution..."

# Check if test output exists
if [ ! -f "$TEST_OUTPUT_FILE" ]; then
    echo "❌ SYSTEM BLOCK: No test results file found at $TEST_OUTPUT_FILE"
    echo "   This means tests did not run. CI cannot pass without test results."
    echo ""
    echo "   Expected location: $TEST_OUTPUT_FILE"
    echo "   Make sure vitest is configured with: reporters: ['default', 'json']"
    exit 1
fi

# Parse test results
TESTS_RAN=$(jq '.numTotalTests // 0' "$TEST_OUTPUT_FILE")
TESTS_PASSED=$(jq '.numPassedTests // 0' "$TEST_OUTPUT_FILE")
TESTS_FAILED=$(jq '.numFailedTests // 0' "$TEST_OUTPUT_FILE")

echo "📊 Test Results:"
echo "   Total Tests: $TESTS_RAN"
echo "   Passed: $TESTS_PASSED"
echo "   Failed: $TESTS_FAILED"

# Enforce minimum test count
if [ "$TESTS_RAN" -lt "$MIN_TESTS_REQUIRED" ]; then
    echo ""
    echo "❌ SYSTEM BLOCK: Only $TESTS_RAN tests ran. Minimum required: $MIN_TESTS_REQUIRED"
    echo "   This prevents 'fake' test suites that pass by doing nothing."
    echo ""
    echo "   Current test count is too low to verify code quality."
    echo "   Add more tests or adjust MIN_TESTS_REQUIRED in this script."
    exit 1
fi

# Fail on any test failures
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo ""
    echo "❌ SYSTEM BLOCK: $TESTS_FAILED tests failed."
    echo "   Deployment cannot proceed with failing tests."
    exit 1
fi

echo ""
echo "✅ Test verification passed: $TESTS_PASSED tests executed successfully"
echo "   Deployment may proceed."
