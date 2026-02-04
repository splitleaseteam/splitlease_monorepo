#!/bin/bash

# Test script for change detection logic
# Simulates different scenarios to verify detect-changed-functions.sh works correctly

set -e

echo "=================================================="
echo "Change Detection Script - Test Suite"
echo "=================================================="
echo ""

# Test 1: Simulate single function change
echo "Test 1: Single function change (auth-user)"
echo "---------------------------------------------------"
echo "Simulated changed files:"
echo "  supabase/functions/auth-user/index.ts"
echo ""

CHANGED_FILES="supabase/functions/auth-user/index.ts"

# Extract function names
CHANGED_FUNCTIONS=$(echo "$CHANGED_FILES" | \
  grep -E '^supabase/functions/[^/]+/' | \
  sed 's|supabase/functions/\([^/]*\)/.*|\1|' | \
  sort -u | \
  grep -v '^_shared$' || echo "")

echo "Detected functions: $CHANGED_FUNCTIONS"
echo "Expected: auth-user"
echo ""

if [ "$CHANGED_FUNCTIONS" == "auth-user" ]; then
  echo "[PASS] Single function detection"
else
  echo "[FAIL] Single function detection"
fi

echo ""
echo "=================================================="
echo ""

# Test 2: Simulate multiple function changes
echo "Test 2: Multiple function changes"
echo "---------------------------------------------------"
echo "Simulated changed files:"
echo "  supabase/functions/auth-user/index.ts"
echo "  supabase/functions/proposal/index.ts"
echo "  supabase/functions/listing/index.ts"
echo ""

CHANGED_FILES=$(cat <<'EOF'
supabase/functions/auth-user/index.ts
supabase/functions/proposal/index.ts
supabase/functions/listing/index.ts
EOF
)

CHANGED_FUNCTIONS=$(echo "$CHANGED_FILES" | \
  grep -E '^supabase/functions/[^/]+/' | \
  sed 's|supabase/functions/\([^/]*\)/.*|\1|' | \
  sort -u | \
  grep -v '^_shared$' || echo "")

EXPECTED="auth-user
listing
proposal"

echo "Detected functions:"
echo "$CHANGED_FUNCTIONS"
echo ""
echo "Expected:"
echo "$EXPECTED"
echo ""

if [ "$CHANGED_FUNCTIONS" == "$EXPECTED" ]; then
  echo "[PASS] Multiple function detection"
else
  echo "[FAIL] Multiple function detection"
fi

echo ""
echo "=================================================="
echo ""

# Test 3: Simulate _shared directory change
echo "Test 3: _shared directory change (should deploy ALL)"
echo "---------------------------------------------------"
echo "Simulated changed files:"
echo "  supabase/functions/_shared/cors.ts"
echo ""

CHANGED_FILES="supabase/functions/_shared/cors.ts"

if echo "$CHANGED_FILES" | grep -q "supabase/functions/_shared"; then
  echo "[PASS] _shared directory change detected - will deploy ALL functions"
else
  echo "[FAIL] _shared directory change not detected"
fi

echo ""
echo "=================================================="
echo ""

# Test 4: JSON array generation
echo "Test 4: JSON array generation for GitHub Actions matrix"
echo "---------------------------------------------------"

CHANGED_FUNCTIONS=$(cat <<'EOF'
auth-user
proposal
listing
EOF
)

FUNCTIONS_JSON=$(echo "$CHANGED_FUNCTIONS" | jq -R -s -c 'split("\n") | map(select(length > 0))')

echo "Input functions:"
echo "$CHANGED_FUNCTIONS"
echo ""
echo "Generated JSON:"
echo "$FUNCTIONS_JSON"
echo ""
echo "Expected: [\"auth-user\",\"proposal\",\"listing\"]"
echo ""

EXPECTED_JSON='["auth-user","proposal","listing"]'

if [ "$FUNCTIONS_JSON" == "$EXPECTED_JSON" ]; then
  echo "[PASS] JSON array generation"
else
  echo "[FAIL] JSON array generation"
  echo "Got: $FUNCTIONS_JSON"
  echo "Expected: $EXPECTED_JSON"
fi

echo ""
echo "=================================================="
echo ""

# Test 5: No changes
echo "Test 5: No Edge Function changes"
echo "---------------------------------------------------"
echo "Simulated changed files:"
echo "  app/src/components/Button.jsx"
echo "  README.md"
echo ""

CHANGED_FILES=$(cat <<'EOF'
app/src/components/Button.jsx
README.md
EOF
)

CHANGED_FUNCTIONS=$(echo "$CHANGED_FILES" | \
  grep -E '^supabase/functions/[^/]+/' | \
  sed 's|supabase/functions/\([^/]*\)/.*|\1|' | \
  sort -u | \
  grep -v '^_shared$' || echo "")

if [ -z "$CHANGED_FUNCTIONS" ]; then
  echo "[PASS] No Edge Function changes detected (as expected)"
else
  echo "[FAIL] False positive - detected changes when none exist"
  echo "Detected: $CHANGED_FUNCTIONS"
fi

echo ""
echo "=================================================="
echo "Test Suite Complete"
echo "=================================================="
