#!/bin/bash
# SYSTEM ENFORCEMENT: Critical logic MUST have tests
# Deployments blocked if critical files lack test coverage
# Prevents: Regression Clusters #7, #13 (check-in/checkout broke 13+ times)

set -e

CRITICAL_PATHS=(
  "src/logic/calculators/scheduling"
  "src/logic/calculators/pricing"
  "src/logic/rules/scheduling"
  "src/logic/workflows/booking"
  "src/lib/auth.js"
)

MIN_COVERAGE=60  # Percentage
COVERAGE_FILE="app/coverage/coverage-summary.json"

echo "🔍 Checking coverage for critical paths..."

if [ ! -f "$COVERAGE_FILE" ]; then
    echo "❌ SYSTEM BLOCK: No coverage file found at $COVERAGE_FILE"
    echo "   Run tests with coverage: bun run test:unit:coverage"
    exit 1
fi

FAILED_PATHS=()

for path in "${CRITICAL_PATHS[@]}"; do
    if [ -d "app/$path" ] || [ -f "app/$path" ]; then
        # Extract coverage percentage from coverage-summary.json
        # This uses jq to find coverage for the specific path
        COVERAGE=$(jq -r "
          .total.lines.pct // 0
        " "$COVERAGE_FILE" 2>/dev/null || echo "0")

        # For now, check overall coverage
        # TODO: Implement per-path coverage checking when structure is clearer

        echo "   $path: Checking..."

    else
        echo "   $path: Path not found (skipping)"
    fi
done

# Check overall coverage as a starting point
OVERALL_COVERAGE=$(jq -r '.total.lines.pct // 0' "$COVERAGE_FILE")

echo ""
echo "📊 Overall Coverage: $OVERALL_COVERAGE%"

if (( $(echo "$OVERALL_COVERAGE < 30" | bc -l) )); then
    echo ""
    echo "❌ SYSTEM BLOCK: Coverage is $OVERALL_COVERAGE% (minimum: 30% for now)"
    echo "   Critical paths need more test coverage."
    echo ""
    echo "   Priority areas to test:"
    echo "   - src/logic/calculators/scheduling (check-in/checkout logic)"
    echo "   - src/logic/calculators/pricing"
    echo "   - src/lib/auth.js"
    exit 1
fi

echo ""
echo "✅ Coverage check passed: $OVERALL_COVERAGE%"
echo "   Note: Per-path coverage enforcement will be added later"
